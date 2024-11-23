use super::peer::{Peer, Message};
use crate::blockchain::{Block, Transaction};
use crate::blockchain::Blockchain;
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::RwLock;

pub struct Node {
    pub addr: SocketAddr,
    pub peers: Arc<RwLock<HashMap<SocketAddr, Peer>>>,
    pub blockchain: Arc<Blockchain>,
}

impl Node {
    pub fn new(addr: SocketAddr, blockchain: Arc<Blockchain>) -> Self {
        Node {
            addr,
            peers: Arc::new(RwLock::new(HashMap::new())),
            blockchain,
        }
    }

    pub async fn start(&self) -> Result<(), String> {
        let listener = TcpListener::bind(self.addr).await
            .map_err(|e| format!("Bind error: {}", e))?;

        println!("Node listening on {}", self.addr);

        loop {
            match listener.accept().await {
                Ok((stream, addr)) => {
                    let peer = Peer::new(addr, stream).await;
                    self.peers.write().await.insert(addr, peer);
                    println!("New peer connected: {}", addr);
                    
                    // Clone Arc references for the handler
                    let peers = self.peers.clone();
                    let blockchain = self.blockchain.clone();
                    
                    tokio::spawn(async move {
                        Self::handle_peer(addr, peers, blockchain).await;
                    });
                }
                Err(e) => {
                    println!("Failed to accept connection: {}", e);
                }
            }
        }
    }

    async fn handle_peer(
        addr: SocketAddr,
        peers: Arc<RwLock<HashMap<SocketAddr, Peer>>>,
        _blockchain: Arc<Blockchain>
    ) {
        loop {
            let message = {
                let mut peers_map = peers.write().await;
                if let Some(peer) = peers_map.get_mut(&addr) {
                    match peer.receive_message().await {
                        Ok(Some(msg)) => msg,
                        Ok(None) => break,
                        Err(e) => {
                            println!("Error receiving message from {}: {}", addr, e);
                            break;
                        }
                    }
                } else {
                    break;
                }
            };

            // Handle different message types
            match message.message_type.as_str() {
                "NEW_BLOCK" => {
                    if let Ok(_block) = serde_json::from_str::<Block>(&message.data) {
                        // Handle new block
                        println!("Received new block from {}", addr);
                    }
                }
                "NEW_TRANSACTION" => {
                    if let Ok(_transaction) = serde_json::from_str::<Transaction>(&message.data) {
                        // Handle new transaction
                        println!("Received new transaction from {}", addr);
                    }
                }
                _ => {
                    println!("Unknown message type from {}", addr);
                }
            }
        }

        // Remove peer when connection is closed
        peers.write().await.remove(&addr);
        println!("Peer disconnected: {}", addr);
    }

    pub async fn broadcast_message(&self, message: Message) {
        let mut peers = self.peers.write().await;
        let mut disconnected_peers = Vec::new();

        for (addr, peer) in peers.iter_mut() {
            if let Err(e) = peer.send_message(message.clone()).await {
                println!("Failed to send message to {}: {}", addr, e);
                disconnected_peers.push(*addr);
            }
        }

        // Remove disconnected peers
        for addr in disconnected_peers {
            peers.remove(&addr);
        }
    }
}

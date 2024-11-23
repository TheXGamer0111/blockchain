use super::{Block, Transaction};
use std::collections::{HashMap, HashSet};
use tokio::sync::RwLock;
use std::sync::Arc;
use chrono::Utc;

#[derive(Debug, Clone)]
pub struct BlockHeader {
    pub hash: String,
    pub previous_hash: String,
    pub height: u64,
    pub timestamp: i64,
}

#[derive(Debug)]
pub struct SyncManager {
    blockchain: Arc<super::Blockchain>,
    pending_blocks: Arc<RwLock<HashMap<String, Block>>>,
    syncing_peers: Arc<RwLock<HashSet<String>>>,
    block_headers: Arc<RwLock<Vec<BlockHeader>>>,
    max_blocks_per_request: usize,
}

impl SyncManager {
    pub fn new(blockchain: Arc<super::Blockchain>) -> Self {
        SyncManager {
            blockchain,
            pending_blocks: Arc::new(RwLock::new(HashMap::new())),
            syncing_peers: Arc::new(RwLock::new(HashSet::new())),
            block_headers: Arc::new(RwLock::new(Vec::new())),
            max_blocks_per_request: 500,
        }
    }

    pub async fn start_sync(&self, peer_id: String) -> Result<(), String> {
        let mut syncing_peers = self.syncing_peers.write().await;
        if syncing_peers.contains(&peer_id) {
            return Ok(());
        }

        syncing_peers.insert(peer_id.clone());
        self.request_headers(peer_id).await
    }

    async fn request_headers(&self, peer_id: String) -> Result<(), String> {
        let current_height = self.blockchain.get_height().await;
        
        // Request headers in batches
        let headers = self.blockchain.get_headers(
            current_height,
            self.max_blocks_per_request,
        ).await?;

        let mut block_headers = self.block_headers.write().await;
        for header in headers {
            if !block_headers.iter().any(|h| h.hash == header.hash) {
                block_headers.push(header);
            }
        }

        self.process_headers(peer_id).await
    }

    async fn process_headers(&self, peer_id: String) -> Result<(), String> {
        let headers = self.block_headers.read().await;
        let current_height = self.blockchain.get_height().await;

        for header in headers.iter() {
            if header.height > current_height {
                self.request_block(peer_id.clone(), header.hash.clone()).await?;
            }
        }

        Ok(())
    }

    async fn request_block(&self, peer_id: String, block_hash: String) -> Result<(), String> {
        // In a real implementation, this would make a network request to the peer
        // For now, we'll simulate it
        let block = self.blockchain.get_block(&block_hash).await?;
        
        let mut pending_blocks = self.pending_blocks.write().await;
        pending_blocks.insert(block_hash, block);

        self.process_pending_blocks().await
    }

    async fn process_pending_blocks(&self) -> Result<(), String> {
        let mut processed_blocks = Vec::new();
        let mut pending_blocks = self.pending_blocks.write().await;

        // Process blocks in order
        let current_height = self.blockchain.get_height().await;
        for height in current_height + 1.. {
            let next_block = pending_blocks.values()
                .find(|block| block.height == height);

            match next_block {
                Some(block) => {
                    self.validate_and_add_block(block).await?;
                    processed_blocks.push(block.hash.clone());
                }
                None => break,
            }
        }

        // Remove processed blocks
        for hash in processed_blocks {
            pending_blocks.remove(&hash);
        }

        Ok(())
    }

    async fn validate_and_add_block(&self, block: &Block) -> Result<(), String> {
        // Validate block
        self.blockchain.validate_block(block).await?;

        // Add block to chain
        self.blockchain.add_block(block.clone()).await?;

        // Broadcast block to peers
        self.broadcast_block(block).await?;

        Ok(())
    }

    async fn broadcast_block(&self, block: &Block) -> Result<(), String> {
        // In a real implementation, this would broadcast to all peers
        // For now, we'll just simulate it
        println!("Broadcasting block: {}", block.hash);
        Ok(())
    }

    pub async fn handle_new_block(&self, block: Block) -> Result<(), String> {
        let mut pending_blocks = self.pending_blocks.write().await;
        pending_blocks.insert(block.hash.clone(), block);
        self.process_pending_blocks().await
    }

    pub async fn get_sync_status(&self) -> SyncStatus {
        let pending_count = self.pending_blocks.read().await.len();
        let syncing_count = self.syncing_peers.read().await.len();
        let current_height = self.blockchain.get_height().await;

        SyncStatus {
            is_syncing: syncing_count > 0,
            current_height,
            pending_blocks: pending_count,
            syncing_peers: syncing_count,
        }
    }
}

#[derive(Debug, Clone)]
pub struct SyncStatus {
    pub is_syncing: bool,
    pub current_height: u64,
    pub pending_blocks: usize,
    pub syncing_peers: usize,
} 
mod api;
mod blockchain;
mod networking;
mod wallet;
mod websocket;

use std::net::SocketAddr;
use std::sync::Arc;
use tokio;
use tracing_subscriber;

use blockchain::Blockchain;
use networking::Node;
use api::ApiServer;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Create blockchain instance
    let blockchain = Arc::new(Blockchain::new(4, 100.0)); // difficulty: 4, mining_reward: 100.0

    // Setup P2P node
    let p2p_addr: SocketAddr = "127.0.0.1:6000".parse().unwrap();
    let node = Node::new(p2p_addr, blockchain.clone());

    // Setup API server
    let api_addr: SocketAddr = "127.0.0.1:8001".parse().unwrap();
    let api_server = ApiServer::new(blockchain.clone());
    let app = api_server.create_router();

    println!("P2P Node listening on {}", p2p_addr);
    println!("API Server listening on {}", api_addr);

    // Run both P2P node and API server concurrently
    tokio::select! {
        _ = node.start() => {
            println!("P2P node stopped");
        }
        _ = axum::Server::bind(&api_addr).serve(app.into_make_service()) => {
            println!("API server stopped");
        }
    }
}

pub mod routes;

use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use crate::blockchain::Blockchain;
use routes::*;

pub struct ApiServer {
    blockchain: Arc<Blockchain>,
}

impl ApiServer {
    pub fn new(blockchain: Arc<Blockchain>) -> Self {
        ApiServer { blockchain }
    }

    pub fn create_router(&self) -> Router {
        let blockchain = self.blockchain.clone();

        Router::new()
            .route("/chain", get(get_chain))
            .route("/mine", get(mine_block))
            .route("/transactions/new", post(create_transaction))
            .route("/balance/:address", get(get_balance))
            .route("/mempool", get(get_mempool))
            .with_state(blockchain)
    }
} 
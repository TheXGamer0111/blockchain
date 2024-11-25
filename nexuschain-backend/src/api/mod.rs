pub mod routes;

use axum::{
    routing::{get, post},
    Router,
};
use axum::extract::DefaultBodyLimit;
use std::sync::Arc;
use crate::blockchain::Blockchain;
use routes::*;

use tower_http::cors::CorsLayer;
use axum::http::HeaderValue;
use axum::http::Method;
use crate::api::routes::get_block_by_hash;
use tower_http::trace::TraceLayer;
use axum_limit::LimitState;
use crate::websocket::ws_handler;

#[derive(Default, Hash, Eq, PartialEq, Clone)]
struct RateKey(i32, i32);

impl axum_limit::Key for RateKey {
    type Extractor = String;
    
    fn from_extractor(_: &Self::Extractor) -> Self {
        RateKey(0, 0)
    }
}

#[derive(Clone)]
pub struct AppState {
    blockchain: Arc<Blockchain>,
    limit_state: LimitState<RateKey>,
}

pub struct ApiServer {
    blockchain: Arc<Blockchain>,
}

impl ApiServer {
    pub fn new(blockchain: Arc<Blockchain>) -> Self {
        ApiServer { blockchain }
    }

    pub fn create_router(&self) -> Router {
        let state = AppState {
            blockchain: self.blockchain.clone(),
            limit_state: LimitState::<RateKey>::default(),
        };

        Router::new()
            .route("/chain", get(get_chain))
            .route("/mine", get(mine_block))
            .route("/transactions/new", post(create_transaction))
            .route("/balance/:address", get(get_balance))
            .route("/mempool", get(get_mempool))
            .route("/network-stats", get(get_network_stats))
            .route("/proposals", post(routes::create_proposal))
            .route("/proposals/vote", post(routes::vote_on_proposal))
            .route("/proposals/:proposal_id", get(routes::get_proposal))
            .route("/proposals/:proposal_id/finalize", post(routes::finalize_proposal))
            .route("/stakes", post(routes::create_stake))
            .route("/stakes/:address", get(routes::get_stakes))
            .route("/stakes/:address/:stake_index", post(routes::unstake))
            .route("/peers", get(routes::get_peers))
            .route("/peers/connect", post(routes::connect_peer))
            .route("/transactions/:hash", get(get_transaction))
            .route("/node/status", get(routes::node_status))
            .route("/block/:hash", get(get_block_by_hash))
            .route("/ws", get(ws_handler))
            .layer(DefaultBodyLimit::max(1024 * 1024 * 50)) // 50MB limit
            .layer(TraceLayer::new_for_http())
            .layer(
                CorsLayer::new()
                    .allow_origin(HeaderValue::from_static("http://localhost:3000"))
                    .allow_methods([Method::GET, Method::POST])
                    .allow_headers([
                        axum::http::header::CONTENT_TYPE,
                        axum::http::header::UPGRADE,
                        axum::http::header::CONNECTION,
                        axum::http::header::SEC_WEBSOCKET_KEY,
                        axum::http::header::SEC_WEBSOCKET_VERSION,
                    ])
            )
            .with_state(state)
    }
} 
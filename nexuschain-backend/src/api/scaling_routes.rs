use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::blockchain::{
    cross_shard::{CrossShardTransaction, CrossShardStatus},
    dispute::{DisputeClaim, DisputeStatus},
    state_channel::{StateChannel, ChannelUpdate},
};

// Cross-shard transaction endpoints
pub async fn create_cross_shard_transaction(
    State(blockchain): State<Arc<Blockchain>>,
    Json(transaction): Json<Transaction>,
) -> Json<CrossShardResponse> {
    let tx_id = blockchain.cross_shard_manager
        .initiate_cross_shard_transaction(transaction)
        .await
        .expect("Failed to create cross-shard transaction");
    
    Json(CrossShardResponse { transaction_id: tx_id })
}

pub async fn get_cross_shard_status(
    State(blockchain): State<Arc<Blockchain>>,
    Path(tx_id): Path<String>,
) -> Json<Option<CrossShardStatus>> {
    let status = blockchain.cross_shard_manager
        .get_transaction_status(&tx_id)
        .await;
    Json(status)
}

// State channel endpoints
pub async fn open_channel(
    State(blockchain): State<Arc<Blockchain>>,
    Json(request): Json<OpenChannelRequest>,
) -> Json<StateChannel> {
    let channel = blockchain.state_channel_manager
        .open_channel(
            request.participants,
            request.initial_balances,
            request.timeout,
        )
        .await
        .expect("Failed to open channel");
    Json(channel)
}

pub async fn update_channel(
    State(blockchain): State<Arc<Blockchain>>,
    Json(update): Json<ChannelUpdate>,
) -> Json<serde_json::Value> {
    blockchain.state_channel_manager
        .update_channel(update)
        .await
        .expect("Failed to update channel");
    Json(serde_json::json!({ "success": true }))
}

// Dispute resolution endpoints
pub async fn file_dispute(
    State(blockchain): State<Arc<Blockchain>>,
    Json(request): Json<FileDisputeRequest>,
) -> Json<DisputeResponse> {
    let dispute_id = blockchain.dispute_manager
        .file_dispute(
            request.channel_id,
            request.claimer,
            request.proposed_update,
            request.evidence,
        )
        .await
        .expect("Failed to file dispute");
    Json(DisputeResponse { dispute_id })
}

pub async fn challenge_dispute(
    State(blockchain): State<Arc<Blockchain>>,
    Path(dispute_id): Path<String>,
    Json(request): Json<ChallengeDisputeRequest>,
) -> Json<serde_json::Value> {
    blockchain.dispute_manager
        .challenge_dispute(
            &dispute_id,
            &request.challenger,
            request.counter_evidence,
        )
        .await
        .expect("Failed to challenge dispute");
    Json(serde_json::json!({ "success": true }))
}

// Request/Response structures
#[derive(Debug, Serialize)]
pub struct CrossShardResponse {
    pub transaction_id: String,
}

#[derive(Debug, Deserialize)]
pub struct OpenChannelRequest {
    pub participants: Vec<String>,
    pub initial_balances: HashMap<String, u64>,
    pub timeout: u64,
}

#[derive(Debug, Deserialize)]
pub struct FileDisputeRequest {
    pub channel_id: String,
    pub claimer: String,
    pub proposed_update: ChannelUpdate,
    pub evidence: Vec<ChannelUpdate>,
}

#[derive(Debug, Serialize)]
pub struct DisputeResponse {
    pub dispute_id: String,
}

#[derive(Debug, Deserialize)]
pub struct ChallengeDisputeRequest {
    pub challenger: String,
    pub counter_evidence: Vec<ChannelUpdate>,
}

// Update the router in api/mod.rs
impl ApiServer {
    pub fn create_router(&self) -> Router {
        let blockchain = self.blockchain.clone();

        Router::new()
            // Existing routes...
            // Cross-shard routes
            .route("/cross-shard/transaction", post(create_cross_shard_transaction))
            .route("/cross-shard/status/:tx_id", get(get_cross_shard_status))
            // State channel routes
            .route("/channels", post(open_channel))
            .route("/channels/update", post(update_channel))
            // Dispute routes
            .route("/disputes", post(file_dispute))
            .route("/disputes/:id/challenge", post(challenge_dispute))
            .with_state(blockchain)
    }
} 
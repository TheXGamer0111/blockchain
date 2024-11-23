use axum::{
    extract::{Path, State},
    Json,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::blockchain::{
    bft_consensus::{BftConsensus, BftMessage, BftMessageType},
    bft_sync::BftSynchronizer,
};
use crate::metrics::bft_metrics::BftMetricsCollector;

// Request/Response structures
#[derive(Debug, Deserialize)]
pub struct ViewChangeRequest {
    pub reason: String,
}

#[derive(Debug, Deserialize)]
pub struct ValidatorRequest {
    pub address: String,
    pub stake: u64,
}

#[derive(Debug, Serialize)]
pub struct ConsensusStatusResponse {
    pub current_view: u64,
    pub current_phase: String,
    pub active_validators: Vec<String>,
    pub pending_messages: usize,
}

// BFT Status endpoint
pub async fn get_bft_status(
    State(blockchain): State<Arc<Blockchain>>,
) -> impl IntoResponse {
    let metrics = blockchain.bft_metrics.get_metrics().await;
    let health = blockchain.bft_metrics.get_health_status().await;
    
    Json(json!({
        "status": {
            "is_healthy": health.is_healthy,
            "success_rate": health.success_rate,
            "active_validators": health.active_validators,
            "suspected_byzantine": health.suspected_byzantine,
        },
        "metrics": {
            "consensus_rounds": metrics.consensus_rounds,
            "successful_rounds": metrics.successful_rounds,
            "failed_rounds": metrics.failed_rounds,
            "view_changes": metrics.view_changes,
            "average_consensus_time": metrics.average_consensus_time,
        },
        "timestamp": chrono::Utc::now()
    }))
}

// View management endpoints
pub async fn initiate_view_change(
    State(blockchain): State<Arc<Blockchain>>,
    Json(request): Json<ViewChangeRequest>,
) -> impl IntoResponse {
    blockchain.bft_consensus.initiate_view_change().await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    blockchain.bft_metrics.record_view_change(
        blockchain.bft_consensus.get_current_view().await.unwrap_or(0),
        request.reason,
        0, // Duration will be updated when view change completes
        Vec::new(), // Participants will be added as they join
    ).await;

    Json(json!({
        "message": "View change initiated",
        "timestamp": chrono::Utc::now()
    }))
}

// Validator management endpoints
pub async fn register_validator(
    State(blockchain): State<Arc<Blockchain>>,
    Json(request): Json<ValidatorRequest>,
) -> impl IntoResponse {
    blockchain.bft_consensus.register_validator(request.address.clone(), request.stake).await
        .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;

    Json(json!({
        "message": "Validator registered successfully",
        "address": request.address,
        "timestamp": chrono::Utc::now()
    }))
}

pub async fn get_validator_metrics(
    State(blockchain): State<Arc<Blockchain>>,
    Path(address): Path<String>,
) -> impl IntoResponse {
    let metrics = blockchain.bft_metrics.get_validator_metrics(&address).await
        .ok_or((StatusCode::NOT_FOUND, "Validator not found".to_string()))?;

    Json(json!({
        "address": address,
        "metrics": metrics,
        "timestamp": chrono::Utc::now()
    }))
}

// Consensus monitoring endpoints
pub async fn get_consensus_round_info(
    State(blockchain): State<Arc<Blockchain>>,
    Path(round): Path<u64>,
) -> impl IntoResponse {
    let messages = blockchain.bft_consensus.get_round_messages(round).await;
    let status = blockchain.bft_consensus.get_round_status(round).await;

    Json(json!({
        "round": round,
        "status": status,
        "messages": messages,
        "timestamp": chrono::Utc::now()
    }))
}

pub async fn get_message_stats(
    State(blockchain): State<Arc<Blockchain>>,
) -> impl IntoResponse {
    let metrics = blockchain.bft_metrics.get_metrics().await;
    
    Json(json!({
        "message_stats": metrics.message_stats,
        "timestamp": chrono::Utc::now()
    }))
}

// Synchronization endpoints
pub async fn get_sync_status(
    State(blockchain): State<Arc<Blockchain>>,
) -> impl IntoResponse {
    let sync_status = blockchain.bft_sync.get_sync_status().await;
    
    Json(json!({
        "is_syncing": sync_status.is_syncing,
        "current_height": sync_status.current_height,
        "target_height": sync_status.target_height,
        "peers_syncing": sync_status.peers_syncing,
        "timestamp": chrono::Utc::now()
    }))
}

// Fault tolerance endpoints
pub async fn get_fault_tolerance_metrics(
    State(blockchain): State<Arc<Blockchain>>,
) -> impl IntoResponse {
    let metrics = blockchain.bft_metrics.get_metrics().await;
    
    Json(json!({
        "fault_tolerance": metrics.fault_tolerance,
        "timestamp": chrono::Utc::now()
    }))
}

// Update the router in api/mod.rs
impl ApiServer {
    pub fn create_router(&self) -> Router {
        let blockchain = self.blockchain.clone();

        Router::new()
            // Existing routes...
            // BFT routes
            .route("/bft/status", get(get_bft_status))
            .route("/bft/view-change", post(initiate_view_change))
            .route("/bft/validators", post(register_validator))
            .route("/bft/validators/:address", get(get_validator_metrics))
            .route("/bft/rounds/:round", get(get_consensus_round_info))
            .route("/bft/messages", get(get_message_stats))
            .route("/bft/sync", get(get_sync_status))
            .route("/bft/fault-tolerance", get(get_fault_tolerance_metrics))
            .with_state(blockchain)
    }
} 
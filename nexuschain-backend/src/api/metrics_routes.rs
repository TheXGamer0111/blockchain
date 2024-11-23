use axum::{
    extract::State,
    Json,
    response::IntoResponse,
};
use std::sync::Arc;
use serde_json::json;
use crate::metrics::consensus_metrics::{ConsensusMetrics, ValidatorMetrics, ConsensusHealth};
use crate::blockchain::Blockchain;

// Get overall consensus metrics
pub async fn get_consensus_metrics(
    State(blockchain): State<Arc<Blockchain>>,
) -> impl IntoResponse {
    let metrics = blockchain.metrics_collector.get_metrics().await;
    
    Json(json!({
        "metrics": metrics,
        "timestamp": chrono::Utc::now(),
        "node_version": env!("CARGO_PKG_VERSION"),
    }))
}

// Get detailed validator metrics
pub async fn get_validator_metrics(
    State(blockchain): State<Arc<Blockchain>>,
) -> impl IntoResponse {
    let metrics = blockchain.metrics_collector.get_metrics().await;
    
    let validator_stats = metrics.validator_participation.iter()
        .map(|(addr, stats)| {
            json!({
                "address": addr,
                "participation_rate": stats.total_votes as f64 / metrics.total_rounds as f64,
                "average_response_time": stats.average_response_time,
                "reliability_score": stats.reliability_score,
                "successful_proposals": stats.successful_proposals,
                "missed_rounds": stats.missed_rounds,
            })
        })
        .collect::<Vec<_>>();

    Json(json!({
        "validators": validator_stats,
        "total_validators": validator_stats.len(),
        "timestamp": chrono::Utc::now(),
    }))
}

// Get consensus health metrics
pub async fn get_consensus_health(
    State(blockchain): State<Arc<Blockchain>>,
) -> impl IntoResponse {
    let health = blockchain.metrics_collector.get_consensus_health().await;
    
    Json(json!({
        "health_status": health,
        "timestamp": chrono::Utc::now(),
    }))
}

// Get consensus latency metrics
pub async fn get_consensus_latency(
    State(blockchain): State<Arc<Blockchain>>,
) -> impl IntoResponse {
    let metrics = blockchain.metrics_collector.get_metrics().await;
    
    let latency_data = metrics.consensus_latency.iter()
        .map(|metric| {
            json!({
                "timestamp": metric.timestamp,
                "duration_ms": metric.duration_ms,
            })
        })
        .collect::<Vec<_>>();

    Json(json!({
        "latency_history": latency_data,
        "average_latency": metrics.consensus_latency.iter()
            .map(|m| m.duration_ms)
            .sum::<u64>() as f64 / metrics.consensus_latency.len() as f64,
        "timestamp": chrono::Utc::now(),
    }))
}

// Get round statistics
pub async fn get_round_statistics(
    State(blockchain): State<Arc<Blockchain>>,
) -> impl IntoResponse {
    let metrics = blockchain.metrics_collector.get_metrics().await;
    
    Json(json!({
        "total_rounds": metrics.total_rounds,
        "successful_rounds": metrics.successful_rounds,
        "failed_rounds": metrics.failed_rounds,
        "success_rate": metrics.round_success_rate,
        "average_round_time": metrics.average_round_time,
        "timestamp": chrono::Utc::now(),
    }))
}

// Update the router in api/mod.rs
impl ApiServer {
    pub fn create_router(&self) -> Router {
        let blockchain = self.blockchain.clone();

        Router::new()
            // Existing routes...
            // Metrics routes
            .route("/metrics/consensus", get(get_consensus_metrics))
            .route("/metrics/validators", get(get_validator_metrics))
            .route("/metrics/health", get(get_consensus_health))
            .route("/metrics/latency", get(get_consensus_latency))
            .route("/metrics/rounds", get(get_round_statistics))
            .with_state(blockchain)
    }
} 
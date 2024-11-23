use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusMetrics {
    pub total_rounds: u64,
    pub successful_rounds: u64,
    pub failed_rounds: u64,
    pub average_round_time: f64,
    pub validator_participation: HashMap<String, ValidatorMetrics>,
    pub consensus_latency: Vec<LatencyMetric>,
    pub vote_distribution: HashMap<String, u64>,
    pub round_success_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorMetrics {
    pub total_votes: u64,
    pub successful_proposals: u64,
    pub missed_rounds: u64,
    pub average_response_time: f64,
    pub reliability_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatencyMetric {
    pub timestamp: DateTime<Utc>,
    pub duration_ms: u64,
}

pub struct ConsensusMetricsCollector {
    metrics: Arc<RwLock<ConsensusMetrics>>,
    round_times: Arc<RwLock<HashMap<u64, DateTime<Utc>>>>,
}

impl ConsensusMetricsCollector {
    pub fn new() -> Self {
        ConsensusMetricsCollector {
            metrics: Arc::new(RwLock::new(ConsensusMetrics {
                total_rounds: 0,
                successful_rounds: 0,
                failed_rounds: 0,
                average_round_time: 0.0,
                validator_participation: HashMap::new(),
                consensus_latency: Vec::new(),
                vote_distribution: HashMap::new(),
                round_success_rate: 0.0,
            })),
            round_times: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn record_round_start(&self, round_number: u64) {
        let mut round_times = self.round_times.write().await;
        round_times.insert(round_number, Utc::now());

        let mut metrics = self.metrics.write().await;
        metrics.total_rounds += 1;
    }

    pub async fn record_round_end(
        &self,
        round_number: u64,
        success: bool,
        validator_votes: HashMap<String, DateTime<Utc>>,
    ) {
        let mut metrics = self.metrics.write().await;
        let round_times = self.round_times.read().await;

        if let Some(start_time) = round_times.get(&round_number) {
            let duration = Utc::now() - *start_time;
            let duration_ms = duration.num_milliseconds() as u64;

            // Update round statistics
            if success {
                metrics.successful_rounds += 1;
            } else {
                metrics.failed_rounds += 1;
            }

            // Update average round time
            metrics.average_round_time = (metrics.average_round_time * (metrics.total_rounds - 1) as f64
                + duration_ms as f64) / metrics.total_rounds as f64;

            // Record latency
            metrics.consensus_latency.push(LatencyMetric {
                timestamp: Utc::now(),
                duration_ms,
            });

            // Update validator metrics
            for (validator, vote_time) in validator_votes {
                let vote_latency = (vote_time - *start_time).num_milliseconds() as f64;
                let validator_metrics = metrics.validator_participation
                    .entry(validator.clone())
                    .or_insert(ValidatorMetrics {
                        total_votes: 0,
                        successful_proposals: 0,
                        missed_rounds: 0,
                        average_response_time: 0.0,
                        reliability_score: 1.0,
                    });

                validator_metrics.total_votes += 1;
                validator_metrics.average_response_time = (
                    validator_metrics.average_response_time * (validator_metrics.total_votes - 1) as f64
                    + vote_latency
                ) / validator_metrics.total_votes as f64;

                *metrics.vote_distribution.entry(validator).or_insert(0) += 1;
            }

            // Update success rate
            metrics.round_success_rate = metrics.successful_rounds as f64 / metrics.total_rounds as f64;
        }
    }

    pub async fn record_validator_proposal(
        &self,
        validator: String,
        success: bool,
    ) {
        let mut metrics = self.metrics.write().await;
        let validator_metrics = metrics.validator_participation
            .entry(validator)
            .or_insert(ValidatorMetrics {
                total_votes: 0,
                successful_proposals: 0,
                missed_rounds: 0,
                average_response_time: 0.0,
                reliability_score: 1.0,
            });

        if success {
            validator_metrics.successful_proposals += 1;
        }
    }

    pub async fn record_missed_round(&self, validator: String) {
        let mut metrics = self.metrics.write().await;
        let validator_metrics = metrics.validator_participation
            .entry(validator)
            .or_insert(ValidatorMetrics {
                total_votes: 0,
                successful_proposals: 0,
                missed_rounds: 0,
                average_response_time: 0.0,
                reliability_score: 1.0,
            });

        validator_metrics.missed_rounds += 1;
        validator_metrics.reliability_score *= 0.95; // Decrease reliability score
    }

    pub async fn get_metrics(&self) -> ConsensusMetrics {
        self.metrics.read().await.clone()
    }

    pub async fn get_validator_performance(&self, validator: &str) -> Option<ValidatorMetrics> {
        let metrics = self.metrics.read().await;
        metrics.validator_participation.get(validator).cloned()
    }

    pub async fn get_consensus_health(&self) -> ConsensusHealth {
        let metrics = self.metrics.read().await;
        let recent_latency: Vec<_> = metrics.consensus_latency.iter()
            .rev()
            .take(10)
            .collect();

        let average_recent_latency = if !recent_latency.is_empty() {
            recent_latency.iter().map(|l| l.duration_ms).sum::<u64>() as f64
                / recent_latency.len() as f64
        } else {
            0.0
        };

        ConsensusHealth {
            is_healthy: metrics.round_success_rate >= 0.95,
            success_rate: metrics.round_success_rate,
            average_latency: average_recent_latency,
            active_validators: metrics.validator_participation.len(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ConsensusHealth {
    pub is_healthy: bool,
    pub success_rate: f64,
    pub average_latency: f64,
    pub active_validators: usize,
} 
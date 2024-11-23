use std::collections::{HashMap, VecDeque};
use tokio::sync::RwLock;
use std::sync::Arc;
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BftMetrics {
    pub consensus_rounds: u64,
    pub successful_rounds: u64,
    pub failed_rounds: u64,
    pub view_changes: u64,
    pub average_consensus_time: f64,
    pub validator_performance: HashMap<String, ValidatorMetrics>,
    pub view_change_history: Vec<ViewChangeMetric>,
    pub message_stats: MessageStats,
    pub fault_tolerance: FaultToleranceMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorMetrics {
    pub total_proposals: u64,
    pub successful_proposals: u64,
    pub prepare_messages: u64,
    pub commit_messages: u64,
    pub view_change_messages: u64,
    pub average_response_time: f64,
    pub last_active: DateTime<Utc>,
    pub reliability_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewChangeMetric {
    pub view_number: u64,
    pub timestamp: DateTime<Utc>,
    pub trigger_reason: String,
    pub completion_time_ms: u64,
    pub participating_validators: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageStats {
    pub preprepare_count: u64,
    pub prepare_count: u64,
    pub commit_count: u64,
    pub view_change_count: u64,
    pub average_message_size: u64,
    pub message_latency: HashMap<String, f64>, // validator -> avg latency
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaultToleranceMetrics {
    pub total_validators: usize,
    pub active_validators: usize,
    pub suspected_byzantine: Vec<String>,
    pub max_tolerated_faults: usize,
    pub current_fault_tolerance: f64,
}

pub struct BftMetricsCollector {
    metrics: Arc<RwLock<BftMetrics>>,
    consensus_times: Arc<RwLock<VecDeque<u64>>>,
    window_size: usize,
}

impl BftMetricsCollector {
    pub fn new(window_size: usize) -> Self {
        BftMetricsCollector {
            metrics: Arc::new(RwLock::new(BftMetrics {
                consensus_rounds: 0,
                successful_rounds: 0,
                failed_rounds: 0,
                view_changes: 0,
                average_consensus_time: 0.0,
                validator_performance: HashMap::new(),
                view_change_history: Vec::new(),
                message_stats: MessageStats {
                    preprepare_count: 0,
                    prepare_count: 0,
                    commit_count: 0,
                    view_change_count: 0,
                    average_message_size: 0,
                    message_latency: HashMap::new(),
                },
                fault_tolerance: FaultToleranceMetrics {
                    total_validators: 0,
                    active_validators: 0,
                    suspected_byzantine: Vec::new(),
                    max_tolerated_faults: 0,
                    current_fault_tolerance: 0.0,
                },
            })),
            consensus_times: Arc::new(RwLock::new(VecDeque::with_capacity(window_size))),
            window_size,
        }
    }

    pub async fn record_consensus_round(
        &self,
        success: bool,
        duration_ms: u64,
        validators: &[String],
    ) {
        let mut metrics = self.metrics.write().await;
        metrics.consensus_rounds += 1;
        
        if success {
            metrics.successful_rounds += 1;
        } else {
            metrics.failed_rounds += 1;
        }

        // Update consensus time moving average
        let mut times = self.consensus_times.write().await;
        if times.len() >= self.window_size {
            times.pop_front();
        }
        times.push_back(duration_ms);
        
        metrics.average_consensus_time = times.iter().sum::<u64>() as f64 / times.len() as f64;

        // Update validator metrics
        for validator in validators {
            let validator_metrics = metrics.validator_performance
                .entry(validator.clone())
                .or_insert(ValidatorMetrics {
                    total_proposals: 0,
                    successful_proposals: 0,
                    prepare_messages: 0,
                    commit_messages: 0,
                    view_change_messages: 0,
                    average_response_time: 0.0,
                    last_active: Utc::now(),
                    reliability_score: 1.0,
                });
            validator_metrics.last_active = Utc::now();
        }
    }

    pub async fn record_view_change(
        &self,
        view_number: u64,
        reason: String,
        duration_ms: u64,
        participants: Vec<String>,
    ) {
        let mut metrics = self.metrics.write().await;
        metrics.view_changes += 1;
        
        metrics.view_change_history.push(ViewChangeMetric {
            view_number,
            timestamp: Utc::now(),
            trigger_reason: reason,
            completion_time_ms: duration_ms,
            participating_validators: participants,
        });

        // Keep only recent history
        if metrics.view_change_history.len() > self.window_size {
            metrics.view_change_history.remove(0);
        }
    }

    pub async fn record_message(
        &self,
        msg_type: &str,
        sender: &str,
        size: u64,
        latency_ms: u64,
    ) {
        let mut metrics = self.metrics.write().await;
        
        match msg_type {
            "preprepare" => metrics.message_stats.preprepare_count += 1,
            "prepare" => metrics.message_stats.prepare_count += 1,
            "commit" => metrics.message_stats.commit_count += 1,
            "view_change" => metrics.message_stats.view_change_count += 1,
            _ => {}
        }

        // Update average message size
        let total_messages = metrics.message_stats.preprepare_count
            + metrics.message_stats.prepare_count
            + metrics.message_stats.commit_count
            + metrics.message_stats.view_change_count;
        
        metrics.message_stats.average_message_size = 
            (metrics.message_stats.average_message_size * (total_messages - 1) + size) / total_messages;

        // Update latency metrics
        let avg_latency = metrics.message_stats.message_latency
            .entry(sender.to_string())
            .or_insert(0.0);
        *avg_latency = (*avg_latency * 0.9) + (latency_ms as f64 * 0.1); // Exponential moving average
    }

    pub async fn update_fault_tolerance(
        &self,
        total: usize,
        active: usize,
        suspected: Vec<String>,
    ) {
        let mut metrics = self.metrics.write().await;
        let max_faults = (total - 1) / 3;
        
        metrics.fault_tolerance = FaultToleranceMetrics {
            total_validators: total,
            active_validators: active,
            suspected_byzantine: suspected,
            max_tolerated_faults: max_faults,
            current_fault_tolerance: (active - suspected.len()) as f64 / total as f64,
        };
    }

    pub async fn update_validator_reliability(&self, validator: &str, success: bool) {
        let mut metrics = self.metrics.write().await;
        if let Some(validator_metrics) = metrics.validator_performance.get_mut(validator) {
            // Update reliability score with exponential decay
            validator_metrics.reliability_score = 
                validator_metrics.reliability_score * 0.95 + if success { 0.05 } else { 0.0 };
        }
    }

    pub async fn get_metrics(&self) -> BftMetrics {
        self.metrics.read().await.clone()
    }

    pub async fn get_validator_metrics(&self, validator: &str) -> Option<ValidatorMetrics> {
        let metrics = self.metrics.read().await;
        metrics.validator_performance.get(validator).cloned()
    }

    pub async fn get_health_status(&self) -> BftHealthStatus {
        let metrics = self.metrics.read().await;
        let success_rate = metrics.successful_rounds as f64 
            / metrics.consensus_rounds.max(1) as f64;
        
        BftHealthStatus {
            is_healthy: success_rate >= 0.95 
                && metrics.fault_tolerance.current_fault_tolerance >= 0.67,
            success_rate,
            active_validators: metrics.fault_tolerance.active_validators,
            suspected_byzantine: metrics.fault_tolerance.suspected_byzantine.len(),
            average_latency: metrics.average_consensus_time,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct BftHealthStatus {
    pub is_healthy: bool,
    pub success_rate: f64,
    pub active_validators: usize,
    pub suspected_byzantine: usize,
    pub average_latency: f64,
} 
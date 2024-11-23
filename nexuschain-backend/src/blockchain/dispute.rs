use super::state_channel::{StateChannel, ChannelUpdate};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisputeClaim {
    pub channel_id: String,
    pub claimer: String,
    pub proposed_update: ChannelUpdate,
    pub evidence: Vec<ChannelUpdate>,
    pub filed_at: DateTime<Utc>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum DisputeStatus {
    Filed,
    UnderReview,
    Resolved,
    Rejected,
}

pub struct DisputeManager {
    disputes: Arc<RwLock<HashMap<String, DisputeClaim>>>,
    statuses: Arc<RwLock<HashMap<String, DisputeStatus>>>,
    challenge_period: chrono::Duration,
}

impl DisputeManager {
    pub fn new(challenge_period_hours: i64) -> Self {
        DisputeManager {
            disputes: Arc::new(RwLock::new(HashMap::new())),
            statuses: Arc::new(RwLock::new(HashMap::new())),
            challenge_period: chrono::Duration::hours(challenge_period_hours),
        }
    }

    pub async fn file_dispute(
        &self,
        channel_id: String,
        claimer: String,
        proposed_update: ChannelUpdate,
        evidence: Vec<ChannelUpdate>,
    ) -> Result<String, String> {
        let dispute_id = uuid::Uuid::new_v4().to_string();
        let claim = DisputeClaim {
            channel_id,
            claimer,
            proposed_update,
            evidence,
            filed_at: Utc::now(),
        };

        let mut disputes = self.disputes.write().await;
        let mut statuses = self.statuses.write().await;

        disputes.insert(dispute_id.clone(), claim);
        statuses.insert(dispute_id.clone(), DisputeStatus::Filed);

        Ok(dispute_id)
    }

    pub async fn challenge_dispute(
        &self,
        dispute_id: &str,
        challenger: &str,
        counter_evidence: Vec<ChannelUpdate>,
    ) -> Result<(), String> {
        let disputes = self.disputes.read().await;
        let dispute = disputes.get(dispute_id)
            .ok_or("Dispute not found")?;

        // Verify the challenge is within the challenge period
        let now = Utc::now();
        if now - dispute.filed_at > self.challenge_period {
            return Err("Challenge period expired".to_string());
        }

        // Process counter evidence
        // In a real implementation, you would verify signatures and channel state

        let mut statuses = self.statuses.write().await;
        statuses.insert(dispute_id.to_string(), DisputeStatus::UnderReview);

        Ok(())
    }

    pub async fn resolve_dispute(
        &self,
        dispute_id: &str,
        resolution: DisputeStatus,
    ) -> Result<(), String> {
        let mut statuses = self.statuses.write().await;
        if !statuses.contains_key(dispute_id) {
            return Err("Dispute not found".to_string());
        }

        statuses.insert(dispute_id.to_string(), resolution);
        Ok(())
    }

    pub async fn get_dispute_status(&self, dispute_id: &str) -> Option<DisputeStatus> {
        let statuses = self.statuses.read().await;
        statuses.get(dispute_id).cloned()
    }
} 
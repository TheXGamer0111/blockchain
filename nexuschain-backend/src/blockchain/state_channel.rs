use super::Transaction;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateChannel {
    pub channel_id: String,
    pub participants: Vec<String>,
    pub balances: HashMap<String, u64>,
    pub nonce: u64,
    pub opened_at: DateTime<Utc>,
    pub timeout: u64,
    pub is_closed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelUpdate {
    pub channel_id: String,
    pub new_balances: HashMap<String, u64>,
    pub nonce: u64,
    pub signatures: HashMap<String, String>,
}

pub struct StateChannelManager {
    channels: Arc<RwLock<HashMap<String, StateChannel>>>,
    updates: Arc<RwLock<HashMap<String, Vec<ChannelUpdate>>>>,
}

impl StateChannelManager {
    pub fn new() -> Self {
        StateChannelManager {
            channels: Arc::new(RwLock::new(HashMap::new())),
            updates: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn open_channel(
        &self,
        participants: Vec<String>,
        initial_balances: HashMap<String, u64>,
        timeout: u64,
    ) -> Result<StateChannel, String> {
        let channel = StateChannel {
            channel_id: uuid::Uuid::new_v4().to_string(),
            participants,
            balances: initial_balances,
            nonce: 0,
            opened_at: Utc::now(),
            timeout,
            is_closed: false,
        };

        let mut channels = self.channels.write().await;
        channels.insert(channel.channel_id.clone(), channel.clone());

        let mut updates = self.updates.write().await;
        updates.insert(channel.channel_id.clone(), vec![]);

        Ok(channel)
    }

    pub async fn update_channel(
        &self,
        update: ChannelUpdate,
    ) -> Result<(), String> {
        let mut channels = self.channels.write().await;
        let channel = channels.get_mut(&update.channel_id)
            .ok_or("Channel not found")?;

        if channel.is_closed {
            return Err("Channel is closed".to_string());
        }

        if update.nonce <= channel.nonce {
            return Err("Invalid nonce".to_string());
        }

        // Verify all participants have signed
        for participant in &channel.participants {
            if !update.signatures.contains_key(participant) {
                return Err("Missing signature".to_string());
            }
        }

        // Update channel state
        channel.balances = update.new_balances;
        channel.nonce = update.nonce;

        // Store update
        let mut updates = self.updates.write().await;
        updates.get_mut(&update.channel_id)
            .unwrap()
            .push(update);

        Ok(())
    }

    pub async fn close_channel(
        &self,
        channel_id: &str,
        final_update: Option<ChannelUpdate>,
    ) -> Result<Vec<Transaction>, String> {
        let mut channels = self.channels.write().await;
        let channel = channels.get_mut(channel_id)
            .ok_or("Channel not found")?;

        if channel.is_closed {
            return Err("Channel already closed".to_string());
        }

        if let Some(update) = final_update {
            self.update_channel(update).await?;
        }

        channel.is_closed = true;

        // Create settlement transactions
        let mut settlement_transactions = Vec::new();
        for (participant, &amount) in &channel.balances {
            let transaction = Transaction::new(
                "channel".to_string(),
                participant.clone(),
                amount as f64,
            );
            settlement_transactions.push(transaction);
        }

        Ok(settlement_transactions)
    }

    pub async fn get_channel(&self, channel_id: &str) -> Option<StateChannel> {
        let channels = self.channels.read().await;
        channels.get(channel_id).cloned()
    }

    pub async fn get_channel_updates(&self, channel_id: &str) -> Option<Vec<ChannelUpdate>> {
        let updates = self.updates.read().await;
        updates.get(channel_id).cloned()
    }
} 
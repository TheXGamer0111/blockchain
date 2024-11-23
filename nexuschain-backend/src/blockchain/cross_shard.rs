use super::{Transaction, Block, sharding::ShardManager};
use std::collections::{HashMap, HashSet};
use tokio::sync::RwLock;
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct CrossShardTransaction {
    pub id: String,
    pub from_shard: u32,
    pub to_shard: u32,
    pub transaction: Transaction,
    pub status: CrossShardStatus,
    pub confirmations: HashSet<u32>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum CrossShardStatus {
    Pending,
    Locked,
    Completed,
    Failed,
}

pub struct CrossShardManager {
    transactions: Arc<RwLock<HashMap<String, CrossShardTransaction>>>,
    shard_manager: Arc<ShardManager>,
    required_confirmations: usize,
}

impl CrossShardManager {
    pub fn new(shard_manager: Arc<ShardManager>, required_confirmations: usize) -> Self {
        CrossShardManager {
            transactions: Arc::new(RwLock::new(HashMap::new())),
            shard_manager,
            required_confirmations,
        }
    }

    pub async fn initiate_cross_shard_transaction(
        &self,
        transaction: Transaction,
    ) -> Result<String, String> {
        let from_shard = self.shard_manager.calculate_shard_id(
            transaction.sender.as_bytes()
        );
        let to_shard = self.shard_manager.calculate_shard_id(
            transaction.recipient.as_bytes()
        );

        let cross_shard_tx = CrossShardTransaction {
            id: uuid::Uuid::new_v4().to_string(),
            from_shard,
            to_shard,
            transaction,
            status: CrossShardStatus::Pending,
            confirmations: HashSet::new(),
        };

        let mut transactions = self.transactions.write().await;
        transactions.insert(cross_shard_tx.id.clone(), cross_shard_tx.clone());

        Ok(cross_shard_tx.id)
    }

    pub async fn confirm_transaction(
        &self,
        tx_id: &str,
        shard_id: u32,
    ) -> Result<CrossShardStatus, String> {
        let mut transactions = self.transactions.write().await;
        let tx = transactions.get_mut(tx_id)
            .ok_or("Transaction not found")?;

        tx.confirmations.insert(shard_id);

        if tx.confirmations.len() >= self.required_confirmations {
            tx.status = CrossShardStatus::Completed;
            Ok(CrossShardStatus::Completed)
        } else {
            Ok(tx.status.clone())
        }
    }

    pub async fn get_transaction_status(&self, tx_id: &str) -> Option<CrossShardStatus> {
        let transactions = self.transactions.read().await;
        transactions.get(tx_id).map(|tx| tx.status.clone())
    }
} 
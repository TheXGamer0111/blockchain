use super::{Block, Transaction};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use sha2::{Sha256, Digest};

#[derive(Debug, Clone)]
pub struct Shard {
    pub id: u32,
    pub chain: Vec<Block>,
    pub transactions: Vec<Transaction>,
}

pub struct ShardManager {
    shards: Arc<RwLock<HashMap<u32, Shard>>>,
    shard_count: u32,
}

impl ShardManager {
    pub fn new(shard_count: u32) -> Self {
        let mut shards = HashMap::new();
        for i in 0..shard_count {
            shards.insert(i, Shard {
                id: i,
                chain: vec![],
                transactions: vec![],
            });
        }

        ShardManager {
            shards: Arc::new(RwLock::new(shards)),
            shard_count,
        }
    }

    pub fn calculate_shard_id(&self, data: &[u8]) -> u32 {
        let mut hasher = Sha256::new();
        hasher.update(data);
        let result = hasher.finalize();
        let first_bytes = result[0] as u32;
        first_bytes % self.shard_count
    }

    pub async fn add_transaction(&self, transaction: Transaction) -> Result<u32, String> {
        let shard_id = self.calculate_shard_id(transaction.hash.as_bytes());
        let mut shards = self.shards.write().await;
        
        if let Some(shard) = shards.get_mut(&shard_id) {
            shard.transactions.push(transaction);
            Ok(shard_id)
        } else {
            Err("Invalid shard ID".to_string())
        }
    }

    pub async fn get_shard(&self, shard_id: u32) -> Option<Shard> {
        let shards = self.shards.read().await;
        shards.get(&shard_id).cloned()
    }

    pub async fn process_shard(&self, shard_id: u32) -> Result<Block, String> {
        let mut shards = self.shards.write().await;
        
        if let Some(shard) = shards.get_mut(&shard_id) {
            if shard.transactions.is_empty() {
                return Err("No transactions to process".to_string());
            }

            let previous_hash = shard.chain.last()
                .map(|block| block.hash.clone())
                .unwrap_or_else(|| "0".to_string());

            let new_block = Block::new(
                shard.chain.len() as u64,
                shard.transactions.clone(),
                previous_hash,
            );

            shard.chain.push(new_block.clone());
            shard.transactions.clear();

            Ok(new_block)
        } else {
            Err("Invalid shard ID".to_string())
        }
    }

    pub async fn get_shard_status(&self, shard_id: u32) -> Result<ShardStatus, String> {
        let shards = self.shards.read().await;
        
        if let Some(shard) = shards.get(&shard_id) {
            Ok(ShardStatus {
                block_count: shard.chain.len(),
                pending_transactions: shard.transactions.len(),
                last_block_hash: shard.chain.last()
                    .map(|block| block.hash.clone())
                    .unwrap_or_else(|| "0".to_string()),
            })
        } else {
            Err("Invalid shard ID".to_string())
        }
    }
}

#[derive(Debug, Clone)]
pub struct ShardStatus {
    pub block_count: usize,
    pub pending_transactions: usize,
    pub last_block_hash: String,
} 
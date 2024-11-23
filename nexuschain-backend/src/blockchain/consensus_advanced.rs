use super::{Block, Transaction};
use sha2::{Sha256, Digest};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use chrono::Utc;

#[derive(Debug, Clone, PartialEq)]
pub enum ConsensusType {
    ProofOfWork,
    ProofOfStake,
    DelegatedProofOfStake,
}

pub struct AdvancedConsensus {
    consensus_type: ConsensusType,
    validators: Arc<RwLock<HashMap<String, Validator>>>,
    stake_manager: Arc<super::staking::StakingManager>,
    difficulty: usize,
    block_time: u64,
    last_block_time: Arc<RwLock<i64>>,
}

#[derive(Debug, Clone)]
pub struct Validator {
    pub address: String,
    pub stake: u64,
    pub last_block_validated: i64,
    pub reliability: f64,
}

impl AdvancedConsensus {
    pub fn new(
        consensus_type: ConsensusType,
        stake_manager: Arc<super::staking::StakingManager>,
        difficulty: usize,
        block_time: u64,
    ) -> Self {
        AdvancedConsensus {
            consensus_type,
            validators: Arc::new(RwLock::new(HashMap::new())),
            stake_manager,
            difficulty,
            block_time,
            last_block_time: Arc::new(RwLock::new(0)),
        }
    }

    pub async fn validate_block(&self, block: &Block, previous_block: &Block) -> Result<(), String> {
        // Basic validation
        if block.previous_hash != previous_block.hash {
            return Err("Invalid previous hash".to_string());
        }

        if block.timestamp <= previous_block.timestamp {
            return Err("Invalid timestamp".to_string());
        }

        // Consensus-specific validation
        match self.consensus_type {
            ConsensusType::ProofOfWork => {
                self.validate_pow(block).await?;
            }
            ConsensusType::ProofOfStake => {
                self.validate_pos(block).await?;
            }
            ConsensusType::DelegatedProofOfStake => {
                self.validate_dpos(block).await?;
            }
        }

        // Validate transactions
        self.validate_transactions(&block.transactions).await?;

        Ok(())
    }

    async fn validate_pow(&self, block: &Block) -> Result<(), String> {
        let hash = hex::decode(&block.hash)
            .map_err(|_| "Invalid hash format".to_string())?;
        
        let required_prefix = vec![0u8; self.difficulty / 8];
        if !hash.starts_with(&required_prefix) {
            return Err("Block does not meet difficulty requirement".to_string());
        }

        Ok(())
    }

    async fn validate_pos(&self, block: &Block) -> Result<(), String> {
        let validator = self.validators.read().await
            .get(&block.miner)
            .cloned()
            .ok_or("Invalid validator")?;

        let stake = self.stake_manager.get_user_stakes(&validator.address).await;
        if stake.is_empty() {
            return Err("Validator has no stake".to_string());
        }

        // Validate stake weight and time since last block
        let total_stake: u64 = stake.iter().map(|s| s.amount).sum();
        let time_weight = (block.timestamp - validator.last_block_validated) as u64;
        
        // Calculate stake-time weight
        let weight = total_stake * time_weight;
        if weight < self.get_minimum_stake_weight().await {
            return Err("Insufficient stake-time weight".to_string());
        }

        Ok(())
    }

    async fn validate_dpos(&self, block: &Block) -> Result<(), String> {
        let validators = self.validators.read().await;
        let validator = validators.get(&block.miner)
            .ok_or("Not an active validator")?;

        // Check if it's validator's turn
        let validator_count = validators.len();
        let slot = (block.timestamp / self.block_time as i64) as usize % validator_count;
        
        // Sort validators by stake
        let mut sorted_validators: Vec<_> = validators.values().collect();
        sorted_validators.sort_by_key(|v| std::cmp::Reverse(v.stake));

        if sorted_validators.get(slot).map(|v| &v.address) != Some(&validator.address) {
            return Err("Not validator's turn".to_string());
        }

        Ok(())
    }

    async fn validate_transactions(&self, transactions: &[Transaction]) -> Result<(), String> {
        for tx in transactions {
            // Verify signature
            if !self.verify_signature(tx).await? {
                return Err(format!("Invalid signature for transaction {}", tx.hash));
            }

            // Verify balance
            if !self.verify_balance(tx).await? {
                return Err(format!("Insufficient balance for transaction {}", tx.hash));
            }

            // Verify nonce
            if !self.verify_nonce(tx).await? {
                return Err(format!("Invalid nonce for transaction {}", tx.hash));
            }
        }

        Ok(())
    }

    async fn verify_signature(&self, tx: &Transaction) -> Result<bool, String> {
        // Implement signature verification logic
        Ok(true) // Placeholder
    }

    async fn verify_balance(&self, tx: &Transaction) -> Result<bool, String> {
        // Implement balance verification logic
        Ok(true) // Placeholder
    }

    async fn verify_nonce(&self, tx: &Transaction) -> Result<bool, String> {
        // Implement nonce verification logic
        Ok(true) // Placeholder
    }

    async fn get_minimum_stake_weight(&self) -> u64 {
        // Calculate minimum required stake-time weight
        1000000 // Placeholder value
    }

    pub async fn register_validator(&self, address: String, stake: u64) -> Result<(), String> {
        let mut validators = self.validators.write().await;
        validators.insert(address.clone(), Validator {
            address,
            stake,
            last_block_validated: 0,
            reliability: 1.0,
        });
        Ok(())
    }

    pub async fn update_validator_performance(&self, address: &str, success: bool) {
        let mut validators = self.validators.write().await;
        if let Some(validator) = validators.get_mut(address) {
            // Update reliability score
            validator.reliability = validator.reliability * 0.95 + if success { 0.05 } else { 0.0 };
        }
    }
} 
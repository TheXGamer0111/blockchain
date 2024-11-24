// nexuschain-backend/src/blockchain/mod.rs
pub mod staking;
pub mod governance;
pub mod block; // Ensure block is also included
pub mod transaction; // Ensure transaction is also included


use std::sync::Arc;
use tokio::sync::RwLock;
use crate::blockchain::staking::StakingManager; // Ensure this import is correct
use crate::blockchain::governance::GovernanceManager; // Ensure this import is correct
use std::collections::HashSet;

pub use block::Block; // Re-export Block to make it accessible
pub use transaction::Transaction; // Re-export Transaction to make it accessible
 // Ensure this is only declared once

// Example of defining a type

#[derive(Debug, Clone)]
pub struct Blockchain {
    pub chain: Arc<RwLock<Vec<Block>>>,
    pub difficulty: usize,
    pub pending_transactions: Arc<RwLock<Vec<Transaction>>>,
    pub mining_reward: f64,
    pub staking_manager: Arc<StakingManager>,
    pub governance_manager: GovernanceManager,
    pub peers: Arc<RwLock<HashSet<String>>>,
}


impl Blockchain {
    pub fn new(difficulty: usize, mining_reward: f64) -> Self {
        let mut chain = Vec::new();
        chain.push(Block::new(0, vec![], String::from("0")));
        
        let staking_manager = Arc::new(StakingManager::new());

        Blockchain {
            chain: Arc::new(RwLock::new(chain)),
            difficulty,
            pending_transactions: Arc::new(RwLock::new(Vec::new())),
            mining_reward,
            staking_manager: staking_manager.clone(),
            governance_manager: GovernanceManager::new(staking_manager),
            peers: Arc::new(RwLock::new(HashSet::new())),
        }
    }

    pub async fn add_transaction(&self, transaction: Transaction) -> Result<(), String> {
        if transaction.sender.is_empty() || transaction.recipient.is_empty() {
            return Err("Invalid sender or recipient".to_string());
        }

        if !transaction.is_valid() {
            return Err("Invalid transaction".to_string());
        }

        let mut pending = self.pending_transactions.write().await;
        pending.push(transaction);
        Ok(())
    }

    pub async fn mine_pending_transactions(&self) -> Result<Block, String> {
        let pending = self.pending_transactions.read().await;
        if pending.is_empty() {
            return Err("No transactions to mine".to_string());
        }

        // Select a validator using the staking manager
        let validator = self.staking_manager.select_validator()
            .ok_or("No valid validator found")?;

        let mut transactions = pending.clone();
        transactions.push(Transaction::new(
            "network".to_string(),
            validator.clone(),
            self.mining_reward,
        ));

        let chain = self.chain.read().await;
        let previous_block = chain.last().unwrap();
        let mut new_block = Block::new(
            chain.len() as u64,
            transactions,
            previous_block.hash.clone(),
        );

        // Set the validator for the new block
        new_block.validator = validator;

        // Validate the block (e.g., check the validator's stake)
        // ...

        drop(chain);
        drop(pending);

        let mut chain = self.chain.write().await;
        chain.push(new_block.clone());

        let mut pending = self.pending_transactions.write().await;
        pending.clear();

        Ok(new_block)
    }

    pub async fn get_balance(&self, address: &str) -> f64 {
        let chain = self.chain.read().await;
        let mut balance = 0.0;

        for block in chain.iter() {
            for transaction in &block.transactions {
                if transaction.recipient == address {
                    balance += transaction.amount;
                }
                if transaction.sender == address {
                    balance -= transaction.amount;
                }
            }
        }

        balance
    }

    pub async fn is_chain_valid(&self) -> bool {
        let chain = self.chain.read().await;
        for i in 1..chain.len() {
            let current = &chain[i];
            let previous = &chain[i - 1];

            if current.hash != current.calculate_hash() {
                return false;
            }

            if current.previous_hash != previous.hash {
                return false;
            }
        }
        true
    }

    pub async fn get_chain(&self) -> Vec<Block> {
        let chain = self.chain.read().await;
        chain.clone()
    }

    pub async fn get_pending_transactions(&self) -> Vec<Transaction> {
        let pending = self.pending_transactions.read().await;
        pending.clone()
    }

    pub async fn is_mining(&self) -> bool {
        // Implement the logic to determine if mining is currently happening
        // For example, you might have a flag or condition to check
        false // Placeholder return value
    }

    pub fn get_difficulty(&self) -> usize {
        self.difficulty
    }

    pub async fn get_block_by_hash(&self, hash: &str) -> Option<Block> {
        let chain = self.chain.read().await;
        chain.iter().find(|block| block.hash == hash).cloned()
    }

    pub async fn get_transaction_by_hash(&self, hash: &str) -> Option<Transaction> {
        let chain = self.chain.read().await;
        for block in chain.iter() {
            if let Some(transaction) = block.transactions.iter().find(|tx| tx.hash == hash) {
                return Some(transaction.clone());
            }
        }
        None
    }

    pub fn staking_manager(&self) -> &Arc<StakingManager> {
        &self.staking_manager
    }

    pub fn governance_manager(&self) -> &GovernanceManager {
        &self.governance_manager
    }

    pub async fn add_peer(&self, peer_address: &str) -> Result<(), String> {
        let mut peers = self.peers.write().await;
        if peers.contains(peer_address) {
            return Err("Peer already exists".to_string());
        }
        peers.insert(peer_address.to_string());
        Ok(())
    }

    pub fn get_peers(&self) -> Vec<String> {
        self.peers.blocking_read().iter().cloned().collect()
    }
}


// If manual implementation is needed:
impl Clone for StakingManager {
    fn clone(&self) -> Self {
        // Implement the logic to clone a StakingManager
        let staking_manager: StakingManager = StakingManager::new();
        staking_manager
    }
}
impl Clone for GovernanceManager {
    fn clone(&self) -> Self {
        // Create a new instance of StakingManager and wrap it in an Arc
        let staking_manager: Arc<StakingManager> = Arc::new(StakingManager::new());
        
        // Use the Arc-wrapped instance to create GovernanceManager
        let governance_manager: GovernanceManager = GovernanceManager::new(staking_manager);
        governance_manager
    }
}
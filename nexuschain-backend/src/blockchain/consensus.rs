use super::{Block, Transaction};
use sha2::{Sha256, Digest};
use std::time::{SystemTime, UNIX_EPOCH};

pub struct ConsensusManager {
    difficulty: usize,
    target_block_time: u64, // in seconds
    last_difficulty_adjustment: u64,
    adjustment_interval: u64, // number of blocks between difficulty adjustments
}

impl ConsensusManager {
    pub fn new(initial_difficulty: usize, target_block_time: u64) -> Self {
        ConsensusManager {
            difficulty: initial_difficulty,
            target_block_time,
            last_difficulty_adjustment: 0,
            adjustment_interval: 2016, // Similar to Bitcoin
        }
    }

    pub fn validate_block(&self, block: &Block, previous_block: &Block) -> Result<(), String> {
        // Validate block hash
        if block.hash != block.calculate_hash() {
            return Err("Invalid block hash".to_string());
        }

        // Validate previous hash
        if block.previous_hash != previous_block.hash {
            return Err("Invalid previous hash".to_string());
        }

        // Validate timestamp
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        if block.timestamp > now + 7200 {
            // Block timestamp cannot be more than 2 hours in the future
            return Err("Block timestamp too far in the future".to_string());
        }
        if block.timestamp <= previous_block.timestamp {
            return Err("Block timestamp must be greater than previous block".to_string());
        }

        // Validate proof of work
        let hash_binary = hex::decode(&block.hash)
            .map_err(|_| "Invalid hash format".to_string())?;
        let required_prefix = vec![0u8; self.difficulty / 8];
        if !hash_binary.starts_with(&required_prefix) {
            return Err("Block does not meet difficulty requirement".to_string());
        }

        // Validate transactions
        self.validate_transactions(&block.transactions)?;

        Ok(())
    }

    pub fn validate_transactions(&self, transactions: &[Transaction]) -> Result<(), String> {
        for tx in transactions {
            if !tx.is_valid() {
                return Err(format!("Invalid transaction: {}", tx.hash));
            }
        }
        Ok(())
    }

    pub fn adjust_difficulty(&mut self, blocks: &[Block]) -> usize {
        if blocks.len() < self.adjustment_interval as usize {
            return self.difficulty;
        }

        let start_block = &blocks[blocks.len() - self.adjustment_interval as usize];
        let end_block = &blocks[blocks.len() - 1];
        let actual_time_taken = end_block.timestamp - start_block.timestamp;
        let expected_time = self.target_block_time * self.adjustment_interval;

        // Adjust difficulty based on actual vs expected time
        if actual_time_taken < expected_time / 2 {
            self.difficulty += 1;
        } else if actual_time_taken > expected_time * 2 {
            if self.difficulty > 1 {
                self.difficulty -= 1;
            }
        }

        self.last_difficulty_adjustment = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        self.difficulty
    }

    pub fn get_current_difficulty(&self) -> usize {
        self.difficulty
    }
} 
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use chrono::{DateTime, Utc, Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stake {
    pub amount: u64,
    pub timestamp: DateTime<Utc>,
    pub unlock_time: DateTime<Utc>,
    pub rewards: u64,
}

#[derive(Debug)]
pub struct StakingManager {
    stakes: Arc<RwLock<HashMap<String, Vec<Stake>>>>, // address -> stakes
    total_staked: Arc<RwLock<u64>>,
    reward_rate: f64, // Annual reward rate
    min_stake_duration: Duration,
}

impl StakingManager {
    pub fn new() -> Self {
        StakingManager {
            stakes: Arc::new(RwLock::new(HashMap::new())),
            total_staked: Arc::new(RwLock::new(0)),
            reward_rate: 0.0,
            min_stake_duration: Duration::days(7),
        }
    }

    pub async fn create_stake(
        &self,
        address: String,
        amount: u64,
        duration: Duration,
    ) -> Result<Stake, String> {
        if duration < self.min_stake_duration {
            return Err("Stake duration too short".to_string());
        }

        let now = Utc::now();
        let stake = Stake {
            amount,
            timestamp: now,
            unlock_time: now + duration,
            rewards: 0,
        };

        let mut stakes = self.stakes.write().await;
        stakes.entry(address)
            .or_insert_with(Vec::new)
            .push(stake.clone());

        let mut total = self.total_staked.write().await;
        *total += amount;

        Ok(stake)
    }

    pub async fn calculate_rewards(&self, address: &str) -> u64 {
        let stakes = self.stakes.read().await;
        let now = Utc::now();

        stakes.get(address)
            .map(|user_stakes| {
                user_stakes.iter()
                    .map(|stake| {
                        let stake_duration = now - stake.timestamp;
                        let days = stake_duration.num_days() as f64;
                        (stake.amount as f64 * self.reward_rate * days / 365.0) as u64
                    })
                    .sum()
            })
            .unwrap_or(0)
    }

    pub async fn unstake(
        &self,
        address: &str,
        stake_index: usize,
    ) -> Result<(u64, u64), String> {
        let mut stakes = self.stakes.write().await;
        let now = Utc::now();

        if let Some(user_stakes) = stakes.get_mut(address) {
            if let Some(stake) = user_stakes.get(stake_index) {
                if now < stake.unlock_time {
                    return Err("Stake still locked".to_string());
                }

                let rewards = self.calculate_rewards(address).await;
                let stake = user_stakes.remove(stake_index);
                
                let mut total = self.total_staked.write().await;
                *total -= stake.amount;

                Ok((stake.amount, rewards))
            } else {
                Err("Stake not found".to_string())
            }
        } else {
            Err("No stakes found for address".to_string())
        }
    }

    pub async fn get_total_staked(&self) -> u64 {
        *self.total_staked.read().await
    }

    pub async fn get_user_stakes(&self, address: &str) -> Vec<Stake> {
        let stakes = self.stakes.read().await;
        stakes.get(address)
            .cloned()
            .unwrap_or_default()
    }
} 
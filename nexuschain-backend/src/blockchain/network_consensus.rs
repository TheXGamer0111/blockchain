use super::{Block, Transaction, consensus_advanced::ConsensusType};
use std::collections::{HashMap, HashSet};
use tokio::sync::RwLock;
use std::sync::Arc;
use chrono::Utc;

#[derive(Debug, Clone)]
pub struct ConsensusVote {
    pub block_hash: String,
    pub validator: String,
    pub timestamp: i64,
    pub signature: String,
}

#[derive(Debug, Clone)]
pub struct ConsensusRound {
    pub round_number: u64,
    pub proposed_block: Option<Block>,
    pub votes: HashMap<String, ConsensusVote>,
    pub status: ConsensusStatus,
    pub started_at: i64,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ConsensusStatus {
    Proposing,
    Voting,
    Committing,
    Finished,
    Failed,
}

pub struct NetworkConsensus {
    consensus_type: ConsensusType,
    rounds: Arc<RwLock<HashMap<u64, ConsensusRound>>>,
    validators: Arc<RwLock<HashMap<String, ValidatorState>>>,
    current_round: Arc<RwLock<u64>>,
    vote_threshold: f64,
    round_timeout: i64,
}

#[derive(Debug, Clone)]
struct ValidatorState {
    pub address: String,
    pub stake: u64,
    pub last_vote: i64,
    pub reliability: f64,
}

impl NetworkConsensus {
    pub fn new(
        consensus_type: ConsensusType,
        vote_threshold: f64,
        round_timeout: i64,
    ) -> Self {
        NetworkConsensus {
            consensus_type,
            rounds: Arc::new(RwLock::new(HashMap::new())),
            validators: Arc::new(RwLock::new(HashMap::new())),
            current_round: Arc::new(RwLock::new(0)),
            vote_threshold,
            round_timeout,
        }
    }

    pub async fn start_consensus_round(&self, block: Block) -> Result<(), String> {
        let round_number = {
            let mut current_round = self.current_round.write().await;
            *current_round += 1;
            *current_round
        };

        let round = ConsensusRound {
            round_number,
            proposed_block: Some(block),
            votes: HashMap::new(),
            status: ConsensusStatus::Proposing,
            started_at: Utc::now().timestamp(),
        };

        let mut rounds = self.rounds.write().await;
        rounds.insert(round_number, round);

        // Start the consensus process based on the consensus type
        match self.consensus_type {
            ConsensusType::ProofOfWork => {
                self.start_pow_round(round_number).await?;
            }
            ConsensusType::ProofOfStake => {
                self.start_pos_round(round_number).await?;
            }
            ConsensusType::DelegatedProofOfStake => {
                self.start_dpos_round(round_number).await?;
            }
        }

        Ok(())
    }

    async fn start_pow_round(&self, round_number: u64) -> Result<(), String> {
        let mut rounds = self.rounds.write().await;
        if let Some(round) = rounds.get_mut(&round_number) {
            round.status = ConsensusStatus::Voting;
            // In PoW, mining is the voting process
            // Nodes will submit their mined blocks as votes
        }
        Ok(())
    }

    async fn start_pos_round(&self, round_number: u64) -> Result<(), String> {
        let mut rounds = self.rounds.write().await;
        if let Some(round) = rounds.get_mut(&round_number) {
            round.status = ConsensusStatus::Voting;
            // Initialize stake-weighted voting
        }
        Ok(())
    }

    async fn start_dpos_round(&self, round_number: u64) -> Result<(), String> {
        let mut rounds = self.rounds.write().await;
        if let Some(round) = rounds.get_mut(&round_number) {
            round.status = ConsensusStatus::Voting;
            // Select delegate for this round
            self.select_round_delegate(round).await?;
        }
        Ok(())
    }

    pub async fn submit_vote(
        &self,
        round_number: u64,
        vote: ConsensusVote,
    ) -> Result<(), String> {
        // Validate the vote
        self.validate_vote(&vote).await?;

        let mut rounds = self.rounds.write().await;
        let round = rounds.get_mut(&round_number)
            .ok_or("Round not found")?;

        if round.status != ConsensusStatus::Voting {
            return Err("Round not in voting phase".to_string());
        }

        // Add the vote
        round.votes.insert(vote.validator.clone(), vote);

        // Check if we have enough votes
        if self.check_consensus(round).await {
            round.status = ConsensusStatus::Committing;
            self.finalize_round(round_number).await?;
        }

        Ok(())
    }

    async fn validate_vote(&self, vote: &ConsensusVote) -> Result<(), String> {
        let validators = self.validators.read().await;
        let validator = validators.get(&vote.validator)
            .ok_or("Invalid validator")?;

        // Validate signature
        // In a real implementation, you would verify the cryptographic signature
        
        // Check if validator has already voted in this round
        // Check if validator is eligible to vote based on stake/delegation

        Ok(())
    }

    async fn check_consensus(&self, round: &ConsensusRound) -> bool {
        let validators = self.validators.read().await;
        let total_stake: u64 = validators.values().map(|v| v.stake).sum();
        let voting_stake: u64 = round.votes.keys()
            .filter_map(|addr| validators.get(addr))
            .map(|v| v.stake)
            .sum();

        (voting_stake as f64 / total_stake as f64) >= self.vote_threshold
    }

    async fn finalize_round(&self, round_number: u64) -> Result<(), String> {
        let mut rounds = self.rounds.write().await;
        let round = rounds.get_mut(&round_number)
            .ok_or("Round not found")?;

        if round.status != ConsensusStatus::Committing {
            return Ok(());
        }

        if let Some(block) = &round.proposed_block {
            // Commit the block to the chain
            // In a real implementation, you would add the block to the blockchain
            println!("Consensus reached for block: {}", block.hash);
            round.status = ConsensusStatus::Finished;
        }

        Ok(())
    }

    async fn select_round_delegate(&self, round: &mut ConsensusRound) -> Result<(), String> {
        let validators = self.validators.read().await;
        let mut eligible_validators: Vec<_> = validators.values()
            .filter(|v| v.reliability >= 0.8)
            .collect();

        eligible_validators.sort_by_key(|v| std::cmp::Reverse(v.stake));

        if let Some(delegate) = eligible_validators.first() {
            println!("Selected delegate for round {}: {}", round.round_number, delegate.address);
        }

        Ok(())
    }

    pub async fn get_round_status(&self, round_number: u64) -> Option<ConsensusStatus> {
        let rounds = self.rounds.read().await;
        rounds.get(&round_number).map(|r| r.status.clone())
    }

    pub async fn cleanup_old_rounds(&self) {
        let mut rounds = self.rounds.write().await;
        let current_time = Utc::now().timestamp();
        rounds.retain(|_, round| {
            current_time - round.started_at <= self.round_timeout
        });
    }
} 
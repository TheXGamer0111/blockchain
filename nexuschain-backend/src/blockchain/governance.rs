use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;
use chrono::{DateTime, Utc};
use crate::blockchain::staking::StakingManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proposal {
    pub id: String,
    pub title: String,
    pub description: String,
    pub proposer: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub votes_for: u64,
    pub votes_against: u64,
    pub status: ProposalStatus,
    pub min_votes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProposalStatus {
    Pending,
    Approved,
    Rejected,
    Active,
    Passed,
    Failed,
    Executed,

}

#[derive(Debug)]
pub struct GovernanceManager {
    proposals: Arc<RwLock<HashMap<String, Proposal>>>,
    votes: Arc<RwLock<HashMap<String, HashMap<String, bool>>>>, // proposal_id -> (voter -> vote)
    staking_manager: Arc<StakingManager>,
}

impl GovernanceManager {
    pub fn new(staking_manager: Arc<StakingManager>) -> Self {
        GovernanceManager {
            proposals: Arc::new(RwLock::new(HashMap::new())),
            votes: Arc::new(RwLock::new(HashMap::new())),
            staking_manager,
        }
    }

    pub async fn create_proposal(
        &self,
        title: String,
        description: String,
        proposer: String,
        duration: chrono::Duration,
    ) -> Result<Proposal, String> {
        let proposer_stake = self.staking_manager.get_user_stakes(&proposer).await;
        if proposer_stake.is_empty() {
            return Err("Proposer must have staked tokens".to_string());
        }

        let now = Utc::now();
        let proposal = Proposal {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            description,
            proposer,
            start_time: now,
            end_time: now + duration,
            votes_for: 0,
            votes_against: 0,
            status: ProposalStatus::Active,
            min_votes: self.staking_manager.get_total_staked().await / 10, // 10% of total staked
        };

        let mut proposals = self.proposals.write().await;
        proposals.insert(proposal.id.clone(), proposal.clone());

        let mut votes = self.votes.write().await;
        votes.insert(proposal.id.clone(), HashMap::new());

        Ok(proposal)
    }

    pub async fn vote(
        &self,
        proposal_id: &str,
        voter: &str,
        vote: bool,
    ) -> Result<(), String> {
        let voter_stake = self.staking_manager.get_user_stakes(voter).await;
        if voter_stake.is_empty() {
            return Err("Must have staked tokens to vote".to_string());
        }

        let mut proposals = self.proposals.write().await;
        let proposal = proposals.get_mut(proposal_id)
            .ok_or("Proposal not found")?;

        if proposal.status != ProposalStatus::Active {
            return Err("Proposal not active".to_string());
        }

        if Utc::now() > proposal.end_time {
            return Err("Voting period ended".to_string());
        }

        let mut votes = self.votes.write().await;
        let proposal_votes = votes.get_mut(proposal_id)
            .ok_or("Proposal votes not found")?;

        let voter_stake_amount: u64 = voter_stake.iter().map(|s| s.amount).sum();

        if let Some(previous_vote) = proposal_votes.get(voter) {
            if *previous_vote == vote {
                return Ok(());
            }
            if *previous_vote {
                proposal.votes_for -= voter_stake_amount;
            } else {
                proposal.votes_against -= voter_stake_amount;
            }
        }

        if vote {
            proposal.votes_for += voter_stake_amount;
        } else {
            proposal.votes_against += voter_stake_amount;
        }

        proposal_votes.insert(voter.to_string(), vote);
        Ok(())
    }

    pub async fn finalize_proposal(&self, proposal_id: &str) -> Result<ProposalStatus, String> {
        let mut proposals = self.proposals.write().await;
        let proposal = proposals.get_mut(proposal_id)
            .ok_or("Proposal not found")?;

        if proposal.status != ProposalStatus::Active {
            return Err("Proposal not active".to_string());
        }

        if Utc::now() < proposal.end_time {
            return Err("Voting period not ended".to_string());
        }

        let total_votes = proposal.votes_for + proposal.votes_against;
        if total_votes < proposal.min_votes {
            proposal.status = ProposalStatus::Failed;
            return Ok(ProposalStatus::Failed);
        }

        if proposal.votes_for > proposal.votes_against {
            proposal.status = ProposalStatus::Passed;
            Ok(ProposalStatus::Passed)
        } else {
            proposal.status = ProposalStatus::Failed;
            Ok(ProposalStatus::Failed)
        }
    }

    pub async fn get_proposal(&self, proposal_id: &str) -> Option<Proposal> {
        // Access the proposal by its ID
        self.proposals.read().await.get(proposal_id).cloned()
    }
} 
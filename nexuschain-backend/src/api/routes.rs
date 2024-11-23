use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::blockchain::{Blockchain, Transaction, staking::Stake, governance::{Proposal, ProposalStatus}};
use crate::wallet;
use crate::blockchain::Block;

#[derive(Debug, Serialize)]
pub struct ChainResponse {
    chain: Vec<Block>,
    length: usize,
}

#[derive(Debug, Deserialize)]
pub struct TransactionRequest {
    sender: String,
    recipient: String,
    amount: f64,
}

pub async fn get_chain(
    State(blockchain): State<Arc<Blockchain>>
) -> Json<ChainResponse> {
    let chain = blockchain.get_chain().await;
    Json(ChainResponse {
        chain: chain.clone(),
        length: chain.len(),
    })
}

pub async fn mine_block(
    State(blockchain): State<Arc<Blockchain>>
) -> Json<Block> {
    // For demo purposes, using a fixed miner address
    let miner_address = "miner_address".to_string();
    let block = blockchain.mine_pending_transactions(miner_address).await
        .expect("Mining failed");
    Json(block)
}

pub async fn create_transaction(
    State(blockchain): State<Arc<Blockchain>>,
    Json(request): Json<TransactionRequest>,
) -> Json<Transaction> {
    let transaction = Transaction::new(
        request.sender,
        request.recipient,
        request.amount,
    );
    blockchain.add_transaction(transaction.clone()).await
        .expect("Failed to add transaction");
    Json(transaction)
}

pub async fn get_balance(
    State(blockchain): State<Arc<Blockchain>>,
    Path(address): Path<String>,
) -> Json<serde_json::Value> {
    let balance = blockchain.get_balance(&address).await;
    Json(serde_json::json!({
        "address": address,
        "balance": balance
    }))
}

pub async fn get_mempool(
    State(blockchain): State<Arc<Blockchain>>
) -> Json<Vec<Transaction>> {
    let pending = blockchain.get_pending_transactions().await;
    Json(pending)
}

pub async fn get_network_stats(
    State(blockchain): State<Arc<Blockchain>>
) -> Json<serde_json::Value> {
    let chain = blockchain.get_chain().await;
    let pending = blockchain.get_pending_transactions().await;
    
    Json(serde_json::json!({
        "blocks": chain.len(),
        "pending_transactions": pending.len(),
        "is_mining": blockchain.is_mining().await,
        "difficulty": blockchain.get_difficulty()
    }))
}

pub async fn get_block_details(
    State(blockchain): State<Arc<Blockchain>>,
    Path(hash): Path<String>,
) -> Json<Option<Block>> {
    let block = blockchain.get_block_by_hash(&hash).await;
    Json(block)
}

pub async fn get_transaction_details(
    State(blockchain): State<Arc<Blockchain>>,
    Path(hash): Path<String>,
) -> Json<Option<Transaction>> {
    let transaction = blockchain.get_transaction_by_hash(&hash).await;
    Json(transaction)
}

pub async fn create_wallet() -> Json<serde_json::Value> {
    let wallet = wallet::Wallet::new();
    Json(serde_json::json!({
        "address": wallet.get_address(),
        "public_key": wallet.public_key
    }))
}

pub async fn create_stake(
    State(blockchain): State<Arc<Blockchain>>,
    Json(payload): Json<CreateStakeRequest>,
) -> Json<Stake> {
    let staking_manager = blockchain.staking_manager();
    let stake = staking_manager.create_stake(
        payload.address,
        payload.amount,
        chrono::Duration::days(payload.duration_days as i64),
    ).await.expect("Failed to create stake");
    Json(stake)
}

pub async fn get_stakes(
    State(blockchain): State<Arc<Blockchain>>,
    Path(address): Path<String>,
) -> Json<Vec<Stake>> {
    let staking_manager = blockchain.staking_manager();
    let stakes = staking_manager.get_user_stakes(&address).await;
    Json(stakes)
}

pub async fn unstake(
    State(blockchain): State<Arc<Blockchain>>,
    Path((address, stake_index)): Path<(String, usize)>,
) -> Json<UnstakeResponse> {
    let staking_manager = blockchain.staking_manager();
    let (amount, rewards) = staking_manager.unstake(&address, stake_index)
        .await.expect("Failed to unstake");
    Json(UnstakeResponse { amount, rewards })
}

pub async fn create_proposal(
    State(blockchain): State<Arc<Blockchain>>,
    Json(payload): Json<CreateProposalRequest>,
) -> Json<Proposal> {
    let proposal = blockchain.governance_manager().create_proposal(
        payload.title,
        payload.description,
        payload.proposer,
        chrono::Duration::days(payload.duration_days as i64),
    ).await.expect("Failed to create proposal");
    Json(proposal)
}

pub async fn vote_on_proposal(
    State(blockchain): State<Arc<Blockchain>>,
    Json(payload): Json<VoteRequest>,
) -> Json<serde_json::Value> {
    blockchain.governance_manager().vote(
        &payload.proposal_id,
        &payload.voter,
        payload.vote,
    ).await.expect("Failed to vote");
    Json(serde_json::json!({ "success": true }))
}

pub async fn get_proposal(
    State(blockchain): State<Arc<Blockchain>>,
    Path(proposal_id): Path<String>,
) -> Json<Option<Proposal>> {
    let proposal = blockchain.governance_manager().get_proposal(&proposal_id).await;
    Json(proposal)
}

pub async fn finalize_proposal(
    State(blockchain): State<Arc<Blockchain>>,
    Path(proposal_id): Path<String>,
) -> Json<ProposalStatus> {
    let status = blockchain.governance_manager().finalize_proposal(&proposal_id)
        .await.expect("Failed to finalize proposal");
    Json(status)
}

#[derive(Debug, Deserialize)]
pub struct CreateStakeRequest {
    pub address: String,
    pub amount: u64,
    pub duration_days: u64,
}

#[derive(Debug, Serialize)]
pub struct UnstakeResponse {
    pub amount: u64,
    pub rewards: u64,
}

#[derive(Debug, Deserialize)]
pub struct CreateProposalRequest {
    pub title: String,
    pub description: String,
    pub proposer: String,
    pub duration_days: u64,
}

#[derive(Debug, Deserialize)]
pub struct VoteRequest {
    pub proposal_id: String,
    pub voter: String,
    pub vote: bool,
}


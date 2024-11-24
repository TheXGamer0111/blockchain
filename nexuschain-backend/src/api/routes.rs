use axum::{
    extract::{Path, State},
    Json,
    response::IntoResponse,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::blockchain::{Blockchain, Transaction, staking::Stake, governance::{Proposal, ProposalStatus}};
use crate::wallet;
use crate::blockchain::Block;
use serde_json::json;
use crate::api::AppState;

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

pub async fn get_chain(State(state): State<AppState>) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    let chain = blockchain.get_chain().await;
    Json(ChainResponse {
        chain: chain.clone(),
        length: chain.len(),
    })
}

pub async fn mine_block(State(state): State<AppState>) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    let pending_transactions = blockchain.get_pending_transactions().await;

    if pending_transactions.is_empty() {
        return (StatusCode::BAD_REQUEST, "No transactions to mine").into_response();
    }

    match blockchain.mine_pending_transactions().await {
        Ok(block) => Json(block).into_response(),
        Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, format!("Mining failed: {}", err)).into_response(),
    }
}

pub async fn create_transaction(
    State(state): State<AppState>,
    Json(request): Json<TransactionRequest>
) -> impl IntoResponse {
    let blockchain = &state.blockchain;
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
    State(state): State<AppState>,
    Path(address): Path<String>
) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    let balance = blockchain.get_balance(&address).await;
    Json(json!({
        "address": address,
        "balance": balance
    }))
}

pub async fn get_mempool(State(state): State<AppState>) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    let pending = blockchain.get_pending_transactions().await;
    Json(pending)
}

pub async fn get_network_stats(State(state): State<AppState>) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    let chain = blockchain.get_chain().await;
    let pending = blockchain.get_pending_transactions().await;
    
    Json(json!({
        "blocks": chain.len(),
        "pending_transactions": pending.len(),
        "is_mining": blockchain.is_mining().await,
        "difficulty": blockchain.get_difficulty()
    }))
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
    Json(json!({
        "address": wallet.get_address(),
        "public_key": wallet.public_key
    }))
}

pub async fn create_stake(
    State(state): State<AppState>,
    Json(payload): Json<CreateStakeRequest>,
) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    let staking_manager = blockchain.staking_manager();
    
    match staking_manager.create_stake(
        payload.address,
        payload.amount,
        chrono::Duration::days(payload.duration_days as i64),
    ).await {
        Ok(stake) => Json(stake).into_response(),
        Err(err) => (StatusCode::BAD_REQUEST, format!("Failed to create stake: {}", err)).into_response(),
    }
}

pub async fn get_stakes(
    State(state): State<AppState>,
    Path(address): Path<String>,
) -> Json<Vec<Stake>> {
    let blockchain = &state.blockchain;
    let staking_manager = blockchain.staking_manager();
    let stakes = staking_manager.get_user_stakes(&address).await;
    Json(stakes)
}

pub async fn unstake(
    State(state): State<AppState>,
    Path((address, stake_index)): Path<(String, usize)>,
) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    let staking_manager = blockchain.staking_manager();
    match staking_manager.unstake(&address, stake_index).await {
        Ok((amount, rewards)) => Json(UnstakeResponse { amount, rewards }).into_response(),
        Err(err) => (StatusCode::BAD_REQUEST, format!("Failed to unstake: {}", err)).into_response(),
    }
}

pub async fn create_proposal(
    State(state): State<AppState>,
    Json(payload): Json<CreateProposalRequest>,
) -> Json<Proposal> {
    let blockchain = &state.blockchain;
    let proposal = blockchain.governance_manager().create_proposal(
        payload.title,
        payload.description,
        payload.proposer,
        chrono::Duration::days(payload.duration_days as i64),
    ).await.expect("Failed to create proposal");
    Json(proposal)
}

pub async fn vote_on_proposal(
    State(state): State<AppState>,
    Json(payload): Json<VoteRequest>,
) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    match blockchain.governance_manager().vote(
        &payload.proposal_id,
        &payload.voter,
        payload.vote,
    ).await {
        Ok(_) => Json(json!({ "success": true })).into_response(),
        Err(err) => (StatusCode::BAD_REQUEST, format!("Failed to vote: {}", err)).into_response(),
    }
}

pub async fn get_proposal(
    State(state): State<AppState>,
    Path(proposal_id): Path<String>,
) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    match blockchain.governance_manager().get_proposal(&proposal_id).await {
        Some(proposal) => Json(proposal).into_response(),
        None => (StatusCode::NOT_FOUND, "Proposal not found").into_response(),
    }
}

pub async fn finalize_proposal(
    State(state): State<AppState>,
    Path(proposal_id): Path<String>,
) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    match blockchain.governance_manager().finalize_proposal(&proposal_id).await {
        Ok(status) => Json(status).into_response(),
        Err(err) => (StatusCode::BAD_REQUEST, format!("Failed to finalize proposal: {}", err)).into_response(),
    }
}

pub async fn get_peers(State(state): State<AppState>) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    let peers = blockchain.get_peers();
    
    Json(json!({
        "peers": peers,
        "total": peers.len()
    }))
}

#[derive(Debug, Deserialize)]
pub struct PeerRequest {
    pub address: String,  // The address of the peer to connect to
    pub port: u16,       // The port number of the peer
}

pub async fn connect_peer(
    State(state): State<AppState>,
    Json(peer): Json<PeerRequest>,
) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    
    match blockchain.add_peer(&format!("{}:{}", peer.address, peer.port)).await {
        Ok(_) => Json(json!({
            "success": true,
            "message": "Peer connected successfully",
            "peer": format!("{}:{}", peer.address, peer.port)
        })).into_response(),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "success": false,
                "error": format!("Failed to connect to peer: {}", err)
            }))
        ).into_response()
    }
}

pub async fn node_status(State(state): State<AppState>) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    Json(json!({
        "peers": blockchain.get_peers().len(),
        "blocks": blockchain.get_chain().await.len(),
        "mempool": blockchain.get_pending_transactions().await.len()
    }))
}

pub async fn get_transaction(
    State(state): State<AppState>,
    Path(hash): Path<String>
) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    match blockchain.get_transaction_by_hash(&hash).await {
        Some(transaction) => Json(transaction).into_response(),
        None => (StatusCode::NOT_FOUND, "Transaction not found").into_response(),
    }
}

pub async fn get_block_by_hash(
    State(state): State<AppState>,
    Path(hash): Path<String>
) -> impl IntoResponse {
    let blockchain = &state.blockchain;
    let block = blockchain.get_block_by_hash(&hash).await;
    match block {
        Some(block) => Json(block).into_response(),
        None => (StatusCode::NOT_FOUND, "Block not found").into_response(),
    }
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


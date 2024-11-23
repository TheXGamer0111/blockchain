use super::{Transaction, Block};
use sha2::{Sha256, Digest};
use std::collections::{HashMap, HashSet};
use tokio::sync::RwLock;
use std::sync::Arc;
use secp256k1::{Secp256k1, Message, PublicKey, Signature};

pub struct TransactionValidator {
    mempool: Arc<super::mempool::MempoolManager>,
    nonce_tracker: Arc<RwLock<HashMap<String, u64>>>,
    processed_txs: Arc<RwLock<HashSet<String>>>,
    secp: Secp256k1<secp256k1::All>,
}

#[derive(Debug)]
pub enum ValidationError {
    InvalidSignature,
    InvalidNonce,
    InsufficientBalance,
    DuplicateTransaction,
    InvalidFormat,
    TransactionTooLarge,
}

impl TransactionValidator {
    pub fn new(mempool: Arc<super::mempool::MempoolManager>) -> Self {
        TransactionValidator {
            mempool,
            nonce_tracker: Arc::new(RwLock::new(HashMap::new())),
            processed_txs: Arc::new(RwLock::new(HashSet::new())),
            secp: Secp256k1::new(),
        }
    }

    pub async fn validate_transaction(
        &self,
        transaction: &Transaction,
        state: &super::state::State,
    ) -> Result<(), ValidationError> {
        // Check if transaction has already been processed
        if self.is_duplicate(transaction).await {
            return Err(ValidationError::DuplicateTransaction);
        }

        // Validate basic format
        self.validate_format(transaction)?;

        // Validate signature
        self.validate_signature(transaction)?;

        // Validate nonce
        self.validate_nonce(transaction).await?;

        // Validate balance
        self.validate_balance(transaction, state).await?;

        // Add to processed transactions
        let mut processed = self.processed_txs.write().await;
        processed.insert(transaction.hash.clone());

        Ok(())
    }

    async fn is_duplicate(&self, transaction: &Transaction) -> bool {
        let processed = self.processed_txs.read().await;
        processed.contains(&transaction.hash)
    }

    fn validate_format(&self, transaction: &Transaction) -> Result<(), ValidationError> {
        // Check transaction size
        let tx_size = serde_json::to_string(transaction)
            .map_err(|_| ValidationError::InvalidFormat)?
            .len();

        if tx_size > 1024 * 1024 { // 1MB limit
            return Err(ValidationError::TransactionTooLarge);
        }

        // Validate addresses
        if !self.is_valid_address(&transaction.sender) || !self.is_valid_address(&transaction.recipient) {
            return Err(ValidationError::InvalidFormat);
        }

        // Validate amount
        if transaction.amount <= 0.0 {
            return Err(ValidationError::InvalidFormat);
        }

        Ok(())
    }

    fn validate_signature(&self, transaction: &Transaction) -> Result<(), ValidationError> {
        let signature = hex::decode(&transaction.signature.as_ref().ok_or(ValidationError::InvalidSignature)?)
            .map_err(|_| ValidationError::InvalidSignature)?;
        
        let message = self.create_message_hash(transaction);
        let public_key = hex::decode(&transaction.sender)
            .map_err(|_| ValidationError::InvalidSignature)?;

        let signature = Signature::from_compact(&signature)
            .map_err(|_| ValidationError::InvalidSignature)?;
        let public_key = PublicKey::from_slice(&public_key)
            .map_err(|_| ValidationError::InvalidSignature)?;

        self.secp.verify_ecdsa(
            &Message::from_slice(&message).unwrap(),
            &signature,
            &public_key,
        ).map_err(|_| ValidationError::InvalidSignature)
    }

    async fn validate_nonce(&self, transaction: &Transaction) -> Result<(), ValidationError> {
        let mut nonces = self.nonce_tracker.write().await;
        let current_nonce = nonces.entry(transaction.sender.clone()).or_insert(0);

        if transaction.nonce != *current_nonce + 1 {
            return Err(ValidationError::InvalidNonce);
        }

        *current_nonce += 1;
        Ok(())
    }

    async fn validate_balance(
        &self,
        transaction: &Transaction,
        state: &super::state::State,
    ) -> Result<(), ValidationError> {
        let balance = state.get_balance(&transaction.sender).await;
        
        if balance < transaction.amount {
            return Err(ValidationError::InsufficientBalance);
        }

        Ok(())
    }

    fn create_message_hash(&self, transaction: &Transaction) -> Vec<u8> {
        let mut hasher = Sha256::new();
        hasher.update(format!(
            "{}{}{}{}",
            transaction.sender,
            transaction.recipient,
            transaction.amount,
            transaction.nonce,
        ));
        hasher.finalize().to_vec()
    }

    fn is_valid_address(&self, address: &str) -> bool {
        // Basic hex address validation
        if address.len() != 40 {
            return false;
        }
        hex::decode(address).is_ok()
    }

    pub async fn validate_block_transactions(
        &self,
        block: &Block,
        state: &super::state::State,
    ) -> Result<(), ValidationError> {
        let mut seen_txs = HashSet::new();

        for transaction in &block.transactions {
            // Check for duplicate transactions within the block
            if !seen_txs.insert(transaction.hash.clone()) {
                return Err(ValidationError::DuplicateTransaction);
            }

            // Validate each transaction
            self.validate_transaction(transaction, state).await?;
        }

        Ok(())
    }

    pub async fn reset_nonce(&self, address: &str) {
        let mut nonces = self.nonce_tracker.write().await;
        nonces.remove(address);
    }

    pub async fn get_nonce(&self, address: &str) -> u64 {
        let nonces = self.nonce_tracker.read().await;
        *nonces.get(address).unwrap_or(&0)
    }
} 
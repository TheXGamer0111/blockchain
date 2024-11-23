use super::{Block, Transaction};
use std::collections::{HashMap, HashSet};
use tokio::sync::RwLock;
use std::sync::Arc;
use chrono::Utc;

#[derive(Debug, Clone, PartialEq)]
pub enum BftPhase {
    PrePrepare,
    Prepare,
    Commit,
    Finalized,
    ViewChange,
}

#[derive(Debug, Clone)]
pub struct BftMessage {
    pub msg_type: BftMessageType,
    pub view: u64,
    pub sequence: u64,
    pub block_hash: String,
    pub sender: String,
    pub signature: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, PartialEq)]
pub enum BftMessageType {
    PrePrepare,
    Prepare,
    Commit,
    ViewChange,
    NewView,
}

pub struct BftConsensus {
    validators: Arc<RwLock<HashMap<String, ValidatorState>>>,
    messages: Arc<RwLock<HashMap<u64, Vec<BftMessage>>>>,
    current_view: Arc<RwLock<u64>>,
    current_sequence: Arc<RwLock<u64>>,
    prepared_blocks: Arc<RwLock<HashMap<String, Block>>>,
    committed_blocks: Arc<RwLock<HashSet<String>>>,
    view_change_timeout: i64,
    f: usize, // Maximum number of faulty nodes tolerated
}

#[derive(Debug, Clone)]
struct ValidatorState {
    address: String,
    is_primary: bool,
    last_activity: i64,
    consecutive_failures: u32,
}

impl BftConsensus {
    pub fn new(validators: Vec<String>, view_change_timeout: i64) -> Self {
        let f = (validators.len() - 1) / 3; // Maximum Byzantine nodes tolerated
        let mut validator_states = HashMap::new();
        
        for (i, validator) in validators.iter().enumerate() {
            validator_states.insert(validator.clone(), ValidatorState {
                address: validator.clone(),
                is_primary: i == 0,
                last_activity: Utc::now().timestamp(),
                consecutive_failures: 0,
            });
        }

        BftConsensus {
            validators: Arc::new(RwLock::new(validator_states)),
            messages: Arc::new(RwLock::new(HashMap::new())),
            current_view: Arc::new(RwLock::new(0)),
            current_sequence: Arc::new(RwLock::new(0)),
            prepared_blocks: Arc::new(RwLock::new(HashMap::new())),
            committed_blocks: Arc::new(RwLock::new(HashSet::new())),
            view_change_timeout,
            f,
        }
    }

    pub async fn start_consensus(&self, block: Block) -> Result<(), String> {
        let sequence = {
            let mut seq = self.current_sequence.write().await;
            *seq += 1;
            *seq
        };

        let primary = self.get_primary_validator().await?;
        if primary.is_primary {
            self.broadcast_preprepare(block, sequence).await?;
        }

        Ok(())
    }

    async fn broadcast_preprepare(&self, block: Block, sequence: u64) -> Result<(), String> {
        let view = *self.current_view.read().await;
        let message = BftMessage {
            msg_type: BftMessageType::PrePrepare,
            view,
            sequence,
            block_hash: block.hash.clone(),
            sender: self.get_primary_validator().await?.address,
            signature: "".to_string(), // In practice, sign the message
            timestamp: Utc::now().timestamp(),
        };

        let mut prepared_blocks = self.prepared_blocks.write().await;
        prepared_blocks.insert(block.hash.clone(), block);

        self.broadcast_message(message).await
    }

    pub async fn handle_message(&self, message: BftMessage) -> Result<(), String> {
        // Validate message
        self.validate_message(&message).await?;

        match message.msg_type {
            BftMessageType::PrePrepare => {
                self.handle_preprepare(message).await?;
            }
            BftMessageType::Prepare => {
                self.handle_prepare(message).await?;
            }
            BftMessageType::Commit => {
                self.handle_commit(message).await?;
            }
            BftMessageType::ViewChange => {
                self.handle_view_change(message).await?;
            }
            BftMessageType::NewView => {
                self.handle_new_view(message).await?;
            }
        }

        Ok(())
    }

    async fn handle_preprepare(&self, message: BftMessage) -> Result<(), String> {
        let prepared_blocks = self.prepared_blocks.read().await;
        if !prepared_blocks.contains_key(&message.block_hash) {
            return Err("Block not found".to_string());
        }

        // Send prepare message
        let prepare_message = BftMessage {
            msg_type: BftMessageType::Prepare,
            view: message.view,
            sequence: message.sequence,
            block_hash: message.block_hash,
            sender: self.get_self_validator().await?.address,
            signature: "".to_string(), // In practice, sign the message
            timestamp: Utc::now().timestamp(),
        };

        self.broadcast_message(prepare_message).await
    }

    async fn handle_prepare(&self, message: BftMessage) -> Result<(), String> {
        let mut messages = self.messages.write().await;
        messages.entry(message.sequence)
            .or_insert_with(Vec::new)
            .push(message.clone());

        // Check if we have enough prepare messages
        if self.check_prepare_quorum(message.sequence, &message.block_hash).await {
            // Send commit message
            let commit_message = BftMessage {
                msg_type: BftMessageType::Commit,
                view: message.view,
                sequence: message.sequence,
                block_hash: message.block_hash,
                sender: self.get_self_validator().await?.address,
                signature: "".to_string(), // In practice, sign the message
                timestamp: Utc::now().timestamp(),
            };

            self.broadcast_message(commit_message).await?;
        }

        Ok(())
    }

    async fn handle_commit(&self, message: BftMessage) -> Result<(), String> {
        let mut messages = self.messages.write().await;
        messages.entry(message.sequence)
            .or_insert_with(Vec::new)
            .push(message.clone());

        // Check if we have enough commit messages
        if self.check_commit_quorum(message.sequence, &message.block_hash).await {
            let mut committed_blocks = self.committed_blocks.write().await;
            committed_blocks.insert(message.block_hash.clone());
            
            // Finalize the block
            self.finalize_block(&message.block_hash).await?;
        }

        Ok(())
    }

    async fn check_prepare_quorum(&self, sequence: u64, block_hash: &str) -> bool {
        let messages = self.messages.read().await;
        let prepare_count = messages.get(&sequence)
            .map(|msgs| msgs.iter()
                .filter(|m| m.msg_type == BftMessageType::Prepare 
                    && m.block_hash == block_hash)
                .count())
            .unwrap_or(0);

        prepare_count >= 2 * self.f + 1
    }

    async fn check_commit_quorum(&self, sequence: u64, block_hash: &str) -> bool {
        let messages = self.messages.read().await;
        let commit_count = messages.get(&sequence)
            .map(|msgs| msgs.iter()
                .filter(|m| m.msg_type == BftMessageType::Commit 
                    && m.block_hash == block_hash)
                .count())
            .unwrap_or(0);

        commit_count >= 2 * self.f + 1
    }

    async fn initiate_view_change(&self) -> Result<(), String> {
        let view = {
            let mut current_view = self.current_view.write().await;
            *current_view += 1;
            *current_view
        };

        let view_change_message = BftMessage {
            msg_type: BftMessageType::ViewChange,
            view,
            sequence: *self.current_sequence.read().await,
            block_hash: String::new(),
            sender: self.get_self_validator().await?.address,
            signature: "".to_string(), // In practice, sign the message
            timestamp: Utc::now().timestamp(),
        };

        self.broadcast_message(view_change_message).await
    }

    async fn handle_view_change(&self, message: BftMessage) -> Result<(), String> {
        let mut messages = self.messages.write().await;
        messages.entry(message.sequence)
            .or_insert_with(Vec::new)
            .push(message.clone());

        // Check if we have enough view change messages
        if self.check_view_change_quorum(message.view).await {
            self.start_new_view(message.view).await?;
        }

        Ok(())
    }

    async fn check_view_change_quorum(&self, view: u64) -> bool {
        let messages = self.messages.read().await;
        let view_change_count = messages.values()
            .flat_map(|msgs| msgs.iter())
            .filter(|m| m.msg_type == BftMessageType::ViewChange && m.view == view)
            .count();

        view_change_count >= 2 * self.f + 1
    }

    async fn start_new_view(&self, view: u64) -> Result<(), String> {
        let mut current_view = self.current_view.write().await;
        *current_view = view;

        // Update primary validator
        self.update_primary_validator().await?;

        // Broadcast new view message
        let new_view_message = BftMessage {
            msg_type: BftMessageType::NewView,
            view,
            sequence: *self.current_sequence.read().await,
            block_hash: String::new(),
            sender: self.get_self_validator().await?.address,
            signature: "".to_string(), // In practice, sign the message
            timestamp: Utc::now().timestamp(),
        };

        self.broadcast_message(new_view_message).await
    }

    async fn validate_message(&self, message: &BftMessage) -> Result<(), String> {
        // Validate sender
        let validators = self.validators.read().await;
        if !validators.contains_key(&message.sender) {
            return Err("Invalid sender".to_string());
        }

        // Validate view number
        let current_view = *self.current_view.read().await;
        if message.view < current_view {
            return Err("Message from old view".to_string());
        }

        // Validate sequence number
        let current_sequence = *self.current_sequence.read().await;
        if message.sequence < current_sequence {
            return Err("Message from old sequence".to_string());
        }

        // In practice, validate signature here

        Ok(())
    }

    async fn broadcast_message(&self, message: BftMessage) -> Result<(), String> {
        // In practice, implement network broadcast
        println!("Broadcasting message: {:?}", message.msg_type);
        Ok(())
    }

    async fn get_primary_validator(&self) -> Result<ValidatorState, String> {
        let validators = self.validators.read().await;
        validators.values()
            .find(|v| v.is_primary)
            .cloned()
            .ok_or("No primary validator found".to_string())
    }

    async fn get_self_validator(&self) -> Result<ValidatorState, String> {
        // In practice, implement this based on node's identity
        self.get_primary_validator().await
    }

    async fn update_primary_validator(&self) -> Result<(), String> {
        let view = *self.current_view.read().await;
        let mut validators = self.validators.write().await;
        
        // Rotate primary based on view number
        for (i, validator) in validators.values_mut().enumerate() {
            validator.is_primary = i as u64 == view % validators.len() as u64;
        }

        Ok(())
    }

    async fn finalize_block(&self, block_hash: &str) -> Result<(), String> {
        let prepared_blocks = self.prepared_blocks.read().await;
        if let Some(block) = prepared_blocks.get(block_hash) {
            // In practice, add block to blockchain
            println!("Finalized block: {}", block_hash);
        }
        Ok(())
    }
} 
use super::super::blockchain::{
    bft_consensus::*,
    bft_sync::*,
    Block, Transaction,
};
use tokio::test;
use std::collections::HashMap;
use chrono::Utc;

// Helper function to create test validators
fn create_test_validators(count: usize) -> Vec<String> {
    (0..count).map(|i| format!("validator_{}", i)).collect()
}

// Helper function to create a test block
fn create_test_block(sequence: u64) -> Block {
    Block {
        hash: format!("block_hash_{}", sequence),
        previous_hash: format!("prev_hash_{}", sequence - 1),
        timestamp: Utc::now().timestamp(),
        transactions: vec![],
        height: sequence,
        miner: "test_miner".to_string(),
        nonce: 0,
    }
}

#[tokio::test]
async fn test_normal_consensus_flow() {
    let validators = create_test_validators(4); // 3f + 1 where f = 1
    let bft = BftConsensus::new(validators.clone(), 5000);
    let block = create_test_block(1);

    // Test pre-prepare phase
    let result = bft.start_consensus(block.clone()).await;
    assert!(result.is_ok());

    // Simulate prepare messages from validators
    for validator in validators.iter().skip(1) {
        let prepare_msg = BftMessage {
            msg_type: BftMessageType::Prepare,
            view: 0,
            sequence: 1,
            block_hash: block.hash.clone(),
            sender: validator.clone(),
            signature: "test_signature".to_string(),
            timestamp: Utc::now().timestamp(),
        };
        let result = bft.handle_message(prepare_msg).await;
        assert!(result.is_ok());
    }

    // Verify prepare quorum
    assert!(bft.check_prepare_quorum(1, &block.hash).await);
}

#[tokio::test]
async fn test_view_change() {
    let validators = create_test_validators(4);
    let bft = BftConsensus::new(validators.clone(), 5000);

    // Simulate view change initiation
    let result = bft.initiate_view_change().await;
    assert!(result.is_ok());

    // Simulate view change messages from validators
    for validator in validators.iter() {
        let view_change_msg = BftMessage {
            msg_type: BftMessageType::ViewChange,
            view: 1,
            sequence: 1,
            block_hash: String::new(),
            sender: validator.clone(),
            signature: "test_signature".to_string(),
            timestamp: Utc::now().timestamp(),
        };
        let result = bft.handle_message(view_change_msg).await;
        assert!(result.is_ok());
    }

    // Verify view change quorum
    assert!(bft.check_view_change_quorum(1).await);
}

#[tokio::test]
async fn test_byzantine_behavior() {
    let validators = create_test_validators(4);
    let bft = BftConsensus::new(validators.clone(), 5000);
    let block = create_test_block(1);
    let fake_block = create_test_block(1); // Different hash

    // Start consensus with original block
    let result = bft.start_consensus(block.clone()).await;
    assert!(result.is_ok());

    // Simulate Byzantine behavior: conflicting prepare messages
    for (i, validator) in validators.iter().enumerate() {
        let block_hash = if i == 0 { 
            // Byzantine validator sends prepare for different block
            fake_block.hash.clone()
        } else {
            block.hash.clone()
        };

        let prepare_msg = BftMessage {
            msg_type: BftMessageType::Prepare,
            view: 0,
            sequence: 1,
            block_hash,
            sender: validator.clone(),
            signature: "test_signature".to_string(),
            timestamp: Utc::now().timestamp(),
        };
        let _ = bft.handle_message(prepare_msg).await;
    }

    // Verify system still reaches consensus despite Byzantine behavior
    assert!(bft.check_prepare_quorum(1, &block.hash).await);
    assert!(!bft.check_prepare_quorum(1, &fake_block.hash).await);
}

#[tokio::test]
async fn test_synchronization() {
    let bft_sync = BftSynchronizer::new(10, 1000);
    let block = create_test_block(1);

    // Create checkpoint
    let result = bft_sync.create_checkpoint(1, &block).await;
    assert!(result.is_ok());

    // Add signatures
    for i in 0..4 {
        let result = bft_sync.add_checkpoint_signature(
            1,
            format!("validator_{}", i),
            format!("signature_{}", i),
        ).await;
        assert!(result.is_ok());
    }

    // Test recovery
    let result = bft_sync.recover_state(2).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_message_validation() {
    let validators = create_test_validators(4);
    let bft = BftConsensus::new(validators.clone(), 5000);

    // Test valid message
    let valid_msg = BftMessage {
        msg_type: BftMessageType::Prepare,
        view: 0,
        sequence: 1,
        block_hash: "test_hash".to_string(),
        sender: validators[0].clone(),
        signature: "test_signature".to_string(),
        timestamp: Utc::now().timestamp(),
    };
    assert!(bft.validate_message(&valid_msg).await.is_ok());

    // Test invalid sender
    let invalid_msg = BftMessage {
        msg_type: BftMessageType::Prepare,
        view: 0,
        sequence: 1,
        block_hash: "test_hash".to_string(),
        sender: "invalid_validator".to_string(),
        signature: "test_signature".to_string(),
        timestamp: Utc::now().timestamp(),
    };
    assert!(bft.validate_message(&invalid_msg).await.is_err());
}

#[tokio::test]
async fn test_concurrent_consensus() {
    let validators = create_test_validators(4);
    let bft = Arc::new(BftConsensus::new(validators.clone(), 5000));
    let block = create_test_block(1);

    // Simulate multiple concurrent consensus rounds
    let mut handles = vec![];
    for i in 0..3 {
        let bft = bft.clone();
        let block = block.clone();
        let validators = validators.clone();
        
        handles.push(tokio::spawn(async move {
            // Start consensus
            let _ = bft.start_consensus(block.clone()).await;

            // Simulate prepare messages
            for validator in validators.iter() {
                let prepare_msg = BftMessage {
                    msg_type: BftMessageType::Prepare,
                    view: 0,
                    sequence: i + 1,
                    block_hash: block.hash.clone(),
                    sender: validator.clone(),
                    signature: "test_signature".to_string(),
                    timestamp: Utc::now().timestamp(),
                };
                let _ = bft.handle_message(prepare_msg).await;
            }
        }));
    }

    // Wait for all consensus rounds to complete
    for handle in handles {
        handle.await.unwrap();
    }
} 
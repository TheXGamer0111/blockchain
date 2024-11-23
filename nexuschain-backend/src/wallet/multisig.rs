use super::Wallet;
use serde::{Serialize, Deserialize};
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultiSigWallet {
    pub address: String,
    pub owners: Vec<String>,
    pub required_signatures: usize,
    pub transactions: Vec<PendingTransaction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingTransaction {
    pub id: String,
    pub to: String,
    pub amount: f64,
    pub signatures: HashSet<String>,
    pub executed: bool,
}

impl MultiSigWallet {
    pub fn new(owners: Vec<String>, required_signatures: usize) -> Self {
        let address = format!("multisig_{}", uuid::Uuid::new_v4());
        MultiSigWallet {
            address,
            owners,
            required_signatures,
            transactions: Vec::new(),
        }
    }

    pub fn propose_transaction(&mut self, to: String, amount: f64) -> String {
        let tx_id = uuid::Uuid::new_v4().to_string();
        let transaction = PendingTransaction {
            id: tx_id.clone(),
            to,
            amount,
            signatures: HashSet::new(),
            executed: false,
        };
        self.transactions.push(transaction);
        tx_id
    }

    pub fn sign_transaction(&mut self, tx_id: &str, signer: &str) -> Result<bool, String> {
        if !self.owners.contains(&signer.to_string()) {
            return Err("Not an owner".to_string());
        }

        if let Some(tx) = self.transactions.iter_mut().find(|t| t.id == tx_id) {
            if tx.executed {
                return Err("Transaction already executed".to_string());
            }
            tx.signatures.insert(signer.to_string());
            Ok(tx.signatures.len() >= self.required_signatures)
        } else {
            Err("Transaction not found".to_string())
        }
    }
} 
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub sender: String,
    pub recipient: String,
    pub amount: f64,
    pub timestamp: i64,
    pub signature: Option<String>,
    pub hash: String,
}

impl Transaction {
    pub fn new(sender: String, recipient: String, amount: f64) -> Self {
        let timestamp = Utc::now().timestamp();
        let mut transaction = Transaction {
            sender,
            recipient,
            amount,
            timestamp,
            signature: None,
            hash: String::new(),
        };
        transaction.hash = transaction.calculate_hash();
        transaction
    }

    pub fn calculate_hash(&self) -> String {
        let mut hasher = Sha256::new();
        let data = format!(
            "{}{}{}{}",
            self.sender, self.recipient, self.amount, self.timestamp
        );
        hasher.update(data.as_bytes());
        hex::encode(hasher.finalize())
    }

    
    pub fn sign(&mut self, signature: String) {
        self.signature = Some(signature);
    }

    pub fn is_valid(&self) -> bool {
        self.hash == self.calculate_hash() && self.signature.is_some()
    }
}

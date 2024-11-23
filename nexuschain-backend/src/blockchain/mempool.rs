use super::Transaction;
use std::collections::{HashMap, BinaryHeap};
use std::cmp::Ordering;
use tokio::sync::RwLock;
use std::sync::Arc;

#[derive(Clone, Debug)]
struct MempoolTransaction {
    transaction: Transaction,
    fee: f64,
    timestamp: i64,
}

impl Ord for MempoolTransaction {
    fn cmp(&self, other: &Self) -> Ordering {
        self.fee.partial_cmp(&other.fee)
            .unwrap_or(Ordering::Equal)
            .reverse() // Higher fee = higher priority
    }
}

impl PartialOrd for MempoolTransaction {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for MempoolTransaction {
    fn eq(&self, other: &Self) -> bool {
        self.transaction.hash == other.transaction.hash
    }
}

impl Eq for MempoolTransaction {}

pub struct MempoolManager {
    transactions: Arc<RwLock<BinaryHeap<MempoolTransaction>>>,
    by_hash: Arc<RwLock<HashMap<String, MempoolTransaction>>>,
    max_size: usize,
    min_fee: f64,
}

impl MempoolManager {
    pub fn new(max_size: usize, min_fee: f64) -> Self {
        MempoolManager {
            transactions: Arc::new(RwLock::new(BinaryHeap::new())),
            by_hash: Arc::new(RwLock::new(HashMap::new())),
            max_size,
            min_fee,
        }
    }

    pub async fn add_transaction(&self, transaction: Transaction, fee: f64) -> Result<(), String> {
        if fee < self.min_fee {
            return Err("Fee too low".to_string());
        }

        let mempool_tx = MempoolTransaction {
            transaction: transaction.clone(),
            fee,
            timestamp: chrono::Utc::now().timestamp(),
        };

        let mut transactions = self.transactions.write().await;
        let mut by_hash = self.by_hash.write().await;

        if transactions.len() >= self.max_size {
            // Remove lowest fee transaction if mempool is full
            if let Some(lowest) = transactions.peek() {
                if lowest.fee >= fee {
                    return Err("Mempool full and fee too low".to_string());
                }
                if let Some(lowest) = transactions.pop() {
                    by_hash.remove(&lowest.transaction.hash);
                }
            }
        }

        transactions.push(mempool_tx.clone());
        by_hash.insert(transaction.hash.clone(), mempool_tx);

        Ok(())
    }

    pub async fn get_transactions(&self, limit: usize) -> Vec<Transaction> {
        let transactions = self.transactions.read().await;
        transactions.iter()
            .take(limit)
            .map(|tx| tx.transaction.clone())
            .collect()
    }

    pub async fn remove_transaction(&self, hash: &str) -> Option<Transaction> {
        let mut transactions = self.transactions.write().await;
        let mut by_hash = self.by_hash.write().await;

        by_hash.remove(hash).map(|tx| {
            let new_heap: BinaryHeap<_> = transactions
                .drain()
                .filter(|t| t.transaction.hash != hash)
                .collect();
            *transactions = new_heap;
            tx.transaction
        })
    }

    pub async fn clear(&self) {
        let mut transactions = self.transactions.write().await;
        let mut by_hash = self.by_hash.write().await;
        transactions.clear();
        by_hash.clear();
    }
} 
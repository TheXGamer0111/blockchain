use super::Wallet;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub wallet: Wallet,
    pub balance: f64,
    pub transactions: Vec<String>, // Transaction hashes
    pub tokens: HashMap<String, f64>, // Token address -> balance
}

pub struct AccountManager {
    accounts: Arc<RwLock<HashMap<String, Account>>>,
}

impl AccountManager {
    pub fn new() -> Self {
        AccountManager {
            accounts: Arc::new(RwLock::new(HashMap::new()))
        }
    }

    pub async fn create_account(&self) -> Account {
        let wallet = Wallet::new();
        let account = Account {
            wallet: wallet.clone(),
            balance: 0.0,
            transactions: Vec::new(),
            tokens: HashMap::new(),
        };

        let mut accounts = self.accounts.write().await;
        accounts.insert(wallet.get_address(), account.clone());
        account
    }

    pub async fn get_account(&self, address: &str) -> Option<Account> {
        let accounts = self.accounts.read().await;
        accounts.get(address).cloned()
    }

    pub async fn update_balance(&self, address: &str, new_balance: f64) {
        let mut accounts = self.accounts.write().await;
        if let Some(account) = accounts.get_mut(address) {
            account.balance = new_balance;
        }
    }

    pub async fn add_transaction(&self, address: &str, tx_hash: String) {
        let mut accounts = self.accounts.write().await;
        if let Some(account) = accounts.get_mut(address) {
            account.transactions.push(tx_hash);
        }
    }

    pub async fn update_token_balance(&self, address: &str, token_address: &str, balance: f64) {
        let mut accounts = self.accounts.write().await;
        if let Some(account) = accounts.get_mut(address) {
            account.tokens.insert(token_address.to_string(), balance);
        }
    }
}

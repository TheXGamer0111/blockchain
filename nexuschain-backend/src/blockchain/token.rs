use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Token {
    pub address: String,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: u64,
    pub owner: String,
}

#[derive(Debug)]
pub struct TokenManager {
    tokens: Arc<RwLock<HashMap<String, Token>>>,
    balances: Arc<RwLock<HashMap<String, HashMap<String, u64>>>>, // token -> (account -> balance)
}

impl TokenManager {
    pub fn new() -> Self {
        TokenManager {
            tokens: Arc::new(RwLock::new(HashMap::new())),
            balances: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn create_token(
        &self,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
        owner: String,
    ) -> Token {
        let token = Token {
            address: format!("token_{}", uuid::Uuid::new_v4()),
            name,
            symbol,
            decimals,
            total_supply,
            owner,
        };

        let mut tokens = self.tokens.write().await;
        tokens.insert(token.address.clone(), token.clone());

        let mut balances = self.balances.write().await;
        let mut token_balances = HashMap::new();
        token_balances.insert(owner, total_supply);
        balances.insert(token.address.clone(), token_balances);

        token
    }

    pub async fn transfer(
        &self,
        token_address: &str,
        from: &str,
        to: &str,
        amount: u64,
    ) -> Result<(), String> {
        let mut balances = self.balances.write().await;
        
        let token_balances = balances.get_mut(token_address)
            .ok_or("Token not found")?;

        let from_balance = token_balances.get(from)
            .ok_or("Sender has no balance")?;

        if *from_balance < amount {
            return Err("Insufficient balance".to_string());
        }

        *token_balances.get_mut(from).unwrap() -= amount;
        *token_balances.entry(to.to_string()).or_insert(0) += amount;

        Ok(())
    }

    pub async fn get_balance(&self, token_address: &str, account: &str) -> u64 {
        let balances = self.balances.read().await;
        balances
            .get(token_address)
            .and_then(|token_balances| token_balances.get(account))
            .copied()
            .unwrap_or(0)
    }
} 
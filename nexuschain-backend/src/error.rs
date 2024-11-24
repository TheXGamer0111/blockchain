#[derive(Debug, thiserror::Error)]
pub enum BlockchainError {
    #[error("Block validation failed: {0}")]
    ValidationError(String),
    
    #[error("Transaction error: {0}")]
    TransactionError(String),
    
    #[error("Database error: {0}")]
    DatabaseError(String),
    
    #[error("Network error: {0}")]
    NetworkError(String),
}

pub type BlockchainResult<T> = Result<T, BlockchainError>; 
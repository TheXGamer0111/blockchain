use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
    extract::State,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde_json::{json, Value};
use std::sync::Arc;
use crate::blockchain::Blockchain;
use crate::api::AppState;
use crate::blockchain::Transaction;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    println!("New WebSocket connection request received");
    ws.on_upgrade(|socket| handle_socket(socket, state.blockchain))
}

async fn handle_socket(mut socket: WebSocket, blockchain: Arc<Blockchain>) {
    println!("WebSocket connection established");

    // Send initial blockchain state
    let chain = blockchain.get_chain().await;
    let pending_transactions = blockchain.get_pending_transactions().await;
    let initial_state = json!({
        "type": "BLOCKCHAIN_STATE",
        "data": {
            "chainLength": chain.len(),
            "lastBlock": chain.last(),
            "difficulty": blockchain.get_difficulty(),
            "pendingTransactions": pending_transactions,
            "isMining": blockchain.is_mining().await
        }
    });

    if let Err(e) = socket.send(Message::Text(initial_state.to_string())).await {
        println!("Error sending initial state: {}", e);
        return;
    }

    // Send initial transaction state
    let transaction_update = json!({
        "type": "TRANSACTION_UPDATE",
        "data": {
            "pendingTransactions": pending_transactions.iter().map(|tx| {
                json!({
                    "hash": tx.hash,
                    "sender": tx.sender,
                    "recipient": tx.recipient,
                    "amount": tx.amount,
                    "timestamp": tx.timestamp,
                    "status": "pending"
                })
            }).collect::<Vec<_>>(),
            "timestamp": chrono::Utc::now().timestamp()
        }
    });

    if let Err(e) = socket.send(Message::Text(transaction_update.to_string())).await {
        println!("Error sending transaction update: {}", e);
        return;
    }

    let (mut sender, mut receiver) = socket.split();

    while let Some(msg) = receiver.next().await {
        if let Ok(msg) = msg {
            match msg {
                Message::Text(text) => {
                    if let Ok(json) = serde_json::from_str::<Value>(&text) {
                        match json.get("type").and_then(Value::as_str) {
                            Some("PING") => {
                                let pending_transactions = blockchain.get_pending_transactions().await;
                                let blockchain_state = json!({
                                    "type": "PONG",
                                    "timestamp": chrono::Utc::now().timestamp(),
                                    "data": {
                                        "chainLength": chain.len(),
                                        "lastBlock": chain.last(),
                                        "difficulty": blockchain.get_difficulty(),
                                        "pendingTransactions": pending_transactions,
                                        "isMining": blockchain.is_mining().await
                                    }
                                });
                                
                                if let Err(e) = sender.send(Message::Text(
                                    blockchain_state.to_string()
                                )).await {
                                    println!("Error sending blockchain state: {}", e);
                                    break;
                                }
                            },
                            Some("SUBSCRIBE_TRANSACTIONS") => {
                                let pending_transactions = blockchain.get_pending_transactions().await;
                                let transaction_update = json!({
                                    "type": "TRANSACTION_UPDATE",
                                    "data": {
                                        "pendingTransactions": pending_transactions.iter().map(|tx| {
                                            json!({
                                                "hash": tx.hash,
                                                "sender": tx.sender,
                                                "recipient": tx.recipient,
                                                "amount": tx.amount,
                                                "timestamp": tx.timestamp,
                                                "status": "pending"
                                            })
                                        }).collect::<Vec<_>>(),
                                        "timestamp": chrono::Utc::now().timestamp()
                                    }
                                });
                                
                                if let Err(e) = sender.send(Message::Text(
                                    transaction_update.to_string()
                                )).await {
                                    println!("Error sending transaction update: {}", e);
                                    break;
                                }
                            },
                            Some(msg_type) => {
                                println!("Received message type: {}", msg_type);
                            },
                            None => {
                                println!("Received message without type: {}", text);
                            }
                        }
                    }
                }
                Message::Close(_) => {
                    println!("Client disconnected");
                    break;
                }
                _ => {}
            }
        }
    }
}

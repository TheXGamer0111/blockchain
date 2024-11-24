use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
};
use futures::{sink::SinkExt, stream::StreamExt};
use std::sync::Arc;
use tokio::sync::broadcast;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    // Send a ping to confirm connection
    if let Err(e) = socket.send(Message::Text(String::from("Connected to Nexuschain WebSocket"))).await {
        println!("Error sending welcome message: {}", e);
        return;
    }

    let (mut sender, mut receiver) = socket.split();

    // Handle incoming messages
    while let Some(msg) = receiver.next().await {
        if let Ok(msg) = msg {
            match msg {
                Message::Text(text) => {
                    println!("Received message: {}", text);
                    // Echo the message back
                    if let Err(e) = sender.send(Message::Text(text)).await {
                        println!("Error sending message: {}", e);
                        break;
                    }
                }
                Message::Close(_) => {
                    break;
                }
                _ => {}
            }
        } else {
            println!("Error receiving message");
            break;
        }
    }
} 
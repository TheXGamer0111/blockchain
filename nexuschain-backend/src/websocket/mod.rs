use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde_json::{json, Value};

pub async fn ws_handler(
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    println!("New WebSocket connection request received");
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    println!("WebSocket connection established");

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
                    // Try to parse the message as JSON
                    if let Ok(json) = serde_json::from_str::<Value>(&text) {
                        match json.get("type").and_then(Value::as_str) {
                            Some("PING") => {
                                // Respond with PONG
                                if let Err(e) = sender.send(Message::Text(
                                    json!({
                                        "type": "PONG",
                                        "timestamp": chrono::Utc::now().timestamp()
                                    }).to_string()
                                )).await {
                                    println!("Error sending PONG: {}", e);
                                    break;
                                }
                            },
                            Some(msg_type) => {
                                println!("Received message type: {}", msg_type);
                                // Handle other message types here
                                if let Err(e) = sender.send(Message::Text(text)).await {
                                    println!("Error sending message: {}", e);
                                    break;
                                }
                            },
                            None => {
                                println!("Received message without type: {}", text);
                            }
                        }
                    } else {
                        println!("Received non-JSON message: {}", text);
                    }
                }
                Message::Close(_) => {
                    println!("Client disconnected");
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

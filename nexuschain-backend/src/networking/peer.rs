use serde::{Deserialize, Serialize};
use tokio::net::TcpStream;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use std::net::SocketAddr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub message_type: String,
    pub data: String,
}

#[derive(Debug)]
pub struct Peer {
    pub addr: SocketAddr,
    pub stream: TcpStream,
    pub is_active: bool,
}

impl Peer {
    pub async fn new(addr: SocketAddr, stream: TcpStream) -> Self {
        Peer {
            addr,
            stream,
            is_active: true,
        }
    }

    pub async fn send_message(&mut self, message: Message) -> Result<(), String> {
        let data = serde_json::to_string(&message)
            .map_err(|e| format!("Serialization error: {}", e))?;
        
        let len = (data.len() as u32).to_be_bytes();
        self.stream.write_all(&len).await
            .map_err(|e| format!("Write error: {}", e))?;
        
        self.stream.write_all(data.as_bytes()).await
            .map_err(|e| format!("Write error: {}", e))?;
        
        Ok(())
    }

    pub async fn receive_message(&mut self) -> Result<Option<Message>, String> {
        let mut len_bytes = [0u8; 4];
        match self.stream.read_exact(&mut len_bytes).await {
            Ok(_) => {},
            Err(_) => return Ok(None),
        }

        let len = u32::from_be_bytes(len_bytes) as usize;
        let mut buffer = vec![0u8; len];
        
        self.stream.read_exact(&mut buffer).await
            .map_err(|e| format!("Read error: {}", e))?;

        let message = String::from_utf8(buffer)
            .map_err(|e| format!("UTF-8 error: {}", e))?;

        let parsed_message = serde_json::from_str(&message)
            .map_err(|e| format!("Parse error: {}", e))?;

        Ok(Some(parsed_message))
    }
}

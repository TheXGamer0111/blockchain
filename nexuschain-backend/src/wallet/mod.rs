use sha2::{Sha256, Digest};
use secp256k1::{Secp256k1, SecretKey, PublicKey};
use rand::rngs::OsRng;
use rand::RngCore;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wallet {
    pub public_key: String,
    #[serde(skip_serializing)]
    private_key: SecretKey,
}

impl Wallet {
    pub fn new() -> Self {
        let secp = Secp256k1::signing_only();
        let mut rng = OsRng;
        let mut secret_key_bytes = [0u8; 32];
        rng.fill_bytes(&mut secret_key_bytes);
        let secret_key = SecretKey::from_slice(&secret_key_bytes)
            .expect("Failed to create secret key");
        let public_key = PublicKey::from_secret_key(&secp, &secret_key);

        Wallet {
            public_key: hex::encode(public_key.serialize()),
            private_key: secret_key,
        }
    }

    pub fn get_address(&self) -> String {
        let mut hasher = Sha256::new();
        hasher.update(hex::decode(&self.public_key).unwrap());
        hex::encode(hasher.finalize())
    }

    pub fn sign(&self, message: &str) -> String {
        let secp = Secp256k1::new();
        let mut hasher = Sha256::new();
        hasher.update(message.as_bytes());
        let message_hash = hasher.finalize();
        
        let message = secp256k1::Message::from_slice(&message_hash)
            .expect("Failed to create message");
        
        let signature = secp.sign_ecdsa(&message, &self.private_key);
        hex::encode(signature.serialize_compact())
    }

    pub fn verify(&self, message: &str, signature: &str) -> bool {
        let secp = Secp256k1::new();
        let mut hasher = Sha256::new();
        hasher.update(message.as_bytes());
        let message_hash = hasher.finalize();
        
        let message = secp256k1::Message::from_slice(&message_hash)
            .expect("Failed to create message");
        
        let public_key = PublicKey::from_slice(&hex::decode(&self.public_key).unwrap())
            .expect("Invalid public key");
        
        let signature = secp256k1::ecdsa::Signature::from_compact(
            &hex::decode(signature).unwrap()
        ).expect("Invalid signature");
        
        secp.verify_ecdsa(&message, &signature, &public_key).is_ok()
    }
}

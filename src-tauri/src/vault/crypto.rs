use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Nonce,
};
use rand::RngCore;

use crate::error::AppError;

const NONCE_SIZE: usize = 12;

pub fn encrypt_vault(master_key: &[u8; 32], plaintext: &[u8]) -> Result<Vec<u8>, AppError> {
    let cipher = ChaCha20Poly1305::new_from_slice(master_key)
        .map_err(|e| AppError::Vault(e.to_string()))?;

    let mut nonce_bytes = [0u8; NONCE_SIZE];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| AppError::Vault(e.to_string()))?;

    let mut result = nonce_bytes.to_vec();
    result.extend(ciphertext);
    Ok(result)
}

pub fn decrypt_vault(master_key: &[u8; 32], ciphertext: &[u8]) -> Result<Vec<u8>, AppError> {
    if ciphertext.len() < NONCE_SIZE {
        return Err(AppError::Vault("Invalid ciphertext".into()));
    }

    let cipher = ChaCha20Poly1305::new_from_slice(master_key)
        .map_err(|e| AppError::Vault(e.to_string()))?;

    let nonce = Nonce::from_slice(&ciphertext[..NONCE_SIZE]);
    let encrypted = &ciphertext[NONCE_SIZE..];

    cipher
        .decrypt(nonce, encrypted)
        .map_err(|e| AppError::Vault(e.to_string()))
}

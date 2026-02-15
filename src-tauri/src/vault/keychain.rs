use keyring::Entry;
use crate::AppError;

const SERVICE_NAME: &str = "ssh-terminal";

pub fn store_master_key(key: &[u8]) -> Result<(), AppError> {
    let entry = Entry::new(SERVICE_NAME, "master_key")
        .map_err(|e| AppError::Keychain(e.to_string()))?;

    let encoded = base64::engine::general_purpose::STANDARD.encode(key);
    entry
        .set_password(&encoded)
        .map_err(|e| AppError::Keychain(e.to_string()))
}

pub fn get_master_key() -> Result<[u8; 32], AppError> {
    let entry = Entry::new(SERVICE_NAME, "master_key")
        .map_err(|e| AppError::Keychain(e.to_string()))?;

    let encoded = entry
        .get_password()
        .map_err(|e| AppError::Keychain(e.to_string()))?;

    let decoded = base64::engine::general_purpose::STANDARD.decode(encoded)
        .map_err(|e| AppError::Keychain(e.to_string()))?;

    let mut key = [0u8; 32];
    if decoded.len() != 32 {
        return Err(AppError::Keychain("Invalid key length".into()));
    }
    key.copy_from_slice(&decoded);
    Ok(key)
}

pub fn delete_master_key() -> Result<(), AppError> {
    let entry = Entry::new(SERVICE_NAME, "master_key")
        .map_err(|e| AppError::Keychain(e.to_string()))?;

    entry
        .delete_credential()
        .map_err(|e| AppError::Keychain(e.to_string()))
}

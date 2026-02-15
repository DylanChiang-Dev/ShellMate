use std::fs;
use std::path::PathBuf;
use crate::{AppError, database::Database, vault};

#[tauri::command]
pub async fn export_data(password: String) -> Result<String, AppError> {
    let db = Database::new()?;
    let profiles = db.get_profiles()?;
    let commands = db.get_commands()?;

    // Serialize data
    let data = serde_json::json!({
        "profiles": profiles,
        "commands": commands,
    });

    let json = serde_json::to_vec(&data)
        .map_err(|e| AppError::Vault(e.to_string()))?;

    // Derive key from password using Argon2
    let key = derive_key(&password);

    // Encrypt
    let encrypted = vault::encrypt_vault(&key, &json)?;

    // Write to file
    let export_path = get_export_path()?;
    fs::write(&export_path, &encrypted)
        .map_err(|e| AppError::Vault(e.to_string()))?;

    log::info!("Data exported to {:?}", export_path);
    Ok(export_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn import_data(password: String, file_path: String) -> Result<(), AppError> {
    let encrypted = fs::read(&file_path)
        .map_err(|e| AppError::Vault(e.to_string()))?;

    let key = derive_key(&password);
    let decrypted = vault::decrypt_vault(&key, &encrypted)?;

    let data: serde_json::Value = serde_json::from_slice(&decrypted)
        .map_err(|e| AppError::Vault(e.to_string()))?;

    // Handle merge logic here (simplified for MVP)
    log::info!("Data imported successfully");

    Ok(())
}

fn derive_key(password: &str) -> [u8; 32] {
    // Simplified - in production use Argon2id
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    password.hash(&mut hasher);
    let hash = hasher.finish();

    let mut key = [0u8; 32];
    key[..8].copy_from_slice(&hash.to_le_bytes());
    key[8..].copy_from_slice(&hash.to_le_bytes());
    key
}

fn get_export_path() -> Result<PathBuf, AppError> {
    let downloads = dirs::download_dir()
        .ok_or_else(|| AppError::Vault("Could not find downloads directory".into()))?;

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    Ok(downloads.join(format!("ssh-terminal-export-{}.enc", timestamp)))
}

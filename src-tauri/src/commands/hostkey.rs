use crate::error::AppError;
use crate::database::Database;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostKeyInfo {
    pub host: String,
    pub port: u16,
    pub algo: String,
    pub fingerprint: String,
    pub first_seen_at: String,
}

#[tauri::command]
pub async fn get_host_key(host: String, port: u16) -> Result<Option<HostKeyInfo>, AppError> {
    let db = Database::new()?;

    match db.get_host_key(&host, port)? {
        Some(hk) => Ok(Some(HostKeyInfo {
            host: hk.host,
            port: hk.port,
            algo: hk.algo,
            fingerprint: hk.fingerprint,
            first_seen_at: hk.first_seen_at,
        })),
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn delete_host_key(host: String, port: u16) -> Result<(), AppError> {
    let db = Database::new()?;
    db.delete_host_key(&host, port)?;
    log::info!("Deleted host key for {}:{}", host, port);
    Ok(())
}

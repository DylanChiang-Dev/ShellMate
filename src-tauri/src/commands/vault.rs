use tauri::State;
use crate::{AppState, AppError, vault};

#[tauri::command]
pub async fn unlock_vault(state: State<'_, AppState>) -> Result<bool, AppError> {
    let _master_key = vault::get_master_key()?;
    let mut unlocked = state.vault_unlocked.lock().await;
    *unlocked = true;
    log::info!("Vault unlocked");
    Ok(true)
}

#[tauri::command]
pub async fn lock_vault(state: State<'_, AppState>) -> Result<bool, AppError> {
    let mut unlocked = state.vault_unlocked.lock().await;
    *unlocked = false;
    log::info!("Vault locked");
    Ok(true)
}

#[tauri::command]
pub async fn is_vault_unlocked(state: State<'_, AppState>) -> Result<bool, AppError> {
    let unlocked = state.vault_unlocked.lock().await;
    Ok(*unlocked)
}

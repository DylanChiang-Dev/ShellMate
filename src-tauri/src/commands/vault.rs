// Vault commands placeholder
use crate::error::AppError;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn unlock_vault(_password: String, _state: State<'_, AppState>) -> Result<bool, AppError> {
    Ok(false)
}

#[tauri::command]
pub async fn lock_vault(_state: State<'_, AppState>) -> Result<bool, AppError> {
    Ok(true)
}

#[tauri::command]
pub async fn is_vault_unlocked(_state: State<'_, AppState>) -> Result<bool, AppError> {
    Ok(false)
}

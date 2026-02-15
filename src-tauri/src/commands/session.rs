// Session commands placeholder
use crate::error::AppError;
use crate::state::{AppState, Session};
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn create_local_session(state: State<'_, AppState>) -> Result<Session, AppError> {
    let session = Session::new_local();
    let mut sessions = state.sessions.lock().await;
    sessions.insert(session.id, session.clone());
    Ok(session)
}

#[tauri::command]
pub async fn create_ssh_session(_profile_id: String, state: State<'_, AppState>) -> Result<Session, AppError> {
    let profile_uuid = Uuid::parse_str(&_profile_id).map_err(|e| AppError::ProfileNotFound(e.to_string()))?;
    let session = Session::new_ssh(profile_uuid);
    let mut sessions = state.sessions.lock().await;
    sessions.insert(session.id, session.clone());
    Ok(session)
}

#[tauri::command]
pub async fn close_session(_session_id: String, state: State<'_, AppState>) -> Result<bool, AppError> {
    let uuid = Uuid::parse_str(&_session_id).map_err(|e| AppError::SessionNotFound(e.to_string()))?;
    let mut sessions = state.sessions.lock().await;
    sessions.remove(&uuid);
    Ok(true)
}

#[tauri::command]
pub async fn send_input(_session_id: String, _input: String) -> Result<bool, AppError> {
    Ok(true)
}

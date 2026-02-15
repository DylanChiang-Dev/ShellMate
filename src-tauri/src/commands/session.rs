// Session commands placeholder
use tauri::State;
use uuid::Uuid;
use crate::{AppState, AppError, state::Session};

#[tauri::command]
pub async fn create_local_session(state: State<'_, AppState>) -> Result<String, AppError> {
    let session = Session::new_local();
    let id = session.id;

    let mut sessions = state.sessions.lock().await;
    sessions.insert(id, session);

    log::info!("Created local session: {}", id);
    Ok(id.to_string())
}

#[tauri::command]
pub async fn create_ssh_session(
    state: State<'_, AppState>,
    profile_id: String,
) -> Result<String, AppError> {
    let profile_uuid = Uuid::parse_str(&profile_id)
        .map_err(|_| AppError::ProfileNotFound(profile_id))?;

    let session = Session::new_ssh(profile_uuid);
    let id = session.id;

    let mut sessions = state.sessions.lock().await;
    sessions.insert(id, session);

    log::info!("Created SSH session: {}", id);
    Ok(id.to_string())
}

#[tauri::command]
pub async fn close_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), AppError> {
    let uuid = Uuid::parse_str(&session_id)
        .map_err(|_| AppError::SessionNotFound(session_id))?;

    let mut sessions = state.sessions.lock().await;
    sessions.remove(&uuid);

    log::info!("Closed session: {}", uuid);
    Ok(())
}

#[tauri::command]
pub async fn send_input(
    state: State<'_, AppState>,
    session_id: String,
    input: String,
) -> Result<(), AppError> {
    let uuid = Uuid::parse_str(&session_id)
        .map_err(|_| AppError::SessionNotFound(session_id.clone()))?;

    let sessions = state.sessions.lock().await;
    let _session = sessions.get(&uuid)
        .ok_or_else(|| AppError::SessionNotFound(session_id.clone()))?;

    // For now, this is a placeholder
    // Actual PTY/SSH channel writing happens here
    log::debug!("Sending input to session {}: {}", uuid, input);

    Ok(())
}

use tauri::State;
use uuid::Uuid;
use crate::{AppState, AppError, database::{Database, Profile, AuthMethod}};

#[tauri::command]
pub async fn create_profile(
    state: State<'_, AppState>,
    name: String,
    host: String,
    port: u16,
    username: String,
    auth_method: String,
) -> Result<Profile, AppError> {
    let db = Database::new()?;

    let auth = match auth_method.as_str() {
        "key" => AuthMethod::Key,
        "key_password" => AuthMethod::KeyPassword,
        _ => AuthMethod::Password,
    };

    let profile = Profile {
        id: Uuid::new_v4(),
        name,
        host,
        port,
        username,
        auth_method: auth,
        key_ref: None,
        password_ref: None,
    };

    db.create_profile(&profile)?;
    log::info!("Created profile: {}", profile.name);
    Ok(profile)
}

#[tauri::command]
pub async fn get_profiles() -> Result<Vec<Profile>, AppError> {
    let db = Database::new()?;
    db.get_profiles()
}

#[tauri::command]
pub async fn delete_profile(id: String) -> Result<(), AppError> {
    let uuid = Uuid::parse_str(&id).map_err(|_| AppError::ProfileNotFound(id.clone()))?;
    let db = Database::new()?;
    db.delete_profile(&uuid)?;
    log::info!("Deleted profile: {}", id);
    Ok(())
}

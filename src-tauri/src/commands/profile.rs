// Profile commands placeholder
use crate::error::AppError;

#[derive(serde::Serialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
}

#[tauri::command]
pub async fn create_profile(_name: String, _host: String, _port: u16, _username: String) -> Result<Profile, AppError> {
    Ok(Profile {
        id: "placeholder".to_string(),
        name: _name,
        host: _host,
        port: _port,
        username: _username,
    })
}

#[tauri::command]
pub async fn get_profiles() -> Result<Vec<Profile>, AppError> {
    Ok(vec![])
}

#[tauri::command]
pub async fn delete_profile(_id: String) -> Result<bool, AppError> {
    Ok(true)
}

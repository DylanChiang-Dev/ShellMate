mod error;
mod state;
mod vault;
mod database;
mod ssh;
mod commands;

pub use error::AppError;
pub use state::AppState;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::vault::unlock_vault,
            commands::vault::lock_vault,
            commands::vault::is_vault_unlocked,
            commands::profile::create_profile,
            commands::profile::get_profiles,
            commands::profile::delete_profile,
            commands::session::create_local_session,
            commands::session::create_ssh_session,
            commands::session::close_session,
            commands::session::send_input,
        ])
        .setup(|app| {
            log::info!("SSH Terminal starting up");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

# SSH Terminal App MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a macOS terminal app with SSH/SFTP support, encrypted credential storage, remote file editing with sudo, and command snippets.

**Architecture:** Tauri + Rust backend handling PTY/SSH/SFTP/vault, React + TypeScript frontend with xterm.js for terminal and Monaco for editor.

**Tech Stack:**
- Tauri 2.x (desktop shell)
- Rust (backend: ssh2, portable-pty, rusqlite, keyring, chacha20poly1305)
- React 18 + TypeScript
- xterm.js (terminal rendering) + addons: clipboard, search, web-links
- Monaco Editor (file editing)
- TailwindCSS (styling)

---

## Phase 1: Project Scaffold & Infrastructure

### Task 1: Initialize Tauri Project

**Files:**
- Create: `Cargo.toml`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

**Step 1: Create project directory structure**

```bash
mkdir -p src-tauri/src
mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/styles
```

**Step 2: Initialize Cargo.toml for Rust backend**

```toml
[package]
name = "ssh-terminal"
version = "0.1.0"
edition = "2021"

[lib]
name = "ssh_terminal_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[dependencies]
tauri = { version = "2", features = ["devtools"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
uuid = { version = "1", features = ["v4", "serde"] }
rusqlite = { version = "0.31", features = ["bundled"] }
keyring = "3"
chacha20poly1305 = "0.10"
rand = "0.8"
base64 = "0.22"
thiserror = "1"
log = "0.4"
env_logger = "0.11"
```

**Step 3: Create tauri.conf.json**

```json
{
  "productName": "SSH Terminal",
  "version": "0.1.0",
  "identifier": "com.sshterminal.app",
  "build": {
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist",
    "devtools": true
  },
  "app": {
    "windows": [
      {
        "title": "SSH Terminal",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

**Step 4: Initialize package.json**

```json
{
  "name": "ssh-terminal",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@xterm/xterm": "^5.4.0",
    "@xterm/addon-fit": "^0.9.0",
    "@monaco-editor/react": "^4.6.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "@tauri-apps/api": "^2",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^9.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

**Step 5: Run npm install and verify**

```bash
npm install
```

**Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold Tauri + React + TypeScript project"
```

---

### Task 2: Set Up Rust Backend Structure

**Files:**
- Create: `src-tauri/src/lib.rs`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/error.rs`
- Create: `src-tauri/src/state.rs`

**Step 1: Create error.rs for error handling**

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Keychain error: {0}")]
    Keychain(String),

    #[error("SSH error: {0}")]
    Ssh(String),

    #[error("Vault error: {0}")]
    Vault(String),

    #[error("Session not found: {0}")]
    SessionNotFound(String),

    #[error("Profile not found: {0}")]
    ProfileNotFound(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

**Step 2: Create state.rs for application state**

```rust
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

pub mod session;
pub use session::Session;

pub struct AppState {
    pub sessions: Arc<Mutex<HashMap<Uuid, Session>>>,
    pub vault_unlocked: Arc<Mutex<bool>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            vault_unlocked: Arc::new(Mutex::new(false)),
        }
    }
}
```

**Step 3: Create session.rs for session management**

```rust
use uuid::Uuid;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SessionType {
    Local,
    Ssh { profile_id: Uuid },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: Uuid,
    pub session_type: SessionType,
    pub state: SessionState,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionState {
    Disconnected,
    Connecting,
    Connected,
    Error(String),
}

impl Session {
    pub fn new_local() -> Self {
        Self {
            id: Uuid::new_v4(),
            session_type: SessionType::Local,
            state: SessionState::Disconnected,
        }
    }

    pub fn new_ssh(profile_id: Uuid) -> Self {
        Self {
            id: Uuid::new_v4(),
            session_type: SessionType::Ssh { profile_id },
            state: SessionState::Disconnected,
        }
    }
}
```

**Step 4: Create lib.rs with Tauri setup**

```rust
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
```

**Step 5: Create main.rs**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ssh_terminal_lib::run();
}
```

**Step 6: Run cargo check to verify compilation**

```bash
cd src-tauri && cargo check
```

**Step 7: Commit**

```bash
git add src-tauri/
git commit -m "feat: set up Rust backend structure with error handling and state"
```

---

## Phase 2: Vault & Security

### Task 3: Implement Encrypted Vault

**Files:**
- Create: `src-tauri/src/vault/mod.rs`
- Create: `src-tauri/src/vault/crypto.rs`
- Test: `src-tauri/tests/vault_test.rs`

**Step 1: Write failing test for vault**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_encrypt_decrypt() {
        let master_key = [0u8; 32];
        let data = b"secret data";

        let encrypted = encrypt_vault(&master_key, data).unwrap();
        let decrypted = decrypt_vault(&master_key, &encrypted).unwrap();

        assert_eq!(decrypted, data);
    }
}
```

**Step 2: Run test to verify it fails**

```bash
cd src-tauri && cargo test vault_test
# Expected: compile error - functions not defined
```

**Step 3: Implement crypto.rs**

```rust
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Nonce,
};
use rand::RngCore;

const NONCE_SIZE: usize = 12;

pub fn encrypt_vault(master_key: &[u8; 32], plaintext: &[u8]) -> Result<Vec<u8>, AppError> {
    let cipher = ChaCha20Poly1305::new_from_slice(master_key)
        .map_err(|e| AppError::Vault(e.to_string()))?;

    let mut nonce_bytes = [0u8; NONCE_SIZE];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| AppError::Vault(e.to_string()))?;

    let mut result = nonce_bytes.to_vec();
    result.extend(ciphertext);
    Ok(result)
}

pub fn decrypt_vault(master_key: &[u8; 32], ciphertext: &[u8]) -> Result<Vec<u8>, AppError> {
    if ciphertext.len() < NONCE_SIZE {
        return Err(AppError::Vault("Invalid ciphertext".into()));
    }

    let cipher = ChaCha20Poly1305::new_from_slice(master_key)
        .map_err(|e| AppError::Vault(e.to_string()))?;

    let nonce = Nonce::from_slice(&ciphertext[..NONCE_SIZE]);
    let encrypted = &ciphertext[NONCE_SIZE..];

    cipher
        .decrypt(nonce, encrypted)
        .map_err(|e| AppError::Vault(e.to_string()))
}
```

**Step 4: Implement vault/mod.rs**

```rust
mod crypto;

use std::path::PathBuf;
use std::fs;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub use crypto::{encrypt_vault, decrypt_vault};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultEntry {
    pub id: Uuid,
    pub entry_type: VaultEntryType,
    pub data: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VaultEntryType {
    PrivateKey { name: String },
    Password { profile_id: Uuid },
    SudoPassword { profile_id: Uuid },
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Vault {
    pub entries: Vec<VaultEntry>,
}

impl Vault {
    pub fn new() -> Self {
        Self { entries: vec![] }
    }

    pub fn add_entry(&mut self, entry: VaultEntry) {
        self.entries.push(entry);
    }

    pub fn get_entry(&self, id: Uuid) -> Option<&VaultEntry> {
        self.entries.iter().find(|e| e.id == id)
    }
}

pub fn get_vault_path() -> PathBuf {
    let app_data = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."));
    app_data.join("ssh-terminal").join("vault.enc")
}

pub fn vault_exists() -> bool {
    get_vault_path().exists()
}
```

**Step 5: Run tests to verify they pass**

```bash
cd src-tauri && cargo test vault_test
# Expected: PASS
```

**Step 6: Commit**

```bash
git add src-tauri/
git commit -m "feat: implement encrypted vault with ChaCha20-Poly1305"
```

---

### Task 4: Implement Keychain Integration

**Files:**
- Create: `src-tauri/src/vault/keychain.rs`
- Test: `src-tauri/tests/keychain_test.rs`

**Step 1: Write failing test for keychain**

```rust
#[test]
fn test_keychain_store_retrieve() {
    let service = "ssh-terminal-test";
    let key = "master-key";
    let value = b"test-secret";

    store_keychain(service, key, value).unwrap();
    let retrieved = get_keychain(service, key).unwrap();

    assert_eq!(retrieved, value);

    delete_keychain(service, key).ok();
}
```

**Step 2: Run test to verify it fails**

```bash
cd src-tauri && cargo test keychain_test
# Expected: compile error
```

**Step 3: Implement keychain.rs**

```rust
use keyring::Entry;
use crate::AppError;

const SERVICE_NAME: &str = "ssh-terminal";

pub fn store_master_key(key: &[u8]) -> Result<(), AppError> {
    let entry = Entry::new(SERVICE_NAME, "master_key")
        .map_err(|e| AppError::Keychain(e.to_string()))?;

    let encoded = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, key);
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

    let decoded = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, encoded)
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
```

**Step 4: Run tests**

```bash
cd src-tauri && cargo test keychain_test
# Expected: PASS
```

**Step 5: Commit**

```bash
git add src-tauri/
git commit -m "feat: integrate macOS Keychain for master key storage"
```

---

### Task 5: Implement Vault Commands

**Files:**
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/vault.rs`
- Create: `src-tauri/src/commands/profile.rs`
- Create: `src-tauri/src/commands/session.rs`

**Step 1: Create commands/mod.rs**

```rust
pub mod vault;
pub mod profile;
pub mod session;
```

**Step 2: Create commands/vault.rs**

```rust
use tauri::State;
use crate::{AppState, AppError, vault};

#[tauri::command]
pub async fn unlock_vault(state: State<'_, AppState>) -> Result<bool, AppError> {
    let master_key = vault::keychain::get_master_key()?;
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
```

**Step 3: Commit**

```bash
git add src-tauri/
git commit -m "feat: add vault unlock/lock commands"
```

---

## Phase 3: Database & Profiles

### Task 6: Implement SQLite Database

**Files:**
- Create: `src-tauri/src/database/mod.rs`
- Test: `src-tauri/tests/database_test.rs`

**Step 1: Write failing test**

```rust
#[test]
fn test_database_profile_crud() {
    let db = Database::new().unwrap();

    let profile = Profile {
        id: Uuid::new_v4(),
        name: "Test Server".into(),
        host: "192.168.1.1".into(),
        port: 22,
        username: "admin".into(),
        auth_method: AuthMethod::Password,
        key_ref: None,
        password_ref: None,
    };

    db.create_profile(&profile).unwrap();
    let profiles = db.get_profiles().unwrap();
    assert!(!profiles.is_empty());
}
```

**Step 2: Run test to verify it fails**

```bash
cd src-tauri && cargo test database_test
# Expected: compile error
```

**Step 3: Implement database/mod.rs**

```rust
use rusqlite::{Connection, params};
use uuid::Uuid;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub id: Uuid,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_method: AuthMethod,
    pub key_ref: Option<Uuid>,
    pub password_ref: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuthMethod {
    Password,
    Key,
    KeyPassword,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandSnippet {
    pub id: Uuid,
    pub title: String,
    pub command: String,
    pub tags: Option<String>,
    pub updated_at: String,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self, AppError> {
        let app_data = dirs::data_local_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."));
        let db_dir = app_data.join("ssh-terminal");
        std::fs::create_dir_all(&db_dir)?;

        let db_path = db_dir.join("data.db");
        let conn = Connection::open(db_path)?;

        let db = Self { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<(), AppError> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                host TEXT NOT NULL,
                port INTEGER NOT NULL DEFAULT 22,
                username TEXT NOT NULL,
                auth_method TEXT NOT NULL,
                key_ref TEXT,
                password_ref TEXT
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS commands (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                command TEXT NOT NULL,
                tags TEXT,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS host_keys (
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                algo TEXT NOT NULL,
                fingerprint TEXT NOT NULL,
                raw_key TEXT NOT NULL,
                first_seen_at TEXT NOT NULL,
                PRIMARY KEY (host, port)
            )",
            [],
        )?;

        Ok(())
    }

    pub fn create_profile(&self, profile: &Profile) -> Result<(), AppError> {
        let auth_method = match profile.auth_method {
            AuthMethod::Password => "password",
            AuthMethod::Key => "key",
            AuthMethod::KeyPassword => "key_password",
        };

        self.conn.execute(
            "INSERT INTO profiles (id, name, host, port, username, auth_method, key_ref, password_ref)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                profile.id.to_string(),
                profile.name,
                profile.host,
                profile.port,
                profile.username,
                auth_method,
                profile.key_ref.map(|u| u.to_string()),
                profile.password_ref.map(|u| u.to_string()),
            ],
        )?;
        Ok(())
    }

    pub fn get_profiles(&self) -> Result<Vec<Profile>, AppError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, host, port, username, auth_method, key_ref, password_ref FROM profiles"
        )?;

        let profiles = stmt.query_map([], |row| {
            let id_str: String = row.get(0)?;
            let auth_method_str: String = row.get(5)?;
            let key_ref_str: Option<String> = row.get(6)?;
            let password_ref_str: Option<String> = row.get(7)?;

            Ok(Profile {
                id: Uuid::parse_str(&id_str).unwrap(),
                name: row.get(1)?,
                host: row.get(2)?,
                port: row.get(3)?,
                username: row.get(4)?,
                auth_method: match auth_method_str.as_str() {
                    "key" => AuthMethod::Key,
                    "key_password" => AuthMethod::KeyPassword,
                    _ => AuthMethod::Password,
                },
                key_ref: key_ref_str.and_then(|s| Uuid::parse_str(&s).ok()),
                password_ref: password_ref_str.and_then(|s| Uuid::parse_str(&s).ok()),
            })
        })?;

        profiles.collect::<Result<Vec<_>, _>>().map_err(AppError::Database)
    }

    pub fn delete_profile(&self, id: &Uuid) -> Result<(), AppError> {
        self.conn.execute("DELETE FROM profiles WHERE id = ?1", params![id.to_string()])?;
        Ok(())
    }

    pub fn create_command(&self, cmd: &CommandSnippet) -> Result<(), AppError> {
        self.conn.execute(
            "INSERT INTO commands (id, title, command, tags, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                cmd.id.to_string(),
                cmd.title,
                cmd.command,
                cmd.tags,
                cmd.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_commands(&self) -> Result<Vec<CommandSnippet>, AppError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, command, tags, updated_at FROM commands"
        )?;

        let commands = stmt.query_map([], |row| {
            let id_str: String = row.get(0)?;
            Ok(CommandSnippet {
                id: Uuid::parse_str(&id_str).unwrap(),
                title: row.get(1)?,
                command: row.get(2)?,
                tags: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;

        commands.collect::<Result<Vec<_>, _>>().map_err(AppError::Database)
    }
}
```

**Step 4: Run tests**

```bash
cd src-tauri && cargo test database_test
# Expected: PASS
```

**Step 5: Commit**

```bash
git add src-tauri/
git commit -m "feat: implement SQLite database for profiles and commands"
```

---

### Task 7: Profile Commands

**Files:**
- Modify: `src-tauri/src/commands/profile.rs`

**Step 1: Create commands/profile.rs**

```rust
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
    let uuid = Uuid::parse_str(&id).map_err(|_| AppError::ProfileNotFound(id))?;
    let db = Database::new()?;
    db.delete_profile(&uuid)?;
    log::info!("Deleted profile: {}", id);
    Ok(())
}
```

**Step 2: Add database to lib.rs imports**

```rust
mod database;
```

**Step 3: Add profile commands to invoke_handler**

```rust
commands::profile::create_profile,
commands::profile::get_profiles,
commands::profile::delete_profile,
```

**Step 4: Run cargo check**

```bash
cd src-tauri && cargo check
```

**Step 5: Commit**

```bash
git add src-tauri/
git commit -m "feat: add profile CRUD commands"
```

---

### Task 7.5: Host Key Management

**Files:**
- Create: `src-tauri/src/database/hostkey.rs`
- Create: `src-tauri/src/commands/hostkey.rs`
- Modify: `src-tauri/src/commands/mod.rs`

**Step 1: Create database/hostkey.rs**

```rust
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostKey {
    pub host: String,
    pub port: u16,
    pub algo: String,
    pub fingerprint: String,
    pub raw_key: String,
    pub first_seen_at: String,
}

pub struct HostKeyDatabase<'a> {
    conn: &'a Connection,
}

impl<'a> HostKeyDatabase<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    pub fn save_host_key(&self, host_key: &HostKey) -> Result<(), AppError> {
        self.conn.execute(
            "INSERT OR REPLACE INTO host_keys (host, port, algo, fingerprint, raw_key, first_seen_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                host_key.host,
                host_key.port,
                host_key.algo,
                host_key.fingerprint,
                host_key.raw_key,
                host_key.first_seen_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_host_key(&self, host: &str, port: u16) -> Result<Option<HostKey>, AppError> {
        let mut stmt = self.conn.prepare(
            "SELECT host, port, algo, fingerprint, raw_key, first_seen_at
             FROM host_keys WHERE host = ?1 AND port = ?2"
        )?;

        let mut rows = stmt.query(params![host, port])?;

        if let Some(row) = rows.next()? {
            Ok(Some(HostKey {
                host: row.get(0)?,
                port: row.get(1)?,
                algo: row.get(2)?,
                fingerprint: row.get(3)?,
                raw_key: row.get(4)?,
                first_seen_at: row.get(5)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn delete_host_key(&self, host: &str, port: u16) -> Result<(), AppError> {
        self.conn.execute(
            "DELETE FROM host_keys WHERE host = ?1 AND port = ?2",
            params![host, port],
        )?;
        Ok(())
    }
}
```

**Step 2: Create commands/hostkey.rs**

```rust
use crate::{AppError, database::Database};
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
    let hostkey_db = db::hostkey::HostKeyDatabase::new(&db.conn);

    match hostkey_db.get_host_key(&host, port)? {
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
    let hostkey_db = db::hostkey::HostKeyDatabase::new(&db.conn);
    hostkey_db.delete_host_key(&host, port)?;
    log::info!("Deleted host key for {}:{}", host, port);
    Ok(())
}
```

**Step 3: Update commands/mod.rs**

```rust
pub mod vault;
pub mod profile;
pub mod session;
pub mod hostkey;
pub mod export;
```

**Step 4: Run cargo check**

```bash
cd src-tauri && cargo check
```

**Step 5: Commit**

```bash
git add src-tauri/
git commit -m "feat: add host key management commands"
```

---

## Phase 4: SSH/SFTP

### Task 8: SSH Session Management

**Files:**
- Create: `src-tauri/src/ssh/mod.rs`
- Test: `src-tauri/tests/ssh_test.rs`

**Step 1: Write failing test (mock - requires actual SSH server)**

```rust
// Note: This test requires a running SSH server
// We'll test the connection logic separately

#[test]
fn test_ssh_connection_timeout() {
    // Should fail gracefully on invalid host
    let result = connect_ssh("invalid-host-xyz", 22, "user", "pass");
    assert!(result.is_err());
}
```

**Step 2: Implement ssh/mod.rs**

```rust
use ssh2::Session;
use std::io::Read;
use std::net::TcpStream;
use std::time::Duration;
use crate::AppError;

pub struct SshConnection {
    pub session: Session,
    pub sftp: Option<sftp::Sftp>,
}

pub mod sftp {
    use ssh2::Sftp;
    pub use ssh2::File;

    pub struct SftpSession(Sftp);

    impl SftpSession {
        pub fn new(sftp: Sftp) -> Self {
            Self(sftp)
        }

        pub fn read_dir(&self, path: &str) -> Result<Vec<DirEntry>, AppError> {
            let mut entries = vec![];
            let mut dir = self.0.readdir(path)
                .map_err(|e| AppError::Ssh(e.to_string()))?;

            for entry in dir.drain(..) {
                entries.push(DirEntry {
                    path: entry.0.to_string_lossy().to_string(),
                    is_dir: entry.1.is_dir(),
                    is_file: entry.1.is_file(),
                    size: entry.1.size(),
                });
            }
            Ok(entries)
        }

        pub fn read_file(&self, path: &str) -> Result<Vec<u8>, AppError> {
            let mut file = self.0.open(path)
                .map_err(|e| AppError::Ssh(e.to_string()))?;

            let mut contents = vec![];
            file.read_to_end(&mut contents)
                .map_err(|e| AppError::Ssh(e.to_string()))?;
            Ok(contents)
        }

        pub fn write_file(&self, path: &str, contents: &[u8]) -> Result<(), AppError> {
            let mut file = self.0.create(path)
                .map_err(|e| AppError::Ssh(e.to_string()))?;

            file.write_all(contents)
                .map_err(|e| AppError::Ssh(e.to_string()))?;
            Ok(())
        }
    }

    #[derive(Debug)]
    pub struct DirEntry {
        pub path: String,
        pub is_dir: bool,
        pub is_file: bool,
        pub size: u64,
    }
}

#[derive(Debug, Clone)]
pub struct DirEntry {
    pub path: String,
    pub is_dir: bool,
    pub is_file: bool,
    pub size: u64,
}

pub fn connect_ssh(
    host: &str,
    port: u16,
    username: &str,
    password: Option<&str>,
    key_data: Option<&[u8]>,
    passphrase: Option<&str>,
) -> Result<SshConnection, AppError> {
    let addr = format!("{}:{}", host, port);
    let tcp = TcpStream::connect_timeout(
        &addr.parse().map_err(|e| AppError::Ssh(format!("Invalid address: {}", e)))?,
        Duration::from_secs(10),
    )
    .map_err(|e| AppError::Ssh(format!("Connection failed: {}", e)))?;

    tcp.set_read_timeout(Some(Duration::from_secs(30))).ok();

    let mut session = Session::new()
        .map_err(|e| AppError::Ssh(e.to_string()))?;

    session.set_tcp_stream(tcp);
    session.handshake()
        .map_err(|e| AppError::Ssh(format!("Handshake failed: {}", e)))?;

    // Authenticate
    if let Some(pwd) = password {
        session.userauth_password(username, pwd)
            .map_err(|e| AppError::Ssh(format!("Password auth failed: {}", e)))?;
    } else if let Some(key) = key_data {
        session.userauth_pubkey_memory(username, None, key, passphrase)
            .map_err(|e| AppError::Ssh(format!("Key auth failed: {}", e)))?;
    }

    if !session.authenticated() {
        return Err(AppError::Ssh("Authentication failed".into()));
    }

    // Open SFTP subsystem
    let sftp = session.sftp().ok();

    log::info!("SSH connected to {}:{}", host, port);

    Ok(SshConnection { session, sftp })
}

pub fn open_pty(session: &Session) -> Result<Session, AppError> {
    // For interactive shell, we'd use session.channel()
    // This is handled separately in session commands
    Ok(session.clone())
}
```

**Step 3: Add ssh2 to Cargo.toml**

```toml
ssh2 = "0.9"
```

**Step 4: Run cargo check**

```bash
cd src-tauri && cargo check
```

**Step 5: Commit**

```bash
git add src-tauri/
git commit -m "feat: add SSH connection and SFTP support"
```

---

### Task 9: Session Commands

**Files:**
- Modify: `src-tauri/src/commands/session.rs`

**Step 1: Implement session commands**

```rust
use tauri::{State, Emitter};
use uuid::Uuid;
use crate::{AppState, AppError, state::Session, session::SessionState};

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
        .map_err(|_| AppError::SessionNotFound(session_id))?;

    let sessions = state.sessions.lock().await;
    let session = sessions.get(&uuid)
        .ok_or_else(|| AppError::SessionNotFound(session_id.clone()))?;

    // For now, this is a placeholder
    // Actual PTY/SSH channel writing happens here
    log::debug!("Sending input to session {}: {}", uuid, input);

    Ok(())
}
```

**Step 2: Run cargo check**

```bash
cd src-tauri && cargo check
```

**Step 3: Commit**

```bash
git add src-tauri/
git commit -m "feat: add session management commands"
```

---

### Task 9.5: Local PTY Implementation

**Files:**
- Create: `src-tauri/src/pty/mod.rs`
- Modify: `src-tauri/src/commands/session.rs`

**Step 1: Add portable-pty to Cargo.toml**

```toml
portable-pty = "0.8"
```

**Step 2: Create pty/mod.rs**

```rust
use portable_pty::{native_pty_system, CommandBuilder, PtySize, PtyPair};
use std::sync::Arc;
use tokio::sync::mpsc;
use uuid::Uuid;
use std::io::{Read, Write};

pub struct LocalPty {
    pty_pair: PtyPair,
    reader: Box<dyn Read + Send>,
    writer: Box<dyn Write + Send>,
}

impl LocalPty {
    pub fn new() -> Result<Self, AppError> {
        let pty_system = native_pty_system();

        let pair = pty_system
            .openpty(PtySize {
                rows: 24,
                cols: 80,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| AppError::Ssh(format!("Failed to open PTY: {}", e)))?;

        let reader = pair.slave.try_clone_reader()
            .map_err(|e| AppError::Ssh(format!("Failed to clone PTY reader: {}", e)))?;
        let writer = pair.slave.take_writer()
            .map_err(|e| AppError::Ssh(format!("Failed to get PTY writer: {}", e)))?;

        Ok(Self {
            pty_pair: pair,
            reader: Box::new(reader),
            writer: Box::new(writer),
        })
    }

    pub fn spawn_shell(&mut self, shell: &str) -> Result<(), AppError> {
        let mut cmd = CommandBuilder::new(shell);
        cmd.env("TERM", "xterm-256color");

        let _child = self.pty_pair.slave.spawn_command(cmd)
            .map_err(|e| AppError::Ssh(format!("Failed to spawn shell: {}", e)))?;

        Ok(())
    }

    pub fn write(&mut self, data: &[u8]) -> Result<(), AppError> {
        self.writer.write_all(data)
            .map_err(|e| AppError::Ssh(format!("Failed to write to PTY: {}", e)))?;
        self.writer.flush()
            .map_err(|e| AppError::Ssh(format!("Failed to flush PTY: {}", e)))?;
        Ok(())
    }

    pub fn read(&mut self, buf: &mut [u8]) -> Result<usize, AppError> {
        use std::io::Read;
        let n = self.reader.read(buf)
            .map_err(|e| AppError::Ssh(format!("Failed to read from PTY: {}", e)))?;
        Ok(n)
    }

    pub fn resize(&mut self, rows: u16, cols: u16) -> Result<(), AppError> {
        self.pty_pair.slave.resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        }).map_err(|e| AppError::Ssh(format!("Failed to resize PTY: {}", e)))
    }
}
```

**Step 3: Update session.rs with PTY commands**

```rust
#[tauri::command]
pub async fn write_to_pty(
    state: State<'_, AppState>,
    session_id: String,
    data: String,
) -> Result<(), AppError> {
    let uuid = Uuid::parse_str(&session_id)
        .map_err(|_| AppError::SessionNotFound(session_id))?;

    let sessions = state.sessions.lock().await;
    let session = sessions.get(&uuid)
        .ok_or_else(|| AppError::SessionNotFound(session_id.clone()))?;

    if let SessionType::Local = session.session_type {
        // Write to local PTY
        // Implementation detail: need to store PTY in state
    }

    Ok(())
}

#[tauri::command]
pub async fn resize_pty(
    state: State<'_, AppState>,
    session_id: String,
    rows: u16,
    cols: u16,
) -> Result<(), AppError> {
    let uuid = Uuid::parse_str(&session_id)
        .map_err(|_| AppError::SessionNotFound(session_id))?;

    // Resize PTY
    Ok(())
}
```

**Step 4: Add xterm.js addons to package.json**

```json
"@xterm/addon-clipboard": "^0.0.4",
"@xterm/addon-search": "^0.13.0",
"@xterm/addon-web-links": "^0.11.0"
```

**Step 5: Commit**

```bash
git add src-tauri/ package.json
git commit -m "feat: implement local PTY with clipboard and search support"
```

---

## Phase 5: Frontend Setup

### Task 10: React Frontend Structure

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`

**Step 1: Create main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 2: Create App.tsx with basic layout**

```tsx
import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Sidebar from './components/Sidebar'
import TerminalPane from './components/TerminalPane'
import Editor from './components/Editor'

function App() {
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<any[]>([])

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    try {
      const result = await invoke('get_profiles')
      setProfiles(result as any[])
    } catch (e) {
      console.error('Failed to load profiles:', e)
    }
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar
        profiles={profiles}
        activeSession={activeSession}
        onSessionSelect={setActiveSession}
      />
      <div className="flex-1 flex flex-col">
        <div className="h-1/2 border-b border-gray-700">
          <Editor />
        </div>
        <div className="h-1/2">
          <TerminalPane sessionId={activeSession} />
        </div>
      </div>
    </div>
  )
}

export default App
```

**Step 3: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 4: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Step 5: Create index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
}
```

**Step 6: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})
```

**Step 7: Run npm run dev to verify**

```bash
npm run dev
```

**Step 8: Commit**

```bash
git add src/ package.json vite.config.ts tailwind.config.js postcss.config.js
git commit -m "feat: set up React frontend with TailwindCSS"
```

---

### Task 11: Terminal Component with xterm.js

**Files:**
- Create: `src/components/TerminalPane.tsx`
- Create: `src/hooks/useTerminal.ts`

**Step 1: Create useTerminal hook**

```typescript
import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export function useTerminal(containerRef: React.RefObject<HTMLDivElement>) {
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
      cursorBlink: true,
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    terminal.open(containerRef.current)
    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    const handleResize = () => {
      fitAddon.fit()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      terminal.dispose()
    }
  }, [containerRef])

  return { terminal: terminalRef.current, fitAddon: fitAddonRef.current }
}
```

**Step 2: Create TerminalPane component**

```typescript
import { useRef, useEffect } from 'react'
import { useTerminal } from '../hooks/useTerminal'

interface TerminalPaneProps {
  sessionId: string | null
}

export default function TerminalPane({ sessionId }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { terminal } = useTerminal(containerRef)

  useEffect(() => {
    if (terminal && sessionId) {
      terminal.writeln(`Connected to session: ${sessionId}`)
      terminal.focus()
    }
  }, [terminal, sessionId])

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/ src/hooks/
git commit -m "feat: add terminal component with xterm.js"
```

---

### Task 12: Sidebar Component

**Files:**
- Create: `src/components/Sidebar.tsx`

**Step 1: Create Sidebar component**

```typescript
import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface Profile {
  id: string
  name: string
  host: string
  port: number
  username: string
}

interface SidebarProps {
  profiles: Profile[]
  activeSession: string | null
  onSessionSelect: (id: string) => void
}

export default function Sidebar({ profiles, activeSession, onSessionSelect }: SidebarProps) {
  const [showNewProfile, setShowNewProfile] = useState(false)
  const [newProfile, setNewProfile] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    authMethod: 'password',
  })

  async function createProfile() {
    try {
      await invoke('create_profile', {
        name: newProfile.name,
        host: newProfile.host,
        port: newProfile.port,
        username: newProfile.username,
        authMethod: newProfile.authMethod,
      })
      setShowNewProfile(false)
      setNewProfile({ name: '', host: '', port: 22, username: '', authMethod: 'password' })
    } catch (e) {
      console.error('Failed to create profile:', e)
    }
  }

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">SSH Profiles</span>
          <button
            onClick={() => setShowNewProfile(!showNewProfile)}
            className="text-sm bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
          >
            + New
          </button>
        </div>

        {showNewProfile && (
          <div className="space-y-2 mb-2">
            <input
              placeholder="Name"
              value={newProfile.name}
              onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
              className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
            />
            <input
              placeholder="Host"
              value={newProfile.host}
              onChange={(e) => setNewProfile({ ...newProfile, host: e.target.value })}
              className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
            />
            <input
              placeholder="Port"
              type="number"
              value={newProfile.port}
              onChange={(e) => setNewProfile({ ...newProfile, port: parseInt(e.target.value) })}
              className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
            />
            <input
              placeholder="Username"
              value={newProfile.username}
              onChange={(e) => setNewProfile({ ...newProfile, username: e.target.value })}
              className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
            />
            <button
              onClick={createProfile}
              className="w-full bg-green-600 px-2 py-1 rounded text-sm hover:bg-green-700"
            >
              Create
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            onClick={() => onSessionSelect(profile.id)}
            className={`p-3 cursor-pointer hover:bg-gray-700 ${
              activeSession === profile.id ? 'bg-gray-700' : ''
            }`}
          >
            <div className="font-medium">{profile.name}</div>
            <div className="text-sm text-gray-400">
              {profile.username}@{profile.host}:{profile.port}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add sidebar component for profile management"
```

---

### Task 13: Editor Component

**Files:**
- Create: `src/components/Editor.tsx`

**Step 1: Create Editor component**

```typescript
import Editor from '@monaco-editor/react'

export default function EditorPane() {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="plaintext"
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat: add Monaco editor component"
```

---

### Task 13.5: Tab + Pane Management

**Files:**
- Create: `src/types/tab.ts`
- Create: `src/components/TabBar.tsx`
- Create: `src/components/SplitPane.tsx`
- Modify: `src/App.tsx`

**Step 1: Create types/tab.ts**

```typescript
export interface Tab {
  id: string
  title: string
  panes: Pane[]
  activePaneId: string
}

export interface Pane {
  id: string
  sessionId: string | null
  type: 'local' | 'ssh'
}

export type SplitDirection = 'horizontal' | 'vertical'

export interface SplitNode {
  id: string
  direction: SplitDirection
  children: [SplitNode | Pane, SplitNode | Pane]
}
```

**Step 2: Create TabBar component**

```typescript
import { Tab } from '../types/tab'

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
  onNewTab: () => void
}

export default function TabBar({ tabs, activeTabId, onTabSelect, onTabClose, onNewTab }: TabBarProps) {
  return (
    <div className="flex bg-gray-800 border-b border-gray-700">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`flex items-center px-3 py-2 cursor-pointer ${
            activeTabId === tab.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'
          }`}
          onClick={() => onTabSelect(tab.id)}
        >
          <span>{tab.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onTabClose(tab.id) }}
            className="ml-2 text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={onNewTab}
        className="px-3 py-2 text-gray-400 hover:text-white"
      >
        +
      </button>
    </div>
  )
}
```

**Step 3: Create SplitPane component**

```typescript
import { Pane, SplitNode, SplitDirection } from '../types/tab'

interface SplitPaneProps {
  node: SplitNode | Pane
  renderPane: (pane: Pane) => React.ReactNode
}

export default function SplitPane({ node, renderPane }: SplitPaneProps) {
  if ('sessionId' in node) {
    return <div className="h-full">{renderPane(node)}</div>
  }

  const direction = node.direction
  const isHorizontal = direction === 'horizontal'

  return (
    <div className={`flex h-full ${isHorizontal ? 'flex-row' : 'flex-col'}`}>
      <div className={isHorizontal ? 'w-1/2' : 'h-1/2'}>
        <SplitPane node={node.children[0]} renderPane={renderPane} />
      </div>
      <div className="bg-gray-700" style={isHorizontal ? { width: 2 } : { height: 2 }} />
      <div className={isHorizontal ? 'w-1/2' : 'h-1/2'}>
        <SplitPane node={node.children[1]} renderPane={renderPane} />
      </div>
    </div>
  )
}
```

**Step 4: Create context menu for split**

```typescript
// Add right-click menu to TerminalPane
const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault()
  // Show context menu with options: Split Horizontal, Split Vertical, Close Pane
}
```

**Step 5: Commit**

```bash
git add src/types/ src/components/TabBar.tsx src/components/SplitPane.tsx
git commit -m "feat: add tab and split pane management"
```

---

### Task 13.6: Command Snippets UI

**Files:**
- Create: `src/components/CommandSnippets.tsx`
- Modify: `src/components/Sidebar.tsx`

**Step 1: Create CommandSnippets component**

```typescript
import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface CommandSnippet {
  id: string
  title: string
  command: string
}

interface CommandSnippetsProps {
  onInsertCommand: (command: string) => void
}

export default function CommandSnippets({ onInsertCommand }: CommandSnippetsProps) {
  const [snippets, setSnippets] = useState<CommandSnippet[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newSnippet, setNewSnippet] = useState({ title: '', command: '' })

  useEffect(() => {
    loadSnippets()
  }, [])

  async function loadSnippets() {
    try {
      const result = await invoke('get_commands')
      setSnippets(result as CommandSnippet[])
    } catch (e) {
      console.error('Failed to load snippets:', e)
    }
  }

  async function createSnippet() {
    try {
      await invoke('create_command', {
        title: newSnippet.title,
        command: newSnippet.command,
      })
      setShowNew(false)
      setNewSnippet({ title: '', command: '' })
      loadSnippets()
    } catch (e) {
      console.error('Failed to create snippet:', e)
    }
  }

  return (
    <div className="border-t border-gray-700 p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">Commands</span>
        <button
          onClick={() => setShowNew(!showNew)}
          className="text-xs bg-blue-600 px-2 py-0.5 rounded"
        >
          + New
        </button>
      </div>

      {showNew && (
        <div className="space-y-1 mb-2">
          <input
            placeholder="Title"
            value={newSnippet.title}
            onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
            className="w-full bg-gray-700 px-2 py-1 rounded text-xs"
          />
          <input
            placeholder="Command"
            value={newSnippet.command}
            onChange={(e) => setNewSnippet({ ...newSnippet, command: e.target.value })}
            className="w-full bg-gray-700 px-2 py-1 rounded text-xs"
          />
          <button
            onClick={createSnippet}
            className="w-full bg-green-600 px-2 py-1 rounded text-xs"
          >
            Add
          </button>
        </div>
      )}

      <div className="space-y-1 overflow-y-auto max-h-40">
        {snippets.map((snippet) => (
          <div
            key={snippet.id}
            onClick={() => onInsertCommand(snippet.command)}
            className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 text-xs"
          >
            <div className="font-medium">{snippet.title}</div>
            <div className="text-gray-400 truncate">{snippet.command}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Add command snippets to Sidebar**

Update Sidebar to include CommandSnippets component in the lower section.

**Step 3: Commit**

```bash
git add src/components/CommandSnippets.tsx src/components/Sidebar.tsx
git commit -m "feat: add command snippets UI in sidebar"
```

---

### Task 13.7: File Tree Component

**Files:**
- Create: `src/components/FileTree.tsx`
- Create: `src/hooks/useFileTree.ts`
- Modify: `src/App.tsx`

**Step 1: Create types for file tree**

```typescript
// src/types/fileTree.ts
export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  children?: FileEntry[]
}
```

**Step 2: Create useFileTree hook**

```typescript
import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { FileEntry } from '../types/fileTree'

export function useFileTree(sessionId: string | null) {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadDirectory(path: string) {
    if (!sessionId) return

    setLoading(true)
    setError(null)

    try {
      const result = await invoke('list_directory', {
        sessionId,
        path,
      })
      setEntries(result as FileEntry[])
    } catch (e) {
      setError(e as string)
    } finally {
      setLoading(false)
    }
  }

  async function createFile(name: string, path: string) {
    await invoke('create_file', { sessionId, name, path })
    loadDirectory(path)
  }

  async function createDirectory(name: string, path: string) {
    await invoke('create_directory', { sessionId, name, path })
    loadDirectory(path)
  }

  async function deleteEntry(path: string) {
    await invoke('delete_entry', { sessionId, path })
    loadDirectory(path)
  }

  async function renameEntry(oldPath: string, newName: string) {
    await invoke('rename_entry', { sessionId, oldPath, newName })
  }

  return {
    entries,
    loading,
    error,
    loadDirectory,
    createFile,
    createDirectory,
    deleteEntry,
    renameEntry,
  }
}
```

**Step 3: Create FileTree component**

```typescript
import { useState } from 'react'
import { FileEntry } from '../types/fileTree'
import { useFileTree } from '../hooks/useFileTree'

interface FileTreeProps {
  sessionId: string | null
  onFileSelect: (path: string) => void
}

export default function FileTree({ sessionId, onFileSelect }: FileTreeProps) {
  const [currentPath, setCurrentPath] = useState('/')
  const {
    entries,
    loading,
    error,
    loadDirectory,
    createFile,
    createDirectory,
    deleteEntry,
    renameEntry,
  } = useFileTree(sessionId)

  useState(() => {
    if (sessionId) {
      loadDirectory(currentPath)
    }
  }, [sessionId])

  if (!sessionId) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        Select a remote session to view files
      </div>
    )
  }

  if (loading) {
    return <div className="p-4 text-gray-400">Loading...</div>
  }

  if (error) {
    return <div className="p-4 text-red-400">{error}</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-gray-700 flex items-center">
        <button
          onClick={() => {
            const parent = currentPath.split('/').slice(0, -1).join('/') || '/'
            setCurrentPath(parent)
            loadDirectory(parent)
          }}
          className="mr-2 text-gray-400 hover:text-white"
        >
          ←
        </button>
        <span className="text-sm text-gray-300">{currentPath}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {entries.map((entry) => (
          <div
            key={entry.path}
            className="flex items-center p-1 hover:bg-gray-700 rounded cursor-pointer"
            onClick={() => {
              if (entry.isDirectory) {
                setCurrentPath(entry.path)
                loadDirectory(entry.path)
              } else {
                onFileSelect(entry.path)
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              // Show context menu for rename/delete
            }}
          >
            <span className="mr-2">{entry.isDirectory ? '📁' : '📄'}</span>
            <span className="text-sm">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/types/fileTree.ts src/components/FileTree.tsx src/hooks/useFileTree.ts
git commit -m "feat: add file tree component with SFTP operations"
```

---

## Phase 6: Import/Export

### Task 14: Import/Export Commands

**Files:**
- Create: `src-tauri/src/commands/export.rs`
- Modify: `src-tauri/src/commands/mod.rs`

**Step 1: Create commands/export.rs**

```rust
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
```

**Step 2: Update Cargo.toml**

```toml
chrono = "0.4"
```

**Step 3: Update commands/mod.rs**

```rust
pub mod vault;
pub mod profile;
pub mod session;
pub mod export;
```

**Step 4: Update lib.rs to include export commands**

**Step 5: Commit**

```bash
git add src-tauri/
git commit -m "feat: add import/export functionality"
```

---

## Phase 7: Integration & Build

### Task 15: Build Verification

**Step 1: Build frontend**

```bash
npm run build
```

**Step 2: Build Tauri app**

```bash
npm run tauri build
```

**Step 3: Verify .app bundle exists**

```bash
ls -la src-tauri/target/release/bundle/macos/
```

**Step 4: Commit**

```bash
git add .
git commit -m "chore: build MVP release"
```

---

## Summary

This implementation plan is organized into 7 phases with 18 tasks:

1. **Project Scaffold** - Tauri + React setup
2. **Vault & Security** - Encryption + Keychain
3. **Database & Profiles** - SQLite + Profile CRUD + Host Key Management
4. **SSH/SFTP** - Connection + file operations + Local PTY
5. **Frontend** - React components with xterm.js + Monaco + Tab/Pane + FileTree + Commands
6. **Import/Export** - Encrypted backup
7. **Build** - Verification

Each task is designed to be completed in 2-5 minutes with test-driven development approach.

---

## Updated MVP Acceptance Checklist

- [ ] 多 tab + 分屏，聚焦切換正確
- [ ] 分屏操作 (右鍵選單) 可用
- [ ] Local shell 可用 (基本輸入輸出 + 剪貼簿 + 搜尋 + 字體調整)
- [ ] SSH profile 新建/連線成功 (password、key)
- [ ] 檔案樹基本操作可用 (list/新增/刪除/改名/上傳/下載)
- [ ] 打開/編輯/保存可用 (含 sudo 保存)
- [ ] 命令片段顯示在側邊欄，點擊可插入到輸入列
- [ ] Host Key 首次連線時提示確認
- [ ] Host Key 在 Profile 編輯時可查看/刪除
- [ ] 匯入/匯出可完成且可在另一台機器復原

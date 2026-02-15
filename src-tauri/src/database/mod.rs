use crate::error::AppError;
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostKey {
    pub host: String,
    pub port: u16,
    pub algo: String,
    pub fingerprint: String,
    pub raw_key: String,
    pub first_seen_at: String,
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

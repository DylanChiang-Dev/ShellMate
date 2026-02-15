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

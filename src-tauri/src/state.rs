use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

pub use crate::session::Session;

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

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

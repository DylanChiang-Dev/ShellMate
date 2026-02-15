use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

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

use ssh2::Session;
use std::io::Read;
use std::net::TcpStream;
use std::path::Path;
use std::time::Duration;
use crate::AppError;

pub struct SshConnection {
    pub session: Session,
    pub sftp: Option<ssh2::Sftp>,
}

pub mod sftp {
    use ssh2::Sftp;
    pub use ssh2::File;
    use crate::AppError;
    use std::io::{Read, Write};
    use std::path::Path;

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
                    size: entry.1.size.unwrap_or(0),
                });
            }
            Ok(entries)
        }

        pub fn read_file(&self, path: &str) -> Result<Vec<u8>, AppError> {
            let mut file = self.0.open(path)
                .map_err(|e: ssh2::Error| AppError::Ssh(e.to_string()))?;

            let mut contents = vec![];
            file.read_to_end(&mut contents)
                .map_err(|e: std::io::Error| AppError::Ssh(e.to_string()))?;
            Ok(contents)
        }

        pub fn write_file(&self, path: &str, contents: &[u8]) -> Result<(), AppError> {
            let mut file = self.0.create(Path::new(path))
                .map_err(|e: ssh2::Error| AppError::Ssh(e.to_string()))?;

            file.write_all(contents)
                .map_err(|e: std::io::Error| AppError::Ssh(e.to_string()))?;
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
        let key_str = std::str::from_utf8(key)
            .map_err(|e| AppError::Ssh(format!("Invalid key data: {}", e)))?;
        // userauth_pubkey_memory: username, passphrase, private_key, public_key (optional)
        session.userauth_pubkey_memory(username, passphrase, key_str, None)
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

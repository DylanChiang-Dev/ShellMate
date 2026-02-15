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

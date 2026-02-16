import { Client } from 'ssh2'

const sessions = new Map()

export function createSession(sessionId, profile, password) {
  return new Promise((resolve, reject) => {
    const conn = new Client()

    conn.on('ready', () => {
      sessions.set(sessionId, { conn, profile })
      console.log(`SSH connected: ${profile.host}`)
      resolve(conn)
    })

    conn.on('error', (err) => {
      console.error(`SSH error: ${err.message}`)
      sessions.delete(sessionId)
      reject(err)
    })

    conn.on('close', () => {
      sessions.delete(sessionId)
    })

    const port = parseInt(profile.port, 10) || 22

    conn.connect({
      host: profile.host,
      port: port,
      username: profile.username,
      password: password,
      readyTimeout: 30000,
      keepaliveInterval: 10000,
      tryKeyboard: true,
      algorithms: {
        serverHostKey: ['ssh-rsa', 'ssh-dss', 'ecdsa-sha2-nistp256', 'ssh-ed25519'],
        kex: ['diffie-hellman-group1-sha1', 'ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521', 'diffie-hellman-group-exchange-sha256', 'diffie-hellman-group14-sha1'],
        cipher: ['aes128-ctr', 'aes192-ctr', 'aes256-ctr', 'aes128-gcm', 'aes128-cbc', '3des-cbc']
      },
      debug: (str) => console.log('SSH Debug:', str)
    })
    console.log(`Attempting SSH connection to ${profile.username}@${profile.host}:${port}`)
  })
}

export function getSession(sessionId) {
  return sessions.get(sessionId)
}

export function closeSession(sessionId) {
  const session = sessions.get(sessionId)
  if (session) {
    session.conn.end()
    sessions.delete(sessionId)
    console.log(`SSH disconnected: ${sessionId}`)
  }
}

export function closeAllSessions() {
  for (const [id, session] of sessions) {
    session.conn.end()
  }
  sessions.clear()
}

export function executeCommand(sessionId, command) {
  return new Promise((resolve, reject) => {
    const session = sessions.get(sessionId)
    if (!session) {
      return reject(new Error('Session not found'))
    }

    session.conn.exec(command, (err, stream) => {
      if (err) return reject(err)

      let stdout = ''
      let stderr = ''

      stream.on('close', (code) => {
        resolve({ stdout, stderr, code })
      })

      stream.on('data', (data) => {
        stdout += data.toString()
      })

      stream.stderr.on('data', (data) => {
        stderr += data.toString()
      })
    })
  })
}

export function getSftp(sessionId) {
  return new Promise((resolve, reject) => {
    const session = sessions.get(sessionId)
    if (!session) {
      return reject(new Error('Session not found'))
    }

    session.conn.sftp((err, sftp) => {
      if (err) return reject(err)
      resolve(sftp)
    })
  })
}

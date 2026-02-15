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

    conn.connect({
      host: profile.host,
      port: profile.port || 22,
      username: profile.username,
      password: password,
      readyTimeout: 30000,
      keepaliveInterval: 10000
    })
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

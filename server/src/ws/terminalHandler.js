import * as sshService from '../services/sshService.js'
import * as profileService from '../services/profileService.js'
import crypto from 'crypto'

export function handleTerminalConnection(ws, req) {
  let sessionId = null
  let shell = null

  console.log('New WebSocket connection')

  // Heartbeat to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) {
      ws.ping()
    }
  }, 30000)

  ws.on('pong', () => {
    // console.log('Received pong')
  })

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())

      switch (data.type) {
        case 'connect': {
          const { profileId } = data
          try {
            const profiles = await profileService.getProfiles()
            const profile = profiles.find(p => p.id === profileId)

            if (!profile) {
              ws.send(JSON.stringify({ type: 'error', message: 'Profile not found' }))
              return
            }

            sessionId = crypto.randomUUID()

            // Log connection attempt
            console.log(`Initializing SSH session for ${profile.username}@${profile.host}`)

            const conn = await sshService.createSession(sessionId, profile, profile.password)

            conn.shell({ term: 'xterm-256color' }, (err, stream) => {
              if (err) {
                console.error('SSH Shell Error:', err)
                ws.send(JSON.stringify({ type: 'error', message: err.message }))
                return
              }

              shell = stream

              ws.send(JSON.stringify({ type: 'connected', sessionId }))

              stream.on('data', (chunk) => {
                if (ws.readyState === 1) {
                  ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf8') }))
                }
              })

              stream.stderr.on('data', (chunk) => {
                if (ws.readyState === 1) {
                  ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf8') }))
                }
              })

              stream.on('close', () => {
                console.log('SSH Stream closed')
                if (ws.readyState === 1) {
                  ws.send(JSON.stringify({ type: 'disconnected' }))
                }
                sshService.closeSession(sessionId)
              })
            })
          } catch (connErr) {
            console.error('SSH Connection Failed:', connErr)
            ws.send(JSON.stringify({ type: 'error', message: connErr.message || 'SSH Connection Failed' }))
          }
          break
        }

        case 'input': {
          if (shell) {
            try {
              shell.write(data.data)
            } catch (e) {
              console.error('Write error:', e)
            }
          }
          break
        }

        case 'resize': {
          if (shell) {
            try {
              shell.setWindow(data.rows, data.cols, data.height, data.width)
            } catch (e) {
              console.error('Resize error:', e)
            }
          }
          break
        }

        case 'disconnect': {
          if (shell) {
            shell.end()
          }
          if (sessionId) {
            sshService.closeSession(sessionId)
          }
          break
        }

        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }))
      }
    } catch (err) {
      console.error('WebSocket message handling error:', err)
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'error', message: 'Server error processing message' }))
      }
    }
  })

  ws.on('close', (code, reason) => {
    clearInterval(pingInterval)
    if (shell) {
      shell.end()
    }
    if (sessionId) {
      sshService.closeSession(sessionId)
    }
    console.log(`WebSocket closed: ${code} ${reason}`)
  })

  ws.on('error', (err) => {
    console.error('WebSocket error:', err)
    clearInterval(pingInterval)
  })
}

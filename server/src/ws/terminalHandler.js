import * as sshService from '../services/sshService.js'
import * as profileService from '../services/profileService.js'
import crypto from 'crypto'

export function handleTerminalConnection(ws, req) {
  let sessionId = null
  let shell = null

  console.log('New WebSocket connection')

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())

      switch (data.type) {
        case 'connect': {
          const { profileId } = data

          const profiles = await profileService.getProfiles()
          const profile = profiles.find(p => p.id === profileId)

          if (!profile) {
            ws.send(JSON.stringify({ type: 'error', message: 'Profile not found' }))
            return
          }

          sessionId = crypto.randomUUID()

          const conn = await sshService.createSession(sessionId, profile, profile.password)

          conn.shell({ term: 'xterm-256color' }, (err, stream) => {
            if (err) {
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
              ws.send(JSON.stringify({ type: 'disconnected' }))
              sshService.closeSession(sessionId)
            })
          })
          break
        }

        case 'input': {
          if (shell) {
            shell.write(data.data)
          }
          break
        }

        case 'resize': {
          if (shell) {
            shell.setWindow(data.rows, data.cols, data.height, data.width)
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
      console.error('WebSocket error:', err)
      ws.send(JSON.stringify({ type: 'error', message: err.message }))
    }
  })

  ws.on('close', () => {
    if (shell) {
      shell.end()
    }
    if (sessionId) {
      sshService.closeSession(sessionId)
    }
    console.log('WebSocket closed')
  })

  ws.on('error', (err) => {
    console.error('WebSocket error:', err)
  })
}

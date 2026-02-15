import * as sshService from '../services/sshService.js'
import * as profileService from '../services/profileService.js'
import crypto from 'crypto'

export function handleFileConnection(ws, req) {
  let sessionId = null
  let sftp = null
  let currentPath = '/'

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
          await sshService.createSession(sessionId, profile, profile.password)
          sftp = await sshService.getSftp(sessionId)

          ws.send(JSON.stringify({ type: 'connected', sessionId }))
          break
        }

        case 'list': {
          if (!sftp) {
            return ws.send(JSON.stringify({ type: 'error', message: 'Not connected' }))
          }

          const path = data.path || currentPath
          currentPath = path

          const list = await new Promise((resolve, reject) => {
            sftp.readdir(path, (err, list) => {
              if (err) return reject(err)
              resolve(list)
            })
          })

          const files = list.map(item => ({
            name: item.filename,
            isDirectory: item.attrs.isDirectory(),
            isFile: item.attrs.isFile(),
            size: item.attrs.size,
            modified: new Date(item.attrs.mtime * 1000).toISOString()
          }))

          ws.send(JSON.stringify({ type: 'list', files, path }))
          break
        }

        case 'read': {
          if (!sftp) {
            return ws.send(JSON.stringify({ type: 'error', message: 'Not connected' }))
          }

          const content = await new Promise((resolve, reject) => {
            sftp.readFile(data.path, 'utf8', (err, content) => {
              if (err) return reject(err)
              resolve(content)
            })
          })

          ws.send(JSON.stringify({ type: 'read', content, path: data.path }))
          break
        }

        case 'write': {
          if (!sftp) {
            return ws.send(JSON.stringify({ type: 'error', message: 'Not connected' }))
          }

          await new Promise((resolve, reject) => {
            sftp.writeFile(data.path, data.content, (err) => {
              if (err) return reject(err)
              resolve()
            })
          })

          ws.send(JSON.stringify({ type: 'write', success: true }))
          break
        }

        case 'mkdir': {
          if (!sftp) {
            return ws.send(JSON.stringify({ type: 'error', message: 'Not connected' }))
          }

          await new Promise((resolve, reject) => {
            sftp.mkdir(data.path, (err) => {
              if (err) return reject(err)
              resolve()
            })
          })

          ws.send(JSON.stringify({ type: 'mkdir', success: true }))
          break
        }

        case 'delete': {
          if (!sftp) {
            return ws.send(JSON.stringify({ type: 'error', message: 'Not connected' }))
          }

          await new Promise((resolve, reject) => {
            sftp.unlink(data.path, (err) => {
              if (err) return reject(err)
              resolve()
            })
          })

          ws.send(JSON.stringify({ type: 'delete', success: true }))
          break
        }

        case 'rmdir': {
          if (!sftp) {
            return ws.send(JSON.stringify({ type: 'error', message: 'Not connected' }))
          }

          await new Promise((resolve, reject) => {
            sftp.rmdir(data.path, (err) => {
              if (err) return reject(err)
              resolve()
            })
          })

          ws.send(JSON.stringify({ type: 'rmdir', success: true }))
          break
        }

        case 'rename': {
          if (!sftp) {
            return ws.send(JSON.stringify({ type: 'error', message: 'Not connected' }))
          }

          await new Promise((resolve, reject) => {
            sftp.rename(data.oldPath, data.newPath, (err) => {
              if (err) return reject(err)
              resolve()
            })
          })

          ws.send(JSON.stringify({ type: 'rename', success: true }))
          break
        }

        case 'disconnect': {
          if (sessionId) {
            sshService.closeSession(sessionId)
          }
          break
        }
      }
    } catch (err) {
      console.error('SFTP error:', err)
      ws.send(JSON.stringify({ type: 'error', message: err.message }))
    }
  })

  ws.on('close', () => {
    if (sessionId) {
      sshService.closeSession(sessionId)
    }
  })
}

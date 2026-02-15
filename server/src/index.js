import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profiles.js'
import snippetRoutes from './routes/snippets.js'
import { handleTerminalConnection } from './ws/terminalHandler.js'
import { handleFileConnection } from './ws/fileHandler.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const server = createServer(app)

const wss = new WebSocketServer({ server, path: '/ws' })

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/snippets', snippetRoutes)

app.use(express.static(path.join(__dirname, '../client/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
})

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const type = url.searchParams.get('type')

  if (type === 'terminal') {
    handleTerminalConnection(ws, req)
  } else if (type === 'file') {
    handleFileConnection(ws, req)
  } else {
    ws.close()
  }
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

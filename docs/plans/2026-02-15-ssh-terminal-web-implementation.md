# SSH Terminal Web Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个网页版 SSH 终端应用，用户可通过浏览器连接远程服务器，支持多 Tab 终端、SFTP 文件管理、文件编辑和命令片段功能。

**Architecture:** 采用 B/S 架构，前端 React + xterm.js 通过 WebSocket 与后端通信，后端 Node.js 使用 ssh2 库建立实际的 SSH/SFTP 连接，数据存储在 JSON 文件中。

**Tech Stack:**
- 前端: React 18 + TypeScript + Vite + xterm.js + Monaco Editor + TailwindCSS
- 后端: Node.js + Express + ws (WebSocket) + ssh2 + jsonfile + bcryptjs + JWT
- 部署: Docker

---

## Phase 1: 项目初始化与基础设施

### Task 1: 创建项目目录结构

**Files:**
- Create: `ssh-terminal-web/`
- Create: `ssh-terminal-web/client/` (前端)
- Create: `ssh-terminal-web/server/` (后端)
- Create: `ssh-terminal-web/docker/`

**Step 1: 创建目录**

```bash
mkdir -p ssh-terminal-web/client/src/{components,hooks,types,styles}
mkdir -p ssh-terminal-web/server/src/{routes,ws,data,services,middleware}
mkdir -p ssh-terminal-web/docker
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/
git commit -m "chore: create project structure for web SSH terminal"
```

---

### Task 2: 初始化后端项目

**Files:**
- Create: `ssh-terminal-web/server/package.json`
- Create: `ssh-terminal-web/server/.env.example`

**Step 1: 创建 server/package.json**

```json
{
  "name": "ssh-terminal-server",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.16.0",
    "ssh2": "^1.15.0",
    "jsonfile": "^6.1.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.1"
  }
}
```

**Step 2: 创建 .env.example**

```
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
ENCRYPTION_KEY=32-character-encryption-key-here
```

**Step 3: 安装依赖**

```bash
cd ssh-terminal-web/server
npm install
```

**Step 4: Commit**

```bash
git add ssh-terminal-web/server/
git commit -m "chore: initialize server project with dependencies"
```

---

### Task 3: 初始化前端项目

**Files:**
- Create: `ssh-terminal-web/client/package.json`
- Create: `ssh-terminal-web/client/vite.config.ts`
- Create: `ssh-terminal-web/client/tsconfig.json`
- Create: `ssh-terminal-web/client/index.html`
- Create: `ssh-terminal-web/client/tailwind.config.js`
- Create: `ssh-terminal-web/client/postcss.config.js`

**Step 1: 创建 package.json**

```json
{
  "name": "ssh-terminal-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@xterm/xterm": "^5.4.0",
    "@xterm/addon-fit": "^0.9.0",
    "@monaco-editor/react": "^4.6.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@types/uuid": "^9.0.8",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.0",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35"
  }
}
```

**Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
})
```

**Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 4: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SSH Terminal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: 创建 tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 6: 创建 postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Step 7: 安装前端依赖**

```bash
cd ssh-terminal-web/client
npm install
```

**Step 8: Commit**

```bash
git add ssh-terminal-web/client/
git commit -m "chore: initialize client project with dependencies"
```

---

## Phase 2: 后端 - 认证系统

### Task 4: 创建认证数据存储

**Files:**
- Create: `ssh-terminal-web/server/src/data/auth.json`
- Create: `ssh-terminal-web/server/src/data/profiles.json`
- Create: `ssh-terminal-web/server/src/data/snippets.json`

**Step 1: 创建初始数据文件**

```bash
# 创建 data 目录
mkdir -p ssh-terminal-web/server/src/data
```

```json
// data/auth.json
{
  "username": "admin",
  "passwordHash": "$2a$10$placeholder_hash_replace_on_first_run"
}

// data/profiles.json
{
  "profiles": [],
  "groups": ["default"]
}

// data/snippets.json
{
  "snippets": [],
  "groups": ["system", "docker", "git"]
}
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/server/src/data/
git commit -m "chore: create initial data files"
```

---

### Task 5: 实现认证服务

**Files:**
- Create: `ssh-terminal-web/server/src/services/authService.js`

**Step 1: 编写测试**

```javascript
// 测试需要先创建用户，这里先写实现

// 预期行为:
// 1. checkAuth(username, password) -> 返回是否正确
// 2. createUser(username, password) -> 创建用户
// 3. initializeDefaultUser() -> 如果没有用户，创建默认用户
```

**Step 2: 创建 authService.js**

```javascript
import bcrypt from 'bcryptjs'
import jsonfile from 'jsonfile'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authFile = path.join(__dirname, '../data/auth.json')

export async function getAuth() {
  return jsonfile.readFile(authFile)
}

export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword)
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function initializeDefaultUser(defaultPassword = 'admin123') {
  const auth = await getAuth()
  if (!auth.passwordHash || auth.passwordHash === '$2a$10$placeholder_hash_replace_on_first_run') {
    auth.passwordHash = await hashPassword(defaultPassword)
    await jsonfile.writeFile(authFile, auth, { spaces: 2 })
    console.log('Default user initialized with password: admin123')
  }
}

export async function changePassword(newPassword) {
  const auth = await getAuth()
  auth.passwordHash = await hashPassword(newPassword)
  await jsonfile.writeFile(authFile, auth, { spaces: 2 })
}
```

**Step 3: Commit**

```bash
git add ssh-terminal-web/server/src/services/authService.js
git commit -m "feat: add authentication service"
```

---

### Task 6: 创建认证中间件

**Files:**
- Create: `ssh-terminal-web/server/src/middleware/auth.js`

**Step 1: 创建中间件**

```javascript
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me'

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  req.user = decoded
  next()
}
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/server/src/middleware/auth.js
git commit -m "feat: add JWT authentication middleware"
```

---

### Task 7: 实现认证路由

**Files:**
- Create: `ssh-terminal-web/server/src/routes/auth.js`

**Step 1: 创建路由**

```javascript
import express from 'express'
import { getAuth, verifyPassword, initializeDefaultUser, changePassword } from '../services/authService.js'
import { generateToken } from '../middleware/auth.js'

const router = express.Router()

// 初始化默认用户
await initializeDefaultUser()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    const auth = await getAuth()

    if (username !== auth.username) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValid = await verifyPassword(password, auth.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = generateToken({ username })
    res.json({ token, username })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/auth/check
router.get('/check', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ authenticated: false })
  }

  const token = authHeader.substring(7)
  const { verifyToken } = await import('../middleware/auth.js')
  const decoded = verifyToken(token)

  if (decoded) {
    res.json({ authenticated: true, username: decoded.username })
  } else {
    res.status(401).json({ authenticated: false })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true })
})

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const auth = await getAuth()

    const isValid = await verifyPassword(currentPassword, auth.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Current password incorrect' })
    }

    await changePassword(newPassword)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' })
  }
})

export default router
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/server/src/routes/auth.js
git commit -m "feat: add authentication routes"
```

---

## Phase 3: 后端 - 服务器与命令片段管理

### Task 8: 实现 Profiles 服务

**Files:**
- Create: `ssh-terminal-web/server/src/services/profileService.js`

**Step 1: 创建服务**

```javascript
import jsonfile from 'jsonfile'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const profilesFile = path.join(__dirname, '../data/profiles.json')
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!'

function encrypt(text) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text) {
  try {
    const parts = text.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    return text // 如果解密失败，返回原文本（兼容旧数据）
  }
}

export async function getProfiles() {
  const data = await jsonfile.readFile(profilesFile)
  // 解密密码后返回
  return data.profiles.map(p => ({
    ...p,
    password: p.password ? decrypt(p.password) : ''
  }))
}

export async function getProfilesRaw() {
  return jsonfile.readFile(profilesFile)
}

export async function saveProfiles(data) {
  // 加密密码后保存
  const encrypted = {
    ...data,
    profiles: data.profiles.map(p => ({
      ...p,
      password: p.password ? encrypt(p.password) : ''
    }))
  }
  await jsonfile.writeFile(profilesFile, encrypted, { spaces: 2 })
}

export async function addProfile(profile) {
  const data = await getProfilesRaw()
  const newProfile = {
    id: crypto.randomUUID(),
    ...profile,
    createdAt: new Date().toISOString()
  }
  data.profiles.push(newProfile)
  await saveProfiles(data)
  return { ...newProfile, password: profile.password }
}

export async function updateProfile(id, updates) {
  const data = await getProfilesRaw()
  const index = data.profiles.findIndex(p => p.id === id)
  if (index === -1) throw new Error('Profile not found')

  data.profiles[index] = { ...data.profiles[index], ...updates }
  await saveProfiles(data)
  return { ...data.profiles[index], password: updates.password || '' }
}

export async function deleteProfile(id) {
  const data = await getProfilesRaw()
  data.profiles = data.profiles.filter(p => p.id !== id)
  await saveProfiles(data)
}

export async function getGroups() {
  const data = await getProfilesRaw()
  return data.groups || []
}

export async function addGroup(group) {
  const data = await getProfilesRaw()
  if (!data.groups.includes(group)) {
    data.groups.push(group)
    await jsonfile.writeFile(profilesFile, data, { spaces: 2 })
  }
}
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/server/src/services/profileService.js
git commit -m "feat: add profile service with encrypted password storage"
```

---

### Task 9: 实现 Snippets 服务

**Files:**
- Create: `ssh-terminal-web/server/src/services/snippetService.js`

**Step 1: 创建服务**

```javascript
import jsonfile from 'jsonfile'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const snippetsFile = path.join(__dirname, '../data/snippets.json')

export async function getSnippets() {
  return jsonfile.readFile(snippetsFile)
}

export async function getSnippetsList() {
  const data = await getSnippets()
  return data.snippets
}

export async function addSnippet(snippet) {
  const data = await getSnippets()
  const newSnippet = {
    id: crypto.randomUUID(),
    ...snippet,
    createdAt: new Date().toISOString()
  }
  data.snippets.push(newSnippet)
  await jsonfile.writeFile(snippetsFile, data, { spaces: 2 })
  return newSnippet
}

export async function updateSnippet(id, updates) {
  const data = await getSnippets()
  const index = data.snippets.findIndex(s => s.id === id)
  if (index === -1) throw new Error('Snippet not found')

  data.snippets[index] = { ...data.snippets[index], ...updates }
  await jsonfile.writeFile(snippetsFile, data, { spaces: 2 })
  return data.snippets[index]
}

export async function deleteSnippet(id) {
  const data = await getSnippets()
  data.snippets = data.snippets.filter(s => s.id !== id)
  await jsonfile.writeFile(snippetsFile, data, { spaces: 2 })
}

export async function getSnippetGroups() {
  const data = await getSnippets()
  return data.groups || []
}
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/server/src/services/snippetService.js
git commit -m "feat: add snippet service"
```

---

### Task 10: 创建 Profiles 和 Snippets 路由

**Files:**
- Create: `ssh-terminal-web/server/src/routes/profiles.js`
- Create: `ssh-terminal-web/server/src/routes/snippets.js`

**Step 1: 创建 profiles 路由**

```javascript
import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as profileService from '../services/profileService.js'

const router = express.Router()

// 所有路由需要认证
router.use(authMiddleware)

// GET /api/profiles
router.get('/', async (req, res) => {
  try {
    const profiles = await profileService.getProfiles()
    res.json(profiles)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/profiles/groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await profileService.getGroups()
    res.json(groups)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/profiles
router.post('/', async (req, res) => {
  try {
    const { name, host, port, username, password, group, tags } = req.body

    if (!name || !host || !username) {
      return res.status(400).json({ error: 'Name, host, username required' })
    }

    const profile = await profileService.addProfile({
      name,
      host,
      port: port || 22,
      username,
      password: password || '',
      group: group || 'default',
      tags: tags || []
    })

    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/profiles/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const profile = await profileService.updateProfile(id, updates)
    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/profiles/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await profileService.deleteProfile(id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/profiles/groups
router.post('/groups', async (req, res) => {
  try {
    const { group } = req.body
    if (!group) {
      return res.status(400).json({ error: 'Group name required' })
    }
    await profileService.addGroup(group)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
```

**Step 2: 创建 snippets 路由**

```javascript
import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as snippetService from '../services/snippetService.js'

const router = express.Router()

router.use(authMiddleware)

// GET /api/snippets
router.get('/', async (req, res) => {
  try {
    const snippets = await snippetService.getSnippetsList()
    res.json(snippets)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/snippets/groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await snippetService.getSnippetGroups()
    res.json(groups)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/snippets
router.post('/', async (req, res) => {
  try {
    const { title, command, group } = req.body

    if (!title || !command) {
      return res.status(400).json({ error: 'Title and command required' })
    }

    const snippet = await snippetService.addSnippet({
      title,
      command,
      group: group || 'default'
    })

    res.json(snippet)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/snippets/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const snippet = await snippetService.updateSnippet(id, updates)
    res.json(snippet)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/snippets/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await snippetService.deleteSnippet(id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
```

**Step 3: Commit**

```bash
git add ssh-terminal-web/server/src/routes/
git commit -m "feat: add profiles and snippets API routes"
```

---

## Phase 4: 后端 - SSH/SFTP WebSocket 连接

### Task 11: SSH 连接管理服务

**Files:**
- Create: `ssh-terminal-web/server/src/services/sshService.js`

**Step 1: 创建 SSH 服务**

```javascript
import { Client } from 'ssh2'

// 存储活跃的 SSH 连接
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
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/server/src/services/sshService.js
git commit -m "feat: add SSH connection management service"
```

---

### Task 12: WebSocket 终端处理

**Files:**
- Create: `ssh-terminal-web/server/src/ws/terminalHandler.js`

**Step 1: 创建 WebSocket 处理器**

```javascript
import * as sshService from '../services/sshService.js'
import * as profileService from '../services/profileService.js'

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

          // 获取服务器配置
          const profiles = await profileService.getProfiles()
          const profile = profiles.find(p => p.id === profileId)

          if (!profile) {
            ws.send(JSON.stringify({ type: 'error', message: 'Profile not found' }))
            return
          }

          sessionId = crypto.randomUUID()

          // 建立 SSH 连接并打开 shell
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
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/server/src/ws/terminalHandler.js
git commit -m "feat: add WebSocket terminal handler"
```

---

### Task 13: SFTP 文件操作处理

**Files:**
- Create: `ssh-terminal-web/server/src/ws/fileHandler.js`

**Step 1: 创建 SFTP WebSocket 处理器**

```javascript
import * as sshService from '../services/sshService.js'
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
          const profiles = await import('../services/profileService.js').then(m => m.getProfiles())
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
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/server/src/ws/fileHandler.js
git commit -m "feat: add SFTP WebSocket file handler"
```

---

### Task 14: 创建主服务器入口

**Files:**
- Create: `ssh-terminal-web/server/src/index.js`

**Step 1: 创建服务器入口**

```javascript
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

// 中间件
app.use(cors())
app.use(express.json())

// 静态文件
app.use(express.static(path.join(__dirname, '../../client/dist')))

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/snippets', snippetRoutes)

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
})

// WebSocket 处理
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
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/server/src/index.js
git commit -m "feat: create main server entry point"
```

---

## Phase 5: 前端 - 核心组件

### Task 15: 创建前端基础文件

**Files:**
- Create: `ssh-terminal-web/client/src/main.tsx`
- Create: `ssh-terminal-web/client/src/App.tsx`
- Create: `ssh-terminal-web/client/src/index.css`
- Create: `ssh-terminal-web/client/src/types/index.ts`

**Step 1: 创建 main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 2: 创建 types/index.ts**

```typescript
export interface Profile {
  id: string
  name: string
  host: string
  port: number
  username: string
  password?: string
  group: string
  tags: string[]
  createdAt: string
}

export interface Snippet {
  id: string
  title: string
  command: string
  group: string
  createdAt: string
}

export interface Tab {
  id: string
  title: string
  profileId: string
  type: 'terminal' | 'sftp'
}

export interface FileEntry {
  name: string
  isDirectory: boolean
  isFile: boolean
  size: number
  modified: string
}

export interface WsMessage {
  type: string
  [key: string]: any
}
```

**Step 3: 创建 index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: #1e1e1e;
  color: #d4d4d4;
}

.xterm {
  padding: 8px;
}
```

**Step 4: 创建 App.tsx**

```typescript
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch('/api/auth/check', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
    } catch (err) {
      setIsAuthenticated(false)
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/" />}
        />
        <Route
          path="/*"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

**Step 5: Commit**

```bash
git add ssh-terminal-web/client/src/
git commit -m "feat: create frontend base files"
```

---

### Task 16: 创建登录组件

**Files:**
- Create: `ssh-terminal-web/client/src/components/Login.tsx`

**Step 1: 创建 Login.tsx**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface LoginProps {
  setAuth: (auth: boolean) => void
}

export default function Login({ setAuth }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

 (e: React.FormEvent) {
    async function handleLogin e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.username)
      setAuth(true)
      navigate('/')
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">SSH Terminal</h1>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-400 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/client/src/components/Login.tsx
git commit -m "feat: add login component"
```

---

### Task 17: 创建 API 服务

**Files:**
- Create: `ssh-terminal-web/client/src/services/api.ts`

**Step 1: 创建 api.ts**

```typescript
import { Profile, Snippet } from '../types'

const getToken = () => localStorage.getItem('token')

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    ...options.headers,
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  checkAuth: () =>
    request<{ authenticated: boolean; username: string }>('/api/auth/check'),

  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),

  // Profiles
  getProfiles: () => request<Profile[]>('/api/profiles'),

  getProfileGroups: () => request<string[]>('/api/profiles/groups'),

  createProfile: (profile: Omit<Profile, 'id' | 'createdAt'>) =>
    request<Profile>('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    }),

  updateProfile: (id: string, updates: Partial<Profile>) =>
    request<Profile>(`/api/profiles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }),

  deleteProfile: (id: string) =>
    request<void>(`/api/profiles/${id}`, { method: 'DELETE' }),

  // Snippets
  getSnippets: () => request<Snippet[]>('/api/snippets'),

  getSnippetGroups: () => request<string[]>('/api/snippets/groups'),

  createSnippet: (snippet: Omit<Snippet, 'id' | 'createdAt'>) =>
    request<Snippet>('/api/snippets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snippet),
    }),

  deleteSnippet: (id: string) =>
    request<void>(`/api/snippets/${id}`, { method: 'DELETE' }),
}
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/client/src/services/api.ts
git commit -m "feat: add API service"
```

---

### Task 18: 创建终端组件

**Files:**
- Create: `ssh-terminal-web/client/src/hooks/useTerminal.ts`
- Create: `ssh-terminal-web/client/src/components/Terminal.tsx`

**Step 1: 创建 useTerminal hook**

```typescript
import { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface UseTerminalOptions {
  profileId: string | null
  onDisconnect?: () => void
}

export function useTerminal({ profileId, onDisconnect }: UseTerminalOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback((pId: string) => {
    if (!pId) return

    // 关闭现有连接
    if (wsRef.current) {
      wsRef.current.close()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?type=terminal`)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect', profileId: pId }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'connected':
          setConnected(true)
          setError(null)
          break
        case 'output':
          terminalRef.current?.write(data.data)
          break
        case 'disconnected':
          setConnected(false)
          onDisconnect?.()
          break
        case 'error':
          setError(data.message)
          break
      }
    }

    ws.onclose = () => {
      setConnected(false)
    }

    ws.onerror = () => {
      setError('WebSocket connection error')
    }

    wsRef.current = ws
  }, [onDisconnect])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'disconnect' }))
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }, [])

  const sendInput = useCallback((data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', data }))
    }
  }, [])

  const resize = useCallback((cols: number, rows: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }))
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new XTerm({
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#264f78',
      },
      cursorBlink: true,
      allowTransparency: true,
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    terminal.open(containerRef.current)
    fitAddon.fit()

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    // 处理终端输入
    terminal.onData((data) => {
      sendInput(data)
    })

    // 处理终端大小变化
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
      resize(terminal.cols, terminal.rows)
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      terminal.dispose()
      disconnect()
    }
  }, [sendInput, resize, disconnect])

  // 当 profileId 变化时重新连接
  useEffect(() => {
    if (profileId && connected === false) {
      connect(profileId)
    }
  }, [profileId, connect, connected])

  return {
    containerRef,
    connected,
    error,
    connect,
    disconnect,
  }
}
```

**Step 2: 创建 Terminal 组件**

```typescript
import { useTerminal } from '../hooks/useTerminal'

interface TerminalProps {
  profileId: string | null
  onDisconnect?: () => void
}

export default function Terminal({ profileId, onDisconnect }: TerminalProps) {
  const { containerRef, connected, error, disconnect } = useTerminal({
    profileId,
    onDisconnect,
  })

  return (
    <div className="h-full w-full relative">
      {!connected && !error && profileId && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-gray-400">连接中...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-red-400">错误: {error}</div>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add ssh-terminal-web/client/src/hooks/useTerminal.ts ssh-terminal-web/client/src/components/Terminal.tsx
git commit -m "feat: add terminal component with xterm.js"
```

---

### Task 19: 创建文件管理器组件

**Files:**
- Create: `ssh-terminal-web/client/src/hooks/useSftp.ts`
- Create: `ssh-terminal-web/client/src/components/FileManager.tsx`

**Step 1: 创建 useSftp hook**

```typescript
import { useState, useRef, useCallback } from 'react'
import { FileEntry } from '../types'

interface UseSftpOptions {
  profileId: string | null
}

export function useSftp({ profileId }: UseSftpOptions) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [currentPath, setCurrentPath] = useState('/')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback((pId: string) => {
    if (!pId) return

    if (wsRef.current) {
      wsRef.current.close()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?type=file`)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect', profileId: pId }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'connected':
          ws.send(JSON.stringify({ type: 'list', path: '/' }))
          break
        case 'list':
          setFiles(data.files)
          setCurrentPath(data.path)
          setLoading(false)
          break
        case 'read':
          // 处理文件读取
          break
        case 'error':
          setError(data.message)
          setLoading(false)
          break
      }
    }

    ws.onerror = () => {
      setError('Connection error')
    }

    wsRef.current = ws
  }, [])

  const listDirectory = useCallback((path: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    setLoading(true)
    wsRef.current.send(JSON.stringify({ type: 'list', path }))
  }, [])

  const readFile = useCallback((path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current) return reject(new Error('Not connected'))

      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data)
        if (data.type === 'read' && data.path === path) {
          wsRef.current?.removeEventListener('message', handler)
          resolve(data.content)
        } else if (data.type === 'error') {
          wsRef.current?.removeEventListener('message', handler)
          reject(new Error(data.message))
        }
      }

      wsRef.current.addEventListener('message', handler)
      wsRef.current.send(JSON.stringify({ type: 'read', path }))
    })
  }, [])

  const writeFile = useCallback((path: string, content: string) => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current) return reject(new Error('Not connected'))

      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data)
        if (data.type === 'write') {
          wsRef.current?.removeEventListener('message', handler)
          resolve(true)
        } else if (data.type === 'error') {
          wsRef.current?.removeEventListener('message', handler)
          reject(new Error(data.message))
        }
      }

      wsRef.current.addEventListener('message', handler)
      wsRef.current.send(JSON.stringify({ type: 'write', path, content }))
    })
  }, [])

  const createDirectory = useCallback((path: string) => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current) return reject(new Error('Not connected'))

      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data)
        if (data.type === 'mkdir') {
          wsRef.current?.removeEventListener('message', handler)
          resolve(true)
        } else if (data.type === 'error') {
          wsRef.current?.removeEventListener('message', handler)
          reject(new Error(data.message))
        }
      }

      wsRef.current.addEventListener('message', handler)
      wsRef.current.send(JSON.stringify({ type: 'mkdir', path }))
    })
  }, [])

  const deleteFile = useCallback((path: string) => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current) return reject(new Error('Not connected'))

      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data)
        if (data.type === 'delete' || data.type === 'rmdir') {
          wsRef.current?.removeEventListener('message', handler)
          resolve(true)
        } else if (data.type === 'error') {
          wsRef.current?.removeEventListener('message', handler)
          reject(new Error(data.message))
        }
      }

      wsRef.current.addEventListener('message', handler)
      wsRef.current.send(JSON.stringify({ type: 'delete', path }))
    })
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'disconnect' }))
      wsRef.current.close()
      wsRef.current = null
    }
    setFiles([])
    setCurrentPath('/')
  }, [])

  return {
    files,
    currentPath,
    loading,
    error,
    connect,
    disconnect,
    listDirectory,
    readFile,
    writeFile,
    createDirectory,
    deleteFile,
  }
}
```

**Step 2: 创建 FileManager 组件**

```typescript
import { useState, useEffect } from 'react'
import { useSftp } from '../hooks/useSftp'
import { FileEntry } from '../types'

interface FileManagerProps {
  profileId: string | null
  onFileSelect?: (path: string) => void
}

export default function FileManager({ profileId, onFileSelect }: FileManagerProps) {
  const {
    files,
    currentPath,
    loading,
    error,
    connect,
    disconnect,
    listDirectory,
    deleteFile,
  } = useSftp({ profileId })

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileEntry } | null>(null)

  useEffect(() => {
    if (profileId) {
      connect(profileId)
    } else {
      disconnect()
    }
    return () => disconnect()
  }, [profileId, connect, disconnect])

  function navigateTo(path: string) {
    listDirectory(path)
  }

  function goUp() {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    const parent = '/' + parts.join('/')
    navigateTo(parent || '/')
  }

  function handleContextMenu(e: React.MouseEvent, file: FileEntry) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, file })
  }

  function closeContextMenu() {
    setContextMenu(null)
  }

  if (!profileId) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        选择服务器以查看文件
      </div>
    )
  }

  if (loading) {
    return <div className="p-4 text-gray-400">加载中...</div>
  }

  if (error) {
    return <div className="p-4 text-red-400">错误: {error}</div>
  }

  return (
    <div className="h-full flex flex-col" onClick={closeContextMenu}>
      {/* 路径导航 */}
      <div className="flex items-center p-2 border-b border-gray-700">
        <button
          onClick={goUp}
          className="px-2 py-1 text-gray-400 hover:text-white mr-2"
          disabled={currentPath === '/'}
        >
          ←
        </button>
        <span className="text-sm text-gray-300 truncate">{currentPath}</span>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {files
          .sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1
            if (!a.isDirectory && b.isDirectory) return 1
            return a.name.localeCompare(b.name)
          })
          .map((file) => (
            <div
              key={file.name}
              className="flex items-center p-1 hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => {
                if (file.isDirectory) {
                  navigateTo(currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`)
                } else {
                  onFileSelect?.(currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`)
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, file)}
            >
              <span className="mr-2">{file.isDirectory ? '📁' : '📄'}</span>
              <span className="text-sm">{file.name}</span>
            </div>
          ))}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-1 text-left text-sm hover:bg-gray-700"
            onClick={() => {
              if (contextMenu.file.isDirectory) {
                navigateTo(`${currentPath}/${contextMenu.file.name}`)
              }
              closeContextMenu()
            }}
          >
            打开
          </button>
          {!contextMenu.file.isDirectory && (
            <button
              className="w-full px-4 py-1 text-left text-sm hover:bg-gray-700"
              onClick={() => {
                onFileSelect?.(`${currentPath}/${contextMenu.file.name}`)
                closeContextMenu()
              }}
            >
              编辑
            </button>
          )}
          <button
            className="w-full px-4 py-1 text-left text-sm text-red-400 hover:bg-gray-700"
            onClick={() => {
              deleteFile(`${currentPath}/${contextMenu.file.name}`)
              closeContextMenu()
            }}
          >
            删除
          </button>
        </div>
      )}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add ssh-terminal-web/client/src/hooks/useSftp.ts ssh-terminal-web/client/src/components/FileManager.tsx
git commit -m "feat: add file manager component with SFTP"
```

---

### Task 20: 创建编辑器组件

**Files:**
- Create: `ssh-terminal-web/client/src/components/Editor.tsx`

**Step 1: 创建 Editor 组件**

```typescript
import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

interface EditorProps {
  filePath: string | null
  profileId: string | null
  onSave?: (content: string) => void
}

export default function FileEditor({ filePath, profileId, onSave }: EditorProps) {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (filePath && profileId) {
      loadFile()
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [filePath, profileId])

  async function loadFile() {
    if (!filePath || !profileId) return

    setLoading(true)

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?type=file`)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect', profileId }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'connected') {
        ws.send(JSON.stringify({ type: 'read', path: filePath }))
      } else if (data.type === 'read') {
        setContent(data.content)
        setOriginalContent(data.content)
        setLoading(false)
        ws.close()
      } else if (data.type === 'error') {
        console.error(data.message)
        setLoading(false)
        ws.close()
      }
    }

    wsRef.current = ws
  }

  async function saveFile() {
    if (!filePath || !profileId || saving) return

    setSaving(true)

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?type=file`)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect', profileId }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'connected') {
        ws.send(JSON.stringify({ type: 'write', path: filePath, content }))
      } else if (data.type === 'write') {
        setOriginalContent(content)
        setSaving(false)
        onSave?.(content)
        ws.close()
      } else if (data.type === 'error') {
        console.error(data.message)
        setSaving(false)
        ws.close()
      }
    }
  }

  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <div>选择文件进行编辑</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
        加载中...
      </div>
    )
  }

  const hasChanges = content !== originalContent

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <div className="flex items-center">
          <span className="text-sm text-gray-300">{filePath.split('/').pop()}</span>
          {hasChanges && <span className="ml-2 text-yellow-500 text-sm">*</span>}
        </div>
        <button
          onClick={saveFile}
          disabled={!hasChanges || saving}
          className={`px-3 py-1 text-sm rounded ${
            hasChanges
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-700 text-gray-500'
          } disabled:opacity-50`}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="plaintext"
          theme="vs-dark"
          value={content}
          onChange={(value) => setContent(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/client/src/components/Editor.tsx
git commit -m "feat: add Monaco editor component"
```

---

### Task 21: 创建主 Dashboard 组件

**Files:**
- Create: `ssh-terminal-web/client/src/components/Dashboard.tsx`

**Step 1: 创建 Dashboard**

```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Profile, Snippet, Tab } from '../types'
import Terminal from './Terminal'
import FileManager from './FileManager'
import FileEditor from './Editor'
import { v4 as uuidv4 } from 'uuid'

export default function Dashboard() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [showNewProfile, setShowNewProfile] = useState(false)
  const [showNewSnippet, setShowNewSnippet] = useState(false)

  // 新建表单状态
  const [newProfile, setNewProfile] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    group: 'default',
  })
  const [newSnippet, setNewSnippet] = useState({
    title: '',
    command: '',
    group: 'system',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [profilesData, groupsData, snippetsData] = await Promise.all([
        api.getProfiles(),
        api.getProfileGroups(),
        api.getSnippets(),
      ])
      setProfiles(profilesData)
      setGroups(groupsData)
      setSnippets(snippetsData)
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  async function handleCreateProfile() {
    try {
      await api.createProfile(newProfile)
      setShowNewProfile(false)
      setNewProfile({ name: '', host: '', port: 22, username: '', password: '', group: 'default' })
      loadData()
    } catch (err) {
      console.error('Failed to create profile:', err)
    }
  }

  async function handleDeleteProfile(id: string) {
    try {
      await api.deleteProfile(id)
      setTabs(tabs.filter(t => t.profileId !== id))
      loadData()
    } catch (err) {
      console.error('Failed to delete profile:', err)
    }
  }

  async function handleCreateSnippet() {
    try {
      await api.createSnippet(newSnippet)
      setShowNewSnippet(false)
      setNewSnippet({ title: '', command: '', group: 'system' })
      loadData()
    } catch (err) {
      console.error('Failed to create snippet:', err)
    }
  }

  async function handleDeleteSnippet(id: string) {
    try {
      await api.deleteSnippet(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete snippet:', err)
    }
  }

  function openTerminal(profileId: string) {
    const profile = profiles.find(p => p.id === profileId)
    if (!profile) return

    const newTab: Tab = {
      id: uuidv4(),
      title: profile.name,
      profileId,
      type: 'terminal',
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  function closeTab(tabId: string) {
    setTabs(tabs.filter(t => t.id !== tabId))
    if (activeTabId === tabId) {
      setActiveTabId(tabs.length > 1 ? tabs[0].id : null)
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  const activeTab = tabs.find(t => t.id === activeTabId)
  const filteredProfiles = selectedGroup === 'all'
    ? profiles
    : profiles.filter(p => p.group === selectedGroup)

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h1 className="text-lg font-bold">SSH Terminal</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">{localStorage.getItem('username')}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white"
          >
            登出
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧栏 */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* 服务器列表 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">服务器</span>
                <button
                  onClick={() => setShowNewProfile(!showNewProfile)}
                  className="text-sm bg-blue-600 px-2 py-0.5 rounded hover:bg-blue-700"
                >
                  + 新建
                </button>
              </div>

              {/* 群组筛选 */}
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full bg-gray-700 px-2 py-1 rounded text-sm mb-2"
              >
                <option value="all">全部</option>
                {groups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              {/* 新建服务器表单 */}
              {showNewProfile && (
                <div className="space-y-2 mb-2 p-2 bg-gray-700 rounded">
                  <input
                    placeholder="名称"
                    value={newProfile.name}
                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                    className="w-full bg-gray-600 px-2 py-1 rounded text-sm"
                  />
                  <input
                    placeholder="主机"
                    value={newProfile.host}
                    onChange={(e) => setNewProfile({ ...newProfile, host: e.target.value })}
                    className="w-full bg-gray-600 px-2 py-1 rounded text-sm"
                  />
                  <input
                    placeholder="端口"
                    type="number"
                    value={newProfile.port}
                    onChange={(e) => setNewProfile({ ...newProfile, port: parseInt(e.target.value) })}
                    className="w-full bg-gray-600 px-2 py-1 rounded text-sm"
                  />
                  <input
                    placeholder="用户名"
                    value={newProfile.username}
                    onChange={(e) => setNewProfile({ ...newProfile, username: e.target.value })}
                    className="w-full bg-gray-600 px-2 py-1 rounded text-sm"
                  />
                  <input
                    placeholder="密码"
                    type="password"
                    value={newProfile.password}
                    onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
                    className="w-full bg-gray-600 px-2 py-1 rounded text-sm"
                  />
                  <button
                    onClick={handleCreateProfile}
                    className="w-full bg-green-600 px-2 py-1 rounded text-sm hover:bg-green-700"
                  >
                    创建
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-2 hover:bg-gray-700 cursor-pointer group"
                  onClick={() => openTerminal(profile.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{profile.name}</div>
                      <div className="text-xs text-gray-400">
                        {profile.username}@{profile.host}:{profile.port}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProfile(profile.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 命令片段 */}
          <div className="border-t border-gray-700 p-2 max-h-1/3 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">命令片段</span>
              <button
                onClick={() => setShowNewSnippet(!showNewSnippet)}
                className="text-xs bg-blue-600 px-2 py-0.5 rounded"
              >
                + 新建
              </button>
            </div>

            {showNewSnippet && (
              <div className="space-y-1 mb-2 p-2 bg-gray-700 rounded">
                <input
                  placeholder="标题"
                  value={newSnippet.title}
                  onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                  className="w-full bg-gray-600 px-2 py-1 rounded text-xs"
                />
                <input
                  placeholder="命令"
                  value={newSnippet.command}
                  onChange={(e) => setNewSnippet({ ...newSnippet, command: e.target.value })}
                  className="w-full bg-gray-600 px-2 py-1 rounded text-xs"
                />
                <button
                  onClick={handleCreateSnippet}
                  className="w-full bg-green-600 px-2 py-1 rounded text-xs"
                >
                  添加
                </button>
              </div>
            )}

            <div className="space-y-1">
              {snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="p-1 bg-gray-700 rounded text-xs group cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    // TODO: 插入到终端输入
                    navigator.clipboard.writeText(snippet.command)
                  }}
                  title={snippet.command}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{snippet.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSnippet(snippet.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col">
          {/* Tab 栏 */}
          <div className="flex bg-gray-800 border-b border-gray-700">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center px-3 py-2 cursor-pointer ${
                  activeTabId === tab.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span>{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* 终端区域 */}
          <div className="flex-1 border-b border-gray-700">
            {activeTab ? (
              <Terminal
                profileId={activeTab.profileId}
                onDisconnect={() => closeTab(activeTab.id)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                选择一个服务器开始连接
              </div>
            )}
          </div>

          {/* 底部面板：文件管理 + 编辑器 */}
          <div className="h-64 flex">
            <div className="w-1/2 border-r border-gray-700 overflow-hidden">
              <div className="bg-gray-800 px-2 py-1 text-sm font-semibold border-b border-gray-700">
                文件管理
              </div>
              <div className="h-[calc(100%-2rem)] overflow-hidden">
                <FileManager
                  profileId={activeTab?.profileId || null}
                  onFileSelect={setSelectedFile}
                />
              </div>
            </div>
            <div className="w-1/2 overflow-hidden">
              <div className="h-full overflow-hidden">
                <FileEditor
                  filePath={selectedFile}
                  profileId={activeTab?.profileId || null}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add ssh-terminal-web/client/src/components/Dashboard.tsx
git commit -m "feat: create main dashboard component"
```

---

## Phase 6: Docker 部署

### Task 22: 创建 Dockerfile

**Files:**
- Create: `ssh-terminal-web/Dockerfile`
- Create: `ssh-terminal-web/docker/docker-compose.yml`
- Create: `ssh-terminal-web/.env`

**Step 1: 创建 Dockerfile**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY server/package*.json ./
RUN npm ci --only=production

# 复制后端代码
COPY server/src ./src
COPY server/src/data ./src/data

# 构建前端
COPY client/package*.json ./client/
COPY client ./client
RUN npm ci --prefix client
RUN npm run build --prefix client

# 复制前端构建产物
COPY client/dist ./client/dist

EXPOSE 3000

CMD ["node", "src/index.js"]
```

**Step 2: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  ssh-terminal:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - JWT_SECRET=your-secret-key-change-in-production
      - ENCRYPTION_KEY=32-character-encryption-key!!
    volumes:
      - ./data:/app/src/data
    restart: unless-stopped
```

**Step 3: 创建 .env 文件**

```
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
ENCRYPTION_KEY=32-character-encryption-key!!
```

**Step 4: 更新 server package.json 添加 scripts**

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "build:client": "cd ../client && npm run build"
  }
}
```

**Step 5: Commit**

```bash
git add ssh-terminal-web/Dockerfile ssh-terminal-web/docker/ ssh-terminal-web/.env
git commit -m "chore: add Docker configuration"
```

---

## Phase 7: 构建与测试

### Task 23: 验证构建

**Step 1: 构建前端**

```bash
cd ssh-terminal-web/client
npm run build
```

**Step 2: 启动服务器测试**

```bash
cd ssh-terminal-web/server
npm start
```

**Step 3: 测试 API**

```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 获取 token 后测试
TOKEN="your-token"

# 获取服务器列表
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/profiles
```

**Step 4: Commit**

```bash
git add .
git commit -m "chore: verify build and test"
```

---

## Summary

实现计划分为 7 个阶段，共 23 个任务：

1. **项目初始化** - 目录结构、前后端项目创建
2. **认证系统** - 数据存储、认证服务、中间件、路由
3. **服务器管理** - Profiles 和 Snippets 服务与 API
4. **SSH/SFTP** - SSH 连接管理、WebSocket 终端、SFTP 文件操作
5. **前端组件** - 登录、终端、文件管理、编辑器、Dashboard
6. **Docker 部署** - Dockerfile 和 docker-compose
7. **构建测试** - 验证构建完成

---

## MVP 验收清单

- [ ] 登录页面可正常访问
- [ ] 用户名密码认证成功
- [ ] 可添加/编辑/删除服务器配置
- [ ] 服务器可按群组筛选
- [ ] 点击服务器可打开终端 Tab
- [ ] 终端可输入命令并接收输出
- [ ] 可关闭终端 Tab
- [ ] 文件管理器显示远程目录
- [ ] 可浏览目录结构
- [ ] 可打开文件进行编辑
- [ ] 可保存文件修改
- [ ] 命令片段可添加/删除
- [ ] 点击命令片段可复制到剪贴板
- [ ] Docker 构建成功
- [ ] 容器运行正常

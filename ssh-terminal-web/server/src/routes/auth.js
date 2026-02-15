import express from 'express'
import { getAuth, verifyPassword, initializeDefaultUser, changePassword } from '../services/authService.js'
import { generateToken, verifyToken } from '../middleware/auth.js'

const router = express.Router()

initializeDefaultUser()

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

router.get('/check', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ authenticated: false })
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)

  if (decoded) {
    res.json({ authenticated: true, username: decoded.username })
  } else {
    res.status(401).json({ authenticated: false })
  }
})

router.post('/logout', (req, res) => {
  res.json({ success: true })
})

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

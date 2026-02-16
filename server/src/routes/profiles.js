import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as profileService from '../services/profileService.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const profiles = await profileService.getProfiles()
    // Map 'group' to 'groupId' for frontend compatibility
    const mappedProfiles = profiles.map(p => ({
      ...p,
      groupId: p.group || p.groupId,
      authType: p.authType || 'password'
    }))
    res.json(mappedProfiles)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/groups', async (req, res) => {
  try {
    const groups = await profileService.getGroups()
    res.json(groups)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, host, port, username, password, groupId, tags } = req.body

    if (!name || !host || !username) {
      return res.status(400).json({ error: 'Name, host, username required' })
    }

    const profile = await profileService.addProfile({
      name,
      host,
      port: port || 22,
      username,
      password: password || '',
      group: groupId || 'default',
      tags: tags || []
    })

    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await profileService.deleteProfile(id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/groups', async (req, res) => {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Group name required' })
    }
    const group = await profileService.addGroup(name)
    res.json(group)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = {}
    const { name, expanded } = req.body
    if (name !== undefined) updates.name = name
    if (expanded !== undefined) updates.expanded = expanded

    const group = await profileService.updateGroup(id, updates)
    res.json(group)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params
    await profileService.deleteGroup(id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

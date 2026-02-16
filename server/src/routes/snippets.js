import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as snippetService from '../services/snippetService.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const snippets = await snippetService.getSnippetsList()
    // Map to frontend field names: title → name, group → groupId
    const mappedSnippets = snippets.map(s => ({
      id: s.id,
      name: s.title,
      command: s.command,
      groupId: s.group,
      createdAt: s.createdAt
    }))
    res.json(mappedSnippets)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/groups', async (req, res) => {
  try {
    const groups = await snippetService.getSnippetGroups()
    res.json(groups)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/groups', async (req, res) => {
  try {
    const { name, parentId } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Group name required' })
    }

    const group = await snippetService.addSnippetGroup(name, parentId || null)
    res.json(group)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, parentId, expanded } = req.body

    const updates = {}
    if (name !== undefined) updates.name = name
    if (parentId !== undefined) updates.parentId = parentId
    if (expanded !== undefined) updates.expanded = expanded

    const group = await snippetService.updateSnippetGroup(id, updates)
    res.json(group)
  } catch (err) {
    if (err.message === 'Group not found') {
      return res.status(404).json({ error: err.message })
    }
    res.status(500).json({ error: err.message })
  }
})

router.delete('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await snippetService.deleteSnippetGroup(id)
    res.json(result)
  } catch (err) {
    if (err.message === 'Group not found') {
      return res.status(404).json({ error: err.message })
    }
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    // Accept both old field names (title, group) and new field names (name, groupId)
    const { title, command, group, name, groupId } = req.body

    const snippetTitle = title || name
    const snippetGroup = group || groupId

    if (!snippetTitle || !command) {
      return res.status(400).json({ error: 'Title and command required' })
    }

    const snippet = await snippetService.addSnippet({
      title: snippetTitle,
      command,
      group: snippetGroup || 'default'
    })

    res.json(snippet)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

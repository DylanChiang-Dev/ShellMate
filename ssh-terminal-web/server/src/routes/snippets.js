import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as snippetService from '../services/snippetService.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const snippets = await snippetService.getSnippetsList()
    res.json(snippets)
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

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

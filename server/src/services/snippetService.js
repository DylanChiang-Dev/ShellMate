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

export async function addSnippetGroup(name, parentId = null) {
  const data = await getSnippets()
  const newGroup = {
    id: crypto.randomUUID(),
    name,
    parentId,
    expanded: true
  }
  data.groups.push(newGroup)
  await jsonfile.writeFile(snippetsFile, data, { spaces: 2 })
  return newGroup
}

export async function updateSnippetGroup(id, updates) {
  const data = await getSnippets()
  const index = data.groups.findIndex(g => g.id === id)
  if (index === -1) throw new Error('Group not found')

  data.groups[index] = { ...data.groups[index], ...updates }
  await jsonfile.writeFile(snippetsFile, data, { spaces: 2 })
  return data.groups[index]
}

// Helper function to get all child group IDs recursively
function getChildGroupIds(groups, parentId) {
  const children = groups.filter(g => g.parentId === parentId)
  let allChildIds = children.map(c => c.id)
  for (const child of children) {
    allChildIds = [...allChildIds, ...getChildGroupIds(groups, child.id)]
  }
  return allChildIds
}

// Helper function to move snippets from deleted group to parent
async function moveSnippetsToParent(groupId, newGroupId) {
  const data = await getSnippets()
  for (const snippet of data.snippets) {
    if (snippet.group === groupId) {
      snippet.group = newGroupId
    }
  }
  await jsonfile.writeFile(snippetsFile, data, { spaces: 2 })
}

export async function deleteSnippetGroup(id) {
  const data = await getSnippets()
  const group = data.groups.find(g => g.id === id)
  if (!group) throw new Error('Group not found')

  // Get all child group IDs recursively
  const childGroupIds = getChildGroupIds(data.groups, id)
  const allGroupIdsToDelete = [id, ...childGroupIds]

  // Determine target group for snippets (parent or default)
  const targetGroupId = group.parentId || 'default'

  // Move snippets to parent group (or default if at root)
  await moveSnippetsToParent(id, targetGroupId)

  // Delete all child groups first
  data.groups = data.groups.filter(g => !childGroupIds.includes(g.id))

  // Delete the group itself
  data.groups = data.groups.filter(g => g.id !== id)

  await jsonfile.writeFile(snippetsFile, data, { spaces: 2 })
  return { success: true, deletedGroups: allGroupIdsToDelete, movedSnippetsTo: targetGroupId }
}

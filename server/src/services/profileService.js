import jsonfile from 'jsonfile'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const profilesFile = path.join(__dirname, '../data/profiles.json')
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!'
const DEFAULT_GROUP_ID = 'default'

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
    return text
  }
}

export async function getProfiles() {
  const data = await jsonfile.readFile(profilesFile)
  return data.profiles.map(p => ({
    ...p,
    password: p.password ? decrypt(p.password) : ''
  }))
}

export async function getProfilesRaw() {
  return jsonfile.readFile(profilesFile)
}

export async function saveProfiles(data) {
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

export async function addGroup(name) {
  const data = await getProfilesRaw()

  // Check for duplicate group names
  if (data.groups.some(g => g.name === name)) {
    throw new Error('Group with this name already exists')
  }

  const newGroup = {
    id: crypto.randomUUID(),
    name,
    expanded: true
  }
  data.groups.push(newGroup)
  await jsonfile.writeFile(profilesFile, data, { spaces: 2 })
  return newGroup
}

export async function updateGroup(id, updates) {
  const data = await getProfilesRaw()
  const index = data.groups.findIndex(g => g.id === id)
  if (index === -1) throw new Error('Group not found')

  data.groups[index] = { ...data.groups[index], ...updates }
  await jsonfile.writeFile(profilesFile, data, { spaces: 2 })
  return data.groups[index]
}

export async function deleteGroup(id) {
  const data = await getProfilesRaw()
  const group = data.groups.find(g => g.id === id)
  if (!group) throw new Error('Group not found')

  // Cannot delete the 'default' group
  if (id === 'default') {
    throw new Error('Cannot delete default group')
  }

  // Move profiles in this group to 'default'
  data.profiles = data.profiles.map(p => {
    if (p.group === id) {
      return { ...p, group: 'default' }
    }
    return p
  })

  // Remove the group
  data.groups = data.groups.filter(g => g.id !== id)
  await jsonfile.writeFile(profilesFile, data, { spaces: 2 })
}

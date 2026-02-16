import jsonfile from 'jsonfile'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const profilesFile = path.join(__dirname, '../data/profiles.json')
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!'
const DEFAULT_GROUP_ID = 'default'

class Mutex {
  constructor() {
    this._queue = []
    this._locked = false
  }

  lock() {
    return new Promise((resolve) => {
      if (this._locked) {
        this._queue.push(resolve)
      } else {
        this._locked = true
        resolve()
      }
    })
  }

  unlock() {
    if (this._queue.length > 0) {
      const resolve = this._queue.shift()
      resolve()
    } else {
      this._locked = false
    }
  }

  async runExclusive(callback) {
    await this.lock()
    try {
      return await callback()
    } finally {
      this.unlock()
    }
  }
}

const fileMutex = new Mutex()

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
  return fileMutex.runExclusive(async () => {
    const data = await jsonfile.readFile(profilesFile)
    return data.profiles.map(p => ({
      ...p,
      password: p.password ? decrypt(p.password) : ''
    }))
  })
}

export async function getProfilesRaw() {
  // Internal helper, assumed to be called within a lock or needing one? 
  // IMPORTANT: Since getProfilesRaw is exported and used elsewhere, we should probably lock it too.
  // HOWEVER, functions like addProfile call getProfilesRaw. If we lock here, we deadlock if addProfile also locks.
  // Solution: Create an internal _getProfilesRaw that doesn't lock, and make exported functions use runExclusive.
  return jsonfile.readFile(profilesFile)
}

// Internal helper to read without lock (caller must hold lock)
async function _getProfilesRaw() {
  return jsonfile.readFile(profilesFile)
}

// Internal helper to save without lock (caller must hold lock)
async function _saveProfiles(data) {
  const encrypted = {
    ...data,
    profiles: data.profiles.map(p => ({
      ...p,
      password: p.password ? encrypt(p.password) : ''
    }))
  }
  await jsonfile.writeFile(profilesFile, encrypted, { spaces: 2 })
}


export async function saveProfiles(data) {
  return fileMutex.runExclusive(async () => {
    await _saveProfiles(data)
  })
}

export async function addProfile(profile) {
  return fileMutex.runExclusive(async () => {
    const data = await _getProfilesRaw()
    const newProfile = {
      id: crypto.randomUUID(),
      ...profile,
      createdAt: new Date().toISOString()
    }
    data.profiles.push(newProfile)
    await _saveProfiles(data)
    return { ...newProfile, password: profile.password }
  })
}

export async function updateProfile(id, updates) {
  return fileMutex.runExclusive(async () => {
    const data = await _getProfilesRaw()
    const index = data.profiles.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Profile not found')

    data.profiles[index] = { ...data.profiles[index], ...updates }
    await _saveProfiles(data)
    return { ...data.profiles[index], password: updates.password || '' }
  })
}

export async function deleteProfile(id) {
  return fileMutex.runExclusive(async () => {
    const data = await _getProfilesRaw()
    data.profiles = data.profiles.filter(p => p.id !== id)
    await _saveProfiles(data)
  })
}

export async function getGroups() {
  return fileMutex.runExclusive(async () => {
    const data = await _getProfilesRaw()
    return data.groups || []
  })
}

export async function addGroup(name) {
  return fileMutex.runExclusive(async () => {
    const data = await _getProfilesRaw()

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
    await _saveProfiles(data)
    return newGroup
  })
}

export async function updateGroup(id, updates) {
  return fileMutex.runExclusive(async () => {
    const data = await _getProfilesRaw()
    const index = data.groups.findIndex(g => g.id === id)
    if (index === -1) throw new Error('Group not found')

    data.groups[index] = { ...data.groups[index], ...updates }
    await _saveProfiles(data)
    return data.groups[index]
  })
}

export async function deleteGroup(id) {
  return fileMutex.runExclusive(async () => {
    const data = await _getProfilesRaw()
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
    await _saveProfiles(data)
  })
}

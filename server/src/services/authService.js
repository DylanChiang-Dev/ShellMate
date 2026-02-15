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

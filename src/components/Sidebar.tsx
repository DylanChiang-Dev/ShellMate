import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface Profile {
  id: string
  name: string
  host: string
  port: number
  username: string
}

interface SidebarProps {
  profiles: Profile[]
  activeSession: string | null
  onSessionSelect: (id: string) => void
}

export default function Sidebar({ profiles, activeSession, onSessionSelect }: SidebarProps) {
  const [showNewProfile, setShowNewProfile] = useState(false)
  const [newProfile, setNewProfile] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    authMethod: 'password',
  })

  async function createProfile() {
    try {
      await invoke('create_profile', {
        name: newProfile.name,
        host: newProfile.host,
        port: newProfile.port,
        username: newProfile.username,
        authMethod: newProfile.authMethod,
      })
      setShowNewProfile(false)
      setNewProfile({ name: '', host: '', port: 22, username: '', authMethod: 'password' })
    } catch (e) {
      console.error('建立設定檔失敗:', e)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">SSH 連線</span>
          <button
            onClick={() => setShowNewProfile(!showNewProfile)}
            className="text-sm bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
          >
            + 新增
          </button>
        </div>

        {showNewProfile && (
          <div className="space-y-2 mb-2">
            <input
              placeholder="名稱"
              value={newProfile.name}
              onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
              className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
            />
            <input
              placeholder="主機"
              value={newProfile.host}
              onChange={(e) => setNewProfile({ ...newProfile, host: e.target.value })}
              className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
            />
            <input
              placeholder="連接埠"
              type="number"
              value={newProfile.port}
              onChange={(e) => setNewProfile({ ...newProfile, port: parseInt(e.target.value) })}
              className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
            />
            <input
              placeholder="使用者名稱"
              value={newProfile.username}
              onChange={(e) => setNewProfile({ ...newProfile, username: e.target.value })}
              className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
            />
            <button
              onClick={createProfile}
              className="w-full bg-green-600 px-2 py-1 rounded text-sm hover:bg-green-700"
            >
              建立
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            onClick={() => onSessionSelect(profile.id)}
            className={`p-3 cursor-pointer hover:bg-gray-700 ${
              activeSession === profile.id ? 'bg-gray-700' : ''
            }`}
          >
            <div className="font-medium">{profile.name}</div>
            <div className="text-sm text-gray-400">
              {profile.username}@{profile.host}:{profile.port}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

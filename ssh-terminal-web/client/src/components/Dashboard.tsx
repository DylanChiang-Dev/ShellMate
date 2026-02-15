import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Profile, Snippet, Tab } from '../types'
import Terminal from './Terminal'
import FileManager from './FileManager'
import FileEditor from './Editor'
import { v4 as uuidv4 } from 'uuid'

export default function Dashboard() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [showNewProfile, setShowNewProfile] = useState(false)
  const [showNewSnippet, setShowNewSnippet] = useState(false)

  const [newProfile, setNewProfile] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    group: 'default',
  })
  const [newSnippet, setNewSnippet] = useState({
    title: '',
    command: '',
    group: 'system',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [profilesData, groupsData, snippetsData] = await Promise.all([
        api.getProfiles(),
        api.getProfileGroups(),
        api.getSnippets(),
      ])
      setProfiles(profilesData)
      setGroups(groupsData)
      setSnippets(snippetsData)
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  async function handleCreateProfile() {
    try {
      await api.createProfile(newProfile)
      setShowNewProfile(false)
      setNewProfile({ name: '', host: '', port: 22, username: '', password: '', group: 'default' })
      loadData()
    } catch (err) {
      console.error('Failed to create profile:', err)
    }
  }

  async function handleDeleteProfile(id: string) {
    try {
      await api.deleteProfile(id)
      setTabs(tabs.filter(t => t.profileId !== id))
      loadData()
    } catch (err) {
      console.error('Failed to delete profile:', err)
    }
  }

  async function handleCreateSnippet() {
    try {
      await api.createSnippet(newSnippet)
      setShowNewSnippet(false)
      setNewSnippet({ title: '', command: '', group: 'system' })
      loadData()
    } catch (err) {
      console.error('Failed to create snippet:', err)
    }
  }

  async function handleDeleteSnippet(id: string) {
    try {
      await api.deleteSnippet(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete snippet:', err)
    }
  }

  function openTerminal(profileId: string) {
    const profile = profiles.find(p => p.id === profileId)
    if (!profile) return

    const newTab: Tab = {
      id: uuidv4(),
      title: profile.name,
      profileId,
      type: 'terminal',
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  function closeTab(tabId: string) {
    setTabs(tabs.filter(t => t.id !== tabId))
    if (activeTabId === tabId) {
      setActiveTabId(tabs.length > 1 ? tabs[0].id : null)
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  const activeTab = tabs.find(t => t.id === activeTabId)
  const filteredProfiles = selectedGroup === 'all'
    ? profiles
    : profiles.filter(p => p.group === selectedGroup)

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h1 className="text-lg font-bold">SSH Terminal</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">{localStorage.getItem('username')}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white"
          >
            登出
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">服务器</span>
                <button
                  onClick={() => setShowNewProfile(!showNewProfile)}
                  className="text-sm bg-blue-600 px-2 py-0.5 rounded hover:bg-blue-700"
                >
                  + 新建
                </button>
              </div>

              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full bg-gray-700 px-2 py-1 rounded text-sm mb-2"
              >
                <option value="all">全部</option>
                {groups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              {showNewProfile && (
                <div className="space-y-2 mb-2 p-2 bg-gray-700 rounded">
                  <input
                    placeholder="名称"
                    value={newProfile.name}
                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                    className="w-full bg-gray-600 px-2 py-1 rounded text-sm"
                  />
                  <input
                    placeholder="主机"
                    value={newProfile.host}
                    onChange={(e) => setNewProfile({ ...newProfile, host: e.target.value })}
                    className="w-full bg-gray-600 px-2 py-1 rounded text-sm"
                  />
                  <input
                    placeholder="端口"
                    type="number"
                    value={newProfile.port}
                    onChange={(e) => setNewProfile({ ...newProfile, port: parseInt(e.target.value) })}
                    className="w-full bg-gray-600 px-2 py-1 rounded text-sm"
                  />
                  <input
                    placeholder="用户名"
                    value={newProfile.username}
                    onChange={(e) => setNewProfile({ ...newProfile, username: e.target.value })}
                    className="w-full bg-gray-600 px-2 py-1 rounded text-sm"
                  />
                  <input
                    placeholder="密码"
                    type="password"
                    value={newProfile.password}
                    onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
                    className="w-full bg-gray-600 px-2 py-1 rounded text-sm"
                  />
                  <button
                    onClick={handleCreateProfile}
                    className="w-full bg-green-600 px-2 py-1 rounded text-sm hover:bg-green-700"
                  >
                    创建
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-2 hover:bg-gray-700 cursor-pointer group"
                  onClick={() => openTerminal(profile.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{profile.name}</div>
                      <div className="text-xs text-gray-400">
                        {profile.username}@{profile.host}:{profile.port}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProfile(profile.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-700 p-2 max-h-1/3 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">命令片段</span>
              <button
                onClick={() => setShowNewSnippet(!showNewSnippet)}
                className="text-xs bg-blue-600 px-2 py-0.5 rounded"
              >
                + 新建
              </button>
            </div>

            {showNewSnippet && (
              <div className="space-y-1 mb-2 p-2 bg-gray-700 rounded">
                <input
                  placeholder="标题"
                  value={newSnippet.title}
                  onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                  className="w-full bg-gray-600 px-2 py-1 rounded text-xs"
                />
                <input
                  placeholder="命令"
                  value={newSnippet.command}
                  onChange={(e) => setNewSnippet({ ...newSnippet, command: e.target.value })}
                  className="w-full bg-gray-600 px-2 py-1 rounded text-xs"
                />
                <button
                  onClick={handleCreateSnippet}
                  className="w-full bg-green-600 px-2 py-1 rounded text-xs"
                >
                  添加
                </button>
              </div>
            )}

            <div className="space-y-1">
              {snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="p-1 bg-gray-700 rounded text-xs group cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    navigator.clipboard.writeText(snippet.command)
                  }}
                  title={snippet.command}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{snippet.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSnippet(snippet.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex bg-gray-800 border-b border-gray-700">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center px-3 py-2 cursor-pointer ${
                  activeTabId === tab.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span>{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex-1 border-b border-gray-700">
            {activeTab ? (
              <Terminal
                profileId={activeTab.profileId}
                onDisconnect={() => closeTab(activeTab.id)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                选择一个服务器开始连接
              </div>
            )}
          </div>

          <div className="h-64 flex">
            <div className="w-1/2 border-r border-gray-700 overflow-hidden">
              <div className="bg-gray-800 px-2 py-1 text-sm font-semibold border-b border-gray-700">
                文件管理
              </div>
              <div className="h-[calc(100%-2rem)] overflow-hidden">
                <FileManager
                  profileId={activeTab?.profileId || null}
                  onFileSelect={setSelectedFile}
                />
              </div>
            </div>
            <div className="w-1/2 overflow-hidden">
              <div className="h-full overflow-hidden">
                <FileEditor
                  filePath={selectedFile}
                  profileId={activeTab?.profileId || null}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

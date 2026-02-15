import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Sidebar from './components/Sidebar'
import TerminalPane from './components/TerminalPane'
import Editor from './components/Editor'
import FileTree from './components/FileTree'
import CommandSnippets from './components/CommandSnippets'

interface Profile {
  id: string
  name: string
  host: string
  port: number
  username: string
}

function App() {
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    try {
      const result = await invoke('get_profiles')
      setProfiles(result as Profile[])
    } catch (e) {
      console.error('Failed to load profiles:', e)
    }
  }

  async function handleConnect(profileId: string) {
    try {
      const sessionId = await invoke('create_ssh_session', { profileId })
      setActiveSession(sessionId as string)
    } catch (e) {
      console.error('Failed to connect:', e)
    }
  }

  async function handleNewLocalSession() {
    try {
      const sessionId = await invoke('create_local_session')
      setActiveSession(sessionId as string)
    } catch (e) {
      console.error('Failed to create local session:', e)
    }
  }

  function handleInsertCommand(command: string) {
    console.log('Insert command:', command)
    // TODO: Insert command to active terminal
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* 左側 Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <Sidebar
          profiles={profiles}
          activeSession={activeSession}
          onSessionSelect={(id) => handleConnect(id)}
        />
        <CommandSnippets onInsertCommand={handleInsertCommand} />
      </div>

      {/* 右側區域 */}
      <div className="flex-1 flex flex-col">
        {/* 右上：檔案樹 */}
        <div className="h-1/3 border-b border-gray-700">
          <FileTree
            sessionId={activeSession}
            onFileSelect={(path) => console.log('Selected file:', path)}
          />
        </div>

        {/* 右下：編輯器 + 終端機 */}
        <div className="h-2/3 flex flex-col">
          <div className="h-1/2 border-b border-gray-700">
            <Editor />
          </div>
          <div className="h-1/2">
            <TerminalPane sessionId={activeSession} />
          </div>
        </div>
      </div>

      {/* 新增本地 Session 按鈕 */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={handleNewLocalSession}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
        >
          + New Local Session
        </button>
      </div>
    </div>
  )
}

export default App

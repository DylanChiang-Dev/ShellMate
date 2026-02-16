import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Server, Tab } from '../types'
import Terminal, { TerminalHandle } from './Terminal'
import { ServerPanel } from './ServerPanel'
import { CommandPanel } from './CommandPanel'
import { v4 as uuidv4 } from 'uuid'

export default function Dashboard() {
  const navigate = useNavigate()
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const terminalRef = useRef<TerminalHandle>(null)

  useEffect(() => {
    const user = localStorage.getItem('username')
    if (user) setUsername(user)
  }, [])

  const handleConnect = (server: Server) => {
    const newTab: Tab = {
      id: uuidv4(),
      title: server.name,
      profileId: server.id,
      type: 'terminal',
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  const handleExecuteCommand = (command: string) => {
    if (terminalRef.current) {
      terminalRef.current.sendInput(command + '\r')
    }
  }

  const closeTab = (tabId: string) => {
    setTabs(tabs.filter(t => t.id !== tabId))
    if (activeTabId === tabId) {
      setActiveTabId(tabs.length > 1 ? tabs[0].id : null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  const activeTab = tabs.find(t => t.id === activeTabId)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <h1 className="text-lg font-semibold">SSH Terminal</h1>
        <div className="flex items-center gap-4">
          <span>{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white">
            退出
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Server Panel (250px) */}
        <div className="w-64 border-r border-gray-700 bg-gray-800">
          <ServerPanel onConnect={handleConnect} />
        </div>

        {/* Center: Terminal Area (flex-1) */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="h-9 bg-gray-800 border-b border-gray-700 flex items-center">
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

          {/* Terminal */}
          <div className="flex-1 bg-black">
            {activeTab ? (
              <Terminal
                ref={terminalRef}
                profileId={activeTab.profileId}
                onDisconnect={() => closeTab(activeTab.id)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                选择一个服务器开始连接
              </div>
            )}
          </div>
        </div>

        {/* Right: Command Panel (250px) */}
        <div className="w-64 border-l border-gray-700 bg-gray-800">
          <CommandPanel onExecute={handleExecuteCommand} />
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface CommandSnippet {
  id: string
  title: string
  command: string
}

interface CommandSnippetsProps {
  onInsertCommand: (command: string) => void
}

export default function CommandSnippets({ onInsertCommand }: CommandSnippetsProps) {
  const [snippets, setSnippets] = useState<CommandSnippet[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newSnippet, setNewSnippet] = useState({ title: '', command: '' })

  useEffect(() => {
    loadSnippets()
  }, [])

  async function loadSnippets() {
    try {
      const result = await invoke('get_commands')
      setSnippets(result as CommandSnippet[])
    } catch (e) {
      console.error('Failed to load snippets:', e)
    }
  }

  async function createSnippet() {
    try {
      await invoke('create_command', {
        title: newSnippet.title,
        command: newSnippet.command,
      })
      setShowNew(false)
      setNewSnippet({ title: '', command: '' })
      loadSnippets()
    } catch (e) {
      console.error('Failed to create snippet:', e)
    }
  }

  return (
    <div className="border-t border-gray-700 p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">Commands</span>
        <button
          onClick={() => setShowNew(!showNew)}
          className="text-xs bg-blue-600 px-2 py-0.5 rounded"
        >
          + New
        </button>
      </div>

      {showNew && (
        <div className="space-y-1 mb-2">
          <input
            placeholder="Title"
            value={newSnippet.title}
            onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
            className="w-full bg-gray-700 px-2 py-1 rounded text-xs"
          />
          <input
            placeholder="Command"
            value={newSnippet.command}
            onChange={(e) => setNewSnippet({ ...newSnippet, command: e.target.value })}
            className="w-full bg-gray-700 px-2 py-1 rounded text-xs"
          />
          <button
            onClick={createSnippet}
            className="w-full bg-green-600 px-2 py-1 rounded text-xs"
          >
            Add
          </button>
        </div>
      )}

      <div className="space-y-1 overflow-y-auto max-h-40">
        {snippets.map((snippet) => (
          <div
            key={snippet.id}
            onClick={() => onInsertCommand(snippet.command)}
            className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 text-xs"
          >
            <div className="font-medium">{snippet.title}</div>
            <div className="text-gray-400 truncate">{snippet.command}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

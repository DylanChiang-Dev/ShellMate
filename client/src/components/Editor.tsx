import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

interface EditorProps {
  filePath: string | null
  profileId: string | null
  onSave?: (content: string) => void
}

export default function FileEditor({ filePath, profileId, onSave }: EditorProps) {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (filePath && profileId) {
      loadFile()
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [filePath, profileId])

  async function loadFile() {
    if (!filePath || !profileId) return

    setLoading(true)

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?type=file`)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect', profileId }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'connected') {
        ws.send(JSON.stringify({ type: 'read', path: filePath }))
      } else if (data.type === 'read') {
        setContent(data.content)
        setOriginalContent(data.content)
        setLoading(false)
        ws.close()
      } else if (data.type === 'error') {
        console.error(data.message)
        setLoading(false)
        ws.close()
      }
    }

    wsRef.current = ws
  }

  async function saveFile() {
    if (!filePath || !profileId || saving) return

    setSaving(true)

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?type=file`)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect', profileId }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'connected') {
        ws.send(JSON.stringify({ type: 'write', path: filePath, content }))
      } else if (data.type === 'write') {
        setOriginalContent(content)
        setSaving(false)
        onSave?.(content)
        ws.close()
      } else if (data.type === 'error') {
        console.error(data.message)
        setSaving(false)
        ws.close()
      }
    }
  }

  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <div>选择文件进行编辑</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
        加载中...
      </div>
    )
  }

  const hasChanges = content !== originalContent

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <div className="flex items-center">
          <span className="text-sm text-gray-300">{filePath.split('/').pop()}</span>
          {hasChanges && <span className="ml-2 text-yellow-500 text-sm">*</span>}
        </div>
        <button
          onClick={saveFile}
          disabled={!hasChanges || saving}
          className={`px-3 py-1 text-sm rounded ${
            hasChanges
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-700 text-gray-500'
          } disabled:opacity-50`}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="plaintext"
          theme="vs-dark"
          value={content}
          onChange={(value) => setContent(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useFileTree } from '../hooks/useFileTree'

interface FileTreeProps {
  sessionId: string | null
  onFileSelect: (path: string) => void
}

export default function FileTree({ sessionId, onFileSelect }: FileTreeProps) {
  const [currentPath, setCurrentPath] = useState('/')
  const {
    entries,
    loading,
    error,
    loadDirectory,
  } = useFileTree(sessionId)

  if (!sessionId) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        請先選擇一個遠端連線來查看檔案
      </div>
    )
  }

  if (loading) {
    return <div className="p-4 text-gray-400">載入中...</div>
  }

  if (error) {
    return <div className="p-4 text-red-400">{error}</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-gray-700 flex items-center">
        <button
          onClick={() => {
            const parent = currentPath.split('/').slice(0, -1).join('/') || '/'
            setCurrentPath(parent)
            loadDirectory(parent)
          }}
          className="mr-2 text-gray-400 hover:text-white"
        >
          ←
        </button>
        <span className="text-sm text-gray-300">{currentPath}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {entries.map((entry) => (
          <div
            key={entry.path}
            className="flex items-center p-1 hover:bg-gray-700 rounded cursor-pointer"
            onClick={() => {
              if (entry.isDirectory) {
                setCurrentPath(entry.path)
                loadDirectory(entry.path)
              } else {
                onFileSelect(entry.path)
              }
            }}
          >
            <span className="mr-2">{entry.isDirectory ? '📁' : '📄'}</span>
            <span className="text-sm">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

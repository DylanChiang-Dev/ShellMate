import { useState, useEffect } from 'react'
import { useSftp } from '../hooks/useSftp'
import { FileEntry } from '../types'

interface FileManagerProps {
  profileId: string | null
  onFileSelect?: (path: string) => void
}

export default function FileManager({ profileId, onFileSelect }: FileManagerProps) {
  const {
    files,
    currentPath,
    loading,
    error,
    connect,
    disconnect,
    listDirectory,
    deleteFile,
  } = useSftp({ profileId })

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileEntry } | null>(null)

  useEffect(() => {
    if (profileId) {
      connect(profileId)
    } else {
      disconnect()
    }
    return () => disconnect()
  }, [profileId, connect, disconnect])

  function navigateTo(path: string) {
    listDirectory(path)
  }

  function goUp() {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    const parent = '/' + parts.join('/')
    navigateTo(parent || '/')
  }

  function handleContextMenu(e: React.MouseEvent, file: FileEntry) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, file })
  }

  function closeContextMenu() {
    setContextMenu(null)
  }

  if (!profileId) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        选择服务器以查看文件
      </div>
    )
  }

  if (loading) {
    return <div className="p-4 text-gray-400">加载中...</div>
  }

  if (error) {
    return <div className="p-4 text-red-400">错误: {error}</div>
  }

  return (
    <div className="h-full flex flex-col" onClick={closeContextMenu}>
      <div className="flex items-center p-2 border-b border-gray-700">
        <button
          onClick={goUp}
          className="px-2 py-1 text-gray-400 hover:text-white mr-2"
          disabled={currentPath === '/'}
        >
          ←
        </button>
        <span className="text-sm text-gray-300 truncate">{currentPath}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {files
          .sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1
            if (!a.isDirectory && b.isDirectory) return 1
            return a.name.localeCompare(b.name)
          })
          .map((file) => (
            <div
              key={file.name}
              className="flex items-center p-1 hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => {
                if (file.isDirectory) {
                  navigateTo(currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`)
                } else {
                  onFileSelect?.(currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`)
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, file)}
            >
              <span className="mr-2">{file.isDirectory ? '📁' : '📄'}</span>
              <span className="text-sm">{file.name}</span>
            </div>
          ))}
      </div>

      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-1 text-left text-sm hover:bg-gray-700"
            onClick={() => {
              if (contextMenu.file.isDirectory) {
                navigateTo(`${currentPath}/${contextMenu.file.name}`)
              }
              closeContextMenu()
            }}
          >
            打开
          </button>
          {!contextMenu.file.isDirectory && (
            <button
              className="w-full px-4 py-1 text-left text-sm hover:bg-gray-700"
              onClick={() => {
                onFileSelect?.(`${currentPath}/${contextMenu.file.name}`)
                closeContextMenu()
              }}
            >
              编辑
            </button>
          )}
          <button
            className="w-full px-4 py-1 text-left text-sm text-red-400 hover:bg-gray-700"
            onClick={() => {
              deleteFile(`${currentPath}/${contextMenu.file.name}`)
              closeContextMenu()
            }}
          >
            删除
          </button>
        </div>
      )}
    </div>
  )
}

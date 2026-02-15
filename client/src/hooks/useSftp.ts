import { useState, useRef, useCallback } from 'react'
import { FileEntry } from '../types'

interface UseSftpOptions {
  profileId: string | null
}

export function useSftp({ }: UseSftpOptions) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [currentPath, setCurrentPath] = useState('/')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback((pId: string) => {
    if (!pId) return

    if (wsRef.current) {
      wsRef.current.close()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//localhost:3000/ws?type=file`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect', profileId: pId }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'connected':
          ws.send(JSON.stringify({ type: 'list', path: '/' }))
          break
        case 'list':
          setFiles(data.files)
          setCurrentPath(data.path)
          setLoading(false)
          break
        case 'error':
          setError(data.message)
          setLoading(false)
          break
      }
    }

    ws.onerror = () => {
      setError('Connection error')
    }

    wsRef.current = ws
  }, [])

  const listDirectory = useCallback((path: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    setLoading(true)
    wsRef.current.send(JSON.stringify({ type: 'list', path }))
  }, [])

  const readFile = useCallback((path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current) return reject(new Error('Not connected'))

      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data)
        if (data.type === 'read' && data.path === path) {
          wsRef.current?.removeEventListener('message', handler)
          resolve(data.content)
        } else if (data.type === 'error') {
          wsRef.current?.removeEventListener('message', handler)
          reject(new Error(data.message))
        }
      }

      wsRef.current.addEventListener('message', handler)
      wsRef.current.send(JSON.stringify({ type: 'read', path }))
    })
  }, [])

  const writeFile = useCallback((path: string, content: string) => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current) return reject(new Error('Not connected'))

      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data)
        if (data.type === 'write') {
          wsRef.current?.removeEventListener('message', handler)
          resolve(true)
        } else if (data.type === 'error') {
          wsRef.current?.removeEventListener('message', handler)
          reject(new Error(data.message))
        }
      }

      wsRef.current.addEventListener('message', handler)
      wsRef.current.send(JSON.stringify({ type: 'write', path, content }))
    })
  }, [])

  const createDirectory = useCallback((path: string) => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current) return reject(new Error('Not connected'))

      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data)
        if (data.type === 'mkdir') {
          wsRef.current?.removeEventListener('message', handler)
          resolve(true)
        } else if (data.type === 'error') {
          wsRef.current?.removeEventListener('message', handler)
          reject(new Error(data.message))
        }
      }

      wsRef.current.addEventListener('message', handler)
      wsRef.current.send(JSON.stringify({ type: 'mkdir', path }))
    })
  }, [])

  const deleteFile = useCallback((path: string) => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current) return reject(new Error('Not connected'))

      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data)
        if (data.type === 'delete' || data.type === 'rmdir') {
          wsRef.current?.removeEventListener('message', handler)
          resolve(true)
        } else if (data.type === 'error') {
          wsRef.current?.removeEventListener('message', handler)
          reject(new Error(data.message))
        }
      }

      wsRef.current.addEventListener('message', handler)
      wsRef.current.send(JSON.stringify({ type: 'delete', path }))
    })
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'disconnect' }))
      }
      wsRef.current.close()
      wsRef.current = null
    }
    setFiles([])
    setCurrentPath('/')
  }, [])

  return {
    files,
    currentPath,
    loading,
    error,
    connect,
    disconnect,
    listDirectory,
    readFile,
    writeFile,
    createDirectory,
    deleteFile,
  }
}

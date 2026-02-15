import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { FileEntry } from '../types/fileTree'

export function useFileTree(sessionId: string | null) {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadDirectory(path: string) {
    if (!sessionId) return

    setLoading(true)
    setError(null)

    try {
      const result = await invoke('list_directory', {
        sessionId,
        path,
      })
      setEntries(result as FileEntry[])
    } catch (e) {
      setError(e as string)
    } finally {
      setLoading(false)
    }
  }

  async function createFile(name: string, path: string) {
    await invoke('create_file', { sessionId, name, path })
    loadDirectory(path)
  }

  async function createDirectory(name: string, path: string) {
    await invoke('create_directory', { sessionId, name, path })
    loadDirectory(path)
  }

  async function deleteEntry(path: string) {
    await invoke('delete_entry', { sessionId, path })
    loadDirectory(path)
  }

  async function renameEntry(oldPath: string, newName: string) {
    await invoke('rename_entry', { sessionId, oldPath, newName })
  }

  return {
    entries,
    loading,
    error,
    loadDirectory,
    createFile,
    createDirectory,
    deleteEntry,
    renameEntry,
  }
}

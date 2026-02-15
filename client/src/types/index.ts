export interface Profile {
  id: string
  name: string
  host: string
  port: number
  username: string
  password?: string
  group: string
  tags: string[]
  createdAt: string
}

export interface Snippet {
  id: string
  title: string
  command: string
  group: string
  createdAt: string
}

export interface Tab {
  id: string
  title: string
  profileId: string
  type: 'terminal' | 'sftp'
}

export interface FileEntry {
  name: string
  isDirectory: boolean
  isFile: boolean
  size: number
  modified: string
}

export interface WsMessage {
  type: string
  [key: string]: any
}

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

// Server groups
export interface ServerGroup {
  id: string;
  name: string;
  expanded: boolean;
}

// Server
export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key';
  password?: string;
  privateKey?: string;
  groupId: string;
}

// Command group (supports 2-3 levels)
export interface CommandGroup {
  id: string;
  name: string;
  parentId: string | null;  // null for top-level group
  expanded: boolean;
}

// Command
export interface Command {
  id: string;
  name: string;
  command: string;
  groupId: string;
}

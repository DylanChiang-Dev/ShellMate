import { Profile, Snippet, Server, ServerGroup, Command, CommandGroup } from '../types'

const getToken = () => localStorage.getItem('token')

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    ...options.headers,
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return res.json()
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  checkAuth: () =>
    request<{ authenticated: boolean; username: string }>('/api/auth/check'),

  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),

  getProfiles: () => request<Profile[]>('/api/profiles'),

  getProfileGroups: () => request<string[]>('/api/profiles/groups'),

  createProfile: (profile: { name: string; host: string; port: number; username: string; password?: string; group?: string; tags?: string[] }) =>
    request<Profile>('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    }),

  updateProfile: (id: string, updates: Partial<Profile>) =>
    request<Profile>(`/api/profiles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }),

  deleteProfile: (id: string) =>
    request<void>(`/api/profiles/${id}`, { method: 'DELETE' }),

  getSnippets: () => request<Snippet[]>('/api/snippets'),

  getSnippetGroups: () => request<string[]>('/api/snippets/groups'),

  createSnippet: (snippet: Omit<Snippet, 'id' | 'createdAt'>) =>
    request<Snippet>('/api/snippets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snippet),
    }),

  deleteSnippet: (id: string) =>
    request<void>(`/api/snippets/${id}`, { method: 'DELETE' }),
}

// Server groups
export const serverGroups = {
  getAll: () => request<ServerGroup[]>('/api/profiles/groups'),
  create: (name: string) => request<ServerGroup>('/api/profiles/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }),
  update: (id: string, data: Partial<ServerGroup>) => request<ServerGroup>(`/api/profiles/groups/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/profiles/groups/${id}`, { method: 'DELETE' }),
}

// Server (using new Server type with groupId)
export const servers = {
  getAll: () => request<Server[]>('/api/profiles'),
  create: (data: Omit<Server, 'id'>) => request<Server>('/api/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Server>) => request<Server>(`/api/profiles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/profiles/${id}`, { method: 'DELETE' }),
}

// Command groups (hierarchical)
export const commandGroups = {
  getAll: () => request<CommandGroup[]>('/api/snippets/groups'),
  create: (name: string, parentId: string | null) =>
    request<CommandGroup>('/api/snippets/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, parentId }) }),
  update: (id: string, data: Partial<CommandGroup>) =>
    request<CommandGroup>(`/api/snippets/groups/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/snippets/groups/${id}`, { method: 'DELETE' }),
}

// Commands/snippet (using new Command type with groupId)
export const commands = {
  getAll: () => request<Command[]>('/api/snippets'),
  create: (data: Omit<Command, 'id'>) => request<Command>('/api/snippets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Command>) => request<Command>(`/api/snippets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/snippets/${id}`, { method: 'DELETE' }),
}

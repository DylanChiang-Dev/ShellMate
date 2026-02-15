import { Profile, Snippet } from '../types'

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

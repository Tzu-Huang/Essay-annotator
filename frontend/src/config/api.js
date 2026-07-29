const env = import.meta.env ?? {}

export function normalizeApiBase(value = '') {
  const normalized = String(value).trim().replace(/\/+$/, '')
  return normalized || '/api'
}

export const API_BASE = normalizeApiBase(env.VITE_API_BASE)

export function apiUrl(path = '') {
  const normalizedPath = String(path).trim()
  if (!normalizedPath) return API_BASE
  return `${API_BASE}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`
}

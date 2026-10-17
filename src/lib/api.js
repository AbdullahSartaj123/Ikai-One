const DEFAULT_API_BASE_URL = 'https://api.ikai.one'
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
const STAGING_TOKEN_KEY = 'ikai-staging-bearer-token'
const USE_STAGING_BEARER = (() => {
  try { return new URL(API_BASE_URL).hostname.endsWith('.workers.dev') } catch { return false }
})()

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (USE_STAGING_BEARER && typeof window !== 'undefined') {
    const token = window.sessionStorage.getItem(STAGING_TOKEN_KEY)
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: 'no-store',
      credentials: USE_STAGING_BEARER ? 'omit' : 'include',
    })
  } catch {
    throw new Error('Unable to reach Ikai.One services. Check your connection and try again.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error || 'The request could not be completed.')
    error.status = response.status
    error.code = payload.code
    throw error
  }
  if (USE_STAGING_BEARER && typeof window !== 'undefined') {
    if ((path === '/api/auth/login' || path === '/api/auth/verify-email') && payload.token) {
      window.sessionStorage.setItem(STAGING_TOKEN_KEY, payload.token)
    }
    if (path === '/api/auth/logout') window.sessionStorage.removeItem(STAGING_TOKEN_KEY)
  }
  return payload
}

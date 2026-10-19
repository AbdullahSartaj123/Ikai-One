import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api.js'

const AuthContext = createContext(null)
const PENDING_KEY = 'ikai-pending-signup'
const LEGACY_SESSION_KEY = 'ikai-auth-session'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [pendingSignup, setPendingSignup] = useState(() => {
    try { return JSON.parse(window.sessionStorage.getItem(PENDING_KEY) || 'null') } catch { return null }
  })
  const [authLoading, setAuthLoading] = useState(true)
  const [authMessage, setAuthMessage] = useState('')

  useEffect(() => {
    // Remove bearer tokens left by the previous frontend version.
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY)
    let active = true
    apiRequest('/api/auth/me')
      .then(({ user }) => { if (active) setSession({ user }) })
      .catch(() => { if (active) setSession(null) })
      .finally(() => { if (active) setAuthLoading(false) })
    return () => { active = false }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const result = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: String(email || '').trim().toLowerCase(), password },
    })
    const next = { user: result.user }
    window.sessionStorage.removeItem(PENDING_KEY)
    setPendingSignup(null)
    setSession(next)
    setAuthMessage('')
    return { ok: true, user: next.user }
  }, [])

  const signOut = useCallback(async () => {
    try { await apiRequest('/api/auth/logout', { method: 'POST' }) } catch { /* Clear local UI even if the network is unavailable. */ }
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY)
    window.sessionStorage.removeItem(PENDING_KEY)
    setSession(null)
    setPendingSignup(null)
    setAuthMessage('')
  }, [])

  const beginSignup = useCallback(async (details) => {
    const result = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: details.fullName,
        companyName: details.companyName,
        email: String(details.email || '').trim().toLowerCase(),
        password: details.password,
        businessType: details.businessType,
      },
    })
    const pending = {
      fullName: details.fullName,
      companyName: details.companyName,
      email: String(details.email || '').trim().toLowerCase(),
      phone: details.phone || '',
      businessType: details.businessType || 'E-commerce / Online store',
      emailSent: result.emailSent,
      createdAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    setPendingSignup(pending)
    setAuthMessage(result.message || '')
    return result
  }, [])

  const verifyEmail = useCallback(async (token) => {
    const result = await apiRequest('/api/auth/verify-email', {
      method: 'POST',
      body: { token },
    })
    setSession(result.token && result.user ? { user: result.user } : null)
    window.sessionStorage.removeItem(PENDING_KEY)
    setPendingSignup(null)
    setAuthMessage('')
    return result
  }, [])

  const resendVerification = useCallback(async (email) => apiRequest('/api/auth/resend-verification', {
    method: 'POST',
    body: { email: String(email || '').trim().toLowerCase() },
  }), [])

  const requestPasswordReset = useCallback(async (email) => apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: { email: String(email || '').trim().toLowerCase() },
  }), [])

  const resetPassword = useCallback(async (token, password) => apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: { token, password },
  }), [])

  const completeOnboarding = useCallback(() => {
    window.sessionStorage.removeItem(PENDING_KEY)
    setPendingSignup(null)
    return { ok: true, user: session?.user }
  }, [session?.user])

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    isAuthenticated: Boolean(session?.user),
    authLoading,
    pendingSignup,
    authMessage,
    setAuthMessage,
    signIn,
    signOut,
    beginSignup,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword,
    completeOnboarding,
  }), [session, authLoading, pendingSignup, authMessage, signIn, signOut, beginSignup, verifyEmail, resendVerification, requestPasswordReset, resetPassword, completeOnboarding])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

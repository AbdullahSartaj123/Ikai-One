import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const SESSION_KEY = 'ikai-demo-session'
const PENDING_KEY = 'ikai-pending-signup'
const DEMO_ACCOUNTS = [
  { name: 'Abdullah Demo', email: 'demo@ikai.one', password: 'IkaiDemo123!', company: 'IKAI One Commerce', role: 'Store owner' },
  { name: 'Alex Operations', email: 'ops@ikai.one', password: 'OpsDemo123!', company: 'IKAI One Commerce', role: 'Operations manager' },
  { name: 'Sam Finance', email: 'finance@ikai.one', password: 'Finance123!', company: 'IKAI One Commerce', role: 'Finance viewer' },
]
function readJson(key, fallback = null) {
  try { return JSON.parse(window.sessionStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readJson(SESSION_KEY))
  const [pendingSignup, setPendingSignup] = useState(() => readJson(PENDING_KEY))
  const [authMessage, setAuthMessage] = useState('')
  function signIn(identifier, password) {
    const key = String(identifier || '').trim().toLowerCase()
    const user = DEMO_ACCOUNTS.find(account => account.email.toLowerCase() === key && account.password === password)
    if (!user) return { ok: false, message: 'Those details did not match a demo account. Try one of the sample accounts below.' }
    const next = { name: user.name, email: user.email, phone: '', company: user.company, role: user.role }
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    setSession(next); setAuthMessage('')
    return { ok: true, user: next }
  }
  function signOut() {
    window.sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }
  function beginSignup(details) {
    const pending = { ...details, createdAt: new Date().toISOString(), otpVerified: false }
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    setPendingSignup(pending); setAuthMessage('')
  }
  function verifyOtp(code) {
    if (!pendingSignup) return { ok: false, message: 'Your signup session has expired. Please start again.' }
    if (String(code) !== '123456') return { ok: false, message: 'That code is not correct. For this demo, use 123456.' }
    const verified = { ...pendingSignup, otpVerified: true }
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(verified))
    setPendingSignup(verified)
    return { ok: true }
  }
  function completeOnboarding(profile) {
    if (!pendingSignup?.otpVerified) return { ok: false, message: 'Verify your email or phone before continuing.' }
    // Keep only non-sensitive session details. Bank, KYC and pickup fields are not persisted.
    const next = {
      name: pendingSignup.contactName || profile.companyName || 'Shipper admin',
      email: pendingSignup.email,
      phone: pendingSignup.phone,
      company: profile.companyName || pendingSignup.companyName,
      role: 'Company admin',
    }
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    window.sessionStorage.removeItem(PENDING_KEY)
    setPendingSignup(null); setSession(next)
    return { ok: true, user: next }
  }
  const value = useMemo(() => ({ session, isAuthenticated: Boolean(session), pendingSignup, authMessage, setAuthMessage, signIn, signOut, beginSignup, verifyOtp, completeOnboarding }), [session, pendingSignup, authMessage])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
export { DEMO_ACCOUNTS }

import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const SESSION_KEY = 'ikai-demo-session'
const PENDING_KEY = 'ikai-pending-signup'
const USERS_KEY = 'ikai-demo-users'
const DEMO_ACCOUNTS = [
  { name: 'Abdullah Demo', email: 'demo@ikai.one', password: 'IkaiDemo123!', company: 'IKAI One Commerce', role: 'Store owner' },
  { name: 'Alex Operations', email: 'ops@ikai.one', password: 'OpsDemo123!', company: 'IKAI One Commerce', role: 'Operations manager' },
  { name: 'Sam Finance', email: 'finance@ikai.one', password: 'Finance123!', company: 'IKAI One Commerce', role: 'Finance viewer' },
]
function readJson(key, fallback = null) {
  try { return JSON.parse(window.sessionStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}
function readUsers() {
  try { return JSON.parse(window.localStorage.getItem(USERS_KEY) || '[]') } catch { return [] }
}
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readJson(SESSION_KEY))
  const [pendingSignup, setPendingSignup] = useState(() => readJson(PENDING_KEY))
  const [authMessage, setAuthMessage] = useState('')
  function signIn(identifier, password) {
    const key = String(identifier || '').trim().toLowerCase()
    const demo = DEMO_ACCOUNTS.find(user => (user.email.toLowerCase() === key || user.phone === key) && user.password === password)
    const registered = readUsers().find(user => (user.email?.toLowerCase() === key || user.phone === key) && user.password === password)
    const user = demo || registered
    if (!user) return { ok: false, message: 'Those details did not match a demo account. Try one of the sample accounts below.' }
    const next = { name: user.name || user.contactName || user.companyName, email: user.email, phone: user.phone || '', company: user.company || user.companyName || 'IKAI One Commerce', role: user.role || 'Shipper account' }
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); setSession(next); setAuthMessage('')
    return { ok: true, user: next }
  }
  function signOut() { window.sessionStorage.removeItem(SESSION_KEY); setSession(null) }
  function beginSignup(details) {
    const pending = { ...details, createdAt: new Date().toISOString(), otpVerified: false }
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending)); setPendingSignup(pending); setAuthMessage('')
  }
  function verifyOtp(code) {
    if (!pendingSignup) return { ok: false, message: 'Your signup session has expired. Please start again.' }
    if (String(code) !== '123456') return { ok: false, message: 'That code is not correct. For this demo, use 123456.' }
    const verified = { ...pendingSignup, otpVerified: true }
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(verified)); setPendingSignup(verified)
    return { ok: true }
  }
  function completeOnboarding(profile) {
    if (!pendingSignup?.otpVerified) return { ok: false, message: 'Verify your email or phone before continuing.' }
    const user = { ...pendingSignup, ...profile, role: 'Company admin', onboardingComplete: true }
    const users = readUsers()
    const withoutDuplicate = users.filter(existing => existing.email?.toLowerCase() !== user.email?.toLowerCase() && existing.phone !== user.phone)
    window.localStorage.setItem(USERS_KEY, JSON.stringify([...withoutDuplicate, user]))
    const next = { name: user.contactName || user.companyName || 'Shipper admin', email: user.email, phone: user.phone, company: user.companyName, role: user.role }
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); window.sessionStorage.removeItem(PENDING_KEY)
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

import { useState } from 'react'
export function usePersistentToggle(initial=false) {
  const [value,setValue] = useState(initial)
  return [value,()=>setValue(v=>!v),setValue]
}
export function useDemoSession() {
  const [session,setSession] = useState(()=> {
    try { return JSON.parse(sessionStorage.getItem('ikai-demo-session') || 'null') } catch { return null }
  })
  function login(credentials) {
    const next = {name:credentials.name || 'Abdullah Demo',email:credentials.email || 'demo@ikai.one',company:'IKAI One Commerce'}
    sessionStorage.setItem('ikai-demo-session',JSON.stringify(next)); setSession(next); return next
  }
  function logout() { sessionStorage.removeItem('ikai-demo-session'); setSession(null) }
  return {session,login,logout}
}
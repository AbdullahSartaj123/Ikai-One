import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Store, UserRound } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const businessTypes = ['E-commerce / Online store','Retail & wholesale','Marketplace seller','Manufacturer / Brand','Courier / Logistics','Other']

export default function Signup() {
  const [form, setForm] = useState({ fullName: '', companyName: '', email: '', password: '', confirmPassword: '', businessType: businessTypes[0] })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { beginSignup, isAuthenticated, authLoading } = useAuth()
  const navigate = useNavigate()

  if (authLoading) return <main className="app-loading" role="status" aria-live="polite" aria-label="Checking your secure session"><div className="app-loading-brand"><Store size={22}/><span>IKAI<span>One</span></span></div><p>Checking your secure session…</p></main>
  if (isAuthenticated) return <Navigate to="/app/dashboard" replace />

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    if (form.password.length < 12 || form.password.length > 128) {
      setError('Use a password between 12 and 128 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Your passwords do not match.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await beginSignup({ ...form, email: form.email.trim().toLowerCase() })
      navigate('/verify-otp?email=' + encodeURIComponent(form.email.trim().toLowerCase()), { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Unable to create your account. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="auth-simple-page">
    <header className="auth-simple-header"><Link to="/"><Logo/></Link><span>Already have an account? <Link to="/login">Sign in</Link></span></header>
    <main className="auth-card signup-card"><div className="auth-card-icon"><Store size={22}/></div><span className="auth-form-eyebrow">GET STARTED WITH IKAI ONE</span><h1>Create your shipper account</h1><p className="auth-subtitle">Create a secure account and private company workspace.</p>
      <form className="auth-form signup-form" onSubmit={submit}>
        <label htmlFor="full-name">YOUR FULL NAME</label><div className="auth-input"><UserRound size={17}/><input id="full-name" autoComplete="name" maxLength={120} required value={form.fullName} onChange={event=>update('fullName',event.target.value)} placeholder="Your name"/></div>
        <label htmlFor="company-name">COMPANY / STORE NAME</label><div className="auth-input"><Building2 size={17}/><input id="company-name" autoComplete="organization" maxLength={120} required value={form.companyName} onChange={event=>update('companyName',event.target.value)} placeholder="e.g. Northstar Commerce"/></div>
        <label htmlFor="signup-email">BUSINESS EMAIL</label><div className="auth-input"><Mail size={17}/><input id="signup-email" type="email" autoComplete="email" maxLength={254} required value={form.email} onChange={event=>update('email',event.target.value)} placeholder="you@company.com"/></div>
        <label htmlFor="business-type">BUSINESS TYPE</label><div className="auth-input auth-select-wrap"><Store size={17}/><select id="business-type" value={form.businessType} onChange={event=>update('businessType',event.target.value)}>{businessTypes.map(type=><option key={type}>{type}</option>)}</select></div>
        <label htmlFor="signup-password">PASSWORD</label><div className="auth-input"><LockKeyhole size={17}/><input id="signup-password" type={showPassword?'text':'password'} autoComplete="new-password" minLength={12} maxLength={128} required value={form.password} onChange={event=>update('password',event.target.value)} placeholder="At least 12 characters"/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
        <label htmlFor="confirm-password">CONFIRM PASSWORD</label><div className="auth-input"><LockKeyhole size={17}/><input id="confirm-password" type={showPassword?'text':'password'} autoComplete="new-password" minLength={12} maxLength={128} required value={form.confirmPassword} onChange={event=>update('confirmPassword',event.target.value)} placeholder="Enter the same password"/></div>
        <p className="auth-inline-note"><ShieldCheck size={15}/> Passwords are stored as salted hashes. Never reuse a password from another account.</p>
        {error&&<p className="auth-error" role="alert">{error}</p>}
        <button className="auth-primary" type="submit" disabled={busy}>{busy?'Creating account…':'Create account and verify email'} <ArrowRight size={17}/></button>
        <p className="auth-terms">By continuing, you agree to the IKAI One terms and privacy notice.</p>
      </form>
    </main>
  </div>
}

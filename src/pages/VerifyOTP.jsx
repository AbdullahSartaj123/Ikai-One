import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function VerifyOTP() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { pendingSignup, verifyEmail, resendVerification, requestPasswordReset, resetPassword } = useAuth()
  const token = params.get('token') || ''
  const isReset = params.get('mode') === 'reset'
  const [email, setEmail] = useState(params.get('email') || pendingSignup?.email || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [verified, setVerified] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState('')
  const [canContinue, setCanContinue] = useState(false)
  const processedToken = useRef('')

  useEffect(() => {
    if (!token || isReset || processedToken.current === token) return
    processedToken.current = token
    setBusy(true)
    verifyEmail(token)
      .then(result => {
        const status = result.approvalStatus || 'approved'
        setVerified(true)
        setApprovalStatus(status)
        setCanContinue(Boolean(result.token && result.user))
        setMessage(status === 'pending'
          ? 'Your email is verified. Your shipper application is awaiting Ikai.One administrator approval. You can sign in after approval.'
          : status === 'rejected'
            ? 'Your email is verified, but your shipper application was not approved. Contact Ikai.One support for next steps.'
            : 'Your email is verified and your workspace is active.')
      })
      .catch(requestError => setError(requestError.message || 'This verification link is invalid or expired.'))
      .finally(() => setBusy(false))
  }, [token, isReset, verifyEmail])

  async function submitEmail(event) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      const result = isReset ? await requestPasswordReset(email) : await resendVerification(email)
      setMessage(result.message || (isReset ? 'If the account exists, a reset link will be sent.' : 'If the account needs verification, a new link will be sent.'))
    } catch (requestError) {
      setError(requestError.message || 'The request could not be completed.')
    } finally { setBusy(false) }
  }

  async function submitPassword(event) {
    event.preventDefault()
    setError(''); setMessage('')
    if (password.length < 12 || password.length > 128) { setError('Use a password between 12 and 128 characters.'); return }
    if (password !== confirmPassword) { setError('Your passwords do not match.'); return }
    setBusy(true)
    try {
      const result = await resetPassword(token, password)
      setMessage(result.message || 'Password updated. You can now sign in.')
      window.setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (requestError) {
      setError(requestError.message || 'Unable to reset your password.')
    } finally { setBusy(false) }
  }

  const title = isReset ? (token ? 'Choose a new password' : 'Reset your password') : (verified ? 'Email verified' : 'Check your inbox')
  const subtitle = isReset
    ? (token ? 'Choose a strong password to secure your IKAI One account.' : 'Enter your account email. If a verified account exists, we will send a secure reset link.')
    : (verified
      ? (canContinue ? 'Your account is ready. Continue to your company workspace.' : 'Your email verification is complete. Dashboard access depends on the administrator’s decision.')
      : 'We will send a secure, one-time verification link to your business email.')

  return <div className="auth-simple-page">
    <header className="auth-simple-header"><Link to="/"><Logo/></Link><span>{isReset ? 'Remembered your password?' : 'Already verified?'} <Link to="/login">Sign in</Link></span></header>
    <main className="auth-card otp-card">
      <Link to={isReset ? '/login' : '/signup'} className="auth-back"><ArrowLeft size={15}/> Back</Link>
      <div className="auth-card-icon">{isReset ? <KeyRound size={22}/> : verified ? <CheckCircle2 size={22}/> : <Mail size={22}/>}</div>
      <span className="auth-form-eyebrow">{isReset ? 'ACCOUNT RECOVERY' : 'VERIFY YOUR ACCOUNT'}</span>
      <h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>
      {!token && !verified && <form className="auth-form otp-form" onSubmit={submitEmail}>
        <label htmlFor="verification-email">BUSINESS EMAIL</label>
        <div className="auth-input"><Mail size={17}/><input id="verification-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={event=>{setEmail(event.target.value);setError('');setMessage('')}} placeholder="you@company.com"/></div>
        {error&&<p className="auth-error" role="alert">{error}</p>}
        {message&&<p className="auth-success" role="status"><CheckCircle2 size={15}/>{message}</p>}
        <button className="auth-primary" type="submit" disabled={busy}>{busy?'Please wait…':isReset?'Send password reset link':'Send verification link'} <ArrowRight size={17}/></button>
      </form>}
      {isReset && token && <form className="auth-form otp-form" onSubmit={submitPassword}>
        <label htmlFor="reset-password">NEW PASSWORD</label>
        <div className="auth-input"><KeyRound size={17}/><input id="reset-password" type={showPassword?'text':'password'} autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={event=>{setPassword(event.target.value);setError('')}} placeholder="At least 12 characters"/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
        <label htmlFor="reset-password-confirm">CONFIRM NEW PASSWORD</label>
        <div className="auth-input"><KeyRound size={17}/><input id="reset-password-confirm" type={showPassword?'text':'password'} autoComplete="new-password" minLength={12} maxLength={128} required value={confirmPassword} onChange={event=>{setConfirmPassword(event.target.value);setError('')}} placeholder="Enter the same password"/></div>
        {error&&<p className="auth-error" role="alert">{error}</p>}
        {message&&<p className="auth-success" role="status"><CheckCircle2 size={15}/>{message}</p>}
        <button className="auth-primary" type="submit" disabled={busy}>{busy?'Updating password…':'Update password'} <ArrowRight size={17}/></button>
      </form>}
      {!isReset && token && <div className="auth-form otp-form">
        {busy&&<p className="auth-inline-note"><ShieldCheck size={15}/> Verifying your secure link…</p>}
        {error&&<p className="auth-error" role="alert">{error}</p>}
        {message&&<p className="auth-success" role="status"><CheckCircle2 size={15}/>{message}</p>}
        {verified && canContinue && <button className="auth-primary" type="button" onClick={()=>navigate('/onboarding',{replace:true})}>Continue to workspace <ArrowRight size={17}/></button>}
        {verified && !canContinue && <Link className="auth-primary auth-link-button" to="/">Return to IKAI One <ArrowRight size={17}/></Link>}
        {!busy&&!verified&&<button className="auth-primary" type="button" onClick={()=>navigate('/verify-otp?email='+encodeURIComponent(email||pendingSignup?.email||''),{replace:true})}>Request a new verification link <ArrowRight size={17}/></button>}
      </div>}
      {!token&&!isReset&&!verified&&<p className="auth-terms">Verification links expire after 30 minutes and can only be used once.</p>}
      {isReset&&token&&<p className="auth-terms">Reset links expire after 30 minutes. Updating your password signs out existing sessions.</p>}
    </main>
  </div>
}

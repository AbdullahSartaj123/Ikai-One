import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Boxes, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isAuthenticated, authLoading } = useAuth()

  // Resolve the server-backed session before rendering the login form.
  // An authenticated user should never need to sign in again just to open /login.
  if (authLoading) {
    return <main className="app-loading" role="status" aria-live="polite" aria-label="Checking your secure session">
      <div className="app-loading-brand"><Boxes size={22}/><span>IKAI<span>One</span></span></div>
      <p>Checking your secure session…</p>
    </main>
  }

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || '/app/dashboard'
    return <Navigate to={destination.startsWith('/login') ? '/app/dashboard' : destination} replace />
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
      navigate(location.state?.from?.pathname || '/app/dashboard', { replace: true })
    } catch (requestError) {
      if (requestError.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-otp?email=' + encodeURIComponent(requestError.email || email.trim().toLowerCase()))
        return
      }
      setError(requestError.message || 'Unable to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="auth-page login-page">
    <section className="auth-story login-left"><div className="auth-story-grid login-left-grid"/><Link to="/" className="auth-brand login-brand"><Logo light/></Link>
      <div className="auth-story-copy login-pitch"><span className="auth-eyebrow login-kicker"><Sparkles size={14}/> YOUR SHIPPING WORKSPACE</span><h1>Every parcel.<br/><span>One powerful view.</span></h1><p>Bring orders, courier partners, tracking and COD operations together with IKAI One.</p>
        <div className="auth-preview login-visual"><div className="auth-preview-orbit login-orbit"/><div className="auth-preview-card login-visual-card"><div className="auth-preview-head visual-card-top"><span><Boxes size={17}/></span><b>Your workspace</b><i/></div><div className="auth-preview-metrics visual-kpis"><div><small>Workspace</small><b>Private</b><span>Organization scoped</span></div><div><small>Access</small><b>Protected</b><span>Verified accounts</span></div></div><div className="auth-preview-bars visual-chart">{[30,43,35,55,48,70,60,88,74,100,81,94,67,109].map((height,index)=><i key={index} style={{height:height+'px',animationDelay:index*35+'ms'}/>)}</div><div className="auth-preview-foot visual-card-foot"><span/><small>Account security · Server verified</small></div></div><span className="auth-float login-floating-a"><CheckCircle2 size={16}/> Private workspace</span><span className="auth-float login-floating-b"><ShieldCheck size={16}/> Secure sign-in</span></div>
      </div><div className="auth-story-footer login-left-foot"><span>Designed for modern commerce.</span><span>Clarity over complexity.</span></div>
    </section>
    <section className="auth-panel login-right"><div className="auth-mobile-brand login-mobile-brand"><Logo/></div><div className="auth-form-wrap login-form-wrap"><Link to="/" className="auth-back back-home"><ArrowLeft size={15}/> Back to homepage</Link><span className="auth-form-eyebrow login-form-kicker">SHIPPER PORTAL</span><h2>Welcome back.</h2><p className="auth-subtitle login-subtitle">Sign in to your IKAI One seller workspace.</p>
      <form className="auth-form login-form" onSubmit={submit}><label htmlFor="login-email">BUSINESS EMAIL</label><div className="auth-input login-input"><Mail size={17}/><input id="login-email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={event=>{setEmail(event.target.value);setError('')}} placeholder="you@company.com"/></div><label htmlFor="login-password">PASSWORD</label><div className="auth-input login-input"><LockKeyhole size={17}/><input id="login-password" type={showPassword?'text':'password'} autoComplete="current-password" required value={password} onChange={event=>{setPassword(event.target.value);setError('')}} placeholder="Enter your password"/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
        {error&&<p className="auth-error login-error" role="alert">{error}</p>}<div className="auth-form-options"><span><ShieldCheck size={14}/> Secure account access</span><Link to="/verify-otp?mode=reset">Forgot password?</Link></div><button className="auth-primary login-submit" type="submit" disabled={busy}>{busy?'Signing in…':'Sign in to seller panel'} <ArrowRight size={17}/></button>
      </form>
      <div className="auth-demo-warning demo-warning"><ShieldCheck size={16}/><p><b>Protect your account</b><br/>Use your verified business email and never share your password.</p></div><p className="auth-switch">New to IKAI One? <Link to="/signup">Create your shipper account <ArrowRight size={14}/></Link></p>
    </div><div className="auth-panel-footer login-right-footer"><span>© {new Date().getFullYear()} IKAI One</span><span><i/> Secure account access</span></div></section>
  </div>
}

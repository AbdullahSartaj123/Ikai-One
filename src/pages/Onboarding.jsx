import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, CheckCircle2, ShieldCheck } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Onboarding() {
  const { user, completeOnboarding, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()

  function finish() {
    completeOnboarding()
    navigate('/app/dashboard', { replace: true })
  }

  if (!isAuthenticated) return <div className="auth-simple-page">
    <header className="auth-simple-header"><Link to="/"><Logo/></Link></header>
    <main className="auth-card"><div className="auth-card-icon"><ShieldCheck size={22}/></div><h1>Sign in to continue</h1><p className="auth-subtitle">Verify your email and sign in before opening a company workspace.</p><Link className="auth-primary auth-link-button" to="/login">Go to sign in <ArrowRight size={17}/></Link></main>
  </div>

  return <div className="onboarding-page">
    <header className="onboarding-header"><Link to="/"><Logo/></Link><div><span>SECURE WORKSPACE</span><b>Account setup</b></div><button className="onboarding-save" type="button" onClick={() => { signOut(); navigate("/login", { replace: true }) }}>Sign out</button></header>
    <main className="onboarding-main">
      <div className="onboarding-heading"><span className="auth-form-eyebrow">WELCOME TO IKAI ONE</span><h1>Your workspace is ready.</h1><p>Your account and company workspace have been created. You can continue to the seller dashboard.</p></div>
      <section className="onboarding-card">
        <div className="onboarding-done"><span><CheckCircle2 size={35}/></span><h2>Welcome, {user?.name || 'workspace owner'}.</h2><p>Your email is verified and your company workspace is ready for the next setup phase.</p>
          <div className="onboarding-summary">
            <div><Building2 size={17}/><span><small>COMPANY WORKSPACE</small><b>{user?.organizationName || 'Your organization'}</b></span></div>
            <div><ShieldCheck size={17}/><span><small>ACCOUNT</small><b>{user?.email}</b></span></div>
          </div>
        </div>
        <div className="auth-secure-note"><ShieldCheck size={18}/><span>For your protection, this setup does not collect bank account, IBAN, CNIC, or KYC details. Those workflows will be added with dedicated security controls.</span></div>
        <div className="onboarding-actions"><button type="button" className="auth-primary" onClick={finish}>Open seller dashboard <ArrowRight size={17}/></button></div>
      </section>
    </main>
  </div>
}

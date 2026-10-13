import React, { Component, Suspense, lazy, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { ArrowUpRight, Boxes } from 'lucide-react'
import { AuthProvider } from './context/AuthContext.jsx'
import './styles.css'
import './styles/theme.css'
import './styles/dashboard.css'
import './styles/auth.css'

// Keep route modules in separate chunks so an issue in a dashboard-only page
// cannot prevent the public landing page from starting.
const App = lazy(() => import('./App.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Signup = lazy(() => import('./pages/Signup.jsx'))
const VerifyOTP = lazy(() => import('./pages/VerifyOTP.jsx'))
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const DashboardHome = lazy(() => import('./pages/Dashboard.jsx').then(module => ({ default: module.DashboardHome })))
const PublicTracking = lazy(() => import('./pages/Shipments.jsx').then(module => ({ default: module.PublicTracking })))
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.jsx'))
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout.jsx'))
const Blog = lazy(() => import('./pages/Blog.jsx'))

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px', background: '#f7f8f5', color: '#192824', fontFamily: 'system-ui, sans-serif' }}>
        <section style={{ width: 'min(560px, 100%)', padding: '28px', border: '1px solid #e3e9e2', borderRadius: '16px', background: '#fff', boxShadow: '0 16px 50px rgba(20,40,30,.08)' }}>
          <h1 style={{ marginTop: 0 }}>IKAI One could not load this page</h1>
          <p style={{ lineHeight: 1.6 }}>A frontend error was caught instead of leaving a blank screen. Refresh the page to try again.</p>
          <pre style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', padding: '12px', borderRadius: '8px', background: '#f7f8f5', color: '#8c3028', fontSize: '12px' }}>{String(this.state.error?.message || this.state.error)}</pre>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: '11px 16px', border: 0, borderRadius: '8px', background: '#4659f5', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Reload app</button>
        </section>
      </main>
    }
    return this.props.children
  }
}

function LoadingScreen() {
  return <div role="status" aria-live="polite" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f7f8f5', color: '#53645b', fontFamily: 'system-ui, sans-serif' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}><span style={{ width: '18px', height: '18px', border: '2px solid #d9e2d6', borderTopColor: '#4659f5', borderRadius: '50%', animation: 'ikai-spin .8s linear infinite' }} /> Loading IKAI One…</div>
    <style>{'@keyframes ikai-spin { to { transform: rotate(360deg) } }'}</style>
  </div>
}

function ShipperEntry() {
  const location = useLocation()
  if (location.pathname !== '/') return null
  return <Link to="/login" className="shipper-entry"><Boxes size={17}/> Seller Central <ArrowUpRight size={15}/></Link>
}
function Root() {
  useEffect(() => {
    const root = document.getElementById('root')
    if (root) root.dataset.appMounted = 'true'
  }, [])
  return <AppErrorBoundary><AuthProvider><BrowserRouter><Suspense fallback={<LoadingScreen/>}><ShipperEntry/><Routes>
    <Route path="/" element={<App/>}/><Route path="/blog" element={<Blog/>}/><Route path="/blog/:slug" element={<Blog/>}/>
    <Route path="/track/:awb" element={<PublicTracking/>}/><Route path="/login" element={<Login/>}/>
    <Route path="/signup" element={<Signup/>}/>
    <Route path="/verify-otp" element={<VerifyOTP/>}/>
    <Route path="/onboarding" element={<Onboarding/>}/>
    <Route element={<ProtectedRoute/>}><Route path="/dashboard" element={<DashboardLayout/>}><Route index element={<DashboardHome/>}/></Route></Route>
    <Route path="/app" element={<ProtectedRoute/>}>
      <Route index element={<Navigate to="dashboard" replace/>}/>
      <Route path="*" element={<Dashboard/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Suspense></BrowserRouter></AuthProvider></AppErrorBoundary>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Root/></React.StrictMode>)

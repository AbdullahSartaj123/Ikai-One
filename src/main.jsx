import React, { Component, Suspense, lazy, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { ArrowUpRight, Boxes } from 'lucide-react'
import { AuthProvider } from './context/AuthContext.jsx'
import './styles.css'
import './styles/theme.css'
import './styles/dashboard.css'
import './styles/auth.css'
import './styles/ui.css'

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
const PublicPages = lazy(() => import('./pages/PublicPages.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

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
      return <main className="error-boundary-page"><section className="error-boundary-card"><span className="ui-eyebrow">IKAI ONE · RECOVERY</span><h1>We hit an unexpected error.</h1><p>The page could not finish loading. Refresh to try again, or return to the dashboard.</p><div className="error-boundary-actions"><button className="ui-button ui-button-primary" type="button" onClick={() => window.location.reload()}>Reload app</button><a className="ui-button ui-button-secondary" href="/">Go to home</a></div></section></main>
    }
    return this.props.children
  }
}

function LoadingScreen() {
  return <main className="app-loading" role="status" aria-live="polite" aria-label="Loading IKAI One">
    <div className="app-loading-brand"><Boxes size={22}/><span>IKAI<span>One</span></span></div>
    <div className="ui-skeleton ui-loading-bar"/>
    <p>Preparing your workspace…</p>
  </main>
}

function ShipperEntry() {
  const location = useLocation()
  if (location.pathname !== '/') return null
  return <Link to="/login" className="shipper-entry"><Boxes size={17}/> Seller Central <ArrowUpRight size={15}/></Link>
}
function Root() {
  useEffect(() => {
    // Remove the stray InfinityFree-style ?i=1 query from the visible URL
    // without reloading the page or disturbing any other query parameters.
    const url = new URL(window.location.href)
    if (url.searchParams.get('i') === '1') {
      url.searchParams.delete('i')
      const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash
      window.history.replaceState(window.history.state, '', cleanUrl)
    }

    const root = document.getElementById('root')
    if (root) root.dataset.appMounted = 'true'
  }, [])
  return <AppErrorBoundary><AuthProvider><BrowserRouter><Suspense fallback={<LoadingScreen/>}><ShipperEntry/><Routes>
    <Route path="/" element={<App/>}/><Route path="/explore/:slug" element={<PublicPages/>}/><Route path="/pricing" element={<PublicPages/>}/><Route path="/track-order" element={<PublicPages/>}/><Route path="/investors" element={<PublicPages/>}/><Route path="/blog" element={<Blog/>}/><Route path="/blog/:slug" element={<Blog/>}/>
    <Route path="/track/:awb" element={<PublicTracking/>}/><Route path="/login" element={<Login/>}/>
    <Route path="/signup" element={<Signup/>}/>
    <Route path="/verify-otp" element={<VerifyOTP/>}/>
    <Route path="/onboarding" element={<Onboarding/>}/>
    <Route element={<ProtectedRoute/>}><Route path="/dashboard" element={<DashboardLayout/>}><Route index element={<DashboardHome/>}/></Route></Route>
    <Route path="/app" element={<ProtectedRoute/>}>
      <Route index element={<Navigate to="dashboard" replace/>}/>
      <Route path="*" element={<Dashboard/>}/>
    </Route>
    <Route path="*" element={<NotFound/>}/>
  </Routes></Suspense></BrowserRouter></AuthProvider></AppErrorBoundary>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Root/></React.StrictMode>)

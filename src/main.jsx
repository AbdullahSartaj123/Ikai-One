import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { ArrowUpRight, Boxes } from 'lucide-react'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import VerifyOTP from './pages/VerifyOTP.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { PublicTracking } from './pages/Shipments.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import { DashboardHome } from './pages/Dashboard.jsx'
import Blog from './pages/Blog.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './styles.css'
import './styles/theme.css'
import './styles/dashboard.css'
import './styles/auth.css'

function ShipperEntry() {
  const location = useLocation()
  if (location.pathname !== '/') return null
  return <Link to="/login" className="shipper-entry"><Boxes size={17}/> Shipper Login <ArrowUpRight size={15}/></Link>
}
function Root() {
  return <AuthProvider><BrowserRouter><ShipperEntry/><Routes>
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
  </Routes></BrowserRouter></AuthProvider>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Root/></React.StrictMode>)

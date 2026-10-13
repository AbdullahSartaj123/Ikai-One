import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { ArrowUpRight, Boxes } from 'lucide-react'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import './styles.css'
import './styles/theme.css'
import './styles/dashboard.css'

function ShipperEntry() {
  const location = useLocation()
  if (location.pathname !== '/') return null
  return <Link to="/login" className="shipper-entry"><Boxes size={17}/> Shipper Login <ArrowUpRight size={15}/></Link>
}
function Root() {
  return <BrowserRouter><ShipperEntry/><Routes>
    <Route path="/" element={<App/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/app" element={<Navigate to="/app/dashboard" replace/>}/>
    <Route path="/app/*" element={<Dashboard/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></BrowserRouter>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Root/></React.StrictMode>)
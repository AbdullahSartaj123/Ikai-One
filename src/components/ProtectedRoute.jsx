import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute() {
  const { isAuthenticated, authLoading } = useAuth()
  const location = useLocation()
  if (authLoading) {
    return <main className="app-loading" role="status" aria-live="polite"><p>Checking your secure session…</p></main>
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

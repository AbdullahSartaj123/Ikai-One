import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Home, Search } from 'lucide-react'

export default function NotFound() {
  const location = useLocation()
  return <main className="not-found-page"><section className="not-found-card">
    <span className="ui-eyebrow">404 · PAGE NOT FOUND</span>
    <h1>This route has gone off the map.</h1>
    <p>We couldn’t find <strong>{location.pathname}</strong>. Check the address or return to a known part of IKAI One.</p>
    <div className="error-boundary-actions"><Link className="ui-button ui-button-primary" to="/"><Home size={16}/> Go to home</Link><button className="ui-button ui-button-secondary" onClick={()=>window.history.length>1?window.history.back():window.location.assign('/')}><ArrowLeft size={16}/> Go back</button><Link className="ui-button ui-button-ghost" to="/login"><Search size={16}/> Seller login</Link></div>
  </section></main>
}

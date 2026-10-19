import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from 'lucide-react'
import { apiRequest } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const filters = [
  ['pending', 'Pending review'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['all', 'All applications'],
]

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) || date.getTime() <= 0 ? '—' : date.toLocaleString()
}

const metricCards = [
  ['total_shippers', 'Shipper organisations'],
  ['pending_shippers', 'Awaiting approval'],
  ['approved_shippers', 'Approved shippers'],
  ['total_orders', 'Orders recorded'],
  ['total_shipments', 'Shipments recorded'],
  ['confirmed_courier_bookings', 'Confirmed courier bookings'],
  ['cod_attention_records', 'COD records needing attention'],
  ['inventory_items', 'Inventory items'],
]

const numberFormat = value => Number(value || 0).toLocaleString()

export default function AdminConsole() {
  const { user } = useAuth()
  const [status, setStatus] = useState('pending')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [notes, setNotes] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [overview, setOverview] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState('')

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true)
    setOverviewError('')
    try {
      const result = await apiRequest('/api/admin/overview')
      setOverview(result.metrics || {})
      setOverviewOrganizations(Array.isArray(result.organizations) ? result.organizations : [])
    } catch (requestError) {
      setOverviewError(requestError.message || 'Unable to load platform overview.')
      setOverview(null)
      setOverviewOrganizations([])
    } finally {
      setOverviewLoading(false)
    }
  }, [])
  const [overviewOrganizations, setOverviewOrganizations] = useState([])

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/api/admin/organizations?status=' + encodeURIComponent(status))
      setApplications(Array.isArray(result.data) ? result.data : [])
    } catch (requestError) {
      setError(requestError.message || 'Unable to load shipper applications.')
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { loadApplications(); loadOverview() }, [loadApplications, loadOverview])

  async function decide(application, decision) {
    const note = String(notes[application.id] || '').trim()
    if (decision === 'rejected' && !note) {
      setError('Add a short reason before rejecting this application.')
      return
    }
    setBusyId(application.id)
    setError('')
    setNotice('')
    try {
      const result = await apiRequest('/api/admin/organizations/' + application.id + '/decision', {
        method: 'POST',
        body: { decision, note: note || undefined },
      })
      setNotice(result.message || 'Application updated.')
      await loadApplications()
    } catch (requestError) {
      setError(requestError.message || 'The decision could not be saved. Refresh and try again.')
    } finally {
      setBusyId('')
    }
  }

  return <main className="admin-console-page">
    <header className="admin-console-header">
      <Link to="/app/dashboard" className="admin-back-link"><ArrowLeft size={16}/> Seller dashboard</Link>
      <span className="admin-console-mark"><ShieldCheck size={18}/> IKAI ONE · PLATFORM CONTROL</span>
      <div className="admin-console-title-row">
        <div><span className="admin-console-eyebrow">SECURE ADMINISTRATION</span><h1>Shipper applications</h1><p>Review business registrations before enabling seller dashboard access.</p></div>
        <button type="button" className="admin-refresh-button" onClick={() => { loadApplications(); loadOverview() }} disabled={loading || overviewLoading}><RefreshCw size={15}/> Refresh</button>
      </div>
      <div className="admin-console-identity"><ShieldCheck size={16}/><span>Signed in as <b>{user?.name || user?.email || 'Platform administrator'}</b></span><span className="admin-secure-pill">Platform admin</span></div>
    </header>

    <section className="admin-overview-section" aria-label="Platform-wide operations overview">
      <div className="admin-section-heading"><div><span className="admin-console-eyebrow">PLATFORM-WIDE VISIBILITY</span><h2>Operations overview</h2><p>Read-only totals across shipper workspaces. Customer-level personal information is not shown here.</p></div></div>
      {overviewError && <p className="admin-alert admin-alert-error" role="alert">{overviewError}</p>}
      {overviewLoading ? <div className="admin-empty compact"><RefreshCw size={20}/><b>Loading platform metrics…</b></div> : overview && <div className="admin-metric-grid">
        {metricCards.map(([key, label]) => <article className="admin-metric-card" key={key}><span>{label}</span><strong>{numberFormat(overview[key])}</strong></article>)}
      </div>}
      <div className="admin-org-table-wrap">
        <div className="admin-org-table-heading"><h3>Shipper workspace activity</h3><span>Latest 100 organisations</span></div>
        {overviewLoading ? <div className="admin-empty compact">Loading workspaces…</div> : overviewOrganizations.length === 0 ? <div className="admin-empty compact"><Building2 size={20}/><b>No shipper workspaces found</b></div> : <table className="admin-org-table">
          <thead><tr><th>Organisation</th><th>Approval</th><th>Orders</th><th>Shipments</th><th>Confirmed bookings</th><th>COD attention</th><th>Last activity</th></tr></thead>
          <tbody>{overviewOrganizations.map(org => <tr key={org.id}>
            <td><b>{org.name}</b><small>{org.slug}</small></td>
            <td><span className={'admin-status-badge status-' + org.approval_status}>{org.approval_status}</span></td>
            <td>{numberFormat(org.order_count)}</td><td>{numberFormat(org.shipment_count)}</td><td>{numberFormat(org.confirmed_booking_count)}</td><td>{numberFormat(org.cod_attention_count)}</td><td>{formatDate(org.last_activity_at)}</td>
          </tr>)}</tbody>
        </table>}
      </div>
    </section>

    <section className="admin-console-panel">
      <div className="admin-panel-heading"><div><span className="admin-console-eyebrow">ACCOUNT LIFECYCLE</span><h2>Shipper applications</h2><p>Review verified business registrations before enabling seller dashboard access.</p></div></div>
      <nav className="admin-status-tabs" aria-label="Application status">
        {filters.map(([value, label]) => <button key={value} type="button" className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{label}</button>)}
      </nav>
      {error && <p className="admin-alert admin-alert-error" role="alert">{error}</p>}
      {notice && <p className="admin-alert admin-alert-success" role="status"><CheckCircle2 size={16}/>{notice}</p>}
      {loading ? <div className="admin-empty"><RefreshCw size={22}/><b>Loading applications…</b></div>
        : applications.length === 0 ? <div className="admin-empty"><Building2 size={25}/><b>No {status === 'all' ? '' : status + ' '}applications found</b><span>New shipper registrations will appear here after signup.</span></div>
        : <div className="admin-application-list">
          {applications.map(application => <article className="admin-application-card" key={application.id}>
            <div className="admin-application-top">
              <span className="admin-company-icon"><Building2 size={20}/></span>
              <div className="admin-company-heading"><h2>{application.name}</h2><span>{application.applicant_name || 'Applicant name unavailable'} · {application.applicant_email || 'Email unavailable'}</span></div>
              <span className={'admin-status-badge status-' + application.approval_status}>{application.approval_status}</span>
            </div>
            <div className="admin-application-meta">
              <span><Clock3 size={14}/> Applied {formatDate(application.created_at)}</span>
              <span className={application.email_verified ? 'verified' : 'unverified'}>{application.email_verified ? <CheckCircle2 size={14}/> : <Clock3 size={14}/>} {application.email_verified ? 'Email verified' : 'Email not verified'}</span>
            </div>
            {application.approval_note && <p className="admin-existing-note"><b>Review note:</b> {application.approval_note}</p>}
            {application.approval_status === 'pending' && <div className="admin-decision-area">
              <label htmlFor={'decision-note-' + application.id}>Review note <span>(required for rejection)</span></label>
              <textarea id={'decision-note-' + application.id} rows={2} maxLength={1000} value={notes[application.id] || ''} onChange={event => setNotes(current => ({ ...current, [application.id]: event.target.value }))} placeholder="Optional approval note or reason for rejection…"/>
              <div className="admin-decision-actions">
                <button type="button" className="admin-approve-button" disabled={Boolean(busyId) || !application.email_verified} onClick={() => decide(application, 'approved')}><CheckCircle2 size={16}/>{busyId === application.id ? 'Saving…' : 'Approve shipper'}</button>
                <button type="button" className="admin-reject-button" disabled={Boolean(busyId) || !application.email_verified || !String(notes[application.id] || '').trim()} onClick={() => decide(application, 'rejected')}><XCircle size={16}/>Reject application</button>
              </div>
              {!application.email_verified && <small className="admin-review-hint">The applicant must verify their email before you can approve or reject the application.</small>}
            </div>}
          </article>)}
        </div>}
    </section>
    <p className="admin-console-footnote">Approval changes are enforced by the API and recorded in the platform audit log. This page does not create courier bookings or trigger payments.</p>
  </main>
}

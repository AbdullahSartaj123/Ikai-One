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
const recordTypes = [['orders', 'Orders'], ['shipments', 'Shipments'], ['cod', 'COD reconciliation'], ['inventory', 'Inventory'], ['workflow', 'Workflow records']]
const recordColumns = {
  orders: ['organization_name', 'order_number', 'customer_name', 'phone', 'city', 'payment_mode', 'amount', 'status', 'created_at'],
  shipments: ['organization_name', 'shipment_number', 'order_number', 'courier', 'status', 'tracking_number', 'courier_booking_confirmed', 'created_at'],
  cod: ['organization_name', 'order_reference', 'awb', 'courier_name', 'cod_expected', 'amount_remitted', 'status', 'updated_at'],
  inventory: ['organization_name', 'sku', 'name', 'variant', 'warehouse', 'quantity_on_hand', 'reorder_level', 'unit_cost', 'updated_at'],
  workflow: ['organization_name', 'workflow_key', 'reference', 'title', 'status', 'updated_at'],
}

export default function AdminConsole() {
  const { user } = useAuth()
  const [status, setStatus] = useState('pending')
  const [applications, setApplications] = useState([])
  const [applicationTotal, setApplicationTotal] = useState(0)
  const [applicationOffset, setApplicationOffset] = useState(0)
  const [applicationSearch, setApplicationSearch] = useState('')
  const [applicationQuery, setApplicationQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [notes, setNotes] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [overview, setOverview] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState('')
  const [recordType, setRecordType] = useState('orders')
  const [recordSearch, setRecordSearch] = useState('')
  const [recordOrganization, setRecordOrganization] = useState('')
  const [recordQuery, setRecordQuery] = useState('')
  const [recordOffset, setRecordOffset] = useState(0)
  const [recordData, setRecordData] = useState([])
  const [recordTotal, setRecordTotal] = useState(0)
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordError, setRecordError] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [auditQuery, setAuditQuery] = useState('')
  const [auditOffset, setAuditOffset] = useState(0)
  const [auditData, setAuditData] = useState([])
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')

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
      const params = new URLSearchParams({ status, limit: '25', offset: String(applicationOffset) })
      if (applicationQuery) params.set('q', applicationQuery)
      const result = await apiRequest('/api/admin/organizations?' + params.toString())
      setApplications(Array.isArray(result.data) ? result.data : [])
      setApplicationTotal(Number(result.pagination?.total || 0))
    } catch (requestError) {
      setError(requestError.message || 'Unable to load shipper applications.')
      setApplications([])
      setApplicationTotal(0)
    } finally {
      setLoading(false)
    }
  }, [status, applicationOffset, applicationQuery])

  const loadRecords = useCallback(async () => {
    setRecordLoading(true)
    setRecordError('')
    try {
      const params = new URLSearchParams({ type: recordType, limit: '25', offset: String(recordOffset) })
      if (recordQuery) params.set('q', recordQuery)
      if (recordOrganization) params.set('organization_id', recordOrganization)
      const result = await apiRequest('/api/admin/records?' + params.toString())
      setRecordData(Array.isArray(result.data) ? result.data : [])
      setRecordTotal(Number(result.pagination?.total || 0))
    } catch (requestError) {
      setRecordError(requestError.message || 'Unable to load operational records.')
      setRecordData([])
      setRecordTotal(0)
    } finally {
      setRecordLoading(false)
    }
  }, [recordType, recordQuery, recordOrganization, recordOffset])

  const loadAudit = useCallback(async () => {
    setAuditLoading(true)
    setAuditError('')
    try {
      const params = new URLSearchParams({ limit: '25', offset: String(auditOffset) })
      if (auditQuery) params.set('q', auditQuery)
      const result = await apiRequest('/api/admin/audit?' + params.toString())
      setAuditData(Array.isArray(result.data) ? result.data : [])
      setAuditTotal(Number(result.pagination?.total || 0))
    } catch (requestError) {
      setAuditError(requestError.message || 'Unable to load platform audit history.')
      setAuditData([])
      setAuditTotal(0)
    } finally {
      setAuditLoading(false)
    }
  }, [auditQuery, auditOffset])

  useEffect(() => { loadApplications(); loadOverview() }, [loadApplications, loadOverview])
  useEffect(() => { loadRecords() }, [loadRecords])
  useEffect(() => { loadAudit() }, [loadAudit])

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
      await Promise.all([loadApplications(), loadOverview(), loadAudit()])
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
      <div className="admin-section-heading"><div><span className="admin-console-eyebrow">PLATFORM-WIDE VISIBILITY</span><h2>Operations overview</h2><p>Read-only totals across shipper workspaces. Order records may include customer contact details; access is restricted to platform administrators and record views are audit-logged.</p></div></div>
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

    <section className="admin-overview-section" aria-label="Cross-organization operational records">
      <div className="admin-section-heading"><div><span className="admin-console-eyebrow">READ-ONLY OPERATIONS</span><h2>Operational records</h2><p>Search records across shipper workspaces. Access is restricted to platform administrators and views are audit-logged.</p></div></div>
      <div className="admin-record-controls">
        <label>Record type<select value={recordType} onChange={event => { setRecordType(event.target.value); setRecordOffset(0) }}>{recordTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Shipper organisation<select value={recordOrganization} onChange={event => { setRecordOrganization(event.target.value); setRecordOffset(0) }}><option value="">All shipper organisations</option>{overviewOrganizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
        <form onSubmit={event => { event.preventDefault(); setRecordOffset(0); setRecordQuery(recordSearch.trim()) }} className="admin-record-search"><label>Search records<input value={recordSearch} onChange={event => setRecordSearch(event.target.value)} placeholder="Order, tracking, SKU, reference…" maxLength={100}/></label><button type="submit" disabled={recordLoading}>Search</button></form>
        <button type="button" className="admin-refresh-button" onClick={loadRecords} disabled={recordLoading}><RefreshCw size={15}/> Refresh records</button>
      </div>
      {recordError && <p className="admin-alert admin-alert-error" role="alert">{recordError}</p>}
      {recordLoading ? <div className="admin-empty compact"><RefreshCw size={20}/><b>Loading operational records…</b></div> : recordData.length === 0 ? <div className="admin-empty compact"><b>No matching records</b><span>Try another search or record type.</span></div> : <div className="admin-org-table-wrap"><table className="admin-org-table">
        <thead><tr>{(recordColumns[recordType] || []).map(column => <th key={column}>{column.replaceAll('_', ' ')}</th>)}</tr></thead>
        <tbody>{recordData.map(record => <tr key={record.id}>{(recordColumns[recordType] || []).map(column => <td key={column}>{record[column] == null ? '—' : typeof record[column] === 'object' ? JSON.stringify(record[column]) : String(record[column]).length > 90 ? String(record[column]).slice(0, 87) + '…' : String(record[column])}</td>)}</tr>)}</tbody>
      </table></div>}
      <div className="admin-record-pagination"><span>{recordTotal.toLocaleString()} records</span><div><button type="button" onClick={() => setRecordOffset(Math.max(0, recordOffset - 25))} disabled={recordLoading || recordOffset === 0}>Previous</button><span>{recordTotal === 0 ? 0 : recordOffset + 1}–{Math.min(recordOffset + 25, recordTotal)}</span><button type="button" onClick={() => setRecordOffset(recordOffset + 25)} disabled={recordLoading || recordOffset + 25 >= recordTotal}>Next</button></div></div>
    </section>

    <section className="admin-overview-section" aria-label="Platform administrative audit history">
      <div className="admin-section-heading"><div><span className="admin-console-eyebrow">SECURITY & ACCOUNTABILITY</span><h2>Platform audit history</h2><p>Review administrative decisions and operational record access. Entries are read-only.</p></div>
        <button type="button" className="admin-refresh-button" onClick={loadAudit} disabled={auditLoading}><RefreshCw size={15}/> Refresh history</button>
      </div>
      <form className="admin-record-controls" onSubmit={event => { event.preventDefault(); setAuditOffset(0); setAuditQuery(auditSearch.trim()) }}>
        <label className="admin-audit-search-label">Filter audit history<input value={auditSearch} onChange={event => setAuditSearch(event.target.value)} maxLength={100} placeholder="Event, organisation, administrator email…"/></label>
        <button type="submit" className="admin-record-search-button" disabled={auditLoading}>Search history</button>
      </form>
      {auditError && <p className="admin-alert admin-alert-error" role="alert">{auditError}</p>}
      {auditLoading ? <div className="admin-empty compact"><RefreshCw size={20}/><b>Loading audit history…</b></div> : auditData.length === 0 ? <div className="admin-empty compact"><b>No audit events found</b><span>Administrative decisions and record views will appear here.</span></div> : <div className="admin-org-table-wrap"><table className="admin-org-table">
        <thead><tr><th>Time</th><th>Event</th><th>Administrator</th><th>Organisation</th><th>Details</th></tr></thead>
        <tbody>{auditData.map(event => <tr key={event.id}>
          <td>{formatDate(event.created_at)}</td>
          <td><b>{String(event.event_type || '').replaceAll('_', ' ')}</b></td>
          <td>{event.actor_name || 'Unknown'}<small>{event.actor_email || ''}</small></td>
          <td>{event.organization_name || '—'}</td>
          <td className="admin-audit-details">{event.details == null ? '—' : JSON.stringify(event.details).slice(0, 220)}</td>
        </tr>)}</tbody>
      </table></div>}
      <div className="admin-record-pagination"><span>{auditTotal.toLocaleString()} events</span><div><button type="button" onClick={() => setAuditOffset(Math.max(0, auditOffset - 25))} disabled={auditLoading || auditOffset === 0}>Previous</button><span>{auditTotal === 0 ? 0 : auditOffset + 1}–{Math.min(auditOffset + 25, auditTotal)}</span><button type="button" onClick={() => setAuditOffset(auditOffset + 25)} disabled={auditLoading || auditOffset + 25 >= auditTotal}>Next</button></div></div>
    </section>

    <section className="admin-console-panel">
      <div className="admin-panel-heading"><div><span className="admin-console-eyebrow">ACCOUNT LIFECYCLE</span><h2>Shipper applications</h2><p>Review verified business registrations before enabling seller dashboard access.</p></div></div>
      <form className="admin-record-controls" onSubmit={event => { event.preventDefault(); setApplicationOffset(0); setApplicationQuery(applicationSearch.trim()) }}>
        <label>Search shipper organisations<input value={applicationSearch} onChange={event => setApplicationSearch(event.target.value)} maxLength={100} placeholder="Organisation name or slug…"/></label>
        <button type="submit" className="admin-record-search-button" disabled={loading}>Search applications</button>
        {applicationQuery && <button type="button" className="admin-refresh-button" onClick={() => { setApplicationSearch(""); setApplicationQuery(""); setApplicationOffset(0) }}>Clear search</button>}
      </form>
      <nav className="admin-status-tabs" aria-label="Application status">
        {filters.map(([value, label]) => <button key={value} type="button" className={status === value ? 'active' : ''} onClick={() => { setApplicationOffset(0); setStatus(value) }}>{label}</button>)}
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
      <div className="admin-record-pagination">
        <span>{applicationTotal.toLocaleString()} applications</span>
        <div>
          <button type="button" onClick={() => setApplicationOffset(Math.max(0, applicationOffset - 25))} disabled={loading || applicationOffset === 0}>Previous</button>
          <span>{applicationTotal === 0 ? 0 : applicationOffset + 1}–{Math.min(applicationOffset + 25, applicationTotal)}</span>
          <button type="button" onClick={() => setApplicationOffset(applicationOffset + 25)} disabled={loading || applicationOffset + 25 >= applicationTotal}>Next</button>
        </div>
      </div>
    </section>
    <p className="admin-console-footnote">Approval changes are enforced by the API and recorded in the platform audit log. This page does not create courier bookings or trigger payments.</p>
  </main>
}

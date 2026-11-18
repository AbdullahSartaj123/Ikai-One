import { Link } from 'react-router-dom'
import { ShieldCheck, Building2, Package, Truck, Wallet, Boxes, Activity, ClipboardList, Search, FileText, Eye, LockKeyhole } from 'lucide-react'

const metrics = [
  ['Shipper organisations','24','Building2'],['Awaiting approval','3','ClipboardList'],
  ['Approved shippers','21','ShieldCheck'],['Orders recorded','1,284','Package'],
  ['Shipments recorded','1,106','Truck'],['COD needing attention','18','Wallet'],
  ['Inventory items','642','Boxes'],['Platform activity','96 today','Activity'],
]
const organisations = [
  ['Northstar Store','approved','184','162'],['Urban Cart','pending','0','0'],
  ['Home & Living PK','approved','326','301'],['Daily Needs Co.','pending','0','0'],
]
const records = [
  ['ORD-IK-10482','Northstar Store','Lahore','Processing'],
  ['ORD-IK-10481','Home & Living PK','Karachi','Confirmed'],
  ['ORD-IK-10480','Northstar Store','Islamabad','Delivered'],
]
const Icon = ({name}) => { const C={Building2,ClipboardList,ShieldCheck,Package,Truck,Wallet,Boxes,Activity}[name]||Activity; return <C size={18}/> }
export default function AdminPreview() {
 return <main className="admin-console-page" style={{maxWidth:1440,margin:'0 auto'}}>
  <header className="admin-console-header">
   <Link to="/" className="admin-back-link">← Back to IKAI One website</Link>
   <span className="admin-console-mark"><ShieldCheck size={18}/> IKAI ONE · PLATFORM CONTROL</span>
   <div className="admin-console-title-row"><div><span className="admin-console-eyebrow">ADMIN DASHBOARD PREVIEW</span><h1>Platform overview</h1><p>Explore the planned platform administration workspace and its main modules.</p></div><span className="admin-secure-pill">DEMO · READ ONLY</span></div>
   <div className="admin-alert admin-alert-success"><Eye size={16}/> Preview mode uses sample data. No production records or administrative actions are accessible.</div>
  </header>
  <section className="admin-overview-section"><div className="admin-section-heading"><div><span className="admin-console-eyebrow">PLATFORM-WIDE VISIBILITY</span><h2>Operations overview</h2><p>High-level activity across shipper workspaces.</p></div></div>
   <div className="admin-metric-grid">{metrics.map(([label,value,icon])=><article className="admin-metric-card" key={label}><span><Icon name={icon}/>{label}</span><strong>{value}</strong></article>)}</div>
   <div className="admin-org-table-wrap"><div className="admin-org-table-heading"><h3>Shipper workspace activity</h3><span>Sample organisations</span></div><table className="admin-org-table"><thead><tr><th>Organisation</th><th>Approval</th><th>Orders</th><th>Shipments</th></tr></thead><tbody>{organisations.map(row=><tr key={row[0]}><td><b>{row[0]}</b></td><td><span className={'admin-status-badge status-'+row[1]}>{row[1]}</span></td><td>{row[2]}</td><td>{row[3]}</td></tr>)}</tbody></table></div>
  </section>
  <section className="admin-overview-section"><div className="admin-section-heading"><div><span className="admin-console-eyebrow">READ-ONLY OPERATIONS</span><h2>Operational records</h2><p>Search and inspect cross-organisation orders, shipments, COD, inventory and workflow records in the secured admin console.</p></div></div>
   <div className="admin-org-table-wrap"><div className="admin-org-table-heading"><h3>Recent order records</h3><span><Search size={14}/> Search and filters available after admin access</span></div><table className="admin-org-table"><thead><tr><th>Order</th><th>Organisation</th><th>Destination</th><th>Status</th></tr></thead><tbody>{records.map(r=><tr key={r[0]}>{r.map((v,i)=><td key={i}>{v}</td>)}</tr>)}</tbody></table></div>
  </section>
  <section className="admin-overview-section"><div className="admin-section-heading"><div><span className="admin-console-eyebrow">ACCOUNT LIFECYCLE</span><h2>Shipper applications</h2><p>Review verified business registrations before enabling seller dashboard access.</p></div></div><div className="admin-application-list">{organisations.filter(r=>r[1]==='pending').map(r=><article className="admin-application-card" key={r[0]}><div className="admin-application-top"><span className="admin-company-icon"><Building2 size={20}/></span><div className="admin-company-heading"><h2>{r[0]}</h2><span>Sample applicant · demo@example.com</span></div><span className="admin-status-badge status-pending">pending</span></div><div className="admin-application-meta">Email verification and approval review workflow</div><div className="admin-decision-actions"><button type="button" disabled>Approve shipper</button><button type="button" disabled>Reject application</button></div></article>)}</div></section>
  <section className="admin-overview-section"><div className="admin-section-heading"><div><span className="admin-console-eyebrow">SECURITY & ACCOUNTABILITY</span><h2>Platform audit history</h2><p>Administrative decisions and operational record access are recorded for accountability.</p></div></div><div className="admin-alert"><LockKeyhole size={16}/> Live audit records are available only to authenticated platform administrators.</div></section>
  <p className="admin-console-footnote">This is a visual preview only. Sample figures are illustrative and do not represent live database data. All administrative actions remain disabled.</p>
 </main>
}

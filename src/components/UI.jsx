import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronLeft, ChevronRight, LoaderCircle, Moon, Sun, X } from 'lucide-react'

export function Button({ variant='primary', size='md', loading=false, disabled=false, className='', children, type='button', ...props }) {
  return <button type={type} className={`ui-button ui-button-${variant} ui-button-${size} ${className}`.trim()} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading && <LoaderCircle size={15} className="ui-spin" aria-hidden="true"/>}{children}
  </button>
}

export function Field({ label, id, hint, error, required=false, className='', as='input', options=[], ...props }) {
  const fieldId = id || props.name || label?.toLowerCase().replace(/[^a-z0-9]+/g,'-')
  const shared = { id: fieldId, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': [hint ? fieldId+'-hint' : null, error ? fieldId+'-error' : null].filter(Boolean).join(' ') || undefined, required, ...props }
  const control = as === 'select'
    ? <select className="ui-field-control" {...shared}>{options.map(option => typeof option === 'string' ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select>
    : as === 'textarea' ? <textarea className="ui-field-control" {...shared}/> : <input className="ui-field-control" {...shared}/>
  return <div className={`ui-field ${error ? 'has-error' : ''} ${className}`.trim()}>{label && <label className="ui-field-label" htmlFor={fieldId}>{label}{required && <span aria-hidden="true"> *</span>}</label>}{control}{hint && <small className="ui-field-hint" id={fieldId+'-hint'}>{hint}</small>}{error && <small className="ui-field-error" id={fieldId+'-error'} role="alert">{error}</small>}</div>
}
export const Input = props => <Field {...props} as="input"/>
export const Select = props => <Field {...props} as="select"/>
export const Textarea = props => <Field {...props} as="textarea"/>
export const DatePicker = props => <Field {...props} type="date" as="input"/>

export function Card({ title, description, action, children, className='', ...props }) {
  return <section className={`ui-card ${className}`.trim()} {...props}>{(title || description || action) && <header className="ui-card-header"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{action}</header>}{children}</section>
}
export function StatCard({ label, value, trend, change, icon: Icon, note, className='' }) {
  const positive = String(trend || '').toLowerCase() !== 'down'
  return <article className={`ui-stat-card ${className}`.trim()}><div className="ui-stat-top"><span>{label}</span>{Icon && <span className="ui-stat-icon"><Icon size={17}/></span>}</div><div className="ui-stat-value">{value}</div><div className="ui-stat-foot">{change != null && <span className={`ui-trend ${positive ? 'is-up' : 'is-down'}`}>{positive ? <ArrowUp size={13}/> : <ArrowDown size={13}/>} {change}</span>}{note && <span>{note}</span>}</div></article>
}
export function Badge({ tone='neutral', children, dot=false, className='' }) { return <span className={`ui-badge ui-badge-${tone} ${className}`.trim()}>{dot && <i aria-hidden="true"/>}{children}</span> }
export const StatusBadge = ({ status, ...props }) => {
  const value=String(status||'').toLowerCase()
  const tone=/deliver|success|complete|paid|active/.test(value) ? 'success' : /delay|pending|review|pickup/.test(value) ? 'warning' : /fail|lost|damage|cancel|ndr|return/.test(value) ? 'danger' : /transit|process|out for/.test(value) ? 'info' : 'neutral'
  return <Badge tone={tone} dot {...props}>{status}</Badge>
}

export function Table({ columns=[], rows=[], loading=false, emptyTitle='Nothing here yet', emptyMessage='When records are available, they will appear here.', emptyAction, rowKey='id', onRowClick, className='' }) {
  const [sort, setSort] = useState({ key: '', direction: 'asc' })
  const sorted = useMemo(() => {
    if (!sort.key) return rows
    return [...rows].sort((a,b) => {
      const av=a[sort.key] ?? '', bv=b[sort.key] ?? ''
      const result=typeof av === 'number' && typeof bv === 'number' ? av-bv : String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:'base'})
      return sort.direction === 'asc' ? result : -result
    })
  },[rows,sort])
  return <div className={`ui-table-wrap ${className}`.trim()}><table className="ui-table"><thead><tr>{columns.map(col=><th key={col.key} scope="col" aria-sort={sort.key===col.key ? (sort.direction==='asc'?'ascending':'descending') : undefined}>{col.sortable ? <button type="button" className="ui-sort-button" onClick={()=>setSort(s=>({key:col.key,direction:s.key===col.key&&s.direction==='asc'?'desc':'asc'}))}>{col.label}{sort.key===col.key?(sort.direction==='asc'?<ArrowUp size={13}/>:<ArrowDown size={13}/>):<ArrowDown size={13} className="ui-sort-muted"/>}</button>:col.label}</th>)}</tr></thead><tbody>
    {loading ? Array.from({length:5},(_,i)=><tr key={'skeleton-'+i} className="ui-table-skeleton-row">{columns.map((col,j)=><td key={col.key}><span className="ui-skeleton" style={{width:(45+(i*j*13)%45)+'%'}}/></td>)}</tr>) : sorted.length ? sorted.map((row,index)=><tr key={row[rowKey] ?? index} onClick={onRowClick ? ()=>onRowClick(row) : undefined} className={onRowClick?'is-clickable':''}>{columns.map(col=><td key={col.key} data-label={col.label}>{col.render ? col.render(row[col.key],row) : row[col.key] ?? '—'}</td>)}</tr>) : <tr><td colSpan={Math.max(columns.length,1)}><EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction}/></td></tr>}
    </tbody></table></div>
}
export function EmptyState({ title='Nothing to show', message='Try adjusting your filters or create a new record.', action, icon: Icon, className='' }) {
  return <div className={`ui-empty-state ${className}`.trim()}>{Icon && <span className="ui-empty-icon"><Icon size={22}/></span>}<h3>{title}</h3><p>{message}</p>{action && <div className="ui-empty-action">{action}</div>}</div>
}
export function PageHeader({ title, description, breadcrumbs=[], actions, eyebrow, className='' }) {
  return <header className={`ui-page-header ${className}`.trim()}>{breadcrumbs.length>0 && <nav aria-label="Breadcrumb" className="ui-breadcrumbs">{breadcrumbs.map((item,index)=><span key={item.label||item} aria-current={index===breadcrumbs.length-1?'page':undefined}>{index>0 && <ChevronRight size={12}/>}{item.href ? <a href={item.href}>{item.label}</a> : item.label || item}</span>)}</nav>}<div className="ui-page-heading">{<div>{eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>}{actions && <div className="ui-page-actions">{actions}</div>}</div></header>
}
export function Modal({ open, onClose, title, description, children, footer, size='md' }) {
  useEffect(()=>{ if(!open)return; const previous=document.activeElement; const onKey=e=>{if(e.key==='Escape')onClose?.()};document.addEventListener('keydown',onKey);document.body.classList.add('ui-modal-open');return()=>{document.removeEventListener('keydown',onKey);document.body.classList.remove('ui-modal-open');previous?.focus?.()} },[open,onClose])
  if(!open || typeof document==='undefined')return null
  return createPortal(<div className="ui-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.()}}><section className={`ui-modal ui-modal-${size}`} role="dialog" aria-modal="true" aria-labelledby="ui-modal-title"><header className="ui-modal-header"><div><h2 id="ui-modal-title">{title}</h2>{description&&<p>{description}</p>}</div><button className="ui-icon-button" type="button" aria-label="Close dialog" onClick={onClose}><X size={18}/></button></header><div className="ui-modal-body">{children}</div>{footer&&<footer className="ui-modal-footer">{footer}</footer>}</section></div>,document.body)
}
export function Drawer({ open, onClose, title, children, footer, side='right' }) {
  useEffect(()=>{if(!open)return;const onKey=e=>{if(e.key==='Escape')onClose?.()};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey)},[open,onClose])
  if(!open || typeof document==='undefined')return null
  return createPortal(<div className="ui-overlay ui-drawer-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.()}}><aside className={`ui-drawer ui-drawer-${side}`} role="dialog" aria-modal="true" aria-label={title}><header className="ui-modal-header"><h2>{title}</h2><button className="ui-icon-button" aria-label="Close panel" onClick={onClose}><X size={18}/></button></header><div className="ui-drawer-body">{children}</div>{footer&&<footer className="ui-modal-footer">{footer}</footer>}</aside></div>,document.body)
}
export function Tabs({ items=[], value, defaultValue, onChange, className='' }) {
  const [internal,setInternal]=useState(defaultValue ?? items[0]?.value)
  const active=value ?? internal
  return <div className={`ui-tabs ${className}`.trim()} role="tablist">{items.map(item=><button key={item.value} id={`tab-${item.value}`} type="button" role="tab" aria-selected={active===item.value} aria-controls={`panel-${item.value}`} tabIndex={active===item.value?0:-1} className="ui-tab" onClick={()=>{setInternal(item.value);onChange?.(item.value)}}>{item.label}</button>)}</div>
}
export function Tooltip({ content, children }) { return <span className="ui-tooltip-wrap" tabIndex={0} aria-label={typeof content==='string'?content:undefined}>{children}<span role="tooltip" className="ui-tooltip">{content}</span></span> }
export function DropdownMenu({ label='Open menu', items=[], children }) {
  const [open,setOpen]=useState(false)
  return <div className="ui-dropdown"><button type="button" className="ui-dropdown-trigger" aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{children||label}<ChevronDown size={14}/></button>{open&&<div className="ui-dropdown-menu" role="menu">{items.map(item=><button type="button" role="menuitem" key={item.label} disabled={item.disabled} onClick={()=>{setOpen(false);item.onSelect?.()}}>{item.icon}{item.label}</button>)}</div>}</div>
}
export function Toast({ open, tone='success', title, message, onClose }) {
  useEffect(()=>{if(!open)return;const id=window.setTimeout(()=>onClose?.(),4500);return()=>window.clearTimeout(id)},[open,onClose])
  if(!open)return null
  return <div className={`ui-toast ui-toast-${tone}`} role={tone==='danger'?'alert':'status'}><span className="ui-toast-mark">{tone==='success'?<Check size={16}/>:<span>!</span>}</span><div><strong>{title}</strong>{message&&<p>{message}</p>}</div><button type="button" aria-label="Dismiss notification" onClick={onClose}><X size={16}/></button></div>
}
export function Skeleton({ width='100%', height=16, radius=6, className='' }) { return <span aria-hidden="true" className={`ui-skeleton ${className}`.trim()} style={{width,height,borderRadius:radius}}/> }
export function ThemeToggle({ compact=false }) {
  const [dark,setDark]=useState(()=>typeof window!=='undefined' && (window.localStorage.getItem('ikai-theme')==='dark' || (!window.localStorage.getItem('ikai-theme') && window.matchMedia?.('(prefers-color-scheme: dark)').matches)))
  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';window.localStorage.setItem('ikai-theme',dark?'dark':'light')},[dark])
  return <button type="button" className={`ui-theme-toggle ${compact?'is-compact':''}`} onClick={()=>setDark(v=>!v)} aria-label={dark?'Switch to light mode':'Switch to dark mode'} aria-pressed={dark} title={dark?'Switch to light mode':'Switch to dark mode'}>{dark?<Sun size={17}/>:<Moon size={17}/>}<span>{dark?'Light mode':'Dark mode'}</span></button>
}

export const formatNumber = (value, locale='en-PK') => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Number(value) || 0)
export const formatCurrency = (value, currency='PKR', locale='en-PK') => new Intl.NumberFormat(locale, { style:'currency', currency, maximumFractionDigits: 2 }).format(Number(value) || 0)
export const formatDate = (value, options={ day:'2-digit', month:'short', year:'numeric' }, locale='en-PK') => {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(locale, options).format(date)
}

import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, Bell, ChevronDown, CircleHelp, Command, LogOut, Menu, Search, Settings,
  PanelLeftClose, PanelLeftOpen, Plus, X, Check, Building2, UserRound, Sparkles
} from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { companies, navGroups } from '../data/mockData.js'
import { useDemoSession } from '../hooks/useDashboard.js'
const iconMap = {Activity,Settings}
const icons = await Promise.resolve(null)
function NavIcon({name}) {
 const all = {
 LayoutDashboard:(awaitIcon('layout')),ShoppingCart:(awaitIcon('cart')),Package:(awaitIcon('package')),
 PackageMinus:(awaitIcon('returns')),AlertTriangle:(awaitIcon('alert')),Truck:(awaitIcon('truck')),
 MapPin:(awaitIcon('pin')),Route:(awaitIcon('route')),Wallet:(awaitIcon('wallet')),
 ChartNoAxesCombined:(awaitIcon('chart')),Plug:(awaitIcon('plug')),LifeBuoy:(awaitIcon('help')),Settings:(awaitIcon('settings'))
 }
 const Icon=all[name]||Activity
 return <Icon size={18} strokeWidth={1.8}/>
}
function awaitIcon(name) {
 const map = {
 layout: requireIcon.LayoutDashboard,cart:requireIcon.ShoppingCart,package:requireIcon.Package,
 returns:requireIcon.PackageMinus,alert:requireIcon.TriangleAlert,truck:requireIcon.Truck,
 pin:requireIcon.MapPin,route:requireIcon.Route,wallet:requireIcon.Wallet,
 chart:requireIcon.ChartNoAxesCombined,plug:requireIcon.Plug,help:requireIcon.LifeBuoy,settings:requireIcon.Settings
 }
 return map[name]
}
import * as requireIcon from 'lucide-react'
export default function DashboardLayout() {
 const [collapsed,setCollapsed]=useState(false),[mobileOpen,setMobileOpen]=useState(false)
 const [companyOpen,setCompanyOpen]=useState(false),[company,setCompany]=useState(companies[0])
 const [profileOpen,setProfileOpen]=useState(false),[notificationsOpen,setNotificationsOpen]=useState(false)
 const [search,setSearch]=useState('')
 const location=useLocation(),navigate=useNavigate()
 const {session,logout}=useDemoSession()
 const title=navGroups.flatMap(g=>g.items).find(i=>i.to===location.pathname)?.label || 'Dashboard'
 const matches=(item)=>item.label.toLowerCase().includes(search.toLowerCase())
 function signOut(){logout();navigate('/login')}
 return <div className={'dashboard-shell'+(collapsed?' sidebar-collapsed':'')+(mobileOpen?' mobile-sidebar-open':'')}>
  {mobileOpen&&<button className="mobile-scrim" aria-label="Close menu" onClick={()=>setMobileOpen(false)}/>}
  <aside className="dashboard-sidebar">
   <div className="sidebar-brand"><Logo/><button className="sidebar-collapse" onClick={()=>setCollapsed(v=>!v)} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button><button className="mobile-close" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"><X size={20}/></button></div>
   <button className="workspace-switcher" onClick={()=>setCompanyOpen(v=>!v)}><span className="workspace-avatar">{company.initials}</span><span className="workspace-details"><b>{company.name}</b><small>{company.plan}</small></span><ChevronDown size={15}/></button>
   {companyOpen&&<div className="company-menu">{companies.map(c=><button key={c.id} onClick={()=>{setCompany(c);setCompanyOpen(false)}}><span className="workspace-avatar">{c.initials}</span><span><b>{c.name}</b><small>{c.plan}</small></span>{c.id===company.id&&<Check size={15}/>}</button>)}</div>}
   <div className="sidebar-scroll"><div className="sidebar-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter menu..."/><kbd>⌘ K</kbd></div>
   {navGroups.map(group=>{const items=group.items.filter(matches);if(!items.length)return null;return <div className="nav-group" key={group.title}><div className="nav-group-title">{group.title}</div>{items.map(item=><NavLink key={item.to} to={item.to} title={collapsed?item.label:undefined} onClick={()=>setMobileOpen(false)} className={({isActive})=>'sidebar-link'+(isActive?' active':'')}><NavIcon name={item.icon}/><span className="sidebar-link-label">{item.label}</span>{item.count&&<span className="nav-count">{item.count}</span>}</NavLink>)}</div>})}
   </div>
   <div className="sidebar-bottom"><div className="help-card"><span className="help-card-icon"><Sparkles size={16}/></span><b>Need a hand?</b><p>Our team is here to help you ship smarter.</p><NavLink to="/app/support" onClick={()=>setMobileOpen(false)}>Visit help centre <span>↗</span></NavLink></div><button className="sidebar-user" onClick={()=>setProfileOpen(v=>!v)}><span className="user-avatar">AD</span><span className="user-info"><b>{session?.name||'Abdullah Demo'}</b><small>Shipper account</small></span><ChevronDown size={15}/></button>{profileOpen&&<div className="profile-popover"><b>{session?.email||'demo@ikai.one'}</b><button onClick={signOut}><LogOut size={15}/> Sign out</button></div>}</div>
  </aside>
  <div className="dashboard-main">
   <header className="dashboard-topbar"><div className="topbar-left"><button className="mobile-menu" onClick={()=>setMobileOpen(true)} aria-label="Open menu"><Menu size={21}/></button><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{title}</strong></div></div>
    <div className="topbar-actions"><label className="global-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search anything..."/><kbd>⌘ K</kbd></label><div className="topbar-pop-wrap"><button className={'icon-button'+(notificationsOpen?' active':'')} onClick={()=>setNotificationsOpen(v=>!v)} aria-label="Notifications"><Bell size={18}/><i/></button>{notificationsOpen&&<div className="top-popover notification-pop"><div className="popover-heading"><b>Notifications</b><span>3 new</span></div><div className="notification-item"><span className="notification-icon orange"><Activity size={16}/></span><div><b>8 NDRs need attention</b><small>Review failed delivery attempts today.</small><time>12 min ago</time></div></div><div className="notification-item"><span className="notification-icon green"><Check size={16}/></span><div><b>Pickup completed</b><small>Your scheduled pickup was marked complete.</small><time>38 min ago</time></div></div><div className="notification-item"><span className="notification-icon blue"><Building2 size={16}/></span><div><b>Wallet summary ready</b><small>Your COD reconciliation preview is available.</small><time>1 hour ago</time></div></div><NavLink to="/app/ndr" onClick={()=>setNotificationsOpen(false)}>View all activity <span>→</span></NavLink></div></div><button className="icon-button help-top" onClick={()=>navigate('/app/support')} aria-label="Help centre"><CircleHelp size={18}/></button><div className="topbar-divider"/><button className="topbar-profile" onClick={()=>setProfileOpen(v=>!v)}><span className="user-avatar">AD</span><span><b>{session?.name||'Abdullah Demo'}</b><small>Admin</small></span><ChevronDown size={14}/></button>{profileOpen&&<div className="top-profile-pop"><b>{session?.email||'demo@ikai.one'}</b><button onClick={signOut}><LogOut size={15}/> Sign out</button></div>}</div>
   </header>
   <main className="dashboard-content"><Outlet context={{company,session}}/></main>
   <footer className="dashboard-footer"><span>© {new Date().getFullYear()} IKAI One</span><span><i/> Demo workspace · Sample data only</span><NavLink to="/app/support">Help & support</NavLink></footer>
  </div>
 </div>
}
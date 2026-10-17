import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, ChartNoAxesCombined, AlertTriangle, ArrowLeftRight, Banknote, Bell, BellRing, BookOpen, Boxes, Building2, Calculator, CalendarCheck, CalendarClock, Check, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Clock, Code, Download, FileText, FileUp, FileWarning, FolderTree, Gauge, Globe, History, LayoutDashboard, Layers, LifeBuoy, ListChecks, LocateFixed, LogOut, Map, MapPin, MapPinned, Menu, MessageCircle, MessageSquareText, Package, PackageCheck, PackageMinus, PackageOpen, PanelLeftClose, PanelLeftOpen, Plug, Receipt, RefreshCw, Route, Scale, ScrollText, Search, Settings, Settings2, ShieldAlert, ShieldCheck, ShoppingBag, ShoppingCart, SlidersHorizontal, Sparkles, Tags, Timer, Truck, Users, Wallet, Warehouse, Webhook, Workflow, X, Zap } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { companies, navGroups } from '../data/mockData.js'
import { useAuth } from '../context/AuthContext.jsx'
const navIcons={LayoutDashboard,ShoppingCart,Package,PackageMinus,AlertTriangle,Truck,MapPin,Map,Route,Wallet,ChartNoAxesCombined,Plug,LifeBuoy,Settings,Calculator,Activity,FileText,ShieldCheck,Globe,ShoppingBag,Boxes,Layers,BookOpen,Warehouse,CalendarClock,Zap,Sparkles,Clock,Code,Settings2,FileUp,Tags,ShieldAlert,LocateFixed,Timer,CalendarCheck,History,PackageOpen,ListChecks,Workflow,MessageCircle,MapPinned,Gauge,FileWarning,SlidersHorizontal,RefreshCw,FolderTree,ClipboardList,PackageCheck,ArrowLeftRight,Banknote,Scale,Receipt,Download,MessageSquareText,Users,ScrollText,Webhook,BellRing}
function NavIcon({name}){const Icon=navIcons[name]||Activity;return <Icon size={18} strokeWidth={1.8}/>}
export default function DashboardLayout(){
  const [collapsed,setCollapsed]=useState(false),[mobileOpen,setMobileOpen]=useState(false),[companyOpen,setCompanyOpen]=useState(false),[company,setCompany]=useState(companies[0]),[profileOpen,setProfileOpen]=useState(false),[notificationsOpen,setNotificationsOpen]=useState(false),[search,setSearch]=useState(''),[expandedMenus,setExpandedMenus]=useState({})
  const location=useLocation(),navigate=useNavigate(),{user,signOut}=useAuth()
  const currentNav=navGroups.flatMap(group=>group.items.flatMap(item=>[{...item,group:group.title},...(item.children||[]).map(child=>({...child,parent:item.label,group:group.title}))])).filter(item=>location.pathname===item.to||location.pathname.startsWith(item.to+'/')).sort((a,b)=>b.to.length-a.to.length)[0]
  const title=currentNav?.label||'Dashboard'
  const breadcrumbGroup=currentNav?.group||'WORKSPACE'
  const breadcrumbParent=currentNav?.parent
  const matches=item=>item.label.toLowerCase().includes(search.toLowerCase())
  const isExpanded=item=>Boolean(expandedMenus[item.to])
  const matchesGroupItem=item=>matches(item)||(item.children||[]).some(matches)
  function logout(){signOut();navigate('/login',{replace:true})}
  const initials=(user?.name||'IK').split(/\s+/).map(part=>part[0]).join('').slice(0,2).toUpperCase()
  return <div className={'dashboard-shell'+(collapsed?' sidebar-collapsed':'')+(mobileOpen?' mobile-sidebar-open':'')}>
    {mobileOpen&&<button className="mobile-scrim" aria-label="Close menu" onClick={()=>setMobileOpen(false)}/>}
    <aside className="dashboard-sidebar"><div className="sidebar-brand"><Logo/><button className="sidebar-collapse" onClick={()=>setCollapsed(v=>!v)} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button><button className="mobile-close" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"><X size={20}/></button></div>
      <button className="workspace-switcher" onClick={()=>setCompanyOpen(v=>!v)}><span className="workspace-avatar">{company.initials}</span><span className="workspace-details"><b>{company.name}</b><small>{company.plan}</small></span><ChevronDown size={15}/></button>
      {companyOpen&&<div className="company-menu">{companies.map(c=><button key={c.id} onClick={()=>{setCompany(c);setCompanyOpen(false)}}><span className="workspace-avatar">{c.initials}</span><span><b>{c.name}</b><small>{c.plan}</small></span>{c.id===company.id&&<Check size={15}/>}</button>)}</div>}
      <div className="sidebar-scroll"><div className="sidebar-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter menu..."/><kbd>⌘ K</kbd></div>
      {navGroups.map(group=>{const items=group.items.filter(matchesGroupItem);if(!items.length)return null;return <div className="nav-group" key={group.title}><div className="nav-group-title">{group.title}</div>{items.map(item=><div className={'sidebar-nav-item'+(item.children?.length?' has-submenu':'')+(isExpanded(item)?' submenu-open':'')} key={item.to}><div className="sidebar-parent-row"><NavLink end={item.to==='/app/dashboard'} to={item.to} title={collapsed?item.label:undefined} onClick={()=>setMobileOpen(false)} className={({isActive})=>'sidebar-link'+(isActive||item.children?.some(child=>location.pathname===child.to||location.pathname.startsWith(child.to+'/'))?' active':'')}><NavIcon name={item.icon}/><span className="sidebar-link-label">{item.label}</span>{item.count&&<span className="nav-count">{item.count}</span>}</NavLink>{item.children?.length>0&&!collapsed&&<button className={'sidebar-submenu-toggle'+(isExpanded(item)?' expanded':'')} aria-label={(isExpanded(item)?'Collapse ':'Expand ')+item.label+' submenu'} onClick={()=>setExpandedMenus(old=>({...old,[item.to]:!old[item.to]}))}><ChevronRight size={14}/></button>}</div>{item.children?.length>0&&!collapsed&&<div className="sidebar-submenu">{item.children.filter(matches).map(child=><NavLink key={child.to} to={child.to} onClick={()=>setMobileOpen(false)} className={({isActive})=>'sidebar-sub-link'+(isActive?' active':'')}><NavIcon name={child.icon}/><span>{child.label}</span></NavLink>)}</div>}</div>)}</div>})}</div>
      <div className="sidebar-bottom"><button className="sidebar-user" onClick={()=>setProfileOpen(v=>!v)}><span className="user-avatar">{initials}</span><span className="user-info"><b>{user?.name||'Shipper account'}</b><small>{user?.role||'Shipper account'}</small></span><ChevronDown size={15}/></button>{profileOpen&&<div className="profile-popover"><b>{user?.email||user?.phone}</b><button onClick={logout}><LogOut size={15}/> Sign out</button></div>}</div>
    </aside>
    <div className="dashboard-main"><header className="dashboard-topbar"><div className="topbar-left"><button className="mobile-menu" onClick={()=>setMobileOpen(true)} aria-label="Open menu"><Menu size={21}/></button><div className="breadcrumbs"><span>Workspace</span><b>/</b><span>{breadcrumbGroup}</span>{breadcrumbParent&&<><b>/</b><span>{breadcrumbParent}</span></>}<b>/</b><strong>{title}</strong></div></div>
      <div className="topbar-actions">
        <label className="global-search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search anything..."/><kbd>⌘ K</kbd></label>
        <div className="topbar-pop-wrap">
          <button className={'icon-button' + (notificationsOpen ? ' active' : '')} onClick={() => setNotificationsOpen(v => !v)} aria-label="Notifications"><Bell size={18}/><i/></button>
          {notificationsOpen && <div className="top-popover notification-pop">
            <div className="popover-heading"><b>Notifications</b><span>3 new</span></div>
            <div className="notification-item"><span className="notification-icon orange"><Activity size={16}/></span><div><b>8 NDRs need attention</b><small>Review failed delivery attempts today.</small><time>12 min ago</time></div></div>
            <div className="notification-item"><span className="notification-icon green"><Check size={16}/></span><div><b>Pickup completed</b><small>Your scheduled pickup was marked complete.</small><time>38 min ago</time></div></div>
            <div className="notification-item"><span className="notification-icon blue"><Building2 size={16}/></span><div><b>Wallet summary ready</b><small>Your COD reconciliation preview is available.</small><time>1 hour ago</time></div></div>
            <NavLink to="/app/ndr" onClick={() => setNotificationsOpen(false)}>View all activity <span>→</span></NavLink>
          </div>}
        </div>
        <button className="icon-button help-top" onClick={() => navigate('/app/support')} aria-label="Help centre"><CircleHelp size={18}/></button>
        <div className="topbar-divider"/>
        <button className="topbar-profile" onClick={() => setProfileOpen(v => !v)}><span className="user-avatar">{initials}</span><span><b>{user?.name || 'Shipper account'}</b><small>{user?.role || 'Admin'}</small></span><ChevronDown size={14}/></button>
        {profileOpen && <div className="top-profile-pop"><b>{user?.email || user?.phone}</b><button onClick={logout}><LogOut size={15}/> Sign out</button></div>}
      </div>
    </header><main className="dashboard-content"><Outlet context={{company,user}}/></main><footer className="dashboard-footer"><span>© {new Date().getFullYear()} IKAI One</span><span><i/> Live account · Shipment modules still use sample data</span><NavLink to="/app/support">Help & support</NavLink></footer></div>
  </div>
}

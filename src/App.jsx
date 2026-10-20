import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Logo from './components/Logo.jsx'
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, Box, Boxes, Check, CheckCircle2,
  ChevronDown, CircleDollarSign, Clock3, Globe2, MapPin, Menu, MessageCircle,
  PackageCheck, PlugZap, RefreshCcw, Route, ShieldCheck, Sparkles, Truck,
  WalletCards, X, Zap
} from 'lucide-react'

const features = [
  { icon: Boxes, tone: 'blue', tag: 'ONE WORKSPACE', title: 'Every courier, connected.', text: 'Bring orders, shipping partners, labels and exceptions into one organised place instead of jumping between tabs.' },
  { icon: Route, tone: 'orange', tag: 'SMARTER ROUTING', title: 'Choose with clarity.', text: 'Compare available delivery options and match each shipment to the service that fits its destination, cost and promise.' },
  { icon: CircleDollarSign, tone: 'green', tag: 'COD VISIBILITY', title: 'Cash flow, in focus.', text: 'Keep cash-on-delivery orders, remittance progress and reconciliation visible, with fewer spreadsheet follow-ups.' },
  { icon: Activity, tone: 'violet', tag: 'LIVE VISIBILITY', title: 'See delays before they grow.', text: 'Follow shipment milestones and exceptions together so your team can focus on the orders that need attention.' },
  { icon: RefreshCcw, tone: 'blue', tag: 'RETURNS & NDR', title: 'Turn issues into next steps.', text: 'Create a clearer workflow for failed delivery attempts, customer follow-ups, returns and reattempts.' },
  { icon: MessageCircle, tone: 'orange', tag: 'BUYER EXPERIENCE', title: 'Keep customers in the loop.', text: 'Offer a consistent post-purchase experience with tracking touchpoints that can reduce delivery-status questions.' }
]
const sampleTracking = {
  'IK-248601': { status: 'Out for delivery', city: 'Lahore', customer: 'Ayesha K.', time: 'Today · 10:42 AM', step: 4 },
  'IK-248602': { status: 'In transit', city: 'Islamabad', customer: 'Hamza R.', time: 'Today · 08:16 AM', step: 3 },
  'IK-248603': { status: 'Delivered', city: 'Karachi', customer: 'Sara M.', time: 'Yesterday · 04:38 PM', step: 5 }
}
const sampleRates = [
  { name: 'Standard delivery', note: 'Balanced cost & coverage', price: 235, days: '2–4 days', icon: Truck, suggested: true },
  { name: 'Express delivery', note: 'For time-sensitive orders', price: 320, days: '1–2 days', icon: Zap },
  { name: 'Economy delivery', note: 'A cost-conscious option', price: 195, days: '3–5 days', icon: PackageCheck }
]
const steps = [
  ['01', Boxes, 'Bring orders in', 'Start with an order file or connect the sales channels your team already uses.'],
  ['02', Route, 'Pick the right service', 'Review delivery options, compare the details and prepare the shipment.'],
  ['03', PackageCheck, 'Follow it to the finish', 'Track milestones, work exceptions and keep COD progress visible.']
]
const solutions = [
  { icon: Box, tag: 'D2C & SOCIAL COMMERCE', title: 'Growing online stores', text: 'Spend less time coordinating dispatch and more time building customer loyalty.' },
  { icon: Truck, tag: 'AGGREGATORS & SELLERS', title: 'Multi-courier operations', text: 'Create consistent workflows even when parcels travel with different delivery partners.' },
  { icon: BarChart3, tag: 'TEAMS & ENTERPRISE', title: 'Operations teams', text: 'Bring performance, exceptions and cash visibility into one practical operating view.' }
]

function Brand({ light = false }) {
  return <Logo className={light ? 'brand-light' : ''} />
}

const megaMenus = {
  Shipping: {
    className: 'products-mega',
    columns: [
      { title: 'CORE SHIPPING', items: [
        ['Domestic Shipping','Parcel delivery across Pakistan','PackageCheck'],
        ['Cargo Shipping','B2B, cartons and bulk consignments','Truck'],
        ['Local Delivery','Coordinate city-level deliveries','Zap'],
        ['Fulfillment & Warehousing','Prepare, pack and dispatch orders','Boxes']
      ]},
      { title: 'SHIPMENT WORKFLOWS', items: [
        ['Multi-Courier Shipping','Manage shipping across delivery partners','Route'],
        ['Shipment Tracking','Follow shipment milestones and exceptions','MapPin'],
        ['Returns & Reverse Logistics','Coordinate returns and reattempts','RefreshCcw'],
        ['COD & Reconciliation','Follow cash collection and remittance','WalletCards']
      ]}
    ]
  },
  Platform: {
    className: 'platform-mega',
    columns: [
      { title: 'OPERATIONS', items: [
        ['Order Management','Bring orders into one organised workflow','Boxes'],
        ['Courier Comparison','Review available delivery options','Route'],
        ['Shipping Labels','Prepare shipment labels and details','PackageCheck'],
        ['Pickup Management','Organise pickup addresses and requests','MapPin']
      ]},
      { title: 'CONTROL & VISIBILITY', items: [
        ['Tracking & Exceptions','See shipment progress and delivery issues','Activity'],
        ['COD Management','Keep COD status and follow-ups visible','WalletCards'],
        ['Returns Management','Manage failed deliveries and reverse flows','RefreshCcw'],
        ['Analytics & Reporting','Review operations and performance trends','BarChart3']
      ]}
    ],
    promo: { title: 'One operational view', text: 'Bring shipping activity, exceptions and follow-ups into a clearer workflow.', link: 'Explore the platform', icon: 'Sparkles' }
  },
  Solutions: {
    className: 'solutions-mega',
    columns: [
      { title: 'BY BUSINESS', items: [
        ['Ecommerce Sellers','Manage daily orders and dispatch','Box'],
        ['Social Commerce','Organise orders from social selling channels','MessageCircle'],
        ['Growing Brands','Build repeatable shipping workflows as volume grows','BarChart3'],
        ['Enterprise Operations','Coordinate teams, locations and performance','Activity']
      ]},
      { title: 'BY OPERATION', items: [
        ['Multi-Location Shipping','Manage dispatch from multiple locations','MapPin'],
        ['High-Volume Dispatch','Keep larger daily shipping workloads organised','Boxes'],
        ['B2B & Bulk Shipments','Coordinate business consignments','Truck'],
        ['Courier Partners','Explore delivery network collaboration','PlugZap']
      ]}
    ]
  },
  Partners: {
    className: 'partners-mega',
    columns: [
      { title: 'NETWORK PARTNERS', items: [
        ['Courier Integration','Connect delivery partners to shipping workflows','Truck'],
        ['Channel Integration','Connect order sources and ecommerce systems','PlugZap'],
        ['Technology Partners','Explore technology and integration collaboration','Globe2']
      ]},
      { title: 'WORK WITH IKAI', items: [
        ['Become a Partner','Discuss a partnership with IKAI One','Handshake'],
        ['Partner Enquiry','Share your organisation and collaboration needs','MessageCircle']
      ]}
    ]
  },
  Resources: {
    className: 'resources-mega',
    columns: [
      { title: 'TOOLS & SUPPORT', items: [
        ['Shipping Rate Calculator','Estimate shipping costs for planning','Calculator'],
        ['Volumetric Weight Calculator','Understand chargeable parcel weight','Scale'],
        ['FAQs','Find answers to common shipping questions','MessageCircleQuestion'],
        ['Knowledge Base','Read practical shipping and operations guides','GraduationCap']
      ]},
      { title: 'LEARN & BUILD', items: [
        ['Blog','Insights for ecommerce and logistics teams','PenLine'],
        ['Shipping Guides','Learn shipping basics and workflows','BookOpen'],
        ['Developers & API','Explore integration documentation','Code2'],
        ['Contact Support','Find the right next step for your question','MessageCircle']
      ]}
    ],
    promo: { title: 'Need a clearer shipping workflow?', text: 'Explore the core IKAI One capabilities for everyday shipping operations.', link: 'Get started', icon: 'Sparkles' }
  }
}
const visitorSlug = value => String(value).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const visitorPath = title => title === 'Blog' ? '/blog' : title === 'Refer & Earn' ? '/explore/refer-earn' : '/explore/' + visitorSlug(title)
const menuIconMap = { PackageCheck, Truck, Zap, Boxes, Box, Globe2, Route, Activity, RefreshCcw, PlugZap, Ship: Truck, Package: Box, Sparkles, ShieldCheck, Network: PlugZap, WalletCards, ChartNoAxesCombined: BarChart3, BrainCircuit: Sparkles, Mic: MessageCircle, MapPin, MapPinned: MapPin, Code2: PlugZap, Printer: PackageCheck, MessageSquare: MessageCircle, Store: Box, Grid2X2: Boxes, Gift: Sparkles, PackageOpen: Boxes, Handshake: Globe2, Calculator: CircleDollarSign, Scale: Activity, Wrench: Zap, GraduationCap: ShieldCheck, PenLine: MessageCircle, BookOpen: Boxes, BookText: Boxes, PlaySquare: Zap, MessageCircleQuestion: MessageCircle, UsersRound: Boxes }
function MegaItem({ item, onChoose, feature = false }) {
  const [title, description, iconName] = item
  const Icon = menuIconMap[iconName] || ArrowUpRight
  return <Link to={visitorPath(title)} className={feature ? 'mega-feature' : 'mega-item'} onClick={onChoose}>
    <span className="mega-item-icon"><Icon size={feature ? 19 : 18}/></span>
    <span className="mega-item-copy"><b>{title}</b>{description && <small>{description}</small>}</span>
  </Link>
}
function MegaMenu({ name, close }) {
  const menu = megaMenus[name]
  if (!menu) return null
  return <div className={'mega-menu ' + menu.className} role="region" aria-label={name + ' menu'}>
    <div className="mega-columns">{menu.columns.map(column => <section className="mega-column" key={column.title}>
      <h3>{column.title}</h3>
      {column.items.map(item => <MegaItem key={item[0]} item={item} onChoose={close}/>)}
    </section>)}</div>
    {menu.promo && <aside className="mega-promo"><div className="promo-art"><Sparkles size={28}/><span>IKAI</span></div><div><b>{menu.promo.title}</b><p>{menu.promo.text}</p><Link to={menu.promo.link === 'Get started' ? '/signup' : visitorPath(menu.promo.title)} onClick={close}>{menu.promo.link} <ArrowUpRight size={14}/></Link></div></aside>}
  </div>
}
export function Header() {
  const [activeMenu, setActiveMenu] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)
  const navigate = useNavigate()
  const { user, isAuthenticated, authLoading, signOut } = useAuth()
  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Your account'
  const initials = displayName.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'IK'
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn, { passive: true }); fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => {
    if (!accountOpen) return undefined
    const handlePointer = event => { if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false) }
    const handleKey = event => { if (event.key === 'Escape') setAccountOpen(false) }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('pointerdown', handlePointer); document.removeEventListener('keydown', handleKey) }
  }, [accountOpen])
  const handleSignOut = async () => {
    setAccountOpen(false)
    setMobileOpen(false)
    await signOut()
    navigate('/', { replace: true })
  }
  const close = () => { setActiveMenu(''); setMobileOpen(false); setAccountOpen(false) }
  const toggle = name => setActiveMenu(current => current === name ? '' : name)
  return <>
    <style>{`
      @media (max-width: 900px) {
        .mega-site-header .main-nav.nav-open {
          align-items: stretch !important;
          gap: 4px !important;
          padding: 12px 14px 20px !important;
          max-height: calc(100dvh - 76px) !important;
          overflow-y: auto !important;
          overscroll-behavior: contain;
        }
        .mega-site-header .mega-nav-item { width: 100% !important; }
        .mega-site-header .mega-nav-item > button {
          width: 100% !important;
          min-height: 52px !important;
          padding: 13px 14px !important;
          justify-content: space-between !important;
          border: 1px solid rgba(25,40,36,.10) !important;
          border-radius: 12px !important;
          background: rgba(255,255,255,.82) !important;
          color: var(--ink) !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          text-align: left !important;
        }
        .mega-site-header .mega-nav-item.menu-active > button {
          border-color: rgba(70,89,245,.34) !important;
          background: #eef0ff !important;
          color: #3445d5 !important;
        }
        .mega-site-header .mega-nav-item > .mega-menu {
          position: static !important;
          inset: auto !important;
          transform: none !important;
          display: block !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          max-height: none !important;
          margin: 8px 0 10px !important;
          padding: 15px !important;
          overflow: visible !important;
          border: 1px solid #dfe5df !important;
          border-radius: 14px !important;
          background: #fff !important;
          box-shadow: 0 10px 28px rgba(25,40,36,.09) !important;
        }
        .mega-site-header .products-main,
        .mega-site-header .mega-columns,
        .mega-site-header .platform-feature-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) !important;
          gap: 16px !important;
          min-width: 0 !important;
        }
        .mega-site-header .mega-column { min-width: 0 !important; }
        .mega-site-header .mega-column h3,
        .mega-site-header .products-side h3,
        .mega-site-header .platform-menu-main > h3 {
          margin: 0 0 8px !important;
          padding: 0 0 8px !important;
          border-bottom: 1px solid #e8ece8 !important;
          color: #65746c !important;
          font-size: 11px !important;
          letter-spacing: .09em !important;
          line-height: 1.4 !important;
        }
        .mega-site-header .mega-item,
        .mega-site-header .mega-feature {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          min-height: 62px !important;
          padding: 11px 9px !important;
          border-bottom: 1px solid #edf0ed !important;
          border-radius: 9px !important;
          background: transparent !important;
        }
        .mega-site-header .mega-item:last-child,
        .mega-site-header .mega-feature:last-child { border-bottom: 0 !important; }
        .mega-site-header .mega-item-icon {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex: 0 0 40px !important;
          width: 40px !important;
          height: 40px !important;
          border-radius: 11px !important;
          background: #f0f2ff !important;
          color: #4659f5 !important;
        }
        .mega-site-header .mega-item-copy { display: flex !important; flex-direction: column !important; gap: 4px !important; min-width: 0 !important; }
        .mega-site-header .mega-item-copy b { color: #192824 !important; font-size: 15px !important; font-weight: 700 !important; line-height: 1.35 !important; }
        .mega-site-header .mega-item-copy small { display: block !important; color: #68776f !important; font-size: 12px !important; line-height: 1.5 !important; white-space: normal !important; }
        .mega-site-header .products-side { display: block !important; margin-top: 16px !important; padding-top: 14px !important; border-top: 1px solid #e8ece8 !important; }
        .mega-site-header .products-side a {
          display: block !important;
          padding: 11px 9px !important;
          border-bottom: 1px solid #edf0ed !important;
          color: #192824 !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
        }
        .mega-site-header .products-side a:last-child { border-bottom: 0 !important; }
        .mega-site-header .mega-promo { margin-top: 14px !important; padding: 14px !important; border-radius: 12px !important; }
        .mega-site-header .mega-promo p { font-size: 13px !important; line-height: 1.5 !important; }
      }
      @media (max-width: 380px) {
        .mega-site-header .main-nav.nav-open { padding-right: 10px !important; padding-left: 10px !important; }
        .mega-site-header .mega-nav-item > .mega-menu { padding: 11px !important; }
        .mega-site-header .mega-item-copy b { font-size: 14px !important; }
      }
      /* Launch navigation uses a compact two-column service menu, not legacy mega-menu gutters. */
      @media (min-width: 761px) {
        .mega-site-header .products-mega,
        .mega-site-header .partners-mega {
          grid-template-columns: minmax(0, 1fr) !important;
          width: min(920px, calc(100vw - 64px)) !important;
          left: 50% !important;
        }
        .mega-site-header .products-mega .mega-columns,
        .mega-site-header .partners-mega .mega-columns {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 28px !important;
          padding: 25px !important;
        }
      }
      /* Refined, touch-first public navigation */
      @media (max-width: 760px) {
        .mega-site-header { isolation: isolate; }
        .mega-site-header .nav-shell { gap: 10px !important; }
        .mega-site-header .menu-toggle {
          width: 44px !important; height: 44px !important; flex: 0 0 44px !important;
          border: 1px solid #dfe6df !important; border-radius: 13px !important;
          background: #fff !important; color: #192824 !important;
          box-shadow: 0 3px 10px rgba(25,40,36,.06) !important;
          transition: background .18s ease, border-color .18s ease, transform .18s ease !important;
        }
        .mega-site-header .menu-toggle:active { transform: scale(.96); background: #f0f2ff !important; }
        .mega-site-header .main-nav.nav-open {
          position: absolute !important; top: calc(100% + 1px) !important;
          left: 0 !important; right: 0 !important; width: 100% !important;
          display: flex !important; flex-direction: column !important; align-items: stretch !important;
          gap: 5px !important; padding: 17px 16px max(22px, env(safe-area-inset-bottom)) !important;
          max-height: calc(100dvh - 64px) !important; overflow-x: hidden !important; overflow-y: auto !important;
          overscroll-behavior: contain !important; scrollbar-width: none !important; -ms-overflow-style: none !important;
          background: rgba(255,255,255,.985) !important;
          border: 1px solid #e5eae4 !important; border-top: 0 !important;
          border-radius: 0 0 20px 20px !important;
          box-shadow: 0 24px 50px rgba(20,35,28,.16) !important;
          backdrop-filter: blur(20px) !important; -webkit-backdrop-filter: blur(20px) !important;
          animation: ikai-mobile-nav-in .2s ease-out both !important;
        }
        .mega-site-header .main-nav.nav-open::-webkit-scrollbar,
        .mega-site-header .main-nav.nav-open *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        @keyframes ikai-mobile-nav-in {
          from { opacity: 0; transform: translateY(-7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mega-site-header .main-nav.nav-open::before {
          content: 'EXPLORE IKAI ONE'; display: block; padding: 0 3px 9px;
          color: #7a887f; font-size: 10px; font-weight: 800; letter-spacing: .13em;
        }
        .mega-site-header .main-nav.nav-open > a {
          display: flex !important; align-items: center !important; justify-content: space-between !important;
          min-height: 51px !important; padding: 12px 13px !important; margin: 0 !important;
          border: 1px solid #edf0ec !important; border-radius: 12px !important;
          background: #fff !important; color: #26382f !important;
          font-size: 15px !important; font-weight: 650 !important; line-height: 1.35 !important;
        }
        .mega-site-header .main-nav.nav-open > a:hover,
        .mega-site-header .main-nav.nav-open > a:focus-visible {
          background: #f5f6ff !important; border-color: #dfe2ff !important; color: #3445d5 !important;
        }
        .mega-site-header .mega-nav-item { width: 100% !important; border: 0 !important; }
        .mega-site-header .mega-nav-item > button {
          min-height: 51px !important; padding: 12px 13px !important;
          border: 1px solid #edf0ec !important; border-radius: 12px !important;
          background: #fff !important; color: #26382f !important;
          font-size: 15px !important; font-weight: 700 !important; line-height: 1.35 !important;
        }
        .mega-site-header .mega-nav-item.menu-active > button {
          border-color: #d9ddff !important; border-radius: 12px 12px 8px 8px !important;
          background: #f0f2ff !important; color: #3445d5 !important;
        }
        .mega-site-header .mega-nav-item > .mega-menu {
          margin: 7px 0 8px !important; padding: 13px !important;
          border: 1px solid #e7ebe5 !important; border-radius: 13px !important;
          background: #f8faf7 !important; box-shadow: inset 0 1px 2px rgba(25,40,36,.025) !important;
        }
        .mega-site-header .products-main,
        .mega-site-header .mega-columns,
        .mega-site-header .platform-feature-grid {
          grid-template-columns: minmax(0,1fr) !important; gap: 13px !important;
        }
        .mega-site-header .mega-column h3,
        .mega-site-header .products-side h3,
        .mega-site-header .platform-menu-main > h3 {
          margin: 0 0 6px !important; padding: 0 0 7px !important;
          color: #6e7c73 !important; font-size: 10px !important; letter-spacing: .12em !important;
          border-bottom: 1px solid #e4e9e2 !important;
        }
        .mega-site-header .mega-item,
        .mega-site-header .mega-feature {
          min-height: 60px !important; padding: 9px 7px !important; gap: 11px !important;
          border-bottom: 1px solid #e8ece6 !important; border-radius: 9px !important;
        }
        .mega-site-header .mega-item:active,
        .mega-site-header .mega-feature:active { background: #eef1ff !important; }
        .mega-site-header .mega-item-icon {
          flex: 0 0 38px !important; width: 38px !important; height: 38px !important;
          border-radius: 11px !important; background: #edf0ff !important; color: #4a59e8 !important;
        }
        .mega-site-header .mega-item-copy b { color: #24362d !important; font-size: 14px !important; font-weight: 700 !important; }
        .mega-site-header .mega-item-copy small { color: #6e7c73 !important; font-size: 12px !important; line-height: 1.45 !important; }
        .mega-site-header .products-side {
          margin-top: 13px !important; padding: 13px 10px 7px !important;
          border: 1px solid #e6ebe4 !important; border-radius: 11px !important; background: #fff !important;
        }
        .mega-site-header .products-side a {
          padding: 10px 3px !important; border-bottom: 1px solid #edf0eb !important;
          color: #33443a !important; font-size: 13px !important; font-weight: 600 !important;
        }
        .mega-site-header .mega-promo {
          align-items: center !important; gap: 12px !important; margin-top: 12px !important;
          padding: 13px !important; border: 1px solid #e6ebe4 !important; border-radius: 12px !important;
          background: #fff !important;
        }
        .mega-site-header .mega-promo b { font-size: 14px !important; }
        .mega-site-header .mega-promo p { margin: 5px 0 !important; color: #6e7c73 !important; font-size: 12px !important; }
        .mega-site-header .mega-promo a { font-size: 12px !important; }
        .mega-site-header .mobile-nav-actions {
          position: sticky !important; bottom: -1px !important; z-index: 2 !important;
          display: flex !important; gap: 10px !important; margin: 7px -16px -22px !important;
          padding: 13px 16px max(14px, env(safe-area-inset-bottom)) !important;
          background: rgba(255,255,255,.97) !important; border-top: 1px solid #e8ece6 !important;
        }
        .mega-site-header .mobile-nav-actions .nav-login-cta,
        .mega-site-header .mobile-nav-actions .button-primary {
          display: inline-flex !important; align-items: center !important; justify-content: center !important;
          min-height: 46px !important; border-radius: 11px !important; font-size: 13px !important;
          font-weight: 750 !important; flex: 1 1 0 !important;
        }
        .mega-site-header .mobile-nav-actions .nav-login-cta {
          border: 1px solid #dfe6df !important; background: #fff !important; color: #26382f !important;
        }
        .mega-site-header .mobile-nav-actions .button-primary { box-shadow: 0 5px 13px rgba(70,89,245,.18) !important; }
      }
      @media (max-width: 380px) {
        .mega-site-header .main-nav.nav-open { padding-right: 12px !important; padding-left: 12px !important; }
        .mega-site-header .mobile-nav-actions { margin-right: -12px !important; margin-left: -12px !important; padding-right: 12px !important; padding-left: 12px !important; }
        .mega-site-header .mega-nav-item > .mega-menu { padding: 10px !important; }
        .mega-site-header .mega-item-copy b { font-size: 13px !important; }
      }
    `}</style>
    <header className={'site-header mega-site-header' + (scrolled ? ' header-scrolled' : '')} onKeyDown={event => { if(event.key === 'Escape') close() }} onMouseLeave={() => { if(window.matchMedia('(hover: hover) and (pointer: fine)').matches) close() }}>
      <div className="nav-shell">
        <Brand/>
        <nav className={'main-nav mega-main-nav' + (mobileOpen ? ' nav-open' : '')} aria-label="Main navigation">
          {['Shipping','Platform','Solutions','Partners','Resources','Pricing','Track Order'].map(name => {
            const hasMenu = Boolean(megaMenus[name])
            if(name === 'Pricing') return <Link to="/pricing" key={name} onClick={close}>Pricing</Link>
            if(name === 'Track Order') return <Link to="/track-order" key={name} onClick={close}>{name}</Link>
            
            return <div className={'mega-nav-item'+(activeMenu===name?' menu-active':'')} key={name}>
              <button type="button" aria-expanded={activeMenu===name} onClick={() => toggle(name)} onMouseEnter={() => {if(window.matchMedia('(hover: hover) and (pointer: fine)').matches)setActiveMenu(name)}}>{name}<ChevronDown size={14}/></button>
              {activeMenu===name&&<MegaMenu name={name} close={close}/>}
            </div>
          })}
          <>{!authLoading && isAuthenticated && user?.isPlatformAdmin && <Link className="mobile-admin-nav-link" to="/admin" onClick={close}><ShieldCheck size={16}/> Platform admin <ArrowRight size={14}/></Link>}<div className="mobile-nav-actions">{!authLoading && (isAuthenticated ? <><Link className="button button-primary button-full" to="/app/dashboard" onClick={close}><Boxes size={16}/> Open dashboard <ArrowRight size={15}/></Link><button className="account-mobile-signout" type="button" onClick={handleSignOut}>Sign out</button></> : <><Link className="button button-quiet nav-login-cta" to="/login" onClick={close}>Sign in <ArrowRight size={15}/></Link><Link className="button button-primary button-full" to="/signup" onClick={close}>Get started <ArrowUpRight size={16}/></Link></>)}</div></>
        </nav>
        <div className="nav-actions">{authLoading ? <span className="nav-auth-loading" aria-label="Checking account"><i/><i/><i/></span> : isAuthenticated ? <div className="nav-account" ref={accountRef}><button className="nav-account-trigger" type="button" aria-expanded={accountOpen} aria-label="Open your account menu" onClick={() => setAccountOpen(value => !value)}><span className="nav-account-avatar">{initials}</span><span className="nav-account-label">Dashboard</span><ChevronDown size={14}/></button>{accountOpen && <div className="nav-account-menu"><div className="nav-account-identity"><span className="nav-account-avatar nav-account-avatar-large">{initials}</span><span><b>{displayName}</b><small>{user?.email || 'Signed in'}</small></span></div><Link to="/app/dashboard" onClick={close}><Boxes size={16}/> Open dashboard <ArrowRight size={14}/></Link>{user?.isPlatformAdmin && <Link to="/admin" onClick={close}><ShieldCheck size={16}/> Platform admin <ArrowRight size={14}/></Link>}<button type="button" onClick={handleSignOut}><ArrowUpRight size={15}/> Sign out</button></div>}</div> : <><Link className="button button-quiet nav-login-cta" to="/login">Sign in <ArrowRight size={15}/></Link><Link className="button button-primary nav-cta" to="/signup">Get started <ArrowUpRight size={15}/></Link></>}</div>
        <button className="menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>{mobileOpen ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
      {activeMenu&&<button className="mega-backdrop" aria-label="Close navigation menu" onClick={close} onMouseEnter={() => { if(window.matchMedia('(hover: hover) and (pointer: fine)').matches) close() }}/>}
    </header>
  </>
}

function MiniBars() {
  const values = [29, 44, 37, 56, 48, 67, 57, 77, 63, 87, 73, 95, 82, 100, 88, 112]
  return <div className="mini-bars" aria-label="Sample shipment trend chart">{values.map((height, i) => <span key={i} className={(i > 11 ? 'bar-hot ' : '') + (i === 13 ? 'bar-current' : '')} style={{height: height + 'px', animationDelay: (i * 30) + 'ms'}}/>)}</div>
}

function HeroArtwork() {
  return <div className="hero-art hero-network-art" aria-label="Illustration of a connected 4PL logistics control tower">
    <div className="network-art-wash"/>
    <div className="network-art-orbit orbit-one"/><div className="network-art-orbit orbit-two"/>
    <svg className="network-art-lines" viewBox="0 0 620 500" fill="none" aria-hidden="true">
      <path d="M85 118 C150 118 152 195 220 195"/>
      <path d="M402 184 C470 184 470 120 540 120"/>
      <path d="M404 286 C475 286 470 362 540 362"/>
      <path d="M220 300 C150 300 150 370 85 370"/>
      <path d="M310 92 V54"/><path d="M310 405 V450"/>
    </svg>
    <div className="network-partner partner-left"><span className="partner-icon partner-blue"><Truck size={18}/></span><div><small>DELIVERY NETWORK</small><b>Courier partners</b><span>Compare service options</span></div><ArrowUpRight size={15}/></div>
    <div className="network-partner partner-right"><span className="partner-icon partner-lime"><Boxes size={18}/></span><div><small>SHIPMENT TYPES</small><b>Parcel + cargo</b><span>One connected workflow</span></div><ArrowUpRight size={15}/></div>
    <div className="network-partner partner-bottom"><span className="partner-icon partner-peach"><WalletCards size={18}/></span><div><small>AFTER DISPATCH</small><b>Tracking, COD & returns</b><span>Follow the full journey</span></div></div>
    <div className="control-tower-card">
      <div className="tower-topbar"><div className="tower-brand"><span><Boxes size={16}/></span><div><b>IKAI One</b><small>4PL control tower</small></div></div><span className="tower-preview"><i/> INTERFACE PREVIEW</span></div>
      <div className="tower-heading"><div><small>YOUR LOGISTICS, CONNECTED</small><h3>Network overview</h3></div><span className="tower-filter"><Activity size={14}/> All workflows</span></div>
      <div className="tower-flow">
        <div className="tower-flow-step"><span><Boxes size={17}/></span><div><b>Orders</b><small>Collect & prepare</small></div></div>
        <i className="tower-flow-arrow"><ArrowRight size={14}/></i>
        <div className="tower-flow-step"><span><Route size={17}/></span><div><b>Route</b><small>Choose a service</small></div></div>
        <i className="tower-flow-arrow"><ArrowRight size={14}/></i>
        <div className="tower-flow-step"><span><PackageCheck size={17}/></span><div><b>Deliver</b><small>Track & resolve</small></div></div>
      </div>
      <div className="tower-capability-list">
        <div><span className="tower-cap-icon cap-blue"><Truck size={15}/></span><span><b>Multi-courier shipping</b><small>Service selection & dispatch</small></span><CheckCircle2 size={16}/></div>
        <div><span className="tower-cap-icon cap-green"><WalletCards size={15}/></span><span><b>COD & reconciliation</b><small>Collection through settlement</small></span><CheckCircle2 size={16}/></div>
        <div><span className="tower-cap-icon cap-orange"><Activity size={15}/></span><span><b>Tracking & exceptions</b><small>Milestones and next actions</small></span><CheckCircle2 size={16}/></div>
      </div>
      <div className="tower-footnote"><span><i/> SAMPLE WORKFLOW</span><span>Designed to connect your network</span></div>
    </div>
    <div className="network-floating-note float-note-top"><span className="note-icon"><Route size={17}/></span><span><b>Smarter service selection</b><small>Compare before you dispatch</small></span></div>
    <div className="network-floating-note float-note-bottom"><span className="note-icon note-icon-green"><Check size={16}/></span><span><b>One shipment timeline</b><small>From booking to delivery</small></span></div>
  </div>
}

function Hero() {
  return <section className="hero hero-4pl" id="top">
    <div className="hero-grid-bg"/><div className="hero-glow glow-left"/><div className="hero-glow glow-right"/>
    <div className="container hero-layout hero-4pl-layout">
      <div className="hero-copy hero-4pl-copy">
        <div className="eyebrow"><span className="eyebrow-mark"><Sparkles size={13}/></span> 4PL LOGISTICS AGGREGATION · PAKISTAN</div>
        <h1>Your entire logistics network.<br/><span className="headline-highlight">One control tower.</span></h1>
        <p className="hero-description">IKAI One brings courier selection, domestic and cargo shipping, tracking, COD, returns and performance into one connected workflow — so your team can manage every delivery partner with greater clarity.</p>
        <div className="hero-buttons">
          <a className="button button-primary button-large" href="/signup">Build your logistics flow <ArrowRight size={17}/></a>
          <a className="button button-quiet button-large" href="#platform">Explore the platform <ArrowUpRight size={16}/></a>
        </div>
        <div className="hero-coverage-note"><span className="coverage-note-icon"><CheckCircle2 size={17}/></span><div><b>One platform. Multiple delivery partners.</b><small>Built for parcel, cargo and ecommerce operations.</small></div></div>
        <div className="hero-mini-points">
          <span><CheckCircle2 size={15}/> Multi-courier workflows</span>
          <span><CheckCircle2 size={15}/> COD & settlement visibility</span>
          <span><CheckCircle2 size={15}/> Tracking & exceptions</span>
        </div>
      </div>
      <HeroArtwork/>
    </div>
    <div className="hero-route-caption"><span/> From order to doorstep, connected by IKAI One</div>
  </section>
}

function SignalStrip() {
  const entries = [[Boxes, 'ORDERS'], [Route, 'COURIERS'], [PackageCheck, 'TRACKING'], [WalletCards, 'COD & SETTLEMENTS'], [BarChart3, 'PERFORMANCE']]
  return <section className="signal-strip"><div className="container signal-inner"><p>ONE CONNECTED FLOW</p><div className="signal-list">{entries.map(([Icon, text]) => <div className="signal-item" key={text}><Icon size={17}/><span>{text}</span></div>)}</div><div className="signal-end"><span><Check size={13}/></span> Built to work together</div></div></section>
}

function SectionTitle({tag, title, accent, description, align = 'left'}) {
  return <div className={'section-title section-title-' + align}><div className="section-kicker"><span/>{tag}</div><h2>{title}{accent && <><br className="desktop-break"/><span>{accent}</span></>}</h2>{description && <p>{description}</p>}</div>
}

function PlatformSection() {
  return <section className="section platform-section" id="platform"><div className="container">
    <div className="platform-head"><SectionTitle tag="THE IKAI WORKSPACE" title="Less switching." accent="More shipping." description="From the first order to the final settlement, bring the moving parts of delivery into one calmer workflow."/><a className="text-link" href="#how-it-works">See how the flow works <ArrowUpRight size={16}/></a></div>
    <div className="feature-grid">{features.map(({icon: Icon, tone, tag, title, text}, i) => <article className={'feature-card feature-' + tone + ' reveal'} key={title} style={{transitionDelay: (i * 55) + 'ms'}}><div className="feature-card-top"><span className="feature-icon"><Icon size={21}/></span><span className="feature-number">0{i + 1}</span></div><span className="feature-eyebrow">{tag}</span><h3>{title}</h3><p>{text}</p><a href="#get-started">Explore capability <ArrowUpRight size={15}/></a><div className="feature-card-glow"/></article>)}</div>
  </div></section>
}

function NetworkSection() {
  return <section className="network-section" id="solutions"><div className="container network-layout">
    <div className="network-copy"><div className="section-kicker section-kicker-light"><span/> BUILT AROUND YOUR BUSINESS</div><h2>Commerce moves fast.<br/><span>Your operations should, too.</span></h2><p>Whether your team ships a handful of parcels or manages high-volume dispatches, IKAI gives everyone a shared view of what is booked, moving, delayed and delivered.</p>
      <div className="network-checks"><div><span><Check size={14}/></span><div><b>One view across partners</b><small>Reduce tab-hopping and fragmented updates.</small></div></div><div><span><Check size={14}/></span><div><b>Exceptions with context</b><small>Give your team a clear next step when a delivery slips.</small></div></div><div><span><Check size={14}/></span><div><b>Operations you can measure</b><small>Understand progress and performance in one place.</small></div></div></div>
      <a className="button button-white button-large" href="#get-started">Find your workflow <ArrowRight size={17}/></a>
    </div>
    <div className="network-visual"><div className="network-label"><span className="live-pulse"/> YOUR DELIVERY NETWORK <small>ILLUSTRATIVE VIEW</small></div>
      <svg className="network-lines" viewBox="0 0 540 460" fill="none" aria-hidden="true"><path className="map-line soft" d="M32 106 C120 66 134 164 225 129 S344 35 491 96"/><path className="map-line" d="M42 325 C112 256 152 356 246 278 S363 175 490 222"/><path className="map-line soft" d="M85 34 C136 117 68 192 154 249 S306 343 398 418"/><path className="map-line" d="M111 402 C209 344 215 216 314 200 S420 133 500 42"/><path className="map-line soft" d="M26 211 C144 190 209 240 293 129 S417 74 512 149"/></svg>
      <div className="network-node node-main"><span><Boxes size={25}/></span><b>IKAI One</b><small>Central workspace</small></div>
      <div className="network-node node-a"><span><Truck size={17}/></span><b>Delivery partners</b><small>Service options</small></div><div className="network-node node-b"><span><PackageCheck size={17}/></span><b>Order flow</b><small>Booked → delivered</small></div><div className="network-node node-c"><span><WalletCards size={17}/></span><b>COD visibility</b><small>Reconciliation view</small></div><div className="network-node node-d"><span><Activity size={17}/></span><b>Performance</b><small>Trends & exceptions</small></div>
      <div className="network-center-caption"><span/> Connected by design</div>
    </div>
  </div></section>
}

function HowItWorks() {
  return <section className="section how-section" id="how-it-works"><div className="container"><SectionTitle align="center" tag="A SIMPLE START" title="From order to doorstep." accent="Without the maze." description="A clearer shipping rhythm your team can learn quickly and build on as your business grows."/>
    <div className="steps-line">{steps.map(([n, Icon, title, text], i) => <article className="step-card reveal" key={n} style={{transitionDelay: (i * 90) + 'ms'}}><div className="step-icon"><Icon size={25}/><span>{n}</span></div><div className="step-connector"><i/></div><h3>{title}</h3><p>{text}</p></article>)}</div>
    <div className="steps-note"><Sparkles size={16}/><span>Start with the essentials. Add more automation as your operation evolves.</span></div>
  </div></section>
}

function TrackingSection() {
  const [trackingId, setTrackingId] = useState('IK-248601')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  function track(e) {
    e.preventDefault()
    const entry = sampleTracking[trackingId.trim().toUpperCase()]
    setResult(entry || null)
    setError(entry ? '' : 'No sample shipment found. Try IK-248601, IK-248602 or IK-248603.')
  }
  const timeline = ['Order booked', 'Picked up', 'In transit', 'Out for delivery', 'Delivered']
  return <section className="tracking-section" id="tracking"><div className="container tracking-layout">
    <div className="tracking-copy"><div className="section-kicker"><span/> POST-PURCHASE CLARITY</div><h2>“Where is my order?”<br/><span>Already answered.</span></h2><p>Give your team and your customers one simple way to check the latest shipment milestone. Try the sample IDs to preview the experience.</p>
      <div className="track-benefits"><span><ShieldCheck size={17}/> Clear status at a glance</span><span><Clock3 size={17}/> Milestones in one timeline</span><span><MessageCircle size={17}/> Less manual follow-up</span></div><a className="text-link" href="#get-started">Make tracking part of your flow <ArrowRight size={16}/></a>
    </div>
    <div className="tracking-card"><div className="tracking-card-header"><div className="tracking-brand"><span className="tracking-mark"><PackageCheck size={19}/></span><div><b>Shipment tracking</b><small>IKAI One · Sample experience</small></div></div><span className="tracking-secure"><ShieldCheck size={14}/> Secure lookup</span></div>
      <form className="tracking-form" onSubmit={track}><label htmlFor="tracking-number">TRACKING ID</label><div className="tracking-input-wrap"><Box size={17}/><input id="tracking-number" value={trackingId} onChange={e => {setTrackingId(e.target.value);setError('')}} placeholder="Enter your tracking ID"/><button type="submit" aria-label="Track sample shipment"><ArrowRight size={18}/></button></div><small>Sample IDs: IK-248601 · IK-248602 · IK-248603</small>{error && <p className="form-error">{error}</p>}</form>
      {result ? <div className="tracking-result"><div className="tracking-result-head"><div><span className="result-status"><i/>{result.status}</span><h3>{trackingId.trim().toUpperCase()}</h3><p>Recipient: {result.customer} <span>·</span> {result.city}</p></div><span className="result-box-icon"><PackageCheck size={23}/></span></div>
        <div className="timeline">{timeline.map((label, i) => <div className={'timeline-step' + (i < result.step ? ' complete' : '') + (i === result.step - 1 ? ' current' : '')} key={label}><span>{i < result.step ? <Check size={12}/> : i + 1}</span><div><b>{label}</b>{i === result.step - 1 && <small>Latest update · {result.time}</small>}</div></div>)}</div><div className="tracking-demo-note"><Sparkles size={13}/> Demo result — connected carrier updates will come later.</div></div>
      : <div className="tracking-placeholder"><div className="placeholder-route"><span><MapPin size={17}/></span><i/><i/><i/><span><PackageCheck size={17}/></span></div><b>Your delivery, made visible.</b><p>Enter a sample ID above to see a shipment timeline.</p></div>}
    </div>
  </div></section>
}

function CalculatorSection() {
  const [origin, setOrigin] = useState('Lahore')
  const [destination, setDestination] = useState('Karachi')
  const [weight, setWeight] = useState('1')
  const [showRates, setShowRates] = useState(false)
  const [error, setError] = useState('')
  function calculate(e) {
    e.preventDefault()
    if (origin === destination) {setError('Choose two different cities to compare a sample quote.');setShowRates(false);return}
    setError('');setShowRates(true)
  }
  function swap() {setOrigin(destination);setDestination(origin);setShowRates(false)}
  const multiplier = Math.max(1, Number(weight) || 1)
  const cities = ['Lahore','Karachi','Islamabad','Faisalabad','Multan','Peshawar']
  return <section className="section calculator-section" id="calculator"><div className="container"><div className="calculator-shell">
    <div className="calculator-copy"><div className="section-kicker section-kicker-light"><span/> PLAN YOUR NEXT SHIPMENT</div><h2>Better shipping starts<br/>with a <span>clear comparison.</span></h2><p>Preview how an in-platform rate comparison could work. These are illustrative estimates only, not live carrier prices.</p><div className="calculator-perks"><span><CheckCircle2 size={16}/> Compare options side by side</span><span><CheckCircle2 size={16}/> See speed and cost together</span></div><div className="calculator-disclaimer"><ShieldCheck size={15}/> Live rates can be connected in a later integration step.</div></div>
    <div className="quote-panel"><div className="quote-panel-head"><div><span className="quote-icon"><Globe2 size={20}/></span><div><b>Shipping rate preview</b><small>Pakistan · Domestic shipment</small></div></div><span className="demo-tag">DEMO</span></div>
      <form className="quote-form" onSubmit={calculate}><div className="city-fields">
        <label>FROM<span className="city-select"><MapPin size={15}/><select value={origin} onChange={e=>{setOrigin(e.target.value);setShowRates(false)}}>{cities.map(city=><option key={city}>{city}</option>)}</select><ChevronDown size={14}/></span></label>
        <button className="swap-button" type="button" onClick={swap} aria-label="Swap origin and destination"><RefreshCcw size={16}/></button>
        <label>TO<span className="city-select"><MapPin size={15}/><select value={destination} onChange={e=>{setDestination(e.target.value);setShowRates(false)}}>{cities.map(city=><option key={city}>{city}</option>)}</select><ChevronDown size={14}/></span></label>
      </div>
      <label className="weight-label">PARCEL WEIGHT<span className="weight-input"><input type="number" min="0.5" max="30" step="0.5" value={weight} onChange={e=>{setWeight(e.target.value);setShowRates(false)}}/><span>kg</span></span></label>
      {error && <p className="form-error">{error}</p>}<button className="button button-primary quote-submit" type="submit">Compare sample rates <ArrowRight size={16}/></button></form>
      {showRates && <div className="quote-results"><div className="quote-results-heading"><b>Sample options</b><span>{origin} <ArrowRight size={12}/> {destination}</span></div>{sampleRates.map(({name,note,price,days,icon:Icon,suggested})=><div className={'quote-option'+(suggested?' quote-recommended':'')} key={name}><span className="quote-option-icon"><Icon size={17}/></span><span className="quote-option-details"><b>{name} {suggested && <i>Suggested</i>}</b><small>{note} · {days}</small></span><strong>Rs {(price*multiplier).toLocaleString('en-PK')}</strong></div>)}<p className="quote-footnote">Illustrative values only. No carrier APIs are connected.</p></div>}
    </div>
  </div></div></section>
}

function SolutionSection() {
  return <section className="section solutions-section"><div className="container"><div className="solutions-heading"><SectionTitle tag="ONE PLATFORM, MANY WORKFLOWS" title="Made for the people" accent="moving business." description="IKAI connects the daily details that make deliveries happen, for the teams behind every parcel."/><div className="solution-side-note"><span className="side-note-icon"><PlugZap size={19}/></span><b>Flexible by design</b><p>Start with the flow you need. Expand when you’re ready.</p></div></div>
    <div className="solutions-grid">{solutions.map(({icon:Icon,tag,title,text},i)=><article className="solution-card reveal" key={title} style={{transitionDelay:(i*70)+'ms'}}><div className="solution-card-top"><span><Icon size={22}/></span><ArrowUpRight size={17}/></div><small>{tag}</small><h3>{title}</h3><p>{text}</p><a href="#get-started">Explore your use case <ArrowRight size={14}/></a><div className={'solution-watermark watermark-'+i}><Icon size={112} strokeWidth={.8}/></div></article>)}</div>
  </div></section>
}

function EarlyAccess({ notify }) {
  const [email,setEmail] = useState('')
  const [business,setBusiness] = useState('')
  const [sent,setSent] = useState(false)
  function submit(e) {e.preventDefault();setSent(true);notify('This is a frontend demo — signup will be connected in the next step.')}
  return <section className="early-access-section" id="get-started"><div className="container"><div className="early-access-card"><div className="early-access-orb orb-a"/><div className="early-access-orb orb-b"/>
    <div className="early-access-copy"><div className="section-kicker section-kicker-light"><span/> YOUR NEXT CHAPTER STARTS HERE</div><h2>Make room for<br/><span>what’s next.</span></h2><p>Bring more clarity to shipping, one workflow at a time. Tell us where to reach you to preview the IKAI experience.</p><div className="early-access-points"><span><CheckCircle2 size={16}/> A simpler view of shipping</span><span><CheckCircle2 size={16}/> A workspace built to scale</span></div></div>
    <form className="early-access-form" onSubmit={submit}><div className="form-badge"><Sparkles size={14}/> IKAI ONE · EARLY ACCESS</div><h3>{sent?'You’re on the preview list.':'Get the first look.'}</h3><p>{sent?'This is a UI-only demo. Your details have not been sent anywhere.':'Join the product preview for ecommerce teams.'}</p>
      <label htmlFor="business-name">BUSINESS NAME</label><input id="business-name" value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Your business" required/>
      <label htmlFor="business-email">WORK EMAIL</label><input id="business-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required/>
      <button className="button button-lime button-full" type="submit">{sent?'Submit again':'Request early access'} <ArrowRight size={16}/></button><small className="form-privacy"><ShieldCheck size={13}/> Demo only · This form does not send or store your data.</small>
    </form>
  </div></div></section>
}

export function Footer() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-main">
      <div className="footer-brand-column"><Brand light/><p>One clear view of every delivery.</p><span className="footer-made"><i/> Built for better shipping.</span></div>
      <nav className="footer-col" aria-label="Explore IKAI One"><b>EXPLORE</b><a href="/explore/all-features">Platform</a><a href="/explore/domestic-shipping">Shipping solutions</a><a href="/blog">Insights</a></nav>
      <nav className="footer-col" aria-label="Shipping tools"><b>QUICK LINKS</b><a href="/track-order">Track a parcel</a><a href="/explore/shipping-rate-calculator">Rate calculator</a><a href="/login">Seller login</a></nav>
      <div className="footer-col footer-col-contact"><b>GET STARTED</b><span>Bring your shipping into focus.</span><a href="/signup" className="footer-start-link">Create your workspace <ArrowRight size={13}/></a></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} IKAI One. All rights reserved.</span><span className="footer-status"><i/> Platform preview · Sample data</span><a href="#top" className="footer-back-top">Back to top ↑</a></div>
  </div></footer>
}

function Toast({message,onClose}) {
  useEffect(()=>{if(!message)return undefined;const timer=window.setTimeout(onClose,5200);return()=>window.clearTimeout(timer)},[message,onClose])
  if(!message)return null
  return <div className="toast-message" role="status"><span><CheckCircle2 size={19}/></span><div><b>Preview interaction</b><small>{message}</small></div><button onClick={onClose} aria-label="Dismiss notification"><X size={17}/></button></div>
}

export default function App() {
  const [toast,setToast] = useState('')
  useEffect(()=>{
    const nodes=document.querySelectorAll('.reveal')
    if(!('IntersectionObserver' in window)){nodes.forEach(node=>node.classList.add('is-visible'));return}
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12})
    nodes.forEach(node=>observer.observe(node))
    return()=>observer.disconnect()
  },[])
  return <><Header/><main id="top"><Hero/><SignalStrip/><PlatformSection/><NetworkSection/><HowItWorks/><TrackingSection/><CalculatorSection/><SolutionSection/><EarlyAccess notify={setToast}/></main><Footer/><Toast message={toast} onClose={()=>setToast('')}/></>
}
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from './components/UI.jsx'
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
  Products: {
    className: 'products-mega',
    columns: [
      { title: 'SHIPPING', items: [
        ['Domestic Shipping','Shipping across Pakistan','PackageCheck'],['Cargo Shipping','Nationwide B2B & bulk shipping','Truck'],['Quick','Speedy local deliveries at low costs','Zap'],['Fulfillment','Warehousing, packaging & shipping services','Boxes']
      ]},
      { title: 'CROSS-BORDER', items: [
        ['ShipX','International shipping to 220+ countries','Globe2'],['CargoX','Cross-border B2B & bulk shipping','Truck'],['OceanX','Seamless FCL & LCL ocean freight','Ship'],['Connect','Send personal packages worldwide','Package']
      ]},
      { title: 'GROWTH & MARKETING', items: [
        ['fastr by IKAI','AI-native pre-order and growth tools','Sparkles'],['Promise','Delivery estimates and trust signals','ShieldCheck'],['ONDC','Marketplace network integrations','Network']
      ]},
      { title: 'FINANCIAL SERVICES', items: [
        ['Capital','Financial services support','WalletCards'],['Credit Score','Credit score for free','ChartNoAxesCombined']
      ]},
      { title: 'AI ENABLED PRODUCTS', items: [
        ['Sense','Turn data into power with APIs','BrainCircuit'],['Trends','Consumer behaviour and commerce analytics','ChartNoAxesCombined'],['Voice AI','Build voice into customer workflows','Mic']
      ]}
    ],
    side: { title: 'VALUE ADDED SERVICES', items: ['Delivery Boost','Dark Stores','Delight Tracking','Instant COD','Instant Pick Up','IKAI Prime','Omni','Packaging','Co-Pilot','Returns Management'] }
  },
  Platform: {
    className: 'platform-mega',
    featureTitle: 'FEATURES',
    features: [
      ['Cash on Delivery','WalletCards'],['Serviceable Pincodes','MapPin'],['API Integration','Code2'],['Multiple Pickup Locations','MapPinned'],['Print Shipping Labels','Printer'],['Email SMS Notification','MessageSquare'],['Amazon Self-Ship','Store'],['All Features','Grid2X2']
    ],
    promo: { title: 'Refer & Earn', text: 'Invite sellers to IKAI One and unlock rewards as the network grows.', link: 'Learn more', icon: 'Gift' }
  },
  Partners: {
    className: 'partners-mega',
    columns: [
      {title:'INTEGRATIONS',items:[['Courier Integration','Connect multiple courier partners and automate shipping','PackageOpen'],['Channel Integration','Connect your online store and order management system','Network']]},
      {title:'PARTNER PROGRAM',items:[['Become a Partner','Collaborate with IKAI One and unlock new growth opportunities','Handshake']]}
    ]
  },
  Resources: {
    className: 'resources-mega',
    columns: [
      {title:'PRODUCT HELP',items:[['Shipping Rate Calculator','Estimate delivery costs before you ship','Calculator'],['Volumetric Weight Calculator','Calculate chargeable parcel weight','Scale'],['Free eCommerce Tools','Useful tools for online sellers','Wrench'],['Knowledge Base','Guides for day-to-day shipping','GraduationCap'],['Developers','API docs and integration guides','Code2']]},
      {title:'LEARN',items:[['Blog','Ideas for ecommerce and operations','PenLine'],['Ebook','Practical guides for growing teams','BookOpen'],['Encyclopedia','Shipping terms made simple','BookText'],['Videos and Podcast','Watch, listen and learn','PlaySquare'],['FAQs','Answers to common questions','MessageCircleQuestion']]}
    ],
    promo:{title:'Customer Stories',text:'Discover how sellers make their shipping operations simpler.',link:'Read stories',icon:'UsersRound'}
  }
}
const visitorSlug = value => String(value).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const visitorPath = title => title === 'Blog' ? '/blog' : title === 'Refer & Earn' ? '/explore/refer-earn' : '/explore/' + visitorSlug(title)
const menuIconMap = { PackageCheck, Truck, Zap, Boxes, Globe2, Ship: Truck, Package: Box, Sparkles, ShieldCheck, Network: PlugZap, WalletCards, ChartNoAxesCombined: BarChart3, BrainCircuit: Sparkles, Mic: MessageCircle, MapPin, MapPinned: MapPin, Code2: PlugZap, Printer: PackageCheck, MessageSquare: MessageCircle, Store: Box, Grid2X2: Boxes, Gift: Sparkles, PackageOpen: Boxes, Handshake: Globe2, Calculator: CircleDollarSign, Scale: Activity, Wrench: Zap, GraduationCap: ShieldCheck, PenLine: MessageCircle, BookOpen: Boxes, BookText: Boxes, PlaySquare: Zap, MessageCircleQuestion: MessageCircle, UsersRound: Boxes }
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
  if (name === 'Products') return <div className={'mega-menu '+menu.className} role="region" aria-label="Products menu">
    <div className="products-main">{menu.columns.map(column=><section className="mega-column" key={column.title}><h3>{column.title}</h3>{column.items.map(item=><MegaItem key={item[0]} item={item} onChoose={close}/>)}</section>)}</div>
    <aside className="products-side"><h3>{menu.side.title}</h3>{menu.side.items.map(item=><Link key={item} to={visitorPath(item)} onClick={close}>{item}</Link>)}</aside>
  </div>
  if (name === 'Platform') return <div className={'mega-menu '+menu.className} role="region" aria-label="Platform menu">
    <div className="platform-menu-main"><h3>{menu.featureTitle}</h3><div className="platform-feature-grid">{menu.features.map(item=><MegaItem key={item[0]} item={item} feature onChoose={close}/>)}</div></div>
    <aside className="mega-promo"><div className="promo-art"><Sparkles size={28}/><span>IKAI</span></div><div><b>{menu.promo.title}</b><p>{menu.promo.text}</p><Link to={visitorPath(menu.promo.title)} onClick={close}>{menu.promo.link} <ArrowUpRight size={14}/></Link></div></aside>
  </div>
  return <div className={'mega-menu '+menu.className} role="region" aria-label={name+' menu'}>
    <div className="mega-columns">{menu.columns.map(column=><section className="mega-column" key={column.title}><h3>{column.title}</h3>{column.items.map(item=><MegaItem key={item[0]} item={item} onChoose={close}/>)}</section>)}</div>
    {menu.promo&&<aside className="mega-promo"><div className="promo-art"><Sparkles size={28}/><span>IKAI</span></div><div><b>{menu.promo.title}</b><p>{menu.promo.text}</p><a href="#get-started" onClick={close}>{menu.promo.link} <ArrowUpRight size={14}/></a></div></aside>}
  </div>
}
export function Header() {
  const [activeMenu, setActiveMenu] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn, { passive: true }); fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const close = () => { setActiveMenu(''); setMobileOpen(false) }
  const toggle = name => setActiveMenu(current => current === name ? '' : name)
  return <>
    <header className={'site-header mega-site-header' + (scrolled ? ' header-scrolled' : '')} onKeyDown={event => { if(event.key === 'Escape') close() }}>
      <div className="nav-shell">
        <Brand/>
        <nav className={'main-nav mega-main-nav' + (mobileOpen ? ' nav-open' : '')} aria-label="Main navigation">
          {['Products','Platform','Pricing','Partners','Track Order','Resources','Investors'].map(name => {
            const hasMenu = Boolean(megaMenus[name])
            if(name === 'Pricing') return <Link to="/pricing" key={name} onClick={close}>Pricing</Link>
            if(name === 'Track Order') return <Link to="/track-order" key={name} onClick={close}>{name}</Link>
            if(name === 'Investors') return <Link to="/investors" key={name} onClick={close}>{name}</Link>
            return <div className={'mega-nav-item'+(activeMenu===name?' menu-active':'')} key={name} onMouseLeave={() => { if(window.matchMedia('(hover: hover) and (pointer: fine)').matches) setActiveMenu('') }}>
              <button type="button" aria-expanded={activeMenu===name} onClick={() => toggle(name)} onMouseEnter={() => {if(window.matchMedia('(hover: hover) and (pointer: fine)').matches)setActiveMenu(name)}}>{name}<ChevronDown size={14}/></button>
              {activeMenu===name&&<MegaMenu name={name} close={close}/>}
            </div>
          })}
          <div className="mobile-nav-actions"><a className="button button-quiet nav-login-cta" href="/login" onClick={close}>Sign in <ArrowRight size={15}/></a><a className="button button-primary button-full" href="/signup" onClick={close}>Get started <ArrowUpRight size={16}/></a></div>
        </nav>
        <div className="nav-actions"><ThemeToggle compact/><a className="button button-quiet nav-login-cta" href="/login">Sign in <ArrowRight size={15}/></a><a className="button button-primary nav-cta" href="/signup">Get started <ArrowUpRight size={15}/></a></div>
        <button className="menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>{mobileOpen ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
      {activeMenu&&<button className="mega-backdrop" aria-label="Close navigation menu" onClick={close}/>}
    </header>
  </>
}

function MiniBars() {
  const values = [29, 44, 37, 56, 48, 67, 57, 77, 63, 87, 73, 95, 82, 100, 88, 112]
  return <div className="mini-bars" aria-label="Sample shipment trend chart">{values.map((height, i) => <span key={i} className={(i > 11 ? 'bar-hot ' : '') + (i === 13 ? 'bar-current' : '')} style={{height: height + 'px', animationDelay: (i * 30) + 'ms'}}/>)}</div>
}

function HeroArtwork() {
  return <div className="hero-art" aria-label="Illustration of the IKAI shipping workspace">
    <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="orbit-dot dot-one"/><div className="orbit-dot dot-two"/>
    <div className="route-path route-path-one"/><div className="route-path route-path-two"/>
    <div className="float-pill float-live"><span className="live-pulse"/><span><b>Network online</b><small>All systems in sync</small></span><CheckCircle2 size={18}/></div>
    <div className="dashboard-window">
      <div className="dashboard-top"><div className="window-brand"><span className="window-brand-icon"><Boxes size={15}/></span><b>Workspace overview</b></div><span className="sample-chip">SAMPLE DATA <i/></span></div>
      <div className="dashboard-greeting"><div><small>TUESDAY, 13 OCTOBER</small><h3>Your shipping pulse <span>✳</span></h3></div><div className="dashboard-dots"><i/><i/><i/></div></div>
      <div className="metric-grid">
        <div className="metric-card"><span>Orders in motion</span><b>1,284</b><small className="metric-positive"><ArrowUpRight size={13}/> 12.8% <em>this week</em></small><div className="metric-sparkline"><svg viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0 25 C10 24 12 12 22 17 S38 20 48 10 S64 18 76 8 S90 10 100 2"/></svg></div></div>
        <div className="metric-card"><span>Delivered</span><b>96.4<small>%</small></b><small className="metric-positive"><ArrowUpRight size={13}/> 3.2% <em>this week</em></small><div className="metric-progress"><span/></div></div>
      </div>
      <div className="chart-panel"><div className="chart-heading"><div><b>Shipment activity</b><small>Across connected services</small></div><span>Last 7 days <ChevronDown size={12}/></span></div><MiniBars/><div className="chart-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div>
      <div className="recent-shipment"><div className="parcel-icon"><PackageCheck size={17}/></div><div><b>Shipment #IK-248601</b><small>Lahore · Out for delivery</small></div><span className="shipment-status"><i/> In progress</span></div>
      <div className="window-footer"><span><i className="footer-pulse"/> Mock workspace · sample data</span><span>Updated just now</span></div>
    </div>
    <div className="float-pill float-cod"><span className="cod-icon"><WalletCards size={19}/></span><span><small>COD to reconcile</small><b>Rs 84,250 <em>+8.6%</em></b></span><span className="cod-arrow"><ArrowUpRight size={15}/></span></div>
    <div className="float-pill float-delivered"><span className="delivered-icon"><Check size={16}/></span><span><b>Delivery confirmed</b><small>Parcel reached its destination</small></span></div>
    <div className="art-caption"><span/>A clearer view of every delivery.</div>
  </div>
}

function Hero() {
  return <section className="hero" id="top">
    <div className="hero-grid-bg"/><div className="hero-glow glow-left"/><div className="hero-glow glow-right"/>
    <div className="container hero-layout">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-mark"><Sparkles size={13}/></span> SHIPPING, WITHOUT THE SCATTER</div>
        <h1>Every order.<br/>Every courier.<br/><span className="headline-highlight">One clear view.</span></h1>
        <p className="hero-description">The shipping workspace built for ambitious ecommerce teams. Bring orders, delivery partners, tracking and COD operations into one place — and move your business forward.</p>
        <div className="hero-buttons"><a className="button button-primary button-large" href="#get-started">Build your shipping flow <ArrowRight size={17}/></a><a className="button button-quiet button-large" href="#platform"><span className="play-icon"><ArrowRight size={13}/></span> Explore the platform</a></div>
        <div className="hero-proof"><div className="proof-avatars"><span>A</span><span>I</span><span>K</span><span>+</span></div><div><div className="proof-stars">★★★★★ <span>Made for modern commerce</span></div><small>One workspace. More control over every shipment.</small></div></div>
        <div className="hero-mini-points"><span><CheckCircle2 size={15}/> Multi-courier workflows</span><span><CheckCircle2 size={15}/> COD visibility</span><span><CheckCircle2 size={15}/> One shipment timeline</span></div>
      </div>
      <HeroArtwork/>
    </div>
    <a className="scroll-cue" href="#platform"><span/> Scroll to explore</a>
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
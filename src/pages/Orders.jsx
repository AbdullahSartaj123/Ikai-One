import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import {
  Activity, ArrowLeft, ArrowRight, BadgeCheck, Ban, CalendarDays, Check, CheckCheck, ChevronDown,
  ChevronLeft, ChevronRight, CircleAlert, ClipboardList, Download, Eye, FileDown, Filter, MapPin,
  MoreHorizontal, Package, PackageCheck, Plus, Printer, Search, Settings2, ShieldCheck, ShoppingCart,
  SlidersHorizontal, Truck, UserRound, Wallet, X, Clock3, Copy, RotateCcw, MapPinned
} from 'lucide-react'
import StatusBadge from '../components/StatusBadge.jsx'
import { apiRequest } from '../lib/api.js'
import { mockOrders, orderStatuses, paymentModes, orderCouriers, orderChannels } from '../data/orders.js'

const columnDefinitions = [
  { key: 'id', label: 'Order ID' }, { key: 'channel', label: 'Channel' }, { key: 'customer', label: 'Customer name' },
  { key: 'product', label: 'Product' }, { key: 'paymentMode', label: 'Payment mode' }, { key: 'amount', label: 'Amount' },
  { key: 'weight', label: 'Weight' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'courier', label: 'Courier' }
]
const initialFilters = { from: '', to: '', paymentMode: 'All', courier: 'All', pincode: '', state: 'All' }
const stateOptions = [...new Set(mockOrders.map(order => order.state))].sort()
const fmtMoney = amount => 'Rs ' + Number(amount || 0).toLocaleString('en-PK')
const fmtDate = value => new Date(value).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtDateTime = value => new Date(value).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
function IconButton({ children, label, onClick, className = '' }) { return <button type="button" className={'orders-icon-button '+className} aria-label={label} title={label} onClick={onClick}>{children}</button> }
function StatusPill({ status }) { return <StatusBadge status={status}/> }

function mapApiOrder(row) {
  const items = Array.isArray(row.items) ? row.items : []
  return { id: row.order_number, uuid: row.id, channel: row.channel || 'Manual', customer: row.customer_name || '', phone: row.phone || '', email: row.email || '', address: row.address || '', pincode: row.pincode || '', city: row.city || '', state: row.state || '', product: items.map(item => item.name).join(', ') || '—', sku: items.map(item => item.sku || '—').join(', '), quantity: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), products: items, paymentMode: row.payment_mode || 'COD', amount: Number(row.amount || 0), weight: Number(row.weight || 0), date: row.created_at, status: row.status || 'New', courier: row.courier || 'Not booked', notes: row.notes || '' }
}
function OrdersList() {
  const navigate = useNavigate()
  const [orders,setOrders] = useState([])
  const [ordersSource,setOrdersSource] = useState('loading')
  const [loadError,setLoadError] = useState('')
  const [refreshing,setRefreshing] = useState(false)
  async function loadOrders(showLoading = false) {
    if (showLoading) setRefreshing(true)
    try {
      const payload = await apiRequest('/api/orders?limit=100')
      setOrders((payload.data || []).map(mapApiOrder))
      setOrdersSource('database')
      setLoadError('')
    } catch (error) {
      setOrdersSource('unavailable')
      setLoadError(error.message || 'Orders could not be loaded.')
    } finally {
      setRefreshing(false)
    }
  }
  useEffect(() => {
    let active = true
    apiRequest('/api/orders?limit=100').then(payload => {
      if (active) { setOrders((payload.data || []).map(mapApiOrder)); setOrdersSource('database'); setLoadError('') }
    }).catch(error => {
      if (active) { setOrdersSource('unavailable'); setLoadError(error.message || 'Orders could not be loaded.') }
    })
    return () => { active = false }
  }, [])
  async function updateOrderStatus(order, status) {
    if (!order.uuid) { showToast('This order has no saved database ID.'); return }
    const previousStatus = order.status
    setOrders(current => current.map(item => item.id === order.id ? {...item,status} : item))
    try {
      await apiRequest('/api/orders/' + order.uuid + '/status', {method:'POST', body:{status}})
      showToast(order.id + ' status saved as ' + status + '.')
    } catch (error) {
      setOrders(current => current.map(item => item.id === order.id ? {...item,status:previousStatus} : item))
      showToast(error.message || 'Order status could not be saved.')
    }
  }
  const activeOrders = orders
  const [activeTab,setActiveTab] = useState('All')
  const [search,setSearch] = useState('')
  const [filters,setFilters] = useState(initialFilters)
  const [draftFilters,setDraftFilters] = useState(initialFilters)
  const [filterOpen,setFilterOpen] = useState(false)
  const [columnsOpen,setColumnsOpen] = useState(false)
  const [visibleColumns,setVisibleColumns] = useState(columnDefinitions.map(column=>column.key))
  const [selected,setSelected] = useState([])
  const [page,setPage] = useState(1)
  const [pageSize,setPageSize] = useState(10)
  const [menuId,setMenuId] = useState('')
  const [toast,setToast] = useState('')
  const [bulkMenuOpen,setBulkMenuOpen] = useState(false)
  const [channelFilter,setChannelFilter] = useState('All')
  const [showOnlyFlagged,setShowOnlyFlagged] = useState(false)

  const filtered = useMemo(() => activeOrders.filter(order => {
    const matchesTab = activeTab === 'All' || order.status === activeTab
    const term = search.toLowerCase().trim()
    const matchesSearch = !term || [order.id,order.customer,order.product,order.channel,order.city,order.pincode,order.courier].some(value=>String(value).toLowerCase().includes(term))
    const matchesFrom = !filters.from || new Date(order.date) >= new Date(filters.from+'T00:00:00')
    const matchesTo = !filters.to || new Date(order.date) <= new Date(filters.to+'T23:59:59')
    const matchesPayment = filters.paymentMode === 'All' || order.paymentMode === filters.paymentMode
    const matchesCourier = filters.courier === 'All' || order.courier === filters.courier
    const matchesPincode = !filters.pincode || order.pincode.includes(filters.pincode)
    const matchesState = filters.state === 'All' || order.state === filters.state
    const matchesChannel = channelFilter === 'All' || order.channel === channelFilter
    const matchesFlagged = !showOnlyFlagged || ['NDR raised','RTO','Cancelled'].includes(order.status)
    return matchesTab && matchesSearch && matchesFrom && matchesTo && matchesPayment && matchesCourier && matchesPincode && matchesState && matchesChannel && matchesFlagged
  }),[activeOrders,activeTab,search,filters,channelFilter,showOnlyFlagged])
  const totalPages = Math.max(1,Math.ceil(filtered.length/pageSize))
  const currentPage = Math.min(page,totalPages)
  const pageRows = filtered.slice((currentPage-1)*pageSize,currentPage*pageSize)
  const allPageSelected = pageRows.length > 0 && pageRows.every(order=>selected.includes(order.id))
  const selectedOrders = activeOrders.filter(order=>selected.includes(order.id))
  const activeFilterCount = Object.entries(filters).filter(([key,value])=>value && value !== 'All').length + (channelFilter!=='All'?1:0) + (showOnlyFlagged?1:0)
  const setTab = tab => { setActiveTab(tab);setPage(1);setSelected([]) }
  const toggleOne = id => setSelected(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id])
  const togglePage = () => setSelected(current=>allPageSelected?current.filter(id=>!pageRows.some(order=>order.id===id)):[...new Set([...current,...pageRows.map(order=>order.id)])])
  function showToast(message){setToast(message);setTimeout(()=>setToast(''),3500)}
  function exportCsv(orders = selectedOrders.length ? selectedOrders : filtered) {
    const headings=['Order ID','Channel','Customer','Phone','Product','SKU','Payment Mode','Amount PKR','Weight kg','Date','Status','Courier','City','State','Pincode']
    const csv=[headings,...orders.map(o=>[o.id,o.channel,o.customer,o.phone,o.product,o.sku,o.paymentMode,o.amount,o.weight,o.date,o.status,o.courier,o.city,o.state,o.pincode])].map(row=>row.map(value=>'"'+String(value ?? '').replaceAll('"','""')+'"').join(',')).join('\n')
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='ikai-orders-'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(url)
    showToast('Exported '+orders.length+' saved order(s) to CSV.')
  }
  async function bulkAction(action) {
    if (!selected.length && !['Export CSV'].includes(action)) { showToast('Select at least one order first.');return }
    if (action === 'Export CSV') { exportCsv();return }
    if (action === 'Print Label' || action === 'Print Manifest') { showToast(action+' print view prepared for '+selected.length+' selected order(s). Use your browser print dialog.');window.print();return }
    if (action === 'Cancel') {
      const eligible = selectedOrders.filter(order => order.uuid && !['Delivered','RTO','Cancelled'].includes(order.status))
      if (!eligible.length) { showToast('No selected saved orders can be cancelled. Delivered, RTO and already-cancelled orders are excluded.');return }
      if (!window.confirm('Cancel '+eligible.length+' saved order(s)? This changes their status in Ikai.One.')) return
      const results = await Promise.allSettled(eligible.map(order => apiRequest('/api/orders/' + order.uuid + '/status', { method: 'POST', body: { status: 'Cancelled' } })))
      const succeeded = new Set(eligible.filter((order,index) => results[index].status === 'fulfilled').map(order => order.uuid))
      if (succeeded.size) setOrders(current => current.map(order => succeeded.has(order.uuid) ? { ...order, status: 'Cancelled' } : order))
      const failed = results.length - succeeded.size
      if (!failed) {
        setSelected([])
        showToast('Cancelled '+succeeded.size+' saved order(s).')
      } else {
        showToast('Cancelled '+succeeded.size+' order(s); '+failed+' failed. Refresh to verify saved statuses.')
      }
      return
    }
    if (action === 'Ship Now') { navigate('/app/orders/new');return }
    showToast(action+' is a mock action.')
  }
  function openFilters(){setDraftFilters(filters);setFilterOpen(true)}
  function applyFilters(){setFilters(draftFilters);setPage(1);setFilterOpen(false)}
  function resetFilters(){setDraftFilters(initialFilters);setFilters(initialFilters);setChannelFilter('All');setShowOnlyFlagged(false);setPage(1)}
  function toggleColumn(key){setVisibleColumns(current=>current.includes(key)?current.filter(item=>item!==key):[...current,key])}
  const actionOptions=[['Ship Now',Truck],['Cancel',Ban],['Export CSV',Download],['Print Label',Printer],['Print Manifest',ClipboardList]]
  const tabs=orderStatuses.map(status=>({label:status,count:status==='All'?activeOrders.length:activeOrders.filter(order=>order.status===status).length}))
  return <div className="orders-page page-stack">
    <div className="page-heading orders-page-heading"><div><div className="page-eyebrow"><span/> ORDER MANAGEMENT</div><h1>Orders</h1><p>Manage orders from every sales channel in one place.</p><small className={'orders-data-state '+(ordersSource==='database'?'connected':'')}>{ordersSource==='database'?'Connected to saved organization orders':ordersSource==='loading'?'Loading saved orders…':'Saved orders unavailable — '+loadError}</small></div><div className="heading-actions"><button className="secondary-button" onClick={()=>loadOrders(true)} disabled={refreshing}><RotateCcw size={15}/>{refreshing?'Refreshing…':'Refresh'}</button><button className="secondary-button" onClick={()=>exportCsv(filtered)}><Download size={15}/> Export view</button><button className="primary-button" onClick={()=>navigate('/app/orders/new')}><Plus size={17}/> Create order</button></div></div>
    {toast&&<div className="orders-toast"><Check size={16}/>{toast}<button onClick={()=>setToast('')}><X size={15}/></button></div>}
    <div className="orders-summary-strip"><div><span className="orders-summary-icon blue"><ShoppingCart size={17}/></span><span><small>Total orders</small><b>{activeOrders.length.toLocaleString('en-PK')}</b></span></div><div><span className="orders-summary-icon orange"><Clock3 size={17}/></span><span><small>Ready to ship</small><b>{activeOrders.filter(order=>order.status==='Ready to Ship').length}</b></span></div><div><span className="orders-summary-icon green"><PackageCheck size={17}/></span><span><small>Delivered</small><b>{activeOrders.filter(order=>order.status==='Delivered').length}</b></span></div><div><span className="orders-summary-icon violet"><Wallet size={17}/></span><span><small>COD orders</small><b>{activeOrders.filter(order=>order.paymentMode==='COD').length}</b></span></div></div>
    <section className="panel orders-list-panel">
      <div className="orders-tabs" role="tablist" aria-label="Filter orders by status">{tabs.map(tab=><button key={tab.label} role="tab" aria-selected={activeTab===tab.label} className={activeTab===tab.label?'active':''} onClick={()=>setTab(tab.label)}>{tab.label}<span>{tab.count}</span></button>)}</div>
      <div className="orders-toolbar"><label className="table-search orders-search"><Search size={16}/><input value={search} onChange={event=>{setSearch(event.target.value);setPage(1)}} placeholder="Search order ID, customer, product..."/>{search&&<button onClick={()=>setSearch('')} aria-label="Clear search"><X size={14}/></button>}</label>
        <label className="orders-channel-select"><span>Channel</span><select value={channelFilter} onChange={event=>{setChannelFilter(event.target.value);setPage(1)}}><option>All</option>{orderChannels.map(channel=><option key={channel}>{channel}</option>)}</select><ChevronDown size={14}/></label>
        <button className={'outline-button orders-filter-button'+(activeFilterCount?' has-filters':'')} onClick={openFilters}><SlidersHorizontal size={15}/> Filters{activeFilterCount>0&&<span>{activeFilterCount}</span>}</button>
        <div className="orders-column-wrap"><button className="outline-button" onClick={()=>setColumnsOpen(!columnsOpen)}><Settings2 size={15}/> Columns</button>{columnsOpen&&<div className="orders-column-popover"><div className="orders-popover-heading"><b>Show columns</b><button onClick={()=>setColumnsOpen(false)}><X size={14}/></button></div>{columnDefinitions.map(column=><label key={column.key}><input type="checkbox" checked={visibleColumns.includes(column.key)} onChange={()=>toggleColumn(column.key)}/>{column.label}</label>)}<button className="orders-reset-columns" onClick={()=>setVisibleColumns(columnDefinitions.map(column=>column.key))}>Reset columns</button></div>}</div>
        <button className={'outline-button orders-flag-button'+(showOnlyFlagged?' active':'')} onClick={()=>{setShowOnlyFlagged(!showOnlyFlagged);setPage(1)}}><CircleAlert size={15}/> Exceptions</button>
      </div>
      {selected.length>0&&<div className="orders-bulkbar"><span><CheckCheck size={16}/><b>{selected.length}</b> selected</span><button onClick={()=>setBulkMenuOpen(!bulkMenuOpen)}>Bulk actions <ChevronDown size={14}/></button>{bulkMenuOpen&&<div className="orders-bulk-menu">{actionOptions.map(([label,Icon])=><button key={label} onClick={()=>{setBulkMenuOpen(false);bulkAction(label)}}><Icon size={15}/>{label}</button>)}</div>}<button className="bulk-clear" onClick={()=>setSelected([])}>Clear selection</button></div>}
      <div className="orders-table-scroll"><table className="orders-table"><thead><tr><th className="orders-check-cell"><input type="checkbox" checked={allPageSelected} onChange={togglePage} aria-label="Select all orders on this page"/></th>{columnDefinitions.filter(column=>visibleColumns.includes(column.key)).map(column=><th key={column.key}>{column.label}</th>)}<th className="orders-action-head">Actions</th></tr></thead><tbody>{pageRows.map(order=><tr key={order.id}><td className="orders-check-cell"><input type="checkbox" checked={selected.includes(order.id)} onChange={()=>toggleOne(order.id)} aria-label={'Select '+order.id}/></td>{visibleColumns.includes('id')&&<td><Link className="orders-id-link" to={'/app/orders/'+order.id}>{order.id}</Link><small className="orders-subline">#{order.id.slice(-4)}</small></td>}{visibleColumns.includes('channel')&&<td><span className={'orders-channel channel-'+order.channel.toLowerCase().replace(/[^a-z]/g,'')}>{order.channel}</span></td>}{visibleColumns.includes('customer')&&<td><span className="orders-customer"><i>{order.customer.split(' ').map(part=>part[0]).join('').slice(0,2)}</i><span><b>{order.customer}</b><small>{order.phone}</small></span></span></td>}{visibleColumns.includes('product')&&<td><span className="orders-product"><b>{order.product}</b><small>SKU: {order.sku} · Qty {order.quantity}</small></span></td>}{visibleColumns.includes('paymentMode')&&<td><span className={'payment-chip '+(order.paymentMode==='COD'?'cod':'prepaid')}>{order.paymentMode}</span></td>}{visibleColumns.includes('amount')&&<td className="orders-amount">{fmtMoney(order.amount)}</td>}{visibleColumns.includes('weight')&&<td>{order.weight.toFixed(2)} kg</td>}{visibleColumns.includes('date')&&<td><span className="orders-date">{fmtDate(order.date)}</span><small className="orders-subline">{new Date(order.date).toLocaleTimeString('en-PK',{hour:'2-digit',minute:'2-digit'})}</small></td>}{visibleColumns.includes('status')&&<td>{order.uuid?<select aria-label={'Update status for '+order.id} value={order.status} onChange={event=>updateOrderStatus(order,event.target.value)} className="orders-status-select">{orderStatuses.filter(status=>status!=='All').map(status=><option key={status} value={status}>{status}</option>)}</select>:<StatusPill status={order.status}/>}</td>}{visibleColumns.includes('courier')&&<td><span className="orders-courier"><Truck size={13}/>{order.courier}</span></td>}<td className="orders-row-action"><button onClick={()=>setMenuId(menuId===order.id?'':order.id)} aria-label={'Actions for '+order.id}><MoreHorizontal size={18}/></button>{menuId===order.id&&<div className="orders-row-menu"><Link to={'/app/orders/'+order.id}><Eye size={14}/>View details</Link><button onClick={()=>{setSelected([order.id]);setMenuId('');showToast('Selected '+order.id+' for bulk actions.')}}><CheckCheck size={14}/>Select order</button><button onClick={()=>{setMenuId('');showToast('Label prepared for '+order.id);window.print()}}><Printer size={14}/>Print label</button><button disabled={!order.uuid||['Delivered','RTO','Cancelled'].includes(order.status)} onClick={()=>{setMenuId('');if(window.confirm('Cancel saved order '+order.id+'?'))updateOrderStatus(order,'Cancelled')}}><Ban size={14}/>Cancel order</button></div>}</td></tr>)}</tbody></table>
        {pageRows.length===0&&<div className="orders-empty"><Package size={28}/><b>No orders found</b><span>Change your search or filters and try again.</span><button className="outline-button" onClick={()=>{setSearch('');resetFilters();setTab('All')}}>Clear all filters</button></div>}
      </div>
      <div className="orders-pagination"><span>Showing <b>{filtered.length?((currentPage-1)*pageSize+1):0}–{Math.min(currentPage*pageSize,filtered.length)}</b> of <b>{filtered.length}</b> orders</span><div className="orders-page-size"><label>Rows per page<select value={pageSize} onChange={event=>{setPageSize(Number(event.target.value));setPage(1)}}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label></div><div className="orders-page-controls"><button disabled={currentPage===1} onClick={()=>setPage(currentPage-1)} aria-label="Previous page"><ChevronLeft size={16}/></button><span>Page <b>{currentPage}</b> of <b>{totalPages}</b></span><button disabled={currentPage===totalPages} onClick={()=>setPage(currentPage+1)} aria-label="Next page"><ChevronRight size={16}/></button></div></div>
    </section>
    {filterOpen&&<div className="orders-drawer-layer"><button className="orders-drawer-scrim" onClick={()=>setFilterOpen(false)} aria-label="Close filters"/><aside className="orders-filter-drawer"><div className="orders-drawer-heading"><div><span className="panel-eyebrow">REFINE YOUR VIEW</span><h2>Filter orders</h2></div><button onClick={()=>setFilterOpen(false)} aria-label="Close filter drawer"><X size={18}/></button></div><div className="orders-drawer-body"><label>Date from<input type="date" value={draftFilters.from} onChange={event=>setDraftFilters({...draftFilters,from:event.target.value})}/></label><label>Date to<input type="date" value={draftFilters.to} min={draftFilters.from||undefined} onChange={event=>setDraftFilters({...draftFilters,to:event.target.value})}/></label><label>Payment mode<select value={draftFilters.paymentMode} onChange={event=>setDraftFilters({...draftFilters,paymentMode:event.target.value})}><option>All</option>{paymentModes.map(mode=><option key={mode}>{mode}</option>)}</select></label><label>Courier partner<select value={draftFilters.courier} onChange={event=>setDraftFilters({...draftFilters,courier:event.target.value})}><option>All</option>{orderCouriers.map(courier=><option key={courier}>{courier}</option>)}</select></label><label>Pincode<input value={draftFilters.pincode} maxLength={5} inputMode="numeric" placeholder="e.g. 54000" onChange={event=>setDraftFilters({...draftFilters,pincode:event.target.value.replace(/\D/g,'')})}/></label><label>State / region<select value={draftFilters.state} onChange={event=>setDraftFilters({...draftFilters,state:event.target.value})}><option>All</option>{stateOptions.map(state=><option key={state}>{state}</option>)}</select></label></div><div className="orders-drawer-footer"><button className="secondary-button" onClick={()=>{setDraftFilters(initialFilters);setFilters(initialFilters)}}>Reset</button><button className="primary-button" onClick={applyFilters}>Apply filters <ArrowRight size={15}/></button></div></aside></div>}
  </div>
}
const pincodeDirectory = {
  '54000':{city:'Lahore',state:'Punjab',area:'Lahore Central'},'54010':{city:'Lahore',state:'Punjab',area:'Gulberg'},
  '75500':{city:'Karachi',state:'Sindh',area:'Karachi South'},'74000':{city:'Karachi',state:'Sindh',area:'Karachi Central'},
  '44000':{city:'Islamabad',state:'Islamabad Capital Territory',area:'Islamabad'},'46000':{city:'Rawalpindi',state:'Punjab',area:'Rawalpindi'},
  '38000':{city:'Faisalabad',state:'Punjab',area:'Faisalabad'},'60000':{city:'Multan',state:'Punjab',area:'Multan'},
  '52250':{city:'Gujranwala',state:'Punjab',area:'Gujranwala'},'51310':{city:'Sialkot',state:'Punjab',area:'Sialkot'},
  '25000':{city:'Peshawar',state:'Khyber Pakhtunkhwa',area:'Peshawar'},'63100':{city:'Bahawalpur',state:'Punjab',area:'Bahawalpur'}
}
function CreateOrder() {
  const navigate=useNavigate()
  const [form,setForm]=useState({customer:'',phone:'',email:'',address:'',pincode:'',city:'',state:'',channel:'Manual',paymentMode:'COD',courier:'',weight:'0.5',length:'20',width:'15',height:'10',notes:''})
  const [products,setProducts]=useState([{sku:'',name:'',quantity:1,price:''}])
  const [serviceability,setServiceability]=useState(null)
  const [submitted,setSubmitted]=useState(false)
  const [saved,setSaved]=useState(false)
  const [saving,setSaving]=useState(false)
  const [savedOrder,setSavedOrder]=useState(null)
  const [ratesReady,setRatesReady]=useState(false)
  const [selectedRate,setSelectedRate]=useState('')
  const [demoShipmentId,setDemoShipmentId]=useState('')
  const [error,setError]=useState('')
  const [shipmentSaving,setShipmentSaving]=useState(false)
  const [shipmentCreated,setShipmentCreated]=useState(null)
  const [shipmentError,setShipmentError]=useState('')
  const setField=(key,value)=>{setForm(current=>({...current,[key]:value}));if(key==='pincode'){setServiceability(null);const found=pincodeDirectory[value];if(found)setForm(current=>({...current,pincode:value,city:found.city,state:found.state}))}}
  const productTotal=products.reduce((sum,item)=>sum+(Number(item.price)||0)*(Number(item.quantity)||0),0)
  const canCheck= form.pincode.length===5 && Boolean(form.city) && Number(form.weight)>0
  function checkServiceability(){setRatesReady(false);setSelectedRate('');if(!canCheck){setServiceability({available:false,message:'Enter a supported 5-digit pincode and package weight first.'});return}const covered=Object.prototype.hasOwnProperty.call(pincodeDirectory,form.pincode);setServiceability({available:covered,message:covered?'Demo coverage found for '+form.city+'. Rates below are illustrative and are not live courier quotes.':'No demo coverage result for this pincode. Try 54000, 75500, 44000 or 46000.'})}
  function updateProduct(index,key,value){setProducts(current=>current.map((item,i)=>i===index?{...item,[key]:value}:item))}
  async function createShipmentRecord(){
    if(!savedOrder?.id){setShipmentError('Saved order ID is missing. Refresh the order before creating a shipment.');return}
    setShipmentSaving(true);setShipmentError('')
    try{
      const result=await apiRequest('/api/shipments',{method:'POST',body:{orderId:savedOrder.id,courier:form.courier||'Not booked',origin:'Lahore',destination:form.address+', '+form.city+', '+form.state,destinationPostalCode:form.pincode}})
      setShipmentCreated(result.data||{shipment_number:'Shipment saved'})
    }catch(err){
      setShipmentError(err.status===409?'A shipment record already exists for this order. Open Shipments to view it.':err.message||'Shipment record could not be created.')
    }finally{setShipmentSaving(false)}
  }
  async function submit(event){event.preventDefault();setSubmitted(true);setError('');if(!form.customer.trim()||!form.phone.trim()||!form.address.trim()||form.pincode.length<4||!form.city.trim()||!form.state.trim()||products.some(item=>!item.name.trim()||!Number.isSafeInteger(Number(item.quantity))||Number(item.quantity)<1||!Number.isFinite(Number(item.price))||Number(item.price)<0||item.price==='')){setError('Please complete all required customer, address and product fields.');return}setSaving(true);try{const result=await apiRequest('/api/orders',{method:'POST',body:{...form,weight:Number(form.weight),length:Number(form.length),width:Number(form.width),height:Number(form.height),products:products.map(item=>({...item,quantity:Number(item.quantity),price:Number(item.price)}))}});setDemoShipmentId(result.data?.order_number||'');setSavedOrder(result.data||null);setSaved(true)}catch(err){setError(err.message||'Order could not be saved. Please try again.')}finally{setSaving(false)}}
  return <div className="page-stack orders-create-page"><div className="page-heading"><div><button className="orders-back-link" onClick={()=>navigate('/app/orders')}><ArrowLeft size={15}/> Back to orders</button><h1>Create order</h1><p>Add customer, product and package details. Save the order before booking a courier.</p></div><span className="orders-draft-badge"><ClipboardList size={14}/> New order draft</span></div>
    {saved?<section className="panel orders-success-card"><span><BadgeCheck size={32}/></span><h2>Order saved successfully</h2><p>Order reference <b>{demoShipmentId}</b>. The order is saved to your organization’s records. Courier booking has not been performed.</p><div className="orders-success-summary"><span>Recipient<b>{form.customer}</b></span><span>Delivery option<b>{savedOrder?.courier||'Not booked'}</b></span><span>Order value<b>{fmtMoney(productTotal)}</b></span></div><div className="orders-form-actions"><button className="secondary-button" onClick={()=>{setSaved(false);setSubmitted(false);setServiceability(null);setRatesReady(false);setSelectedRate('');setShipmentCreated(null);setShipmentError('')}}>Create another</button><button className="primary-button" onClick={()=>navigate('/app/orders')}>Return to orders <ArrowRight size={15}/></button></div><section className="orders-next-shipment"><div><span className="orders-success-icon"><Package size={18}/></span><div><b>{shipmentCreated?'Shipment record created':'Next step: prepare shipment'}</b><p>{shipmentCreated?'Reference '+(shipmentCreated.shipment_number||shipmentCreated.tracking_number||'saved')+'. This is an internal record; no courier has been booked.':'Create an internal shipment record from this saved order. Courier booking is a separate integration.'}</p></div></div>{shipmentCreated?<Link className="primary-button" to="/app/shipments">Open shipments <ArrowRight size={14}/></Link>:<button className="primary-button" onClick={createShipmentRecord} disabled={shipmentSaving}>{shipmentSaving?'Creating…':'Create shipment record'} <ArrowRight size={14}/></button>}{shipmentError&&<p className="orders-form-error"><CircleAlert size={14}/>{shipmentError}</p>}</section></section>:<form className="orders-create-grid" onSubmit={submit}>
      <div className="orders-form-main">
        <section className="panel orders-form-section"><div className="orders-section-title"><span className="orders-section-number">01</span><div><h2>Customer details</h2><p>Who will receive this shipment?</p></div></div><div className="orders-form-fields two-col"><label className={submitted&&!form.customer.trim()?'invalid':''}>Customer full name *<input value={form.customer} onChange={event=>setField('customer',event.target.value)} placeholder="e.g. Ayesha Khan" required/></label><label className={submitted&&!form.phone.trim()?'invalid':''}>Phone number *<input value={form.phone} onChange={event=>setField('phone',event.target.value)} placeholder="+92 300 1234567" required/></label><label>Email address<input type="email" value={form.email} onChange={event=>setField('email',event.target.value)} placeholder="customer@example.com"/></label><label>Sales channel<select value={form.channel} onChange={event=>setField('channel',event.target.value)}>{orderChannels.map(channel=><option key={channel}>{channel}</option>)}</select></label></div></section>
        <section className="panel orders-form-section"><div className="orders-section-title"><span className="orders-section-number">02</span><div><h2>Delivery address</h2><p>Enter a Pakistan postal code to autofill supported city and region details.</p></div></div><div className="orders-form-fields"><label>Street address *<input value={form.address} onChange={event=>setField('address',event.target.value)} placeholder="House, street, area" required/></label><div className="two-col"><label className={submitted&&form.pincode.length!==5?'invalid':''}>Pincode *<div className="pincode-input-wrap"><input inputMode="numeric" maxLength={5} value={form.pincode} onChange={event=>setField('pincode',event.target.value.replace(/\D/g,'').slice(0,5))} placeholder="54000" required/><button type="button" onClick={()=>{const found=pincodeDirectory[form.pincode];if(found){setForm(current=>({...current,city:found.city,state:found.state}));setServiceability(null)}else setError('No pincode record in demo directory. Try 54000, 75500, 44000 or 46000.')}}><MapPin size={14}/> Lookup</button></div></label><label>City *<input value={form.city} onChange={event=>setField('city',event.target.value)} placeholder="City" required/></label><label>State / region *<input value={form.state} onChange={event=>setField('state',event.target.value)} placeholder="State" required/></label><label>Delivery notes<input value={form.notes} onChange={event=>setField('notes',event.target.value)} placeholder="Landmark or delivery instructions"/></label></div></div>{form.pincode&&pincodeDirectory[form.pincode]&&<div className="pincode-autofill-note"><Check size={14}/> Postal data matched: {pincodeDirectory[form.pincode].area}, {pincodeDirectory[form.pincode].city}</div>}</section>
        <section className="panel orders-form-section"><div className="orders-section-title"><span className="orders-section-number">03</span><div><h2>Products</h2><p>Add each item included in this order.</p></div><button type="button" className="orders-add-product" onClick={()=>setProducts(current=>[...current,{sku:'',name:'',quantity:1,price:''}])}><Plus size={14}/> Add product</button></div>{products.map((item,index)=><div className="orders-product-form-row" key={index}><div className="orders-product-row-head"><b>Product {index+1}</b>{products.length>1&&<button type="button" onClick={()=>setProducts(current=>current.filter((_,i)=>i!==index))}><X size={14}/> Remove</button>}</div><div className="orders-form-fields product-grid"><label>SKU<input value={item.sku} onChange={event=>updateProduct(index,'sku',event.target.value)} placeholder="SKU-001"/></label><label className={submitted&&!item.name.trim()?'invalid':''}>Product name *<input value={item.name} onChange={event=>updateProduct(index,'name',event.target.value)} placeholder="Product name" required/></label><label>Qty *<input type="number" min="1" value={item.quantity} onChange={event=>updateProduct(index,'quantity',event.target.value)} required/></label><label>Unit price (Rs) *<input type="number" min="0" value={item.price} onChange={event=>updateProduct(index,'price',event.target.value)} placeholder="2500" required/></label></div><div className="orders-line-total">Line total <b>{fmtMoney((Number(item.price)||0)*(Number(item.quantity)||0))}</b></div></div>)}</section>
        <section className="panel orders-form-section"><div className="orders-section-title"><span className="orders-section-number">04</span><div><h2>Package details</h2><p>Used to estimate shipping rates and serviceability.</p></div></div><div className="orders-form-fields package-grid"><label>Weight (kg) *<input type="number" min="0.1" step="0.1" value={form.weight} onChange={event=>setField('weight',event.target.value)} required/></label><label>Length (cm)<input type="number" min="1" value={form.length} onChange={event=>setField('length',event.target.value)}/></label><label>Width (cm)<input type="number" min="1" value={form.width} onChange={event=>setField('width',event.target.value)}/></label><label>Height (cm)<input type="number" min="1" value={form.height} onChange={event=>setField('height',event.target.value)}/></label></div><div className="orders-volumetric-note">Volumetric weight estimate: <b>{((Number(form.length)*Number(form.width)*Number(form.height))/5000||0).toFixed(2)} kg</b> · Billable weight is the higher of actual and volumetric weight.</div></section>
        <section className="panel orders-form-section"><div className="orders-section-title"><span className="orders-section-number">05</span><div><h2>Payment & courier</h2><p>Choose how the recipient will pay.</p></div></div><div className="orders-payment-choice">{['COD','Prepaid'].map(mode=><button type="button" key={mode} className={form.paymentMode===mode?'active':''} onClick={()=>setField('paymentMode',mode)}><span>{mode==='COD'?<Wallet size={18}/>:<ShieldCheck size={18}/>}</span><b>{mode==='COD'?'Cash on Delivery':'Prepaid'}</b><small>{mode==='COD'?'Collect payment at delivery':'Customer has already paid'}</small>{form.paymentMode===mode&&<Check size={15}/>}</button>)}</div><div className="orders-serviceability-box"><div><span className="orders-service-icon"><Truck size={19}/></span><div><b>Courier serviceability</b><small>Check coverage for the destination pincode and package.</small></div></div><button type="button" className="secondary-button" onClick={checkServiceability}><Activity size={15}/> Check serviceability</button>{serviceability&&<div className={'orders-service-result '+(serviceability.available?'available':'unavailable')}><span>{serviceability.available?<CheckCircle2Icon/>:<CircleAlert size={16}/>}</span><div><b>{serviceability.available?'Service available':'Check required'}</b><small>{serviceability.message}</small></div></div>}{serviceability?.available&&<><label className="orders-courier-select">Preferred courier (optional)<select value={form.courier} onChange={event=>{setField('courier',event.target.value);setSelectedRate('');setRatesReady(false)}}><option value="">Any available partner</option>{orderCouriers.map(courier=><option key={courier}>{courier}</option>)}</select></label>{ratesReady&&<div className="domestic-rate-list"><div className="domestic-rate-heading"><b>Compare delivery options</b><small>Illustrative demo rates · not live courier quotes</small></div>{[{name:form.courier||'PostEx',service:'Standard',price:Math.round(180+Math.max(Number(form.weight),((Number(form.length)*Number(form.width)*Number(form.height))/5000))*55),eta:'2–4 business days'},{name:form.courier||'TCS',service:'Express',price:Math.round(260+Math.max(Number(form.weight),((Number(form.length)*Number(form.width)*Number(form.height))/5000))*75),eta:'1–2 business days'},{name:form.courier||'Leopards',service:'Economy',price:Math.round(150+Math.max(Number(form.weight),((Number(form.length)*Number(form.width)*Number(form.height))/5000))*45),eta:'3–5 business days'}].map(rate=><button type="button" key={rate.service} className={'domestic-rate-option'+(selectedRate===rate.name+' · '+rate.service?' selected':'')} onClick={()=>setSelectedRate(rate.name+' · '+rate.service)}><span><b>{rate.name}</b><small>{rate.service} · {rate.eta}</small></span><strong>Rs {rate.price.toLocaleString('en-PK')}</strong><i>{selectedRate===rate.name+' · '+rate.service?'Selected':'Select'}</i></button>)}</div>}</>}</div></section>
      </div>
      <aside className="orders-form-sidebar"><section className="panel orders-total-card"><span className="panel-eyebrow">ORDER SUMMARY</span><h2>Review order</h2><div><span>Products ({products.length})</span><b>{fmtMoney(productTotal)}</b></div><div><span>Shipping estimate</span><b>Calculated by courier</b></div><div className="orders-total-line"><span>Order value</span><b>{fmtMoney(productTotal)}</b></div><div className="orders-summary-payment"><span>Payment mode</span><b className={'payment-chip '+(form.paymentMode==='COD'?'cod':'prepaid')}>{form.paymentMode}</b></div><p><ShieldCheck size={14}/> Saving creates an order record only. No payment or courier booking is triggered.</p></section><section className="panel orders-form-tip"><span><MapPinned size={17}/></span><div><b>Address tip</b><p>Use the five-digit postal code lookup to populate supported city and region fields.</p></div></section>{error&&<div className="orders-form-error"><CircleAlert size={15}/>{error}</div>}<button type="submit" className="primary-button orders-submit-button"><Check size={16}/>{saving?'Saving order…':'Save order'}</button><button type="button" className="secondary-button orders-cancel-button" onClick={()=>navigate('/app/orders')}>Cancel</button></aside>
    </form>}
  </div>
}
function CheckCircle2Icon(){return <Check size={16}/>}
function OrderDetail() {
  const {orderId}=useParams()
  const navigate=useNavigate()
  const [savedOrder,setSavedOrder]=useState(null)
  const [detailLoading,setDetailLoading]=useState(true)
  const [shipment,setShipment]=useState(null)
  const [shipmentLoading,setShipmentLoading]=useState(true)
  const [shipmentSaving,setShipmentSaving]=useState(false)
  const [shipmentMessage,setShipmentMessage]=useState('')
  useEffect(()=>{let active=true;apiRequest('/api/orders?limit=100').then(payload=>{if(active){const row=(payload.data||[]).find(item=>item.order_number===orderId);if(row){const mapped=mapApiOrder(row);mapped.unitPrice=mapped.quantity?mapped.amount/mapped.quantity:0;mapped.timeline=[{title:'Order saved',detail:'Order record created in your organization workspace.',date:row.created_at,complete:true}];setSavedOrder(mapped)}}}).catch(()=>{}).finally(()=>{if(active)setDetailLoading(false)});return()=>{active=false}},[orderId])
  useEffect(()=>{let active=true;setShipmentLoading(true);apiRequest('/api/shipments?limit=100&search='+encodeURIComponent(orderId)).then(payload=>{if(active){const found=(payload.data||[]).find(row=>row.order_number===orderId);setShipment(found||null)}}).catch(()=>{if(active)setShipment(null)}).finally(()=>{if(active)setShipmentLoading(false)});return()=>{active=false}},[orderId])
  async function createShipmentFromOrder(){if(!savedOrder?.uuid){setShipmentMessage('The saved order identifier is unavailable. Refresh and try again.');return}setShipmentSaving(true);setShipmentMessage('');try{const result=await apiRequest('/api/shipments',{method:'POST',body:{orderId:savedOrder.uuid,courier:savedOrder.courier||'Not booked',origin:'Lahore',destination:[savedOrder.address,savedOrder.city,savedOrder.state].filter(Boolean).join(', '),destinationPostalCode:savedOrder.pincode||''}});setShipment(result.data||null);setShipmentMessage('Internal shipment record created. No courier was booked.')}catch(error){setShipmentMessage(error.message||'Could not create shipment record.');try{const payload=await apiRequest('/api/shipments?limit=100&search='+encodeURIComponent(orderId));setShipment((payload.data||[]).find(row=>row.order_number===orderId)||null)}catch{}}finally{setShipmentSaving(false)}}
  const order=savedOrder||mockOrders.find(item=>item.id===orderId)
  if(!order)return <div className="orders-not-found panel"><Package size={28}/><h2>{detailLoading?'Loading order…':'Order not found'}</h2><p>{detailLoading?'Looking up the saved order in your workspace.':'That order could not be found in saved records or the demo dataset.'}</p><button className="primary-button" onClick={()=>navigate('/app/orders')}>Back to orders</button></div>
  return <div className="page-stack orders-detail-page"><div className="page-heading"><div><button className="orders-back-link" onClick={()=>navigate('/app/orders')}><ArrowLeft size={15}/> Back to orders</button><div className="orders-detail-title"><h1>{order.id}</h1><StatusPill status={order.status}/></div><p>Placed on {fmtDateTime(order.date)} · Channel: {order.channel}</p></div><div className="heading-actions"><button className="secondary-button" onClick={()=>{window.print()}}><Printer size={15}/> Print details</button><button className="primary-button" onClick={()=>navigate('/app/orders/new')}><Plus size={16}/> Create similar order</button></div></div>
    <div className="orders-detail-layout"><div className="orders-detail-main"><section className="panel orders-detail-card"><div className="orders-detail-card-head"><div><span className="panel-eyebrow">ORDER ACTIVITY</span><h2>Order timeline</h2></div><span className="orders-timeline-count">{order.timeline.filter(item=>item.complete).length} events</span></div><div className="orders-timeline">{order.timeline.map((event,index)=><div className={'orders-timeline-event '+(event.complete?'complete':'pending')} key={event.title}><span className="orders-timeline-marker">{event.complete?<Check size={13}/>:<Clock3 size={13}/>}</span><div><b>{event.title}</b><p>{event.detail}</p><small>{fmtDateTime(event.date)}</small></div>{index===0&&<span className="orders-timeline-first">START</span>}</div>)}</div></section>
      <section className="panel orders-detail-card"><div className="orders-detail-card-head"><div><span className="panel-eyebrow">ITEMS</span><h2>Products ordered</h2></div><span className="orders-timeline-count">{order.quantity} item(s)</span></div><div className="orders-detail-product"><span className="orders-detail-product-icon"><Package size={21}/></span><div><b>{order.product}</b><small>SKU: {order.sku} · Quantity: {order.quantity}</small></div><span>{fmtMoney(order.unitPrice)}<small>per unit</small></span><b>{fmtMoney(order.amount)}</b></div><div className="orders-detail-total"><span>Order total</span><b>{fmtMoney(order.amount)}</b></div></section></div>
      <aside className="orders-detail-aside"><section className="panel orders-detail-card"><div className="orders-detail-card-head"><div><span className="panel-eyebrow">RECIPIENT</span><h2>Customer information</h2></div><UserRound size={18}/></div><div className="orders-detail-customer"><span>{order.customer.split(' ').map(part=>part[0]).join('').slice(0,2)}</span><div><b>{order.customer}</b><small>{order.phone}</small><small>{order.email}</small></div></div><div className="orders-detail-info-row"><span>Delivery address</span><b>{order.address}, {order.city}</b></div><div className="orders-detail-info-row"><span>State / region</span><b>{order.state}</b></div><div className="orders-detail-info-row"><span>Pincode</span><b>{order.pincode}</b></div><div className="orders-detail-info-row"><span>Payment mode</span><b><span className={'payment-chip '+(order.paymentMode==='COD'?'cod':'prepaid')}>{order.paymentMode}</span></b></div></section>
      <section className="panel orders-detail-card"><div className="orders-detail-card-head"><div><span className="panel-eyebrow">DELIVERY</span><h2>Shipment information</h2></div><Truck size={18}/></div>{shipmentLoading?<p className="billing-muted">Checking saved shipment records…</p>:shipment?<><div className="orders-detail-info-row"><span>Shipment reference</span><b>{shipment.shipment_number}</b></div><div className="orders-detail-info-row"><span>Shipment status</span><b>{shipment.status}</b></div><div className="orders-detail-info-row"><span>Courier partner</span><b>{shipment.courier||'Not booked'}</b></div><div className="orders-detail-info-row"><span>Tracking ID</span><b>{shipment.tracking_number||'Not assigned'}</b></div><Link className="outline-button orders-track-button" to={'/app/shipments/'+(shipment.tracking_number||shipment.shipment_number)}>Open shipment details <ArrowRight size={14}/></Link></>:<><div className="orders-detail-info-row"><span>Courier preference</span><b>{order.courier||'Not booked'}</b></div><div className="orders-detail-info-row"><span>Tracking ID</span><b>{order.trackingId||'Not assigned'}</b></div><div className="orders-detail-info-row"><span>Package weight</span><b>{order.weight.toFixed(2)} kg</b></div><div className="orders-detail-info-row"><span>COD / order value</span><b>{fmtMoney(order.amount)}</b></div><button className="primary-button orders-track-button" disabled={shipmentSaving||!savedOrder?.uuid} onClick={createShipmentFromOrder}><Package size={14}/>{shipmentSaving?'Creating…':'Create shipment record'}</button></>}{shipmentMessage&&<p className="orders-form-error">{shipmentMessage}</p>}<p className="billing-muted">Internal record only. Courier booking and live tracking require a connected courier integration.</p></section></aside></div>
  </div>
}
export default function OrdersModule(){return <Routes><Route index element={<OrdersList/>}/><Route path="new" element={<CreateOrder/>}/><Route path=":orderId" element={<OrderDetail/>}/><Route path="*" element={<Navigate to="/app/orders" replace/>}/></Routes>}

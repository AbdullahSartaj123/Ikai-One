export const companies = [
  { id:'ikai', name:'IKAI One Commerce', initials:'IK', plan:'Growth plan' },
  { id:'northstar', name:'Northstar Store', initials:'NS', plan:'Starter plan' },
  { id:'urban', name:'Urban Cart', initials:'UC', plan:'Growth plan' }
]
export const overview = [
  { label:'Total orders', value:'2,846', change:'+12.8%', trend:'up', note:'vs. previous 7 days' },
  { label:'Shipments created', value:'2,417', change:'+8.2%', trend:'up', note:'vs. previous 7 days' },
  { label:'Delivered', value:'2,106', change:'+5.4%', trend:'up', note:'82.1% delivery rate' },
  { label:'COD to reconcile', value:'Rs 284,650', change:'18 pending', trend:'neutral', note:'Across all partners' }
]
export const shipmentTrend = [
  {day:'Mon',orders:230,delivered:184},{day:'Tue',orders:310,delivered:248},
  {day:'Wed',orders:275,delivered:220},{day:'Thu',orders:380,delivered:314},
  {day:'Fri',orders:340,delivered:280},{day:'Sat',orders:420,delivered:355},
  {day:'Sun',orders:295,delivered:246}
]
export const orderMix = [
  {name:'Delivered',value:68,color:'#4c5df4'},
  {name:'In transit',value:17,color:'#8e9afc'},
  {name:'Pending',value:9,color:'#d5f56f'},
  {name:'Returned',value:6,color:'#ff9a7d'}
]
export const recentShipments = [
 {id:'IK-248601',customer:'Ayesha Khan',city:'Lahore',courier:'PostEx',date:'13 Oct, 10:42 AM',amount:'Rs 2,450',status:'Out for delivery'},
 {id:'IK-248602',customer:'Hamza Raza',city:'Islamabad',courier:'TCS',date:'13 Oct, 09:18 AM',amount:'Rs 4,200',status:'In transit'},
 {id:'IK-248603',customer:'Sara Malik',city:'Karachi',courier:'Leopards',date:'13 Oct, 08:05 AM',amount:'Rs 1,850',status:'Delivered'},
 {id:'IK-248604',customer:'Usman Ali',city:'Faisalabad',courier:'M&P',date:'13 Oct, 07:44 AM',amount:'Rs 3,100',status:'Pending pickup'},
 {id:'IK-248605',customer:'Maham Noor',city:'Multan',courier:'PostEx',date:'12 Oct, 06:21 PM',amount:'Rs 2,780',status:'NDR raised'}
]
export const navGroups = [
 {title:'WORKSPACE',items:[
  {label:'Dashboard',to:'/app/dashboard',icon:'LayoutDashboard'},
  {label:'Orders',to:'/app/orders',icon:'ShoppingCart',count:'24'},
  {label:'Shipments',to:'/app/shipments',icon:'Package'},
  {label:'Returns',to:'/app/returns',icon:'PackageMinus'},
  {label:'NDR Management',to:'/app/ndr',icon:'AlertTriangle',count:'8'}
 ]},
 {title:'DELIVERY NETWORK',items:[
  {label:'Courier Partners',to:'/app/couriers',icon:'Truck'},
  {label:'Pickup Addresses',to:'/app/pickup-addresses',icon:'MapPin'},
  {label:'Shipping Rules',to:'/app/shipping-rules',icon:'Route'}
 ]},
 {title:'FINANCE & INSIGHTS',items:[
  {label:'Billing & Wallet',to:'/app/billing',icon:'Wallet'},
  {label:'Reports & Analytics',to:'/app/reports',icon:'ChartNoAxesCombined'}
 ]},
 {title:'CONFIGURATION',items:[
  {label:'Channels / Integrations',to:'/app/integrations',icon:'Plug'},
  {label:'Support',to:'/app/support',icon:'LifeBuoy'},
  {label:'Settings',to:'/app/settings',icon:'Settings'}
 ]}
]
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
  {label:'Orders',to:'/app/orders',icon:'ShoppingCart',count:'24',children:[
   {label:'Import Orders',to:'/app/order-import',icon:'FileUp'},
   {label:'Order Tags & Notes',to:'/app/order-tags',icon:'Tags'},
   {label:'Fraud Review',to:'/app/fraud-review',icon:'ShieldAlert'}
  ]},
  {label:'Shipments',to:'/app/shipments',icon:'Package',children:[
   {label:'Shipment Tracking',to:'/app/shipment-tracking',icon:'LocateFixed'},
   {label:'Labels & Documents',to:'/app/labels-documents',icon:'FileText'},
   {label:'Delivery SLA Monitor',to:'/app/delivery-sla',icon:'Timer'}
  ]},
  {label:'Manifests & Pickups',to:'/app/manifests',icon:'FileText',children:[
   {label:'Pickup Requests',to:'/app/pickup-requests',icon:'CalendarCheck'},
   {label:'Manifest History',to:'/app/manifest-history',icon:'History'}
  ]},
  {label:'Returns',to:'/app/returns',icon:'PackageMinus',children:[
   {label:'Reverse Pickups',to:'/app/reverse-pickup',icon:'PackageOpen'},
   {label:'Return Rules',to:'/app/return-rules',icon:'ListChecks'}
  ]},
  {label:'NDR Management',to:'/app/ndr',icon:'AlertTriangle',count:'8',children:[
   {label:'NDR Rules',to:'/app/ndr-rules',icon:'Workflow'},
   {label:'Customer Follow-ups',to:'/app/ndr-followups',icon:'MessageCircle'}
  ]},
  {label:'Pickup Performance',to:'/app/pickup-performance',icon:'Activity'}
 ]},
 {title:'DELIVERY NETWORK',items:[
  {label:'Courier Partners',to:'/app/couriers',icon:'Truck',children:[
   {label:'Courier Serviceability',to:'/app/courier-serviceability',icon:'MapPinned'},
   {label:'Courier Performance',to:'/app/courier-performance',icon:'Gauge'},
   {label:'Courier Claims',to:'/app/courier-claims',icon:'FileWarning'}
  ]},
  {label:'Courier Priority',to:'/app/courier-priority',icon:'ShieldCheck'},
  {label:'Rate Calculator',to:'/app/rate-calculator',icon:'Calculator',children:[
   {label:'Zone Rate Cards',to:'/app/zone-rate-cards',icon:'Map'},
   {label:'Surcharges & Fees',to:'/app/surcharges',icon:'BadgeIndianRupee'}
  ]},
  {label:'Pickup Addresses',to:'/app/pickup-addresses',icon:'MapPin'},
  {label:'Shipping Rules',to:'/app/shipping-rules',icon:'Route'},
  {label:'Pincode & Zone Mapping',to:'/app/pincode-zones',icon:'Map'},
  {label:'International Shipping',to:'/app/international',icon:'Globe'}
 ]},
 {title:'PRODUCTS & CHANNELS',items:[
  {label:'Channels / Integrations',to:'/app/integrations',icon:'Plug',children:[
   {label:'Channel Settings',to:'/app/channel-settings',icon:'SlidersHorizontal'},
   {label:'Sync History',to:'/app/channel-sync',icon:'RefreshCw'}
  ]},
  {label:'Products',to:'/app/products',icon:'ShoppingBag',children:[
   {label:'Product Categories',to:'/app/product-categories',icon:'FolderTree'},
   {label:'Package Profiles',to:'/app/package-profiles',icon:'Package'}
  ]},
  {label:'Channel Products',to:'/app/channel-products',icon:'Boxes'},
  {label:'Inventory Management',to:'/app/inventory',icon:'Layers',children:[
   {label:'Stock Adjustments',to:'/app/stock-adjustments',icon:'ClipboardList'}
  ]},
  {label:'Manage Catalog',to:'/app/catalog',icon:'BookOpen'},
  {label:'Warehouse & Fulfilment',to:'/app/warehouse',icon:'Warehouse',children:[
   {label:'Warehouse Locations',to:'/app/warehouse-locations',icon:'MapPin'},
   {label:'Fulfilment Orders',to:'/app/fulfilment-orders',icon:'PackageCheck'}
  ]}
 ]},
 {title:'FINANCE & INSIGHTS',items:[
  {label:'Billing & Wallet',to:'/app/billing',icon:'Wallet',children:[
   {label:'Transactions',to:'/app/billing/transactions',icon:'ArrowLeftRight'},
   {label:'Invoices',to:'/app/billing/invoices',icon:'FileText'},
   {label:'COD Remittance',to:'/app/billing/cod-remittance',icon:'Banknote'},
   {label:'Weight Disputes',to:'/app/billing/weight-disputes',icon:'Scale'},
   {label:'Rate Card',to:'/app/billing/rate-card',icon:'Receipt'}
  ]},
  {label:'Reports & Analytics',to:'/app/reports',icon:'ChartNoAxesCombined',children:[
   {label:'Revenue Reports',to:'/app/revenue-reports',icon:'ChartNoAxesCombined'},
   {label:'Courier Reports',to:'/app/courier-reports',icon:'Truck'},
   {label:'Returns Reports',to:'/app/returns-reports',icon:'PackageMinus'}
  ]},
  {label:'Scheduled Reports',to:'/app/scheduled-reports',icon:'CalendarClock'},
  {label:'Tax Classes',to:'/app/tax-classes',icon:'FileText'}
 ]},
 {title:'TOOLS & CUSTOMER EXPERIENCE',items:[
  {label:'Bulk Actions',to:'/app/bulk-actions',icon:'Zap',children:[
   {label:'Import Jobs',to:'/app/import-jobs',icon:'FileUp'},
   {label:'Export Jobs',to:'/app/export-jobs',icon:'Download'}
  ]},
  {label:'Branded Tracking Page',to:'/app/tracking-page',icon:'Globe',children:[
   {label:'Tracking Events',to:'/app/tracking-events',icon:'Route'},
   {label:'Notification Templates',to:'/app/notification-templates',icon:'MessageSquareText'}
  ]},
  {label:'Post-Ship Experience',to:'/app/post-ship',icon:'Sparkles'},
  {label:'Activity Logs',to:'/app/activity',icon:'Clock',children:[
   {label:'Team Activity',to:'/app/team-activity',icon:'Users'}
  ]}
 ]},
 {title:'DEVELOPER & CONFIGURATION',items:[
  {label:'API & Developer Tools',to:'/app/api',icon:'Code',children:[
   {label:'API Request Logs',to:'/app/api-logs',icon:'ScrollText'},
   {label:'Webhook Delivery Logs',to:'/app/webhook-logs',icon:'Webhook'}
  ]},
  {label:'Courier Settings',to:'/app/courier-settings',icon:'Settings2'},
  {label:'Support',to:'/app/support',icon:'LifeBuoy'},
  {label:'Settings',to:'/app/settings',icon:'Settings',children:[
   {label:'Team & Roles',to:'/app/team-roles',icon:'Users'},
   {label:'Security Settings',to:'/app/security-settings',icon:'ShieldCheck'},
   {label:'Notification Preferences',to:'/app/notification-settings',icon:'BellRing'}
  ]}
 ]}
]

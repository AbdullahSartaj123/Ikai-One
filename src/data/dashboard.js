export const dashboardKpis = [
  { key: 'orders', label: 'Total Orders', value: 2846, format: 'number', change: 12.8, direction: 'up', note: 'vs. previous period', icon: 'ShoppingCart', tone: 'blue' },
  { key: 'shipped', label: 'Shipped', value: 2417, format: 'number', change: 8.2, direction: 'up', note: 'vs. previous period', icon: 'PackageCheck', tone: 'orange' },
  { key: 'delivered', label: 'Delivered', value: 2106, format: 'number', change: 5.4, direction: 'up', note: 'vs. previous period', icon: 'CheckCircle2', tone: 'green' },
  { key: 'transit', label: 'In Transit', value: 412, format: 'number', change: 3.1, direction: 'down', note: 'vs. previous period', icon: 'Truck', tone: 'violet' },
  { key: 'rto', label: 'RTO', value: 137, format: 'number', change: 2.6, direction: 'down', note: 'vs. previous period', icon: 'PackageMinus', tone: 'rose' },
  { key: 'ndr', label: 'NDR Pending', value: 28, format: 'number', change: 14.2, direction: 'up', note: 'vs. previous period', icon: 'AlertTriangle', tone: 'amber' },
  { key: 'cod', label: 'COD Amount to Remit', value: 284650, format: 'currency', change: 6.7, direction: 'up', note: 'awaiting courier remittance', icon: 'Wallet', tone: 'teal' },
  { key: 'wallet', label: 'Wallet Balance', value: 84250, format: 'currency', change: 9.4, direction: 'down', note: 'vs. previous period', icon: 'WalletCards', tone: 'blue' }
]
export const ordersTrend = {
  Today: [
    { label: '9 AM', orders: 48 }, { label: '10 AM', orders: 72 }, { label: '11 AM', orders: 61 }, { label: '12 PM', orders: 95 },
    { label: '1 PM', orders: 83 }, { label: '2 PM', orders: 117 }, { label: '3 PM', orders: 104 }, { label: '4 PM', orders: 138 }
  ],
  '7 days': [
    { label: 'Mon', orders: 310 }, { label: 'Tue', orders: 368 }, { label: 'Wed', orders: 342 }, { label: 'Thu', orders: 425 },
    { label: 'Fri', orders: 398 }, { label: 'Sat', orders: 486 }, { label: 'Sun', orders: 517 }
  ],
  '30 days': [
    { label: 'Sep 14', orders: 254 }, { label: 'Sep 18', orders: 292 }, { label: 'Sep 22', orders: 341 }, { label: 'Sep 26', orders: 318 },
    { label: 'Sep 30', orders: 386 }, { label: 'Oct 4', orders: 423 }, { label: 'Oct 8', orders: 467 }, { label: 'Oct 13', orders: 517 }
  ]
}
export const shipmentStatusBreakdown = [
  { name: 'Delivered', value: 2106, color: '#4c5df4' },
  { name: 'In Transit', value: 412, color: '#a8d84f' },
  { name: 'Pending Pickup', value: 163, color: '#ff9a7d' },
  { name: 'NDR Pending', value: 28, color: '#9b7bd8' },
  { name: 'RTO', value: 137, color: '#dce3dc' }
]
export const topCourierPartners = [
  { name: 'PostEx', shipments: 846 },
  { name: 'TCS', shipments: 625 },
  { name: 'Leopards', shipments: 482 },
  { name: 'M&P', shipments: 291 },
  { name: 'Trax', shipments: 173 }
]
export const recentOrders = [
  { id: 'IK-248617', customer: 'Ayesha Khan', city: 'Lahore', courier: 'PostEx', date: '13 Oct, 02:14 PM', amount: 2450, status: 'In transit' },
  { id: 'IK-248616', customer: 'Hamza Raza', city: 'Islamabad', courier: 'TCS', date: '13 Oct, 01:58 PM', amount: 4200, status: 'Delivered' },
  { id: 'IK-248615', customer: 'Sara Malik', city: 'Karachi', courier: 'Leopards', date: '13 Oct, 01:41 PM', amount: 1850, status: 'NDR raised' },
  { id: 'IK-248614', customer: 'Usman Ali', city: 'Faisalabad', courier: 'M&P', date: '13 Oct, 01:22 PM', amount: 3100, status: 'Pending pickup' },
  { id: 'IK-248613', customer: 'Maham Noor', city: 'Multan', courier: 'PostEx', date: '13 Oct, 12:56 PM', amount: 2780, status: 'Delivered' },
  { id: 'IK-248612', customer: 'Bilal Ahmed', city: 'Rawalpindi', courier: 'Trax', date: '13 Oct, 12:33 PM', amount: 1650, status: 'In transit' },
  { id: 'IK-248611', customer: 'Hira Shah', city: 'Gujranwala', courier: 'Leopards', date: '13 Oct, 12:09 PM', amount: 5250, status: 'RTO' },
  { id: 'IK-248610', customer: 'Daniyal Khan', city: 'Sialkot', courier: 'TCS', date: '13 Oct, 11:47 AM', amount: 2250, status: 'Delivered' },
  { id: 'IK-248609', customer: 'Noor Fatima', city: 'Peshawar', courier: 'PostEx', date: '13 Oct, 11:15 AM', amount: 3850, status: 'NDR raised' },
  { id: 'IK-248608', customer: 'Zain Malik', city: 'Bahawalpur', courier: 'M&P', date: '13 Oct, 10:52 AM', amount: 1950, status: 'Pending pickup' }
]
export const dashboardAlerts = [
  { id: 'wallet-low', title: 'Low wallet balance', description: 'Your balance is Rs 84,250. Top up soon to avoid shipment booking interruptions.', severity: 'warning', action: 'Top up wallet', href: '/app/billing', icon: 'Wallet' },
  { id: 'kyc-pending', title: 'KYC verification pending', description: 'Submit company verification documents to unlock full account limits.', severity: 'info', action: 'Complete KYC', href: '/onboarding', icon: 'ShieldCheck' },
  { id: 'ndr-actions', title: 'NDR actions needed', description: '28 non-delivery reports need customer confirmation or a reattempt decision.', severity: 'danger', action: 'Review NDRs', href: '/app/ndr', icon: 'AlertTriangle' }
]

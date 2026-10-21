const DAY_MS = 24 * 60 * 60 * 1000

function validDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dayLabel(date) {
  return new Intl.DateTimeFormat('en-PK', { day: '2-digit', month: 'short' }).format(date)
}

export function buildOrderTrend(orders, period, customStart, customEnd, now = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let start
  let end = new Date(startOfToday.getTime() + DAY_MS)

  if (period === 'Today') {
    start = startOfToday
  } else if (period === 'Custom') {
    if (!customStart || !customEnd) return []
    start = new Date(`${customStart}T00:00:00`)
    end = new Date(new Date(`${customEnd}T00:00:00`).getTime() + DAY_MS)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return []
  } else {
    const days = period === '30 days' ? 30 : 7
    start = new Date(startOfToday.getTime() - (days - 1) * DAY_MS)
  }

  const buckets = new Map()
  if (period === 'Today') {
    for (let hour = 0; hour < 24; hour++) buckets.set(hour, { label: new Intl.DateTimeFormat('en-PK', { hour: 'numeric' }).format(new Date(start.getTime() + hour * 60 * 60 * 1000)), orders: 0 })
  } else {
    for (let time = start.getTime(); time < end.getTime(); time += DAY_MS) {
      const date = new Date(time)
      buckets.set(dateKey(date), { label: dayLabel(date), orders: 0 })
    }
  }

  for (const order of Array.isArray(orders) ? orders : []) {
    const date = validDate(order?.created_at)
    if (!date || date < start || date >= end) continue
    const key = period === 'Today' ? date.getHours() : dateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate()))
    if (buckets.has(key)) buckets.get(key).orders += 1
  }
  return [...buckets.values()]
}

export function buildTopCourierPartners(shipments) {
  const counts = new Map()
  for (const shipment of Array.isArray(shipments) ? shipments : []) {
    const name = String(shipment?.courier || '').trim()
    if (!name || /^not assigned$/i.test(name)) continue
    counts.set(name, (counts.get(name) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, shipments]) => ({ name, shipments }))
    .sort((a, b) => b.shipments - a.shipments || a.name.localeCompare(b.name))
    .slice(0, 5)
}

export function buildDashboardAlerts(shipments, codRecords) {
  const shipmentRows = Array.isArray(shipments) ? shipments : []
  const codRows = Array.isArray(codRecords) ? codRecords : []
  const exceptionCount = shipmentRows.filter(row => ['ndr raised', 'ndr pending', 'exception'].includes(String(row?.status || '').toLowerCase())).length
  const codPending = codRows.filter(row => !['matched', 'resolved'].includes(String(row?.status || '').toLowerCase()))
  const codOutstanding = codPending.reduce((sum, row) => sum + Math.max(0, Number(row?.cod_expected || 0) - Number(row?.amount_remitted || 0)), 0)
  const alerts = []
  if (exceptionCount) alerts.push({ id: 'shipment-exceptions', title: 'Shipment exceptions need attention', description: `${exceptionCount} loaded shipment record(s) have an NDR or exception status.`, severity: 'danger', action: 'Review shipments', href: '/app/shipments', icon: 'AlertTriangle' })
  if (codPending.length) alerts.push({ id: 'cod-pending', title: 'COD reconciliation needs review', description: `${codPending.length} loaded COD record(s) are not marked matched or resolved; outstanding difference is Rs ${codOutstanding.toLocaleString('en-PK')}.`, severity: 'warning', action: 'Review COD', href: '/app/billing', icon: 'Wallet' })
  return alerts
}

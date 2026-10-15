const tones = {
  delivered: 'success', 'rto delivered': 'danger', 'in transit': 'info', 'out for delivery': 'info',
  'pickup scheduled': 'info', 'pickup pending': 'warning', 'ready to ship': 'warning', new: 'neutral',
  undelivered: 'danger', 'ndr raised': 'danger', 'ndr pending': 'danger', rto: 'danger',
  'rto in transit': 'danger', cancelled: 'neutral', 'lost/damaged': 'danger', lost: 'danger', damaged: 'danger',
  'shipment created': 'neutral', 'picked up': 'info', 'arrived at origin facility': 'info',
  'in transit to destination': 'info', 'arrived at destination facility': 'info', 'delivery attempted': 'warning',
  'return to origin initiated': 'danger', 'return in transit': 'danger', 'returned to shipper': 'danger',
  'damage reported': 'danger', 'shipment delayed': 'warning'
}
export function statusTone(status) { return tones[String(status || '').trim().toLowerCase()] || 'neutral' }
export default function StatusBadge({ status, className = '' }) {
  return <span role="status" className={`status-badge status-${statusTone(status)} ${className}`.trim()}><i aria-hidden="true"/>{status}</span>
}

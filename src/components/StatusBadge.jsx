import { Badge, statusTone } from './UI.jsx'

export { statusTone }

export default function StatusBadge({ status, className = '' }) {
  return <Badge tone={statusTone(status)} dot className={className}>{status}</Badge>
}

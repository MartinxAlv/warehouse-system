const COLORS = {
  OK: 'green', RECEIVED: 'green', FULFILLED: 'green', CONFIRMED: 'green',
  LOW: 'amber', PENDING: 'amber', SUBMITTED: 'amber', DRAFT: 'amber', PARTIALLY_RECEIVED: 'amber',
  OUT: 'red', CANCELLED: 'red',
}

export default function StatusBadge({ status }) {
  const color = COLORS[status] || 'gray'
  return <span className={`badge badge-${color}`}>{status}</span>
}

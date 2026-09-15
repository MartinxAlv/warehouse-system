import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const TYPE_COLORS = {
  PURCHASE_RECEIPT: 'badge-green',
  SALE:             'badge-blue',
  ADJUSTMENT:       'badge-amber',
  TRANSFER_IN:      'badge-green',
  TRANSFER_OUT:     'badge-amber',
  RETURN:           'badge-purple',
}

const TYPE_LABELS = {
  PURCHASE_RECEIPT: 'Purchase Receipt',
  SALE:             'Sale',
  ADJUSTMENT:       'Adjustment',
  TRANSFER_IN:      'Transfer In',
  TRANSFER_OUT:     'Transfer Out',
  RETURN:           'Return',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function StockMovements() {
  const [movements, setMovements] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    api.getMovements()
      .then(setMovements)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = movements.filter((m) => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      m.product?.name?.toLowerCase().includes(q) ||
      m.warehouse?.name?.toLowerCase().includes(q) ||
      m.type?.toLowerCase().includes(q) ||
      m.reason?.toLowerCase().includes(q)
    )
  })

  if (loading) return (
    <div className="loading">
      <div className="loading-dots">
        <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock Movement Log</h1>
          <p className="muted small">Full audit trail of every inventory change</p>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="filter-bar">
        <input
          className="filter-search"
          type="search"
          placeholder="Search by product, warehouse, type, or reason…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && <button className="link-btn" onClick={() => setFilter('')}>Clear</button>}
        <span className="muted small" style={{ marginLeft: 'auto' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date &amp; Time</th>
            <th>Product</th>
            <th>Warehouse</th>
            <th>Type</th>
            <th>Change</th>
            <th>Reason</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="empty-state">No movements match your search.</td></tr>
          )}
          {filtered.map((m) => (
            <tr key={m.id}>
              <td className="muted small">{fmtDate(m.timestamp)}</td>
              <td style={{ fontWeight: 500, color: 'var(--text)' }}>{m.product?.name}</td>
              <td className="muted">{m.warehouse?.name}</td>
              <td>
                <span className={`badge ${TYPE_COLORS[m.type] ?? 'badge-gray'}`}>
                  {TYPE_LABELS[m.type] ?? m.type}
                </span>
              </td>
              <td>
                <span className={`chip ${m.quantityChange >= 0 ? 'chip-pos' : 'chip-neg'}`}>
                  {m.quantityChange >= 0 ? '+' : ''}{m.quantityChange}
                </span>
              </td>
              <td className="muted">{m.reason || '—'}</td>
              <td className="muted small">{m.referenceId || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

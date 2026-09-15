import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_LABELS = { ADMIN: 'Admin', WAREHOUSE_STAFF: 'Warehouse Staff', SALES_STAFF: 'Sales Staff' }
const ROLE_COLORS = { ADMIN: 'badge-purple', WAREHOUSE_STAFF: 'badge-blue', SALES_STAFF: 'badge-green' }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function fmtTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function Spinner() {
  return (
    <div className="loading">
      <div className="loading-dots">
        <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
      </div>
      <span>Loading dashboard…</span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [movements, setMovements] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getDashboardSummary(), api.getLowStock(), api.getMovements()])
      .then(([s, ls, mv]) => {
        setSummary(s)
        setLowStock(ls)
        setMovements(mv.slice(0, 8))
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="error-banner">⚠️ {error} — is the backend running on :8080?</div>
  if (!summary) return <Spinner />

  const kpis = [
    { label: 'Total Products',          value: summary.totalProducts,         color: 'blue',   icon: '📦' },
    { label: 'Low Stock Items',          value: summary.lowStockCount,         color: 'amber',  icon: '⚠️' },
    { label: 'Pending Purchase Orders',  value: summary.pendingPurchaseOrders, color: 'purple', icon: '🛒' },
    { label: 'Pending Customer Orders',  value: summary.pendingCustomerOrders, color: 'green',  icon: '📬' },
  ]

  return (
    <div>
      <div className="welcome-banner">
        <div>
          <h1 style={{ margin: 0 }}>{greeting()}, {user?.fullName?.split(' ')[0]}!</h1>
          <p className="muted small" style={{ marginTop: 4 }}>
            Here's what's happening in your warehouse today.
          </p>
        </div>
        <span className={`badge ${ROLE_COLORS[user?.role] ?? 'badge-gray'}`}>
          {ROLE_LABELS[user?.role] ?? user?.role}
        </span>
      </div>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className={`kpi-card kpi-${k.color}`}>
            <div className="kpi-top">
              <div>
                <div className="kpi-value">{k.value}</div>
                <div className="kpi-label">{k.label}</div>
              </div>
              <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>⚠️ Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎉</span>
              All products are well stocked!
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Product</th><th>Warehouse</th><th>On Hand</th><th>Threshold</th></tr>
              </thead>
              <tbody>
                {lowStock.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text)' }}>{i.product.name}</td>
                    <td>{i.warehouse.name}</td>
                    <td>
                      <span className={`badge badge-${i.quantityOnHand === 0 ? 'red' : 'amber'}`}>
                        {i.quantityOnHand}
                      </span>
                    </td>
                    <td>{i.product.reorderThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2>📋 Recent Stock Activity</h2>
          {movements.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              No stock movements yet.
            </div>
          ) : (
            <ul className="activity-list">
              {movements.map((m) => (
                <li key={m.id}>
                  <span className={`chip ${m.quantityChange >= 0 ? 'chip-pos' : 'chip-neg'}`}>
                    {m.quantityChange >= 0 ? '+' : ''}{m.quantityChange}
                  </span>
                  <div className="activity-detail">
                    <span>
                      <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{m.product.name}</strong>
                      {' — '}{m.type.replaceAll('_', ' ').toLowerCase()}
                    </span>
                    <span className="muted small">{fmtTime(m.timestamp)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

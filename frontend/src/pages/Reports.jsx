import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const STATUS_COLORS = {
  PENDING: '#f59e0b', CONFIRMED: '#6366f1', FULFILLED: '#059669', CANCELLED: '#dc2626',
  DRAFT: '#94a3b8', SUBMITTED: '#6366f1', PARTIALLY_RECEIVED: '#f59e0b', RECEIVED: '#059669',
}

const STATUS_LABELS = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', FULFILLED: 'Fulfilled', CANCELLED: 'Cancelled',
  DRAFT: 'Draft', SUBMITTED: 'Submitted', PARTIALLY_RECEIVED: 'Partial', RECEIVED: 'Received',
}

function BarChart({ data, colorKey, height = 200 }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="bar-col">
          <div className="bar-value">{d.value}</div>
          <div
            className="bar"
            style={{
              height: `${(d.value / max) * 100}%`,
              background: d.color ?? colorKey ?? '#6366f1',
            }}
          />
          <div className="bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  )
}

function HorizontalBar({ label, value, max, color }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="hbar-row">
      <div className="hbar-label">{label}</div>
      <div className="hbar-track">
        <div className="hbar-fill" style={{ width: `${pct}%`, background: color ?? '#6366f1' }} />
      </div>
      <div className="hbar-value">{value}</div>
    </div>
  )
}

function countByStatus(items) {
  const map = {}
  items.forEach((i) => { map[i.status] = (map[i.status] ?? 0) + 1 })
  return Object.entries(map).map(([label, value]) => ({
    label: STATUS_LABELS[label] ?? label,
    value,
    color: STATUS_COLORS[label] ?? '#94a3b8',
  }))
}

export default function Reports() {
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getInventory(), api.getOrders(), api.getPurchaseOrders()])
      .then(([inv, ord, po]) => {
        setInventory(inv)
        setOrders(ord)
        setPurchaseOrders(po)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="loading">
      <div className="loading-dots">
        <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
      </div>
    </div>
  )

  const productStock = Object.values(
    inventory.reduce((acc, item) => {
      const name = item.product?.name ?? `Product #${item.productId}`
      acc[name] = { label: name.length > 16 ? name.slice(0, 14) + '…' : name, value: (acc[name]?.value ?? 0) + item.quantityOnHand }
      return acc
    }, {})
  ).sort((a, b) => b.value - a.value).slice(0, 8)

  const maxStock = Math.max(...productStock.map((d) => d.value), 1)
  const orderStatusData = countByStatus(orders)
  const poStatusData = countByStatus(purchaseOrders)

  const totalStock = inventory.reduce((s, i) => s + i.quantityOnHand, 0)
  const lowStockCount = inventory.filter((i) => i.quantityOnHand <= (i.product?.reorderThreshold ?? 0)).length

  return (
    <div>
      <div className="page-header">
        <h1>Reports & Analytics</h1>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 28 }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-top">
            <div><div className="kpi-value">{inventory.length}</div><div className="kpi-label">Inventory Lines</div></div>
            <div className="kpi-icon blue">🗂️</div>
          </div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-top">
            <div><div className="kpi-value">{totalStock.toLocaleString()}</div><div className="kpi-label">Total Units</div></div>
            <div className="kpi-icon green">📦</div>
          </div>
        </div>
        <div className={`kpi-card ${lowStockCount > 0 ? 'kpi-red' : 'kpi-green'}`}>
          <div className="kpi-top">
            <div><div className="kpi-value">{lowStockCount}</div><div className="kpi-label">Low Stock Items</div></div>
            <div className="kpi-icon red">⚠️</div>
          </div>
        </div>
        <div className="kpi-card kpi-purple">
          <div className="kpi-top">
            <div><div className="kpi-value">{orders.length}</div><div className="kpi-label">Total Orders</div></div>
            <div className="kpi-icon purple">📬</div>
          </div>
        </div>
      </div>

      <div className="reports-grid">
        <div className="panel">
          <h2>Stock Levels by Product</h2>
          {productStock.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">📦</span>No inventory data</div>
          ) : (
            <div className="hbar-chart">
              {productStock.map((d) => (
                <HorizontalBar key={d.label} label={d.label} value={d.value} max={maxStock}
                  color={d.value <= 10 ? '#dc2626' : d.value <= 50 ? '#f59e0b' : '#059669'} />
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Customer Order Status</h2>
          {orderStatusData.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">📬</span>No orders yet</div>
          ) : (
            <>
              <BarChart data={orderStatusData} height={180} />
              <div className="chart-legend">
                {orderStatusData.map((d) => (
                  <div key={d.label} className="legend-item">
                    <div className="legend-dot" style={{ background: d.color }} />
                    <span>{d.label}</span>
                    <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="panel">
          <h2>Purchase Order Status</h2>
          {poStatusData.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">🛒</span>No purchase orders yet</div>
          ) : (
            <>
              <BarChart data={poStatusData} height={180} />
              <div className="chart-legend">
                {poStatusData.map((d) => (
                  <div key={d.label} className="legend-item">
                    <div className="legend-dot" style={{ background: d.color }} />
                    <span>{d.label}</span>
                    <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="panel">
          <h2>Order Value Summary</h2>
          <div className="summary-list">
            <div className="summary-row">
              <span>Customer orders total</span>
              <strong>${orders.reduce((s, o) => s + Number(o.totalAmount ?? 0), 0).toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Purchase orders total</span>
              <strong>${purchaseOrders.reduce((s, o) => s + Number(o.totalCost ?? 0), 0).toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Fulfilled orders</span>
              <strong>{orders.filter((o) => o.status === 'FULFILLED').length}</strong>
            </div>
            <div className="summary-row">
              <span>Pending orders</span>
              <strong>{orders.filter((o) => o.status === 'PENDING').length}</strong>
            </div>
            <div className="summary-row">
              <span>Cancelled orders</span>
              <strong>{orders.filter((o) => o.status === 'CANCELLED').length}</strong>
            </div>
            <div className="summary-row">
              <span>Received POs</span>
              <strong>{purchaseOrders.filter((o) => o.status === 'RECEIVED').length}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Modal from '../components/Modal.jsx'
import { useToast } from '../context/ToastContext.jsx'

export default function Warehouses() {
  const { toast } = useToast()
  const [warehouses, setWarehouses] = useState([])
  const [inventory, setInventory] = useState([])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({ name: '', location: '' })

  function load() {
    Promise.all([api.getWarehouses(), api.getInventory()])
      .then(([w, i]) => { setWarehouses(w); setInventory(i) })
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  async function submit(e) {
    e.preventDefault()
    try {
      await api.createWarehouse(form)
      toast('Warehouse added')
      setShowForm(false)
      setForm({ name: '', location: '' })
      load()
    } catch (err) { setError(err.message) }
  }

  function toggleExpand(id) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  function warehouseItems(warehouseId) {
    return inventory.filter((i) => i.warehouse?.id === warehouseId)
  }

  return (
    <div>
      <div className="page-header">
        <h1>Warehouses</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Warehouse</button>
      </div>
      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="warehouse-list">
        {warehouses.length === 0 && (
          <div className="empty-state panel">
            <span className="empty-icon">🏢</span>
            No warehouses yet. Add one to start tracking inventory.
          </div>
        )}
        {warehouses.map((w) => {
          const items = warehouseItems(w.id)
          const totalUnits = items.reduce((s, i) => s + i.quantityOnHand, 0)
          const isOpen = expanded === w.id
          return (
            <div key={w.id} className="warehouse-card">
              <div className="warehouse-card-header" onClick={() => toggleExpand(w.id)}>
                <div className="warehouse-card-info">
                  <div className="warehouse-icon">🏢</div>
                  <div>
                    <div className="warehouse-name">{w.name}</div>
                    <div className="muted small">{w.location || 'No location set'}</div>
                  </div>
                </div>
                <div className="warehouse-card-stats">
                  <div className="wh-stat">
                    <span className="wh-stat-val">{items.length}</span>
                    <span className="wh-stat-label">Products</span>
                  </div>
                  <div className="wh-stat">
                    <span className="wh-stat-val">{totalUnits.toLocaleString()}</span>
                    <span className="wh-stat-label">Total Units</span>
                  </div>
                  <span className="expand-chevron">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {isOpen && (
                <div className="warehouse-inventory">
                  {items.length === 0 ? (
                    <p className="muted small" style={{ padding: '12px 0' }}>No inventory in this warehouse yet.</p>
                  ) : (
                    <table className="inner-table">
                      <thead>
                        <tr><th>Product</th><th>SKU</th><th>Qty on Hand</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {items.map((i) => {
                          const low = i.quantityOnHand <= (i.product?.reorderThreshold ?? 0)
                          const out = i.quantityOnHand === 0
                          return (
                            <tr key={i.id}>
                              <td>{i.product?.name}</td>
                              <td><code className="sku-code">{i.product?.sku}</code></td>
                              <td style={{ fontWeight: 600 }}>{i.quantityOnHand}</td>
                              <td>
                                <span className={`badge badge-${out ? 'red' : low ? 'amber' : 'green'}`}>
                                  {out ? 'Out of Stock' : low ? 'Low Stock' : 'In Stock'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showForm && (
        <Modal title="Add Warehouse" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="stacked-form">
            <label>Name<input required placeholder="e.g. Main Warehouse" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Location<input placeholder="e.g. 123 Industrial Ave, Chicago IL" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" type="submit">Save Warehouse</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

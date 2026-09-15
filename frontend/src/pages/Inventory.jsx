import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Modal from '../components/Modal.jsx'
import ProductLabel from '../components/ProductLabel.jsx'
import Icon from '../components/Icon.jsx'
import { useToast } from '../context/ToastContext.jsx'

const REASONS = ['Damaged', 'Recount', 'Return', 'Theft', 'Expired', 'Restocked', 'Other']

export default function Inventory() {
  const { toast } = useToast()
  const [items, setItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [error, setError] = useState('')
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [adjustForm, setAdjustForm] = useState({ delta: '', reason: '' })
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferForm, setTransferForm] = useState({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' })
  const [locationTarget, setLocationTarget] = useState(null)
  const [locationValue, setLocationValue] = useState('')
  const [labelTarget, setLabelTarget] = useState(null)

  const products = [...new Map(items.map((i) => [i.product.id, i.product])).values()]

  function load() {
    Promise.all([api.getInventory(), api.getWarehouses()])
      .then(([i, w]) => { setItems(i); setWarehouses(w) })
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  async function submitAdjust(e) {
    e.preventDefault()
    try {
      await api.adjustStock({
        productId: adjustTarget.product.id,
        warehouseId: adjustTarget.warehouse.id,
        delta: Number(adjustForm.delta),
        reason: adjustForm.reason,
      })
      toast('Stock adjusted')
      setAdjustTarget(null)
      setAdjustForm({ delta: '', reason: '' })
      load()
    } catch (err) { setError(err.message) }
  }

  async function submitTransfer(e) {
    e.preventDefault()
    try {
      await api.transferStock({
        productId: Number(transferForm.productId),
        fromWarehouseId: Number(transferForm.fromWarehouseId),
        toWarehouseId: Number(transferForm.toWarehouseId),
        quantity: Number(transferForm.quantity),
      })
      toast('Stock transferred')
      setShowTransfer(false)
      load()
    } catch (err) { setError(err.message) }
  }

  async function submitLocation(e) {
    e.preventDefault()
    try {
      await api.updateBinLocation(locationTarget.id, locationValue.trim())
      toast('Bin location updated')
      setLocationTarget(null)
      load()
    } catch (err) { setError(err.message) }
  }

  function openLocation(item) {
    setLocationTarget(item)
    setLocationValue(item.binLocation || '')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p className="muted small">{items.length} inventory line{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-secondary" onClick={() => setShowTransfer(true)}>Transfer Stock</button>
      </div>
      {error && <div className="error-banner">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Warehouse</th>
            <th>Bin Location</th>
            <th>Qty on Hand</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={6} className="empty-state">No inventory yet. Receive a purchase order to add stock.</td></tr>
          )}
          {items.map((i) => {
            const low = i.quantityOnHand <= (i.product?.reorderThreshold ?? 0)
            const out = i.quantityOnHand === 0
            return (
              <tr key={i.id}>
                <td style={{ fontWeight: 500, color: 'var(--text)' }}>{i.product?.name}</td>
                <td>{i.warehouse?.name}</td>
                <td>
                  <button className="bin-location-cell" onClick={() => openLocation(i)} title="Edit bin location">
                    {i.binLocation
                      ? <><Icon name="mapPin" size={12} /><span>{i.binLocation}</span></>
                      : <span className="bin-unset">Set location</span>
                    }
                    <Icon name="edit" size={11} className="bin-edit-icon" />
                  </button>
                </td>
                <td style={{ fontWeight: 600 }}>{i.quantityOnHand}</td>
                <td>
                  <span className={`badge badge-${out ? 'red' : low ? 'amber' : 'green'}`}>
                    {out ? 'Out of Stock' : low ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="link-btn" onClick={() => setAdjustTarget(i)}>Adjust</button>
                    <button className="link-btn" onClick={() => setLabelTarget(i)} title="Print product label">
                      <Icon name="printer" size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {adjustTarget && (
        <Modal title={`Adjust — ${adjustTarget.product?.name}`} onClose={() => setAdjustTarget(null)}>
          <form onSubmit={submitAdjust} className="stacked-form">
            <div className="adjust-info">
              <span>Current stock:</span>
              <strong>{adjustTarget.quantityOnHand} units</strong>
              <span>in {adjustTarget.warehouse?.name}</span>
            </div>
            <label>
              Quantity Change
              <input
                required
                type="number"
                value={adjustForm.delta}
                placeholder="e.g. −3 to remove, +5 to add"
                onChange={(e) => setAdjustForm({ ...adjustForm, delta: e.target.value })}
              />
              <span className="field-hint">Use a negative number to reduce stock</span>
            </label>
            <label>
              Reason for Adjustment
              <select
                required
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              >
                <option value="">Select a reason…</option>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="field-hint">This will appear in the Stock Movement Log</span>
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setAdjustTarget(null)}>Cancel</button>
              <button className="btn-primary" type="submit">Apply Adjustment</button>
            </div>
          </form>
        </Modal>
      )}

      {locationTarget && (
        <Modal title="Set Bin Location" onClose={() => setLocationTarget(null)}>
          <form onSubmit={submitLocation} className="stacked-form">
            <div className="adjust-info" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <strong style={{ color: 'var(--text)' }}>{locationTarget.product?.name}</strong>
              <span className="muted small">{locationTarget.warehouse?.name}</span>
            </div>
            <label>
              Bin Location
              <input
                autoFocus
                placeholder="e.g. Aisle A · Row 1 · Bin 3"
                value={locationValue}
                onChange={(e) => setLocationValue(e.target.value)}
              />
              <span className="field-hint">Free-form label — use whatever format your warehouse uses</span>
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setLocationTarget(null)}>Cancel</button>
              <button className="btn-primary" type="submit">Save Location</button>
            </div>
          </form>
        </Modal>
      )}

      {showTransfer && (
        <Modal title="Transfer Stock Between Warehouses" onClose={() => setShowTransfer(false)}>
          <form onSubmit={submitTransfer} className="stacked-form">
            <label>Product
              <select required value={transferForm.productId} onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}>
                <option value="">Select product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </label>
            <div className="form-row-2">
              <label>From Warehouse
                <select required value={transferForm.fromWarehouseId} onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}>
                  <option value="">Select…</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </label>
              <label>To Warehouse
                <select required value={transferForm.toWarehouseId} onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}>
                  <option value="">Select…</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </label>
            </div>
            <label>Quantity<input required type="number" min="1" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} /></label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowTransfer(false)}>Cancel</button>
              <button className="btn-primary" type="submit">Transfer Stock</button>
            </div>
          </form>
        </Modal>
      )}

      {labelTarget && (
        <ProductLabel item={labelTarget} onClose={() => setLabelTarget(null)} />
      )}
    </div>
  )
}

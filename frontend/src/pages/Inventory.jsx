import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Modal from '../components/Modal.jsx'
import ProductLabel from '../components/ProductLabel.jsx'
import Icon from '../components/Icon.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const REASONS = ['Damaged', 'Recount', 'Return', 'Theft', 'Expired', 'Restocked', 'Other']

export default function Inventory() {
  const { toast } = useToast()
  const { user } = useAuth()
  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_STAFF'
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
  const [filterWarehouse, setFilterWarehouse] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [sort, setSort] = useState({ col: 'product', dir: 'asc' })

  function toggleSort(col) {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })
  }
  function SortTh({ col, children }) {
    const active = sort.col === col
    return (
      <th onClick={() => toggleSort(col)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
        {children} {active ? (sort.dir === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
      </th>
    )
  }

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

  const filtered = items.filter((i) => {
    const matchW = !filterWarehouse || String(i.warehouse?.id) === filterWarehouse
    const matchP = !filterProduct || String(i.product?.id) === filterProduct
    return matchW && matchP
  }).sort((a, b) => {
    let av, bv
    if (sort.col === 'warehouse') { av = a.warehouse?.name?.toLowerCase(); bv = b.warehouse?.name?.toLowerCase() }
    else if (sort.col === 'qty') { av = a.quantityOnHand; bv = b.quantityOnHand }
    else if (sort.col === 'sku') { av = a.product?.sku?.toLowerCase(); bv = b.product?.sku?.toLowerCase() }
    else { av = a.product?.name?.toLowerCase(); bv = b.product?.name?.toLowerCase() }
    if (av < bv) return sort.dir === 'asc' ? -1 : 1
    if (av > bv) return sort.dir === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Inventory</h1>
            {!canEdit && <span className="badge badge-gray">Read-only</span>}
          </div>
          <p className="muted small" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {filtered.length} of {items.length} inventory line{items.length !== 1 ? 's' : ''}
            {items.filter(i => i.quantityOnHand > 0 && i.quantityOnHand <= (i.product?.reorderThreshold ?? 0)).length > 0 && (
              <span className="badge badge-amber">
                {items.filter(i => i.quantityOnHand > 0 && i.quantityOnHand <= (i.product?.reorderThreshold ?? 0)).length} low stock
              </span>
            )}
            {items.filter(i => i.quantityOnHand === 0).length > 0 && (
              <span className="badge badge-red">
                {items.filter(i => i.quantityOnHand === 0).length} out of stock
              </span>
            )}
          </p>
        </div>
        {canEdit && <button className="btn-secondary" onClick={() => setShowTransfer(true)}>Transfer Stock</button>}
      </div>
      {error && <div className="error-banner">{error}</div>}

      <div className="filter-bar">
        <select className="filter-select" value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)}>
          <option value="">All warehouses</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select className="filter-select" value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
          <option value="">All products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(filterWarehouse || filterProduct) && (
          <button className="link-btn" onClick={() => { setFilterWarehouse(''); setFilterProduct('') }}>Clear</button>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <SortTh col="product">Product</SortTh>
            <SortTh col="sku">SKU</SortTh>
            <SortTh col="warehouse">Warehouse</SortTh>
            <th>Bin Location</th>
            <SortTh col="qty">Qty on Hand</SortTh>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="empty-state">No inventory matches your filters.</td></tr>
          )}
          {filtered.map((i) => {
            const low = i.quantityOnHand <= (i.product?.reorderThreshold ?? 0)
            const out = i.quantityOnHand === 0
            return (
              <tr key={i.id}>
                <td style={{ fontWeight: 500, color: 'var(--text)' }}>{i.product?.name}</td>
                <td><code className="sku-code">{i.product?.sku}</code></td>
                <td>{i.warehouse?.name}</td>
                <td>
                  {canEdit ? (
                    <button className="bin-location-cell" onClick={() => openLocation(i)} title="Edit bin location">
                      {i.binLocation
                        ? <><Icon name="mapPin" size={12} /><span>{i.binLocation}</span></>
                        : <span className="bin-unset">Set location</span>
                      }
                      <Icon name="edit" size={11} className="bin-edit-icon" />
                    </button>
                  ) : (
                    <span className="bin-location-cell bin-location-readonly">
                      {i.binLocation
                        ? <><Icon name="mapPin" size={12} /><span>{i.binLocation}</span></>
                        : <span className="bin-unset">—</span>
                      }
                    </span>
                  )}
                </td>
                <td style={{ fontWeight: 600 }}>{i.quantityOnHand}</td>
                <td>
                  <span className={`badge badge-${out ? 'red' : low ? 'amber' : 'green'}`}>
                    {out ? 'Out of Stock' : low ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    {canEdit && <button className="link-btn" onClick={() => setAdjustTarget(i)}>Adjust</button>}
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
            {transferForm.productId && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-4px' }}>
                {items.filter(i => String(i.product.id) === String(transferForm.productId)).map(i => (
                  <span key={i.id}><strong style={{ color: 'var(--text)' }}>{i.warehouse.name}:</strong> {i.quantityOnHand} units</span>
                ))}
              </div>
            )}
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

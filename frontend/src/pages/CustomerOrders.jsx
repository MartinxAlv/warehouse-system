import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Modal from '../components/Modal.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useToast } from '../context/ToastContext.jsx'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Suggest a split for each line item: fill from the warehouse with the most stock first,
// so the order ships from as few warehouses as possible.
function autoAllocate(order, warehouses, inventory) {
  const plan = {}
  for (const item of order.items ?? []) {
    const pid = item.product.id
    let remaining = item.quantity
    const stock = warehouses
      .map((w) => ({ wid: w.id, onHand: onHandFor(inventory, pid, w.id) }))
      .sort((a, b) => b.onHand - a.onHand)
    plan[pid] = {}
    for (const { wid, onHand } of stock) {
      const take = Math.min(remaining, onHand)
      plan[pid][wid] = take > 0 ? String(take) : ''
      remaining -= Math.max(take, 0)
    }
  }
  return plan
}

function onHandFor(inventory, productId, warehouseId) {
  const row = inventory.find((i) => i.product?.id === productId && i.warehouse?.id === warehouseId)
  return row ? row.quantityOnHand : 0
}

const EMPTY_ITEM = { productId: '', quantity: '' }
const EMPTY_HEADER = { customerName: '', customerEmail: '' }

export default function CustomerOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [fulfillTarget, setFulfillTarget] = useState(null)
  const [inventory, setInventory] = useState([])
  const [plan, setPlan] = useState({})
  const [fulfilling, setFulfilling] = useState(false)
  const [header, setHeader] = useState(EMPTY_HEADER)
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])

  function load() {
    Promise.all([api.getOrders(), api.getProducts(), api.getWarehouses()])
      .then(([o, p, w]) => { setOrders(o); setProducts(p); setWarehouses(w) })
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  function addItem() { setItems([...items, { ...EMPTY_ITEM }]) }
  function removeItem(idx) { setItems(items.filter((_, i) => i !== idx)) }
  function updateItem(idx, field, val) {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  async function submitCreate(e) {
    e.preventDefault()
    const productQuantities = {}
    items.forEach((i) => { if (i.productId) productQuantities[i.productId] = Number(i.quantity) })
    try {
      await api.createOrder({ ...header, productQuantities })
      toast('Order created')
      setShowForm(false)
      setHeader(EMPTY_HEADER)
      setItems([{ ...EMPTY_ITEM }])
      load()
    } catch (err) { setError(err.message) }
  }

  async function confirmOrder(id) {
    try { await api.confirmOrder(id); toast('Order confirmed'); load() }
    catch (err) { setError(err.message) }
  }

  async function openFulfill(order) {
    if (warehouses.length === 0) return setError('Create a warehouse first')
    try {
      const inv = await api.getInventory()
      setInventory(inv)
      setPlan(autoAllocate(order, warehouses, inv))
      setFulfillTarget(order)
    } catch (err) { setError(err.message) }
  }

  function closeFulfill() { setFulfillTarget(null); setPlan({}) }

  function setTake(productId, warehouseId, val) {
    setPlan({ ...plan, [productId]: { ...plan[productId], [warehouseId]: val } })
  }

  function allocatedFor(productId) {
    return Object.values(plan[productId] ?? {}).reduce((sum, v) => sum + (Number(v) || 0), 0)
  }

  const fulfillReady = fulfillTarget && (fulfillTarget.items ?? []).every((item) => {
    const pid = item.product.id
    if (allocatedFor(pid) !== item.quantity) return false
    return warehouses.every((w) => (Number(plan[pid]?.[w.id]) || 0) <= onHandFor(inventory, pid, w.id))
  })

  async function submitFulfill(e) {
    e.preventDefault()
    const allocations = []
    for (const [productId, byWarehouse] of Object.entries(plan)) {
      for (const [warehouseId, qty] of Object.entries(byWarehouse)) {
        if (Number(qty) > 0) allocations.push({ productId: Number(productId), warehouseId: Number(warehouseId), quantity: Number(qty) })
      }
    }
    setFulfilling(true)
    try {
      await api.fulfillOrder(fulfillTarget.id, { allocations })
      const used = new Set(allocations.map((a) => a.warehouseId)).size
      toast(`Order fulfilled from ${used} warehouse${used !== 1 ? 's' : ''}`)
      closeFulfill()
      load()
    } catch (err) { setError(err.message) }
    finally { setFulfilling(false) }
  }

  async function doCancel(id) {
    // Stock from a fulfilled order goes back to the warehouses it was pulled from (handled server-side)
    try { await api.cancelOrder(id); toast('Order cancelled', 'info'); load() }
    catch (err) { setError(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customer Orders</h1>
          <p className="muted small">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Order</button>
      </div>
      {error && <div className="error-banner">{error}</div>}

      <table>
        <thead>
          <tr><th>Order</th><th>Date</th><th>Customer</th><th>Status</th><th>Total</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {orders.length === 0 && <tr><td colSpan={6} className="empty-state">No orders yet.</td></tr>}
          {orders.map((o) => {
            const done = o.status === 'FULFILLED' || o.status === 'CANCELLED'
            return (
              <tr key={o.id}>
                <td><span className="order-id">#{o.id}</span></td>
                <td className="muted small">{fmtDate(o.createdAt)}</td>
                <td>
                  <div>{o.customerName}</div>
                  {o.customerEmail && <div className="muted small">{o.customerEmail}</div>}
                </td>
                <td><StatusBadge status={o.status} /></td>
                <td>${Number(o.totalAmount ?? 0).toFixed(2)}</td>
                <td className="row-actions">
                  <button className="link-btn" title="View order details" onClick={() => setDetailOrder(o)}>View</button>
                  <button
                    className="link-btn"
                    disabled={o.status !== 'PENDING'}
                    title={o.status !== 'PENDING' ? 'Order must be Pending to confirm' : 'Confirm this order'}
                    onClick={() => confirmOrder(o.id)}
                  >Confirm</button>
                  <button
                    className="link-btn"
                    disabled={o.status !== 'CONFIRMED'}
                    title={o.status !== 'CONFIRMED' ? 'Order must be Confirmed to fulfill' : 'Choose warehouses to pull stock from'}
                    onClick={() => openFulfill(o)}
                  >Fulfill</button>
                  <button
                    className="link-btn danger"
                    disabled={done}
                    title={done ? 'Order is already completed or cancelled' : 'Cancel this order'}
                    onClick={() => setCancelTarget(o)}
                  >Cancel</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {showForm && (
        <Modal title="New Customer Order" onClose={() => { setShowForm(false); setItems([{ ...EMPTY_ITEM }]) }}>
          <form onSubmit={submitCreate} className="stacked-form">
            <div className="form-row-2">
              <label>Customer Name<input required value={header.customerName} onChange={(e) => setHeader({ ...header, customerName: e.target.value })} /></label>
              <label>Customer Email<input type="email" value={header.customerEmail} onChange={(e) => setHeader({ ...header, customerEmail: e.target.value })} /></label>
            </div>

            <div className="line-items-label">
              <span>Line Items</span>
              <button type="button" className="link-btn" onClick={addItem} title="Add another product to this order">+ Add Item</button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="line-item-row">
                <select
                  required
                  value={item.productId}
                  onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                >
                  <option value="">Select product…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (${Number(p.price).toFixed(2)})</option>)}
                </select>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                />
                {items.length > 1 && (
                  <button type="button" className="icon-btn" title="Remove this line item" onClick={() => removeItem(idx)}>✕</button>
                )}
              </div>
            ))}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Create Order</button>
            </div>
          </form>
        </Modal>
      )}

      {detailOrder && (
        <Modal title={`Order #${detailOrder.id}`} onClose={() => setDetailOrder(null)}>
          <div className="order-detail">
            <div className="order-detail-meta">
              <div className="detail-row"><span>Date</span><strong>{fmtDate(detailOrder.createdAt)}</strong></div>
              <div className="detail-row"><span>Customer</span><strong>{detailOrder.customerName}</strong></div>
              {detailOrder.customerEmail && <div className="detail-row"><span>Email</span><strong>{detailOrder.customerEmail}</strong></div>}
              <div className="detail-row"><span>Status</span><StatusBadge status={detailOrder.status} /></div>
              <div className="detail-row"><span>Total</span><strong>${Number(detailOrder.totalAmount ?? 0).toFixed(2)}</strong></div>
            </div>
            <h2 style={{ marginTop: 18 }}>Line Items</h2>
            <table className="inner-table">
              <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                {(detailOrder.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.name ?? `#${item.productId}`}</td>
                    <td>{item.quantity}</td>
                    <td>${Number(item.unitPrice ?? 0).toFixed(2)}</td>
                    <td>${(item.quantity * Number(item.unitPrice ?? 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="detail-footer">
              <button className="link-btn" disabled={detailOrder.status !== 'PENDING'} onClick={() => { confirmOrder(detailOrder.id); setDetailOrder(null) }}>Confirm</button>
              <button className="link-btn" disabled={detailOrder.status !== 'CONFIRMED'} onClick={() => { setDetailOrder(null); openFulfill(detailOrder) }}>Fulfill</button>
              <button className="btn-danger" disabled={detailOrder.status === 'CANCELLED' || detailOrder.status === 'FULFILLED'} onClick={() => { setDetailOrder(null); setCancelTarget(detailOrder) }}>Cancel Order</button>
            </div>
          </div>
        </Modal>
      )}

      {fulfillTarget && (
        <Modal title={`Fulfill Order #${fulfillTarget.id}`} onClose={closeFulfill}>
          <form onSubmit={submitFulfill} className="stacked-form">
            <div className="fulfill-intro">
              <p className="muted small">
                Choose how many units to pull from each warehouse. We've suggested a split that uses the
                fewest warehouses — edit any number to change it.
              </p>
              <button type="button" className="link-btn" onClick={() => setPlan(autoAllocate(fulfillTarget, warehouses, inventory))}>
                Reset suggestion
              </button>
            </div>

            {(fulfillTarget.items ?? []).map((item) => {
              const pid = item.product.id
              const allocated = allocatedFor(pid)
              const status = allocated === item.quantity ? 'ok' : allocated > item.quantity ? 'over' : 'under'
              return (
                <div key={item.id} className="fulfill-item">
                  <div className="fulfill-item-head">
                    <strong>{item.product.name}</strong>
                    <span className={`alloc-pill alloc-${status}`}>{allocated} / {item.quantity} allocated</span>
                  </div>
                  <table className="inner-table">
                    <thead><tr><th>Warehouse</th><th>On Hand</th><th>Take</th></tr></thead>
                    <tbody>
                      {warehouses.map((w) => {
                        const onHand = onHandFor(inventory, pid, w.id)
                        const take = plan[pid]?.[w.id] ?? ''
                        const tooMany = (Number(take) || 0) > onHand
                        return (
                          <tr key={w.id}>
                            <td>{w.name}</td>
                            <td className={onHand === 0 ? 'muted' : ''}>{onHand}</td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max={onHand}
                                className={`take-input${tooMany ? ' invalid' : ''}`}
                                disabled={onHand === 0}
                                value={take}
                                placeholder="0"
                                title={tooMany ? `Only ${onHand} on hand` : undefined}
                                onChange={(e) => setTake(pid, w.id, e.target.value)}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {status === 'under' && allocated < item.quantity && (
                    <p className="small alloc-hint">
                      {item.quantity - allocated} more needed
                      {warehouses.reduce((s, w) => s + onHandFor(inventory, pid, w.id), 0) < item.quantity && ' — not enough stock across all warehouses'}
                    </p>
                  )}
                  {status === 'over' && <p className="small alloc-hint">{allocated - item.quantity} too many allocated</p>}
                </div>
              )
            })}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeFulfill}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={!fulfillReady || fulfilling}>
                {fulfilling ? 'Fulfilling…' : 'Fulfill Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {cancelTarget && (
        <ConfirmModal
          title="Cancel Order"
          message={`Cancel order #${cancelTarget.id} for ${cancelTarget.customerName}? This action cannot be undone.`}
          confirmLabel="Cancel Order"
          danger
          onConfirm={() => doCancel(cancelTarget.id)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  )
}

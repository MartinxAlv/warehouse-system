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

  async function fulfill(id) {
    const warehouseId = warehouses[0]?.id
    if (!warehouseId) return setError('Create a warehouse first')
    try { await api.fulfillOrder(id, { warehouseId }); toast('Order fulfilled'); load() }
    catch (err) { setError(err.message) }
  }

  async function doCancel(id) {
    const warehouseId = warehouses[0]?.id
    try { await api.cancelOrder(id, { warehouseId }); toast('Order cancelled', 'info'); load() }
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
                    title={o.status !== 'CONFIRMED' ? 'Order must be Confirmed to fulfill' : 'Mark as fulfilled and deduct stock'}
                    onClick={() => fulfill(o.id)}
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
              <button className="link-btn" disabled={detailOrder.status !== 'CONFIRMED'} onClick={() => { fulfill(detailOrder.id); setDetailOrder(null) }}>Fulfill</button>
              <button className="btn-danger" disabled={detailOrder.status === 'CANCELLED' || detailOrder.status === 'FULFILLED'} onClick={() => { setDetailOrder(null); setCancelTarget(detailOrder) }}>Cancel Order</button>
            </div>
          </div>
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

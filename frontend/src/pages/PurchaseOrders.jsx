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

const EMPTY_ITEM = { productId: '', quantity: '', unitCost: '' }

export default function PurchaseOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])

  function load() {
    Promise.all([api.getPurchaseOrders(), api.getSuppliers(), api.getProducts(), api.getWarehouses()])
      .then(([o, s, p, w]) => { setOrders(o); setSuppliers(s); setProducts(p); setWarehouses(w) })
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
    try {
      await api.createPurchaseOrder({
        supplierId: Number(supplierId),
        items: items.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
        })),
      })
      toast('Purchase order created')
      setShowForm(false)
      setSupplierId('')
      setItems([{ ...EMPTY_ITEM }])
      load()
    } catch (err) { setError(err.message) }
  }

  async function submitOrder(id) {
    try { await api.submitPurchaseOrder(id); toast('Purchase order submitted'); load() }
    catch (err) { setError(err.message) }
  }

  async function cancelOrder(id) {
    try { await api.cancelPurchaseOrder(id); toast('Purchase order cancelled', 'info'); load() }
    catch (err) { setError(err.message) }
  }

  async function receiveFull(order) {
    const warehouseId = warehouses[0]?.id
    if (!warehouseId) return setError('Create a warehouse first')
    const receivedQuantitiesByItemId = {}
    order.items.forEach((i) => { receivedQuantitiesByItemId[i.id] = i.quantityOrdered - i.quantityReceived })
    try { await api.receivePurchaseOrder(order.id, { warehouseId, receivedQuantitiesByItemId }); toast('Goods received — inventory updated'); load() }
    catch (err) { setError(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Purchase Orders</h1>
          <p className="muted small">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Purchase Order</button>
      </div>
      {error && <div className="error-banner">⚠️ {error}</div>}

      <table>
        <thead>
          <tr><th>Order</th><th>Date</th><th>Supplier</th><th>Status</th><th>Total Cost</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {orders.length === 0 && <tr><td colSpan={6} className="empty-state">No purchase orders yet.</td></tr>}
          {orders.map((o) => {
            const done = o.status === 'RECEIVED' || o.status === 'CANCELLED'
            const canReceive = o.status === 'SUBMITTED' || o.status === 'PARTIALLY_RECEIVED'
            return (
              <tr key={o.id}>
                <td><span className="order-id">#{o.id}</span></td>
                <td className="muted small">{fmtDate(o.createdAt)}</td>
                <td>{o.supplier?.name}</td>
                <td><StatusBadge status={o.status} /></td>
                <td>${Number(o.totalCost ?? 0).toFixed(2)}</td>
                <td className="row-actions">
                  <button className="link-btn" title="View order details" onClick={() => setDetailOrder(o)}>View</button>
                  <button
                    className="link-btn"
                    disabled={o.status !== 'DRAFT'}
                    title={o.status !== 'DRAFT' ? 'Only Draft orders can be submitted' : 'Submit to supplier'}
                    onClick={() => submitOrder(o.id)}
                  >Submit</button>
                  <button
                    className="link-btn"
                    disabled={!canReceive}
                    title={!canReceive ? 'Order must be Submitted or Partially Received' : 'Mark goods as received'}
                    onClick={() => receiveFull(o)}
                  >Receive</button>
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
        <Modal title="New Purchase Order" onClose={() => { setShowForm(false); setItems([{ ...EMPTY_ITEM }]) }}>
          <form onSubmit={submitCreate} className="stacked-form">
            <label>Supplier
              <select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select supplier…</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <div className="line-items-label">
              <span>Line Items</span>
              <button type="button" className="link-btn" onClick={addItem} title="Add another product">+ Add Item</button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="line-item-row po-item-row">
                <select
                  required
                  value={item.productId}
                  onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                >
                  <option value="">Product…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input required type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                <input required type="number" step="0.01" min="0" placeholder="Unit cost ($)" value={item.unitCost} onChange={(e) => updateItem(idx, 'unitCost', e.target.value)} />
                {items.length > 1 && (
                  <button type="button" className="icon-btn" title="Remove line item" onClick={() => removeItem(idx)}>✕</button>
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
        <Modal title={`Purchase Order #${detailOrder.id}`} onClose={() => setDetailOrder(null)}>
          <div className="order-detail">
            <div className="order-detail-meta">
              <div className="detail-row"><span>Date</span><strong>{fmtDate(detailOrder.createdAt)}</strong></div>
              <div className="detail-row"><span>Supplier</span><strong>{detailOrder.supplier?.name}</strong></div>
              <div className="detail-row"><span>Status</span><StatusBadge status={detailOrder.status} /></div>
              <div className="detail-row"><span>Total Cost</span><strong>${Number(detailOrder.totalCost ?? 0).toFixed(2)}</strong></div>
            </div>
            <h2 style={{ marginTop: 18 }}>Line Items</h2>
            <table className="inner-table">
              <thead><tr><th>Product</th><th>Ordered</th><th>Received</th><th>Unit Cost</th><th>Subtotal</th></tr></thead>
              <tbody>
                {(detailOrder.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.name ?? `#${item.productId}`}</td>
                    <td>{item.quantityOrdered}</td>
                    <td>{item.quantityReceived}</td>
                    <td>${Number(item.unitCost ?? 0).toFixed(2)}</td>
                    <td>${(item.quantityOrdered * Number(item.unitCost ?? 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="detail-footer">
              <button className="link-btn" disabled={detailOrder.status !== 'DRAFT'} onClick={() => { submitOrder(detailOrder.id); setDetailOrder(null) }}>Submit</button>
              <button className="link-btn" disabled={detailOrder.status !== 'SUBMITTED' && detailOrder.status !== 'PARTIALLY_RECEIVED'} onClick={() => { receiveFull(detailOrder); setDetailOrder(null) }}>Receive All</button>
              <button className="btn-danger" disabled={detailOrder.status === 'RECEIVED' || detailOrder.status === 'CANCELLED'} onClick={() => { setDetailOrder(null); setCancelTarget(detailOrder) }}>Cancel Order</button>
            </div>
          </div>
        </Modal>
      )}

      {cancelTarget && (
        <ConfirmModal
          title="Cancel Purchase Order"
          message={`Cancel PO #${cancelTarget.id} from ${cancelTarget.supplier?.name}? This cannot be undone.`}
          confirmLabel="Cancel Order"
          danger
          onConfirm={() => cancelOrder(cancelTarget.id)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Modal from '../components/Modal.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const EMPTY = { sku: '', name: '', description: '', price: '', reorderThreshold: 10, categoryId: '' }

export default function Products() {
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editForm, setEditForm] = useState(EMPTY)

  function load() {
    const fetchProducts = isAdmin && showInactive ? api.getAllProducts() : api.getProducts()
    Promise.all([fetchProducts, api.getCategories()])
      .then(([p, c]) => { setProducts(p); setCategories(c) })
      .catch((e) => setError(e.message))
  }

  useEffect(load, [showInactive])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.createProduct({ ...form, price: Number(form.price), categoryId: Number(form.categoryId) })
      toast('Product created')
      setShowForm(false)
      setForm(EMPTY)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function openEdit(p) {
    setEditForm({
      sku: p.sku,
      name: p.name,
      description: p.description ?? '',
      price: p.price,
      reorderThreshold: p.reorderThreshold,
      categoryId: p.category?.id ?? '',
    })
    setEditProduct(p)
  }

  async function handleEdit(e) {
    e.preventDefault()
    try {
      await api.updateProduct(editProduct.id, {
        ...editForm, price: Number(editForm.price), categoryId: Number(editForm.categoryId),
      })
      toast('Product updated')
      setEditProduct(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeactivate(p) {
    try {
      await api.deactivateProduct(p.id)
      toast(`${p.name} deactivated`, 'info')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleReactivate(p) {
    try {
      await api.reactivateProduct(p.id)
      toast(`${p.name} reactivated`)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    const matchCat = !filterCategory || String(p.category?.id) === filterCategory
    return matchSearch && matchCat
  })

  function ProductForm({ data, setData, onSubmit, submitLabel, onCancel }) {
    return (
      <form onSubmit={onSubmit} className="stacked-form">
        <div className="form-row-2">
          <label>SKU<input required value={data.sku} onChange={(e) => setData({ ...data, sku: e.target.value })} /></label>
          <label>Category
            <select required value={data.categoryId} onChange={(e) => setData({ ...data, categoryId: e.target.value })}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <label>Name<input required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} /></label>
        <label>Description<textarea value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} /></label>
        <div className="form-row-2">
          <label>Price ($)<input required type="number" step="0.01" min="0" value={data.price} onChange={(e) => setData({ ...data, price: e.target.value })} /></label>
          <label>
            Reorder Threshold
            <input type="number" min="0" value={data.reorderThreshold} onChange={(e) => setData({ ...data, reorderThreshold: e.target.value })} />
            <span className="field-hint">System will flag low stock below this quantity</span>
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary">{submitLabel}</button>
        </div>
      </form>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="muted small">{filtered.length} of {products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Product</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="filter-bar">
        <input
          className="filter-search"
          type="search"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || filterCategory) && (
          <button className="link-btn" onClick={() => { setSearch(''); setFilterCategory('') }}>Clear</button>
        )}
        {isAdmin && (
          <button
            className={showInactive ? 'btn-primary' : 'btn-secondary'}
            style={{ marginLeft: 'auto' }}
            onClick={() => setShowInactive(v => !v)}
          >
            {showInactive ? 'Hiding inactive' : 'Show inactive'}
          </button>
        )}
      </div>

      <table>
        <thead>
          <tr><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Reorder At</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="empty-state">No products match your filters.</td></tr>
          )}
          {filtered.map((p) => (
            <tr key={p.id} style={!p.active ? { opacity: 0.5 } : {}}>
              <td><code className="sku-code">{p.sku}</code></td>
              <td>{p.name}</td>
              <td><span className="badge badge-gray">{p.category?.name ?? '—'}</span></td>
              <td>${Number(p.price).toFixed(2)}</td>
              <td>{p.reorderThreshold}</td>
              <td>
                <span className={`badge ${p.active ? 'badge-green' : 'badge-gray'}`}>
                  {p.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="row-actions">
                {p.active ? (
                  <>
                    <button className="link-btn" title="Edit this product" onClick={() => openEdit(p)}>Edit</button>
                    <button className="link-btn danger" title="Deactivate this product" onClick={() => setConfirmTarget(p)}>Deactivate</button>
                  </>
                ) : (
                  <button className="link-btn" title="Restore this product to the catalog" onClick={() => handleReactivate(p)}>Reactivate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <Modal title="Add Product" onClose={() => setShowForm(false)}>
          <ProductForm data={form} setData={setForm} onSubmit={handleCreate} submitLabel="Create Product" onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {editProduct && (
        <Modal title="Edit Product" onClose={() => setEditProduct(null)}>
          <ProductForm data={editForm} setData={setEditForm} onSubmit={handleEdit} submitLabel="Save Changes" onCancel={() => setEditProduct(null)} />
        </Modal>
      )}

      {confirmTarget && (
        <ConfirmModal
          title="Deactivate Product"
          message={`Deactivate "${confirmTarget.name}"? It will be hidden from the catalog.`}
          confirmLabel="Deactivate"
          danger
          onConfirm={() => handleDeactivate(confirmTarget)}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}

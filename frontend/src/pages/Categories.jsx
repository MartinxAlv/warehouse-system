import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Modal from '../components/Modal.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import { useToast } from '../context/ToastContext.jsx'

const EMPTY = { name: '', description: '' }

export default function Categories() {
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editForm, setEditForm] = useState(EMPTY)

  function load() { api.getCategories().then(setCategories).catch((e) => setError(e.message)) }
  useEffect(load, [])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.createCategory(form)
      toast('Category created')
      setShowForm(false)
      setForm(EMPTY)
      load()
    } catch (err) { setError(err.message) }
  }

  function openEdit(c) {
    setEditForm({ name: c.name, description: c.description ?? '' })
    setEditCat(c)
  }

  async function handleEdit(e) {
    e.preventDefault()
    try {
      await api.updateCategory(editCat.id, editForm)
      toast('Category updated')
      setEditCat(null)
      load()
    } catch (err) { setError(err.message) }
  }

  async function handleDelete(c) {
    try {
      await api.deleteCategory(c.id)
      toast(`"${c.name}" deleted`, 'info')
      load()
    } catch (err) { setError(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p className="muted small">Organise products into categories for easier browsing</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Category</button>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <table>
        <thead>
          <tr><th>Name</th><th>Description</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {categories.length === 0 && (
            <tr><td colSpan={3} className="empty-state">No categories yet. Add one to organise your products.</td></tr>
          )}
          {categories.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.name}</strong></td>
              <td className="muted">{c.description || '—'}</td>
              <td className="row-actions">
                <button className="link-btn" title="Edit this category" onClick={() => openEdit(c)}>Edit</button>
                <button className="link-btn danger" title="Delete this category" onClick={() => setConfirmTarget(c)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <Modal title="Add Category" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="stacked-form">
            <label>Name<input required placeholder="e.g. Electronics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Description<textarea placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Create Category</button>
            </div>
          </form>
        </Modal>
      )}

      {editCat && (
        <Modal title="Edit Category" onClose={() => setEditCat(null)}>
          <form onSubmit={handleEdit} className="stacked-form">
            <label>Name<input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></label>
            <label>Description<textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditCat(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmTarget && (
        <ConfirmModal
          title="Delete Category"
          message={`Delete "${confirmTarget.name}"? Products in this category will lose their category assignment.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(confirmTarget)}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}

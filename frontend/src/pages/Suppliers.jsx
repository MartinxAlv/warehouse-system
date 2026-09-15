import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Modal from '../components/Modal.jsx'
import { useToast } from '../context/ToastContext.jsx'

const EMPTY = { name: '', contactEmail: '', phone: '', address: '' }

export default function Suppliers() {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState([])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editForm, setEditForm] = useState(EMPTY)

  function load() { api.getSuppliers().then(setSuppliers).catch((e) => setError(e.message)) }
  useEffect(load, [])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.createSupplier(form)
      toast('Supplier added')
      setShowForm(false)
      setForm(EMPTY)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function openEdit(s) {
    setEditForm({ name: s.name, contactEmail: s.contactEmail ?? '', phone: s.phone ?? '', address: s.address ?? '' })
    setEditSupplier(s)
  }

  async function handleEdit(e) {
    e.preventDefault()
    try {
      await api.updateSupplier(editSupplier.id, editForm)
      toast('Supplier updated')
      setEditSupplier(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function SupplierForm({ data, setData, onSubmit, submitLabel, onCancel }) {
    return (
      <form onSubmit={onSubmit} className="stacked-form">
        <label>Name<input required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} /></label>
        <label>Contact Email<input type="email" value={data.contactEmail} onChange={(e) => setData({ ...data, contactEmail: e.target.value })} /></label>
        <div className="form-row-2">
          <label>Phone<input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} /></label>
          <label>Address<input value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} /></label>
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
        <h1>Suppliers</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Supplier</button>
      </div>
      {error && <div className="error-banner">⚠️ {error}</div>}

      <table>
        <thead><tr><th>Name</th><th>Contact Email</th><th>Phone</th><th>Address</th><th></th></tr></thead>
        <tbody>
          {suppliers.length === 0 && (
            <tr><td colSpan={5} className="empty-state">No suppliers yet. Add one to get started.</td></tr>
          )}
          {suppliers.map((s) => (
            <tr key={s.id}>
              <td><strong>{s.name}</strong></td>
              <td className="muted">{s.contactEmail || '—'}</td>
              <td className="muted">{s.phone || '—'}</td>
              <td className="muted">{s.address || '—'}</td>
              <td className="row-actions">
                <button className="link-btn" title="Edit this supplier's contact information" onClick={() => openEdit(s)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <Modal title="Add Supplier" onClose={() => setShowForm(false)}>
          <SupplierForm data={form} setData={setForm} onSubmit={handleCreate} submitLabel="Add Supplier" onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {editSupplier && (
        <Modal title="Edit Supplier" onClose={() => setEditSupplier(null)}>
          <SupplierForm data={editForm} setData={setEditForm} onSubmit={handleEdit} submitLabel="Save Changes" onCancel={() => setEditSupplier(null)} />
        </Modal>
      )}
    </div>
  )
}

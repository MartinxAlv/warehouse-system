import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import Modal from '../components/Modal.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import { useToast } from '../context/ToastContext.jsx'

const ROLES = ['ADMIN', 'WAREHOUSE_STAFF', 'SALES_STAFF']
const ROLE_LABELS = { ADMIN: 'Admin', WAREHOUSE_STAFF: 'Warehouse Staff', SALES_STAFF: 'Sales Staff' }
const ROLE_COLORS = { ADMIN: 'badge-purple', WAREHOUSE_STAFF: 'badge-blue', SALES_STAFF: 'badge-green' }
const EMPTY_CREATE = { fullName: '', email: '', password: '', role: 'WAREHOUSE_STAFF' }

export default function Users() {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [editForm, setEditForm] = useState({ fullName: '', role: '', active: true, password: '' })
  const [dataLoaded, setDataLoaded] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [toolWorking, setToolWorking] = useState(false)

  function load() {
    setLoading(true)
    api.getUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  function loadStatus() {
    api.getSampleDataStatus()
      .then((res) => setDataLoaded(res.loaded))
      .catch(() => {})
  }

  useEffect(() => { load(); loadStatus() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.createUser(createForm)
      toast('User created successfully')
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function openEdit(user) {
    setEditForm({ fullName: user.fullName, role: user.role, active: user.active, password: '' })
    setEditUser(user)
  }

  async function handleEdit(e) {
    e.preventDefault()
    try {
      const payload = { fullName: editForm.fullName, role: editForm.role, active: editForm.active }
      if (editForm.password) payload.password = editForm.password
      await api.updateUser(editUser.id, payload)
      toast('User updated')
      setEditUser(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSeed() {
    setToolWorking(true)
    try {
      await api.seedSampleData()
      toast('Sample data loaded — 10 products, 9 purchase orders, 15 customer orders, bin locations and system log entries created')
      setDataLoaded(true)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setToolWorking(false)
    }
  }

  async function handleClear() {
    setToolWorking(true)
    try {
      await api.clearAllData()
      toast('All data cleared — demo accounts kept', 'info')
      setDataLoaded(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setToolWorking(false)
    }
  }

  async function handleDeactivate(user) {
    try {
      await api.deactivateUser(user.id)
      toast(`${user.fullName} deactivated`, 'info')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return (
    <div className="loading">
      <div className="loading-dots">
        <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="muted small">{users.length} user{users.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Add User</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                <div className="user-cell">
                  <div className="user-avatar-sm">{u.fullName?.charAt(0)?.toUpperCase() ?? '?'}</div>
                  <span>{u.fullName}</span>
                </div>
              </td>
              <td className="muted">{u.email}</td>
              <td>
                <span className={`badge ${ROLE_COLORS[u.role] ?? 'badge-gray'}`}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
              </td>
              <td>
                <span className={`badge ${u.active ? 'badge-green' : 'badge-gray'}`}>
                  {u.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="row-actions">
                <button className="link-btn" title="Edit this user's role and account settings" onClick={() => openEdit(u)}>Edit</button>
                {u.active && (
                  <button className="link-btn danger" title="Deactivate this account — the user will no longer be able to log in" onClick={() => setConfirmTarget(u)}>Deactivate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreate && (
        <Modal title="Add User" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="stacked-form">
            <label>Full Name
              <input required placeholder="Jane Smith" value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} />
            </label>
            <label>Email
              <input required type="email" placeholder="jane@warehouse.com" value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            </label>
            <label>Password
              <input required type="password" placeholder="••••••••" value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
            </label>
            <label>
              Role
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <span className="field-hint">Admin: full access · Warehouse Staff: inventory &amp; orders · Sales Staff: customer orders only</span>
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Create User</button>
            </div>
          </form>
        </Modal>
      )}

      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <form onSubmit={handleEdit} className="stacked-form">
            <label>Full Name
              <input required value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
            </label>
            <label>Role
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </label>
            <div className="toggle-row">
              <input type="checkbox" id="active-chk" checked={editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} />
              <label htmlFor="active-chk">Account is active</label>
            </div>
            <label>
              <span>New Password <span className="muted small">(leave blank to keep current)</span></span>
              <input type="password" placeholder="••••••••" value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmTarget && (
        <ConfirmModal
          title="Deactivate User"
          message={`Are you sure you want to deactivate ${confirmTarget.fullName}? They will no longer be able to log in.`}
          confirmLabel="Deactivate"
          danger
          onConfirm={() => handleDeactivate(confirmTarget)}
          onClose={() => setConfirmTarget(null)}
        />
      )}

      {/* ── Admin Tools ────────────────────────────────────────────────── */}
      <div className="admin-tools panel">
        <div className="admin-tools-header">
          <div>
            <h2>Admin Tools</h2>
            <p className="muted small">Manage demo data for presentations and testing.</p>
          </div>
          <span className={`badge ${dataLoaded ? 'badge-green' : 'badge-gray'}`}>
            {dataLoaded ? 'Data loaded' : 'Empty'}
          </span>
        </div>

        <div className="admin-tool-row">
          <div className="admin-tool-info">
            <strong>Load Sample Data</strong>
            <p className="muted small">
              Creates 4 categories, 3 suppliers, 3 warehouses, 10 products, 9 purchase orders,
              and 15 customer orders in various states — plus stock adjustments, warehouse transfers,
              a full movement log, bin locations for every inventory item, and 6 sample system log
              entries (INFO, WARN, and ERROR) to demonstrate the error tracking feature.
            </p>
          </div>
          <button
            className="btn-primary"
            disabled={dataLoaded || toolWorking}
            title={dataLoaded ? 'Clear existing data first' : 'Load a realistic demo dataset'}
            onClick={handleSeed}
          >
            {toolWorking ? 'Loading…' : 'Load Sample Data'}
          </button>
        </div>

        <div className="admin-tool-row admin-tool-row--danger">
          <div className="admin-tool-info">
            <strong>Clear All Data</strong>
            <p className="muted small">
              Permanently deletes all products, orders, inventory, suppliers, warehouses, and
              categories. The three demo user accounts (admin, staff, sales) are kept.
            </p>
          </div>
          <button
            className="btn-danger"
            disabled={toolWorking}
            title="Delete all data — cannot be undone"
            onClick={() => setShowClearConfirm(true)}
          >
            Clear All Data
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmModal
          title="Clear All Data"
          message="This will permanently delete all products, orders, inventory, suppliers, warehouses, and categories. The three demo accounts will be kept. This cannot be undone."
          confirmLabel="Clear Everything"
          danger
          onConfirm={handleClear}
          onClose={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  )
}

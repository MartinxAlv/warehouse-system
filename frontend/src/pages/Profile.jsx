import { useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const ROLE_LABELS = { ADMIN: 'Admin', WAREHOUSE_STAFF: 'Warehouse Staff', SALES_STAFF: 'Sales Staff' }
const ROLE_COLORS = { ADMIN: 'badge-purple', WAREHOUSE_STAFF: 'badge-blue', SALES_STAFF: 'badge-green' }

export default function Profile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await api.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      toast('Password changed successfully')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-grid">
        <div className="panel">
          <h2>Account Information</h2>
          <div className="profile-info">
            <div className="profile-avatar-lg">
              {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="profile-details">
              <div className="profile-name">{user?.fullName}</div>
              <div className="muted small">{user?.email}</div>
              <span className={`badge ${ROLE_COLORS[user?.role] ?? 'badge-gray'}`} style={{ marginTop: 8 }}>
                {ROLE_LABELS[user?.role] ?? user?.role}
              </span>
            </div>
          </div>

          <div className="profile-meta">
            <div className="detail-row">
              <span>Full Name</span>
              <strong>{user?.fullName}</strong>
            </div>
            <div className="detail-row">
              <span>Email</span>
              <strong>{user?.email}</strong>
            </div>
            <div className="detail-row">
              <span>Role</span>
              <strong>{ROLE_LABELS[user?.role] ?? user?.role}</strong>
            </div>
            <div className="detail-row">
              <span>User ID</span>
              <strong>#{user?.id}</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>Change Password</h2>
          <p className="muted small" style={{ marginBottom: 18 }}>
            Choose a strong password of at least 6 characters.
          </p>

          {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit} className="stacked-form">
            <label>
              Current Password
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              />
            </label>
            <label>
              New Password
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
              <span className="field-hint">Must be at least 6 characters</span>
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

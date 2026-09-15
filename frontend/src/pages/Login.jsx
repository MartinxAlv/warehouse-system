import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import BrandMark from '../components/BrandMark.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(form)
      login(data)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function fill(email, password) {
    setForm({ email, password })
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo-mark"><BrandMark size={26} /></div>
          <h1 className="login-title">Stockwell</h1>
          <p className="login-sub">Sign in to your account</p>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: 0 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className="stacked-form">
          <label>
            Email address
            <input
              type="email"
              required
              autoFocus
              placeholder="you@warehouse.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-demo">
          <p className="login-demo-label">Demo accounts</p>
          <div className="login-demo-grid">
            <button className="demo-btn" onClick={() => fill('admin@warehouse.com', 'admin123')}>
              <span className="demo-role">Admin</span>
              <span className="demo-email">admin@warehouse.com</span>
            </button>
            <button className="demo-btn" onClick={() => fill('staff@warehouse.com', 'staff123')}>
              <span className="demo-role">Warehouse</span>
              <span className="demo-email">staff@warehouse.com</span>
            </button>
            <button className="demo-btn" onClick={() => fill('sales@warehouse.com', 'sales123')}>
              <span className="demo-role">Sales</span>
              <span className="demo-email">sales@warehouse.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

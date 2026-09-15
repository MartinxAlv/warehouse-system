import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_COLORS = { ADMIN: 'badge-purple', WAREHOUSE_STAFF: 'badge-blue', SALES_STAFF: 'badge-green' }
const ROLE_LABELS = { ADMIN: 'Admin', WAREHOUSE_STAFF: 'Warehouse', SALES_STAFF: 'Sales' }

const PAGE_TITLES = {
  '/':                 'Dashboard',
  '/products':         'Products',
  '/inventory':        'Inventory',
  '/stock-movements':  'Stock Movement Log',
  '/purchase-orders':  'Purchase Orders',
  '/orders':           'Customer Orders',
  '/suppliers':        'Suppliers',
  '/warehouses':       'Warehouses',
  '/categories':       'Categories',
  '/reports':          'Reports',
  '/profile':          'My Profile',
  '/users':            'User Management',
}

function navLinks(role) {
  const all = [
    { to: '/',                label: 'Dashboard',        icon: '📊', end: true },
    { to: '/products',        label: 'Products',          icon: '📦' },
    { to: '/inventory',       label: 'Inventory',         icon: '🗂️' },
    { to: '/stock-movements', label: 'Stock Log',         icon: '📋' },
    { to: '/purchase-orders', label: 'Purchase Orders',   icon: '🛒' },
    { to: '/orders',          label: 'Customer Orders',   icon: '📬' },
    { to: '/suppliers',       label: 'Suppliers',         icon: '🏭' },
    { to: '/warehouses',      label: 'Warehouses',        icon: '🏢' },
    { to: '/reports',         label: 'Reports',           icon: '📈' },
  ]
  if (role === 'ADMIN') {
    all.push({ to: '/categories', label: 'Categories', icon: '🏷️' })
    all.push({ to: '/users',      label: 'Users',       icon: '👥' })
  }
  return all
}

function Breadcrumb() {
  const location = useLocation()
  const current = PAGE_TITLES[location.pathname] ?? 'Page'
  if (location.pathname === '/') return null
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <NavLink to="/" className="breadcrumb-link">Home</NavLink>
      <span className="breadcrumb-sep">›</span>
      <span className="breadcrumb-current">{current}</span>
    </nav>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = navLinks(user?.role)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">📦</div>
          <span>Warehouse IMS</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              title={l.label}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="sidebar-user">
            <div
              className="sidebar-user-info sidebar-user-clickable"
              onClick={() => navigate('/profile')}
              title="View your profile"
            >
              <div className="sidebar-avatar">
                {user.fullName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="sidebar-user-text">
                <div className="sidebar-user-name">{user.fullName}</div>
                <span className={`badge badge-sm ${ROLE_COLORS[user.role] ?? 'badge-gray'}`}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
            </div>
            <button
              className="sidebar-logout"
              onClick={handleLogout}
              title="Sign out of your account"
            >
              ⎋
            </button>
          </div>
        )}
      </aside>

      <div className="main-area">
        <Breadcrumb />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

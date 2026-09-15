import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Icon from './Icon.jsx'

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
    { to: '/',                label: 'Dashboard',       icon: 'dashboard',       end: true },
    { to: '/products',        label: 'Products',         icon: 'products' },
    { to: '/inventory',       label: 'Inventory',        icon: 'inventory' },
    { to: '/stock-movements', label: 'Stock Log',        icon: 'movements' },
    { to: '/purchase-orders', label: 'Purchase Orders',  icon: 'purchaseOrders' },
    { to: '/orders',          label: 'Customer Orders',  icon: 'customerOrders' },
    { to: '/suppliers',       label: 'Suppliers',        icon: 'suppliers' },
    { to: '/warehouses',      label: 'Warehouses',       icon: 'warehouses' },
    { to: '/reports',         label: 'Reports',          icon: 'reports' },
  ]
  if (role === 'ADMIN') {
    all.push({ to: '/categories', label: 'Categories', icon: 'categories' })
    all.push({ to: '/users',      label: 'Users',      icon: 'users' })
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

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '60px' : '228px')
  }, [collapsed])

  useEffect(() => {
    const theme = localStorage.getItem('theme') ?? 'light'
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-left">
            <div className="brand-logo-mark">W</div>
            <span className="brand-text">Warehouse IMS</span>
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} />
          </button>
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
              <span className="nav-icon"><Icon name={l.icon} size={16} /></span>
              <span className="nav-label">{l.label}</span>
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
            <button className="sidebar-logout" onClick={handleLogout} title="Sign out">
              <Icon name="logOut" size={15} />
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

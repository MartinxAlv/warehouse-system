import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Products from './pages/Products.jsx'
import Inventory from './pages/Inventory.jsx'
import PurchaseOrders from './pages/PurchaseOrders.jsx'
import CustomerOrders from './pages/CustomerOrders.jsx'
import Suppliers from './pages/Suppliers.jsx'
import Warehouses from './pages/Warehouses.jsx'
import Categories from './pages/Categories.jsx'
import StockMovements from './pages/StockMovements.jsx'
import Profile from './pages/Profile.jsx'
import Users from './pages/Users.jsx'
import Reports from './pages/Reports.jsx'

function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function RequireAdmin({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return (
    <div className="content">
      <div className="error-banner">This page requires Admin access.</div>
    </div>
  )
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/"                  element={<Dashboard />} />
          <Route path="/products"          element={<Products />} />
          <Route path="/inventory"         element={<Inventory />} />
          <Route path="/stock-movements"   element={<StockMovements />} />
          <Route path="/purchase-orders"   element={<PurchaseOrders />} />
          <Route path="/orders"            element={<CustomerOrders />} />
          <Route path="/suppliers"         element={<Suppliers />} />
          <Route path="/warehouses"        element={<Warehouses />} />
          <Route path="/categories"        element={<RequireAdmin><Categories /></RequireAdmin>} />
          <Route path="/reports"           element={<Reports />} />
          <Route path="/profile"           element={<Profile />} />
          <Route path="/users"             element={<RequireAdmin><Users /></RequireAdmin>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

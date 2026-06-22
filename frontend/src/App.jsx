import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Sidebar from './components/layout/Sidebar'

import LoginPage     from './pages/auth/LoginPage'
import Dashboard     from './pages/dashboard/Dashboard'
import ItemsList     from './pages/items/ItemsList'
import ComboList     from './pages/combos/ComboList'
import ClientList    from './pages/clients/ClientList'
import BookingList   from './pages/bookings/BookingList'
import BookingDetail from './pages/bookings/BookingDetail'
import ScanPage      from './pages/scan/ScanPage'
import ReportsPage   from './pages/reports/ReportsPage'
import LogsPage      from './pages/logs/LogsPage'
import ScanInfoPage  from './pages/public/ScanInfoPage'

function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <span className="spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/items" element={<ItemsList />} />
          <Route path="/combos" element={<ComboList />} />
          <Route path="/clients" element={<ClientList />} />
          <Route path="/bookings" element={<BookingList />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public — no login required, this is what the QR code opens */}
        <Route path="/scan-info/:barcode" element={<ScanInfoPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  )
}
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Auth
import Login from './pages/auth/Login'

// Admin
import AdminLayout from './components/Layout/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Clients from './pages/admin/Clients'
import ClientDetail from './pages/admin/ClientDetail'
import Quotes from './pages/admin/Quotes'
import QuoteDetail from './pages/admin/QuoteDetail'
import Proposals from './pages/admin/Proposals'
import Assets from './pages/admin/Assets'
import Payments from './pages/admin/Payments'
import SEO from './pages/admin/SEO'
import AITools from './pages/admin/AITools'
import Settings from './pages/admin/Settings'

// Public
import Onboarding from './pages/public/Onboarding'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/onboard" element={<Onboarding />} />

        {/* Admin — protected */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="quotes/:id" element={<QuoteDetail />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="assets" element={<Assets />} />
          <Route path="payments" element={<Payments />} />
          <Route path="seo" element={<SEO />} />
          <Route path="ai" element={<AITools />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

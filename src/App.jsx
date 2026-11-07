import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext.jsx'
import RequireAuth from './components/RequireAuth.jsx'

// Public pages
import FoundItemsPage from './pages/FoundItemsPage.jsx'
import ItemDetailPage from './pages/ItemDetailPage.jsx'
import ClaimFormPage from './pages/ClaimFormPage.jsx'
import TrackClaimPage from './pages/TrackClaimPage.jsx'
import ReportFoundItemPage from './pages/ReportFoundItemPage.jsx'

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import ClaimsDashboardPage from './pages/admin/ClaimsDashboardPage.jsx'
import ClaimReviewPage from './pages/admin/ClaimReviewPage.jsx'
import LogItemPage from './pages/admin/LogItemPage.jsx'
import InventoryPage from './pages/admin/InventoryPage.jsx'
import ReturnsPage from './pages/admin/ReturnsPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#0F172A',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#15803D', secondary: '#fff' } },
            error: { iconTheme: { primary: '#B91C1C', secondary: '#fff' } },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<FoundItemsPage />} />
          <Route path="/retrieve" element={<FoundItemsPage />} />
          <Route path="/item/:id" element={<ItemDetailPage />} />
          <Route path="/claim/:itemId" element={<ClaimFormPage />} />
          <Route path="/claim" element={<ClaimFormPage />} />
          <Route path="/track" element={<TrackClaimPage />} />
          <Route path="/log-item" element={<ReportFoundItemPage />} />
          <Route path="/report-item" element={<ReportFoundItemPage />} />

          {/* Admin auth */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin protected routes */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <ClaimsDashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/claims/:id"
            element={
              <RequireAuth>
                <ClaimReviewPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/log-item"
            element={
              <RequireAuth>
                <LogItemPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/items"
            element={
              <RequireAuth>
                <InventoryPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/returns"
            element={
              <RequireAuth>
                <ReturnsPage />
              </RequireAuth>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

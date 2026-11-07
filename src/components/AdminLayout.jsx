import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, PlusSquare, List, ArrowLeftRight,
  LogOut, Menu, X, Search
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { signOut } from '../lib/api.js'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/admin', label: 'Claims', icon: LayoutDashboard, exact: true },
  { to: '/admin/log-item', label: 'Log Item', icon: PlusSquare },
  { to: '/admin/items', label: 'Inventory', icon: List },
  { to: '/admin/returns', label: 'Returns', icon: ArrowLeftRight },
]

export default function AdminLayout({ children }) {
  const { admin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleSignOut = async () => {
    setLoggingOut(true)
    try {
      await signOut()
      navigate('/admin/login')
    } catch {
      toast.error('Sign-out failed. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to
    return location.pathname.startsWith(item.to)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-blue-900 text-white min-h-screen fixed left-0 top-0 bottom-0 z-20">
        {/* Logo */}
        <div className="p-5 border-b border-blue-800">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-500 transition-colors">
              <Search className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Findr: Lost &amp; Found System</div>
              <div className="text-blue-300 text-[11px]">Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors min-h-[44px] ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-blue-800">
          {admin && (
            <div className="text-blue-300 text-xs mb-3 truncate">
              <div className="font-semibold text-white text-sm truncate">{admin.admin_name}</div>
              Office Administrator
            </div>
          )}
          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition-colors min-h-[44px] disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            {loggingOut ? 'Signing out…' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-blue-900 text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-bold text-sm">Findr: Lost &amp; Found System</div>
            <div className="text-blue-300 text-[11px]">Admin Panel</div>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-blue-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="bg-blue-900 border-t border-blue-800 px-3 pb-4">
            <nav className="space-y-1 mt-2" aria-label="Admin navigation">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = isActive(item)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors min-h-[44px] ${
                      active ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
              <button
                onClick={handleSignOut}
                disabled={loggingOut}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition-colors min-h-[44px]"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                {loggingOut ? 'Signing out…' : 'Logout'}
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 pt-[64px] lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}


import { Link, useLocation } from 'react-router-dom'
import { Search, Package, Shield, PlusCircle, PackageSearch } from 'lucide-react'

export default function PublicHeader() {
  const location = useLocation()
  const isRetrievePage = location.pathname === '/' || location.pathname === '/retrieve' || location.pathname.startsWith('/item/') || location.pathname.startsWith('/claim')
  const isReportPage = location.pathname === '/log-item' || location.pathname === '/report-item'
  const isTrackPage = location.pathname === '/track'

  const navLinkStyle = (isActive) =>
    `flex items-center gap-2 text-sm py-2 px-2.5 sm:px-3 transition-colors min-h-[44px] border-b-2 ${
      isActive
        ? 'border-white text-white font-semibold'
        : 'border-transparent text-blue-200 hover:text-white font-medium'
    }`

  return (
    <header className="bg-blue-800 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group min-h-[44px] flex-shrink-0">
          <Search className="w-6 h-6 text-sky-300 group-hover:text-white transition-colors" aria-hidden="true" />
          <div>
            <div className="font-bold text-base sm:text-lg leading-tight">Findr: Lost &amp; Found System</div>
            <div className="text-blue-200 text-xs leading-tight">Student Discipline Office</div>
          </div>
        </Link>

        {/* Navigation Items — Consistent unboxed text styling */}
        <nav className="flex items-center gap-1 sm:gap-4 flex-wrap justify-end" aria-label="Main Navigation">
          {/* Retrieve Lost Item */}
          <Link
            to="/"
            className={navLinkStyle(isRetrievePage)}
            data-fr="FR-003"
          >
            <PackageSearch className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Retrieve Lost Item</span>
            <span className="sm:hidden">Retrieve</span>
          </Link>

          {/* Report Found Item */}
          <Link
            to="/log-item"
            className={navLinkStyle(isReportPage)}
            data-fr="FR-001"
          >
            <PlusCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Report Found Item</span>
            <span className="sm:hidden">Report</span>
          </Link>

          {/* Track Claim */}
          <Link
            to="/track"
            className={navLinkStyle(isTrackPage)}
          >
            <Package className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Track Claim</span>
            <span className="sm:hidden">Track</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm py-6 mt-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} Findr: Lost &amp; Found System — Student Discipline Office</span>
        <Link
          to="/admin/login"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors min-h-[44px] px-2"
        >
          <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          Admin login
        </Link>
      </div>
    </footer>
  )
}


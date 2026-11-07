import { Link, useLocation } from 'react-router-dom'
import { Search, Package, Shield, PlusCircle, PackageSearch } from 'lucide-react'

export default function PublicHeader() {
  const location = useLocation()
  const isRetrievePage = location.pathname === '/' || location.pathname === '/retrieve' || location.pathname.startsWith('/item/') || location.pathname.startsWith('/claim')
  const isReportPage = location.pathname === '/log-item' || location.pathname === '/report-item'
  const isTrackPage = location.pathname === '/track'

  return (
    <header className="bg-blue-800 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group min-h-[44px] flex-shrink-0">
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-500 transition-colors">
            <Search className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <div className="font-bold text-base sm:text-lg leading-tight">Findr: Lost &amp; Found System</div>
            <div className="text-blue-200 text-xs leading-tight">Student Discipline Office</div>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end" aria-label="Main Navigation">
          {/* Retrieve Lost Item */}
          <Link
            to="/"
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-2 rounded-lg transition-colors min-h-[44px] ${
              isRetrievePage
                ? 'bg-blue-900 text-white shadow-inner ring-1 ring-blue-400/40'
                : 'text-blue-100 hover:text-white hover:bg-blue-700'
            }`}
            data-fr="FR-003"
          >
            <PackageSearch className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden md:inline">Retrieve Lost Item</span>
            <span className="md:hidden">Retrieve</span>
          </Link>

          {/* Report Found Item */}
          <Link
            to="/log-item"
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-2 rounded-lg transition-colors min-h-[44px] ${
              isReportPage
                ? 'bg-white text-blue-800 shadow-sm'
                : 'bg-blue-700 hover:bg-blue-600 text-white'
            }`}
            data-fr="FR-001"
          >
            <PlusCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden md:inline">Report Found Item</span>
            <span className="md:hidden">Report</span>
          </Link>

          {/* Track Claim */}
          <Link
            to="/track"
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors px-2.5 sm:px-3 py-2 rounded-lg min-h-[44px] ${
              isTrackPage
                ? 'bg-blue-900 text-white font-semibold shadow-inner ring-1 ring-blue-400/40'
                : 'text-blue-200 hover:text-white hover:bg-blue-700'
            }`}
          >
            <Package className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden md:inline">Track Claim</span>
            <span className="md:hidden">Track</span>
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


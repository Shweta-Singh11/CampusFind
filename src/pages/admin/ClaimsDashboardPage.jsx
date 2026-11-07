import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import { getAdminClaims, getAdminClaimCounts } from '../../lib/api.js'
import AdminLayout from '../../components/AdminLayout.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import Pagination from '../../components/Pagination.jsx'
import { SkeletonRow } from '../../components/Skeletons.jsx'

const STATUSES = ['All', 'Pending', 'Approved', 'Rejected']
const PAGE_SIZE = 20

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function CounterCard({ label, count, color }) {
  return (
    <div className={`card p-4 ${color}`}>
      <div className="text-2xl font-bold">{count ?? '—'}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
    </div>
  )
}

export default function ClaimsDashboardPage() {
  const [claims, setClaims] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [counts, setCounts] = useState(null)

  const debouncedSearch = useDebounce(search, 350)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [result, c] = await Promise.all([
        getAdminClaims({ page, pageSize: PAGE_SIZE, status, search: debouncedSearch }),
        getAdminClaimCounts(),
      ])
      setClaims(result.claims)
      setTotal(result.total)
      setCounts(c)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, status, debouncedSearch])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [status, debouncedSearch])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto" data-fr="FR-005">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Claims Dashboard</h1>

        {/* Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <CounterCard label="Total Claims" count={counts?.All} color="bg-white border border-slate-200 text-slate-900" />
          <CounterCard label="Pending" count={counts?.Pending} color="bg-amber-50 border border-amber-200 text-amber-800" />
          <CounterCard label="Approved" count={counts?.Approved} color="bg-green-50 border border-green-200 text-green-800" />
          <CounterCard label="Rejected" count={counts?.Rejected} color="bg-red-50 border border-red-200 text-red-800" />
        </div>

        {/* Search & Status tabs */}
        <div className="card p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by claim code or claimant name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
                aria-label="Search claims"
              />
            </div>
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 border-b border-slate-200 overflow-x-auto" role="tablist" aria-label="Filter by status">
            {STATUSES.map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={status === s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
                  status === s
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {s}
                {counts && <span className="ml-1.5 text-xs opacity-70">({counts[s] ?? 0})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
            {error}
            <button onClick={load} className="ml-2 underline font-medium">Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_auto_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span>Claim Code</span>
            <span>Item</span>
            <span>Claimant</span>
            <span>Status</span>
            <span />
          </div>

          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : claims.map((claim) => (
              <div
                key={claim.item_claim_id}
                className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_auto_auto] gap-2 md:gap-4 px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center"
              >
                <div>
                  <span className="font-mono font-semibold text-slate-900 text-sm">{claim.claim_code}</span>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {new Date(claim.submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">{claim.item?.item_name}</div>
                  <div className="text-xs text-slate-400">{claim.item?.found_location}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-700">{claim.claimant?.claimant_name}</div>
                  <div className="text-xs text-slate-400">{claim.claimant?.claimant_type} · {claim.claimant?.school_id}</div>
                </div>
                <div className="md:justify-self-center">
                  <StatusBadge status={claim.claim_status} />
                </div>
                <div>
                  <Link
                    to={`/admin/claims/${claim.item_claim_id}`}
                    className="btn-secondary text-sm px-3 py-1.5"
                    aria-label={`Review claim ${claim.claim_code}`}
                  >
                    Review
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))
          }

          {!loading && claims.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="font-medium">No claims found.</p>
              <p className="text-sm mt-1">Try a different filter or search term.</p>
            </div>
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </AdminLayout>
  )
}


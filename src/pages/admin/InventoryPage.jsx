import { useState, useEffect, useCallback } from 'react'
import { Search, Package, CheckCircle, Clock } from 'lucide-react'
import { getAdminItems, getAdminItemPhotoUrl } from '../../lib/api.js'
import AdminLayout from '../../components/AdminLayout.jsx'
import Pagination from '../../components/Pagination.jsx'
import { SkeletonRow } from '../../components/Skeletons.jsx'

const PAGE_SIZE = 20

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function ItemRow({ item }) {
  const [photoUrl, setPhotoUrl] = useState(null)
  const isReturned = item.item_return && item.item_return.length > 0

  useEffect(() => {
    getAdminItemPhotoUrl(item).then(setPhotoUrl)
  }, [item.item_id])

  return (
    <div className="grid grid-cols-[48px_1fr_auto_auto_auto] gap-3 px-5 py-3 border-b border-slate-100 hover:bg-slate-50 items-center">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
        {photoUrl
          ? <img src={photoUrl} alt={item.item_name} className="w-full h-full object-cover" />
          : <Package className="w-5 h-5 text-slate-300 m-auto mt-3.5" aria-hidden="true" />
        }
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 text-sm truncate">{item.item_name}</div>
        <div className="text-xs text-slate-400 truncate">{item.found_location}</div>
        <div className="text-xs text-slate-400">
          {new Date(item.found_datetime).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Category */}
      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap hidden sm:inline">
        {item.category}
      </span>

      {/* High-value badge */}
      {item.is_high_value && (
        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full whitespace-nowrap hidden sm:inline">
          High Value
        </span>
      )}

      {/* Return status */}
      <div className="flex flex-col items-end gap-1">
        {isReturned ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" aria-hidden="true" />
            Returned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" aria-hidden="true" />
            Unclaimed
          </span>
        )}
        <div className="text-[11px] text-slate-400">
          {item.logged_by_admin?.admin_name
            ? `Admin: ${item.logged_by_admin.admin_name}`
            : (item.finder?.finder_name ? `Finder: ${item.finder.finder_name}` : 'Student / Community')}
        </div>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const debouncedSearch = useDebounce(search, 350)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAdminItems({ page, pageSize: PAGE_SIZE, search: debouncedSearch })
      setItems(result.items)
      setTotal(result.total)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto" data-fr="FR-001">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
            <p className="text-slate-500 text-sm">All logged found items — {total} total</p>
          </div>
        </div>

        {/* Search */}
        <div className="card p-4 mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by item name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
              aria-label="Search inventory"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
            {error}
            <button onClick={load} className="ml-2 underline font-medium">Retry</button>
          </div>
        )}

        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[48px_1fr_auto_auto_auto] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span />
            <span>Item</span>
            <span>Category</span>
            <span>Flag</span>
            <span>Status</span>
          </div>

          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            : items.map((item) => <ItemRow key={item.item_id} item={item} />)
          }

          {!loading && items.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
              <p className="font-medium">No items logged yet.</p>
            </div>
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </AdminLayout>
  )
}


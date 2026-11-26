import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { Search, MapPin, Calendar, Lock, Tag, PlusCircle } from 'lucide-react'
import { getPublicFoundItems, getPublicItemPhotoUrl } from '../lib/api.js'
import { SkeletonCard } from '../components/Skeletons.jsx'
import Pagination from '../components/Pagination.jsx'
import PublicHeader, { PublicFooter } from '../components/PublicHeader.jsx'

const CATEGORIES = [
  'All', 'Electronics', 'Wallets & Cards', 'IDs', 'Keys',
  'Bags', 'Clothing', 'Books & Stationery', 'Others'
]

const PAGE_SIZE = 12

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function FoundItemCard({ item }) {
  const isHigh = item.is_high_value

  return (
    <article
      className="card overflow-hidden flex flex-col hover:shadow-card-hover transition-shadow group"
      data-fr="FR-003"
    >
      {/* Image */}
      <div className="relative h-44 bg-blue-50 overflow-hidden">
        {isHigh ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-blue-900/10">
            <Lock className="w-10 h-10 text-blue-300" aria-hidden="true" />
            <span className="text-xs text-blue-400 font-medium">Details hidden</span>
          </div>
        ) : item.photo_path ? (
          <img
            src={getPublicItemPhotoUrl(item.photo_path)}
            alt={item.item_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <Tag className="w-10 h-10 text-slate-300" aria-hidden="true" />
          </div>
        )}
        {isHigh && (
          <div className="absolute top-2 right-2 bg-blue-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Restricted
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-900 text-base leading-snug mb-1 line-clamp-1">
          {item.item_name}
        </h3>

        {isHigh ? (
          <p className="text-slate-500 text-sm mb-3 leading-relaxed flex-1">
            High-value item. Details are hidden to protect the owner.
          </p>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-3 leading-relaxed line-clamp-2 flex-1">
              {item.item_description}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="line-clamp-1">{item.found_location}</span>
            </div>
          </>
        )}

        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span>
            {new Date(item.found_datetime).toLocaleDateString('en-PH', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>

        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full self-start mb-3">
          {item.category}
        </span>

        <Link
          to={`/item/${item.item_id}`}
          className="btn-primary text-sm w-full"
          data-fr="FR-003"
        >
          View & Claim
        </Link>
      </div>
    </article>
  )
}

export default function FoundItemsPage() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const debouncedSearch = useDebounce(search, 350)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getPublicFoundItems({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        category,
      })
      setItems(result.items)
      setTotal(result.total)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, category])

  useEffect(() => {
    load()
  }, [load])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, category])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-16">
        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Found Items</h1>
            <p className="text-slate-500 text-sm mt-1">
              Browse items turned in to the Office.
            </p>
          </div>
          <Link
            to="/log-item"
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors self-start sm:self-auto min-h-[44px]"
            data-fr="FR-001"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" aria-hidden="true" />
            Found an item? Report it
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
              aria-label="Search found items"
            />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field sm:w-52"
            aria-label="Filter by category"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        {!loading && !error && (
          <p className="text-sm text-slate-500 mb-4">
            {total === 0
              ? 'No items found.'
              : `Showing ${items.length} of ${total} item${total !== 1 ? 's' : ''}`}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            <strong>Something went wrong:</strong> {error}
            <button onClick={load} className="ml-3 text-red-700 underline font-medium">
              Try again
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : items.map((item) => <FoundItemCard key={item.item_id} item={item} />)
          }
        </div>

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-700 mb-1">No items found</h2>
            <p className="text-slate-400 text-sm">
              {search || category !== 'All'
                ? 'Try adjusting your search or category filter.'
                : 'No found items have been logged yet. Check back later.'}
            </p>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <PublicFooter />
    </div>
  )
}


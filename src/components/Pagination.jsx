import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 py-4" role="navigation" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost p-2 disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>

      <span className="text-sm text-slate-600 px-2">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost p-2 disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  )
}


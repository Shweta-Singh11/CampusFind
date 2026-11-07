export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3 animate-pulse">
      <div className="skeleton h-40 w-full rounded-lg" />
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100 animate-pulse">
      <div className="skeleton h-5 flex-1" />
      <div className="skeleton h-5 w-24" />
      <div className="skeleton h-5 w-20" />
      <div className="skeleton h-8 w-16 rounded" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Loading…</span>
      </div>
    </div>
  )
}


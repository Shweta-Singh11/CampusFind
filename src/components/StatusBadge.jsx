export default function StatusBadge({ status }) {
  const map = {
    Pending: 'status-badge status-pending',
    Approved: 'status-badge status-approved',
    Rejected: 'status-badge status-rejected',
  }
  const dots = {
    Pending: 'bg-amber-500',
    Approved: 'bg-green-600',
    Rejected: 'bg-red-600',
  }

  return (
    <span className={map[status] ?? 'status-badge bg-slate-100 text-slate-600'}>
      <span className={`w-2 h-2 rounded-full inline-block ${dots[status] ?? 'bg-slate-400'}`} aria-hidden="true" />
      {status}
    </span>
  )
}


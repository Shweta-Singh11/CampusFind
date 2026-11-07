import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const el = dialogRef.current
    if (!el) return
    el.focus()
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto focus:outline-none`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}


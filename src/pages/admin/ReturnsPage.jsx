import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeftRight, Upload, X } from 'lucide-react'
import { getApprovedAwaitingReturn, recordReturn, uploadReturnEvidence } from '../../lib/api.js'
import AdminLayout from '../../components/AdminLayout.jsx'
import Modal from '../../components/Modal.jsx'
import Pagination from '../../components/Pagination.jsx'
import { SkeletonRow } from '../../components/Skeletons.jsx'
import toast from 'react-hot-toast'

const PAGE_SIZE = 20
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024

function RecordReturnModal({ isOpen, onClose, claim, onDone }) {
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [evidencePreview, setEvidencePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!isOpen) { setEvidenceFile(null); setEvidencePreview(null) }
  }, [isOpen])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error('Only JPG, PNG, or WebP allowed.'); return }
    if (file.size > MAX_FILE_SIZE) { toast.error('File must be 5 MB or smaller.'); return }
    setEvidenceFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setEvidencePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      let path = null
      if (evidenceFile) {
        path = await uploadReturnEvidence(evidenceFile)
      }
      await recordReturn(claim.item_claim_id, path)
      toast.success('Return recorded successfully.')
      onClose()
      onDone()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!claim) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Item Return" size="md">
      <div className="space-y-4" data-fr="FR-005">
        {/* Claim summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1 text-sm">
          <div><strong className="text-blue-800">Item:</strong> {claim.item?.item_name}</div>
          <div><strong className="text-blue-800">Claimant:</strong> {claim.claimant?.claimant_name}</div>
          <div><strong className="text-blue-800">School ID:</strong> {claim.claimant?.school_id}</div>
          <div><strong className="text-blue-800">Contact:</strong> {claim.claimant?.claimant_contact_no}</div>
          <div><strong className="text-blue-800">Claim code:</strong> <span className="font-mono">{claim.claim_code}</span></div>
        </div>

        {/* Evidence upload */}
        <div>
          <label className="label">Return evidence photo <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="sr-only"
            id="returnEvidence"
          />
          {evidencePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              <img src={evidencePreview} alt="Return evidence" className="w-full max-h-40 object-contain bg-slate-50" />
              <button
                type="button"
                onClick={() => { setEvidenceFile(null); setEvidencePreview(null); if (fileRef.current) fileRef.current.value = '' }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Remove evidence photo"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 text-center transition-colors min-h-[44px]"
            >
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" aria-hidden="true" />
              <span className="text-sm text-slate-500">Upload return evidence</span>
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Recording…
              </span>
            ) : 'Confirm Return'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ReturnsPage() {
  const [claims, setClaims] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getApprovedAwaitingReturn({ page, pageSize: PAGE_SIZE })
      setClaims(result.claims)
      setTotal(result.total)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const openModal = (claim) => { setSelected(claim); setShowModal(true) }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto" data-fr="FR-005">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Returns</h1>
        <p className="text-slate-500 text-sm mb-6">
          Approved claims awaiting item collection — {total} pending
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
            {error}
            <button onClick={load} className="ml-2 underline font-medium">Retry</button>
          </div>
        )}

        <div className="card overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <span>Item</span>
            <span>Claimant</span>
            <span>Approved On</span>
            <span />
          </div>

          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : claims.map((claim) => (
              <div
                key={claim.item_claim_id}
                className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-4 border-b border-slate-100 hover:bg-slate-50 items-center"
              >
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{claim.item?.item_name}</div>
                  <div className="text-xs text-slate-400">{claim.item?.found_location}</div>
                  <div className="font-mono text-xs text-slate-400 mt-0.5">{claim.claim_code}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-700">{claim.claimant?.claimant_name}</div>
                  <div className="text-xs text-slate-400">{claim.claimant?.school_id}</div>
                </div>
                <div className="text-sm text-slate-500">
                  {claim.reviewed_at
                    ? new Date(claim.reviewed_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </div>
                <button
                  onClick={() => openModal(claim)}
                  className="btn-primary text-sm px-4"
                >
                  <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
                  Record Return
                </button>
              </div>
            ))
          }

          {!loading && claims.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
              <p className="font-medium">No pending returns.</p>
              <p className="text-sm mt-1">All approved claims have been returned.</p>
            </div>
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <RecordReturnModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        claim={selected}
        onDone={load}
      />
    </AdminLayout>
  )
}


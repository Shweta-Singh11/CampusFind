import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, User, MapPin, Calendar, FileText,
  Image as ImageIcon, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import {
  getAdminClaimById, getAdminItemPhotoUrl, getClaimProofPhotoUrl,
  reviewClaim
} from '../../lib/api.js'
import AdminLayout from '../../components/AdminLayout.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import Modal from '../../components/Modal.jsx'
import { PageLoader } from '../../components/Skeletons.jsx'
import toast from 'react-hot-toast'

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right">{value}</span>
    </div>
  )
}

function ApproveConfirmModal({ isOpen, onClose, onConfirm, claim, confirming }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Approval" size="sm">
      <div className="space-y-4" data-fr="B-09">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="font-semibold">Approving this claim</span>
          </div>
          {claim && (
            <div className="text-sm text-green-700 space-y-1 ml-7">
              <div><strong>Claimant:</strong> {claim.claimant?.claimant_name}</div>
              <div><strong>School ID:</strong> {claim.claimant?.school_id}</div>
              <div><strong>Item:</strong> {claim.item?.item_name}</div>
            </div>
          )}
        </div>
        <p className="text-sm text-slate-600">
          Once approved, this claimant can collect the item from the office. This action will also reject all other pending claims for this item.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={confirming}>Cancel</button>
          <button onClick={onConfirm} disabled={confirming} className="btn-primary flex-1 bg-green-700 hover:bg-green-800">
            {confirming ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Approving…
              </span>
            ) : 'Confirm Approval'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function RejectModal({ isOpen, onClose, onConfirm, claimCode, confirming }) {
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')

  const handleConfirm = () => {
    if (!reason.trim()) { setErr('A reason is required to reject a claim.'); return }
    onConfirm(reason.trim())
  }

  useEffect(() => { if (!isOpen) { setReason(''); setErr('') } }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Claim" size="sm">
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-start">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-red-800">Rejecting claim</p>
            <p className="text-xs text-red-600 font-mono">{claimCode}</p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="rejectReason">
            Reason for rejection <span className="required-star" aria-hidden="true">*</span>
          </label>
          <textarea
            id="rejectReason"
            rows={4}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setErr('') }}
            className={`input-field resize-none ${err ? 'input-error' : ''}`}
            placeholder="Explain why the claim is being rejected…"
            aria-required="true"
            aria-invalid={!!err}
          />
          {err && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" aria-hidden="true" />{err}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={confirming}>Cancel</button>
          <button onClick={handleConfirm} disabled={confirming} className="btn-danger flex-1">
            {confirming ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Rejecting…
              </span>
            ) : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ClaimReviewPage() {
  const { id } = useParams()
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [itemPhotoUrl, setItemPhotoUrl] = useState(null)
  const [proofPhotoUrl, setProofPhotoUrl] = useState(null)

  const [showApprove, setShowApprove] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function loadClaim() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminClaimById(id)
      setClaim(data)
      // Load photos
      const [ip, pp] = await Promise.all([
        getAdminItemPhotoUrl(data.item),
        getClaimProofPhotoUrl(data.evidence_picture_path),
      ])
      setItemPhotoUrl(ip)
      setProofPhotoUrl(pp)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadClaim() }, [id])

  const handleApprove = async () => {
    setConfirming(true)
    try {
      await reviewClaim(parseInt(id), 'Approved')
      toast.success('Claim approved successfully.')
      setShowApprove(false)
      loadClaim()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setConfirming(false)
    }
  }

  const handleReject = async (reason) => {
    setConfirming(true)
    try {
      await reviewClaim(parseInt(id), 'Rejected', reason)
      toast.success('Claim rejected.')
      setShowReject(false)
      loadClaim()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setConfirming(false)
    }
  }

  const isPending = claim?.claim_status === 'Pending'
  const isAlreadyReturned = !!claim?.item_return?.item_return_id

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto pb-32" data-fr="B-01">
        {/* Back link */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium text-sm mb-5 min-h-[44px]"
          data-fr="B-01"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Claims
        </Link>

        {loading && <PageLoader />}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>
        )}

        {claim && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Claim Review
                </h1>
                <p className="font-mono text-slate-500 text-sm">{claim.claim_code}</p>
              </div>
              <StatusBadge status={claim.claim_status} />
            </div>

            {/* Item photo */}
            <div className="card overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-3">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" aria-hidden="true" />
                  Item Photo (Admin View)
                </h2>
              </div>
              <div className="p-5">
                {itemPhotoUrl ? (
                  <img
                    src={itemPhotoUrl}
                    alt={`Photo of ${claim.item?.item_name}`}
                    className="w-full max-h-72 object-contain rounded-xl bg-slate-50"
                  />
                ) : (
                  <div className="h-32 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400 text-sm">
                    No photo available
                  </div>
                )}
              </div>
            </div>

            {/* Item Details */}
            <div className="card overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-3">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  Item Details
                </h2>
              </div>
              <div className="px-5 py-2">
                <InfoRow label="Item name" value={claim.item?.item_name} />
                <InfoRow label="Category" value={claim.item?.category} />
                <InfoRow label="High value" value={claim.item?.is_high_value ? 'Yes' : 'No'} />
                <InfoRow label="Found at" value={claim.item?.found_location} />
                <InfoRow
                  label="Found on"
                  value={claim.item?.found_datetime
                    ? new Date(claim.item.found_datetime).toLocaleString('en-PH')
                    : null}
                />
                <InfoRow label="Description" value={claim.item?.item_description} />
                <InfoRow label="Finder" value={claim.item?.finder?.finder_name ?? 'Anonymous'} />
              </div>
            </div>

            {/* Claimant Details */}
            <div className="card overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-3">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <User className="w-4 h-4" aria-hidden="true" />
                  Claimant Information
                </h2>
              </div>
              <div className="px-5 py-2">
                <InfoRow label="Name" value={claim.claimant?.claimant_name} />
                <InfoRow label="Type" value={claim.claimant?.claimant_type} />
                <InfoRow label="School ID" value={claim.claimant?.school_id} />
                <InfoRow label="Contact" value={claim.claimant?.claimant_contact_no} />
                <InfoRow label="Course/Year/Section" value={claim.claimant?.cys} />
                <InfoRow label="Department" value={claim.claimant?.department} />
                <InfoRow
                  label="Submitted"
                  value={claim.submitted_at
                    ? new Date(claim.submitted_at).toLocaleString('en-PH')
                    : null}
                />
                <InfoRow label="Lost location" value={claim.lost_location} />
              </div>
            </div>

            {/* Proof of Ownership */}
            <div className="card overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-3">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  Proof of Ownership
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {claim.evidence_statement ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Written Statement</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {claim.evidence_statement}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No written statement provided.</p>
                )}

                {proofPhotoUrl && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Proof Photo</p>
                    <img
                      src={proofPhotoUrl}
                      alt="Claimant's proof photo"
                      className="w-full max-h-72 object-contain rounded-xl bg-slate-50 border border-slate-200"
                    />
                  </div>
                )}

                {!claim.evidence_statement && !proofPhotoUrl && (
                  <p className="text-sm text-slate-400">No proof provided.</p>
                )}
              </div>
            </div>

            {/* Review Info */}
            {!isPending && (
              <div className="card p-5">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Review Record</h2>
                <InfoRow label="Decision" value={claim.claim_status} />
                <InfoRow label="Reviewed by" value={claim.reviewed_by_admin?.admin_name} />
                <InfoRow
                  label="Reviewed on"
                  value={claim.reviewed_at ? new Date(claim.reviewed_at).toLocaleString('en-PH') : null}
                />
                {claim.rejection_reason && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                    <strong>Rejection reason:</strong> {claim.rejection_reason}
                  </div>
                )}
              </div>
            )}

            {isAlreadyReturned && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                ✓ This item has been returned to the claimant.
              </div>
            )}
          </div>
        )}

        {/* Sticky action bar (B-01) */}
        {claim && isPending && !isAlreadyReturned && (
          <div className="fixed bottom-0 left-0 right-0 lg:left-60 bg-white border-t border-slate-200 p-4 shadow-lg z-20" data-fr="B-01">
            <div className="max-w-4xl mx-auto flex gap-3 justify-end">
              <button
                onClick={() => setShowReject(true)}
                className="btn-danger flex-1 sm:flex-none sm:min-w-[140px]"
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
                Reject
              </button>
              <button
                onClick={() => setShowApprove(true)}
                className="btn-primary flex-1 sm:flex-none sm:min-w-[140px] bg-green-700 hover:bg-green-800"
              >
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                Approve
              </button>
            </div>
          </div>
        )}
      </div>

      <ApproveConfirmModal
        isOpen={showApprove}
        onClose={() => setShowApprove(false)}
        onConfirm={handleApprove}
        claim={claim}
        confirming={confirming}
      />
      <RejectModal
        isOpen={showReject}
        onClose={() => setShowReject(false)}
        onConfirm={handleReject}
        claimCode={claim?.claim_code}
        confirming={confirming}
      />
    </AdminLayout>
  )
}


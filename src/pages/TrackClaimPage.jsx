import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Search, ArrowRight, ChevronRight } from 'lucide-react'
import { trackClaim } from '../lib/api.js'
import StatusBadge from '../components/StatusBadge.jsx'
import PublicHeader, { PublicFooter } from '../components/PublicHeader.jsx'

export default function TrackClaimPage() {
  const [claimCode, setClaimCode] = useState('')
  const [contactNo, setContactNo] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!claimCode.trim()) errs.claimCode = 'Claim code is required.'
    if (!contactNo.trim()) errs.contactNo = 'Contact number is required.'
    return errs
  }

  const handleTrack = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await trackClaim(claimCode.trim().toUpperCase(), contactNo.trim())
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isRejected = result?.claim_status === 'Rejected'

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 pb-16">
        <div className="text-center mb-8">
          <div className="bg-blue-100 p-3 rounded-2xl inline-block mb-3">
            <Search className="w-7 h-7 text-blue-700" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Track My Claim</h1>
          <p className="text-slate-500 text-sm mt-1">
            Enter your claim code and contact number to check the status.
          </p>
        </div>

        <div className="card p-5 mb-6" data-fr="FR-005">
          <form onSubmit={handleTrack} noValidate className="space-y-4">
            <div>
              <label className="label" htmlFor="trackCode">
                Claim code <span className="required-star" aria-hidden="true">*</span>
              </label>
              <input
                id="trackCode"
                type="text"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                className={`input-field font-mono ${errors.claimCode ? 'input-error' : ''}`}
                placeholder="CLM-XXXXXX"
                aria-required="true"
                aria-invalid={!!errors.claimCode}
                autoComplete="off"
                spellCheck={false}
              />
              {errors.claimCode && <p className="text-red-600 text-xs mt-1">{errors.claimCode}</p>}
            </div>

            <div>
              <label className="label" htmlFor="trackContact">
                Contact number <span className="required-star" aria-hidden="true">*</span>
              </label>
              <input
                id="trackContact"
                type="tel"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                className={`input-field ${errors.contactNo ? 'input-error' : ''}`}
                placeholder="09XXXXXXXXX"
                aria-required="true"
                aria-invalid={!!errors.contactNo}
                autoComplete="tel"
              />
              {errors.contactNo && <p className="text-red-600 text-xs mt-1">{errors.contactNo}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching…
                </span>
              ) : (
                <>
                  <Search className="w-4 h-4" aria-hidden="true" />
                  Track Claim
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="card p-5 space-y-4" data-fr="FR-005">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Claim code</p>
                <p className="font-mono font-bold text-slate-900 text-lg">{result.claim_code}</p>
              </div>
              <StatusBadge status={result.claim_status} />
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Item</span>
                <span className="font-medium text-slate-900 text-right">{result.item_name}</span>
              </div>
              {result.submitted_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Submitted</span>
                  <span className="text-slate-700">
                    {new Date(result.submitted_at).toLocaleDateString('en-PH', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {result.reviewed_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Reviewed</span>
                  <span className="text-slate-700">
                    {new Date(result.reviewed_at).toLocaleDateString('en-PH', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Pending info */}
            {result.claim_status === 'Pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                Your claim is under review. An administrator will process it soon.
              </div>
            )}

            {/* Approved info */}
            {result.claim_status === 'Approved' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                Your claim has been approved! Please visit the Office to collect your item.
              </div>
            )}

            {/* Rejected: show reason + resubmit (B-08) */}
            {isRejected && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-3" data-fr="B-08">
                <p className="text-sm font-semibold text-red-800">Your claim was not approved.</p>
                {result.rejection_reason && (
                  <div>
                    <p className="text-xs text-red-600 font-medium mb-1">Reason from administrator:</p>
                    <p className="text-sm text-red-700 leading-relaxed">{result.rejection_reason}</p>
                  </div>
                )}
                <Link
                  to={`/claim/${result.item_id}`}
                  className="btn-primary w-full text-sm"
                  state={{ prefill: { ...result, contactNo } }}
                >
                  Resubmit Claim
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}


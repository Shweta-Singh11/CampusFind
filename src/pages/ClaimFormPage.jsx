import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Upload, X, Info, Camera, User, Edit2 } from 'lucide-react'
import { getPublicItemById, submitClaim, uploadClaimProofPhoto } from '../lib/api.js'
import Modal from '../components/Modal.jsx'
import PublicHeader, { PublicFooter } from '../components/PublicHeader.jsx'
import { PageLoader } from '../components/Skeletons.jsx'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'sdo_claimant_details'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function HighValueTooltip() {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
        className="text-blue-500 hover:text-blue-700 focus:outline-none min-h-[24px] min-w-[24px] inline-flex items-center"
        aria-label="What is a high-value item?"
        data-fr="B-07"
      >
        <Info className="w-4 h-4" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute z-10 left-0 top-6 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs text-slate-700 leading-relaxed">
          High-value items include: phones, laptops, wallets, IDs, cards, jewelry, cash, or items worth ₱1,000+.
        </div>
      )}
    </span>
  )
}

function SuccessModal({ isOpen, claimCode, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Claim Submitted!" size="sm">
      <div className="text-center space-y-4" data-fr="FR-005">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-slate-700 text-sm mb-2">Your claim has been submitted successfully.</p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-600 font-medium mb-1">Your Claim Code</p>
            <p className="text-2xl font-bold text-blue-800 tracking-wider font-mono">{claimCode}</p>
          </div>
          <p className="text-xs text-slate-400 mt-2">Save this code to track your claim status.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
          Status: <strong>Pending</strong> — An administrator will review your claim.
        </div>
        <div className="flex gap-2">
          <Link to="/track" className="btn-secondary text-sm flex-1" onClick={onClose}>
            Track this claim
          </Link>
          <Link to="/" className="btn-primary text-sm flex-1" onClick={onClose}>
            Done
          </Link>
        </div>
      </div>
    </Modal>
  )
}

export default function ClaimFormPage() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [item, setItem] = useState(null)
  const [itemLoading, setItemLoading] = useState(!!itemId)
  const [itemError, setItemError] = useState(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [contactNo, setContactNo] = useState('')
  const [claimantType, setClaimantType] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [cys, setCys] = useState('')
  const [department, setDepartment] = useState('')
  const [lostLocation, setLostLocation] = useState('')
  const [statement, setStatement] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [savedDetails, setSavedDetails] = useState(null)
  const [editingDetails, setEditingDetails] = useState(false)

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [claimCode, setClaimCode] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileRef = useRef(null)

  // Load saved details (B-05) and prefill from resubmission (B-08)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSavedDetails(parsed)
        setFullName(parsed.fullName || '')
        setContactNo(parsed.contactNo || '')
        setClaimantType(parsed.claimantType || '')
        setSchoolId(parsed.schoolId || '')
        setCys(parsed.cys || '')
        setDepartment(parsed.department || '')
        setRememberMe(true)
      }
    } catch {}

    // Check if navigated from /track with prefill
    if (location.state?.prefill) {
      const p = location.state.prefill
      if (p.contactNo) setContactNo(p.contactNo)
      if (p.claimant_name) setFullName(p.claimant_name)
      if (p.school_id) setSchoolId(p.school_id)
      if (p.claimant_type) setClaimantType(p.claimant_type)
      if (p.cys) setCys(p.cys)
      if (p.department) setDepartment(p.department)
      if (p.lost_location) setLostLocation(p.lost_location)
    }
  }, [location.state])

  // Load item from route
  useEffect(() => {
    if (!itemId) { setItemLoading(false); return }
    async function load() {
      try {
        const data = await getPublicItemById(itemId)
        setItem(data)
      } catch (e) {
        setItemError(e.message)
      } finally {
        setItemLoading(false)
      }
    }
    load()
  }, [itemId])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, proofFile: 'Only JPG, PNG, or WebP images are allowed.' }))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, proofFile: 'File must be 5 MB or smaller.' }))
      return
    }
    setProofFile(file)
    setErrors((prev) => { const n = { ...prev }; delete n.proofFile; return n })
    const reader = new FileReader()
    reader.onload = (ev) => setProofPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errs = {}
    if (!fullName.trim()) errs.fullName = 'Full name is required.'
    if (!contactNo.trim()) errs.contactNo = 'Contact number is required.'
    else if (!/^[\d+\-\s]{7,13}$/.test(contactNo.trim())) errs.contactNo = 'Enter a valid contact number (7–13 digits).'
    if (!claimantType) errs.claimantType = 'Please select your type.'
    if (!schoolId.trim()) errs.schoolId = 'College ID is required.'
    if (!item) errs.item = 'No item selected to claim.'
    if (!statement.trim() && !proofFile) {
      errs.proof = 'Please provide at least one form of proof: a written statement or a photo.'
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const firstErr = document.querySelector('[aria-invalid="true"]')
      firstErr?.focus()
      return
    }

    setSubmitting(true)
    try {
      let evidencePicturePath = null
      if (proofFile) {
        evidencePicturePath = await uploadClaimProofPhoto(proofFile)
      }

      const payload = {
        p_item_id: parseInt(itemId),
        p_claimant_name: fullName.trim(),
        p_claimant_contact_no: contactNo.trim(),
        p_claimant_type: claimantType,
        p_school_id: schoolId.trim(),
        p_cys: cys.trim() || null,
        p_department: department.trim() || null,
        p_lost_location: lostLocation.trim() || null,
        p_evidence_statement: statement.trim() || null,
        p_evidence_picture_path: evidencePicturePath,
      }

      const code = await submitClaim(payload)
      setClaimCode(code)
      setShowSuccess(true)

      // Save details if checked
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          fullName, contactNo, claimantType, schoolId, cys, department,
        }))
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isFormValid = () => {
    return !!(
      fullName.trim() &&
      contactNo.trim() &&
      claimantType &&
      schoolId.trim() &&
      item &&
      (statement.trim() || proofFile)
    )
  }

  const clearSavedDetails = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSavedDetails(null)
    setEditingDetails(true)
    setFullName(''); setContactNo(''); setClaimantType('')
    setSchoolId(''); setCys(''); setDepartment('')
    setRememberMe(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 pb-24">
        <Link to={itemId ? `/item/${itemId}` : '/'} className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium text-sm mb-5 min-h-[44px]">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {item ? `Back to ${item.item_name}` : 'Back to Found Items'}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Claim an Item</h1>
        <p className="text-slate-500 text-sm mb-6">Fill in your details and provide proof of ownership.</p>

        {/* Item chip */}
        {itemLoading && <div className="skeleton h-14 rounded-xl mb-5" />}
        {itemError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 text-sm">
            Could not load item: {itemError}
          </div>
        )}
        {!itemLoading && !item && !itemError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800" data-fr="B-04">
            No item selected. Please return to the{' '}
            <Link to="/" className="underline font-medium">Found Items list</Link>{' '}
            and select an item to claim.
          </div>
        )}
        {item && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex items-center gap-3" data-fr="B-04">
            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0">
              Item
            </div>
            <div>
              <div className="font-semibold text-blue-900 text-sm">{item.item_name}</div>
              <div className="text-blue-600 text-xs">
                Found: {new Date(item.found_datetime).toLocaleDateString('en-PH', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </div>
            </div>
          </div>
        )}

        {/* Saved details banner (B-05) */}
        {savedDetails && !editingDetails && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex items-center justify-between" data-fr="B-05">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Details prefilled</span> from your last claim.
            </div>
            <button
              type="button"
              onClick={() => setEditingDetails(true)}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium min-h-[44px] px-2"
            >
              <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
              Edit
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5" data-fr="FR-004">
          {/* Personal Info */}
          <fieldset className="card p-4 space-y-4">
            <legend className="text-sm font-bold text-slate-700 mb-2 px-1 flex items-center gap-1">
              <User className="w-4 h-4" aria-hidden="true" />
              Your Information
            </legend>

            <div>
              <label className="label" htmlFor="fullName">
                Full name <span className="required-star" aria-hidden="true">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`input-field ${errors.fullName ? 'input-error' : ''}`}
                aria-required="true"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-err' : undefined}
                placeholder="e.g., Maria Santos"
                autoComplete="name"
              />
              {errors.fullName && <p id="fullName-err" className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="label" htmlFor="contactNo">
                Contact number <span className="required-star" aria-hidden="true">*</span>
              </label>
              <input
                id="contactNo"
                type="tel"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                className={`input-field ${errors.contactNo ? 'input-error' : ''}`}
                aria-required="true"
                aria-invalid={!!errors.contactNo}
                aria-describedby={errors.contactNo ? 'contactNo-err' : undefined}
                placeholder="09XXXXXXXXX"
                autoComplete="tel"
              />
              {errors.contactNo && <p id="contactNo-err" className="text-red-600 text-xs mt-1">{errors.contactNo}</p>}
            </div>

            <div>
              <label className="label" htmlFor="claimantType">
                Type <span className="required-star" aria-hidden="true">*</span>
              </label>
              <select
                id="claimantType"
                value={claimantType}
                onChange={(e) => setClaimantType(e.target.value)}
                className={`input-field ${errors.claimantType ? 'input-error' : ''}`}
                aria-required="true"
                aria-invalid={!!errors.claimantType}
              >
                <option value="">Select your type</option>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
              </select>
              {errors.claimantType && <p className="text-red-600 text-xs mt-1">{errors.claimantType}</p>}
            </div>

            <div>
              <label className="label" htmlFor="schoolId">
                College ID <span className="required-star" aria-hidden="true">*</span>
              </label>
              <input
                id="schoolId"
                type="text"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className={`input-field ${errors.schoolId ? 'input-error' : ''}`}
                aria-required="true"
                aria-invalid={!!errors.schoolId}
                placeholder="e.g., 2021-00001"
              />
              {errors.schoolId && <p className="text-red-600 text-xs mt-1">{errors.schoolId}</p>}
            </div>

            <div>
              <label className="label" htmlFor="cys">Course, Year &amp; Section <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                id="cys"
                type="text"
                value={cys}
                onChange={(e) => setCys(e.target.value)}
                className="input-field"
                placeholder="e.g., BSIT 3-A"
              />
            </div>

            <div>
              <label className="label" htmlFor="department">Department <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="input-field"
                placeholder="e.g., College of Engineering"
              />
            </div>

            {/* Remember me (B-05) */}
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]" data-fr="B-05">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Remember my details on this device</span>
            </label>
            {savedDetails && (
              <button type="button" onClick={clearSavedDetails} className="text-xs text-red-500 hover:text-red-700 underline min-h-[44px] px-1">
                Clear saved details
              </button>
            )}
          </fieldset>

          {/* Claim Details */}
          <fieldset className="card p-4 space-y-4">
            <legend className="text-sm font-bold text-slate-700 mb-2 px-1">Claim Details</legend>

            <div>
              <label className="label" htmlFor="lostLocation">
                Where did you lose it? <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="lostLocation"
                type="text"
                value={lostLocation}
                onChange={(e) => setLostLocation(e.target.value)}
                className="input-field"
                placeholder="e.g., Near the library entrance"
              />
            </div>
          </fieldset>

          {/* Proof of Ownership */}
          <fieldset className="card p-4 space-y-4">
            <legend className="text-sm font-bold text-slate-700 mb-1 px-1">
              Proof of Ownership <span className="required-star" aria-hidden="true">*</span>
            </legend>
            <p className="text-xs text-slate-500 -mt-2">Provide at least one: a written statement or a photo.</p>

            {errors.proof && (
              <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg p-2">{errors.proof}</p>
            )}

            {/* Statement */}
            <div>
              <label className="label" htmlFor="statement">Written statement</label>
              <textarea
                id="statement"
                rows={4}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                className="input-field resize-none"
                placeholder="Describe the item in detail — color, brand, markings, what was inside it, etc."
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="label">Proof photo</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
                id="proofFile"
                aria-label="Upload proof photo"
              />
              {proofPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={proofPreview} alt="Proof preview" className="w-full max-h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setProofFile(null); setProofPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center transition-colors min-h-[44px]"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" aria-hidden="true" />
                  <span className="text-sm text-slate-500">Click to upload photo</span>
                  <span className="block text-xs text-slate-400 mt-1">JPG, PNG, WebP — max 5 MB</span>
                </button>
              )}
              {errors.proofFile && <p className="text-red-600 text-xs mt-1">{errors.proofFile}</p>}
            </div>
          </fieldset>

          {/* Submit */}
          <div className="pb-6">
            <button
              type="submit"
              disabled={!isFormValid() || submitting || !item}
              className="btn-primary w-full text-base"
              data-fr="FR-004"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : 'Submit Claim'}
            </button>
            {!isFormValid() && (
              <p className="text-xs text-slate-400 text-center mt-2">
                Fill in all required fields and add at least one proof to submit.
              </p>
            )}
          </div>
        </form>
      </main>

      <SuccessModal
        isOpen={showSuccess}
        claimCode={claimCode}
        onClose={() => { setShowSuccess(false); navigate('/') }}
      />

      <PublicFooter />
    </div>
  )
}


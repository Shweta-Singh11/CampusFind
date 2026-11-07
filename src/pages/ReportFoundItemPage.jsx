import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Upload, X, Info, Calendar, MapPin, CheckCircle, ArrowLeft, HeartHandshake } from 'lucide-react'
import { logFoundItem, uploadItemPhoto } from '../lib/api.js'
import PublicHeader, { PublicFooter } from '../components/PublicHeader.jsx'
import Modal from '../components/Modal.jsx'
import toast from 'react-hot-toast'

const CATEGORIES = ['Electronics', 'Wallets & Cards', 'IDs', 'Keys', 'Bags', 'Clothing', 'Books & Stationery', 'Others']
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024

function HighValueTooltip() {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block ml-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
        className="text-blue-500 hover:text-blue-700 focus:outline-none min-h-[24px] inline-flex items-center"
        aria-label="What qualifies as a high-value item?"
        data-fr="B-07"
      >
        <Info className="w-4 h-4" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute z-10 left-0 top-6 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs text-slate-700 leading-relaxed">
          High-value items include: phones, laptops, wallets, IDs, cards, jewelry, cash, or items worth ₱1,000+.
          These items have their photo and specific location hidden on the public list to protect the rightful owner.
        </div>
      )}
    </span>
  )
}

function SuccessModal({ isOpen, onClose, itemName, isHighValue }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Item Successfully Reported!" size="md">
      <div className="text-center space-y-4" data-fr="FR-001">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">{itemName}</h3>
          <p className="text-slate-600 text-sm mt-1">
            Thank you for helping our school community! This item is now listed in the public directory so the owner can submit a claim.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 text-left space-y-1">
          <p className="font-semibold">Next Step:</p>
          <p>
            Please surrender the found item to the <strong>Student Discipline Office (Room 102)</strong> during regular school hours if you have not already done so.
          </p>
          {isHighValue && (
            <p className="text-amber-800 font-medium pt-1">
              Note: Because this is a high-value item, photos and details are shielded from the public list for security.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 text-sm"
          >
            Report Another
          </button>
          <Link
            to="/"
            className="btn-primary flex-1 text-sm text-center"
          >
            View Public List
          </Link>
        </div>
      </div>
    </Modal>
  )
}

export default function ReportFoundItemPage() {
  const navigate = useNavigate()

  // Form fields
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [foundDatetime, setFoundDatetime] = useState('')
  const [isHighValue, setIsHighValue] = useState(false)
  const [finderName, setFinderName] = useState('')
  const [finderContact, setFinderContact] = useState('')

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [reportedItemName, setReportedItemName] = useState('')

  const fileRef = useRef(null)
  const videoRef = useRef(null)
  const [showCam, setShowCam] = useState(false)
  const [stream, setStream] = useState(null)

  const nowMax = () => {
    const d = new Date()
    d.setSeconds(0, 0)
    return d.toISOString().slice(0, 16)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((p) => ({ ...p, photo: 'Only JPG, PNG, or WebP images are allowed.' }))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((p) => ({ ...p, photo: 'File must be 5 MB or smaller.' }))
      return
    }
    setPhotoFile(file)
    setErrors((p) => { const n = { ...p }; delete n.photo; return n })
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(s)
      setShowCam(true)
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s }, 100)
    } catch {
      toast.error('Camera access is unavailable. Please upload a photo instead.')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setPhotoFile(file)
      setPhotoPreview(canvas.toDataURL('image/jpeg'))
      stopCamera()
    }, 'image/jpeg', 0.9)
  }

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop())
    setStream(null)
    setShowCam(false)
  }

  const validate = () => {
    const errs = {}
    if (!photoFile) errs.photo = 'A photo is required so the owner can identify the item.'
    if (!itemName.trim()) errs.itemName = 'Item name is required.'
    if (!category) errs.category = 'Please select a category.'
    if (!description.trim()) errs.description = 'Description is required.'
    if (!location.trim()) errs.location = 'Found location is required.'
    if (!foundDatetime) errs.foundDatetime = 'Date and time found is required.'
    else if (new Date(foundDatetime) > new Date()) errs.foundDatetime = 'Found date and time cannot be in the future.'
    if (finderContact && !/^[\d+\-\s]{7,13}$/.test(finderContact.trim())) {
      errs.finderContact = 'Enter a valid contact number (7–13 digits).'
    }
    return errs
  }

  const resetForm = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setItemName('')
    setCategory('')
    setDescription('')
    setLocation('')
    setFoundDatetime('')
    setIsHighValue(false)
    setFinderName('')
    setFinderContact('')
    setErrors({})
    setShowSuccess(false)
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
      const photoPath = await uploadItemPhoto(photoFile, isHighValue)
      await logFoundItem({
        p_item_name: itemName.trim(),
        p_category: category,
        p_item_description: description.trim(),
        p_item_picture_path: photoPath,
        p_found_location: location.trim(),
        p_found_datetime: new Date(foundDatetime).toISOString(),
        p_is_high_value: isHighValue,
        p_finder_name: finderName.trim() || null,
        p_finder_contact_no: finderContact.trim() || null,
      })
      setReportedItemName(itemName.trim())
      setShowSuccess(true)
    } catch (err) {
      toast.error(err.message || 'Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isFormValid = () =>
    !!(photoFile && itemName.trim() && category && description.trim() && location.trim() && foundDatetime)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium text-sm mb-4 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Found Items
        </Link>

        {/* Intro Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-white/15 p-2 rounded-xl flex-shrink-0 mt-0.5">
              <HeartHandshake className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Report a Found Item</h1>
              <p className="text-blue-100 text-sm mt-1 leading-relaxed">
                Found something on campus? Fill out this form to add it to the public directory so the rightful owner can claim it.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5" data-fr="FR-001">
          {/* Photo Section */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
              Item Photo <span className="required-star" aria-hidden="true">*</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Take or upload a clear photo of the found item.
            </p>

            {showCam ? (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-xl bg-black max-h-72 object-contain"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={capturePhoto} className="btn-primary flex-1">
                    <Camera className="w-4 h-4" aria-hidden="true" />
                    Capture Photo
                  </button>
                  <button type="button" onClick={stopCamera} className="btn-secondary">Cancel</button>
                </div>
              </div>
            ) : photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={photoPreview}
                  alt="Item preview"
                  className="w-full max-h-64 object-contain bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Remove photo"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                  id="studentItemPhoto"
                  aria-label="Upload item photo"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center transition-colors min-h-[44px]"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" aria-hidden="true" />
                  <span className="text-sm font-medium text-slate-700">Click to upload photo</span>
                  <span className="block text-xs text-slate-400 mt-1">JPG, PNG, WebP — max 5 MB</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn-secondary w-full text-sm"
                >
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  Use Camera
                </button>
              </div>
            )}
            {errors.photo && <p className="text-red-600 text-xs mt-2">{errors.photo}</p>}
          </div>

          {/* Item Details */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Item Information
            </h2>

            <div>
              <label className="label" htmlFor="itemName">
                Item name <span className="required-star" aria-hidden="true">*</span>
              </label>
              <input
                id="itemName"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className={`input-field ${errors.itemName ? 'input-error' : ''}`}
                placeholder="e.g., Black Jansport Backpack"
                aria-required="true"
                aria-invalid={!!errors.itemName}
              />
              {errors.itemName && <p className="text-red-600 text-xs mt-1">{errors.itemName}</p>}
            </div>

            <div>
              <label className="label" htmlFor="category">
                Category <span className="required-star" aria-hidden="true">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`input-field ${errors.category ? 'input-error' : ''}`}
                aria-required="true"
                aria-invalid={!!errors.category}
                data-fr="B-06"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="label" htmlFor="description">
                Description <span className="required-star" aria-hidden="true">*</span>
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`input-field resize-none ${errors.description ? 'input-error' : ''}`}
                placeholder="Color, brand, markings, condition, what's inside (if applicable)…"
                aria-required="true"
                aria-invalid={!!errors.description}
              />
              {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="label" htmlFor="location">
                <MapPin className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                Where did you find it? <span className="required-star" aria-hidden="true">*</span>
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`input-field ${errors.location ? 'input-error' : ''}`}
                placeholder="e.g., COE Building Room 204, Library 2nd Floor, Main Canteen"
                aria-required="true"
                aria-invalid={!!errors.location}
              />
              {errors.location && <p className="text-red-600 text-xs mt-1">{errors.location}</p>}
            </div>

            <div>
              <label className="label" htmlFor="foundDatetime">
                <Calendar className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                Date &amp; time found <span className="required-star" aria-hidden="true">*</span>
              </label>
              <input
                id="foundDatetime"
                type="datetime-local"
                value={foundDatetime}
                max={nowMax()}
                onChange={(e) => setFoundDatetime(e.target.value)}
                className={`input-field ${errors.foundDatetime ? 'input-error' : ''}`}
                aria-required="true"
                aria-invalid={!!errors.foundDatetime}
                data-fr="B-06"
              />
              {errors.foundDatetime && <p className="text-red-600 text-xs mt-1">{errors.foundDatetime}</p>}
            </div>

            {/* High-value Checkbox */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer min-h-[44px]" data-fr="B-07">
                <input
                  type="checkbox"
                  checked={isHighValue}
                  onChange={(e) => setIsHighValue(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  This is a high-value item
                  <HighValueTooltip />
                </span>
              </label>
              {isHighValue && (
                <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-2.5 mt-1">
                  Protective Measure: High-value items (smartphones, wallets, laptops, cash) have their photo and description hidden from the public list so only the true owner who accurately describes them can claim them.
                </p>
              )}
            </div>
          </div>

          {/* Finder Information (FR-002) */}
          <div className="card p-5" data-fr="FR-002">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">
              Your Information <span className="text-slate-400 font-normal text-xs normal-case ml-1">(optional)</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Leave blank if you prefer to remain anonymous.
            </p>

            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="finderName">Your name</label>
                <input
                  id="finderName"
                  type="text"
                  value={finderName}
                  onChange={(e) => setFinderName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Juan dela Cruz"
                />
              </div>

              <div>
                <label className="label" htmlFor="finderContact">Your contact number</label>
                <input
                  id="finderContact"
                  type="tel"
                  value={finderContact}
                  onChange={(e) => setFinderContact(e.target.value)}
                  className={`input-field ${errors.finderContact ? 'input-error' : ''}`}
                  placeholder="09XXXXXXXXX"
                />
                {errors.finderContact && <p className="text-red-600 text-xs mt-1">{errors.finderContact}</p>}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={!isFormValid() || submitting}
              className="btn-primary w-full text-base"
              data-fr="NFR-001"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Report…
                </span>
              ) : 'Submit Found Item Report'}
            </button>
            {!isFormValid() && (
              <p className="text-xs text-slate-400 text-center mt-2">
                Please provide a photo and complete all required fields (*) to submit.
              </p>
            )}
          </div>
        </form>
      </main>

      <SuccessModal
        isOpen={showSuccess}
        onClose={resetForm}
        itemName={reportedItemName}
        isHighValue={isHighValue}
      />

      <PublicFooter />
    </div>
  )
}


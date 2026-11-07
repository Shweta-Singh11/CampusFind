import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, X, Info, Calendar, MapPin } from 'lucide-react'
import { logFoundItem, uploadItemPhoto } from '../../lib/api.js'
import AdminLayout from '../../components/AdminLayout.jsx'
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
          These items have their photo and details hidden on the public list.
        </div>
      )}
    </span>
  )
}

export default function LogItemPage() {
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
      toast.error('Could not access camera. Please use file upload instead.')
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
    if (!photoFile) errs.photo = 'A photo is required.'
    if (!itemName.trim()) errs.itemName = 'Item name is required.'
    if (!category) errs.category = 'Category is required.'
    if (!description.trim()) errs.description = 'Description is required.'
    if (!location.trim()) errs.location = 'Found location is required.'
    if (!foundDatetime) errs.foundDatetime = 'Date and time found is required.'
    else if (new Date(foundDatetime) > new Date()) errs.foundDatetime = 'Date and time cannot be in the future.'
    if (finderContact && !/^[\d+\-\s]{7,13}$/.test(finderContact.trim())) {
      errs.finderContact = 'Enter a valid contact number.'
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
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
      toast.success('Item logged successfully!')
      navigate('/admin/items')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isFormValid = () =>
    !!(photoFile && itemName.trim() && category && description.trim() && location.trim() && foundDatetime)

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto pb-16" data-fr="FR-001">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Log Found Item</h1>
        <p className="text-slate-500 text-sm mb-6">Record a new item turned in to the office.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              {/* Photo */}
              <div className="card p-5">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                  Photo <span className="required-star" aria-hidden="true">*</span>
                </h2>

                {showCam ? (
                  <div className="space-y-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-xl bg-black"
                      style={{ maxHeight: '300px' }}
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={capturePhoto} className="btn-primary flex-1">
                        <Camera className="w-4 h-4" aria-hidden="true" />
                        Capture
                      </button>
                      <button type="button" onClick={stopCamera} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                ) : photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Item preview" className="w-full max-h-64 object-contain rounded-xl bg-slate-50 border border-slate-200" />
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
                      id="itemPhoto"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center transition-colors min-h-[44px]"
                    >
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" aria-hidden="true" />
                      <span className="text-sm text-slate-500">Click to upload photo</span>
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

              {/* Optional Finder Info (FR-002) */}
              <div className="card p-5" data-fr="FR-002">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                  Finder Information <span className="text-slate-400 font-normal text-xs normal-case ml-1">(optional)</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="label" htmlFor="finderName">Finder's name</label>
                    <input
                      id="finderName"
                      type="text"
                      value={finderName}
                      onChange={(e) => setFinderName(e.target.value)}
                      className="input-field"
                      placeholder="Leave blank if anonymous"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="finderContact">Finder's contact number</label>
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
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <div className="card p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Item Details
                </h2>

                {/* Item name */}
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
                    placeholder="e.g., Black Samsung Galaxy A54"
                    aria-required="true"
                    aria-invalid={!!errors.itemName}
                  />
                  {errors.itemName && <p className="text-red-600 text-xs mt-1">{errors.itemName}</p>}
                </div>

                {/* Category */}
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

                {/* Description */}
                <div>
                  <label className="label" htmlFor="description">
                    Description <span className="required-star" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`input-field resize-none ${errors.description ? 'input-error' : ''}`}
                    placeholder="Color, brand, markings, contents, condition…"
                    aria-required="true"
                    aria-invalid={!!errors.description}
                  />
                  {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
                </div>

                {/* Found location */}
                <div>
                  <label className="label" htmlFor="foundLocation">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                    Found location <span className="required-star" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="foundLocation"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`input-field ${errors.location ? 'input-error' : ''}`}
                    placeholder="e.g., COE Building Room 204"
                    aria-required="true"
                    aria-invalid={!!errors.location}
                  />
                  {errors.location && <p className="text-red-600 text-xs mt-1">{errors.location}</p>}
                </div>

                {/* Date and time found (B-06: no future, no default) */}
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

                {/* High-value checkbox (B-07) */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer min-h-[44px]" data-fr="B-07">
                    <input
                      type="checkbox"
                      checked={isHighValue}
                      onChange={(e) => setIsHighValue(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      High-value item
                      <HighValueTooltip />
                    </span>
                  </label>
                  {isHighValue && (
                    <p className="text-xs text-blue-600 ml-7 mt-1">
                      Photo and details will be hidden from the public list.
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!isFormValid() || submitting}
                className="btn-primary w-full text-base"
                data-fr="NFR-001"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging item…
                  </span>
                ) : 'Log Found Item'}
              </button>
              {!isFormValid() && (
                <p className="text-xs text-slate-400 text-center">Fill in all required fields to submit.</p>
              )}
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}


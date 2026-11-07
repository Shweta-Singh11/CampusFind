import { Link, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Calendar, Lock, Tag, ChevronRight } from 'lucide-react'
import { getPublicItemById, getPublicItemPhotoUrl } from '../lib/api.js'
import { PageLoader } from '../components/Skeletons.jsx'
import PublicHeader, { PublicFooter } from '../components/PublicHeader.jsx'

export default function ItemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getPublicItemById(id)
        setItem(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-16">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium text-sm mb-5 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Found Items
        </Link>

        {loading && <PageLoader />}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 text-center">
            <p className="font-semibold mb-1">Item not found</p>
            <p className="text-sm">{error}</p>
            <Link to="/" className="btn-primary mt-4 inline-flex">Back to list</Link>
          </div>
        )}

        {item && (
          <div className="card overflow-hidden" data-fr="FR-003">
            {/* Image */}
            <div className="relative h-64 sm:h-80 bg-blue-50">
              {item.is_high_value ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-blue-900/10">
                  <Lock className="w-16 h-16 text-blue-300" aria-hidden="true" />
                  <span className="text-blue-500 font-medium text-sm">Photo hidden</span>
                </div>
              ) : item.photo_path ? (
                <img
                  src={getPublicItemPhotoUrl(item.photo_path)}
                  alt={item.item_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  <Tag className="w-16 h-16 text-slate-300" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{item.item_name}</h1>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                  {item.category}
                </span>
              </div>

              {item.is_high_value ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                  <p className="text-blue-800 text-sm leading-relaxed font-medium">
                    This is a high-value item. Details are hidden to protect the owner.
                    Describe it thoroughly in your claim to prove it is yours.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">{item.item_description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-blue-400" aria-hidden="true" />
                      <span><strong className="text-slate-700">Found at:</strong> {item.found_location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4 flex-shrink-0 text-blue-400" aria-hidden="true" />
                      <span>
                        <strong className="text-slate-700">Date found:</strong>{' '}
                        {new Date(item.found_datetime).toLocaleDateString('en-PH', {
                          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                        })}{' '}
                        at {new Date(item.found_datetime).toLocaleTimeString('en-PH', {
                          hour: 'numeric', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <Link
                to={`/claim/${item.item_id}`}
                className="btn-primary w-full text-base"
                data-fr="FR-004"
              >
                Claim this item
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <p className="text-xs text-slate-400 text-center mt-3">
                You will need to provide proof of ownership to claim this item.
              </p>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}


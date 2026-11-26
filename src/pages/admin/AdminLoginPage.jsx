import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react'
import { signIn } from '../../lib/api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000

const LS_ATTEMPTS = 'sdo_login_attempts'
const LS_LOCKOUT = 'sdo_login_lockout'

function getLockoutInfo() {
  try {
    const attempts = parseInt(localStorage.getItem(LS_ATTEMPTS) || '0', 10)
    const lockoutUntil = parseInt(localStorage.getItem(LS_LOCKOUT) || '0', 10)
    return { attempts, lockoutUntil }
  } catch {
    return { attempts: 0, lockoutUntil: 0 }
  }
}

function recordFailedAttempt() {
  const { attempts } = getLockoutInfo()
  const newAttempts = attempts + 1
  localStorage.setItem(LS_ATTEMPTS, String(newAttempts))
  if (newAttempts >= MAX_ATTEMPTS) {
    localStorage.setItem(LS_LOCKOUT, String(Date.now() + LOCKOUT_DURATION_MS))
  }
  return newAttempts
}

function resetAttempts() {
  localStorage.removeItem(LS_ATTEMPTS)
  localStorage.removeItem(LS_LOCKOUT)
}

export default function AdminLoginPage() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [lockoutMsg, setLockoutMsg] = useState(null)
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, from])

  useEffect(() => {
    checkLockout()
  }, [])

  const checkLockout = () => {
    const { attempts, lockoutUntil } = getLockoutInfo()
    if (lockoutUntil > Date.now()) {
      const mins = Math.ceil((lockoutUntil - Date.now()) / 60000)
      setLockoutMsg(`Too many failed attempts. Please wait ${mins} minute${mins !== 1 ? 's' : ''} before trying again.`)
      return true
    }
    if (lockoutUntil && lockoutUntil <= Date.now()) {
      resetAttempts()
    }
    setAttemptsLeft(MAX_ATTEMPTS - attempts)
    return false
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)

    if (checkLockout()) return

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter your email and password.')
      return
    }

    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      resetAttempts()
      navigate(from, { replace: true })
    } catch (err) {
      const newAttempts = recordFailedAttempt()
      const left = MAX_ATTEMPTS - newAttempts
      if (left <= 0) {
        setLockoutMsg('Your account is temporarily locked for 15 minutes due to too many failed attempts.')
        setErrorMsg(null)
      } else {
        setErrorMsg(`${err.message} ${left} attempt${left !== 1 ? 's' : ''} remaining before lockout.`)
        setAttemptsLeft(left)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-white/10 rounded-2xl p-3 inline-block mb-3">
            <Lock className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white">CampusFind</h1>
          <p className="text-blue-200 text-sm">KNIT Lost &amp; Found — Office Administrator Login</p>
        </div>

        <div className="card p-6" data-fr="B-12">
          {/* Lockout message */}
          {lockoutMsg && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 flex gap-2 items-start text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              {lockoutMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="label" htmlFor="adminEmail">Email</label>
              <input
                id="adminEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input-field ${errorMsg ? 'input-error' : ''}`}
                placeholder="admin@knit.ac.in"
                aria-required="true"
                aria-invalid={!!errorMsg}
                autoComplete="email"
                disabled={!!lockoutMsg}
              />
            </div>

            <div>
              <label className="label" htmlFor="adminPassword">Password</label>
              <div className="relative">
                <input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input-field pr-12 ${errorMsg ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                  aria-required="true"
                  aria-invalid={!!errorMsg}
                  autoComplete="current-password"
                  disabled={!!lockoutMsg}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  data-fr="B-12"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                    : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Inline error (B-12) */}
            {errorMsg && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 flex gap-2 items-start text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !!lockoutMsg}
              className="btn-primary w-full"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-xs text-blue-300">
          This portal is for Office Administrators only.
        </p>
      </div>
    </div>
  )
}

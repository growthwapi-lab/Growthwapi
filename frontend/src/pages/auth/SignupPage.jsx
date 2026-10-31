import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function SignupPage() {
  const [searchParams] = useSearchParams()
  const referralParam = searchParams.get('ref') || ''

  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: referralParam.toUpperCase()
  })

  const [refStatus, setRefStatus] = useState({
    checking: false,
    valid: false,
    partnerName: '',
    error: ''
  })

  // Validate referral code with backend
  const validateReferralCode = async (code) => {
    const cleanCode = (code || '').trim().toUpperCase()
    if (!cleanCode) {
      setRefStatus({ checking: false, valid: false, partnerName: '', error: '' })
      return
    }

    setRefStatus(prev => ({ ...prev, checking: true, error: '' }))
    try {
      const res = await api.get(`/api/affiliate/validate/${cleanCode}`)
      if (res.data?.valid) {
        setRefStatus({
          checking: false,
          valid: true,
          partnerName: res.data.partnerName || 'Verified Partner',
          error: ''
        })
      } else {
        setRefStatus({
          checking: false,
          valid: false,
          partnerName: '',
          error: `Referral code "${cleanCode}" is invalid or does not exist.`
        })
      }
    } catch (err) {
      setRefStatus({
        checking: false,
        valid: false,
        partnerName: '',
        error: `Referral code "${cleanCode}" is invalid or does not exist.`
      })
    }
  }

  // If URL has ?ref=CODE, save in localStorage & track click + validate
  useEffect(() => {
    const code = referralParam || localStorage.getItem('gw_referral_code') || ''
    if (code) {
      const cleanCode = code.toUpperCase()
      localStorage.setItem('gw_referral_code', cleanCode)
      setFormData(prev => ({ ...prev, referralCode: cleanCode }))
      validateReferralCode(cleanCode)
      api.post('/api/affiliate/track-click', { code: cleanCode }).catch(() => {})
    }
  }, [referralParam])

  // Debounced validation when user types referral code manually
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.referralCode) {
        validateReferralCode(formData.referralCode)
      } else {
        setRefStatus({ checking: false, valid: false, partnerName: '', error: '' })
      }
    }, 450)
    return () => clearTimeout(timer)
  }, [formData.referralCode])
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const formatPhoneWithCountryCode = (phoneStr) => {
    if (!phoneStr) return ''
    let cleaned = phoneStr.trim().replace(/[\s\-\(\)]/g, '')
    if (!cleaned.startsWith('+')) {
      if (/^\d{10}$/.test(cleaned)) {
        cleaned = '+91' + cleaned
      } else if (/^\d{11,14}$/.test(cleaned)) {
        cleaned = '+' + cleaned
      }
    }
    return cleaned
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.fullName.trim()) {
      return toast.error("Full Name is required")
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(formData.email.trim())) {
      return toast.error("Please enter a valid email address (e.g. name@example.com)")
    }

    const formattedPhone = formatPhoneWithCountryCode(formData.phone)
    if (!/^\+[1-9]\d{7,14}$/.test(formattedPhone)) {
      return toast.error("Please enter a valid phone number with country code (e.g. +919876543210)")
    }

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords don't match")
    }

    const trimmedCode = (formData.referralCode || '').trim().toUpperCase()
    if (trimmedCode) {
      // Strictly block account creation if referral code is invalid
      try {
        const valRes = await api.get(`/api/affiliate/validate/${trimmedCode}`)
        if (!valRes.data?.valid) {
          return toast.error(`Invalid referral code "${trimmedCode}". Please enter a valid partner code or leave it empty.`)
        }
      } catch (err) {
        return toast.error(`Invalid referral code "${trimmedCode}". Please enter a valid partner code or leave it empty.`)
      }
    }

    setLoading(true)
    try {
      await signUp(formData.email.trim(), formData.password, {
        full_name: formData.fullName.trim(),
        name: formData.fullName.trim(),
        business_name: formData.businessName.trim(),
        phone: formattedPhone,
        referral_code: formData.referralCode ? formData.referralCode.trim().toUpperCase() : undefined
      })
      localStorage.removeItem('gw_referral_code')
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center items-center mb-6">
          <img
            src="/logo.png.png"
            alt="Growthwapi"
            className="h-12 object-contain"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          <span className="text-2xl font-bold hidden">
            <span className="text-brand-blue">Growth</span>
            <span className="text-brand-orange">wapi</span>
          </span>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-brand-dark mb-2">Create your account</h2>
        <p className="text-center text-brand-purple font-medium mb-6 text-sm bg-purple-50 py-1 rounded-full w-max mx-auto px-4">
          ✨ 4-day free trial included
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text" name="fullName" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              value={formData.fullName} onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text" name="businessName" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              value={formData.businessName} onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel" name="phone" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              value={formData.phone} onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email" name="email" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              value={formData.email} onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" name="password" required minLength="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              value={formData.password} onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password" name="confirmPassword" required minLength="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
              value={formData.confirmPassword} onChange={handleChange}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-600">Referral / Partner Code (Optional)</label>
              {refStatus.checking && (
                <span className="text-[10px] font-medium text-blue-600 animate-pulse">
                  Verifying code...
                </span>
              )}
              {!refStatus.checking && refStatus.valid && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ {refStatus.partnerName || 'Verified Partner'}
                </span>
              )}
              {!refStatus.checking && refStatus.error && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  ✗ Invalid Code
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text" name="referralCode"
                placeholder="e.g. GW-ADMIN-101"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none uppercase font-mono text-xs transition-colors ${
                  refStatus.valid
                    ? 'border-emerald-500 bg-emerald-50/20 focus:ring-emerald-400'
                    : refStatus.error
                    ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-400'
                    : 'border-gray-200 focus:ring-brand-purple'
                }`}
                value={formData.referralCode} onChange={handleChange}
              />
              {formData.referralCode && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, referralCode: '' }))
                    setRefStatus({ checking: false, valid: false, partnerName: '', error: '' })
                    localStorage.removeItem('gw_referral_code')
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1"
                  title="Clear referral code"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Invalid Referral Code Error Box */}
          {!refStatus.checking && refStatus.error && formData.referralCode && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 space-y-1 animate-fadeIn">
              <p className="font-bold flex items-center gap-1.5 text-rose-800">
                <span>⚠️</span> Invalid Referral Code
              </p>
              <p className="text-[11px] leading-relaxed">
                Referral code <strong>"{formData.referralCode}"</strong> was not found in our partner database.
              </p>
              <p className="text-[11px] font-medium text-rose-600">
                Please enter a valid partner code, or click <strong>✕</strong> above to sign up normally without one.
              </p>
            </div>
          )}

          {/* Valid Referral Offer Unlock Banner */}
          {!refStatus.checking && refStatus.valid && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-3.5 space-y-2.5 animate-fadeIn">
              <p className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                🎁 Partner Referral Unlocks:
              </p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 text-sm mt-0.5">✓</span>
                  <p className="text-xs text-emerald-800 font-semibold leading-snug">
                    <span className="text-emerald-700 font-black">Bonus Free Messages</span> on your 1st plan purchase —
                    Starter <span className="font-black">+200</span> · Growth <span className="font-black">+300</span> · Pro <span className="font-black">+500</span>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 text-sm mt-0.5">✓</span>
                  <p className="text-xs text-emerald-800 font-semibold leading-snug">
                    <span className="text-emerald-700 font-black">1-on-1 Setup Support</span> — {refStatus.partnerName} will personally onboard you
                    and set up your WhatsApp Business API & Meta account.
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-emerald-600 opacity-80">*Bonus messages on first plan purchase only. Setup support provided by your partner.</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-blue text-white py-2.5 rounded-lg font-bold hover:bg-blue-900 transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account? <Link to="/login" className="text-brand-orange font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}

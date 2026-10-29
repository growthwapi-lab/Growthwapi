import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
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

    setLoading(true)
    try {
      await signUp(formData.email.trim(), formData.password, {
        full_name: formData.fullName.trim(),
        name: formData.fullName.trim(),
        business_name: formData.businessName.trim(),
        phone: formattedPhone
      })
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
          ✨ 7-day free trial included
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

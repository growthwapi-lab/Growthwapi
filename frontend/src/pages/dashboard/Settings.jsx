import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Building2, Phone, Mail, Lock, Smartphone,
  AlertTriangle, Package, CheckCircle, Pencil, X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

export default function Settings() {
  const { user } = useAuth()

  const [profile, setProfile] = useState({
    name: user?.user_metadata?.name || '',
    business_name: user?.user_metadata?.business_name || '',
    phone: user?.user_metadata?.phone || '',
    email: user?.email || '',
  })

  // WhatsApp state — separate "saved" from "editing" values
  const [waConnected, setWaConnected] = useState(false)
  const [waSaved, setWaSaved] = useState({ phone_number_id: '', waba_id: '', display_phone: '' })
  const [waEdit, setWaEdit] = useState({ phone_number_id: '', waba_id: '' })
  const [editingWa, setEditingWa] = useState(false)

  const [activePlan, setActivePlan] = useState(null)
  const [passwords, setPasswords] = useState({ new_: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [savingWa, setSavingWa] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => {
    fetchProfile()
    api.get('/api/users/active-plan')
      .then(res => setActivePlan(res.data))
      .catch(() => {})
  }, [user])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/users/profile')
      if (res.data) {
        setProfile({
          name: res.data.name || user?.user_metadata?.name || '',
          business_name: res.data.business_name || user?.user_metadata?.business_name || '',
          phone: res.data.phone || user?.user_metadata?.phone || '',
          email: res.data.email || user?.email || '',
        })

        const phoneId = res.data.whatsapp_phone_number_id || ''
        const wabaId = res.data.whatsapp_waba_id || ''
        const displayPhone = res.data.whatsapp_display_phone || ''

        setWaSaved({ phone_number_id: phoneId, waba_id: wabaId, display_phone: displayPhone })
        setWaEdit({ phone_number_id: phoneId, waba_id: wabaId })
        setWaConnected(Boolean(phoneId))
        setEditingWa(false) // reset editing state on fresh fetch
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  const handleWaSave = async (e) => {
    e.preventDefault()
    if (!waEdit.phone_number_id.trim() || !waEdit.waba_id.trim()) {
      return toast.error('Please enter both Phone Number ID and WABA ID.')
    }
    setSavingWa(true)
    try {
      const res = await api.put('/api/users/whatsapp-config', {
        phone_number_id: waEdit.phone_number_id.trim(),
        waba_id: waEdit.waba_id.trim(),
      })
      toast.success('✅ WhatsApp credentials saved successfully!')
      // Update local state immediately so UI switches to "Connected"
      const saved = {
        phone_number_id: waEdit.phone_number_id.trim(),
        waba_id: waEdit.waba_id.trim(),
        display_phone: res.data?.user?.whatsapp_display_phone || '',
      }
      setWaSaved(saved)
      setWaConnected(true)
      setEditingWa(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save WhatsApp credentials')
    } finally {
      setSavingWa(false)
    }
  }

  const handleWaDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your WhatsApp account?')) return
    setSavingWa(true)
    try {
      await api.put('/api/users/whatsapp-config', {
        phone_number_id: '',
        waba_id: '',
      })
      setWaSaved({ phone_number_id: '', waba_id: '', display_phone: '' })
      setWaEdit({ phone_number_id: '', waba_id: '' })
      setWaConnected(false)
      setEditingWa(false)
      toast.success('WhatsApp account disconnected.')
    } catch (err) {
      toast.error('Failed to disconnect. Please try again.')
    } finally {
      setSavingWa(false)
    }
  }

  const formatPhoneWithCountryCode = (phoneStr) => {
    if (!phoneStr) return ''
    let cleaned = phoneStr.trim().replace(/[\s\-\(\)]/g, '')
    if (!cleaned.startsWith('+')) {
      if (/^\d{10}$/.test(cleaned)) cleaned = '+91' + cleaned
      else if (/^\d{11,14}$/.test(cleaned)) cleaned = '+' + cleaned
    }
    return cleaned
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!profile.name.trim()) return toast.error('Full Name is required.')

    let formattedPhone = profile.phone ? formatPhoneWithCountryCode(profile.phone) : ''
    if (profile.phone && !/^\+[1-9]\d{7,14}$/.test(formattedPhone)) {
      return toast.error('Please enter a valid phone number with country code (e.g. +919876543210)')
    }

    setSaving(true)
    try {
      const res = await api.put('/api/users/profile', {
        name: profile.name.trim(),
        business_name: profile.business_name.trim(),
        phone: formattedPhone,
      })
      setProfile(prev => ({
        ...prev,
        name: res.data.name || profile.name,
        business_name: res.data.business_name || profile.business_name,
        phone: res.data.phone || formattedPhone,
      }))
      await supabase.auth.updateUser({
        data: {
          name: profile.name.trim(),
          full_name: profile.name.trim(),
          business_name: profile.business_name.trim(),
          phone: formattedPhone,
        }
      }).catch(() => {})
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwords.new_ !== passwords.confirm) return toast.error('New passwords do not match.')
    if (passwords.new_.length < 6) return toast.error('Password must be at least 6 characters.')
    setChangingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new_ })
      if (error) throw error
      toast.success('Password changed successfully!')
      setPasswords({ new_: '', confirm: '' })
    } catch (err) {
      toast.error(err.message || 'Failed to change password')
    } finally {
      setChangingPw(false)
    }
  }

  const SectionCard = ({ title, icon: Icon, color, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-bold text-brand-dark mb-5 flex items-center gap-2">
        <Icon size={18} className={color} />
        {title}
      </h2>
      {children}
    </div>
  )

  const inputCls = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none"
  const readonlyCls = "w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and WhatsApp configuration.</p>
      </div>

      {/* Profile */}
      <SectionCard title="Profile" icon={User} color="text-brand-blue">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className={`${inputCls} pl-9`}
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={profile.business_name}
                  onChange={e => setProfile({ ...profile, business_name: e.target.value })}
                  className={`${inputCls} pl-9`}
                  placeholder="Your business name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className={`${inputCls} pl-9`}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={profile.email} readOnly className={`${readonlyCls} pl-9`} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-blue text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-900 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </SectionCard>

      {/* Subscription Plan */}
      <SectionCard title="Current Subscription Plan" icon={Package} color="text-brand-orange">
        {activePlan ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-orange-50/50 border border-orange-200/60 rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-brand-dark text-base">{activePlan.plan}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  activePlan.isPaid ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {activePlan.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {activePlan.isPaid ? `₹${activePlan.price.toLocaleString()}/month` : '7-Day Free Trial'} • {activePlan.daysRemaining} days remaining
              </p>
            </div>
            <Link
              to="/dashboard/wallet"
              className="bg-brand-orange text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
            >
              Upgrade / Manage Plan
            </Link>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Loading plan details...</p>
        )}
      </SectionCard>

      {/* WhatsApp Integration & Credentials */}
      <SectionCard title="WhatsApp Integration & Credentials" icon={Smartphone} color="text-green-600">

        {/* Connection Status Banner */}
        {waConnected ? (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={22} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-800 text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
                  WhatsApp Connected
                </p>
                {waSaved.display_phone && (
                  <p className="text-green-700 text-xs font-mono mt-0.5">{waSaved.display_phone}</p>
                )}
                <p className="text-gray-500 text-xs mt-0.5">
                  Phone ID: <span className="font-mono">{waSaved.phone_number_id}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { setEditingWa(true); setWaEdit({ phone_number_id: waSaved.phone_number_id, waba_id: waSaved.waba_id }) }}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:text-blue-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                <Pencil size={13} /> Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Connection Status</span>
              <span className="font-bold text-sm text-red-700 flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                Not Connected
              </span>
            </div>
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-brand-blue hover:underline bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
            >
              Connect via Meta Popup →
            </Link>
          </div>
        )}

        {/* Edit / Add form — shown when not connected OR when editing */}
        {(!waConnected || editingWa) && (
          <form onSubmit={handleWaSave} className="space-y-4 mb-5">
            {editingWa && (
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-700">Update WhatsApp Credentials</p>
                <button
                  type="button"
                  onClick={() => setEditingWa(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Phone Number ID
              </label>
              <input
                type="text"
                value={waEdit.phone_number_id}
                onChange={e => setWaEdit({ ...waEdit, phone_number_id: e.target.value })}
                placeholder="e.g. 1313417765190326"
                className={inputCls}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Found in Meta Developer Console → WhatsApp → API Setup</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Business Account ID (WABA ID)
              </label>
              <input
                type="text"
                value={waEdit.waba_id}
                onChange={e => setWaEdit({ ...waEdit, waba_id: e.target.value })}
                placeholder="e.g. 2201481664133864"
                className={inputCls}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Found in Meta Business Manager → WhatsApp Accounts</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingWa}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 text-sm shadow-sm"
              >
                {savingWa ? 'Saving...' : waConnected ? 'Update WhatsApp IDs' : 'Save & Connect'}
              </button>
              {waConnected && (
                <button
                  type="button"
                  onClick={handleWaDisconnect}
                  disabled={savingWa}
                  className="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Disconnect
                </button>
              )}
            </div>
          </form>
        )}

        {/* Webhook Info */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600 space-y-2">
          <p className="font-semibold text-brand-dark">Webhook Configuration</p>
          <p>Set your Meta app's Webhook callback URL to:</p>
          <code className="block bg-white border border-gray-200 px-3 py-2 rounded text-brand-blue font-mono text-xs select-all">
            https://growthwapi-backend.onrender.com/api/whatsapp/webhook
          </code>
          <p className="text-xs text-gray-500">
            Use <code className="font-mono bg-white px-1 rounded border">growthwapi_secure_2026</code> as the Verify Token in Meta App Settings.
          </p>
        </div>
      </SectionCard>

      {/* Change Password */}
      <SectionCard title="Change Password" icon={Lock} color="text-brand-purple">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { label: 'New Password', key: 'new_', placeholder: '••••••••' },
            { label: 'Confirm New Password', key: 'confirm', placeholder: '••••••••' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="password"
                value={passwords[key]}
                onChange={e => setPasswords({ ...passwords, [key]: e.target.value })}
                placeholder={placeholder}
                className={inputCls}
                minLength={6}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={changingPw}
            className="bg-brand-purple text-white px-6 py-2.5 rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </SectionCard>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border-2 border-red-200 shadow-sm p-6">
        <h2 className="font-bold text-red-600 mb-2 flex items-center gap-2">
          <AlertTriangle size={18} /> Danger Zone
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Deleting your account will permanently remove all your data including contacts, messages, and billing history. This action cannot be undone.
        </p>
        <button
          onClick={() => toast.error('Please contact support at support@growthwapi.com to delete your account.')}
          className="border-2 border-red-400 text-red-600 px-5 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors text-sm"
        >
          Request Account Deletion
        </button>
      </div>
    </div>
  )
}

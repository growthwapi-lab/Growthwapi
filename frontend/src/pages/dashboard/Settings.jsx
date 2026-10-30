import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Building2, Phone, Mail, Lock, Smartphone,
  AlertTriangle, Package, CheckCircle, Pencil, X, Copy, Check,
  CreditCard, ExternalLink, ShieldCheck, FileText, CheckCircle2, Globe
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
  const [copiedKey, setCopiedKey] = useState('')

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    toast.success(`Copied ${label}!`)
    setTimeout(() => setCopiedKey(''), 2000)
  }

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
    <div className="space-y-6 max-w-4xl">
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
          <div className="space-y-4 mb-5">
            {/* Top Status Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span className="font-bold text-emerald-900 text-sm">WhatsApp Business Connected</span>
                  </div>
                  {waSaved.display_phone && (
                    <p className="text-emerald-700 text-xs font-mono font-semibold mt-0.5">
                      {waSaved.display_phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingWa(true)
                    setWaEdit({ phone_number_id: waSaved.phone_number_id, waba_id: waSaved.waba_id })
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-blue-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-gray-50 transition-all"
                >
                  <Pencil size={13} /> Edit IDs
                </button>
                <button
                  type="button"
                  onClick={handleWaDisconnect}
                  disabled={savingWa}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Grid of Verified Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Phone Number ID</span>
                  <span className="font-mono text-xs text-gray-900 font-bold block truncate mt-0.5">
                    {waSaved.phone_number_id || 'Not set'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(waSaved.phone_number_id, 'Phone ID')}
                  className="p-1.5 text-gray-500 hover:text-brand-blue hover:bg-white rounded-lg transition-colors shrink-0"
                  title="Copy Phone Number ID"
                >
                  {copiedKey === 'Phone ID' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">WABA ID (Account)</span>
                  <span className="font-mono text-xs text-gray-900 font-bold block truncate mt-0.5">
                    {waSaved.waba_id || 'Not set'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(waSaved.waba_id, 'WABA ID')}
                  className="p-1.5 text-gray-500 hover:text-brand-blue hover:bg-white rounded-lg transition-colors shrink-0"
                  title="Copy WABA ID"
                >
                  {copiedKey === 'WABA ID' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-5 gap-3">
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">WhatsApp Status</span>
              <span className="font-bold text-sm text-amber-900 flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Account Not Connected
              </span>
              <p className="text-xs text-amber-700 mt-1">Enter your Meta credentials below to enable sending and receiving WhatsApp messages.</p>
            </div>
          </div>
        )}

        {/* Edit / Add Form */}
        {(!waConnected || editingWa) && (
          <form onSubmit={handleWaSave} className="space-y-4 mb-5 p-4 bg-gray-50/70 border border-gray-200 rounded-2xl animate-in fade-in duration-150">
            {editingWa && (
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Update WhatsApp IDs</p>
                <button
                  type="button"
                  onClick={() => setEditingWa(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  WhatsApp Phone Number ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={waEdit.phone_number_id}
                  onChange={e => setWaEdit({ ...waEdit, phone_number_id: e.target.value })}
                  placeholder="e.g. 1313417765190326"
                  className={inputCls}
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">Meta Console → WhatsApp → API Setup</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  WABA ID (Business Account) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={waEdit.waba_id}
                  onChange={e => setWaEdit({ ...waEdit, waba_id: e.target.value })}
                  placeholder="e.g. 2201481664133864"
                  className={inputCls}
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">Meta Business Manager → WhatsApp Accounts</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={savingWa}
                className="bg-green-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 text-xs shadow-xs"
              >
                {savingWa ? 'Saving...' : waConnected ? 'Update Credentials' : 'Save & Connect WhatsApp'}
              </button>
              {editingWa && (
                <button
                  type="button"
                  onClick={() => setEditingWa(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {/* Webhook Configuration Guide Card */}
        <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-brand-dark text-xs uppercase tracking-wider">
              Meta Webhook Callback Configuration
            </p>
            <span className="text-[10px] bg-blue-100 text-brand-blue font-bold px-2 py-0.5 rounded-full">
              Incoming & Tick Events
            </span>
          </div>

          <p className="text-xs text-gray-600">
            Set the callback URL in your Meta App Dashboard under <strong>WhatsApp → Configuration → Webhook</strong>:
          </p>

          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Callback URL</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-gray-200 px-3 py-2 rounded-xl text-brand-blue font-mono text-xs truncate shadow-2xs select-all">
                  https://growthwapi-backend.onrender.com/api/whatsapp/webhook
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard('https://growthwapi-backend.onrender.com/api/whatsapp/webhook', 'Webhook URL')}
                  className="p-2 text-gray-600 hover:text-brand-blue bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs shrink-0"
                  title="Copy Webhook URL"
                >
                  {copiedKey === 'Webhook URL' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Verify Token</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-gray-200 px-3 py-2 rounded-xl text-brand-dark font-mono text-xs truncate shadow-2xs select-all font-bold">
                  growthwapi_secure_2026
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard('growthwapi_secure_2026', 'Verify Token')}
                  className="p-2 text-gray-600 hover:text-brand-blue bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs shrink-0"
                  title="Copy Verify Token"
                >
                  {copiedKey === 'Verify Token' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 1: META WHATSAPP BILLING CARD SETUP ── */}
        <div className="p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-blue-50/70 rounded-2xl border border-blue-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-blue text-white rounded-xl shadow-xs shrink-0">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">
                  Official Meta WhatsApp Billing (Card Setup)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Link your Debit/Credit card directly to your Meta Business Account for official WhatsApp usage charges.
                </p>
              </div>
            </div>

            <a
              href="https://business.facebook.com/billing_hub/payment_settings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all shrink-0"
            >
              <span>Set up WhatsApp Billing Card on Meta</span>
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600 pt-2 border-t border-blue-100">
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 size={13} /> 100% Secure Meta Gateway
            </span>
            <span className="flex items-center gap-1 font-semibold text-gray-600">
              • 1,000 Free Service Conversations/mo Included by Meta
            </span>
            <span className="flex items-center gap-1 font-semibold text-gray-600">
              • No middleman markup
            </span>
          </div>
        </div>

        {/* ── CARD 2: OFFICIAL GREEN TICK & BUSINESS VERIFICATION ── */}
        <div className="p-5 bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-gray-900 text-sm">
                    Meta Business Verification & Official Green Tick Badge
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    High Volume
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Required when you want to scale from 250 to <strong>1,000, 10,000, or Unlimited messages/day</strong> and apply for the <strong>Official Green Tick Verified Badge</strong> on WhatsApp.
                </p>
              </div>
            </div>

            <a
              href="https://business.facebook.com/settings/security"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all shrink-0"
            >
              <span>Open Meta Verification Portal</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Checklist of required documents */}
          <div className="bg-white/80 p-4 rounded-xl border border-emerald-100 space-y-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 block">
              Required Documents Checklist for Meta Verification:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">1.</span>
                <div>
                  <strong>Legal Business Proof (Any ONE):</strong>
                  <p className="text-[11px] text-gray-500 mt-0.5">GST Certificate (Fastest), Udyam MSME, Shop Act / Gumasta, or Incorporation Certificate.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">2.</span>
                <div>
                  <strong>Business Address & Phone Proof:</strong>
                  <p className="text-[11px] text-gray-500 mt-0.5">Current Bank Statement or Electricity / Utility bill matching your registered business address.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">3.</span>
                <div>
                  <strong>Official Website or Online Presence:</strong>
                  <p className="text-[11px] text-gray-500 mt-0.5">Working website showing your business name, address, and contact details matching your legal proof.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">4.</span>
                <div>
                  <strong>Active Business Card in Meta Billing:</strong>
                  <p className="text-[11px] text-gray-500 mt-0.5">A valid Debit/Credit card linked to Meta for automated conversation billing.</p>
                </div>
              </div>
            </div>
          </div>
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

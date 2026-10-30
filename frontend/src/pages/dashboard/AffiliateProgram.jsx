import { useState, useEffect } from 'react'
import {
  Users,
  DollarSign,
  TrendingUp,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Award,
  Wallet,
  Building,
  CreditCard,
  Send,
  AlertCircle,
  Lock,
  ExternalLink
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function AffiliateProgram() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Payout request modal / form
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('upi')
  const [requestingPayout, setRequestingPayout] = useState(false)

  // Payment Settings modal / form
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    upi_id: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_account_name: ''
  })

  useEffect(() => {
    fetchAffiliateDashboard()
  }, [])

  const fetchAffiliateDashboard = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/affiliate/dashboard')
      setData(res.data)
      if (res.data?.profile) {
        setSettingsForm({
          upi_id: res.data.profile.upi_id || '',
          bank_account_number: res.data.profile.bank_account_number || '',
          bank_ifsc: res.data.profile.bank_ifsc || '',
          bank_account_name: res.data.profile.bank_account_name || ''
        })
      }
    } catch (err) {
      console.error('Failed to load affiliate dashboard:', err)
      toast.error('Failed to load partner program data.')
    } finally {
      setLoading(false)
    }
  }

  const profile = data?.profile
  const referrals = data?.referrals || []
  const commissions = data?.commissions || []
  const payouts = data?.payouts || []

  const referralCode = profile?.referral_code || 'GW-PARTNER'
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://growthwapi.in'
  const partnerLink = `${appOrigin}?ref=${referralCode}`

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
    toast.success('Copied to clipboard!')
  }

  const handleSavePayoutSettings = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const res = await api.put('/api/affiliate/payout-settings', settingsForm)
      toast.success('Payout details saved successfully!')
      setData(prev => ({ ...prev, profile: res.data.profile }))
      setShowSettingsModal(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save payout settings.')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleRequestPayout = async (e) => {
    e.preventDefault()
    const amt = Number(payoutAmount)
    if (!amt || amt < 500) {
      return toast.error('Minimum payout request is ₹500.')
    }
    if (amt > Number(profile?.pending_balance || 0)) {
      return toast.error('Requested amount exceeds available balance.')
    }

    setRequestingPayout(true)
    try {
      const res = await api.post('/api/affiliate/request-payout', {
        amount: amt,
        method: payoutMethod
      })
      toast.success(res.data.message || 'Payout request submitted!')
      setShowPayoutModal(false)
      setPayoutAmount('')
      fetchAffiliateDashboard()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request payout.')
    } finally {
      setRequestingPayout(false)
    }
  }

  const [activating, setActivating] = useState(false)

  const handleActivatePartner = async () => {
    setActivating(true)
    const loaded = await loadRazorpay()
    if (!loaded) {
      toast.error('Payment gateway failed to load. Check internet connection.')
      setActivating(false)
      return
    }

    try {
      const { data: order } = await api.post('/api/affiliate/create-activation-order')
      const options = {
        key: order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Growthwapi',
        description: 'Affiliate Partner Lifetime Activation',
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/api/affiliate/verify-activation', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('🎉 Partner account activated successfully! Welcome to VIP Partners.')
            fetchAffiliateDashboard()
          } catch (err) {
            toast.error(err.response?.data?.error || 'Payment verification failed.')
          }
        },
        prefill: {
          name: profile?.user?.name || 'Partner',
          email: profile?.user?.email || ''
        },
        theme: { color: '#F97316' },
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => toast.error('Payment failed. Please try again.'))
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not initiate activation payment.')
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading Partner Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-r from-orange-500 via-brand-orange to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 border border-white/20 mb-3">
              <Award className="w-4 h-4 text-amber-200" />
              Growthwapi Affiliate & Partner Program
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Earn Every Month on Recurring Referrals
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 mt-2 leading-relaxed">
              Earn up to <b>₹1,000 per referral</b> for the first month + ongoing monthly recurring bonuses. No WhatsApp setup required for partners!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-orange-100 uppercase tracking-wider">Your Partner Code</span>
              {profile?.is_paid_member ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-100 border border-emerald-300/30 text-[10px] font-bold inline-flex items-center gap-1">
                  <CheckCircle2 size={11} /> VIP Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-100 border border-amber-300/30 text-[10px] font-bold inline-flex items-center gap-1">
                  <AlertCircle size={11} /> ₹200 Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-white bg-black/20 px-3 py-1 rounded-xl tracking-wider">
                {referralCode}
              </span>
              <button
                onClick={() => copyToClipboard(referralCode, 'code')}
                className="p-2 bg-white text-brand-orange hover:bg-orange-50 rounded-xl transition-all shadow-xs"
                title="Copy Partner Code"
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activation Paywall Banner if not yet paid */}
      {!profile?.is_paid_member && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-brand-orange/40 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-brand-orange text-white rounded-xl shadow-xs">
                <Sparkles size={18} />
              </span>
              <h2 className="text-lg font-black text-gray-900">
                Activate Your Partner Account — ₹200 One-time Lifetime Fee
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Bas ek baar <b>₹200</b> one-time activation fee pay karein. Isse aapka referral link verified ho jayega aur aap har client par up to <b>₹1,950</b> recurring commission kamana shuru kar sakte hain with instant UPI withdrawals!
            </p>
          </div>

          <button
            onClick={handleActivatePartner}
            disabled={activating}
            className="w-full md:w-auto px-7 py-4 bg-brand-orange hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-300 transition-all transform hover:scale-105 shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {activating ? (
              <span>Opening Payment Gateway...</span>
            ) : (
              <>
                <span>Pay ₹200 & Activate Partner Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Referral Link Sharing Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Share2 size={16} className="text-brand-orange" />
            Your Unique Referral Link
          </span>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline">
            Share on WhatsApp, YouTube, Instagram or Client proposals
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl font-mono text-xs text-gray-800 truncate select-all">
            {partnerLink}
          </div>
          <button
            onClick={() => copyToClipboard(partnerLink, 'link')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
          >
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? 'Copied Link!' : 'Copy Referral Link'}</span>
          </button>
        </div>
      </div>

      {/* Wallet & Stats Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Available Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Available Balance</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            ₹{Number(profile?.pending_balance || 0).toLocaleString()}
          </div>
          <div className="pt-1">
            <button
              onClick={() => setShowPayoutModal(true)}
              disabled={Number(profile?.pending_balance || 0) < 500}
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
            >
              Request Withdrawal
            </button>
          </div>
        </div>

        {/* Card 2: Total Earnings */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Lifetime Earnings</span>
            <div className="p-2 bg-blue-50 text-brand-blue rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            ₹{Number(profile?.total_earnings || 0).toLocaleString()}
          </div>
          <p className="text-xs text-gray-400">Total earned across all clients</p>
        </div>

        {/* Card 3: Paid Out */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Withdrawn / Paid</span>
            <div className="p-2 bg-purple-50 text-brand-purple rounded-xl">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            ₹{Number(profile?.paid_balance || 0).toLocaleString()}
          </div>
          <p className="text-xs text-gray-400">Transferred to UPI / Bank</p>
        </div>

        {/* Card 4: Referred Clients */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active Clients</span>
            <div className="p-2 bg-orange-50 text-brand-orange rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {referrals.length}
          </div>
          <div className="text-xs text-gray-500 flex justify-between">
            <span>Clicks: <b>{profile?.total_clicks || 0}</b></span>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="text-brand-blue font-bold hover:underline"
            >
              Payout Settings →
            </button>
          </div>
        </div>
      </div>

      {/* Tiered Commission Plan Explainer Cards */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-orange" />
            Your Monthly Recurring Commission Matrix
          </h2>
          <p className="text-xs text-gray-500">
            When a referred client pays every month, commissions are automatically added to your wallet according to this schedule:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1: Starter */}
          <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-gray-900">Starter Plan</span>
              <span className="text-xs font-mono font-bold text-brand-blue">₹999/mo</span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between bg-white p-2 rounded-lg border border-gray-100">
                <span>Month 1 Commission:</span>
                <span className="font-bold text-emerald-600">₹300</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-gray-100">
                <span>Month 2 Commission:</span>
                <span className="font-bold text-emerald-600">₹150</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-gray-100">
                <span>Month 3 Commission:</span>
                <span className="font-bold text-emerald-600">₹75</span>
              </div>
            </div>
            <div className="text-[11px] font-semibold text-gray-500 text-center pt-1 border-t border-gray-200">
              Total Max: <b className="text-gray-900">₹525</b> per client
            </div>
          </div>

          {/* Tier 2: Growth */}
          <div className="p-4 rounded-2xl border-2 border-brand-orange bg-orange-50/30 space-y-3 relative">
            <span className="absolute -top-2.5 right-4 bg-brand-orange text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-2xs">
              Most Popular
            </span>
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-gray-900">Growth Plan</span>
              <span className="text-xs font-mono font-bold text-brand-orange">₹2,499/mo</span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between bg-white p-2 rounded-lg border border-orange-100">
                <span>Month 1 Commission:</span>
                <span className="font-bold text-emerald-600">₹500</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-orange-100">
                <span>Month 2 Commission:</span>
                <span className="font-bold text-emerald-600">₹250</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-orange-100">
                <span>Month 3 Commission:</span>
                <span className="font-bold text-emerald-600">₹125</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-orange-100">
                <span>Month 4 Commission:</span>
                <span className="font-bold text-emerald-600">₹75</span>
              </div>
            </div>
            <div className="text-[11px] font-semibold text-gray-500 text-center pt-1 border-t border-orange-200">
              Total Max: <b className="text-brand-orange">₹950</b> per client
            </div>
          </div>

          {/* Tier 3: Pro */}
          <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-gray-900">Pro Plan</span>
              <span className="text-xs font-mono font-bold text-brand-purple">₹5,999/mo</span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between bg-white p-2 rounded-lg border border-purple-100">
                <span>Month 1 Commission:</span>
                <span className="font-bold text-emerald-600">₹1,000</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-purple-100">
                <span>Month 2 Commission:</span>
                <span className="font-bold text-emerald-600">₹500</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-purple-100">
                <span>Month 3 Commission:</span>
                <span className="font-bold text-emerald-600">₹250</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-purple-100">
                <span>Month 4 & 5 Commission:</span>
                <span className="font-bold text-emerald-600">₹125 & ₹75</span>
              </div>
            </div>
            <div className="text-[11px] font-semibold text-gray-500 text-center pt-1 border-t border-purple-200">
              Total Max: <b className="text-brand-purple">₹1,950</b> per client
            </div>
          </div>
        </div>
      </div>

      {/* Referred Clients & Transactions History Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Referred Clients */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Users size={16} className="text-brand-blue" />
              Referred Clients ({referrals.length})
            </h3>
            <span className="text-[10px] text-gray-400 font-semibold">Active Tracker</span>
          </div>

          {referrals.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No clients have registered with your referral link yet. Share your link above to start earning!
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {referrals.map((ref) => (
                <div key={ref.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-gray-900">{ref.client?.name || 'Client'}</div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      {ref.client?.email ? `${ref.client.email.slice(0, 4)}***@${ref.client.email.split('@')[1]}` : 'Client'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-brand-blue border border-blue-100">
                      {ref.current_plan || 'Trial'}
                    </span>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {ref.total_months_paid > 0 ? `${ref.total_months_paid} Months Paid` : 'Signed Up'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Box 2: Commission Transactions */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-600" />
              Commission Earnings History ({commissions.length})
            </h3>
            <span className="text-[10px] text-gray-400 font-semibold">Live Ledger</span>
          </div>

          {commissions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No commission transactions recorded yet. When a referred client subscribes, your earnings will appear here!
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {commissions.map((comm) => (
                <div key={comm.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-gray-900 capitalize">{comm.notes}</div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(comm.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-extrabold text-emerald-600 text-sm">
                    +₹{Number(comm.commission_amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-5 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Withdrawal Payout Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Amount</th>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Txn Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map(po => (
                  <tr key={po.id}>
                    <td className="p-2.5 text-gray-500">{new Date(po.requested_at).toLocaleDateString()}</td>
                    <td className="p-2.5 font-bold text-gray-900">₹{Number(po.amount).toLocaleString()}</td>
                    <td className="p-2.5 uppercase font-mono text-[11px]">{po.payout_method}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        po.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : po.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-gray-500">{po.transaction_ref || 'Pending Processing'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: REQUEST WITHDRAWAL */}
      {/* ============================================================== */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Request Withdrawal</h3>
                <p className="text-xs text-gray-500">Available: ₹{Number(profile?.pending_balance || 0).toLocaleString()}</p>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  min="500"
                  max={Number(profile?.pending_balance || 0)}
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  placeholder="Min ₹500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Transfer Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('upi')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      payoutMethod === 'upi' ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-gray-200'
                    }`}
                  >
                    UPI Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('bank')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      payoutMethod === 'bank' ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-gray-200'
                    }`}
                  >
                    Bank NEFT / IMPS
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingPayout}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  {requestingPayout ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: PAYOUT BANK & UPI SETTINGS */}
      {/* ============================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Payout Bank & UPI Details</h3>
                <p className="text-xs text-gray-500">Provide where you want your commission paid.</p>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSavePayoutSettings} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID (Google Pay, PhonePe, Paytm)</label>
                <input
                  type="text"
                  value={settingsForm.upi_id}
                  onChange={e => setSettingsForm({ ...settingsForm, upi_id: e.target.value })}
                  placeholder="e.g. yourname@okhdfcbank"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono outline-none"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Or Bank Account Details</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={settingsForm.bank_account_name}
                    onChange={e => setSettingsForm({ ...settingsForm, bank_account_name: e.target.value })}
                    placeholder="Account Holder Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={settingsForm.bank_account_number}
                    onChange={e => setSettingsForm({ ...settingsForm, bank_account_number: e.target.value })}
                    placeholder="Bank Account Number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono outline-none"
                  />
                  <input
                    type="text"
                    value={settingsForm.bank_ifsc}
                    onChange={e => setSettingsForm({ ...settingsForm, bank_ifsc: e.target.value })}
                    placeholder="IFSC Code (e.g. HDFC0001234)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono uppercase outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2 bg-brand-orange text-white font-bold text-xs rounded-xl shadow-xs hover:bg-orange-600 disabled:opacity-50"
                >
                  {savingSettings ? 'Saving...' : 'Save Payout Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

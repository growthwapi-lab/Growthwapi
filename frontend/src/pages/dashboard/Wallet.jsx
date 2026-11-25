import { useState, useEffect } from 'react'
import { Wallet as WalletIcon, Plus, CreditCard, Package, CheckCircle2, AlertCircle, Calendar, ShieldCheck, Sparkles } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 999,
    features: ['Official Meta WhatsApp API', 'Basic Shared Inbox', '1 Team Member Seat', 'Template Approval Manager', 'Unlimited Contacts CRM'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 2999,
    popular: true,
    features: ['Official Meta WhatsApp API', 'Shared Multi-Agent Team Inbox', '5 Team Members', '24/7 AI Smart Bot (500 replies/mo)', 'Bulk Broadcasts Engine', 'Advanced Analytics'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 7999,
    features: ['Official Meta WhatsApp API', 'Everything in Growth Plan', 'Unlimited Team Members', '24/7 AI Smart Bot (2,000 replies/mo)', 'Developer REST API & Webhooks', 'Priority 1-on-1 Support'],
  },
]

const PLAN_ORDER = ['starter', 'growth', 'pro']

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

export default function Wallet() {
  const [balance, setBalance] = useState(0)
  const [usage, setUsage] = useState({ utility: 0, marketing: 0, utilityQuota: 20000, marketingQuota: 10000 })
  const [subscription, setSubscription] = useState(null)
  const [trialStatus, setTrialStatus] = useState(null)
  const [activePlan, setActivePlan] = useState(null)
  const [rechargeAmount, setRechargeAmount] = useState(500)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim().toUpperCase()
    if (!code) {
      toast.error('Please enter a coupon code')
      return
    }
    setValidatingCoupon(true)
    try {
      const { data } = await api.get(`/api/payments/validate-coupon?code=${code}`)
      if (data.valid) {
        setAppliedCoupon({ code, ...data })
        toast.success(`🎉 ${code} applied! 50% Grand Launch discount active.`)
      } else {
        toast.error(data.message || 'Invalid or expired coupon code.')
      }
    } catch {
      toast.error('Could not validate coupon.')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    toast.success('Coupon removed')
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    setPageLoading(true)
    try {
      const [res, trialRes, activePlanRes] = await Promise.all([
        api.get('/api/wallet/balance').catch(() => ({ data: {} })),
        api.get('/api/users/trial-status').catch(() => ({ data: null })),
        api.get('/api/users/active-plan').catch(() => ({ data: null })),
      ])

      setBalance(res.data.wallet_balance || 0)
      setUsage({
        utility: res.data.utility_msgs_sent || 0,
        marketing: res.data.marketing_msgs_sent || 0,
        utilityQuota: res.data.utility_quota || 20000,
        marketingQuota: res.data.marketing_quota || 10000,
      })
      if (res.data.subscription) setSubscription(res.data.subscription)
      if (trialRes.data) setTrialStatus(trialRes.data)
      if (activePlanRes.data) setActivePlan(activePlanRes.data)
    } catch {
      // Use defaults
    } finally {
      setPageLoading(false)
    }
  }

  const isTrial = activePlan ? !activePlan.isPaid : (trialStatus ? !trialStatus.isPaid : true)

  const handleRecharge = async () => {
    if (isTrial) {
      toast.error('Wallet recharge is available only after upgrading to a paid subscription.')
      return
    }
    if (!rechargeAmount || rechargeAmount < 100) {
      toast.error('Minimum recharge amount is ₹100')
      return
    }
    setLoading(true)
    const loaded = await loadRazorpay()
    if (!loaded) {
      toast.error('Razorpay SDK failed to load. Check your internet connection.')
      setLoading(false)
      return
    }

    try {
      const { data: order } = await api.post('/api/payments/create-wallet-order', { amount: rechargeAmount })
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Growthwapi',
        description: 'Wallet Recharge',
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/api/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              type: 'wallet',
              amount: rechargeAmount,
            })
            toast.success(`₹${rechargeAmount} added to your wallet!`)
            fetchWalletData()
            window.dispatchEvent(new Event('planUpdated'))
          } catch {
            toast.error('Payment verification failed. Contact support.')
          }
        },
        prefill: { name: 'User' },
        theme: { color: '#F97316' },
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => toast.error('Payment failed. Please try again.'))
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not initiate payment.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId) => {
    setLoading(true)
    const loaded = await loadRazorpay()
    if (!loaded) {
      toast.error('Razorpay SDK failed to load.')
      setLoading(false)
      return
    }

    try {
      const { data: order } = await api.post('/api/payments/create-subscription-order', {
        planType: planId,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined
      })
      const plan = PLANS.find(p => p.id === planId)
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Growthwapi',
        description: `${plan.name} Plan Subscription`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/api/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              type: 'subscription',
              planType: planId,
            })
            toast.success(`🎉 Welcome to the ${plan.name} plan!`)
            fetchWalletData()
            window.dispatchEvent(new Event('planUpdated'))
          } catch {
            toast.error('Payment verification failed. Contact support.')
          }
        },
        prefill: { name: 'User' },
        theme: { color: '#1E3A8A' },
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => toast.error('Payment failed. Please try again.'))
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not initiate payment.')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Determine current active plan state for UI
  const currentPkg = activePlan?.packageType || 'trial'
  const currentPrice = activePlan?.price || 0
  const isPaidActive = activePlan?.isPaid && activePlan?.status === 'Active'
  const isExpired = activePlan?.status === 'Expired'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Wallet & Billing</h1>
        <p className="text-gray-500 mt-1">Manage your balance, monthly quota usage, and subscription plans.</p>
      </div>

      {/* Current Subscription Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} className="text-brand-blue" />
              <h2 className="text-xl font-bold text-brand-dark">Current Plan: {activePlan?.plan || 'Free Trial'}</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                activePlan?.isPaid
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-purple-100 text-purple-700 border border-purple-200'
              }`}>
                {activePlan?.status || 'Active'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {activePlan?.isPaid ? (
                <>Price: <strong>₹{activePlan.price.toLocaleString()}/mo</strong></>
              ) : (
                <>4-Day Free Trial Mode</>
              )}
            </p>
          </div>
          {activePlan?.endDate && (
            <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-brand-orange" />
              <div>
                <span className="text-gray-500 block text-xs">Renewal / Expiry Date</span>
                <span className="font-bold text-brand-dark">
                  {new Date(activePlan.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="text-xs text-brand-purple font-semibold ml-2">
                  ({activePlan.daysRemaining} day{activePlan.daysRemaining !== 1 ? 's' : ''} left)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quota Progress inside Current Plan */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <div className="flex justify-between text-sm mb-1.5 font-medium">
              <span className="text-gray-700">Utility Messages Used</span>
              <span className="text-brand-blue font-bold">
                {(activePlan?.utilityUsed ?? 0).toLocaleString()} / {(activePlan?.utilityQuota ?? 50).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-brand-blue h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((activePlan?.utilityUsed ?? 0) / (activePlan?.utilityQuota || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5 font-medium">
              <span className="text-gray-700">Marketing Messages Used</span>
              <span className="text-brand-orange font-bold">
                {(activePlan?.marketingUsed ?? 0).toLocaleString()} / {(activePlan?.marketingQuota ?? 20).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-brand-orange h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((activePlan?.marketingUsed ?? 0) / (activePlan?.marketingQuota || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Balance + Usage Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="md:col-span-1 bg-gradient-to-br from-brand-blue to-blue-800 text-white rounded-2xl p-6 shadow-lg shadow-blue-200">
          <div className="flex items-center gap-2 mb-1 text-blue-200 text-sm font-medium">
            <WalletIcon size={16} /> Wallet Balance
          </div>
          <p className="text-4xl font-bold mt-2">₹{balance.toFixed(2)}</p>
          <p className="text-blue-200 text-sm mt-1">Available for message overage charges</p>
          <div className="mt-4 p-3 bg-white/10 rounded-lg text-sm space-y-1">
            <p>Utility message rate: <span className="font-bold">₹0.25/msg</span></p>
            <p>Marketing message rate: <span className="font-bold">₹0.95/msg</span></p>
          </div>
        </div>

        {/* Recharge Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
              <Plus size={18} className="text-brand-orange" /> Recharge Wallet
            </h2>

            {isTrial ? (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-brand-dark flex items-center gap-3">
                <AlertCircle size={20} className="text-brand-orange flex-shrink-0" />
                <span>🔒 Wallet recharge is disabled during the Free Trial. Upgrade to a paid plan to enable instant wallet recharge.</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">Choose a quick recharge amount or enter a custom value:</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {[100, 500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setRechargeAmount(amt)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        rechargeAmount === amt
                          ? 'bg-brand-orange text-white border-brand-orange'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-brand-orange'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 max-w-md">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <input
                      type="number"
                      min={100}
                      value={rechargeAmount}
                      onChange={e => setRechargeAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange outline-none"
                    />
                  </div>
                  <button
                    onClick={handleRecharge}
                    disabled={loading}
                    className="bg-brand-orange text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  >
                    <CreditCard size={18} /> {loading ? 'Processing...' : 'Recharge Now'}
                  </button>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600 inline" />
            100% Safe & Secure Payments powered by Razorpay
          </p>
        </div>
      </div>

      {/* Subscription Plans Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-bold text-brand-dark text-lg flex items-center gap-2">
              <Package size={20} className="text-brand-blue" /> Choose / Upgrade Subscription Plan
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Upgrades take effect immediately and are prorated based on your current plan price.
            </p>
          </div>
          {activePlan?.isHighestPlan && (
            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Sparkles size={14} /> You are on our highest plan!
            </span>
          )}
        </div>

        {/* Launch Coupon Box */}
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏷️</span>
            <div>
              <div className="text-sm font-black text-gray-900 flex items-center gap-2">
                Have a Grand Launch Coupon?
                <button
                  type="button"
                  onClick={() => handleApplyCoupon('LAUNCH50')}
                  className="text-xs font-bold text-brand-orange underline hover:text-orange-700 cursor-pointer"
                >
                  Apply LAUNCH50 (50% OFF)
                </button>
              </div>
              <p className="text-xs text-gray-600">
                Unlock Flat 50% OFF on all plans during our Grand Launch special window!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {appliedCoupon ? (
              <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-black">
                <span>✓ {appliedCoupon.code} Applied (50% OFF)</span>
                <button type="button" onClick={handleRemoveCoupon} className="text-emerald-700 hover:text-red-600 font-bold ml-1 cursor-pointer">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="e.g. LAUNCH50"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs uppercase font-bold tracking-wider w-full sm:w-36 focus:outline-brand-orange"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={validatingCoupon}
                  className="bg-brand-orange hover:bg-orange-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  {validatingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => {
            const planIdx = PLAN_ORDER.indexOf(plan.id)
            const currentIdx = PLAN_ORDER.indexOf(currentPkg)
            const finalPrice = appliedCoupon ? Math.round(plan.price * (1 - appliedCoupon.discountPercent / 100)) : plan.price
            
            let btnText = `Subscribe — ₹${finalPrice.toLocaleString()}/mo`
            let btnDisabled = false
            let isCurrent = false

            if (isPaidActive) {
              if (plan.id === currentPkg) {
                btnText = 'Current Plan'
                btnDisabled = true
                isCurrent = true
              } else if (planIdx < currentIdx) {
                btnText = 'Available at next renewal'
                btnDisabled = true
              } else if (planIdx > currentIdx) {
                const diff = finalPrice - (appliedCoupon ? Math.round(currentPrice * 0.5) : currentPrice)
                btnText = `Upgrade for ₹${Math.max(0, diff).toLocaleString()}`
                btnDisabled = false
              }
            } else if (isExpired && plan.id === currentPkg) {
              btnText = `Renew Plan — ₹${finalPrice.toLocaleString()}/mo`
              btnDisabled = false
            }

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 border-2 transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-brand-blue bg-blue-50/40 shadow-md ring-2 ring-brand-blue/20'
                    : plan.popular
                    ? 'border-brand-orange bg-orange-50/30 shadow-md'
                    : 'border-gray-200 hover:border-brand-blue'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-brand-dark text-xl">{plan.name}</h3>
                    {isCurrent && (
                      <span className="bg-brand-blue text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Current</span>
                    )}
                    {!isCurrent && plan.popular && (
                      <span className="bg-brand-orange text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Most Popular</span>
                    )}
                  </div>
                  <div className="text-3xl font-extrabold my-3 text-brand-dark flex items-baseline gap-2">
                    {appliedCoupon ? (
                      <>
                        <span className="text-emerald-600 font-black">₹{finalPrice.toLocaleString()}</span>
                        <span className="text-base line-through text-gray-400 font-normal">₹{plan.price.toLocaleString()}</span>
                      </>
                    ) : (
                      <span>₹{plan.price.toLocaleString()}</span>
                    )}
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || btnDisabled}
                  className={`w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrent
                      ? 'bg-gray-200 text-gray-600 border border-gray-300'
                      : plan.popular
                      ? 'bg-brand-orange text-white hover:bg-orange-600 shadow-md shadow-orange-200'
                      : 'bg-brand-blue text-white hover:bg-blue-900 shadow-md shadow-blue-200'
                  }`}
                >
                  {loading ? 'Processing...' : btnText}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          💬 Official Meta conversation charges apply separately via transparent prepaid wallet recharge (at Meta actual rates).
        </p>

        <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-600 inline" />
          Secured by Razorpay. All major UPI, Credit/Debit cards & Net Banking supported.
        </p>
      </div>
    </div>
  )
}

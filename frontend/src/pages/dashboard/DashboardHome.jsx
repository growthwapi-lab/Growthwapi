import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { MessageSquare, Users, Send, Wallet, CheckCircle, Smartphone, ShieldCheck, ArrowRight, Award, Gift, Sparkles } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function DashboardHome() {
  const { user } = useAuth()
  const name = user?.email?.split('@')[0] || 'User'

  // Instant Cache initialization (0ms display, eliminates 20s cold start flash)
  const cachedProfile = (() => {
    try { return JSON.parse(localStorage.getItem('gw_cached_profile') || 'null') } catch { return null }
  })()
  const cachedPlan = (() => {
    try { return JSON.parse(localStorage.getItem('gw_cached_plan') || 'null') } catch { return null }
  })()
  const cachedStats = (() => {
    try { return JSON.parse(localStorage.getItem('gw_cached_stats') || 'null') } catch { return null }
  })()

  const [profile, setProfile] = useState(cachedProfile)
  const [activePlan, setActivePlan] = useState(cachedPlan)
  const [statsData, setStatsData] = useState(cachedStats || { messages: 0, contacts: 0, campaigns: 0, balance: 0 })
  const [recentMessages, setRecentMessages] = useState([])
  const [connecting, setConnecting] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(!cachedProfile)
  const [loadingStats, setLoadingStats] = useState(!cachedStats)

  const signupBufferRef = useRef({})
  const signupTimeoutRef = useRef(null)

  const triggerSignupSubmit = (partialData) => {
    signupBufferRef.current = { ...signupBufferRef.current, ...partialData }
    if (signupTimeoutRef.current) clearTimeout(signupTimeoutRef.current)
    signupTimeoutRef.current = setTimeout(() => {
      handleSignupComplete(signupBufferRef.current)
    }, 300)
  }

  useEffect(() => {
    fetchProfile()
    fetchDashboardStats()
    fetchActivePlan()

    const handlePlanUpdate = () => fetchActivePlan()
    window.addEventListener('planUpdated', handlePlanUpdate)

    // Listen for postMessage from Meta Embedded Signup popup
    const handleMessageEvent = (event) => {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
        return;
      }
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH') {
            const { phone_number_id, waba_id } = data.data || {};
            triggerSignupSubmit({ phone_number_id, waba_id });
          } else if (data.event === 'CANCEL') {
            toast.error('WhatsApp connection was not completed. Please try again.');
            setConnecting(false);
          }
        }
      } catch (e) {
        // Not a JSON message or unrelated event
      }
    };

    window.addEventListener('message', handleMessageEvent);
    return () => {
      window.removeEventListener('message', handleMessageEvent);
      window.removeEventListener('planUpdated', handlePlanUpdate);
      if (signupTimeoutRef.current) clearTimeout(signupTimeoutRef.current);
    };
  }, [])

  const fetchActivePlan = async () => {
    try {
      const res = await api.get('/api/users/active-plan')
      setActivePlan(res.data)
      try { localStorage.setItem('gw_cached_plan', JSON.stringify(res.data)) } catch {}
    } catch {
      // ignore
    }
  }

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/users/profile')
      setProfile(res.data)
      try { localStorage.setItem('gw_cached_profile', JSON.stringify(res.data)) } catch {}
    } catch (err) {
      console.error('Failed to fetch profile', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const fetchDashboardStats = async () => {
    if (!cachedStats) setLoadingStats(true)
    try {
      const [msgRes, contactRes, broadcastRes, walletRes] = await Promise.all([
        api.get('/api/whatsapp/messages').catch(() => ({ data: [] })),
        api.get('/api/contacts').catch(() => ({ data: [] })),
        api.get('/api/whatsapp/broadcasts').catch(() => ({ data: [] })),
        api.get('/api/wallet/balance').catch(() => ({ data: { wallet_balance: 0 } })),
      ]);

      const msgs = msgRes.data || [];
      const contacts = contactRes.data || [];
      const broadcasts = broadcastRes.data || [];
      const wallet = walletRes.data || {};

      const newStats = {
        messages: msgs.length,
        contacts: contacts.length,
        campaigns: broadcasts.length,
        balance: wallet.wallet_balance || 0,
      }
      setStatsData(newStats)
      try { localStorage.setItem('gw_cached_stats', JSON.stringify(newStats)) } catch {}
      setRecentMessages(msgs.slice(0, 5))
    } catch (e) {
      console.error('Error loading dashboard stats:', e);
    } finally {
      setLoadingStats(false);
    }
  }

  const handleSignupComplete = async (signupData) => {
    setConnecting(true)
    try {
      const res = await api.post('/api/whatsapp/embedded-signup-callback', {
        code: signupData.code || null,
        waba_id: signupData.waba_id || null,
        phone_number_id: signupData.phone_number_id || null,
      })
      toast.success('🎉 WhatsApp Business account connected successfully!')
      if (res.data?.user) {
        setProfile(res.data.user)
        try { localStorage.setItem('gw_cached_profile', JSON.stringify(res.data.user)) } catch {}
      } else {
        fetchProfile()
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete connection.')
    } finally {
      setConnecting(false)
    }
  }

  const launchEmbeddedSignup = () => {
    if (typeof window.FB === 'undefined') {
      toast.error('Facebook SDK is still loading. Please check your internet or try again in a few seconds.');
      return;
    }

    setConnecting(true);

    window.FB.login(
      function (response) {
        if (response.authResponse) {
          const code = response.authResponse.code;
          triggerSignupSubmit({ code });
        } else {
          toast.error('WhatsApp connection was not completed. Please try again.');
          setConnecting(false);
        }
      },
      {
        config_id: '2380333125703909',
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
        },
      }
    );
  };

  const isConnected = Boolean(profile?.whatsapp_phone_number_id || profile?.whatsapp_waba_id)

  const stats = [
    { title: 'Messages Sent', value: loadingStats ? '...' : statsData.messages.toLocaleString(), icon: MessageSquare, color: 'text-brand-blue', bg: 'bg-blue-50' },
    { title: 'Total Contacts', value: loadingStats ? '...' : statsData.contacts.toLocaleString(), icon: Users, color: 'text-brand-orange', bg: 'bg-orange-50' },
    { title: 'Active Campaigns', value: loadingStats ? '...' : statsData.campaigns.toLocaleString(), icon: Send, color: 'text-brand-purple', bg: 'bg-purple-50' },
    { title: 'Wallet Balance', value: loadingStats ? '...' : `₹${statsData.balance.toFixed(2)}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-dark">Welcome back, {name}!</h1>
      </div>

      {/* WhatsApp Connection Banner */}
      {loadingProfile && !profile ? (
        <div className="bg-white rounded-2xl p-7 border border-gray-200 shadow-sm animate-pulse flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-200 rounded-lg w-48" />
              <div className="h-3.5 bg-gray-100 rounded-lg w-3/4 max-w-md" />
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded-xl w-32 shrink-0 hidden md:block" />
        </div>
      ) : isConnected ? (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-lg shadow-teal-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white flex-shrink-0">
              <CheckCircle size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">WhatsApp Connected</h2>
                <span className="bg-white/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">Active</span>
              </div>
              <p className="text-teal-100 text-sm mt-1">
                Your Meta WhatsApp Business account is connected and ready to send messages.
              </p>
              {profile?.whatsapp_display_phone && (
                <p className="text-white font-mono text-sm mt-2 flex items-center gap-1.5">
                  <Smartphone size={16} /> {profile.whatsapp_display_phone}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={launchEmbeddedSignup}
            disabled={connecting}
            className="mt-4 md:mt-0 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Reconnect Account
          </button>
        </div>
      ) : (
        <div className="bg-brand-orange text-white rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-lg shadow-orange-100">
          <div>
            <h2 className="text-xl font-bold mb-2">Connect Your WhatsApp Number</h2>
            <p className="text-orange-100 mb-4 md:mb-0">
              Connect via Meta's official WhatsApp Embedded Signup to start broadcasting & sending automated messages.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-4 md:mt-0">
            <Link
              to="/dashboard/setup-guide"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-lg font-bold text-xs sm:text-sm transition-colors whitespace-nowrap border border-white/30"
            >
              Step-by-Step Guide &rarr;
            </Link>
            <button
              onClick={launchEmbeddedSignup}
              disabled={connecting}
              className="bg-white text-brand-orange px-6 py-3 rounded-lg font-bold hover:bg-orange-50 transition-colors whitespace-nowrap flex items-center gap-2 shadow-md disabled:opacity-50 text-xs sm:text-sm"
            >
              {connecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Now'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Subscription / Plan Status Card */}
      {activePlan && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold flex-shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-brand-dark text-lg">Active Plan: {activePlan.plan}</h3>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  activePlan.isAdmin
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : activePlan.isPaid 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {activePlan.isAdmin ? '👑 ADMIN PRO (PERMANENT PAID)' : activePlan.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {activePlan.isAdmin ? (
                  <><strong>Lifetime Access</strong> — Growthwapi Admin Account (Permanently Paid PRO Member)</>
                ) : activePlan.isPaid ? (
                  <><strong>₹{activePlan.price.toLocaleString()}/mo</strong> — Renews {new Date(activePlan.endDate).toLocaleDateString()}</>
                ) : (
                  <>Trial Cap: 50 utility, 30 marketing messages | {activePlan.daysRemaining} days left</>
                )}
              </p>
            </div>
          </div>
          {activePlan.isAdmin ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/dashboard/team"
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Users size={16} /> Unlimited Team
              </Link>
              <Link
                to="/dashboard/admin"
                className="bg-gradient-to-r from-brand-blue to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                Open Super Admin Panel <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard/wallet"
              className="bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Manage Billing & Wallet <ArrowRight size={16} />
            </Link>
          )}
        </div>
      )}

      {/* 3+3 Loyalty Rewards Progress Card (Hidden for Admin) */}
      {activePlan && !activePlan.isAdmin && (
        <div className="bg-gradient-to-br from-white via-orange-50/25 to-amber-50/40 rounded-2xl border border-orange-200/80 shadow-xs p-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                🏆
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-brand-dark text-lg flex items-center gap-1.5">
                    3+3 Loyalty Rewards Club
                  </h3>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    activePlan?.loyaltyProgress?.isRewardUnlocked
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-orange-100 text-orange-700 border border-orange-300'
                  }`}>
                    {activePlan?.loyaltyProgress?.isRewardUnlocked ? '🎉 50% OFF UNLOCKED' : 'MILESTONE IN PROGRESS'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  {activePlan?.loyaltyProgress?.statusText || 'Stay active for 3 consecutive months to unlock flat 50% OFF for months 4, 5 & 6!'}
                </p>
              </div>
            </div>

            <Link
              to="/dashboard/wallet"
              className="self-start md:self-auto text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>View Loyalty Offers</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Progress Bar Container */}
          <div className="relative z-10 space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600">
              <span className="flex items-center gap-1">
                <span>Loyalty Streak:</span>
                <span className="text-orange-600 font-extrabold">
                  {activePlan?.loyaltyProgress?.consecutiveMonths || 0}/3 Months
                </span>
              </span>
              <span className="text-gray-500 font-medium">
                {activePlan?.loyaltyProgress?.progressPercent || 0}% Completed
              </span>
            </div>

            {/* Visual Multi-step Bar */}
            <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-green-500 transition-all duration-700 shadow-xs"
                style={{ width: `${Math.max(8, activePlan?.loyaltyProgress?.progressPercent || 0)}%` }}
              />
            </div>

            {/* Milestone Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className={`p-2.5 rounded-xl border text-xs transition-all ${
                (activePlan?.loyaltyProgress?.consecutiveMonths || 0) >= 1
                  ? 'bg-orange-500/10 border-orange-300 text-orange-950 font-bold'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider">Month 1</div>
                <div className="text-xs font-extrabold mt-0.5">
                  {(activePlan?.loyaltyProgress?.consecutiveMonths || 0) >= 1 ? '✅ Active' : 'Starter'}
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border text-xs transition-all ${
                (activePlan?.loyaltyProgress?.consecutiveMonths || 0) >= 2
                  ? 'bg-orange-500/10 border-orange-300 text-orange-950 font-bold'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider">Month 2</div>
                <div className="text-xs font-extrabold mt-0.5">
                  {(activePlan?.loyaltyProgress?.consecutiveMonths || 0) >= 2 ? '✅ Active' : 'Streak'}
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border text-xs transition-all ${
                (activePlan?.loyaltyProgress?.consecutiveMonths || 0) >= 3
                  ? 'bg-orange-500/10 border-orange-300 text-orange-950 font-bold'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider">Month 3</div>
                <div className="text-xs font-extrabold mt-0.5">
                  {(activePlan?.loyaltyProgress?.consecutiveMonths || 0) >= 3 ? '✅ Milestone' : 'Target'}
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border text-xs transition-all ${
                activePlan?.loyaltyProgress?.isRewardUnlocked
                  ? 'bg-green-500/15 border-green-400 text-green-950 font-bold ring-2 ring-green-400/40'
                  : 'bg-amber-50/80 border-amber-200 text-amber-800'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider">Months 4, 5, 6</div>
                <div className="text-xs font-black text-green-700 mt-0.5">
                  {activePlan?.loyaltyProgress?.isRewardUnlocked ? '🎁 50% OFF UNLOCKED' : '🎁 50% OFF Reward'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-lg`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-brand-dark">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-brand-dark">Recent Activity</h3>
        </div>
        {recentMessages.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentMessages.map((m, idx) => (
              <div key={m.id || idx} className="p-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${m.direction === 'outbound' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {m.direction}
                  </span>
                  <span className="font-mono text-gray-600">{m.direction === 'outbound' ? m.to_number : m.from_number}</span>
                </div>
                <span className="text-gray-400 text-xs">{new Date(m.sent_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : loadingStats ? (
          <div className="p-6 space-y-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-5 bg-gray-200 rounded" />
                  <div className="w-32 h-4 bg-gray-100 rounded" />
                </div>
                <div className="w-24 h-4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <MessageSquare className="text-gray-300 mb-4" size={48} />
            <p>No recent activity. Start by sending a message!</p>
          </div>
        )}
      </div>
    </div>
  )
}

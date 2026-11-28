import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { MessageSquare, Users, Send, BarChart2, Wallet, Settings, LogOut, Menu, X, FileText, Code, Bot, ShieldCheck, Award, UserPlus, Compass, BookOpen, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'

// Shared AudioContext unlocked on first user gesture so background polling can play sound
let sharedAudioCtx = null

function getOrUnlockAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx()
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {})
    }
    return sharedAudioCtx
  } catch {
    return null
  }
}

// Unlock audio on first click/tap/keypress anywhere in the app
if (typeof window !== 'undefined') {
  const unlock = () => {
    getOrUnlockAudioContext()
  }
  window.addEventListener('pointerdown', unlock, { once: true, passive: true })
  window.addEventListener('keydown', unlock, { once: true, passive: true })
}

// Play a clean two-tone notification chime using unlocked Web Audio API
async function playNotificationSound() {
  try {
    const ctx = getOrUnlockAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    const now = ctx.currentTime

    const playTone = (freq, startOffset, duration) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + startOffset)
      gain.gain.setValueAtTime(0.001, now + startOffset)
      gain.gain.exponentialRampToValueAtTime(0.28, now + startOffset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + startOffset)
      osc.stop(now + startOffset + duration)
    }

    playTone(880, 0, 0.16)
    playTone(1174.66, 0.14, 0.25)
  } catch {
    // Ignore autoplay restrictions before user interaction
  }
}

function LaunchOfferCountdown({ deadline, isUrgent, isExpiredTrial }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculateTime = () => {
      const diff = Math.max(0, new Date(deadline) - new Date())
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft({ days, hours, minutes, seconds })
    }
    calculateTime()
    const timer = setInterval(calculateTime, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  return (
    <div className={`${isUrgent ? 'bg-gradient-to-r from-red-600 via-orange-600 to-red-600 animate-pulse' : 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600'} text-white px-4 py-2 text-xs sm:text-sm font-medium text-center flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 shadow-md z-10`}>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="font-black text-yellow-300">⚡ GRAND LAUNCH 50% OFF:</span>
        <span>
          {isExpiredTrial 
            ? 'Aapka Exclusive Launch Offer expire ho raha hai!' 
            : 'Pre-Registration Launch Offer is LIVE!'} Use code <span className="font-black underline bg-white/20 px-1.5 py-0.5 rounded">LAUNCH50</span>
        </span>
        <span className="bg-black/30 px-2 py-0.5 rounded-lg font-mono font-black text-yellow-200 text-xs">
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{String(timeLeft.hours).padStart(2, '0')}h:{String(timeLeft.minutes).padStart(2, '0')}m:{String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
      <Link to="/dashboard/wallet" className="bg-white text-orange-600 hover:bg-orange-50 px-3 py-1 rounded-lg text-xs font-black shadow-xs transition-transform transform hover:scale-105 shrink-0">
        Claim 50% OFF Now →
      </Link>
    </div>
  )
}

export default function DashboardLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePlan, setActivePlan] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gw_cached_plan') || 'null')
    } catch { return null }
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifPermission, setNotifPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const notifiedIdsRef = useRef(new Set())
  const baseTitleRef = useRef(document.title || 'Growthwapi')
  const pathnameRef = useRef(location.pathname)

  useEffect(() => {
    pathnameRef.current = location.pathname
    if (location.pathname.startsWith('/dashboard/inbox')) {
      setUnreadCount(0)
      document.title = baseTitleRef.current
      try {
        localStorage.setItem('gw_last_seen_inbox_at', new Date().toISOString())
      } catch {}
    }
  }, [location.pathname])

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('Notifications are not supported on this browser.')
      return
    }
    try {
      const perm = await Notification.requestPermission()
      setNotifPermission(perm)
      if (perm === 'granted') {
        playNotificationSound()
        toast.success('🔔 Inbox alerts enabled! You will be notified for new messages.')
      } else if (perm === 'denied') {
        toast.error('Notification permission blocked. Please allow it in browser site settings.')
      }
    } catch {
      toast.error('Could not enable notifications.')
    }
  }

  // Poll for new inbound WhatsApp messages every 10 seconds
  useEffect(() => {
    if (!user) return

    // Initialize baseline timestamp on first visit so old messages don't trigger alerts
    try {
      if (!localStorage.getItem('gw_last_seen_inbox_at')) {
        localStorage.setItem('gw_last_seen_inbox_at', new Date().toISOString())
      }
    } catch {}

    const checkNewMessages = async () => {
      try {
        const res = await api.get('/api/whatsapp/messages')
        const msgs = Array.isArray(res.data) ? res.data : []
        const lastSeenStr = localStorage.getItem('gw_last_seen_inbox_at') || new Date(0).toISOString()
        const lastSeenTime = new Date(lastSeenStr).getTime()

        const unreadInbound = msgs.filter(m =>
          m.direction === 'inbound' &&
          m.sent_at &&
          new Date(m.sent_at).getTime() > lastSeenTime
        )

        const isOnInbox = pathnameRef.current.startsWith('/dashboard/inbox')
        if (isOnInbox) {
          // If already viewing Inbox, update last seen and keep unread badge 0
          setUnreadCount(0)
          document.title = baseTitleRef.current
          if (unreadInbound.length > 0) {
            localStorage.setItem('gw_last_seen_inbox_at', new Date().toISOString())
          }
        } else {
          setUnreadCount(unreadInbound.length)
          document.title = unreadInbound.length > 0
            ? `(${unreadInbound.length}) New WhatsApp Message | Growthwapi`
            : baseTitleRef.current
        }

        // Trigger alert only once per newly arrived inbound message
        const newlyArrived = unreadInbound.filter(m => !notifiedIdsRef.current.has(m.id))
        if (newlyArrived.length > 0) {
          newlyArrived.forEach(m => notifiedIdsRef.current.add(m.id))
          const latest = newlyArrived[0]
          const senderLabel = latest.from_number || 'Customer'
          const preview = (latest.content || 'New message').slice(0, 70)

          playNotificationSound()

          if (!isOnInbox) {
            toast(
              (t) => (
                <div
                  onClick={() => {
                    toast.dismiss(t.id)
                    navigate('/dashboard/inbox')
                  }}
                  className="cursor-pointer flex items-start gap-2.5"
                >
                  <span className="text-lg leading-none">💬</span>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900">New message from {senderLabel}</p>
                    <p className="text-gray-600 truncate max-w-[220px]">{preview}</p>
                    <p className="text-brand-orange font-semibold mt-0.5">Tap to open Inbox →</p>
                  </div>
                </div>
              ),
              { duration: 5000 }
            )
          }

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && (document.hidden || !isOnInbox)) {
            const n = new Notification(`New WhatsApp from ${senderLabel}`, {
              body: preview,
              icon: '/logo.png.png',
              tag: `gw-msg-${latest.id}`,
            })
            n.onclick = () => {
              window.focus()
              navigate('/dashboard/inbox')
              n.close()
            }
          }
        }
      } catch {
        // Silent fail on background poll
      }
    }

    checkNewMessages()
    const interval = setInterval(checkNewMessages, 10000)
    return () => {
      clearInterval(interval)
      document.title = baseTitleRef.current
    }
  }, [user, navigate])

  const ADMIN_EMAILS = ['sauravrai8757@gmail.com', 'growthwapi@gmail.com']
  const userEmail = (user?.email || '').toLowerCase()
  const userPhone = (user?.user_metadata?.phone || user?.phone || '').replace(/\D/g, '')

  useEffect(() => {
    if (ADMIN_EMAILS.includes(userEmail) || userEmail.includes('growthwapi') || userPhone.endsWith('9122257780')) {
      setIsAdmin(true)
    } else {
      api.get('/api/admin/verify')
        .then(() => setIsAdmin(true))
        .catch(() => setIsAdmin(false))
    }
  }, [userEmail, userPhone])

  useEffect(() => {
    fetchActivePlan()
    const handlePlanUpdate = () => fetchActivePlan()
    window.addEventListener('planUpdated', handlePlanUpdate)
    return () => window.removeEventListener('planUpdated', handlePlanUpdate)
  }, [location.pathname])

  const fetchActivePlan = () => {
    api.get('/api/users/active-plan')
      .then(res => {
        setActivePlan(res.data)
        try { localStorage.setItem('gw_cached_plan', JSON.stringify(res.data)) } catch {}
      })
      .catch(() => {})
  }

  const isAgent = Boolean(user?.user_metadata?.owner_id || user?.user_metadata?.is_team_member)

  const navItems = isAgent
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: BarChart2, exact: true },
        { name: 'Inbox', path: '/dashboard/inbox', icon: MessageSquare, badge: unreadCount > 0 ? String(unreadCount) : 'LIVE', isAlertBadge: unreadCount > 0 },
        { name: 'Contacts', path: '/dashboard/contacts', icon: Users },
        { name: 'Templates', path: '/dashboard/templates', icon: FileText },
        { name: 'Broadcast', path: '/dashboard/broadcast', icon: Send },
        { name: 'Feature Tour', path: '/dashboard/overview', icon: BookOpen },
        { name: 'Settings', path: '/dashboard/settings', icon: Settings },
      ]
    : [
        { name: 'Dashboard', path: '/dashboard', icon: BarChart2, exact: true },
        { name: 'Inbox', path: '/dashboard/inbox', icon: MessageSquare, badge: unreadCount > 0 ? String(unreadCount) : '', isAlertBadge: unreadCount > 0 },
        { name: 'AI Agent', path: '/dashboard/ai-agent', icon: Bot },
        { name: 'Contacts', path: '/dashboard/contacts', icon: Users },
        { name: 'Templates', path: '/dashboard/templates', icon: FileText },
        { name: 'Broadcast', path: '/dashboard/broadcast', icon: Send },
        { name: 'Team Members', path: '/dashboard/team', icon: UserPlus, badge: (isAdmin || activePlan?.isAdmin || activePlan?.packageType === 'pro' || activePlan?.plan_type === 'pro') ? 'UNLIMITED' : (activePlan?.packageType === 'growth' || activePlan?.plan_type === 'growth') ? '5 SLOTS' : '' },
        { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart2 },
        { name: 'Wallet', path: '/dashboard/wallet', icon: Wallet },
        { name: 'Developer Hub', path: '/dashboard/developer', icon: Code },
        { name: 'Affiliate Program', path: '/dashboard/affiliate', icon: Award, badge: 'EARN' },
        { name: 'Setup Guide', path: '/dashboard/setup-guide', icon: Compass, badge: 'GUIDE' },
        { name: 'Feature Tour', path: '/dashboard/overview', icon: BookOpen },
        { name: 'Settings', path: '/dashboard/settings', icon: Settings },
        ...(isAdmin ? [{ name: 'Admin Panel', path: '/dashboard/admin', icon: ShieldCheck, badge: 'SUPER' }] : []),
      ]


  const handleLogout = async () => {
    try {
      localStorage.removeItem('gw_cached_profile')
      localStorage.removeItem('gw_cached_plan')
      localStorage.removeItem('gw_cached_stats')
      localStorage.removeItem('gw_cached_messages')
    } catch {}
    await signOut()
    navigate('/login')
  }

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path) && path !== '/dashboard'
  }

  const showTrialBanner = !isAdmin && !activePlan?.isAdmin && activePlan?.isTrial && !activePlan?.isPaid
  const showPausedBanner = !isAdmin && !activePlan?.isAdmin && (activePlan?.isExpired || activePlan?.status === 'Paused' || activePlan?.status === 'Expired')

  return (
    <div className="flex h-screen bg-brand-light overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png.png" alt="Growthwapi" className="h-7 object-contain" />
            </Link>
            <div className="flex items-center gap-1.5">
              {!isAdmin && activePlan?.isFounderMember && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 border border-yellow-300 shadow-2xs" title="Growthwapi Original Founder Member">
                  🏆 Founder #{activePlan.founderRank}
                </span>
              )}
              {activePlan?.badgeText && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activePlan.isPaid ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                  {activePlan.badgeText}
                </span>
              )}
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive(item.path, item.exact)
                    ? 'bg-brand-orange text-white shadow-md shadow-orange-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-brand-blue'
                }`}
              >
                <item.icon size={20} />
                <span className="flex-1 truncate">{item.name}</span>
                {item.badge && (
                  <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-md shadow-2xs ${
                    item.isAlertBadge
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-amber-400 text-gray-900'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            {notifPermission === 'default' && (
              <button
                onClick={requestNotificationPermission}
                className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-brand-orange border border-orange-200 rounded-lg transition-colors text-xs font-bold"
              >
                <Bell size={15} />
                Enable Message Alerts
              </button>
            )}
            <div className="mb-4 px-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold shrink-0 ${(isAdmin || activePlan?.isAdmin) ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-brand-blue'}`}>
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-brand-dark truncate">{user?.email}</p>
                {(isAdmin || activePlan?.isAdmin) && (
                  <span className="inline-block mt-0.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    👑 Super Admin
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 p-2">
              <Menu size={24} />
            </button>
            <span className="ml-3 font-bold text-brand-dark">Growthwapi</span>
          </div>
          <div className="flex items-center gap-2">
            {notifPermission === 'default' && (
              <button
                onClick={requestNotificationPermission}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 text-brand-orange border border-orange-200 rounded-lg text-xs font-bold"
                title="Enable message alerts"
              >
                <Bell size={14} />
                <span>Alerts</span>
              </button>
            )}
            <Link
              to="/dashboard/inbox"
              className="relative p-2 text-gray-600 hover:text-brand-orange rounded-lg"
              title="Open Inbox"
            >
              <MessageSquare size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Launch Urgency Countdown Banner */}
        {!isAdmin && !activePlan?.isAdmin && activePlan?.launchOffer?.active && (
          <LaunchOfferCountdown 
            deadline={activePlan.launchOffer.deadline}
            isUrgent={activePlan.launchOffer.isUrgent}
            isExpiredTrial={activePlan.launchOffer.isExpiredTrial}
          />
        )}

        {/* Trial / Paused Banner */}
        {showPausedBanner && (
          <div className="bg-red-500 text-white px-4 py-2 text-sm font-medium text-center flex justify-center items-center gap-4">
            <span>⚠️ Your account is paused or plan has expired. Please subscribe to continue using Growthwapi.</span>
            <Link to="/dashboard/wallet" className="bg-white text-red-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-100 transition-colors">
              Subscribe Now
            </Link>
          </div>
        )}
        {showTrialBanner && (
          <div className="bg-brand-purple text-white px-4 py-2 text-sm font-medium text-center flex justify-center items-center gap-4 flex-wrap">
            <span>
              🚀 <strong>Free Trial:</strong> {activePlan?.utilityUsed ?? 0}/{activePlan?.utilityQuota ?? 50} utility, {activePlan?.marketingUsed ?? 0}/{activePlan?.marketingQuota ?? 30} marketing messages used | {activePlan?.daysRemaining ?? 0} day{activePlan?.daysRemaining !== 1 ? 's' : ''} left.
            </span>
            <Link to="/dashboard/wallet" className="bg-white text-brand-purple px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-100 transition-colors">
              Upgrade Plan
            </Link>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-light p-2 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


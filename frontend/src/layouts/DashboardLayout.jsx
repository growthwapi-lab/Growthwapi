import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { MessageSquare, Users, Send, BarChart2, Wallet, Settings, LogOut, Menu, X, FileText, Code, Bot, ShieldCheck, Award, UserPlus, Compass, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

export default function DashboardLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePlan, setActivePlan] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const ADMIN_EMAILS = ['sauravrai8757@gmail.com', 'growthwapi@gmail.com']
  const userEmail = (user?.email || '').toLowerCase()

  useEffect(() => {
    if (ADMIN_EMAILS.includes(userEmail)) {
      setIsAdmin(true)
    } else {
      api.get('/api/admin/verify')
        .then(() => setIsAdmin(true))
        .catch(() => setIsAdmin(false))
    }
  }, [userEmail])

  useEffect(() => {
    fetchActivePlan()
    const handlePlanUpdate = () => fetchActivePlan()
    window.addEventListener('planUpdated', handlePlanUpdate)
    return () => window.removeEventListener('planUpdated', handlePlanUpdate)
  }, [location.pathname])

  const fetchActivePlan = () => {
    api.get('/api/users/active-plan')
      .then(res => setActivePlan(res.data))
      .catch(() => {})
  }

  const isAgent = Boolean(user?.user_metadata?.owner_id || user?.user_metadata?.is_team_member)

  const navItems = isAgent
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: BarChart2, exact: true },
        { name: 'Inbox', path: '/dashboard/inbox', icon: MessageSquare, badge: 'LIVE' },
        { name: 'Contacts', path: '/dashboard/contacts', icon: Users },
        { name: 'Templates', path: '/dashboard/templates', icon: FileText },
        { name: 'Broadcast', path: '/dashboard/broadcast', icon: Send },
        { name: 'Feature Tour', path: '/dashboard/overview', icon: BookOpen },
        { name: 'Settings', path: '/dashboard/settings', icon: Settings },
      ]
    : [
        { name: 'Dashboard', path: '/dashboard', icon: BarChart2, exact: true },
        { name: 'Inbox', path: '/dashboard/inbox', icon: MessageSquare },
        { name: 'AI Agent', path: '/dashboard/ai-agent', icon: Bot },
        { name: 'Contacts', path: '/dashboard/contacts', icon: Users },
        { name: 'Templates', path: '/dashboard/templates', icon: FileText },
        { name: 'Broadcast', path: '/dashboard/broadcast', icon: Send },
        { name: 'Team Members', path: '/dashboard/team', icon: UserPlus, badge: activePlan?.plan_type === 'growth' ? '5 SLOTS' : activePlan?.plan_type === 'pro' ? 'UNLIMITED' : '' },
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
    await signOut()
    navigate('/login')
  }

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path) && path !== '/dashboard'
  }

  const showTrialBanner = activePlan?.isTrial && !activePlan?.isPaid
  const showPausedBanner = activePlan?.isExpired || activePlan?.status === 'Paused' || activePlan?.status === 'Expired'

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
            {activePlan?.badgeText && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activePlan.isPaid ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                {activePlan.badgeText}
              </span>
            )}
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
                  <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-md bg-amber-400 text-gray-900 shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="mb-4 px-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-brand-dark truncate">{user?.email}</p>
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
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 p-2">
            <Menu size={24} />
          </button>
          <span className="ml-4 font-bold text-brand-dark">Dashboard</span>
        </header>

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
              🚀 <strong>Free Trial:</strong> {activePlan?.utilityUsed ?? 0}/{activePlan?.utilityQuota ?? 50} utility, {activePlan?.marketingUsed ?? 0}/{activePlan?.marketingQuota ?? 20} marketing messages used | {activePlan?.daysRemaining ?? 0} day{activePlan?.daysRemaining !== 1 ? 's' : ''} left.
            </span>
            <Link to="/dashboard/wallet" className="bg-white text-brand-purple px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-100 transition-colors">
              Upgrade Plan
            </Link>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-light p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


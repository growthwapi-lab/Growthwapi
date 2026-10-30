import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Users,
  CreditCard,
  Activity,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Smartphone,
  MessageSquare,
  Sparkles,
  RefreshCw,
  MoreVertical,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  Check,
  Copy,
  Plus,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('clients') // 'clients', 'billing', 'health'
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [metrics, setMetrics] = useState(null)
  const [clients, setClients] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [health, setHealth] = useState(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('all') // 'all', 'trial', 'starter', 'growth', 'pro'
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'trial', 'paused', 'suspended'
  const [waFilter, setWaFilter] = useState('all') // 'all', 'connected', 'not_connected'

  // Action Modals State
  const [selectedClient, setSelectedClient] = useState(null)
  const [modalType, setModalType] = useState(null) // 'plan', 'status', 'extend', 'whatsapp'
  const [actionLoading, setActionLoading] = useState(false)

  // Form states for modals
  const [planForm, setPlanForm] = useState({ planType: 'growth', days: 30 })
  const [statusForm, setStatusForm] = useState('active')
  const [extendDays, setExtendDays] = useState(7)
  const [waForm, setWaForm] = useState({ phone_number_id: '', waba_id: '', display_phone: '' })
  const [copiedId, setCopiedId] = useState('')

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const [mRes, cRes, sRes, hRes] = await Promise.all([
        api.get('/api/admin/metrics'),
        api.get('/api/admin/clients'),
        api.get('/api/admin/subscriptions'),
        api.get('/api/admin/system-health')
      ])

      setMetrics(mRes.data)
      setClients(cRes.data || [])
      setSubscriptions(sRes.data || [])
      setHealth(hRes.data)
    } catch (err) {
      console.error('Failed to load admin data:', err)
      toast.error(err.response?.data?.error || 'Failed to fetch admin data. Check permissions.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const copyToClipboard = (text, label) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(label)
    toast.success(`Copied ${label}!`)
    setTimeout(() => setCopiedId(''), 2000)
  }

  // Handle Plan Update
  const handleUpdatePlan = async (e) => {
    e.preventDefault()
    if (!selectedClient) return
    setActionLoading(true)
    try {
      const res = await api.patch(`/api/admin/clients/${selectedClient.id}/plan`, planForm)
      toast.success(res.data.message || 'Client plan updated successfully!')
      setModalType(null)
      fetchAdminData(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update plan.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Status Change
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedClient) return
    setActionLoading(true)
    try {
      const res = await api.patch(`/api/admin/clients/${selectedClient.id}/status`, { status: newStatus })
      toast.success(res.data.message || `Client status updated to ${newStatus}`)
      setModalType(null)
      fetchAdminData(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Extend Trial
  const handleExtendTrial = async (e) => {
    e.preventDefault()
    if (!selectedClient) return
    setActionLoading(true)
    try {
      const res = await api.post(`/api/admin/clients/${selectedClient.id}/extend-trial`, { days: Number(extendDays) })
      toast.success(res.data.message || 'Trial extended successfully!')
      setModalType(null)
      fetchAdminData(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to extend trial.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle WhatsApp IDs Update
  const handleUpdateWhatsApp = async (e) => {
    e.preventDefault()
    if (!selectedClient) return
    setActionLoading(true)
    try {
      const res = await api.patch(`/api/admin/clients/${selectedClient.id}/whatsapp`, waForm)
      toast.success(res.data.message || 'WhatsApp credentials updated for client!')
      setModalType(null)
      fetchAdminData(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update WhatsApp IDs.')
    } finally {
      setActionLoading(false)
    }
  }

  // Filtered Clients
  const filteredClients = clients.filter(c => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      (c.name || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.business_name || '').toLowerCase().includes(query) ||
      (c.phone || '').includes(query) ||
      (c.whatsapp_display_phone || '').includes(query) ||
      (c.whatsapp_phone_number_id || '').includes(query)

    const matchesPlan =
      planFilter === 'all' ||
      (planFilter === 'trial' && (c.package_type === 'trial' || c.account_status === 'trial')) ||
      c.package_type === planFilter

    const matchesStatus =
      statusFilter === 'all' ||
      c.account_status === statusFilter

    const matchesWa =
      waFilter === 'all' ||
      (waFilter === 'connected' && Boolean(c.whatsapp_phone_number_id)) ||
      (waFilter === 'not_connected' && !c.whatsapp_phone_number_id)

    return matchesSearch && matchesPlan && matchesStatus && matchesWa
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading Admin Control Center...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-brand-blue via-blue-900 to-brand-purple rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                Super Admin Access
              </span>
              <span className="text-xs text-blue-200">Growthwapi Management Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Client & Platform Operations</h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
              Monitor active subscriptions, view registered clients, inspect WhatsApp credentials, and manage plan permissions.
            </p>
          </div>

          <button
            onClick={() => fetchAdminData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Overview Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Clients */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Clients</span>
              <div className="p-2 bg-blue-50 text-brand-blue rounded-xl">
                <Users size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{metrics.totalUsers}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span className="text-emerald-600 font-bold">{metrics.paidUsers} Paid</span>
              <span>•</span>
              <span className="text-brand-purple font-semibold">{metrics.trialUsers} Trial</span>
            </div>
          </div>

          {/* Card 2: WhatsApp Connected */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Connected Numbers</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Smartphone size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{metrics.whatsappConnectedCount}</div>
            <p className="text-xs text-gray-500 mt-2">Active WhatsApp Cloud API Numbers</p>
          </div>

          {/* Card 3: Platform Messages */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Messages Processed</span>
              <div className="p-2 bg-orange-50 text-brand-orange rounded-xl">
                <MessageSquare size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{metrics.totalMessages.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>{metrics.outboundMessages.toLocaleString()} Out</span>
              <span>•</span>
              <span>{metrics.inboundMessages.toLocaleString()} In</span>
            </div>
          </div>

          {/* Card 4: Platform Revenue */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Revenue</span>
              <div className="p-2 bg-purple-50 text-brand-purple rounded-xl">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">₹{metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-2">{metrics.activeSubscriptionsCount} Active Subscriptions</p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'clients', label: 'All Clients', count: clients.length, icon: Users },
          { id: 'billing', label: 'Subscriptions & Orders', count: subscriptions.length, icon: CreditCard },
          { id: 'health', label: 'System Health & Integrations', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === tab.id
                ? 'bg-brand-blue text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: ALL CLIENTS */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, business, phone or WABA ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
              >
                <option value="all">All Plans</option>
                <option value="trial">Free Trial</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="pro">Pro</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="paused">Paused</option>
                <option value="suspended">Suspended</option>
              </select>

              {/* WhatsApp Connection Filter */}
              <select
                value={waFilter}
                onChange={e => setWaFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
              >
                <option value="all">All WhatsApp</option>
                <option value="connected">Connected</option>
                <option value="not_connected">Not Connected</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>Showing <b>{filteredClients.length}</b> of {clients.length} clients</span>
            {(searchQuery || planFilter !== 'all' || statusFilter !== 'all' || waFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setPlanFilter('all')
                  setStatusFilter('all')
                  setWaFilter('all')
                }}
                className="text-brand-blue font-bold hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Clients List / Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            {filteredClients.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users size={40} className="mx-auto mb-2 text-gray-300" />
                <p className="font-semibold text-sm">No clients match your filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Client Profile</th>
                      <th className="px-4 py-3.5">WhatsApp Integration</th>
                      <th className="px-4 py-3.5">Current Plan</th>
                      <th className="px-4 py-3.5">Usage & Messages</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredClients.map((client) => {
                      const isConnected = Boolean(client.whatsapp_phone_number_id)
                      const planName = client.package_type || 'trial'
                      const isPaid = ['starter', 'growth', 'pro'].includes(planName) && client.account_status !== 'trial'

                      return (
                        <tr key={client.id} className="hover:bg-blue-50/40 transition-colors">
                          {/* Client Profile */}
                          <td className="px-4 py-4 align-top">
                            <div className="font-bold text-gray-900 text-sm">{client.name || 'Anonymous User'}</div>
                            <div className="text-gray-500 text-xs font-mono">{client.email}</div>
                            {client.business_name && (
                              <div className="text-[11px] text-gray-600 mt-0.5 font-medium">🏢 {client.business_name}</div>
                            )}
                            {client.phone && (
                              <div className="text-[11px] text-gray-400 font-mono mt-0.5">📞 {client.phone}</div>
                            )}
                          </td>

                          {/* WhatsApp Integration */}
                          <td className="px-4 py-4 align-top">
                            {isConnected ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Connected
                                </span>
                                {client.whatsapp_display_phone && (
                                  <div className="font-mono text-xs font-bold text-gray-800">
                                    {client.whatsapp_display_phone}
                                  </div>
                                )}
                                <div className="text-[10px] text-gray-400 font-mono">
                                  ID: {client.whatsapp_phone_number_id?.substring(0, 10)}...
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                Not Connected
                              </span>
                            )}
                          </td>

                          {/* Current Plan */}
                          <td className="px-4 py-4 align-top">
                            <div className="space-y-1">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                isPaid
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {planName}
                              </span>
                              <div className="text-[11px] text-gray-500">
                                {isPaid ? (
                                  client.subscription?.end_date ? (
                                    <span>Exp: {new Date(client.subscription.end_date).toLocaleDateString()}</span>
                                  ) : (
                                    <span>Active Subscription</span>
                                  )
                                ) : (
                                  <span className={client.trialDaysRemaining <= 1 ? 'text-red-600 font-bold' : ''}>
                                    {client.trialDaysRemaining} days left in trial
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Usage & Messages */}
                          <td className="px-4 py-4 align-top">
                            <div className="font-bold text-gray-800 text-xs">
                              {client.messageStats?.total || 0} messages
                            </div>
                            <div className="text-[11px] text-gray-400">
                              <span>↑ {client.messageStats?.outbound || 0} out</span> • <span>↓ {client.messageStats?.inbound || 0} in</span>
                            </div>
                            {client.aiAgent && (
                              <div className="mt-1 text-[10px] text-brand-orange font-semibold flex items-center gap-1">
                                <Sparkles size={11} /> AI Agent Active
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 align-top">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              client.account_status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : client.account_status === 'trial'
                                ? 'bg-blue-100 text-blue-800'
                                : client.account_status === 'paused'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {client.account_status || 'Active'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4 align-top text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Change Plan Button */}
                              <button
                                onClick={() => {
                                  setSelectedClient(client)
                                  setPlanForm({ planType: client.package_type || 'growth', days: 30 })
                                  setModalType('plan')
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-brand-blue font-bold text-xs rounded-lg shadow-2xs transition-all"
                                title="Change or Upgrade Plan"
                              >
                                Edit Plan
                              </button>

                              {/* Extend Trial (only if trial) */}
                              {!isPaid && (
                                <button
                                  onClick={() => {
                                    setSelectedClient(client)
                                    setExtendDays(7)
                                    setModalType('extend')
                                  }}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg border border-amber-200 shadow-2xs transition-all"
                                  title="Extend Free Trial"
                                >
                                  +Days
                                </button>
                              )}

                              {/* Toggle Status (Pause / Activate) */}
                              <button
                                onClick={() => {
                                  setSelectedClient(client)
                                  setStatusForm(client.account_status || 'active')
                                  setModalType('status')
                                }}
                                className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs rounded-lg border border-gray-200 transition-all"
                                title="Change Account Status"
                              >
                                Status
                              </button>

                              {/* Edit WhatsApp IDs */}
                              <button
                                onClick={() => {
                                  setSelectedClient(client)
                                  setWaForm({
                                    phone_number_id: client.whatsapp_phone_number_id || '',
                                    waba_id: client.whatsapp_waba_id || '',
                                    display_phone: client.whatsapp_display_phone || ''
                                  })
                                  setModalType('whatsapp')
                                }}
                                className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit WhatsApp Credentials"
                              >
                                <Smartphone size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS & BILLING */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-purple" />
                Subscription Orders & Transactions
              </h2>
              <p className="text-xs text-gray-500">All customer plan orders processed via Razorpay or Manual Admin Grant.</p>
            </div>
            <span className="text-xs font-bold bg-purple-50 text-brand-purple px-3 py-1 rounded-full border border-purple-100">
              {subscriptions.length} Transactions
            </span>
          </div>

          {subscriptions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{sub.user?.name || 'Client'}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{sub.user?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold uppercase text-brand-dark">{sub.plan_type}</span>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-emerald-700">
                        ₹{Number(sub.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {sub.razorpay_payment_id || sub.payment_for || 'manual_grant'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          sub.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(sub.created_at || sub.start_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SYSTEM HEALTH */}
      {activeTab === 'health' && health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Supabase Database */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-gray-900">PostgreSQL Database</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                health.database?.status === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {health.database?.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">Supabase Admin connection & query latency.</p>
            {health.database?.latencyMs !== undefined && (
              <div className="text-xs font-mono text-brand-blue font-bold">
                Latency: {health.database.latencyMs}ms
              </div>
            )}
          </div>

          {/* Meta Graph API */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-gray-900">Meta WhatsApp Graph API</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                health.metaGraphApi?.status === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {health.metaGraphApi?.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">Cloud API connectivity for outbound messages.</p>
            {health.metaGraphApi?.app && (
              <div className="text-xs font-semibold text-emerald-700">
                Connected App: {health.metaGraphApi.app}
              </div>
            )}
          </div>

          {/* OpenAI API */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-gray-900">OpenAI API (AI Agent)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                health.openAi?.status === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {health.openAi?.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">Used for customer AI auto-reply and website embeddings.</p>
            {health.openAi?.modelsCount ? (
              <div className="text-xs font-semibold text-brand-purple">
                {health.openAi.modelsCount} OpenAI models accessible
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ACTION MODAL: CHANGE PLAN */}
      {/* ============================================================== */}
      {modalType === 'plan' && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Change Client Plan</h3>
                <p className="text-xs text-gray-500">{selectedClient.name} ({selectedClient.email})</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Plan Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {['trial', 'starter', 'growth', 'pro'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlanForm({ ...planForm, planType: p })}
                      className={`p-3 rounded-xl border text-left font-bold capitalize text-xs transition-all ${
                        planForm.planType === p
                          ? 'border-brand-blue bg-blue-50 text-brand-blue ring-2 ring-brand-blue/20'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p} Plan
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={planForm.days}
                  onChange={e => setPlanForm({ ...planForm, days: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">e.g. 30 days for 1 month, 365 for 1 year.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-brand-blue text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-900 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ACTION MODAL: EXTEND TRIAL */}
      {/* ============================================================== */}
      {modalType === 'extend' && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Extend Free Trial</h3>
                <p className="text-xs text-gray-500">{selectedClient.email}</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExtendTrial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Select Extension Days</label>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 14, 30].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDays(d)}
                      className={`py-2 rounded-xl border text-center font-bold text-xs transition-all ${
                        extendDays === d
                          ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      +{d} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-amber-700 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Extending...' : `Extend +${extendDays} Days`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ACTION MODAL: ACCOUNT STATUS */}
      {/* ============================================================== */}
      {modalType === 'status' && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Account Status</h3>
                <p className="text-xs text-gray-500">{selectedClient.email}</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 'active', label: 'Active', desc: 'Full access to send & receive messages.', color: 'text-emerald-700' },
                { id: 'paused', label: 'Paused', desc: 'Temporarily pause sending; triggers payment banner.', color: 'text-amber-700' },
                { id: 'suspended', label: 'Suspended', desc: 'Freeze account completely for policy violations.', color: 'text-red-700' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleUpdateStatus(st.id)}
                  disabled={actionLoading}
                  className={`w-full p-3 rounded-xl border text-left transition-all hover:bg-gray-50 flex items-start justify-between ${
                    selectedClient.account_status === st.id ? 'border-brand-blue bg-blue-50/50' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <div className={`font-bold text-xs ${st.color}`}>{st.label}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{st.desc}</div>
                  </div>
                  {selectedClient.account_status === st.id && (
                    <CheckCircle2 size={16} className="text-brand-blue shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ACTION MODAL: EDIT WHATSAPP CREDENTIALS */}
      {/* ============================================================== */}
      {modalType === 'whatsapp' && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Client WhatsApp Configuration</h3>
                <p className="text-xs text-gray-500">{selectedClient.email}</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Phone Number ID</label>
                <input
                  type="text"
                  value={waForm.phone_number_id}
                  onChange={e => setWaForm({ ...waForm, phone_number_id: e.target.value })}
                  placeholder="e.g. 1313417765190326"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Business Account ID (WABA ID)</label>
                <input
                  type="text"
                  value={waForm.waba_id}
                  onChange={e => setWaForm({ ...waForm, waba_id: e.target.value })}
                  placeholder="e.g. 2201481664133864"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Display Phone Number (Optional)</label>
                <input
                  type="text"
                  value={waForm.display_phone}
                  onChange={e => setWaForm({ ...waForm, display_phone: e.target.value })}
                  placeholder="e.g. +91 9122257780"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-green-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save WhatsApp IDs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  User,
  Crown,
  Key,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

export default function TeamMembers() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [teamData, setTeamData] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agent'
  })

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/team')
      setTeamData(res.data)
    } catch (err) {
      console.error('Failed to load team data:', err)
      toast.error('Failed to load team members.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      return toast.error('Please fill all fields.')
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters.')
    }

    setSubmitting(true)
    try {
      const res = await api.post('/api/team/invite', form)
      toast.success(res.data.message || 'Team member added successfully!')
      setShowAddModal(false)
      setForm({ name: '', email: '', password: '', role: 'agent' })
      fetchTeam()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add team member.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.name} (${member.email}) from your workspace?`)) {
      return
    }

    try {
      const res = await api.delete(`/api/team/${member.id}`)
      toast.success(res.data.message || 'Team member removed.')
      fetchTeam()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete member.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading Team Members...</p>
      </div>
    )
  }

  const plan = teamData?.plan || 'trial'
  const maxMembers = teamData?.maxMembers || 1
  const totalUsed = teamData?.totalUsed || 1
  const canAddMore = teamData?.canAddMore
  const members = teamData?.members || []
  const owner = teamData?.owner || {}

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-brand-orange" />
            Team Members & Multi-Agent Access
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Assign sales and support agents to answer WhatsApp chats simultaneously from their own screens.
          </p>
        </div>

        {canAddMore && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-200 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <UserPlus size={16} />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* Plan Quota Status Banner */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Workspace Member Quota</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-brand-blue border border-blue-100">
                {plan.toUpperCase()} PLAN
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {totalUsed} / {maxMembers} <span className="text-sm font-semibold text-gray-400">Team Slots Used</span>
            </div>
            <p className="text-xs text-gray-500">
              {plan === 'starter' || plan === 'trial'
                ? 'Starter Plan includes 1 member (Owner only). Upgrade to Growth Plan for up to 5 agents.'
                : plan === 'growth'
                ? 'Growth Plan allows up to 5 agents. Upgrade to Pro for unlimited team members.'
                : 'Pro Plan includes unlimited team members for large support and sales teams.'}
            </p>
          </div>

          {!canAddMore && (
            <Link
              to="/dashboard/wallet"
              className="px-6 py-3 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Sparkles size={16} />
              <span>Upgrade Plan to Add More Agents</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Progress Bar */}
        {maxMembers !== 'Unlimited' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-orange h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalUsed / maxMembers) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            Active Workspace Users ({totalUsed})
          </h2>
          <span className="text-xs text-gray-400 font-semibold">Single Company WhatsApp Number</span>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Owner Row */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-orange-50/20">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                <Crown size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">{owner.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-brand-orange text-[10px] font-extrabold uppercase">
                    Admin / Owner
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">{owner.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 size={11} /> Master Workspace Admin
              </span>
            </div>
          </div>

          {/* Invited Members Rows */}
          {members.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Users size={32} className="mx-auto text-gray-300" />
              <p className="text-xs text-gray-500 font-medium">No team members added yet.</p>
              {canAddMore ? (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-xs font-bold text-brand-orange hover:underline inline-flex items-center gap-1"
                >
                  <UserPlus size={12} /> Add your first support or sales agent
                </button>
              ) : (
                <Link to="/dashboard/wallet" className="text-xs font-bold text-brand-blue hover:underline">
                  Upgrade your plan to unlock multi-agent access
                </Link>
              )}
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center font-black text-sm shrink-0">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{member.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue border border-blue-100 text-[10px] font-extrabold uppercase">
                        {member.role === 'sales' ? 'Sales Agent' : 'Support Agent'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Can Access Inbox & Chats
                  </span>

                  <button
                    onClick={() => handleDeleteMember(member)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove Member"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* How it Works / Instructions Box */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-3xl p-6 border border-blue-100 space-y-3">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <Info size={16} className="text-brand-blue" />
          How Multi-Agent Shared Inbox Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
          <div className="bg-white/80 p-3.5 rounded-2xl border border-blue-100 space-y-1">
            <span className="font-bold text-gray-900 block">1. Dedicated Login for Each Agent</span>
            <p>Your team members log in at <b>growthwapi.in/login</b> using the email & password you assign them.</p>
          </div>
          <div className="bg-white/80 p-3.5 rounded-2xl border border-blue-100 space-y-1">
            <span className="font-bold text-gray-900 block">2. Shared Official WhatsApp Number</span>
            <p>All agents reply from your company's single WhatsApp account simultaneously without QR code disconnections.</p>
          </div>
          <div className="bg-white/80 p-3.5 rounded-2xl border border-blue-100 space-y-1">
            <span className="font-bold text-gray-900 block">3. Workspace Security</span>
            <p>Agents can only access Inbox and Contacts. Your billing, payment wallet, and API keys remain hidden.</p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: ADD TEAM MEMBER */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Add Team Member</h3>
                <p className="text-xs text-gray-500">Create an agent login for your WhatsApp shared inbox.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Agent Login Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. rahul@company.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Set Agent Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-brand-orange"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">The agent will use this email and password to log in.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Role & Responsibility</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-brand-orange bg-white"
                >
                  <option value="agent">Support Agent (Inbox & Live Chat)</option>
                  <option value="sales">Sales Agent (Inbox & Contacts)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-brand-orange text-white font-bold text-xs rounded-xl shadow-xs hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Creating Account...' : 'Create Agent Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

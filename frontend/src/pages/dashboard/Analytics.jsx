import { useState, useEffect } from 'react'
import { TrendingUp, MessageSquare, Eye, Reply } from 'lucide-react'
import api from '../../lib/api'

export default function Analytics() {
  const [data, setData] = useState({
    totalSent: 0,
    delivered: 0,
    readRate: 0,
    replyRate: 0,
    utilityCount: 0,
    marketingCount: 0,
    totalMessages: 0
  })
  const [activePlan, setActivePlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [res, planRes] = await Promise.all([
        api.get('/api/whatsapp/analytics').catch(() => ({ data: null })),
        api.get('/api/users/active-plan').catch(() => ({ data: null })),
      ])

      if (res?.data) {
        setData(res.data)
      }
      if (planRes?.data) {
        setActivePlan(planRes.data)
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const utilityQuota = activePlan?.utilityQuota || 1000
  const marketingQuota = activePlan?.marketingQuota || 500
  const planTitle = activePlan?.plan || activePlan?.planName || 'Plan'

  const STATS = [
    { label: 'Total Sent', value: loading ? '...' : data.totalSent.toLocaleString(), icon: MessageSquare, color: 'text-brand-blue', bg: 'bg-blue-50' },
    { label: 'Delivered', value: loading ? '...' : data.delivered.toLocaleString(), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Read Rate', value: loading ? '...' : `${data.readRate}%`, icon: Eye, color: 'text-brand-orange', bg: 'bg-orange-50' },
    { label: 'Reply Rate', value: loading ? '...' : `${data.replyRate}%`, icon: Reply, color: 'text-brand-purple', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Analytics</h1>
        <p className="text-gray-500 mt-1">Track your messaging performance and campaign results.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-brand-dark">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Message Type Breakdown & Quota */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-bold text-brand-dark mb-5">Message Type Breakdown (This Month)</h2>
          {data.totalMessages > 0 ? (
            <div className="space-y-4">
              {[
                { label: 'Utility Messages', value: data.utilityCount, total: data.totalMessages, color: 'bg-brand-blue' },
                { label: 'Marketing Messages', value: data.marketingCount, total: data.totalMessages, color: 'bg-brand-orange' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-gray-500">{item.value.toLocaleString()} sent</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`${item.color} h-3 rounded-full transition-all`}
                      style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}% of total
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              No messages sent yet. Send your first message to see analytics breakdown here.
            </div>
          )}
        </div>

        {/* Quota Usage */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-brand-dark">Monthly Quota Usage</h2>
            {activePlan && (
              <span className="text-xs font-bold bg-blue-50 text-brand-blue px-2.5 py-1 rounded-full border border-blue-100">
                {planTitle}
              </span>
            )}
          </div>
          <div className="space-y-4">
            {[
              { label: 'Utility Messages', used: data.utilityCount, quota: utilityQuota, color: 'bg-brand-blue' },
              { label: 'Marketing Messages', used: data.marketingCount, quota: marketingQuota, color: 'bg-brand-orange' },
            ].map((item, i) => {
              const pct = Math.min((item.used / item.quota) * 100, 100)
              const remaining = Math.max(0, item.quota - item.used)
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-gray-500">{item.used.toLocaleString()} / {item.quota.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`${item.color} h-3 rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}% used — {remaining.toLocaleString()} remaining</p>
                </div>
              )
            })}
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100 text-sm text-green-700 flex items-center gap-2">
            <span>✅</span>
            <span>You're within your <strong>{planTitle}</strong> quota limits.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

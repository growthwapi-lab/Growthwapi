import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare,
  Bot,
  Users,
  FileText,
  Send,
  BarChart2,
  Wallet,
  UserPlus,
  Code,
  Award,
  Settings,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Compass,
  Lightbulb,
  Shield,
  Zap,
  HelpCircle
} from 'lucide-react'

export default function GettingStarted() {
  const [activeCategory, setActiveCategory] = useState('all')

  const features = [
    {
      id: 'inbox',
      category: 'core',
      title: 'Live Team Inbox',
      icon: MessageSquare,
      color: 'bg-emerald-500',
      badge: 'Live Chat',
      path: '/dashboard/inbox',
      summary: 'Manage real-time 1-on-1 customer conversations with two-way WhatsApp messaging.',
      highlights: [
        'Real-time messages sent & received via official WhatsApp Cloud API',
        'Message status indicators (Sent, Delivered, Read double blue ticks)',
        'Filter chats by all, unread, or closed conversations',
        'Send text, media, documents, and quick template responses',
      ],
      tip: 'Conversations remain open for 24 hours after a customer replies — send unlimited free-form messages during this window!',
    },
    {
      id: 'ai-agent',
      category: 'automation',
      title: 'AI Auto-Reply Agent',
      icon: Bot,
      color: 'bg-indigo-600',
      badge: '24/7 Automation',
      path: '/dashboard/ai-agent',
      summary: 'Deploy an intelligent AI agent that replies to customer inquiries instantly 24/7.',
      highlights: [
        'Custom system prompt tailored to your business, products, and prices',
        'Auto-answers common customer FAQs instantly without human intervention',
        'Captures customer leads and details automatically into contacts',
        'Seamless handoff to human agents when complex support is required',
      ],
      tip: 'Train your bot with your pricing catalog and FAQs to achieve up to 70% automated inquiry resolution.',
    },
    {
      id: 'contacts',
      category: 'core',
      title: 'Audience & Contacts',
      icon: Users,
      color: 'bg-blue-600',
      badge: 'Excel / CSV Import',
      path: '/dashboard/contacts',
      summary: 'Centralize customer numbers with segment tags, bulk pasting, and Excel/CSV imports.',
      highlights: [
        'Import bulk contacts via Excel (.xlsx) or CSV files with auto column detection',
        'Quick Bulk Paste: Paste raw phone numbers separated by newlines or commas',
        'Download sample template to format your customer list correctly',
        'Organize contacts with tags (e.g., VIP, Leads, Wholesale, Repeat Buyers)',
      ],
      tip: 'Always ensure numbers include country codes (e.g. 919876543210 for India). Growthwapi auto-fixes 10-digit Indian numbers!',
    },
    {
      id: 'templates',
      category: 'messaging',
      title: 'Official Meta Templates',
      icon: FileText,
      color: 'bg-amber-600',
      badge: 'Meta Compliant',
      path: '/dashboard/templates',
      summary: 'Create and sync Meta-approved message templates with buttons and variables.',
      highlights: [
        'Support for Marketing, Utility (orders/receipts), and Authentication OTP templates',
        'Dynamic personalization variables like {{1}} for customer names or order numbers',
        'Interactive buttons: Quick Reply buttons and URL Call-to-Action links',
        'Automatic sync with your Meta WhatsApp Business Manager',
      ],
      tip: 'Utility templates have much lower Meta charges (₹0.25 vs ₹1.75 for Marketing). Use them for order confirmations and receipts!',
    },
    {
      id: 'broadcast',
      category: 'messaging',
      title: 'Bulk Broadcast Campaigns',
      icon: Send,
      color: 'bg-brand-orange',
      badge: 'High Conversion',
      path: '/dashboard/broadcast',
      summary: 'Send personalized WhatsApp campaigns to thousands of customers in 1 click.',
      highlights: [
        '1-Click "Select All Contacts" to broadcast your entire audience directory',
        'Tag-based Contact Picker: Target specific groups (e.g., only "VIP" or "Leads")',
        'Manual phone typing option for rapid ad-hoc dispatches',
        'Real-time delivery progress bar and comprehensive campaign history logs',
      ],
      tip: 'Target relevant customer tags rather than blasting everyone to maintain a HIGH Meta Quality Rating.',
    },
    {
      id: 'team',
      category: 'team',
      title: 'Team Members & Multi-Agent',
      icon: UserPlus,
      color: 'bg-purple-600',
      badge: 'Collaboration',
      path: '/dashboard/team',
      summary: 'Invite support agents and sales reps to share your WhatsApp inbox safely.',
      highlights: [
        'Shared WhatsApp Inbox: Multiple agents can reply from the same official number',
        'Role security: Team agents cannot view billing, plans, or sensitive settings',
        'Growth plan includes 5 team member slots; Pro includes Unlimited slots',
        'Easy 1-click invitation with name, email, and temporary password',
      ],
      tip: 'Assign different team members to monitor morning and evening shifts so no customer inquiry goes unanswered.',
    },
    {
      id: 'analytics',
      category: 'core',
      title: 'Real-Time Analytics',
      icon: BarChart2,
      color: 'bg-teal-600',
      badge: 'Performance Insights',
      path: '/dashboard/analytics',
      summary: 'Monitor broadcast delivery rates, read rates, and customer engagement metrics.',
      highlights: [
        'Real-time Sent, Delivered, Read, and Failed message counts',
        'Calculate exact delivery and open rate percentages for every campaign',
        'Daily & weekly messaging volume trends graph',
        'Identify failed messages due to inactive WhatsApp numbers or Meta policy',
      ],
      tip: 'A standard WhatsApp broadcast achieves 85-95% open rates — 5x higher than traditional email campaigns!',
    },
    {
      id: 'wallet',
      category: 'billing',
      title: 'Wallet & Transparent Billing',
      icon: Wallet,
      color: 'bg-emerald-600',
      badge: 'Pay As You Go',
      path: '/dashboard/wallet',
      summary: 'Transparent plan quotas and wallet top-ups for extra messages beyond your monthly allowance.',
      highlights: [
        'Track remaining plan quota messages with real-time progress bars',
        'Recharge wallet balance starting at ₹200 via secure Razorpay checkout',
        'Transparent Meta rates: Utility ₹0.25/msg, Marketing ₹1.75/msg',
        'Complete transaction ledger with downloadable invoices',
      ],
      tip: 'Your wallet balance never expires! Recharged funds remain active until consumed.',
    },
    {
      id: 'developer',
      category: 'developer',
      title: 'Developer Hub & APIs',
      icon: Code,
      color: 'bg-gray-800',
      badge: 'REST API & Webhooks',
      path: '/dashboard/developer',
      summary: 'Integrate WhatsApp messaging into your Shopify store, CRM, or custom application.',
      highlights: [
        'Secure API Keys to authenticate outbound automated requests',
        'Clean REST API to send text messages, templates, and media programmatically',
        'Ready-to-use code snippets in cURL, JavaScript, Python, and PHP',
        'Webhook listener URLs to receive inbound events in real time',
      ],
      tip: 'Use our REST API to send automatic order confirmation messages when an order is placed on your website.',
    },
    {
      id: 'affiliate',
      category: 'earn',
      title: 'Affiliate & Partner Program',
      icon: Award,
      color: 'bg-amber-500',
      badge: 'Earn up to ₹2,325/mo',
      path: '/dashboard/affiliate',
      summary: 'Earn recurring monthly income by referring other businesses to Growthwapi.',
      highlights: [
        'Earn ₹700/mo on Starter (3 mo), ₹1,310/mo on Growth (4 mo), ₹2,325/mo on Pro (5 mo)',
        'Personalized referral link with real-time clicks and signups analytics',
        'Minimum withdrawal threshold of just ₹400 directly to your bank UPI',
        'Shareable banners and copy templates to help you promote',
      ],
      tip: 'Share your link with digital marketing clients, local business owners, or e-commerce store operators!',
    },
  ]

  const categories = [
    { id: 'all', label: 'All Features' },
    { id: 'core', label: 'Core Tools' },
    { id: 'messaging', label: 'Messaging & Campaigns' },
    { id: 'automation', label: 'AI Automation' },
    { id: 'team', label: 'Team Members' },
    { id: 'developer', label: 'APIs & Integration' },
    { id: 'earn', label: 'Affiliate & Earn' },
  ]

  const filteredFeatures =
    activeCategory === 'all'
      ? features
      : features.filter((f) => f.category === activeCategory)

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-dark to-blue-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-orange-300 border border-white/10">
            <Sparkles size={14} /> Growthwapi Feature Overview & Guide
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Explore Growthwapi Features
          </h1>
          <p className="text-sm sm:text-base text-gray-200 font-normal leading-relaxed">
            Everything you need to engage customers, automate replies, run bulk broadcasts, and scale your business on the official WhatsApp Cloud API.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/dashboard/setup-guide"
              className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md transition-all"
            >
              <Compass size={15} /> WhatsApp Meta Setup Guide <ArrowRight size={14} />
            </Link>
            <Link
              to="/dashboard/broadcast"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all"
            >
              Launch First Broadcast <Send size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick 3-Step Start Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider block">Quick Start</span>
            <h2 className="text-lg sm:text-xl font-black text-brand-dark">How to Get Started in 3 Steps</h2>
          </div>
          <span className="text-xs bg-orange-100 text-brand-orange font-bold px-3 py-1 rounded-full">
            15 Mins Setup
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl relative">
            <span className="w-7 h-7 rounded-lg bg-brand-orange text-white flex items-center justify-center font-black text-xs mb-3">
              1
            </span>
            <h3 className="font-bold text-sm text-brand-dark mb-1">Connect WhatsApp</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Paste your Meta Phone Number ID and WABA ID in Settings to link your business number.
            </p>
            <Link
              to="/dashboard/setup-guide"
              className="text-xs font-bold text-brand-orange hover:text-orange-700 inline-flex items-center gap-1"
            >
              Follow Setup Guide &rarr;
            </Link>
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl relative">
            <span className="w-7 h-7 rounded-lg bg-brand-blue text-white flex items-center justify-center font-black text-xs mb-3">
              2
            </span>
            <h3 className="font-bold text-sm text-brand-dark mb-1">Import Contacts</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Upload your customer list via Excel/CSV or paste phone numbers directly with segment tags.
            </p>
            <Link
              to="/dashboard/contacts"
              className="text-xs font-bold text-brand-blue hover:text-blue-900 inline-flex items-center gap-1"
            >
              Open Contacts &rarr;
            </Link>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl relative">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs mb-3">
              3
            </span>
            <h3 className="font-bold text-sm text-brand-dark mb-1">Broadcast or Bot</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Send a campaign to all contacts or enable the AI auto-reply bot to answer customer questions.
            </p>
            <Link
              to="/dashboard/broadcast"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
            >
              Start Sending &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeCategory === c.id
                ? 'bg-brand-dark text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Feature Deep Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFeatures.map((f) => {
          const Icon = f.icon
          return (
            <div
              key={f.id}
              className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${f.color} text-white flex items-center justify-center shadow-xs shrink-0`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-brand-dark">
                        {f.title}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {f.badge}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={f.path}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors shrink-0"
                  >
                    Open <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Summary */}
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {f.summary}
                </p>

                {/* Highlights List */}
                <div className="space-y-2 pt-1">
                  {f.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip Box */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900 leading-relaxed">
                <Lightbulb size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Pro Tip:</strong> {f.tip}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Best Practices Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Shield size={20} className="text-orange-400" />
          </div>
          <div>
            <h3 className="font-black text-lg text-white">WhatsApp Best Practices & Anti-Ban Rules</h3>
            <p className="text-xs text-blue-200">Growthwapi uses the Official WhatsApp Cloud API so you never get banned for third-party automation.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-blue-100 pt-2">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="font-bold text-white mb-1">1. Quality Rating</p>
            <p className="text-[11px] text-blue-200 leading-relaxed">
              Meta tracks your WhatsApp Quality Rating (Green, Yellow, Red). Send valuable messages so users do not mark you as spam.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="font-bold text-white mb-1">2. Include Opt-Out</p>
            <p className="text-[11px] text-blue-200 leading-relaxed">
              Always add a Quick Reply button like "STOP" or "Unsubscribe" in marketing messages. Respecting user preference keeps ratings high.
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="font-bold text-white mb-1">3. Warm-Up Volume</p>
            <p className="text-[11px] text-blue-200 leading-relaxed">
              When using a brand-new phone number, start by sending 100-250 messages/day for the first week before scaling to thousands.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

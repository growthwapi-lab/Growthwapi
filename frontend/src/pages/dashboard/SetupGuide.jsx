import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  CreditCard,
  Send,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Info,
  Zap,
  HelpCircle,
  Settings as SettingsIcon,
  CheckCircle,
  ChevronRight,
  Flame
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SetupGuide() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('fast') // 'fast' | 'billing' | 'verification' | 'manual'
  const [copiedKey, setCopiedKey] = useState('')

  const hasSetupSupport = Boolean(
    user?.referred_by || user?.referred_code || user?.referred_onboarding_support
  )
  const referrerCode = user?.referred_code || ''

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${key} copied to clipboard!`)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  const webhookUrl = 'https://growthwapi-backend.onrender.com/api/whatsapp/webhook'
  const verifyToken = 'growthwapi_secure_2026'

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-brand-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 border border-white/20">
            <Zap size={14} className="text-amber-300 fill-amber-300" />
            Official Growthwapi Embedded Integration • No Coding Needed
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Connect WhatsApp in 3 Simple Steps
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 leading-relaxed font-normal">
            You do <strong>not</strong> need to create any developer apps or write code. Growthwapi is an official WhatsApp platform — connect your number in under 2 minutes directly through Meta's popup.
          </p>

          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-emerald-800 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition-all"
            >
              <Zap size={15} className="text-brand-orange fill-brand-orange" />
              Connect Now on Dashboard <ArrowRight size={15} />
            </Link>
            <a
              href="https://business.facebook.com/billing_hub/payment_settings"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all"
            >
              Add Billing Card on Meta <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Partner 1-on-1 Setup Support Banner */}
      {hasSetupSupport && (
        <div className="bg-gradient-to-r from-[#25D366]/10 to-emerald-50 border border-[#25D366]/40 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">🤝</span>
          <div>
            <p className="text-sm font-black text-emerald-800">You have 1-on-1 Partner Setup Support!</p>
            <p className="text-xs text-emerald-700 font-medium mt-0.5 leading-relaxed">
              Your Growthwapi partner ({referrerCode ? `Code: ${referrerCode}` : 'your referrer'}) is available to personally guide you through
              this entire WhatsApp Business API setup and Meta account configuration.
              Reach out to them directly on WhatsApp for dedicated assistance.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('fast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'fast'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Flame size={16} className={activeTab === 'fast' ? 'text-amber-300 fill-amber-300' : 'text-orange-500'} />
          1-Click Automatic Setup (Recommended)
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-brand-blue text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <CreditCard size={16} />
          Meta Billing Card Setup
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'verification'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <ShieldCheck size={16} />
          Green Tick & Verification
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'manual'
              ? 'bg-gray-800 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <SettingsIcon size={16} />
          Manual Settings (Optional)
        </button>
      </div>

      {/* TAB 1: 1-Click Fast Connect */}
      {activeTab === 'fast' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Super Easy • 2 Minutes</span>
                <h2 className="text-xl sm:text-2xl font-black text-brand-dark">How to Connect Your WhatsApp Number</h2>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                Zero Technical Knowledge Required
              </span>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Because you are using <strong>Growthwapi</strong>, our official Meta partner application handles all server configs, webhooks, and API tokens automatically. Follow these 3 simple steps:
            </p>

            {/* 3 Visual Step Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Step 1 */}
              <div className="p-5 bg-gradient-to-b from-emerald-50/70 to-white border border-emerald-200 rounded-2xl relative space-y-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  1
                </div>
                <h3 className="font-bold text-sm text-brand-dark">Click "Connect Now"</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Go to your <Link to="/dashboard" className="text-emerald-700 font-bold underline">Dashboard Home</Link> and click the orange <strong>"Connect Now"</strong> button. An official Meta WhatsApp popup will open.
                </p>
                <div className="p-2.5 bg-white border border-emerald-100 rounded-xl text-[11px] text-emerald-900 font-medium">
                  ✓ Growthwapi's verified Meta App opens securely
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 bg-gradient-to-b from-blue-50/70 to-white border border-blue-200 rounded-2xl relative space-y-3">
                <div className="w-9 h-9 rounded-xl bg-brand-blue text-white flex items-center justify-center font-black text-sm shadow-xs">
                  2
                </div>
                <h3 className="font-bold text-sm text-brand-dark">Log In & Select Business</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Log in with your existing Facebook account. Select your Meta Business portfolio or create a new one inside the popup with your business name.
                </p>
                <div className="p-2.5 bg-white border border-blue-100 rounded-xl text-[11px] text-blue-900 font-medium">
                  ✓ Takes 30 seconds inside the popup
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 bg-gradient-to-b from-orange-50/70 to-white border border-orange-200 rounded-2xl relative space-y-3">
                <div className="w-9 h-9 rounded-xl bg-brand-orange text-white flex items-center justify-center font-black text-sm shadow-xs">
                  3
                </div>
                <h3 className="font-bold text-sm text-brand-dark">Verify Phone via OTP</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Enter your business phone number (e.g. +91 98765 43210). Meta will send a 6-digit OTP code via SMS or Call. Enter the OTP, and you're done!
                </p>
                <div className="p-2.5 bg-white border border-orange-100 rounded-xl text-[11px] text-orange-950 font-medium">
                  ✓ Number links instantly to your dashboard
                </div>
              </div>
            </div>

            {/* Crucial Note about phone number */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <Info size={16} className="text-amber-600" />
                <span>Important Rule About Your Phone Number:</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                The number you connect to official WhatsApp Cloud API <strong>cannot be simultaneously active on the normal WhatsApp or WhatsApp Business mobile app</strong> on your phone.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-amber-950 pt-1">
                <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/60">
                  <span className="font-bold">Option A (Recommended):</span> Use a fresh new SIM card number specifically for your business API broadcasts & inbox.
                </div>
                <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/60">
                  <span className="font-bold">Option B (Existing number):</span> Open WhatsApp App on phone &rarr; Settings &rarr; Account &rarr; <em>Delete My Account</em> (this frees the number for API usage).
                </div>
              </div>
            </div>

            {/* Direct Action Card */}
            <div className="p-6 bg-gradient-to-r from-gray-900 to-brand-dark text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base">Ready to connect your number?</h3>
                <p className="text-xs text-gray-300 mt-1">Jump to your Dashboard Home and click "Connect Now" to launch the popup.</p>
              </div>
              <Link
                to="/dashboard"
                className="bg-brand-orange hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all shrink-0 inline-flex items-center gap-2"
              >
                <Zap size={15} /> Go to Dashboard & Connect <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Meta Billing Card */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-brand-blue uppercase tracking-wider block">Meta Payments • Step 2</span>
                <h2 className="text-xl sm:text-2xl font-black text-brand-dark">Set Up WhatsApp Billing Card on Meta</h2>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-brand-blue font-bold text-xs rounded-full">
                1,000 Free Conversations / Month
              </span>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Meta gives every business <strong>1,000 free service (customer care) conversations every month</strong>. To send outbound broadcasts or marketing messages, Meta requires a credit or debit card attached directly to your WhatsApp Business Account.
            </p>

            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-brand-blue font-bold text-sm">
                <CreditCard size={18} />
                <span>1-Click Direct Link to Meta Payment Settings</span>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                Click the button below to open Meta's official Billing Hub directly in a new tab:
              </p>
              <a
                href="https://business.facebook.com/billing_hub/payment_settings"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-950 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl shadow-md transition-colors"
              >
                🔗 Set up WhatsApp Billing Card on Meta <ExternalLink size={14} />
              </a>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900">Step-by-step instructions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-xs text-gray-700 leading-relaxed pl-1">
                <li>Click the blue button above to open <strong className="text-brand-blue">business.facebook.com/billing_hub/payment_settings</strong></li>
                <li>In top left, make sure your <strong>Business Portfolio</strong> is selected.</li>
                <li>Click <strong className="text-brand-dark">"Add Payment Method"</strong>.</li>
                <li>Enter your Card Details (Visa, Mastercard, or RuPay with International Transactions enabled).</li>
                <li>Complete the nominal ₹2-5 OTP bank verification (Meta refunds this immediately). Done! ✅</li>
              </ol>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-800">💡 Important Card Notes:</p>
              <p>• Make sure <strong>International Online Payments</strong> are turned ON in your banking app for that card.</p>
              <p>• Both Credit Cards and Debit Cards are supported.</p>
              <p>• Meta bills you directly for official conversation fees according to standard Meta pricing.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Business Verification & Green Tick */}
      {activeTab === 'verification' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">Scale & Trust • Optional</span>
                <h2 className="text-xl sm:text-2xl font-black text-brand-dark">Meta Business Verification & Official Green Tick</h2>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold text-xs rounded-full">
                Unlock 10,000+ to Unlimited Messages / Day
              </span>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              When you first connect, Meta allows you to start messaging right away (up to 250 conversations/day). To scale to <strong>10,000, 100,000, or Unlimited messages daily</strong> and display an official Green Tick badge next to your brand name, verify your business with Meta.
            </p>

            <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50/50 border border-purple-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <ShieldCheck size={18} className="text-purple-600" />
                <span>Documents Checklist for Meta Verification:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-purple-950">
                <div className="p-3 bg-white/90 rounded-xl border border-purple-100 space-y-1">
                  <p className="font-bold text-purple-900">1. Legal Business Proof</p>
                  <p className="text-[11px] text-gray-600">GST Certificate, Udyam MSME Registration Certificate, or Certificate of Incorporation.</p>
                </div>
                <div className="p-3 bg-white/90 rounded-xl border border-purple-100 space-y-1">
                  <p className="font-bold text-purple-900">2. Business Address Proof</p>
                  <p className="text-[11px] text-gray-600">Recent Electricity Bill, Landline Bill, or Bank Account Statement showing matching legal address.</p>
                </div>
                <div className="p-3 bg-white/90 rounded-xl border border-purple-100 space-y-1">
                  <p className="font-bold text-purple-900">3. Official Business Website</p>
                  <p className="text-[11px] text-gray-600">Active website showing your brand name, contact details, address, and Privacy Policy.</p>
                </div>
                <div className="p-3 bg-white/90 rounded-xl border border-purple-100 space-y-1">
                  <p className="font-bold text-purple-900">4. Domain Email Address</p>
                  <p className="text-[11px] text-gray-600">An official email on your domain (e.g. contact@yourbrand.com) to receive Meta's verification code.</p>
                </div>
              </div>

              <a
                href="https://business.facebook.com/settings/security"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                Open Meta Verification Portal <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Manual Settings Entry */}
      {activeTab === 'manual' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Advanced Alternative</span>
                <h2 className="text-xl sm:text-2xl font-black text-brand-dark">Manual IDs & Webhook Configuration</h2>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold text-xs rounded-full">
                For Custom Apps or Migrations
              </span>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              If you are migrating from another BSP (like Wati, AiSensy, Interakt) or already have your own Phone Number ID & WABA ID, you can manually paste them in <Link to="/dashboard/settings" className="text-brand-blue font-bold underline">Settings</Link>.
            </p>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Growthwapi Webhook Credentials</h4>
              <p className="text-xs text-gray-600">
                If using a custom app, configure this webhook in your Meta Developer console under WhatsApp &rarr; Configuration:
              </p>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Callback URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 font-mono text-xs text-gray-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                    className="bg-brand-blue text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedKey === 'Webhook URL' ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKey === 'Webhook URL' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Verify Token
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={verifyToken}
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 font-mono text-xs text-gray-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(verifyToken, 'Verify Token')}
                    className="bg-brand-blue text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-900 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedKey === 'Verify Token' ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKey === 'Verify Token' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/dashboard/settings"
                className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
              >
                Go to Settings Page <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

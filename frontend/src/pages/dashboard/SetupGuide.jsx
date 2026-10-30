import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  CreditCard,
  Webhook,
  Send,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Key,
  Layers,
  Sparkles,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SetupGuide() {
  const [copiedKey, setCopiedKey] = useState('')
  const [activeStep, setActiveStep] = useState(1)

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${key} copied to clipboard!`)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  const webhookUrl = 'https://growthwapi-backend.onrender.com/api/whatsapp/webhook'
  const verifyToken = 'growthwapi_secure_2026'

  const steps = [
    {
      id: 1,
      title: 'Create Meta Business Suite Account',
      badge: 'Step 1 • 2 Mins',
      desc: 'Create an official Meta Business Manager account to manage your business identity.',
      icon: Layers,
    },
    {
      id: 2,
      title: 'Create App on Meta for Developers',
      badge: 'Step 2 • 3 Mins',
      desc: 'Set up a WhatsApp Business API app in the Meta Developers console.',
      icon: Key,
    },
    {
      id: 3,
      title: 'Add & Verify Your WhatsApp Number',
      badge: 'Step 3 • 2 Mins',
      desc: 'Register the phone number your customers will message with on WhatsApp.',
      icon: Smartphone,
    },
    {
      id: 4,
      title: 'Copy Phone Number ID & WABA ID',
      badge: 'Step 4 • 1 Min',
      desc: 'Connect your registered number to Growthwapi with 2 IDs from Meta.',
      icon: ArrowRight,
    },
    {
      id: 5,
      title: 'Configure Webhook (Receive Messages)',
      badge: 'Step 5 • 2 Mins',
      desc: 'Enable instant two-way messaging so replies flow right into your Growthwapi Inbox.',
      icon: Webhook,
    },
    {
      id: 6,
      title: 'Add Meta WhatsApp Billing Card',
      badge: 'Step 6 • 2 Mins',
      desc: 'Attach a credit/debit card on Meta to unlock active message broadcasts.',
      icon: CreditCard,
    },
    {
      id: 7,
      title: 'Business Verification (Green Tick)',
      badge: 'Step 7 • Optional',
      desc: 'Get the prestigious Green Tick badge and increase your daily messaging limit to unlimited.',
      icon: ShieldCheck,
    },
    {
      id: 8,
      title: 'Send Your First Message!',
      badge: 'Step 8 • Ready',
      desc: 'Test your connection and send high-converting broadcasts from Growthwapi.',
      icon: Send,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-blue via-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-orange/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-orange-300 mb-3 border border-white/10">
            <Sparkles size={14} /> Official Meta WhatsApp Cloud API Setup
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Complete WhatsApp Setup Guide
          </h1>
          <p className="text-sm sm:text-base text-blue-100 font-normal leading-relaxed">
            Follow this 8-step guide to connect your official WhatsApp Business number to Growthwapi in less than 15 minutes. No coding or complex technical setup required.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/dashboard/settings"
              className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md transition-all"
            >
              Go to Settings to Paste IDs <ArrowRight size={15} />
            </Link>
            <a
              href="https://developers.facebook.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all"
            >
              Open Meta Developers <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Steps Nav + Active Step Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Selector Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs mb-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              <span>Steps Progress</span>
              <span className="text-brand-orange">{activeStep} of 8</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-orange h-full rounded-full transition-all duration-300"
                style={{ width: `${(activeStep / 8) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-xs divide-y divide-gray-100">
            {steps.map((s) => {
              const Icon = s.icon
              const isCurrent = activeStep === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(s.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                    isCurrent
                      ? 'bg-orange-50 border border-orange-200 shadow-xs'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-black text-xs ${
                      isCurrent
                        ? 'bg-brand-orange text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-bold truncate ${
                        isCurrent ? 'text-brand-dark' : 'text-gray-800'
                      }`}
                    >
                      {s.title}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {s.badge}
                    </p>
                  </div>
                  {activeStep > s.id && (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-1" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Step Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1 */}
          {activeStep === 1 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-black">
                  1
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Step 1 of 8</span>
                  <h2 className="text-xl sm:text-2xl font-black text-brand-dark">Create Meta Business Suite Account</h2>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                To use the official WhatsApp Cloud API, Meta requires an official Business Account. If you already have one, you can skip to Step 2.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
                <p className="font-bold flex items-center gap-2">
                  <Info size={16} className="text-blue-600" /> What you will need:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 pl-2">
                  <li>Your official Business Name (legal entity or brand name)</li>
                  <li>Business Email address (preferably with your domain, e.g. hello@yourbrand.com, though Gmail also works)</li>
                  <li>Your active personal Facebook profile to admin the business account</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900">Follow these instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-gray-700 leading-relaxed">
                  <li>Go to <strong className="font-semibold text-brand-blue">business.facebook.com/overview</strong></li>
                  <li>Click on the blue <strong className="font-semibold">"Create Account"</strong> button in top right.</li>
                  <li>Enter your Business name, your name, and your business email.</li>
                  <li>Check your inbox and verify the email address received from Meta.</li>
                </ol>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <a
                  href="https://business.facebook.com/overview"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-950 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
                >
                  Open Meta Business Suite <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => setActiveStep(2)}
                  className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors"
                >
                  Next Step: Create App <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {activeStep === 2 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-black">
                  2
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Step 2 of 8</span>
                  <h2 className="text-xl sm:text-2xl font-black text-brand-dark">Create Meta Developer App</h2>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                The Meta Developer App bridges your WhatsApp number to Growthwapi's cloud servers.
              </p>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900">Step-by-step setup:</h4>
                <div className="space-y-3 text-xs text-gray-700">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="font-bold text-gray-900">1. Log in to Meta for Developers</p>
                    <p className="mt-1">Visit <span className="font-semibold text-brand-blue">developers.facebook.com</span> and log in with your Facebook account.</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="font-bold text-gray-900">2. Click "My Apps" &rarr; "Create App"</p>
                    <p className="mt-1">Click the green <strong className="text-green-700">"Create App"</strong> button at top right.</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="font-bold text-gray-900">3. Select Use Case</p>
                    <p className="mt-1">Select <strong className="text-brand-orange">"Other"</strong> &rarr; click Next &rarr; Select <strong className="text-brand-orange">"Business"</strong> as App Type.</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="font-bold text-gray-900">4. Enter App Name & Select Business Portfolio</p>
                    <p className="mt-1">Give your app a name (e.g. <em>Growthwapi WhatsApp</em>) and select your Meta Business Account from the dropdown.</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="font-bold text-gray-900">5. Add WhatsApp Product</p>
                    <p className="mt-1">On the Add Products dashboard, scroll down to <strong className="text-green-700">"WhatsApp"</strong> and click <strong className="text-brand-blue">"Set up"</strong>.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <button
                  onClick={() => setActiveStep(1)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  &larr; Back
                </button>
                <div className="flex gap-2">
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-950 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
                  >
                    Open Developer Apps <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors"
                  >
                    Next: Add Phone Number <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {activeStep === 3 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-black">
                  3
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Step 3 of 8</span>
                  <h2 className="text-xl sm:text-2xl font-black text-brand-dark">Add & Verify Your Phone Number</h2>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                Connect your real customer-facing phone number (e.g. your SIM or landline number) to the WhatsApp Business API.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
                <p className="font-bold flex items-center gap-2">
                  <Info size={16} className="text-amber-600" /> Crucial Requirement for Phone Numbers:
                </p>
                <p className="leading-relaxed">
                  The number you register <strong>cannot be currently active on the personal WhatsApp or WhatsApp Business mobile app</strong> on your phone.
                </p>
                <p className="font-medium text-amber-800">
                  💡 <em>If it is already on the mobile app:</em> Open WhatsApp App &rarr; Settings &rarr; Account &rarr; Delete My Account (this releases the number for API usage). Alternatively, use a fresh new SIM card!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900">How to add the number in Meta:</h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-gray-700 leading-relaxed">
                  <li>In your Developer App, click <strong className="text-brand-dark">WhatsApp &rarr; API Setup</strong> on the left sidebar.</li>
                  <li>Scroll down to <strong>"Step 5: Add a phone number"</strong>.</li>
                  <li>Click <strong className="text-brand-blue">"Add phone number"</strong>.</li>
                  <li>Enter your <strong>Business Display Name</strong> (e.g. "Acme Store"), Business category, and description.</li>
                  <li>Enter your phone number (e.g. +91 98765 43210) & select <strong>Text Message (SMS)</strong> or <strong>Phone Call</strong> for verification.</li>
                  <li>Enter the 6-digit OTP code received on your phone. Your number is now registered! ✅</li>
                </ol>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <button
                  onClick={() => setActiveStep(2)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  &larr; Back
                </button>
                <button
                  onClick={() => setActiveStep(4)}
                  className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors"
                >
                  Next: Copy IDs <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {activeStep === 4 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-black">
                  4
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Step 4 of 8</span>
                  <h2 className="text-xl sm:text-2xl font-black text-brand-dark">Copy Phone Number ID & WABA ID</h2>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                Now copy your 2 unique IDs from the Meta Developer Console and paste them into your Growthwapi Settings page.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-orange inline-block" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Where to find these IDs:</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Meta Console &rarr; <strong>WhatsApp &rarr; API Setup</strong> &rarr; Look at <strong>"Step 1: Select phone numbers"</strong>.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                      <p className="text-[11px] font-bold text-gray-500">1. Phone number ID</p>
                      <p className="text-xs font-mono font-bold text-brand-dark mt-1">e.g. 1313417765190326</p>
                      <p className="text-[10px] text-gray-400 mt-1">Click the copy icon next to it in Meta</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                      <p className="text-[11px] font-bold text-gray-500">2. WhatsApp Business Account ID (WABA)</p>
                      <p className="text-xs font-mono font-bold text-brand-dark mt-1">e.g. 102435698712345</p>
                      <p className="text-[10px] text-gray-400 mt-1">Click the copy icon next to it in Meta</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-orange-950">Ready to save your IDs?</p>
                    <p className="text-xs text-orange-800 mt-0.5">Paste both IDs in Growthwapi Settings &rarr; WhatsApp Integration.</p>
                  </div>
                  <Link
                    to="/dashboard/settings"
                    className="inline-flex items-center gap-1.5 bg-brand-orange text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs hover:bg-orange-600 transition-colors shrink-0"
                  >
                    Open Settings Page <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <button
                  onClick={() => setActiveStep(3)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  &larr; Back
                </button>
                <button
                  onClick={() => setActiveStep(5)}
                  className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors"
                >
                  Next: Setup Webhook <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {activeStep === 5 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-black">
                  5
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Step 5 of 8</span>
                  <h2 className="text-xl sm:text-2xl font-black text-brand-dark">Configure Meta Webhook</h2>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                The Webhook allows WhatsApp to immediately push all customer replies, status updates (delivered/read), and incoming media directly to your Growthwapi Inbox.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                  <p className="text-xs font-bold text-gray-800">
                    In Meta Console &rarr; WhatsApp &rarr; <strong>Configuration</strong> &rarr; Click <strong>"Edit"</strong> in Webhook:
                  </p>

                  {/* Callback URL */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      1. Callback URL
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

                  {/* Verify Token */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      2. Verify Token
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

                  {/* Webhook Fields */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-bold text-gray-900 mb-1">3. Webhook Subscription Fields:</p>
                    <p className="text-xs text-gray-600">
                      Click <strong>"Verify and Save"</strong>. Then, in the Webhook fields list below it, click <strong>"Manage"</strong> and check <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold text-xs">messages</span>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <button
                  onClick={() => setActiveStep(4)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  &larr; Back
                </button>
                <button
                  onClick={() => setActiveStep(6)}
                  className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors"
                >
                  Next: Add Billing Card <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {activeStep === 6 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-black">
                  6
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Step 6 of 8</span>
                  <h2 className="text-xl sm:text-2xl font-black text-brand-dark">Set up WhatsApp Billing Card on Meta</h2>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                Meta requires a payment method attached directly to your WhatsApp Business Account. Meta gives <strong>1,000 free service conversations every month</strong>! For broadcasts and marketing campaigns beyond that, Meta bills your card directly at standard rates.
              </p>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-brand-blue" />
                  <span className="font-bold text-xs text-blue-950 uppercase tracking-wider">How to add Card in 1 Click:</span>
                </div>
                <p className="text-xs text-blue-900 leading-relaxed">
                  Click the button below to jump straight into Meta's Billing Hub. Select your Business Portfolio &rarr; Add Credit/Debit Card (International transactions enabled on card).
                </p>
                <a
                  href="https://business.facebook.com/billing_hub/payment_settings"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-900 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  🔗 Set up WhatsApp Billing Card on Meta <ExternalLink size={14} />
                </a>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-800">💡 Important Card Notes:</p>
                <p>• Make sure <strong>International Online Payments</strong> are enabled in your bank app.</p>
                <p>• Visa, Mastercard, and American Express are accepted.</p>
                <p>• Meta does a nominal ₹2-5 authorization check which is reversed immediately.</p>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <button
                  onClick={() => setActiveStep(5)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  &larr; Back
                </button>
                <button
                  onClick={() => setActiveStep(7)}
                  className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors"
                >
                  Next: Green Tick & Verification <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7 */}
          {activeStep === 7 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-black">
                  7
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Step 7 of 8 (Optional)</span>
                  <h2 className="text-xl sm:text-2xl font-black text-brand-dark">Business Verification & Official Green Tick</h2>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                By default, Meta gives you 250 unique business conversations per day. To scale to 10,000, 100,000, or <strong>Unlimited</strong> messages per day and display an official Green Tick badge next to your brand name, verify your business with Meta.
              </p>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <span>Required Documents for Meta Verification:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-emerald-950">
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                    <p className="font-bold text-emerald-900">1. Legal Business Proof</p>
                    <p className="text-[11px] text-emerald-800 mt-1">GST Certificate, Udyam MSME Registration, Incorporation / CIN</p>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                    <p className="font-bold text-emerald-900">2. Business Address Proof</p>
                    <p className="text-[11px] text-emerald-800 mt-1">Recent Electricity Bill, Bank Statement with matching address</p>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                    <p className="font-bold text-emerald-900">3. Official Website</p>
                    <p className="text-[11px] text-emerald-800 mt-1">Active domain with business name, contact info, privacy policy</p>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                    <p className="font-bold text-emerald-900">4. Domain Email OTP</p>
                    <p className="text-[11px] text-emerald-800 mt-1">Verification code sent to your official domain email (e.g. name@brand.com)</p>
                  </div>
                </div>

                <a
                  href="https://business.facebook.com/settings/security"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors mt-2"
                >
                  Open Meta Verification Portal <ExternalLink size={14} />
                </a>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <button
                  onClick={() => setActiveStep(6)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  &larr; Back
                </button>
                <button
                  onClick={() => setActiveStep(8)}
                  className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors"
                >
                  Next: Start Sending! <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 8 */}
          {activeStep === 8 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Step 8 of 8</span>
                  <h2 className="text-xl sm:text-2xl font-black text-brand-dark">You're All Set! Start Sending</h2>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                Congratulations! Once your Phone Number ID and WABA ID are saved in Growthwapi Settings, your workspace is connected and ready to broadcast and auto-reply.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link
                  to="/dashboard/contacts"
                  className="p-4 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-2xl text-center group transition-all"
                >
                  <div className="w-10 h-10 bg-orange-100 text-brand-orange rounded-xl mx-auto flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <p className="text-xs font-bold text-gray-900 group-hover:text-brand-orange">Import Contacts</p>
                  <p className="text-[11px] text-gray-500 mt-1">Upload Excel/CSV or paste customer numbers</p>
                </Link>

                <Link
                  to="/dashboard/templates"
                  className="p-4 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-2xl text-center group transition-all"
                >
                  <div className="w-10 h-10 bg-orange-100 text-brand-orange rounded-xl mx-auto flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <p className="text-xs font-bold text-gray-900 group-hover:text-brand-orange">Choose Template</p>
                  <p className="text-[11px] text-gray-500 mt-1">Select or create your Meta approved template</p>
                </Link>

                <Link
                  to="/dashboard/broadcast"
                  className="p-4 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-2xl text-center group transition-all"
                >
                  <div className="w-10 h-10 bg-orange-100 text-brand-orange rounded-xl mx-auto flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                    3
                  </div>
                  <p className="text-xs font-bold text-gray-900 group-hover:text-brand-orange">Launch Broadcast</p>
                  <p className="text-[11px] text-gray-500 mt-1">Send to all contacts in 1 click</p>
                </Link>
              </div>

              <div className="p-4 bg-brand-light rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-brand-dark">Need an overview of all dashboard features?</p>
                  <p className="text-xs text-gray-500">Check out the complete Growthwapi Feature Tour.</p>
                </div>
                <Link
                  to="/dashboard/overview"
                  className="inline-flex items-center gap-1.5 bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-900 transition-colors shrink-0"
                >
                  <BookOpen size={14} /> View Feature Tour
                </Link>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                <button
                  onClick={() => setActiveStep(7)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  &larr; Back
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors"
                >
                  Go to Main Dashboard <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

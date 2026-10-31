import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Award,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Users,
  Wallet,
  Smartphone,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AffiliateLanding() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Interactive Calculator State
  const [clientCount, setClientCount] = useState(10)
  const [selectedPlanTier, setSelectedPlanTier] = useState('growth') // starter, growth, pro, mixed

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  const handleCtaClick = () => {
    if (user) {
      navigate('/dashboard/affiliate')
    } else {
      navigate('/signup?role=partner')
    }
  }

  // Calculate projected earnings
  const calculateEarnings = () => {
    if (selectedPlanTier === 'starter') return clientCount * 700
    if (selectedPlanTier === 'growth') return clientCount * 1310
    if (selectedPlanTier === 'pro') return clientCount * 2325
    // Mixed: 50% Growth, 30% Starter, 20% Pro
    const starterPart = Math.round(clientCount * 0.3) * 700
    const growthPart = Math.round(clientCount * 0.5) * 1310
    const proPart = Math.round(clientCount * 0.2) * 2325
    return starterPart + growthPart + proPart
  }

  const faqs = [
    {
      q: 'Do I need any technical knowledge or WhatsApp API to become an Affiliate Partner?',
      a: 'Not at all! You do not need any WhatsApp API or developer background. Simply share your unique referral link with business owners, retail shops, or marketing agencies. Growthwapi handles all client onboarding, customer support, and server infrastructure.'
    },
    {
      q: 'Why is there a one-time ₹200 fee to become an Affiliate Partner?',
      a: 'The ₹200 is a one-time lifetime verification fee designed to filter out spam bots and ensure high-intent partners. It unlocks your dedicated partner dashboard, custom live click tracking link, marketing assets, and automated direct UPI/Bank withdrawal system. No monthly or renewal fees ever.'
    },
    {
      q: 'When and how do I receive my commissions?',
      a: 'As soon as your referred client subscribes or renews their monthly plan, commission is instantly credited to your partner wallet. Once your balance reaches ₹400 or more, you can request an instant withdrawal directly to your UPI ID (Google Pay, PhonePe, Paytm) or Bank Account — processed within 24 hours.'
    },
    {
      q: 'How does the recurring commission schedule work?',
      a: 'Every subscription plan has a clear tiered commission schedule: Starter Plan pays for 3 months (₹400 + ₹200 + ₹100 = ₹700 total), Growth Plan pays for 4 months (₹700 + ₹350 + ₹175 + ₹85 = ₹1,310 total), and Pro Plan pays for 5 months (₹1,200 + ₹600 + ₹300 + ₹150 + ₹75 = ₹2,325 total per client).'
    },
    {
      q: 'What happens if a client upgrades to a higher plan?',
      a: 'If your referred client upgrades their plan, your future recurring commissions will automatically adjust upward based on the upgraded plan schedule!'
    }
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* ── TOP ANNOUNCEMENT BAR ── */}
      <div className="bg-gradient-to-r from-brand-blue via-blue-900 to-brand-purple text-white py-2 px-4 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
        <span className="bg-brand-orange text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
          NEW
        </span>
        <span>Growthwapi Partner Program is Live! Earn up to ₹2,325 per referral.</span>
        <button
          onClick={handleCtaClick}
          className="underline font-bold text-amber-300 hover:text-white transition-colors ml-1 hidden sm:inline"
        >
          Join for ₹200 →
        </button>
      </div>

      {/* ── STICKY NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png.png" alt="Growthwapi" className="h-9 sm:h-10 object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm font-bold text-gray-600">
            <a href="#schedule" className="hover:text-brand-orange transition-colors">Commission Matrix</a>
            <a href="#calculator" className="hover:text-brand-orange transition-colors">Income Calculator</a>
            <a href="#how-it-works" className="hover:text-brand-orange transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-brand-orange transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs sm:text-sm font-bold text-brand-dark px-3.5 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Login
            </Link>
            <button
              onClick={handleCtaClick}
              className="px-4 sm:px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-orange-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <span>Join for ₹200</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-orange-50/40 via-white to-white">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-brand-orange text-xs font-extrabold mb-6 shadow-2xs">
            <Sparkles size={14} className="text-brand-orange animate-pulse" />
            <span>OFFICIAL PARTNER & AFFILIATE INITIATIVE</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight sm:leading-none tracking-tight mb-6">
            Earn Up To <span className="text-brand-orange">₹2,325</span> Recurring Commission Per Business Client
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Promote Growthwapi WhatsApp Automation to shopkeepers, agencies, coaching centers, and D2C brands.
            No coding or Meta subscription needed. Get passive recurring payouts directly into your UPI or Bank every month.
          </p>

          {/* Pricing Highlight Pill */}
          <div className="inline-block bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-lg shadow-gray-100 mb-8 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">One-Time Lifetime Fee</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-brand-blue">₹200</span>
                  <span className="text-xs text-gray-400 line-through">₹999</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    80% OFF Today
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Zero monthly renewals • Lifetime tracking & payouts</p>
              </div>

              <button
                onClick={handleCtaClick}
                className="w-full sm:w-auto px-6 py-3.5 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-300/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>Activate Partner Account</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Instant UPI & Bank Payouts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>No API Subscription Needed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Live Click & Referral Dashboard</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE INCOME CALCULATOR ── */}
      <section id="calculator" className="py-16 sm:py-20 bg-gray-50/70 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">Profit Estimator</span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mt-1">
              Calculate Your Monthly Passive Income
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              See how much recurring passive income you can generate by referring business clients.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-xl space-y-8">
            {/* Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs sm:text-sm font-extrabold text-gray-700">
                  How Many Business Clients Can You Refer?
                </label>
                <span className="text-xl sm:text-2xl font-black text-brand-orange bg-orange-50 px-3.5 py-1 rounded-xl">
                  {clientCount} Clients
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={clientCount}
                onChange={(e) => setClientCount(Number(e.target.value))}
                className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-orange"
              />
              <div className="flex justify-between text-[11px] text-gray-400 font-semibold mt-1">
                <span>1 Client</span>
                <span>25 Clients</span>
                <span>50 Clients</span>
              </div>
            </div>

            {/* Plan Selector */}
            <div>
              <label className="text-xs sm:text-sm font-extrabold text-gray-700 block mb-3">
                Which Plan Will Your Clients Choose?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'starter', name: 'Starter Plan', payout: '₹700 / client' },
                  { id: 'growth', name: 'Growth Plan', payout: '₹1,310 / client' },
                  { id: 'pro', name: 'Pro Plan', payout: '₹2,325 / client' },
                  { id: 'mixed', name: 'Mixed Average', payout: 'Avg ₹1,330' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPlanTier(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedPlanTier === item.id
                        ? 'bg-blue-50 border-brand-blue ring-2 ring-brand-blue/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-900">{item.name}</div>
                    <div className="text-[11px] font-semibold text-brand-orange mt-0.5">{item.payout}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Income Result Box */}
            <div className="bg-gradient-to-br from-brand-blue via-blue-900 to-brand-purple rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  Total Projected Commission
                </span>
                <div className="text-3xl sm:text-5xl font-black mt-1 text-white">
                  ₹{calculateEarnings().toLocaleString()}
                </div>
                <p className="text-xs text-blue-100 mt-2">
                  Direct UPI / Bank Transfer • Lifetime Partner Status
                </p>
              </div>

              <button
                onClick={handleCtaClick}
                className="w-full sm:w-auto px-6 py-3.5 bg-brand-orange hover:bg-orange-600 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-orange-900/40 transition-all shrink-0"
              >
                Join for ₹200 & Start Earning →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIERED COMMISSION MATRIX ── */}
      <section id="schedule" className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">Transparent Matrix</span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mt-1">
            Exact Recurring Commission Per Package
          </h2>
          <p className="text-sm text-gray-600 mt-2 max-w-xl mx-auto">
            Every time your referred client renews their monthly subscription, you earn the exact commission shown below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Starter */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">
                  Starter Plan
                </span>
                <span className="text-xs font-bold text-gray-400">₹999 / mo</span>
              </div>
              <div className="text-2xl font-black text-gray-900 mb-1">₹700 Total</div>
              <p className="text-xs text-gray-500 mb-6">Recurring payouts over the first 3 months</p>

              <div className="space-y-2.5 border-t border-gray-100 pt-4 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Month 1 (Activation):</span>
                  <span className="font-extrabold text-emerald-600">₹400</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Month 2 (Renewal):</span>
                  <span className="font-extrabold text-emerald-600">₹200</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Month 3 (Renewal):</span>
                  <span className="font-extrabold text-emerald-600">₹100</span>
                </div>
                <div className="flex justify-between py-1 text-gray-400">
                  <span>Month 4 onwards:</span>
                  <span>Capped (₹0)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 text-center">
              <span className="text-[11px] font-bold text-gray-400">Overall 70% of first month price</span>
            </div>
          </div>

          {/* Card 2: Growth (Highlighted) */}
          <div className="bg-gradient-to-b from-orange-50/50 to-white rounded-3xl border-2 border-brand-orange p-6 sm:p-8 shadow-xl flex flex-col justify-between relative transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-xs">
              MOST POPULAR PLAN
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-orange-100 text-brand-orange rounded-full text-xs font-bold">
                  Growth Plan
                </span>
                <span className="text-xs font-bold text-gray-500">₹2,999 / mo</span>
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">₹1,310 Total</div>
              <p className="text-xs text-gray-500 mb-6">Recurring payouts over the first 4 months</p>

              <div className="space-y-2.5 border-t border-orange-100 pt-4 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Month 1 (Activation):</span>
                  <span className="font-extrabold text-emerald-600">₹700</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Month 2 (Renewal):</span>
                  <span className="font-extrabold text-emerald-600">₹350</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Month 3 (Renewal):</span>
                  <span className="font-extrabold text-emerald-600">₹175</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Month 4 (Renewal):</span>
                  <span className="font-extrabold text-emerald-600">₹85</span>
                </div>
                <div className="flex justify-between py-1 text-gray-400">
                  <span>Month 5 onwards:</span>
                  <span>Capped (₹0)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-orange-100 text-center">
              <span className="text-[11px] font-bold text-brand-orange">Maximum referrals pick this package</span>
            </div>
          </div>

          {/* Card 3: Pro */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-purple-100 text-brand-purple rounded-full text-xs font-bold">
                  Pro Plan
                </span>
                <span className="text-xs font-bold text-gray-400">₹7,999 / mo</span>
              </div>
              <div className="text-2xl font-black text-gray-900 mb-1">₹2,325 Total</div>
              <p className="text-xs text-gray-500 mb-6">Recurring payouts over the first 5 months</p>

              <div className="space-y-2.5 border-t border-gray-100 pt-4 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Month 1 (Activation):</span>
                  <span className="font-extrabold text-emerald-600">₹1,200</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Month 2 (Renewal):</span>
                  <span className="font-extrabold text-emerald-600">₹600</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Month 3 (Renewal):</span>
                  <span className="font-extrabold text-emerald-600">₹300</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Month 4 (Renewal):</span>
                  <span className="font-extrabold text-emerald-600">₹150</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Month 5 (Renewal):</span>
                  <span className="font-extrabold text-emerald-600">₹75</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 text-center">
              <span className="text-[11px] font-bold text-purple-700">Highest earning per single client</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-gray-50/70 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">Simple Process</span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mt-1">
              How to Start Earning (4 Easy Steps)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Register & Pay ₹200',
                desc: 'Sign up and pay the ₹200 one-time lifetime fee. Instant VIP Partner account verification is unlocked.'
              },
              {
                step: '02',
                title: 'Get Referral Link',
                desc: 'Instantly get your custom tracking link (growthwapi.com/?ref=CODE) and ready-to-share marketing assets.'
              },
              {
                step: '03',
                title: 'Share With Businesses',
                desc: 'Share your link via WhatsApp, direct client pitches, local businesses, marketing agencies, or social media.'
              },
              {
                step: '04',
                title: 'Withdraw via UPI',
                desc: 'When clients subscribe, commissions are credited to your wallet. Request payout to UPI or Bank once you hit ₹400.'
              }
            ].map((st) => (
              <div key={st.step} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-2xs space-y-3">
                <span className="text-3xl font-black text-brand-orange/30">{st.step}</span>
                <h3 className="font-extrabold text-gray-900 text-base">{st.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>

          {/* Exclusive Client Perks — pitch card for affiliates */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-3xl p-6 text-white space-y-4">
            <div>
              <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider mb-1">🎁 Exclusive — Your Biggest Selling Point</p>
              <h3 className="text-lg font-black leading-snug">What Your Referred Clients Get (That Nobody Else Offers)</h3>
              <p className="text-xs text-emerald-100 mt-1">Use these perks as your pitch — this is what makes your referral link irresistible!</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/15 backdrop-blur rounded-2xl p-4 space-y-2">
                <p className="text-sm font-black">💬 Bonus Free Messages on 1st Plan</p>
                <div className="text-xs text-emerald-100 space-y-1">
                  <div className="flex justify-between"><span>Starter Plan:</span><span className="font-bold text-white">+200 messages</span></div>
                  <div className="flex justify-between"><span>Growth Plan:</span><span className="font-bold text-white">+300 messages</span></div>
                  <div className="flex justify-between"><span>Pro Plan:</span><span className="font-bold text-white">+500 messages</span></div>
                </div>
                <p className="text-[10px] text-emerald-200">*One-time bonus on first purchase only, auto-applied.</p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl p-4 space-y-2">
                <p className="text-sm font-black">🤝 1-on-1 Setup by You (The Partner)</p>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Every client you refer gets <strong>your personal onboarding assistance</strong> — WhatsApp Business setup, Meta API connection, and initial account configuration. Your expertise is their biggest benefit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section id="faq" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">Common Questions</span>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-2xl overflow-hidden transition-all bg-white"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-gray-900 flex items-center justify-between hover:bg-gray-50/50"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180 text-brand-orange' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA BANNER ── */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-brand-blue via-blue-900 to-brand-purple text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-amber-300 border border-white/20">
            Limited Time Activation Offer
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Start Your Passive Income Journey with Growthwapi Today
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Pay just ₹200 one-time to become a verified Growthwapi Partner and earn recurring commissions transferred directly to your UPI or Bank.
          </p>

          <div className="pt-2">
            <button
              onClick={handleCtaClick}
              className="px-8 py-4 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-orange-950/50 transition-all transform hover:scale-105 inline-flex items-center gap-2"
            >
              <span>Join Partner Program (₹200)</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-10 border-t border-gray-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png.png" alt="Growthwapi" className="h-7 brightness-200" />
            <span>© {new Date().getFullYear()} Growthwapi. Official WhatsApp Business API Solution.</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-semibold">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Register</Link>
            <a href="https://wa.me/919122257780" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
              WhatsApp (+91 91222 57780)
            </a>
            <a href="https://www.instagram.com/growthwapi.in?cplk=MWV0MGIxbjhvcDhhbQ==" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 transition-colors">
              Instagram
            </a>
            <a href="mailto:growthwapi@gmail.com" className="hover:text-white transition-colors">
              growthwapi@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

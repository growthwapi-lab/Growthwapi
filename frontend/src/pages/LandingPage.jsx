import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'

// ─── Animation hook: triggers when element enters viewport ───
function useInView(threshold = 0.2) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ─── Counter hook ───
function useCounter(target, duration = 2000, inView = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
      else setCount(target)
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])
  return count
}

// ─── Ripple button ───
function RippleButton({ children, className, to, onClick }) {
  const [ripples, setRipples] = useState([])
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(r => [...r, { x, y, id }])
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600)
    onClick && onClick(e)
  }
  const inner = (
    <span className="relative z-10">{children}</span>
  )
  const rippleEls = ripples.map(rp => (
    <span key={rp.id} className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
      style={{ left: rp.x - 10, top: rp.y - 10, width: 20, height: 20 }} />
  ))
  if (to) return (
    <Link to={to} className={`relative overflow-hidden ${className}`} onClick={handleClick}>
      {rippleEls}{inner}
    </Link>
  )
  return (
    <button className={`relative overflow-hidden ${className}`} onClick={handleClick}>
      {rippleEls}{inner}
    </button>
  )
}

// ─── PRELOADER ───
function Preloader({ onDone }) {
  const [phase, setPhase] = useState('spin') // spin | pulse | curtain | done
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('pulse'), 1800)
    const t2 = setTimeout(() => setPhase('curtain'), 2100)
    const t3 = setTimeout(() => { setPhase('done'); onDone() }, 2750)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (phase === 'done') return null

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Curtain panels */}
      <div className={`absolute inset-y-0 left-0 w-1/2 bg-white transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.18,1)] ${phase === 'curtain' ? '-translate-x-full' : 'translate-x-0'}`} />
      <div className={`absolute inset-y-0 right-0 w-1/2 bg-white transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.18,1)] ${phase === 'curtain' ? 'translate-x-full' : 'translate-x-0'}`} />
      {/* Center logo */}
      {phase !== 'curtain' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="relative flex items-center justify-center">
            {/* Spinning arc ring */}
            <div className={`absolute w-32 h-32 rounded-full ${phase === 'spin' ? 'animate-spin' : ''}`}
              style={{ background: 'conic-gradient(#F97316 270deg, transparent 270deg)', borderRadius: '50%' }}>
              <div className="absolute inset-1 bg-white rounded-full" />
            </div>
            {/* Logo circle */}
            <div className={`relative w-28 h-28 rounded-full bg-white shadow-xl flex items-center justify-center transition-transform duration-300 ${phase === 'pulse' ? 'scale-[1.15]' : 'scale-100'}`}>
              <img src="/logo.png.png" alt="Growthwapi" className="h-16 object-contain" onError={e => { e.target.style.display='none' }} />
              <span className="text-2xl font-black text-[#1E3A5F] hidden">GW</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── WORD CYCLER ───
function WordCycle() {
  const words = ['Business', 'Automation', 'Growth', 'Marketing']
  const [idx, setIdx] = useState(0)
  const [animOut, setAnimOut] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimOut(true)
      setTimeout(() => {
        setIdx(i => (i + 1) % words.length)
        setAnimOut(false)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="inline-block relative overflow-hidden min-w-[200px]">
      <span className={`inline-block text-[#F97316] transition-all duration-300 ${animOut ? '-translate-y-5 opacity-0' : 'translate-y-0 opacity-100'}`}>
        {words[idx]}
      </span>
    </span>
  )
}

// ─── DASHBOARD MOCKUP ───
function DashboardMockup() {
  return (
    <div className="animate-float hidden md:block">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-full max-w-md mx-auto">
        {/* Browser bar */}
        <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-3 border-b border-gray-200">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">
            app.growthwapi.com
          </div>
        </div>
        {/* Content */}
        <div className="p-5 space-y-4 bg-gradient-to-b from-white to-orange-50/30">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Messages Sent', value: '1,240', trend: '↑ 12%', color: 'bg-orange-50 border-orange-100' },
              { label: 'Active Contacts', value: '89', trend: '↑ 5%', color: 'bg-blue-50 border-blue-100' },
              { label: 'AI Replies', value: '324/500', trend: '64%', color: 'bg-green-50 border-green-100' },
            ].map((s, i) => (
              <div key={i} className={`${s.color} border rounded-xl p-3`}>
                <div className="text-[10px] text-gray-500 font-medium leading-tight mb-1">{s.label}</div>
                <div className="text-sm font-black text-gray-800">{s.value}</div>
                <div className="text-[10px] text-green-600 font-semibold">{s.trend}</div>
              </div>
            ))}
          </div>
          {/* Bar chart */}
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-2">Weekly Messages</div>
            <div className="flex items-end gap-1.5 h-16">
              {[45,72,58,90,63,80,95].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm transition-all duration-700"
                    style={{ height: `${h}%`, background: i === 6 ? '#F97316' : '#1E3A5F', opacity: i === 6 ? 1 : 0.6 }} />
                  <span className="text-[8px] text-gray-400">{['M','T','W','T','F','S','S'][i]}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Activity */}
          <div className="space-y-2">
            {[
              { msg: '📩 Bulk campaign sent to 420 contacts', time: '2m ago' },
              { msg: '🤖 AI replied to Ravi Kumar', time: '5m ago' },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                <span className="text-gray-700">{a.msg}</span>
                <span className="text-gray-400 whitespace-nowrap ml-2">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── STATS COUNTER CARD ───
function StatCard({ target, suffix, label, delay, inView }) {
  const count = useCounter(target, 2000, inView)
  return (
    <div className={`text-center transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="text-5xl font-black text-white mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-[#F97316] font-semibold text-sm uppercase tracking-wider">{label}</div>
    </div>
  )
}

// ─── FAQ ITEM ───
function FaqItem({ q, a, isOpen, onToggle }) {
  const contentRef = useRef(null)
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-800 pr-4">{q}</span>
        <span className={`text-2xl text-[#F97316] transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-350 ease-in-out"
        style={{ maxHeight: isOpen ? (contentRef.current?.scrollHeight + 'px' || '500px') : '0px' }}
      >
        <p className="px-6 pb-5 text-gray-600 leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

// ─── TESTIMONIAL SLIDER ───
function TestimonialSlider() {
  const testimonials = [
    { text: "Growthwapi helped our clinic reduce no-shows by 60% with automated appointment reminders. Our patients love the WhatsApp updates!", name: "Dr. Priya Sharma", loc: "Delhi", icon: "🏥" },
    { text: "Our salon bookings doubled after we started sending WhatsApp broadcasts with Growthwapi. The template builder is incredibly easy to use.", name: "Neha Kapoor", loc: "Mumbai", icon: "💇" },
    { text: "The AI chatbot handles 80% of customer queries automatically. It's a complete game changer for our e-commerce business.", name: "Rahul Mehta", loc: "Bangalore", icon: "🛒" },
  ]
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [fading, setFading] = useState(false)

  const goTo = (i) => {
    if (i === active) return
    setFading(true)
    setTimeout(() => { setActive(i); setFading(false) }, 400)
  }

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => goTo((active + 1) % testimonials.length), 4000)
    return () => clearInterval(t)
  }, [active, paused])

  const t = testimonials[active]
  return (
    <div className="relative max-w-2xl mx-auto" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Prev */}
      <button onClick={() => goTo((active - 1 + testimonials.length) % testimonials.length)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 w-9 h-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-500 hover:text-[#F97316] transition-colors z-10">
        ‹
      </button>
      {/* Next */}
      <button onClick={() => goTo((active + 1) % testimonials.length)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 w-9 h-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-500 hover:text-[#F97316] transition-colors z-10">
        ›
      </button>
      <div className={`bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-gray-100 transition-opacity duration-400 ${fading ? 'opacity-0' : 'opacity-100'}`}>
        <div className="text-5xl mb-4">{t.icon}</div>
        <p className="text-gray-700 text-lg leading-relaxed mb-6 italic">"{t.text}"</p>
        <div>
          <div className="font-bold text-gray-900">{t.name}</div>
          <div className="text-sm text-gray-400">{t.loc}</div>
        </div>
        <div className="flex gap-1 mt-4">
          {'★★★★★'.split('').map((s, i) => <span key={i} className="text-[#F97316]">{s}</span>)}
        </div>
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === active ? 'bg-[#F97316] w-5' : 'bg-gray-300'}`} />
        ))}
      </div>
    </div>
  )
}

// ─── MARQUEE ───
function Marquee() {
  const items = ['Clinics','Salons','Coaching Centers','Restaurants','Real Estate','E-commerce','Retail Stores','Travel Agencies','Gyms & Fitness','Law Firms']
  const doubled = [...items, ...items]
  return (
    <div className="overflow-hidden relative group">
      <div className="flex gap-4 animate-marquee group-hover:[animation-play-state:paused]" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} className="px-5 py-2 bg-white border border-[#1E3A5F]/20 rounded-full text-[#1E3A5F] font-semibold text-sm shadow-sm whitespace-nowrap cursor-default hover:border-[#F97316] hover:text-[#F97316] transition-colors">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───
export default function LandingPage() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')

  // Capture referral code from URL and persist in localStorage + track click
  useEffect(() => {
    if (refCode) {
      const cleanCode = refCode.trim().toUpperCase()
      localStorage.setItem('gw_referral_code', cleanCode)
      api.post('/api/affiliate/track-click', { code: cleanCode }).catch(() => {})
    }
  }, [refCode])

  const [preloaderDone, setPreloaderDone] = useState(false)
  const [showPreloader, setShowPreloader] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ── preloader logic (runs on every page load / refresh) ──
  useEffect(() => {
    if (prefersReduced) { setPreloaderDone(true); setHeroVisible(true); return }
    setShowPreloader(true)
  }, [])

  const handlePreloaderDone = () => {
    setPreloaderDone(true)
    setTimeout(() => setHeroVisible(true), 100)
  }

  // ── navbar scroll ──
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── section refs ──
  const [featRef, featInView] = useInView(0.15)
  const [statsRef, statsInView] = useInView(0.3)
  const [howRef, howInView] = useInView(0.2)
  const [pricRef, pricInView] = useInView(0.15)
  const [div1Ref, div1InView] = useInView(0.3)
  const [div2Ref, div2InView] = useInView(0.3)
  const [div3Ref, div3InView] = useInView(0.3)
  const [ctaRef, ctaInView] = useInView(0.3)
  const [testRef, testInView] = useInView(0.2)
  const [marqueeRef, marqueeInView] = useInView(0.2)

  const features = [
    { icon: '🤖', title: 'AI Chatbot', desc: 'Train an AI agent on your website to auto-reply 24/7 to customer WhatsApp queries.' },
    { icon: '📢', title: 'Bulk Broadcast', desc: 'Send personalized messages to thousands of contacts instantly with scheduled delivery.' },
    { icon: '📋', title: 'Template Manager', desc: 'Create, submit, and track Meta-approved message templates from one dashboard.' },
    { icon: '👥', title: 'Contact Management', desc: 'Import, organize, and segment your contacts with custom tags and filters.' },
    { icon: '💳', title: 'Wallet & Billing', desc: 'Transparent per-message billing with wallet top-ups and monthly quota tracking.' },
    { icon: '🔌', title: 'Developer API', desc: 'Full REST API with API keys to integrate WhatsApp messaging into any app or workflow.' },
  ]

  const faqs = [
    { q: 'What is Growthwapi?', a: 'Growthwapi is an official WhatsApp Business API platform that lets businesses automate messaging, manage contacts, run bulk broadcasts, and deploy AI chatbots — all from one dashboard.' },
    { q: 'Do I need a WhatsApp Business Account?', a: 'Yes, you need a WhatsApp Business API account connected through Meta. We guide you through the entire setup process during onboarding.' },
    { q: 'Is there a free trial?', a: 'Yes! Every new account gets a 7-day free trial with a limited message quota. No credit card required to start.' },
    { q: 'What happens after my monthly quota is exhausted?', a: 'When your plan quota runs out, extra messages are billed at ₹0.25 per utility message and ₹1.75 per marketing message from your wallet balance.' },
    { q: 'Can I use the AI chatbot on any plan?', a: 'The AI WhatsApp Agent is available on Growth (500 AI replies/mo) and Pro (2,000 AI replies/mo) plans. Starter plan users can upgrade anytime.' },
    { q: 'Is my data secure?', a: 'Yes. All data is stored securely with enterprise-grade encryption and row-level security. Messages are transmitted via Meta\'s official encrypted WhatsApp API. We never store message content beyond what\'s necessary for inbox display.' },
  ]

  return (
    <>
      {/* Global styles injected via style tag */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes ripple { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(30); opacity: 0; } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes drawLine { from { width: 0%; } to { width: 100%; } }
        @keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-spin { animation: spin 1.2s linear infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-marquee { animation: marquee 25s linear infinite; }
        .animate-ripple { animation: ripple 0.6s ease-out forwards; }
        .shimmer-badge { background: linear-gradient(90deg, #F97316 0%, #FED7AA 50%, #F97316 100%); background-size: 200% auto; animation: shimmer 2s linear infinite; }
        .line-draw { animation: drawLine 1s ease forwards; }
        .circle-pop { animation: popIn 0.3s ease forwards; }
        .feature-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .feature-card:hover { transform: translateY(-6px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); }
        .feature-card:hover .feat-icon { transform: rotate(10deg); transition: transform 0.25s ease; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* PRELOADER */}
      {showPreloader && !preloaderDone && <Preloader onDone={handlePreloaderDone} />}

      <div className="min-h-screen font-sans text-gray-900 overflow-x-hidden">

        {/* ── NAVBAR ── */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)]' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center">
              <img src="/logo.png.png" alt="Growthwapi" className="h-10 md:h-12 object-contain" />
            </a>
            <div className="hidden md:flex items-center gap-8">
              {['Features','Pricing','FAQ'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} className="text-[#1E3A5F] hover:text-[#F97316] font-medium transition-colors">{l}</a>
              ))}
              <Link to="/login" className="border border-[#1E3A5F] text-[#1E3A5F] px-4 py-2 rounded-lg font-medium hover:bg-[#1E3A5F] hover:text-white transition-all">
                Login
              </Link>
              <RippleButton to="/signup" className="bg-[#F97316] text-white px-5 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200/50">
                Start Free Trial
              </RippleButton>
            </div>
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 text-[#1E3A5F]">
              <div className="w-6 h-0.5 bg-current mb-1.5" />
              <div className="w-6 h-0.5 bg-current mb-1.5" />
              <div className="w-6 h-0.5 bg-current" />
            </button>
          </div>
          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden bg-white border-t border-gray-100 px-6 pb-4 space-y-3">
              {['Features','Pricing','FAQ'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileOpen(false)} className="block py-2 text-[#1E3A5F] font-medium">{l}</a>
              ))}
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-[#1E3A5F] font-medium">Login</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="block w-full text-center bg-[#F97316] text-white py-2.5 rounded-lg font-bold">Start Free Trial</Link>
            </div>
          )}
        </nav>

        {/* ── HERO ── */}
        <section className="min-h-screen pt-24 pb-16 flex items-center" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF7F0 100%)' }}>
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center w-full">
            {/* Text */}
            <div>
              {/* Badge */}
              <div className={`transition-all duration-600 ease-out ${heroVisible || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: '0ms' }}>
                <span className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-[#F97316] text-sm font-semibold px-4 py-2 rounded-full mb-6">
                  <span>✦</span> Official WhatsApp Business API
                </span>
              </div>
              {/* Headline */}
              <div className={`transition-all duration-600 ease-out ${heroVisible || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: '150ms' }}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1E3A5F] leading-tight mb-6">
                  Turn WhatsApp Into Your Most Powerful{' '}
                  <WordCycle />{' '}Tool
                </h1>
              </div>
              {/* Sub */}
              <div className={`transition-all duration-600 ease-out ${heroVisible || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: '300ms' }}>
                <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
                  Engage customers, automate replies, and send bulk broadcasts effortlessly. The official WhatsApp Business API platform built for growing businesses.
                </p>
              </div>
              {/* Buttons */}
              <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-600 ease-out ${heroVisible || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: '450ms' }}>
                <RippleButton to="/signup" className="bg-[#F97316] text-white px-8 py-3.5 rounded-xl font-bold text-lg shadow-xl shadow-orange-200/50 hover:bg-orange-600 transition-all transform hover:-translate-y-0.5">
                  Start Free Trial →
                </RippleButton>
                <button className="border-2 border-[#1E3A5F] text-[#1E3A5F] px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-[#1E3A5F] hover:text-white transition-all">
                  ▶ Watch Demo
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-4">✓ 7-day free trial &nbsp;·&nbsp; ✓ No credit card required</p>
            </div>
            {/* Mockup */}
            <div className={`transition-all duration-700 ease-out ${heroVisible || prefersReduced ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}
              style={{ transitionDelay: '200ms' }}>
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ── DIVIDER 1 ── */}
        <section ref={div1Ref} className="relative py-16"
          style={{ background: '#1E3A5F', clipPath: 'polygon(0 15%, 100% 0%, 100% 85%, 0% 100%)' }}>
          <div className={`text-center transition-all duration-700 ${div1InView || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-white text-2xl md:text-4xl font-black tracking-[0.12em] uppercase px-6">
              Automate. Engage. Grow.
            </p>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-24 bg-white" ref={featRef}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-[#1E3A5F] mb-4">Everything you need to grow</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">One platform for all your WhatsApp business automation needs.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <div key={i} className={`feature-card bg-white border border-gray-100 rounded-2xl p-8 shadow-sm will-change-transform transition-all duration-500 ${featInView || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: `${i * 120}ms` }}>
                  <div className="feat-icon text-4xl mb-5 inline-block">{f.icon}</div>
                  <h3 className="text-xl font-bold text-[#1E3A5F] mb-3">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DIVIDER 2 ── */}
        <section ref={div2Ref} className="relative py-16"
          style={{ background: 'linear-gradient(135deg, #F97316, #1E3A5F)', clipPath: 'polygon(0 0%, 100% 15%, 100% 100%, 0% 85%)' }}>
          <div className={`text-center transition-all duration-700 ${div2InView || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-white text-2xl md:text-3xl font-black px-6 leading-snug">
              Your customers are on WhatsApp.<br className="hidden md:block" /> Are you?
            </p>
          </div>
        </section>

        {/* ── STATS ── */}
        <section ref={statsRef} className="py-24" style={{ background: '#1E3A5F' }}>
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
            <StatCard target={500} suffix="+" label="Businesses Onboarded" delay={0} inView={statsInView || prefersReduced} />
            <StatCard target={10} suffix="M+" label="Messages Sent" delay={200} inView={statsInView || prefersReduced} />
            <StatCard target={99.9} suffix="%" label="Uptime Guaranteed" delay={400} inView={statsInView || prefersReduced} />
            <StatCard target={24} suffix="/7" label="AI Support Active" delay={600} inView={statsInView || prefersReduced} />
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-24 bg-white" ref={howRef}>
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-[#1E3A5F] mb-4">How It Works</h2>
              <p className="text-gray-500 text-lg">Get started in minutes, grow in days.</p>
            </div>
            {/* Steps */}
            <div className="relative">
              {/* Progress line */}
              <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-gray-100">
                <div className={`h-full bg-[#F97316] origin-left ${howInView || prefersReduced ? 'line-draw' : 'w-0'}`} />
              </div>
              <div className="grid md:grid-cols-3 gap-8 relative z-10">
                {[
                  { n: '01', title: 'Sign Up & Connect', desc: 'Create your account and connect your WhatsApp Business number through our guided Meta integration.' },
                  { n: '02', title: 'Set Up & Automate', desc: 'Build message templates, configure your AI chatbot, and set up contact segments for broadcasts.' },
                  { n: '03', title: 'Broadcast & Grow', desc: 'Start sending campaigns, watch your inbox fill up, and track all analytics from your dashboard.' },
                ].map((step, i) => (
                  <div key={i} className={`text-center transition-all duration-500 ${howInView || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${i * 200}ms` }}>
                    <div className={`w-16 h-16 rounded-full bg-[#F97316] text-white font-black text-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200 ${howInView || prefersReduced ? 'circle-pop' : 'scale-0 opacity-0'}`}
                      style={{ animationDelay: `${i * 350}ms` }}>
                      {step.n}
                    </div>
                    <h3 className="text-xl font-bold text-[#1E3A5F] mb-3">{step.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="py-24 bg-gray-50" ref={pricRef}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-[#1E3A5F] mb-4">Simple, transparent pricing</h2>
              <p className="text-gray-500 text-lg">Start free. Scale as you grow.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Starter */}
              <div className={`bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:scale-[1.03] hover:shadow-lg transition-all duration-300 will-change-transform ${pricInView || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: '0ms' }}>
                <div className="text-3xl mb-2">🌱</div>
                <h3 className="text-xl font-bold text-[#1E3A5F] mb-1">Starter</h3>
                <div className="text-4xl font-black text-gray-900 mb-6">₹999<span className="text-lg font-normal text-gray-400">/mo</span></div>
                <ul className="space-y-3 mb-8 text-gray-600">
                  {['1,000 Utility Messages/mo','500 Marketing Messages/mo','Basic Inbox','1 Team Member','Template Manager'].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> {f}</li>
                  ))}
                </ul>
                <RippleButton to="/signup" className="block text-center w-full border-2 border-[#1E3A5F] text-[#1E3A5F] py-3 rounded-xl font-bold hover:bg-[#1E3A5F] hover:text-white transition-all">
                  Get Started
                </RippleButton>
              </div>

              {/* Growth — highlighted */}
              <div className={`relative rounded-2xl p-8 border-2 border-[#F97316] shadow-2xl shadow-orange-100 scale-105 bg-white will-change-transform ${pricInView || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: '150ms' }}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="shimmer-badge text-white text-xs font-black px-5 py-1.5 rounded-full tracking-widest uppercase shadow-lg">
                    Most Popular
                  </span>
                </div>
                <div className="text-3xl mb-2">🚀</div>
                <h3 className="text-xl font-bold text-[#1E3A5F] mb-1">Growth</h3>
                <div className="text-4xl font-black text-gray-900 mb-6">₹2999<span className="text-lg font-normal text-gray-400">/mo</span></div>
                <ul className="space-y-3 mb-8 text-gray-600">
                  {['5,000 Utility Messages/mo','2,000 Marketing Messages/mo','Smart Inbox & Broadcasts','5 Team Members','AI Agent (500 replies/mo)','Advanced Analytics'].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-[#F97316] font-bold">✓</span> {f}</li>
                  ))}
                </ul>
                <RippleButton to="/signup" className="block text-center w-full bg-[#F97316] text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200">
                  Get Started
                </RippleButton>
              </div>

              {/* Pro */}
              <div className={`bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:scale-[1.03] hover:shadow-lg transition-all duration-300 will-change-transform ${pricInView || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: '300ms' }}>
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="text-xl font-bold text-[#1E3A5F] mb-1">Pro</h3>
                <div className="text-4xl font-black text-gray-900 mb-6">₹7999<span className="text-lg font-normal text-gray-400">/mo</span></div>
                <ul className="space-y-3 mb-8 text-gray-600">
                  {['20,000 Utility Messages/mo','10,000 Marketing Messages/mo','Everything in Growth','Unlimited Team Members','AI Agent (2,000 replies/mo)','Priority Support + API Access'].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> {f}</li>
                  ))}
                </ul>
                <RippleButton to="/signup" className="block text-center w-full border-2 border-[#1E3A5F] text-[#1E3A5F] py-3 rounded-xl font-bold hover:bg-[#1E3A5F] hover:text-white transition-all">
                  Get Started
                </RippleButton>
              </div>
            </div>
            <div className="text-center mt-8 text-gray-500 text-sm space-y-1">
              <p>✓ All plans include 7-day free trial. No credit card required to start.</p>
              <p>Extra messages: ₹0.25/utility msg &nbsp;·&nbsp; ₹1.75/marketing msg after quota.</p>
            </div>
          </div>
        </section>

        {/* ── DIVIDER 3 ── */}
        <section ref={div3Ref} className="relative py-16"
          style={{ background: '#F97316', clipPath: 'polygon(0 15%, 100% 0%, 100% 85%, 0% 100%)' }}>
          <div className={`text-center transition-all duration-700 ${div3InView || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-white text-xl md:text-3xl font-black px-6">
              Join 500+ businesses already growing with Growthwapi.
            </p>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <section ref={marqueeRef} className="py-16 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 mb-8">
            <h2 className="text-center text-2xl font-black text-[#1E3A5F]">Trusted by businesses across India</h2>
          </div>
          <Marquee />
        </section>

        {/* ── TESTIMONIALS ── */}
        <section ref={testRef} className="py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-[#1E3A5F] mb-4">What our clients say</h2>
              <p className="text-gray-500 text-lg">Real results from real businesses.</p>
            </div>
            <div className={`transition-all duration-700 ${testInView || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <TestimonialSlider />
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-[#1E3A5F] mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-500 text-lg">Everything you need to know about Growthwapi.</p>
            </div>
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <FaqItem key={i} q={f.q} a={f.a} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER CTA BAND ── */}
        <section ref={ctaRef} style={{ background: '#1E3A5F' }} className="py-20">
          <div className={`max-w-3xl mx-auto px-6 text-center transition-all duration-700 ${ctaInView || prefersReduced ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to automate your WhatsApp?
            </h2>
            <p className="text-gray-300 text-lg mb-8">Start free. No credit card needed. Cancel anytime.</p>
            <RippleButton to="/signup" className="inline-block bg-[#F97316] text-white px-10 py-4 rounded-xl font-black text-lg shadow-2xl shadow-orange-900/30 hover:bg-orange-500 transition-all transform hover:-translate-y-1">
              Start Your 7-Day Free Trial →
            </RippleButton>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: '#12233F' }} className="border-t border-white/5 pt-12 pb-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8 mb-10">
              {/* Brand */}
              <div>
                <div className="flex items-center mb-4">
                  <img src="/logo.png.png" alt="Growthwapi" className="h-10 md:h-12 object-contain" />
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Grow your business, one conversation at a time.
                </p>
                <div className="flex gap-3 mt-4">
                  {[
                    { icon: '💬', label: 'WhatsApp', href: '#' },
                    { icon: '📸', label: 'Instagram', href: '#' },
                    { icon: '💼', label: 'LinkedIn', href: '#' },
                  ].map(s => (
                    <a key={s.label} href={s.href} title={s.label}
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-[#F97316] transition-colors">
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
              {/* Links */}
              <div>
                <h4 className="text-white font-bold mb-4">Platform</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><a href="#features" className="hover:text-[#F97316] transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-[#F97316] transition-colors">Pricing</a></li>
                  <li><a href="#faq" className="hover:text-[#F97316] transition-colors">FAQ</a></li>
                  <li><Link to="/login" className="hover:text-[#F97316] transition-colors">Login</Link></li>
                </ul>
              </div>
              {/* Legal */}
              <div>
                <h4 className="text-white font-bold mb-4">Legal & Contact</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-[#F97316] transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-[#F97316] transition-colors">Terms of Service</a></li>
                  <li><a href="mailto:support@growthwapi.com" className="hover:text-[#F97316] transition-colors">support@growthwapi.com</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6 text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Growthwapi. All rights reserved. Built with ❤️ for Indian businesses.
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}

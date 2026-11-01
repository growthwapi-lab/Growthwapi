import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, ArrowLeft, Mail, Phone, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png.png" alt="Growthwapi" className="h-8 object-contain" onError={e => { e.target.style.display = 'none' }} />
            <span className="font-black text-xl text-[#1E3A5F]">Growth<span className="text-[#F97316]">wapi</span></span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3A5F] hover:text-[#F97316] transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-white to-[#F1F5F9] border-b border-gray-200 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold mb-4">
            <FileText size={14} /> Platform Agreement & Messaging Rules
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#1E3A5F] mb-3">Terms of Service</h1>
          <p className="text-sm text-gray-500">
            Last Updated: November 1, 2026 &bull; Effective Date: November 1, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-sm leading-relaxed text-gray-700">
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F]">1. Agreement to Terms</h2>
          <p>
            By accessing or using <strong>Growthwapi</strong> (<a href="https://growthwapi.in" className="text-[#F97316] underline">https://growthwapi.in</a>), you agree to be bound by these Terms of Service and our <Link to="/privacy-policy" className="text-[#F97316] font-semibold underline">Privacy Policy</Link>. If you do not agree, you must not use our software or API integrations.
          </p>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F]">2. Nature of Service</h2>
          <p>
            Growthwapi is an authorized platform operating on the <strong>Official WhatsApp Business Cloud API</strong> provided by Meta Platforms, Inc. We provide cloud software that allows businesses to manage conversations, send approved template notifications, build automated AI flows, and review messaging analytics.
          </p>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-[#1E3A5F] flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" /> 3. WhatsApp Anti-Spam & Messaging Compliance
          </h2>
          <p>You agree to strictly comply with all WhatsApp and Meta Business Messaging Policies:</p>
          <ul className="space-y-1.5 list-disc list-inside text-gray-600">
            <li>You must have <strong>explicit prior opt-in consent</strong> from all recipients before initiating marketing or utility WhatsApp conversations.</li>
            <li>You must provide a clear and easy way for recipients to opt out (such as replying "STOP" or "UNSUBSCRIBE").</li>
            <li>You must not use Growthwapi to send spam, illegal goods, gambling, adult content, fraudulent schemes, or deceptive solicitations.</li>
            <li>Violations of WhatsApp Quality Rating guidelines (resulting in Red tier or account restrictions by Meta) are solely the user's responsibility. Growthwapi reserves the right to suspend accounts engaged in abusive broadcasting.</li>
          </ul>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F]">4. Free Trial, Subscriptions & Wallet Billing</h2>
          <ul className="space-y-1.5 list-disc list-inside text-gray-600">
            <li><strong>Free Trial:</strong> New registrations receive a 4-day free trial with capped trial messages. No credit card is required to start.</li>
            <li><strong>Monthly Plans:</strong> Paid plans (Starter ₹999/mo, Growth ₹2,999/mo, Pro ₹7,999/mo) provide defined monthly message quotas.</li>
            <li><strong>Overage & Meta Conversation Fees:</strong> Extra messages beyond monthly quotas require a funded wallet balance (billed at ₹0.25/utility message and ₹1.75/marketing message). Direct Meta conversation fees (if applicable) are paid via your linked Meta Business payment card.</li>
            <li><strong>Refunds:</strong> Subscription fees are billed in advance on a monthly basis and are non-refundable once activated. Unused wallet top-ups can be refunded upon account cancellation request.</li>
          </ul>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F]">5. Partner & Affiliate Program Rules</h2>
          <p>
            Users participating in the Growthwapi Partner & Affiliate Program earn recurring commissions based on our published schedule. Affiliates must not engage in fraudulent clicks, self-referral abuse, deceptive advertising, or misrepresenting Growthwapi's official pricing. Payouts are made via UPI or Bank transfer upon reaching the minimum withdrawal threshold.
          </p>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F]">6. Limitation of Liability</h2>
          <p>
            Growthwapi is not liable for indirect, incidental, or consequential damages resulting from downtime of third-party infrastructure (including Meta's WhatsApp Cloud API or internet network outages), or any account restriction imposed by Meta due to policy violations by the user.
          </p>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F]">7. Contact & Support</h2>
          <p>For any questions or legal inquiries regarding these Terms:</p>
          <div className="pt-2 space-y-1.5 text-xs text-gray-700">
            <p className="flex items-center gap-2"><Mail size={14} className="text-[#F97316]" /> <strong>Email:</strong> <a href="mailto:growthwapi@gmail.com" className="text-[#F97316] underline">growthwapi@gmail.com</a></p>
            <p className="flex items-center gap-2"><Phone size={14} className="text-[#25D366]" /> <strong>WhatsApp:</strong> <a href="https://wa.me/919122257780" className="text-emerald-700 underline">+91 91222 57780</a></p>
            <p><strong>Website:</strong> <a href="https://growthwapi.in" className="text-[#F97316] underline">https://growthwapi.in</a></p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        &copy; 2026 Growthwapi. All rights reserved. Built for Indian businesses.
      </footer>
    </div>
  )
}

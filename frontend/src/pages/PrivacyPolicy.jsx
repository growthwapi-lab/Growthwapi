import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowLeft, Mail, Phone, Lock, FileText, CheckCircle2 } from 'lucide-react'

export default function PrivacyPolicy() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold mb-4">
            <Shield size={14} /> Official Meta WhatsApp Cloud API Privacy Standards
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#1E3A5F] mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-500">
            Last Updated: November 1, 2026 &bull; Effective Date: November 1, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-sm leading-relaxed text-gray-700">
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F] flex items-center gap-2">
            <FileText size={18} className="text-[#F97316]" /> 1. Introduction & Overview
          </h2>
          <p>
            Welcome to <strong>Growthwapi</strong> ("we", "our", "us", accessible at <a href="https://growthwapi.in" className="text-[#F97316] font-semibold underline">https://growthwapi.in</a>). 
            Growthwapi provides a software-as-a-service (SaaS) platform that connects businesses with the <strong>Official Meta WhatsApp Business Cloud API</strong> to facilitate customer communication, automated replies, bulk broadcasts, and AI chatbots.
          </p>
          <p>
            We are committed to protecting your privacy and complying with all applicable data protection laws, including the <strong>Meta Platform Terms</strong>, <strong>WhatsApp Business Messaging Policy</strong>, and the <strong>Digital Personal Data Protection (DPDP) Act</strong>.
          </p>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-[#1E3A5F] flex items-center gap-2">
            <Lock size={18} className="text-[#F97316]" /> 2. Information We Collect
          </h2>
          <p>We only collect the data strictly necessary to provide and secure our WhatsApp Business API integration:</p>
          <ul className="space-y-2 list-disc list-inside text-gray-600">
            <li><strong>Account & Profile Information:</strong> Your full name, business email address, phone number, company/business name, and password (securely hashed).</li>
            <li><strong>Meta / WhatsApp Business Credentials:</strong> When you connect through Meta's Embedded Signup flow, we receive authorized tokens, WhatsApp Business Account ID (WABA ID), and verified Phone Number ID to facilitate message routing on your behalf.</li>
            <li><strong>Messaging Metadata & Content:</strong> Message timestamps, delivery statuses (sent, delivered, read, failed), recipient phone numbers, billing categories (utility, marketing), and message payloads needed to render your live dashboard inbox and analytics.</li>
            <li><strong>Payment & Billing Data:</strong> Transaction identifiers, subscription statuses, and invoice records processed securely via our PCI-DSS compliant payment gateway (Razorpay). We do <em>not</em> store full credit/debit card numbers or UPI PINs on our servers.</li>
          </ul>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F] flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" /> 3. How We Use Your Information
          </h2>
          <p>We use your data solely for legitimate business operations:</p>
          <ul className="space-y-1.5 list-disc list-inside text-gray-600">
            <li>To connect your official WhatsApp Business number and transmit messages via Meta's Cloud API.</li>
            <li>To provide live chat inbox, template management, bulk broadcast scheduling, and AI automated replies.</li>
            <li>To calculate monthly message quotas, wallet balances, and transparent overage billing.</li>
            <li>To verify partner referral codes and administer tiered affiliate commission payouts.</li>
            <li>To provide customer support and prevent spam, fraud, or violations of Meta's messaging policies.</li>
          </ul>
          <p className="font-semibold text-gray-800 pt-2">
            ⚠️ We NEVER sell, rent, or monetize your customer phone numbers, contacts, or message contents to third parties or advertisers.
          </p>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F]">4. Meta Platform & Data Compliance</h2>
          <p>
            Growthwapi is an authorized Meta Developer integration (App ID: <code>1628000222058652</code>). All WhatsApp messages are transmitted over secure TLS/HTTPS encryption directly through Meta's official Graph API endpoints.
          </p>
          <p>
            We strictly enforce Meta's policies against spam, unsolicited broadcasts, and policy-violating products. Businesses must obtain prior opt-in consent from their recipients before sending WhatsApp marketing campaigns.
          </p>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F]">5. Data Retention & Deletion</h2>
          <p>
            We retain account data for as long as your Growthwapi account remains active. If you wish to delete your account, disconnect your WhatsApp Business integration, or remove all historical data, you can do so at any time:
          </p>
          <ul className="space-y-1 list-disc list-inside text-gray-600">
            <li>Visit our dedicated <Link to="/data-deletion" className="text-[#F97316] font-bold underline">User Data Deletion Instructions</Link> page.</li>
            <li>Email our privacy team at <a href="mailto:growthwapi@gmail.com" className="text-[#F97316] font-semibold underline">growthwapi@gmail.com</a> with the subject "Data Deletion Request".</li>
          </ul>
          <p>Upon verification, all account records, tokens, and stored messages will be permanently expunged within 48 to 72 hours.</p>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F]">6. Contact Us</h2>
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact our Data Protection Officer:</p>
          <div className="pt-2 space-y-1.5 text-xs text-gray-700">
            <p className="flex items-center gap-2"><Mail size={14} className="text-[#F97316]" /> <strong>Email:</strong> <a href="mailto:growthwapi@gmail.com" className="text-[#F97316] underline">growthwapi@gmail.com</a></p>
            <p className="flex items-center gap-2"><Phone size={14} className="text-[#25D366]" /> <strong>WhatsApp / Phone:</strong> <a href="https://wa.me/919122257780" className="text-emerald-700 underline">+91 91222 57780</a></p>
            <p><strong>Website:</strong> <a href="https://growthwapi.in" className="text-[#F97316] underline">https://growthwapi.in</a></p>
            <p><strong>Operating Organization:</strong> Growthwapi Technologies, India</p>
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

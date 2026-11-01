import React from 'react'
import { Link } from 'react-router-dom'
import { Trash2, ArrowLeft, Mail, Shield, CheckCircle2 } from 'lucide-react'

export default function DataDeletion() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold mb-4">
            <Trash2 size={14} /> Meta Platform Compliance
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#1E3A5F] mb-3">User Data Deletion Instructions</h1>
          <p className="text-sm text-gray-500">
            Learn how to remove your data and disconnect your Facebook / WhatsApp account from Growthwapi.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 text-sm leading-relaxed text-gray-700">
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-[#1E3A5F]">How to Request Deletion of Your Data</h2>
          <p>
            In accordance with Meta Platform Terms and global privacy standards, Growthwapi provides users full control over their personal and business data. If you have used Facebook Login or connected your WhatsApp Business Account through Growthwapi (App ID: <code>1628000222058652</code>), you can request immediate removal of all associated data.
          </p>

          <h3 className="font-bold text-[#1E3A5F] pt-2">Method 1: Email Request (Recommended)</h3>
          <p>
            Send an email to our dedicated data privacy desk at <a href="mailto:growthwapi@gmail.com" className="text-[#F97316] font-bold underline">growthwapi@gmail.com</a> with the following details:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
            <li><strong>Subject:</strong> "Data Deletion Request - Growthwapi"</li>
            <li>Your registered Growthwapi account email address</li>
            <li>Your connected WhatsApp Business phone number (if applicable)</li>
          </ul>
          <p className="text-xs text-gray-500">
            Our team will confirm receipt within 24 hours, completely delete your profile, tokens, and stored messages from our database, and send you a confirmation code.
          </p>

          <h3 className="font-bold text-[#1E3A5F] pt-4">Method 2: Remove App via Facebook Settings</h3>
          <p>You can also disconnect Growthwapi directly from your Facebook account:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-gray-600 pl-2">
            <li>Go to your Facebook account <strong>Settings & Privacy &rarr; Settings</strong>.</li>
            <li>Scroll down and click on <strong>Apps and Websites</strong>.</li>
            <li>Find <strong>Growthwapi</strong> in the list of connected apps.</li>
            <li>Click <strong>Remove</strong>. This immediately revokes Growthwapi's access tokens.</li>
            <li>Click on <strong>View Removed Apps and Websites</strong>, select <strong>Growthwapi</strong>, and click <strong>Send Request</strong> to automatically submit a Meta data deletion callback to us.</li>
          </ol>
        </section>

        <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-[#1E3A5F]">What Happens When Data is Deleted?</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>All Meta access tokens and WhatsApp Business connection IDs are permanently deleted.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>Historical chat messages, broadcast campaign records, and contact lists are purged from our database.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>No further webhooks or message deliveries will be processed for your number.</span>
            </li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        &copy; 2026 Growthwapi. All rights reserved. Built for Indian businesses.
      </footer>
    </div>
  )
}

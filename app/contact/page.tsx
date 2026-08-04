"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Phone, MessageCircle, Mail, Send, CheckCircle2, Clock } from "lucide-react";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [requirements, setRequirements] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    // Validate 10 digits phone number
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setPhoneError("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmitting(true);

    // Simulate instant UI success state
    setTimeout(() => {
      setSubmitting(false);
      setSuccessMsg("Thanks! We'll reach out within 24 hours.");
      setFullName("");
      setPhone("");
      setEmail("");
      setRequirements("");
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">
              Contact Us
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-brand-darkblue">
              Get in touch
            </h1>
            <p className="text-slate-600 text-base sm:text-lg">
              Tell us about your requirements and we&apos;ll get back to you within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Side: Contact Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl">
              {successMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Full Name <span className="text-brand-orange">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Vikram Mehta"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Phone Number <span className="text-brand-orange">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (phoneError) setPhoneError("");
                      }}
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-sm"
                    />
                    {phoneError && (
                      <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Email Address <span className="text-brand-orange">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vikram@company.in"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Requirements <span className="text-brand-orange">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Tell us which service you're interested in and what you need..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-full text-white bg-brand-orange hover:bg-orange-600 font-semibold text-base transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Right Side: Direct Contact Info Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-brand-darkblue text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden space-y-8">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-orange/20 rounded-full blur-2xl"></div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Direct Contact Channels
                  </h3>
                  <p className="text-xs text-slate-300">
                    Reach our technical and sales team directly for immediate assistance.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Phone */}
                  <a
                    href="tel:+919122257780"
                    className="flex items-start gap-4 group p-3 rounded-2xl hover:bg-white/5 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-brand-orange flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Phone Call
                      </div>
                      <div className="text-lg font-bold text-white group-hover:text-brand-orange transition-colors">
                        +91 91222 57780
                      </div>
                      <div className="text-[11px] text-slate-400">Mon - Sat, 9am - 7pm IST</div>
                    </div>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/919122257780"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 group p-3 rounded-2xl hover:bg-white/5 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        WhatsApp Chat
                      </div>
                      <div className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        +91 91222 57780
                      </div>
                      <div className="text-[11px] text-slate-400">Instant response during work hours</div>
                    </div>
                  </a>

                  {/* Email */}
                  <a
                    href="mailto:growthpilot.in@gmail.com"
                    className="flex items-start gap-4 group p-3 rounded-2xl hover:bg-white/5 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Email Support
                      </div>
                      <div className="text-base font-bold text-white group-hover:text-blue-400 transition-colors break-all">
                        growthpilot.in@gmail.com
                      </div>
                      <div className="text-[11px] text-slate-400">24/7 inbox monitoring</div>
                    </div>
                  </a>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-slate-300">
                  <Clock className="w-4 h-4 text-brand-orange" />
                  <span>Guaranteed response within 24 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

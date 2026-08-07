"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Check, Sparkles, HelpCircle } from "lucide-react";

export default function PricingPage() {
  // FAQ data – unchanged from previous version
  const faqs = [
    {
      q: "What happens if I exceed my message limit on WhatsApp API?",
      a: "You are billed at standard overage rates (₹0.20 per utility message and ₹1.20 per marketing message). There are no service interruptions — excess usage is simply added to your next billing cycle.",
    },
    {
      q: "Can I upgrade or downgrade my plan anytime?",
      a: "Yes, absolutely! You can change your plan tier at any time through your dashboard or by contacting your dedicated GrowthWapi manager. Upgrades take effect immediately.",
    },
    {
      q: "Is there any hidden setup fee?",
      a: "No. All setup, Meta approval coordination, prompt configuration, and onboarding assistance are completely included in our published plan prices.",
    },
    {
      q: "What payment methods are accepted?",
      a: "We accept all major Indian payment channels including UPI, credit/debit cards, net banking, and Razorpay invoices. GST invoices are provided automatically.",
    },
    {
      q: "How fast can my AI Calling Agent or Website go live?",
      a: "AI Calling Agents are configured, tested, and live within 2 business days after requirement submission. Website development timelines range from 5 to 10 days depending on tier.",
    },
  ];

  // ---------------------------------------------------------------------
  // 1️⃣ WhatsApp API plans (4 cards, dual buttons for first 3)
  // ---------------------------------------------------------------------
  const whatsappPlans = [
    {
      name: "Starter",
      price: "₹1,000",
      period: "/month",
      features: ["2,000 utility + 200 marketing messages"],
      popular: false,
      hasTrial: true,
    },
    {
      name: "Growth",
      price: "₹3,000",
      period: "/month",
      features: ["6,000 utility + 600 marketing messages"],
      popular: true,
      hasTrial: true,
    },
    {
      name: "Business",
      price: "₹5,000",
      period: "/month",
      features: ["15,000 utility + 1,500 marketing messages"],
      popular: false,
      hasTrial: true,
    },
    {
      name: "Free Trial",
      price: "₹0",
      period: "",
      features: ["2‑Day Free Trial – up to 50 messages"],
      popular: false,
      hasTrial: false,
    },
  ];

  // ---------------------------------------------------------------------
  // 2️⃣ Combo plans – 3 tiers, dual buttons + badges
  // ---------------------------------------------------------------------
  const comboPlans = [
    {
      name: "Starter Combo",
      price: "₹3,800",
      period: "/month",
      features: [
        "WhatsApp API: 2,000 utility + 200 marketing messages",
        "AI Calling Agent: 150 minutes per month",
      ],
      badge: { text: "Save ₹500/month", color: "orange" },
      popular: false,
    },
    {
      name: "Growth Combo",
      price: "₹8,000",
      period: "/month",
      features: [
        "WhatsApp API: 6,000 utility + 600 marketing messages",
        "AI Calling Agent: 300 minutes per month",
      ],
      badge: { text: "Save ₹1,000/month", color: "orange" },
      popular: true,
    },
    {
      name: "Business Combo",
      price: "₹14,000",
      period: "/month",
      features: [
        "WhatsApp API: 15,000 utility + 1,500 marketing messages",
        "AI Calling Agent: 600 minutes per month",
      ],
      badge: { text: "Save ₹1,800/month", color: "orange" },
      popular: false,
    },
  ];

  // ---------------------------------------------------------------------
  // 3️⃣ AI Calling Agent plans – single button per card
  // ---------------------------------------------------------------------
  const aiPlans = [
    {
      name: "Starter",
      price: "₹3,300",
      period: "/month",
      features: ["150 minutes included (~50 calls)"],
      popular: false,
    },
    {
      name: "Growth",
      price: "₹6,000",
      period: "/month",
      features: ["300 minutes included (~100 calls)", "Priority Technical Support"],
      popular: true,
    },
    {
      name: "Business",
      price: "₹10,800",
      period: "/month",
      features: ["600 minutes included (~200 calls)", "Dedicated AI Specialist Support"],
      popular: false,
    },
  ];

  // ---------------------------------------------------------------------
  // 4️⃣ Website Development plans – unchanged original three tiers
  // ---------------------------------------------------------------------
  const webPlans = [
    {
      name: "Starter",
      price: "₹10,000",
      period: "one-time",
      features: [
        "5-8 pages professional layout",
        "Mobile‑responsive & fast loading",
        "Basic SEO setup & metadata",
        "Functional contact form",
        "3 revisions included",
      ],
      popular: false,
    },
    {
      name: "Growth",
      price: "₹20,000",
      period: "one-time",
      features: [
        "10-15 pages dynamic website",
        "Dynamic content & database integration",
        "Admin panel‑lite for blog/products",
        "WhatsApp & email instant alerts",
        "3 revisions included",
      ],
      popular: true,
    },
    {
      name: "Premium",
      price: "₹30,000",
      period: "one-time",
      features: [
        "15-20 pages full web platform",
        "Full database + custom admin dashboard",
        "Custom business logic & workflows",
        "Razorpay payment gateway ready",
        "Priority support & 3 revisions",
        "Complete code & handover document",
      ],
      popular: false,
    },
  ];

  // Helper for badge styling
  const badgeClasses = (color: string) =>
    color === "orange" ? "bg-orange-500 text-white" : "bg-blue-500 text-white";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* --------------------------------------------------- */}
      {/* 1️⃣ Hero / Introduction */}
      {/* --------------------------------------------------- */}
      <section className="bg-slate-900 text-white py-24 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xs font-bold tracking-widest text-orange-500 uppercase">
            Transparent Pricing
          </h2>
          <h1 className="text-3xl sm:text-5xl font-extrabold mt-4">
            Choose the right plan for your business scale
          </h1>
          <p className="text-slate-300 mt-4 max-w-2xl mx-auto">
            Simple, tier‑based pricing with zero hidden fees. Built for growing Indian enterprises, agencies, and impact organisations.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------- */}
      {/* 2️⃣ WhatsApp API Section */}
      {/* --------------------------------------------------- */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-blue-800 text-center">
            WhatsApp API — Start Free or Go Paid
          </h2>
          <p className="text-center text-slate-600 mt-2">
            Test risk‑free with our 2‑day trial, then scale with a paid plan
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-8">
            {whatsappPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-shadow ${plan.popular ? "border-orange-500 shadow-lg" : "border-slate-200 shadow"}`}
              >
                <div>
                  <h3 className="text-xl font-semibold text-blue-800 text-center">
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-extrabold text-blue-800">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-slate-500 text-sm">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <ul className="mt-6 space-y-2 text-sm text-slate-700">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-brand-blue" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 space-y-3">
                  {/* Primary button */}
                  <Link
                    href="/dashboard/whatsapp-request"
                    className="block w-full text-center py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
                  >
                    {plan.name === "Free Trial"
                      ? "Start Your Free Trial"
                      : `Get ${plan.name} Plan`}
                  </Link>
                  {/* Secondary button – only for first three cards */}
                  {plan.hasTrial && (
                    <Link
                      href="/dashboard/whatsapp-request"
                      className="block w-full text-center py-2 border border-orange-500 text-orange-500 bg-white hover:bg-orange-50 rounded-lg font-medium"
                    >
                      Try 2‑Day Free Trial First
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- */}
      {/* 3️⃣ Combo Plans Section */}
      {/* --------------------------------------------------- */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-blue-800 text-center">
            Save Big Growth More — WhatsApp + AI Calling Bundled
          </h2>
          <p className="text-center text-slate-600 mt-2">
            Combine messaging and voice in one plan at special bundle pricing
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            {comboPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-shadow ${plan.popular ? "border-blue-500 shadow-xl" : "border-slate-200 shadow"}`}
              >
                {plan.badge && (
                  <div
                    className={`absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${badgeClasses(plan.badge.color)}`}
                  >
                    {plan.badge.text}
                  </div>
                )}
                {plan.popular && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-blue-800 text-center">
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex justify-center items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-blue-800">
                      {plan.price}
                    </span>
                    <span className="text-slate-500 text-sm">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="mt-6 space-y-2 text-sm text-slate-700">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-brand-blue mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-slate-600 text-center">
                    Includes 2‑day WhatsApp free trial (AI Calling requires immediate payment)
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  <Link
                    href="/dashboard/combo-request"
                    className="block w-full text-center py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
                  >
                    {plan.name.replace(" Combo", "")} Combo
                  </Link>
                  <Link
                    href="/dashboard/whatsapp-request"
                    className="block w-full text-center py-2 border border-orange-500 text-orange-500 bg-white hover:bg-orange-50 rounded-lg font-medium"
                  >
                    Try WhatsApp Free First
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- */}
      {/* 4️⃣ AI Calling Agent Section */}
      {/* --------------------------------------------------- */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-blue-800 text-center">
            AI Calling Agent — 24/7 Voice Automation
          </h2>
          <p className="text-center text-slate-600 mt-2">
            No free trial available — paid plans only
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            {aiPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-shadow ${plan.popular ? "border-blue-500 shadow-xl" : "border-slate-200 shadow"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-blue-800 text-center">
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex justify-center items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-blue-800">
                      {plan.price}
                    </span>
                    <span className="text-slate-500 text-sm">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="mt-6 space-y-2 text-sm text-slate-700">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-brand-blue mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <Link
                    href="/dashboard/ai-calling-request"
                    className="block w-full text-center py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
                  >
                    Get {plan.name} Plan
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-slate-600 text-sm">
            Looking to try messaging first? Check out our WhatsApp API free trial above or combine with a Combo plan.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------- */}
      {/* 5️⃣ Website Development Section */}
      {/* --------------------------------------------------- */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-blue-800 text-center">
            Website Development
          </h2>
          <p className="text-center text-slate-600 mt-2">
            One‑time pricing, three flexible tiers
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            {webPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-shadow ${plan.popular ? "border-blue-500 shadow-xl" : "border-slate-200 shadow"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-blue-800 text-center">
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex justify-center items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-blue-800">
                      {plan.price}
                    </span>
                    <span className="text-slate-500 text-sm">
                      {plan.period}
                    </span>
                  </div>
                  <ul className="mt-6 space-y-2 text-sm text-slate-700">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-brand-blue mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <Link
                    href="/dashboard/website-request"
                    className="block w-full text-center py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
                  >
                    Request {plan.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- */}
      {/* 6️⃣ FAQ Section */}
      {/* --------------------------------------------------- */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-xs font-bold tracking-widest text-orange-500 uppercase">
              Frequently Asked Questions
            </h2>
            <h3 className="text-3xl font-bold text-blue-800">
              Everything you need to know about billing
            </h3>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm"
              >
                <h4 className="text-base sm:text-lg font-bold text-blue-800 flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  {faq.q}
                </h4>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed pl-8">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

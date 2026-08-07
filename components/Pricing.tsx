"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, HelpCircle, MessageSquare, PhoneCall, Globe } from "lucide-react";

type ServiceType = "whatsapp" | "ai-calling" | "web-dev";

export default function Pricing() {
  const [activeTab, setActiveTab] = useState<ServiceType>("whatsapp");

  const tabs = [
    { id: "whatsapp" as ServiceType, label: "WhatsApp API", icon: MessageSquare },
    { id: "ai-calling" as ServiceType, label: "AI Calling Agent", icon: PhoneCall },
    { id: "web-dev" as ServiceType, label: "Website Development", icon: Globe },
  ];

  const whatsappPricing = {
    note: "Overage: ₹0.20 per utility/service message, ₹1.20 per marketing message",
    ctaHref: "/dashboard/whatsapp-request",
    ctaTextPrefix: "Get Started with",
    tiers: [
      {
        name: "Starter",
        price: "₹1,000",
        period: "/month",
        popular: false,
        features: [
          "2,000 utility/service messages included",
          "200 marketing messages included",
          "Shared Inbox & Template Management",
          "Standard Email Support",
        ],
      },
      {
        name: "Growth",
        price: "₹3,000",
        period: "/month",
        popular: true,
        features: [
          "6,000 utility/service messages included",
          "600 marketing messages included",
          "Multi-agent Shared Inbox",
          "Automated Bot Workflows",
          "Priority Chat & Email Support",
        ],
      },
      {
        name: "Business",
        price: "₹5,000",
        period: "/month",
        popular: false,
        features: [
          "15,000 utility/service messages included",
          "1,500 marketing messages included",
          "Custom API Integration & Webhooks",
          "Dedicated Account Manager",
          "24/7 SLA Support",
        ],
      },
      {
        name: "Combo",
        price: "₹8,000",
        period: "/month",
        popular: false,
        features: [
          "All WhatsApp API features",
          "AI Calling Agent included",
          "Discounted bundle price",
          "Priority Support",
        ],
      },
      {
        name: "FREE TRIAL",
        price: "₹0",
        period: "",
        popular: false,
        features: [
          "2‑Day Free Trial – up to 50 messages",
          "No payment required",
          "Setup pending until activation",
        ],
      },
    ]
  };

  const aiCallingPricing = {
    note: "Fully managed setup — live within 2 days of payment and requirements submission",
    ctaHref: "/signup",
    ctaTextPrefix: "Get Started with",
    tiers: [
      {
        name: "Starter",
        price: "₹3,300",
        period: "/month",
        popular: false,
        features: [
          "150 minutes included (~50 calls)",
          "1 Custom AI Voice Prompt",
          "Lead Data Export (CSV)",
          "Standard Email Support",
        ],
      },
      {
        name: "Growth",
        price: "₹6,000",
        period: "/month",
        popular: true,
        features: [
          "300 minutes included (~100 calls)",
          "3 Custom AI Voice Prompts",
          "CRM Webhook Integration",
          "Call Recording & Transcripts",
          "Priority Technical Support",
        ],
      },
      {
        name: "Business",
        price: "₹10,800",
        period: "/month",
        popular: false,
        features: [
          "600 minutes included (~200 calls)",
          "Unlimited Voice Prompts & Logic",
          "Real-time CRM & Zapier Sync",
          "Custom Accent & Personality Tuning",
          "Dedicated AI Specialist Support",
        ],
      },
    ],
  };

  const webDevPricing = {
    note: "50% advance due upon request, 50% remaining after final review & handover.",
    ctaHref: "/dashboard/website-request",
    ctaTextPrefix: "Request",
    tiers: [
      {
        name: "Starter",
        price: "₹10,000",
        period: "one-time",
        popular: false,
        features: [
          "5-8 pages professional layout",
          "Mobile-responsive & fast loading",
          "Basic SEO setup & metadata",
          "Functional contact form",
          "3 revisions included",
        ],
      },
      {
        name: "Growth",
        price: "₹20,000",
        period: "one-time",
        popular: true,
        features: [
          "10-15 pages dynamic website",
          "Dynamic content & database integration",
          "Admin panel-lite for blog/products",
          "WhatsApp & email instant alerts",
          "3 revisions included",
        ],
      },
      {
        name: "Premium",
        price: "₹30,000",
        period: "one-time",
        popular: false,
        features: [
          "15-20 pages full web platform",
          "Full database + custom admin dashboard",
          "Custom business logic & workflows",
          "Razorpay payment gateway ready",
          "Priority support & 3 revisions",
          "Complete code & handover document",
        ],
      },
    ],
  };

  const currentPricing =
    activeTab === "whatsapp"
      ? whatsappPricing
      : activeTab === "ai-calling"
      ? aiCallingPricing
      : webDevPricing;

  return (
    <section id="pricing" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-brand-orange uppercase">
            Transparent Pricing
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-brand-darkblue">
            Choose the right plan for your business scale
          </p>
          <p className="text-slate-600 text-base">
            No hidden fees, simple tiers tailored for Indian growing enterprises and organizations.
          </p>
        </div>

        {/* Pricing Service Switcher Tabs */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-full overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-brand-blue text-white shadow-sm"
                      : "text-slate-600 hover:text-brand-darkblue hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {currentPricing.tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`relative bg-white rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                tier.popular
                  ? "border-2 border-brand-orange shadow-xl scale-105 z-10"
                  : "border border-slate-200 shadow-sm hover:shadow-md"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-xl font-bold text-brand-darkblue">
                    {tier.name}
                  </h3>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-brand-darkblue">
                    {tier.price}
                  </span>
                  <span className="text-slate-500 font-medium text-sm">
                    {tier.period}
                  </span>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  {tier.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-3 text-sm text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                {/* Combo description */}
                {tier.name === "Combo" && (
                  <p className="mt-4 text-sm text-slate-600">
                    Includes 2‑day WhatsApp API free trial (AI Calling not included in trial) before your subscription activates.
                  </p>
                )}
              </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col space-y-3">
                  {/* Primary CTA */}
                  <Link
                    href={tier.name === "Combo" ? "/dashboard/combo-request" : currentPricing.ctaHref}
                    className={`w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all text-center block ${
                      tier.popular
                        ? "bg-brand-orange hover:bg-orange-600 text-white shadow-md hover:shadow-lg"
                        : "bg-slate-100 hover:bg-brand-blue text-brand-darkblue hover:text-white"
                    }`}
                  >
                    {tier.name === "Combo" ? "Get Combo" : `${currentPricing.ctaTextPrefix} ${tier.name} Plan`}
                  </Link>
                  {/* Secondary CTA */}
                  <Link
                    href="/dashboard/whatsapp-request"
                    className="w-full py-3.5 px-6 rounded-full font-semibold text-sm transition-all text-center block border border-orange-500 text-orange-500 hover:bg-orange-50 bg-white"
                  >
                    {tier.name === "Combo" ? "Try WhatsApp Free Trial First" : "Try 2-Day Free Trial First"}
                  </Link>
                </div>
            </div>
          ))}
        </div>

        {/* Pricing Note */}
        <div className="mt-10 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50/80 border border-blue-100 text-brand-darkblue text-xs sm:text-sm font-medium">
            <HelpCircle className="w-4 h-4 text-brand-blue shrink-0" />
            <span>{currentPricing.note}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

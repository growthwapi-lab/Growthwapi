import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { MessageCircle, Phone, Layout, CheckCircle, ArrowRight, Zap, Shield, Sparkles } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      id: "whatsapp",
      title: "WhatsApp Business API",
      subtitle: "Enterprise bulk messaging & Meta official API integration",
      description:
        "GrowthWapi provides a complete managed setup for official WhatsApp Business API integration. Reach thousands of active customers directly on India's primary messaging platform with high delivery rates and instant engagement. We handle template registration, Meta compliance, and automated broadcast management so your team never has to worry about technical complexity.",
      icon: MessageCircle,
      badge: "High Engagement",
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-600",
      accentBorder: "border-emerald-200",
      features: [
        "Official Meta Green Tick verification support",
        "Utility, authentication, and marketing message templates",
        "Multi-agent shared inbox for customer support teams",
        "Automated campaign broadcasts with analytics",
        "Webhooks and custom API integrations for CRMs",
        "Zero risk of number blocking with official API infrastructure",
        "24/7 delivery status tracking and detailed reporting",
      ],
      steps: [
        { title: "1. Account Approval", desc: "Submit business details for official Meta API approval." },
        { title: "2. Template Setup", desc: "We design and submit notification & marketing templates." },
        { title: "3. Launch Broadcasts", desc: "Start sending automated updates and bulk messages." },
      ],
    },
    {
      id: "ai-calling",
      title: "AI Voice Calling Agent",
      subtitle: "Autonomous 24/7 voice agents with natural Indian accents",
      description:
        "Deploy intelligent AI voice agents that dial and receive customer phone calls 24/7. Our custom-trained voice agents understand contextual Indian languages, handle inbound inquiries, qualify leads, and schedule appointments autonomously. Your business saves hundreds of hours while delivering instant response times to every prospect.",
      icon: Phone,
      badge: "24/7 Voice AI",
      accentBg: "bg-orange-50",
      accentText: "text-brand-orange",
      accentBorder: "border-orange-200",
      features: [
        "Natural Indian accent support with low-latency speech",
        "Handles both outbound lead calling and inbound support",
        "Automated lead qualification and appointment booking",
        "Instant call recording and transcript extraction",
        "Direct webhook sync with your CRM or Google Sheets",
        "Custom objection handling and conversational workflows",
        "Scales seamlessly to hundreds of simultaneous calls",
      ],
      steps: [
        { title: "1. Submit Requirements", desc: "Provide call script goals and target lead lists." },
        { title: "2. Voice Configuration", desc: "We build, train, and test custom conversational AI prompts." },
        { title: "3. Live in 2 Days", desc: "Your AI agent begins making and receiving calls automatically." },
      ],
    },
    {
      id: "web-dev",
      title: "Website Design & Development",
      subtitle: "High-converting, database-driven web platforms",
      description:
        "Establish an authoritative digital presence with a bespoke website built for speed, conversion, and mobile performance. From clean business websites to full database-driven portals with admin dashboards, our engineering team builds turnkey solutions that convert visitors into paying clients.",
      icon: Layout,
      badge: "Turnkey Platform",
      accentBg: "bg-blue-50",
      accentText: "text-brand-blue",
      accentBorder: "border-blue-200",
      features: [
        "100% mobile-responsive, modern UX design",
        "Database integration & dynamic custom content",
        "Lightweight, easy-to-use custom admin panel",
        "Razorpay payment gateway & WhatsApp click-to-chat",
        "SEO optimization & lightning-fast page loading",
        "Full source code ownership with zero monthly lock-in",
        "Dedicated revision cycles and handover documentation",
      ],
      steps: [
        { title: "1. Design Consultation", desc: "We define page structure, branding, and content goals." },
        { title: "2. Development & Database", desc: "Engineers build your dynamic site and integrate admin features." },
        { title: "3. Launch & Handover", desc: "Domain setup, SSL deployment, and complete code handover." },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Banner */}
        <section className="bg-slate-900 text-white py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl">
            <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">
              Growth Infrastructure
            </span>
            <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Three powerful services. Completely managed for you.
            </h1>
            <p className="mt-4 text-slate-300 text-base sm:text-lg">
              Explore how our WhatsApp API, AI Calling Agents, and Custom Web Engineering fuel revenue and operational efficiency for modern enterprises.
            </p>
          </div>
        </section>

        {/* Detailed Alternating Service Sections */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
            {services.map((service, index) => {
              const Icon = service.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={service.id}
                  id={service.id}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${
                    !isEven ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Visual Column */}
                  <div
                    className={`lg:col-span-5 ${
                      !isEven ? "lg:order-2" : "lg:order-1"
                    }`}
                  >
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 border border-slate-200 shadow-lg relative overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div
                          className={`w-16 h-16 rounded-2xl ${service.accentBg} ${service.accentText} flex items-center justify-center`}
                        >
                          <Icon className="w-8 h-8" />
                        </div>
                        <span
                          className={`text-xs font-bold px-3 py-1.5 rounded-full ${service.accentBg} ${service.accentText} border ${service.accentBorder}`}
                        >
                          {service.badge}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-brand-darkblue mb-2">
                        {service.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mb-6">
                        {service.subtitle}
                      </p>

                      {/* Mini 3-Step Process inside Card */}
                      <div className="space-y-4 pt-4 border-t border-slate-200/80">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          How it works
                        </div>
                        {service.steps.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3"
                          >
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-brand-darkblue">
                                {step.title.split(". ")[1]}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {step.desc}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Content Column */}
                  <div
                    className={`lg:col-span-7 space-y-6 ${
                      !isEven ? "lg:order-1" : "lg:order-2"
                    }`}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{service.subtitle}</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-bold text-brand-darkblue leading-tight">
                      {service.title}
                    </h2>

                    <p className="text-slate-600 text-base leading-relaxed">
                      {service.description}
                    </p>

                    <div className="space-y-3 pt-2">
                      <h4 className="text-sm font-bold text-brand-darkblue uppercase tracking-wider">
                        Key Capabilities Included:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {service.features.map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700"
                          >
                            <CheckCircle className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-orange hover:bg-orange-600 text-white rounded-full font-semibold text-sm transition-all shadow-md hover:shadow-lg"
                      >
                        Get started with {service.title}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

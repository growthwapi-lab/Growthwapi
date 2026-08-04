import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, Users, Zap, HeartHandshake, Layers, TrendingUp, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const whyProps = [
    {
      title: "Managed, not DIY",
      desc: "We set up and run everything for you. No developer hire or complex integration overhead required.",
      icon: Layers,
    },
    {
      title: "Built for scale",
      desc: "From single-location businesses to multi-branch organizations handling thousands of customer interactions daily.",
      icon: TrendingUp,
    },
    {
      title: "Transparent pricing",
      desc: "No hidden fees, clear tier-based plans with zero contract lock-ins.",
      icon: ShieldCheck,
    },
    {
      title: "India-first",
      desc: "Built with Indian businesses, NGOs, and payment systems in mind, featuring local language support and Razorpay readiness.",
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow">
        {/* About Hero Section */}
        <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl space-y-6">
            <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">
              About GrowthWapi
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              India&apos;s managed growth platform for WhatsApp, AI voice, and web technology
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
              GrowthWapi builds and operates the communication and digital infrastructure modern businesses run on. We combine official WhatsApp Business API messaging, AI-powered voice agents, and full-stack web development into a single managed platform — so businesses spend less time managing vendors and more time growing.
            </p>
            <p className="text-slate-400 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
              Our team handles the technical complexity end-to-end: integration, configuration, testing, and ongoing support. Clients get enterprise-grade tools without needing an in-house tech team.
            </p>
          </div>
        </section>

        {/* Why GrowthWapi Grid */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <h2 className="text-xs font-bold tracking-widest text-brand-orange uppercase">
                Core Advantages
              </h2>
              <h3 className="text-3xl font-bold text-brand-darkblue">
                Why growth leaders choose GrowthWapi
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {whyProps.map((prop, idx) => {
                const Icon = prop.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-brand-darkblue mb-2">
                      {prop.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {prop.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trusted By / Social Proof Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-brand-orange text-xs font-semibold">
                    <Users className="w-4 h-4" />
                    <span>Trusted Across India</span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl font-bold text-white">
                    Powering scale for 500+ businesses and NGOs
                  </h3>

                  <blockquote className="text-base sm:text-lg italic text-slate-200 border-l-4 border-brand-orange pl-4">
                    &ldquo;GrowthWapi transformed our customer outreach with automated WhatsApp updates and an AI caller that handles inbound queries seamlessly.&rdquo;
                  </blockquote>
                </div>

                <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center w-full max-w-sm space-y-4">
                    <div className="text-4xl font-extrabold text-brand-orange">500+</div>
                    <div className="text-sm font-medium text-slate-200">Active Business Deployments</div>
                    <div className="pt-3 border-t border-white/10 text-xs text-slate-300">
                      High availability & 99.9% uptime SLA
                    </div>
                    <Link
                      href="/contact"
                      className="block w-full py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-semibold text-xs rounded-full transition-all"
                    >
                      Talk to our growth engineers
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

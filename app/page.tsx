import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import Link from "next/link";
import { MessageCircle, Phone, Layout, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export default function Home() {
  const servicePreviews = [
    {
      title: "WhatsApp API",
      icon: MessageCircle,
      desc: "Send utility, service, and marketing messages at scale with official Meta API setup.",
      href: "/services#whatsapp",
    },
    {
      title: "AI Calling Agent",
      icon: Phone,
      desc: "Your autonomous AI voice agent handling customer calls 24/7 with natural Indian accents.",
      href: "/services#ai-calling",
    },
    {
      title: "Website Development",
      icon: Layout,
      desc: "Professional dynamic websites and web applications with database & admin panel integrations.",
      href: "/services#web-dev",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow">
        {/* Main Hero Section */}
        <Hero />

        {/* Services Overview Teaser */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">
                Managed Infrastructure
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-darkblue">
                Three core growth tools for modern businesses
              </h2>
              <p className="text-slate-600 text-base">
                Everything set up, configured, and managed by our engineering team.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
              {servicePreviews.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <div
                    key={idx}
                    className="bg-slate-50 hover:bg-white rounded-3xl p-8 border border-slate-200 hover:border-blue-200 hover:shadow-xl transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 group-hover:bg-brand-blue text-brand-blue group-hover:text-white transition-colors flex items-center justify-center mb-6">
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-bold text-brand-darkblue mb-3">
                        {service.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {service.desc}
                      </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200/60">
                      <Link
                        href={service.href}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-darkblue group-hover:translate-x-1 transition-transform"
                      >
                        Learn more about {service.title}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-darkblue hover:bg-slate-800 text-white rounded-full font-semibold text-sm transition-all"
              >
                View all service details & features
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Preview Teaser */}
        <section className="py-20 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-3xl mx-auto space-y-3 mb-12">
              <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">
                Transparent Plans
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-darkblue">
                Predictable pricing with zero hidden fees
              </h2>
              <p className="text-slate-600 text-base">
                Whether starting out with WhatsApp API or scaling AI voice calls across India, choose a tier built for your volume.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <div className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-1">WhatsApp API</div>
                <div className="text-2xl font-extrabold text-brand-darkblue">From ₹1,000<span className="text-xs font-normal text-slate-500">/mo</span></div>
                <div className="text-xs text-slate-600 mt-2">2,000 utility + 200 marketing messages</div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100">
                <div className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-1">AI Calling Agent</div>
                <div className="text-2xl font-extrabold text-brand-darkblue">From ₹3,300<span className="text-xs font-normal text-slate-500">/mo</span></div>
                <div className="text-xs text-slate-600 mt-2">150 voice call minutes included</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Website Dev</div>
                <div className="text-2xl font-extrabold text-brand-darkblue">From ₹10,000<span className="text-xs font-normal text-slate-500"> one-time</span></div>
                <div className="text-xs text-slate-600 mt-2">Responsive 5-8 pages + SEO setup</div>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 bg-brand-orange hover:bg-orange-600 text-white rounded-full font-semibold text-sm transition-all shadow-md hover:shadow-lg"
              >
                View full pricing tables & FAQs
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Call to Action Teaser */}
        <section className="py-20 bg-brand-darkblue text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to automate your business communications?
            </h2>
            <p className="text-slate-300 text-base max-w-xl mx-auto">
              Our engineers will help you choose, configure, and launch the right tools for your business in 48 hours.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <Link
                href="/contact"
                className="px-8 py-3.5 bg-brand-orange hover:bg-orange-600 text-white font-semibold text-sm rounded-full transition-all shadow-md"
              >
                Get in touch
              </Link>
              <Link
                href="/about"
                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-full transition-all"
              >
                Learn more about GrowthWapi
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

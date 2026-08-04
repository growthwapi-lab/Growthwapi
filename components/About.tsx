import { ShieldCheck, Users, Zap, HeartHandshake } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-brand-orange text-xs font-semibold uppercase tracking-wider">
              About GrowthWapi
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-brand-darkblue leading-tight">
              Empowering small businesses and NGOs across India with managed tech
            </h2>

            <p className="text-slate-600 text-base leading-relaxed">
              At GrowthWapi, we believe enterprise-grade growth tools shouldn't require dedicated tech teams or complex developer setups. We build and manage modern communications and digital presence for businesses, startups, and social impact organizations.
            </p>

            <p className="text-slate-600 text-base leading-relaxed">
              Whether you need official WhatsApp bulk messaging, an autonomous AI voice caller to handle customer inquiries, or a custom database-driven website, our team handles setup, onboarding, and ongoing maintenance so you can focus on scale.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <ShieldCheck className="w-6 h-6 text-brand-blue mb-2" />
                <div className="font-bold text-brand-darkblue text-lg">100% Managed</div>
                <div className="text-xs text-slate-500">End-to-end setup & support</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Zap className="w-6 h-6 text-brand-orange mb-2" />
                <div className="font-bold text-brand-darkblue text-lg">Fast Delivery</div>
                <div className="text-xs text-slate-500">Live in as little as 2 days</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                    <HeartHandshake className="w-8 h-8 text-brand-orange" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Built for India</h3>
                    <p className="text-slate-300 text-xs">Tailored integrations & affordable pricing</p>
                  </div>
                </div>

                <blockquote className="text-lg italic text-slate-200 border-l-4 border-brand-orange pl-4">
                  &ldquo;GrowthWapi transformed our customer outreach with automated WhatsApp updates and an AI caller that handles inbound queries seamlessly.&rdquo;
                </blockquote>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-orange" />
                    <span>Serving 500+ Businesses & NGOs</span>
                  </div>
                  <span className="font-semibold text-brand-orange">Made in India 🇮🇳</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

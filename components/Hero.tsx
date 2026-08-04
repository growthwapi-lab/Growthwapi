import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageSquare, PhoneCall, Globe } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Text & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-brand-blue text-xs sm:text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></span>
              All-in-one growth suite for Indian businesses & NGOs
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-brand-darkblue tracking-tight leading-tight">
              One platform. Three growth tools for your business.
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              WhatsApp API, AI Calling Agents, and Website Development — everything you need to grow, managed for you.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-brand-orange hover:bg-orange-600 rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#pricing"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-brand-darkblue bg-white border border-slate-200 hover:border-brand-blue hover:text-brand-blue rounded-full transition-all text-center"
              >
                View pricing
              </Link>
            </div>

            {/* Micro value props */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 text-xs sm:text-sm">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0" />
                <span>Fully managed setup</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0" />
                <span>Live in 2 days</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0" />
                <span>Transparent pricing</span>
              </div>
            </div>
          </div>

          {/* Right Column: Abstract Clean Vector Graphic */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="w-full max-w-md aspect-square rounded-3xl bg-gradient-to-tr from-blue-50 via-slate-50 to-orange-50 border border-slate-100 p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
              {/* Background abstract decorative shapes */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-brand-blue/10 blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-brand-orange/10 blur-2xl pointer-events-none"></div>

              {/* Graphical feature cards mockup */}
              <div className="space-y-4 relative z-10 my-auto">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-brand-blue shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service 1</div>
                    <div className="text-sm font-bold text-brand-darkblue">WhatsApp Official API</div>
                    <div className="text-xs text-slate-500">Bulk utility & marketing messaging</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-md border border-brand-orange/30 flex items-center gap-4 transition-transform hover:-translate-y-1 transform translate-x-2">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-brand-orange shrink-0">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-brand-orange uppercase tracking-wider">Service 2</div>
                    <div className="text-sm font-bold text-brand-darkblue">AI Calling Voice Agent</div>
                    <div className="text-xs text-slate-500">24/7 autonomous call handling</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-brand-blue shrink-0">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service 3</div>
                    <div className="text-sm font-bold text-brand-darkblue">Website Design & Dev</div>
                    <div className="text-xs text-slate-500">Responsive & database driven</div>
                  </div>
                </div>
              </div>

              {/* Status pill at bottom */}
              <div className="relative z-10 text-center text-xs font-medium text-slate-500 bg-white/80 backdrop-blur rounded-full py-2 px-4 border border-slate-100">
                🚀 Powering growth for businesses across India
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

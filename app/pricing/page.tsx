import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing";
import { HelpCircle, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function PricingPage() {
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-slate-900 text-white py-16 sm:py-20 text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
            <span className="text-xs font-bold tracking-widest text-brand-orange uppercase">
              Simple & Transparent Pricing
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Pay only for what your business uses
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Transparent, tier-based plans with zero hidden fees. Built specifically for growing Indian enterprises, agencies, and social impact organizations.
            </p>
          </div>
        </section>

        {/* Full Pricing Tables Component */}
        <Pricing />

        {/* FAQ Section */}
        <section className="py-20 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-xs font-bold tracking-widest text-brand-orange uppercase">
                Frequently Asked Questions
              </h2>
              <h3 className="text-3xl font-bold text-brand-darkblue">
                Everything you need to know about billing
              </h3>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm"
                >
                  <h4 className="text-base sm:text-lg font-bold text-brand-darkblue flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                    <span>{faq.q}</span>
                  </h4>
                  <p className="mt-2 text-slate-600 text-sm leading-relaxed pl-8">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center p-8 rounded-3xl bg-blue-50 border border-blue-100">
              <ShieldCheck className="w-8 h-8 text-brand-blue mx-auto mb-3" />
              <h4 className="text-lg font-bold text-brand-darkblue">Have custom enterprise volume requirements?</h4>
              <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
                Need more than 50,000 WhatsApp messages or custom SLA agreements? Talk to our solution engineers.
              </p>
              <a
                href="/contact"
                className="mt-4 inline-block px-6 py-2.5 bg-brand-blue hover:bg-blue-700 text-white font-semibold text-sm rounded-full transition-all"
              >
                Contact Enterprise Team
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

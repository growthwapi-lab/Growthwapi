import { MessageCircle, Phone, Layout, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Services() {
  const services = [
    {
      id: "whatsapp",
      icon: MessageCircle,
      title: "WhatsApp API",
      description:
        "Send utility, service, and marketing messages at scale. Fully managed setup.",
      features: [
        "Official Meta API integration",
        "Utility & marketing message broadcast",
        "Automated customer notifications",
      ],
      badge: "High conversion",
    },
    {
      id: "ai-calling",
      icon: Phone,
      title: "AI Calling Agent",
      description:
        "Your own AI voice agent handling calls 24/7. Live in 2 days after setup.",
      features: [
        "Natural Indian accent support",
        "Autonomous outbound & inbound calls",
        "Lead qualification & appointment booking",
      ],
      badge: "24/7 Voice AI",
    },
    {
      id: "web-dev",
      icon: Layout,
      title: "Website Design & Development",
      description:
        "Professional websites built and delivered, from simple business sites to full database-driven platforms.",
      features: [
        "100% mobile-responsive design",
        "Database & admin dashboard integration",
        "Razorpay payment gateway ready",
      ],
      badge: "Turnkey delivery",
    },
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-brand-orange uppercase">
            Our Core Services
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-brand-darkblue">
            Everything your business needs to connect and scale
          </p>
          <p className="text-slate-600 text-base sm:text-lg">
            Streamlined services tailored specifically for small businesses, agencies, and NGOs across India.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="group relative bg-slate-50 hover:bg-white rounded-2xl p-8 transition-all duration-300 border border-slate-100 hover:border-blue-200 hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 group-hover:bg-brand-blue text-brand-blue group-hover:text-white transition-colors flex items-center justify-center">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 bg-white group-hover:bg-orange-50 border border-slate-200 group-hover:border-orange-200 text-slate-600 group-hover:text-brand-orange rounded-full transition-colors">
                      {service.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-brand-darkblue group-hover:text-brand-blue transition-colors">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                    {service.description}
                  </p>

                  <ul className="mt-6 space-y-2 text-xs text-slate-600">
                    {service.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200/60">
                  <Link
                    href="#pricing"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-darkblue group-hover:translate-x-1 transition-all"
                  >
                    View plans & pricing
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

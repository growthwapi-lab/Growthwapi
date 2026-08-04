import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import { MessageSquare, PhoneCall, Globe, ArrowUpRight, ShieldCheck } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const businessName = user.user_metadata?.business_name || "Your Business";

  const services = [
    {
      id: "whatsapp",
      title: "WhatsApp API",
      icon: MessageSquare,
      description: "Utility, service & bulk marketing messaging platform.",
    },
    {
      id: "ai-calling",
      title: "AI Calling Agent",
      icon: PhoneCall,
      description: "Autonomous voice AI handling inbound & outbound calls.",
    },
    {
      id: "web-dev",
      title: "Website Design & Dev",
      icon: Globe,
      description: "Custom mobile-responsive site with database integration.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="GrowthWapi Logo"
              width={160}
              height={44}
              className="h-[40px] w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 bg-blue-50 text-brand-blue rounded-full border border-blue-100">
              {businessName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-darkblue">
              Welcome, {fullName}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Account Overview & Active Subscriptions ({user.email})
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Account Status: Active</span>
          </div>
        </div>

        {/* Services Status Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-darkblue">
              Your Growth Services
            </h2>
            <Link
              href="/#pricing"
              className="text-xs font-semibold text-brand-orange hover:underline flex items-center gap-1"
            >
              Browse all plans
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-darkblue">
                      {service.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      {service.description}
                    </p>

                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs font-medium">
                      Not subscribed yet
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      href="/#pricing"
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-brand-blue border border-brand-blue hover:bg-brand-blue hover:text-white transition-all text-center block"
                    >
                      View Plans
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2026 GrowthWapi. All rights reserved.</p>
      </footer>
    </div>
  );
}

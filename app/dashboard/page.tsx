"use client"

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";
import WebsiteDevCard, { WebProjectData } from "@/components/WebsiteDevCard";
import WhatsAppCard, { WhatsAppData } from "@/components/WhatsAppCard";
import { MessageSquare, PhoneCall, ArrowUpRight, ShieldCheck, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // ---- UI state ----
  const [checkingRole, setCheckingRole] = useState(true);
  const [roleError, setRoleError] = useState("");

  // ---- Data state ----
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("User");
  const [businessName, setBusinessName] = useState("Your Business");
  const [initialProject, setInitialProject] = useState<WebProjectData | null>(null);
  const [initialAccount, setInitialAccount] = useState<WhatsAppData | null>(null);
  const [whatsappUsage, setWhatsappUsage] = useState<any>(null);
  const [aiAgentUsage, setAiAgentUsage] = useState<any>(null);

  // ------------------- Role guard -------------------
  useEffect(() => {
    async function verifyRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Resolve name & business for display
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";
      const business = user.user_metadata?.business_name || "Your Business";
      setFullName(name);
      setBusinessName(business);

      // Role lookup – using profiles.id only
      const { data: roleData, error: roleError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (roleError) {
        console.error("Error fetching role:", roleError);
      }
      const role = roleData?.role || null;
      console.log("[Dashboard] Resolved role:", role);

      if (!role) {
        setRoleError("Could not fetch role – check console for details.");
        setCheckingRole(false);
        return;
      }

      if (role === "admin") {
        console.log("[Dashboard] User role: admin – redirecting");
        router.push("/dashboard/admin");
        return;
      }

      console.log("[Dashboard] User role: client – showing dashboard");
      setCheckingRole(false);
    }
    verifyRole();
  }, [router, supabase]);

  // ------------------- Data fetching (after role passes) -------------------
  useEffect(() => {
    if (checkingRole || !user) return;
    const fetchData = async () => {
      // Fetch WhatsApp Account directly (RLS ensures user sees only their own rows)
      const { data: waData, error: waErr } = await supabase
        .from('whatsapp_accounts')
        .select('*, utility_msgs_used, utility_msgs_included, marketing_msgs_used, marketing_msgs_included')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (waData && !waErr) {
        setInitialAccount({
          id: waData.id,
          plan: waData.plan,
          stage: waData.stage,
          final_payment_status: waData.final_payment_status,
          business_name: waData.business_display_name,
          status: waData.status,
        } as WhatsAppData);
        setWhatsappUsage({
          utility_msgs_used: waData.utility_msgs_used,
          utility_msgs_included: waData.utility_msgs_included,
          marketing_msgs_used: waData.marketing_msgs_used,
          marketing_msgs_included: waData.marketing_msgs_included,
        });
      } else if (waErr) {
        console.error('Error fetching whatsapp_accounts:', waErr);
      }

      // Fetch Web Project directly
      const { data: wpData, error: wpErr } = await supabase
        .from('web_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (wpData && !wpErr) {
        setInitialProject({
          id: wpData.id,
          plan: wpData.plan,
          stage: wpData.stage || 'requirement',
          final_payment_status: wpData.final_payment_status || 'pending',
          business_name: wpData.brief?.business_name || businessName,
        } as WebProjectData);
      } else if (wpErr) {
        console.error('Error fetching web_projects:', wpErr);
      }

      // Fetch AI Calling Agent directly
      const { data: aiData, error: aiErr } = await supabase
        .from('ai_agents')
        .select('*, minutes_used, minutes_included')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (aiData && !aiErr) {
        setAiAgentUsage({
          minutes_used: aiData.minutes_used,
          minutes_included: aiData.minutes_included,
        });
      } else if (aiErr) {
        console.error('Error fetching ai_agents:', aiErr);
      }
    };
    fetchData();
  }, [checkingRole, user, businessName, supabase]);

  // ------------------- Loading / Error UI -------------------
  if (checkingRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {roleError}
        </div>
        <Link href="/login" className="text-blue-600 underline">
          Sign in again
        </Link>
      </div>
    );
  }

  // ------------------- Main dashboard UI (client view) -------------------
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="GrowthWapi Logo"
              width={144}
              height={48}
              className="h-[40px] w-[120px] object-contain"
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

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-darkblue">
              Welcome, {fullName}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Account Overview &amp; Active Subscriptions ({user?.email})
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Account Status: Active</span>
          </div>
        </div>

        {/* Services Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-darkblue">Your Growth Services</h2>
            <Link
              href="/pricing"
              className="text-xs font-semibold text-brand-orange hover:underline flex items-center gap-1"
            >
              Browse all plans
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Website Dev Card */}
            <WebsiteDevCard initialProject={initialProject} userId={user?.id} />
            {/* WhatsApp API Card */}
            <WhatsAppCard initialAccount={initialAccount} userId={user?.id} usage={whatsappUsage} />
            {/* AI Calling Agent Usage */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mb-4">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brand-darkblue">AI Calling Agent</h3>
                {aiAgentUsage ? (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-slate-700 mb-1">Minutes Used: {aiAgentUsage.minutes_used} / {aiAgentUsage.minutes_included}</div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`$${aiAgentUsage.minutes_included && (aiAgentUsage.minutes_used / aiAgentUsage.minutes_included) * 100 > 80 ? "bg-orange-500" : "bg-brand-blue"} h-2 rounded-full`}
                        style={{ width: `${aiAgentUsage.minutes_included ? Math.round((aiAgentUsage.minutes_used / aiAgentUsage.minutes_included) * 100) : 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 text-right">
                      {aiAgentUsage.minutes_included ? Math.round((aiAgentUsage.minutes_used / aiAgentUsage.minutes_included) * 100) : 0}% of monthly quota
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-1 mb-4">Tracking will start after activation</p>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  href="/pricing"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-brand-blue border border-brand-blue hover:bg-brand-blue hover:text-white transition-all text-center block"
                >
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2026 GrowthWapi. All rights reserved.</p>
      </footer>
    </div>
  );
}

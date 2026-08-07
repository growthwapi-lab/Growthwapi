"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Users,
  CreditCard,
  ClipboardList,
  TrendingUp,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  LogOut,
  Eye,
  RefreshCw,
} from "lucide-react";

/* ================================================================== */
/* TypeScript interfaces                                               */
/* ================================================================== */

interface Profile {
  id: string;
  full_name: string | null;

  phone: string | null;
  business_name: string | null;
  role: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  service: string;
  plan: string;
  amount: number;
  status: string;
  is_combo: boolean | null;
  combo_tier: string | null;
  created_at: string;
  // joined
  profile_name?: string;
  profile_email?: string;
}

interface WebProject {
  id: string;
  user_id: string;
  plan: string | null;
  stage: string;
  brief: Record<string, unknown> | null;
  deadline: string | null;
  created_at: string;
  // joined
  profile_name?: string;
}

interface WhatsAppAccount {
  id: string;
  user_id: string;
  business_display_name: string | null;
  stage: string;
  trial_status: string | null;
  trial_messages_used: number | null;
  utility_msgs_included: number | null;
  created_at: string;
  // joined
  profile_name?: string;
}

interface AiAgent {
  id: string;
  user_id: string;
  agent_name: string | null;
  status: string;
  minutes_included: number | null;
  created_at: string;
  // joined
  profile_name?: string;
}

type TabKey = "overview" | "clients" | "subscriptions" | "requests";
type RequestSubTab = "web" | "whatsapp" | "ai";
type SortDir = "asc" | "desc";

/* ================================================================== */
/* Helper: format date                                                 */
/* ================================================================== */
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ================================================================== */
/* Component                                                           */
/* ================================================================== */
export default function AdminDashboardPage() {
  const router = useRouter();

  /* ---- auth & role ---- */
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  /* ---- data stores ---- */
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [webProjects, setWebProjects] = useState<WebProject[]>([]);
  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsAppAccount[]>([]);
  const [aiAgents, setAiAgents] = useState<AiAgent[]>([]);

  /* ---- UI state ---- */
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [requestSubTab, setRequestSubTab] = useState<RequestSubTab>("web");
  const [searchTerm, setSearchTerm] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [authError, setAuthError] = useState("");

  /* ---- sorting ---- */
  const [sortCol, setSortCol] = useState<string>("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  /* ---- modals ---- */
  const [detailModal, setDetailModal] = useState<Record<string, unknown> | null>(null);
  const [stageModal, setStageModal] = useState<{
    table: string;
    id: string;
    current: string;
    options: string[];
  } | null>(null);
  const [stageUpdating, setStageUpdating] = useState(false);
  const [newStage, setNewStage] = useState("");

  /* ================================================================ */
  /* Auth check                                                        */
  /* ================================================================ */
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("[Admin] Auth user:", user?.id, user?.email);

      if (!user) {
        router.push("/login");
        return;
      }

      // Role lookup – using profiles.id only
      const { data: roleData, error: roleError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      console.log("[Admin] profiles.id lookup:", { data: roleData, error: roleError });
      if (roleError) {
        console.error("Error fetching role:", roleError);
      }
      const role = roleData?.role || null;

      console.log("[Admin] Resolved role:", role);

      if (!role) {
        setAuthError(
          "Could not fetch your profile role. Check browser console for details."
        );
        setAuthChecking(false);
        return;
      }

      if (role !== "admin") {
        console.log("[Admin] Role is '" + role + "', not admin. Redirecting.");
        router.push("/dashboard");
        return;
      }

      // Role is admin — allow access
      console.log("[Admin] Access granted for admin user:", user.email);
      setUserId(user.id);
      setAuthChecking(false);
    }
    checkAuth();
  }, [router]);

  /* ================================================================ */
  /* Data fetching                                                     */
  /* ================================================================ */
  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setDataLoading(true);
    setErrorMsg("");
    const supabase = createClient();

    try {
      // Profiles
      const { data: pData, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, phone, business_name, role, created_at")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;
      setProfiles((pData as Profile[]) || []);

      // Subscriptions
      const { data: sData, error: sErr } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (sErr) throw sErr;
      setSubscriptions((sData as Subscription[]) || []);

      // Web Projects
      const { data: wData, error: wErr } = await supabase
        .from("web_projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (wErr) throw wErr;
      setWebProjects((wData as WebProject[]) || []);

      // WhatsApp Accounts
      const { data: waData, error: waErr } = await supabase
        .from("whatsapp_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (waErr) throw waErr;
      setWhatsappAccounts((waData as WhatsAppAccount[]) || []);

      // AI Agents
      const { data: aiData, error: aiErr } = await supabase
        .from("ai_agents")
        .select("*")
        .order("created_at", { ascending: false });
      if (aiErr) throw aiErr;
      setAiAgents((aiData as AiAgent[]) || []);
    } catch (err: any) {
      console.error("Admin fetch error:", err);
      setErrorMsg("Failed to load data: " + (err.message || "Unknown error"));
    } finally {
      setDataLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authChecking && userId) fetchAll();
  }, [authChecking, userId, fetchAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (authChecking || !userId) return;
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [authChecking, userId, fetchAll]);

  // Refresh on tab focus
  useEffect(() => {
    const onFocus = () => {
      if (!authChecking && userId) fetchAll();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [authChecking, userId, fetchAll]);

  /* ================================================================ */
  /* Helpers                                                           */
  /* ================================================================ */

  const profileName = (uid: string) => {
    const p = profiles.find((pr) => pr.id === uid);
    return p?.full_name || uid.slice(0, 8);
  };

  const profileEmail = (uid: string) => {
    return "—";
  };

  const clientServices = (uid: string) => {
    const subs = subscriptions.filter((s) => s.user_id === uid);
    const services = new Set(subs.map((s) => s.service));
    const labels: string[] = [];
    if (services.has("whatsapp_api")) labels.push("WhatsApp");
    if (services.has("ai_calling")) labels.push("AI Calling");
    if (services.has("website_dev")) labels.push("Website");
    if (services.has("combo")) labels.push("Combo");
    return labels.length > 0 ? labels.join(", ") : "None";
  };

  const clientStatus = (uid: string) => {
    const subs = subscriptions.filter((s) => s.user_id === uid);
    if (subs.some((s) => s.status === "active")) return "Active";
    const wa = whatsappAccounts.find(
      (w) => w.user_id === uid && w.trial_status === "active"
    );
    if (wa) return "Trial";
    return "Inactive";
  };

  /* ---- sorting helper ---- */
  function toggleSort(col: string) {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function sortIcon(col: string) {
    if (sortCol !== col) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5" />
    );
  }

  function sortedArr<T>(arr: T[], getter: (item: T) => string | number): T[] {
    if (!sortCol) return arr;
    return [...arr].sort((a, b) => {
      const aVal = getter(a);
      const bVal = getter(b);
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDir === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }

  /* ---- Overview stats ---- */
  const totalClients = profiles.filter((p) => p.role !== "admin").length;
  const activeSubs = subscriptions.filter((s) => s.status === "active").length;
  const pendingRequests =
    webProjects.filter((w) => w.stage !== "live").length +
    whatsappAccounts.filter((w) => w.stage !== "live").length +
    aiAgents.filter((a) => a.status !== "live").length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const revenueThisMonth = subscriptions
    .filter(
      (s) =>
        s.status === "active" && new Date(s.created_at) >= monthStart
    )
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  /* ---- Stage update ---- */
  const handleStageUpdate = async () => {
    if (!stageModal || !newStage) return;
    setStageUpdating(true);
    try {
      const supabase = createClient();
      const colName =
        stageModal.table === "ai_agents" ? "status" : "stage";
      const { error } = await supabase
        .from(stageModal.table)
        .update({ [colName]: newStage })
        .eq("id", stageModal.id);
      if (error) throw error;
      setStageModal(null);
      setNewStage("");
      await fetchAll();
    } catch (err: any) {
      alert("Update failed: " + (err.message || "Unknown error"));
    } finally {
      setStageUpdating(false);
    }
  };

  /* ---- Subscription status update ---- */
  const handleSubStatusUpdate = async (subId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: newStatus })
        .eq("id", subId);
      if (error) throw error;
      await fetchAll();
    } catch (err: any) {
      alert("Status update failed: " + (err.message || "Unknown error"));
    }
  };

  /* ---- Logout ---- */
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  /* ================================================================ */
  /* Loading state                                                     */
  /* ================================================================ */
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
        {authError && (
          <div className="max-w-md text-center space-y-3">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {authError}
            </div>
            <p className="text-xs text-slate-500">
              Open browser DevTools (F12) → Console tab to see detailed logs.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    );
  }

  /* ================================================================ */
  /* Filtered data for tables                                          */
  /* ================================================================ */
  const q = searchTerm.toLowerCase();

  const filteredProfiles = profiles
    .filter((p) => p.role !== "admin")
    .filter(
      (p) =>
        !q ||
        (p.full_name || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.business_name || "").toLowerCase().includes(q)
    );

  const filteredSubs = subscriptions.filter(
    (s) =>
      !q ||
      profileName(s.user_id).toLowerCase().includes(q) ||
      s.service.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
  );

  /* ================================================================ */
  /* RENDER                                                            */
  /* ================================================================ */

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "clients", label: "Clients" },
    { key: "subscriptions", label: "Subscriptions" },
    { key: "requests", label: "Requests" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* ------------------------------------------------------------ */}
      {/* Top nav                                                       */}
      {/* ------------------------------------------------------------ */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="GrowthWapi Logo"
                width={120}
                height={40}
                className="h-[32px] w-[100px] object-contain"
                priority
              />
            </Link>
            <span className="hidden sm:inline text-xs font-bold text-white bg-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAll}
              className="p-2 text-slate-500 hover:text-blue-700 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={"w-4 h-4" + (dataLoading ? " animate-spin" : "")} />
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchTerm("");
                  setSortCol("");
                }}
                className={
                  "px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors " +
                  (activeTab === tab.key
                    ? "border-blue-700 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300")
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ------------------------------------------------------------ */}
      {/* Main content                                                  */}
      {/* ------------------------------------------------------------ */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMsg}
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: Overview                                               */}
        {/* ========================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-blue-800">
              Admin Dashboard
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Clients
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-blue-800">
                  {dataLoading ? "…" : totalClients}
                </div>
              </div>
              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Active Subscriptions
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-blue-800">
                  {dataLoading ? "…" : activeSubs}
                </div>
              </div>
              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Pending Requests
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-blue-800">
                  {dataLoading ? "…" : pendingRequests}
                </div>
              </div>
              {/* Card 4 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Revenue This Month
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-blue-800">
                  {dataLoading
                    ? "…"
                    : "₹" + revenueThisMonth.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: Clients                                                */}
        {/* ========================================================== */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-blue-800">Clients</h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, email, business…"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th
                      className="px-4 py-3 font-semibold text-slate-600 cursor-pointer select-none"
                      onClick={() => toggleSort("name")}
                    >
                      Client Name {sortIcon("name")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">
                      Phone
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">
                      Business
                    </th>
                    <th
                      className="px-4 py-3 font-semibold text-slate-600 cursor-pointer select-none hidden md:table-cell"
                      onClick={() => toggleSort("created")}
                    >
                      Created {sortIcon("created")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">
                      Services
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        {dataLoading ? "Loading…" : "No clients found."}
                      </td>
                    </tr>
                  ) : (
                    sortedArr(filteredProfiles, (p) =>
                      sortCol === "name"
                        ? p.full_name || ""
                        : sortCol === "created"
                        ? p.created_at
                        : ""
                    ).map((p, idx) => {
                      const status = clientStatus(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          }
                        >
                          <td className="px-4 py-3 font-medium text-blue-800">
                            {p.full_name || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                            {p.phone || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                            {p.business_name || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                            {fmtDate(p.created_at)}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs text-slate-600">
                              {clientServices(p.id)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                "text-xs font-semibold px-2 py-0.5 rounded-full " +
                                (status === "Active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : status === "Trial"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-500")
                              }
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                const clientSubs = subscriptions.filter(
                                  (s) => s.user_id === p.id
                                );
                                const clientWa = whatsappAccounts.filter(
                                  (w) => w.user_id === p.id
                                );
                                const clientAi = aiAgents.filter(
                                  (a) => a.user_id === p.id
                                );
                                const clientWeb = webProjects.filter(
                                  (w) => w.user_id === p.id
                                );
                                setDetailModal({
                                  title: p.full_name || "Client",
                                  profile: p,
                                  subscriptions: clientSubs,
                                  whatsapp: clientWa,
                                  aiAgents: clientAi,
                                  webProjects: clientWeb,
                                });
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: Subscriptions                                          */}
        {/* ========================================================== */}
        {activeTab === "subscriptions" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-blue-800">
                Subscriptions
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search client, service, status…"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th
                      className="px-4 py-3 font-semibold text-slate-600 cursor-pointer select-none"
                      onClick={() => toggleSort("client")}
                    >
                      Client {sortIcon("client")}
                    </th>
                    <th
                      className="px-4 py-3 font-semibold text-slate-600 cursor-pointer select-none"
                      onClick={() => toggleSort("service")}
                    >
                      Service {sortIcon("service")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Plan
                    </th>
                    <th
                      className="px-4 py-3 font-semibold text-slate-600 cursor-pointer select-none"
                      onClick={() => toggleSort("amount")}
                    >
                      Amount {sortIcon("amount")}
                    </th>
                    <th
                      className="px-4 py-3 font-semibold text-slate-600 cursor-pointer select-none"
                      onClick={() => toggleSort("status")}
                    >
                      Status {sortIcon("status")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">
                      Created
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        {dataLoading ? "Loading…" : "No subscriptions found."}
                      </td>
                    </tr>
                  ) : (
                    sortedArr(filteredSubs, (s) =>
                      sortCol === "client"
                        ? profileName(s.user_id)
                        : sortCol === "service"
                        ? s.service
                        : sortCol === "amount"
                        ? s.amount
                        : sortCol === "status"
                        ? s.status
                        : ""
                    ).map((s, idx) => {
                      const statusColor =
                        s.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : s.status === "pending_payment"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500";
                      return (
                        <tr
                          key={s.id}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          }
                        >
                          <td className="px-4 py-3 font-medium text-blue-800">
                            {profileName(s.user_id)}
                          </td>
                          <td className="px-4 py-3 text-slate-600 capitalize">
                            {s.service.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-3 text-slate-600 capitalize">
                            {s.plan.replace(/-/g, " ")}
                          </td>
                          <td className="px-4 py-3 font-semibold text-blue-800">
                            ₹{(s.amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                "text-xs font-semibold px-2 py-0.5 rounded-full " +
                                statusColor
                              }
                            >
                              {s.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                            {fmtDate(s.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setDetailModal({ ...s, title: "Subscription" })}
                                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                              >
                                View
                              </button>
                              <select
                                value={s.status}
                                onChange={(e) =>
                                  handleSubStatusUpdate(s.id, e.target.value)
                                }
                                className="text-xs border border-slate-300 rounded px-1 py-0.5"
                              >
                                <option value="pending_payment">
                                  Pending Payment
                                </option>
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB: Requests                                               */}
        {/* ========================================================== */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-blue-800">Requests</h2>

            {/* Sub-tab pills */}
            <div className="flex gap-2">
              {(
                [
                  { key: "web", label: "Website Dev" },
                  { key: "whatsapp", label: "WhatsApp API" },
                  { key: "ai", label: "AI Calling" },
                ] as { key: RequestSubTab; label: string }[]
              ).map((st) => (
                <button
                  key={st.key}
                  onClick={() => {
                    setRequestSubTab(st.key);
                    setSortCol("");
                  }}
                  className={
                    "px-4 py-2 rounded-full text-xs font-semibold transition-colors " +
                    (requestSubTab === st.key
                      ? "bg-blue-700 text-white"
                      : "bg-white text-slate-600 border border-slate-300 hover:border-blue-300")
                  }
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* ---- Web Projects ---- */}
            {requestSubTab === "web" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Client
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Plan
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Stage
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">
                        Deadline
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">
                        Created
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {webProjects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-400"
                        >
                          No website projects.
                        </td>
                      </tr>
                    ) : (
                      webProjects.map((w, idx) => (
                        <tr
                          key={w.id}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          }
                        >
                          <td className="px-4 py-3 font-medium text-blue-800">
                            {profileName(w.user_id)}
                          </td>
                          <td className="px-4 py-3 text-slate-600 capitalize">
                            {w.plan || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                              {w.stage}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                            {fmtDate(w.deadline)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                            {fmtDate(w.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setDetailModal({ ...w, title: "Web Project" })
                                }
                                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setStageModal({
                                    table: "web_projects",
                                    id: w.id,
                                    current: w.stage,
                                    options: [
                                      "requirement",
                                      "design",
                                      "development",
                                      "review",
                                      "live",
                                    ],
                                  });
                                  setNewStage(w.stage);
                                }}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Update Stage
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ---- WhatsApp Accounts ---- */}
            {requestSubTab === "whatsapp" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Client
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Business Name
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Trial Status
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">
                        Msgs Used
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Stage
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {whatsappAccounts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-400"
                        >
                          No WhatsApp accounts.
                        </td>
                      </tr>
                    ) : (
                      whatsappAccounts.map((w, idx) => (
                        <tr
                          key={w.id}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          }
                        >
                          <td className="px-4 py-3 font-medium text-blue-800">
                            {profileName(w.user_id)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {w.business_display_name || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                "text-xs font-semibold px-2 py-0.5 rounded-full " +
                                (w.trial_status === "active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : w.trial_status === "expired"
                                  ? "bg-red-100 text-red-600"
                                  : w.trial_status === "converted"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-500")
                              }
                            >
                              {w.trial_status || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                            {w.trial_messages_used ?? 0} /{" "}
                            {w.utility_msgs_included ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                              {w.stage}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setDetailModal({
                                    ...w,
                                    title: "WhatsApp Account",
                                  })
                                }
                                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setStageModal({
                                    table: "whatsapp_accounts",
                                    id: w.id,
                                    current: w.stage,
                                    options: [
                                      "requirement",
                                      "meta_verification",
                                      "api_setup",
                                      "testing",
                                      "live",
                                    ],
                                  });
                                  setNewStage(w.stage);
                                }}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Update Stage
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ---- AI Agents ---- */}
            {requestSubTab === "ai" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Client
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Agent Name
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">
                        Minutes
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">
                        Created
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiAgents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-400"
                        >
                          No AI agents.
                        </td>
                      </tr>
                    ) : (
                      aiAgents.map((a, idx) => (
                        <tr
                          key={a.id}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          }
                        >
                          <td className="px-4 py-3 font-medium text-blue-800">
                            {profileName(a.user_id)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {a.agent_name || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                "text-xs font-semibold px-2 py-0.5 rounded-full capitalize " +
                                (a.status === "live"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : a.status === "in_progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : a.status === "paused"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-amber-100 text-amber-700")
                              }
                            >
                              {a.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                            {a.minutes_included ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                            {fmtDate(a.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setDetailModal({
                                    ...a,
                                    title: "AI Agent",
                                  })
                                }
                                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setStageModal({
                                    table: "ai_agents",
                                    id: a.id,
                                    current: a.status,
                                    options: [
                                      "requirements_pending",
                                      "in_progress",
                                      "live",
                                      "paused",
                                    ],
                                  });
                                  setNewStage(a.status);
                                }}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Update Status
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* Detail Modal                                                  */}
      {/* ============================================================ */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-blue-800">
                {(detailModal.title as string) || "Details"}
              </h3>
              <button
                onClick={() => setDetailModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm space-y-1">
              {Object.entries(detailModal)
                .filter(([k]) => k !== "title")
                .map(([key, val]) => (
                  <div
                    key={key}
                    className="flex justify-between py-1.5 border-b border-slate-100"
                  >
                    <span className="text-slate-500 capitalize font-medium">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-slate-800 text-right max-w-[60%] break-words">
                      {typeof val === "object" && val !== null
                        ? JSON.stringify(val, null, 2).slice(0, 200)
                        : String(val ?? "—")}
                    </span>
                  </div>
                ))}
            </div>
            <button
              onClick={() => setDetailModal(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Stage/Status Update Modal                                     */}
      {/* ============================================================ */}
      {stageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-blue-800">
                Update {stageModal.table === "ai_agents" ? "Status" : "Stage"}
              </h3>
              <button
                onClick={() => {
                  setStageModal(null);
                  setNewStage("");
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Current: {stageModal.current.replace(/_/g, " ")}
              </label>
              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              >
                {stageModal.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStageModal(null);
                  setNewStage("");
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStageUpdate}
                disabled={stageUpdating}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {stageUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

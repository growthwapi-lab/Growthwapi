"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Check,
  Loader2,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Combo tier definitions                                              */
/* ------------------------------------------------------------------ */
interface ComboPlan {
  id: string;
  name: string;
  price: number;
  waUtility: number;
  waMarketing: number;
  aiMinutes: number;
  aiCalls: number;
  popular: boolean;
  savings: string;
  features: string[];
}

const comboPlans: ComboPlan[] = [
  {
    id: "starter-combo",
    name: "Starter Combo",
    price: 3800,
    waUtility: 2000,
    waMarketing: 200,
    aiMinutes: 150,
    aiCalls: 50,
    popular: false,
    savings: "Save ₹500/month",
    features: [
      "WhatsApp: 2,000 utility + 200 marketing msgs",
      "AI Calling: 150 minutes (~50 calls)",
      "Standard support",
    ],
  },
  {
    id: "growth-combo",
    name: "Growth Combo",
    price: 8000,
    waUtility: 6000,
    waMarketing: 600,
    aiMinutes: 300,
    aiCalls: 100,
    popular: true,
    savings: "Save ₹1,000/month",
    features: [
      "WhatsApp: 6,000 utility + 600 marketing msgs",
      "AI Calling: 300 minutes (~100 calls)",
      "Priority technical support",
    ],
  },
  {
    id: "business-combo",
    name: "Business Combo",
    price: 14000,
    waUtility: 15000,
    waMarketing: 1500,
    aiMinutes: 600,
    aiCalls: 200,
    popular: false,
    savings: "Save ₹1,800/month",
    features: [
      "WhatsApp: 15,000 utility + 1,500 marketing msgs",
      "AI Calling: 600 minutes (~200 calls)",
      "Dedicated specialist support",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Page component                                                      */
/* ------------------------------------------------------------------ */
export default function ComboRequestPage() {
  const router = useRouter();

  // Auth
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Plan selection
  const [selectedPlanId, setSelectedPlanId] = useState<string>("growth-combo");

  // Step tracking: "select" → "step1" → "step2" → "payment"
  const [currentStep, setCurrentStep] = useState<
    "select" | "step1" | "step2" | "payment"
  >("select");

  // Step 1 – WhatsApp trial fields
  const [businessName, setBusinessName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [messageTypes, setMessageTypes] = useState<string[]>([]);
  const [hasMeta, setHasMeta] = useState<string>("no");
  const [metaId, setMetaId] = useState("");
  const [additionalReq, setAdditionalReq] = useState("");

  // Step 2 – AI Calling fields
  const [agentName, setAgentName] = useState("");
  const [businessDetails, setBusinessDetails] = useState("");
  const [tone, setTone] = useState<string>("formal");
  const [faqs, setFaqs] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [step1Success, setStep1Success] = useState(false);

  // Payment simulation
  const [createdSubId, setCreatedSubId] = useState<string | null>(null);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  const selectedPlan =
    comboPlans.find((p) => p.id === selectedPlanId) || comboPlans[1];

  /* ---- auth check ---- */
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      setBusinessName(user.user_metadata?.business_name || "");
      setAuthChecking(false);
    }
    checkAuth();
  }, [router]);

  const toggleMessageType = (type: string) => {
    setMessageTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  /* ---- Step 1 submit: WhatsApp trial ---- */
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createClient();

      const requirements = {
        business_category: businessCategory,
        message_types: messageTypes,
        meta_business_id: hasMeta === "yes" ? metaId : null,
        additional_requirements: additionalReq,
        combo_plan: selectedPlan.id,
      };

      const waPayload: Record<string, unknown> = {
        user_id: userId,
        business_display_name: businessName,
        stage: "requirement",
        requirements: requirements,
        status: "setup_pending",
        trial_status: "active",
        trial_started_at: new Date().toISOString(),
        trial_messages_used: 0,
        utility_msgs_included: 50,
        marketing_msgs_included: 0,
      };

      const { error: waError } = await supabase
        .from("whatsapp_accounts")
        .insert(waPayload);

      if (waError) {
        console.error("WhatsApp insert error:", waError);
        throw new Error(waError.message);
      }

      setStep1Success(true);
      setLoading(false);
      setCurrentStep("step2");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start WhatsApp trial.");
      setLoading(false);
    }
  };

  /* ---- Step 2 submit: AI Calling + subscription ---- */
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createClient();

      // Insert AI agent
      const agentPayload = {
        user_id: userId,
        agent_name: agentName,
        business_details: {
          details: businessDetails,
          tone_preference: tone,
          faqs: faqs,
        },
        status: "requirements_pending",
        minutes_included: selectedPlan.aiMinutes,
      };

      const { error: agentError } = await supabase
        .from("ai_agents")
        .insert(agentPayload);

      if (agentError) {
        console.error("AI Agent insert error:", agentError);
        throw new Error(agentError.message);
      }

      // Insert combo subscription
      const subscriptionPayload = {
        user_id: userId,
        service: "combo",
        plan: selectedPlan.id,
        status: "pending_payment",
        amount: selectedPlan.price,
        is_combo: true,
        combo_tier: selectedPlan.id,
      };

      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .insert(subscriptionPayload)
        .select()
        .single();

      if (subError) {
        console.error("Subscription insert error:", subError);
        throw new Error(subError.message);
      }

      setCreatedSubId(subData?.id || "temp-sub-id");
      setLoading(false);
      setCurrentStep("payment");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit AI Calling setup.");
      setLoading(false);
    }
  };

  /* ---- Simulate payment ---- */
  const handleSimulatePaymentReceived = async () => {
    setSimulatingPayment(true);
    try {
      const supabase = createClient();
      if (createdSubId && createdSubId !== "temp-sub-id") {
        await supabase
          .from("subscriptions")
          .update({ status: "active" })
          .eq("id", createdSubId);
      }
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 500);
    } catch (err) {
      console.error(err);
      router.push("/dashboard");
    }
  };

  /* ---- Loading screen ---- */
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      </div>
    );
  }

  /* ================================================================ */
  /* RENDER                                                            */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="GrowthWapi Logo"
              width={144}
              height={48}
              className="h-[40px] w-[120px] object-contain"
              priority
            />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-blue"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8">
          {/* Page heading */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
              Combo Plan Setup
            </span>
            <h1 className="text-3xl font-extrabold text-brand-darkblue">
              WhatsApp API + AI Calling Agent
            </h1>
            <p className="text-sm text-slate-600">
              WhatsApp API: 2-day free trial (AI Calling requires immediate
              payment)
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {errorMsg}
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* Combo Tier Selector (always visible)                      */}
          {/* -------------------------------------------------------- */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-brand-darkblue uppercase tracking-wider">
              Select Combo Tier
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {comboPlans.map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      if (currentStep === "select") {
                        setSelectedPlanId(plan.id);
                      }
                    }}
                    className={
                      "rounded-2xl p-6 border transition-all relative flex flex-col justify-between " +
                      (currentStep !== "select"
                        ? "pointer-events-none opacity-70 "
                        : "cursor-pointer ") +
                      (isSelected
                        ? "bg-white border-2 border-brand-orange shadow-lg"
                        : "bg-white border-slate-200 hover:border-slate-300")
                    }
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                        Most Popular
                      </span>
                    )}
                    <div
                      className={
                        "absolute -top-3 right-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full " +
                        (isSelected
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-100 text-emerald-700")
                      }
                    >
                      {plan.savings}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mt-2">
                        <h3 className="font-bold text-brand-darkblue text-lg">
                          {plan.name}
                        </h3>
                        <div
                          className={
                            "w-5 h-5 rounded-full border flex items-center justify-center " +
                            (isSelected
                              ? "bg-brand-orange border-brand-orange text-white"
                              : "border-slate-300")
                          }
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 stroke-[3]" />
                          )}
                        </div>
                      </div>

                      <div className="mt-3 text-2xl font-extrabold text-brand-darkblue">
                        ₹{plan.price.toLocaleString("en-IN")}
                        <span className="text-sm font-normal text-slate-500">
                          /month
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-600">
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-brand-blue font-semibold">
                      Billed monthly: ₹{plan.price.toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue button when still selecting */}
            {currentStep === "select" && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setCurrentStep("step1")}
                  className="px-8 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-full font-semibold text-sm transition-all shadow-md"
                >
                  Continue with {selectedPlan.name}
                </button>
              </div>
            )}
          </div>

          {/* Summary Banner (visible after selection) */}
          {currentStep !== "select" && (
            <div className="bg-blue-50/80 rounded-2xl p-6 border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider">
                  Selected: {selectedPlan.name}
                </div>
                <div className="text-lg font-bold text-brand-darkblue mt-0.5">
                  Monthly: ₹{selectedPlan.price.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-brand-orange font-semibold">
                  WhatsApp: {selectedPlan.waUtility.toLocaleString("en-IN")}{" "}
                  utility + {selectedPlan.waMarketing.toLocaleString("en-IN")}{" "}
                  marketing
                </div>
                <div className="text-xs text-brand-orange font-semibold">
                  AI Calling: {selectedPlan.aiMinutes} min (~
                  {selectedPlan.aiCalls} calls)
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* STEP 1 – WhatsApp Trial Setup                            */}
          {/* -------------------------------------------------------- */}
          {currentStep === "step1" && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-brand-blue text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h2 className="text-lg font-bold text-brand-darkblue">
                      Try WhatsApp API Free for 2 Days
                    </h2>
                  </div>
                  <p className="text-xs text-amber-600 font-medium pl-9">
                    ⚠️ AI Calling Agent payment required immediately — no trial
                    available for calls
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Business Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Business Name{" "}
                      <span className="text-brand-orange">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Apex Enterprises"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm"
                    />
                  </div>
                  {/* WhatsApp Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      WhatsApp Business Number{" "}
                      <span className="text-brand-orange">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+91XXXXXXXXXX"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Business Category/Industry{" "}
                    <span className="text-brand-orange">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    placeholder="Retail, NGO, Education, etc."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm"
                  />
                </div>

                {/* Message Types */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Message Types Needed (choose any)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      "Order updates/Utility",
                      "Appointment reminders",
                      "Marketing campaigns",
                      "Customer support",
                    ].map((type) => (
                      <label
                        key={type}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={messageTypes.includes(type)}
                          onChange={() => toggleMessageType(type)}
                          className="h-4 w-4 text-brand-blue border-gray-300 rounded"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Meta Business Manager */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Do you have a Meta Business Manager account?
                  </label>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        name="meta"
                        value="yes"
                        checked={hasMeta === "yes"}
                        onChange={() => setHasMeta("yes")}
                        className="h-4 w-4 text-brand-blue border-gray-300"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        name="meta"
                        value="no"
                        checked={hasMeta === "no"}
                        onChange={() => setHasMeta("no")}
                        className="h-4 w-4 text-brand-blue border-gray-300"
                      />
                      <span>No</span>
                    </label>
                  </div>
                  {hasMeta === "yes" && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={metaId}
                        onChange={(e) => setMetaId(e.target.value)}
                        placeholder="Meta Business Manager ID (optional)"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Additional Requirements */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Additional Requirements (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={additionalReq}
                    onChange={(e) => setAdditionalReq(e.target.value)}
                    placeholder="Any specific templates or workflows you need"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm resize-none"
                  />
                </div>

                {/* Submit Step 1 */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>No payment required for WhatsApp trial</span>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-4 bg-brand-blue hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Activating trial...
                      </>
                    ) : (
                      "Start Your Free Trial"
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* -------------------------------------------------------- */}
          {/* Step 1 success banner (visible in step2 and payment)      */}
          {/* -------------------------------------------------------- */}
          {step1Success && (currentStep === "step2" || currentStep === "payment") && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">
                  WhatsApp trial activated for 2 days (50 messages)!
                </span>{" "}
                Now set up your AI Calling Agent below.
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* STEP 2 – AI Calling Agent Setup                          */}
          {/* -------------------------------------------------------- */}
          {currentStep === "step2" && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h2 className="text-lg font-bold text-brand-darkblue">
                      Configure Your AI Calling Agent
                    </h2>
                  </div>
                  <p className="text-xs text-amber-600 font-medium pl-9">
                    Payment starts immediately when you activate — no free trial
                    for AI Calling
                  </p>
                </div>

                {/* Agent Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Agent Name <span className="text-brand-orange">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g. Sales Assistant, Support Bot"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm"
                  />
                </div>

                {/* Business Details */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Business Details{" "}
                    <span className="text-brand-orange">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={businessDetails}
                    onChange={(e) => setBusinessDetails(e.target.value)}
                    placeholder="Describe your business, products/services, and what the AI agent should know"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm resize-none"
                  />
                </div>

                {/* Tone Preference */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Tone Preference{" "}
                    <span className="text-brand-orange">*</span>
                  </label>
                  <div className="flex items-center space-x-6">
                    {["formal", "casual", "hinglish"].map((t) => (
                      <label
                        key={t}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="radio"
                          name="tone"
                          value={t}
                          checked={tone === t}
                          onChange={() => setTone(t)}
                          className="h-4 w-4 text-brand-blue border-gray-300"
                        />
                        <span className="capitalize">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* FAQs */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    FAQs / Sample Questions (optional)
                  </label>
                  <textarea
                    rows={4}
                    value={faqs}
                    onChange={(e) => setFaqs(e.target.value)}
                    placeholder={"Q: What are your hours? A: 9 AM – 6 PM IST\nQ: Do you offer refunds? A: Yes, within 7 days."}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm resize-none"
                  />
                </div>

                {/* Submit Step 2 */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Secure monthly payment processing</span>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-4 bg-brand-orange hover:bg-orange-600 text-white rounded-full font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Activate Your Combo (₹" +
                      selectedPlan.price.toLocaleString("en-IN") +
                      "/month)"
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* -------------------------------------------------------- */}
          {/* Payment Simulation                                        */}
          {/* -------------------------------------------------------- */}
          {currentStep === "payment" && (
            <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 text-brand-orange flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                  Final Step: Combo Payment
                </span>
                <h2 className="text-2xl font-bold text-brand-darkblue">
                  Payment Simulation
                </h2>
                <p className="text-xs text-slate-500">
                  This simulates the monthly payment for your{" "}
                  {selectedPlan.name} subscription.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Combo Tier:</span>
                  <span className="font-bold text-brand-darkblue">
                    {selectedPlan.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">WhatsApp API:</span>
                  <span className="font-bold text-brand-darkblue">
                    {selectedPlan.waUtility.toLocaleString("en-IN")} utility +{" "}
                    {selectedPlan.waMarketing.toLocaleString("en-IN")} marketing
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AI Calling:</span>
                  <span className="font-bold text-brand-darkblue">
                    {selectedPlan.aiMinutes} min (~{selectedPlan.aiCalls} calls)
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                  <span className="text-brand-orange">Monthly Amount:</span>
                  <span className="text-brand-orange">
                    ₹{selectedPlan.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                WhatsApp trial is already active. AI Calling charges begin now.
              </p>
              <button
                onClick={handleSimulatePaymentReceived}
                disabled={simulatingPayment}
                className="w-full py-4 bg-brand-orange hover:bg-orange-600 text-white rounded-full font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                {simulatingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating
                    status...
                  </>
                ) : (
                  <>Simulate Payment Received</>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

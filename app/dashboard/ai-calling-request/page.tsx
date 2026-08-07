"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Check, Loader2, CreditCard } from "lucide-react";

interface AiCallingPlan {
  id: string;
  name: string;
  price: number;
  minutes: number;
  calls: number;
  popular: boolean;
  features: string[];
}

const aiCallingPlans: AiCallingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 3300,
    minutes: 150,
    calls: 50,
    popular: false,
    features: [
      "150 calling minutes included (~50 calls)",
      "Single AI Agent",
      "Standard voice quality",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 6000,
    minutes: 300,
    calls: 100,
    popular: true,
    features: [
      "300 calling minutes included (~100 calls)",
      "Up to 3 AI Agents",
      "HD voice quality",
      "Priority technical support",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 10800,
    minutes: 600,
    calls: 200,
    popular: false,
    features: [
      "600 calling minutes included (~200 calls)",
      "Unlimited AI Agents",
      "Premium HD voice quality",
      "Dedicated AI specialist support",
    ],
  },
];

export default function AiCallingRequestPage() {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("growth");
  const [agentName, setAgentName] = useState("");
  const [businessDetails, setBusinessDetails] = useState("");
  const [tone, setTone] = useState<string>("formal");
  const [faqs, setFaqs] = useState("");

  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [step, setStep] = useState<"form" | "simulate_payment">("form");
  const [createdSubId, setCreatedSubId] = useState<string | null>(null);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  const selectedPlan =
    aiCallingPlans.find((p) => p.id === selectedPlanId) || aiCallingPlans[1];

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
      setAuthChecking(false);
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createClient();

      // Insert AI agent record
      const agentPayload = {
        user_id: userId,
        agent_name: agentName,
        business_details: businessDetails,
        tone_preference: tone,
        faqs: faqs,
        plan: selectedPlan.id,
        minutes_included: selectedPlan.minutes,
        status: "setup_pending",
      };

      const { error: agentError } = await supabase
        .from("ai_agents")
        .insert(agentPayload);

      if (agentError) {
        console.error("AI Agent insert error:", agentError);
        throw new Error(agentError.message);
      }

      // Create subscription record
      const subscriptionPayload = {
        user_id: userId,
        service: "ai_calling",
        plan: selectedPlan.id,
        status: "pending_payment",
        amount: selectedPlan.price,
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
      setStep("simulate_payment");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit request.");
      setLoading(false);
    }
  };

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

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      </div>
    );
  }

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

      {/* Main Content */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {step === "form" ? (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                AI Calling Agent Setup
              </span>
              <h1 className="text-3xl font-extrabold text-brand-darkblue">
                Request Your AI Calling Agent
              </h1>
              <p className="text-sm text-slate-600">
                Choose a plan, configure your agent, and go live within 2
                business days. No free trial — paid plans only.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Plan Selector */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-brand-darkblue uppercase tracking-wider">
                  1. Select AI Calling Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {aiCallingPlans.map((plan) => {
                    const isSelected = plan.id === selectedPlanId;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={
                          "cursor-pointer rounded-2xl p-6 border transition-all relative flex flex-col justify-between " +
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

                        <div>
                          <div className="flex justify-between items-center">
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
              </div>

              {/* Summary Banner */}
              <div className="bg-blue-50/80 rounded-2xl p-6 border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider">
                    Selected: {selectedPlan.name} Plan
                  </div>
                  <div className="text-lg font-bold text-brand-darkblue mt-0.5">
                    Monthly: ₹{selectedPlan.price.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-right sm:text-right">
                  <div className="text-sm font-bold text-brand-orange">
                    {selectedPlan.minutes} minutes (~{selectedPlan.calls} calls)
                    included
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                <label className="block text-sm font-bold text-brand-darkblue uppercase tracking-wider">
                  2. Agent Configuration
                </label>

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
                    placeholder="Describe your business, products/services, and what the AI agent should know about your company"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm resize-none"
                  />
                </div>

                {/* Tone Preference */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Tone Preference <span className="text-brand-orange">*</span>
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
                    FAQs / Common Questions (optional)
                  </label>
                  <textarea
                    rows={4}
                    value={faqs}
                    onChange={(e) => setFaqs(e.target.value)}
                    placeholder="List common customer questions and ideal answers, one per line. E.g.&#10;Q: What are your hours? A: We are open 9 AM – 6 PM IST, Mon–Sat.&#10;Q: Do you offer refunds? A: Yes, within 7 days of purchase."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm resize-none"
                  />
                </div>

                {/* Submit */}
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
                      "Submit & Proceed to Payment (₹" +
                      selectedPlan.price.toLocaleString("en-IN") +
                      "/month)"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* Simulated Payment Screen */
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 text-brand-orange flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                Step 2: Monthly Payment
              </span>
              <h2 className="text-2xl font-bold text-brand-darkblue">
                Payment Simulation
              </h2>
              <p className="text-xs text-slate-500">
                This simulates the monthly payment for your AI Calling Agent
                subscription.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-brand-darkblue">
                  {selectedPlan.name} Plan
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Minutes:</span>
                <span className="font-bold text-brand-darkblue">
                  {selectedPlan.minutes} min (~{selectedPlan.calls} calls)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly Amount:</span>
                <span className="font-bold text-brand-darkblue">
                  ₹{selectedPlan.price.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-brand-orange">Amount Charged:</span>
                <span className="text-brand-orange">
                  ₹{selectedPlan.price.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
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
      </main>
    </div>
  );
}

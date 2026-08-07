"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Check, Loader2, CreditCard } from "lucide-react";

interface WhatsappPlan {
  id: string; // slug
  name: string;
  price: number; // monthly price in INR
  utilityIncluded: number;
  marketingIncluded: number;
  popular: boolean;
  features: string[];
}

const whatsappPlans: WhatsappPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 1000,
    utilityIncluded: 2000,
    marketingIncluded: 200,
    popular: false,
    features: [
      "2,000 utility/service messages included",
      "200 marketing messages included",
      "Shared Inbox & Template Management",
      "Standard Email Support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 3000,
    utilityIncluded: 6000,
    marketingIncluded: 600,
    popular: true,
    features: [
      "6,000 utility/service messages included",
      "600 marketing messages included",
      "Multi‑agent Shared Inbox",
      "Automated Bot Workflows",
      "Priority Chat & Email Support",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 5000,
    utilityIncluded: 15000,
    marketingIncluded: 1500,
    popular: false,
    features: [
      "15,000 utility/service messages included",
      "1,500 marketing messages included",
      "Custom API Integration & Webhooks",
      "Dedicated Account Manager",
      "24/7 SLA Support",
    ],
  },
  {
    id: "combo",
    name: "Combo",
    price: 8000,
    utilityIncluded: 20000,
    marketingIncluded: 2000,
    popular: false,
    features: [
      "All WhatsApp API features",
      "AI Calling Agent included",
      "Discounted bundle price",
      "Priority Support",
    ],
  },
  {
    id: "free-trial",
    name: "FREE TRIAL",
    price: 0,
    utilityIncluded: 0,
    marketingIncluded: 0,
    popular: false,
    features: [
      "2‑Day Free Trial – up to 50 messages",
      "No payment required",
      "Setup pending until activation",
    ],
  },
];

export default function WhatsappRequestPage() {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("growth");
  const [businessName, setBusinessName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [messageTypes, setMessageTypes] = useState<string[]>([]);
  const [hasMeta, setHasMeta] = useState<string>("no"); // "yes" or "no"
  const [metaId, setMetaId] = useState("");
  const [additionalReq, setAdditionalReq] = useState("");

  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Payment simulation state
  const [step, setStep] = useState<"form" | "simulate_payment">("form");
  const [createdSubId, setCreatedSubId] = useState<string | null>(null);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  const selectedPlan = whatsappPlans.find((p) => p.id === selectedPlanId) || whatsappPlans[1];

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
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

const handleSubmit = async (e: React.FormEvent) => {
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
    };

    // Base payload for WhatsApp account
    const whatsappPayload: any = {
      user_id: userId,
      business_display_name: businessName,
      stage: "requirement",
      requirements: requirements,
      status: "setup_pending",
      utility_msgs_included: selectedPlan.utilityIncluded,
      marketing_msgs_included: selectedPlan.marketingIncluded,
    };

    // If free trial selected, add trial fields and adjust caps
    if (selectedPlan.id === "free-trial") {
      whatsappPayload.trial_status = "active";
      whatsappPayload.trial_started_at = new Date().toISOString();
      whatsappPayload.trial_messages_used = 0;
      whatsappPayload.utility_msgs_included = 50; // trial cap
      whatsappPayload.marketing_msgs_included = 0;
    }

    const { data: waData, error: waError } = await supabase
      .from("whatsapp_accounts")
      .insert(whatsappPayload)
      .select()
      .single();

    if (waError) {
      console.error("WhatsApp insert error:", waError);
      throw new Error(waError.message);
    }

    // If trial, skip subscription creation and finish
    if (selectedPlan.id === "free-trial") {
      setLoading(false);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // Paid flow: create subscription record
    const subscriptionPayload = {
      user_id: userId,
      service: "whatsapp_api",
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
      // No status change for whatsapp_accounts (remains setup_pending until further steps)
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
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-blue">
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
                WhatsApp API Setup Request
              </span>
              <h1 className="text-3xl font-extrabold text-brand-darkblue">
                Request Your WhatsApp Business API
              </h1>
              <p className="text-sm text-slate-600">
                Choose a plan and provide your business details. Billing is monthly.
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
                  1. Select WhatsApp Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {whatsappPlans.map((plan) => {
                    const isSelected = plan.id === selectedPlanId;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`cursor-pointer rounded-2xl p-6 border transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? "bg-white border-2 border-brand-orange shadow-lg scale-102"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                            Most Popular
                          </span>
                        )}

                        <div>
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-brand-darkblue text-lg">{plan.name}</h3>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                isSelected ? "bg-brand-orange border-brand-orange text-white" : "border-slate-300"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>

                          <div className="mt-3 text-2xl font-extrabold text-brand-darkblue">
                            ₹{plan.price.toLocaleString("en-IN")}
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
                    Includes: {selectedPlan.utilityIncluded.toLocaleString("en-IN")} utility msgs & {selectedPlan.marketingIncluded.toLocaleString("en-IN")} marketing msgs
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                <label className="block text-sm font-bold text-brand-darkblue uppercase tracking-wider">
                  2. Business Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Business Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Business Name <span className="text-brand-orange">*</span>
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
                      WhatsApp Business Number <span className="text-brand-orange">*</span>
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
                    Business Category/Industry <span className="text-brand-orange">*</span>
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
                    {["Order updates/Utility", "Appointment reminders", "Marketing campaigns", "Customer support"].map((type) => (
                      <label key={type} className="flex items-center space-x-2 text-sm">
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
                    Do you already have a Meta Business Manager account?
                  </label>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        name="meta"
                        value="yes"
                        checked={hasMeta === "yes"}
                        onChange={() => setHasMeta("yes")}
                        className="h-4 w-4 text-brand-blue border-gray-300 rounded"
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
                        className="h-4 w-4 text-brand-blue border-gray-300 rounded"
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
                    rows={4}
                    value={additionalReq}
                    onChange={(e) => setAdditionalReq(e.target.value)}
                    placeholder="Any specific templates or workflows you need"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm resize-none"
                  />
                </div>

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
                      selectedPlan.id === "free-trial"
                        ? "Start Free Trial"
                        : `Proceed to Pay Advance (₹${selectedPlan.price.toLocaleString("en-IN")})`
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          // Simulated Payment Screen
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
                This simulates the monthly payment for your WhatsApp API subscription.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-brand-darkblue">{selectedPlan.name} Plan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly Amount:</span>
                <span className="font-bold text-brand-darkblue">₹{selectedPlan.price.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-brand-orange">Amount Charged:</span>
                <span className="text-brand-orange">₹{selectedPlan.price.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <button
              onClick={handleSimulatePaymentReceived}
              disabled={simulatingPayment}
              className="w-full py-4 bg-brand-orange hover:bg-orange-600 text-white rounded-full font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              {simulatingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating status...
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

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Check, Sparkles, Loader2, CreditCard, ShieldCheck, CheckCircle2 } from "lucide-react";

interface WebsitePlan {
  id: string;
  name: string;
  totalPrice: number;
  popular: boolean;
  features: string[];
}

const websitePlans: WebsitePlan[] = [
  {
    id: "starter",
    name: "Starter",
    totalPrice: 10000,
    popular: false,
    features: [
      "5-8 pages professional layout",
      "Mobile-responsive & fast loading",
      "Basic SEO setup & metadata",
      "Functional contact form",
      "3 revisions included",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    totalPrice: 20000,
    popular: true,
    features: [
      "10-15 pages dynamic website",
      "Dynamic content & database integration",
      "Admin panel-lite for blog/products",
      "WhatsApp & email instant alerts",
      "3 revisions included",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    totalPrice: 30000,
    popular: false,
    features: [
      "15-20 pages full web platform",
      "Full database + custom admin dashboard",
      "Custom business logic & workflows",
      "Razorpay payment gateway ready",
      "Priority support & handover doc",
    ],
  },
];

export default function WebsiteRequestPage() {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("growth");
  const [businessName, setBusinessName] = useState("");
  const [pagesCount, setPagesCount] = useState<number>(10);
  const [purpose, setPurpose] = useState("");
  const [referenceSites, setReferenceSites] = useState("");
  const [requestedDomain, setRequestedDomain] = useState("");

  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Payment Simulation State
  const [step, setStep] = useState<"form" | "simulate_payment">("form");
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [createdSubId, setCreatedSubId] = useState<string | null>(null);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  const selectedPlan = websitePlans.find((p) => p.id === selectedPlanId) || websitePlans[1];
  const advanceAmount = selectedPlan.totalPrice * 0.5;
  const remainingAmount = selectedPlan.totalPrice * 0.5;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createClient();

      const briefData = {
        business_name: businessName,
        pages: pagesCount,
        purpose: purpose,
        reference_sites: referenceSites,
        requested_domain: requestedDomain,
      };

      // 1. Insert row into web_projects
      const projectPayload = {
        user_id: userId,
        plan: selectedPlan.id,
        brief: briefData,
        stage: "requirement",
        requested_domain: requestedDomain || null,
        reference_sites: referenceSites || null,
        final_payment_status: "pending",
      };
      console.log('Web project payload:', projectPayload);
      const { data: projectData, error: projectError } = await supabase
        .from("web_projects")
        .insert(projectPayload)
        .select()
        .single();

      if (projectError) {
        console.error("Web Project insert error:", projectError);
        // Fallback: Continue to simulation if table policies permit or fallback to local state
      }

      // 2. Insert row into subscriptions
      const subscriptionPayload = {
        user_id: userId,
        service: "website_dev",
        plan: selectedPlan.id,
        status: "pending_payment",
        amount: advanceAmount,
      };
      console.log('Subscription payload:', subscriptionPayload);
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .insert(subscriptionPayload)
        .select()
        .single();

      if (subError) {
        console.error("Subscription insert error:", subError);
      }

      setCreatedProjectId(projectData?.id || "temp-proj-id");
      setCreatedSubId(subData?.id || "temp-sub-id");
      setLoading(false);
      setStep("simulate_payment");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit project requirements.");
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

      // Store local confirmation flag so dashboard reflects project instantly
      localStorage.setItem(`web_project_${userId}`, JSON.stringify({
        plan: selectedPlan.name,
        totalPrice: selectedPlan.totalPrice,
        advancePaid: advanceAmount,
        stage: "requirement",
        finalPaymentStatus: "pending",
        businessName,
      }));

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
            />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-blue"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {step === "form" ? (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                Website Development Requirement Intake
              </span>
              <h1 className="text-3xl font-extrabold text-brand-darkblue">
                Request Your Custom Website
              </h1>
              <p className="text-sm text-slate-600">
                50% advance now to initiate design & development, 50% remaining after final review and handover.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Plan Selector Grid */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-brand-darkblue uppercase tracking-wider">
                  1. Select Website Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {websitePlans.map((plan) => {
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
                                isSelected
                                  ? "bg-brand-orange border-brand-orange text-white"
                                  : "border-slate-300"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>

                          <div className="mt-3 text-2xl font-extrabold text-brand-darkblue">
                            ₹{plan.totalPrice.toLocaleString("en-IN")}
                          </div>

                          <div className="mt-4 space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-600">
                            {plan.features.map((feat, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0"></span>
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-brand-blue font-semibold">
                          Advance due now: ₹{(plan.totalPrice * 0.5).toLocaleString("en-IN")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Price Calculation Summary Banner */}
              <div className="bg-blue-50/80 rounded-2xl p-6 border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider">
                    Selected: {selectedPlan.name} Plan
                  </div>
                  <div className="text-lg font-bold text-brand-darkblue mt-0.5">
                    Total: ₹{selectedPlan.totalPrice.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-right sm:text-right">
                  <div className="text-sm font-bold text-brand-orange">
                    Advance due now (50%): ₹{advanceAmount.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Remaining after completion (50%): ₹{remainingAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Requirement Form Fields */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                <label className="block text-sm font-bold text-brand-darkblue uppercase tracking-wider">
                  2. Project Requirements
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Number of Pages Needed <span className="text-brand-orange">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={pagesCount}
                      onChange={(e) => setPagesCount(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Website Purpose & Description <span className="text-brand-orange">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe what your website is for and any specific features or integrations you need..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Reference Websites (Optional)
                    </label>
                    <input
                      type="text"
                      value={referenceSites}
                      onChange={(e) => setReferenceSites(e.target.value)}
                      placeholder="Any websites you like the style of? Paste links"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Preferred Domain Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={requestedDomain}
                      onChange={(e) => setRequestedDomain(e.target.value)}
                      placeholder="e.g. yourbusiness.com — leave blank if unsure"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Secure 50% advance invoice generation</span>
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
                      `Proceed to Pay Advance (₹${advanceAmount.toLocaleString("en-IN")})`
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* Simulated Payment Gateway Screen */
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 text-brand-orange flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                Step 2: Advance Payment
              </span>
              <h2 className="text-2xl font-bold text-brand-darkblue">
                Advance Payment Simulation
              </h2>
              <p className="text-xs text-slate-500">
                Payment integration coming next — for now this simulates advance payment received for your project.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-brand-darkblue">{selectedPlan.name} Plan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Project Value:</span>
                <span className="font-bold text-brand-darkblue">₹{selectedPlan.totalPrice.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-brand-orange">50% Advance Due:</span>
                <span className="text-brand-orange">₹{advanceAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              onClick={handleSimulatePaymentReceived}
              disabled={simulatingPayment}
              className="w-full py-4 bg-brand-orange hover:bg-orange-600 text-white rounded-full font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              {simulatingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating project status...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Simulate Advance Payment Received
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

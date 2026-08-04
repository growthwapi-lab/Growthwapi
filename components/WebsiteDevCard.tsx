"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Globe, Check, Clock, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export interface WebProjectData {
  id?: string;
  plan: string;
  stage: "requirement" | "design" | "development" | "review" | "live";
  final_payment_status?: "pending" | "paid";
  total_price?: number;
  business_name?: string;
}

interface WebsiteDevCardProps {
  initialProject: WebProjectData | null;
  userId: string;
}

const STAGES = [
  { id: "requirement", label: "Requirement Submitted" },
  { id: "design", label: "Design" },
  { id: "development", label: "Development" },
  { id: "review", label: "Review" },
  { id: "live", label: "Live" },
];

export default function WebsiteDevCard({ initialProject, userId }: WebsiteDevCardProps) {
  const [project, setProject] = useState<WebProjectData | null>(initialProject);
  const [payingFinal, setPayingFinal] = useState(false);

  const getPlanTotalPrice = (planName: string) => {
    if (planName.toLowerCase().includes("premium")) return 30000;
    if (planName.toLowerCase().includes("starter")) return 10000;
    return 20000; // default Growth
  };

  const currentStageIndex = project
    ? STAGES.findIndex((s) => s.id === project.stage)
    : -1;

  const totalPrice = project ? project.total_price || getPlanTotalPrice(project.plan) : 0;
  const remainingAmount = totalPrice * 0.5;

  const handlePayRemaining = async () => {
    setPayingFinal(true);
    try {
      const supabase = createClient();
      if (project?.id) {
        await supabase
          .from("web_projects")
          .update({ final_payment_status: "paid" })
          .eq("id", project.id);
      }

      setProject((prev) => (prev ? { ...prev, final_payment_status: "paid" } : null));

      // Update local storage status
      const saved = localStorage.getItem(`web_project_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.finalPaymentStatus = "paid";
        localStorage.setItem(`web_project_${userId}`, JSON.stringify(parsed));
      }
    } catch (err) {
      console.error("Error updating final payment:", err);
    } finally {
      setPayingFinal(false);
    }
  };

  if (!project) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mb-4">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-brand-darkblue">Website Design & Dev</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Custom mobile-responsive site with database integration.
          </p>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs font-medium">
            Not subscribed yet
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link
            href="/dashboard/website-request"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-brand-blue border border-brand-blue hover:bg-brand-blue hover:text-white transition-all text-center block"
          >
            View Plans & Request Site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col justify-between md:col-span-3 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-darkblue">
              Website Development Status
            </h3>
            <p className="text-xs text-slate-500">
              Plan: <span className="font-semibold text-brand-darkblue">{project.plan}</span> (Total Value: ₹{totalPrice.toLocaleString("en-IN")})
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-orange-50 text-brand-orange border border-orange-200 rounded-full">
          Stage: {STAGES[currentStageIndex]?.label || "Requirement Submitted"}
        </span>
      </div>

      {/* 5-Stage Stepper */}
      <div className="py-2">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isUpcoming = idx > currentStageIndex;

            return (
              <div
                key={s.id}
                className={`p-3 rounded-xl border transition-all flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 ${
                  isCurrent
                    ? "bg-orange-50/80 border-brand-orange text-brand-orange shadow-sm"
                    : isCompleted
                    ? "bg-blue-50/60 border-blue-200 text-brand-blue"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? "bg-brand-orange text-white"
                      : isCompleted
                      ? "bg-brand-blue text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                </div>

                <div className="text-xs font-bold leading-tight">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prominent Card when stage is 'review' */}
      {project.stage === "review" && project.final_payment_status !== "paid" && (
        <div className="p-5 rounded-2xl bg-orange-50 border-2 border-brand-orange text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-orange font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Your website is ready for review!</span>
            </div>
            <p className="text-xs text-slate-600">
              Complete the remaining 50% payment (₹{remainingAmount.toLocaleString("en-IN")}) to receive final handover and go live.
            </p>
          </div>

          <button
            onClick={handlePayRemaining}
            disabled={payingFinal}
            className="w-full sm:w-auto px-6 py-3 bg-brand-orange hover:bg-orange-600 text-white font-semibold text-xs rounded-full shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
          >
            {payingFinal ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              `Pay Remaining Amount (₹${remainingAmount.toLocaleString("en-IN")})`
            )}
          </button>
        </div>
      )}

      {project.final_payment_status === "paid" && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Final 50% payment completed. Your website is ready for launch and handover.</span>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>Advance (50%): Paid</span>
        <span>Remaining (50%): {project.final_payment_status === "paid" ? "Paid" : `₹${remainingAmount.toLocaleString("en-IN")} Pending`}</span>
      </div>
    </div>
  );
}

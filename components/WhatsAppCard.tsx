"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Check, CheckCircle2, Loader2 } from "lucide-react";

export interface WhatsAppData {
  id?: string;
  plan: string;
  stage: "requirement" | "meta_verification" | "api_setup" | "testing" | "live";
  status?: "setup_pending" | "active" | "live";
  business_name?: string;
  business_number?: string;
}

const STAGES = [
  { id: "requirement", label: "Requirement Submitted" },
  { id: "meta_verification", label: "Meta Verification" },
  { id: "api_setup", label: "API Setup" },
  { id: "testing", label: "Testing" },
  { id: "live", label: "Live" },
];

// Updated to accept usage data
export interface WhatsAppUsage {
  utility_msgs_used: number;
  utility_msgs_included: number;
  marketing_msgs_used: number;
  marketing_msgs_included: number;
}

export default function WhatsAppCard({
  initialAccount,
  userId,
  usage,
}: {
  initialAccount: WhatsAppData | null;
  userId: string;
  usage?: WhatsAppUsage | null;
}) {
  const [account, setAccount] = useState<WhatsAppData | null>(initialAccount);

  // Placeholder: In a real app this would trigger a payment flow or subscription upgrade.
  const handleSubscribe = async () => {
    const supabase = createClient();
    if (!account) return;
    await supabase
      .from("whatsapp_accounts")
      .update({ stage: "live", status: "active" })
      .eq("id", account.id);
    setAccount({ ...account, stage: "live", status: "active" });
  };

  if (!account) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-brand-darkblue">WhatsApp API</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Automated messaging & bulk marketing platform.
          </p>
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs font-medium">
            Not subscribed yet
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link
            href="/dashboard/whatsapp-request"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-brand-blue border border-brand-blue hover:bg-brand-blue hover:text-white transition-all text-center block"
          >
            Request WhatsApp API
          </Link>
        </div>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.id === account.stage);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col justify-between space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-darkblue">WhatsApp API Status</h3>
            <p className="text-xs text-slate-500">
              Plan: <span className="font-semibold text-brand-darkblue">{account.plan}</span>
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-orange-50 text-brand-orange border border-orange-200 rounded-full">
          Stage: {STAGES[currentStageIndex]?.label || "Requirement Submitted"}
        </span>
      </div>

      {/* 5‑Stage Stepper */}
      <div className="py-2">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
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

      {/* Action when not paid */}
      {account.status !== "active" && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-brand-orange text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-orange font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Subscription pending. Complete setup to go live.</span>
            </div>
            <p className="text-xs text-slate-600">Click below to simulate activation.</p>
          </div>
          <button
            onClick={handleSubscribe}
            className="w-full sm:w-auto px-6 py-2 bg-brand-orange hover:bg-orange-600 text-white font-semibold text-xs rounded-full shadow-md transition-all flex items-center justify-center gap-2"
          >
            Activate Subscription
          </button>
        </div>
      )}

      {/* Paid confirmation */}
      {account.status === "active" && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>WhatsApp API subscription is active and live.</span>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>Status: {account.status === "active" ? "Active" : "Pending"}</span>
        <span>Stage: {STAGES[currentStageIndex]?.label}</span>
      </div>
    </div>
  );
}

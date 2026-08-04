"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-full transition-all bg-white shadow-sm"
    >
      <LogOut className="w-4 h-4" />
      <span>Logout</span>
    </button>
  );
}

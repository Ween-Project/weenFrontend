"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";
import { useAuth } from "@/lib/auth-context";
import { NavigationProgress } from "@/components/app/NavigationProgress";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 transition-colors">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900 transition-colors">
      <NavigationProgress />
      <Sidebar />
      <div className="lg:pl-[244px]">
        <Topbar />
        <main className="min-h-[calc(100vh-4rem)] overflow-x-hidden px-3 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>
    </div>
  );
}

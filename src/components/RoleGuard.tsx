"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/ui/Loading";
import type { UserRole } from "@/types";

export function RoleGuard({ allow, children }: { allow: UserRole[]; children: React.ReactNode }) {
  const { account, isLoading } = useAuth();
  if (isLoading) return <Loading label="Checking access…" />;
  if (!account || !allow.includes(account.role)) {
    return <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center"><p className="text-sm font-bold uppercase tracking-wider text-amber-700">403 · Forbidden</p><h2 className="mt-3 text-2xl font-black text-slate-900">This area is not available for your role.</h2><p className="mt-2 text-sm text-slate-600">Your account is signed in, but it does not have the required permission.</p><Link href="/dashboard" className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white">Return to dashboard</Link></div>;
  }
  return children;
}

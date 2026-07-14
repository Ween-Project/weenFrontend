"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authApi, errorMessage } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";


export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-500">Loading email verification…</main>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Verification token is missing.");
      setVerifying(false);
      return;
    }

    let active = true;
    async function doVerify() {
      try {
        await authApi.verifyEmail(token);
        if (active) {
          setSuccess(true);
        }
      } catch (cause) {
        if (active) {
          setError(errorMessage(cause));
        }
      } finally {
        if (active) {
          setVerifying(false);
        }
      }
    }

    void doVerify();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="relative grid min-h-screen bg-slate-50 lg:grid-cols-2">
      
      <section className="hidden bg-[#10251e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="text-2xl font-black text-lime">ween</Link>
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-lime">Verification</p>
          <h1 className="mt-4 max-w-lg text-5xl font-black leading-tight">Verify your account.</h1>
          <p className="mt-5 max-w-md text-white/60">Verifying your email confirms your identity on the Ween platform and unlocks all volunteer features.</p>
        </div>
        <p className="text-xs text-white/40">Secure verification by email token.</p>
      </section>
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="mx-auto block text-xl font-black text-emerald-700 lg:hidden">ween</Link>
          <div className="mt-8 lg:mt-0">
            {verifying ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8">
                <Loading label="Verifying your email address..." />
              </div>
            ) : success ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-800">✓</span>
                <h2 className="mt-6 text-2xl font-black text-slate-900">Email verified!</h2>
                <p className="mt-2 text-sm text-slate-500">Thank you. Your email address has been successfully verified. You can now access your dashboard.</p>
                <div className="mt-6">
                  <Link href="/login" className="block w-full rounded-full bg-slate-950 py-3 text-sm font-bold text-white hover:bg-slate-900">Sign in to your account</Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-8">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-3xl font-black text-red-800">×</span>
                <h2 className="mt-6 text-2xl font-black text-slate-900">Verification failed</h2>
                <div className="mt-4"><Alert>{error || "The verification link is invalid or has expired."}</Alert></div>
                <p className="mt-4 text-sm text-slate-500">Please request a new verification token from settings or try logging in again.</p>
                <div className="mt-6">
                  <Link href="/login" className="block w-full rounded-full bg-slate-950 py-3 text-sm font-bold text-white hover:bg-slate-900">Back to Sign in</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

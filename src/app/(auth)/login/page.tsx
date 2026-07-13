"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError, errorMessage } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Errors = { email?: string; password?: string };

export default function LoginPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-500">Loading sign in…</main>}><LoginContent /></Suspense>;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();
  const [accountType, setAccountType] = useState<"user" | "organization">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setRequestError("");
    try {
      await login({ email: email.trim(), password, accountType });
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      setRequestError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="hidden bg-[#10251e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="text-2xl font-black text-lime">ween</Link>
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-lime">Make an impact</p>
          <h1 className="mt-4 max-w-lg text-5xl font-black leading-tight">Your next good thing starts here.</h1>
          <p className="mt-5 max-w-md text-white/60">Discover events, share progress, and grow a record of meaningful work.</p>
        </div>
        <p className="text-xs text-white/40">Secure session powered by httpOnly cookies.</p>
      </section>
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="text-xl font-black text-emerald-700 lg:hidden">ween</Link>
          <h2 className="mt-8 text-3xl font-black tracking-tight text-slate-950 lg:mt-0">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in with the matching account type.</p>
          {searchParams.get("message") && <div className="mt-5"><Alert tone="info">{searchParams.get("message")}</Alert></div>}
          {requestError && <div className="mt-5"><Alert>{requestError}</Alert></div>}
          <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-slate-700">Account type</legend>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-200 p-1">
                {(["user", "organization"] as const).map((type) => (
                  <button key={type} type="button" onClick={() => setAccountType(type)} className={`rounded-lg px-3 py-2.5 text-sm font-bold capitalize ${accountType === type ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{type}</button>
                ))}
              </div>
            </fieldset>
            <Input id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} />
            <Input id="password" label="Password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs font-bold text-emerald-700 hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" variant="dark" fullWidth disabled={submitting || isLoading}>{submitting ? "Signing in…" : "Sign in"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">New to Ween? <Link href="/register" className="font-bold text-emerald-700">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
}

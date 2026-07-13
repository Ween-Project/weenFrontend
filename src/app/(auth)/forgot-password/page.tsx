"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authApi, errorMessage } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setNotice("A password reset link has been sent to your email. Please check your inbox.");
      setEmail("");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="hidden bg-[#10251e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="text-2xl font-black text-lime">ween</Link>
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-lime">Personal security</p>
          <h1 className="mt-4 max-w-lg text-5xl font-black leading-tight">Recover your account.</h1>
          <p className="mt-5 max-w-md text-white/60">No worries! Just enter your email address and we'll send you a secure link to reset your password.</p>
        </div>
        <p className="text-xs text-white/40">Secure verification by email token.</p>
      </section>
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="text-xl font-black text-emerald-700 lg:hidden">ween</Link>
          <h2 className="mt-8 text-3xl font-black tracking-tight text-slate-950 lg:mt-0">Forgot password?</h2>
          <p className="mt-2 text-sm text-slate-500">We'll email you instructions to reset your password.</p>
          {error && <div className="mt-5"><Alert>{error}</Alert></div>}
          {notice && <div className="mt-5"><Alert tone="success">{notice}</Alert></div>}
          <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
            <Input id="email" label="Email address" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Button type="submit" variant="dark" fullWidth disabled={submitting}>{submitting ? "Sending link…" : "Send reset link"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">Remember your password? <Link href="/login" className="font-bold text-emerald-700">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}

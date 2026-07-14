"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi, errorMessage } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";


export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-500">Loading password reset…</main>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("Reset token is missing. Please request a new link.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await authApi.resetPassword({
        token,
        newPassword: password,
        confirmNewPassword: confirmPassword,
      });
      setNotice("Your password has been reset successfully. Redirecting you to sign in...");
      setTimeout(() => {
        router.replace("/login?message=" + encodeURIComponent("Password reset successful. Please sign in with your new password."));
      }, 2000);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen bg-slate-50 lg:grid-cols-2">
      
      <section className="hidden bg-[#10251e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="text-2xl font-black text-lime">ween</Link>
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-lime">Personal security</p>
          <h1 className="mt-4 max-w-lg text-5xl font-black leading-tight">Create a new password.</h1>
          <p className="mt-5 max-w-md text-white/60">Choose a strong password containing at least 8 characters to secure your volunteer account.</p>
        </div>
        <p className="text-xs text-white/40">Secure encryption and validation.</p>
      </section>
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="text-xl font-black text-emerald-700 lg:hidden">ween</Link>
          <h2 className="mt-8 text-3xl font-black tracking-tight text-slate-950 lg:mt-0">Reset password</h2>
          <p className="mt-2 text-sm text-slate-500">Enter your new secure password below.</p>
          {!token && <div className="mt-5"><Alert>Invalid reset link. The reset token is missing.</Alert></div>}
          {error && <div className="mt-5"><Alert>{error}</Alert></div>}
          {notice && <div className="mt-5"><Alert tone="success">{notice}</Alert></div>}
          <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
            <Input id="password" label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!token} />
            <Input id="confirmPassword" label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={!token} />
            <Button type="submit" variant="dark" fullWidth disabled={submitting || !token}>{submitting ? "Resetting password…" : "Reset password"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">Back to <Link href="/login" className="font-bold text-emerald-700">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}

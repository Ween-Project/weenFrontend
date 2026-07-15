"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { invitationsApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ApproveInvitationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No invitation token provided.");
      return;
    }

    const approve = async () => {
      try {
        await invitationsApi.approve(token);
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.response?.data?.message || "Failed to approve invitation. It may have expired or already been processed.");
      }
    };

    approve();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="p-8 text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 grid h-20 w-20 animate-pulse place-items-center rounded-full bg-slate-100">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Processing...</h2>
              <p className="mt-2 text-slate-500">Please wait while we confirm your invitation.</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Invitation Accepted!</h2>
              <p className="mt-2 text-slate-500">You are now an organizer for this organization. You can access the dashboard to manage events.</p>
              <Link href="/dashboard" className="mt-8 block w-full">
                <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700">Go to Dashboard</Button>
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-red-100 text-red-600">
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Oops!</h2>
              <p className="mt-2 text-slate-500">{errorMessage}</p>
              <Link href="/" className="mt-8 block w-full">
                <Button className="w-full">Return Home</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

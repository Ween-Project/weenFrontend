"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { invitationsApi } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RejectInvitationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No invitation token provided.");
      return;
    }

    const reject = async () => {
      try {
        await invitationsApi.reject(token);
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.response?.data?.message || "Failed to reject invitation. It may have expired or already been processed.");
      }
    };

    reject();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="p-8 text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 grid h-20 w-20 animate-pulse place-items-center rounded-full bg-slate-100">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-transparent" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Processing...</h2>
              <p className="mt-2 text-slate-500">Please wait while we process your request.</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-slate-600">
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Invitation Declined</h2>
              <p className="mt-2 text-slate-500">You have successfully declined the invitation. You can now close this page.</p>
              <Link href="/" className="mt-8 block w-full">
                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">Return Home</Button>
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-red-100 text-red-600">
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Oops!</h2>
              <p className="mt-2 text-slate-500">{errorMessage}</p>
              <Link href="/" className="mt-8 block w-full">
                <Button variant="outline" className="w-full">Return Home</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

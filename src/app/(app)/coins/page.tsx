"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { Pagination } from "@/components/ui/Pagination";
import { coinsApi, errorMessage } from "@/lib/api";
import type { CoinTransactionResponse } from "@/types";

export default function CoinsPage() {
  return (
    <RoleGuard allow={["VOLUNTEER", "ADMIN"]}>
      <CoinsWallet />
    </RoleGuard>
  );
}

function CoinsWallet() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CoinTransactionResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  async function loadTransactions(targetPage = 0) {
    setLoadingMore(true);
    setError("");
    try {
      const txs = await coinsApi.transactions(targetPage);
      setTransactions(txs.content);
      setPage(targetPage);
      setTotalPages(txs.totalPages);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoadingMore(false);
    }
  }
    useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const bal = await coinsApi.balance();
        setBalance(bal);
        await loadTransactions(0);
      } catch (cause) {
        setError(errorMessage(cause));
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  function getReasonText(reason: string) {
    switch (reason) {
      case "SIGNUP":
        return "New Account Registration";
      case "ATTENDANCE":
        return "Event Attendance Verification";
      case "REFERRAL":
        return "Friend Referral Bonus";
      case "PROFILE_COMPLETE":
        return "Profile Completion Bonus";
      case "ADMIN_ADJUSTMENT":
        return "Manual Admin Adjustment";
      default:
        return reason;
    }
  }

  if (loading) return <Loading label="Loading your wallet…" />;
   return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-black">My Wallet</h1>
        <p className="mt-1 text-sm text-slate-500">Track and manage your earned WeenCoins.</p>

        {error && <div className="mt-5"><Alert>{error}</Alert></div>}

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-t pt-6">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Balance</p>
            <p className="mt-1 text-5xl font-black tracking-tight text-emerald-600">
              {balance !== null ? `${balance} 🪙` : "—"}
            </p>
          </div>
          <div className="max-w-md rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
            <p className="text-xs font-bold uppercase text-emerald-800">About WeenCoins</p>
            <p className="mt-1.5 text-xs leading-5 text-emerald-900">
              WeenCoins are rewarded for verified volunteer actions, completing your profile, referring colleagues, and participating in community events. Build your coin profile to showcase your impact!
            </p>
          </div>
        </div>
      </header>
      </div>
    );
}

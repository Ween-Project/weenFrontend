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
 
}

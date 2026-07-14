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
 
}

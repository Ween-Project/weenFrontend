"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { Pagination } from "@/components/ui/Pagination";
import { coinsApi, errorMessage } from "@/lib/api";
import type { CoinReason, CoinTransactionResponse } from "@/types";

const reasonLabels: Record<CoinReason, string> = {
  SIGNUP: "Signup bonus",
  ATTENDANCE: "Event attendance",
  REFERRAL: "Referral reward",
  PROFILE_COMPLETE: "Profile completion",
};

export default function CoinsPage() {
  return (
    <RoleGuard allow={["VOLUNTEER", "ADMIN"]}>
      <CoinsWallet />
    </RoleGuard>
  );
}

function CoinsWallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CoinTransactionResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paging, setPaging] = useState(false);
  const [error, setError] = useState("");

  async function load(nextPage = 0) {
    setError("");
    setPaging(nextPage !== page);
    try {
      const [nextBalance, transactionPage] = await Promise.all([
        coinsApi.balance(),
        coinsApi.transactions(nextPage),
      ]);
      setBalance(nextBalance);
      setTransactions(transactionPage.content);
      setPage(nextPage);
      setTotalPages(transactionPage.totalPages);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
      setPaging(false);
    }
  }

  useEffect(() => {
    void load(0);
  }, []);

  const earned = transactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const spent = Math.abs(transactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0));

  return (
    <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-slate-950 p-6 text-white dark:bg-slate-900">
          <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Ween wallet</p>
          <h1 className="mt-3 text-5xl font-black">{balance.toLocaleString()}</h1>
          <p className="mt-2 text-sm font-semibold text-slate-300">Available coins</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800">
          <div className="bg-white p-5 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">This page earned</p>
            <p className="mt-2 text-2xl font-black text-emerald-700">+{earned.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">This page used</p>
            <p className="mt-2 text-2xl font-black text-slate-700 dark:text-slate-200">{spent.toLocaleString()}</p>
          </div>
        </div>
        <div className="p-5">
          <h2 className="font-black text-slate-950 dark:text-white">How coins work</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p>Coins are awarded for verified impact across Ween.</p>
            <p>Complete your profile, attend events, and invite friends to grow your balance.</p>
          </div>
        </div>
      </aside>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-600">Activity</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Coin transactions</h2>
          </div>
          <button
            type="button"
            onClick={() => void load(page)}
            disabled={loading || paging}
            className="h-10 rounded-full border border-slate-200 px-4 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Refresh
          </button>
        </header>

        {error && <div className="p-5"><Alert>{error}</Alert></div>}

        {loading ? (
          <Loading label="Loading wallet..." />
        ) : transactions.length ? (
          <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((transaction) => (
                <article key={transaction.id} className="flex items-center gap-4 p-5">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-black ${
                    transaction.amount >= 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                    {transaction.amount >= 0 ? "+" : "-"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black text-slate-950 dark:text-white">
                      {reasonLabels[transaction.reason] ?? transaction.reason}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">{new Date(transaction.createdAt).toLocaleString()}</p>
                  </div>
                  <p className={`text-right text-sm font-black ${transaction.amount >= 0 ? "text-emerald-700" : "text-slate-700 dark:text-slate-200"}`}>
                    {transaction.amount > 0 ? "+" : ""}{transaction.amount.toLocaleString()} coins
                  </p>
                </article>
              ))}
            </div>
            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(nextPage) => void load(nextPage)}
                isLoading={paging}
              />
            </div>
          </>
        ) : (
          <div className="grid min-h-[360px] place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-lg font-black text-amber-700">W</div>
              <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">No transactions yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">Your earned and spent coins will appear here as you participate in Ween.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

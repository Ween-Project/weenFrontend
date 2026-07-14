"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, eventsApi } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { Pagination } from "@/components/ui/Pagination";
import { EVENT_CATEGORIES, type EventSummary } from "@/types";

export default function EventsPage() {
  const { account } = useAuth();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const canCreate = account?.role === "ORGANIZER" || account?.role === "ORGANIZATION_ADMIN";

  const load = useCallback(async (nextPage = 0) => {
    setLoading(true);
    setError("");
    try {
      const result = await eventsApi.list({
        page: nextPage,
        size: 12,
        search: search || undefined,
        category: category || undefined,
      });
      setEvents(result.content);
      setPage(nextPage);
      setTotalPages(result.totalPages);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, [category, search]);

  useEffect(() => {
    void load(0);
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">Opportunities</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Find your next event</h2>
        </div>
        {canCreate && (
          <Link
            href="/events/new"
            className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-bold text-white"
          >
            Create event
          </Link>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(0);
        }}
        className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_14rem_auto]"
      >
        <InputBare label="Search events" value={search} onChange={setSearch} />
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">All categories</option>
          {EVENT_CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white disabled:opacity-60"
        >
          Filter
        </button>
      </form>

      {error && (
        <div className="mt-5">
          <Alert>
            {error}{" "}
            <button onClick={() => void load()} className="ml-2 font-bold underline">
              Retry
            </button>
          </Alert>
        </div>
      )}

      {loading && !hasSearched ? (
        <Loading label="Loading events…" />
      ) : events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          No events match these filters.
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="h-32 bg-emerald-100">
                  {event.coverImageUrl && (
                    <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-emerald-700">
                      {event.category.replaceAll("_", " ")}
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">
                      {event.status}
                    </span>
                  </div>
                  <h3 className="mt-3 break-words text-lg font-black text-slate-900">{event.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{event.description}</p>
                  <p className="mt-4 text-xs font-semibold text-slate-600">
                    {new Date(event.startDate).toLocaleString()} · {event.isOnline ? "Online" : event.city || "Location TBA"}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(next) => void load(next)}
              isLoading={loading}
            />
          </div>
        </>
      )}
    </div>
  );
}

function InputBare({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <input
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={label}
      className="h-11 min-w-0 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-600"
    />
  );
}

"use client";
import { useEffect, useState } from "react";

type University = { name: string; country: string };
export function UniversitySelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [query, setQuery] = useState(value);
  const [items, setItems] = useState<University[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [custom, setCustom] = useState(false);
  useEffect(() => {
    if (custom || query.length < 2) {
      setItems([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/universities?q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        setItems(data.universities || []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [custom, query]);
  function select(next: string) {
    if (next === "__OTHER__") {
      setCustom(true);
      setQuery("");
      onChange("");
      setOpen(false);
      return;
    }
    setCustom(false);
    setQuery(next);
    onChange(next);
    setOpen(false);
  }
  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor="university"
          className="text-sm font-semibold text-slate-700"
        >
          University
        </label>
        {custom && (
          <button
            type="button"
            onClick={() => {
              setCustom(false);
              setQuery("");
              onChange("");
              setOpen(true);
            }}
            className="text-xs font-bold text-emerald-700"
          >
            Back to directory search
          </button>
        )}
      </div>
      <input
        id="university"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={
          custom ? "Enter your university" : "Search universities worldwide"
        }
        autoComplete="off"
        className={`h-12 w-full rounded-xl border bg-white px-4 pr-10 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 ${error ? "border-red-400" : "border-slate-200"}`}
      />
      {loading && (
        <span className="absolute right-4 top-11 h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      )}
      {open && !custom && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          <button
            type="button"
            onClick={() => select("__OTHER__")}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-emerald-700 hover:bg-emerald-50"
          >
            Other — enter manually
          </button>
          {items.map((item) => (
            <button
              type="button"
              key={`${item.name}-${item.country}`}
              onClick={() => select(item.name)}
              className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
            >
              <span className="block text-sm font-semibold text-slate-800">
                {item.name}
              </span>
              <span className="text-xs text-slate-400">{item.country}</span>
            </button>
          ))}
          {query.length < 2 && (
            <p className="px-3 py-3 text-xs text-slate-400">
              Type at least 2 characters to search the worldwide directory.
            </p>
          )}
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

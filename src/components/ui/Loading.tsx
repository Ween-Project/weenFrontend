export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div role="status" className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />{label}</div>;
}

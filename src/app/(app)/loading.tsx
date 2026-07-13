export default function AppLoading() {
  return <div className="mx-auto max-w-5xl animate-pulse"><div className="h-8 w-52 rounded-lg bg-slate-200" /><div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-5">{[1, 2, 3].map((item) => <div key={item} className="h-52 rounded-3xl border border-slate-200 bg-white" />)}</div><div className="hidden h-72 rounded-3xl border border-slate-200 bg-white lg:block" /></div></div>;
}

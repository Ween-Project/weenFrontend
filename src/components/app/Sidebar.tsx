"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { QrModal } from "@/components/qr/QrModal";

const icons: Record<string, React.ReactNode> = {
  Home: <path d="M3 11.5L12 4l9 7.5V21h-6v-6H9v6H3z" />,
  Explore: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  Network: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2" /><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M15 15c3 0 5 1.5 5 4" /></>,
  Messages: <path d="M4 5h16v12H8l-4 3z" />,
  Notifications: <><path d="M18 9a6 6 0 00-12 0c0 6-2 6-2 8h16c0-2-2-2-2-8" /><path d="M10 21h4" /></>,
  Profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-5 3-8 8-8s8 3 8 8" /></>,
  Admin: <><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /><path d="M9 12l2 2 4-4" /></>,
  AI: <><path d="M9.8 12h4.4M12 9.8v4.4" /><circle cx="12" cy="12" r="9" /></>,
  Wallet: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M16 14h2" /></>,
};

const links = [
  { href: "/dashboard", label: "Home", roles: [] },
  { href: "/events", label: "Explore", roles: [] },
  { href: "/network", label: "Network", roles: ["VOLUNTEER", "ORGANIZER", "ORGANIZATION_ADMIN", "ADMIN"] },
  { href: "/messages", label: "Messages", roles: ["VOLUNTEER", "ORGANIZER", "ORGANIZATION_ADMIN", "ADMIN"] },
  { href: "/notifications", label: "Notifications", roles: [] },
  { href: "/ai", label: "AI", roles: ["VOLUNTEER", "ORGANIZER", "ORGANIZATION_ADMIN", "ADMIN"] },
  { href: "/coins", label: "Wallet", roles: ["VOLUNTEER", "ADMIN"] },
  { href: "/settings", label: "Profile", roles: [] },
  { href: "/admin", label: "Admin", roles: ["ADMIN"] },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { account } = useAuth();
  const [qrOpen, setQrOpen] = useState(false);
  const isOrganization = account?.role === "ORGANIZATION_ADMIN";
  const visible = links.filter((item) => item.roles.length === 0 || (account && item.roles.some((role) => role === account.role)))
    .map((item) => item.label === "Profile" && account?.username ? { ...item, href: `/profile/${account.username}` } : item);
  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] border-r border-slate-200 bg-white px-4 py-6 transition-colors lg:flex lg:flex-col dark:border-slate-800 dark:bg-slate-950">
      <Link href="/dashboard" className="flex items-center gap-2 px-3 text-2xl font-black tracking-[-.06em] text-slate-950"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-base text-white">w</span>ween</Link>
      <nav className="mt-9 space-y-1.5">{visible.map((item) => { const active = pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link key={item.href} href={item.href} className={`flex items-center gap-4 rounded-xl px-3 py-3 text-[15px] transition ${active ? "bg-emerald-50 font-extrabold text-emerald-800" : "font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[item.label]}</svg>{item.label}</Link>; })}{!isOrganization && <button type="button" onClick={() => setQrOpen(true)} className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-[15px] font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"><QrIcon />My QR code</button>}</nav>
      <Link href="/posts" className="mt-7 flex h-12 items-center justify-center rounded-full bg-emerald-600 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20">Create post</Link>
      <Link href={account?.username ? `/profile/${account.username}` : "/settings"} className="mt-auto flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:bg-slate-50">
        {account?.profilePhotoUrl || account?.logoUrl ? (
          <img src={account.profilePhotoUrl || account.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 text-xs font-black">{(account?.fullName || account?.username || "WE").slice(0,2).toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{account?.fullName || account?.organizationName || account?.username}</p>
          <p className="truncate text-xs text-slate-400">@{account?.username || account?.role.toLowerCase()}</p>
        </div>
      </Link>
    </aside>
    <nav className={`fixed inset-x-0 bottom-0 z-50 grid h-[68px] ${isOrganization ? "grid-cols-4" : "grid-cols-5"} items-center border-t border-slate-200 bg-white/95 px-3 backdrop-blur transition-colors lg:hidden dark:border-slate-800 dark:bg-slate-950/95`}>
      <MobileLink item={visible.find((item) => item.label === "Home")} pathname={pathname} />
      <MobileLink item={visible.find((item) => item.label === "Explore")} pathname={pathname} />
      {!isOrganization && (
        <button type="button" onClick={() => setQrOpen(true)} aria-label="Generate QR code" className="mx-auto -mt-5 grid h-16 w-16 place-items-center rounded-full border-[5px] border-[#f7f8fa] bg-emerald-600 text-white shadow-xl shadow-emerald-600/25"><QrIcon large /></button>
      )}
      <MobileLink item={visible.find((item) => item.label === "Messages")} pathname={pathname} />
      <MobileLink item={visible.find((item) => item.label === "Profile")} pathname={pathname} />
    </nav>
    <QrModal open={qrOpen} onClose={() => setQrOpen(false)} />
  </>;
}

function QrIcon({ large = false }: { large?: boolean }) {
  return <svg className={large ? "h-7 w-7" : "h-[22px] w-[22px]"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM15 14h2v2h-2zM18 14h2v6h-6v-2" /></svg>;
}

function MobileLink({ item, pathname }: { item: { href: string; label: keyof typeof icons } | undefined; pathname: string }) {
  if (!item) return <span />;
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return <Link href={item.href} aria-label={item.label} className={`mx-auto grid h-11 w-11 place-items-center rounded-xl ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-500"}`}><svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{icons[item.label]}</svg></Link>;
}

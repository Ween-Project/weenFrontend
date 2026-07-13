"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const names: Record<string, string> = {
  dashboard: "Feed",
  events: "Discover events",
  network: "My network",
  messages: "Messages",
  notifications: "Notifications",
  settings: "Profile",
  admin: "Admin",
  ai: "Ween AI",
  coins: "Wallet"
};

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

export function Topbar() {
  const pathname = usePathname();
  const { account, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const section = pathname.split("/").filter(Boolean)[0] || "dashboard";

  const visibleLinks = links.filter(
    (item) => item.roles.length === 0 || (account && item.roles.some((role) => role === account.role))
  ).map((item) => item.label === "Profile" && account?.username ? { ...item, href: `/profile/${account.username}` } : item);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100 transition"
          >
            <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-black tracking-[-.06em] text-slate-950">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-sm text-white">w</span>
            ween
          </Link>
        </div>
        <h1 className="hidden text-lg font-black text-slate-950 lg:block">{names[section] || "Ween"}</h1>
        <div className="flex items-center gap-2">
          <Link href="/messages" aria-label="Messages" className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 5h16v12H8l-4 3z" />
            </svg>
          </Link>
          <Link href="/notifications" aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 9a6 6 0 00-12 0c0 6-2 6-2 8h16c0-2-2-2-2-8" />
              <path d="M10 21h4" />
            </svg>
          </Link>
          <button type="button" disabled={busy} onClick={() => { setBusy(true); void logout(); }} className="ml-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
            {busy ? "..." : "Log out"}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer Overlay & Content */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm transition-opacity duration-300"
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 flex w-full max-w-[280px] flex-col bg-white p-6 shadow-2xl transition-transform duration-300">
            <div className="flex items-center justify-between border-b pb-4">
              <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 text-2xl font-black tracking-[-.06em] text-slate-950">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-base text-white">w</span>
                ween
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {/* Drawer Navigation Links */}
            <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1">
              {visibleLinks.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-4 rounded-xl px-3 py-3 text-[15px] transition ${
                      active
                        ? "bg-emerald-50 font-extrabold text-emerald-800"
                        : "font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {icons[item.label]}
                    </svg>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {/* Profile Section at the bottom */}
            {account && (
              <div className="border-t pt-4 mt-auto">
                <Link
                  href={account.username ? `/profile/${account.username}` : "/settings"}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 hover:bg-slate-50 transition"
                >
                  {account.profilePhotoUrl || account.logoUrl ? (
                    <img src={account.profilePhotoUrl || account.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 text-xs font-black">
                      {(account.fullName || account.username || "WE").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{account.fullName || account.organizationName || account.username}</p>
                    <p className="truncate text-xs text-slate-400">@{account.username || account.role.toLowerCase()}</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

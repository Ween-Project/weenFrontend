"use client";

import { useEffect, useState, type FormEvent } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { Alert } from "@/components/ui/Alert";
import { Pagination } from "@/components/ui/Pagination";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { ToastViewport, type ToastMessage } from "@/components/ui/Toast";
import {
  Activity, Award, Bot, Building2, CalendarDays, Coins, FileBadge2, History,
  LayoutDashboard, MessageSquare, ShieldCheck, UserCheck, Users, type LucideIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { 
  adminApi, 
  adminOrganizationsApi, 
  errorMessage, 
  type AdminOrganization,
  type AuditLog,
  type AdminUserDetail,
  type ReferralResponse,
  type AiStatsResponse
} from "@/lib/api";
import type { AdminStats, UserResponse, EventSummary, Post, PostComment, Certificate, ParticipantResponse } from "@/types";
import { BadgeManager } from "@/components/admin/BadgeManager";

const statMeta: Record<string, { label: string; icon: LucideIcon; tone: string }> = {
  totalUsers: { label: "Total Users", icon: Users, tone: "bg-blue-50 text-blue-700" },
  totalOrganizations: { label: "Organizations", icon: Building2, tone: "bg-violet-50 text-violet-700" },
  pendingOrganizations: { label: "Pending Orgs", icon: Activity, tone: "bg-amber-50 text-amber-700" },
  totalPosts: { label: "Total Posts", icon: MessageSquare, tone: "bg-emerald-50 text-emerald-700" },
  totalEvents: { label: "All Events", icon: CalendarDays, tone: "bg-cyan-50 text-cyan-700" },
  totalAttendees: { label: "Attendees", icon: UserCheck, tone: "bg-rose-50 text-rose-700" },
};

type AdminTab = "overview" | "users" | "orgs" | "events" | "posts" | "badges" | "certificates" | "referrals" | "ai" | "audit";

const moduleNav: { id: AdminTab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "orgs", label: "Organizations", icon: Building2 },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "posts", label: "Content", icon: MessageSquare },
  { id: "badges", label: "Badges", icon: Award },
  { id: "certificates", label: "Certificates", icon: FileBadge2 },
  { id: "referrals", label: "Referrals", icon: UserCheck },
  { id: "ai", label: "AI Oversight", icon: Bot },
  { id: "audit", label: "Audit Log", icon: History },
];

function MetricBarChart({ title, description, data, color }: { title: string; description: string; data: { status: string; value: number }[]; color: string }) {
  const hasData = data.some((item) => item.value > 0);
  return (
    <article className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-extrabold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-muted">{description}</p>
      {hasData ? (
        <div className="mt-6 h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -18, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
              <Tooltip cursor={{ fill: "#F8FAFC" }} contentStyle={{ borderRadius: 12, borderColor: "#E5E7EB" }} />
              <Bar dataKey="value" name="Count" fill={color} radius={[8, 8, 0, 0]} maxBarSize={72} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 grid h-64 place-items-center rounded-xl border border-dashed border-border bg-surface text-center">
          <div><Activity className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-semibold text-muted">No chart data yet</p></div>
        </div>
      )}
    </article>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allow={["ADMIN"]}>
      <AdminDashboard />
    </RoleGuard>
  );
}

function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function notify(title: string, description?: string, tone: ToastMessage["tone"] = "success") {
    const id = Date.now();
    setToasts((current) => [...current, { id, title, description, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }

  // Platform Stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Lists & Pagination
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [userPage, setUserPage] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [userTotalPages, setUserTotalPages] = useState(0);

  const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
  const [orgPage, setOrgPage] = useState(0);
  const [orgSearch, setOrgSearch] = useState("");
  const [orgTotalPages, setOrgTotalPages] = useState(0);

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [eventPage, setEventPage] = useState(0);
  const [eventSearch, setEventSearch] = useState("");
  const [eventTotalPages, setEventTotalPages] = useState(0);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postPage, setPostPage] = useState(0);
  const [postSearch, setPostSearch] = useState("");
  const [postTotalPages, setPostTotalPages] = useState(0);

  const [certs, setCerts] = useState<Certificate[]>([]);
  const [certPage, setCertPage] = useState(0);
  const [certSearch, setCertSearch] = useState("");
  const [certTotalPages, setCertTotalPages] = useState(0);

  const [referrals, setReferrals] = useState<ReferralResponse[]>([]);
  const [referralPage, setReferralPage] = useState(0);
  const [referralTotalPages, setReferralTotalPages] = useState(0);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(0);

  const [aiStats, setAiStats] = useState<AiStatsResponse | null>(null);

  // Modals & Selected details
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedEventRegs, setSelectedEventRegs] = useState<ParticipantResponse[]>([]);
  const [showEventRegsModal, setShowEventRegsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [showEventEditModal, setShowEventEditModal] = useState(false);
  const [selectedPostComments, setSelectedPostComments] = useState<PostComment[]>([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentPostId, setCommentPostId] = useState("");

  // Coin Adjustment Form State
  const [coinAmount, setCoinAmount] = useState(10);
  const [coinReason, setCoinReason] = useState("");

  // Role Form State
  const [newRole, setNewRole] = useState("VOLUNTEER");

  // Event Edit Form State
  const [eventEditTitle, setEventEditTitle] = useState("");
  const [eventEditDesc, setEventEditDesc] = useState("");
  const [eventEditCity, setEventEditCity] = useState("");
  const [eventEditAddress, setEventEditAddress] = useState("");
  const [eventEditOnline, setEventEditOnline] = useState(false);
  const [eventEditStatus, setEventEditStatus] = useState("PUBLISHED");

  useEffect(() => {
    const isAnyModalOpen = showUserModal || showCoinModal || showRoleModal || showEventRegsModal || showEventEditModal || showCommentsModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showUserModal, showCoinModal, showRoleModal, showEventRegsModal, showEventEditModal, showCommentsModal]);

  useEffect(() => {
    setError("");
  }, [showUserModal, showCoinModal, showRoleModal, showEventRegsModal, showEventEditModal, showCommentsModal]);

  // Loaders
  async function loadOverview() {
    try {
      const s = await adminApi.stats();
      setStats(s);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadUsers(nextPage = 0) {
    try {
      const res = await adminApi.users(userSearch, nextPage);
      setUsers(res.content);
      setUserPage(nextPage);
      setUserTotalPages(res.totalPages);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadOrgs(nextPage = 0) {
    try {
      const res = await adminOrganizationsApi.list(nextPage, orgSearch);
      setOrgs(res.content);
      setOrgPage(nextPage);
      setOrgTotalPages(res.totalPages);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadEvents(nextPage = 0) {
    try {
      const res = await adminApi.events(eventSearch, nextPage);
      setEvents(res.content);
      setEventPage(nextPage);
      setEventTotalPages(res.totalPages);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadPosts(nextPage = 0) {
    try {
      const res = await adminApi.posts(postSearch, nextPage);
      setPosts(res.content);
      setPostPage(nextPage);
      setPostTotalPages(res.totalPages);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadCerts(nextPage = 0) {
    try {
      const res = await adminApi.certificates(certSearch, nextPage);
      setCerts(res.content);
      setCertPage(nextPage);
      setCertTotalPages(res.totalPages);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadReferrals(nextPage = 0) {
    try {
      const res = await adminApi.referrals(nextPage);
      setReferrals(res.content);
      setReferralPage(nextPage);
      setReferralTotalPages(res.totalPages);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadAuditLogs(nextPage = 0) {
    try {
      const res = await adminApi.auditLogs(nextPage);
      setAuditLogs(res.content);
      setAuditPage(nextPage);
      setAuditTotalPages(res.totalPages);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadAiStats() {
    try {
      const s = await adminApi.aiStats();
      setAiStats(s);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  // Trigger loading based on tab selection
  useEffect(() => {
    setError("");
    if (tab === "overview") void loadOverview();
    else if (tab === "users") void loadUsers(0);
    else if (tab === "orgs") void loadOrgs(0);
    else if (tab === "events") void loadEvents(0);
    else if (tab === "posts") void loadPosts(0);
    else if (tab === "certificates") void loadCerts(0);
    else if (tab === "referrals") void loadReferrals(0);
    else if (tab === "audit") void loadAuditLogs(0);
    else if (tab === "ai") void loadAiStats();
  }, [tab]);

  // Actions
  async function handleVerifyOrg(org: AdminOrganization, verify: boolean) {
    setBusy(org.id);
    setError("");
    try {
      const updated = await adminOrganizationsApi.verify(org.id, verify, verify ? "Approved by Super Admin" : "Approval revoked");
      setOrgs((curr) => curr.map((item) => (item.id === org.id ? updated : item)));
      notify(verify ? "Organization verified" : "Verification revoked", org.organizationName);
      void loadOverview();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleRejectOrg(orgId: string) {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    setBusy(orgId);
    setError("");
    try {
      await adminOrganizationsApi.reject(orgId, reason.trim());
      setOrgs((curr) => curr.filter((item) => item.id !== orgId));
      notify("Organization rejected", reason.trim() || "No reason supplied");
      void loadOverview();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleDeleteOrg(orgId: string) {
    if (!confirm("🚨 WARNING: This will permanently delete this organization, including all their events, chat channels, and posts! This action CANNOT be undone. Are you absolutely sure?")) return;
    setBusy(orgId);
    setError("");
    try {
      await adminApi.deleteOrganization(orgId);
      setOrgs((curr) => curr.filter((o) => o.id !== orgId));
      notify("Organization deleted", "Related records were removed.");
      void loadOverview();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleBanUser(userId: string) {
    const reason = prompt("Enter ban reason:");
    if (reason === null) return;
    setBusy(userId);
    setError("");
    try {
      await adminApi.banUser(userId, reason.trim());
      setUsers((curr) => curr.map((u) => (u.id === userId ? { ...u, banned: true, banReason: reason } : u)));
      notify("User suspended", reason.trim() || "Account access has been disabled.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleUnbanUser(userId: string) {
    if (!confirm("Unban this user?")) return;
    setBusy(userId);
    setError("");
    try {
      await adminApi.unbanUser(userId);
      setUsers((curr) => curr.map((u) => (u.id === userId ? { ...u, banned: false, banReason: undefined } : u)));
      notify("User reactivated", "Account access has been restored.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("🚨 WARNING: This will permanently delete this user, including their chat history, certificates, badges, referrals, coin transactions, and posts! This action cannot be undone. Proceed?")) return;
    setBusy(userId);
    setError("");
    try {
      await adminApi.deleteUser(userId);
      setUsers((curr) => curr.filter((u) => u.id !== userId));
      notify("User deleted", "Related records were removed.");
      void loadOverview();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleViewUserDetail(userId: string) {
    setBusy(userId);
    setError("");
    try {
      const details = await adminApi.userDetail(userId);
      setSelectedUserDetail(details);
      setShowUserModal(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleAdjustCoins(e: FormEvent) {
    e.preventDefault();
    if (!selectedUserDetail) return;
    const userId = selectedUserDetail.user.id;
    setBusy("coins");
    setError("");
    try {
      await adminApi.adjustCoins(userId, coinAmount, coinReason);
      setShowCoinModal(false);
      setCoinReason("");
      notify("Coin balance updated", `${coinAmount > 0 ? "+" : ""}${coinAmount} WeenCoins applied.`);
      // Refresh user details
      const details = await adminApi.userDetail(userId);
      setSelectedUserDetail(details);
      // Refresh users table if tab is active
      void loadUsers(userPage);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleChangeRole(e: FormEvent) {
    e.preventDefault();
    if (!selectedUserDetail) return;
    const userId = selectedUserDetail.user.id;
    setBusy("role");
    setError("");
    try {
      await adminApi.changeRole(userId, newRole);
      setShowRoleModal(false);
      notify("Role updated", `New role: ${newRole}`);
      const details = await adminApi.userDetail(userId);
      setSelectedUserDetail(details);
      void loadUsers(userPage);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleViewEventRegs(eventId: string) {
    setBusy(eventId);
    setError("");
    try {
      const res = await adminApi.eventRegistrations(eventId, 0);
      setSelectedEventRegs(res.content);
      setShowEventRegsModal(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("Are you sure you want to permanently delete this event and revoke all associated certificates?")) return;
    setBusy(eventId);
    setError("");
    try {
      await adminApi.deleteEvent(eventId);
      setEvents((curr) => curr.filter((e) => e.id !== eventId));
      notify("Event deleted");
      void loadOverview();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleOpenEditEvent(event: EventSummary) {
    setSelectedEvent(event);
    setEventEditTitle(event.title);
    setEventEditDesc(event.description || "");
    setEventEditCity(event.city || "");
    setEventEditAddress(event.address || "");
    setEventEditOnline(event.isOnline || false);
    setEventEditStatus(event.status || "PUBLISHED");
    setShowEventEditModal(true);
  }

  async function handleSaveEvent(e: FormEvent) {
    e.preventDefault();
    if (!selectedEvent) return;
    setBusy("edit-event");
    setError("");
    try {
      await adminApi.updateEvent(selectedEvent.id, {
        title: eventEditTitle,
        description: eventEditDesc,
        city: eventEditCity,
        address: eventEditAddress,
        isOnline: eventEditOnline,
        status: eventEditStatus as any
      });
      setShowEventEditModal(false);
      notify("Event updated", eventEditTitle);
      void loadEvents(eventPage);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Permanently delete this post and all comments/likes associated with it?")) return;
    setBusy(postId);
    setError("");
    try {
      await adminApi.deletePost(postId);
      setPosts((curr) => curr.filter((p) => p.id !== postId));
      notify("Post removed");
      void loadOverview();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleViewComments(postId: string) {
    setBusy(postId);
    setError("");
    try {
      const res = await adminApi.postComments(postId, 0);
      setSelectedPostComments(res.content);
      setCommentPostId(postId);
      setShowCommentsModal(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Permanently delete this comment?")) return;
    setBusy(commentId);
    setError("");
    try {
      await adminApi.deleteComment(commentPostId, commentId);
      setSelectedPostComments((curr) => curr.filter((c) => c.id !== commentId));
      notify("Comment removed");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function handleRevokeCert(certId: string) {
    if (!confirm("Revoke this certificate permanently?")) return;
    setBusy(certId);
    setError("");
    try {
      await adminApi.revokeCertificate(certId);
      setCerts((curr) => curr.filter((c) => c.id !== certId));
      notify("Certificate revoked");
      void loadOverview();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  if (!stats && tab === "overview" && !error) return <DashboardSkeleton />;

  return (
    <div className="mx-auto max-w-[1600px] px-1 py-4 sm:px-4 sm:py-6 lg:px-6">
      <ToastViewport messages={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink via-forest to-emerald-700 p-6 text-white shadow-soft sm:p-8 lg:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
          Super Admin Console
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          System Command Center
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-100/70">
          Enforce guidelines, manage privileges, distribute community incentives, and oversee operations platform-wide.
        </p>
      </header>

      {/* Global Alerts */}
      {error && (
        <div className="mt-6">
          <Alert tone="error">
            <span className="font-bold">Error:</span> {error}
          </Alert>
        </div>
      )}

      {/* Navigation Layout - Responsive Sidebar/Top nav */}
      <div className="mt-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-7">
        {/* Navigation Sidebar (Desktop) or Horizontal Scroll (Mobile) */}
        <aside>
          <nav className="flex gap-2 overflow-x-auto border-b border-border pb-4 lg:sticky lg:top-20 lg:flex-col lg:overflow-visible lg:rounded-2xl lg:border lg:bg-white lg:p-2 lg:shadow-sm">
            {moduleNav.map(({ id: t, label, icon: Icon }) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`group relative flex min-h-11 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-left text-sm font-bold transition-all duration-200 ${
                  tab === t
                    ? "bg-emerald-50 text-forest before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-primary"
                    : "text-muted hover:bg-surface hover:text-ink"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${tab === t ? "text-emerald-600" : "text-slate-400 group-hover:text-forest"}`} strokeWidth={1.9} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Panel */}
        <main className="mt-6 min-w-0 lg:mt-0">
          {/* TAB 1: OVERVIEW */}
          {tab === "overview" && stats && (
            <div className="space-y-8 animate-fadeIn">
              {/* Aggregation Stats Grid */}
              <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(statMeta).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return <article
                    key={key}
                    className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className={`grid h-11 w-11 place-items-center rounded-xl ${meta.tone}`}>
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </div>
                    <p className="mt-6 text-3xl font-black text-slate-900">
                      {Number(stats[key as keyof AdminStats] || 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {meta.label}
                    </p>
                  </article>;
                })}
              </section>

              {/* Extra Stats Cards */}
              <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {([
                  ["Verified Orgs", stats.verifiedOrganizations, ShieldCheck],
                  ["Published Events", stats.publishedEvents, CalendarDays],
                  ["Certificates Issued", stats.totalCertificatesIssued, Award],
                  ["Coins Distributed", stats.totalCoinsDistributed, Coins],
                ] as [string, number, LucideIcon][]).map(([label, value, Icon]) => (
                  <div
                    key={String(label)}
                    className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex items-center gap-4"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5" strokeWidth={1.9} /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                      <p className="mt-1 text-xl font-extrabold text-slate-800">
                        {Number(value).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <MetricBarChart
                  title="Organization verification"
                  description="Current verified and pending organizations"
                  color="#26DE81"
                  data={[{ status: "Verified", value: stats.verifiedOrganizations }, { status: "Pending", value: stats.pendingOrganizations }]}
                />
                <MetricBarChart
                  title="Event publishing"
                  description="Published events compared with all other states"
                  color="#174F3B"
                  data={[{ status: "Published", value: stats.publishedEvents }, { status: "Other", value: Math.max(0, stats.totalEvents - stats.publishedEvents) }]}
                />
              </section>
            </div>
          )}

          {/* TAB 2: USERS */}
          {tab === "users" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">User Administration</h2>
                    <p className="mt-1 text-sm text-slate-500">Monitor members, modify privileges, adjust coin balances.</p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void loadUsers(0);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Username or email..."
                      className="h-11 rounded-xl bg-slate-100 px-4 text-sm focus:outline-emerald-600 focus:bg-white transition-all w-full sm:w-64"
                    />
                    <button className="rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                      Search
                    </button>
                  </form>
                </div>

                <div className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <article key={u.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 font-extrabold text-emerald-800 shadow-sm border border-emerald-200">
                        {u.profilePhotoUrl ? (
                          <img src={u.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          u.fullName.slice(0, 2).toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-slate-800 text-sm truncate">{u.fullName}</h3>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                            {u.role}
                          </span>
                          {u.banned && (
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                              BANNED
                            </span>
                          )}
                          {u.isEmailVerified ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              VERIFIED
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-400">
                              UNVERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">@{u.username} · {u.email}</p>
                        {u.banReason && (
                          <p className="mt-2 text-xs text-red-700 bg-red-50/50 p-2 rounded-lg border border-red-100/50">
                            Ban Reason: {u.banReason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void handleViewUserDetail(u.id)}
                          className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
                        >
                          Manage
                        </button>
                        {u.banned ? (
                          <button
                            disabled={busy === u.id}
                            onClick={() => void handleUnbanUser(u.id)}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            disabled={busy === u.id}
                            onClick={() => void handleBanUser(u.id)}
                            className="rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 text-xs font-bold text-red-700 transition-colors"
                          >
                            Ban
                          </button>
                        )}
                        <button
                          disabled={busy === u.id}
                          onClick={() => void handleDeleteUser(u.id)}
                          className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                  {users.length === 0 && (
                    <p className="p-12 text-center text-sm text-slate-400">No users found.</p>
                  )}
                </div>

                <div className="border-t border-slate-100 p-4">
                  <Pagination
                    currentPage={userPage}
                    totalPages={userTotalPages}
                    onPageChange={(page) => void loadUsers(page)}
                  />
                </div>
              </div>
            </div>
          )

          } 
          

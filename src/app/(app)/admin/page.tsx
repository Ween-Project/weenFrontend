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
          )}

          {/* TAB 3: ORGANIZATIONS */}
          {tab === "orgs" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Organization Moderation</h2>
                    <p className="mt-1 text-sm text-slate-500">Review pending validation requests and delete organizational entities.</p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void loadOrgs(0);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={orgSearch}
                      onChange={(e) => setOrgSearch(e.target.value)}
                      placeholder="Org name..."
                      className="h-11 rounded-xl bg-slate-100 px-4 text-sm focus:outline-emerald-600 focus:bg-white transition-all w-full sm:w-64"
                    />
                    <button className="rounded-xl bg-slate-955 px-5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                      Search
                    </button>
                  </form>
                </div>

                <div className="divide-y divide-slate-100">
                  {orgs.map((org) => (
                    <article key={org.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-violet-100 font-extrabold text-violet-800 shadow-sm border border-violet-200">
                        {org.logoUrl ? (
                          <img src={org.logoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          org.organizationName.slice(0, 2).toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-extrabold text-slate-800 text-sm">{org.organizationName}</h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              org.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {org.isVerified ? "APPROVED" : "PENDING"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">@{org.username} · {org.email}</p>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                          {org.description || "No description supplied."}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!org.isVerified ? (
                          <>
                            <button
                              disabled={busy === org.id}
                              onClick={() => void handleVerifyOrg(org, true)}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              disabled={busy === org.id}
                              onClick={() => void handleRejectOrg(org.id)}
                              className="rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 text-xs font-bold text-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            disabled={busy === org.id}
                            onClick={() => void handleVerifyOrg(org, false)}
                            className="rounded-xl border border-red-200 hover:bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-colors"
                          >
                            Revoke Approval
                          </button>
                        )}
                        <button
                          disabled={busy === org.id}
                          onClick={() => void handleDeleteOrg(org.id)}
                          className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                  {orgs.length === 0 && (
                    <p className="p-12 text-center text-sm text-slate-400">No organizations found.</p>
                  )}
                </div>

                <div className="border-t border-slate-100 p-4">
                  <Pagination
                    currentPage={orgPage}
                    totalPages={orgTotalPages}
                    onPageChange={(page) => void loadOrgs(page)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EVENTS */}
          {tab === "events" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Event Moderation</h2>
                    <p className="mt-1 text-sm text-slate-500">Edit event details, oversee registrations, delete inappropriate events.</p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void loadEvents(0);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      placeholder="Search events..."
                      className="h-11 rounded-xl bg-slate-100 px-4 text-sm focus:outline-emerald-600 focus:bg-white transition-all w-full sm:w-64"
                    />
                    <button className="rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                      Search
                    </button>
                  </form>
                </div>

                <div className="divide-y divide-slate-100">
                  {events.map((e) => (
                    <article key={e.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-slate-800 text-sm truncate">{e.title}</h3>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase">
                            {e.category}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                            {e.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          📍 {e.isOnline ? "Online" : `${e.city || "No City"}, ${e.address || ""}`} · 📅 {e.startDate ? new Date(e.startDate).toLocaleString() : "TBD"}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                          {e.description || "No description provided."}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void handleViewEventRegs(e.id)}
                          className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
                        >
                          Participants
                        </button>
                        <button
                          onClick={() => void handleOpenEditEvent(e)}
                          className="rounded-xl bg-slate-950 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          disabled={busy === e.id}
                          onClick={() => void handleDeleteEvent(e.id)}
                          className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                  {events.length === 0 && (
                    <p className="p-12 text-center text-sm text-slate-400">No events found.</p>
                  )}
                </div>

                <div className="border-t border-slate-100 p-4">
                  <Pagination
                    currentPage={eventPage}
                    totalPages={eventTotalPages}
                    onPageChange={(page) => void loadEvents(page)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: POSTS & COMMENTS */}
          {tab === "posts" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Content Moderation</h2>
                    <p className="mt-1 text-sm text-slate-500">Delete inappropriate posts, review comment histories.</p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void loadPosts(0);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={postSearch}
                      onChange={(e) => setPostSearch(e.target.value)}
                      placeholder="Search post content..."
                      className="h-11 rounded-xl bg-slate-100 px-4 text-sm focus:outline-emerald-600 focus:bg-white transition-all w-full sm:w-64"
                    />
                    <button className="rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                      Search
                    </button>
                  </form>
                </div>

                <div className="divide-y divide-slate-100">
                  {posts.map((p) => (
                    <article key={p.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-800 text-xs">
                            {p.author?.fullName ?? "Unknown author"}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(p.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                        {p.mediaUrl && (
                          <img
                            src={p.mediaUrl}
                            alt=""
                            className="mt-3 max-h-48 rounded-xl object-cover border border-slate-100"
                          />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void handleViewComments(p.id)}
                          className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
                        >
                          Comments
                        </button>
                        <button
                          disabled={busy === p.id}
                          onClick={() => void handleDeletePost(p.id)}
                          className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                  {posts.length === 0 && (
                    <p className="p-12 text-center text-sm text-slate-400">No posts found.</p>
                  )}
                </div>

                <div className="border-t border-slate-100 p-4">
                  <Pagination
                    currentPage={postPage}
                    totalPages={postTotalPages}
                    onPageChange={(page) => void loadPosts(page)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BADGES */}
          {tab === "badges" && (
            <div className="animate-fadeIn">
              <BadgeManager />
            </div>
          )}

          {/* TAB 7: CERTIFICATES */}
          {tab === "certificates" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Certificate Oversight</h2>
                    <p className="mt-1 text-sm text-slate-500">Audit credentials, revoke certifications manually.</p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void loadCerts(0);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={certSearch}
                      onChange={(e) => setCertSearch(e.target.value)}
                      placeholder="Certificate number..."
                      className="h-11 rounded-xl bg-slate-100 px-4 text-sm focus:outline-emerald-600 focus:bg-white transition-all w-full sm:w-64"
                    />
                    <button className="rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                      Search
                    </button>
                  </form>
                </div>

                <div className="divide-y divide-slate-100">
                  {certs.map((c) => (
                    <article key={c.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-800 text-sm">#{c.certificateNumber}</h3>
                          {c.eventTitle && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{c.eventTitle}</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          User ID: {c.userId} · Event ID: {c.eventId} · Issued: {new Date(c.issuedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {c.pdfUrl && (
                          <a
                            href={c.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
                          >
                            View PDF
                          </a>
                        )}
                        <button
                          disabled={busy === c.id}
                          onClick={() => void handleRevokeCert(c.id)}
                          className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                        >
                          Revoke
                        </button>
                      </div>
                    </article>
                  ))}
                  {certs.length === 0 && (
                    <p className="p-12 text-center text-sm text-slate-400">No certificates found.</p>
                  )}
                </div>

                <div className="border-t border-slate-100 p-4">
                  <Pagination
                    currentPage={certPage}
                    totalPages={certTotalPages}
                    onPageChange={(page) => void loadCerts(page)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: REFERRALS */}
          {tab === "referrals" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800">Referrals Log</h2>
                  <p className="mt-1 text-sm text-slate-500">Global audit of referrals and distributed coin incentives.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <th className="p-4">Referrer</th>
                        <th className="p-4">Referred</th>
                        <th className="p-4">Coin Awarded</th>
                        <th className="p-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {referrals.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-700">{r.referrerName}</td>
                          <td className="p-4 text-slate-500">{r.referredName}</td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                r.coinAwarded ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {r.coinAwarded ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{new Date(r.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {referrals.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-slate-400">
                            No referrals found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 p-4">
                  <Pagination
                    currentPage={referralPage}
                    totalPages={referralTotalPages}
                    onPageChange={(page) => void loadReferrals(page)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: AI BOT ANALYTICS */}
          {tab === "ai" && aiStats && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800">AI Assistant Oversight</h2>
                <p className="mt-1 text-sm text-slate-500">Live statistics showing chatbot engagement levels.</p>

                <div className="grid gap-6 mt-6 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Chat Messages</p>
                    <p className="mt-3 text-3xl font-black text-slate-800">{aiStats.totalMessages.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distinct Active Users</p>
                    <p className="mt-3 text-3xl font-black text-slate-800">{aiStats.totalUsers.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: AUDIT LOG */}
          {tab === "audit" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800">Security Audit Logs</h2>
                  <p className="mt-1 text-sm text-slate-500">Immutable ledger of administrative and privilege actions.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Action</th>
                        <th className="p-4">Actor</th>
                        <th className="p-4">Target</th>
                        <th className="p-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-4 whitespace-nowrap text-slate-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-700">@{log.actorUsername || "SYSTEM"}</td>
                          <td className="p-4 text-slate-500">{log.targetName || "-"}</td>
                          <td className="p-4 text-slate-500 leading-relaxed">{log.details || "-"}</td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400">
                            No audit logs available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 p-4">
                  <Pagination
                    currentPage={auditPage}
                    totalPages={auditTotalPages}
                    onPageChange={(page) => void loadAuditLogs(page)}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: USER DETAILS */}
      {showUserModal && selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-scaleUp">
            {/* Header */}
            <div className="border-b border-slate-100 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">User Command Panel</h3>
                <p className="text-xs text-slate-400 mt-1">Full profile auditing, roles, and balance adjusting.</p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Profile Overview */}
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-100 pb-6">
                <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-emerald-100 font-extrabold text-emerald-800 text-xl border border-emerald-200 shadow-inner">
                  {selectedUserDetail.user.profilePhotoUrl ? (
                    <img src={selectedUserDetail.user.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    selectedUserDetail.user.fullName.slice(0, 2).toUpperCase()
                  )}
                </span>
                <div className="text-center sm:text-left min-w-0 flex-1">
                  <h4 className="font-extrabold text-slate-800 text-base leading-tight">{selectedUserDetail.user.fullName}</h4>
                  <p className="text-xs text-slate-400 mt-1">@{selectedUserDetail.user.username} · {selectedUserDetail.user.email}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Current Role: <span className="font-bold text-slate-700">{selectedUserDetail.user.role}</span> · Coins: <span className="font-bold text-slate-700">{selectedUserDetail.user.weenCoinBalance ?? 0}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setNewRole(selectedUserDetail.user.role);
                      setShowRoleModal(true);
                    }}
                    className="rounded-xl bg-slate-955 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    Change Role
                  </button>
                  <button
                    onClick={() => setShowCoinModal(true)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    Adjust Coins
                  </button>
                </div>
              </div>

              {/* Grid lists */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Badges Earned */}
                <div className="rounded-2xl border border-slate-100 p-4">
                  <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">🎖️ Badges Earned ({selectedUserDetail.badges.length})</h5>
                  <div className="space-y-2">
                    {selectedUserDetail.badges.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {b.badge.imageUrl ? (
                          <img src={b.badge.imageUrl} alt="" className="h-8 w-8 object-contain" />
                        ) : (
                          <span className="text-base">🎖️</span>
                        )}
                        <div>
                          <p className="font-bold text-slate-700">{b.badge.name}</p>
                          <p className="text-[10px] text-slate-400">Earned: {new Date(b.earnedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                    {selectedUserDetail.badges.length === 0 && (
                      <p className="text-slate-400 text-xs italic">No badges earned yet.</p>
                    )}
                  </div>
                </div>

                {/* Certificates */}
                <div className="rounded-2xl border border-slate-100 p-4">
                  <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">🎓 Certificates Issued ({selectedUserDetail.certificates.length})</h5>
                  <div className="space-y-2">
                    {selectedUserDetail.certificates.map((c) => (
                      <div key={c.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-700">#{c.certificateNumber}</p>
                          <p className="text-[10px] text-slate-400">Issued: {new Date(c.issuedAt).toLocaleDateString()}</p>
                        </div>
                        {c.pdfUrl && (
                          <a
                            href={c.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-emerald-600 hover:underline"
                          >
                            PDF
                          </a>
                        )}
                      </div>
                    ))}
                    {selectedUserDetail.certificates.length === 0 && (
                      <p className="text-slate-400 text-xs italic">No certificates issued yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Attended Events */}
              <div className="rounded-2xl border border-slate-100 p-4">
                <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">📅 Events Attended ({selectedUserDetail.eventsAttended.length})</h5>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedUserDetail.eventsAttended.map((ev) => (
                    <div key={ev.id} className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-700 truncate">{ev.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">📍 {ev.city} · 📅 {new Date(ev.startDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {selectedUserDetail.eventsAttended.length === 0 && (
                    <p className="text-slate-400 text-xs italic md:col-span-2">No events registered.</p>
                  )}
                </div>
              </div>

              {/* Coin Transactions */}
              <div className="rounded-2xl border border-slate-100 p-4">
                <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">🪙 Coin Transaction History ({selectedUserDetail.coinTransactions.length})</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedUserDetail.coinTransactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-700 capitalize">{tx.reason.toLowerCase().replace("_", " ")}</p>
                        <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                      <span
                        className={`font-black ${
                          tx.amount >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                      </span>
                    </div>
                  ))}
                  {selectedUserDetail.coinTransactions.length === 0 && (
                    <p className="text-slate-400 text-xs italic">No transactions recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST COINS */}
      {showCoinModal && selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleAdjustCoins}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 animate-scaleUp space-y-4"
          >
            <h3 className="text-base font-extrabold text-slate-800">Adjust Coin Balance</h3>
            <p className="text-xs text-slate-400">
              Manually add or remove WeenCoins from <b>{selectedUserDetail.user.fullName}</b>.
            </p>

            {error && (
              <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Amount (Use negative for subtraction)</label>
              <input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                className="w-full h-11 bg-slate-100 rounded-xl px-4 text-sm focus:outline-emerald-600 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Auditable Reason</label>
              <input
                type="text"
                value={coinReason}
                onChange={(e) => setCoinReason(e.target.value)}
                placeholder="Compensation for event postponement"
                className="w-full h-11 bg-slate-100 rounded-xl px-4 text-sm focus:outline-emerald-600 focus:bg-white"
                required
              />
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowCoinModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy === "coins"}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white"
              >
                Apply Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: CHANGE ROLE */}
      {showRoleModal && selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleChangeRole}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 animate-scaleUp space-y-4"
          >
            <h3 className="text-base font-extrabold text-slate-800">Privilege Role Settings</h3>
            <p className="text-xs text-slate-400">
              Escalate or revoke privileges for <b>{selectedUserDetail.user.fullName}</b>.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Security Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full h-11 bg-slate-100 rounded-xl px-4 text-sm focus:outline-emerald-600 focus:bg-white"
              >
                <option value="VOLUNTEER">VOLUNTEER</option>
                <option value="ORGANIZER">ORGANIZER</option>
                <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN</option>
                <option value="ADMIN">ADMIN (Super Admin)</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy === "role"}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white"
              >
                Save Role
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: EVENT PARTICIPANTS */}
      {showEventRegsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl p-6 animate-scaleUp space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-800">Event Registrants</h3>
              <button
                onClick={() => setShowEventRegsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {selectedEventRegs.map((reg) => (
                <div key={reg.id} className="flex justify-between items-center py-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-700">{reg.fullName}</p>
                    <p className="text-[10px] text-slate-400">@{reg.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Registered: {new Date(reg.registeredAt).toLocaleDateString()}</p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[8px] font-bold mt-1 ${
                        reg.isJoined ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {reg.isJoined ? "Checked-In" : "Registered"}
                    </span>
                  </div>
                </div>
              ))}
              {selectedEventRegs.length === 0 && (
                <p className="p-8 text-center text-slate-400 text-xs italic">No participants registered yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT EVENT */}
      {showEventEditModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEvent}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 animate-scaleUp space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-base font-extrabold text-slate-800">Edit Event Overrides</h3>
            <p className="text-xs text-slate-400">Modify details or update status override platform-wide.</p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Event Title</label>
              <input
                type="text"
                value={eventEditTitle}
                onChange={(e) => setEventEditTitle(e.target.value)}
                className="w-full h-11 bg-slate-100 rounded-xl px-4 text-sm focus:outline-emerald-600 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
              <textarea
                value={eventEditDesc}
                onChange={(e) => setEventEditDesc(e.target.value)}
                rows={3}
                className="w-full bg-slate-100 rounded-xl p-3 text-sm focus:outline-emerald-600 focus:bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">City</label>
                <input
                  type="text"
                  value={eventEditCity}
                  onChange={(e) => setEventEditCity(e.target.value)}
                  className="w-full h-11 bg-slate-100 rounded-xl px-4 text-sm focus:outline-emerald-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Status Override</label>
                <select
                  value={eventEditStatus}
                  onChange={(e) => setEventEditStatus(e.target.value)}
                  className="w-full h-11 bg-slate-100 rounded-xl px-4 text-sm focus:outline-emerald-600"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Address / URL</label>
              <input
                type="text"
                value={eventEditAddress}
                onChange={(e) => setEventEditAddress(e.target.value)}
                className="w-full h-11 bg-slate-100 rounded-xl px-4 text-sm focus:outline-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="editOnline"
                checked={eventEditOnline}
                onChange={(e) => setEventEditOnline(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <label htmlFor="editOnline" className="text-xs font-bold text-slate-600">
                This is an online event
              </label>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowEventEditModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy === "edit-event"}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 6: POST COMMENTS VIEW & MODERATION */}
      {showCommentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl p-6 animate-scaleUp space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-800">Post Comments ({selectedPostComments.length})</h3>
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setCommentPostId("");
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {selectedPostComments.map((c) => (
                <div key={c.id} className="py-3 text-xs flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-700">@{c.author.username}</p>
                      <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{c.content}</p>
                  </div>
                  <button
                    disabled={busy === c.id}
                    onClick={() => void handleDeleteComment(c.id)}
                    className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 text-[10px] font-bold text-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {selectedPostComments.length === 0 && (
                <p className="p-8 text-center text-slate-400 text-xs italic">No comments on this post.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

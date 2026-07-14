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

  
}

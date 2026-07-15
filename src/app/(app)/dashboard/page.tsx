"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, eventsApi, postsApi, organizationsApi } from "@/lib/api";
import { PostForm } from "@/components/posts/PostForm";
import { PostCard } from "@/components/posts/PostCard";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { Pagination } from "@/components/ui/Pagination";
import { QrScannerModal } from "@/components/qr/QrScannerModal";
import { ScanLine } from "lucide-react";
import type { EventSummary, Post } from "@/types";

const badgeColors = [
  "bg-emerald-500",
  "bg-orange-500",
  "bg-blue-500",
  "bg-purple-500",
];

const formatMonth = (dateStr: string) => {
  const date = new Date(dateStr);
  const monthName = date.toLocaleString("en-US", { month: "short" });
  if (monthName.toLowerCase() === "jul") {
    return "July";
  }
  return monthName.toUpperCase();
};

const formatDay = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.getDate();
};

export default function DashboardPage() {
  const { account } = useAuth();
  if (account?.role === "ORGANIZATION_ADMIN") {
    return <OrganizationDashboard />;
  }
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState("");
  const [postPage, setPostPage] = useState(0);
  const [totalPostPages, setTotalPostPages] = useState(0);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<"All" | "Events" | "Blogs" | "Following">("All");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<"Event Date" | "Most Relevant" | "Registration Deadline" | "Most Popular">("Most Relevant");
  const canPost = true;

  const getBackendEventSort = (sortOption: string) => {
    switch (sortOption) {
      case "Event Date":
        return "startDate";
      case "Registration Deadline":
        return "registrationDeadline";
      case "Most Popular":
      case "Most Relevant":
      default:
        return "createdAt";
    }
  };

  const getBackendPostSort = (sortOption: string) => {
    return "createdAt,desc";
  };

  const loadPosts = useCallback(async (nextPage = 0) => {
    setLoadingPosts(true);
    setError("");
    const postSort = getBackendPostSort(sortBy);
    try {
      const pageResult = activeFilterTab === "Following"
        ? await postsApi.following({ page: nextPage, size: 10 })
        : await postsApi.list({ page: nextPage, size: 10, sort: postSort });
      setPosts(pageResult.content);
      setPostPage(nextPage);
      setTotalPostPages(pageResult.totalPages);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoadingPosts(false);
    }
  }, [sortBy, activeFilterTab]);

  useEffect(() => {
    setLoading(true);
    setError("");
    setPostPage(0);

    const eventSort = getBackendEventSort(sortBy);
    const postSort = getBackendPostSort(sortBy);

    const fetchPosts = activeFilterTab === "Following"
      ? postsApi.following({ page: 0, size: 10 })
      : postsApi.list({ page: 0, size: 10, sort: postSort });

    Promise.all([
      fetchPosts,
      eventsApi.list({ page: 0, size: 8, sort: eventSort })
    ])
      .then(([postResult, eventPage]) => {
        setPosts(postResult.content);
        setTotalPostPages(postResult.totalPages);
        setEvents(eventPage.content);
      })
      .catch((cause) => setError(errorMessage(cause)))
      .finally(() => setLoading(false));
  }, [sortBy, activeFilterTab]);

  const getFilteredFeedContent = () => {
    if (activeFilterTab === "Events") {
      if (!events.length) {
        return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No events found.</div>;
      }
      return events.map((event) => <EventFeedCard key={event.id} event={event} />);
    }
    
    if (activeFilterTab === "Blogs" || activeFilterTab === "Following") {
      if (!posts.length) {
        return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No posts found.</div>;
      }
      return posts.map((post) => (
        <PostCard key={post.id} post={post} onChange={(next) => setPosts((current) => current.map((item) => item.id === next.id ? next : item))} />
      ));
    }

    // Default: "All"
    return <>
      {posts.map((post, index) => (
        <div key={post.id} className="space-y-5">
          <PostCard post={post} onChange={(next) => setPosts((current) => current.map((item) => item.id === next.id ? next : item))} />
          {index % 3 === 1 && events[index % Math.max(events.length, 1)] && (
            <EventFeedCard event={events[index % events.length]} />
          )}
        </div>
      ))}
      {!posts.length && events.map((event) => <EventFeedCard key={event.id} event={event} />)}
      {!posts.length && !events.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">Your feed is ready for the first post or event.</div>
      )}
    </>;
  };

  return (
    <div className="-mt-2 mx-auto grid max-w-[1280px] gap-6 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-5">
        {events.length > 0 && (
          <section className="flex gap-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="w-20 shrink-0 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 p-[3px]">
                  <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-white text-xl">
                    {event.coverImageUrl ? (
                      <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      "✦"
                    )}
                  </span>
                </span>
                <span className="mt-2 block truncate text-[11px] font-bold text-slate-600">{event.title}</span>
              </Link>
            ))}
          </section>
        )}
        
        {/* Feed Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-end pb-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <span>Sort by: <span className="font-extrabold text-slate-800">{sortBy}</span></span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                  <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-20">
                    {(["Event Date", "Most Relevant", "Registration Deadline", "Most Popular"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSortBy(option);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition hover:bg-slate-50 ${
                          sortBy === option ? "text-emerald-700 bg-emerald-50/50" : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["All", "Events", "Blogs", "Following"] as const).map((tab) => {
              const active = activeFilterTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFilterTab(tab)}
                  className={`rounded-full px-5 py-1.5 text-sm font-bold transition ${
                    active
                      ? "bg-[#047857] text-white shadow-sm"
                      : "border border-slate-200 bg-[#F8FAFC] text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </section>

        {error && <Alert>{error}</Alert>}
        
        {loading ? (
          <Loading label="Loading your feed…" />
        ) : (
          <div className="space-y-5">
            {getFilteredFeedContent()}
            {(activeFilterTab === "All" || activeFilterTab === "Blogs" || activeFilterTab === "Following") && (
              <div className="mt-6 border-t pt-4">
                <Pagination
                  currentPage={postPage}
                  totalPages={totalPostPages}
                  onPageChange={(page) => void loadPosts(page)}
                  isLoading={loadingPosts}
                />
              </div>
            )}
          </div>
        )}
      </div>
      <aside className="hidden space-y-5 xl:block">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 font-black">
              {(account?.fullName || account?.username || "WE").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-extrabold">{account?.fullName || account?.organizationName}</p>
              <p className="truncate text-xs text-slate-400">@{account?.username}</p>
            </div>
          </div>
          <Link href="/settings" className="mt-4 block rounded-xl bg-slate-50 py-2.5 text-center text-xs font-extrabold text-slate-700">
            View profile
          </Link>
        </div>
        
        {/* Upcoming events card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-extrabold text-slate-800 text-[17px] mb-4">Upcoming Events</h3>
          <div className="space-y-4">
            {events.slice(0, 3).map((event, index) => (
              <div key={event.id}>
                <Link href={`/events/${event.id}`} className="flex items-center gap-3">
                  <span className={`grid h-12 w-12 shrink-0 place-content-center rounded-xl text-white ${badgeColors[index % badgeColors.length]}`}>
                    <span className="block text-center text-[10px] font-bold uppercase leading-none tracking-wider">{formatMonth(event.startDate)}</span>
                    <span className="block text-center text-lg font-black leading-none mt-1">{formatDay(event.startDate)}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-slate-800">{event.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-500 font-medium truncate">
                      {event.isOnline ? "Online" : [event.city, event.address].filter(Boolean).join(', ') || "Location TBA"}
                    </span>
                  </span>
                </Link>
                <hr className="mt-4 border-slate-100" />
              </div>
            ))}
            <div className="pt-2 text-center">
              <Link href="/events" className="text-sm font-extrabold text-emerald-700 hover:text-emerald-800 transition">
                View All Calendar
              </Link>
            </div>
          </div>
        </div>

        <p className="px-2 text-[11px] leading-5 text-slate-400">Ween · Community · Events · Impact</p>
      </aside>

      {/* Floating Post CTA Button Wrapper */}
      {canPost && (
        <div className="pointer-events-none fixed bottom-24 right-6 lg:bottom-8 lg:left-[244px] lg:right-0 z-50 flex justify-end lg:justify-center">
          <div className="lg:max-w-[1280px] lg:w-full lg:px-3 sm:px-6 lg:px-8 flex lg:justify-start justify-end">
            <div className="lg:w-full lg:xl:w-[calc(100%-364px)] flex lg:justify-center justify-end">
              <button
                type="button"
                onClick={() => setIsPostModalOpen(true)}
                className="pointer-events-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                aria-label="Create post"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Creator Modal */}
      {canPost && (
        <PostForm
          inline={false}
          isOpen={isPostModalOpen}
          setIsOpen={setIsPostModalOpen}
          onSaved={(post) => setPosts((current) => [post, ...current])}
        />
      )}
    </div>
  );
}

function EventFeedCard({ event }: { event: EventSummary }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-emerald-600">Featured event</p>
          <p className="mt-1 text-sm font-bold">{event.organizationName || "Ween community"}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">
          {event.category.replaceAll("_", " ")}
        </span>
      </div>
      <div className="h-64 bg-gradient-to-br from-emerald-900 to-cyan-700">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center px-8 text-center text-3xl font-black text-white">{event.title}</div>
        )}
      </div>
      <div className="p-5">
        <h2 className="text-xl font-black">{event.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-slate-500">
            {new Date(event.startDate).toLocaleString()} · {event.isOnline ? "Online" : event.city || "Location TBA"}
          </p>
          <Link href={`/events/${event.id}`} className="shrink-0 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white">
            View event
          </Link>
        </div>
      </div>
    </article>
  );
}

function OrganizationDashboard() {
  const { account } = useAuth();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [scanEvent, setScanEvent] = useState<EventSummary | null>(null);
  const pageSize = 5;

  useEffect(() => {
    async function load() {
      if (!account?.id) return;
      setLoading(true);
      setError("");
      try {
        const [eventList, profileDetails] = await Promise.all([
          organizationsApi.events(),
          organizationsApi.get(account.id)
        ]);
        setEvents(eventList);
        setIsVerified(profileDetails.isVerified);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [account?.id]);

  const totalPages = Math.ceil(events.length / pageSize);
  const visibleEvents = events.slice(page * pageSize, (page + 1) * pageSize);

  const totalRegistrations = events.reduce((acc, curr) => acc + (curr.currentRegistrations || 0), 0);
  const totalCapacity = events.reduce((acc, curr) => acc + (curr.maxParticipants || 0), 0);
  const activeEvents = events.filter((e) => e.status === "PUBLISHED").length;
  const draftEvents = events.filter((e) => e.status === "DRAFT").length;

  if (loading) return <Loading label="Loading workspace..." />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">Workspace</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {account?.organizationName || "Organization Dashboard"}
          </h1>
        </div>
        <Link
          href="/events/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 px-5 text-sm font-bold text-white transition-colors"
        >
          Create event
        </Link>
      </div>

      {!isVerified && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 animate-fadeIn">
          <b>Approval pending.</b> Your organization profile is currently being reviewed by our super administrators. You can build drafts, but events can only be published once verified.
        </div>
      )}

      {error && <Alert>{error}</Alert>}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Events</p>
          <p className="mt-2 text-2xl font-black text-slate-800">{events.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Volunteers</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{totalRegistrations}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Campaigns</p>
          <p className="mt-2 text-2xl font-black text-cyan-600">{activeEvents}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drafts</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{draftEvents}</p>
        </div>
      </div>

      {/* Events List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black border-b pb-4 mb-4">My Events</h2>
        {events.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500 font-semibold">No events created yet.</p>
            <Link href="/events/new" className="mt-3 inline-block text-xs font-bold text-emerald-700 hover:underline">
              Create your first event now →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleEvents.map((event) => {
              const registrationPct = event.maxParticipants
                ? Math.min(100, Math.round(((event.currentRegistrations || 0) / event.maxParticipants) * 100))
                : 0;

              return (
                <div
                  key={event.id}
                  className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex gap-4 items-center min-w-0">
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-emerald-100 overflow-hidden border border-slate-200">
                      {event.coverImageUrl ? (
                        <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-xs font-bold text-emerald-700">
                          Ween
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-extrabold text-slate-800 text-base">{event.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(event.startDate).toLocaleDateString()} · {event.category.replaceAll("_", " ")}
                      </p>
                      <span className={`inline-block mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        event.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-800"
                          : event.status === "DRAFT"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>

                  {/* Registration Progress */}
                  <div className="sm:max-w-xs w-full flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Registrations</span>
                      <span>
                        {event.currentRegistrations || 0} / {event.maxParticipants || "∞"} ({registrationPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                        style={{ width: `${registrationPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                    {["PUBLISHED", "REGISTRATION_CLOSED", "ONGOING"].includes(event.status) && (
                      <button
                        type="button"
                        onClick={() => setScanEvent(event)}
                        className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 sm:col-span-1"
                      >
                        <ScanLine className="h-4 w-4" /> Scan QR
                      </button>
                    )}
                    <Link
                      href={`/events/${event.id}`}
                      className="rounded-xl border border-slate-200 hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition"
                    >
                      Edit Event
                    </Link>
                  </div>
                </div>
              );
            })}

            <div className="mt-6 border-t pt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </div>
        )}
      </div>

      {scanEvent && (
        <QrScannerModal
          open
          eventId={scanEvent.id}
          eventTitle={scanEvent.title}
          onClose={() => setScanEvent(null)}
        />
      )}
    </div>
  );
}

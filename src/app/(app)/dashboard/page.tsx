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
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <img src="/images/filter-icon.png" alt="" className="w-4 h-4 object-contain shrink-0" />
              <span className="text-sm font-semibold text-slate-500">Filter by: <span className="font-extrabold text-slate-800">Organizations</span></span>
            </div>
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
        </section>
        </div>
    </div>   
  );
}
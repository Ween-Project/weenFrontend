"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  certificatesApi,
  errorMessage,
  networkApi,
  socialProfileApi,
} from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import type {
  Certificate,
  EventSummary,
  Post,
  PublicProfile,
  UserBadge,
} from "@/types";

type Tab = "posts" | "reposts" | "events" | "certificates" | "liked" | "saved";

function tags(value?: string) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // Older profiles store tags as comma-separated text.
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export default function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const { account } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState("");
  const [referralOpen, setReferralOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const username = decodeURIComponent(params.username);
  const own = account?.username === username;
  const skills = useMemo(() => tags(profile?.skills), [profile?.skills]);
  const interests = useMemo(
    () => tags(profile?.interests),
    [profile?.interests],
  );
  const referralLink =
    typeof window === "undefined" || !profile?.referralCode
      ? ""
      : `${window.location.origin}/register?refferalCode=${encodeURIComponent(profile.referralCode)}`;

  useEffect(() => {
    networkApi
      .profile(username)
      .then(setProfile)
      .catch((cause) => setError(errorMessage(cause)))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    socialProfileApi
      .badges(profile.id)
      .then(setBadges)
      .catch(() => setBadges([]));
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setContentLoading(true);
    setError("");
    const task =
      tab === "posts"
        ? socialProfileApi.posts(profile.id)
        : tab === "reposts"
          ? socialProfileApi.reposts(profile.id)
          : tab === "events"
            ? socialProfileApi.events(profile.id)
            : tab === "certificates"
              ? socialProfileApi.certificates(profile.id)
              : tab === "liked"
                ? socialProfileApi.liked()
                : socialProfileApi.saved();
    task
      .then((page) => {
        if (tab === "events") setEvents(page.content as EventSummary[]);
        else if (tab === "certificates")
          setCertificates(page.content as Certificate[]);
        else setPosts(page.content as Post[]);
      })
      .catch((cause) => setError(errorMessage(cause)))
      .finally(() => setContentLoading(false));
  }, [profile, tab]);

  async function copyReferral() {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareReferral() {
    if (!referralLink) return;
    if (navigator.share) {
      await navigator.share({
        title: "Join me on Ween",
        text: "Use my referral link to join Ween and start building your impact profile.",
        url: referralLink,
      });
      return;
    }
    await copyReferral();
  }

  async function downloadCertificate(certificate: Certificate) {
    try {
      const blob = await certificatesApi.download(certificate.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${certificate.certificateNumber || certificate.id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function deleteCertificate(certificate: Certificate) {
    if (!confirm("Delete this certificate permanently?")) return;
    try {
      await certificatesApi.delete(certificate.id);
      setCertificates((current) =>
        current.filter((item) => item.id !== certificate.id),
      );
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function toggleFollow() {
    if (!profile) return;
    try {
      if (profile.following) {
        await networkApi.unfollow(profile.id);
        setProfile((current) =>
          current
            ? {
                ...current,
                following: false,
                followerCount: Math.max(0, (current.followerCount || 0) - 1),
              }
            : null,
        );
      } else {
        await networkApi.follow(profile.id);
        setProfile((current) =>
          current
            ? {
                ...current,
                following: true,
                followerCount: (current.followerCount || 0) + 1,
              }
            : null,
        );
      }
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }   

  if (loading) return <Loading label="Loading profile…" />;
  if (!profile) return <Alert>{error || "Profile not found."}</Alert>;

  const tabs: Tab[] = own
    ? ["posts", "reposts", "events", "certificates", "liked", "saved"]
    : ["posts", "reposts", "events", "certificates"];
  const initials = profile.fullName.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-[1440px] text-[#1F2937]">
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_8px_30px_rgba(31,41,55,.05)]">
          <div className="relative h-44 bg-gradient-to-br from-[#12372a] via-[#176b4d] to-[#26DE81] sm:h-64">
            {profile.bannerUrl && (
              <img
                src={profile.bannerUrl}
                alt={`${profile.fullName}'s banner`}
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            {own && (
              <Link
                href="/settings"
                aria-label="Edit banner"
                className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-[#1F2937] shadow-lg transition hover:scale-105"
              >
                <Icon>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z" />
                </Icon>
              </Link>
            )}
          </div>

          <div className="relative px-5 pb-7 sm:px-8 lg:px-10">
            <div className="-mt-14 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end">
              <span className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full border-[5px] border-white bg-[#DDFBEA] text-3xl font-extrabold text-emerald-900 shadow-sm sm:h-40 sm:w-40">
                {profile.profilePhotoUrl ? (
                  <img
                    src={profile.profilePhotoUrl}
                    alt={profile.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </span>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[28px] font-extrabold leading-tight tracking-[-.02em] sm:text-4xl">
                    {profile.fullName}
                  </h1>
                  <span
                    title="Verified Ween profile"
                    className="grid h-6 w-6 place-items-center rounded-full bg-[#26DE81] text-xs font-black text-white"
                  >
                    ✓
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-[#6B7280]">
                  @{profile.username}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pb-1">
                {own ? (
                  <>
                    <Link
                      href="/settings"
                      className="rounded-full border border-[#1F2937] px-5 py-2.5 text-sm font-bold transition hover:bg-[#F8FAFC]"
                    >
                      Edit profile
                    </Link>
                    {profile.referralCode && (
                      <button
                        type="button"
                        onClick={() => setReferralOpen(true)}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#B7791F] to-[#E5A62E] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5"
                      >
                        <Icon className="h-4 w-4">
                          <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 16V3M7 8l5-5 5 5" />
                        </Icon>
                        Share referral
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => void toggleFollow()}
                      className="rounded-full bg-[#26DE81] px-6 py-2.5 text-sm font-extrabold text-[#12372a] transition hover:brightness-95"
                    >
                      {profile.following ? "Following" : "Follow"}
                    </button>
                    {profile.canMessage && (
                      <Link
                        href={`/messages/${profile.id}?username=${profile.username}&fullName=${encodeURIComponent(profile.fullName)}&photoUrl=${encodeURIComponent(profile.profilePhotoUrl || "")}`}
                        className="rounded-full border border-[#1F2937] px-6 py-2.5 text-sm font-bold"
                      >
                        Message
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <p className="text-lg font-semibold leading-7">
                  {profile.major || "Ween community member"}
                  {profile.course ? ` · ${profile.course}` : ""}
                </p>
                {profile.bio && (
                  <p className="mt-3 max-w-3xl text-base leading-7 text-[#4B5563]">
                    {profile.bio}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
                  <span className="text-emerald-700">
                    {profile.followerCount || 0} followers
                  </span>
                  <span className="text-emerald-700">
                    {profile.followingCount || 0} following
                  </span>
                  <span className="text-[#B7791F]">
                    {profile.weenCoinBalance || 0} impact coins
                  </span>
                </div>
              </div>
              {profile.university && (
                <div className="flex items-start gap-3 rounded-xl bg-[#F8FAFC] p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm">
                    <Icon>
                      <path d="M3 10l9-5 9 5-9 5z" />
                      <path d="M7 12v5c3 2 7 2 10 0v-5M4 20h16" />
                    </Icon>
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6B7280]">
                      Education
                    </p>
                    <p className="mt-1 text-sm font-extrabold leading-5">
                      {profile.university}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="col-span-12 space-y-6 lg:col-span-8">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold tracking-[-.02em]">
                About
              </h2>
              {own && (
                <Link
                  href="/settings"
                  className="text-sm font-bold text-emerald-700"
                >
                  Edit
                </Link>
              )}
            </div>
            <p className="mt-4 text-base leading-7 text-[#4B5563]">
              {profile.bio || "This member has not added a bio yet."}
            </p>
            {interests.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-bold text-[#6B7280]">Interests</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {interests.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-[#E8551B]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold tracking-[-.02em]">
                Education
              </h2>
              {own && (
                <Link
                  href="/settings"
                  aria-label="Edit education"
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#F8FAFC]"
                >
                  <Icon>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z" />
                  </Icon>
                </Link>
              )}
            </div>
            {profile.university ? (
              <div className="mt-6 flex gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-7 w-7">
                    <path d="M3 10l9-5 9 5-9 5z" />
                    <path d="M7 12v5c3 2 7 2 10 0v-5M4 20h16" />
                  </Icon>
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">
                    {profile.university}
                  </h3>
                  <p className="mt-1 text-base text-[#4B5563]">
                    {profile.major || "Field of study not specified"}
                  </p>
                  {profile.course && (
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {profile.course}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#6B7280]">
                Education details have not been added yet.
              </p>
            )}
          </section>

          {skills.length > 0 && (
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold tracking-[-.02em]">
                Skills
              </h2>
              <div className="mt-5 divide-y divide-[#E5E7EB]">
                {skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                      ◆
                    </span>
                    <span className="font-bold">{skill}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="col-span-12 space-y-6 lg:col-span-4">
          {own && profile.referralCode && (
            <section className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-[#FFF9E8] to-white p-6">
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[.14em] text-[#9A6700]">
                Referral rewards
              </span>
              <h2 className="mt-4 text-2xl font-extrabold leading-tight">
                Grow the community together.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#6B7280]">
                Invite a friend with your personal link. Your code is revealed
                in the sharing panel.
              </p>
              <button
                type="button"
                onClick={() => setReferralOpen(true)}
                className="mt-5 w-full rounded-full bg-gradient-to-r from-[#B7791F] to-[#E5A62E] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-amber-500/20"
              >
                Share referral link
              </button>
            </section>
          )}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="text-xl font-extrabold">Impact snapshot</h2>
            <dl className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-[#6B7280]">Events joined</dt>
                <dd className="font-extrabold">{events.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-[#6B7280]">Certificates</dt>
                <dd className="font-extrabold">{certificates.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-[#6B7280]">Impact coins</dt>
                <dd className="font-extrabold text-[#B7791F]">
                  {profile.weenCoinBalance || 0}
                </dd>
              </div>
            </dl>
          </section>
        </aside>

       <section className="col-span-12 rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#E8551B]">
                Achievements
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-.02em]">
                Badges earned
              </h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-extrabold text-emerald-800">
              {badges.length} unlocked
            </span>
          </div>
          {badges.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {badges.map(({ id, badge, earnedAt }) => (
                <article
                  key={id}
                  className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-5 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFD66B] to-[#26DE81] text-3xl shadow-inner">
                      {badge.imageUrl ? (
                        <img
                          src={badge.imageUrl}
                          alt={`${badge.name} badge`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        "★"
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className="rounded-full bg-white/80 px-2 py-1 text-[9px] font-black text-[#9A6700]">
                        {badge.type}
                      </span>
                      <h3 className="mt-2 font-extrabold leading-5">
                        {badge.name}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#6B7280]">
                    {badge.description || "A Ween community achievement."}
                  </p>
                  <p className="mt-4 text-xs font-bold text-emerald-700">
                    Earned {new Date(earnedAt).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F8FAFC] p-10 text-center">
              <div className="text-4xl">☆</div>
              <p className="mt-3 font-extrabold">The first badge is waiting.</p>
              <p className="mt-1 text-sm text-[#6B7280]">
                Complete achievements and attend events to unlock badges.
              </p>
            </div>
          )}
        </section>

        <section className="col-span-12">
          <nav className="flex overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white p-1.5">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`min-w-max flex-1 rounded-xl px-4 py-3 text-sm font-extrabold capitalize transition ${tab === item ? "bg-emerald-50 text-emerald-800" : "text-[#6B7280] hover:bg-[#F8FAFC]"}`}
              >
                {item}
              </button>
            ))}
          </nav>
          {error && (
            <div className="mt-4">
              <Alert>{error}</Alert>
            </div>
          )}
          {contentLoading ? (
            <Loading label={`Loading ${tab}…`} />
          ) : tab === "events" ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white"
                >
                  <div className="h-40 bg-emerald-100">
                    {event.coverImageUrl && (
                      <img
                        src={event.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-extrabold">{event.title}</h3>
                    <p className="mt-2 text-sm text-[#6B7280]">
                      {new Date(event.startDate).toLocaleDateString()} ·{" "}
                      {event.city || "Online"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : tab === "certificates" ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {certificates.map((certificate) => (
                <article
                  key={certificate.id}
                  className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6"
                >
                  <p className="text-xs font-extrabold uppercase tracking-widest text-amber-700">
                    Verified certificate
                  </p>
                  <h3 className="mt-3 text-lg font-extrabold">
                    {certificate.eventTitle ||
                      `Certificate ${certificate.certificateNumber}`}
                  </h3>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    Issued {new Date(certificate.issuedAt).toLocaleDateString()}
                  </p>
                  {own && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => void downloadCertificate(certificate)}
                        className="rounded-full bg-amber-600 px-4 py-2 text-xs font-black text-white"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={() => void deleteCertificate(certificate)}
                        className="rounded-full border border-red-200 px-4 py-2 text-xs font-black text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-1 sm:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="group relative aspect-square overflow-hidden bg-[#F8FAFC]"
                >
                  {post.mediaUrl ? (
                    <img
                      src={post.mediaUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center p-6 text-center text-sm font-bold text-[#4B5563]">
                      {post.content}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 p-4 pt-10 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
                    ♥ {post.likeCount} · ◇ {post.commentCount}
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!contentLoading &&
            ((tab === "events" && !events.length) ||
              (tab === "certificates" && !certificates.length) ||
              (!["events", "certificates"].includes(tab) && !posts.length)) && (
              <div className="mt-6 rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-12 text-center text-sm text-[#6B7280]">
                Nothing to show here yet.
              </div>
            )}
        </section>
      </div>

      {referralOpen && profile.referralCode && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="referral-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setReferralOpen(false);
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-[#8A5B00] via-[#C48713] to-[#E5A62E] p-7 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.18em] text-amber-100">
                    Your referral
                  </p>
                  <h2
                    id="referral-title"
                    className="mt-2 text-3xl font-extrabold tracking-[-.03em]"
                  >
                    Invite. Connect. Earn.
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setReferralOpen(false)}
                  aria-label="Close referral dialog"
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-xl"
                >
                  ×
                </button>
              </div>
              <p className="mt-4 max-w-md text-sm leading-6 text-amber-50">
                Share this personal link. The referral code will be filled
                automatically when your friend opens registration.
              </p>
            </div>
            <div className="p-7">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6B7280]">
                Referral code
              </p>
              <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-3xl font-black tracking-[.18em] text-[#8A5B00]">
                {profile.referralCode}
              </div>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-[.16em] text-[#6B7280]">
                Shareable link
              </p>
              <div className="mt-2 break-all rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm font-medium text-[#4B5563]">
                {referralLink}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void copyReferral()}
                  className="rounded-full border border-[#1F2937] px-5 py-3 text-sm font-extrabold"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <button
                  type="button"
                  onClick={() => void shareReferral()}
                  className="rounded-full bg-[#26DE81] px-5 py-3 text-sm font-extrabold text-[#12372a]"
                >
                  Share now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

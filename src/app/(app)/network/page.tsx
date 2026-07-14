"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { networkApi, errorMessage } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { Pagination } from "@/components/ui/Pagination";
import type { LeaderboardEntry, PublicProfile } from "@/types";
import { useAuth } from "@/lib/auth-context";

function splitTags(value?: string) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

export default function NetworkPage() {
  const { account } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [people, setPeople] = useState<PublicProfile[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [peoplePage, setPeoplePage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState("");

  async function loadPeople(nextPage = 0) {
    setSearching(true);
    setError("");
    try {
      const page = await networkApi.search(query.trim(), nextPage);
      setPeople(page.content);
      setPeoplePage(nextPage);
      setTotalPages(page.totalPages);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    Promise.all([networkApi.leaderboard(), networkApi.search("")])
      .then(([leaders, users]) => {
        setEntries(leaders.content);
        setPeople(users.content);
        setTotalPages(users.totalPages);
      })
      .catch((cause) => setError(errorMessage(cause)))
      .finally(() => setLoading(false));
  }, []);

  async function search(e: FormEvent) {
    e.preventDefault();
    await loadPeople(0);
  }

  async function follow(userId: string) {
    try {
      const person = people.find((p) => p.id === userId);
      if (!person) return;
      if (person.following) {
        await networkApi.unfollow(userId);
        setPeople((current) => current.map((p) => p.id === userId ? { ...p, following: false } : p));
      } else {
        await networkApi.follow(userId);
        setPeople((current) => current.map((p) => p.id === userId ? { ...p, following: true } : p));
      }
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <header className="border-b p-5 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-600">Grow your network</p>
          <h1 className="mt-2 text-2xl font-black">Discover people</h1>
          <form onSubmit={(e) => void search(e)} className="mt-5 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, university, major or skill"
              className="h-12 min-w-0 flex-1 rounded-full bg-slate-100 px-5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              disabled={searching}
              className="rounded-full bg-emerald-600 px-6 text-sm font-bold text-white"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </form>
        </header>

        {error && <div className="p-5"><Alert>{error}</Alert></div>}

        {loading ? (
          <Loading label="Loading people…" />
        ) : people.length ? (
          <>
            <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
              {people.map((person) => (
                <article key={person.id} className="bg-white p-5">
                  <Link href={`/profile/${person.username}`} className="flex gap-3 rounded-xl hover:bg-slate-50">
                    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 text-sm font-black">
                      {person.profilePhotoUrl ? (
                        <img src={person.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        person.fullName.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-black">{person.fullName}</h2>
                      <p className="truncate text-xs text-slate-400">@{person.username}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                        {[person.major, person.course, person.university].filter(Boolean).join(" · ") || "Ween community member"}
                      </p>
                    </div>
                  </Link>
                  <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                    {person.bio || "Building skills, connections and meaningful impact."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {splitTags(person.skills).slice(0, 3).map((skill) => (
                      <span key={skill} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {person.id === account?.id ? (
                      <Link href={`/profile/${person.username}`} className="flex-1 rounded-full border border-slate-300 py-2.5 text-center text-xs font-bold">
                        View your profile
                      </Link>
                    ) : (
                      <>
                        <button
                          onClick={() => void follow(person.id)}
                          className="flex-1 rounded-full bg-emerald-600 py-2.5 text-xs font-bold text-white"
                        >
                          {person.following ? "Following" : "Follow"}
                        </button>
                        {person.canMessage && (
                          <Link
                            href={`/messages/${person.id}?username=${person.username}&fullName=${encodeURIComponent(person.fullName)}&photoUrl=${encodeURIComponent(person.profilePhotoUrl || '')}`}
                            className="flex-1 rounded-full border border-slate-300 py-2.5 text-center text-xs font-bold"
                          >
                            Message
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t p-4">
              <Pagination
                currentPage={peoplePage}
                totalPages={totalPages}
                onPageChange={(page) => void loadPeople(page)}
                isLoading={searching}
              />
            </div>
          </>
        ) : (
          <p className="p-12 text-center text-sm text-slate-500">No people match your search.</p>
        )}
      </section>

      <aside className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="border-b p-5">
          <h2 className="font-black">Impact leaderboard</h2>
          <p className="mt-1 text-xs text-slate-400">All-time community leaders</p>
        </div>
        {loading ? (
          <Loading />
        ) : entries.length ? (
          <div className="divide-y">
            {entries.map((entry) => (
              <div key={`${entry.rank}-${entry.username}`} className="flex items-center gap-3 p-4">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${entry.rank <= 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                  {entry.rank}
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-xs font-black">
                  {entry.username.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{entry.fullName || `@${entry.username}`}</p>
                  <p className="truncate text-[11px] text-slate-400">
                    {[entry.course, entry.university].filter(Boolean).join(" · ") || `@${entry.username}`}
                  </p>
                </div>
                <span className="text-xs font-black text-amber-600">{entry.coins} ◈</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-slate-400">Leaderboard is ready for its first members.</p>
        )}
      </aside>
    </div>
  );
}

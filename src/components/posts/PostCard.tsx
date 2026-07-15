"use client";
import Link from "next/link";
import { useState } from "react";
import { errorMessage, postsApi } from "@/lib/api";
import type { Post } from "@/types";

export function PostCard({ post: initial, onChange }: { post: Post; onChange?: (post: Post) => void }) {
  const [post, setPost] = useState(initial);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  
  const update = (next: Post) => {
    setPost(next);
    onChange?.(next);
  };

  async function act(kind: "like" | "save" | "repost") {
    setBusy(kind);
    setError("");
    try {
      const next = kind === "like"
        ? await postsApi.like(post.id, post.likedByMe)
        : kind === "save"
          ? await postsApi.save(post.id, post.savedByMe)
          : await postsApi.repost(post.id, post.repostedByMe);
      update(next);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy("");
    }
  }

  const name = post.author.fullName || post.author.username;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/60 shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:border-indigo-100 mb-6">
      <div className="flex items-center gap-4 p-5 sm:p-6">
        <Link href={`/@${post.author.username}`} className="shrink-0">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-sm font-black text-emerald-950 shadow-sm transition-transform duration-300 group-hover:scale-105 group-active:scale-95 overflow-hidden">
            {post.author.profilePhotoUrl ? (
              <img src={post.author.profilePhotoUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              name.slice(0, 2).toUpperCase()
            )}
          </span>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/@${post.author.username}`} className="hover:underline decoration-emerald-500 decoration-2 underline-offset-2">
            <p className="truncate text-base font-black text-slate-900 tracking-tight">{name}</p>
          </Link>
          <p className="truncate text-xs font-medium text-slate-400">
            @{post.author.username} • {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <Link href={`/posts/${post.id}`} className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        </Link>
      </div>

      <Link href={`/posts/${post.id}`} className="block">
        <p className="whitespace-pre-wrap break-words px-5 pb-5 text-[15px] leading-relaxed text-slate-700 sm:px-6 font-medium">
          {post.content}
        </p>
        {post.mediaUrl && (
          <div className="px-5 pb-5 sm:px-6">
            <div className="rounded-3xl overflow-hidden shadow-sm">
               <img src={post.mediaUrl} alt="Post media" className="max-h-[34rem] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
          </div>
        )}
      </Link>

      <div className="flex items-center justify-between border-t border-slate-100/50 bg-slate-50/50 px-3 py-2 sm:px-4 backdrop-blur-md">
        {/* Like Action */}
        <Action
          active={post.likedByMe}
          disabled={Boolean(busy)}
          label={`${post.likeCount}`}
          title="Like"
          onClick={() => void act("like")}
          activeColor="text-red-500 bg-red-50 hover:bg-red-100"
          defaultColor="hover:bg-slate-100 text-slate-500 hover:text-red-500"
          icon={
            post.likedByMe ? (
              <svg className="w-[18px] h-[18px] text-red-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )
          }
        />

        {/* Comment Link */}
        <Link href={`/posts/${post.id}`} className="flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]">
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
          {post.commentCount}
        </Link>

        {/* Repost Action */}
        <Action
          active={post.repostedByMe}
          disabled={Boolean(busy)}
          label={`${post.repostCount}`}
          title="Repost"
          onClick={() => void act("repost")}
          activeColor="text-blue-600 bg-blue-50 hover:bg-blue-100"
          defaultColor="hover:bg-slate-100 text-slate-500 hover:text-blue-600"
          icon={
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          }
        />

        {/* Save Action */}
        <Action
          active={post.savedByMe}
          disabled={Boolean(busy)}
          label=""
          title="Save"
          onClick={() => void act("save")}
          activeColor="text-amber-500 bg-amber-50 hover:bg-amber-100"
          defaultColor="hover:bg-slate-100 text-slate-500 hover:text-amber-500"
          icon={
            <svg className={`w-[18px] h-[18px] ${post.savedByMe ? "fill-current" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
      </div>
      {error && <p className="bg-red-50 px-5 py-3 text-xs font-bold text-red-600">{error}</p>}
    </article>
  );
}

function Action({
  active,
  disabled,
  label,
  title,
  onClick,
  icon,
  activeColor,
  defaultColor
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  activeColor: string;
  defaultColor: string;
}) {
  return (
    <button
      type="button"
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
        active ? activeColor : defaultColor
      }`}
    >
      <span>{icon}</span>
      {label && <span>{label}</span>}
    </button>
  );
}

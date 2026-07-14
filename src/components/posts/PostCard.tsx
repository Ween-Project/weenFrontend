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
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 text-xs font-black text-emerald-950">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-slate-950">{name}</p>
          <p className="truncate text-xs text-slate-400">
            @{post.author.username} · {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Link href={`/posts/${post.id}`} className="grid h-9 w-9 place-items-center rounded-full text-xl text-slate-400 hover:bg-slate-50">
          •••
        </Link>
      </div>

      <Link href={`/posts/${post.id}`}>
        <p className="whitespace-pre-wrap break-words px-4 pb-4 text-[15px] leading-6 text-slate-700 sm:px-5">
          {post.content}
        </p>
        {post.mediaUrl && (
          <img src={post.mediaUrl} alt="Post media" className="max-h-[34rem] w-full object-cover" />
        )}
      </Link>

      <div className="flex items-center justify-between border-t border-slate-100 px-2 py-1.5 sm:px-3">
        {/* Like Action */}
        <Action
          active={post.likedByMe}
          disabled={Boolean(busy)}
          label={`${post.likeCount}`}
          title="Like"
          onClick={() => void act("like")}
          activeColor="text-red-500"
          icon={
            post.likedByMe ? (
              <svg className="w-[18px] h-[18px] text-red-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px] text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )
          }
        />

        {/* Comment Link */}
        <Link href={`/posts/${post.id}`} className="flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition">
          <img src="/images/comment-icon.png" alt="Comment" className="w-[18px] h-[18px] object-contain opacity-60" />
          {post.commentCount}
        </Link>

        {/* Repost Action */}
        <Action
          active={post.repostedByMe}
          disabled={Boolean(busy)}
          label={`${post.repostCount}`}
          title="Repost"
          onClick={() => void act("repost")}
          activeColor="text-blue-500"
          icon={
            <svg className={`w-[18px] h-[18px] transition-colors duration-200 ${post.repostedByMe ? "text-blue-500" : "text-slate-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          activeColor="text-amber-500"
          icon={
            <svg className={`w-[18px] h-[18px] transition-all duration-200 ${post.savedByMe ? "text-amber-500 fill-current" : "text-slate-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
      </div>
      {error && <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}
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
  activeColor = "text-emerald-700"
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold transition hover:bg-slate-50 disabled:opacity-50 ${
        active ? activeColor : "text-slate-500"
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

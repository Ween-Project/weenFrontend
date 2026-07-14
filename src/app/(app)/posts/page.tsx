"use client";
import { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { PostForm } from "@/components/posts/PostForm";
import { PostCard } from "@/components/posts/PostCard";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { errorMessage, postsApi } from "@/lib/api";
import type { Post } from "@/types";

export default function PostsPage() {
  return <RoleGuard allow={["VOLUNTEER", "ORGANIZER", "ADMIN"]}><PostsContent /></RoleGuard>;
}

function PostsContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setPosts((await postsApi.list()).content); } catch (cause) { setError(errorMessage(cause)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <div className="mx-auto max-w-3xl">
    <div><p className="text-sm font-bold text-emerald-700">Community</p><h2 className="mt-1 text-3xl font-black text-slate-950">Posts</h2><p className="mt-2 text-sm text-slate-500">Share progress and learn what others are working on.</p></div>
    <div className="mt-7"><PostForm onSaved={(post) => setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)])} /></div>
    {error && <div className="mt-5"><Alert>{error} <button onClick={() => void load()} className="ml-2 font-bold underline">Retry</button></Alert></div>}
    {loading ? <Loading label="Loading posts…" /> : posts.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No posts yet. Start the conversation.</div> :
      <div className="mt-6 space-y-4">{posts.map((post) => <PostCard key={post.id} post={post} onChange={next=>setPosts(current=>current.map(item=>item.id===next.id?next:item))} />)}</div>}
  </div>;
}

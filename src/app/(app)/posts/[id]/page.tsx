"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, postsApi } from "@/lib/api";
import { PostForm } from "@/components/posts/PostForm";
import { RoleGuard } from "@/components/RoleGuard";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import type { Post, PostComment } from "@/types";

export default function PostDetailPage({ params }: { params: { id: string } }) {
  return <RoleGuard allow={["VOLUNTEER", "ORGANIZER", "ADMIN"]}><PostDetail id={params.id} /></RoleGuard>;
}

function PostDetail({ id }: { id: string }) {
  const router = useRouter();
  const { account } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [comments,setComments]=useState<PostComment[]>([]);
  const [comment,setComment]=useState("");
  const [commenting,setCommenting]=useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const load = useCallback(async () => { setLoading(true); setError(""); try { setPost(await postsApi.detail(id)); } catch (cause) { setError(errorMessage(cause)); } finally { setLoading(false); } }, [id]);
  useEffect(() => { void load(); postsApi.comments(id).then(page=>setComments(page.content)).catch(()=>undefined); }, [id,load]);
  async function addComment(e:FormEvent){e.preventDefault();if(!comment.trim())return;setCommenting(true);try{const added=await postsApi.comment(id,comment.trim());setComments(current=>[...current,added]);setPost(current=>current?{...current,commentCount:current.commentCount+1}:current);setComment("");}catch(cause){setError(errorMessage(cause));}finally{setCommenting(false);}}
  
  async function confirmDelete() {
    setShowConfirmModal(false);
    setDeleting(true); setError("");
    try { await postsApi.delete(id); router.replace("/posts"); router.refresh(); } catch (cause) { setError(errorMessage(cause)); setDeleting(false); }
  }

  if (loading) return <Loading label="Loading post…" />;
  if (!post) return <Alert>{error || "Post not found."}</Alert>;
  const owner = account?.id === post.author.id;
  if (editing) return <div className="mx-auto max-w-3xl"><PostForm post={post} onCancel={() => setEditing(false)} onSaved={(saved) => { setPost(saved); setEditing(false); }} /></div>;
  return <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 relative">
    {error && <div className="mb-5"><Alert>{error}</Alert></div>}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-black text-slate-900">{post.author.fullName || `@${post.author.username}`}</p><p className="mt-1 text-xs text-slate-400">{new Date(post.createdAt).toLocaleString()}</p></div>{owner && <div className="flex gap-2"><button onClick={() => setEditing(true)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold">Edit</button><button onClick={() => setShowConfirmModal(true)} disabled={deleting} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-60">{deleting ? "Deleting…" : "Delete"}</button></div>}</div>
    <p className="mt-7 whitespace-pre-wrap break-words text-base leading-7 text-slate-700">{post.content}</p>
    {post.mediaUrl && <img src={post.mediaUrl} alt="Post media" className="mt-6 max-h-[32rem] w-full rounded-2xl object-cover" />}
    <div className="mt-7 flex flex-wrap gap-4 border-t border-slate-100 pt-5 text-sm font-semibold text-slate-500"><span>{post.likeCount} likes</span><span>{post.commentCount} comments</span><span>{post.saveCount} saves</span><span>{post.repostCount} reposts</span></div>
    <div className="mt-6 border-t border-slate-100 pt-5"><h3 className="font-black">Comments</h3><div className="mt-4 space-y-4">{comments.map(item=><div key={item.id} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-black">{(item.author.fullName||item.author.username).slice(0,2).toUpperCase()}</span><div className="min-w-0 rounded-2xl bg-slate-50 px-4 py-2.5"><p className="text-xs font-extrabold">{item.author.fullName||`@${item.author.username}`}</p><p className="mt-1 break-words text-sm text-slate-700">{item.content}</p></div></div>)}</div><form onSubmit={e=>void addComment(e)} className="mt-5 flex gap-2"><input value={comment} onChange={e=>setComment(e.target.value)} maxLength={2000} placeholder="Write a comment…" className="h-11 min-w-0 flex-1 rounded-full bg-slate-100 px-4 text-sm"/><button disabled={commenting||!comment.trim()} className="rounded-full bg-emerald-600 px-5 text-sm font-bold text-white disabled:opacity-40">Post</button></form></div>

    {/* Custom Delete Confirmation Modal */}
    {showConfirmModal && (
      <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/65 p-3 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
          <button
            type="button"
            onClick={() => setShowConfirmModal(false)}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xl transition-all"
            aria-label="Close"
          >
            ×
          </button>
          
          <div className="flex justify-start mb-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-red-50">
              <img src="/images/delete-icon.png" alt="Delete" className="w-6 h-6 object-contain" />
            </span>
          </div>

          <div className="space-y-2 mb-6">
            <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
              Are you sure you want to delete this post?
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              This action cannot be undone. Your post will be permanently removed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="h-11 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              className="h-11 rounded-full bg-red-700 hover:bg-red-800 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
  </article>;
}

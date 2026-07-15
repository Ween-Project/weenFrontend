"use client";
import { useCallback, useEffect, useState, type FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, postsApi } from "@/lib/api";
import { PostForm } from "@/components/posts/PostForm";
import { RoleGuard } from "@/components/RoleGuard";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import type { Post, PostComment } from "@/types";

export default function PostDetailPage({ params }: { params: { id: string } }) {
  return <RoleGuard allow={["VOLUNTEER", "ORGANIZER", "ORGANIZATION_ADMIN", "ADMIN"]}><PostDetail id={params.id} /></RoleGuard>;
}

function PostDetail({ id }: { id: string }) {
  const router = useRouter();
  const { account } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<PostComment[]>([]);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [commenting, setCommenting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => { 
    setLoading(true); 
    setError(""); 
    try { 
      setPost(await postsApi.detail(id)); 
    } catch (cause) { 
      setError(errorMessage(cause)); 
    } finally { 
      setLoading(false); 
    } 
  }, [id]);

  useEffect(() => { 
    void load(); 
    postsApi.comments(id).then(page => setComments(page.content)).catch(() => undefined); 
  }, [id, load]);

  async function addComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const added = await postsApi.comment(id, comment.trim(), replyTo?.id);
      
      if (replyTo) {
        // Update nested replies
        setComments(current => current.map(c => {
          if (c.id === replyTo.id) {
            return { ...c, replies: [...(c.replies || []), added] };
          }
          return c;
        }));
      } else {
        setComments(current => [...current, added]);
      }
      
      setPost(current => current ? { ...current, commentCount: current.commentCount + 1 } : current);
      setComment("");
      setReplyTo(null);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setCommenting(false);
    }
  }

  async function handleLikeComment(commentId: string, isLiked: boolean, parentId?: string) {
    try {
      const updated = isLiked 
        ? await postsApi.unlikeComment(id, commentId)
        : await postsApi.likeComment(id, commentId);

      setComments(current => {
        if (parentId) {
          return current.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: c.replies?.map(r => r.id === commentId ? updated : r)
              };
            }
            return c;
          });
        }
        return current.map(c => c.id === commentId ? updated : c);
      });
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  function initiateReply(commentItem: PostComment) {
    setReplyTo(commentItem);
    setComment(`@${commentItem.author.username} `);
    inputRef.current?.focus();
  }
  
  async function confirmDelete() {
    setShowConfirmModal(false);
    setDeleting(true); setError("");
    try { await postsApi.delete(id); router.replace("/posts"); router.refresh(); } catch (cause) { setError(errorMessage(cause)); setDeleting(false); }
  }

  if (loading) return <Loading label="Loading post…" />;
  if (!post) return <Alert>{error || "Post not found."}</Alert>;
  const owner = account?.id === post.author.id;
  
  if (editing) return <div className="mx-auto max-w-3xl"><PostForm post={post} onCancel={() => setEditing(false)} onSaved={(saved) => { setPost(saved); setEditing(false); }} /></div>;
  
  return (
    <article className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200/60 bg-white/60 p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative mb-10">
      {error && <div className="mb-6"><Alert>{error}</Alert></div>}
      
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <Link href={`/@${post.author.username}`} className="flex items-center gap-4 group">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 text-sm font-black text-indigo-700 shadow-sm transition-transform group-hover:scale-105 group-active:scale-95 overflow-hidden">
            {post.author.profilePhotoUrl ? (
              <img src={post.author.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (post.author.fullName || post.author.username).slice(0, 2).toUpperCase()
            )}
          </span>
          <div>
            <p className="font-black text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
              {post.author.fullName || `@${post.author.username}`}
            </p>
            <p className="text-sm font-medium text-slate-400">
              @{post.author.username} • {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </Link>
        
        {owner && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              Edit
            </button>
            <button onClick={() => setShowConfirmModal(true)} disabled={deleting} className="rounded-xl bg-red-50 border border-red-100 px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50">
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        )}
      </header>

      <div className="space-y-6">
        <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-slate-800 font-medium">
          {post.content}
        </p>
        
        {post.mediaUrl && (
          <div className="rounded-3xl overflow-hidden shadow-md">
            <img src={post.mediaUrl} alt="Post media" className="max-h-[40rem] w-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-6 border-t border-slate-100 pt-6">
        <Stat icon="❤️" count={post.likeCount} label="Likes" />
        <Stat icon="💬" count={post.commentCount} label="Comments" />
        <Stat icon="🔄" count={post.repostCount} label="Reposts" />
        <Stat icon="🔖" count={post.saveCount} label="Saves" />
      </div>

      <div className="mt-10 pt-8 border-t border-slate-100">
        <h3 className="font-black text-xl text-slate-900 mb-8 flex items-center gap-2">
          Discussion <span className="bg-indigo-100 text-indigo-700 text-sm py-1 px-3 rounded-full">{post.commentCount}</span>
        </h3>
        
        <div className="space-y-8">
          {comments.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
              <p className="text-slate-400 font-medium text-lg">No comments yet.</p>
              <p className="text-slate-400 text-sm mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map(item => (
              <div key={item.id} className="group">
                <CommentNode 
                  comment={item} 
                  onReply={() => initiateReply(item)} 
                  onLike={() => handleLikeComment(item.id, item.isLikedByMe)} 
                />
                
                {/* Nested Replies */}
                {item.replies && item.replies.length > 0 && (
                  <div className="mt-4 pl-12 space-y-4 border-l-2 border-slate-100 ml-6">
                    {item.replies.map(reply => (
                      <CommentNode 
                        key={reply.id} 
                        comment={reply} 
                        isReply 
                        onReply={() => initiateReply(item)} 
                        onLike={() => handleLikeComment(reply.id, reply.isLikedByMe, item.id)} 
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <form onSubmit={e => void addComment(e)} className="mt-10 relative">
          {replyTo && (
            <div className="flex items-center justify-between bg-indigo-50 px-5 py-3 rounded-t-2xl border border-indigo-100 border-b-0">
              <span className="text-xs font-bold text-indigo-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                Replying to @{replyTo.author.username}
              </span>
              <button 
                type="button" 
                onClick={() => { setReplyTo(null); setComment(comment.replace(`@${replyTo.author.username} `, "")); }} 
                className="text-indigo-400 hover:text-indigo-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          <div className="flex gap-3 items-end">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-500 overflow-hidden mb-1 border-2 border-white shadow-sm">
               {account?.profilePhotoUrl ? <img src={account.profilePhotoUrl} className="w-full h-full object-cover" alt=""/> : account?.fullName?.slice(0,2).toUpperCase() || "ME"}
            </span>
            <div className={`flex-1 flex gap-2 bg-slate-50 border ${replyTo ? 'rounded-b-3xl rounded-tr-3xl border-t-0 border-indigo-100 bg-white shadow-sm' : 'rounded-3xl border-slate-200'} p-2 transition-all focus-within:bg-white focus-within:border-indigo-300 focus-within:shadow-md focus-within:ring-4 focus-within:ring-indigo-500/10`}>
              <input 
                ref={inputRef}
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                maxLength={2000} 
                placeholder="Add to the discussion..." 
                className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm font-medium outline-none"
              />
              <button 
                disabled={commenting || !comment.trim()} 
                className="h-12 rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white shadow-md hover:bg-slate-800 disabled:opacity-40 disabled:shadow-none transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Post
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/65 p-3 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="absolute right-6 top-6 grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xl font-bold transition-all"
            >
              ×
            </button>
            
            <div className="mb-6">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
              </span>
            </div>

            <div className="space-y-3 mb-8">
              <h3 className="text-xl font-black text-slate-900 leading-tight">Delete Post</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                This action cannot be undone. Your post and all its comments will be permanently removed.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="h-12 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="h-12 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function Stat({ icon, count, label }: { icon: string; count: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-lg shadow-sm border border-slate-100">{icon}</span>
      <div>
        <p className="text-sm font-black text-slate-900 leading-none mb-1">{count}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function CommentNode({ comment, isReply = false, onReply, onLike }: { comment: PostComment; isReply?: boolean; onReply: () => void; onLike: () => void; }) {
  const isLiked = comment.isLikedByMe;
  
  // Basic mention parser to highlight @usernames
  const renderContent = (content: string) => {
    return content.split(/(@[\w.-]+)/g).map((part, i) => {
      if (part.startsWith('@')) {
        return <Link key={i} href={`/${part}`} className="font-bold text-indigo-600 hover:underline">{part}</Link>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex gap-4">
      <Link href={`/@${comment.author.username}`} className="shrink-0">
        <span className={`grid ${isReply ? 'h-8 w-8' : 'h-10 w-10'} place-items-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-black text-slate-500 overflow-hidden shadow-sm border border-slate-200/50`}>
          {comment.author.profilePhotoUrl ? <img src={comment.author.profilePhotoUrl} className="w-full h-full object-cover" alt=""/> : (comment.author.fullName || comment.author.username).slice(0, 2).toUpperCase()}
        </span>
      </Link>
      
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-none bg-slate-50 p-4 border border-slate-100">
          <div className="flex justify-between items-baseline mb-1">
            <Link href={`/@${comment.author.username}`} className="text-sm font-extrabold text-slate-900 hover:underline">
              {comment.author.fullName || `@${comment.author.username}`}
            </Link>
            <span className="text-[10px] font-medium text-slate-400 shrink-0">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="break-words text-sm text-slate-700 leading-relaxed font-medium mt-1">
            {renderContent(comment.content)}
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-2 px-2">
          <button onClick={onLike} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-slate-500 hover:text-slate-700'}`}>
            {isLiked ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
            )}
            {comment.likeCount > 0 && comment.likeCount}
          </button>
          
          <button onClick={onReply} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

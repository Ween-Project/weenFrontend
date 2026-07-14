"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, errorMessage, postsApi } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import type { Post } from "@/types";

export function PostForm({
  post,
  onSaved,
  onCancel,
  isOpen,
  setIsOpen,
  inline = true,
}: {
  post?: Post;
  onSaved: (post: Post) => void;
  onCancel?: () => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  inline?: boolean;
}) {
  const { account } = useAuth();
  const [localOpen, setLocalOpen] = useState(Boolean(post));
  
  const open = isOpen !== undefined ? isOpen : localOpen;
  const setOpen = (val: boolean) => {
    if (setIsOpen) {
      setIsOpen(val);
    } else {
      setLocalOpen(val);
    }
  };

  const [content, setContent] = useState(post?.content || "");
  const [mediaUrl, setMediaUrl] = useState(post?.mediaUrl || "");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"post" | "blog">("post");
  const [hasCertificate, setHasCertificate] = useState(false);

  useEffect(() => {
    if (mediaFiles.length > 0) {
      const file = mediaFiles[0];
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        setMediaUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    } else if (!post) {
      setMediaUrl("");
    }
  }, [mediaFiles, post]);

  const name = account?.fullName || account?.organizationName || account?.username || "Ween member";
  const initials = name.slice(0, 2).toUpperCase();

  const [pendingCropQueue, setPendingCropQueue] = useState<File[]>([]);
  const [currentCropFile, setCurrentCropFile] = useState<File | null>(null);
  const [croppedResults, setCroppedResults] = useState<File[]>([]);
  const [nonImageFiles, setNonImageFiles] = useState<File[]>([]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const images = selectedFiles.filter(f => f.type.startsWith("image/"));
    const others = selectedFiles.filter(f => !f.type.startsWith("image/"));

    setNonImageFiles(others);
    setCroppedResults([]);

    if (images.length > 0) {
      setPendingCropQueue(images);
      setCurrentCropFile(images[0]);
    } else {
      setMediaFiles(others);
    }
    e.target.value = "";
  };

  const handleCropComplete = (croppedFile: File) => {
    const newCroppedResults = [...croppedResults, croppedFile];
    setCroppedResults(newCroppedResults);

    const remainingQueue = pendingCropQueue.slice(1);
    setPendingCropQueue(remainingQueue);

    if (remainingQueue.length > 0) {
      setCurrentCropFile(remainingQueue[0]);
    } else {
      setMediaFiles([...nonImageFiles, ...newCroppedResults]);
      setCurrentCropFile(null);
    }
  };

  const handleCropCancel = () => {
    const remainingQueue = pendingCropQueue.slice(1);
    setPendingCropQueue(remainingQueue);
    if (remainingQueue.length > 0) {
      setCurrentCropFile(remainingQueue[0]);
    } else {
      setMediaFiles([...nonImageFiles, ...croppedResults]);
      setCurrentCropFile(null);
    }
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) { setErrors({ content: "Write something before publishing." }); return; }
    setSubmitting(true); setRequestError("");
    try {
      const input = { content: content.trim() };
      const saved = post ? await postsApi.update(post.id, input, mediaFiles) : await postsApi.create(input, mediaFiles);
      if (!post) { setContent(""); setMediaUrl(""); setMediaFiles([]); setHasCertificate(false); }
      setOpen(false); onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      setRequestError(errorMessage(error));
    } finally { setSubmitting(false); }
  }
  function close() { setOpen(false); onCancel?.(); }
  return <>
    {inline && !post && (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 text-xs font-black">{initials}</span>
          <button type="button" onClick={() => setOpen(true)} className="h-12 flex-1 rounded-full border border-slate-300 px-5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50">Start a post</button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <ComposerAction icon="▶" label="Video" onClick={() => setOpen(true)} tone="text-emerald-700" />
          <ComposerAction icon="▧" label="Photo" onClick={() => setOpen(true)} tone="text-blue-600" />
          <ComposerAction icon="▤" label="Write article" onClick={() => setOpen(true)} tone="text-orange-700" />
        </div>
      </section>
    )}
    
    {open && (
      <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/65 p-3 backdrop-blur-sm">
        <form onSubmit={(event) => void submit(event)} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 text-xs font-black relative">
                {initials}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-white bg-emerald-500" />
              </span>
              <div>
                <h2 className="font-extrabold text-slate-800 leading-tight">{name}</h2>
                <button type="button" className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold hover:text-slate-700 mt-0.5">
                  Post to anyone
                  <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>
            <button type="button" onClick={close} aria-label="Close composer" className="grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xl transition-all">×</button>
          </header>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-100 px-5 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setActiveTab("post")}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-[1px] ${
                activeTab === "post"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Post
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("blog")}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all -mb-[1px] ${
                activeTab === "blog"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Blog
            </button>
          </div>

          {/* Editor Body */}
          <div className="min-h-72 flex-1 overflow-y-auto p-5">
            {requestError && <div className="mb-4"><Alert>{requestError}</Alert></div>}
            <textarea
              autoFocus
              value={content}
              onChange={(event) => { setContent(event.target.value); setErrors({}); }}
              maxLength={5000}
              placeholder={activeTab === "post" ? "What do you want to talk about?" : "Write your article..."}
              className="min-h-48 w-full resize-none border-0 text-lg leading-relaxed outline-none placeholder:text-slate-400 text-slate-800"
            />
            {errors.content && <p className="text-xs font-semibold text-red-600">{errors.content}</p>}
            {mediaUrl && (
              <div className="relative mt-4 overflow-hidden rounded-2xl bg-slate-100">
                {mediaFiles.length > 0 && mediaFiles[0].type.startsWith("video/") ? (
                  <video src={mediaUrl} controls className="max-h-80 w-full object-contain" />
                ) : (
                  <img src={mediaUrl} alt="Post media preview" className="max-h-80 w-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl("");
                    setMediaFiles([]);
                  }}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-slate-950/75 text-white"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="bg-slate-50 border-t border-slate-100 px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Attach Certificate Button */}
              <button
                type="button"
                onClick={() => setHasCertificate(!hasCertificate)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                  hasCertificate
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <img src="/images/award-icon.png" alt="" className="w-4 h-4 object-contain" />
                <span className="text-emerald-700">{hasCertificate ? "Attached" : "Attach Certificate"}</span>
              </button>

              {/* Vertical Divider */}
              <div className="h-5 w-[1px] bg-slate-200" />

              {/* Media Controls */}
              <div className="flex items-center gap-1.5">
                <label className="cursor-pointer p-2 rounded-full hover:bg-slate-200 transition-all flex items-center justify-center">
                  <img src="/images/video-icon.png" alt="Video" className="w-5 h-5 object-contain" />
                  <input type="file" accept="video/*" multiple className="hidden" onChange={handleMediaChange}/>
                </label>
                <label className="cursor-pointer p-2 rounded-full hover:bg-slate-200 transition-all flex items-center justify-center">
                  <img src="/images/photo-icon.png" alt="Photo" className="w-5 h-5 object-contain" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleMediaChange}/>
                </label>
                <button type="button" onClick={() => setActiveTab("blog")} className="p-2 rounded-full hover:bg-slate-200 transition-all flex items-center justify-center">
                  <img src="/images/blog-icon.png" alt="Blog" className="w-5 h-5 object-contain" />
                </button>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-500">
              {mediaFiles.length ? `${mediaFiles.length} files selected` : "No files selected"}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={close}
              className="h-10 rounded-full border border-slate-300 px-6 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                alert("Saved as draft!");
                close();
              }}
              className="h-10 rounded-full border border-emerald-600 px-6 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-all"
            >
              Save Draft
            </button>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 px-8 text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-400 shadow-md hover:shadow-lg transition-all"
            >
              {submitting ? "Publishing…" : post ? "Save" : "Publish"}
            </button>
          </div>
        </form>
      </div>
    )}
    {currentCropFile && (
      <ImageCropperModal
        file={currentCropFile}
        aspect={4 / 3}
        cropShape="rect"
        onCrop={handleCropComplete}
        onClose={handleCropCancel}
      />
    )}
  </>;
}

function ComposerAction({ icon, label, tone, onClick }: { icon: string; label: string; tone: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><span className={`text-xl ${tone}`}>{icon}</span><span className="hidden sm:inline">{label}</span></button>;
}

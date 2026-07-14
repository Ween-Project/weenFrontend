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

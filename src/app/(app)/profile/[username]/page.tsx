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


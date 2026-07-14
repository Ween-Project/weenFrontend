"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, profileApi, authApi, type ProfileInput } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { TagInput } from "@/components/ui/TagInput";
import { Textarea } from "@/components/ui/Textarea";
import { UniversitySelect } from "@/components/ui/UniversitySelect";
import { OrganizationSettings } from "@/components/organizations/OrganizationSettings";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";

const years = ["I Year", "II Year", "III Year", "IV Year", "V Year", "VI Year"];
function tags(value?: string) {
  if (!value) return [];
  try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed.map(String); } catch {}
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function SettingsPage() {
  const router = useRouter();
  const { account, refresh } = useAuth();
  const [form, setForm] = useState<ProfileInput>({});
  const [pendingNavUrl, setPendingNavUrl] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<ProfileInput>({});
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [initialSkills, setInitialSkills] = useState<string[]>([]);
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [initialInterests, setInitialInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File>();
  const [banner, setBanner] = useState<File>();
  const [profilePhotoUrlPreview, setProfilePhotoUrlPreview] = useState<string>("");
  const [bannerUrlPreview, setBannerUrlPreview] = useState<string>("");
  const [showWarningToast, setShowWarningToast] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const isOrganization = account?.role === "ORGANIZATION_ADMIN";

  const [croppingImage, setCroppingImage] = useState<{
    file: File;
    aspect: number;
    cropShape: "rect" | "round";
    onCrop: (croppedFile: File) => void;
  } | null>(null);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCroppingImage({
        file,
        aspect: 1,
        cropShape: "round",
        onCrop: (cropped) => {
          setProfilePhoto(cropped);
          setCroppingImage(null);
        },
      });
      e.target.value = "";
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCroppingImage({
        file,
        aspect: 3 / 1,
        cropShape: "rect",
        onCrop: (cropped) => {
          setBanner(cropped);
          setCroppingImage(null);
        },
      });
      e.target.value = "";
    }
  };

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

  useEffect(() => {
    if (isOrganization) { setLoading(false); return; }
    profileApi.get().then((value) => {
      setForm(value);
      setInitialForm(value);
      const sk = tags(value.skills);
      setSkillTags(sk);
      setInitialSkills(sk);
      const intr = tags(value.interests);
      setInterestTags(intr);
      setInitialInterests(intr);
    }).catch((cause) => setError(errorMessage(cause))).finally(() => setLoading(false));
  }, [isOrganization]);

  useEffect(() => {
    if (profilePhoto) {
      const url = URL.createObjectURL(profilePhoto);
      setProfilePhotoUrlPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setProfilePhotoUrlPreview("");
    }
  }, [profilePhoto]);

  useEffect(() => {
    if (banner) {
      const url = URL.createObjectURL(banner);
      setBannerUrlPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setBannerUrlPreview("");
    }
  }, [banner]);

  const isDirty = Boolean(
    profilePhoto ||
    banner ||
    (form.fullName || "") !== (initialForm.fullName || "") ||
    (form.birthDate || "") !== (initialForm.birthDate || "") ||
    (form.phone || "") !== (initialForm.phone || "") ||
    (form.university || "") !== (initialForm.university || "") ||
    (form.major || "") !== (initialForm.major || "") ||
    (form.course || "") !== (initialForm.course || "") ||
    (form.linkedinUrl || "") !== (initialForm.linkedinUrl || "") ||
    (form.githubUrl || "") !== (initialForm.githubUrl || "") ||
    (form.bio || "") !== (initialForm.bio || "") ||
    (form.messagePermission || "EVERYONE") !== (initialForm.messagePermission || "EVERYONE") ||
    JSON.stringify(skillTags) !== JSON.stringify(initialSkills) ||
    JSON.stringify(interestTags) !== JSON.stringify(initialInterests)
  );

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (!isDirty) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor && anchor.href) {
        const targetUrl = new URL(anchor.href, window.location.origin);
        const currentUrl = new URL(window.location.href);

        if (targetUrl.origin === currentUrl.origin && targetUrl.pathname !== currentUrl.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setPendingNavUrl(anchor.href);
          setShowWarningToast(true);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, [isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  async function updatePassword(e: FormEvent) {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setUpdatingPassword(true);
    setPasswordError("");
    setPasswordNotice("");
    try {
      await authApi.changePassword({ oldPassword, newPassword, confirmPassword });
      setPasswordNotice("Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (cause) {
      setPasswordError(errorMessage(cause));
    } finally {
      setUpdatingPassword(false);
    }
  }
}
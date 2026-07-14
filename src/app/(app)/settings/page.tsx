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

  if (loading) return <Loading label="Loading profile…" />;
  if (isOrganization && account) return <OrganizationSettings organizationId={account.id} />;

  const change = (name: keyof ProfileInput, value: string) => setForm((current) => ({ ...current, [name]: value }));
  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const updated = await profileApi.update({ ...form, profilePhotoUrl: undefined, bannerUrl: undefined, skills: skillTags.join(","), interests: interestTags.join(",") }, profilePhoto, banner);
      await authApi.updateSession({
        fullName: updated.fullName,
        profilePhotoUrl: updated.profilePhotoUrl,
      });
      await refresh();
      setForm(updated);
      setInitialForm(updated);
      const sk = tags(updated.skills);
      setSkillTags(sk);
      setInitialSkills(sk);
      const intr = tags(updated.interests);
      setInterestTags(intr);
      setInitialInterests(intr);
      setNotice("Profile updated successfully.");
      setProfilePhoto(undefined); setBanner(undefined);
      setSavedRecently(true);
      setTimeout(() => setSavedRecently(false), 3000);
    } catch (cause) { setError(errorMessage(cause)); } finally { setSaving(false); }
  }
  const initials = (form.fullName || account?.username || "WE").slice(0, 2).toUpperCase();
  return <div className="mx-auto max-w-4xl">
    {/* Unsaved changes warning modal */}
    {showWarningToast && (
      <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/65 p-3 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-fadeIn">
          <button
            type="button"
            onClick={() => {
              setShowWarningToast(false);
              setPendingNavUrl(null);
            }}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xl transition-all"
            aria-label="Close"
          >
            ×
          </button>
          
          <div className="flex justify-start mb-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-orange-50 text-orange-500">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F97316] text-white font-extrabold text-lg">
                !
              </span>
            </span>
          </div>

          <div className="space-y-2 mb-6 text-left">
            <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
              Are you sure you want to continue without saving?
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              You have unsaved changes. If you continue they will be lost !
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setShowWarningToast(false);
                setPendingNavUrl(null);
              }}
              className="h-11 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setSkillTags(initialSkills);
                setInitialSkills(initialSkills);
                setInterestTags(initialInterests);
                setInitialInterests(initialInterests);
                setProfilePhoto(undefined);
                setBanner(undefined);
                setShowWarningToast(false);
                if (pendingNavUrl) {
                  router.push(pendingNavUrl);
                  setPendingNavUrl(null);
                }
              }}
              className="h-11 rounded-full bg-[#F97316] hover:bg-orange-600 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
            >
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    )}

    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="h-36 bg-gradient-to-r from-emerald-950 via-emerald-800 to-cyan-700 sm:h-48">
        {(bannerUrlPreview || form.bannerUrl) && <img src={bannerUrlPreview || form.bannerUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="px-5 pb-6 sm:px-8">
        <div className="-mt-9 flex flex-col gap-4 sm:-mt-13 sm:flex-row sm:items-end">
          <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-emerald-200 to-cyan-200 text-2xl font-black sm:h-32 sm:w-32">
            {profilePhotoUrlPreview || form.profilePhotoUrl ? (
              <img src={profilePhotoUrlPreview || form.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0 pb-1">
            <h1 className="truncate text-2xl font-black text-slate-800">{form.fullName || account?.username}</h1>
            <p className="text-sm text-slate-500">@{account?.username}</p>
            <p className="mt-1 text-sm text-slate-600">
              {[form.major, form.university].filter(Boolean).join(" at ") || "Complete your profile to connect with the community."}
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-6 border-t pt-4 text-sm">
          <span><b>{skillTags.length}</b> skills</span>
          <span><b>{interestTags.length}</b> interests</span>
          <Link href="/coins" className="text-amber-600 hover:underline"><b>{account?.weenCoinBalance || 0}</b> coins</Link>
        </div>
      </div>
    </section>
    {error && <div className="mt-5"><Alert>{error}</Alert></div>}
    {notice && <div className="mt-5"><Alert tone="success">{notice}</Alert></div>}
    <form onSubmit={(e) => void save(e)} className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-black">Edit profile</h2>
        <p className="mt-1 text-sm text-slate-500">Your education, interests and skills help people discover you.</p>
      </div>
      <div className="mb-7 grid gap-5 border-b pb-7 sm:grid-cols-2">
        <label className="text-sm font-semibold cursor-pointer">
          Profile photo
          <div className="mt-2 flex items-center h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm justify-between hover:border-slate-300 transition">
            {profilePhoto ? (
              <span className="text-emerald-700 font-bold">Selected Image</span>
            ) : (
              <span className="text-slate-400">No file chosen</span>
            )}
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer transition">
              Choose File
            </span>
          </div>
          <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden"/>
          {profilePhoto && <p className="mt-1.5 text-xs text-emerald-600 font-bold truncate max-w-full">File: {profilePhoto.name}</p>}
        </label>
        <label className="text-sm font-semibold cursor-pointer">
          Profile banner
          <div className="mt-2 flex items-center h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm justify-between hover:border-slate-300 transition">
            {banner ? (
              <span className="text-emerald-700 font-bold">Selected Image</span>
            ) : (
              <span className="text-slate-400">No file chosen</span>
            )}
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer transition">
              Choose File
            </span>
          </div>
          <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden"/>
          {banner && <p className="mt-1.5 text-xs text-emerald-600 font-bold truncate max-w-full">File: {banner.name}</p>}
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input id="fullName" label="Full name" value={form.fullName || ""} onChange={(e) => change("fullName", e.target.value)} />
        <Input id="birthDate" label="Birth date" type="date" value={form.birthDate || ""} onChange={(e) => change("birthDate", e.target.value)} />
        <Input id="phone" label="Phone" value={form.phone || ""} onChange={(e) => change("phone", e.target.value)} />
        <UniversitySelect value={form.university || ""} onChange={(value) => change("university", value)} />
        <Input id="major" label="Major" value={form.major || ""} onChange={(e) => change("major", e.target.value)} />
        <div>
          <label htmlFor="course" className="mb-2 block text-sm font-semibold text-slate-700">Course</label>
          <select id="course" value={form.course || ""} onChange={(e) => change("course", e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">
            <option value="">Select year</option>
            {years.map((year) => <option key={year}>{year}</option>)}
          </select>
        </div>
        <Input id="linkedinUrl" label="LinkedIn URL" type="url" value={form.linkedinUrl || ""} onChange={(e) => change("linkedinUrl", e.target.value)} />
        <Input id="githubUrl" label="GitHub URL" type="url" value={form.githubUrl || ""} onChange={(e) => change("githubUrl", e.target.value)} />
        <div className="sm:col-span-2"><TagInput label="Skills" values={skillTags} onChange={setSkillTags} placeholder="Add a skill and press Enter" /></div>
        <div className="sm:col-span-2"><TagInput label="Interests" values={interestTags} onChange={setInterestTags} placeholder="Add an interest and press Enter" /></div>
        <div className="sm:col-span-2"><Textarea id="bio" label="Bio" value={form.bio || ""} onChange={(e) => change("bio", e.target.value)} /></div>
        <div className="sm:col-span-2 rounded-2xl border border-slate-200 p-5">
          <h3 className="font-black">Privacy & messaging</h3>
          <p className="mt-1 text-xs text-slate-500">Control who can start a new conversation with you.</p>
          <select value={form.messagePermission || "EVERYONE"} onChange={(e)=>change("messagePermission",e.target.value)} className="mt-4 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">
            <option value="EVERYONE">Everyone — unknown people go to Requests</option>
            <option value="FOLLOWERS">People who follow me</option>
            <option value="NOBODY">Nobody new</option>
          </select>
        </div>
        <div className="sm:col-span-2 rounded-2xl border border-slate-200 p-5">
          <h3 className="font-black">Security & personalization</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold">Password & sessions</p>
              <p className="mt-1 text-xs text-slate-500">Secure authentication is managed by your account session.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold">Profile personalization</p>
              <p className="mt-1 text-xs text-slate-500">Photo, banner, education, skills and links are shown above.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" variant="dark" disabled={saving || savedRecently}>{saving ? "Saving…" : savedRecently ? "Saved ✓" : "Save changes"}</Button>
      </div>
    </form>

    <form onSubmit={(e) => void updatePassword(e)} className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-black">Change password</h2>
        <p className="mt-1 text-sm text-slate-500">Keep your account secure by changing your password periodically.</p>
      </div>
      {passwordError && <div className="mb-4"><Alert>{passwordError}</Alert></div>}
      {passwordNotice && <div className="mb-4"><Alert tone="success">{passwordNotice}</Alert></div>}
      <div className="grid gap-5 sm:grid-cols-3">
        <Input id="oldPassword" label="Current password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        <Input id="newPassword" label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <Input id="confirmPassword" label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" variant="dark" disabled={updatingPassword}>{updatingPassword ? "Updating…" : "Update password"}</Button>
      </div>
    </form>
    {croppingImage && (
      <ImageCropperModal
        file={croppingImage.file}
        aspect={croppingImage.aspect}
        cropShape={croppingImage.cropShape}
        onCrop={croppingImage.onCrop}
        onClose={() => setCroppingImage(null)}
      />
    )}
  </div>;
}

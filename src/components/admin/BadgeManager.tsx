"use client";

import { useEffect, useState } from "react";
import { adminApi, errorMessage } from "@/lib/api";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import type { AchievementType, Badge, BadgeInput } from "@/types";
import { Award, BadgePlus, ImageIcon, Pencil, Power, SearchX, X } from "lucide-react";
import { ToastViewport, type ToastMessage } from "@/components/ui/Toast";

const achievementLabels: Record<AchievementType, string> = {
  EVENT_ATTENDANCE_COUNT: "Events attended",
  EVENT_CATEGORY_ATTENDANCE_COUNT: "Events attended in a category",
  REFERRAL_COUNT: "Successful referrals",
  PROFILE_COMPLETION: "Completed profile",
  COIN_BALANCE: "Impact coin balance",
};
const achievementTypes = Object.keys(achievementLabels) as AchievementType[];
const badgeTypes: BadgeInput["type"][] = ["BRONZE", "SILVER", "GOLD", "EVENT_CATEGORY", "STREAK", "ANNIVERSARY"];
const categories = ["HUMAN_RIGHTS", "ENVIRONMENT", "EDUCATION", "HEALTH", "TECHNOLOGY", "CULTURE", "INTERNATIONAL"];
const blank: BadgeInput = {
  name: "",
  description: "",
  type: "BRONZE",
  achievementType: "EVENT_ATTENDANCE_COUNT",
  achievementThreshold: 1,
  points: 0,
  imageUrl: "",
  isActive: true,
};

export function BadgeManager() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [form, setForm] = useState<BadgeInput>(blank);
  const [editing, setEditing] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState<File>();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function notify(title: string, description?: string) {
    const id = Date.now();
    setToasts((current) => [...current, { id, title, description, tone: "success" }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }

  const [croppingImage, setCroppingImage] = useState<{
    file: File;
    aspect: number;
    cropShape: "rect" | "round";
    onCrop: (croppedFile: File) => void;
  } | null>(null);

  const handleArtworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCroppingImage({
        file,
        aspect: 1,
        cropShape: "rect",
        onCrop: (cropped) => {
          setImage(cropped);
          setCroppingImage(null);
        },
      });
      e.target.value = "";
    }
  };

  async function load() {
    try {
      setBadges((await adminApi.badges()).content);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }
  useEffect(() => { void load(); }, []);

  function edit(badge: Badge) {
    setEditing(badge.id);
    setForm({
      name: badge.name,
      description: badge.description || "",
      type: badge.type,
      achievementType: badge.achievementType,
      achievementThreshold: badge.achievementThreshold,
      eventCategory: badge.eventCategory,
      points: badge.points,
      imageUrl: badge.imageUrl || "",
      isActive: badge.isActive,
    });
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      if (editing) await adminApi.updateBadge(editing, form, image);
      else await adminApi.createBadge(form, image);
      setOpen(false); setEditing(""); setForm(blank);
      setImage(undefined);
      await load();
      notify(editing ? "Badge updated" : "Badge created", form.name);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(id: string) {
    setBusy(true);
    try {
      await adminApi.deactivateBadge(id);
      await load();
      notify("Badge deactivated");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
    <ToastViewport messages={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
    <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-xl font-black">Achievement badges</h2><p className="mt-1 text-sm text-slate-500">Create a rule once; qualifying members receive the badge automatically.</p></div>
      <button onClick={() => { setEditing(""); setForm(blank); setOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-emerald-950 transition hover:-translate-y-0.5 hover:shadow-glow"><BadgePlus className="h-[18px] w-[18px]" strokeWidth={1.9} />Create badge</button>
    </div>
    {error && <p className="m-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
      {badges.map((badge) => <article key={badge.id} className={`rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-soft ${badge.isActive ? "border-border" : "border-slate-100 opacity-55"}`}>
        <div className="flex gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 to-emerald-100 text-amber-700">{badge.imageUrl ? <img src={badge.imageUrl} alt="" className="h-full w-full object-cover" /> : <Award className="h-7 w-7" strokeWidth={1.9} />}</span>
          <div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-black">{badge.name}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black">{badge.type}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{badge.description || "No description"}</p></div>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs"><b>{achievementLabels[badge.achievementType]}</b><span className="text-slate-500"> · target {badge.achievementThreshold}{badge.eventCategory ? ` · ${badge.eventCategory}` : ""}</span></div>
        <div className="mt-4 flex gap-2"><button onClick={() => edit(badge)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-black transition hover:bg-surface"><Pencil className="h-4 w-4" />Edit</button>{badge.isActive && <button disabled={busy} onClick={() => void deactivate(badge.id)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-xs font-black text-red-600 transition hover:bg-red-50"><Power className="h-4 w-4" />Deactivate</button>}</div>
      </article>)}
      {!badges.length && <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500"><SearchX className="mx-auto mb-3 h-8 w-8 text-slate-300" />No badges yet. Create the first achievement rule.</div>}
    </div>

    {open && <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <form onSubmit={save} className="my-6 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-emerald-600">Achievement rule</p><h3 className="mt-2 text-2xl font-black">{editing ? "Edit badge" : "Create a badge"}</h3></div><button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-muted transition hover:bg-slate-200 hover:text-ink" aria-label="Close"><X className="h-5 w-5" /></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-bold">Badge name<input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 h-12 w-full rounded-xl border px-4 font-medium" placeholder="Community Champion" /></label>
          <label className="sm:col-span-2 text-sm font-bold">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl border p-4 font-medium" placeholder="Awarded to members who consistently show up and make an impact." /></label>
          <label className="text-sm font-bold">Visual tier<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as BadgeInput["type"] })} className="mt-2 h-12 w-full rounded-xl border px-3">{badgeTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-bold">Achievement<select value={form.achievementType} onChange={(e) => setForm({ ...form, achievementType: e.target.value as AchievementType, eventCategory: undefined })} className="mt-2 h-12 w-full rounded-xl border px-3">{achievementTypes.map((item) => <option value={item} key={item}>{achievementLabels[item]}</option>)}</select></label>
          <label className="text-sm font-bold">Required target<input required min={1} type="number" value={form.achievementThreshold} onChange={(e) => setForm({ ...form, achievementThreshold: Number(e.target.value) })} className="mt-2 h-12 w-full rounded-xl border px-4" /></label>
          <label className="text-sm font-bold">Badge points<input min={0} type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} className="mt-2 h-12 w-full rounded-xl border px-4" /></label>
          {form.achievementType === "EVENT_CATEGORY_ATTENDANCE_COUNT" && <label className="sm:col-span-2 text-sm font-bold">Event category<select required value={form.eventCategory || ""} onChange={(e) => setForm({ ...form, eventCategory: e.target.value })} className="mt-2 h-12 w-full rounded-xl border px-3"><option value="">Choose category</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>}
          <label className="sm:col-span-2 text-sm font-bold">Badge artwork<input type="file" accept="image/*" onChange={handleArtworkChange} className="mt-2 block w-full rounded-xl border p-3 text-sm"/><span className="mt-1 block text-xs font-normal text-slate-400">{image?.name || (editing && form.imageUrl ? "Keep current image unless a new file is selected." : "Optional image file")}</span></label>
        </div>
        <button disabled={busy} className="mt-7 h-12 w-full rounded-full bg-[#26DE81] text-sm font-black text-emerald-950 disabled:opacity-50">{busy ? "Saving…" : editing ? "Save changes" : "Create badge & evaluate users"}</button>
      </form>
    </div>}
    {croppingImage && (
      <ImageCropperModal
        file={croppingImage.file}
        aspect={croppingImage.aspect}
        cropShape={croppingImage.cropShape}
        onCrop={croppingImage.onCrop}
        onClose={() => setCroppingImage(null)}
      />
    )}
  </section>;
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { errorMessage, organizationsApi, authApi, type OrganizationInput, type OrganizationProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { Textarea } from "@/components/ui/Textarea";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";

export function OrganizationSettings({ organizationId }: { organizationId: string }) {
  const { refresh } = useAuth();
  const [organization, setOrganization] = useState<OrganizationProfile>();
  const [form, setForm] = useState<OrganizationInput>({ organizationName: "", email: "" });
  const [logo, setLogo] = useState<File>();
  const [banner, setBanner] = useState<File>();
  const [invitee, setInvitee] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [croppingImage, setCroppingImage] = useState<{
    file: File;
    aspect: number;
    cropShape: "rect" | "round";
    onCrop: (croppedFile: File) => void;
  } | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCroppingImage({
        file,
        aspect: 1,
        cropShape: "round",
        onCrop: (cropped) => {
          setLogo(cropped);
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

  useEffect(() => {
    organizationsApi.get(organizationId).then((value) => {
      setOrganization(value);
      setForm({ organizationName: value.organizationName, email: value.email, description: value.description, website: value.website });
    }).catch((cause) => setError(errorMessage(cause)));
  }, [organizationId]);

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const updated = await organizationsApi.update(organizationId, form, logo, banner);
      await authApi.updateSession({
        organizationName: updated.organizationName,
        profilePhotoUrl: updated.logoUrl,
      });
      await refresh();
      setOrganization(updated); setNotice("Organization profile updated."); setLogo(undefined); setBanner(undefined);
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }

  async function invite(event: FormEvent) {
    event.preventDefault(); if (!invitee.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try { await organizationsApi.inviteOrganizer(organizationId, invitee.trim()); setInvitee(""); setNotice("Organizer invitation sent."); }
    catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }

  if (!organization && !error) return <Loading label="Loading organization…" />;
  return <div className="mx-auto max-w-4xl space-y-6">
    {error && <Alert>{error}</Alert>}{notice && <Alert tone="success">{notice}</Alert>}
    {organization && <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white"><div className="h-40 bg-gradient-to-r from-emerald-950 to-cyan-700">{organization.bannerUrl && <img src={organization.bannerUrl} alt="" className="h-full w-full object-cover" />}</div><div className="p-6"><div className="flex items-center gap-4"><span className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-emerald-100 text-2xl font-black">{organization.logoUrl ? <img src={organization.logoUrl} alt="" className="h-full w-full object-cover" /> : organization.organizationName.slice(0,2).toUpperCase()}</span><div><h1 className="text-2xl font-black">{organization.organizationName}</h1><p className="text-sm text-slate-500">@{organization.username}</p><span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-black ${organization.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{organization.isVerified ? "VERIFIED" : "APPROVAL PENDING"}</span></div></div></div></section>}
    <form onSubmit={save} className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black">Organization profile</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><Input id="organizationName" label="Organization name" value={form.organizationName} onChange={(e)=>setForm({...form,organizationName:e.target.value})}/><Input id="organizationEmail" label="Email" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/><Input id="website" label="Website" type="url" value={form.website || ""} onChange={(e)=>setForm({...form,website:e.target.value})}/><label className="text-sm font-semibold">Logo<input type="file" accept="image/*" onChange={handleLogoChange} className="mt-2 block w-full rounded-xl border p-3"/></label><label className="text-sm font-semibold sm:col-span-2">Banner<input type="file" accept="image/*" onChange={handleBannerChange} className="mt-2 block w-full rounded-xl border p-3"/></label><div className="sm:col-span-2"><Textarea id="organizationDescription" label="Description" value={form.description || ""} onChange={(e)=>setForm({...form,description:e.target.value})}/></div></div><div className="mt-6 flex justify-end"><Button type="submit" variant="dark" disabled={busy}>Save organization</Button></div></form>
    <form onSubmit={invite} className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black">Organizer access</h2><p className="mt-1 text-sm text-slate-500">Invite an existing Ween user by username or email. They receive approve/reject links.</p><div className="mt-5 flex gap-3"><input value={invitee} onChange={(e)=>setInvitee(e.target.value)} placeholder="username or email" className="h-12 min-w-0 flex-1 rounded-xl border px-4"/><Button type="submit" variant="dark" disabled={busy || !invitee.trim()}>Send invite</Button></div></form>
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

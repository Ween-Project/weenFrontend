"use client";

import { useState, type FormEvent } from "react";
import { ApiError, errorMessage, eventsApi, aiApi } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { EVENT_CATEGORIES, EVENT_STATUSES, type EventInput, type EventSummary } from "@/types";

type FormErrors = Record<string, string>;

function localDateTime(value?: string) {
  return value ? value.slice(0, 16) : "";
}

export function EventForm({
  event,
  onSaved,
}: {
  event?: EventSummary;
  onSaved: (event: EventSummary) => void;
}) {
  const [form, setForm] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    category: event?.category ?? EVENT_CATEGORIES[0],
    city: event?.city ?? "",
    address: event?.address ?? "",
    isOnline: event?.isOnline ?? false,
    startDate: localDateTime(event?.startDate),
    endDate: localDateTime(event?.endDate),
    registrationDeadline: localDateTime(event?.registrationDeadline),
    maxParticipants: event?.maxParticipants?.toString() ?? "",
    coverImageUrl: event?.coverImageUrl ?? "",
    status: event?.status ?? "DRAFT",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [coverImage, setCoverImage] = useState<File>();

  const [croppingImage, setCroppingImage] = useState<{
    file: File;
    aspect: number;
    cropShape: "rect" | "round";
    onCrop: (croppedFile: File) => void;
  } | null>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCroppingImage({
        file,
        aspect: 16 / 9,
        cropShape: "rect",
        onCrop: (cropped) => {
          setCoverImage(cropped);
          setCroppingImage(null);
        },
      });
      e.target.value = "";
    }
  };

  const change = (name: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  async function handleSuggestDescription() {
    if (!form.title.trim()) {
      setErrors((current) => ({ ...current, title: "Please enter an event title first to generate suggestions." }));
      return;
    }
    setGenerating(true);
    setRequestError("");
    try {
      const res = await aiApi.suggestEventContent({
        title: form.title.trim(),
        category: form.category,
      });

      const formatted = `${res.description}\n\nRequirements:\n${res.requirements.map(r => `• ${r}`).join("\n")}\n\nSchedule:\n${res.schedule.map(s => `• ${s}`).join("\n")}`;
      change("description", formatted);
    } catch (cause) {
      setRequestError(errorMessage(cause));
    } finally {
      setGenerating(false);
    }
  }

  function validate() {
    const next: FormErrors = {};
    if (!form.title.trim()) next.title = "Event title is required.";
    else if (form.title.length > 300) next.title = "Title must not exceed 300 characters.";
    if (!form.description.trim()) next.description = "Event description is required.";
    if (!form.startDate) next.startDate = "Start date is required.";
    if (!form.endDate) next.endDate = "End date is required.";
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) next.endDate = "End date must be after the start date.";
    if (form.registrationDeadline && form.startDate && new Date(form.registrationDeadline) > new Date(form.startDate)) next.registrationDeadline = "Registration deadline must not be after the start date.";
    if (form.maxParticipants && Number(form.maxParticipants) < 1) next.maxParticipants = "Max participants must be at least 1.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const input: EventInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      city: form.city || undefined,
      address: form.address || undefined,
      isOnline: form.isOnline,
      startDate: `${form.startDate}:00`,
      endDate: `${form.endDate}:00`,
      registrationDeadline: form.registrationDeadline ? `${form.registrationDeadline}:00` : undefined,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
      ...(event ? { status: form.status } : {}),
    };
    setSubmitting(true);
    setRequestError("");
    try {
      const saved = event ? await eventsApi.update(event.id, input, coverImage) : await eventsApi.create(input, coverImage);
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError) setErrors((current) => ({ ...current, ...error.fieldErrors }));
      setRequestError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={(e) => void submit(e)} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" noValidate>
        {requestError && <div className="mb-5"><Alert>{requestError}</Alert></div>}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Input id="title" label="Title *" value={form.title} onChange={(e) => change("title", e.target.value)} error={errors.title} maxLength={300} /></div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="description" className="text-sm font-semibold text-slate-700">Description *</label>
              <button
                type="button"
                onClick={() => void handleSuggestDescription()}
                disabled={generating}
                className="text-xs font-bold text-emerald-700 hover:underline disabled:opacity-50"
              >
                {generating ? "Generating suggestion..." : "✨ Suggest description with AI"}
              </button>
            </div>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => change("description", e.target.value)}
              className={`min-h-28 w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 ${errors.description ? "border-red-400" : "border-slate-200"}`}
              placeholder="Tell volunteers about the event..."
            />
            {errors.description && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.description}</p>}
          </div>
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-700">Category *</label>
            <select id="category" value={form.category} onChange={(e) => change("category", e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">
              {EVENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
          {event && <div><label htmlFor="status" className="mb-2 block text-sm font-semibold text-slate-700">Status</label><select id="status" value={form.status} onChange={(e) => change("status", e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">{EVENT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>}
          <Input id="city" label="City" value={form.city} onChange={(e) => change("city", e.target.value)} />
          <Input id="address" label="Address" value={form.address} onChange={(e) => change("address", e.target.value)} />
          <Input id="startDate" label="Start date *" type="datetime-local" value={form.startDate} onChange={(e) => change("startDate", e.target.value)} error={errors.startDate} />
          <Input id="endDate" label="End date *" type="datetime-local" value={form.endDate} onChange={(e) => change("endDate", e.target.value)} error={errors.endDate} />
          <Input id="registrationDeadline" label="Registration deadline" type="datetime-local" value={form.registrationDeadline} onChange={(e) => change("registrationDeadline", e.target.value)} error={errors.registrationDeadline} />
          <Input id="maxParticipants" label="Maximum participants" type="number" min={1} value={form.maxParticipants} onChange={(e) => change("maxParticipants", e.target.value)} error={errors.maxParticipants} />
          <label className="sm:col-span-2 text-sm font-semibold text-slate-700">Event cover image<input type="file" accept="image/*" onChange={handleCoverChange} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm" /><span className="mt-1 block text-xs font-normal text-slate-400">{coverImage?.name || (event?.coverImageUrl ? "Keep current cover unless a new file is selected." : "Optional image file")}</span></label>
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 sm:col-span-2"><input type="checkbox" checked={form.isOnline} onChange={(e) => change("isOnline", e.target.checked)} className="h-5 w-5 accent-emerald-700" />This is an online event</label>
        </div>
        <div className="mt-7 flex justify-end"><Button type="submit" variant="dark" disabled={submitting}>{submitting ? "Saving…" : event ? "Save changes" : "Create event"}</Button></div>
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
    </>
  );
}

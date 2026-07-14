"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, eventsApi, socialProfileApi } from "@/lib/api";
import { QrScannerModal } from "@/components/qr/QrScannerModal";
import { ScanLine } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";
import type { EventDetail, EventStatsResponse, ParticipantResponse, Certificate } from "@/types";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { account } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Organizer data state
  const [stats, setStats] = useState<EventStatsResponse | null>(null);
  const [participants, setParticipants] = useState<ParticipantResponse[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);

  // Volunteer certificate state
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  const owner = account?.id === event?.organizationId;
  const isManager = owner || account?.role === "ADMIN";

  const loadOrganizerData = useCallback(async () => {
    try {
      const [statsResult, participantsResult] = await Promise.all([
        eventsApi.stats(params.id),
        eventsApi.participants(params.id, 0)
      ]);
      setStats(statsResult);
      setParticipants(participantsResult.content);
    } catch (cause) {
      console.error("Failed to load organizer data:", cause);
    }
  }, [params.id]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const detail = await eventsApi.detail(params.id);
      if (account?.role === "VOLUNTEER") {
        const mine = await eventsApi.mine();
        detail.userRegistered = mine.content.some((item) => item.id === detail.id);

        // Fetch certificates
        const certs = await socialProfileApi.certificates("me");
        const matching = certs.content.find((c) => c.eventId === detail.id);
        if (matching) {
          setCertificate(matching);
        }
      }
      setEvent(detail);
    } catch (cause) { setError(errorMessage(cause)); } finally { setLoading(false); }
  }, [account?.role, params.id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (isManager && event) {
      void loadOrganizerData();
    }
  }, [isManager, event, loadOrganizerData]);

  async function remove() {
    if (!window.confirm("Delete this event? This action cannot be undone.")) return;
    setAction("delete"); setError("");
    try { await eventsApi.delete(params.id); router.replace("/events"); router.refresh(); } catch (cause) { setError(errorMessage(cause)); setAction(""); }
  }

  async function toggleRegistration() {
    if (!event) return;
    setAction("register"); setError(""); setNotice("");
    try {
      if (event.userRegistered) await eventsApi.cancelRegistration(event.id); else await eventsApi.register(event.id);
      setEvent({ ...event, userRegistered: !event.userRegistered, currentRegistrations: Math.max(0, (event.currentRegistrations || 0) + (event.userRegistered ? -1 : 1)) });
      setNotice(event.userRegistered ? "Registration cancelled." : "You are registered.");
    } catch (cause) { setError(errorMessage(cause)); } finally { setAction(""); }
  }

  async function handlePublish() {
    setBusyStatus(true); setError(""); setNotice("");
    try {
      await eventsApi.publish(params.id);
      setNotice("Event has been published.");
      await load();
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusyStatus(false); }
  }

  async function handleStart() {
    setBusyStatus(true); setError(""); setNotice("");
    try {
      await eventsApi.start(params.id);
      setNotice("Event has started.");
      await load();
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusyStatus(false); }
  }

  async function handleComplete() {
    setBusyStatus(true); setError(""); setNotice("");
    try {
      await eventsApi.complete(params.id);
      setNotice("Event has completed.");
      await load();
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusyStatus(false); }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this event?")) return;
    setBusyStatus(true); setError(""); setNotice("");
    try {
      await eventsApi.cancel(params.id);
      setNotice("Event has been cancelled.");
      await load();
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusyStatus(false); }
  }

  if (loading) return <Loading label="Loading event…" />;
  if (!event) return <div className="mx-auto max-w-3xl"><Alert>{error || "Event not found."}</Alert></div>;
  const canDelete = owner || account?.role === "ADMIN";
  const canCheckIn = isManager && ["PUBLISHED", "REGISTRATION_CLOSED", "ONGOING"].includes(event.status);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="h-52 bg-emerald-100 sm:h-72">{event.coverImageUrl && <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" />}</div>
        <div className="p-5 sm:p-8">
          {error && <div className="mb-5"><Alert>{error}</Alert></div>}
          {notice && <div className="mb-5"><Alert tone="success">{notice}</Alert></div>}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-700">{event.category.replaceAll("_", " ")} · {event.status}</p>
              <h2 className="mt-2 break-words text-3xl font-black text-slate-950">{event.title}</h2>
              <p className="mt-2 text-sm text-slate-500">Hosted by {event.organizationName || "Ween organization"}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {owner && <Link href={`/events/${event.id}/edit`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold">Edit</Link>}
              {canDelete && <button onClick={() => void remove()} disabled={Boolean(action)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-60">{action === "delete" ? "Deleting…" : "Delete"}</button>}
            </div>
          </div>
          <div className="mt-7 grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-2">
            <p><strong>Starts:</strong><br />{new Date(event.startDate).toLocaleString()}</p>
            <p><strong>Ends:</strong><br />{new Date(event.endDate).toLocaleString()}</p>
            <p><strong>Location:</strong><br />{event.isOnline ? "Online" : [event.address, event.city].filter(Boolean).join(", ") || "TBA"}</p>
            <p><strong>Capacity:</strong><br />{event.currentRegistrations || 0}{event.maxParticipants ? ` / ${event.maxParticipants}` : ""} registered</p>
          </div>
          <p className="mt-7 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{event.description}</p>

          {certificate && (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-bold text-amber-900">Certificate Available</p>
                <p className="text-xs text-amber-700 mt-1">You earned a certificate for attending this event! Cert # {certificate.certificateNumber}</p>
              </div>
              <a
                href={`/api/backend/api/v1/certificates/download/${certificate.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-amber-600 px-5 py-2.5 text-center text-xs font-black text-white hover:bg-amber-700"
              >
                Download PDF Certificate
              </a>
            </div>
          )}

          {account?.role === "VOLUNTEER" && !certificate && (
            <button onClick={() => void toggleRegistration()} disabled={Boolean(action)} className="mt-8 w-full rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{action === "register" ? "Updating…" : event.userRegistered ? "Cancel registration" : "Register for event"}</button>
          )}
        </div>
      </article>

      {isManager && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-black">Organizer Control Panel</h2>
            <p className="text-sm text-slate-500 mt-1">Manage event status, view enrollment analytics, and scan user check-ins.</p>
          </div>

          {/* Lifecycle state controls */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Event Status Actions</h3>
            <div className="flex flex-wrap gap-2">
              {event.status === "DRAFT" && (
                <Button onClick={() => void handlePublish()} disabled={busyStatus} variant="dark">Publish Event</Button>
              )}
              {event.status === "PUBLISHED" && (
                <Button onClick={() => void handleStart()} disabled={busyStatus} variant="dark">Start Event</Button>
              )}
              {event.status === "ONGOING" && (
                <Button onClick={() => void handleComplete()} disabled={busyStatus} variant="dark">Complete Event</Button>
              )}
              {event.status !== "COMPLETED" && event.status !== "CANCELLED" && (
                <button onClick={() => void handleCancel()} disabled={busyStatus} className="rounded-full border border-red-200 px-5 py-2.5 text-xs font-black text-red-600 hover:bg-red-50">Cancel Event</button>
              )}
            </div>
          </div>

          {/* Stats Analytics */}
          {stats && (
            <div className="border-t pt-4 grid gap-4 grid-cols-2 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs text-slate-500 font-bold">REGISTERED</p>
                <p className="text-xl font-black mt-1 text-slate-950">{stats.totalRegistered}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs text-slate-500 font-bold">ATTENDED</p>
                <p className="text-xl font-black mt-1 text-emerald-600">{stats.totalAttended}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs text-slate-500 font-bold">REGISTRATION RATE</p>
                <p className="text-xl font-black mt-1 text-slate-950">{stats.registrationRate}%</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs text-slate-500 font-bold">ATTENDANCE RATE</p>
                <p className="text-xl font-black mt-1 text-emerald-600">{stats.attendanceRate}%</p>
              </div>
            </div>
          )}

          {/* QR Scan checkin */}
          {canCheckIn && (
            <div className="border-t pt-4">
              <div className="flex flex-col gap-4 rounded-2xl bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Volunteer Check-in</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Scan a participant&apos;s Ween QR code to confirm attendance instantly.</p>
                </div>
                <button type="button" onClick={() => setScannerOpen(true)} className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto">
                  <ScanLine className="h-5 w-5" /> Scan QR code
                </button>
              </div>
            </div>
          )}

          {/* Participants list */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Registered Participants</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-slate-400 font-black uppercase tracking-wider">
                    <th className="py-2.5">Volunteer</th>
                    <th className="py-2.5">Username</th>
                    <th className="py-2.5">Enrolled At</th>
                    <th className="py-2.5">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {participants.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-slate-100 font-bold text-[10px]">
                          {p.profilePhotoUrl ? <img src={p.profilePhotoUrl} alt="" className="h-full w-full object-cover" /> : p.fullName.slice(0,2).toUpperCase()}
                        </span>
                        <span className="font-bold text-slate-900">{p.fullName}</span>
                      </td>
                      <td className="py-3 text-slate-500">@{p.username}</td>
                      <td className="py-3 text-slate-400">{new Date(p.registeredAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 font-bold ${p.isJoined ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                          {p.isJoined ? "ATTENDED" : "REGISTERED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {participants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">No participants registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {canCheckIn && (
        <QrScannerModal
          open={scannerOpen}
          eventId={event.id}
          eventTitle={event.title}
          onClose={() => setScannerOpen(false)}
          onCheckedIn={loadOrganizerData}
        />
      )}
    </div>
  );
}
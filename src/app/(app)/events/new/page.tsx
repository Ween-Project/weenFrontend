"use client";
import { useRouter } from "next/navigation";
import { EventForm } from "@/components/events/EventForm";
import { RoleGuard } from "@/components/RoleGuard";

export default function NewEventPage() {
  const router = useRouter();
  return <RoleGuard allow={["ORGANIZER", "ORGANIZATION_ADMIN"]}><div className="mx-auto max-w-3xl"><h2 className="mb-6 text-3xl font-black text-slate-950">Create an event</h2><EventForm onSaved={(event) => router.replace(`/events/${event.id}`)} /></div></RoleGuard>;
}

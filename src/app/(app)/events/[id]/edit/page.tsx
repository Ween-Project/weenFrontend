"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { errorMessage, eventsApi } from "@/lib/api";
import { EventForm } from "@/components/events/EventForm";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import type { EventSummary } from "@/types";

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { account } = useAuth();
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    eventsApi
      .detail(params.id)
      .then((data) => setEvent(data))
      .catch((cause) => setError(errorMessage(cause)))
      .finally(() => setLoading(false));
  }, [params.id]);
  if (loading) return <Loading label="Loading event…" />;
  if (!event) return <Alert>{error || "Event not found."}</Alert>;
  if (account?.id !== event.organizationId)
    return <Alert>You can edit only events owned by your organization.</Alert>;
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-3xl font-black text-slate-950">Edit event</h2>
      <EventForm
        event={event}
        onSaved={(saved) => router.replace(`/events/${saved.id}`)}
      />
    </div>
  );
}

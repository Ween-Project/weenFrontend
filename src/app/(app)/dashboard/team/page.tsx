"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { organizationsApi, OrganizerResponse } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";

export default function TeamPage() {
  const { account } = useAuth();
  const [organizers, setOrganizers] = useState<OrganizerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (account?.id && account?.role === "ORGANIZATION_ADMIN") {
      loadOrganizers();
    }
  }, [account]);

  const loadOrganizers = async () => {
    try {
      setLoading(true);
      const res = await organizationsApi.organizers(account!.id);
      setOrganizers(res);
    } catch (err) {
      toast.error("Failed to load organizers");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) return;
    try {
      setInviting(true);
      await organizationsApi.inviteOrganizer(account!.id, inviteIdentifier.trim());
      toast.success("Invitation sent successfully!");
      setIsInviteModalOpen(false);
      setInviteIdentifier("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (organizerId: string) => {
    if (!confirm("Are you sure you want to remove this organizer?")) return;
    try {
      setRemovingId(organizerId);
      await organizationsApi.removeOrganizer(account!.id, organizerId);
      setOrganizers((prev) => prev.filter((org) => org.organizerId !== organizerId));
      toast.success("Organizer removed successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove organizer");
    } finally {
      setRemovingId(null);
    }
  };

  if (account?.role !== "ORGANIZATION_ADMIN") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-slate-500">You do not have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Team Management</h1>
          <p className="mt-2 text-slate-500">Manage your organizers and invite new members to your team.</p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6M22 11h-6" />
          </svg>
          Invite Member
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="font-bold text-slate-700">Active Organizers</h2>
        </div>
        
        <div className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))
          ) : organizers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="font-semibold text-slate-900">No organizers yet</p>
              <p className="mt-1 text-sm text-slate-500">Invite people to help manage your organization.</p>
            </div>
          ) : (
            organizers.map((org) => (
              <div key={org.organizerId} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  {org.profilePhotoUrl ? (
                    <img src={org.profilePhotoUrl} alt={org.fullName} className="h-12 w-12 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700 shadow-sm">
                      {org.fullName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900">{org.fullName}</h3>
                    <p className="text-sm text-slate-500">@{org.username} &middot; {org.email}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  disabled={removingId === org.organizerId}
                  onClick={() => handleRemove(org.organizerId)}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {removingId === org.organizerId ? "Removing..." : "Remove"}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Invite Organizer</h3>
            <p className="mt-2 text-sm text-slate-500">
              Enter the username or email of the person you want to invite. They will receive an email invitation to join your team.
            </p>
            
            <form onSubmit={handleInvite} className="mt-6 space-y-4">
              <div>
                <Input
                  id="identifier"
                  label="Email or Username"
                  placeholder="johndoe or john@example.com"
                  value={inviteIdentifier}
                  onChange={(e) => setInviteIdentifier(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="mt-8 flex gap-3">
                <Button type="button" variant="secondary" className="w-full" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="w-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={inviting || !inviteIdentifier.trim()}>
                  {inviting ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

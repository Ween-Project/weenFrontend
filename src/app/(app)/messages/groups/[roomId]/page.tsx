"use client";

import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { chatApi, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useStomp } from "@/lib/use-stomp";
import type { GroupMessage } from "@/types";

const POPULAR_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️",
  "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓",
  "🤗", "🤔", "🫣", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🫨", "🫠", "✍️", "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞",
  "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🙏", "🤝", "👏",
  "🙌", "👐", "🤲", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "✨", "⚡", "🔥", "💥", "🎉"
];

export default function GroupChatPage({ params }: { params: { roomId: string } }) {
  return (
    <RoleGuard allow={["VOLUNTEER", "ORGANIZER", "ORGANIZATION_ADMIN", "ADMIN"]}>
      <GroupChat roomId={params.roomId} />
    </RoleGuard>
  );
}

function GroupChat({ roomId }: { roomId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomName = searchParams.get("name") ?? "Group Chat";
  const { account } = useAuth();

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Group settings inputs
  const [inviteUsername, setInviteUsername] = useState("");
  const [removeUsername, setRemoveUsername] = useState("");
  const [roleUsername, setRoleUsername] = useState("");
  const [memberRole, setMemberRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [actionBusy, setActionBusy] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const pageResult = await chatApi.groupMessages(roomId);
      const sorted = [...pageResult.content].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sorted);
      setLoading(false);
    } catch (cause) {
      setError(errorMessage(cause));
      setLoading(false);
    }
  }, [roomId]);

  useStomp<GroupMessage>(
    `/topic/group/${roomId}`,
    (msg) => {
      setMessages((current) => {
        if (current.some((m) => m.id === msg.id)) return current;
        return [...current, msg];
      });
    },
    loadMessages
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput("");
    inputRef.current?.focus();
    setSending(true);
    try {
      const sent = await chatApi.sendGroup(roomId, content);
      setMessages((current) => {
        if (current.some((m) => m.id === sent.id)) return current;
        return [...current, sent];
      });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!inviteUsername.trim() || actionBusy) return;
    setActionBusy(true);
    setError("");
    setNotice("");
    try {
      await chatApi.addMember(roomId, inviteUsername.trim());
      setNotice(`Successfully invited @${inviteUsername.trim()} to the group.`);
      setInviteUsername("");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRemoveMember(e: FormEvent) {
    e.preventDefault();
    if (!removeUsername.trim() || actionBusy) return;
    setActionBusy(true);
    setError("");
    setNotice("");
    try {
      await chatApi.removeMember(roomId, removeUsername.trim());
      setNotice(`Successfully removed @${removeUsername.trim()} from the group.`);
      setRemoveUsername("");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this group?")) return;
    setActionBusy(true);
    setError("");
    try {
      await chatApi.leave(roomId);
      router.replace("/messages");
    } catch (cause) {
      setError(errorMessage(cause));
      setActionBusy(false);
    }
  }

  async function handleRoleChange(e: FormEvent) {
    e.preventDefault(); if (!roleUsername.trim() || actionBusy) return;
    setActionBusy(true); setError(""); setNotice("");
    try { await chatApi.changeMemberRole(roomId, roleUsername.trim(), memberRole); setNotice(`@${roleUsername.trim()} is now ${memberRole.toLowerCase()}.`); setRoleUsername(""); }
    catch (cause) { setError(errorMessage(cause)); } finally { setActionBusy(false); }
  }

  if (loading) return <Loading label="Loading group room…" />;

  return (
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm relative">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Link href="/messages" className="text-slate-500 hover:text-slate-900 text-lg mr-2 font-bold">←</Link>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-100 text-lg">♟</span>
            <div>
              <h1 className="text-sm font-black text-slate-900">{roomName}</h1>
              <p className="text-[10px] text-slate-400">Group chat room</p>
            </div>
          </div>
          <button
            onClick={() => setShowDrawer((v) => !v)}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Group Settings
          </button>
        </header>

        {error && <div className="p-3 bg-red-50 border-b"><Alert>{error}</Alert></div>}
        {notice && <div className="p-3 bg-emerald-50 border-b"><Alert tone="success">{notice}</Alert></div>}

        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/50">
          {messages.map((msg) => {
            const isMe = msg.senderId === account?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className="flex gap-2 max-w-[75%] items-start">
                  {!isMe && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                      MB
                    </span>
                  )}
                  <div className={`rounded-2xl px-4 py-2 text-sm leading-6 shadow-sm ${isMe ? "bg-emerald-600 text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"}`}>
                    <p className="break-words">{msg.content}</p>
                    <span className={`block mt-1 text-[8px] text-right ${isMe ? "text-emerald-200" : "text-slate-400"}`}>
                      {new Date(msg.createdAt.endsWith("Z") ? msg.createdAt : msg.createdAt + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t p-3.5 bg-white items-center relative">
          <div ref={emojiPickerRef} className="relative flex items-center">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
              </svg>
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-14 left-0 z-50 h-64 w-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl transition-all">
                <div className="grid grid-cols-8 gap-2">
                  {POPULAR_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="flex h-7 w-7 items-center justify-center rounded text-lg hover:bg-slate-100 transition active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a group message..."
            disabled={sending}
            className="h-11 flex-1 rounded-full bg-slate-100 px-4 text-xs border border-transparent focus:border-slate-200 focus:bg-white focus:outline-none"
          />
          <button
            disabled={!input.trim() || sending}
            className="h-11 rounded-full bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>

      {showDrawer && (
        <div className="absolute inset-y-0 right-0 w-80 bg-white border-l border-slate-200 z-10 flex flex-col p-5 shadow-xl">
          <div className="flex items-center justify-between border-b pb-3 mb-5">
            <h2 className="font-black text-sm">Group Actions</h2>
            <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-slate-900 font-bold">×</button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Invite member */}
            <form onSubmit={handleAddMember} className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Invite member</label>
              <div className="flex gap-2">
                <input
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Username"
                  className="h-9 min-w-0 flex-1 rounded-xl bg-slate-100 px-3 text-xs border focus:border-slate-200 focus:bg-white focus:outline-none"
                />
                <button disabled={actionBusy} className="rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700">Add</button>
              </div>
            </form>

            {/* Remove member */}
            <form onSubmit={handleRemoveMember} className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Remove member</label>
              <div className="flex gap-2">
                <input
                  value={removeUsername}
                  onChange={(e) => setRemoveUsername(e.target.value)}
                  placeholder="Username"
                  className="h-9 min-w-0 flex-1 rounded-xl bg-slate-100 px-3 text-xs border focus:border-slate-200 focus:bg-white focus:outline-none"
                />
                <button disabled={actionBusy} className="rounded-xl bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700">Kick</button>
              </div>
            </form>
            <form onSubmit={handleRoleChange} className="space-y-2"><label className="block text-xs font-bold uppercase text-slate-500">Change member role</label><input value={roleUsername} onChange={(e)=>setRoleUsername(e.target.value)} placeholder="Username" className="h-9 w-full rounded-xl border bg-slate-100 px-3 text-xs"/><div className="flex gap-2"><select value={memberRole} onChange={(e)=>setMemberRole(e.target.value as "ADMIN"|"MEMBER")} className="h-9 flex-1 rounded-xl border px-3 text-xs"><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select><button disabled={actionBusy} className="rounded-xl bg-slate-900 px-3 text-xs font-bold text-white">Update</button></div></form>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={() => void handleLeave()}
              disabled={actionBusy}
              className="w-full rounded-full border border-red-200 py-2.5 text-xs font-black text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Leave Group Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

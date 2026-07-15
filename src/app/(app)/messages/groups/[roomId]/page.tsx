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
import type { GroupMessage, UserResponse } from "@/types";

const POPULAR_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️",
  "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓",
  "🤗", "🤔", "🫣", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🫨", "🫠", "✍️", "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞",
  "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🙏", "🤝", "👏",
  "🙌", "👐", "🤲", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🔥", "✨", "⚡", "🔥", "💥", "🎉"
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
  const [members, setMembers] = useState<UserResponse[]>([]);
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

  const loadMessagesAndMembers = useCallback(async () => {
    try {
      const [pageResult, membersResult] = await Promise.all([
        chatApi.groupMessages(roomId),
        chatApi.members(roomId)
      ]);
      const sorted = [...pageResult.content].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sorted);
      setMembers(membersResult);
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
    loadMessagesAndMembers
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const content = input.trim();
    const replyId = replyTo?.id;
    setInput("");
    setReplyTo(null);
    inputRef.current?.focus();
    setSending(true);
    try {
      const sent = await chatApi.sendGroup(roomId, content, replyId);
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
      const membersResult = await chatApi.members(roomId);
      setMembers(membersResult);
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
      const membersResult = await chatApi.members(roomId);
      setMembers(membersResult);
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
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/60 shadow-2xl backdrop-blur-xl relative">
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <header className="flex items-center justify-between border-b border-slate-100 bg-white/50 p-5 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <Link href="/messages" className="text-slate-400 hover:text-slate-900 text-lg font-black transition-colors">←</Link>
            <div className="relative group">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 text-xl font-bold transition-transform group-hover:scale-105">
                {roomName.charAt(0).toUpperCase()}
              </span>
              <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"></div>
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">{roomName}</h1>
              <p className="text-xs text-slate-500 font-medium">{members.length} members</p>
            </div>
          </div>
          <button
            onClick={() => setShowDrawer((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738c-.32-.447-.269-1.06.12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Settings
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          {messages.map((msg) => {
            const isMe = msg.senderId === account?.id;
            const senderProfile = members.find(m => m.id === msg.senderId);
            const initials = senderProfile?.fullName?.slice(0, 2).toUpperCase() || msg.senderFullName?.slice(0, 2).toUpperCase() || "MB";
            const photoUrl = senderProfile?.profilePhotoUrl || msg.senderPhotoUrl;
            const username = senderProfile?.username || msg.senderUsername || "Unknown";

            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group/msg relative`}>
                {/* Reply button overlay */}
                <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/msg:opacity-100 ${isMe ? "right-[calc(100%+1rem)]" : "left-[calc(100%+1rem)]"}`}>
                  <button 
                    onClick={() => setReplyTo({ id: msg.id, content: msg.content })}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm"
                    title="Reply to message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-3 max-w-[80%] items-end">
                  {!isMe && (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 text-[10px] font-black text-slate-600 shadow-sm transition-transform group-hover/msg:scale-105 overflow-hidden">
                      {photoUrl ? (
                         <img src={photoUrl} className="w-full h-full object-cover" alt="" />
                      ) : initials}
                    </span>
                  )}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && <span className="mb-1 text-[10px] font-bold text-slate-400 pl-1">@{username}</span>}
                    
                    {msg.replyToMessageId && (
                      <div className={`mb-1 max-w-full truncate rounded-lg p-2 text-xs opacity-75 ${isMe ? "bg-indigo-500/20 text-indigo-700" : "bg-slate-200/50 text-slate-600"} border-l-4 ${isMe ? "border-indigo-400" : "border-slate-400"}`}>
                        <span className="font-bold opacity-75 text-[10px] uppercase tracking-wider block mb-0.5">Replied Message</span>
                        {msg.replyToMessageContent || "Message deleted"}
                      </div>
                    )}

                    <div className={`rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm transition-all hover:shadow-md ${isMe ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm" : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"}`}>
                      <p className="break-words">{msg.content}</p>
                    </div>
                    <span className={`block mt-1.5 text-[9px] font-medium ${isMe ? "text-slate-400" : "text-slate-400"}`}>
                      {new Date(msg.createdAt.endsWith("Z") ? msg.createdAt : msg.createdAt + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Reply preview banner */}
        {replyTo && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-indigo-50/50 px-4 py-3 backdrop-blur-sm">
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Replying to</span>
              <p className="truncate text-sm font-medium text-slate-700">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="ml-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-3 border-t border-slate-100 p-4 bg-white/80 backdrop-blur-md items-center relative">
          <div ref={emojiPickerRef} className="relative flex items-center">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
              </svg>
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-0 z-50 h-72 w-80 overflow-y-auto rounded-3xl border border-slate-200/60 bg-white/95 p-4 shadow-2xl backdrop-blur-xl transition-all">
                <div className="grid grid-cols-8 gap-2">
                  {POPULAR_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-xl hover:bg-indigo-50 transition-all active:scale-95"
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
            className="h-12 flex-1 rounded-2xl bg-slate-100/50 px-5 text-sm font-medium border border-slate-200 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
          <button
            disabled={!input.trim() || sending}
            className="h-12 flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            Send
          </button>
        </form>
      </div>

      {showDrawer && (
        <div className="absolute inset-y-0 right-0 w-96 bg-white/95 backdrop-blur-2xl border-l border-slate-200 z-20 flex flex-col p-6 shadow-2xl transform transition-transform duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <h2 className="font-black text-lg text-slate-900 tracking-tight">Group Details</h2>
            <button onClick={() => setShowDrawer(false)} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
            {error && <Alert>{error}</Alert>}
            {notice && <Alert tone="success">{notice}</Alert>}

            {/* Members List */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Members ({members.length})</h3>
              <div className="space-y-2">
                {members.map(member => (
                   <div key={member.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors">
                     <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 overflow-hidden">
                       {member.profilePhotoUrl ? <img src={member.profilePhotoUrl} className="w-full h-full object-cover" alt="" /> : member.fullName?.slice(0, 2).toUpperCase()}
                     </span>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-slate-900 truncate">{member.fullName}</p>
                       <p className="text-[10px] text-slate-500 truncate">@{member.username}</p>
                     </div>
                   </div>
                ))}
              </div>
            </div>

            {/* Invite member */}
            <form onSubmit={handleAddMember} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Add New Member</label>
              <div className="flex gap-2">
                <input
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Username"
                  className="h-10 min-w-0 flex-1 rounded-xl bg-white px-3 text-sm font-medium border border-slate-200 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
                <button disabled={actionBusy} className="rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors active:scale-95 disabled:opacity-50">Add</button>
              </div>
            </form>

            {/* Remove member */}
            <form onSubmit={handleRemoveMember} className="space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Remove Member</label>
              <div className="flex gap-2">
                <input
                  value={removeUsername}
                  onChange={(e) => setRemoveUsername(e.target.value)}
                  placeholder="Username"
                  className="h-10 min-w-0 flex-1 rounded-xl bg-slate-50 px-3 text-sm font-medium border border-slate-200 focus:border-red-300 focus:outline-none transition-all"
                />
                <button disabled={actionBusy} className="rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors active:scale-95 disabled:opacity-50">Kick</button>
              </div>
            </form>
            
            <form onSubmit={handleRoleChange} className="space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Change member role</label>
              <input value={roleUsername} onChange={(e)=>setRoleUsername(e.target.value)} placeholder="Username" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:border-indigo-300 transition-all"/>
              <div className="flex gap-2">
                <select value={memberRole} onChange={(e)=>setMemberRole(e.target.value as "ADMIN"|"MEMBER")} className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:border-indigo-300 transition-all">
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button disabled={actionBusy} className="rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 transition-colors active:scale-95 disabled:opacity-50">Update</button>
              </div>
            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => void handleLeave()}
              disabled={actionBusy}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-black text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              Leave Group Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { chatApi, errorMessage, networkApi } from "@/lib/api";
import type { ChatConversation, ChatRoom, PublicProfile } from "@/types";

export default function MessagesPage() { return <RoleGuard allow={["VOLUNTEER", "ORGANIZER", "ORGANIZATION_ADMIN", "ADMIN"]}><Messages /></RoleGuard>; }
function Messages() {
  const router = useRouter();
  const [items, setItems] = useState<ChatConversation[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [requests, setRequests] = useState<ChatConversation[]>([]);
  const [inboxTab, setInboxTab] = useState<"messages"|"requests">("messages");
  const [people, setPeople] = useState<PublicProfile[]>([]);
  const [query, setQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [compose, setCompose] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { Promise.all([chatApi.conversations(), chatApi.rooms(), chatApi.requests()]).then(([conversations, groups, requestPage]) => { setItems(conversations); setRooms(groups); setRequests(requestPage.content); }).catch((cause) => setError(errorMessage(cause))).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!compose) return;
    const timer = window.setTimeout(() => networkApi.search(query).then((page) => setPeople(page.content)).catch((cause) => setError(errorMessage(cause))), 250);
    return () => window.clearTimeout(timer);
  }, [compose, query]);
  async function createGroup(e: FormEvent) {
    e.preventDefault(); if (!groupName.trim()) return;
    try { const room = await chatApi.createGroup(groupName.trim()); router.push(`/messages/groups/${room.id}?name=${encodeURIComponent(room.name)}`); } catch (cause) { setError(errorMessage(cause)); }
  }

  return <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <section className="flex w-full flex-col border-r border-slate-200 md:w-[390px]">
      <header className="flex items-center justify-between border-b p-5"><div><h1 className="text-xl font-black">Messages</h1><p className="text-xs text-slate-400">Your conversations</p></div><button onClick={() => setCompose((value) => !value)} aria-label="New message" className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-xl text-white">＋</button></header>
      <div className="grid grid-cols-2 border-b p-1"><button onClick={()=>setInboxTab("messages")} className={`rounded-xl py-2 text-xs font-black ${inboxTab==="messages"?"bg-slate-950 text-white":"text-slate-500"}`}>Messages</button><button onClick={()=>setInboxTab("requests")} className={`rounded-xl py-2 text-xs font-black ${inboxTab==="requests"?"bg-slate-950 text-white":"text-slate-500"}`}>Requests {requests.length>0&&`(${requests.length})`}</button></div>
      {error && <div className="p-3"><Alert>{error}</Alert></div>}
      {compose && <div className="border-b bg-slate-50 p-4"><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people" className="h-11 w-full rounded-full border border-slate-200 bg-white px-4 text-sm" /><div className="mt-2 max-h-44 overflow-y-auto">{people.map((person) => <Link key={person.id} href={`/messages/${person.id}?username=${person.username}&fullName=${encodeURIComponent(person.fullName)}&photoUrl=${encodeURIComponent(person.profilePhotoUrl || '')}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white"><Avatar name={person.fullName} src={person.profilePhotoUrl} /><div><p className="text-sm font-bold">{person.fullName}</p><p className="text-xs text-slate-400">@{person.username}</p></div></Link>)}</div></div>}
      {loading ? <Loading label="Loading conversations…" /> : <div className="flex-1 overflow-y-auto">
        {inboxTab==="messages"&&<>{items.map((item) => <Link key={item.partnerId} href={`/messages/${item.partnerId}`} className="flex items-center gap-3 border-b border-slate-100 p-4 hover:bg-slate-50"><Avatar name={item.partnerFullName || item.partnerUsername || item.partnerId} src={item.partnerPhotoUrl} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="truncate text-sm font-black">{item.partnerFullName || item.partnerUsername || "Ween member"}</p><time className="text-[10px] text-slate-400">{new Date(item.lastMessageAt).toLocaleDateString()}</time></div><p className="mt-1 truncate text-xs text-slate-500">{item.lastMessage}</p></div>{item.unreadCount > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">{item.unreadCount}</span>}</Link>)}{rooms.map((room) => <Link key={room.id} href={`/messages/groups/${room.id}?name=${encodeURIComponent(room.name)}`} className="flex items-center gap-3 border-b border-slate-100 p-4 hover:bg-slate-50"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-100 text-lg">♟</span><div><p className="text-sm font-black">{room.name}</p><p className="text-xs text-slate-400">{room.type === "EVENT" ? "Event chat" : "Group chat"}</p></div></Link>)}{!items.length && !rooms.length && <p className="p-10 text-center text-sm text-slate-400">No conversations yet.</p>}</>}
        {inboxTab==="requests"&&<>{requests.map((item)=><article key={item.partnerId} className="flex items-center gap-3 border-b p-4"><Avatar name={item.partnerFullName||item.partnerUsername||item.partnerId} src={item.partnerPhotoUrl}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.partnerFullName||item.partnerUsername}</p><p className="truncate text-xs text-slate-500">{item.lastMessage}</p></div><button onClick={async()=>{await chatApi.acceptRequest(item.partnerId);setRequests(current=>current.filter(request=>request.partnerId!==item.partnerId));router.push(`/messages/${item.partnerId}?username=${item.partnerUsername || ''}&fullName=${encodeURIComponent(item.partnerFullName || '')}&photoUrl=${encodeURIComponent(item.partnerPhotoUrl || '')}`);}} className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white">Accept</button></article>)}{!requests.length&&<p className="p-10 text-center text-sm text-slate-400">No message requests.</p>}</>}
      </div>}
      <form onSubmit={(e) => void createGroup(e)} className="flex gap-2 border-t p-3"><input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="New group name" className="h-10 min-w-0 flex-1 rounded-full bg-slate-100 px-4 text-xs" /><button className="rounded-full bg-slate-900 px-4 text-xs font-bold text-white">Create</button></form>
    </section>
    <section className="hidden flex-1 place-items-center bg-[#fafafa] md:grid"><div className="max-w-sm text-center"><span className="mx-auto grid h-24 w-24 place-items-center rounded-full border-2 border-slate-800 text-4xl">✈</span><h2 className="mt-5 text-2xl font-black">Your messages</h2><p className="mt-2 text-sm text-slate-500">Send private messages, collaborate in groups and continue conversations from events.</p><button onClick={() => setCompose(true)} className="mt-5 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white">Send a message</button></div></section>
  </div>;
}

function Avatar({ name, src }: { name: string; src?: string }) {
  return <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-200 to-pink-200 text-xs font-black">{src ? <img src={src} alt="" className="h-full w-full object-cover" /> : name.slice(0, 2).toUpperCase()}</span>;
}

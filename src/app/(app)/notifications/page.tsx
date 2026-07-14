"use client";
import { useEffect,useState } from "react";
import { notificationsApi,errorMessage } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import type { Notification } from "@/types";

export default function NotificationsPage(){
 const [items,setItems]=useState<Notification[]>([]);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState("");const [error,setError]=useState("");
 useEffect(()=>{notificationsApi.list().then(p=>setItems(p.content)).catch(c=>setError(errorMessage(c))).finally(()=>setLoading(false));},[]);
 async function read(item:Notification){if(item.isRead)return;setBusy(item.id);try{await notificationsApi.read(item.id);setItems(current=>current.map(n=>n.id===item.id?{...n,isRead:true}:n));}catch(c){setError(errorMessage(c));}finally{setBusy("");}}
 async function all(){setBusy("all");try{await notificationsApi.readAll();setItems(current=>current.map(n=>({...n,isRead:true})));}catch(c){setError(errorMessage(c));}finally{setBusy("");}}
 return <section className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white"><header className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-black">Notifications</h2><p className="mt-1 text-sm text-slate-400">{items.filter(i=>!i.isRead).length} unread</p></div><button onClick={()=>void all()} disabled={Boolean(busy)} className="text-xs font-extrabold text-emerald-700">Mark all read</button></header>{error&&<div className="p-4"><Alert>{error}</Alert></div>}{loading?<Loading label="Loading notifications…"/>:<div className="divide-y">{items.map(item=><button key={item.id} onClick={()=>void read(item)} disabled={busy===item.id} className={`flex w-full gap-4 p-4 text-left hover:bg-slate-50 ${item.isRead?"bg-white":"bg-emerald-50/50"}`}><span className={`mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full ${item.isRead?"bg-slate-100":"bg-emerald-100 text-emerald-700"}`}>✦</span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-900">{item.title}</span><span className="mt-1 block text-sm leading-5 text-slate-600">{item.body}</span><span className="mt-2 block text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span></span>{!item.isRead&&<span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-500"/>}</button>)}</div>}</section>;
}

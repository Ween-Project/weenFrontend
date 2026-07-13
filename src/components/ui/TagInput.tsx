"use client";
import { useState, type KeyboardEvent } from "react";

export function TagInput({ label, values, onChange, placeholder = "Type and press Enter", error }: { label: string; values: string[]; onChange: (values: string[]) => void; placeholder?: string; error?: string }) {
  const [draft,setDraft]=useState("");
  function add(){const value=draft.trim();if(value&&!values.some(item=>item.toLowerCase()===value.toLowerCase()))onChange([...values,value]);setDraft("");}
  function keyDown(event:KeyboardEvent<HTMLInputElement>){if(event.key==="Enter"||event.key===","){event.preventDefault();add();}else if(event.key==="Backspace"&&!draft&&values.length){onChange(values.slice(0,-1));}}
  return <div><label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label><div className={`flex min-h-12 flex-wrap items-center gap-2 rounded-xl border bg-white px-3 py-2 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-600/10 ${error?"border-red-400":"border-slate-200"}`}>{values.map(value=><span key={value} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">{value}<button type="button" aria-label={`Remove ${value}`} onClick={()=>onChange(values.filter(item=>item!==value))} className="text-emerald-600 hover:text-red-600">×</button></span>)}<input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={keyDown} onBlur={add} placeholder={values.length?"Add more…":placeholder} className="h-7 min-w-36 flex-1 border-0 bg-transparent text-sm outline-none"/></div>{error&&<p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}</div>;
}

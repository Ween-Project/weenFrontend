"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

export function MediaUploader({ value, onChange, aspect = 1, folder = "ween/media", label = "Upload image", circle = false }: {
  value?: string; onChange: (url: string) => void; aspect?: number; folder?: string; label?: string; circle?: boolean;
}) {
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState("image.jpg");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const complete = useCallback((_area: Area, pixels: Area) => setArea(pixels), []);

  async function pick(file?: File) {
    if (!file) return;
    setError("");
    if (file.type.startsWith("video/")) { await upload(file); return; }
    setFileName(file.name);
    setSource(URL.createObjectURL(file));
  }
  async function upload(file: Blob) {
    setUploading(true); setError("");
    try {
      const body = new FormData();
      body.append("file", file, fileName);
      body.append("folder", folder);
      const response = await fetch("/api/media/upload", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed.");
      onChange(data.url); setSource("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed."); } finally { setUploading(false); }
  }
  async function saveCrop() {
    if (!area) return;
    const blob = await cropImage(source, area);
    await upload(blob);
  }
  return <div>
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
      <span>▧</span>{uploading ? "Uploading…" : label}<input type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={(event) => void pick(event.target.files?.[0])} />
    </label>
    {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    {value && <div className={`mt-3 overflow-hidden bg-slate-100 ${circle ? "h-24 w-24 rounded-full" : "max-h-72 rounded-2xl"}`}><img src={value} alt="Uploaded preview" className="h-full w-full object-cover" /></div>}
    {source && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/75 p-4"><div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Crop image</h2><p className="text-sm text-slate-500">Drag and zoom until it looks right.</p></div><button type="button" onClick={() => setSource("")} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xl">×</button></div><div className="relative mt-4 h-[55vh] overflow-hidden rounded-2xl bg-slate-950"><Cropper image={source} crop={crop} zoom={zoom} aspect={aspect} cropShape={circle ? "round" : "rect"} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={complete} /></div><label className="mt-4 flex items-center gap-3 text-sm font-bold">Zoom<input className="w-full accent-emerald-600" type="range" min={1} max={3} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label><button type="button" disabled={uploading} onClick={() => void saveCrop()} className="mt-4 h-12 w-full rounded-full bg-emerald-600 text-sm font-black text-white disabled:opacity-50">{uploading ? "Uploading…" : "Use this crop"}</button></div></div>}
  </div>;
}

async function cropImage(source: string, area: Area) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = area.width; canvas.height = area.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image cropping is not supported.");
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not crop image.")), "image/jpeg", 0.9));
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image); image.onerror = reject; image.src = source;
  });
}

"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

interface ImageCropperModalProps {
  file: File;
  aspect: number;
  cropShape?: "rect" | "round";
  onCrop: (croppedFile: File) => void;
  onClose: () => void;
}

export function ImageCropperModal({
  file,
  aspect,
  cropShape = "rect",
  onCrop,
  onClose,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const imageSrc = useState(() => URL.createObjectURL(file))[0];

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const croppedFile = new File([croppedBlob], file.name, {
        type: file.type || "image/jpeg",
        lastModified: Date.now(),
      });
      onCrop(croppedFile);
    } catch (e) {
      console.error("Failed to crop image:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-lg font-black text-slate-900">Crop Image</h3>
            <p className="text-xs text-slate-400">Position and scale the image to fit the container.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-slate-950 sm:h-80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
            <span className="w-12">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <span className="w-8 text-right">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
            <span className="w-12">Rotate</span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <span className="w-8 text-right">{rotation}°</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? "Processing…" : "Crop & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Calculate bounding box for rotation
  const rotRad = (rotation * Math.PI) / 180;
  const { width: imageWidth, height: imageHeight } = image;
  
  // Calculate size of canvas to accommodate rotated image
  const absCos = Math.abs(Math.cos(rotRad));
  const absSin = Math.abs(Math.sin(rotRad));
  const newWidth = imageWidth * absCos + imageHeight * absSin;
  const newHeight = imageWidth * absSin + imageHeight * absCos;
  
  canvas.width = newWidth;
  canvas.height = newHeight;

  // Translate to center and rotate
  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-imageWidth / 2, -imageHeight / 2);

  // Draw image
  ctx.drawImage(image, 0, 0);

  // Crop from the rotated canvas
  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    throw new Error("No 2d context for cropped canvas");
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped region onto the final canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.95
    );
  });
}

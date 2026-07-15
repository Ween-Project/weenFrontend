"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { errorMessage, qrApi } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";

export function QrModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [image, setImage] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await qrApi.generate();
      const source = result.qrImageBase64
        ? `data:image/png;base64,${result.qrImageBase64}`
        : await QRCode.toDataURL(result.encryptedPayload, {
            width: 320,
            margin: 4,
            color: { dark: "#000000", light: "#ffffff" },
          });
      setImage(source);
      setSeconds(result.expiresIn || 30);
    } catch (cause) {
      setError(errorMessage(cause));
      setImage("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void generate();
    else {
      setImage("");
      setSeconds(0);
    }
  }, [generate, open]);

  useEffect(() => {
    if (!open || seconds <= 0) return;
    const timer = window.setInterval(
      () => setSeconds((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [open, seconds]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="My check-in QR code"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-600">
              Ween check-in
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Your QR code
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR code"
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xl"
          >
            ×
          </button>
        </div>
        {error && (
          <div className="mt-5">
            <Alert>{error}</Alert>
          </div>
        )}
        <div className="mx-auto mt-6 grid aspect-square max-w-[300px] place-items-center rounded-2xl border border-slate-200 bg-white p-3">
          {loading ? (
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          ) : image && seconds > 0 ? (
            <img
              src={image}
              alt="30-second event check-in QR code"
              className="h-full w-full"
            />
          ) : (
            <div>
              <p className="text-4xl">⌛</p>
              <p className="mt-3 text-sm font-bold text-slate-700">
                This QR code has expired.
              </p>
            </div>
          )}
        </div>
        <div className="mt-5">
          <progress
            value={seconds}
            max={30}
            className="h-2 w-full overflow-hidden rounded-full accent-emerald-500"
          />
          <p
            className={`mt-2 text-sm font-bold ${seconds <= 5 ? "text-red-600" : "text-slate-600"}`}
          >
            {seconds > 0 ? `Expires in ${seconds} seconds` : "Expired"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          className="mt-5 h-11 w-full rounded-full bg-slate-950 text-sm font-bold text-white disabled:opacity-50"
        >
          Generate a new code
        </button>
        <p className="mt-4 text-xs leading-5 text-slate-400">
          Show this code to an organizer when checking in. It automatically
          expires after 30 seconds.
        </p>
      </div>
    </div>
  );
}

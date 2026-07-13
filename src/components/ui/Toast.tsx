"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  tone?: "success" | "error" | "info";
};

const tones = {
  success: { icon: CheckCircle2, accent: "text-emerald-600", surface: "border-emerald-200" },
  error: { icon: AlertCircle, accent: "text-red-600", surface: "border-red-200" },
  info: { icon: Info, accent: "text-blue-600", surface: "border-blue-200" },
};

export function ToastViewport({ messages, onDismiss }: { messages: ToastMessage[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[200] flex flex-col items-end gap-3 sm:left-auto sm:w-[380px]" aria-live="polite">
      {messages.map((message) => {
        const tone = tones[message.tone ?? "success"];
        const Icon = tone.icon;
        return (
          <div key={message.id} role="status" className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-white p-4 shadow-soft animate-[toast-in_180ms_ease-out] ${tone.surface}`}>
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.accent}`} strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{message.title}</p>
              {message.description && <p className="mt-1 text-xs leading-5 text-muted">{message.description}</p>}
            </div>
            <button type="button" onClick={() => onDismiss(message.id)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink" aria-label="Dismiss notification">
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

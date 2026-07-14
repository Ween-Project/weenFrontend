"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { aiApi, errorMessage, type AiBackendMessage } from "@/lib/api";

type ChatMessage = Pick<AiBackendMessage, "sender" | "content" | "createdAt"> & {
  id: string;
};

const starterPrompts = [
  "Help me find volunteer events that match my skills.",
  "How can I improve my volunteer profile?",
  "Suggest a message to invite friends to an event.",
];

export default function AiPage() {
  return (
    <RoleGuard allow={["VOLUNTEER", "ORGANIZER", "ORGANIZATION_ADMIN", "ADMIN"]}>
      <AiChat />
    </RoleGuard>
  );
}

function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    aiApi.history()
      .then((page) => setMessages(page.content))
      .catch((cause) => setError(errorMessage(cause)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function sendMessage(e?: FormEvent, preset?: string) {
    e?.preventDefault();
    const content = (preset ?? input).trim();
    if (!content || sending) return;

    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: `local-user-${now}`,
      sender: "USER",
      content,
      createdAt: now,
    };

    setInput("");
    setError("");
    setSending(true);
    setMessages((current) => [...current, userMessage]);

    try {
      const reply = await aiApi.chat(content);
      setMessages((current) => [
        ...current,
        {
          id: `local-ai-${Date.now()}`,
          sender: "AI",
          content: reply.response,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  }

  async function clearHistory() {
    setClearing(true);
    setError("");
    try {
      await aiApi.clearHistory();
      setMessages([]);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setClearing(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-slate-800">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-600">Ween assistant</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">AI chat</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Plan events, sharpen your profile, and get quick volunteering guidance.</p>
        </div>
        <button
          type="button"
          onClick={() => void clearHistory()}
          disabled={clearing || loading || messages.length === 0}
          className="h-10 rounded-full border border-slate-200 px-4 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {clearing ? "Clearing..." : "Clear chat"}
        </button>
      </header>

      {error && <div className="p-4"><Alert>{error}</Alert></div>}

      <div className="flex-1 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950/35 sm:p-6">
        {loading ? (
          <Loading label="Loading chat..." />
        ) : messages.length ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <article key={message.id} className={`flex ${message.sender === "USER" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[68%] ${
                  message.sender === "USER"
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <time className={`mt-2 block text-[10px] font-bold ${message.sender === "USER" ? "text-emerald-50/80" : "text-slate-400"}`}>
                    {new Date(message.createdAt).toLocaleString()}
                  </time>
                </div>
              </article>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid min-h-[340px] place-items-center text-center">
            <div className="max-w-md">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-lg font-black text-emerald-700">AI</div>
              <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">Start a conversation</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Ask for event ideas, profile feedback, organizer copy, or practical next steps.</p>
              <div className="mt-5 flex flex-col gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(undefined, prompt)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(event) => void sendMessage(event)} className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            rows={2}
            placeholder="Ask Ween AI..."
            className="min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="h-12 rounded-full bg-emerald-600 px-6 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </section>
  );
}

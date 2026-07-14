"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { aiApi, errorMessage } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";

type Message = {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
};

export default function AiAssistantPage() {
  const { account } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Load from backend history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const historyPage = await aiApi.history(0);
        if (historyPage.content.length > 0) {
          const formatted = historyPage.content.map((m) => ({
            id: m.id,
            sender: m.sender.toLowerCase() as "user" | "ai",
            content: m.content,
            timestamp: new Date(m.createdAt),
          }));
          setMessages(formatted);
        } else {
          setMessages([
            {
              id: "welcome",
              sender: "ai",
              content: `Hello! I'm your Ween AI assistant. I can help answer questions about community guidelines, reward badges, coin distribution, and how to verify event check-ins. How can I help you today?`,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (e) {
        console.error("Failed to load AI chat history from backend", e);
        setMessages([
          {
            id: "welcome",
            sender: "ai",
            content: `Hello! I'm your Ween AI assistant. I can help answer questions about community guidelines, reward badges, coin distribution, and how to verify event check-ins. How can I help you today?`,
            timestamp: new Date(),
          },
        ]);
      }
    }
    void loadHistory();
  }, []);
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;

    const userText = input.trim();
    setInput("");
    setError("");
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages((current) => [...current, userMsg]);
    setBusy(true);

    try {
      const result = await aiApi.chat(userText);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        content: result.response,
        timestamp: new Date(),
      };
      setMessages((current) => [...current, aiMsg]);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    if (!confirm("Clear your AI chat history?")) return;
    setError("");
    try {
      await aiApi.clearHistory();
      const welcome: Message = {
        id: "welcome",
        sender: "ai",
        content: `Hello! I'm your Ween AI assistant. I can help answer questions about community guidelines, reward badges, coin distribution, and how to verify event check-ins. How can I help you today?`,
        timestamp: new Date(),
      };
      setMessages([welcome]);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }
  return (
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b p-5">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <span className="text-emerald-600">✦</span> Ween AI Assistant
          </h1>
          <p className="text-xs text-slate-400">Ask about platform rules, rewards, and your impact</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-bold text-slate-500 hover:text-red-600 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition"
        >
          Clear history
        </button>
      </header>

      {error && <div className="p-4 bg-red-50 border-b border-red-100"><Alert>{error}</Alert></div>}

      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isAi = msg.sender === "ai";
          return (
            <div key={msg.id} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
              <div className={`flex gap-3 max-w-[80%] ${isAi ? "flex-row" : "flex-row-reverse"}`}>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${isAi ? "bg-emerald-100 text-emerald-800" : "bg-slate-900 text-white"}`}>
                  {isAi ? "AI" : (account?.fullName || account?.username || "ME").slice(0, 2).toUpperCase()}
                </span>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${isAi ? "bg-white text-slate-800 rounded-tl-none border border-slate-100" : "bg-emerald-600 text-white rounded-tr-none"}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span className={`block mt-1 text-[9px] text-right ${isAi ? "text-slate-400" : "text-emerald-200"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {busy && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">AI</span>
              <div className="rounded-2xl bg-white border border-slate-100 px-4 py-3 shadow-sm rounded-tl-none">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-3 border-t p-4 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI anything..."
          disabled={busy}
          className="h-12 flex-1 rounded-full bg-slate-100 px-5 text-sm border border-transparent focus:border-slate-200 focus:bg-white focus:outline-none disabled:opacity-50"
        />
        <button
          disabled={!input.trim() || busy}
          className="rounded-full bg-emerald-600 px-6 font-bold text-sm text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );

}

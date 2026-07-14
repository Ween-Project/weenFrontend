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

}

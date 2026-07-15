"use client";

import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { Alert } from "@/components/ui/Alert";
import { Loading } from "@/components/ui/Loading";
import { chatApi, errorMessage, networkApi } from "@/lib/api";
import { useStomp } from "@/lib/use-stomp";
import type { ChatMessage, PublicProfile } from "@/types";

const POPULAR_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️",
  "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓",
  "🤗", "🤔", "🫣", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🫨", "🫠", "✍️", "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞",
  "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🙏", "🤝", "👏",
  "🙌", "👐", "🤲", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "✨", "⚡", "🔥", "💥", "🎉"
];

export default function DirectChatPage({ params }: { params: { partnerId: string } }) {
  return (
    <RoleGuard allow={["VOLUNTEER", "ORGANIZER", "ORGANIZATION_ADMIN", "ADMIN"]}>
      <DirectChat partnerId={params.partnerId} />
    </RoleGuard>
  );
}

function DirectChat({ partnerId }: { partnerId: string }) {
  const searchParams = useSearchParams();
  const paramUsername = searchParams.get("username");
  const paramFullName = searchParams.get("fullName");
  const paramPhotoUrl = searchParams.get("photoUrl");

  const [partner, setPartner] = useState<PublicProfile | null>(() => {
    if (paramUsername) {
      return {
        id: partnerId,
        username: paramUsername,
        fullName: paramFullName || "Ween member",
        profilePhotoUrl: paramPhotoUrl || undefined,
        weenCoinBalance: 0,
        followerCount: 0,
        followingCount: 0,
        following: false,
        canMessage: true
      };
    }
    return null;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Load profile of the partner
  useEffect(() => {
    let active = true;
    async function loadPartner() {
      try {
        const conversations = await chatApi.conversations();
        const match = conversations.find((c) => c.partnerId === partnerId);
        if (match && active) {
          setPartner({
            id: match.partnerId,
            username: match.partnerUsername || "",
            fullName: match.partnerFullName || "Ween member",
            profilePhotoUrl: match.partnerPhotoUrl,
            weenCoinBalance: 0,
            followerCount: 0,
            followingCount: 0,
            following: false,
            canMessage: true
          });
        }
      } catch (cause) {
        console.error("Failed to load partner details from conversations list:", cause);
      }
    }
    void loadPartner();
    return () => {
      active = false;
    };
  }, [partnerId]);

  const loadMessages = useCallback(async () => {
    try {
      const pageResult = await chatApi.messages(partnerId);
      // Sort messages ascending by timestamp
      const sorted = [...pageResult.content].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sorted);
      setLoading(false);
    } catch (cause) {
      setError(errorMessage(cause));
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    void chatApi.markRead(partnerId);
  }, [partnerId]);

  useStomp<ChatMessage>(
    "/user/queue/messages",
    (msg) => {
      if (msg.senderId === partnerId || msg.recipientId === partnerId) {
        setMessages((current) => {
          if (current.some((m) => m.id === msg.id)) return current;
          return [...current, msg];
        });
      }
    },
    loadMessages
  );

  // Scroll to end when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput("");
    inputRef.current?.focus();
    setSending(true);
    try {
      const sent = await chatApi.send(partnerId, content);
      setMessages((current) => {
        if (current.some((m) => m.id === sent.id)) return current;
        return [...current, sent];
      });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  if (loading) return <Loading label="Loading conversation…" />;

  return (
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b p-4">
        <Link href="/messages" className="text-slate-500 hover:text-slate-900 text-lg mr-2 font-bold">←</Link>
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-200 to-pink-200 text-xs font-black">
          {partner?.profilePhotoUrl ? (
            <img src={partner.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            (partner?.fullName || "WE").slice(0, 2).toUpperCase()
          )}
        </span>
        <div>
          <h1 className="text-sm font-black text-slate-900">{partner?.fullName || "Chat Room"}</h1>
          <p className="text-[10px] text-slate-400">@{partner?.username || "direct_message"}</p>
        </div>
      </header>

      {error && <div className="p-3 bg-red-50 border-b"><Alert>{error}</Alert></div>}

      <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/50">
        {messages.map((msg) => {
          const isMe = msg.senderId !== partnerId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-6 shadow-sm ${isMe ? "bg-emerald-600 text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"}`}>
                <p className="break-words">{msg.content}</p>
                <span className={`block mt-1 text-[8px] text-right ${isMe ? "text-emerald-200" : "text-slate-400"}`}>
                  {new Date(msg.createdAt.endsWith("Z") ? msg.createdAt : msg.createdAt + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t p-3.5 bg-white items-center relative">
        <div ref={emojiPickerRef} className="relative flex items-center">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
            </svg>
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-14 left-0 z-50 h-64 w-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl transition-all">
              <div className="grid grid-cols-8 gap-2">
                {POPULAR_EMOJIS.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="flex h-7 w-7 items-center justify-center rounded text-lg hover:bg-slate-100 transition active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="h-11 flex-1 rounded-full bg-slate-100 px-4 text-xs border border-transparent focus:border-slate-200 focus:bg-white focus:outline-none"
        />
        <button
          disabled={!input.trim() || sending}
          className="h-11 rounded-full bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

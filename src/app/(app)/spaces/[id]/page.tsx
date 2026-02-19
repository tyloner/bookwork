"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Users,
  Phone,
  PhoneOff,
  BookOpen,
  MoreVertical,
  Info,
  LogOut as LeaveIcon,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  type: "TEXT" | "SYSTEM" | "IMAGE";
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface SpaceDetail {
  id: string;
  name: string;
  description: string | null;
  type: "CHAT" | "CALL" | "HYBRID";
  isActive: boolean;
  language: string;
  genre: string[];
  scheduledAt: string | null;
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
  };
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
  members: {
    userId: string;
    role: string;
    user: { id: string; name: string | null; image: string | null };
  }[];
  _count: { messages: number; members: number };
}

// Demo messages for display
const DEMO_MESSAGES: Message[] = [
  {
    id: "m1",
    content: "Just started reading this today — the first chapter is incredible!",
    type: "TEXT",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    user: { id: "u1", name: "Elena R.", image: null },
  },
  {
    id: "m2",
    content: "The way the author builds the world is so immersive. I couldn't put it down.",
    type: "TEXT",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    user: { id: "u2", name: "Marcus T.", image: null },
  },
  {
    id: "m3",
    content: "Has anyone reached chapter 5 yet? Things really pick up there.",
    type: "TEXT",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    user: { id: "u3", name: "Aisha K.", image: null },
  },
  {
    id: "m4",
    content: "I'm on chapter 3 still — trying to savor it. The prose is beautiful.",
    type: "TEXT",
    createdAt: new Date(Date.now() - 900000).toISOString(),
    user: { id: "u1", name: "Elena R.", image: null },
  },
  {
    id: "m5",
    content: "Completely agree. Should we do a live call this weekend to discuss?",
    type: "TEXT",
    createdAt: new Date(Date.now() - 300000).toISOString(),
    user: { id: "u2", name: "Marcus T.", image: null },
  },
];

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [inCall, setInCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = (session?.user as { id?: string })?.id;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const res = await fetch(`/api/spaces/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setSpace(data);
          if (data.messages) {
            setMessages(data.messages.reverse());
          }
        }
      } catch {
        // Use demo data
      }
    };
    fetchSpace();
  }, [params.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage.trim(),
      type: "TEXT",
      createdAt: new Date().toISOString(),
      user: {
        id: userId || "me",
        name: session?.user?.name || "You",
        image: session?.user?.image || null,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setIsSending(true);

    try {
      const res = await fetch(`/api/spaces/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: optimisticMessage.content }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMessage.id ? msg : m))
        );
      }
    } catch {
      // Keep optimistic message
    } finally {
      setIsSending(false);
    }
  };

  // Polling for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/spaces/${params.id}/messages?limit=10`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages?.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMsgs = data.messages.filter(
                (m: Message) => !existingIds.has(m.id)
              );
              return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
            });
          }
        }
      } catch {
        // Polling failure, ignore
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [params.id]);

  return (
    <div className="flex flex-col h-screen lg:h-auto lg:min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-ink-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-500 lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-ink-900 truncate">
              {space?.name || "Loading..."}
            </h1>
            <div className="flex items-center gap-2 text-xs text-ink-400">
              {space && (
                <>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {space.book.title}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {space._count.members} members
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {(space?.type === "CALL" || space?.type === "HYBRID") && (
              <button
                onClick={() => setInCall(!inCall)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  inCall
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                )}
              >
                {inCall ? (
                  <PhoneOff className="w-4 h-4" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-lg hover:bg-ink-50 text-ink-500"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Call banner */}
        {inCall && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-center text-sm font-medium animate-slide-up">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              In Call — {space?._count.members || 0} participants
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Space intro */}
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sage-100 mb-3">
                <BookOpen className="w-5 h-5 text-sage-600" />
              </div>
              <h2 className="text-sm font-serif font-semibold text-ink-700">
                {space?.name || "Book Discussion Space"}
              </h2>
              {space?.description && (
                <p className="text-xs text-ink-400 mt-1 max-w-sm mx-auto">
                  {space.description}
                </p>
              )}
              <p className="text-xs text-ink-300 mt-2">
                Conversation started {space ? formatDate(space.scheduledAt || new Date().toISOString()) : "recently"}
              </p>
            </div>

            {/* Messages */}
            {messages.map((message) => {
              if (message.type === "SYSTEM") {
                return (
                  <div
                    key={message.id}
                    className="text-center text-xs text-ink-400 py-1"
                  >
                    {message.content}
                  </div>
                );
              }

              const isOwn = message.user.id === userId;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2.5 max-w-[85%] animate-fade-in",
                    isOwn ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  {!isOwn && (
                    <Avatar
                      src={message.user.image}
                      name={message.user.name || "User"}
                      size="sm"
                      className="flex-shrink-0 mt-0.5"
                    />
                  )}
                  <div>
                    {!isOwn && (
                      <p className="text-[10px] font-medium text-ink-400 mb-0.5 ml-1">
                        {message.user.name}
                      </p>
                    )}
                    <div
                      className={cn(
                        "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isOwn
                          ? "bg-sage-600 text-white rounded-br-md"
                          : "bg-ink-50 text-ink-800 rounded-bl-md"
                      )}
                    >
                      {message.content}
                    </div>
                    <p
                      className={cn(
                        "text-[10px] text-ink-300 mt-0.5",
                        isOwn ? "text-right mr-1" : "ml-1"
                      )}
                    >
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="border-t border-ink-100 bg-white px-4 py-3 safe-area-bottom">
            <form onSubmit={sendMessage} className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    // Auto-resize
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="input-field resize-none text-sm min-h-[40px] max-h-[120px] py-2.5"
                  rows={1}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className={cn(
                  "p-2.5 rounded-xl transition-colors flex-shrink-0",
                  newMessage.trim()
                    ? "bg-sage-600 text-white hover:bg-sage-700"
                    : "bg-ink-100 text-ink-300"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Info sidebar */}
        {showInfo && (
          <div className="w-72 border-l border-ink-100 bg-white overflow-y-auto hidden lg:block animate-slide-in-right">
            <div className="p-4 space-y-4">
              {space?.book.coverUrl ? (
                <img
                  src={space.book.coverUrl}
                  alt={space.book.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-32 bg-cream-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-ink-300" />
                </div>
              )}

              <div>
                <h3 className="font-serif font-semibold text-ink-900">
                  {space?.book.title}
                </h3>
                <p className="text-sm text-ink-500">
                  by {space?.book.author}
                </p>
              </div>

              {space?.description && (
                <p className="text-sm text-ink-500 leading-relaxed">
                  {space.description}
                </p>
              )}

              {space?.genre && space.genre.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {space.genre.map((g) => (
                    <span key={g} className="chip text-xs">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t border-ink-100 pt-4">
                <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">
                  Members ({space?._count.members || 0})
                </h4>
                <div className="space-y-2">
                  {space?.members?.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center gap-2"
                    >
                      <Avatar
                        src={member.user.image}
                        name={member.user.name || "User"}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink-800 truncate">
                          {member.user.name}
                        </p>
                      </div>
                      {member.role === "OWNER" && (
                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          Host
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

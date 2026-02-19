"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { SpaceCard } from "@/components/spaces/space-card";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import Link from "next/link";

interface Space {
  id: string;
  name: string;
  description: string | null;
  type: "CHAT" | "CALL" | "HYBRID";
  language: string;
  genre: string[];
  createdAt: string;
  scheduledAt: string | null;
  book: { title: string; author: string; coverUrl: string | null };
  owner: { name: string | null; image: string | null };
  _count: { messages: number; members: number };
}

export default function MySpacesPage() {
  const { data: session } = useSession();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"joined" | "owned">("joined");

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await fetch("/api/user/spaces");
        if (res.ok) {
          const data = await res.json();
          setSpaces(data.spaces);
        }
      } catch {
        // Empty fallback
      } finally {
        setIsLoading(false);
      }
    };
    if (session) fetchSpaces();
    else setIsLoading(false);
  }, [session]);

  return (
    <div>
      <Header title="My Spaces">
        <Link href="/spaces/create" className="btn-primary text-sm gap-1.5">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Space</span>
        </Link>
      </Header>

      <div className="max-w-3xl mx-auto px-4 py-6 lg:px-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-ink-50 rounded-lg p-1">
          {(["joined", "owned"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-700"
              }`}
            >
              {t === "joined" ? "Joined" : "Created"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-ink-300 animate-spin" />
          </div>
        ) : spaces.length > 0 ? (
          <div className="space-y-3">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cream-200 mb-4">
              <BookOpen className="w-7 h-7 text-ink-300" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-ink-700 mb-2">
              No spaces yet
            </h3>
            <p className="text-sm text-ink-400 mb-4">
              Join a space from the home feed or create your own.
            </p>
            <Link href="/spaces/create" className="btn-primary text-sm gap-2">
              <Plus className="w-4 h-4" />
              Create a Space
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { SwipeCard } from "@/components/matches/swipe-card";
import { MatchModal } from "@/components/matches/match-modal";
import { Avatar } from "@/components/ui/avatar";
import {
  Heart,
  Users,
  BookOpen,
  Crown,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";

interface ReaderProfile {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  favoriteGenres: string[];
  currentlyReading: {
    title: string;
    author: string;
    coverUrl: string | null;
    progress: number;
  }[];
  sharedBooks: { title: string; author: string }[];
  booksReadThisYear: number;
}

const DEMO_PROFILES: ReaderProfile[] = [
  {
    id: "p1",
    name: "Camille D.",
    image: null,
    bio: "Literature teacher by day, voracious reader by night. Always looking for someone to discuss the classics with.",
    location: "Paris, France",
    favoriteGenres: ["Fiction", "Philosophy", "Poetry"],
    currentlyReading: [
      { title: "The Stranger", author: "Albert Camus", coverUrl: null, progress: 65 },
      { title: "Siddhartha", author: "Hermann Hesse", coverUrl: null, progress: 30 },
    ],
    sharedBooks: [{ title: "The Stranger", author: "Albert Camus" }],
    booksReadThisYear: 24,
  },
  {
    id: "p2",
    name: "Oliver H.",
    image: null,
    bio: "Software engineer who reads sci-fi to escape code. Currently obsessed with world-building in speculative fiction.",
    location: "London, UK",
    favoriteGenres: ["Science Fiction", "Fantasy", "Technology"],
    currentlyReading: [
      { title: "Dune", author: "Frank Herbert", coverUrl: null, progress: 45 },
      { title: "Neuromancer", author: "William Gibson", coverUrl: null, progress: 80 },
    ],
    sharedBooks: [{ title: "Dune", author: "Frank Herbert" }],
    booksReadThisYear: 18,
  },
  {
    id: "p3",
    name: "Mia Chen",
    image: null,
    bio: "Bookshop owner. I believe every book finds its reader. Currently running a silent reading hour at my shop every Saturday.",
    location: "Portland, OR",
    favoriteGenres: ["Fiction", "Mystery", "Biography"],
    currentlyReading: [
      { title: "Klara and the Sun", author: "Kazuo Ishiguro", coverUrl: null, progress: 55 },
    ],
    sharedBooks: [],
    booksReadThisYear: 42,
  },
  {
    id: "p4",
    name: "James K.",
    image: null,
    bio: "PhD student studying behavioral economics. I annotate everything. My margins are full of questions.",
    location: "Chicago, IL",
    favoriteGenres: ["Non-Fiction", "Psychology", "Science"],
    currentlyReading: [
      { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", coverUrl: null, progress: 72 },
      { title: "Sapiens", author: "Yuval Noah Harari", coverUrl: null, progress: 20 },
    ],
    sharedBooks: [{ title: "Sapiens", author: "Yuval Noah Harari" }],
    booksReadThisYear: 15,
  },
  {
    id: "p5",
    name: "Luna M.",
    image: null,
    bio: "Fantasy reader, tea enthusiast. Looking for reading buddies who don't judge me for crying over fictional characters.",
    location: "Melbourne, AU",
    favoriteGenres: ["Fantasy", "Romance", "Fiction"],
    currentlyReading: [
      { title: "The Name of the Wind", author: "Patrick Rothfuss", coverUrl: null, progress: 88 },
    ],
    sharedBooks: [],
    booksReadThisYear: 31,
  },
];

const DEMO_CONNECTIONS = [
  {
    matchId: "c1",
    user: { id: "cu1", name: "Sarah J.", image: null, bio: "Poetry and prose" },
    bookContext: "1984",
    matchedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    matchId: "c2",
    user: { id: "cu2", name: "Tom W.", image: null, bio: "Sci-fi nerd" },
    bookContext: "Dune",
    matchedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

type Tab = "discover" | "connections";

export default function MatchesPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("discover");
  const [profiles, setProfiles] = useState(DEMO_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<ReaderProfile | null>(null);
  const [matchesLeft, setMatchesLeft] = useState(5);

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      const profile = profiles[currentIndex];
      if (!profile) return;

      if (direction === "right") {
        setMatchesLeft((prev) => Math.max(0, prev - 1));

        // Simulate a match (30% chance for demo)
        if (Math.random() < 0.3) {
          setMatchedProfile(profile);
          setShowMatchModal(true);
        }

        // In production, call API
        try {
          await fetch("/api/matches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              receiverId: profile.id,
              action: "like",
            }),
          });
        } catch {
          // Demo mode
        }
      }

      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, profiles]
  );

  const currentProfile = profiles[currentIndex];

  return (
    <div>
      <Header title="Matches" />

      <div className="max-w-lg mx-auto px-4 py-6 lg:px-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-ink-50 rounded-lg p-1">
          <button
            onClick={() => setTab("discover")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors",
              tab === "discover"
                ? "bg-white text-ink-900 shadow-sm"
                : "text-ink-500 hover:text-ink-700"
            )}
          >
            <Heart className="w-4 h-4" />
            Discover
          </button>
          <button
            onClick={() => setTab("connections")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors",
              tab === "connections"
                ? "bg-white text-ink-900 shadow-sm"
                : "text-ink-500 hover:text-ink-700"
            )}
          >
            <Users className="w-4 h-4" />
            Connections
            <span className="badge badge-active">{DEMO_CONNECTIONS.length}</span>
          </button>
        </div>

        {tab === "discover" && (
          <>
            {/* Match counter */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-ink-500">
                  <span className="font-semibold text-ink-700">
                    {matchesLeft}
                  </span>{" "}
                  matches left today
                </span>
              </div>
              <Link
                href="/premium"
                className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline"
              >
                <Crown className="w-3.5 h-3.5" />
                Go unlimited
              </Link>
            </div>

            {/* Swipe stack */}
            <div className="relative h-[520px] sm:h-[560px]">
              {currentProfile ? (
                <>
                  {/* Next card (behind) */}
                  {profiles[currentIndex + 1] && (
                    <div className="absolute inset-0 scale-95 opacity-60">
                      <div className="h-full bg-white rounded-2xl border border-ink-100 shadow-md" />
                    </div>
                  )}
                  <SwipeCard
                    key={currentProfile.id}
                    profile={currentProfile}
                    onSwipe={handleSwipe}
                    isTop={true}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cream-200 mb-4">
                    <BookOpen className="w-7 h-7 text-ink-300" />
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-ink-700 mb-2">
                    No more readers
                  </h3>
                  <p className="text-sm text-ink-400 max-w-xs">
                    Add more books to your reading list to find readers with
                    shared interests.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "connections" && (
          <div className="space-y-3">
            {DEMO_CONNECTIONS.length > 0 ? (
              DEMO_CONNECTIONS.map((conn) => (
                <div
                  key={conn.matchId}
                  className="card p-4 flex items-center gap-3"
                >
                  <Avatar
                    src={conn.user.image}
                    name={conn.user.name || "Reader"}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-ink-900">
                      {conn.user.name}
                    </h3>
                    <p className="text-xs text-ink-400">
                      Matched over{" "}
                      <span className="font-medium text-sage-600">
                        {conn.bookContext}
                      </span>
                    </p>
                    <p className="text-[10px] text-ink-300 mt-0.5">
                      {formatDate(conn.matchedAt)}
                    </p>
                  </div>
                  <button className="p-2 rounded-lg bg-sage-50 text-sage-600 hover:bg-sage-100 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cream-200 mb-4">
                  <Heart className="w-7 h-7 text-ink-300" />
                </div>
                <h3 className="text-lg font-serif font-semibold text-ink-700 mb-2">
                  No connections yet
                </h3>
                <p className="text-sm text-ink-400">
                  Start swiping to connect with readers.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <MatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        matchedUser={matchedProfile}
      />
    </div>
  );
}

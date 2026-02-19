"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { SpaceCard } from "@/components/spaces/space-card";
import {
  Search,
  TrendingUp,
  Flame,
  Clock,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "trending" | "new" | "popular";

const TRENDING_SPACES = [
  {
    id: "d1",
    name: "The Thursday Murder Club — Whodunit Chat",
    description: "We're solving mysteries together every week. Currently on chapter 12.",
    type: "CHAT" as const,
    language: "en",
    genre: ["Mystery", "Fiction"],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    scheduledAt: null,
    book: { title: "The Thursday Murder Club", author: "Richard Osman", coverUrl: null },
    owner: { name: "Beth C.", image: null },
    _count: { messages: 892, members: 19 },
  },
  {
    id: "d2",
    name: "Fourth Wing Fans — Dragon Riders Unite",
    description: "All things Fourth Wing. Spoiler tags required for Iron Flame content!",
    type: "HYBRID" as const,
    language: "en",
    genre: ["Fantasy", "Romance"],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    scheduledAt: new Date(Date.now() + 172800000).toISOString(),
    book: { title: "Fourth Wing", author: "Rebecca Yarros", coverUrl: null },
    owner: { name: "Violet S.", image: null },
    _count: { messages: 2103, members: 20 },
  },
  {
    id: "d3",
    name: "Thinking, Fast and Slow — Study Group",
    description: "Chapter-by-chapter breakdown with practical exercises. Perfect for behavioral science enthusiasts.",
    type: "CALL" as const,
    language: "en",
    genre: ["Psychology", "Non-Fiction", "Science"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    book: { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", coverUrl: null },
    owner: { name: "Dr. Chen W.", image: null },
    _count: { messages: 456, members: 12 },
  },
  {
    id: "d4",
    name: "Babel Tower Readers",
    description: "Exploring themes of language, colonialism, and power in R.F. Kuang's masterpiece.",
    type: "CHAT" as const,
    language: "en",
    genre: ["Fantasy", "Fiction", "History"],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    scheduledAt: null,
    book: { title: "Babel", author: "R.F. Kuang", coverUrl: null },
    owner: { name: "Robin S.", image: null },
    _count: { messages: 678, members: 17 },
  },
];

export default function DiscoverPage() {
  const [tab, setTab] = useState<Tab>("trending");
  const [search, setSearch] = useState("");

  const tabs = [
    { key: "trending" as const, label: "Trending", icon: TrendingUp },
    { key: "new" as const, label: "New", icon: Clock },
    { key: "popular" as const, label: "Popular", icon: Flame },
  ];

  const filtered = search
    ? TRENDING_SPACES.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.book.title.toLowerCase().includes(search.toLowerCase()) ||
          s.book.author.toLowerCase().includes(search.toLowerCase())
      )
    : TRENDING_SPACES;

  return (
    <div>
      <Header title="Discover" />

      <div className="max-w-3xl mx-auto px-4 py-6 lg:px-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <input
            type="text"
            placeholder="Search trending books and spaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "chip gap-1.5",
                tab === t.key && "chip-active"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cream-200 mb-4">
              <BookOpen className="w-7 h-7 text-ink-300" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-ink-700 mb-2">
              Nothing found
            </h3>
            <p className="text-sm text-ink-400">
              Try searching for a different book or author.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

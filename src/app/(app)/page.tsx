"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { FilterBar } from "@/components/spaces/filter-bar";
import { SpaceCard } from "@/components/spaces/space-card";
import { useFilterStore } from "@/lib/store";
import { BookOpen, Loader2, TrendingUp } from "lucide-react";

interface Space {
  id: string;
  name: string;
  description: string | null;
  type: "CHAT" | "CALL" | "HYBRID";
  language: string;
  genre: string[];
  createdAt: string;
  scheduledAt: string | null;
  book: {
    title: string;
    author: string;
    coverUrl: string | null;
  };
  owner: {
    name: string | null;
    image: string | null;
  };
  _count: {
    messages: number;
    members: number;
  };
}

// Demo data for when the database isn't connected
const DEMO_SPACES: Space[] = [
  {
    id: "1",
    name: "Deep dive into Kafka's Metamorphosis",
    description: "Let's explore the themes of alienation, identity, and absurdism in Kafka's masterwork. Weekly discussions every Thursday.",
    type: "CHAT",
    language: "en",
    genre: ["Fiction", "Philosophy"],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    scheduledAt: null,
    book: { title: "The Metamorphosis", author: "Franz Kafka", coverUrl: null },
    owner: { name: "Elena R.", image: null },
    _count: { messages: 234, members: 12 },
  },
  {
    id: "2",
    name: "Dune Book Club — Live Discussion",
    description: "Reading Dune together chapter by chapter. Live calls every Sunday at 6pm EST.",
    type: "CALL",
    language: "en",
    genre: ["Science Fiction", "Fantasy"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    book: { title: "Dune", author: "Frank Herbert", coverUrl: null },
    owner: { name: "Marcus T.", image: null },
    _count: { messages: 567, members: 18 },
  },
  {
    id: "3",
    name: "Sapiens — History Lovers Unite",
    description: "Discussing Harari's perspective on the cognitive revolution and beyond.",
    type: "HYBRID",
    language: "en",
    genre: ["Non-Fiction", "History", "Science"],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    scheduledAt: null,
    book: { title: "Sapiens", author: "Yuval Noah Harari", coverUrl: null },
    owner: { name: "Aisha K.", image: null },
    _count: { messages: 189, members: 15 },
  },
  {
    id: "4",
    name: "Project Hail Mary Readers",
    description: "Rocky approves this space. No spoilers past chapter 20 please!",
    type: "CHAT",
    language: "en",
    genre: ["Science Fiction"],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    scheduledAt: null,
    book: { title: "Project Hail Mary", author: "Andy Weir", coverUrl: null },
    owner: { name: "James L.", image: null },
    _count: { messages: 412, members: 20 },
  },
  {
    id: "5",
    name: "Norwegian Wood Reading Circle",
    description: "Murakami's prose deserves slow reading. Join us for a contemplative journey through this beautiful novel.",
    type: "CHAT",
    language: "en",
    genre: ["Fiction", "Romance"],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    scheduledAt: null,
    book: { title: "Norwegian Wood", author: "Haruki Murakami", coverUrl: null },
    owner: { name: "Yuki S.", image: null },
    _count: { messages: 98, members: 8 },
  },
  {
    id: "6",
    name: "The Stoic Reader — Meditations",
    description: "Daily passages from Marcus Aurelius. Building a reading habit one page at a time.",
    type: "HYBRID",
    language: "en",
    genre: ["Philosophy", "Non-Fiction"],
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    scheduledAt: null,
    book: { title: "Meditations", author: "Marcus Aurelius", coverUrl: null },
    owner: { name: "David M.", image: null },
    _count: { messages: 756, members: 14 },
  },
  {
    id: "7",
    name: "Lectura en Español — Cien Años de Soledad",
    description: "Discutamos la obra maestra de García Márquez en su idioma original.",
    type: "CHAT",
    language: "es",
    genre: ["Fiction"],
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    scheduledAt: null,
    book: { title: "Cien Años de Soledad", author: "Gabriel García Márquez", coverUrl: null },
    owner: { name: "Sofia V.", image: null },
    _count: { messages: 321, members: 11 },
  },
  {
    id: "8",
    name: "Atomic Habits Accountability Group",
    description: "Not just reading — applying. Share your habit stacks and track progress together.",
    type: "CALL",
    language: "en",
    genre: ["Self-Help", "Psychology"],
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    book: { title: "Atomic Habits", author: "James Clear", coverUrl: null },
    owner: { name: "Priya N.", image: null },
    _count: { messages: 445, members: 16 },
  },
];

export default function HomePage() {
  const [spaces, setSpaces] = useState<Space[]>(DEMO_SPACES);
  const [isLoading, setIsLoading] = useState(false);
  const { genre, language, dateRange, spaceType, searchQuery } =
    useFilterStore();

  const fetchSpaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (genre) params.set("genre", genre);
      if (language) params.set("language", language);
      if (dateRange !== "all") params.set("dateRange", dateRange);
      if (spaceType !== "all") params.set("type", spaceType);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/spaces?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSpaces(data.spaces);
      }
    } catch {
      // Use demo data as fallback
      setSpaces(DEMO_SPACES);
    } finally {
      setIsLoading(false);
    }
  }, [genre, language, dateRange, spaceType, searchQuery]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  // Client-side filtering of demo data
  const filteredSpaces = spaces.filter((space) => {
    if (genre && !space.genre.includes(genre)) return false;
    if (language && space.language !== language) return false;
    if (spaceType !== "all" && space.type !== spaceType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        space.name.toLowerCase().includes(q) ||
        space.book.title.toLowerCase().includes(q) ||
        space.book.author.toLowerCase().includes(q) ||
        space.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <Header title="Home" />

      <div className="max-w-3xl mx-auto px-4 py-6 lg:px-6 space-y-6">
        {/* Welcome section */}
        <div className="bg-gradient-to-br from-sage-50 to-cream-100 rounded-xl p-5 border border-sage-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-sage-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-sage-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-800 mb-1">
                Active conversations
              </h2>
              <p className="text-xs text-ink-500 leading-relaxed">
                {filteredSpaces.length} spaces are open right now. Join a
                discussion or create your own space to start reading together.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FilterBar />

        {/* Space list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-ink-300 animate-spin" />
          </div>
        ) : filteredSpaces.length > 0 ? (
          <div className="space-y-3">
            {filteredSpaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cream-200 mb-4">
              <BookOpen className="w-7 h-7 text-ink-300" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-ink-700 mb-2">
              No spaces found
            </h3>
            <p className="text-sm text-ink-400 max-w-sm mx-auto">
              Try adjusting your filters, or create a new space to start
              discussing a book you&apos;re reading.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

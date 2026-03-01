"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import {
  AutocompleteInput,
  type BookResult,
  type AuthorResult,
} from "@/components/ui/autocomplete-input";
import {
  BookOpen,
  MessageCircle,
  Phone,
  Zap,
  ChevronDown,
  ArrowLeft,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { cn, GENRES, LANGUAGES } from "@/lib/utils";
import Link from "next/link";

type SpaceType = "CHAT" | "CALL" | "HYBRID";

export default function CreateSpacePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    bookTitle: "",
    bookAuthor: "",
    _coverUrl: null as string | null,
    type: "CHAT" as SpaceType,
    maxMembers: 20,
    language: "en",
    genres: [] as string[],
    scheduledAt: "",
    duration: 60,
    expiryDays: 7,
    rules: [] as string[],
  });

  const handleBookSelect = (result: BookResult | AuthorResult) => {
    const book = result as BookResult;
    setForm((prev) => ({
      ...prev,
      bookTitle: book.title,
      bookAuthor: book.author,
      _coverUrl: book.coverUrl,
    }));
  };

  const toggleRule = (rule: string) => {
    setForm((prev) => ({
      ...prev,
      rules: prev.rules.includes(rule)
        ? prev.rules.filter((r) => r !== rule)
        : [...prev.rules, rule],
    }));
  };

  const toggleGenre = (g: string) => {
    setForm((prev) => ({
      ...prev,
      genres: prev.genres.includes(g)
        ? prev.genres.filter((x) => x !== g)
        : [...prev.genres, g],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // First, create or find the book
      const bookRes = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.bookTitle,
          author: form.bookAuthor,
          coverUrl: form._coverUrl,
          genre: form.genres,
          language: form.language,
        }),
      });

      if (!bookRes.ok) {
        throw new Error("Failed to create book");
      }

      const book = await bookRes.json();

      // Then create the space
      const spaceRes = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          bookId: book.id,
          type: form.type,
          maxMembers: form.maxMembers,
          language: form.language,
          genre: form.genres,
          scheduledAt: form.scheduledAt || null,
          duration: form.type !== "CHAT" ? form.duration : null,
          expiryDays: form.expiryDays,
          rules: form.rules,
        }),
      });

      if (!spaceRes.ok) {
        throw new Error("Failed to create space");
      }

      const space = await spaceRes.json();
      router.push(`/spaces/${space.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    {
      value: "CHAT" as const,
      icon: MessageCircle,
      label: "Chat",
      description: "Text-based discussion",
    },
    {
      value: "CALL" as const,
      icon: Phone,
      label: "Live Call",
      description: "Voice/video discussion",
    },
    {
      value: "HYBRID" as const,
      icon: Zap,
      label: "Hybrid",
      description: "Chat + scheduled calls",
    },
  ];

  return (
    <div>
      <Header>
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mr-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </Header>

      <div className="max-w-xl mx-auto px-4 py-6 lg:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-serif font-bold text-ink-900 mb-1">
            Create a Space
          </h1>
          <p className="text-sm text-ink-400">
            Start a discussion around a book you&apos;re reading
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Space name */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">
              Space name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Deep dive into Kafka's Metamorphosis"
              className="input-field"
              required
              maxLength={100}
            />
          </div>

          {/* Book details */}
          <div className="card p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <BookOpen className="w-4 h-4 text-sage-600" />
              Book details
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1">
                  Book title
                </label>
                <AutocompleteInput
                  type="book"
                  placeholder="Search for a book…"
                  onSelect={handleBookSelect}
                  inputClassName="text-sm"
                />
                {form.bookTitle && (
                  <p className="text-xs text-sage-600 mt-1">
                    Selected: <span className="font-medium">{form.bookTitle}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={form.bookAuthor}
                  onChange={(e) => setForm({ ...form, bookAuthor: e.target.value })}
                  placeholder="Auto-filled from search, or type manually"
                  className="input-field text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Space type */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              Space type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: opt.value })}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                    form.type === opt.value
                      ? "border-sage-500 bg-sage-50"
                      : "border-ink-100 hover:border-ink-200"
                  )}
                >
                  <opt.icon
                    className={cn(
                      "w-5 h-5",
                      form.type === opt.value
                        ? "text-sage-600"
                        : "text-ink-400"
                    )}
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-[10px] text-ink-400">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Space Duration */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-ink-400" />
              Space Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setForm({ ...form, expiryDays: days })}
                  className={cn(
                    "flex flex-col items-center gap-0.5 p-3 rounded-xl border-2 transition-all",
                    form.expiryDays === days
                      ? "border-sage-500 bg-sage-50 text-sage-700"
                      : "border-ink-100 hover:border-ink-200 text-ink-600"
                  )}
                >
                  <span className="text-sm font-semibold">{days}d</span>
                  <span className="text-[10px] text-ink-400">
                    {days === 7 ? "1 week" : days === 14 ? "2 weeks" : "1 month"}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-400 mt-1.5">
              Space expires automatically. Premium members can vote to extend.
            </p>
          </div>

          {/* Space Rules */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-ink-400" />
              Space Rules
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "ACTIVE_READERS_ONLY",
                  label: "Active Readers Only",
                  description: "Joining requires this book in your READING list.",
                },
                {
                  value: "SPOILER_EXPULSION",
                  label: "No Spoilers Policy",
                  description: "Members agree to no spoilers. Violators may be removed.",
                },
              ].map((rule) => (
                <label
                  key={rule.value}
                  className="flex items-start gap-3 p-3 rounded-xl border border-ink-100 hover:border-ink-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.rules.includes(rule.value)}
                    onChange={() => toggleRule(rule.value)}
                    className="mt-0.5 accent-sage-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-ink-800">{rule.label}</span>
                    <p className="text-xs text-ink-400 mt-0.5">{rule.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Schedule (for CALL/HYBRID) */}
          {form.type !== "CHAT" && (
            <div className="card p-4 space-y-3 animate-slide-up">
              <label className="block text-sm font-medium text-ink-700">
                Schedule
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-500 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) =>
                      setForm({ ...form, scheduledAt: e.target.value })
                    }
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-500 mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: parseInt(e.target.value) })
                    }
                    min={15}
                    max={240}
                    step={15}
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="What will you discuss? Any rules or themes?"
              className="input-field resize-none h-24 text-sm"
              maxLength={500}
            />
            <p className="text-xs text-ink-300 mt-1">
              {form.description.length}/500
            </p>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              Genres
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={cn(
                    "chip text-xs",
                    form.genres.includes(g) && "chip-active"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Language + Max members */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                Language
              </label>
              <div className="relative">
                <select
                  value={form.language}
                  onChange={(e) =>
                    setForm({ ...form, language: e.target.value })
                  }
                  className="input-field text-sm appearance-none pr-8"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                Max members
              </label>
              <input
                type="number"
                value={form.maxMembers}
                onChange={(e) =>
                  setForm({ ...form, maxMembers: parseInt(e.target.value) })
                }
                min={2}
                max={100}
                className="input-field text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Create Space"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

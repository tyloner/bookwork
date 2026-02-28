"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Target,
  Check,
} from "lucide-react";
import { cn, GENRES, LANGUAGES } from "@/lib/utils";
import { WormLogo } from "@/components/WormLogo";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    bio: "",
    location: "",
    language: "en",
    favoriteGenres: [] as string[],
    readingGoal: 12,
    currentBook: "",
    currentAuthor: "",
  });

  const toggleGenre = (g: string) => {
    setForm((prev) => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.includes(g)
        ? prev.favoriteGenres.filter((x) => x !== g)
        : [...prev.favoriteGenres, g],
    }));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: form.bio,
          location: form.location,
          language: form.language,
          favoriteGenres: form.favoriteGenres,
          readingGoal: form.readingGoal,
        }),
      });

      if (form.currentBook && form.currentAuthor) {
        const bookRes = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.currentBook,
            author: form.currentAuthor,
          }),
        });

        if (bookRes.ok) {
          const book = await bookRes.json();
          await fetch("/api/user/books", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookId: book.id,
              status: "READING",
            }),
          });
        }
      }

      router.push("/");
    } catch {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-colors",
                s <= step ? "bg-sage-500" : "bg-ink-200"
              )}
            />
          ))}
        </div>

        {/* Step 1: About You */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-sage-100 rounded-lg">
                <WormLogo className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-ink-900">
                  Welcome to BookWrm
                </h1>
                <p className="text-sm text-ink-400">
                  Tell us about yourself
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Short bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Book lover, coffee addict, night reader..."
                  className="input-field resize-none h-20 text-sm"
                  maxLength={300}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="City, Country"
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Preferred language
                </label>
                <select
                  value={form.language}
                  onChange={(e) =>
                    setForm({ ...form, language: e.target.value })
                  }
                  className="input-field text-sm"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Reading Preferences */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-serif font-bold text-ink-900 mb-1">
              What do you like to read?
            </h1>
            <p className="text-sm text-ink-400 mb-6">
              Pick your favorite genres (select at least 3)
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={cn(
                    "chip",
                    form.favoriteGenres.includes(g) && "chip-active"
                  )}
                >
                  {form.favoriteGenres.includes(g) && (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  {g}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                <Target className="w-4 h-4 inline mr-1" />
                Annual reading goal
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={form.readingGoal}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      readingGoal: parseInt(e.target.value),
                    })
                  }
                  className="flex-1 accent-sage-600"
                />
                <span className="text-sm font-semibold text-ink-800 w-16 text-right">
                  {form.readingGoal} books
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Current Book */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-serif font-bold text-ink-900 mb-1">
              What are you reading?
            </h1>
            <p className="text-sm text-ink-400 mb-6">
              Add a book to start matching with other readers
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Book title
                </label>
                <input
                  type="text"
                  value={form.currentBook}
                  onChange={(e) =>
                    setForm({ ...form, currentBook: e.target.value })
                  }
                  placeholder="e.g., Dune"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Author
                </label>
                <input
                  type="text"
                  value={form.currentAuthor}
                  onChange={(e) =>
                    setForm({ ...form, currentAuthor: e.target.value })
                  }
                  placeholder="e.g., Frank Herbert"
                  className="input-field text-sm"
                />
              </div>
            </div>

            <p className="text-xs text-ink-400 mt-3">
              You can skip this and add books later from your profile.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="btn-secondary gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              className="btn-primary gap-1"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="btn-primary gap-1"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

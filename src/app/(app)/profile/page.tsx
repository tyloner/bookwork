"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Avatar } from "@/components/ui/avatar";
import {
  AutocompleteInput,
  type BookResult,
  type AuthorResult,
} from "@/components/ui/autocomplete-input";
import {
  BookOpen,
  BookMarked,
  Settings,
  Crown,
  MapPin,
  Calendar,
  Target,
  Edit3,
  X,
} from "lucide-react";
import { cn, GENRES } from "@/lib/utils";
import Link from "next/link";

interface ReadingBook {
  id: string;
  bookId: string;
  book: { id: string; title: string; author: string; coverUrl: string | null };
}

interface UserProfile {
  name: string;
  email: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  favoriteGenres: string[];
  favoriteAuthors: string[];
  userBooks: ReadingBook[];
  readingGoal: number;
  booksReadThisYear: number;
  tier: "FREE" | "PREMIUM";
  createdAt: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Reader",
  email: "",
  image: null,
  bio: null,
  location: null,
  favoriteGenres: [],
  favoriteAuthors: [],
  userBooks: [],
  readingGoal: 12,
  booksReadThisYear: 0,
  tier: "FREE",
  createdAt: new Date().toISOString(),
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    ...DEFAULT_PROFILE,
    name: session?.user?.name || "Reader",
    email: session?.user?.email || "",
    image: session?.user?.image || null,
  });
  const [editForm, setEditForm] = useState(profile);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        const loaded: UserProfile = {
          ...DEFAULT_PROFILE,
          ...data,
          userBooks: data.userBooks ?? [],
          favoriteAuthors: data.favoriteAuthors ?? [],
          favoriteGenres: data.favoriteGenres ?? [],
        };
        setProfile(loaded);
        setEditForm(loaded);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          bio: editForm.bio,
          location: editForm.location,
          favoriteGenres: editForm.favoriteGenres,
          favoriteAuthors: editForm.favoriteAuthors,
          readingGoal: editForm.readingGoal,
        }),
      });
      if (res.ok) setProfile(editForm);
    } catch {
      setProfile(editForm);
    }
    setIsSaving(false);
    setIsEditing(false);
  };

  const toggleGenre = (g: string) => {
    setEditForm((prev) => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.includes(g)
        ? prev.favoriteGenres.filter((x) => x !== g)
        : [...prev.favoriteGenres, g],
    }));
  };

  const addAuthor = (result: BookResult | AuthorResult) => {
    const name = (result as AuthorResult).name;
    if (!editForm.favoriteAuthors.includes(name)) {
      setEditForm((prev) => ({
        ...prev,
        favoriteAuthors: [...prev.favoriteAuthors, name],
      }));
    }
  };

  const removeAuthor = (name: string) => {
    setEditForm((prev) => ({
      ...prev,
      favoriteAuthors: prev.favoriteAuthors.filter((a) => a !== name),
    }));
  };

  const addReadingBook = async (result: BookResult | AuthorResult) => {
    const book = result as BookResult;
    try {
      const bookRes = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: book.title, author: book.author, coverUrl: book.coverUrl }),
      });
      if (!bookRes.ok) return;
      const bookData = await bookRes.json();

      const ubRes = await fetch("/api/user/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: bookData.id, status: "READING" }),
      });
      if (!ubRes.ok) return;
      const ub = await ubRes.json();

      const newEntry: ReadingBook = {
        id: ub.id,
        bookId: bookData.id,
        book: { id: bookData.id, title: bookData.title, author: bookData.author, coverUrl: bookData.coverUrl },
      };
      const update = (prev: UserProfile) => ({
        ...prev,
        userBooks: prev.userBooks.some((b) => b.bookId === bookData.id)
          ? prev.userBooks
          : [...prev.userBooks, newEntry],
      });
      setProfile(update);
      setEditForm(update);
    } catch {}
  };

  const removeReadingBook = async (userBookId: string) => {
    try {
      await fetch(`/api/user/books/${userBookId}`, { method: "DELETE" });
      const remove = (prev: UserProfile) => ({
        ...prev,
        userBooks: prev.userBooks.filter((b) => b.id !== userBookId),
      });
      setProfile(remove);
      setEditForm(remove);
    } catch {}
  };

  const readingProgress = Math.min(
    100,
    Math.round((profile.booksReadThisYear / profile.readingGoal) * 100)
  );
  const displayBooks = isEditing ? editForm.userBooks : profile.userBooks;
  const displayAuthors = isEditing ? editForm.favoriteAuthors : profile.favoriteAuthors;

  return (
    <div>
      <Header title="Profile">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-ink-50 text-ink-500">
          <Settings className="w-5 h-5" />
        </Link>
      </Header>

      <div className="max-w-lg mx-auto px-4 py-6 lg:px-6 space-y-6">
        {/* Profile header */}
        <div className="card p-6 text-center">
          <div className="relative inline-block mb-4">
            <Avatar
              src={profile.image}
              name={profile.name}
              size="xl"
              className="w-24 h-24 text-2xl ring-4 ring-cream-200"
            />
            {profile.tier === "PREMIUM" && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center ring-2 ring-white">
                <Crown className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-serif font-bold text-ink-900">{profile.name}</h2>
          <p className="text-sm text-ink-400">{profile.email}</p>
          {profile.location && (
            <p className="flex items-center justify-center gap-1 text-xs text-ink-400 mt-1">
              <MapPin className="w-3 h-3" />
              {profile.location}
            </p>
          )}
          {profile.tier === "FREE" && (
            <Link
              href="/premium"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <Crown className="w-3.5 h-3.5" />
              Upgrade to Premium
            </Link>
          )}
          <button
            onClick={() => { setEditForm(profile); setIsEditing(true); }}
            className="btn-ghost text-sm gap-1.5 mt-3 mx-auto"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit profile
          </button>
        </div>

        {/* Bio */}
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">About</h3>
          {isEditing ? (
            <textarea
              value={editForm.bio || ""}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="input-field resize-none h-20 text-sm"
              placeholder="Tell other readers about yourself..."
              maxLength={300}
            />
          ) : (
            <p className="text-sm text-ink-600 leading-relaxed">{profile.bio || "No bio yet."}</p>
          )}
        </div>

        {/* Reading goal */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Reading Goal</h3>
            <div className="flex items-center gap-1 text-xs text-ink-400">
              <Target className="w-3.5 h-3.5" />
              {profile.booksReadThisYear} / {profile.readingGoal} books
            </div>
          </div>
          <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sage-500 to-sage-400 rounded-full transition-all duration-500"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
          <p className="text-xs text-ink-400 mt-1.5">
            {readingProgress}% complete —{" "}
            {Math.max(0, profile.readingGoal - profile.booksReadThisYear)} books to go
          </p>
        </div>

        {/* Currently Reading */}
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">
            Currently Reading
          </h3>
          {isEditing && (
            <div className="mb-3">
              <AutocompleteInput
                type="book"
                placeholder="Search to add a book…"
                onSelect={addReadingBook}
                inputClassName="text-sm"
              />
            </div>
          )}
          {displayBooks.length > 0 ? (
            <ul className="space-y-2">
              {displayBooks.map((ub) => (
                <li key={ub.id} className="flex items-center gap-2.5">
                  {ub.book.coverUrl ? (
                    <img src={ub.book.coverUrl} alt="" className="w-8 h-10 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-10 bg-cream-200 rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-ink-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{ub.book.title}</p>
                    <p className="text-xs text-ink-400 truncate">{ub.book.author}</p>
                  </div>
                  {isEditing && (
                    <button onClick={() => removeReadingBook(ub.id)} className="p-1 text-ink-300 hover:text-red-500 flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-400">
              {isEditing ? "Search above to add books." : "No books added yet."}
            </p>
          )}
        </div>

        {/* Favorite genres */}
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">
            Favorite Genres
          </h3>
          {isEditing ? (
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={cn("chip text-xs", editForm.favoriteGenres.includes(g) && "chip-active")}
                >
                  {g}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {profile.favoriteGenres.length > 0 ? (
                profile.favoriteGenres.map((g) => (
                  <span key={g} className="chip text-xs">{g}</span>
                ))
              ) : (
                <span className="text-sm text-ink-400">None added yet.</span>
              )}
            </div>
          )}
        </div>

        {/* Favorite Authors */}
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">
            Favorite Authors
          </h3>
          {isEditing && (
            <div className="mb-3">
              <AutocompleteInput
                type="author"
                placeholder="Search to add an author…"
                onSelect={addAuthor}
                inputClassName="text-sm"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {displayAuthors.length > 0 ? (
              displayAuthors.map((a) => (
                <span key={a} className="chip text-xs flex items-center gap-1">
                  {a}
                  {isEditing && (
                    <button onClick={() => removeAuthor(a)} className="ml-0.5 text-ink-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className="text-sm text-ink-400">
                {isEditing ? "Search above to add authors." : "None added yet."}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <BookMarked className="w-5 h-5 text-sage-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-ink-900">{profile.booksReadThisYear}</div>
            <div className="text-[10px] text-ink-400">Books read</div>
          </div>
          <div className="card p-3 text-center">
            <BookOpen className="w-5 h-5 text-sage-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-ink-900">{profile.userBooks.length}</div>
            <div className="text-[10px] text-ink-400">Reading now</div>
          </div>
          <div className="card p-3 text-center">
            <Calendar className="w-5 h-5 text-sage-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-ink-900">
              {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </div>
            <div className="text-[10px] text-ink-400">Joined</div>
          </div>
        </div>

        {/* Save/Cancel */}
        {isEditing && (
          <div className="flex gap-3">
            <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isSaving} className="btn-primary flex-1">
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

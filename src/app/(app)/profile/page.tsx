"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Avatar } from "@/components/ui/avatar";
import {
  BookOpen,
  BookMarked,
  Settings,
  Crown,
  MapPin,
  Calendar,
  Target,
  Edit3,
  Plus,
} from "lucide-react";
import { cn, GENRES } from "@/lib/utils";
import Link from "next/link";

interface UserProfile {
  name: string;
  email: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  favoriteGenres: string[];
  readingGoal: number;
  booksReadThisYear: number;
  tier: "FREE" | "PREMIUM";
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: session?.user?.name || "Reader",
    email: session?.user?.email || "",
    image: session?.user?.image || null,
    bio: "Avid reader and book club enthusiast. Always looking for the next great discussion.",
    location: "New York, NY",
    favoriteGenres: ["Fiction", "Philosophy", "Science Fiction"],
    readingGoal: 24,
    booksReadThisYear: 17,
    tier: "FREE",
    createdAt: new Date().toISOString(),
  });

  const [editForm, setEditForm] = useState(profile);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setProfile(editForm);
      }
    } catch {
      // Demo mode
      setProfile(editForm);
    }
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

  const readingProgress = Math.min(
    100,
    Math.round((profile.booksReadThisYear / profile.readingGoal) * 100)
  );

  return (
    <div>
      <Header title="Profile">
        <Link
          href="/settings"
          className="p-2 rounded-lg hover:bg-ink-50 text-ink-500"
        >
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

          <h2 className="text-xl font-serif font-bold text-ink-900">
            {profile.name}
          </h2>
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
            onClick={() => {
              setEditForm(profile);
              setIsEditing(true);
            }}
            className="btn-ghost text-sm gap-1.5 mt-3 mx-auto"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit profile
          </button>
        </div>

        {/* Bio */}
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
            About
          </h3>
          {isEditing ? (
            <textarea
              value={editForm.bio || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, bio: e.target.value })
              }
              className="input-field resize-none h-20 text-sm"
              placeholder="Tell other readers about yourself..."
              maxLength={300}
            />
          ) : (
            <p className="text-sm text-ink-600 leading-relaxed">
              {profile.bio || "No bio yet."}
            </p>
          )}
        </div>

        {/* Reading goal */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
              Reading Goal
            </h3>
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
            {readingProgress}% complete — {profile.readingGoal - profile.booksReadThisYear} books to go
          </p>
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
                  className={cn(
                    "chip text-xs",
                    editForm.favoriteGenres.includes(g) && "chip-active"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {profile.favoriteGenres.map((g) => (
                <span key={g} className="chip text-xs">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <BookMarked className="w-5 h-5 text-sage-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-ink-900">
              {profile.booksReadThisYear}
            </div>
            <div className="text-[10px] text-ink-400">Books read</div>
          </div>
          <div className="card p-3 text-center">
            <BookOpen className="w-5 h-5 text-sage-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-ink-900">3</div>
            <div className="text-[10px] text-ink-400">Active spaces</div>
          </div>
          <div className="card p-3 text-center">
            <Calendar className="w-5 h-5 text-sage-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-ink-900">
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
            <div className="text-[10px] text-ink-400">Joined</div>
          </div>
        </div>

        {/* Save/Cancel for editing */}
        {isEditing && (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary flex-1">
              Save changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

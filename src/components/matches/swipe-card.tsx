"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
  BookOpen,
  MapPin,
  Heart,
  X,
  BookMarked,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

interface SwipeCardProps {
  profile: ReaderProfile;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

export function SwipeCard({ profile, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const [exitX, setExitX] = useState(0);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > 100) {
      setExitX(300);
      onSwipe("right");
    } else if (info.offset.x < -100) {
      setExitX(-300);
      onSwipe("left");
    }
  };

  return (
    <motion.div
      className="swipe-card"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="h-full bg-white rounded-2xl border border-ink-100 shadow-xl overflow-hidden flex flex-col">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-sage-100 via-cream-100 to-amber-50 p-6 pt-8">
          {/* Like/Nope overlays */}
          <motion.div
            className="swipe-card-like"
            style={{ opacity: likeOpacity }}
          >
            CONNECT
          </motion.div>
          <motion.div
            className="swipe-card-nope"
            style={{ opacity: nopeOpacity }}
          >
            PASS
          </motion.div>

          <div className="flex items-center gap-4">
            <Avatar
              src={profile.image}
              name={profile.name || "Reader"}
              size="xl"
              className="ring-4 ring-white shadow-md"
            />
            <div>
              <h2 className="text-xl font-serif font-bold text-ink-900">
                {profile.name || "Anonymous Reader"}
              </h2>
              {profile.location && (
                <p className="flex items-center gap-1 text-sm text-ink-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.location}
                </p>
              )}
              <div className="flex items-center gap-1 mt-1">
                <BookMarked className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-ink-500">
                  {profile.booksReadThisYear} books this year
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-ink-600 leading-relaxed italic">
              &ldquo;{profile.bio}&rdquo;
            </p>
          )}

          {/* Shared books */}
          {profile.sharedBooks.length > 0 && (
            <div className="bg-sage-50 rounded-xl p-3.5 border border-sage-200">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-sage-600" />
                <span className="text-xs font-semibold text-sage-700 uppercase tracking-wider">
                  Books in Common
                </span>
              </div>
              <div className="space-y-1.5">
                {profile.sharedBooks.map((book) => (
                  <div key={book.title} className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-sage-500 flex-shrink-0" />
                    <span className="text-sm text-ink-700">
                      <span className="font-medium">{book.title}</span>
                      <span className="text-ink-400"> by {book.author}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Currently reading */}
          {profile.currentlyReading.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
                Currently Reading
              </h3>
              <div className="space-y-2">
                {profile.currentlyReading.map((book) => (
                  <div
                    key={book.title}
                    className="flex items-center gap-3 p-2 rounded-lg bg-cream-50"
                  >
                    <div className="w-8 h-12 rounded bg-cream-200 flex items-center justify-center flex-shrink-0">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <BookOpen className="w-4 h-4 text-ink-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">
                        {book.title}
                      </p>
                      <p className="text-xs text-ink-400">{book.author}</p>
                      {/* Progress bar */}
                      <div className="mt-1 h-1 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sage-500 rounded-full"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-ink-400 flex-shrink-0">
                      {book.progress}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Genres */}
          {profile.favoriteGenres.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
                Favorite Genres
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.favoriteGenres.map((g) => (
                  <span key={g} className="chip text-xs">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6 p-4 border-t border-ink-100">
          <button
            onClick={() => onSwipe("left")}
            className="w-14 h-14 rounded-full border-2 border-red-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={() => onSwipe("right")}
            className="w-16 h-16 rounded-full bg-sage-600 flex items-center justify-center text-white hover:bg-sage-700 shadow-lg transition-all hover:scale-105"
          >
            <Heart className="w-7 h-7" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

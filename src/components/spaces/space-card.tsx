"use client";

import Link from "next/link";
import {
  MessageCircle,
  Users,
  Phone,
  Clock,
  BookOpen,
} from "lucide-react";
import { cn, formatDate, truncate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface SpaceCardProps {
  space: {
    id: string;
    name: string;
    description?: string | null;
    type: "CHAT" | "CALL" | "HYBRID";
    language: string;
    genre: string[];
    createdAt: string;
    scheduledAt?: string | null;
    book: {
      title: string;
      author: string;
      coverUrl?: string | null;
    };
    owner: {
      name?: string | null;
      image?: string | null;
    };
    _count: {
      messages: number;
      members: number;
    };
  };
}

const typeConfig = {
  CHAT: { icon: MessageCircle, label: "Chat", color: "text-emerald-600 bg-emerald-50" },
  CALL: { icon: Phone, label: "Live Call", color: "text-red-600 bg-red-50" },
  HYBRID: { icon: MessageCircle, label: "Chat & Call", color: "text-blue-600 bg-blue-50" },
};

export function SpaceCard({ space }: SpaceCardProps) {
  const typeInfo = typeConfig[space.type];
  const TypeIcon = typeInfo.icon;

  return (
    <Link href={`/spaces/${space.id}`}>
      <div className="card p-4 hover:border-sage-300 transition-all duration-200 group">
        <div className="flex gap-4">
          {/* Book cover */}
          <div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-cream-200 shadow-sm">
            {space.book.coverUrl ? (
              <img
                src={space.book.coverUrl}
                alt={space.book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-ink-300" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-ink-900 group-hover:text-sage-700 transition-colors truncate">
                {space.name}
              </h3>
              <span
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                  typeInfo.color
                )}
              >
                <TypeIcon className="w-3 h-3" />
                {typeInfo.label}
              </span>
            </div>

            <p className="text-xs text-ink-500 mb-2">
              <span className="font-medium">{space.book.title}</span>
              {" by "}
              {space.book.author}
            </p>

            {space.description && (
              <p className="text-xs text-ink-400 mb-3 leading-relaxed">
                {truncate(space.description, 120)}
              </p>
            )}

            {/* Genre tags */}
            {space.genre.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {space.genre.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-full bg-cream-100 text-ink-500 text-[10px] font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-ink-400">
                <span className="flex items-center gap-1 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  {space._count.members}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {space._count.messages}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(space.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Avatar
                  src={space.owner.image}
                  name={space.owner.name || "User"}
                  size="sm"
                />
                <span className="text-xs text-ink-500 hidden sm:inline">
                  {space.owner.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

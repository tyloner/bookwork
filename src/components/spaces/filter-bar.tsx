"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
} from "lucide-react";
import { cn, GENRES, LANGUAGES } from "@/lib/utils";
import { useFilterStore } from "@/lib/store";

export function FilterBar() {
  const [showFilters, setShowFilters] = useState(false);
  const {
    genre,
    language,
    dateRange,
    spaceType,
    searchQuery,
    setGenre,
    setLanguage,
    setDateRange,
    setSpaceType,
    setSearchQuery,
    resetFilters,
  } = useFilterStore();

  const hasActiveFilters = genre || language || dateRange !== "all" || spaceType !== "all";

  return (
    <div className="space-y-3">
      {/* Search + toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <input
            type="text"
            placeholder="Search books, authors, or spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "btn-secondary gap-2 text-sm flex-shrink-0",
            hasActiveFilters && "border-sage-400 bg-sage-50 text-sage-700"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-sage-600" />
          )}
        </button>
      </div>

      {/* Space type quick filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(["all", "CHAT", "CALL", "HYBRID"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSpaceType(type)}
            className={cn(
              "chip flex-shrink-0 text-xs",
              spaceType === type && "chip-active"
            )}
          >
            {type === "all" ? "All Types" : type === "CHAT" ? "Chat" : type === "CALL" ? "Live Call" : "Hybrid"}
          </button>
        ))}
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="card p-4 animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-800">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-sage-600 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-2">
              Genre
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(genre === g ? null : g)}
                  className={cn(
                    "chip text-xs",
                    genre === g && "chip-active"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-2">
              Language
            </label>
            <div className="relative">
              <select
                value={language || ""}
                onChange={(e) => setLanguage(e.target.value || null)}
                className="input-field text-sm appearance-none pr-8"
              >
                <option value="">All Languages</option>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-2">
              Started
            </label>
            <div className="flex gap-2">
              {(["all", "today", "week", "month"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    "chip text-xs flex-1 justify-center",
                    dateRange === range && "chip-active"
                  )}
                >
                  {range === "all" ? "Anytime" : range === "today" ? "Today" : range === "week" ? "This week" : "This month"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

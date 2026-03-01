"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BookResult {
  olKey: string;
  title: string;
  author: string;
  coverUrl: string | null;
  year: number | null;
  localId?: string;
}

export interface AuthorResult {
  olKey: string;
  name: string;
  workCount: number;
}

interface AutocompleteInputProps {
  type: "book" | "author";
  placeholder?: string;
  onSelect: (result: BookResult | AuthorResult) => void;
  className?: string;
  inputClassName?: string;
}

export function AutocompleteInput({
  type,
  placeholder,
  onSelect,
  className,
  inputClassName,
}: AutocompleteInputProps) {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<(BookResult | AuthorResult)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/search/books?q=${encodeURIComponent(q)}&type=${type}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
          setIsOpen(true);
        }
      } catch {
        // fail silently
      } finally {
        setIsLoading(false);
      }
    },
    [type]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, search]);

  // Close on click outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleSelect = (result: BookResult | AuthorResult) => {
    const label =
      type === "book"
        ? (result as BookResult).title
        : (result as AuthorResult).name;
    setValue(label);
    setIsOpen(false);
    setResults([]);
    onSelect(result);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
          placeholder={placeholder ?? (type === "book" ? "Search books…" : "Search authors…")}
          className={cn("input-field pr-8", inputClassName)}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-ink-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {results.map((result) =>
            type === "book" ? (
              <li key={(result as BookResult).olKey}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(result)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-ink-50 text-left"
                >
                  {(result as BookResult).coverUrl ? (
                    <img
                      src={(result as BookResult).coverUrl!}
                      alt=""
                      className="w-8 h-10 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-10 bg-cream-200 rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-ink-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {(result as BookResult).title}
                    </p>
                    <p className="text-xs text-ink-400 truncate">
                      {(result as BookResult).author}
                      {(result as BookResult).year
                        ? ` · ${(result as BookResult).year}`
                        : ""}
                    </p>
                  </div>
                </button>
              </li>
            ) : (
              <li key={(result as AuthorResult).olKey}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(result)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-ink-50 text-left"
                >
                  <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-sage-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {(result as AuthorResult).name}
                    </p>
                    <p className="text-xs text-ink-400">
                      {(result as AuthorResult).workCount} works
                    </p>
                  </div>
                </button>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

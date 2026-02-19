"use client";

import { Menu, Bell } from "lucide-react";
import { useSidebarStore } from "@/lib/store";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  const { open } = useSidebarStore();

  return (
    <header className="sticky top-0 z-20 bg-cream-50/80 backdrop-blur-md border-b border-ink-100">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={open}
            className="lg:hidden p-1.5 rounded-lg hover:bg-ink-50 text-ink-500"
          >
            <Menu className="w-5 h-5" />
          </button>
          {title && (
            <h1 className="text-lg font-serif font-semibold text-ink-900">
              {title}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {children}
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg hover:bg-ink-50 text-ink-500 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
        </div>
      </div>
    </header>
  );
}

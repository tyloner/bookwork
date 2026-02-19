"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, MessageCircle, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/store";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/discover", icon: Search, label: "Discover" },
  { href: "/matches", icon: Heart, label: "Matches" },
  { href: "/spaces", icon: MessageCircle, label: "Spaces" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { open } = useSidebarStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ink-100 z-30 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors",
                isActive ? "text-sage-600" : "text-ink-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={open}
          className="flex flex-col items-center gap-0.5 py-2 px-3 text-ink-400"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}

"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Heart,
  MessageCircle,
  Search,
  Settings,
  User,
  Crown,
  LogOut,
  X,
  Plus,
  Bell,
} from "lucide-react";
import { WormLogo } from "@/components/WormLogo";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/discover", icon: Search, label: "Discover" },
  { href: "/matches", icon: Heart, label: "Matches" },
  { href: "/spaces", icon: MessageCircle, label: "My Spaces" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isOpen, close } = useSidebarStore();

  const user = session?.user;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink-900/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-white border-r border-ink-100 z-50",
          "flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <Link href="/" className="flex items-center gap-2.5" onClick={close}>
            <WormLogo className="w-7 h-7" />
            <span className="text-xl font-serif font-bold text-ink-900">
              BookWrm
            </span>
          </Link>
          <button
            onClick={close}
            className="lg:hidden p-1.5 rounded-lg hover:bg-ink-50 text-ink-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create space button */}
        <div className="px-4 pt-4">
          <Link
            href="/spaces/create"
            className="btn-primary w-full gap-2 text-sm"
            onClick={close}
          >
            <Plus className="w-4 h-4" />
            Create Space
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sage-50 text-sage-700"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-700"
                )}
              >
                <item.icon
                  className={cn("w-5 h-5", isActive && "text-sage-600")}
                />
                {item.label}
                {item.label === "Notifications" && (
                  <span className="ml-auto badge badge-live">3</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Premium upsell */}
        {user && (
          <div className="mx-4 mb-3">
            <Link
              href="/premium"
              className="block p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200"
              onClick={close}
            >
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">
                  Go Premium
                </span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Unlimited matches & spaces. No limits on your reading journey.
              </p>
            </Link>
          </div>
        )}

        {/* User section */}
        <div className="border-t border-ink-100 p-4">
          {user ? (
            <div className="space-y-3">
              <Link
                href="/profile"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-ink-50 transition-colors"
                onClick={close}
              >
                <Avatar
                  src={user.image}
                  name={user.name || "User"}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-ink-400 truncate">{user.email}</p>
                </div>
              </Link>
              <div className="flex gap-2">
                <Link
                  href="/settings"
                  className="btn-ghost flex-1 text-xs gap-1.5 py-2"
                  onClick={close}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="btn-ghost flex-1 text-xs gap-1.5 py-2 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <Link href="/auth/signin" className="btn-primary w-full text-sm">
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

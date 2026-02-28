"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Avatar } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Users,
  Crown,
  Bell,
  Check,
  Trash2,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  type: "MATCH_REQUEST" | "MATCH_ACCEPTED" | "NEW_MESSAGE" | "SPACE_INVITE" | "SUBSCRIPTION" | "SYSTEM";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "MATCH_ACCEPTED",
    title: "It's a match!",
    body: "You and Sarah J. are both reading 1984. Start chatting!",
    read: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "n2",
    type: "NEW_MESSAGE",
    title: "New message",
    body: "Marcus T. sent a message in 'Dune Book Club — Live Discussion'",
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "n3",
    type: "SPACE_INVITE",
    title: "Space invitation",
    body: "You've been invited to join 'The Stoic Reader — Meditations'",
    read: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "n4",
    type: "MATCH_REQUEST",
    title: "New reader match",
    body: "Someone wants to connect with you over a shared book.",
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "n5",
    type: "SYSTEM",
    title: "Welcome to BookWrm!",
    body: "Complete your profile and start connecting with readers who share your taste.",
    read: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const typeIcons = {
  MATCH_REQUEST: Heart,
  MATCH_ACCEPTED: Heart,
  NEW_MESSAGE: MessageCircle,
  SPACE_INVITE: Users,
  SUBSCRIPTION: Crown,
  SYSTEM: Bell,
};

const typeColors = {
  MATCH_REQUEST: "bg-pink-100 text-pink-600",
  MATCH_ACCEPTED: "bg-emerald-100 text-emerald-600",
  NEW_MESSAGE: "bg-blue-100 text-blue-600",
  SPACE_INVITE: "bg-purple-100 text-purple-600",
  SUBSCRIPTION: "bg-amber-100 text-amber-600",
  SYSTEM: "bg-ink-100 text-ink-600",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div>
      <Header title="Notifications">
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs text-sage-600 hover:underline"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </Header>

      <div className="max-w-lg mx-auto px-4 py-6 lg:px-6">
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type];
              const colorClass = typeColors[notification.type];

              return (
                <button
                  key={notification.id}
                  onClick={() => markRead(notification.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-4 rounded-xl text-left transition-colors",
                    notification.read
                      ? "bg-white hover:bg-ink-50/50"
                      : "bg-sage-50/50 hover:bg-sage-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                      colorClass
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          notification.read
                            ? "text-ink-700"
                            : "text-ink-900 font-semibold"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-sage-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-ink-300 mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cream-200 mb-4">
              <Bell className="w-7 h-7 text-ink-300" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-ink-700 mb-2">
              All caught up
            </h3>
            <p className="text-sm text-ink-400">
              No new notifications right now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

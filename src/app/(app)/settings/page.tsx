"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Header } from "@/components/layout/header";
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Globe,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  Crown,
  Smartphone,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { cn, LANGUAGES } from "@/lib/utils";
import Link from "next/link";

interface SettingSection {
  title: string;
  items: {
    icon: React.ElementType;
    label: string;
    description?: string;
    type: "link" | "toggle" | "select";
    href?: string;
    value?: boolean | string;
    options?: { label: string; value: string }[];
    danger?: boolean;
  }[];
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState({
    matches: true,
    messages: true,
    spaces: true,
    marketing: false,
  });
  const [language, setLanguage] = useState("en");
  const [darkMode, setDarkMode] = useState(false);

  const sections: SettingSection[] = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Edit profile",
          description: "Name, bio, photo, and reading preferences",
          type: "link",
          href: "/profile",
        },
        {
          icon: Crown,
          label: "Subscription",
          description: "Manage your Premium plan",
          type: "link",
          href: "/premium",
        },
        {
          icon: Shield,
          label: "Privacy & Security",
          description: "Password, two-factor authentication",
          type: "link",
          href: "/settings/privacy",
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "Match notifications",
          description: "When someone likes your profile",
          type: "toggle",
          value: notifications.matches,
        },
        {
          icon: Bell,
          label: "Message notifications",
          description: "New messages in your spaces",
          type: "toggle",
          value: notifications.messages,
        },
        {
          icon: Bell,
          label: "Space activity",
          description: "New members, scheduled calls",
          type: "toggle",
          value: notifications.spaces,
        },
        {
          icon: Bell,
          label: "Marketing emails",
          description: "Tips, features, and recommendations",
          type: "toggle",
          value: notifications.marketing,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Globe,
          label: "Language",
          type: "select",
          value: language,
          options: LANGUAGES.map((l) => ({ label: l.name, value: l.code })),
        },
        {
          icon: Smartphone,
          label: "Install app",
          description: "Add BookWork to your home screen",
          type: "link",
          href: "#install",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help center",
          type: "link",
          href: "/help",
        },
      ],
    },
    {
      title: "Danger zone",
      items: [
        {
          icon: LogOut,
          label: "Sign out",
          type: "link",
          href: "#signout",
          danger: true,
        },
        {
          icon: Trash2,
          label: "Delete account",
          description: "Permanently remove your data",
          type: "link",
          href: "#delete",
          danger: true,
        },
      ],
    },
  ];

  const handleToggle = (sectionTitle: string, index: number) => {
    if (sectionTitle === "Notifications") {
      const keys = ["matches", "messages", "spaces", "marketing"] as const;
      const key = keys[index];
      if (key) {
        setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
      }
    }
  };

  const handleItemClick = (item: SettingSection["items"][0]) => {
    if (item.href === "#signout") {
      signOut({ callbackUrl: "/auth/signin" });
    }
  };

  return (
    <div>
      <Header>
        <Link
          href="/profile"
          className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mr-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Profile
        </Link>
      </Header>

      <div className="max-w-lg mx-auto px-4 py-6 lg:px-6 space-y-6">
        <h1 className="text-xl font-serif font-bold text-ink-900">Settings</h1>

        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h2>
            <div className="card divide-y divide-ink-50">
              {section.items.map((item, index) => (
                <div key={item.label}>
                  {item.type === "link" ? (
                    <button
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 hover:bg-ink-50/50 transition-colors text-left",
                        item.danger && "text-red-600"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          item.danger ? "text-red-400" : "text-ink-400"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            item.danger ? "text-red-600" : "text-ink-800"
                          )}
                        >
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-xs text-ink-400 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-300 flex-shrink-0" />
                    </button>
                  ) : item.type === "toggle" ? (
                    <div className="flex items-center gap-3 p-4">
                      <item.icon className="w-5 h-5 text-ink-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-800">
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-xs text-ink-400 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          handleToggle(section.title, index)
                        }
                        className={cn(
                          "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                          item.value ? "bg-sage-600" : "bg-ink-200"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
                            item.value && "translate-x-5"
                          )}
                        />
                      </button>
                    </div>
                  ) : item.type === "select" ? (
                    <div className="flex items-center gap-3 p-4">
                      <item.icon className="w-5 h-5 text-ink-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-800">
                          {item.label}
                        </p>
                      </div>
                      <div className="relative">
                        <select
                          value={item.value as string}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="appearance-none text-sm text-ink-600 bg-transparent pr-6 py-1 cursor-pointer focus:outline-none"
                        >
                          {item.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 pointer-events-none" />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-ink-300 pb-4">
          BookWork v0.1.0
        </p>
      </div>
    </div>
  );
}

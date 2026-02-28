"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import {
  Crown,
  Check,
  Zap,
  Heart,
  Users,
  Eye,
  Palette,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PREMIUM_FEATURES } from "@/lib/stripe";
import Link from "next/link";

type Plan = "monthly" | "yearly";

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setIsLoading(false);
    }
  };

  const featureIcons = [Zap, Users, Sparkles, Eye, Heart, Crown, Palette, Sparkles];

  return (
    <div>
      <Header>
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mr-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </Header>

      <div className="max-w-lg mx-auto px-4 py-8 lg:px-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 mb-4">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink-900 mb-2">
            BookWrm Premium
          </h1>
          <p className="text-sm text-ink-500 max-w-sm mx-auto leading-relaxed">
            Unlimited connections. Unlimited spaces. No limits on your reading journey.
          </p>
        </div>

        {/* Plan toggle */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={cn(
              "flex-1 p-4 rounded-xl border-2 transition-all text-left",
              selectedPlan === "monthly"
                ? "border-sage-500 bg-sage-50"
                : "border-ink-100 hover:border-ink-200"
            )}
          >
            <div className="text-sm font-medium text-ink-900">Monthly</div>
            <div className="text-2xl font-bold text-ink-900 mt-1">
              $7.99
              <span className="text-sm font-normal text-ink-400">/mo</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedPlan("yearly")}
            className={cn(
              "flex-1 p-4 rounded-xl border-2 transition-all text-left relative",
              selectedPlan === "yearly"
                ? "border-sage-500 bg-sage-50"
                : "border-ink-100 hover:border-ink-200"
            )}
          >
            <span className="absolute -top-2.5 right-3 badge badge-premium text-[10px]">
              Save 37%
            </span>
            <div className="text-sm font-medium text-ink-900">Yearly</div>
            <div className="text-2xl font-bold text-ink-900 mt-1">
              $59.99
              <span className="text-sm font-normal text-ink-400">/yr</span>
            </div>
            <div className="text-xs text-ink-400 mt-0.5">$5.00/month</div>
          </button>
        </div>

        {/* Subscribe button */}
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          ) : (
            `Subscribe — ${selectedPlan === "monthly" ? "$7.99/month" : "$59.99/year"}`
          )}
        </button>

        <p className="text-[10px] text-ink-300 text-center mt-2">
          Cancel anytime. No commitment required.
        </p>

        {/* Features */}
        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold text-ink-800">
            Everything in Premium
          </h2>
          {PREMIUM_FEATURES.map((feature, i) => {
            const Icon = featureIcons[i] || Check;
            return (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm text-ink-700">{feature}</span>
              </div>
            );
          })}
        </div>

        {/* Comparison */}
        <div className="mt-10 card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="text-left p-3 font-medium text-ink-500">Feature</th>
                <th className="text-center p-3 font-medium text-ink-500">Free</th>
                <th className="text-center p-3 font-medium text-amber-600 bg-amber-50/50">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Daily matches", "5", "Unlimited"],
                ["Create spaces", "2", "Unlimited"],
                ["Join spaces", "Unlimited", "Unlimited"],
                ["See who liked you", "—", "Yes"],
                ["Advanced filters", "—", "Yes"],
                ["Ad-free", "—", "Yes"],
              ].map(([feature, free, premium]) => (
                <tr key={feature} className="border-b border-ink-50">
                  <td className="p-3 text-ink-600">{feature}</td>
                  <td className="p-3 text-center text-ink-400">{free}</td>
                  <td className="p-3 text-center font-medium text-sage-700 bg-amber-50/30">
                    {premium}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

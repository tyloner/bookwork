"use client";

import { Crown, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function PremiumSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 mb-6">
          <Crown className="w-10 h-10 text-amber-600" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-semibold text-amber-600 uppercase tracking-wider">
            Welcome to Premium
          </span>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>

        <h1 className="text-2xl font-serif font-bold text-ink-900 mb-3">
          You&apos;re all set!
        </h1>
        <p className="text-sm text-ink-500 leading-relaxed mb-8">
          Your account has been upgraded. Enjoy unlimited matches, unlimited
          spaces, and all Premium features. Happy reading!
        </p>

        <div className="space-y-3">
          <Link href="/matches" className="btn-primary w-full gap-2">
            Start matching
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/" className="btn-ghost w-full text-sm">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

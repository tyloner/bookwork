"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success to prevent email enumeration
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        <div className="card p-8">
          <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-sage-600" />
          </div>

          {sent ? (
            <>
              <h1 className="text-xl font-serif font-bold text-ink-900 mb-2">Check your email</h1>
              <p className="text-sm text-ink-500 leading-relaxed">
                If an account exists for <strong>{email}</strong>, we&apos;ve sent a password
                reset link. It expires in 1 hour.
              </p>
              <p className="text-xs text-ink-400 mt-4">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-sage-600 hover:underline"
                >
                  try again
                </button>
                .
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-serif font-bold text-ink-900 mb-1">Forgot password?</h1>
              <p className="text-sm text-ink-400 mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-600 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

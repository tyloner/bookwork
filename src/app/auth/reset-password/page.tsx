"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/auth/signin"), 2500);
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-ink-500">Invalid or missing reset link.</p>
        <Link href="/auth/forgot-password" className="text-sm text-sage-600 hover:underline mt-3 block">
          Request a new one
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center mb-4">
        <KeyRound className="w-5 h-5 text-sage-600" />
      </div>

      {done ? (
        <>
          <h1 className="text-xl font-serif font-bold text-ink-900 mb-2">Password updated!</h1>
          <p className="text-sm text-ink-500">Redirecting you to sign in…</p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-serif font-bold text-ink-900 mb-1">Set new password</h1>
          <p className="text-sm text-ink-400 mb-6">Must be at least 8 characters.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Confirm password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                "Update password"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<div className="card p-8 text-center text-sm text-ink-400">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Calculates the number of full days from today until a target date.
 *
 * @param target - The future date to count down to.
 * @returns Number of days remaining, or 0 if the date has passed.
 */
function daysUntil(target: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((t.getTime() - today.getTime()) / 86_400_000));
}

/**
 * Profile page for the authenticated user.
 * Shows current date, account email, a password-change form,
 * and a countdown to the next new year.
 */
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [viewedContentCount, setViewedContentCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) {
        router.replace("/login?next=/profile");
      } else {
        setUser(u);
        fetch("/api/profile/stats")
          .then((r) => r.json())
          .then((data) => setViewedContentCount(data.viewedContentCount ?? 0))
          .catch(() => setViewedContentCount(0));
      }
      setLoading(false);
    });
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Password updated successfully.");
      setNewPassword("");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="min-h-[calc(100vh-3.5rem)]" />;
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        Your Profile
      </h1>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm mb-6">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
          Heute
        </p>
        <p className="text-zinc-900 dark:text-zinc-100 font-medium">
          {new Date().toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm mb-6">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
          Days until new year
        </p>
        <p className="text-zinc-900 dark:text-zinc-100 font-medium">
          {daysUntil(new Date(new Date().getFullYear() + 1, 0, 1))} days
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm mb-6">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
          Email
        </p>
        <p className="text-zinc-900 dark:text-zinc-100 font-medium">{user?.email}</p>
      </div>

      <div
        data-testid="viewed-content-count"
        className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm mb-6"
      >
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
          Content Viewed
        </p>
        <p className="text-zinc-900 dark:text-zinc-100 font-medium">
          {viewedContentCount === null ? "—" : viewedContentCount} items
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min. 6 characters)"
            minLength={6}
            required
            autoComplete="new-password"
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={saving || !newPassword}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? "Saving…" : "Update Password"}
          </button>
          {message && (
            <p
              className={`text-sm ${
                message.startsWith("Error")
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

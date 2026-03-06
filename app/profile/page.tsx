"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const PREMIUM_MODEL_KEY = "contexta:premium_model";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [premiumModel, setPremiumModel] = useState(false);
  const [savingPremium, setSavingPremium] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) {
        router.replace("/login?next=/profile");
        setLoading(false);
        return;
      }
      setUser(u);
      const { data } = await supabase
        .from("profiles")
        .select("use_premium_model")
        .eq("id", u.id)
        .single();
      const value = (data as { use_premium_model?: boolean } | null)?.use_premium_model ?? false;
      setPremiumModel(value);
      localStorage.setItem(PREMIUM_MODEL_KEY, String(value));
      setLoading(false);
    });
  }, [router]);

  const handleTogglePremium = async (next: boolean) => {
    if (!user) return;
    setSavingPremium(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ use_premium_model: next })
      .eq("id", user.id);
    setPremiumModel(next);
    localStorage.setItem(PREMIUM_MODEL_KEY, String(next));
    setSavingPremium(false);
  };

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
          Email
        </p>
        <p className="text-zinc-900 dark:text-zinc-100 font-medium">{user?.email}</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Premium model
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Use a higher-quality AI model for recommendations.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={premiumModel}
            disabled={savingPremium}
            onClick={() => handleTogglePremium(!premiumModel)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
              premiumModel ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                premiumModel ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
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

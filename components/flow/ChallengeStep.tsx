"use client";

import { useState } from "react";
import { ChevronLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { DOMAINS, DOMAIN_LABELS } from "@/lib/constants";
import type { ContextData } from "@/components/flow/ContextStep";

export function ChallengeStep({
  contextData,
  onSubmit,
  loading,
  error,
  onBack,
  initialDescription,
  initialDomains,
}: {
  contextData?: ContextData | null;
  onSubmit: (body: {
    raw_description: string;
    domains: string[];
  }) => void;
  loading: boolean;
  error: string | null;
  onBack?: () => void;
  initialDescription?: string;
  initialDomains?: string[];
}) {
  const [rawDescription, setRawDescription] = useState(initialDescription ?? "");
  const [domains, setDomains] = useState<string[]>(initialDomains ?? []);

  const toggleDomain = (d: string) => {
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const canSubmit =
    rawDescription.trim().length >= 10 && domains.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    onSubmit({
      raw_description: rawDescription.trim(),
      domains,
    });
  };

  // suppress unused variable warning
  void contextData;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-8">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-sm text-zinc-500 hover:text-indigo-600 mb-6"
          >
            <ChevronLeft size={16} /> Back to context
          </button>
        )}
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Describe your challenge</h2>
        <p className="text-zinc-500 dark:text-zinc-400">What is currently blocking you or your team?</p>
      </div>

      <div>
        <label className="block text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
          Challenge description *
        </label>
        <div className="relative">
          <textarea
            value={rawDescription}
            onChange={(e) => setRawDescription(e.target.value)}
            placeholder="e.g. We have too many ideas and no clear way to prioritize. Stakeholders push for their features and we end up spreading ourselves thin."
            rows={4}
            maxLength={500}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
            minLength={10}
          />
          <span className="absolute bottom-2 right-3 text-xs text-zinc-400 dark:text-zinc-500">
            {rawDescription.length} / 500
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
          Domain(s) *{" "}
          <span className="text-zinc-400 font-normal normal-case tracking-normal">(select one or more)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDomain(d)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition flex items-center gap-1.5 ${
                domains.includes(d)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-500"
              }`}
            >
              {domains.includes(d) && <CheckCircle2 size={14} />}
              {DOMAIN_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex gap-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg h-fit">
          <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Contexta Tip</p>
          <p className="text-sm text-indigo-700/80 dark:text-indigo-300">Try mentioning specific outcomes you&apos;re looking for, like &quot;higher velocity&quot; or &quot;better stakeholder alignment&quot;.</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full rounded-lg bg-indigo-600 text-white py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Getting recommendations…
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Get recommendations
          </>
        )}
      </button>
    </form>
  );
}

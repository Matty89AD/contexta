"use client";

import { useState } from "react";
import { DOMAINS, DOMAIN_LABELS } from "@/lib/constants";

export function ChallengeStep({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (body: {
    raw_description: string;
    domain: string;
    subdomain?: string;
    impact_reach?: string;
  }) => void;
  loading: boolean;
  error: string | null;
}) {
  const [rawDescription, setRawDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [impactReach, setImpactReach] = useState("");

  const canSubmit =
    rawDescription.trim().length >= 10 && domain;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    onSubmit({
      raw_description: rawDescription.trim(),
      domain,
      subdomain: subdomain.trim() || undefined,
      impact_reach: impactReach.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-zinc-600">
        Describe your product or leadership challenge in a few sentences. What’s
        blocking you or your team?
      </p>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Challenge description *
        </label>
        <textarea
          value={rawDescription}
          onChange={(e) => setRawDescription(e.target.value)}
          placeholder="e.g. We have too many ideas and no clear way to prioritize. Stakeholders push for their features and we end up spreading ourselves thin."
          rows={4}
          className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          required
          minLength={10}
        />
        <p className="text-xs text-zinc-500 mt-1">At least 10 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Domain *
        </label>
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomain(d)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                domain === d
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300"
              }`}
            >
              {DOMAIN_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Subdomain (optional)
        </label>
        <input
          type="text"
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value)}
          placeholder="e.g. roadmap, OKRs"
          className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Impact & reach (optional)
        </label>
        <input
          type="text"
          value={impactReach}
          onChange={(e) => setImpactReach(e.target.value)}
          placeholder="Who is affected? What’s at stake?"
          className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full rounded-lg bg-zinc-900 text-white py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition"
      >
        {loading ? "Getting recommendations…" : "Get recommendations"}
      </button>
    </form>
  );
}

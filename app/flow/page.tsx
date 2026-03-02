"use client";

import { useState, useCallback } from "react";
import { ContextStep } from "@/components/flow/ContextStep";
import { ChallengeStep } from "@/components/flow/ChallengeStep";
import { ResultsStep } from "@/components/flow/ResultsStep";
import type { ContextData } from "@/components/flow/ContextStep";
import type { ChallengeResult } from "@/services/challenge";

type Step = "context" | "challenge" | "results";

export default function FlowPage() {
  const [step, setStep] = useState<Step>("context");
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContextComplete = useCallback((data: ContextData) => {
    setContextData(data);
    setStep("challenge");
  }, []);

  const onSubmitChallenge = useCallback(
    async (body: {
      raw_description: string;
      domain: string;
      subdomain?: string;
      impact_reach?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/challenges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong");
          return;
        }
        setResult(data);
        setStep("results");
      } catch (e) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-sm text-zinc-500">
            Step {step === "context" ? 1 : step === "challenge" ? 2 : 3} of 3
          </p>
          <h1 className="text-2xl font-semibold mt-1">
            {step === "context" && "Your context"}
            {step === "challenge" && "Describe your challenge"}
            {step === "results" && "Recommendations"}
          </h1>
        </div>

        {step === "context" && (
          <ContextStep onComplete={onContextComplete} />
        )}

        {step === "challenge" && (
          <ChallengeStep
            onSubmit={onSubmitChallenge}
            loading={loading}
            error={error}
          />
        )}

        {step === "results" && result && (
          <ResultsStep result={result} />
        )}
      </div>
    </main>
  );
}

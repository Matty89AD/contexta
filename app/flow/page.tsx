"use client";

import { useState, useCallback, useEffect } from "react";
import { ContextStep } from "@/components/flow/ContextStep";
import { ChallengeStep } from "@/components/flow/ChallengeStep";
import { ResultsStep } from "@/components/flow/ResultsStep";
import type { ContextData } from "@/components/flow/ContextStep";
import type { ChallengeResult } from "@/services/challenge";
import { FLOW_CONTEXT_STORAGE_KEY } from "@/lib/constants";

type Step = "context" | "challenge" | "results";

function logEvent(event: string, properties?: Record<string, unknown>) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {});
}

export default function FlowPage() {
  const [step, setStep] = useState<Step>("context");
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [initialContextFromStorage, setInitialContextFromStorage] =
    useState<ContextData | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FLOW_CONTEXT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (
          parsed &&
          typeof parsed === "object" &&
          "role" in parsed &&
          "company_stage" in parsed &&
          "team_size" in parsed &&
          "experience_level" in parsed
        ) {
          setInitialContextFromStorage(parsed as ContextData);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (step === "context") logEvent("context_step_started");
  }, [step]);

  const onContextComplete = useCallback((data: ContextData) => {
    try {
      localStorage.setItem(FLOW_CONTEXT_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
    logEvent("context_completed", {
      role: data.role,
      company_stage: data.company_stage,
      team_size: data.team_size,
      experience_level: data.experience_level,
    });
    logEvent("challenge_input_transition");
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
          body: JSON.stringify({
            ...body,
            context: contextData ?? undefined,
          }),
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
    [contextData]
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
          <ContextStep
            key={initialContextFromStorage ? "restored" : "new"}
            initialData={initialContextFromStorage}
            onComplete={onContextComplete}
          />
        )}

        {step === "challenge" && (
          <ChallengeStep
            contextData={contextData}
            onSubmit={onSubmitChallenge}
            loading={loading}
            error={error}
            onBack={() => setStep("context")}
          />
        )}

        {step === "results" && result && (
          <ResultsStep
            result={result}
            onBack={() => setStep("challenge")}
          />
        )}
      </div>
    </main>
  );
}

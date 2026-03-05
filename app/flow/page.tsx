"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { key: "context" as Step, label: "Context" },
    { key: "challenge" as Step, label: "Challenge" },
    { key: "results" as Step, label: "Recommendations" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-start justify-center mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-start">
          <div className="flex flex-col items-center w-24">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${
                i <= currentIndex
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {i < currentIndex ? "✓" : i + 1}
            </div>
            <span className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 text-center leading-tight px-1">
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-8 mt-4 flex-shrink-0 ${
                i < currentIndex ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FlowContent() {
  const searchParams = useSearchParams();
  const prefillDescription = searchParams?.get("description") ?? "";
  const prefillDomains =
    searchParams
      ?.get("domains")
      ?.split(",")
      .filter(Boolean) ?? [];

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
          const ctx = parsed as ContextData;
          setInitialContextFromStorage(ctx);
          if (prefillDescription) {
            // Skip context step — saved context + prefill description available
            setContextData(ctx);
            setStep("challenge");
          }
        }
      }
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      domains: string[];
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
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [contextData]
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <StepIndicator step={step} />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold dark:text-zinc-100">
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
            initialDescription={prefillDescription || undefined}
            initialDomains={prefillDomains.length > 0 ? prefillDomains : undefined}
          />
        )}

        {step === "results" && result && (
          <ResultsStep
            result={result}
            onBack={() => setStep("challenge")}
          />
        )}
      </div>
    </div>
  );
}

export default function FlowPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-3.5rem)]" />}>
      <FlowContent />
    </Suspense>
  );
}

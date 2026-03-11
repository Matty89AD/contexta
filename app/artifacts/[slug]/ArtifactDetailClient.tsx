"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Info } from "lucide-react";
import type { Artifact } from "@/lib/db/types";
import type { ContentView } from "@/lib/db/types";
import type { ArtifactDetailOutput, KnowledgeCard } from "@/services/artifact-detail";
import { DOMAIN_LABELS, SOURCE_TYPE_LABELS } from "@/lib/constants";
import { ContentOverlay } from "@/components/artifacts/ContentOverlay";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded ${className ?? ""}`}
    />
  );
}

function OverviewTab({ detail }: { detail: ArtifactDetailOutput }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          About this Artifact
        </h3>
        <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
          {detail.description}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-widest mb-2">
            Best For
          </h4>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{detail.company_stage}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-widest mb-2">
            Thought Leaders
          </h4>
          <ul className="space-y-1">
            {detail.thought_leaders.map((name) => (
              <li key={name} className="text-sm text-zinc-700 dark:text-zinc-300">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function HowToTab({ detail }: { detail: ArtifactDetailOutput }) {
  return (
    <div className="space-y-6">
      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
        {detail.how_to_intro}
      </p>
      <ol className="space-y-4">
        {detail.how_to_steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              {i + 1}
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">
                {step.step_title}
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {step.step_detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-4 w-32" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-3/4" />
      <div className="grid grid-cols-2 gap-4 mt-6">
        <SkeletonBlock className="h-24 rounded-xl" />
        <SkeletonBlock className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

function KnowledgeSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-hidden px-4 pt-3 pb-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 w-56 h-36 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-2xl"
        />
      ))}
    </div>
  );
}

function KnowledgeCarousel({
  cards,
  viewMap,
  onCardClick,
}: {
  cards: KnowledgeCard[];
  viewMap: Map<string, ContentView>;
  onCardClick: (card: KnowledgeCard) => void;
}) {
  if (cards.length === 0) {
    return (
      <p className="text-zinc-400 text-sm">
        No knowledge base entries found for this artifact.
      </p>
    );
  }
  return (
    <div className="flex gap-4 overflow-x-auto px-4 pt-3 pb-6">
      {cards.map((card) => {
        const view = viewMap.get(card.id) ?? null;
        const isViewed = view !== null;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onCardClick(card)}
            data-testid={`knowledge-card-${card.id}`}
            className="flex-shrink-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-left cursor-pointer hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700 transition relative group"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                {SOURCE_TYPE_LABELS[card.source_type] ?? card.source_type}
              </span>
              <Info
                size={12}
                className="text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-400 transition"
              />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-2">
              {card.title}
            </h4>
            {card.author && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{card.author}</p>
            )}
            {isViewed && (
              <div className="flex items-center gap-1 mt-auto" data-testid={`viewed-badge-${card.id}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Viewed</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ArtifactDetailClient({
  artifact,
  challengeId,
  challengeSummary,
  challengeDomains,
}: {
  artifact: Artifact;
  challengeId?: string;
  challengeSummary?: string;
  challengeDomains?: string[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "how-to">("overview");
  const [detail, setDetail] = useState<ArtifactDetailOutput | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  // pro_tip is separate: null = loading (only when challengeSummary present), undefined = not applicable
  const [proTip, setProTip] = useState<string | null | undefined>(
    challengeSummary ? null : undefined
  );
  const [cards, setCards] = useState<KnowledgeCard[] | null>(null);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [viewMap, setViewMap] = useState<Map<string, ContentView>>(new Map());
  const [overlayCard, setOverlayCard] = useState<KnowledgeCard | null>(null);

  useEffect(() => {
    // 1. Static detail — fast DB read
    fetch(`/api/artifacts/${artifact.slug}/detail`)
      .then((r) => r.json())
      .then((data: ArtifactDetailOutput & { error?: string }) => {
        if (data.error) setDetailError(data.error);
        else setDetail(data);
      })
      .catch(() => setDetailError("Failed to load artifact detail."))
      .finally(() => setDetailLoading(false));

    // 2. Personalised pro_tip — separate LLM call, only when challenge context exists.
    // Uses challengeId so the server fetches the summary from DB (prevents prompt injection).
    if (challengeId) {
      fetch(`/api/artifacts/${artifact.slug}/pro-tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      })
        .then((r) => r.json())
        .then((data: { pro_tip?: string | null }) => setProTip(data.pro_tip ?? undefined))
        .catch(() => setProTip(undefined));
    }

    // 3. Knowledge cards — parallel vector search, then hydrate view status
    fetch(`/api/artifacts/${artifact.slug}/knowledge`)
      .then((r) => r.json())
      .then(async (data: { cards?: KnowledgeCard[] }) => {
        const fetchedCards = data.cards ?? [];
        setCards(fetchedCards);
        // Batch-fetch view status for all cards (auth only; 401 = unauthenticated → skip)
        if (fetchedCards.length > 0) {
          const results = await Promise.allSettled(
            fetchedCards.map((card) =>
              fetch(`/api/content/${card.id}/view`).then((r) => {
                if (r.status === 401) return null;
                return r.json() as Promise<{
                  viewed: boolean;
                  first_viewed_at: string | null;
                  last_viewed_at: string | null;
                  view_count: number | null;
                }>;
              })
            )
          );
          const map = new Map<string, ContentView>();
          results.forEach((result, i) => {
            if (result.status === "fulfilled" && result.value?.viewed) {
              const v = result.value;
              map.set(fetchedCards[i].id, {
                id: "",
                user_id: "",
                content_id: fetchedCards[i].id,
                first_viewed_at: v.first_viewed_at!,
                last_viewed_at: v.last_viewed_at!,
                view_count: v.view_count!,
              });
            }
          });
          setViewMap(map);
        }
      })
      .catch(() => setCards([]))
      .finally(() => setCardsLoading(false));

    // 4. Check saved state (unauthenticated → leave null = disabled)
    fetch(`/api/artifacts/${artifact.slug}/save`)
      .then((r) => {
        if (r.status === 401) return null;
        return r.json() as Promise<{ saved: boolean }>;
      })
      .then((data) => {
        if (data !== null) setSaved(data.saved);
      })
      .catch(() => {
        // Non-fatal; leave button disabled
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggleSave() {
    if (saved === null || saveLoading) return;
    setSaveLoading(true);
    try {
      const method = saved ? "DELETE" : "POST";
      const res = await fetch(`/api/artifacts/${artifact.slug}/save`, { method });
      if (res.ok) {
        const data = (await res.json()) as { saved: boolean };
        setSaved(data.saved);
      }
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleCardClick(card: KnowledgeCard) {
    setOverlayCard(card);
    // Record view (auth only — silent fail on 401)
    try {
      const res = await fetch(`/api/content/${card.id}/view`, { method: "POST" });
      if (res.ok) {
        // Refresh view status for this card
        const viewRes = await fetch(`/api/content/${card.id}/view`);
        if (viewRes.ok) {
          const v = (await viewRes.json()) as {
            viewed: boolean;
            first_viewed_at: string | null;
            last_viewed_at: string | null;
            view_count: number | null;
          };
          if (v.viewed) {
            setViewMap((prev) => {
              const next = new Map(prev);
              next.set(card.id, {
                id: "",
                user_id: "",
                content_id: card.id,
                first_viewed_at: v.first_viewed_at!,
                last_viewed_at: v.last_viewed_at!,
                view_count: v.view_count!,
              });
              return next;
            });
          }
        }
      }
    } catch {
      // Non-fatal
    }
  }

  // Merge: use personalised pro_tip once loaded, fall back to static detail's generic one
  const displayedProTip =
    proTip !== undefined ? proTip : detail?.pro_tip ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {overlayCard && (
        <ContentOverlay
          card={overlayCard}
          view={viewMap.get(overlayCard.id) ?? null}
          onClose={() => setOverlayCard(null)}
        />
      )}
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition mb-8"
        data-testid="back-button"
      >
        <ArrowLeft size={16} />
        Back to recommendations
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          {artifact.domains.map((d) => (
            <span
              key={d}
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
            >
              {DOMAIN_LABELS[d] ?? d}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-2">
          {artifact.title}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">{artifact.use_case}</p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main content — tabs */}
        <div className="lg:col-span-2">
          {/* Tab navigation */}
          <div className="flex border-b border-zinc-100 dark:border-zinc-800 mb-6">
            {(["overview", "how-to"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {tab === "overview" ? "Overview" : "How to Use"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
            {detailLoading ? (
              <DetailSkeleton />
            ) : detailError ? (
              <p className="text-red-500 text-sm">{detailError}</p>
            ) : detail ? (
              activeTab === "overview" ? (
                <OverviewTab detail={detail} />
              ) : (
                <HowToTab detail={detail} />
              )
            ) : null}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900">
              <h3 className="text-sm font-semibold text-indigo-200 uppercase tracking-widest mb-4">
                Contexta Pro Tip
              </h3>
              {displayedProTip === null ? (
                <div className="space-y-2">
                  <div className="animate-pulse h-4 w-full bg-white/20 rounded" />
                  <div className="animate-pulse h-4 w-full bg-white/20 rounded" />
                  <div className="animate-pulse h-4 w-2/3 bg-white/20 rounded" />
                </div>
              ) : displayedProTip ? (
                <p className="text-indigo-100 text-sm leading-relaxed">
                  {displayedProTip}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={saved === null || saveLoading}
              data-testid="save-artifact-button"
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                saved === null || saveLoading
                  ? "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 opacity-60 cursor-not-allowed"
                  : saved
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              <Bookmark size={16} className={saved ? "fill-current" : ""} />
              {saveLoading ? "Saving…" : saved ? "Saved to Vault" : "Add to Artifact Vault"}
            </button>
          </div>
        </div>
      </div>

      {/* Knowledge base section */}
      <div className="mt-10 mb-20">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Who talks about it
        </h2>
        {cardsLoading ? (
          <KnowledgeSkeleton />
        ) : (
          <KnowledgeCarousel
            cards={cards ?? []}
            viewMap={viewMap}
            onCardClick={handleCardClick}
          />
        )}
      </div>
    </div>
  );
}

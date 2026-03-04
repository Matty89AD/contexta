/**
 * Seed curated content and chunks with embeddings.
 * Run: npm run seed (or npx tsx scripts/seed-content.ts)
 * Requires: .env.local (or .env) with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { createOpenRouterProvider } from "../core/ai/openrouter-provider";
import { ingestContent } from "../services/ingest";
import type { ContentSourceType } from "../lib/db/types";
import type { ChallengeDomain } from "../lib/db/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
const ai = createOpenRouterProvider();

const SAMPLE_CONTENT: Array<{
  source_type: ContentSourceType;
  title: string;
  url?: string;
  primary_domain?: ChallengeDomain;
  chunks: string[];
}> = [
  {
    source_type: "article",
    title: "Prioritization frameworks for product teams",
    url: "https://example.com/prioritization",
    primary_domain: "strategy",
    chunks: [
      "Prioritization frameworks help product teams focus on the right work. This guide covers RICE, MoSCoW, and value vs effort. Use one framework consistently rather than mixing. Involve key stakeholders in scoring to build alignment. Revisit priorities at least weekly as context changes.",
      "RICE (Reach, Impact, Confidence, Effort) suits growth and impact-focused decisions. MoSCoW (Must, Should, Could, Won't) is useful for scope negotiation. Value vs effort 2x2 is quick for roadmap discussions. Choose based on your team size and decision speed.",
    ],
  },
  {
    source_type: "framework",
    title: "Discovery and outcome-based roadmaps",
    url: "https://example.com/discovery",
    primary_domain: "discovery",
    chunks: [
      "Outcome-based roadmaps focus on the result you want (e.g. increase activation) instead of a list of features. Define 2-3 outcomes per quarter. For each outcome, run small experiments (design, build, measure) rather than big launches. Keep the roadmap flexible: replace low-signal bets with new ideas.",
      "Discovery means learning before building. Use problem interviews, prototype tests, and data to reduce uncertainty. When evidence is weak, prefer fast experiments over long projects. Stakeholders often want certainty; show them how experiments reduce risk.",
    ],
  },
  {
    source_type: "podcast",
    title: "Leading without authority",
    url: "https://example.com/leadership",
    primary_domain: "leadership",
    chunks: [
      "Leading without authority starts with clarity: be clear on the problem, the success metric, and the plan. Share this in writing and in meetings so everyone can align. Align early with engineering, design, and stakeholders; don't wait until the end to get buy-in.",
      "Follow through on commitments. If you say you'll get feedback by Friday, do it. Trust grows when people see consistent delivery. When you can't commit, say so and propose an alternative. Avoid over-promising to please in the moment.",
    ],
  },
];

async function main() {
  console.log("Seeding content...");
  for (const item of SAMPLE_CONTENT) {
    const { contentId } = await ingestContent(supabase, ai, {
      source_type: item.source_type,
      title: item.title,
      url: item.url ?? null,
      primary_domain: item.primary_domain ?? null,
      chunks: item.chunks,
    });
    console.log("  Created:", item.title, "->", contentId);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

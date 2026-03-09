/**
 * News proposal service — Epic 19.
 * Auto-generates draft news_posts when content or artifacts go active.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/core/ai/types";
import { createNotification } from "@/repositories/admin-notifications";
import {
  buildNewsProposalPrompt,
  newsProposalOutputSchema,
} from "@/core/prompts/news-proposal";
import type { ContentSourceType } from "@/lib/db/types";
import { logger } from "@/core/logger";

export interface ProposalSource {
  type: "content" | "artifact";
  id: string;
  title: string;
  author?: string | null;
  source_type?: ContentSourceType;
  domains?: string[];
  use_case?: string;
  description?: string;
}

function mapSourceTypeToNewsType(
  itemType: "content" | "artifact",
  source_type?: ContentSourceType
): "podcast" | "artifact" | "article" {
  if (itemType === "artifact") return "artifact";
  if (source_type === "podcast") return "podcast";
  return "article";
}

export async function generateNewsProposal(
  source: ProposalSource,
  ai: AIProvider,
  supabase: SupabaseClient
): Promise<void> {
  const prompt = buildNewsProposalPrompt({
    itemType: source.type,
    title: source.title,
    author: source.author,
    domains: source.domains,
    use_case: source.use_case,
    description: source.description,
    source_type: source.source_type,
  });

  const raw = await ai.generateText(prompt, { jsonMode: true });

  let proposal;
  try {
    const parsed = JSON.parse(raw);
    const result = newsProposalOutputSchema.safeParse(parsed);
    if (!result.success) {
      logger.error("[news-proposal] Schema validation failed", {
        sourceId: source.id,
        error: result.error.message,
      });
      return;
    }
    proposal = result.data;
  } catch (e) {
    logger.error("[news-proposal] JSON parse failed", { sourceId: source.id, error: e });
    return;
  }

  // Override type to match source
  const resolvedType = mapSourceTypeToNewsType(source.type, source.source_type);

  const { data: newsRow, error } = await supabase
    .from("news_posts")
    .insert({
      type: resolvedType,
      title: proposal.title,
      description: proposal.description,
      published_date: proposal.published_date,
      status: "draft",
      sort_order: 0,
      is_ai_generated: true,
      source_type: source.type,
      source_id: source.id,
    })
    .select("id")
    .single();

  if (error) {
    logger.error("[news-proposal] Failed to insert news post", {
      sourceId: source.id,
      error: error.message,
    });
    return;
  }

  const newsPostId = newsRow.id as string;

  await createNotification(supabase, {
    type: "news_proposal_generated",
    title: `News draft ready: ${proposal.title}`,
    body: proposal.description,
    link_url: `/admin/news/${newsPostId}`,
  });

  logger.info("[news-proposal] Draft news post created", {
    sourceId: source.id,
    newsPostId,
    title: proposal.title,
  });
}

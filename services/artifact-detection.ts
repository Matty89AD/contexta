/**
 * Artifact detection service — Epic 19.
 * Scans content chunks for new PM artifacts/frameworks and inserts draft records.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/core/ai/types";
import { listChunksByContentId } from "@/repositories/content";
import {
  getArtifactTitlesAndSlugs,
  createArtifact,
} from "@/repositories/artifacts";
import { createNotification } from "@/repositories/admin-notifications";
import {
  buildArtifactDetectionPrompt,
  artifactDetectionOutputSchema,
  type DetectedArtifact,
} from "@/core/prompts/artifact-detection";
import { logger } from "@/core/logger";

export interface ArtifactDetectionResult {
  count: number;
}

export async function detectArtifactsFromContent(
  contentId: string,
  ai: AIProvider,
  supabase: SupabaseClient
): Promise<ArtifactDetectionResult> {
  // Load content metadata for context
  const { data: contentRow } = await supabase
    .from("content")
    .select("title, source_type")
    .eq("id", contentId)
    .single();

  const contentTitle = contentRow?.title ?? "Unknown";
  const contentSourceType = contentRow?.source_type ?? "unknown";

  // Load chunks
  const chunks = await listChunksByContentId(supabase, contentId);
  if (chunks.length === 0) {
    logger.info("[artifact-detection] No chunks found, skipping", { contentId });
    return { count: 0 };
  }

  // Concatenate chunk bodies (max ~12K chars)
  const chunkText = chunks
    .map((c) => c.body)
    .join("\n\n")
    .slice(0, 12000);

  // Load existing artifact titles/slugs for dedup
  const existing = await getArtifactTitlesAndSlugs(supabase);
  const existingTitles = existing.map((a) => a.title);
  const existingSlugs = new Set(existing.map((a) => a.slug));

  // Build prompt and call LLM
  const prompt = buildArtifactDetectionPrompt(
    contentTitle,
    contentSourceType,
    chunkText,
    existingTitles
  );

  const raw = await ai.generateText(prompt, { jsonMode: true });

  let detected: DetectedArtifact[];
  try {
    const parsed = JSON.parse(raw);
    const result = artifactDetectionOutputSchema.safeParse(parsed);
    if (!result.success) {
      logger.error("[artifact-detection] Schema validation failed", {
        contentId,
        error: result.error.message,
      });
      return { count: 0 };
    }
    detected = result.data.artifacts;
  } catch (e) {
    logger.error("[artifact-detection] JSON parse failed", { contentId, error: e });
    return { count: 0 };
  }

  logger.info("[artifact-detection] LLM returned artifacts", {
    contentId,
    count: detected.length,
  });

  let inserted = 0;
  for (const artifact of detected) {
    // Skip if slug already exists (dedup)
    if (existingSlugs.has(artifact.slug)) {
      logger.info("[artifact-detection] Skipping duplicate slug", { slug: artifact.slug });
      continue;
    }

    try {
      const detail: Record<string, unknown> = {
        description: artifact.description,
        how_to_intro: artifact.how_to_intro,
        how_to_steps: artifact.how_to_steps,
      };

      const created = await createArtifact(supabase, {
        slug: artifact.slug,
        title: artifact.title,
        domains: artifact.domains,
        use_case: artifact.use_case,
        detail,
        status: "draft",
        is_ai_generated: true,
        source_content_id: contentId,
        possible_duplicate_of: artifact.possible_duplicate_of ?? null,
      });

      // Notify admin
      await createNotification(supabase, {
        type: "artifact_detected",
        title: `New artifact detected: ${artifact.title}`,
        body: artifact.use_case,
        link_url: `/admin/artifacts/${created.id}`,
      });

      inserted++;
      logger.info("[artifact-detection] Inserted draft artifact", {
        slug: artifact.slug,
        title: artifact.title,
      });
    } catch (e) {
      // ON CONFLICT DO NOTHING pattern — skip if insert fails due to slug conflict
      logger.error("[artifact-detection] Failed to insert artifact (skipping)", {
        slug: artifact.slug,
        error: e,
      });
    }
  }

  logger.info("[artifact-detection] Detection complete", { contentId, inserted });
  return { count: inserted };
}

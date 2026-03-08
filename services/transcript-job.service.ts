/**
 * Transcript Job Service — orchestrates URL-to-transcript pipeline (Epic 17).
 * createJob() inserts the job and returns immediately; the caller schedules
 * processJob() via Next.js unstable_after() for post-response background work.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIProvider } from "@/core/ai/types";
import type { TranscriptJob, TranscriptJobUrlType } from "@/lib/db/types";
import * as jobRepo from "@/repositories/transcript-jobs.repository";
import { detectUrlType } from "@/lib/url-utils";
import { extractMetadata, extractRssFeed } from "@/services/url-metadata.service";
import { extractTranscript } from "@/services/transcript-extractor.service";
import { extractContentIntelligence } from "@/services/content-intelligence";
import { chunkTranscript } from "@/core/utils/chunking";
import { ValidationError, NotFoundError } from "@/core/errors";
import { logger } from "@/core/logger";

export interface CreateJobResult {
  jobId: string;
  urlType: TranscriptJobUrlType;
  feedEpisodes: Array<{
    title: string;
    description: string | null;
    pubDate: string | null;
    audioUrl: string | null;
    duration: string | null;
  }> | null;
}

/**
 * Validate URL, detect type, create job record.
 * Returns immediately — caller must call processJob(jobId) via after().
 */
export async function createJob(
  supabase: SupabaseClient,
  url: string,
  adminId: string
): Promise<CreateJobResult> {
  if (!url?.trim()) throw new ValidationError("URL is required");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    throw new ValidationError("Invalid URL");
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new ValidationError("Only http and https URLs are supported");
  }

  const urlType = detectUrlType(url.trim());

  // For RSS feeds, parse episodes before creating job so the client can pick one
  if (urlType === "podcast_rss") {
    const feedData = await extractRssFeed(url.trim());
    const job = await jobRepo.createTranscriptJob(supabase, {
      created_by: adminId,
      url: url.trim(),
      url_type: urlType,
    });
    return {
      jobId: job.id,
      urlType,
      feedEpisodes: feedData.episodes,
    };
  }

  const job = await jobRepo.createTranscriptJob(supabase, {
    created_by: adminId,
    url: url.trim(),
    url_type: urlType,
  });

  return { jobId: job.id, urlType, feedEpisodes: null };
}

/**
 * Full pipeline: metadata → transcript → intelligence → create content → update job.
 * Runs in background via after(). Uses service-role client to bypass RLS.
 */
export async function processJob(
  supabase: SupabaseClient,
  ai: AIProvider,
  jobId: string
): Promise<void> {
  const job = await jobRepo.getTranscriptJobById(supabase, jobId);
  if (!job) {
    logger.error("processJob: job not found", { jobId });
    return;
  }

  logger.info("Transcript job starting", { jobId, url: job.url, urlType: job.url_type });

  // Mark as processing
  await jobRepo.updateTranscriptJobStatus(supabase, jobId, "processing");

  try {
    // 1. Extract metadata
    const meta = await extractMetadata(job.url, job.url_type);
    logger.info("Metadata extracted", { jobId, title: meta.title });

    // 2. Extract transcript
    const transcriptResult = await extractTranscript(job.url);
    const transcript = transcriptResult.transcript;
    if (!transcript?.trim()) {
      throw new Error("Transcript extraction returned empty content");
    }
    logger.info("Transcript extracted", { jobId, length: transcript.length });

    // 3. Determine content fields
    const title =
      meta.title ??
      transcriptResult.detectedTitle ??
      new URL(job.url).hostname;
    const author = meta.author ?? transcriptResult.detectedAuthor ?? null;
    const published_date = meta.published_date ?? null;
    const source_type = meta.source_type;

    // 4. Run intelligence extraction (non-fatal)
    const chunks = chunkTranscript(transcript);
    let topics: string[] = [];
    let keywords: string[] = [];
    let detectedAuthor: string | null = author;
    let detectedDate: string | null = published_date;
    let language = "en";
    let extractionConfidence: number | null = null;

    try {
      const intel = await extractContentIntelligence(ai, title, chunks, source_type);
      topics = intel.topics;
      keywords = intel.keywords;
      detectedAuthor = intel.author ?? author;
      detectedDate = intel.publication_date ?? published_date;
      language = intel.language;
      extractionConfidence = intel.extraction_confidence;
      logger.info("Intelligence extracted", { jobId, topics, confidence: extractionConfidence });
    } catch (e) {
      logger.error("Intelligence extraction failed (non-fatal)", { jobId, error: e });
    }

    // 5. Insert draft content record
    const { data: contentRow, error: insertError } = await supabase
      .from("content")
      .insert({
        source_type,
        title,
        url: job.url,
        domains: [],
        status: "draft",
        transcript_raw: transcript,
        topics,
        keywords,
        author: detectedAuthor,
        publication_date: detectedDate,
        language,
        extraction_confidence: extractionConfidence,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 6. Mark job as completed with content_id
    await jobRepo.updateTranscriptJobStatus(supabase, jobId, "completed", {
      content_id: contentRow.id,
    });

    logger.info("Transcript job completed", { jobId, contentId: contentRow.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error("Transcript job failed", { jobId, error: message });
    await jobRepo.updateTranscriptJobStatus(supabase, jobId, "failed", {
      error_message: message.slice(0, 1000),
    });
  }
}

export async function listJobs(
  supabase: SupabaseClient,
  adminId: string
): Promise<TranscriptJob[]> {
  return jobRepo.listTranscriptJobs(supabase, adminId);
}

export async function getJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<TranscriptJob> {
  const job = await jobRepo.getTranscriptJobById(supabase, jobId);
  if (!job) throw new NotFoundError(`Transcript job ${jobId} not found`);
  return job;
}

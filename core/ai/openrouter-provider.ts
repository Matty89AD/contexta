import OpenAI from "openai";
import type { AIProvider } from "./types";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/** Default chat model (OpenAI via OpenRouter); override with OPENROUTER_CHAT_MODEL. */
const DEFAULT_CHAT_MODEL = "openai/gpt-4o-mini";

/**
 * Default ingest model — large context window for full transcripts (Epic 17).
 * Override with OPENROUTER_INGEST_MODEL. Falls back to OPENROUTER_CHAT_MODEL if set.
 */
const DEFAULT_INGEST_MODEL = "google/gemini-2.0-flash";

/** Default embedding model (1536 dims, matches text-embedding-3-small); override with OPENROUTER_EMBEDDING_MODEL. */
const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";

/**
 * Ingest provider for background transcript jobs (Epic 17).
 * Uses OPENROUTER_INGEST_MODEL (defaults to google/gemini-2.0-flash)
 * which has a 1M token context window — suitable for long podcast transcripts.
 * All existing code continues to use createOpenRouterProvider().
 */
export function createOpenRouterIngestProvider(apiKey?: string): AIProvider {
  const key = apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is required for OpenRouter provider");
  }
  const openai = new OpenAI({
    apiKey: key,
    baseURL: OPENROUTER_BASE_URL,
  });
  const ingestModelRaw = (process.env.OPENROUTER_INGEST_MODEL ?? "").trim();
  const chatModelRaw = (process.env.OPENROUTER_CHAT_MODEL ?? "").trim();
  const ingestModel = ingestModelRaw || chatModelRaw || DEFAULT_INGEST_MODEL;
  const embeddingModelRaw = (process.env.OPENROUTER_EMBEDDING_MODEL ?? "").trim();
  const embeddingModel = embeddingModelRaw || DEFAULT_EMBEDDING_MODEL;

  return {
    async generateText(prompt, options) {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      messages.push({ role: "user", content: prompt });
      const completion = await openai.chat.completions.create({
        model: ingestModel,
        messages,
        response_format: options?.jsonMode ? { type: "json_object" } : undefined,
      });
      const content = completion.choices[0]?.message?.content;
      if (content == null) {
        throw new Error("OpenRouter returned empty content");
      }
      return content;
    },

    async generateEmbedding(text: string): Promise<number[]> {
      let res: Awaited<ReturnType<typeof openai.embeddings.create>>;
      try {
        res = await openai.embeddings.create({
          model: embeddingModel,
          input: text,
          // Explicitly request float format — prevents SDK from silently
          // returning a base64 string when OpenRouter returns base64 encoding
          encoding_format: "float",
        });
      } catch (apiErr) {
        console.error("[OpenRouter] Embedding API threw:", apiErr);
        throw new Error(
          `OpenRouter embedding API error (model: ${embeddingModel}): ${
            apiErr instanceof Error ? apiErr.message : String(apiErr)
          }`
        );
      }
      // OpenRouter occasionally returns HTTP 200 with {"error":{...}} instead
      // of throwing — detect this and surface the actual error message.
      const rawRes = res as unknown as Record<string, unknown>;
      if (rawRes.error) {
        const orErr = rawRes.error as Record<string, unknown>;
        throw new Error(
          `OpenRouter embeddings error: ${orErr.message ?? orErr.code ?? JSON.stringify(orErr)}`
        );
      }

      const item = res.data?.[0];
      const embedding = item?.embedding;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        console.error("[OpenRouter] Bad embedding response:", {
          model: embeddingModel,
          topLevelKeys: Object.keys(rawRes),
          dataLength: res.data?.length,
          itemKeys: item ? Object.keys(item) : undefined,
          embeddingType: typeof embedding,
        });
        throw new Error(
          `OpenRouter returned empty embedding (model: ${embeddingModel})`
        );
      }
      return embedding;
    },
  };
}

export function createOpenRouterProvider(apiKey?: string): AIProvider {
  const key = apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is required for OpenRouter provider");
  }
  const openai = new OpenAI({
    apiKey: key,
    baseURL: OPENROUTER_BASE_URL,
  });
  const chatModelRaw = (process.env.OPENROUTER_CHAT_MODEL ?? "").trim();
  const chatModel = chatModelRaw || DEFAULT_CHAT_MODEL;
  const embeddingModelRaw = (process.env.OPENROUTER_EMBEDDING_MODEL ?? "").trim();
  const embeddingModel = embeddingModelRaw || DEFAULT_EMBEDDING_MODEL;

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[OpenRouter] chat model:",
      chatModel,
      chatModelRaw ? "" : "(OPENROUTER_CHAT_MODEL not set in env, using default)"
    );
  }

  return {
    async generateText(prompt, options) {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      messages.push({ role: "user", content: prompt });
      const completion = await openai.chat.completions.create({
        model: chatModel,
        messages,
        response_format: options?.jsonMode ? { type: "json_object" } : undefined,
      });
      const content = completion.choices[0]?.message?.content;
      if (content == null) {
        throw new Error("OpenRouter returned empty content");
      }
      return content;
    },

    async generateEmbedding(text: string): Promise<number[]> {
      let res: Awaited<ReturnType<typeof openai.embeddings.create>>;
      try {
        res = await openai.embeddings.create({
          model: embeddingModel,
          input: text,
          // Explicitly request float format — prevents SDK from silently
          // returning a base64 string when OpenRouter returns base64 encoding
          encoding_format: "float",
        });
      } catch (apiErr) {
        console.error("[OpenRouter] Embedding API threw:", apiErr);
        throw new Error(
          `OpenRouter embedding API error (model: ${embeddingModel}): ${
            apiErr instanceof Error ? apiErr.message : String(apiErr)
          }`
        );
      }
      // OpenRouter returns HTTP 200 with {"error":{...}} instead of throwing
      const rawRes = res as unknown as Record<string, unknown>;
      if (rawRes.error) {
        const orErr = rawRes.error as Record<string, unknown>;
        throw new Error(
          `OpenRouter embeddings error: ${orErr.message ?? orErr.code ?? JSON.stringify(orErr)}`
        );
      }
      const item = res.data?.[0];
      const embedding = item?.embedding;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error(`OpenRouter returned empty embedding (model: ${embeddingModel})`);
      }
      return embedding;
    },
  };
}

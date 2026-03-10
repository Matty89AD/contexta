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

/**
 * Default embedding model (1536 dims, matches pgvector index).
 * When using OpenAI directly the "openai/" prefix is stripped automatically.
 * Override with OPENROUTER_EMBEDDING_MODEL.
 */
const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";

/**
 * Resolve the embedding client and model name.
 * Prefers direct OpenAI API (OPENAI_API_KEY) because OpenRouter's embedding
 * routing is unreliable ("No successful provider responses").
 * Falls back to OpenRouter if OPENAI_API_KEY is not set.
 */
function resolveEmbeddingClient(openrouterKey: string): {
  client: OpenAI;
  model: string;
} {
  const openaiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  const modelRaw = (process.env.OPENROUTER_EMBEDDING_MODEL ?? "").trim();
  const configuredModel = modelRaw || DEFAULT_EMBEDDING_MODEL;

  if (openaiKey) {
    // Direct OpenAI — strip the "openai/" provider prefix if present
    const model = configuredModel.replace(/^openai\//, "");
    return { client: new OpenAI({ apiKey: openaiKey }), model };
  }

  // Fall back to OpenRouter
  return {
    client: new OpenAI({ apiKey: openrouterKey, baseURL: OPENROUTER_BASE_URL }),
    model: configuredModel,
  };
}

/** Timeout in ms for chat completions (text generation). */
const CHAT_TIMEOUT_MS = 30_000;

/** Timeout in ms for embedding calls (faster, smaller payload). */
const EMBEDDING_TIMEOUT_MS = 20_000;

/** Shared embedding implementation used by both providers. */
async function callEmbeddingAPI(
  client: OpenAI,
  model: string,
  text: string
): Promise<number[]> {
  let res: Awaited<ReturnType<typeof client.embeddings.create>>;
  try {
    res = await client.embeddings.create(
      {
        model,
        input: text,
        encoding_format: "float",
      },
      { timeout: EMBEDDING_TIMEOUT_MS }
    );
  } catch (apiErr) {
    throw new Error(
      `Embedding API error (model: ${model}): ${
        apiErr instanceof Error ? apiErr.message : String(apiErr)
      }`
    );
  }
  // OpenRouter returns HTTP 200 with {"error":{...}} instead of throwing
  const rawRes = res as unknown as Record<string, unknown>;
  if (rawRes.error) {
    const orErr = rawRes.error as Record<string, unknown>;
    throw new Error(
      `Embedding API error (model: ${model}): ${
        orErr.message ?? orErr.code ?? JSON.stringify(orErr)
      }`
    );
  }
  const embedding = res.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error(`Embedding API returned empty embedding (model: ${model})`);
  }
  return embedding;
}

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
  const openai = new OpenAI({ apiKey: key, baseURL: OPENROUTER_BASE_URL });
  const ingestModelRaw = (process.env.OPENROUTER_INGEST_MODEL ?? "").trim();
  const chatModelRaw = (process.env.OPENROUTER_CHAT_MODEL ?? "").trim();
  const ingestModel = ingestModelRaw || chatModelRaw || DEFAULT_INGEST_MODEL;
  const { client: embeddingClient, model: embeddingModel } = resolveEmbeddingClient(key);

  return {
    async generateText(prompt, options) {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      messages.push({ role: "user", content: prompt });
      const completion = await openai.chat.completions.create(
        {
          model: ingestModel,
          messages,
          response_format: options?.jsonMode ? { type: "json_object" } : undefined,
        },
        { timeout: CHAT_TIMEOUT_MS }
      );
      const content = completion.choices[0]?.message?.content;
      if (content == null) throw new Error("OpenRouter returned empty content");
      return content;
    },

    async generateEmbedding(text: string): Promise<number[]> {
      return callEmbeddingAPI(embeddingClient, embeddingModel, text);
    },
  };
}

export function createOpenRouterProvider(apiKey?: string): AIProvider {
  const key = apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is required for OpenRouter provider");
  }
  const openai = new OpenAI({ apiKey: key, baseURL: OPENROUTER_BASE_URL });
  const chatModelRaw = (process.env.OPENROUTER_CHAT_MODEL ?? "").trim();
  const chatModel = chatModelRaw || DEFAULT_CHAT_MODEL;
  const { client: embeddingClient, model: embeddingModel } = resolveEmbeddingClient(key);

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[OpenRouter] chat model:",
      chatModel,
      chatModelRaw ? "" : "(OPENROUTER_CHAT_MODEL not set, using default)"
    );
    const usingOpenAIDirect = !!(process.env.OPENAI_API_KEY ?? "").trim();
    console.log(
      "[Embedding] model:",
      embeddingModel,
      usingOpenAIDirect ? "(via OpenAI direct)" : "(via OpenRouter)"
    );
  }

  return {
    async generateText(prompt, options) {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      messages.push({ role: "user", content: prompt });
      const completion = await openai.chat.completions.create(
        {
          model: chatModel,
          messages,
          response_format: options?.jsonMode ? { type: "json_object" } : undefined,
        },
        { timeout: CHAT_TIMEOUT_MS }
      );
      const content = completion.choices[0]?.message?.content;
      if (content == null) throw new Error("OpenRouter returned empty content");
      return content;
    },

    async generateEmbedding(text: string): Promise<number[]> {
      return callEmbeddingAPI(embeddingClient, embeddingModel, text);
    },
  };
}

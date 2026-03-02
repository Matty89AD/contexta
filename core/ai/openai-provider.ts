import OpenAI from "openai";
import type { AIProvider } from "./types";

const EMBEDDING_MODEL = "text-embedding-3-small";
const TEXT_MODEL = "gpt-4o-mini";

export function createOpenAIProvider(apiKey?: string): AIProvider {
  const key = apiKey ?? process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is required for OpenAIProvider");
  }
  const openai = new OpenAI({ apiKey: key });

  return {
    async generateText(prompt, options) {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      messages.push({ role: "user", content: prompt });
      const completion = await openai.chat.completions.create({
        model: TEXT_MODEL,
        messages,
        response_format: options?.jsonMode ? { type: "json_object" } : undefined,
      });
      const content = completion.choices[0]?.message?.content;
      if (content == null) {
        throw new Error("OpenAI returned empty content");
      }
      return content;
    },

    async generateEmbedding(text: string): Promise<number[]> {
      const res = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
      });
      const embedding = res.data[0]?.embedding;
      if (!embedding) {
        throw new Error("OpenAI returned empty embedding");
      }
      return embedding;
    },
  };
}

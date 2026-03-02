/**
 * AI provider interface. Business logic must depend only on this;
 * no direct OpenAI (or other provider) imports in services.
 */
export interface AIProvider {
  generateText(
    prompt: string,
    options?: { systemPrompt?: string; jsonMode?: boolean }
  ): Promise<string>;

  generateEmbedding(text: string): Promise<number[]>;
}

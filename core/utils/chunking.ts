const DEFAULT_CHUNK_SIZE = 1500;
const DEFAULT_MAX_CHUNK_CHARS = 8000;

/**
 * Chunk transcript text into segments of roughly targetChars characters,
 * split on paragraph boundaries, capped at maxChars per chunk.
 */
export function chunkTranscript(
  text: string,
  targetChars: number = DEFAULT_CHUNK_SIZE,
  maxChars: number = DEFAULT_MAX_CHUNK_CHARS
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return [normalized];

  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if (current.length + p.length + 2 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    if (current.length === 0) {
      current = p;
    } else {
      current += "\n\n" + p;
    }
    if (current.length >= targetChars) {
      chunks.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

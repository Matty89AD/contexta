const DEFAULT_CHUNK_SIZE = 1500;
const DEFAULT_MAX_CHUNK_CHARS = 8000;

/**
 * Split a single block of text at word boundaries into slices of at most
 * maxChars characters, targeting targetChars per slice.
 */
function splitByWords(text: string, targetChars: number, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? current + " " + word : word;
    if (next.length > maxChars && current) {
      chunks.push(current.trim());
      current = word;
    } else {
      current = next;
      if (current.length >= targetChars) {
        chunks.push(current.trim());
        current = "";
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Chunk transcript text into segments of roughly targetChars characters,
 * split on paragraph boundaries, capped at maxChars per chunk.
 * Falls back to word-boundary splitting for paragraphs that exceed maxChars
 * (e.g. caption-style transcripts with no blank lines).
 */
export function chunkTranscript(
  text: string,
  targetChars: number = DEFAULT_CHUNK_SIZE,
  maxChars: number = DEFAULT_MAX_CHUNK_CHARS
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Split on blank lines; fall back to single-newline splits when no blank
  // lines exist (e.g. raw caption transcripts from YouTube).
  let paragraphs = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 1 && paragraphs[0].length > maxChars) {
    // No paragraph breaks and text is too long — try single-newline split
    paragraphs = normalized
      .split(/\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    // If this paragraph alone exceeds maxChars, force-split it at word boundaries
    if (p.length > maxChars) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      chunks.push(...splitByWords(p, targetChars, maxChars));
      continue;
    }

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

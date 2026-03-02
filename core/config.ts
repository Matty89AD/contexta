function getTopK(): number {
  const raw = process.env.TOP_K;
  if (raw === undefined || raw === "") {
    throw new Error("TOP_K environment variable is required");
  }
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1 || n > 20) {
    throw new Error("TOP_K must be an integer between 1 and 20");
  }
  return n;
}

function getFloatEnv(name: string, defaultVal: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultVal;
  const n = parseFloat(raw);
  if (Number.isNaN(n) || n < min || n > max) return defaultVal;
  return n;
}

let cachedTopK: number | null = null;
let cachedWeights: { structuredFitWeight: number; embeddingSimilarityWeight: number } | null = null;

export function getConfig() {
  if (cachedTopK === null) {
    cachedTopK = getTopK();
  }
  if (cachedWeights === null) {
    const structured = getFloatEnv("STRUCTURED_FIT_WEIGHT", 0.3, 0, 1);
    const semantic = getFloatEnv("EMBEDDING_SIMILARITY_WEIGHT", 0.7, 0, 1);
    cachedWeights = {
      structuredFitWeight: structured,
      embeddingSimilarityWeight: semantic,
    };
  }
  return {
    TOP_K: cachedTopK,
    STRUCTURED_FIT_WEIGHT: cachedWeights.structuredFitWeight,
    EMBEDDING_SIMILARITY_WEIGHT: cachedWeights.embeddingSimilarityWeight,
  };
}

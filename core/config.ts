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

let cachedTopK: number | null = null;

export function getConfig() {
  if (cachedTopK === null) {
    cachedTopK = getTopK();
  }
  return { TOP_K: cachedTopK };
}

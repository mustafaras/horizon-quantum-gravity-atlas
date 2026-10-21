// Nearest-rank percentiles for the performance harness. Nearest-rank always
// returns an observed sample, so a reported p95 is a frame that really happened.

export function percentile(samples, p) {
  if (!Array.isArray(samples) || samples.length === 0) return null;
  if (!(p >= 0 && p <= 100)) throw new RangeError("percentile p must be within [0, 100]");
  const sorted = Float64Array.from(samples).sort();
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return sorted[rank - 1];
}

export function summarize(samples, digits = 2) {
  if (!Array.isArray(samples) || samples.length === 0) return null;
  const round = (value) => Number(value.toFixed(digits));
  return {
    n: samples.length,
    p50: round(percentile(samples, 50)),
    p95: round(percentile(samples, 95)),
    max: round(Math.max(...samples)),
  };
}

// Sampling helpers shared by the plot builders. Plot data come from the same pure functions the
// science modules export; nothing here changes a value.

/** n + 1 evenly spaced abscissae from a to b inclusive. */
export function grid(a, b, n) {
  const out = new Array(n + 1);
  for (let i = 0; i <= n; i++) out[i] = a + ((b - a) * i) / n;
  return out;
}

/** Evaluate fn over xs, keeping non-finite results as NaN gaps would break validation: callers clamp or filter. */
export const evaluate = (xs, fn) => xs.map((x) => fn(x));

/** Keep only the samples where every series is finite. */
export function finiteRows(xs, ...series) {
  const keep = xs.map((_, i) => Number.isFinite(xs[i]) && series.every((s) => Number.isFinite(s[i])));
  return [xs.filter((_, i) => keep[i]), ...series.map((s) => s.filter((_, i) => keep[i]))];
}

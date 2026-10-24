// Tick generation and number formatting for the Figure Kit.
// Linear axes use Heckbert nice numbers in a 1-2-5 sequence; log axes use decades with minor 2-9.

const SUPERSCRIPT = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const MINUS = "−";

export const superscript = (n) => String(n).replace(/[-0-9]/g, (c) => SUPERSCRIPT[c]);

function assertFinite(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new RangeError(`ticks: non-finite range [${a}, ${b}]`);
}

/** Heckbert's nice number: the 1, 2, 5 or 10 times a power of ten nearest (round) or just above (ceil) x. */
export function niceNumber(x, round) {
  const exp = Math.floor(Math.log10(x));
  const f = x / 10 ** exp;
  let nf;
  if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * 10 ** exp;
}

/** Decimal places needed to print multiples of `step` exactly. */
export function decimalsFor(step) {
  if (!(step > 0)) return 0;
  return Math.min(12, Math.max(0, -Math.floor(Math.log10(step) + 1e-9)));
}

/** Ticks inside [min, max] (either order) at a nice step; roughly `count` of them. */
export function linearTicks(min, max, count = 6) {
  assertFinite(min, max);
  if (min === max) return [min];
  const [lo, hi] = min < max ? [min, max] : [max, min];
  const step = niceNumber((hi - lo) / Math.max(1, count - 1), true);
  const dec = decimalsFor(step);
  const out = [];
  const first = Math.ceil(lo / step - 1e-9);
  const last = Math.floor(hi / step + 1e-9);
  for (let i = first; i <= last; i++) out.push(Number((i * step).toFixed(Math.min(15, dec + 1))));
  if (out.length === 1 && out[0] === 0) out[0] = 0; // normalise -0
  return min < max ? out : out.reverse();
}

/** Decade ticks; `minor` gives 2..9 times each decade inside the range. */
export function logTicks(min, max, count = 6, withMinor = false) {
  assertFinite(min, max);
  if (!(min > 0 && max > 0)) throw new RangeError(`ticks: log range must be positive, got [${min}, ${max}]`);
  const [lo, hi] = min < max ? [min, max] : [max, min];
  const e0 = Math.ceil(Math.log10(lo) - 1e-9), e1 = Math.floor(Math.log10(hi) + 1e-9);
  const decades = e1 - e0 + 1;
  const stride = decades > count * 1.6 ? Math.ceil(decades / count) : 1;
  const major = [];
  for (let e = e0; e <= e1; e += stride) major.push(10 ** e);
  if (!withMinor) return min < max ? major : major.reverse();
  return { major, minor: logMinorTicks(lo, hi) };
}

export function logMinorTicks(lo, hi) {
  const out = [];
  for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) {
    for (let m = 2; m <= 9; m++) {
      const v = m * 10 ** e;
      if (v >= lo * (1 - 1e-12) && v <= hi * (1 + 1e-12)) out.push(v);
    }
  }
  return out;
}

export function symlogTicks(min, max, count = 7, constant = 1) {
  assertFinite(min, max);
  const [lo, hi] = min < max ? [min, max] : [max, min];
  const out = new Set();
  if (lo <= 0 && hi >= 0) out.add(0);
  for (let e = Math.floor(Math.log10(constant)); 10 ** e <= Math.max(Math.abs(lo), Math.abs(hi)) * (1 + 1e-9); e++) {
    for (const s of [1, -1]) {
      const v = s * 10 ** e;
      if (v >= lo && v <= hi) out.add(v);
    }
  }
  let ticks = [...out].sort((a, b) => a - b);
  if (ticks.length > count + 2) ticks = ticks.filter((_, i) => i % Math.ceil(ticks.length / count) === 0);
  return min < max ? ticks : ticks.reverse();
}

/**
 * Format a tick value. Decades print as 10ⁿ; very large or small linear values print as m × 10ⁿ;
 * everything else uses the step's decimals. Minus signs are U+2212 so columns of digits align.
 */
export function formatTick(value, { step, decade = false } = {}) {
  if (!Number.isFinite(value)) throw new RangeError(`ticks: cannot format ${value}`);
  const neg = value < 0 ? MINUS : "";
  const a = Math.abs(value);
  if (a === 0) return "0";
  if (decade) {
    const e = Math.round(Math.log10(a));
    return e === 0 ? `${neg}1` : e === 1 ? `${neg}10` : `${neg}10${superscript(e)}`;
  }
  if (a >= 1e5 || a < 1e-3) {
    let e = Math.floor(Math.log10(a));
    let m = a / 10 ** e;
    if (Number(m.toPrecision(3)) >= 10) { m /= 10; e += 1; }
    const mant = Number(m.toPrecision(3)).toString();
    return mant === "1" ? `${neg}10${superscript(e)}` : `${neg}${mant}×10${superscript(e)}`;
  }
  const dec = step ? decimalsFor(step) : Math.min(6, Math.max(0, 3 - Math.ceil(Math.log10(a))));
  return neg + a.toFixed(dec);
}

/** Labels for a set of ticks with one consistent number of decimals. */
export function formatTicks(ticks, { decade = false } = {}) {
  if (ticks.length === 0) return [];
  let step = 0;
  if (ticks.length > 1) step = Math.min(...ticks.slice(1).map((t, i) => Math.abs(t - ticks[i])).filter((d) => d > 0));
  return ticks.map((t) => formatTick(t, { step: step || undefined, decade }));
}

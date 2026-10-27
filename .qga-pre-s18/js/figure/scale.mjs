// Scales for the Figure Kit: linear, log and symlog, each with domain, range, map, invert and ticks.
// Pure ES module (no DOM). NaN and infinite inputs are rejected at construction and map to NaN.

import { linearTicks, logTicks, symlogTicks } from "./ticks.mjs";

function finitePair(name, pair) {
  if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(Number.isFinite)) {
    throw new RangeError(`scale: ${name} must be two finite numbers, got ${JSON.stringify(pair)}`);
  }
  return [pair[0], pair[1]];
}

function build(type, domain, range, forward, backward, tickFn, extra = {}) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const f0 = forward(d0);
  const span = forward(d1) - f0;
  const unit = span === 0 ? 0 : 1 / span;
  const map = (v) => (Number.isFinite(v) ? r0 + (forward(v) - f0) * unit * (r1 - r0) : NaN);
  const invert = (p) => {
    if (!Number.isFinite(p) || r1 === r0) return NaN;
    return backward(f0 + ((p - r0) / (r1 - r0)) * span);
  };
  return Object.freeze({
    type, domain: Object.freeze([d0, d1]), range: Object.freeze([r0, r1]), map, invert,
    ticks: (count = 6) => tickFn(d0, d1, count),
    withRange: (next) => build(type, domain, next, forward, backward, tickFn, extra),
    withDomain: (next) => SCALE_FACTORIES[type](next, range, extra),
    ...extra,
  });
}

export function linear(domain = [0, 1], range = [0, 1]) {
  const d = finitePair("domain", domain);
  return build("linear", d, finitePair("range", range), (v) => v, (v) => v, linearTicks);
}

export function log(domain = [1, 10], range = [0, 1], base = 10) {
  const d = finitePair("domain", domain);
  if (!(d[0] > 0 && d[1] > 0)) throw new RangeError(`scale: log domain must be positive, got ${JSON.stringify(domain)}`);
  if (!(base > 1)) throw new RangeError("scale: log base must exceed 1");
  const lb = Math.log(base);
  return build("log", d, finitePair("range", range), (v) => (v > 0 ? Math.log(v) / lb : NaN), (v) => base ** v, logTicks, { base });
}

// Signed logarithm: linear within |x| < constant, logarithmic outside; monotone and odd.
export function symlog(domain = [-10, 10], range = [0, 1], constant = 1) {
  const d = finitePair("domain", domain);
  if (!(constant > 0)) throw new RangeError("scale: symlog constant must be positive");
  const forward = (v) => Math.sign(v) * Math.log1p(Math.abs(v) / constant);
  const backward = (v) => Math.sign(v) * constant * Math.expm1(Math.abs(v));
  return build("symlog", d, finitePair("range", range), forward, backward, (a, b, n) => symlogTicks(a, b, n, constant), { constant });
}

const SCALE_FACTORIES = { linear, log, symlog };

/** Construct from a plain description `{ type, domain, ... }`; used by the spec layer. */
export function makeScale({ type = "linear", domain, base, constant }, range = [0, 1]) {
  const factory = SCALE_FACTORIES[type];
  if (!factory) throw new RangeError(`scale: unknown type "${type}" (linear, log, symlog)`);
  return type === "log" ? log(domain, range, base) : type === "symlog" ? symlog(domain, range, constant) : linear(domain, range);
}

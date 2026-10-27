// Colour-vision-deficiency simulation (Machado, Oliveira & Fernandes 2009).
// Tables: ./cvd-data.mjs. Pure; imports in Node without DOM.

import { CVD_TABLES } from "./cvd-data.mjs";

export const CVD_TYPES = Object.freeze(["protan", "deutan", "tritan"]);

const ALIASES = Object.freeze({
  protan: "protan", protanopia: "protan", protanomaly: "protan",
  deutan: "deutan", deuteranopia: "deutan", deuteranomaly: "deutan",
  tritan: "tritan", tritanopia: "tritan", tritanomaly: "tritan",
});

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Simulate a colour-vision deficiency on a linear-sRGB triple.
 * `severity` in [0, 1] (1 = dichromacy). The paper tabulates 0.1 steps, so intermediate
 * severities interpolate linearly between the two neighbouring matrices.
 * Returns a new clamped linear-sRGB triple.
 */
export function simulateCvd(rgbLinear, type, severity = 1) {
  const key = ALIASES[String(type).toLowerCase()];
  if (!key) throw new RangeError(`simulateCvd: unknown deficiency "${type}" (use protan, deutan or tritan)`);
  if (!Number.isFinite(severity) || severity < 0 || severity > 1) {
    throw new RangeError(`simulateCvd: severity must be in [0, 1], got ${severity}`);
  }
  const tables = CVD_TABLES[key];
  const pos = severity * 10;
  const i = Math.min(9, Math.floor(pos + 1e-9));
  const f = pos - i;
  const lo = tables[i];
  const hi = tables[i + 1];
  const [r, g, b] = rgbLinear;
  const out = [0, 0, 0];
  for (let row = 0; row < 3; row++) {
    const m0 = lo[row];
    const m1 = hi[row];
    const a = m0[0] + (m1[0] - m0[0]) * f;
    const c = m0[1] + (m1[1] - m0[1]) * f;
    const d = m0[2] + (m1[2] - m0[2]) * f;
    out[row] = clamp01(a * r + c * g + d * b);
  }
  return out;
}

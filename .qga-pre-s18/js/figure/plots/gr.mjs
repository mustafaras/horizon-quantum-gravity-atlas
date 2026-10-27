// General-relativity plots: the effective potential of a selected orbit.

import { figure, axis, line, rule, points, callout } from "../spec.mjs";

/**
 * V_eff(r) for GR against Newtonian, with the energy line and turning points of a bound orbit.
 * The caller (VEffPanel) derives the window and samples; this only describes the figure.
 *   r, gr, newton     sample arrays (same length)
 *   rDomain, vDomain  axis windows
 *   marks             [{ r, tex, color }] radial reference lines (r_s, r_ph, r_ISCO) already inside rDomain
 *   energy            orbital energy E for a bound body, else null
 *   turning           [{ r, tex }] turning points inside rDomain
 *   view              "gr" | "newton": which branch is the focal one
 */
export function effectivePotentialSpec({ r, gr, newton, rDomain, vDomain, marks = [], energy = null, turning = [], view = "gr", height = 300 }) {
  const grFocal = view !== "newton";
  const out = [
    line({ x: r, y: newton, layer: "model", dash: "5 4", width: 1.2, color: "pigment-blue-52", focal: !grFocal, label: "Newtonian" }),
    line({ x: r, y: gr, layer: "model", width: 2.1, color: "pigment-violet-71", focal: grFocal, label: "GR" }),
  ];
  for (const m of marks) out.push(rule({ axis: "x", value: m.r, layer: "model", color: m.color, text: { tex: m.tex } }));
  if (energy !== null) {
    out.push(rule({ axis: "y", value: energy, layer: "model", color: "pigment-cyan-85", dash: "6 3", text: { tex: "E" }, label: "E, turning points" }));
    if (turning.length) {
      out.push(points({ x: turning.map((t) => t.r), y: turning.map(() => energy), layer: "model", color: "pigment-cyan-85", radius: 3 }));
      for (const t of turning) out.push(callout({ x: t.r, y: energy, layer: "model", color: "pigment-cyan-85", dx: 0, dy: 18, text: { tex: t.tex } }));
    }
  }
  return figure({
    id: "gr-effective-potential", title: "Effective potential V_eff(r), selected orbit", status: "effective",
    provenanceId: "gr-effective-potential", height,
    x: axis({ scale: { type: "linear", domain: rDomain }, label: { text: "r (scene units)" } }),
    y: axis({ scale: { type: "linear", domain: vDomain }, label: { tex: "V_{\\mathrm{eff}}" } }),
    marks: out,
    summary: "Schwarzschild effective potential for the selected body, general relativity against Newtonian, with photon-sphere and ISCO markers.",
  });
}

const circle = (r, n = 181) => {
  const x = [], y = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; x.push(r * Math.cos(a)); y.push(r * Math.sin(a)); }
  return { x, y };
};

/** Keep the part of a path inside |x|, |y| <= half (one point of margin each side), thinned to `minStep`. */
export function visiblePath(points, half, minStep) {
  const inside = (p) => Math.abs(p[0]) <= half && Math.abs(p[1]) <= half;
  let i0 = 0, i1 = points.length - 1;
  while (i0 < i1 && !inside(points[i0])) i0++;
  while (i1 > i0 && !inside(points[i1])) i1--;
  i0 = Math.max(0, i0 - 1); i1 = Math.min(points.length - 1, i1 + 1);
  const x = [], y = [];
  let lx = null, ly = null;
  for (let i = i0; i <= i1; i++) {
    const [px, py] = points[i];
    if (lx === null || Math.hypot(px - lx, py - ly) >= minStep || i === i1) { x.push(px); y.push(py); lx = px; ly = py; }
  }
  return { x, y };
}

/**
 * Null geodesics in the orbital plane (units of GM/c^2). `rays` are `{ f, captured, windings, points }`
 * with f the impact parameter in units of b_crit; the near-critical ray f = 1.005 is the focal mark.
 */
export function nullGeodesicSpec({ rays, bCrit, rPh, rs, height = 360 }) {
  const half = 2.5 * bCrit;
  const marks = [];
  let escapeLabelled = false, captureLabelled = false;
  for (const ray of rays) {
    const { x, y } = visiblePath(ray.points, half, half * 0.008);
    if (x.length < 2) continue;
    const near = ray.f === 1.005 || ray.f === 0.995;
    const label = ray.captured ? (captureLabelled ? null : "captured b < b_crit") : (escapeLabelled ? null : "escapes b > b_crit");
    if (ray.captured) captureLabelled = true; else escapeLabelled = true;
    marks.push(line({ x, y, layer: "model", color: ray.captured ? "pigment-red-71-c18" : "pigment-amber-88", width: near ? 2.4 : 1.6, focal: ray.f === 1.005, label }));
  }
  const bc = circle(bCrit), ph = circle(rPh), hz = circle(rs);
  marks.push(line({ ...bc, layer: "model", color: "pigment-orange-82-c13", dash: "4 3", width: 1.1, label: { tex: `b_{\\mathrm{crit}}=${bCrit.toFixed(3)}` } }));
  marks.push(line({ ...ph, layer: "model", color: "pigment-azure-88", dash: "2 3", width: 1.1, label: { tex: `r_{\\mathrm{ph}}=${rPh.toFixed(3)}` } }));
  marks.push(line({ ...hz, layer: "model", color: "pigment-red-76", width: 1.3, label: { tex: "r_s" } }));
  return figure({
    id: "gr-null-geodesics", title: "Null geodesics in the orbital plane", status: "effective", provenanceId: "gr-null-geodesics", height, aspect: 1, maxPlotWidth: 480,
    x: axis({ scale: { type: "linear", domain: [-half, half] }, label: { tex: "x" }, unit: "GM/c^2" }),
    y: axis({ scale: { type: "linear", domain: [-half, half] }, label: { tex: "y" }, unit: "GM/c^2" }),
    marks,
    summary: "Exact Schwarzschild photon paths: rays with impact parameter below the critical value plunge through the horizon, rays above it escape, and the near-critical ray winds around the photon sphere.",
  });
}

/**
 * Frame chrome of the lensed-sky image: angular axes in units of theta_E and the two reference rings.
 * The image itself is painted under the scene by the caller (Figure `backdrop`).
 */
export function lensFrameSpec({ thetaShadow, thetaE, fov, lensed, height = 360 }) {
  const half = fov / thetaE; // 2.5 by construction of the panel
  const marks = [];
  if (lensed) {
    marks.push(line({ ...circle(thetaShadow / thetaE), layer: "model", color: "pigment-red-76", dash: "4 3", width: 1, label: { tex: "\\text{shadow }b<b_{\\mathrm{crit}}" } }));
    marks.push(line({ ...circle(1), layer: "model", color: "pigment-amber-94", width: 1.2, focal: true, label: { tex: `\\text{Einstein ring }\\theta_E=${thetaE.toFixed(3)}` } }));
  }
  return figure({
    id: "gr-lensed-sky", title: "Lensed sky, angular frame", status: "effective", provenanceId: "gr-lensed-sky", height, aspect: 1, maxPlotWidth: 480,
    x: axis({ scale: { type: "linear", domain: [-half, half] }, label: { tex: "\\theta_x/\\theta_E" } }),
    y: axis({ scale: { type: "linear", domain: [-half, half] }, label: { tex: "\\theta_y/\\theta_E" } }),
    marks,
    summary: lensed
      ? "Lensed background sky: a black shadow at the critical impact parameter, a bright photon ring at its edge and an Einstein ring where the deflection maps the sky back onto itself."
      : "Unlensed background sky for comparison.",
  });
}

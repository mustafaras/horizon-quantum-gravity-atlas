#!/usr/bin/env node
/**
 * Deterministic science-figure generator for `docs/science/kerr-rendering.md`.
 *
 * The figures are rendered by a headless Chromium page that imports the *real*
 * science modules over HTTP, so every curve in the committed PNGs is produced by
 * the same code the application and the unit tests exercise. Nothing is
 * hand-drawn and nothing is random: the page is a pure function of the modules.
 *
 * Usage:
 *   node scripts/generate-science-figures.mjs            # write docs/science/figures/*.png
 *   node scripts/generate-science-figures.mjs --check    # render but do not write
 *
 * The script is intentionally not part of `npm test`: it needs a browser, and
 * the figures are documentation, not physics.
 */

import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join, resolve, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUTPUT_DIR = resolve(ROOT, "docs/science/figures");
const CHECK_ONLY = process.argv.includes("--check");

// Kept in sync with the page-side FIGURES list below; the driver asserts the
// rendered page produced exactly these ids.
const FIGURE_IDS = [
  "fig-characteristic-radii",
  "fig-page-thorne-flux",
  "fig-blackbody-locus",
  "fig-fast-fit-error",
  "fig-kerr-ray-fan",
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

const FIGURE_PAGE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Kerr science core figures</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; padding: 24px; background: #0b0d12; color: #e6e9f0;
    font: 13px/1.5 ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  figure {
    margin: 0 0 28px; padding: 18px 20px 14px; background: #12151d;
    border: 1px solid #232838; border-radius: 12px; width: 1120px;
  }
  figcaption { margin-top: 12px; color: #9aa4bb; font-size: 12px; }
  figcaption b { color: #e6e9f0; font-weight: 600; }
  /* The opaque background is declared in CSS as well as painted into the
     bitmap: if a capture path ever loses the canvas backing store, the region
     still composites as the figure ink colour instead of the page default. */
  canvas { display: block; background: #0b0d12; border-radius: 6px; }
</style>
</head>
<body>
<div id="figures"></div>
<script type="module">
import {
  kerrHorizonRadii, kerrIsco, kerrPhotonSphere, kerrErgosphereRadius,
  kerrConservedQuantities, kerrHamiltonianRHS,
} from "/js/science/kerr.mjs";
import {
  integrateAdaptive, createRadialTermination, combineTerminations,
} from "/js/science/integrators.mjs";
import {
  pageThorneFluxGeometric, pageThorneFluxClosedFormGeometric, newtonianDiskFluxGeometric,
  diskLuminosityGeometric, kerrCircularOrbit,
} from "/js/science/accretion-disk.mjs";
import {
  blackbodyToSrgb, fastBlackbodyToSrgb, fastBlackbodyToSrgbMaxError,
  xyzToChromaticity, cieXyzBarInterpolated,
} from "/js/science/spectrum.mjs";

const INK = "#e6e9f0";
const MUTED = "#7d879e";
const GRID = "#232838";
const AXIS = "#3a4256";

const PALETTE = {
  a: "#5ec8f2",
  b: "#f2a65e",
  c: "#8ee08a",
  d: "#e07ad0",
  f: "#9aa4bb",
};

function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  const dpr = 2;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#0b0d12";
  ctx.fillRect(0, 0, width, height);
  return { canvas, ctx };
}

function makeFigure(id, title, caption, width, height) {
  const figure = document.createElement("figure");
  figure.id = id;
  const { canvas, ctx } = makeCanvas(width, height);
  figure.appendChild(canvas);
  const cap = document.createElement("figcaption");
  cap.innerHTML = "<b>" + title + "</b> — " + caption;
  figure.appendChild(cap);
  document.getElementById("figures").appendChild(figure);
  return { figure, ctx };
}

function scale(domain, range) {
  const d0 = domain[0];
  const d1 = domain[1];
  const r0 = range[0];
  const r1 = range[1];
  return (value) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

function logScale(domain, range) {
  const d0 = Math.log10(domain[0]);
  const d1 = Math.log10(domain[1]);
  const r0 = range[0];
  const r1 = range[1];
  return (value) => r0 + ((Math.log10(value) - d0) / (d1 - d0)) * (r1 - r0);
}

function frame(ctx, box, opts) {
  ctx.save();
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  ctx.font = "11px ui-sans-serif, sans-serif";
  ctx.fillStyle = MUTED;
  for (const tick of opts.xTicks) {
    const px = Math.round(opts.x(tick.value)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(px, box.y);
    ctx.lineTo(px, box.y - box.height);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(tick.label, px, box.y + 6);
  }
  for (const tick of opts.yTicks) {
    const py = Math.round(opts.y(tick.value)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(box.x, py);
    ctx.lineTo(box.x + box.width, py);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(tick.label, box.x - 8, py);
  }
  ctx.strokeStyle = AXIS;
  ctx.beginPath();
  ctx.moveTo(box.x, box.y);
  ctx.lineTo(box.x + box.width, box.y);
  ctx.moveTo(box.x, box.y);
  ctx.lineTo(box.x, box.y - box.height);
  ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(opts.xLabel, box.x + box.width / 2, box.y + 24);
  ctx.save();
  ctx.translate(14, box.y - box.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = "middle";
  ctx.fillText(opts.yLabel, 0, 0);
  ctx.restore();
  ctx.restore();
}

function line(ctx, points, color, opts) {
  const o = opts || {};
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = o.width || 1.8;
  ctx.setLineDash(o.dash || []);
  ctx.beginPath();
  let started = false;
  for (const p of points) {
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) { started = false; continue; }
    if (started) ctx.lineTo(p[0], p[1]);
    else { ctx.moveTo(p[0], p[1]); started = true; }
  }
  ctx.stroke();
  ctx.restore();
}

function legend(ctx, x, y, entries) {
  ctx.save();
  ctx.font = "11px ui-sans-serif, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let row = 0;
  for (const entry of entries) {
    const py = y + row * 16;
    ctx.strokeStyle = entry.color;
    ctx.lineWidth = 1.8;
    ctx.setLineDash(entry.dash || []);
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x + 22, py);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = INK;
    ctx.fillText(entry.label, x + 28, py);
    row += 1;
  }
  ctx.restore();
}

function note(ctx, x, y, lines) {
  ctx.save();
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = MUTED;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach((text, index) => ctx.fillText(text, x, y + index * 15));
  ctx.restore();
}

/* ------------------------------------------------------------------ figure 1 */

function figureCharacteristicRadii() {
  const { ctx } = makeFigure(
    "fig-characteristic-radii",
    "Figure 1 — Spin-dependent characteristic radii",
    "Kerr event horizon r±, prograde/retrograde ISCO, prograde/retrograde photon sphere and the equatorial ergosphere, computed by <code>kerrHorizonRadii</code>, <code>kerrIsco</code>, <code>kerrPhotonSphere</code> and <code>kerrErgosphereRadius</code> over the full validated domain |a*| &le; 1.",
    1120, 420,
  );
  const box = { x: 70, y: 350, width: 1000, height: 300 };
  const x = scale([0, 1], [box.x, box.x + box.width]);
  const y = scale([0, 10], [box.y, box.y - box.height]);
  frame(ctx, box, {
    x, y,
    xTicks: [0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => ({ value: v, label: v.toFixed(1) })),
    yTicks: [0, 2, 4, 6, 8, 10].map((v) => ({ value: v, label: String(v) })),
    xLabel: "dimensionless spin a*",
    yLabel: "Boyer-Lindquist radius r / r_g",
  });

  const spins = [];
  for (let i = 0; i <= 200; i += 1) spins.push(i / 200);

  const series = [
    { label: "r+ (outer horizon)", color: PALETTE.a, get: (a) => kerrHorizonRadii(a).rPlus },
    { label: "r- (inner horizon)", color: PALETTE.a, dash: [5, 4], get: (a) => kerrHorizonRadii(a).rMinus },
    { label: "ISCO prograde", color: PALETTE.b, get: (a) => kerrIsco(a, { prograde: true }) },
    { label: "ISCO retrograde", color: PALETTE.b, dash: [5, 4], get: (a) => kerrIsco(a, { prograde: false }) },
    { label: "photon sphere prograde", color: PALETTE.c, get: (a) => kerrPhotonSphere(a, { prograde: true }) },
    { label: "photon sphere retrograde", color: PALETTE.c, dash: [5, 4], get: (a) => kerrPhotonSphere(a, { prograde: false }) },
    { label: "ergosphere (equator)", color: PALETTE.d, dash: [2, 3], get: (a) => kerrErgosphereRadius(a, Math.PI / 2) },
  ];
  for (const s of series) {
    line(ctx, spins.map((a) => [x(a), y(s.get(a))]), s.color, { dash: s.dash });
  }
  legend(ctx, 90, 40, series.map((s) => ({ label: s.label, color: s.color, dash: s.dash })));
  note(ctx, 700, 30, [
    "a* = 0   r+ = 2   ISCO = 6   photon = 3",
    "a* = 1   r+ = 1   ISCO = 1 / 9   photon = 1 / 4",
  ]);
}

/* ------------------------------------------------------------------ figure 2 */

function figurePageThorneFlux() {
  const { ctx } = makeFigure(
    "fig-page-thorne-flux",
    "Figure 2 — Thin-disk flux: published integral form vs energy-conserving closed form",
    "Left: Schwarzschild (a* = 0) flux profiles. The published Page-Thorne integral form (eq. 11) and the exact closed form F = Mdot(-dOmega/dr)(L - L_in)/(4 pi r) agree to O(r^-1/2) and both vanish inside the ISCO. Right: the closed form for a* = 0.9, prograde and retrograde, showing the spin dependence of the inner edge and the peak.",
    1120, 400,
  );

  const panels = [
    { x: 70, y: 330, width: 470, height: 280 },
    { x: 620, y: 330, width: 450, height: 280 },
  ];

  const radii = [];
  for (let i = 0; i <= 400; i += 1) radii.push(6 * Math.pow(1e4 / 6, i / 400));

  {
    const box = panels[0];
    const x = scale([6, 40], [box.x, box.x + box.width]);
    const y = scale([0, 3.4e-5], [box.y, box.y - box.height]);
    frame(ctx, box, {
      x, y,
      xTicks: [6, 10, 15, 20, 30, 40].map((v) => ({ value: v, label: String(v) })),
      yTicks: [0, 1e-5, 2e-5, 3e-5].map((v) => ({ value: v, label: (v * 1e5).toFixed(0) + "e-5" })),
      xLabel: "r / r_g",
      yLabel: "F (geometric units)",
    });
    line(ctx, radii.map((r) => [x(r), y(newtonianDiskFluxGeometric({ r, innerRadius: 6 }))]), PALETTE.f, { dash: [4, 4] });
    line(ctx, radii.map((r) => [x(r), y(pageThorneFluxGeometric({ aStar: 0, r, innerRadius: 6 }))]), PALETTE.b);
    line(ctx, radii.map((r) => [x(r), y(pageThorneFluxClosedFormGeometric({ aStar: 0, r, innerRadius: 6 }))]), PALETTE.a);
    legend(ctx, box.x + 12, box.y - box.height + 14, [
      { label: "Newtonian (Shakura-Sunyaev)", color: PALETTE.f, dash: [4, 4] },
      { label: "Page-Thorne integral form", color: PALETTE.b },
      { label: "exact closed form", color: PALETTE.a },
    ]);
    const closedL = diskLuminosityGeometric({ aStar: 0, form: "closed-form" });
    const integralL = diskLuminosityGeometric({ aStar: 0, form: "integral" });
    const binding = 1 - kerrCircularOrbit(0, 6).energy;
    note(ctx, box.x + 12, box.y - 96, [
      "L_closed  / (1 - E_isco) = " + (closedL / binding).toFixed(6),
      "L_integral/ (1 - E_isco) = " + (integralL / binding).toFixed(6),
      "closed form is exact up to the truncated tail",
    ]);
  }

  {
    const box = panels[1];
    const x = logScale([2, 1e4], [box.x, box.x + box.width]);
    const y = logScale([1e-9, 1e-4], [box.y, box.y - box.height]);
    frame(ctx, box, {
      x, y,
      xTicks: [2, 10, 100, 1000, 1e4].map((v) => ({ value: v, label: v >= 1000 ? v / 1000 + "k" : String(v) })),
      yTicks: [1e-9, 1e-8, 1e-7, 1e-6, 1e-5, 1e-4].map((v) => ({ value: v, label: "1e" + Math.log10(v) })),
      xLabel: "r / r_g",
      yLabel: "F (geometric units)",
    });
    line(ctx, radii.map((r) => [x(r), y(pageThorneFluxClosedFormGeometric({ aStar: 0.9, r, prograde: true }))]), PALETTE.b);
    line(ctx, radii.map((r) => [x(r), y(pageThorneFluxClosedFormGeometric({ aStar: 0.9, r, prograde: false }))]), PALETTE.c);
    legend(ctx, box.x + 12, box.y - box.height + 14, [
      { label: "prograde (r_in = " + kerrIsco(0.9, { prograde: true }).toFixed(3) + ")", color: PALETTE.b },
      { label: "retrograde (r_in = " + kerrIsco(0.9, { prograde: false }).toFixed(3) + ")", color: PALETTE.c },
    ]);
  }
}

/* ------------------------------------------------------------------ figure 3 */

function figureBlackbodyLocus() {
  const { ctx } = makeFigure(
    "fig-blackbody-locus",
    "Figure 3 — Planckian locus in CIE 1931 chromaticity",
    "The spectral locus is the chromaticity of the committed CIE 1931 2-degree colour-matching table, read monochromatically through <code>cieXyzBarInterpolated</code>; the Planckian locus is the chromaticity of <code>blackbodyToSrgb</code> from 1000 K to 40000 K. Swatches are the sRGB hex values returned by the same function.",
    1120, 520,
  );
  const box = { x: 70, y: 430, width: 520, height: 380 };
  const x = scale([0, 0.8], [box.x, box.x + box.width]);
  const y = scale([0, 0.9], [box.y, box.y - box.height]);
  frame(ctx, box, {
    x, y,
    xTicks: [0, 0.2, 0.4, 0.6, 0.8].map((v) => ({ value: v, label: v.toFixed(1) })),
    yTicks: [0, 0.2, 0.4, 0.6, 0.8].map((v) => ({ value: v, label: v.toFixed(1) })),
    xLabel: "CIE x",
    yLabel: "CIE y",
  });

  const locus = [];
  for (let nm = 380; nm <= 700; nm += 2) {
    // The spectral locus is by definition the chromaticity of the colour-matching
    // functions at a single wavelength, so it is read straight from the committed
    // table rather than integrated. (cieXyzFromSpectralRadiance would also work,
    // but its radiance callback receives metres, and the 5 nm table spacing
    // undersamples a narrow monochromatic line.)
    const c = xyzToChromaticity(cieXyzBarInterpolated(nm));
    locus.push([x(c.x), y(c.y)]);
  }
  line(ctx, locus, PALETTE.f, { width: 1.4 });

  const planck = [];
  for (let i = 0; i <= 200; i += 1) {
    const t = 1000 * Math.pow(40, i / 200);
    const c = xyzToChromaticity(blackbodyToSrgb(t).xyz);
    planck.push([x(c.x), y(c.y)]);
  }
  line(ctx, planck, PALETTE.a, { width: 2.2 });

  for (const t of [1000, 2000, 3000, 4000, 5000, 6500, 10000, 20000, 40000]) {
    const c = xyzToChromaticity(blackbodyToSrgb(t).xyz);
    ctx.save();
    ctx.fillStyle = PALETTE.b;
    ctx.beginPath();
    ctx.arc(x(c.x), y(c.y), 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = MUTED;
    ctx.font = "10px ui-sans-serif, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(t / 1000 + "k", x(c.x) + 6, y(c.y));
    ctx.restore();
  }

  const swatchX = 640;
  const swatchY = 60;
  const swatchW = 60;
  const swatchH = 60;
  ctx.save();
  ctx.font = "11px ui-sans-serif, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("blackbodyToSrgb - exact tabulated CMF integration", swatchX, swatchY - 20);
  [1000, 2000, 3000, 4000, 5000, 6500, 10000, 20000, 40000].forEach((t, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const px = swatchX + col * (swatchW + 8);
    const py = swatchY + row * (swatchH + 34);
    const result = blackbodyToSrgb(t);
    ctx.fillStyle = result.hex;
    ctx.fillRect(px, py, swatchW, swatchH);
    ctx.strokeStyle = GRID;
    ctx.strokeRect(px + 0.5, py + 0.5, swatchW - 1, swatchH - 1);
    ctx.fillStyle = INK;
    ctx.fillText(t + " K", px, py + swatchH + 6);
    ctx.fillStyle = MUTED;
    ctx.fillText(result.hex, px, py + swatchH + 20);
  });
  ctx.restore();
}

/* ------------------------------------------------------------------ figure 4 */

function figureFastFitError() {
  const { ctx } = makeFigure(
    "fig-fast-fit-error",
    "Figure 4 — Fast blackbody-to-sRGB error: analytic fit vs interpolated table",
    "Worst encoded-channel error against the exact tabulated integration, as a function of temperature. The published Wyman multi-lobe analytic fit is already the most accurate published closed form; the interpolated committed table is a strictly better fast path at the same cost (21 radiance evaluations).",
    1120, 400,
  );
  const box = { x: 80, y: 330, width: 620, height: 280 };
  const x = logScale([1000, 40000], [box.x, box.x + box.width]);
  const y = logScale([1e-16, 1e-1], [box.y, box.y - box.height]);
  frame(ctx, box, {
    x, y,
    xTicks: [1000, 2000, 5000, 10000, 20000, 40000].map((v) => ({ value: v, label: v / 1000 + "k" })),
    yTicks: [1e-16, 1e-12, 1e-8, 1e-4, 1e-1].map((v) => ({ value: v, label: "1e" + Math.log10(v) })),
    xLabel: "temperature (K)",
    yLabel: "max encoded-channel error",
  });

  const samples = 240;
  const analytic = [];
  const interpolated = [];
  const interpolatedFine = [];
  for (let i = 0; i < samples; i += 1) {
    const t = 1000 * Math.pow(40, i / (samples - 1));
    const reference = blackbodyToSrgb(t);
    const worst = (result) => Math.max(
      Math.abs(result.srgb.r - reference.srgb.r),
      Math.abs(result.srgb.g - reference.srgb.g),
      Math.abs(result.srgb.b - reference.srgb.b),
    );
    analytic.push([x(t), y(Math.max(worst(fastBlackbodyToSrgb(t, { method: "analytic" })), 1e-16))]);
    interpolated.push([x(t), y(Math.max(worst(fastBlackbodyToSrgb(t, { method: "interpolated" })), 1e-16))]);
    interpolatedFine.push([x(t), y(Math.max(worst(fastBlackbodyToSrgb(t, { method: "interpolated", stepNm: 5 })), 1e-16))]);
  }
  line(ctx, analytic, PALETTE.b);
  line(ctx, interpolated, PALETTE.a);
  line(ctx, interpolatedFine, PALETTE.c, { dash: [4, 4] });
  legend(ctx, box.x + 12, box.y - box.height + 14, [
    { label: "analytic Wyman fit (default)", color: PALETTE.b },
    { label: "interpolated table, 20 nm", color: PALETTE.a },
    { label: "interpolated table, 5 nm (exact)", color: PALETTE.c, dash: [4, 4] },
  ]);

  const wide = fastBlackbodyToSrgbMaxError({ method: "analytic", samples: 400 });
  const narrow = fastBlackbodyToSrgbMaxError({ method: "interpolated", samples: 400 });
  const exact = fastBlackbodyToSrgbMaxError({ method: "interpolated", samples: 400, stepNm: 5 });
  note(ctx, 740, 60, [
    "worst case over 1000-40000 K",
    "",
    "analytic      " + wide.maxChannelError.toExponential(3),
    "interpolated  " + narrow.maxChannelError.toExponential(3),
    "interp 5 nm   " + exact.maxChannelError.toExponential(3),
    "",
    "improvement   " + (wide.maxChannelError / narrow.maxChannelError).toFixed(1) + "x",
    "dxy analytic  " + wide.maxChromaticityError.toExponential(3),
    "dxy interp    " + narrow.maxChromaticityError.toExponential(3),
  ]);
}

/* ------------------------------------------------------------------ figure 5 */

function figureKerrRayFan() {
  const { ctx } = makeFigure(
    "fig-kerr-ray-fan",
    "Figure 5 — Equatorial null geodesics integrated by the RK45 driver",
    "A fan of equatorial null geodesics launched from r = 20 r_g towards a Kerr black hole with a* = 0.9, integrated by the Dormand-Prince 5(4) driver on the Hamiltonian form of the geodesic equations. Rays whose impact parameter falls below the critical value terminate on the horizon (drawn in magenta); the rest escape past r = 22 r_g (drawn in blue). The dashed circle is the prograde photon sphere. The fan is asymmetric because frame dragging favours co-rotating rays.",
    1120, 520,
  );
  const box = { x: 60, y: 470, width: 1000, height: 420 };
  const x = scale([-22, 22], [box.x, box.x + box.width]);
  const y = scale([-22, 22], [box.y, box.y - box.height]);
  frame(ctx, box, {
    x, y,
    xTicks: [-20, -10, 0, 10, 20].map((v) => ({ value: v, label: String(v) })),
    yTicks: [-20, -10, 0, 10, 20].map((v) => ({ value: v, label: String(v) })),
    xLabel: "x / r_g",
    yLabel: "y / r_g",
  });

  const aStar = 0.9;
  const start = 20;
  const escapeRadius = 22;
  const rPlus = kerrHorizonRadii(aStar).rPlus;
  const photon = kerrPhotonSphere(aStar, { prograde: true });

  ctx.save();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(x(0), y(0), Math.abs(x(rPlus) - x(0)), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.d;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x(0), y(0), Math.abs(x(rPlus) - x(0)), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = PALETTE.c;
  ctx.beginPath();
  ctx.arc(x(0), y(0), Math.abs(x(photon) - x(0)), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // The driver has no per-step observer, so the trajectory is sampled by
  // wrapping the right-hand side: every stage evaluation is a point on the
  // solution, which at atol = rtol = 1e-11 is visually exact.
  function tracePath(offset) {
    const initial = kerrConservedQuantities({
      aStar, r: start, theta: Math.PI / 2, direction: [-1, 0, offset / start], observer: "zamo",
    });
    const state = [0, start, Math.PI / 2, 0, initial.pT, initial.pR, initial.pTheta, initial.pPhi];
    const path = [[start, 0]];
    const rhs = (s, params) => {
      path.push([s[1], s[3]]);
      return kerrHamiltonianRHS(s, params);
    };
    const event = combineTerminations(
      createRadialTermination({ innerRadius: rPlus + 1e-3, innerType: "captured" }),
      createRadialTermination({ outerRadius: escapeRadius, outerType: "escaped" }),
    );
    const result = integrateAdaptive({
      rhs, state, h0: 0.05, hMax: 1, maxSteps: 200000,
      atol: 1e-11, rtol: 1e-11, params: { aStar }, event,
    });
    path.push([result.state[1], result.state[3]]);
    return { path, status: result.event ? result.event.type : result.status };
  }

  let captured = 0;
  let escaped = 0;
  for (let i = 0; i <= 26; i += 1) {
    const offset = -8 + (16 * i) / 26;
    let traced;
    try {
      traced = tracePath(offset);
    } catch (error) {
      continue;
    }
    const isCaptured = traced.status === "captured";
    if (isCaptured) captured += 1;
    else escaped += 1;
    ctx.save();
    ctx.strokeStyle = isCaptured ? "rgba(224,122,208,0.75)" : "rgba(94,200,242,0.75)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (const [radius, phi] of traced.path) {
      const px = x(radius * Math.cos(phi));
      const py = y(radius * Math.sin(phi));
      if (Number.isFinite(px) && Number.isFinite(py)) ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }
  note(ctx, 700, 40, [
    "a* = 0.9   r+ = " + rPlus.toFixed(4),
    "photon sphere (prograde) = " + photon.toFixed(4),
    "rays captured = " + captured,
    "rays escaped  = " + escaped,
    "integrator: Dormand-Prince 5(4), atol = rtol = 1e-11",
  ]);
}

/* ------------------------------------------------------------------- driver */

const FIGURES = [
  figureCharacteristicRadii,
  figurePageThorneFlux,
  figureBlackbodyLocus,
  figureFastFitError,
  figureKerrRayFan,
];

for (const build of FIGURES) build();
window.__FIGURES_READY__ = true;
</script>
</body>
</html>
`;

function startServer() {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname === "/__figures__/" || url.pathname === "/__figures__/index.html") {
      response.writeHead(200, { "content-type": MIME[".html"] });
      response.end(FIGURE_PAGE);
      return;
    }
    const relative = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    const file = join(ROOT, relative);
    if (!file.startsWith(ROOT) || !existsSync(file)) {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("not found");
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
      response.end(body);
    } catch (error) {
      response.writeHead(500, { "content-type": "text/plain" });
      response.end(String(error));
    }
  });
  return new Promise((resolveServer) => {
    server.listen(0, "127.0.0.1", () => resolveServer(server));
  });
}

async function main() {
  const { chromium } = await import("playwright");
  const server = await startServer();
  const { port } = server.address();
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 900 },
      deviceScaleFactor: 2,
      reducedMotion: "reduce",
      colorScheme: "dark",
    });
    const page = await context.newPage();
    const failures = [];
    page.on("pageerror", (error) => failures.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") failures.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${port}/__figures__/index.html`, { waitUntil: "load" });
    await page.waitForFunction("window.__FIGURES_READY__ === true", null, { timeout: 60000 });
    if (failures.length > 0) {
      throw new Error(`figure page reported errors:\n${failures.join("\n")}`);
    }

    const ids = await page.$$eval("figure", (nodes) => nodes.map((node) => node.id));
    if (ids.length !== FIGURE_IDS.length || ids.some((id, index) => id !== FIGURE_IDS[index])) {
      throw new Error(
        `expected figures ${FIGURE_IDS.join(", ")}, found ${ids.join(", ") || "(none)"}`,
      );
    }

    if (!CHECK_ONLY) await mkdir(OUTPUT_DIR, { recursive: true });
    const written = [];
    for (const [index, id] of ids.entries()) {
      const name = `${String(index + 1).padStart(2, "0")}-${id.replace(/^fig-/, "")}.png`;
      const target = join(OUTPUT_DIR, name);
      const buffer = await page.locator(`#${id}`).screenshot();
      if (!CHECK_ONLY) await writeFile(target, buffer);
      written.push({ name, bytes: buffer.length });
    }
    for (const entry of written) {
      console.log(`${CHECK_ONLY ? "rendered" : "wrote"} ${entry.name} (${entry.bytes} bytes)`);
    }
    console.log(`\n${written.length} figures ${CHECK_ONLY ? "rendered" : `written to ${OUTPUT_DIR}`}.`);
  } finally {
    await browser.close();
    await new Promise((done) => server.close(done));
  }
}

await main();

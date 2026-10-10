#!/usr/bin/env node
/**
 * Deterministic benchmark for the Kerr ray-tracing science core.
 *
 * Reports ray count, median integration time, convergence error, and
 * conserved-quantity drift. It prints measurements only: no machine-specific
 * timing threshold is enforced, so the script is safe to run on any host and in
 * any CI runner. Exit code is non-zero only when a *physics* invariant fails
 * (non-finite state, or drift beyond the documented bound), never on timing.
 *
 * Usage:
 *   node scripts/benchmark-kerr.mjs [--rays N] [--json]
 */

import { performance } from "node:perf_hooks";

import { traceKerrRay } from "../js/science/kerr.mjs";
import { kerrIsco } from "../js/science/kerr.mjs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const raysIndex = args.indexOf("--rays");
const RAY_COUNT = raysIndex >= 0 ? Number(args[raysIndex + 1]) : 64;

if (!Number.isInteger(RAY_COUNT) || RAY_COUNT < 1) {
  console.error(`--rays must be a positive integer; received ${args[raysIndex + 1]}`);
  process.exit(2);
}

/** Documented drift bounds from docs/science/kerr-rendering.md. */
const DRIFT_BOUNDS = {
  escaped: { Q: 1e-7, hamiltonian: 1e-9 },
  captured: { Q: 1e-7, hamiltonian: 1e-5 },
  disk: { Q: 1e-7, hamiltonian: 1e-8 },
};

const SPINS = [0, 0.3, 0.6, 0.9, 0.998];

/**
 * Deterministic ray set: a fixed spiral of directions over a fixed spin ladder,
 * with every third ray aimed inward so the set exercises all three outcomes
 * (escaped, disk, captured). No randomness, so two runs on the same host are
 * bit-identical.
 */
function buildRays(count) {
  const rays = [];
  for (let i = 0; i < count; i += 1) {
    const aStar = SPINS[i % SPINS.length];
    const turn = (i + 1) / count;
    const azimuth = turn * Math.PI * 2 * 3;
    const elevation = 0.35 + 0.9 * ((i * 7) % 11) / 10;
    const radius = 12 + 8 * ((i * 5) % 7);
    const theta = Math.PI / 2 - elevation * 0.6;
    const inward = i % 3 === 0;
    const capture = i % 4 === 0;
    const direction = capture
      ? [-1, 0.02 * Math.cos(azimuth), 0.02 * Math.sin(azimuth)]
      : inward
        ? [-Math.cos(azimuth) * Math.cos(elevation), -Math.sin(elevation), -Math.sin(azimuth) * Math.cos(elevation)]
        : [Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.sin(azimuth) * Math.cos(elevation)];
    rays.push({
      label: `a=${aStar} r=${radius} theta=${theta.toFixed(3)} ${capture ? "capture" : inward ? "inward" : "outward"}`,
      options: {
        aStar,
        r: radius,
        theta,
        direction,
        rEscape: 1e4,
        diskInner: kerrIsco(aStar, { prograde: true }),
        diskOuter: 40,
      },
    });
  }
  return rays;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[index];
}

const rays = buildRays(RAY_COUNT);
const timings = [];
const stepCounts = [];
const byStatus = new Map();
const failures = [];
let totalSteps = 0;
let maxDriftQ = 0;
let maxDriftH = 0;
let maxDriftE = 0;
let maxDriftLz = 0;

for (const ray of rays) {
  const start = performance.now();
  const result = traceKerrRay(ray.options);
  const elapsed = performance.now() - start;
  timings.push(elapsed);
  stepCounts.push(result.steps);
  totalSteps += result.steps;

  const bucket = byStatus.get(result.status) ?? { count: 0, steps: 0, maxQ: 0, maxH: 0 };
  bucket.count += 1;
  bucket.steps += result.steps;
  bucket.maxQ = Math.max(bucket.maxQ, Math.abs(result.drift.Q));
  bucket.maxH = Math.max(bucket.maxH, Math.abs(result.drift.hamiltonian));
  byStatus.set(result.status, bucket);

  maxDriftQ = Math.max(maxDriftQ, Math.abs(result.drift.Q));
  maxDriftH = Math.max(maxDriftH, Math.abs(result.drift.hamiltonian));
  maxDriftE = Math.max(maxDriftE, Math.abs(result.drift.E));
  maxDriftLz = Math.max(maxDriftLz, Math.abs(result.drift.Lz));

  const state = result.state;
  if (!state.every((value) => Number.isFinite(value))) {
    failures.push(`${ray.label}: non-finite final state`);
  }
  const bound = DRIFT_BOUNDS[result.status];
  if (bound) {
    if (Math.abs(result.drift.Q) > bound.Q) {
      failures.push(`${ray.label}: |dQ| = ${Math.abs(result.drift.Q).toExponential(3)} exceeds ${bound.Q}`);
    }
    if (Math.abs(result.drift.hamiltonian) > bound.hamiltonian) {
      failures.push(
        `${ray.label}: |dH| = ${Math.abs(result.drift.hamiltonian).toExponential(3)} exceeds ${bound.hamiltonian}`,
      );
    }
  }
}

/**
 * Convergence: the same ray at two tolerances. The escape radius is
 * step-quantized, so the accumulated azimuth is the meaningful comparison.
 */
const convergenceRay = {
  aStar: 0.9,
  r: 20,
  theta: 1.2,
  direction: [0.6, 0.3, 0.2],
  rEscape: 1e4,
};
const loose = traceKerrRay({ ...convergenceRay, atol: 1e-8, rtol: 1e-8 });
const tight = traceKerrRay({ ...convergenceRay, atol: 1e-13, rtol: 1e-13 });
const convergence = {
  looseSteps: loose.steps,
  tightSteps: tight.steps,
  azimuthLoose: loose.state[3],
  azimuthTight: tight.state[3],
  azimuthError: Math.abs(loose.state[3] - tight.state[3]),
  driftQError: Math.abs(loose.drift.Q - tight.drift.Q),
};

const report = {
  rayCount: rays.length,
  statusCounts: Object.fromEntries([...byStatus].map(([status, b]) => [status, b.count])),
  steps: { total: totalSteps, median: median(stepCounts) },
  timingMs: {
    median: median(timings),
    p90: percentile(timings, 90),
    min: Math.min(...timings),
    max: Math.max(...timings),
    total: timings.reduce((sum, value) => sum + value, 0),
  },
  drift: {
    maxAbsE: maxDriftE,
    maxAbsLz: maxDriftLz,
    maxAbsQ: maxDriftQ,
    maxAbsHamiltonian: maxDriftH,
  },
  convergence,
  failures,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const line = (label, value) => console.log(`  ${label.padEnd(28)} ${value}`);
  console.log("Kerr ray-tracing benchmark");
  console.log("==========================");
  console.log("");
  console.log("Workload");
  line("rays", report.rayCount);
  line("status counts", JSON.stringify(report.statusCounts));
  line("total steps", report.steps.total);
  line("median steps per ray", report.steps.median);
  console.log("");
  console.log("Integration time (ms) — informational, no threshold enforced");
  line("median", report.timingMs.median.toFixed(3));
  line("p90", report.timingMs.p90.toFixed(3));
  line("min", report.timingMs.min.toFixed(3));
  line("max", report.timingMs.max.toFixed(3));
  line("total", report.timingMs.total.toFixed(3));
  console.log("");
  console.log("Conserved-quantity drift (max absolute over the ray set)");
  line("dE", report.drift.maxAbsE.toExponential(3));
  line("dLz", report.drift.maxAbsLz.toExponential(3));
  line("dQ", report.drift.maxAbsQ.toExponential(3));
  line("dH (null constraint)", report.drift.maxAbsHamiltonian.toExponential(3));
  console.log("");
  console.log("Convergence (same ray, atol/rtol 1e-8 vs 1e-13)");
  line("steps loose / tight", `${convergence.looseSteps} / ${convergence.tightSteps}`);
  line("azimuth error", convergence.azimuthError.toExponential(3));
  line("dQ difference", convergence.driftQError.toExponential(3));
  console.log("");
  if (failures.length === 0) {
    console.log("Physics invariants: OK");
  } else {
    console.log(`Physics invariants: ${failures.length} FAILURE(S)`);
    for (const failure of failures) console.log(`  - ${failure}`);
  }
}

process.exit(failures.length === 0 ? 0 : 1);

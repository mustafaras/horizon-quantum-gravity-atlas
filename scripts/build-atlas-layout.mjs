// Runs the atlas-map layout once and commits the node positions.
//
//   node scripts/build-atlas-layout.mjs            # write js/science/data/atlas-map-layout.mjs
//   node scripts/build-atlas-layout.mjs --check    # fail if the committed file is stale
//
// The simulation is Fruchterman-Reingold with a fixed seed (42), so the output is a pure function of the graph. The
// runtime never simulates: it reads the committed positions, which keeps the overview's first frame unchanged and
// makes the map identical in every browser and in every capture.

import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { atlasNodes, atlasEdges } from "../js/science/atlas-map.mjs";
import { seededRng } from "../js/physics.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "js/science/data/atlas-map-layout.mjs");
const SEED = 42;

export const LAYOUT = Object.freeze({
  seed: SEED,
  iterations: 600,
  area: 1,          // normalised to the unit square; the renderer scales to the stage
  repulsion: 0.0022,
  spring: 0.9,
  springLength: 0.055,
  gravity: 0.06,    // a weak pull to the centre keeps isolated problems from drifting to the rim
  cooling: 0.985,
  minTemperature: 1e-4,
});

const MASS = { module: 1, result: 0.55, problem: 0.7 };

/**
 * Deterministic layout of the graph. Positions are returned in a unit square centred on the origin:
 * x, y in [-0.5, 0.5]. Nothing here reads the DOM, so the test and the script get identical numbers.
 */
export function computeLayout(nodes = atlasNodes(), edges = atlasEdges(), options = {}) {
  const cfg = { ...LAYOUT, ...options };
  const rng = seededRng(cfg.seed);
  const n = nodes.length;
  const index = new Map(nodes.map((node, i) => [node.id, i]));
  const pos = nodes.map(() => [rng() - 0.5, rng() - 0.5]);
  const disp = nodes.map(() => [0, 0]);
  const mass = nodes.map((node) => MASS[node.kind] ?? 0.7);
  const links = edges.map((edge) => {
    const from = index.get(edge.from);
    const to = index.get(edge.to);
    if (from === undefined || to === undefined) throw new Error(`layout: edge ${edge.id} names an unknown node`);
    return [from, to, edge.kind === "result" ? 0.45 : 1];
  });

  let temperature = 0.12;
  for (let step = 0; step < cfg.iterations; step += 1) {
    for (const d of disp) { d[0] = 0; d[1] = 0; }
    // Repulsion: every pair pushes apart with mass-weighted force.
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        let dx = pos[i][0] - pos[j][0];
        let dy = pos[i][1] - pos[j][1];
        let dist2 = dx * dx + dy * dy;
        if (dist2 < 1e-9) { dx = (rng() - 0.5) * 1e-3; dy = (rng() - 0.5) * 1e-3; dist2 = dx * dx + dy * dy; }
        const force = (cfg.repulsion * mass[i] * mass[j]) / dist2;
        const dist = Math.sqrt(dist2);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        disp[i][0] += fx; disp[i][1] += fy;
        disp[j][0] -= fx; disp[j][1] -= fy;
      }
    }
    // Springs pull linked nodes to `springLength`.
    for (const [a, b, weight] of links) {
      const dx = pos[a][0] - pos[b][0];
      const dy = pos[a][1] - pos[b][1];
      const dist = Math.hypot(dx, dy) || 1e-6;
      const force = cfg.spring * weight * (dist - cfg.springLength);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      disp[a][0] -= fx; disp[a][1] -= fy;
      disp[b][0] += fx; disp[b][1] += fy;
    }
    // Gravity to the centre, so the graph stays inside the unit square.
    for (let i = 0; i < n; i += 1) {
      disp[i][0] -= pos[i][0] * cfg.gravity * mass[i];
      disp[i][1] -= pos[i][1] * cfg.gravity * mass[i];
    }
    // Displace, clamped by the cooling temperature, then clamp to the square.
    let maxMove = 0;
    for (let i = 0; i < n; i += 1) {
      const len = Math.hypot(disp[i][0], disp[i][1]);
      if (len > 1e-12) {
        const step = Math.min(len, temperature) / len;
        pos[i][0] += disp[i][0] * step;
        pos[i][1] += disp[i][1] * step;
        maxMove = Math.max(maxMove, Math.min(len, temperature));
      }
      pos[i][0] = Math.max(-0.5, Math.min(0.5, pos[i][0]));
      pos[i][1] = Math.max(-0.5, Math.min(0.5, pos[i][1]));
    }
    temperature = Math.max(cfg.minTemperature, temperature * cfg.cooling);
    if (maxMove < cfg.minTemperature) break;
  }

  // Rescale so the drawing fills [-0.5, 0.5] in its longest axis with a margin, keeping the aspect ratio.
  const xs = pos.map((p) => p[0]);
  const ys = pos.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const span = Math.max(spanX, spanY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const round = (v) => Number(v.toFixed(5));
  const positions = {};
  nodes.forEach((node, i) => {
    positions[node.id] = { x: round((pos[i][0] - cx) / span), y: round((pos[i][1] - cy) / span) };
  });
  return positions;
}

function render(positions) {
  const lines = [];
  for (const [id, { x, y }] of Object.entries(positions)) lines.push(`  ${JSON.stringify(id)}: { x: ${x}, y: ${y} },`);
  return `// Generated by scripts/build-atlas-layout.mjs — do not edit by hand.
//
// Seeded Fruchterman-Reingold layout of the atlas map (seed ${SEED}, ${LAYOUT.iterations} iterations). The positions
// are normalised to the unit square and carry no quantity: they are a drawing, not a measurement. Regenerate with
//   node scripts/build-atlas-layout.mjs
// after any change to js/science/atlas-map.mjs.

export const ATLAS_MAP_LAYOUT_SEED = ${SEED};

/** Node positions in a unit square centred on the origin, x and y in [-0.5, 0.5]. */
export const ATLAS_MAP_LAYOUT = Object.freeze({
${lines.join("\n")}
});
`;
}

const positions = computeLayout();
const text = render(positions);
const check = process.argv.includes("--check");

if (check) {
  const committed = await readFile(OUT, "utf8").catch(() => "");
  if (committed !== text) {
    console.error("atlas layout is stale: run node scripts/build-atlas-layout.mjs");
    process.exitCode = 1;
  } else {
    console.log(`atlas layout is current (${Object.keys(positions).length} nodes, seed ${SEED}).`);
  }
} else {
  await writeFile(OUT, text);
  console.log(`wrote ${path.relative(root, OUT)}: ${Object.keys(positions).length} nodes, seed ${SEED}.`);
}

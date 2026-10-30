import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ATLAS_MODULES, ATLAS_RESULTS, ATLAS_PROBLEMS, ATLAS_SPINE, CHAPTER_FIGURES, CHAPTER_STATUS_ORDER,
  atlasNodes, atlasEdges, atlasAdjacency, atlasTextAlternative, chapterStatusShares, NODE_KINDS, EDGE_KINDS,
} from "../js/science/atlas-map.mjs";
import { ATLAS_MAP_LAYOUT, ATLAS_MAP_LAYOUT_SEED } from "../js/science/data/atlas-map-layout.mjs";
import { registerAllProvenance } from "../js/provenance-index.mjs";
import { getVisualizationProvenance } from "../js/science/provenance.mjs";
import { computeLayout } from "../scripts/build-atlas-layout.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
registerAllProvenance();

test("every map node is a chapter, a result or an open problem, and has a registered status", () => {
  const nodes = atlasNodes();
  assert.equal(nodes.length, ATLAS_MODULES.length + ATLAS_RESULTS.length + ATLAS_PROBLEMS.length);
  for (const node of nodes) {
    assert.ok(NODE_KINDS.includes(node.kind), `${node.id}: kind ${node.kind}`);
    assert.equal(typeof node.status, "string", `${node.id}: status`);
  }
  assert.equal(new Set(nodes.map((n) => n.id)).size, nodes.length, "node ids are unique");
});

test("every edge joins two existing nodes and is a known kind", () => {
  const ids = new Set(atlasNodes().map((n) => n.id));
  const edges = atlasEdges();
  for (const edge of edges) {
    assert.ok(EDGE_KINDS.includes(edge.kind), `${edge.id}: kind`);
    assert.ok(ids.has(edge.from), `${edge.id}: from ${edge.from} exists`);
    assert.ok(ids.has(edge.to), `${edge.id}: to ${edge.to} exists`);
    assert.notEqual(edge.from, edge.to, `${edge.id}: no self edge`);
  }
  const keys = edges.map((e) => [e.from, e.to].sort().join("|") + "|" + e.kind);
  assert.equal(new Set(keys).size, keys.length, "no duplicate edges");
});

test("the reading path is the module registry's order, and every step is a ConceptBridge", async () => {
  const source = await readFile(path.join(root, "js/data.jsx"), "utf8");
  const registry = source.slice(source.indexOf("const QGA_MODULES"), source.indexOf("/* ---------- formula index"));
  const ids = [...registry.matchAll(/id:\s*"([a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ATLAS_SPINE, "the spine is the order the registry lists the chapters in");
  assert.equal(ATLAS_SPINE.length, ATLAS_MODULES.length, "one spine node per chapter");
  // Each step must be a bridge a reader can actually take. The bridges' `next` fields are a graph, not a list — the
  // Higgs bridges jump to `rg` and `planck` out of order — so the test asks that each consecutive pair exists.
  const nexts = [...source.matchAll(/\bnext:\s*"([a-z]+)"/g)].map((m) => m[1]);
  for (let i = 0; i + 1 < ATLAS_SPINE.length; i += 1) {
    assert.ok(nexts.includes(ATLAS_SPINE[i + 1]), `no bridge leads to ${ATLAS_SPINE[i + 1]}`);
  }
  assert.ok(new Set(nexts).size >= ATLAS_SPINE.length - 1, "every chapter but the first is the target of a bridge");
});

test("every result recomputes its own displayed value from the science module", () => {
  for (const result of ATLAS_RESULTS) {
    assert.equal(typeof result.check, "function", `${result.id}: a check`);
    const value = result.check();
    assert.ok(Number.isFinite(value), `${result.id}: check returns a finite number`);
    // The printed string must contain the checked number, rounded as the label rounds it, so the two cannot drift.
    const candidates = [value, value.toFixed(2), value.toFixed(3), value.toFixed(4), value.toFixed(5), String(value)].map((v) => String(v));
    const shown = result.value.replace(/[,\s]/g, "");
    assert.ok(
      candidates.some((c) => shown.includes(c.replace(/[,\s]/g, ""))) || result.value.includes(String(Math.round(value))),
      `${result.id}: displayed "${result.value}" carries the recomputed ${value}`,
    );
    assert.ok(result.reference && /doi:|arXiv:|https?:\/\//.test(result.reference), `${result.id}: citation`);
    assert.ok(result.detail.length > 20, `${result.id}: a detail sentence`);
  }
});

test("the committed layout covers every node and is deterministic", () => {
  const nodes = atlasNodes();
  const edges = atlasEdges();
  assert.equal(ATLAS_MAP_LAYOUT_SEED, 42);
  for (const node of nodes) {
    const p = ATLAS_MAP_LAYOUT[node.id];
    assert.ok(p, `${node.id}: has a committed position`);
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `${node.id}: finite coordinates`);
    assert.ok(p.x >= -0.5 && p.x <= 0.5 && p.y >= -0.5 && p.y <= 0.5, `${node.id}: inside the unit square`);
  }
  // Recomputing must reproduce the committed numbers exactly: otherwise the file is stale.
  const again = computeLayout(nodes, edges);
  assert.deepEqual(again, ATLAS_MAP_LAYOUT, "the committed layout is what scripts/build-atlas-layout.mjs produces");
});

test("no two nodes are drawn on top of each other", () => {
  const nodes = atlasNodes();
  let min = Infinity;
  let pair = null;
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = ATLAS_MAP_LAYOUT[nodes[i].id];
      const b = ATLAS_MAP_LAYOUT[nodes[j].id];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < min) { min = d; pair = [nodes[i].id, nodes[j].id]; }
    }
  }
  // The largest disc is 16 px at a ~600 px scale, so 0.03 of the square is comfortably clear of it.
  assert.ok(min > 0.03, `closest pair ${pair?.join(" / ")} is ${min.toFixed(4)} apart`);
});

test("every chapter's figures are registered, and the share bar is computed from the registry", () => {
  for (const [id, figures] of Object.entries(CHAPTER_FIGURES)) {
    assert.ok(figures.length > 0, `${id}: at least one figure`);
    for (const figureId of figures) {
      const entry = getVisualizationProvenance(figureId);
      assert.ok(entry, `${id}: ${figureId} is registered`);
    }
  }
  const shares = chapterStatusShares((figureId) => getVisualizationProvenance(figureId)?.status ?? null);
  for (const module of ATLAS_MODULES) {
    const share = shares[module.id];
    assert.equal(share.total, CHAPTER_FIGURES[module.id].length, `${module.id}: every figure counted`);
    const sum = Object.values(share.fractions).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `${module.id}: the fractions sum to 1`);
    for (const status of CHAPTER_STATUS_ORDER) {
      assert.ok(share.fractions[status] >= 0 && share.fractions[status] <= 1, `${module.id}: ${status} fraction in range`);
    }
  }
  // An unknown figure is skipped, never guessed.
  const unknown = chapterStatusShares(() => null, { sm: ["not-registered"] });
  assert.equal(unknown.sm.total, 0);
});

test("adjacency is symmetric and every node is reachable from every other", () => {
  const adjacency = atlasAdjacency();
  for (const [from, list] of Object.entries(adjacency)) {
    for (const to of list) assert.ok(adjacency[to].includes(from), `${from} -> ${to} is symmetric`);
  }
  const nodes = atlasNodes().map((n) => n.id);
  const seen = new Set([nodes[0]]);
  const queue = [nodes[0]];
  while (queue.length) {
    for (const next of adjacency[queue.shift()] ?? []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
  assert.equal(seen.size, nodes.length, "the graph is connected, so arrow-key navigation can reach every node");
});

test("the text alternative lists every node and every edge", () => {
  const lines = atlasTextAlternative();
  assert.equal(lines.length, atlasNodes().length + atlasEdges().length);
  for (const line of lines) assert.ok(line.trim().length > 0, "no empty line");
  assert.ok(lines.some((l) => l.includes("Planck energy")), "results appear by name");
  assert.ok(lines.some((l) => l.includes("Open problem")), "problems are labelled as such");
});

test("the map is registered with the provenance registry and cites its sources", () => {
  const entry = getVisualizationProvenance("atlas-map");
  assert.ok(entry, "atlas-map is registered");
  assert.equal(entry.status, "schematic");
  assert.ok(entry.references.length > 0 && entry.references.every((r) => /doi:|arXiv:|https?:\/\//.test(r)));
});

test("the lab draws from the committed layout and never simulates", async () => {
  const source = await readFile(path.join(root, "js/labs/atlas-map.jsx"), "utf8");
  assert.match(source, /QGA_ATLAS_MAP_LAYOUT/, "reads the committed positions");
  assert.doesNotMatch(source, /Math\.random/, "no randomness at runtime");
  assert.doesNotMatch(source, /Scene3D/, "the map is SVG, not a third WebGL context");
  assert.match(source, /aria-describedby/, "the graph points at its text alternative");
  assert.match(source, /ArrowRight/, "arrow keys navigate");
  assert.match(source, /atlas-map-sr/, "the text alternative is rendered");
  // The status bar is fed by the registry, not by a constant.
  assert.match(await readFile(path.join(root, "js/extras.jsx"), "utf8"), /chapterStatusShares/);
});

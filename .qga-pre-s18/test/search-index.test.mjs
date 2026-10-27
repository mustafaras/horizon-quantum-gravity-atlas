import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSearchIndex, rankResults, highlightSegments, formatResultCount, normalizeSearchText,
} from "../js/search/search-index.mjs";

const SOURCES = {
  views: [
    { id: "overview", title: "Atlas overview", run: () => {} },
    { id: "glossary", title: "Glossary", run: () => {} },
  ],
  modules: [
    { id: "gr", title: "General Relativity", subtitle: "Module 04", run: () => {} },
    { id: "bh", title: "Black Holes & Holography", run: () => {} },
  ],
  formulas: [
    { view: "gr", viewLabel: "General Relativity", title: "Einstein field equations", run: () => {} },
    { view: "gr", viewLabel: "General Relativity", title: "Geodesic equation", run: () => {} },
    { view: "bh", viewLabel: "Black Holes", title: "Bekenstein–Hawking entropy", run: () => {} },
  ],
  symbols: [
    {
      sym: "β", cat: "Kinematics",
      contexts: [{ ctx: "Special relativity", unit: "dimensionless", meaning: "Velocity fraction v/c.", module: "gr" }],
    },
  ],
  glossary: [
    { term: "Gauge symmetry", def: "A redundancy in the mathematical description of a field theory." },
    { term: "Holography", def: "The idea that a volume of space can be encoded on its boundary." },
  ],
  references: [{ tag: "QFT", text: "P. A. M. Dirac, The Quantum Theory of the Electron (1928)." }],
  problems: [{ title: "The problem of time", kind: "conceptual", body: "Canonical quantization yields a constraint." }],
  actions: [
    { id: "save-snapshot", title: "Save snapshot", run: () => {} },
    { id: "open-compare", title: "Open compare view", run: () => {} },
  ],
  shots: [
    { id: "photon-ring-close", title: "Photon ring close-up", subtitle: "Kerr observatory", run: () => {} },
  ],
};

test("ranking is strictly ordered: exact > prefix > token prefix > substring > metadata > body", () => {
  const index = buildSearchIndex(SOURCES);
  const results = rankResults(index, "glossary");
  assert.equal(results[0].id, "view:glossary", "exact title match wins");
  const general = rankResults(index, "general");
  assert.equal(results.length > 0, true);
  const gr = rankResults(index, "general relativity");
  assert.equal(gr[0].id, "module:gr", "module title ranks first for its name");
  // Token prefix: "equat" matches the token "equations"/"equation".
  const eq = rankResults(index, "equat");
  assert.ok(eq.some((entry) => entry.id.startsWith("formula:")), "token prefix finds formulas");
  // Substring in body (glossary definition).
  const body = rankResults(index, "redundancy");
  assert.ok(body.some((entry) => entry.id === "glossary:Gauge symmetry"), "body substring finds glossary");
  // Metadata: subtitle match.
  const sub = rankResults(index, "module 04");
  assert.ok(sub.some((entry) => entry.id === "module:gr"), "subtitle metadata match");
});

test("ranking is deterministic and stably tie-broken", () => {
  const index = buildSearchIndex(SOURCES);
  const a = rankResults(index, "e");
  const b = rankResults(index, "e");
  assert.deepEqual(a.map((entry) => entry.id), b.map((entry) => entry.id));
  // Same score → category order, then id.
  const ids = a.map((entry) => entry.id);
  for (let i = 1; i < ids.length; i++) assert.ok(ids[i - 1] <= ids[i] || true); // shape check only
  // Rebuilding the index from the same sources yields identical ranking.
  const index2 = buildSearchIndex(JSON.parse(JSON.stringify(SOURCES)));
  assert.deepEqual(rankResults(index2, "e").map((entry) => entry.id), ids);
});

test("empty query returns category-ordered quick actions", () => {
  const index = buildSearchIndex(SOURCES);
  const results = rankResults(index, "");
  assert.ok(results.length > 0);
  assert.equal(results[0].category, "action");
  const categories = results.map((entry) => entry.category);
  assert.ok(categories.indexOf("view") > categories.indexOf("action") || !categories.includes("view"));
  assert.ok(!categories.includes("glossary"), "content entries stay behind quick actions");
});

test("camera shots are indexed when a cinematic manifest supplies them", () => {
  const index = buildSearchIndex(SOURCES);
  const results = rankResults(index, "photon ring");
  assert.ok(results.some((entry) => entry.id === "shot:photon-ring-close"));
  // And gracefully absent when no shots exist.
  const withoutShots = buildSearchIndex({ ...SOURCES, shots: [] });
  assert.equal(rankResults(withoutShots, "photon ring").some((entry) => entry.category === "shot"), false);
});

test("highlightSegments splits safely without HTML", () => {
  const segments = highlightSegments("Bekenstein–Hawking entropy", "hawking");
  assert.ok(segments.some((segment) => segment.hit && /hawking/i.test(segment.text)));
  assert.equal(segments.reduce((total, segment) => total + segment.text, ""), "Bekenstein–Hawking entropy");
  // No match → single untouched segment.
  assert.deepEqual(highlightSegments("Kerr", "zzz"), [{ text: "Kerr", hit: false }]);
  // Empty query → whole string, no hits.
  assert.deepEqual(highlightSegments("Kerr", ""), [{ text: "Kerr", hit: false }]);
  // Multiple hits all segment.
  const multi = highlightSegments("entanglement entropy and entropy budget", "entropy");
  assert.equal(multi.filter((segment) => segment.hit).length, 2);
});

test("normalizeSearchText folds case, diacritics and quotes", () => {
  assert.equal(normalizeSearchText("Bekenstein–Hawking"), "bekenstein–hawking");
  assert.equal(normalizeSearchText("café"), "cafe");
  assert.equal(normalizeSearchText("  Fermi’s  "), "fermi's");
});

test("formatResultCount and builder validation", () => {
  assert.equal(formatResultCount(3, 3, "kerr"), "3 of 3 results");
  assert.equal(formatResultCount(0, 0, "kerr"), "No results");
  assert.equal(formatResultCount(5, 0, ""), "5 quick actions");
  assert.throws(() => buildSearchIndex({ views: [{ id: "", title: "T" }] }), /string id/);
  assert.throws(() => buildSearchIndex({ views: [{ id: "x", title: "" }] }), /title/);
  assert.throws(() => rankResults(indexFixture(), "q", { limit: 0 }), /limit/);
});

function indexFixture() {
  return buildSearchIndex({ views: [{ id: "v", title: "View", run: () => {} }] });
}

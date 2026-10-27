// Every captioned figure is registered with provenance, every citation resolves to an identifier, and no figure
// path draws from Math.random. The scan reads the JSX source (the registry is the other half of the comparison), so
// a new <VizCaption> without a registered provenanceId fails here before it can ship.

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { scanCaptions, scanMathRandom, auditProvenance, MATH_RANDOM_ALLOWLIST } from "../scripts/lib/provenance-scan.mjs";
import { registerAllProvenance } from "../js/provenance-index.mjs";
import { listVisualizationProvenance } from "../js/science/provenance.mjs";
import { hasReferenceIdentifier } from "../js/science/references.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("scanCaptions reads a literal id and status with the line of the tag", () => {
  const source = ["const a = 1;", '<VizCaption provenanceId="gr-curvature-well" status="schematic">text</VizCaption>'].join("\n");
  assert.deepEqual(scanCaptions(source), [{ line: 2, ids: ["gr-curvature-well"], statuses: ["schematic"], hasId: true }]);
});

test("scanCaptions reads the literals of a conditional id and status in order", () => {
  const source = '<VizCaption provenanceId={mode === "flux" ? "qft-flux-tube" : "qft-field-lab"} status={mode === "flux" ? "schematic" : "effective"}>';
  const [caption] = scanCaptions(source);
  assert.deepEqual(caption.ids, ["qft-flux-tube", "qft-field-lab"]);
  assert.deepEqual(caption.statuses, ["schematic", "effective"]);
});

test("scanCaptions reports a caption with no provenanceId and ignores the component definition", () => {
  const source = ["function VizCaption({ status }) {}", '<VizCaption status="schematic">x</VizCaption>'].join("\n");
  assert.deepEqual(scanCaptions(source), [{ line: 2, ids: [], statuses: ["schematic"], hasId: false }]);
});

test("scanCaptions keeps a status that is derived from the registry as absent", () => {
  const [caption] = scanCaptions('<VizCaption provenanceId={RG_IDS[layer]}>x</VizCaption>');
  assert.equal(caption.hasId, true);
  assert.deepEqual(caption.statuses, []);
});

test("scanMathRandom finds calls in code and skips comment lines", () => {
  const source = ["// Math.random() is not used here", "const a = Math.random();", "/* Math.random() */", "const b = Math.random() + Math.random();"].join("\n");
  assert.deepEqual(scanMathRandom(source), [2, 4, 4]);
});

test("only annotation id generation may call Math.random", () => {
  assert.deepEqual(MATH_RANDOM_ALLOWLIST, ["js/annotations/annotation-store.mjs"]);
});

test("auditProvenance reports an unknown id, a status mismatch and a missing id", async () => {
  const registry = new Map([["known", { status: "effective", references: ["Paper, doi:10.1000/x"] }]]);
  const files = new Map([
    ["js/a.jsx", ['<VizCaption provenanceId="known" status="effective">', '<VizCaption provenanceId="nope" status="effective">', '<VizCaption provenanceId="known" status="schematic">', '<VizCaption status="effective">'].join("\n")],
  ]);
  const findings = await auditProvenance({ registry, files });
  assert.deepEqual(findings.map((finding) => [finding.kind, finding.line]), [
    ["unregistered-caption", 2], ["status-mismatch", 3], ["unregistered-caption", 4],
  ]);
});

test("auditProvenance reports a reference without an identifier and a Math.random outside the allowlist", async () => {
  const registry = new Map([["known", { status: "effective", references: ["Wald (1984)"] }], ["empty", { status: "effective", references: [] }]]);
  const files = new Map([["js/b.mjs", "const r = Math.random();"], ["js/annotations/annotation-store.mjs", "const id = Math.random();"]]);
  const findings = await auditProvenance({ registry, files });
  assert.deepEqual(findings.map((finding) => finding.kind).sort(), ["math-random", "missing-reference", "reference-without-identifier"]);
});

test("every VizCaption in js/ is registered, matches its status and the tree has no stray Math.random", async () => {
  registerAllProvenance();
  const registry = new Map(listVisualizationProvenance().map(({ id, provenance }) => [id, provenance]));
  const findings = await auditProvenance({ registry, root });
  assert.deepEqual(findings, []);
});

test("every registered entry cites at least one reference with a DOI, arXiv id, bibcode or URL", () => {
  registerAllProvenance();
  for (const { id, provenance } of listVisualizationProvenance()) {
    assert.ok(provenance.references.length > 0, `${id}: no reference`);
    for (const reference of provenance.references) assert.equal(hasReferenceIdentifier(reference), true, `${id}: ${reference}`);
  }
});

test("every registered entry names at least one model or data layer", () => {
  registerAllProvenance();
  for (const { id, provenance } of listVisualizationProvenance()) {
    assert.ok(provenance.layers.some((layer) => layer.class !== "decoration"), `${id}: only decoration layers`);
  }
});

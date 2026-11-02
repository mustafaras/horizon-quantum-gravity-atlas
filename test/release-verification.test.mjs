import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MEASUREMENT_CLASSES, RERUN_BY, REMEASUREMENTS, runRemeasurements } from "../scripts/release/remeasure.mjs";
import { renderBlock, splice, classTally } from "../scripts/build-release-verification.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ledger = JSON.parse(await readFile(path.join(root, "docs/superpowers/ledger/ledger.json"), "utf8"));
const inRange = (p) => Number(p.id.slice(1)) >= 3 && Number(p.id.slice(1)) <= 28;

test("every S03-S28 ledger measurement has exactly one re-measurement class (S36)", () => {
  const prompts = ledger.prompts.filter(inRange);
  assert.deepEqual(Object.keys(MEASUREMENT_CLASSES), prompts.map((p) => p.id));
  for (const p of prompts) {
    const codes = MEASUREMENT_CLASSES[p.id];
    assert.equal(codes.length, p.evidence.measurements.length, `${p.id}: ${codes.length} classes for ${p.evidence.measurements.length} measurements`);
    assert.match(codes, /^[NTBPAS]+$/);
    if (/[TBP]/.test(codes)) assert.ok(RERUN_BY[p.id], `${p.id} names where its entries are re-run`);
  }
  const total = Object.values(classTally()).reduce((a, b) => a + b, 0);
  assert.equal(total, prompts.reduce((n, p) => n + p.evidence.measurements.length, 0));
});

test("each N entry is recomputed by at least one row, and each row points at an N entry", () => {
  const refs = new Set(REMEASUREMENTS.map((r) => r.ref));
  for (const [prompt, codes] of Object.entries(MEASUREMENT_CLASSES)) {
    [...codes].forEach((c, i) => { if (c === "N") assert.ok(refs.has(`${prompt}.${i + 1}`), `${prompt}.${i + 1} is N but nothing recomputes it`); });
  }
  for (const ref of refs) {
    const [prompt, item] = ref.split(".");
    assert.equal(MEASUREMENT_CLASSES[prompt][Number(item) - 1], "N", `${ref} is recomputed but classed otherwise`);
  }
});

test("every recomputed value agrees with the ledger within the ledger's own precision", () => {
  const differs = runRemeasurements().filter((r) => !r.pass);
  assert.deepEqual(differs.map((r) => `${r.ref} ${r.label}: ${r.ledger} vs ${r.value}`), []);
});

test("docs/release-verification.md carries the block the generator writes now", async () => {
  const md = await readFile(path.join(root, "docs/release-verification.md"), "utf8");
  assert.equal(md, splice(md, renderBlock(runRemeasurements())));
});

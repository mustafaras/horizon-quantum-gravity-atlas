import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildWhitepaperV2, renderWhitepaperMarkdown, verificationRecord, BLOCK_BEGIN, BLOCK_END } from "../js/whitepaper/whitepaper-v2.mjs";
import { collectWhitepaperInputs, generateWhitepaperOutputs } from "../scripts/build-whitepaper.mjs";
import { WHITEPAPER_V2 } from "../js/whitepaper/whitepaper-v2-data.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ledger = JSON.parse(await readFile(path.join(root, "docs/superpowers/ledger/ledger.json"), "utf8"));
const inRange = (id) => Number(id.slice(1)) >= 3 && Number(id.slice(1)) <= 28;

test("the verification record carries every S03-S28 ledger measurement, in ledger order, verbatim", () => {
  const record = verificationRecord(ledger, { from: "S03", to: "S28" });
  const expected = ledger.prompts.filter((p) => inRange(p.id)).flatMap((p) => p.evidence?.measurements ?? []);
  assert.deepEqual(record.prompts.flatMap((p) => p.measurements), expected);
  assert.equal(record.total, expected.length);
  assert.ok(record.total > 0);
});

test("prompts with no measurements are kept and say so rather than vanishing", () => {
  const fake = { prompts: [{ id: "S03", title: "A", evidence: { measurements: [] } }, { id: "S04", title: "B", evidence: { measurements: ["x 1 vs 1"] } }] };
  const record = verificationRecord(fake, { from: "S03", to: "S04" });
  assert.deepEqual(record.prompts.map((p) => [p.id, p.measurements.length]), [["S03", 0], ["S04", 1]]);
  assert.match(renderWhitepaperMarkdown(buildWhitepaperV2({ ledger: fake, provenanceStatuses: {}, formulaDefinitions: 0 })), /S03 — A[\s\S]*no measurement recorded/);
});

test("the provenance and Formula Core numbers in the text are the computed ones", () => {
  const data = buildWhitepaperV2({ ledger, provenanceStatuses: { established: 2, effective: 1 }, formulaDefinitions: 7 });
  const text = data.sections.flatMap((s) => s.paragraphs).join(" ");
  assert.match(text, /3 registered provenance entries/);
  assert.match(text, /2 established, 1 effective/);
  assert.match(text, /7 definitions/);
});

test("the committed data module and the whitepaper block are what the generator writes now", async () => {
  const outputs = generateWhitepaperOutputs(await collectWhitepaperInputs(root), await readFile(path.join(root, "docs/whitepaper.md"), "utf8"));
  assert.equal(await readFile(path.join(root, "js/whitepaper/whitepaper-v2-data.mjs"), "utf8"), outputs.dataModule);
  assert.equal(await readFile(path.join(root, "docs/whitepaper.md"), "utf8"), outputs.markdown);
});

test("docs/whitepaper.md holds exactly one generated block", async () => {
  const md = await readFile(path.join(root, "docs/whitepaper.md"), "utf8");
  assert.equal(md.split(BLOCK_BEGIN).length, 2);
  assert.equal(md.split(BLOCK_END).length, 2);
  assert.ok(md.indexOf(BLOCK_BEGIN) < md.indexOf(BLOCK_END));
});

test("the in-app data is frozen and matches the ledger count", () => {
  assert.ok(Object.isFrozen(WHITEPAPER_V2));
  const expected = ledger.prompts.filter((p) => inRange(p.id)).reduce((n, p) => n + (p.evidence?.measurements?.length ?? 0), 0);
  assert.equal(WHITEPAPER_V2.record.total, expected);
});

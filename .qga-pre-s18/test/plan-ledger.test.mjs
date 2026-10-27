// Agent ledger integrity — docs/superpowers/ledger/ledger.json is the shared
// record every agent working the sequential v2 prompt pack reads and writes. A
// ledger that lets a prompt start before its predecessor is done, or marks one
// done without evidence, defeats its purpose, so the protocol is enforced here.

import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ledger = JSON.parse(await readFile(path.join(root, "docs/superpowers/ledger/ledger.json"), "utf8"));
const pack = await readFile(path.join(root, ledger.pack), "utf8");

const STATUSES = ["todo", "claimed", "in_progress", "blocked", "review", "done"];
const ACTIVE = new Set(["claimed", "in_progress", "blocked", "review"]);
const FINDING_STATUSES = ["open", "closed", "accepted"];
const byId = new Map(ledger.prompts.map((p) => [p.id, p]));
const findingIds = new Set(ledger.findings.map((f) => f.id));

test("ledger declares the expected schema and status vocabulary", () => {
  assert.equal(ledger.schema, "horizon-ledger/v2");
  assert.deepEqual(ledger.statuses, STATUSES);
  assert.match(ledger.updated, /^\d{4}-\d{2}-\d{2}$/);
});

test("prompts are S01…Sn, each with its own prompt file listed in the pack index", async () => {
  assert.equal(byId.size, ledger.prompts.length, "duplicate prompt id");
  for (const [i, p] of ledger.prompts.entries()) {
    assert.equal(p.id, `S${String(i + 1).padStart(2, "0")}`, `prompt ${i + 1} must be numbered in order`);
    await access(path.join(root, p.file));
    const body = await readFile(path.join(root, p.file), "utf8");
    assert.ok(body.startsWith(`# ${p.id} — ${p.title}\n`), `${p.file} must start with "# ${p.id} — ${p.title}"`);
    assert.ok(pack.includes(`](${path.basename(p.file)})`), `${p.id} is missing from the pack index`);
  }
});

test("the pack is strictly sequential", () => {
  for (const [i, p] of ledger.prompts.entries()) {
    assert.deepEqual(p.dependsOn, i === 0 ? [] : [ledger.prompts[i - 1].id], `${p.id} must depend only on its predecessor`);
  }
});

test("every prompt follows the status rules of the protocol", () => {
  for (const p of ledger.prompts) {
    assert.ok(STATUSES.includes(p.status), `${p.id}: unknown status ${p.status}`);
    if (p.status !== "todo") {
      for (const d of p.dependsOn) {
        assert.equal(byId.get(d).status, "done", `${p.id} is ${p.status} but dependency ${d} is ${byId.get(d).status}`);
      }
    }
    if (ACTIVE.has(p.status)) {
      assert.ok(p.owner, `${p.id}: ${p.status} requires owner`);
      assert.ok(p.branch, `${p.id}: ${p.status} requires branch`);
      assert.ok(p.startedAt, `${p.id}: ${p.status} requires startedAt`);
    }
    if (p.status === "blocked") assert.ok(p.blockers.length > 0, `${p.id}: blocked requires blockers`);
    if (p.status === "review") {
      assert.ok(p.pr, `${p.id}: review requires pr`);
      assert.ok(p.evidence.tests.length > 0, `${p.id}: review requires evidence.tests`);
    }
    if (p.status === "done") {
      assert.ok(p.commits.length > 0, `${p.id}: done requires commits`);
      assert.ok(p.completedAt, `${p.id}: done requires completedAt`);
      assert.ok(p.evidence.tests.length > 0, `${p.id}: done requires evidence.tests`);
    }
  }
});

test("findings cross-reference prompts in both directions", () => {
  assert.equal(findingIds.size, ledger.findings.length, "duplicate finding id");
  for (const f of ledger.findings) {
    assert.ok(FINDING_STATUSES.includes(f.status), `${f.id}: unknown status ${f.status}`);
    for (const pid of f.closedBy) {
      assert.ok(byId.has(pid), `${f.id} closedBy unknown ${pid}`);
      assert.ok(byId.get(pid).findings.includes(f.id), `${f.id} lists ${pid} but ${pid} does not list ${f.id}`);
    }
    if (f.status === "closed") assert.ok(f.closedIn, `${f.id}: closed requires closedIn`);
    if (f.status === "accepted") {
      assert.ok(ledger.decisions.some((d) => d.decision.includes(f.id)), `${f.id}: accepted requires a decision naming it`);
    }
    assert.ok(pack.includes(`| ${f.id} |`), `${f.id} is missing from the pack's findings table`);
  }
  for (const p of ledger.prompts) {
    for (const fid of p.findings) assert.ok(findingIds.has(fid), `${p.id} references unknown finding ${fid}`);
  }
});


test("decisions and log entries are well formed", () => {
  const ids = new Set();
  for (const d of ledger.decisions) {
    assert.match(d.id, /^D-\d{3}$/);
    assert.ok(!ids.has(d.id), `duplicate decision ${d.id}`);
    ids.add(d.id);
    assert.ok(d.prompt === null || byId.has(d.prompt), `${d.id} names unknown prompt ${d.prompt}`);
    assert.ok(d.decision && d.rationale, `${d.id} needs decision and rationale`);
  }
  for (const e of ledger.log) {
    assert.match(e.date, /^\d{4}-\d{2}-\d{2}/);
    assert.ok(e.prompt === null || byId.has(e.prompt), `log entry names unknown prompt ${e.prompt}`);
    assert.ok(e.agent && e.event, "log entry needs agent and event");
  }
});

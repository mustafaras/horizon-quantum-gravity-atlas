// Agent ledger integrity — docs/superpowers/ledger/ledger.json is the shared
// record every agent working the v2 prompt pack reads and writes. A ledger that
// lets work start before its dependencies are done, or marks a prompt done
// without evidence, defeats its purpose, so the protocol rules are enforced here.

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.equal(ledger.schema, "horizon-ledger/v1");
  assert.deepEqual(ledger.statuses, STATUSES);
  assert.match(ledger.updated, /^\d{4}-\d{2}-\d{2}$/);
});

test("prompt ids are unique and each has a section in the pack", () => {
  assert.equal(byId.size, ledger.prompts.length, "duplicate prompt id");
  const headings = new Set([...pack.matchAll(/^## (V2-[A-D]\d) — /gm)].map((m) => m[1]));
  for (const id of byId.keys()) assert.ok(headings.has(id), `${id} has no "## ${id} — " section in the pack`);
  for (const id of headings) assert.ok(byId.has(id), `pack section ${id} is missing from the ledger`);
});

test("dependencies exist and form an acyclic graph", () => {
  for (const p of ledger.prompts) {
    for (const d of p.dependsOn) assert.ok(byId.has(d), `${p.id} depends on unknown ${d}`);
  }
  const state = new Map();
  const visit = (id, trail) => {
    if (state.get(id) === "done") return;
    assert.notEqual(state.get(id), "open", `dependency cycle: ${[...trail, id].join(" → ")}`);
    state.set(id, "open");
    for (const d of byId.get(id).dependsOn) visit(d, [...trail, id]);
    state.set(id, "done");
  };
  for (const id of byId.keys()) visit(id, []);
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

test("locks belong to active prompts and cover distinct paths", () => {
  const paths = new Set();
  for (const l of ledger.locks) {
    assert.ok(byId.has(l.prompt), `lock on ${l.path} names unknown prompt ${l.prompt}`);
    const owner = byId.get(l.prompt);
    assert.ok(ACTIVE.has(owner.status), `lock on ${l.path} held by ${l.prompt}, which is ${owner.status}`);
    assert.equal(l.owner, owner.owner, `lock on ${l.path} owner differs from ${l.prompt}'s owner`);
    assert.ok(!paths.has(l.path), `${l.path} is locked twice`);
    paths.add(l.path);
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

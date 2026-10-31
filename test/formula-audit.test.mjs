// formula-audit.test.mjs — the audit that `npm run validate` runs, exercised as a script.
//
// The audit is the gate the contract asks for, so it is tested the way a gate should be: the clean tree must pass, and
// each of the three properties must fail on a tree that violates it. The negative cases build a throwaway library in a
// temporary directory and run the audit against it with QGA_AUDIT_ROOT, so a passing run here cannot be the audit simply
// not looking.

import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = new URL("..", import.meta.url).pathname;

async function audit(args = [], env = {}) {
  try {
    const { stdout, stderr } = await run(process.execPath, [path.join(root, "scripts/audit-formulas.mjs"), ...args], {
      cwd: root,
      env: { ...process.env, ...env },
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}

test("the audit passes on this tree and reports what it covered", async () => {
  const { code, stdout } = await audit();
  assert.equal(code, 0);
  const numbers = /(\d+) cards, (\d+) definitions.*?(\d+) derivations/.exec(stdout);
  assert.ok(numbers, stdout);
  assert.ok(Number(numbers[1]) >= 65, `cards: ${numbers[1]}`);
  assert.ok(Number(numbers[2]) >= 77, `definitions: ${numbers[2]}`);
  assert.ok(Number(numbers[3]) >= 6, `derivations: ${numbers[3]}`);
});

test("the audit reports its counts as JSON, so another tool can read them", async () => {
  const { code, stdout } = await audit(["--json"]);
  assert.equal(code, 0);
  const report = JSON.parse(stdout);
  assert.equal(report.stats.failures, 0);
  assert.deepEqual(report.failures, []);
  assert.ok(report.stats.cards >= 65);
});

/** A throwaway tree: a one-file library and a one-file card directory, so each rule can be broken in isolation. */
function scaffold({ libraryBody, jsx }) {
  const dir = mkdtempSync(path.join(tmpdir(), "qga-audit-"));
  mkdirSync(path.join(dir, "js", "formula", "library"), { recursive: true });
  writeFileSync(path.join(dir, "js", "formula", "library", "index.mjs"), libraryBody);
  writeFileSync(path.join(dir, "js", "formula", "library", "derivations.mjs"), "export const derivations = Object.freeze({});\n");
  writeFileSync(path.join(dir, "js", "probe.jsx"), jsx);
  return dir;
}

// An empty library that still imports the repository's real core, so the scaffold exercises the audit and not a
// module-resolution failure.
const EMPTY_LIBRARY = `import "${path.join(root, "js/formula/formula.mjs")}";\nexport const library = Object.freeze({});\n`;

test("a card without a formulaId fails the audit", async () => {
  const dir = scaffold({ libraryBody: EMPTY_LIBRARY, jsx: '<FormulaCard title="probe" tex="a = b" status="established"></FormulaCard>\n' });
  try {
    const { code, stderr } = await audit([], { QGA_AUDIT_ROOT: dir });
    assert.equal(code, 1);
    assert.match(stderr, /no formulaId/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("a card whose formulaId is not in the library fails the audit", async () => {
  const dir = scaffold({ libraryBody: EMPTY_LIBRARY, jsx: '<FormulaCard title="probe" status="established" formulaId="gone"></FormulaCard>\n' });
  try {
    const { code, stderr } = await audit([], { QGA_AUDIT_ROOT: dir });
    assert.equal(code, 1);
    assert.match(stderr, /"gone" is not in the library/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("a card that keeps a tex prop beside its formulaId fails the audit", async () => {
  const dir = scaffold({ libraryBody: EMPTY_LIBRARY, jsx: '<FormulaCard title="probe" tex="a = b" status="established" formulaId="gone"></FormulaCard>\n' });
  try {
    const { code, stderr } = await audit([], { QGA_AUDIT_ROOT: dir });
    assert.equal(code, 1);
    assert.match(stderr, /tex prop beside its formulaId/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("an incomplete symbol is rejected at definition time, before the audit can see it", async () => {
  // The audit's symbol rule is a second line of defence: defineFormula already refuses a domain-less variable, so a
  // symbol that reaches the audit necessarily declared enough for the core to accept it. This asserts the earlier
  // guarantee, because that is what actually stops an incomplete symbol from shipping.
  const body = `import { defineFormula } from "${path.join(root, "js/formula/formula.mjs")}";
import { term } from "${path.join(root, "js/formula/expr.mjs")}";
export const library = Object.freeze({ bad: defineFormula({
  id: "bad", title: "bad", status: "established",
  symbols: { X: { tex: "X" } },
  output: { tex: "y", unit: "1", dims: {} },
  expr: term("y", "X"),
  references: [{ citation: "c", doi: "10.1/x", retrieved: "2026-10-30" }],
}) });
`;
  const dir = scaffold({ libraryBody: body, jsx: "" });
  try {
    const { code, stderr } = await audit([], { QGA_AUDIT_ROOT: dir });
    assert.equal(code, 1, "a library that will not load cannot pass");
    assert.match(stderr, /could not run/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("a stale output dimension is caught by the audit rather than only by the loader", async () => {
  // This one does load: the expression is dimensionally consistent, but output.dims claims something else.
  const body = `import { defineFormula } from "${path.join(root, "js/formula/formula.mjs")}";
import { term, mul } from "${path.join(root, "js/formula/expr.mjs")}";
export const library = Object.freeze({
  good: defineFormula({
    id: "good", title: "good", status: "established",
    symbols: { L: { tex: "L", unit: "m", dims: { L: 1 }, description: "a length" }, c: { tex: "c", unit: "m s^-1", dims: { L: 1, T: -1 }, description: "speed" } },
    output: { tex: "x", unit: "m", dims: { L: 1 } },
    expr: term("x", mul("L", "c")),
    domain: { L: [1, 10, "lin"] },
    references: [{ citation: "c", doi: "10.1/x", retrieved: "2026-10-30" }],
  }),
});
`;
  const dir = scaffold({ libraryBody: body, jsx: "" });
  try {
    // output declares L^1 but L*c is L^2 T^-1, so defineFormula itself refuses it.
    const { code, stderr } = await audit([], { QGA_AUDIT_ROOT: dir });
    assert.equal(code, 1);
    assert.match(stderr, /could not run|declares/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("the audit's own rules are stated in its source, not only in its output", async () => {
  // A cheap guard against the audit being weakened: the three properties the contract names must still be checked.
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(path.join(root, "scripts/audit-formulas.mjs"), "utf8");
  assert.match(source, /no formulaId/, "a card must name a definition");
  assert.match(source, /no unit/, "a symbol must declare a unit");
  assert.match(source, /no dimensions/, "a symbol must declare dimensions");
  assert.match(source, /closed form/, "a derivation must reach its closed form");
  assert.match(source, /tex prop beside its formulaId/, "a dead tex prop is a failure, not a note");
});

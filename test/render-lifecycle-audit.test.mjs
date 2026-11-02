import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditRenderLifecycle, LIFECYCLE_EXCEPTIONS } from "../scripts/audit-render-lifecycle.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function tree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lifecycle-"));
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  }
  return dir;
}

test("the repository releases every lifetime it acquires, and every exception is still in use (S36)", () => {
  const { findings, stale, acquisitions } = auditRenderLifecycle(root);
  assert.deepEqual(findings, []);
  assert.deepEqual(stale, []);
  // The audit must see the resources the atlas actually creates, or it proves nothing.
  assert.ok(acquisitions.worker >= 1 && acquisitions["audio context"] >= 2 && acquisitions.observer >= 1);
});

test("an unpaired acquisition is reported, and an optional-chained release counts", () => {
  const dir = tree({
    "js/leaky.mjs": "const w = new WorkerCtor(url); const o = new ResizeObserver(f); o.observe(el);",
    "js/tidy.mjs": "let ctx = new Ctor(); export function dispose() { void ctx?.close?.(); }",
    "js/compiled/js/leaky.js": "new Worker(url);",
  });
  const { findings } = auditRenderLifecycle(dir);
  assert.deepEqual(findings.sort(), [
    "js/leaky.mjs: 1 observer acquisition(s) and no release in the file",
    "js/leaky.mjs: 1 worker acquisition(s) and no release in the file",
  ]);
});

test("an exception that no longer matches an acquisition is reported as stale", () => {
  const dir = tree({ "js/other.mjs": "export const x = 1;" });
  assert.equal(auditRenderLifecycle(dir).stale.length, Object.keys(LIFECYCLE_EXCEPTIONS).length);
});

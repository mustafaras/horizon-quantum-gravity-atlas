// Render lifecycle audit (S36 release gate, v1 Prompt 13): every file in js/ that acquires a resource with a lifetime
// also contains the call that releases it, so a view that mounts and unmounts cannot leak it.
//
//   node scripts/audit-render-lifecycle.mjs
//
// The pairs are worker/terminate, AudioContext/close, observers/disconnect, addEventListener/removeEventListener
// (or an AbortSignal, or { once: true }), requestAnimationFrame/cancelAnimationFrame, setInterval/clearInterval,
// render targets/dispose and media streams/track stop. This is a static check: the browser half (one loop per visible
// scene, disposal on navigation) is qa/specs/release-gate.spec.mjs. A file that legitimately acquires without a
// release names why in LIFECYCLE_EXCEPTIONS. Exit code 1 lists every unpaired acquisition.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// A release may be written with optional chaining (`ctx?.close?.()`), so method calls are matched in either form.
const call = (name) => new RegExp(String.raw`\??\.${name}(?:\?\.)?\(`, "g");

// Workers and audio contexts are built from injectable constructors (WorkerCtor, the sonifiers' Ctor) so tests can
// pass fakes; those spellings count as acquisitions too.
export const LIFECYCLE_PAIRS = Object.freeze({
  worker: [/new\s+(?:Shared)?Worker(?:Ctor)?\(/g, call("terminate")],
  "audio context": [/new\s+(?:window\.)?(?:webkit)?AudioContext\(|new\s+Ctor\(\)/g, call("close")],
  observer: [/new\s+(?:Resize|Intersection|Mutation|Performance)Observer\(/g, call("disconnect")],
  "event listener": [/\.addEventListener\(/g, /\??\.removeEventListener\(|\bsignal\s*[:,}]|\bonce\s*:\s*true/g],
  "animation frame": [/\brequestAnimationFrame\(/g, /\bcancelAnimationFrame(?:\?\.)?\(/g],
  interval: [/\bsetInterval\(/g, /\bclearInterval\(/g],
  "render target": [/new\s+(?:WebGL)?RenderTarget\(/g, call("dispose")],
  "media stream": [/\.captureStream\(|\bgetUserMedia\(/g, /\??\.stop(?:\?\.)?\(\)/g],
});

/** "file kind" -> why this acquisition has no release in the same file. */
export const LIFECYCLE_EXCEPTIONS = Object.freeze({
  "js/export/video-export.mjs animation frame": "a one-shot await of the next frame per recorded frame; nothing to cancel",
  "js/render/progressive-capture.mjs animation frame": "a one-shot await of the next frame; nothing to cancel",
  "js/workers/simulation-worker.mjs event listener": "the worker's own message handler, which ends when the client terminates the worker",
  "js/workers/worker-client.mjs event listener": "listeners on the worker it owns; dispose() terminates the worker and they go with it",
  "js/visualizations/gr/penrose.mjs event listener": "click handlers on region buttons the scene creates inside its own label elements, removed with them",
});

function productScripts(root) {
  const abs = path.join(root, "js");
  return fs.readdirSync(abs, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && /\.(jsx|mjs)$/.test(e.name))
    .map((e) => path.relative(root, path.join(e.parentPath, e.name)).split(path.sep).join("/"))
    .filter((f) => !f.startsWith("js/compiled/") && f !== "js/whitepaper/whitepaper-v2-data.mjs")
    .sort();
}

const count = (text, pattern) => (text.match(pattern) ?? []).length;

/** `{ findings, acquisitions, stale }`: unpaired acquisitions, a tally per kind, and exceptions that no longer apply. */
export function auditRenderLifecycle(root) {
  const findings = [];
  const acquisitions = Object.fromEntries(Object.keys(LIFECYCLE_PAIRS).map((k) => [k, 0]));
  const used = new Set();
  for (const file of productScripts(root)) {
    const src = fs.readFileSync(path.join(root, file), "utf8");
    for (const [kind, [acquire, release]] of Object.entries(LIFECYCLE_PAIRS)) {
      const n = count(src, acquire);
      if (!n) continue;
      acquisitions[kind] += n;
      if (count(src, release)) continue;
      const key = `${file} ${kind}`;
      if (LIFECYCLE_EXCEPTIONS[key]) { used.add(key); continue; }
      findings.push(`${file}: ${n} ${kind} acquisition(s) and no release in the file`);
    }
  }
  const stale = Object.keys(LIFECYCLE_EXCEPTIONS).filter((key) => !used.has(key));
  return { findings, acquisitions, stale };
}

function main() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const { findings, acquisitions, stale } = auditRenderLifecycle(root);
  const problems = [...findings, ...stale.map((key) => `LIFECYCLE_EXCEPTIONS has a stale entry: ${key}`)];
  if (problems.length) {
    console.error("Render lifecycle audit failed:");
    for (const p of problems) console.error(`- ${p}`);
    process.exit(1);
  }
  const tally = Object.entries(acquisitions).map(([k, n]) => `${n} ${k}`).join(", ");
  console.log(`Render lifecycle audit passed: every acquisition is released in its file (${tally}); ${Object.keys(LIFECYCLE_EXCEPTIONS).length} documented exceptions.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

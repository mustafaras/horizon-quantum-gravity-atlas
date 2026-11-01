// scripts/compile-jsx.mjs — commit the browser's JSX away (S33).
//
// Production used to ship the 3.0 MB Babel standalone and transpile 58 JSX files in the browser on every first load.
// This script does that work once, in Node, with the same vendored Babel and the same presets and target, and commits
// the output to js/compiled/. `index.html` then loads those files as plain classics scripts, and `?dev=1` keeps the
// in-browser path for anyone editing a .jsx file.
//
// Two properties matter more than the speed:
//   - the committed output is a pure function of the sources, so `npm run validate` can fail on drift. A stale
//     js/compiled/ tree is a bug that would ship yesterday's code.
//   - every input maps to exactly one output at the same relative path, so a stack trace in production names the file
//     a developer wrote.
//
//   node scripts/compile-jsx.mjs            write js/compiled/
//   node scripts/compile-jsx.mjs --check    print drift and exit 1 (used by npm run validate)
//   node scripts/compile-jsx.mjs --stats    print the byte budget the README quotes

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(root, "js", "compiled");
const MANIFEST = path.join(OUT_DIR, ".manifest.json");
const BABEL = path.join(root, "vendor", "babel", "babel.min.js");

/** The exact presets and options the in-browser loader used, so the compiled output matches what it produced. */
export const BABEL_OPTIONS = Object.freeze({
  presets: Object.freeze(["react", "env"]),
  // The browser loader inlined source maps; production does not need them and they double the bytes.
  sourceMaps: false,
  compact: false,
  comments: true,
});

/**
 * Every JSX entry point the page needs, in load order.
 *
 * Read from the committed manifest once it exists, because index.html carries the compiled form of each source with a
 * private type rather than a `.jsx` path. On the very first compile there is no manifest yet, and the order then comes
 * from the manifest-less bootstrap list in index.html, which is what the first run is for.
 */
export function listJsxSources(htmlSource, { manifest = null } = {}) {
  if (manifest?.sources) return Object.keys(manifest.sources);
  const found = [];
  for (const match of htmlSource.matchAll(/<script[^>]+type="application\/x-qga-jsx"[^>]+src="([^"]+)"/g)) {
    found.push(match[1].replace(/^\.\//, ""));
  }
  if (found.length > 0) return found;
  const compiled = [...htmlSource.matchAll(/<script[^>]+type="application\/x-qga-compiled"[^>]+src="js\/compiled\/([^"]+)\.js"/g)]
    .map((match) => `${match[1]}.jsx`);
  if (compiled.length === 0) throw new Error("index.html lists no JSX or compiled application scripts");
  return compiled;
}

let babel = null;
function loadBabel() {
  if (babel) return babel;
  const ctx = { self: {}, window: {}, console };
  ctx.global = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(BABEL, "utf8"), ctx);
  if (typeof ctx.Babel?.transform !== "function") throw new Error("vendor/babel/babel.min.js does not expose transform");
  babel = ctx.Babel;
  return babel;
}

/** Compile one source. Throws with the filename, because a Babel syntax error without one is unreadable. */
export function compileSource(source, filename) {
  try {
    return loadBabel().transform(source, { ...BABEL_OPTIONS, filename }).code;
  } catch (error) {
    throw new Error(`${filename}: ${error.message}`);
  }
}

/** `js/labs/foo.jsx` → `js/compiled/labs/foo.js`; the path is preserved so traces stay legible. */
export function outputPathFor(relativeSource) {
  const normalised = relativeSource.replace(/^\.\//, "");
  const withoutExt = normalised.replace(/\.jsx$/, "");
  return path.join("js", "compiled", `${withoutExt}.js`);
}

/** A header that makes the file's provenance obvious to anyone who opens it in an editor. */
function banner(relativeSource) {
  return `/* Compiled from ${relativeSource} by scripts/compile-jsx.mjs. Do not edit; run \`npm run compile:jsx\`. */\n`;
}

/**
 * Compile everything and return `{ files: Map<outputPath, text>, sources }` without touching the disk.
 *
 * Pure apart from reading the sources, so the check mode and the write mode cannot disagree about what "compiled"
 * means.
 */
export function compileAll({ root: base = root } = {}) {
  const html = fs.readFileSync(path.join(base, "index.html"), "utf8");
  let manifest = null;
  try { manifest = JSON.parse(fs.readFileSync(path.join(base, MANIFEST), "utf8")); } catch (error) { manifest = null; }
  const sources = listJsxSources(html, { manifest });
  const files = new Map();
  for (const relative of sources) {
    const absolute = path.join(base, relative);
    if (!fs.existsSync(absolute)) throw new Error(`index.html lists ${relative}, which does not exist`);
    const source = fs.readFileSync(absolute, "utf8");
    const out = outputPathFor(relative);
    files.set(out, banner(relative) + compileSource(source, relative));
  }
  return { files, sources };
}

/** The manifest records what was compiled and from which bytes, so drift is a hash comparison, not a guess. */
export function buildManifest({ files, sources }) {
  const entries = {};
  for (const relative of sources) {
    const out = outputPathFor(relative).split(path.sep).join("/");
    const text = files.get(outputPathFor(relative));
    entries[relative] = { output: out, bytes: Buffer.byteLength(text) };
  }
  return {
    generator: "scripts/compile-jsx.mjs",
    babelOptions: { ...BABEL_OPTIONS, presets: [...BABEL_OPTIONS.presets] },
    sourceCount: sources.length,
    sources: entries,
  };
}

/** Compare the committed tree with a fresh compile. Returns `{ ok, missing, stale, extra }`. */
export function checkCompiled({ root: base = root } = {}) {
  const { files, sources } = compileAll({ root: base });
  const missing = [];
  const stale = [];
  for (const [relativeOut, expected] of files) {
    const absolute = path.join(base, relativeOut);
    if (!fs.existsSync(absolute)) { missing.push(relativeOut); continue; }
    if (fs.readFileSync(absolute, "utf8") !== expected) stale.push(relativeOut);
  }
  const expectedPaths = new Set([...files.keys()].map((p) => path.join(base, p)));
  const extra = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name.endsWith(".js") && !expectedPaths.has(absolute)) extra.push(path.relative(base, absolute));
    }
  };
  walk(OUT_DIR);
  return { ok: missing.length === 0 && stale.length === 0 && extra.length === 0, missing, stale, extra, sources };
}

function writeCompiled({ root: base = root } = {}) {
  const compiled = compileAll({ root: base });
  for (const [relativeOut, text] of compiled.files) {
    const absolute = path.join(base, relativeOut);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, text);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST, `${JSON.stringify(buildManifest(compiled), null, 2)}\n`);
  return compiled;
}

function main(argv) {
  const check = argv.includes("--check");
  const stats = argv.includes("--stats");
  if (check) {
    const result = checkCompiled();
    if (result.ok) {
      console.log(`Compiled JSX is current: ${result.sources.length} sources, no drift.`);
      return 0;
    }
    for (const file of result.missing) console.error(`missing  ${file}`);
    for (const file of result.stale) console.error(`stale    ${file}`);
    for (const file of result.extra) console.error(`extra    ${file}`);
    console.error("Run `npm run compile:jsx` and commit the result.");
    return 1;
  }
  const compiled = writeCompiled();
  let raw = 0;
  let out = 0;
  for (const relative of compiled.sources) raw += fs.statSync(path.join(root, relative)).size;
  for (const [relativeOut, text] of compiled.files) out += Buffer.byteLength(text);
  console.log(`Compiled ${compiled.sources.length} JSX sources: ${raw} B of JSX → ${out} B of JavaScript.`);
  if (stats) console.log(`Saved ${raw - out} B and the ${fs.statSync(BABEL).size} B Babel runtime.`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

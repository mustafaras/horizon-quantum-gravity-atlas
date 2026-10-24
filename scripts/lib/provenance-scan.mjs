// Static half of the provenance audit (Node only, deterministic). It reads the JSX and module sources under js/ and
// compares them with the provenance registry:
//   - a <VizCaption> must name a registered provenanceId, and a status it states must equal the registered one;
//   - every registered entry cites at least one reference, and each reference carries a DOI, arXiv id, ADS bibcode or URL;
//   - Math.random is called only where an id is generated (annotation pins), never in a data, model or capture path.
// The browser half (scene objects without a layer tag) lives in qa/specs/provenance-layers.spec.mjs.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { hasReferenceIdentifier } from "../../js/science/references.mjs";

export const MATH_RANDOM_ALLOWLIST = Object.freeze(["js/annotations/annotation-store.mjs"]);

const SCRIPT_EXT = new Set([".js", ".jsx", ".mjs"]);
const PRODUCT_ROOTS = ["js"];
const PRODUCT_ROOT_FILES = ["tweaks-panel.jsx"];
const QUOTED = /"([^"]*)"|'([^']*)'/g;

const lineOf = (source, index) => source.slice(0, index).split("\n").length;

/** Index of the `>` that closes a JSX opening tag whose attributes start at `from`, skipping braces and strings. */
function tagEnd(source, from) {
  let depth = 0;
  let quote = null;
  for (let i = from; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (char === "\\") i += 1;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'" || char === "`") quote = char;
    else if (char === "{") depth += 1;
    else if (char === "}") depth -= 1;
    else if (char === ">" && depth === 0) return i;
  }
  return source.length;
}

/** The raw value of a JSX attribute (a string literal or a balanced `{...}`), or null when the tag lacks it. */
function attributeValue(attributes, name) {
  const found = new RegExp(`\\b${name}\\s*=\\s*`).exec(attributes);
  if (!found) return null;
  const start = found.index + found[0].length;
  const opener = attributes[start];
  if (opener === '"' || opener === "'") return attributes.slice(start, attributes.indexOf(opener, start + 1) + 1);
  if (opener !== "{") return "";
  let depth = 0;
  for (let i = start; i < attributes.length; i += 1) {
    if (attributes[i] === "{") depth += 1;
    else if (attributes[i] === "}" && (depth -= 1) === 0) return attributes.slice(start, i + 1);
  }
  return attributes.slice(start);
}

// The literals an attribute can evaluate to: a string compared in a condition (`mode === "flux"`) is not one of them.
const COMPARED = /[!=]==?\s*(?:"[^"]*"|'[^']*')|(?:"[^"]*"|'[^']*')\s*[!=]==?/g;
const literals = (value) => (value ? [...value.replace(COMPARED, " ").matchAll(QUOTED)].map((match) => match[1] ?? match[2]) : []);

/** Every <VizCaption ...> in a JSX source: its line, the string literals of provenanceId and status, and whether an id is stated. */
export function scanCaptions(source) {
  const captions = [];
  for (const match of source.matchAll(/<VizCaption\b/g)) {
    const lineStart = source.lastIndexOf("\n", match.index) + 1;
    if (/^\s*(\/\/|\*|\/\*)/.test(source.slice(lineStart, match.index + 1))) continue;
    const from = match.index + match[0].length;
    const attributes = source.slice(from, tagEnd(source, from));
    const id = attributeValue(attributes, "provenanceId");
    captions.push({
      line: lineOf(source, match.index),
      ids: literals(id),
      statuses: literals(attributeValue(attributes, "status")),
      hasId: id !== null && id !== "",
    });
  }
  return captions;
}

/** Line numbers of each Math.random call in code; comment-only lines do not count. */
export function scanMathRandom(source) {
  const lines = [];
  let inBlock = false;
  source.split("\n").forEach((raw, index) => {
    let line = raw;
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end === -1) return;
      inBlock = false;
      line = line.slice(end + 2);
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("//")) return;
    if (trimmed.startsWith("/*")) {
      const end = trimmed.indexOf("*/", 2);
      if (end === -1) { inBlock = true; return; }
      line = trimmed.slice(end + 2);
    }
    for (const _ of line.matchAll(/\bMath\.random\s*\(/g)) lines.push(index + 1);
  });
  return lines;
}

function auditRegistry(registry) {
  const findings = [];
  for (const [id, entry] of registry) {
    if (!entry.references?.length) findings.push({ kind: "missing-reference", file: `registry:${id}`, line: 0, message: `${id} cites no reference` });
    for (const reference of entry.references ?? []) {
      if (!hasReferenceIdentifier(reference)) {
        findings.push({ kind: "reference-without-identifier", file: `registry:${id}`, line: 0, message: `${id}: "${reference}" has no DOI, arXiv id, bibcode or URL` });
      }
    }
  }
  return findings;
}

function auditCaptions(file, source, registry) {
  const findings = [];
  for (const caption of scanCaptions(source)) {
    const at = { file, line: caption.line };
    if (!caption.hasId || caption.ids.length === 0) {
      findings.push({ kind: "unregistered-caption", ...at, message: "VizCaption has no resolvable provenanceId" });
      continue;
    }
    const unknown = caption.ids.filter((id) => !registry.has(id));
    for (const id of unknown) findings.push({ kind: "unregistered-caption", ...at, message: `provenanceId "${id}" is not registered` });
    if (unknown.length || caption.statuses.length === 0) continue;
    if (caption.statuses.length !== caption.ids.length) {
      findings.push({ kind: "status-mismatch", ...at, message: `${caption.ids.length} ids but ${caption.statuses.length} statuses` });
      continue;
    }
    caption.ids.forEach((id, index) => {
      const registered = registry.get(id).status;
      if (registered !== caption.statuses[index]) {
        findings.push({ kind: "status-mismatch", ...at, message: `"${id}" is registered as ${registered}, the caption says ${caption.statuses[index]}` });
      }
    });
  }
  return findings;
}

async function walk(root, relative) {
  const entries = (await readdir(path.join(root, relative), { withFileTypes: true })).sort((a, b) => (a.name < b.name ? -1 : 1));
  const files = [];
  for (const entry of entries) {
    const next = `${relative}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await walk(root, next));
    else if (entry.isFile() && SCRIPT_EXT.has(path.extname(entry.name))) files.push(next);
  }
  return files;
}

async function readProductFiles(root) {
  const names = [...PRODUCT_ROOT_FILES];
  for (const dir of PRODUCT_ROOTS) names.push(...await walk(root, dir));
  return new Map(await Promise.all(names.map(async (name) => [name, await readFile(path.join(root, name), "utf8")])));
}

/**
 * All findings, as `{ kind, file, line, message }`. `registry` is a Map of id to provenance; the sources come from
 * `files` (a Map of path to text, for tests) or from the product tree under `root`.
 */
export async function auditProvenance({ registry, files = null, root = process.cwd() }) {
  const sources = files ?? await readProductFiles(root);
  const findings = auditRegistry(registry);
  for (const [file, source] of sources) {
    if (file.endsWith(".jsx")) findings.push(...auditCaptions(file, source, registry));
    if (MATH_RANDOM_ALLOWLIST.includes(file)) continue;
    for (const line of scanMathRandom(source)) {
      findings.push({ kind: "math-random", file, line, message: "Math.random outside annotation id generation; use seededRng(seed)" });
    }
  }
  return findings;
}

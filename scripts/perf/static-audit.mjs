// Static audit of the source tree (Node only, deterministic): the counts that
// the v2 prompts promise to drive down, printed as plain text. Same tree in,
// byte-identical report out — no dates, no absolute paths, no locale sorting.
//
//   node scripts/perf/static-audit.mjs [--json]
//
// Scope: the finding counters (captions, registrations, Math.random, colour
// literals, needsUpdate, line/shader sites) read product code only — js/ and
// the root tweaks-panel.jsx — so tests, QA and this script never count against
// themselves. The long-file list covers every source and document file except
// vendor/ and node_modules/.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_EXT = new Set([".js", ".jsx", ".mjs"]);
const SIZE_EXT = new Set([".js", ".jsx", ".mjs", ".css", ".html", ".md"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "vendor", "test-results", "playwright-report"]);
const SKIP_PREFIXES = ["docs/audit/"];
const LINE_LIMIT = 800;
const PRODUCT_ROOT_FILE = "tweaks-panel.jsx";

const HEX = /(?<![\w&#])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g;
const COLOR_FUNCTIONS = [["rgb(", /\brgb\(/g], ["rgba(", /\brgba\(/g], ["oklch(", /\boklch\(/g], ["0xRRGGBB", /\b0x[0-9a-fA-F]{6}\b/g]];
const SITE_PATTERNS = [
  ["new THREE.Line(", /new\s+(?:THREE\.)?Line\s*\(/g],
  ["LineBasicMaterial", /\bLineBasicMaterial\b/g],
  ["ShaderMaterial", /\bShaderMaterial\b/g],
];

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const matches = (line, pattern) => line.match(pattern)?.length ?? 0;

async function walk(root, relative = "") {
  const entries = (await readdir(path.join(root, relative), { withFileTypes: true })).sort((a, b) => compare(a.name, b.name));
  const files = [];
  for (const entry of entries) {
    const next = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || SKIP_PREFIXES.some((prefix) => `${next}/`.startsWith(prefix))) continue;
      files.push(...await walk(root, next));
    } else if (entry.isFile()) files.push(next);
  }
  return files;
}

/** Marks lines that are only comment text. Trailing `// …` comments are left alone (no tokenizer). */
function codeLines(text) {
  let inBlock = false;
  return text.split("\n").map((raw) => {
    let line = raw;
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end === -1) return "";
      inBlock = false;
      line = line.slice(end + 2);
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("//")) return "";
    if (trimmed.startsWith("/*")) {
      const end = trimmed.indexOf("*/", 2);
      if (end === -1) { inBlock = true; return ""; }
      return trimmed.slice(end + 2);
    }
    return line;
  });
}

const lineCount = (text) => (text === "" ? 0 : text.split("\n").length - (text.endsWith("\n") ? 1 : 0));

export async function runAudit(root) {
  const files = await walk(root);
  const audit = {
    vizCaption: [], registerVisualization: [], mathRandom: [],
    colorLiterals: [], needsUpdate: [], sites: Object.fromEntries(SITE_PATTERNS.map(([name]) => [name, []])),
    longFiles: [],
  };
  for (const file of files) {
    const ext = path.extname(file);
    const inJs = file.startsWith("js/");
    if (!SIZE_EXT.has(ext)) continue;
    const text = await readFile(path.join(root, file), "utf8");
    const lines = lineCount(text);
    if (SIZE_EXT.has(ext) && lines > LINE_LIMIT) audit.longFiles.push({ file, lines });
    if (!SCRIPT_EXT.has(ext) || !(inJs || file === PRODUCT_ROOT_FILE)) continue;

    const code = codeLines(text);
    let captions = 0, needsUpdate = 0;
    const colors = { hex: 0, "rgb(": 0, "rgba(": 0, "oklch(": 0, "0xRRGGBB": 0 };
    code.forEach((line, i) => {
      const at = `${file}:${i + 1}`;
      captions += matches(line, /<VizCaption\b/g);
      if (/\bregisterVisualization\s*\(/.test(line) && !/\bfunction\s+registerVisualization\b/.test(line)) audit.registerVisualization.push(at);
      if (/\bMath\.random\s*\(/.test(line)) audit.mathRandom.push(at);
      needsUpdate += matches(line, /\bneedsUpdate\s*=\s*true\b/g);
      for (const [name, pattern] of SITE_PATTERNS) if (matches(line, pattern)) audit.sites[name].push(at);
      if (inJs) {
        colors.hex += matches(line, HEX);
        for (const [name, pattern] of COLOR_FUNCTIONS) colors[name] += matches(line, pattern);
      }
    });
    if (captions) audit.vizCaption.push({ file, count: captions });
    if (needsUpdate) audit.needsUpdate.push({ file, count: needsUpdate });
    if (inJs && Object.values(colors).some(Boolean)) audit.colorLiterals.push({ file, ...colors });
  }
  audit.longFiles.sort((a, b) => b.lines - a.lines || compare(a.file, b.file));
  return audit;
}

const sum = (rows, key = "count") => rows.reduce((total, row) => total + row[key], 0);

function table(headers, rows) {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const fmt = (cells) => cells.map((c, i) => (i === 0 ? String(c).padEnd(widths[i]) : String(c).padStart(widths[i]))).join("  ").trimEnd();
  return [fmt(headers), ...rows.map(fmt)];
}

export function formatAudit(audit) {
  const out = [];
  const section = (title, body) => { out.push(`## ${title}`, ...body, ""); };
  const sites = (list) => (list.length ? list : ["(none)"]);

  section(`<VizCaption per file (total ${sum(audit.vizCaption)} in ${audit.vizCaption.length} files)`,
    audit.vizCaption.length ? table(["file", "count"], audit.vizCaption.map((r) => [r.file, r.count])) : ["(none)"]);
  section(`registerVisualization( call sites (${audit.registerVisualization.length})`, sites(audit.registerVisualization));
  section(`Math.random( call sites (${audit.mathRandom.length})`, sites(audit.mathRandom));

  const colorTotals = ["hex", "rgb(", "rgba(", "oklch(", "0xRRGGBB"].map((k) => sum(audit.colorLiterals, k));
  section(`colour literals under js/ (hex ${colorTotals[0]}, rgb( ${colorTotals[1]}, rgba( ${colorTotals[2]}, oklch( ${colorTotals[3]}, 0xRRGGBB ${colorTotals[4]})`,
    audit.colorLiterals.length
      ? table(["file", "hex", "rgb(", "rgba(", "oklch(", "0xRRGGBB"], audit.colorLiterals.map((r) => [r.file, r.hex, r["rgb("], r["rgba("], r["oklch("], r["0xRRGGBB"]]))
      : ["(none)"]);
  section(`needsUpdate = true sites per file (total ${sum(audit.needsUpdate)} in ${audit.needsUpdate.length} files)`,
    audit.needsUpdate.length ? table(["file", "count"], audit.needsUpdate.map((r) => [r.file, r.count])) : ["(none)"]);
  for (const [name, list] of Object.entries(audit.sites)) section(`${name} sites (${list.length})`, sites(list));
  section(`files over ${LINE_LIMIT} lines (${audit.longFiles.length})`,
    audit.longFiles.length ? table(["file", "lines"], audit.longFiles.map((r) => [r.file, r.lines])) : ["(none)"]);
  return out.join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const audit = await runAudit(root);
  process.stdout.write(process.argv.includes("--json") ? `${JSON.stringify(audit, null, 2)}\n` : `${formatAudit(audit)}\n`);
}

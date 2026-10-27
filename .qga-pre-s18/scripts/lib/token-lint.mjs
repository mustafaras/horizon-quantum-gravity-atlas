// Design-token lint (S02): module code may not carry colour or font literals.
// Colours, fonts and durations come from styles/tokens.css through js/design/tokens.mjs.
//
// Flagged inside js/**/*.{jsx,mjs}:
//   - string / template text containing #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(, rgba(, oklch(, hsl(, hsla(,
//     color(srgb …) or a font family name (IBM Plex Mono, Space Grotesk, Sora) or "<n>px <family>"
//   - 0xRRGGBB numbers
//   - new Color(r, g, b) / .setRGB / .setHSL with numeric arguments
//   - any assignment to `.font` of a literal
// Exceptions: js/design/**, js/science/data/**, js/science/spectrum.mjs, and any line carrying (or directly
// preceded by) a `token-lint-allow: <reason>` comment, for shader code that encodes physics.
//
// The scan uses the vendored Babel parser, so comments and identifiers such as `blackbodyToSrgb(` never match.

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export const EXEMPT = Object.freeze([
  /^js\/design\//,
  /^js\/science\/data\//,
  /^js\/science\/spectrum\.mjs$/,
]);

export const ALLOW_MARKER = "token-lint-allow:";

const HEX_COLOR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/;
const FUNCTIONAL = /\b(?:rgba?|hsla?|oklch|oklab|lch|lab|hwb)\(|\bcolor\(\s*(?:srgb|display-p3|srgb-linear)/i;
const FONT_FAMILY = /\b(?:IBM Plex|Space Grotesk|Sora)\b/;
const FONT_SHORTHAND = /\b\d+(?:\.\d+)?px\s+(?:["']|var\(--font|monospace|sans-serif|serif|system-ui|ui-(?:sans|mono|serif))/i;

export function describeLiteral(text) {
  if (HEX_COLOR.test(text)) return `colour literal ${HEX_COLOR.exec(text)[0]}`;
  const fn = FUNCTIONAL.exec(text);
  if (fn) return `colour function ${fn[0].trim()}…`;
  if (FONT_FAMILY.test(text)) return `font family literal "${FONT_FAMILY.exec(text)[0]}"`;
  if (FONT_SHORTHAND.test(text)) return `font shorthand "${text.trim().slice(0, 40)}"`;
  return null;
}

let babelParser = null;
function parser(root) {
  if (babelParser) return babelParser;
  const ctx = { self: {}, window: {}, console };
  ctx.global = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "vendor", "babel", "babel.min.js"), "utf8"), ctx);
  babelParser = ctx.Babel.packages.parser;
  return babelParser;
}

function parseSource(root, source) {
  const options = { plugins: ["jsx"], allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true, tokens: false };
  try {
    return parser(root).parse(source, { ...options, sourceType: "module" });
  } catch {
    return parser(root).parse(source, { ...options, sourceType: "script" });
  }
}

function visit(node, parents, cb) {
  if (!node || typeof node.type !== "string") return;
  cb(node, parents);
  parents.push(node);
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "extra" || key.endsWith("Comments")) continue;
    const value = node[key];
    if (Array.isArray(value)) for (const child of value) visit(child, parents, cb);
    else if (value && typeof value.type === "string") visit(value, parents, cb);
  }
  parents.pop();
}

const isNumber = (n) => n && (n.type === "NumericLiteral" || (n.type === "UnaryExpression" && n.argument.type === "NumericLiteral"));
const COLOR_CTORS = new Set(["Color"]);
const COLOR_SETTERS = new Set(["setRGB", "setHSL"]);

/** Scan one source text; returns `[{ line, message }]`. */
export function lintSource(root, source) {
  const lines = source.split("\n");
  const allowed = (line) => /token-lint-allow:/.test(lines[line - 1] ?? "") || /token-lint-allow:/.test(lines[line - 2] ?? "");
  const found = [];
  const report = (node, message) => {
    const line = node.loc.start.line;
    if (!allowed(line)) found.push({ line, message });
  };
  const ast = parseSource(root, source);
  visit(ast, [], (node) => {
    if (node.type === "StringLiteral") {
      const problem = describeLiteral(node.value);
      if (problem) report(node, problem);
    } else if (node.type === "TemplateElement") {
      const problem = describeLiteral(node.value.raw);
      if (problem) report(node, problem);
    } else if (node.type === "NumericLiteral" && /^0x[0-9a-fA-F]{6}$/.test(node.extra?.raw ?? "")) {
      report(node, `colour literal ${node.extra.raw}`);
    } else if ((node.type === "NewExpression" || node.type === "CallExpression")) {
      const callee = node.callee;
      const name = callee.type === "MemberExpression" ? callee.property.name : callee.name;
      const numeric = node.arguments.filter(isNumber).length;
      if (node.type === "NewExpression" && COLOR_CTORS.has(name) && numeric >= 2) report(node, "numeric new Color(r, g, b)");
      if (node.type === "CallExpression" && COLOR_SETTERS.has(name) && numeric >= 2) report(node, `numeric .${name}(…)`);
    } else if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression" && node.left.property.name === "font"
      && ["StringLiteral", "TemplateLiteral"].includes(node.right.type)) {
      report(node, "literal assigned to .font; use tokens.font");
    }
  });
  return found;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(jsx|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Lint every module file under js/. Returns failure strings ready for validate-repo. */
export function lintTokenLiterals(root) {
  const failures = [];
  for (const file of walk(path.join(root, "js")).sort()) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    if (EXEMPT.some((pattern) => pattern.test(rel))) continue;
    for (const { line, message } of lintSource(root, fs.readFileSync(file, "utf8"))) {
      failures.push(`${rel}:${line} ${message}; read it from styles/tokens.css via js/design/tokens.mjs`);
    }
  }
  return failures;
}

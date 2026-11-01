// A small CSS rule reader for the theme-surface generator. It understands what these stylesheets use and nothing more:
// style rules, @media and @supports blocks (read recursively), declarations with !important, strings, parentheses and
// url(...). Everything else at-rule level (@keyframes, @font-face, @import, @charset) is skipped on purpose: a keyframe
// cannot be overridden by a selector prefix. Pure and DOM-free.

const COMMENT = /\/\*[\s\S]*?\*\//g;

export const stripComments = (css) => css.replace(COMMENT, "");

/** Index of the first `target` at brace/paren depth 0 and outside strings, from `from`; -1 if there is none. */
function topLevelIndex(src, target, from) {
  let paren = 0, quote = null;
  for (let i = from; i < src.length; i++) {
    const ch = src[i];
    if (quote) { if (ch === "\\") i++; else if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") paren++;
    else if (ch === ")") paren = Math.max(0, paren - 1);
    else if (paren === 0 && ch === target) return i;
  }
  return -1;
}

function matchingBrace(src, open) {
  let depth = 0, quote = null;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (quote) { if (ch === "\\") i++; else if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return i;
  }
  throw new SyntaxError("css: unbalanced braces");
}

/** Split `text` on top-level `separator` (not inside parentheses or strings). */
export function splitTop(text, separator) {
  const parts = [];
  let from = 0;
  for (let at = topLevelIndex(text, separator, from); at !== -1; at = topLevelIndex(text, separator, from)) {
    parts.push(text.slice(from, at));
    from = at + 1;
  }
  parts.push(text.slice(from));
  return parts.map((p) => p.trim()).filter(Boolean);
}

export function parseDeclarations(body) {
  const out = [];
  for (const raw of splitTop(body, ";")) {
    const colon = raw.indexOf(":");
    if (colon === -1) continue;
    const prop = raw.slice(0, colon).trim();
    let value = raw.slice(colon + 1).trim();
    const important = /!\s*important\s*$/i.test(value);
    if (important) value = value.replace(/!\s*important\s*$/i, "").trim();
    if (prop) out.push({ prop, value, important });
  }
  return out;
}

/** `[{ type: "rule", selectors, declarations } | { type: "at", name, prelude, children }]` in source order. */
export function parseCss(css) {
  const src = stripComments(css);
  const nodes = [];
  let i = 0;
  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (i >= src.length) break;
    const open = topLevelIndex(src, "{", i);
    const semi = topLevelIndex(src, ";", i);
    if (open === -1 && semi === -1) break;
    if (semi !== -1 && (open === -1 || semi < open)) { i = semi + 1; continue; }
    const close = matchingBrace(src, open);
    const prelude = src.slice(i, open).trim();
    const body = src.slice(open + 1, close);
    i = close + 1;
    if (prelude.startsWith("@")) {
      const name = /^@([\w-]+)/.exec(prelude)[1];
      if (name === "media" || name === "supports") nodes.push({ type: "at", name, prelude, children: parseCss(body) });
    } else {
      nodes.push({ type: "rule", selectors: splitTop(prelude, ","), declarations: parseDeclarations(body) });
    }
  }
  return nodes;
}

/** Colour literals of a declaration value, in order, ignoring anything inside url(...). */
export function colourLiterals(value) {
  const masked = value.replace(/url\([^)]*\)/gi, (m) => " ".repeat(m.length));
  return [...masked.matchAll(/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|rgba?\([^()]*\)|hsla?\([^()]*\)/g)]
    .map((m) => ({ text: m[0], index: m.index }));
}

/** `value` with every colour literal replaced by `map(literal)`; url(...) contents are never touched. */
export function mapColourLiterals(value, map) {
  let out = "", cursor = 0;
  for (const { text, index } of colourLiterals(value)) {
    out += value.slice(cursor, index) + map(text);
    cursor = index + text.length;
  }
  return out + value.slice(cursor);
}

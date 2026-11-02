// Internal link checker (S35): every relative Markdown link, image and HTML src/href/poster in README.md,
// docs/**/*.md and paper/**/*.md must name a file or directory that exists. External URLs, mail, data URIs and
// same-page anchors are out of scope; so are links inside fenced or inline code. A `#fragment` or `?query` is
// stripped before the lookup; heading anchors themselves are not checked. Pure apart from reading the tree.

import fs from "node:fs";
import path from "node:path";

const FENCE = /^\s{0,3}(```|~~~)/;
const INLINE_CODE = /`[^`\n]*`/g;
// `](target` covers inline links and images, including an image nested inside a link.
const INLINE_TARGET = /\]\(\s*<?([^)\s>]+)>?/g;
const REFERENCE_DEFINITION = /^\s{0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/g;
const HTML_ATTRIBUTE = /<(?:img|a|source|video)\b[^>]*?\s(?:src|href|poster)="([^"]+)"/g;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const SCANNED_DIRECTORIES = Object.freeze(["docs", "paper"]);

const isLocal = (target) => target !== "" && !target.startsWith("#") && !SCHEME.test(target);

function linksOnLine(text, line) {
  const found = [];
  for (const pattern of [INLINE_TARGET, REFERENCE_DEFINITION, HTML_ATTRIBUTE]) {
    for (const match of text.matchAll(pattern)) found.push({ index: match.index, target: match[1] });
  }
  return found
    .filter((link) => isLocal(link.target))
    .sort((a, b) => a.index - b.index)
    .map((link) => ({ line, target: link.target }));
}

/** Local link targets in `markdown`, each with its 1-based line, outside code. */
export function extractLinks(markdown) {
  const links = [];
  let fence = null;
  markdown.split("\n").forEach((raw, i) => {
    const opener = raw.match(FENCE);
    if (opener && (fence === null || opener[1] === fence)) {
      fence = fence === null ? opener[1] : null;
      return;
    }
    if (fence !== null) return;
    links.push(...linksOnLine(raw.replace(INLINE_CODE, ""), i + 1));
  });
  return links;
}

function markdownUnder(root, directory) {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"));
}

/** README.md plus every Markdown file under docs/ and paper/, sorted. */
export function listDocFiles(root) {
  const files = SCANNED_DIRECTORIES.flatMap((directory) => markdownUnder(root, directory));
  if (fs.existsSync(path.join(root, "README.md"))) files.push("README.md");
  return files.sort();
}

function resolveTarget(root, file, target) {
  const clean = decodeURIComponent(target.split("#")[0].split("?")[0]);
  if (clean === "") return null;
  return clean.startsWith("/") ? path.join(root, clean) : path.join(root, path.dirname(file), clean);
}

/** Broken links in `files` (paths relative to `root`): `{ file, line, target }` for each missing target. */
export function checkLinks(root, files) {
  return files.flatMap((file) => {
    const markdown = fs.readFileSync(path.join(root, file), "utf8");
    return extractLinks(markdown)
      .filter((link) => {
        const resolved = resolveTarget(root, file, link.target);
        return resolved !== null && !fs.existsSync(resolved);
      })
      .map((link) => ({ file, line: link.line, target: link.target }));
  });
}

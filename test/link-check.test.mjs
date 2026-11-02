import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractLinks, listDocFiles, checkLinks } from "../scripts/lib/link-check.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = (markdown) => extractLinks(markdown).map((link) => link.target);

test("reads inline links, images, reference definitions and HTML src/href", () => {
  const markdown = [
    "See [the guide](docs/guide/README.md) and ![cover](docs/screenshots/a.png \"title\").",
    '<img src="./docs/diagrams/b.svg" alt=""> <a href="paper/paper.md">paper</a>',
    "[ref]: ../CITATION.cff",
  ].join("\n");
  assert.deepEqual(targets(markdown), [
    "docs/guide/README.md",
    "docs/screenshots/a.png",
    "./docs/diagrams/b.svg",
    "paper/paper.md",
    "../CITATION.cff",
  ]);
});

test("reports the 1-based line of each link", () => {
  const links = extractLinks("first\n\n[x](a.md)\n");
  assert.equal(links[0].line, 3);
});

test("ignores external, mail, data and same-page anchor targets", () => {
  const markdown = "[a](https://example.org) [b](http://x) [c](mailto:a@b) [d](#section) ![e](data:image/png;base64,AA)";
  assert.deepEqual(targets(markdown), []);
});

test("ignores links inside fenced and inline code", () => {
  const markdown = ["```md", "[no](missing.md)", "```", "Use `[no](also-missing.md)` here.", "~~~", "<img src=\"x.png\">", "~~~"].join("\n");
  assert.deepEqual(targets(markdown), []);
});

test("resolves relative to the linking file, strips fragments and decodes escapes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "link-check-"));
  fs.mkdirSync(path.join(dir, "docs", "guide"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs", "guide", "a b.md"), "# A\n");
  fs.writeFileSync(path.join(dir, "README.md"), "[ok](docs/guide/a%20b.md#a) [root](/README.md)\n");
  fs.writeFileSync(path.join(dir, "docs", "guide", "index.md"), "[up](../../README.md) [bad](./missing.md) [dir](.)\n");
  const failures = checkLinks(dir, ["README.md", "docs/guide/index.md"]);
  assert.deepEqual(failures, [{ file: "docs/guide/index.md", line: 1, target: "./missing.md" }]);
});

test("lists README, docs/**/*.md and paper/**/*.md", () => {
  const files = listDocFiles(root);
  assert.ok(files.includes("README.md"));
  assert.ok(files.every((file) => file === "README.md" || /^(docs|paper)\/.+\.md$/.test(file)));
  assert.ok(files.some((file) => file.startsWith("docs/science/")));
});

test("every relative link and image in the repository's Markdown resolves to a file", () => {
  const failures = checkLinks(root, listDocFiles(root));
  assert.deepEqual(failures, [], failures.map((f) => `${f.file}:${f.line} → ${f.target}`).join("\n"));
});

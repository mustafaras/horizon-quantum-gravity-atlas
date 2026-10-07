// CITATION.cff integrity — the citation record must stay complete, honest, and
// consistent with the repository it describes. No unverified identifiers (e.g.
// a fabricated DOI) are permitted: every field must be checkable from the repo.

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cff = await readFile(path.join(root, "CITATION.cff"), "utf8");

// Minimal, dependency-free reader for the flat/sub-entry YAML used by this file.
function parseCff(text) {
  const out = { authors: [], keywords: [] };
  let inAuthors = false;
  let inKeywords = false;
  let foldKey = null;
  let foldLines = [];
  const flushFold = () => {
    if (foldKey) { out[foldKey] = foldLines.join(" ").replace(/\s+/g, " ").trim(); foldKey = null; foldLines = []; }
  };
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (/^\s*#/.test(line) || !line.trim()) continue;
    if (foldKey) {
      if (/^\s+\S/.test(line)) { foldLines.push(line.trim()); continue; }
      flushFold();
    }
    if (/^authors:/.test(line)) { inAuthors = true; inKeywords = false; continue; }
    if (/^keywords:/.test(line)) { inKeywords = true; inAuthors = false; continue; }
    if (/^\S/.test(line)) { inAuthors = false; inKeywords = false; }
    if (inAuthors && /^\s+-\s/.test(line)) {
      out.authors.push({ name: line.replace(/^\s+-\s*/, "").trim() });
      continue;
    }
    if (inKeywords && /^\s+-\s/.test(line)) {
      out.keywords.push(line.replace(/^\s+-\s*/, "").trim().replace(/^"|"$/g, ""));
      continue;
    }
    const fold = line.match(/^(\S[^:]*):\s*>-?\s*$/);
    if (fold) { foldKey = fold[1].trim(); foldLines = []; continue; }
    const m = line.match(/^(\S[^:]*):\s*(.*)$/);
    if (m && !/^\s/.test(line)) out[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
  flushFold();
  return out;
}

const c = parseCff(cff);

test("CITATION.cff declares a supported CFF version", () => {
  assert.equal(c["cff-version"], "1.2.0");
});

test("CITATION.cff identifies the software with title and type", () => {
  assert.equal(c.type, "software");
  assert.equal(c.title, "HORIZON — Quantum Gravity Atlas");
});

test("CITATION.cff carries at least one named author", () => {
  assert.ok(c.authors.length >= 1, "expected at least one author entry");
  assert.ok(/family-names/.test(cff) && /given-names/.test(cff), "author needs family/given names");
});

test("CITATION.cff links the verified repository and live URL", () => {
  assert.equal(c["repository-code"], "https://github.com/mustafaras/horizon-quantum-gravity-atlas");
  assert.equal(c.url, "https://mustafaras.github.io/horizon-quantum-gravity-atlas/");
});

test("CITATION.cff license matches the repository LICENSE", async () => {
  const license = await readFile(path.join(root, "LICENSE"), "utf8");
  assert.match(license, /MIT/);
  assert.equal(c.license, "MIT");
});

test("CITATION.cff version matches package.json", async () => {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  assert.equal(c.version, pkg.version);
});

test("CITATION.cff release date is a valid ISO date", () => {
  assert.match(c["date-released"], /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(Date.parse(c["date-released"])));
});

test("CITATION.cff contains no unverified identifiers (no DOI)", () => {
  assert.ok(!/^\s*doi:/m.test(cff), "a DOI may only be added once it is genuinely registered");
  assert.ok(!/identifiers:/.test(cff), "identifiers block reserved for verified entries only");
});

test("CITATION.cff keywords are non-empty and lowercase-kebab", () => {
  assert.ok(c.keywords.length >= 4);
  for (const k of c.keywords) assert.match(k, /^[a-z0-9-]+$/);
});

test("CITATION.cff abstract is a substantive paragraph", () => {
  assert.ok((c.abstract || "").length > 120, "abstract should describe the software meaningfully");
});
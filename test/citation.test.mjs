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

// .zenodo.json (S35). Zenodo reads it in preference to CITATION.cff when archiving a GitHub release, so the two must
// say the same thing. Keys and vocabularies follow https://developers.zenodo.org/ (deposition metadata) and the
// licence id from https://zenodo.org/api/vocabularies/licenses/mit, both read on 2026-11-02.
const zenodoText = await readFile(path.join(root, ".zenodo.json"), "utf8");
const zenodo = JSON.parse(zenodoText);

test(".zenodo.json carries Zenodo's required deposition keys for software", () => {
  for (const key of ["upload_type", "title", "creators", "description", "access_right", "license"]) {
    assert.ok(zenodo[key], `missing ${key}`);
  }
  assert.equal(zenodo.upload_type, "software");
  assert.equal(zenodo.access_right, "open");
  assert.equal(zenodo.license, "mit");
});

test(".zenodo.json contains no DOI of any kind (the maintainer mints it)", () => {
  assert.equal(zenodo.doi, undefined);
  assert.equal(zenodo.prereserve_doi, undefined);
  assert.ok(!/10\.\d{4,9}\//.test(zenodoText), "no DOI-shaped string may appear in .zenodo.json");
});

test(".zenodo.json agrees with CITATION.cff and package.json", async () => {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  assert.equal(zenodo.title, c.title);
  assert.equal(zenodo.description, c.abstract);
  assert.equal(zenodo.version, pkg.version);
  assert.deepEqual(zenodo.keywords, c.keywords);
  const family = cff.match(/family-names:\s*"([^"]+)"/)[1];
  const given = cff.match(/given-names:\s*"([^"]+)"/)[1];
  assert.deepEqual(zenodo.creators, [{ name: `${family}, ${given}`, orcid: cffOrcid }]);
});

// The author's ORCID, given by the maintainer on 2026-11-02 and read from pub.orcid.org that day: the record's name
// (given "Mustafa Raşit", family "Şahin") is the one the citation files use.
const cffOrcidUrl = cff.match(/orcid:\s*"([^"]+)"/)?.[1];
const cffOrcid = cffOrcidUrl?.replace("https://orcid.org/", "");

function orcidChecksumOk(id) {
  const digits = id.replace(/-/g, "");
  let total = 0;
  for (const ch of digits.slice(0, 15)) total = (total + Number(ch)) * 2;
  const remainder = (12 - (total % 11)) % 11;
  return (remainder === 10 ? "X" : String(remainder)) === digits[15];
}

test("CITATION.cff carries a well-formed ORCID URL with a valid ISO 7064 check digit", () => {
  assert.match(cffOrcidUrl ?? "", /^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/);
  assert.ok(orcidChecksumOk(cffOrcid), "ORCID check digit");
});

test(".zenodo.json relates the record to the repository and the live site", () => {
  const ids = Object.fromEntries(zenodo.related_identifiers.map((r) => [r.identifier, r]));
  assert.equal(ids[c["repository-code"]]?.relation, "isSupplementTo");
  assert.equal(ids[c.url]?.relation, "isDocumentedBy");
  for (const r of zenodo.related_identifiers) assert.ok(r.resource_type, `${r.identifier} needs a resource_type`);
});

test(".zenodo.json adds no personal details the maintainer has not given (no affiliation)", () => {
  for (const creator of zenodo.creators) assert.deepEqual(Object.keys(creator), ["name", "orcid"]);
});

// paper/ (S35): a JOSS-style draft. Every citation key must resolve, and every entry must carry the DOI or URL it was
// checked against.
const paper = await readFile(path.join(root, "paper", "paper.md"), "utf8");
const bib = await readFile(path.join(root, "paper", "paper.bib"), "utf8");
const bibEntries = [...bib.matchAll(/^@\w+\{([^,]+),([\s\S]*?)^\}/gm)].map((m) => ({ key: m[1], body: m[2] }));

test("paper/paper.md cites only keys that paper/paper.bib defines, and uses every entry", () => {
  const cited = new Set([...paper.matchAll(/@([A-Za-z][\w-]*)/g)].map((m) => m[1]));
  const keys = new Set(bibEntries.map((e) => e.key));
  for (const key of cited) assert.ok(keys.has(key), `[@${key}] has no entry in paper.bib`);
  for (const key of keys) assert.ok(cited.has(key), `paper.bib entry ${key} is never cited`);
});

test("every paper.bib entry carries a DOI or a URL, and the paper invents no author identifiers", () => {
  assert.ok(bibEntries.length >= 5);
  for (const { key, body } of bibEntries) assert.match(body, /\b(doi|url)\s*=/, `${key} needs a doi or url`);
  assert.equal(paper.match(/^\s*orcid:\s*(\S+)/m)?.[1], cffOrcid, "the paper's ORCID is the CITATION.cff one");
  assert.match(paper, /^\s*-\s*name:\s*Mustafa Raşit Şahin\s*$/m);
  assert.ok(!/^\s*affiliation:/m.test(paper), "no affiliation may be added that the author has not given");
});
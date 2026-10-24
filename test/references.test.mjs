import test from "node:test";
import assert from "node:assert/strict";

import { REF, referenceLinks, hasReferenceIdentifier } from "../js/science/references.mjs";

test("referenceLinks reads a DOI, including parentheses inside the suffix", () => {
  const [link] = referenceLinks("Glashow, Nucl. Phys. 22, 579 (1961), doi:10.1016/0029-5582(61)90469-2");
  assert.deepEqual(link, { kind: "doi", id: "10.1016/0029-5582(61)90469-2", href: "https://doi.org/10.1016/0029-5582(61)90469-2" });
});

test("referenceLinks drops sentence punctuation after a DOI", () => {
  const [link] = referenceLinks("See doi:10.1103/PhysRevLett.116.061102.");
  assert.equal(link.id, "10.1103/PhysRevLett.116.061102");
});

test("referenceLinks reads new-style and old-style arXiv identifiers", () => {
  assert.equal(referenceLinks("Planck 2018, arXiv:1807.06209")[0].href, "https://arxiv.org/abs/1807.06209");
  assert.equal(referenceLinks("Schwarzschild, arXiv:physics/9905030")[0].href, "https://arxiv.org/abs/physics/9905030");
  assert.equal(referenceLinks("Maldacena, arXiv:hep-th/9711200")[0].id, "hep-th/9711200");
});

test("referenceLinks reads an ADS bibcode and a plain URL", () => {
  assert.deepEqual(referenceLinks("Example, bibcode:1973grav.book.....M")[0], {
    kind: "bibcode", id: "1973grav.book.....M", href: "https://ui.adsabs.harvard.edu/abs/1973grav.book.....M",
  });
  assert.deepEqual(referenceLinks("Book, https://example.org/a/b")[0], { kind: "url", id: "https://example.org/a/b", href: "https://example.org/a/b" });
});

test("a doi.org URL is a DOI, not a second link", () => {
  const links = referenceLinks("Paper, https://doi.org/10.1103/PhysRevD.7.2333");
  assert.deepEqual(links.map((link) => link.kind), ["doi"]);
});

test("hasReferenceIdentifier rejects a citation with no identifier", () => {
  assert.equal(hasReferenceIdentifier("Wald (1984)"), false);
  assert.equal(hasReferenceIdentifier("Misner, Thorne & Wheeler, Gravitation (1973), chapter 25"), false);
  assert.equal(hasReferenceIdentifier("Wald, General Relativity, https://example.org/wald"), true);
});

test("every shared reference carries a resolvable identifier", () => {
  for (const [key, text] of Object.entries(REF)) {
    assert.equal(hasReferenceIdentifier(text), true, `${key}: ${text}`);
  }
});

test("shared references stay frozen", () => {
  assert.throws(() => { REF.PDG = "changed"; }, TypeError);
});

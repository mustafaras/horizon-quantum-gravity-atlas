import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const covers = ["standard-model", "qft", "rg", "gr", "planck", "approaches", "blackholes", "experiments"];

test("every chapter has a cover at both sizes plus a provenance sidecar", async () => {
  for (const slug of covers) {
    for (const suffix of ["", "-sm"]) {
      const file = path.join(root, "docs/covers", `${slug}${suffix}.png`);
      await access(file);
    }
    const sidecar = JSON.parse(await readFile(path.join(root, "docs/covers", `${slug}.json`), "utf8"));
    assert.equal(sidecar.id, slug);
    assert.equal(sidecar.seed, 42);
    assert.ok(sidecar.commit && sidecar.commit.length >= 7, `${slug}: sidecar names the commit`);
    assert.ok(sidecar.label && sidecar.target, `${slug}: sidecar names what the cover shows`);
    assert.equal(sidecar.sizes.length, 2);
    // The sidecar must not claim the cover is an observation.
    assert.match(sidecar.status, /screenshot/i);
  }
});

test("a cover frames a figure, never the whole page", async () => {
  const source = await readFile(path.join(root, "scripts/render-covers.mjs"), "utf8");
  // The article fallback was the reason the first covers showed the navigation rail; there must be no such fallback.
  assert.doesNotMatch(source, /locator\(\"article\"\)/, "no article fallback: a cover is a figure or the build fails");
  assert.match(source, /throw new Error\(`\$\{cover\.id\}: none of the target selectors matched/, "an unmatched target fails the build");
  // The viewport must be set before the clip is measured, or the clip is in the wrong coordinate space.
  const body = source.slice(source.indexOf("for (const size of SIZES)"));
  const setViewportAt = body.indexOf("page.setViewportSize");
  const boundingBoxAt = body.indexOf("element.boundingBox");
  assert.ok(setViewportAt >= 0 && boundingBoxAt > setViewportAt, "the viewport is set before the element is measured");
});

test("the header offers the phone thumbnail through srcset", async () => {
  const core = await readFile(path.join(root, "js/core.jsx"), "utf8");
  const header = core.slice(core.indexOf("function ModuleHeader"), core.indexOf("/* ---------- controls ---------- */"));
  assert.match(header, /srcSet=\{`docs\/covers\/\$\{slug\}-sm\.png 1200w/, "the 1200 px file is offered");
  assert.match(header, /docs\/covers\/\$\{slug\}\.png 2400w/, "the 2400 px file is offered");
  assert.match(header, /sizes=/, "the browser is told how wide the band is");
});

test("the cover renderer maps every chapter and uses the same seed", async () => {
  const source = await readFile(path.join(root, "scripts/render-covers.mjs"), "utf8");
  for (const slug of covers) assert.ok(source.includes(`id: "${slug}"`), `renderer knows ${slug}`);
  assert.match(source, /installDeterministicRandom\(context, 42\)/, "the covers are seeded");
  assert.match(source, /2400, height: 900/, "the hero size is the one the header uses");
  assert.match(source, /1200, height: 450/, "the thumbnail size exists");
});

test("ModuleHeader shows the cover, marks it high priority and exposes the source figure", async () => {
  const core = await readFile(path.join(root, "js/core.jsx"), "utf8");
  const header = core.slice(core.indexOf("function ModuleHeader"), core.indexOf("/* ---------- controls ---------- */"));
  assert.match(header, /docs\/covers\//, "the header points at the rendered covers");
  assert.match(header, /fetchpriority="high"/, "the active chapter's cover is high priority");
  assert.match(header, /scrollIntoView/, "clicking it reaches the figure that produced it");
  assert.match(header, /usePRM/, "the scroll respects reduced motion");
  // Every module passes the selector of its own figure.
  for (const file of ["mod-standard-model", "mod-qft", "mod-rg-stage3", "mod-gr", "mod-planck", "mod-approaches", "mod-blackholes", "mod-experiments"]) {
    const source = await readFile(path.join(root, "js", `${file}.jsx`), "utf8");
    assert.match(source, /<ModuleHeader[\s\S]{0,900}?target=/, `${file} passes a target`);
  }
});

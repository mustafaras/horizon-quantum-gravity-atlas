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

test("the header describes each cover at its measured width, never a guessed one", async () => {
  const core = await readFile(path.join(root, "js/core.jsx"), "utf8");
  const header = core.slice(core.indexOf("function ModuleHeader"), core.indexOf("/* ---------- controls ---------- */"));
  // The srcset must come from the sidecar's measured widths. Hardcoding the capture viewports as descriptors told the
  // browser that a 794 px file was 1200 px wide and a 950 px file 2400 px wide, so it picked the thumbnail for a
  // 1000 px slot and the band upscaled it.
  assert.doesNotMatch(header, /\d+w[`"]/, "no width descriptor is written by hand");
  assert.match(header, /srcSet=\{sizes \? sizes\.map\(\(s\) => `docs\/covers\/\$\{s\.file\} \$\{s\.width\}w`\)/, "each descriptor is the file's measured width");
  assert.match(header, /sizes=\{sizes \? COVER_SIZES/, "the browser is told how wide the band is");
  // width/height must describe the real file, or the band reserves the wrong box and the cover is stretched on load.
  assert.match(header, /width=\{hero \? hero\.width : undefined\}/, "the reserved width is the measured width");
  assert.match(header, /height=\{hero \? hero\.height : undefined\}/, "the reserved height is the measured height");
  assert.match(core, /window\.QGA_COVERS/, "the measured sizes come from the cover index");

  // The index itself must agree with the files on disk.
  const index = await readFile(path.join(root, "js/science/data/cover-index.mjs"), "utf8");
  for (const slug of covers) {
    const sidecar = JSON.parse(await readFile(path.join(root, "docs/covers", `${slug}.json`), "utf8"));
    for (const size of sidecar.sizes) {
      const file = await readFile(path.join(root, "docs/covers", size.file));
      const width = file.readUInt32BE(16);
      const height = file.readUInt32BE(20);
      assert.equal(size.width, width, `${size.file}: sidecar width matches the PNG`);
      assert.equal(size.height, height, `${size.file}: sidecar height matches the PNG`);
      assert.ok(index.includes(`"width": ${width}`), `cover-index carries ${size.file}'s real width`);
    }
  }
});

test("no cover is drawn wider than the file behind it", async () => {
  const css = await readFile(path.join(root, "styles/components.css"), "utf8");
  const band = css.slice(css.indexOf(".module-cover {"), css.indexOf(".module-cover-hint {"));
  // A fixed aspect-ratio plus `width: 100%` forces the image to the band's box, which stretches a 950 px file across
  // 1000 px. The band must take the height of the image it holds instead.
  assert.doesNotMatch(band, /aspect-ratio/, "the band does not impose a ratio on the file");
  assert.match(band, /width: auto/, "the image keeps its intrinsic width");
  assert.match(band, /max-width: 100%/, "the image still cannot overflow a narrow column");
});

test("the cover renderer maps every chapter and uses the same seed", async () => {
  const source = await readFile(path.join(root, "scripts/render-covers.mjs"), "utf8");
  for (const slug of covers) assert.ok(source.includes(`id: "${slug}"`), `renderer knows ${slug}`);
  assert.match(source, /installDeterministicRandom\(context, 42\)/, "the covers are seeded");
  // The capture viewports. These are viewports, not the file's size: the file is as wide as the figure it frames.
  assert.match(source, /2400, height: 900/, "the hero viewport is the one the header uses");
  assert.match(source, /1200, height: 450/, "the thumbnail viewport exists");
  // The sidecar must record the PNG's real size, not the requested clip box: Chromium rounds the rectangle, so the
  // clip is off by a pixel and the header would reserve the wrong box.
  assert.match(source, /readUInt32BE\(16\)/, "the sidecar reads the written width back");
  assert.match(source, /readUInt32BE\(20\)/, "the sidecar reads the written height back");
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

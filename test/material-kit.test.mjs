import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DataUtils, Mesh, Sprite } from "three";
import { positionLocal } from "three/tsl";
import { parseTokensCss, buildTokens, setTokenSource } from "../js/design/tokens.mjs";
import { sequentialEntry, diverging } from "../js/design/palettes.mjs";
import { blackbodyToSrgb } from "../js/science/spectrum.mjs";
import { inspectSceneCompatibility } from "../js/render/create-renderer.mjs";
import {
  BLACKBODY_LUT_DEFAULTS, blackbodyEmission, blackbodyLUT, blackbodyLutCoordinate, blackbodyLutData, blackbodyLutTemperature,
  createDataPoints, createKitProbeScene, engravedGridMaterial, fieldMaterial, kitPrewarmSignature, lineCoverage,
  normalizeBlackbodyOptions, normalizeDataPointOptions, normalizeFieldOptions, normalizeGridOptions, paletteLutData, paletteTexture,
} from "../js/render/materials/index.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokens = buildTokens(parseTokensCss(fs.readFileSync(path.join(root, "styles", "tokens.css"), "utf8")));
test.before(() => setTokenSource(tokens));
test.after(() => setTokenSource(null));

test("blackbody LUT entries are blackbodyToSrgb to 1e-6, log-uniform from tMin to tMax", () => {
  const data = blackbodyLutData();
  assert.equal(data.size, 256);
  assert.equal(data.rgba.length, 256 * 4);
  for (let i = 0; i < data.size; i += 15) {
    const expected = blackbodyToSrgb(blackbodyLutTemperature(i)).linearRgb;
    assert.ok(Math.abs(data.rgba[i * 4] - expected.r) < 1e-6, `r at ${i}`);
    assert.ok(Math.abs(data.rgba[i * 4 + 1] - expected.g) < 1e-6, `g at ${i}`);
    assert.ok(Math.abs(data.rgba[i * 4 + 2] - expected.b) < 1e-6, `b at ${i}`);
    assert.equal(data.rgba[i * 4 + 3], 1);
  }
  const last = blackbodyToSrgb(40000).linearRgb;
  assert.ok(Math.abs(data.rgba[255 * 4 + 2] - last.b) < 1e-6);
  assert.equal(blackbodyLutTemperature(0), 1000);
  assert.ok(Math.abs(blackbodyLutTemperature(255) - 40000) < 1e-6);
  const ratio = blackbodyLutTemperature(101) / blackbodyLutTemperature(100);
  assert.ok(Math.abs(ratio - blackbodyLutTemperature(201) / blackbodyLutTemperature(200)) < 1e-12, "constant ratio between entries");
});

test("blackbody LUT options are validated and the texture coordinate aims at texel centres", () => {
  assert.deepEqual({ ...normalizeBlackbodyOptions() }, { ...BLACKBODY_LUT_DEFAULTS });
  for (const bad of [{ tMin: 0 }, { tMin: -5 }, { tMin: 2000, tMax: 2000 }, { tMin: 5000, tMax: 1000 }, { size: 1 }, { size: 4097 }, { size: 8.5 }, { tMax: NaN }]) {
    assert.throws(() => normalizeBlackbodyOptions(bad), RangeError, JSON.stringify(bad));
  }
  assert.equal(blackbodyLutCoordinate(1000), 0.5 / 256);
  assert.equal(blackbodyLutCoordinate(40000), 255.5 / 256);
  assert.equal(blackbodyLutCoordinate(10), 0.5 / 256, "below tMin clamps");
  assert.equal(blackbodyLutCoordinate(1e6), 255.5 / 256, "above tMax clamps");
  const mid = blackbodyLutCoordinate(Math.sqrt(1000 * 40000));
  assert.ok(Math.abs(mid - (0.5 + 127.5) / 256) < 1e-12);
});

test("blackbody LUT texture is half float, linear-filtered, and within half-float precision of the table", () => {
  const lut = blackbodyLUT({ size: 64 });
  const data = blackbodyLutData({ size: 64 });
  assert.equal(lut.image.width, 64);
  assert.equal(lut.image.height, 1);
  assert.equal(lut.minFilter, lut.magFilter);
  assert.deepEqual(lut.userData.blackbodyLut, { tMin: 1000, tMax: 40000, size: 64 });
  for (let i = 0; i < data.rgba.length; i++) assert.ok(Math.abs(DataUtils.fromHalfFloat(lut.image.data[i]) - data.rgba[i]) < 1e-3, `entry ${i}`);
  assert.ok(blackbodyEmission(positionLocal.x, 2, lut).isNode);
});

test("field heatmap options are validated", () => {
  const ok = { range: [0, 1] };
  assert.doesNotThrow(() => normalizeFieldOptions(ok));
  for (const bad of [
    {}, { range: [1, 0] }, { range: [0, 0] }, { range: [0] }, { range: [0, NaN] }, { range: [0, 1], palette: "rainbow" },
    { range: [0, 1], palette: { stops: [[0, 0, 0]] } }, { range: [0, 1], palette: { stops: [[0, 0], [1, 1]] } },
    { range: [0, 1], paletteName: "jet" },
    { range: [0, 1], contours: { step: 0 } }, { range: [0, 1], contours: { step: 1, widthPx: 9 } }, { range: [0, 1], contours: { step: 1, opacity: 2 } },
  ]) assert.throws(() => normalizeFieldOptions(bad), RangeError, JSON.stringify(bad));
  assert.throws(() => fieldMaterial({ range: [0, 1] }), TypeError, "needs a value node");
});

test("palette tables: sequential equals the committed table, diverging the token ramp, custom stops interpolate in linear light", () => {
  const seq = paletteLutData({ range: [0, 1], palette: "sequential", paletteName: "magma" });
  assert.equal(seq.length, 256 * 4);
  for (const i of [0, 1, 127, 255]) {
    const entry = sequentialEntry("magma", i);
    for (let c = 0; c < 3; c++) assert.ok(Math.abs(seq[i * 4 + c] - entry[c]) < 1e-6, `magma ${i} channel ${c}`);
  }
  const ramp = diverging(tokens);
  const div = paletteLutData({ range: [-1, 1], palette: "diverging", tokens });
  for (const [i, v] of [[0, -1], [128, 1 / 255], [255, 1]]) {
    const expected = ramp.sample(v);
    for (let c = 0; c < 3; c++) assert.ok(Math.abs(div[i * 4 + c] - expected[c]) < 1e-6, `diverging ${i} channel ${c}`);
  }
  const custom = paletteLutData({ range: [0, 1], palette: { stops: [[0, 0, 0], [1, 0.5, 0.25], [0, 0, 1]] } }, 5);
  assert.deepEqual(Array.from(custom.slice(0, 4)), [0, 0, 0, 1]);
  assert.deepEqual(Array.from(custom.slice(4, 8)), [0.5, 0.25, 0.125, 1]);
  assert.deepEqual(Array.from(custom.slice(8, 12)), [1, 0.5, 0.25, 1]);
  assert.deepEqual(Array.from(custom.slice(16, 20)), [0, 0, 1, 1]);
  assert.throws(() => paletteLutData({ range: [0, 1] }, 1), RangeError);
  assert.equal(paletteTexture({ range: [0, 1] }, 16).image.width, 16);
});

test("field and grid materials build, carry the node-kit flag, and make a scene node-only", () => {
  const field = fieldMaterial({ valueNode: positionLocal.x, range: [-1, 1], contours: { step: 0.25, widthPx: 1, opacity: 0.5 } });
  assert.equal(field.userData.qgaNodeKit, true);
  assert.equal(field.userData.kit, "field-heatmap");
  const grid = engravedGridMaterial({ minor: 0.5, majorEvery: 4, fade: { near: 2, far: 9 } });
  assert.equal(grid.userData.qgaNodeKit, true);
  assert.equal(grid.transparent, true);
  assert.equal(grid.depthWrite, false);
  const scene = { traverse: (fn) => { fn({ material: field }); fn({ material: grid }); } };
  const result = inspectSceneCompatibility(scene);
  assert.equal(result.nodeCompatible, true);
  assert.equal(result.nodeOnly, true);
  assert.equal(result.kit, true);
  assert.equal(inspectSceneCompatibility({ traverse: (fn) => fn({ material: { type: "MeshStandardMaterial" } }) }).kit, false);
});

test("grid options are validated and line coverage needs a positive pixel width", () => {
  assert.doesNotThrow(() => normalizeGridOptions());
  for (const bad of [
    { space: "polar" }, { minor: 0 }, { minor: -1 }, { majorEvery: 1.5 }, { majorEvery: -1 }, { widthPx: 0 }, { widthPx: 9 }, { majorWidthPx: 0 },
    { opacity: 1.1 }, { fade: { near: 5, far: 5 } }, { fade: { near: -1, far: 5 } },
  ]) assert.throws(() => normalizeGridOptions(bad), RangeError, JSON.stringify(bad));
  assert.ok(lineCoverage(positionLocal.x, 1.25).isNode);
  for (const bad of [0, -1, NaN, Infinity]) assert.throws(() => lineCoverage(positionLocal.x, bad), RangeError);
});

test("data points: option validation and the sprite they build", () => {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 2, 0, 0]);
  assert.doesNotThrow(() => normalizeDataPointOptions({ positions }));
  for (const bad of [
    {}, { positions: [0, 0, 0] }, { positions: new Float32Array(0) }, { positions: new Float32Array(4) },
    { positions, sizePx: 0 }, { positions, sizePx: new Float32Array(2) }, { positions, sizePx: new Float32Array([1, 1, -1]) },
    { positions, colors: new Float32Array(3) }, { positions, colors: new Float32Array(9), color: [1, 1, 1] },
    { positions, profile: "square" }, { positions, opacity: 2 }, { positions, ring: { widthPx: 0 } },
    { positions, twinkle: { phases: new Float32Array(2), depth: 0.3, rate: 1 } }, { positions, twinkle: { phases: new Float32Array(3), depth: 2, rate: 1 } },
  ]) assert.throws(() => normalizeDataPointOptions(bad), (error) => error instanceof RangeError || error instanceof TypeError, JSON.stringify(Object.keys(bad)));
  const colors = new Float32Array(9).fill(0.5);
  const points = createDataPoints({ positions, colors, sizePx: new Float32Array([2, 3, 4]), profile: "soft", additive: true, dynamic: true, ring: { widthPx: 1 } });
  assert.ok(points.object instanceof Sprite);
  assert.equal(points.object.count, 3);
  assert.equal(points.object.frustumCulled, false);
  assert.equal(points.material.userData.qgaNodeKit, true);
  points.setCount(2);
  assert.equal(points.object.count, 2);
  points.setCount(99);
  assert.equal(points.object.count, 3, "never more than were created");
  points.setCount(-4);
  assert.equal(points.object.count, 0);
  points.setPositions(new Float32Array([9, 9, 9, 1, 1, 1, 2, 2, 2]));
  assert.equal(positions[0], 9, "positions are rewritten in place");
  points.setColors(new Float32Array(9).fill(0.25));
  assert.equal(colors[0], 0.25);
  assert.throws(() => points.setPositions(new Float32Array(3)), RangeError);
  assert.throws(() => points.setColors(new Float32Array(3)), RangeError);
  assert.throws(() => createDataPoints({ positions }).setColors(new Float32Array(9)), TypeError);
});

test("kit prewarm signature names every module and the probe scene holds one object per variant", () => {
  const signature = kitPrewarmSignature();
  for (const name of ["blackbody", "data-points", "engraved-grid", "field-heatmap"]) assert.ok(signature.includes(name), name);
  assert.equal(signature, kitPrewarmSignature(), "stable");
  const scene = createKitProbeScene();
  const meshes = [];
  scene.traverse((object) => { if (object.material) meshes.push(object); });
  assert.equal(meshes.length, 4);
  assert.ok(meshes.every((object) => object.material.userData.qgaNodeKit === true));
  assert.ok(meshes.some((object) => object instanceof Mesh) && meshes.some((object) => object instanceof Sprite));
  scene.userData.dispose();
});

test("no ShaderMaterial remains outside the Kerr integrator and the GW lattice's WebGL2 twin (S07, D-035)", async () => {
  const { runAudit } = await import("../scripts/perf/static-audit.mjs");
  const audit = await runAudit(root);
  const files = [...new Set(audit.sites.ShaderMaterial.map((site) => site.split(":")[0]))].sort();
  // gw-runtime.mjs is the WebGL2 twin of the WebGPU compute lattice; S26 replaces the lattice with the GPU spacetime field.
  assert.deepEqual(files, ["js/visualizations/gw/gw-runtime.mjs", "js/visualizations/kerr/kerr-material.mjs"]);
});

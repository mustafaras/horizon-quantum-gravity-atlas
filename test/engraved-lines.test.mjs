import test from "node:test";
import assert from "node:assert/strict";
import { prepareEngravedLines, resolveEngravedBackendKind, setEngravedBackend, engravedBackend } from "../js/visualizations/common/engraved-backend.mjs";
import {
  engravedLine, engravedSegments, updateEngravedLine, setEngravedOpacity, setEngravedColor, setEngravedTokens,
  normalizeEngravedOptions, flattenPoints, ENGRAVED_HALO_MAX, ENGRAVED_WIDTH_PX,
} from "../js/visualizations/common/engraved-lines.mjs";

const MOCK_TOKENS = { hex: (name) => ({ "mock-blue": 0x336699, "mock-red": 0xcc3322 })[name] };
const points = (n, dx = 0) => Array.from({ length: n }, (_, i) => ({ x: i + dx, y: i * 0.5, z: 0 }));

test.before(() => setEngravedTokens(MOCK_TOKENS));
test.after(() => setEngravedTokens());

test("backend kind follows the renderer the scene can reach", () => {
  assert.equal(resolveEngravedBackendKind({ hasWebGPU: true }), "node");
  assert.equal(resolveEngravedBackendKind({ hasWebGPU: false }), "classic");
  assert.equal(resolveEngravedBackendKind({ hasWebGPU: true, forceBackend: "webgl2" }), "classic");
  assert.equal(resolveEngravedBackendKind({ hasWebGPU: true, forceBackend: "auto" }), "node");
  assert.equal(resolveEngravedBackendKind({ hasWebGPU: true, recovery: true }), "classic");
  assert.throws(() => resolveEngravedBackendKind({ forceBackend: "vulkan" }), RangeError);
});

test("using a line before a backend is selected fails loudly", () => {
  setEngravedBackend(null);
  assert.throws(() => engravedBackend(), /prepareEngravedLines/);
  assert.throws(() => engravedLine(points(3), { color: "mock-blue" }), /prepareEngravedLines/);
});

test("option validation rejects out-of-range and ambiguous input", () => {
  const ok = { color: "mock-blue" };
  assert.doesNotThrow(() => normalizeEngravedOptions(ok));
  assert.equal(normalizeEngravedOptions(ok).widthPx, ENGRAVED_WIDTH_PX.standard);
  for (const bad of [
    { ...ok, widthPx: 0 }, { ...ok, widthPx: -1 }, { ...ok, widthPx: 17 }, { ...ok, widthPx: NaN },
    { ...ok, opacity: 1.1 }, { ...ok, opacity: -0.1 },
    { ...ok, halo: ENGRAVED_HALO_MAX + 0.01 }, { ...ok, halo: -0.01 },
    { ...ok, layer: "chrome" },
    { ...ok, dash: { size: 0, gap: 1 } }, { ...ok, dash: { size: 1 } },
    { ...ok, depthFade: [5, 1] }, { ...ok, depthFade: [-1, 4] }, { ...ok, depthFade: [1] },
    {},
  ]) assert.throws(() => normalizeEngravedOptions(bad), RangeError, JSON.stringify(bad));
  const frozen = normalizeEngravedOptions({ ...ok, dash: { size: 0.2, gap: 0.1 }, depthFade: [1, 4] });
  assert.ok(Object.isFrozen(frozen) && Object.isFrozen(frozen.dash) && Object.isFrozen(frozen.depthFade));
});

test("flattenPoints accepts Vector3-likes and flat arrays and can write into a buffer", () => {
  assert.deepEqual([...flattenPoints([{ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 }])], [1, 2, 3, 4, 5, 6]);
  assert.deepEqual([...flattenPoints([1, 2, 3, 4, 5, 6])], [1, 2, 3, 4, 5, 6]);
  assert.throws(() => flattenPoints(new Float32Array(4)), RangeError);
  const into = new Float32Array(6);
  assert.equal(flattenPoints([{ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 }], into), into);
});

for (const hasWebGPU of [false, true]) {
  const label = hasWebGPU ? "node (Line2NodeMaterial)" : "classic (LineMaterial)";
  test(`${label}: lines carry width, token colour, layer and optional halo`, async () => {
    const backend = await prepareEngravedLines({ hasWebGPU });
    assert.equal(backend.kind, hasWebGPU ? "node" : "classic");
    const line = engravedLine(points(4), { color: "mock-blue", widthPx: ENGRAVED_WIDTH_PX.focal, layer: "data" });
    assert.equal(line.isLine2, true);
    assert.equal(line.material.linewidth, 2.5);
    assert.equal(line.material.color.getHex(), 0x336699);
    assert.equal(line.userData.engraved.layer, "data");
    assert.equal(line.children.length, 0);
    assert.equal(line.material.transparent, false);

    const haloed = engravedLine(points(4), { color: "mock-blue", widthPx: 2, halo: 0.1 });
    const [halo] = haloed.children;
    assert.equal(halo.material.linewidth, 2 * 3);
    assert.equal(halo.material.opacity, 0.1);
    assert.ok(halo.renderOrder < haloed.renderOrder, "the halo is drawn first");
    assert.equal(halo.material.transparent, true);
    assert.equal(halo.material.depthWrite, false);
  });

  test(`${label}: unknown tokens fail instead of falling back to a colour`, async () => {
    await prepareEngravedLines({ hasWebGPU });
    assert.throws(() => engravedLine(points(3), { color: "no-such-token" }), /unknown colour token/);
    assert.throws(() => engravedLine(points(3), { color: "#ff0000" }), /unknown colour token/);
  });

  test(`${label}: updateEngravedLine reuses the instance buffer for an equal point count`, async () => {
    await prepareEngravedLines({ hasWebGPU });
    const line = engravedLine(points(5), { color: "mock-red", halo: 0.08 });
    const buffer = line.geometry.attributes.instanceStart.data;
    const array = buffer.array;
    const haloBuffer = line.children[0].geometry.attributes.instanceStart.data;
    updateEngravedLine(line, points(5, 10));
    assert.equal(line.geometry.attributes.instanceStart.data, buffer, "same InstancedInterleavedBuffer");
    assert.equal(buffer.array, array, "same typed array");
    assert.equal(array[0], 10);
    assert.equal(array[6], 11);
    assert.equal(line.children[0].geometry.attributes.instanceStart.data, haloBuffer);
    assert.ok(buffer.version > 0, "the buffer is flagged for upload");
    assert.equal(line.geometry.boundingBox.min.x, 10);
    updateEngravedLine(line, points(7));
    assert.equal(line.geometry.attributes.instanceStart.count, 6, "a new length rebuilds the geometry");
    assert.throws(() => updateEngravedLine({}, points(3)), RangeError);
  });

  test(`${label}: segments take consecutive pairs and update in place`, async () => {
    await prepareEngravedLines({ hasWebGPU });
    const seg = engravedSegments(points(6), { color: "mock-blue" });
    assert.equal(seg.isLineSegments2, true);
    assert.equal(seg.geometry.attributes.instanceStart.count, 3);
    const array = seg.geometry.attributes.instanceStart.data.array;
    updateEngravedLine(seg, points(6, 2));
    assert.equal(seg.geometry.attributes.instanceStart.data.array, array);
    assert.equal(array[0], 2);
    assert.throws(() => engravedSegments(points(5), { color: "mock-blue" }), RangeError);
    assert.throws(() => engravedLine(points(1), { color: "mock-blue" }), RangeError);
  });

  test(`${label}: dash, per-vertex colours and opacity switching`, async () => {
    await prepareEngravedLines({ hasWebGPU });
    const dashed = engravedLine(points(4), { color: "mock-blue", dash: { size: 0.22, gap: 0.14 } });
    assert.equal(dashed.material.dashed, true);
    assert.ok(dashed.geometry.attributes.instanceDistanceStart, "line distances are computed for dashes");
    const coloured = engravedLine(points(3), { colors: new Float32Array(9).fill(0.5) });
    assert.equal(coloured.material.vertexColors, true);
    assert.ok(coloured.geometry.attributes.instanceColorStart);
    const faded = engravedLine(points(3), { color: "mock-blue", opacity: 0.5 });
    assert.equal(faded.material.transparent, true);
    setEngravedOpacity(faded, 1);
    assert.equal(faded.material.transparent, false);
    setEngravedOpacity(faded, 0.25);
    assert.equal(faded.material.transparent, true);
    assert.equal(faded.material.opacity, 0.25);
    assert.throws(() => setEngravedOpacity(faded, 2), RangeError);
    setEngravedColor(faded, "mock-red");
    assert.equal(faded.material.color.getHex(), 0xcc3322);
  });

  test(`${label}: depthFade builds a fade on the material`, async () => {
    await prepareEngravedLines({ hasWebGPU });
    const line = engravedLine(points(3), { color: "mock-blue", depthFade: [2, 9] });
    if (hasWebGPU) assert.ok(line.material.opacityNode, "TSL opacityNode");
    else assert.equal(typeof line.material.onBeforeCompile, "function");
    const plain = engravedLine(points(3), { color: "mock-blue" });
    if (hasWebGPU) assert.equal(plain.material.opacityNode, null);
  });
}

test("the classic depth fade patches the vendored shader strings it relies on", async () => {
  await prepareEngravedLines({ hasWebGPU: false });
  const line = engravedLine(points(3), { color: "mock-blue", depthFade: [2, 9] });
  const material = line.material;
  const shader = { uniforms: {}, vertexShader: material.vertexShader, fragmentShader: material.fragmentShader };
  material.onBeforeCompile(shader);
  assert.match(shader.vertexShader, /vEngravedDepth = -\( position\.y < 0\.5 \? start\.z : end\.z \)/);
  assert.match(shader.fragmentShader, /alpha \*= 1\.0 - smoothstep\( engravedFade\.x, engravedFade\.y, vEngravedDepth \)/);
  assert.deepEqual(shader.uniforms.engravedFade.value, [2, 9]);
});

import test from "node:test";
import assert from "node:assert/strict";
import { prepareEngravedLines, resolveEngravedBackendKind, setEngravedBackend, engravedBackend } from "../js/visualizations/common/engraved-backend.mjs";
import {
  engravedLine, engravedSegments, engravedStream, setEngravedPoints, setEngravedCount, expandIndexedSegments, engravedFor, updateEngravedLine, setEngravedOpacity, setEngravedColor, setEngravedTokens,
  normalizeEngravedOptions, flattenPoints, ENGRAVED_HALO_MAX, ENGRAVED_PAD_PX, ENGRAVED_WIDTH_PX, setEngravedWidth,
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

test("a node-material scene keeps node lines on every backend it can reach, and has no classic recovery (S07)", () => {
  assert.equal(resolveEngravedBackendKind({ hasWebGPU: false, requireNode: true }), "node");
  assert.equal(resolveEngravedBackendKind({ hasWebGPU: true, forceBackend: "webgl2", requireNode: true }), "node");
  assert.equal(resolveEngravedBackendKind({ hasWebGPU: true, recovery: true, requireNode: true }), "node");
  assert.equal(resolveEngravedBackendKind({ hasWebGPU: true, forceBackend: "static", requireNode: true }), "classic");
  assert.throws(() => resolveEngravedBackendKind({ forceBackend: "vulkan", requireNode: true }), RangeError);
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
    assert.equal(line.material.linewidth, 2.5 + ENGRAVED_PAD_PX, "the quad is padded for the analytic edge coverage");
    assert.equal(line.userData.engraved.widthPx, 2.5);
    assert.equal(line.material.color.getHex(), 0x336699);
    assert.equal(line.userData.engraved.layer, "data");
    assert.equal(line.children.length, 0);
    assert.equal(line.material.transparent, true, "engraved lines always blend: the edge coverage is an alpha");
    assert.equal(line.material.depthWrite, false);

    const haloed = engravedLine(points(4), { color: "mock-blue", widthPx: 2, halo: 0.1 });
    const [halo] = haloed.children;
    assert.equal(halo.material.linewidth, 2 * 3 + ENGRAVED_PAD_PX);
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

  test(`${label}: setEngravedCount replaces setDrawRange and updateEngravedLine rewrites colours in place`, async () => {
    await prepareEngravedLines({ hasWebGPU });
    const line = engravedLine(points(5), { colors: new Float32Array(15), halo: 0.1 });
    setEngravedCount(line, 3);
    assert.equal(line.geometry.instanceCount, 2);
    assert.equal(line.children[0].geometry.instanceCount, 2, "the halo follows");
    setEngravedCount(line, 99);
    assert.equal(line.geometry.instanceCount, 4, "clamped to the segments that exist");
    setEngravedCount(line, 0);
    assert.equal(line.geometry.instanceCount, 0);
    const colorBuffer = line.geometry.attributes.instanceColorStart.data;
    const colorArray = colorBuffer.array;
    updateEngravedLine(line, points(5), new Float32Array(15).fill(0.5));
    assert.equal(colorBuffer.array, colorArray, "colours are written in place");
    assert.equal(colorArray[0], 0.5);
    const segments = engravedSegments(points(6), { colors: new Float32Array(18) });
    setEngravedCount(segments, 4);
    assert.equal(segments.geometry.instanceCount, 2);
    assert.throws(() => setEngravedCount({}, 2), RangeError);
  });

  test(`${label}: dash, per-vertex colours and opacity`, async () => {
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
    assert.equal(faded.material.opacity, 1);
    assert.equal(faded.material.transparent, true);
    setEngravedOpacity(faded, 0.25);
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

for (const hasWebGPU of [false, true]) {
  test(`${hasWebGPU ? "node" : "classic"}: a stream shows count - 1 segments without reallocating`, async () => {
    const backend = await prepareEngravedLines({ hasWebGPU });
    const stream = engravedStream(6, { color: "mock-blue", vertexColors: true, opacity: 0.5, additive: true }, backend);
    assert.equal(stream.geometry.instanceCount, 0);
    assert.equal(stream.frustumCulled, false);
    assert.equal(stream.material.transparent, true);
    const start = stream.geometry.attributes.instanceStart.data;
    const array = start.array;
    const flat = new Float32Array([0, 0, 0, 1, 0, 0, 2, 1, 0, 3, 1, 0, 4, 2, 0, 5, 2, 0]);
    const colors = new Float32Array(18).fill(0.25);
    setEngravedPoints(stream, flat, 4, colors);
    assert.equal(stream.geometry.instanceCount, 3);
    assert.equal(start.array, array);
    assert.deepEqual([...array.slice(0, 12)], [0, 0, 0, 1, 0, 0, 1, 0, 0, 2, 1, 0]);
    assert.equal(stream.geometry.attributes.instanceColorStart.data.array[0], 0.25);
    setEngravedPoints(stream, flat, 99, colors);
    assert.equal(stream.geometry.instanceCount, 5, "counts above the capacity are clamped");
    setEngravedPoints(stream, flat, 1);
    assert.equal(stream.geometry.instanceCount, 0, "one point draws nothing");
    assert.throws(() => engravedStream(1, { color: "mock-blue" }, backend), RangeError);
    assert.throws(() => engravedStream(4, { color: "mock-blue", dash: { size: 1, gap: 1 } }, backend), RangeError);
    assert.throws(() => setEngravedPoints({}, flat, 2), RangeError);
  });

  test(`${hasWebGPU ? "node" : "classic"}: engravedFor binds lines to one backend`, async () => {
    const bound = engravedFor(await prepareEngravedLines({ hasWebGPU }));
    await prepareEngravedLines({ hasWebGPU: !hasWebGPU });
    const line = bound.line(points(3), { color: "mock-blue" });
    assert.equal(line.userData.engraved.backend.kind, hasWebGPU ? "node" : "classic", "later prepare() calls do not rebind it");
    assert.equal(bound.kind, hasWebGPU ? "node" : "classic");
    assert.throws(() => engravedFor(null), RangeError);
  });
}

test("expandIndexedSegments turns an indexed line list into consecutive pairs", () => {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0]);
  assert.deepEqual([...expandIndexedSegments(positions, [0, 1, 1, 2])], [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0]);
  const into = new Float32Array(12);
  assert.equal(expandIndexedSegments(positions, [0, 1, 1, 2], into), into);
  assert.throws(() => expandIndexedSegments(positions, [0, 1], new Float32Array(3)), RangeError);
});

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

test("the classic shader gets analytic edge coverage with the true width, and widths can change", async () => {
  await prepareEngravedLines({ hasWebGPU: false });
  const line = engravedLine(points(3), { color: "mock-blue", widthPx: 2, halo: 0.1 });
  const shader = { uniforms: {}, vertexShader: line.material.vertexShader, fragmentShader: line.material.fragmentShader };
  line.material.onBeforeCompile(shader);
  assert.match(shader.fragmentShader, /alpha \*= clamp\( engravedWidth \* 0\.5 \* engravedDpr - abs\( vUv\.x \) \* linewidth/);
  assert.doesNotMatch(shader.fragmentShader, /engravedFade\.x, engravedFade\.y, vEngravedDepth \)/);
  assert.equal(shader.uniforms.engravedWidth.value, 2);
  setEngravedWidth(line, 2.5);
  assert.equal(shader.uniforms.engravedWidth.value, 2.5, "the shader uniform object is shared");
  assert.equal(line.material.linewidth, 2.5 + ENGRAVED_PAD_PX);
  assert.equal(line.children[0].material.linewidth, 7.5 + ENGRAVED_PAD_PX, "the halo keeps its 3x ratio");
  assert.throws(() => setEngravedWidth(line, 0), RangeError);
});

test("the node material keeps the true width in a uniform and pads the quad", async () => {
  await prepareEngravedLines({ hasWebGPU: true });
  const line = engravedLine(points(3), { color: "mock-blue", widthPx: 1.25 });
  assert.equal(line.material.engravedWidth.value, 1.25);
  setEngravedWidth(line, 2.5);
  assert.equal(line.material.engravedWidth.value, 2.5);
  assert.equal(line.material.linewidth, 2.5 + ENGRAVED_PAD_PX);
});

for (const hasWebGPU of [false, true]) {
  test(`${hasWebGPU ? "node" : "classic"}: engravedGrid replaces GridHelper with centre-line colour`, async () => {
    const backend = await prepareEngravedLines({ hasWebGPU });
    const grid = engravedFor(backend).grid(16, 8, { color: "mock-blue", centerColor: "mock-red", opacity: 0.2 });
    assert.equal(grid.isLineSegments2, true);
    assert.equal(grid.geometry.attributes.instanceStart.count, 9 * 2, "(divisions + 1) lines in each direction");
    const colors = grid.geometry.attributes.instanceColorStart.data.array;
    const lineColor = (i) => [...colors.slice(i * 12, i * 12 + 3)];
    assert.notDeepEqual(lineColor(4), lineColor(3), "line 4 of 8 is the centre line");
    assert.deepEqual(lineColor(3), lineColor(5));
    const plain = engravedFor(backend).grid(10, 4, { color: "mock-blue" });
    assert.equal(plain.geometry.attributes.instanceColorStart, undefined, "one colour needs no vertex colours");
    assert.equal(plain.material.color.getHex(), 0x336699);
    assert.throws(() => engravedFor(backend).grid(0, 4, { color: "mock-blue" }), RangeError);
    assert.throws(() => engravedFor(backend).grid(10, 1.5, { color: "mock-blue" }), RangeError);
  });
}

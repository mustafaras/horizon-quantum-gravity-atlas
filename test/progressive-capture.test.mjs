import test from "node:test";
import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import {
  CAPTURE_PRESETS,
  CAPTURE_DEFAULT_MAX_BYTES,
  estimateCaptureMemoryBytes,
  validateCaptureRequest,
  resolveCaptureDimensions,
  planCaptureChunks,
  buildCaptureMetadata,
  encodePng,
  parsePngChunks,
  upscaleRgba,
  flipRgbaVertically,
  runProgressiveCapture,
  CaptureCancelledError,
} from "../js/render/progressive-capture.mjs";

test("capture presets cover 2K, 4K and 8K heights", () => {
  assert.deepEqual(Object.keys(CAPTURE_PRESETS), ["2k", "4k", "8k"]);
  assert.equal(CAPTURE_PRESETS["2k"].height, 1440);
  assert.equal(CAPTURE_PRESETS["4k"].height, 2160);
  assert.equal(CAPTURE_PRESETS["8k"].height, 4320);
});

test("the memory model scales with pixels and the float type", () => {
  const floatBytes = estimateCaptureMemoryBytes(100, 100, { floatBytesPerPixel: 16 });
  const halfBytes = estimateCaptureMemoryBytes(100, 100, { floatBytesPerPixel: 8 });
  assert.ok(floatBytes > halfBytes);
  assert.equal(estimateCaptureMemoryBytes(200, 100, { floatBytesPerPixel: 16 }), 2 * floatBytes);
  // 8K at 16:9 stays under the default 2 GiB guard; a 21:9 8K does not.
  const wide = resolveCaptureDimensions({ preset: "8k", aspect: 21 / 9 });
  assert.ok(estimateCaptureMemoryBytes(wide.width, wide.height) > CAPTURE_DEFAULT_MAX_BYTES);
});

test("unsafe dimensions are rejected before allocation with actionable messages", () => {
  assert.throws(
    () => validateCaptureRequest({ width: 1, height: 100 }),
    TypeError,
  );
  assert.throws(
    () => validateCaptureRequest({ width: 20000, height: 100, maxDimension: 8192 }),
    /maximum texture dimension of 8192.*smaller preset|upscale/s,
  );
  assert.throws(
    () => validateCaptureRequest({ width: 20000, height: 12000, maxMemoryBytes: 1024 ** 3 }),
    /memory.*guard.*smaller preset|upscale/s,
  );
  const ok = validateCaptureRequest({ width: 2560, height: 1440 });
  assert.equal(ok.width, 2560);
  assert.ok(ok.bytes > 0);
});

test("preset resolution follows the live aspect and explicit dimensions win", () => {
  const wide = resolveCaptureDimensions({ preset: "2k", aspect: 2 });
  assert.equal(wide.height, 1440);
  assert.equal(wide.width, 2880);
  const exact = resolveCaptureDimensions({ preset: "2k", aspect: 2, width: 640, height: 400 });
  assert.deepEqual([exact.width, exact.height], [640, 400]);
  assert.throws(() => resolveCaptureDimensions({ preset: "5k" }), /Unknown capture preset/);
  // The aspect is clamped to a sane band.
  const clamped = resolveCaptureDimensions({ preset: "2k", aspect: 99 });
  assert.ok(clamped.width / clamped.height <= 4.01);
});

test("chunk plans are deterministic and cover every sample exactly once", () => {
  const chunks = planCaptureChunks({ samples: 10, samplesPerChunk: 4 });
  assert.deepEqual(chunks.map((c) => c.count), [4, 4, 2]);
  assert.equal(chunks[0].start, 0);
  assert.equal(chunks[chunks.length - 1].start + chunks[chunks.length - 1].count, 10);
  const single = planCaptureChunks({ samples: 3, samplesPerChunk: 8 });
  assert.deepEqual(single.map((c) => c.count), [3]);
  assert.throws(() => planCaptureChunks({ samples: 0 }), TypeError);
});

test("the metadata sidecar carries state, provenance, backend, samples and commit hash", () => {
  const metadata = buildCaptureMetadata({
    state: { aStar: 0.9 }, provenance: { status: "effective" }, backend: "webgl2",
    quality: { effective: "ultra" }, resolution: { width: 2560, height: 1440 },
    sampleCount: 96, seed: 42, commitHash: "abc1234",
    volume: { corona: true, jets: true },
  });
  assert.equal(metadata.schema, "horizon-qga-capture/v1");
  assert.equal(metadata.commitHash, "abc1234");
  assert.equal(metadata.sampleCount, 96);
  assert.equal(metadata.state.aStar, 0.9);
  assert.ok(metadata.capturedAt);
  const missing = buildCaptureMetadata({ commitHash: null });
  assert.match(missing.commitHash, /not recorded/);
});

test("the PNG encoder round-trips pixels and tEXt metadata with valid CRCs", async () => {
  const width = 7;
  const height = 5;
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = (i * 7) % 256;
    rgba[i + 1] = (i * 13) % 256;
    rgba[i + 2] = (i * 29) % 256;
    rgba[i + 3] = 255;
  }
  const sidecar = JSON.stringify({ schema: "horizon-qga-capture/v1", note: "héllo ★" });
  const png = await encodePng({ width, height, rgba, textChunks: { "horizon-qga-capture": sidecar, Software: "HORIZON test" } });
  const parsed = parsePngChunks(png);
  assert.equal(parsed.width, width);
  assert.equal(parsed.height, height);
  assert.equal(parsed.bitDepth, 8);
  assert.equal(parsed.colorType, 6);
  assert.equal(parsed.text.Software, "HORIZON test");
  assert.deepEqual(JSON.parse(parsed.text["horizon-qga-capture"]), JSON.parse(sidecar), "non-ASCII escapes round-trip");
  // Decode the IDAT and undo the Sub filter to recover the exact pixels.
  const idat = parsed.chunks.filter((c) => c.type === "IDAT").map((c) => c.data);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const recovered = new Uint8Array(rgba.length);
  for (let y = 0; y < height; y += 1) {
    assert.equal(raw[y * (stride + 1)], 1, "Sub filter byte");
    for (let x = 0; x < stride; x += 1) {
      const left = x >= 4 ? recovered[y * stride + x - 4] : 0;
      recovered[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + left) & 0xff;
    }
  }
  assert.deepEqual(recovered, rgba, "pixel-exact round trip");
  // Deterministic encoding: the same input and text chunks give the same bytes.
  const again = await encodePng({ width, height, rgba, textChunks: { "horizon-qga-capture": sidecar, Software: "HORIZON test" } });
  assert.deepEqual(again, png);
  await assert.rejects(encodePng({ width: 2, height: 2, rgba: new Uint8Array(4) }), /pixel buffer/);
});

test("Lanczos-3 upscale preserves constants and gradients", () => {
  const width = 8;
  const height = 4;
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      rgba[index] = 200;
      rgba[index + 1] = 30 + x * 5;
      rgba[index + 2] = 90;
      rgba[index + 3] = 255;
    }
  }
  const out = upscaleRgba(rgba, width, height, 2);
  assert.equal(out.length, (width * 2) * (height * 2) * 4);
  // A constant channel stays constant.
  for (let i = 0; i < out.length; i += 4) {
    assert.equal(out[i], 200);
    assert.equal(out[i + 3], 255);
  }
  // A linear gradient stays linear in the interior (Lanczos-3 has small
  // ripple near the borders): the slope per output pixel is the source slope
  // divided by the factor.
  const y = 3;
  const outWidth = width * 2;
  const row = [];
  for (let x = 0; x < outWidth; x += 1) row.push(out[(y * outWidth + x) * 4 + 1]);
  const slope = (row[9] - row[6]) / 3;
  assert.ok(Math.abs(slope - 5 / 2) < 0.2, `interior gradient slope preserved (got ${slope.toFixed(2)}, want 2.5)`);
  assert.throws(() => upscaleRgba(rgba, width, height, 1), /factor/);
});

test("the row flip inverts the buffer and is its own inverse", () => {
  const width = 3;
  const height = 4;
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      rgba[index] = y * 10 + x;
      rgba[index + 3] = 255;
    }
  }
  const original = Uint8Array.from(rgba);
  const flipped = flipRgbaVertically(rgba, width, height);
  assert.equal(flipped, rgba, "flips in place");
  // Row y of the result is row (height - 1 - y) of the source.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      assert.equal(rgba[(y * width + x) * 4], (height - 1 - y) * 10 + x);
    }
  }
  flipRgbaVertically(rgba, width, height);
  assert.deepEqual(rgba, original, "applying the flip twice restores the source");
  // A single-row image is unchanged, and a size mismatch is rejected.
  const single = Uint8Array.from([1, 2, 3, 4]);
  assert.deepEqual(flipRgbaVertically(single, 1, 1), single);
  assert.throws(() => flipRgbaVertically(new Uint8Array(4), 2, 2), /size mismatch/);
});

test("the orchestrator reports progress, honours cancellation and names its errors", async () => {
  const drawn = [];
  const progress = [];
  const result = await runProgressiveCapture({
    width: 4, height: 4, samples: 6, samplesPerChunk: 2,
    prepare() { progress.push("prepared"); },
    drawSample(i) { drawn.push(i); },
    compose: () => new Uint8Array(4 * 4 * 4),
    onProgress: ({ stage, fraction }) => progress.push(`${stage}:${fraction.toFixed(2)}`),
  });
  assert.deepEqual(drawn, [0, 1, 2, 3, 4, 5]);
  assert.equal(result.samplesCompleted, 6);
  assert.ok(progress.includes("prepared"));
  assert.ok(progress.includes("accumulating:1.00"));
  assert.ok(progress.includes("done:1.00"));

  const signal = { aborted: false };
  const promise = runProgressiveCapture({
    width: 4, height: 4, samples: 10, samplesPerChunk: 2,
    prepare() {}, drawSample() { signal.aborted = true; }, compose: () => new Uint8Array(64), signal,
  });
  await assert.rejects(promise, (error) => error instanceof CaptureCancelledError && error.name === "CaptureCancelledError");
  await assert.rejects(
    runProgressiveCapture({ width: 4, height: 4, samples: 2, prepare() {}, drawSample() {} }),
    /prepare, drawSample and compose/,
  );
});

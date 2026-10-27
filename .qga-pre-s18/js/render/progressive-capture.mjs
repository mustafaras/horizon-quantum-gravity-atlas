/**
 * Progressive ultra-quality still capture (Prompt 05).
 *
 * A renderer-agnostic orchestration layer plus the pure planning, guarding
 * and encoding pieces every capture path shares:
 *
 *   - CAPTURE_PRESETS: 2K / 4K / 8K stills (height-driven; the width follows
 *     the live framing so a capture is exactly "what you see").
 *   - estimateCaptureMemoryBytes / validateCaptureRequest: a measured
 *     GPU-memory guard. Unsafe dimensions are rejected *before* allocation
 *     with an actionable message naming the limit and the safe alternative.
 *   - planCaptureChunks: deterministic chunking of the jittered samples so
 *     the UI stays responsive and progress/cancel stay live.
 *   - runProgressiveCapture: the chunked loop (prepare -> drawSample xN ->
 *     compose) with progress, cancellation and named errors.
 *   - buildCaptureMetadata: the sidecar embedded in every PNG (state,
 *     provenance, version, backend, sample count, commit hash).
 *   - encodePng / parsePngTextChunks: a dependency-free PNG encoder with
 *     tEXt metadata chunks (zlib via CompressionStream in the browser,
 *     node:zlib in Node) and a parser used by the tests and the QA specs.
 *   - upscaleRgba: phase-tabulated Lanczos-3 for the optional upscale path.
 *
 * Pure pieces have no DOM and no Three.js; the orchestrator accepts the
 * renderer only through the caller's callbacks.
 */

/* ------------------------------------------------------------------ */
/* Presets and the memory guard                                        */
/* ------------------------------------------------------------------ */

export const CAPTURE_PRESETS = Object.freeze({
  "2k": Object.freeze({ label: "2K", height: 1440 }),
  "4k": Object.freeze({ label: "4K", height: 2160 }),
  "8k": Object.freeze({ label: "8K", height: 4320 }),
});

/**
 * Byte model of one capture allocation. The accumulation is a ping-pong of
 * float RGBA targets; composition adds one float display target, one byte
 * output target, the CPU readback and the encode working set.
 */
export const CAPTURE_MEMORY_MODEL = Object.freeze({
  accumulationTargets: 2,
  composeFloatTargets: 1,
  composeByteTargets: 1,
  readbackBytesPerPixel: 4,
  encodeBytesPerPixel: 2,
});

/** Default guard: 2 GiB of capture-side allocation. */
export const CAPTURE_DEFAULT_MAX_BYTES = 2 * 1024 ** 3;

/** Total capture-side bytes for a still of the given size. */
export function estimateCaptureMemoryBytes(width, height, { floatBytesPerPixel = 16 } = {}) {
  const pixels = Math.max(0, Math.round(width)) * Math.max(0, Math.round(height));
  const { accumulationTargets, composeFloatTargets, composeByteTargets, readbackBytesPerPixel, encodeBytesPerPixel } = CAPTURE_MEMORY_MODEL;
  return pixels * (
    accumulationTargets * floatBytesPerPixel
    + composeFloatTargets * floatBytesPerPixel
    + composeByteTargets * 4
    + readbackBytesPerPixel
    + encodeBytesPerPixel
  );
}

function formatBytes(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MiB`;
  return `${(bytes / 1024).toFixed(0)} KiB`;
}

/**
 * Validate a capture request before any allocation. Throws a RangeError with
 * an actionable message (the measured requirement, the limit, and the safe
 * alternative) or a TypeError for malformed input.
 */
export function validateCaptureRequest({
  width, height, maxMemoryBytes = CAPTURE_DEFAULT_MAX_BYTES, maxDimension = 16384,
  floatBytesPerPixel = 16,
} = {}) {
  const w = Math.round(Number(width));
  const h = Math.round(Number(height));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 2 || h < 2) {
    throw new TypeError(`Capture dimensions must be finite integers >= 2; received ${width}x${height}.`);
  }
  if (!Number.isFinite(maxMemoryBytes) || maxMemoryBytes <= 0) {
    throw new TypeError(`The capture memory guard must be a positive number of bytes; received ${maxMemoryBytes}.`);
  }
  if (!Number.isFinite(maxDimension) || maxDimension < 2) {
    throw new TypeError(`The maximum texture dimension must be >= 2; received ${maxDimension}.`);
  }
  if (w > maxDimension || h > maxDimension) {
    throw new RangeError(
      `Capture ${w}x${h} exceeds this device's maximum texture dimension of ${maxDimension}. `
      + `Choose a smaller preset (the height drives the size) or enable the upscale option.`);
  }
  const bytes = estimateCaptureMemoryBytes(w, h, { floatBytesPerPixel });
  if (bytes > maxMemoryBytes) {
    throw new RangeError(
      `Capture ${w}x${h} needs about ${formatBytes(bytes)} of GPU/CPU memory, above the `
      + `${formatBytes(maxMemoryBytes)} guard. Choose a smaller preset, or select the upscale option `
      + `(renders at half resolution and upscales with Lanczos-3).`);
  }
  return Object.freeze({ width: w, height: h, bytes, maxMemoryBytes, maxDimension });
}

/** Resolve a preset (plus the live aspect) into exact capture dimensions. */
export function resolveCaptureDimensions({ preset, aspect = 16 / 9, width = null, height = null } = {}) {
  if (Number.isFinite(width) && Number.isFinite(height)) {
    return { width: Math.round(width), height: Math.round(height), preset: preset ?? "custom" };
  }
  const entry = CAPTURE_PRESETS[preset];
  if (!entry) {
    throw new TypeError(`Unknown capture preset "${preset}"; use one of ${Object.keys(CAPTURE_PRESETS).join(", ")}, or pass explicit width/height.`);
  }
  const safeAspect = Math.min(4, Math.max(0.4, Number.isFinite(aspect) ? aspect : 16 / 9));
  return { width: Math.max(2, Math.round(entry.height * safeAspect)), height: entry.height, preset };
}

/* ------------------------------------------------------------------ */
/* Chunk planning                                                      */
/* ------------------------------------------------------------------ */

/**
 * Deterministic chunk plan: `samples` total jittered samples split into
 * chunks of at most `samplesPerChunk` (the last chunk takes the remainder).
 */
export function planCaptureChunks({ samples, samplesPerChunk = 4 } = {}) {
  const total = Math.round(Number(samples));
  const per = Math.round(Number(samplesPerChunk));
  if (!Number.isFinite(total) || total < 1) throw new TypeError(`Capture needs at least 1 sample; received ${samples}.`);
  if (!Number.isFinite(per) || per < 1) throw new TypeError(`samplesPerChunk must be >= 1; received ${samplesPerChunk}.`);
  const chunks = [];
  let done = 0;
  while (done < total) {
    const size = Math.min(per, total - done);
    chunks.push({ start: done, count: size });
    done += size;
  }
  return Object.freeze(chunks.map(Object.freeze));
}

/* ------------------------------------------------------------------ */
/* Metadata sidecar                                                    */
/* ------------------------------------------------------------------ */

export const CAPTURE_METADATA_SCHEMA = "horizon-qga-capture/v1";

/**
 * Build the metadata sidecar embedded in every capture. Pure: every value is
 * validated finite (numbers) and the result is JSON-serializable.
 */
export function buildCaptureMetadata({
  state = {}, provenance = {}, backend = "unknown", quality = {}, resolution = {},
  sampleCount = 0, seed = 42, commitHash = null, volume = {}, deterministic = {},
  extras = {},
} = {}) {
  const payload = {
    schema: CAPTURE_METADATA_SCHEMA,
    capturedAt: new Date().toISOString(),
    commitHash: typeof commitHash === "string" && commitHash ? commitHash : "not recorded (static deployment)",
    backend,
    quality,
    resolution,
    sampleCount,
    seed,
    state,
    provenance,
    volume,
    deterministic,
    ...extras,
  };
  const json = JSON.stringify(payload);
  if (!Number.isFinite(JSON.parse(json).sampleCount)) throw new TypeError("Capture metadata sampleCount must be finite");
  return JSON.parse(json);
}

/* ------------------------------------------------------------------ */
/* PNG encoding (tEXt sidecar)                                         */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** Escape a string to pure ASCII (valid Latin-1 for PNG tEXt chunks). */
function asciiEscape(text) {
  return text.replace(/[^\x20-\x7e]/g, (ch) => {
    const code = ch.codePointAt(0);
    return code <= 0xff ? `\\u00${code.toString(16).padStart(2, "0")}` : `\\u${code.toString(16).padStart(4, "0")}`;
  });
}

async function deflate(bytes) {
  if (typeof CompressionStream === "function") {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  }
  if (typeof process !== "undefined" && process.versions?.node) {
    const { deflateSync } = await import("node:zlib");
    return deflateSync(bytes);
  }
  throw new Error("No deflate implementation available (CompressionStream or node:zlib required).");
}

/**
 * Encode 8-bit RGBA pixels as a PNG with tEXt metadata chunks.
 * Deterministic: the same pixels and text always produce the same bytes.
 * @param {object} input width, height, rgba (Uint8Array or Uint8ClampedArray), textChunks (record)
 */
export async function encodePng({ width, height, rgba, textChunks = {} }) {
  const w = Math.round(Number(width));
  const h = Math.round(Number(height));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) throw new TypeError("PNG dimensions must be positive integers");
  const pixels = rgba instanceof Uint8Array ? rgba : new Uint8Array(rgba);
  if (pixels.length !== w * h * 4) throw new TypeError(`PNG pixel buffer must be ${w * h * 4} bytes; received ${pixels.length}`);
  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, w);
  view.setUint32(4, h);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // colour type: RGBA
  // compression 0, filter 0, interlace 0
  const chunks = [pngChunk("IHDR", ihdr)];
  for (const [keyword, value] of Object.entries(textChunks)) {
    if (!keyword || !/^[a-zA-Z0-9 -]{1,79}$/.test(keyword)) throw new TypeError(`Invalid PNG tEXt keyword: ${keyword}`);
    const text = asciiEscape(String(value));
    const data = new Uint8Array(keyword.length + 1 + text.length);
    for (let i = 0; i < keyword.length; i += 1) data[i] = keyword.charCodeAt(i);
    data[keyword.length] = 0;
    for (let i = 0; i < text.length; i += 1) data[keyword.length + 1 + i] = text.charCodeAt(i);
    chunks.push(pngChunk("tEXt", data));
  }
  // Scanlines with the Sub filter (filter byte 1): smooth gradients and the
  // mostly-black sky compress to long zero runs.
  const stride = w * 4;
  const filtered = new Uint8Array((stride + 1) * h);
  for (let y = 0; y < h; y += 1) {
    const row = y * (stride + 1);
    filtered[row] = 1;
    for (let x = 0; x < stride; x += 1) {
      const current = pixels[y * stride + x];
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      filtered[row + 1 + x] = (current - left) & 0xff;
    }
  }
  const idat = await deflate(filtered);
  chunks.push(pngChunk("IDAT", idat));
  chunks.push(pngChunk("IEND", new Uint8Array(0)));
  const total = signature.length + chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const png = new Uint8Array(total);
  let offset = signature.length;
  png.set(signature, 0);
  for (const chunk of chunks) {
    png.set(chunk, offset);
    offset += chunk.length;
  }
  return png;
}

/**
 * Parse a PNG's chunk structure: verifies the signature and every CRC and
 * returns the chunks (type, data) plus the decoded tEXt records. Used by the
 * Node tests and the QA specs to verify captured stills.
 */
export function parsePngChunks(png) {
  const bytes = png instanceof Uint8Array ? png : new Uint8Array(png);
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i += 1) {
    if (bytes[i] !== signature[i]) throw new RangeError("Not a PNG: bad signature");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    const crc = view.getUint32(offset + 8 + length);
    if (crc !== crc32(bytes.subarray(offset + 4, offset + 8 + length))) {
      throw new RangeError(`PNG chunk ${type} has a bad CRC`);
    }
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === "IEND") break;
  }
  if (chunks.length === 0 || chunks[0].type !== "IHDR") throw new RangeError("PNG is missing its IHDR chunk");
  const text = {};
  for (const chunk of chunks) {
    if (chunk.type !== "tEXt") continue;
    const zero = chunk.data.indexOf(0);
    if (zero <= 0) continue;
    let keyword = "";
    let value = "";
    for (let i = 0; i < zero; i += 1) keyword += String.fromCharCode(chunk.data[i]);
    for (let i = zero + 1; i < chunk.data.length; i += 1) value += String.fromCharCode(chunk.data[i]);
    text[keyword] = value.replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  const ihdr = new DataView(chunks[0].data.buffer, chunks[0].data.byteOffset, chunks[0].data.byteLength);
  return {
    chunks,
    text,
    width: ihdr.getUint32(0),
    height: ihdr.getUint32(4),
    bitDepth: chunks[0].data[8],
    colorType: chunks[0].data[9],
  };
}

/* ------------------------------------------------------------------ */
/* Row order                                                           */
/* ------------------------------------------------------------------ */

/**
 * Flip an RGBA buffer vertically, in place.
 *
 * WebGL's `readPixels` (and three.js's `readRenderTargetPixels`) return rows
 * bottom-to-top, while PNG, `upscaleRgba` and every image consumer expect
 * top-to-bottom. A capture that skips this step is silently upside down, so
 * both backends call it immediately after the readback. Pure and
 * deterministic; a no-op for a single-row image.
 */
export function flipRgbaVertically(rgba, width, height) {
  const w = Math.round(width);
  const h = Math.round(height);
  if (rgba.length !== w * h * 4) throw new TypeError("Flip source buffer size mismatch");
  const stride = w * 4;
  const row = new Uint8Array(stride);
  for (let y = 0; y < Math.floor(h / 2); y += 1) {
    const top = y * stride;
    const bottom = (h - 1 - y) * stride;
    row.set(rgba.subarray(top, top + stride));
    rgba.copyWithin(top, bottom, bottom + stride);
    rgba.set(row, bottom);
  }
  return rgba;
}

/* ------------------------------------------------------------------ */
/* Lanczos-3 upscale (integer factors, phase-tabulated)                */
/* ------------------------------------------------------------------ */

function lanczos3(x) {
  if (x === 0) return 1;
  const abs = Math.abs(x);
  if (abs >= 3) return 0;
  const pix = Math.PI * x;
  return (3 * Math.sin(pix) * Math.sin(pix / 3)) / (pix * pix);
}

/**
 * Upscale an RGBA buffer by an integer factor with a separable Lanczos-3
 * kernel (phase tables per output residue). Pure and deterministic.
 */
export function upscaleRgba(rgba, width, height, factor) {
  const f = Math.round(Number(factor));
  if (!Number.isFinite(f) || f < 2 || f > 4) throw new TypeError(`Upscale factor must be an integer in [2, 4]; received ${factor}`);
  const w = Math.round(width);
  const h = Math.round(height);
  const source = rgba instanceof Uint8Array ? rgba : new Uint8Array(rgba);
  if (source.length !== w * h * 4) throw new TypeError("Upscale source buffer size mismatch");
  // Phase weights: for output index i, source centre = (i + 0.5)/f - 0.5.
  // The weight set depends only on the sub-pixel offset (the phase); the tap
  // start is derived from each output index's actual centre.
  const taps = 6;
  const phases = [];
  for (let phase = 0; phase < f; phase += 1) {
    const centre = (phase + 0.5) / f - 0.5;
    const start = Math.round(centre) - 2;
    const weights = [];
    let sum = 0;
    for (let t = 0; t < taps; t += 1) {
      const weight = lanczos3(start + t - centre);
      weights.push(weight);
      sum += weight;
    }
    for (let t = 0; t < taps; t += 1) weights[t] /= sum || 1;
    phases.push(weights);
  }
  const clampIndex = (index, size) => Math.min(size - 1, Math.max(0, index));
  // Horizontal pass into a float buffer.
  const mid = new Float32Array(w * f * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let ox = 0; ox < w * f; ox += 1) {
      const centre = (ox + 0.5) / f - 0.5;
      const start = Math.round(centre) - 2;
      const weights = phases[ox % f];
      for (let c = 0; c < 4; c += 1) {
        let acc = 0;
        for (let t = 0; t < taps; t += 1) {
          acc += weights[t] * source[(y * w + clampIndex(start + t, w)) * 4 + c];
        }
        mid[(y * w * f + ox) * 4 + c] = acc;
      }
    }
  }
  // Vertical pass into the output bytes.
  const outW = w * f;
  const out = new Uint8Array(outW * h * f * 4);
  for (let oy = 0; oy < h * f; oy += 1) {
    const centre = (oy + 0.5) / f - 0.5;
    const start = Math.round(centre) - 2;
    const weights = phases[oy % f];
    for (let x = 0; x < outW; x += 1) {
      for (let c = 0; c < 4; c += 1) {
        let acc = 0;
        for (let t = 0; t < taps; t += 1) {
          acc += weights[t] * mid[(clampIndex(start + t, h) * outW + x) * 4 + c];
        }
        out[(oy * outW + x) * 4 + c] = Math.min(255, Math.max(0, Math.round(acc)));
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */

/** Error thrown when a capture is cancelled through its signal. */
export class CaptureCancelledError extends Error {
  constructor(message = "Capture cancelled before completion.") {
    super(message);
    this.name = "CaptureCancelledError";
  }
}

const nextFrame = () => new Promise((resolve) => {
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
  else setTimeout(resolve, 0);
});

/**
 * Run a progressive capture. The caller supplies backend-specific callbacks;
 * this function owns validation, chunking, progress, cancellation and the
 * frame-yielding cadence.
 *
 * @param {object} input
 *   width, height: capture resolution (already resolved)
 *   samples: total jittered samples to accumulate
 *   samplesPerChunk: samples per animation frame
 *   prepare(): size the backend's passes for the capture resolution
 *   drawSample(sampleIndex): accumulate one jittered sample
 *   compose(): run the display/denoise/tone-map/readback chain; returns rgba
 *   onProgress({ stage, fraction }): optional progress sink
 *   signal: optional { aborted } or AbortSignal to cancel
 */
export async function runProgressiveCapture({
  width, height, samples, samplesPerChunk = 4,
  prepare, drawSample, compose,
  onProgress = null, signal = null,
} = {}) {
  if (typeof prepare !== "function" || typeof drawSample !== "function" || typeof compose !== "function") {
    throw new TypeError("runProgressiveCapture requires prepare, drawSample and compose callbacks");
  }
  const aborted = () => !!signal?.aborted;
  const progress = (stage, fraction) => { if (onProgress) onProgress({ stage, fraction }); };
  const chunks = planCaptureChunks({ samples, samplesPerChunk });
  const totalSamples = chunks[chunks.length - 1].start + chunks[chunks.length - 1].count;
  progress("preparing", 0);
  prepare();
  if (aborted()) throw new CaptureCancelledError();
  let completed = 0;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.count; i += 1) {
      drawSample(chunk.start + i);
      completed += 1;
    }
    progress("accumulating", completed / totalSamples);
    await nextFrame();
    if (aborted()) throw new CaptureCancelledError();
  }
  progress("composing", 1);
  const rgba = await compose();
  if (aborted()) throw new CaptureCancelledError();
  progress("done", 1);
  return { rgba, samplesCompleted: totalSamples, width, height };
}

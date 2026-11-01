/**
 * 3D still capture for the export studio (S32).
 *
 * Two capture routes exist in this atlas and this module keeps them apart instead of pretending they are one:
 *
 *   - the Kerr observatory has a progressive, sample-accumulating capture of its own
 *     (`js/render/progressive-capture.mjs`), which is the only way to get a converged ray-traced still;
 *   - every other scene renders on demand through the shared stage, so a still is a render-target draw at the
 *     requested size, not a screenshot of whatever the browser happened to have on screen.
 *
 * Both are wrapped here behind one request type that applies the memory guard before anything is allocated, restores
 * the caller's renderer settings in a `finally`, and reports an unsupported route as an `ExportError` rather than
 * silently falling back to a viewport screenshot.
 */

import {
  CAPTURE_DEFAULT_MAX_BYTES, encodePng, resolveCaptureDimensions, validateCaptureRequest,
} from "../render/progressive-capture.mjs";
import { ExportError } from "./export-service.mjs";

/** The presets the studio offers, mapped to the render-target heights the capture code already knows. */
export const STILL_PRESETS = Object.freeze({
  viewport: { label: "Viewport", height: 0, note: "The drawing buffer as displayed." },
  "2k": { label: "2K", height: 1440, note: "1440 px tall render target." },
  "4k": { label: "4K", height: 2160, note: "2160 px tall render target." },
  "8k": { label: "8K (guarded)", height: 4320, note: "4320 px tall render target; refused when the memory guard trips." },
});

/**
 * Resolve a still request into exact dimensions and a memory verdict, without allocating.
 *
 * Runs in Node, so the guard arithmetic is tested without a GPU and a request that would need 3 GiB is refused in a
 * unit test rather than in a user's browser.
 */
export function planStillCapture({ preset = "2k", aspect = 16 / 9, maxMemoryBytes = CAPTURE_DEFAULT_MAX_BYTES } = {}) {
  const entry = STILL_PRESETS[preset];
  if (!entry) throw new ExportError("not-supported", `Unknown still preset "${preset}"; use one of ${Object.keys(STILL_PRESETS).join(", ")}.`);
  if (preset === "viewport") return { preset, width: 0, height: 0, bytes: 0, viewport: true };
  const { width, height } = resolveCaptureDimensions({ preset, aspect });
  try {
    const verdict = validateCaptureRequest({ width, height, maxMemoryBytes });
    return { preset, width, height, bytes: verdict.bytes, viewport: false };
  } catch (error) {
    throw new ExportError("memory-guard", error.message, { preset, width, height });
  }
}

/**
 * Capture a still from a scene handle.
 *
 * The handle is whatever the shared stage or the Kerr observatory exposes; only three methods are used, so a scene
 * that cannot do this reports `not-supported` instead of returning a blank image:
 *   - `capture()` (Kerr's converged still) or `captureAt({ width, height })` (a render-target draw),
 *   - `setCapturePreset(preset)` and `restoreCaptureSettings()` for the round trip,
 *   - `element` for the canvas fallback the snapshot panel already uses.
 */
export async function captureStill(handle, { preset = "2k", aspect = 16 / 9, textChunks = {}, signal = null } = {}) {
  const plan = planStillCapture({ preset, aspect });
  if (!handle) throw new ExportError("not-supported", "No scene is mounted, so there is nothing to capture.");
  const at = (method) => typeof handle[method] === "function";

  if (plan.viewport) {
    if (!at("capture")) throw new ExportError("not-supported", "This scene cannot hand back its drawing buffer.");
    const canvas = await handle.capture();
    if (!canvas) throw new ExportError("not-supported", "The scene returned no canvas.");
    return { ...plan, canvas };
  }

  const canResize = at("captureAt") || (at("setCapturePreset") && at("capture"));
  if (!canResize) {
    throw new ExportError("not-supported",
      `This scene cannot render a ${plan.width}x${plan.height} target. The viewport preset captures it as displayed.`);
  }

  // A scene that can draw at a target size restores its own surface inside that call, so there is nothing to undo
  // here; only the preset path needs the explicit round trip.
  const usesPreset = !at("captureAt") && at("setCapturePreset");
  let restored = false;
  try {
    if (usesPreset) await handle.setCapturePreset(preset);
    if (signal?.aborted) throw new ExportError("cancelled", "The capture was cancelled before it drew a frame.");
    const canvas = at("captureAt")
      ? await handle.captureAt({ width: plan.width, height: plan.height })
      : await handle.capture();
    if (!canvas) throw new ExportError("not-supported", `The scene did not return a ${plan.width}x${plan.height} buffer.`);
    if (usesPreset && at("restoreCaptureSettings")) { await handle.restoreCaptureSettings(); restored = true; }
    return { ...plan, canvas };
  } finally {
    // The capture preset is a display setting: leaving it applied would change what the reader sees next.
    if (usesPreset && !restored && at("restoreCaptureSettings")) {
      try { await handle.restoreCaptureSettings(); } catch (error) { /* the capture already failed; say nothing twice */ }
    }
  }
}

/**
 * Encode a captured canvas to PNG bytes.
 *
 * `toBlob` is preferred because it does not build a base64 string of a 4K image; the `toDataURL` path is kept for the
 * browsers where the canvas is still readable but `toBlob` is not. A tainted canvas raises the contract's
 * `canvas-tainted` code rather than a bare SecurityError.
 */
export async function canvasToPngBytes(canvas, { textChunks = {} } = {}) {
  if (!canvas || !canvas.width || !canvas.height) throw new ExportError("not-supported", "The captured canvas is empty.");
  try {
    if (typeof canvas.toBlob === "function") {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new ExportError("not-supported", "The browser declined to encode the canvas.");
      return new Uint8Array(await blob.arrayBuffer());
    }
    const url = canvas.toDataURL("image/png");
    const base64 = url.slice(url.indexOf(",") + 1);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch (error) {
    if (error instanceof ExportError) throw error;
    if (error && /tainted/i.test(String(error.name ?? "") + String(error.message ?? ""))) {
      throw new ExportError("canvas-tainted", "The canvas is tainted by a cross-origin image, so it cannot be exported.");
    }
    throw new ExportError("not-supported", `The canvas could not be encoded: ${error.message}`, { cause: error.name });
  }
}

/**
 * Encode raw 8-bit RGBA pixels with a metadata sidecar, using the capture module's own PNG encoder.
 *
 * Kept as a thin wrapper so a Node test can prove the sidecar lands in the file without a browser: the encoder is
 * pure and already covered by `test/progressive-capture.test.mjs`.
 */
export function encodeStillPng({ width, height, rgba, metadata = {} }) {
  const chunks = {
    Software: "HORIZON Quantum Gravity Atlas",
    ...Object.fromEntries(Object.entries(metadata).map(([key, value]) => [
      key.replace(/[^a-zA-Z0-9 -]/g, " ").slice(0, 79),
      typeof value === "string" ? value : JSON.stringify(value),
    ])),
  };
  return encodePng({ width, height, rgba, textChunks: chunks });
}

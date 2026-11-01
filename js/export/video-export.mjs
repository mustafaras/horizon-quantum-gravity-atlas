/**
 * WebM recording for the export studio (S32).
 *
 * The recording is deterministic by construction: frames are requested from the shared stage at a fixed timestep and
 * the recorder is fed at a fixed FPS, so the same shot at the same settings produces the same frame sequence. Wall
 * clock time only decides when the recording stops, never what it contains.
 *
 * What this module refuses to promise:
 *   - MP4. `MediaRecorder` support is a browser question, not a wish, so codecs are chosen from
 *     `MediaRecorder.isTypeSupported` and an unsupported codec is an `ExportError`, not a silent fallback;
 *   - audio unless the caller passes a track the browser actually produced.
 */

import { ExportError, fileTimestamp, pickSupportedMime } from "./export-service.mjs";

/** VP9 first, then VP8, then whatever Firefox calls the same thing. Ordered by quality at equal bitrate. */
export const WEBM_CANDIDATES = Object.freeze([
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
]);

/** The two presets the prompt names. */
export const RECORDING_PRESETS = Object.freeze({
  6: { seconds: 6, label: "6 s" },
  12: { seconds: 12, label: "12 s" },
});

export const RECORDING_FPS = Object.freeze([24, 30, 60]);

/** Choose a codec the browser will actually record, or report that none is available. */
export function chooseWebmMime(isTypeSupported) {
  if (typeof isTypeSupported !== "function") {
    throw new ExportError("not-supported", "This browser has no MediaRecorder, so it cannot record video.");
  }
  const mime = pickSupportedMime(WEBM_CANDIDATES, isTypeSupported);
  if (!mime) {
    throw new ExportError("codec-unavailable",
      "This browser supports MediaRecorder but none of its WebM codecs (VP9, VP8). No video will be produced; PNG export still works.");
  }
  return mime;
}

/** Frame count for a duration at a fixed FPS: the recorder's clock, not the wall clock. */
export function frameCountFor({ seconds, fps }) {
  const s = Number(seconds);
  const f = Number(fps);
  if (!(s > 0)) throw new ExportError("not-supported", `Recording duration must be positive; received ${seconds}.`);
  if (!RECORDING_FPS.includes(f)) throw new ExportError("not-supported", `Frame rate must be one of ${RECORDING_FPS.join(", ")}; received ${fps}.`);
  return Math.round(s * f);
}

/**
 * The request a recorder makes of the stage: how many frames, and at what interval.
 *
 * `intervalMs` is what the stage is asked to advance by, so a scene whose animation is driven by a clock can be
 * stepped rather than sampled. A scene that ignores it still gets the right frame count.
 */
export function recordingPlan({ seconds = 6, fps = 30, bitsPerSecond = 8_000_000 } = {}) {
  const frames = frameCountFor({ seconds, fps });
  return Object.freeze({
    seconds, fps, frames,
    intervalMs: 1000 / fps,
    bitsPerSecond: Math.round(bitsPerSecond),
    durationMs: frames * (1000 / fps),
  });
}

/**
 * Record a canvas for a fixed number of deterministic frames.
 *
 * Returns `{ blob, mime, frames, bytes }`. Cancellation, a dead recorder and a browser that stops producing frames all
 * come back as `ExportError`, and the stream's tracks are stopped in every path — a retained recorder track keeps the
 * camera/GPU awake and shows the recording indicator forever, which is a bug the user sees.
 */
export async function recordCanvas({ canvas, seconds = 6, fps = 30, onProgress = null, signal = null, audioTracks = [], draw = null } = {}) {
  if (!canvas || typeof canvas.captureStream !== "function") {
    throw new ExportError("not-supported", "This scene's canvas cannot be captured as a stream.");
  }
  const MediaRecorderCtor = globalThis.MediaRecorder;
  if (typeof MediaRecorderCtor !== "function") {
    throw new ExportError("not-supported", "This browser has no MediaRecorder, so it cannot record WebM.");
  }
  const mime = chooseWebmMime((type) => MediaRecorderCtor.isTypeSupported(type));
  const plan = recordingPlan({ seconds, fps });

  const stream = canvas.captureStream(fps);
  for (const track of audioTracks) if (track) stream.addTrack(track);
  const chunks = [];
  let recorder;
  try {
    recorder = new MediaRecorderCtor(stream, { mimeType: mime, videoBitsPerSecond: plan.bitsPerSecond });
  } catch (error) {
    for (const track of stream.getTracks()) track.stop();
    throw new ExportError("codec-unavailable", `The browser refused to start a ${mime} recorder: ${error.message}`);
  }

  const done = new Promise((resolve, reject) => {
    recorder.ondataavailable = (event) => { if (event.data && event.data.size) chunks.push(event.data); };
    recorder.onerror = (event) => reject(new ExportError("not-supported", `The recorder failed: ${event.error?.message ?? "unknown error"}`));
    recorder.onstop = () => resolve();
  });

  const stopAll = () => { for (const track of stream.getTracks()) track.stop(); };
  try {
    recorder.start(250);
    // The progress callback is the studio's only way to show a real number: frames handed over, not seconds elapsed.
    for (let frame = 1; frame <= plan.frames; frame += 1) {
      if (signal?.aborted) throw new ExportError("cancelled", "The recording was cancelled.");
      if (onProgress) onProgress({ frame, frames: plan.frames, fraction: plan.frames ? frame / plan.frames : 0 });
      // A scene that renders on demand draws nothing by itself, so a stream over its canvas would record an
      // unchanging buffer — or, on a stage-backed canvas, no frames at all. `draw` is the caller's "render this frame
      // now", and awaiting it is what makes the recording deterministic rather than a sample of the wall clock.
      if (draw) await draw(frame);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    recorder.stop();
    await done;
  } catch (error) {
    try { if (recorder.state !== "inactive") recorder.stop(); } catch (stopError) { /* already stopped */ }
    throw error instanceof ExportError ? error : new ExportError("cancelled", `The recording stopped early: ${error.message}`);
  } finally {
    stopAll();
  }

  if (chunks.length === 0) throw new ExportError("not-supported", "The recorder produced no frames; nothing was written.");
  const blob = new Blob(chunks, { type: mime });
  return { blob, mime, frames: plan.frames, bytes: blob.size, name: `horizon-recording-${fileTimestamp()}.webm` };
}

/** Whether a browser can record at all, for the studio to disable the button instead of failing after a click. */
export function recordingSupport(scope = globalThis) {
  const Ctor = scope.MediaRecorder;
  if (typeof Ctor !== "function") return { supported: false, reason: "This browser has no MediaRecorder." };
  const mime = pickSupportedMime(WEBM_CANDIDATES, (type) => Ctor.isTypeSupported(type));
  return mime
    ? { supported: true, mime }
    : { supported: false, reason: "This browser supports MediaRecorder but none of its WebM codecs." };
}

import test from "node:test";
import assert from "node:assert/strict";
import { recordCanvas, recordingPlan } from "../js/export/video-export.mjs";

// A stand-in for the browser pieces recordCanvas touches, recording the options the MediaRecorder was built with.
function fakeBrowser() {
  const built = [];
  class FakeRecorder {
    static isTypeSupported(type) { return type.startsWith("video/webm;codecs=vp9"); }
    constructor(stream, options) { this.state = "inactive"; built.push(options); }
    start() { this.state = "recording"; }
    stop() {
      this.state = "inactive";
      this.ondataavailable({ data: new Blob([new Uint8Array(16)]) });
      this.onstop();
    }
  }
  const track = { stop() {} };
  const canvas = { captureStream: () => ({ getTracks: () => [track], addTrack() {} }) };
  globalThis.MediaRecorder = FakeRecorder;
  globalThis.requestAnimationFrame = (resolve) => setTimeout(resolve, 0);
  return { built, canvas };
}

test("recordingPlan keeps 8 Mbit/s as the default and accepts a lower bitrate", () => {
  assert.equal(recordingPlan({ seconds: 1, fps: 24 }).bitsPerSecond, 8_000_000);
  assert.equal(recordingPlan({ seconds: 1, fps: 24, bitsPerSecond: 1_500_000 }).bitsPerSecond, 1_500_000);
});

test("recordCanvas hands the requested bitrate to the MediaRecorder (S35: the README loop's 6 MB budget)", async () => {
  const { built, canvas } = fakeBrowser();
  await recordCanvas({ canvas, seconds: 1, fps: 24, bitsPerSecond: 1_500_000 });
  await recordCanvas({ canvas, seconds: 1, fps: 24 });
  assert.equal(built[0].videoBitsPerSecond, 1_500_000);
  assert.equal(built[1].videoBitsPerSecond, 8_000_000, "the studio's own recordings are unchanged");
});

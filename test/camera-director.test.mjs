import test from "node:test";
import assert from "node:assert/strict";
import {
  createCameraDirector, validateShot, validateManifest, blendPose,
} from "../js/cinematic/camera-director.mjs";
import { QGA_SHOT_MANIFESTS, shotsForView, findShot } from "../js/cinematic/shot-manifests.mjs";

const shot = (over = {}) => ({
  id: "s1", view: "gr", space: "gr-curvature", chapter: "C", title: "T",
  duration: 4, easing: "linear",
  pose: { radius: 20, theta: 0.5, phi: 1.0, target: [0, 0, 0] },
  ...over,
});

function makeDirector(shots, opts = {}) {
  const poses = [];
  const events = [];
  const d = createCameraDirector({
    applyPose: (p, s) => poses.push({ ...p, id: s.id }),
    onEvent: (e) => events.push(e),
    minRadius: 4,
    ...opts,
  });
  d.loadManifest(shots);
  return { d, poses, events };
}

test("validateShot: accepts the shipped manifests", () => {
  for (const [view, shots] of Object.entries(QGA_SHOT_MANIFESTS)) {
    const v = validateManifest(shots, { minRadius: 4 });
    assert.ok(v.ok, view + ": " + v.errors.join("; "));
    assert.ok(shots.length >= 2);
  }
  assert.equal(shotsForView("overview").length, 0);
  assert.equal(findShot("bh-photon").view, "bh");
  assert.equal(findShot("nope"), null);
});

test("validateShot: rejects singularities, NaN, phi out of range, bad ids", () => {
  assert.equal(validateShot(shot()).ok, true);
  // camera inside the protected core (singularity)
  assert.equal(validateShot(shot({ pose: { radius: 0.2, theta: 0, phi: 1, target: [0, 0, 0] } }), { minRadius: 4 }).ok, false);
  // per-shot safe radius
  assert.equal(validateShot(shot({ minSafeRadius: 12, pose: { radius: 8, theta: 0, phi: 1, target: [0, 0, 0] } }), { minRadius: 4 }).ok, false);
  // non-finite pose
  assert.equal(validateShot(shot({ pose: { radius: NaN, theta: 0, phi: 1 } })).ok, false);
  // phi at the pole (outside the orbit rig clamp)
  assert.equal(validateShot(shot({ pose: { radius: 20, theta: 0, phi: 0.01, target: [0, 0, 0] } })).ok, false);
  // bad id / duration
  assert.equal(validateShot(shot({ id: "Bad ID" })).ok, false);
  assert.equal(validateShot(shot({ duration: 0 })).ok, false);
  assert.equal(validateShot(shot({ duration: Infinity })).ok, false);
  // duplicate ids rejected at manifest level
  assert.equal(validateManifest([shot(), shot()]).ok, false);
});

test("director: loadManifest throws with all errors for an invalid manifest", () => {
  const d = createCameraDirector({ minRadius: 4 });
  assert.throws(
    () => d.loadManifest([shot({ id: "a", pose: { radius: 0.1, theta: 0, phi: 1, target: [0, 0, 0] } }), shot({ id: "b", duration: -1 })]),
    /invalid shot manifest/,
  );
});

test("director: play/update advances poses; pause stops; end stops cleanly", () => {
  const { d, poses, events } = makeDirector([
    shot({ id: "a", duration: 2 }),
    shot({ id: "b", duration: 2, pose: { radius: 10, theta: 1.5, phi: 1.2, target: [0, 0, 0] } }),
  ]);
  assert.equal(d.play(), true);
  d.update(1);
  assert.ok(poses.length >= 1);
  d.update(1.01); // crosses into shot b
  const last = poses[poses.length - 1];
  assert.equal(last.id, "b");
  d.update(3); // past the end
  assert.equal(d.playing, false);
  assert.ok(events.some((e) => e.type === "shot" && e.shot.id === "b"));
  const n = poses.length;
  d.update(1); // stopped: no more poses
  assert.equal(poses.length, n);
});

test("director: interpolation is deterministic and eased", () => {
  const runA = makeDirector([shot({ id: "a", duration: 4 }), shot({ id: "b", duration: 4, easing: "linear", pose: { radius: 40, theta: 2.5, phi: 1.4, target: [0, 0, 0] } })]);
  const runB = makeDirector([shot({ id: "a", duration: 4 }), shot({ id: "b", duration: 4, easing: "linear", pose: { radius: 40, theta: 2.5, phi: 1.4, target: [0, 0, 0] } })]);
  runA.d.play();
  for (let i = 0; i < 10; i++) runA.d.update(0.3);
  runB.d.play();
  for (let i = 0; i < 10; i++) runB.d.update(0.3);
  assert.deepEqual(runA.poses, runB.poses);
  // shot a holds its own pose (first shot blends from itself)
  runA.d.seek(0);
  assert.equal(runA.poses[runA.poses.length - 1].radius, 20);
});

test("director: next/previous navigate shot boundaries", () => {
  const { d } = makeDirector([
    shot({ id: "a", duration: 2 }),
    shot({ id: "b", duration: 2 }),
    shot({ id: "c", duration: 2 }),
  ]);
  d.seek(0.5);
  d.next();
  assert.equal(d.currentShot.id, "b");
  d.next();
  assert.equal(d.currentShot.id, "c");
  d.next(); // clamps at the last shot
  assert.equal(d.currentShot.id, "c");
  d.previous(); // at the very start of c: go to b (standard media behaviour)
  assert.equal(d.currentShot.id, "b");
  d.seek(5.5);
  d.previous(); // mid-shot: restart current
  assert.equal(d.currentShot.id, "c");
  assert.ok(d.timeline().t <= 4.01);
});

test("director: seekToShot places the camera and never autoplays", () => {
  const { d } = makeDirector([shot({ id: "a", duration: 2 }), shot({ id: "deep", duration: 2 })]);
  assert.equal(d.seekToShot("deep"), true);
  assert.equal(d.currentShot.id, "deep");
  assert.equal(d.playing, false);
  assert.equal(d.seekToShot("missing"), false);
});

test("director: user input immediately pauses and blocks pose writes", () => {
  const { d, poses } = makeDirector([shot({ id: "a", duration: 4 }), shot({ id: "b", duration: 4 })]);
  d.play();
  d.update(1);
  d.notifyUserInput();
  assert.equal(d.playing, false);
  assert.equal(d.control, "user");
  const n = poses.length;
  d.update(2);
  assert.equal(poses.length, n); // never fights input
  d.releaseControl();
  assert.equal(d.control, "scroll");
  d.play();
  d.update(0.5);
  assert.ok(poses.length > n); // control handed back: motion resumes
});

test("director: takeControl/releaseControl and scroll gating", () => {
  const { d, poses } = makeDirector([shot({ id: "a", duration: 4 })]);
  d.takeControl();
  const n = poses.length;
  d.scrollProgress(0.5);   // ignored while the user holds control
  assert.equal(poses.length, n);
  d.releaseControl();
  d.scrollProgress(0.5);   // scroll now drives the timeline
  assert.equal(poses.length, n + 1);
  assert.ok(Math.abs(d.timeline().t - 2) < 1e-9);
  d.seekShotProgress(0, 0.25);
  assert.ok(Math.abs(d.timeline().t - 1) < 1e-9);
});

test("director: reduced motion never interpolates the camera", () => {
  const { d, poses } = makeDirector([shot({ id: "a", duration: 4 })], { reducedMotion: true });
  assert.equal(d.play(), false);
  d.update(5);
  assert.equal(poses.length, 1); // only the initial placement from loadManifest
  d.seek(3); // explicit placement still works (deep links)
  assert.equal(poses.length, 2);
});

test("director: interpolated radius never enters the protected core", () => {
  const { d, poses } = makeDirector([
    shot({ id: "a", duration: 2, pose: { radius: 30, theta: 0, phi: 1, target: [0, 0, 0] } }),
    shot({ id: "b", duration: 2, pose: { radius: 25, theta: 1, phi: 1, target: [0, 0, 0] } }),
  ], { minRadius: 20 });
  d.play();
  for (let i = 0; i < 10; i++) d.update(0.3);
  for (const p of poses) assert.ok(p.radius >= 20 - 1e-9, "radius " + p.radius);
});

test("director: dispose stops everything", () => {
  const { d, poses } = makeDirector([shot({ id: "a", duration: 4 })]);
  d.play();
  d.update(1);
  d.dispose();
  const n = poses.length;
  d.update(1);
  assert.equal(poses.length, n);
  assert.equal(d.disposed, true);
  assert.throws(() => d.play(), /disposed/);
});

test("blendPose: pure interpolation with core clamp", () => {
  const a = { radius: 10, theta: 0, phi: 1, target: [0, 0, 0] };
  const b = { radius: 20, theta: 2, phi: 2, target: [2, 0, 0] };
  const mid = blendPose(a, b, 0.5);
  assert.equal(mid.radius, 15);
  assert.equal(mid.theta, 1);
  assert.deepEqual(mid.target, [1, 0, 0]);
  assert.equal(blendPose(a, b, 1, { minRadius: 100 }).radius, 100);
});

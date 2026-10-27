// js/cinematic/camera-director.mjs — declarative cinematic camera direction.
//
// The director owns a timeline over a shot manifest and turns time into
// camera poses. It is DOM-agnostic: poses are delivered through an injected
// applyPose(pose, shot) callback, and per-frame advancement is either driven
// externally via update(dt) (Node tests) or by an injected frame source.
//
// Safety contract:
//  - loadManifest() rejects shots whose pose is non-finite, whose phi is
//    outside the orbit rig's clamp range, or whose radius would place the
//    camera inside the scene's protected core (minRadius) — i.e. no shot can
//    target a singularity or invalid geometry.
//  - Interpolated radii are clamped to minRadius at all times.
//  - User orbit/pan/zoom input (notifyUserInput) immediately pauses
//    automated direction; the director never writes poses while the user
//    holds control.

import { createTimeline, easingFn } from "./timeline.mjs";

const PHI_LIMIT = 0.08;          // matches Scene3D's orbit rig clamp
const MAX_DURATION = 600;        // s, per shot
const MAX_RADIUS = 400;          // scene far-plane guard

export function isFiniteNumber(v) { return typeof v === "number" && Number.isFinite(v); }

/**
 * Validate one shot descriptor. Returns { ok, errors[] }.
 */
export function validateShot(shot, { minRadius = 1.0 } = {}) {
  const errors = [];
  if (!shot || typeof shot !== "object") return { ok: false, errors: ["shot must be an object"] };
  if (typeof shot.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(shot.id)) {
    errors.push("shot.id must be a lowercase kebab-case string");
  }
  if (!isFiniteNumber(shot.duration) || shot.duration <= 0 || shot.duration > MAX_DURATION) {
    errors.push(`shot.duration must be in (0, ${MAX_DURATION}]`);
  }
  const pose = shot.pose;
  if (!pose || !isFiniteNumber(pose.radius) || !isFiniteNumber(pose.theta) || !isFiniteNumber(pose.phi)) {
    errors.push("shot.pose must have finite radius/theta/phi");
  } else {
    const floor = Math.max(minRadius, isFiniteNumber(shot.minSafeRadius) ? shot.minSafeRadius : 0);
    if (pose.radius < floor) errors.push(`shot.pose.radius ${pose.radius} is inside the protected core (min ${floor})`);
    if (pose.radius > MAX_RADIUS) errors.push(`shot.pose.radius exceeds ${MAX_RADIUS}`);
    if (pose.phi < PHI_LIMIT || pose.phi > Math.PI - PHI_LIMIT) errors.push("shot.pose.phi outside orbit range");
    if (!isFiniteNumber(pose.theta)) errors.push("shot.pose.theta not finite");
  }
  if (pose && pose.target !== undefined) {
    if (!Array.isArray(pose.target) || pose.target.length !== 3 || !pose.target.every(isFiniteNumber)) {
      errors.push("shot.pose.target must be a finite [x,y,z]");
    }
  }
  if (shot.focal !== undefined && (!isFiniteNumber(shot.focal) || shot.focal <= 0)) errors.push("shot.focal must be positive");
  if (shot.exposure !== undefined && (!isFiniteNumber(shot.exposure) || shot.exposure < 0)) errors.push("shot.exposure must be >= 0");
  if (shot.easing !== undefined && typeof shot.easing !== "string") errors.push("shot.easing must be a named easing");
  if (shot.annotations !== undefined && !Array.isArray(shot.annotations)) errors.push("shot.annotations must be an array");
  if (typeof shot.view !== "string" || shot.view.length === 0) errors.push("shot.view is required");
  if (typeof shot.title !== "string" || shot.title.length === 0) errors.push("shot.title is required");
  return { ok: errors.length === 0, errors };
}

export function validateManifest(shots, opts = {}) {
  const errors = [];
  if (!Array.isArray(shots) || shots.length === 0) return { ok: false, errors: ["manifest must be a non-empty array"] };
  const seen = new Set();
  shots.forEach((shot, i) => {
    const v = validateShot(shot, opts);
    for (const e of v.errors) errors.push(`shot[${i}] (${shot?.id ?? "?"}): ${e}`);
    if (typeof shot?.id === "string") {
      if (seen.has(shot.id)) errors.push(`shot[${i}]: duplicate id "${shot.id}"`);
      seen.add(shot.id);
    }
  });
  return { ok: errors.length === 0, errors };
}

const lerp = (a, b, e) => a + (b - a) * e;

/** Interpolate pose `from` → `to` by eased fraction e (pure). */
export function blendPose(from, to, e, { minRadius = 0 } = {}) {
  const target = from.target && to.target
    ? [lerp(from.target[0], to.target[0], e), lerp(from.target[1], to.target[1], e), lerp(from.target[2], to.target[2], e)]
    : (to.target || from.target);
  return {
    radius: Math.max(minRadius, lerp(from.radius, to.radius, e)),
    theta: lerp(from.theta, to.theta, e),
    phi: lerp(from.phi, to.phi, e),
    target,
    fov: to.fov,
  };
}

/**
 * Create the director.
 *
 * options:
 *   applyPose(pose, shot)   called whenever the pose changes (never while
 *                           the user holds control)
 *   onEvent({ type, ... })  "shot" | "state" change notifications for the UI
 *   minRadius               protected-core radius for all guards
 *   reducedMotion           when true, play() never advances time: the
 *                           camera is only ever placed by explicit seek()
 *   requestFrame/cancelFrame  injected rAF source (browser); omit in Node
 */
export function createCameraDirector(options = {}) {
  const {
    applyPose = () => {}, onEvent = () => {},
    minRadius = 1.0, reducedMotion = false,
    requestFrame = null, cancelFrame = null,
  } = options;

  let shots = [];
  let starts = [];      // cumulative start time per shot
  let total = 0;
  let timeline = null;
  let disposed = false;
  let control = "idle"; // "idle" | "auto" (playing) | "scroll" | "user"
  let currentShotIndex = -1;
  let lastPose = null;
  let loopId = null;
  let lastFrameAt = 0;

  const emit = (type, extra = {}) => { try { onEvent({ type, ...extra }); } catch (e) {} };
  const assertLive = () => { if (disposed) throw new Error("director is disposed"); };

  const shotAt = (t) => {
    let i = 0;
    for (let k = 0; k < starts.length; k++) if (t >= starts[k] - 1e-9) i = k;
    return i;
  };

  const poseFor = (t) => {
    if (!shots.length) return null;
    const i = shotAt(t);
    const shot = shots[i];
    const prev = i > 0 ? shots[i - 1] : shot;
    const span = shot.duration || 1;
    const local = Math.min(1, Math.max(0, (t - starts[i]) / span));
    const e = easingFn(shot.easing)(local);
    return { pose: blendPose(prev.pose, shot.pose, e, { minRadius }), shot, index: i };
  };

  const applyTime = (t) => {
    const res = poseFor(t);
    if (!res) return;
    if (res.index !== currentShotIndex) {
      currentShotIndex = res.index;
      emit("shot", { shot: res.shot, index: res.index });
    }
    lastPose = res.pose;
    applyPose(res.pose, res.shot);
  };

  const rebuild = (newShots) => {
    if (timeline) timeline.dispose();
    shots = newShots;
    starts = [];
    total = 0;
    for (const s of newShots) { starts.push(total); total += s.duration; }
    timeline = createTimeline({
      duration: total,
      boundaries: starts.slice(1).map((time, k) => ({ time, shotId: newShots[k + 1].id })),
    });
    currentShotIndex = -1;
  };

  const stopLoop = () => {
    if (loopId != null && cancelFrame) cancelFrame(loopId);
    loopId = null;
  };

  const startLoop = () => {
    if (!requestFrame || loopId != null) return;
    lastFrameAt = 0;
    const step = (now) => {
      loopId = requestFrame(step);
      const dt = lastFrameAt ? Math.min(0.05, (now - lastFrameAt) / 1000) : 0;
      lastFrameAt = now;
      update(dt);
    };
    loopId = requestFrame(step);
  };

  function update(dt) {
    if (disposed || !timeline) return;
    if (!timeline.playing) return;
    if (reducedMotion) return; // no camera interpolation under reduced motion
    if (control !== "auto") return;
    const before = timeline.t;
    timeline.tick(dt);
    if (timeline.t !== before) applyTime(timeline.t);
    if (!timeline.playing) { control = "idle"; stopLoop(); emit("state", { playing: false, control }); }
  }

  return {
    get disposed() { return disposed; },
    get control() { return control; },
    get reducedMotion() { return reducedMotion; },
    get playing() { return !!(timeline && timeline.playing && !reducedMotion); },
    get shotCount() { return shots.length; },
    get duration() { return total; },
    get minRadius() { return minRadius; },
    get currentShot() { return currentShotIndex >= 0 ? shots[currentShotIndex] : null; },
    get currentPose() { return lastPose; },
    shots() { return [...shots]; },
    timeline() { return timeline; },

    /** Validate + load a shot manifest. Throws with all errors when invalid. */
    loadManifest(manifest) {
      assertLive();
      const v = validateManifest(manifest, { minRadius });
      if (!v.ok) throw new Error(`invalid shot manifest: ${v.errors.join("; ")}`);
      // Normalise: pose.target and easing get defaults; pose.easing wins.
      const normalized = manifest.map((s) => ({
        ...s,
        pose: { target: [0, 0, 0], ...s.pose },
        easing: (s.pose && s.pose.easing) || s.easing || "easeInOutCubic",
      }));
      rebuild(normalized);
      control = "idle";
      applyTime(0);
      emit("state", { playing: false, control });
      return this;
    },

    play() {
      assertLive();
      if (!timeline || reducedMotion || !shots.length) return false;
      if (timeline.t >= total) timeline.seek(0); // replay from the top
      control = "auto";
      timeline.play();
      startLoop();
      emit("state", { playing: true, control });
      return true;
    },

    pause() {
      assertLive();
      if (!timeline) return;
      timeline.pause();
      if (control === "auto") control = "idle";
      stopLoop();
      emit("state", { playing: false, control });
    },

    /** Seek to an absolute timeline time; places the camera immediately. */
    seek(t) {
      assertLive();
      if (!timeline) return;
      timeline.seek(t);
      applyTime(timeline.t);
    },

    /** Seek to the start of a shot id (used by deep links). Never autoplays. */
    seekToShot(id) {
      assertLive();
      const i = shots.findIndex((s) => s.id === id);
      if (i < 0) return false;
      this.pause();
      this.seek(starts[i] + 1e-6);
      return true;
    },

    next() {
      assertLive();
      const i = Math.min(shots.length - 1, shotAt(timeline ? timeline.t : 0) + 1);
      this.seek(starts[i] + 1e-6);
    },

    previous() {
      assertLive();
      const t = timeline ? timeline.t : 0;
      const i = shotAt(t);
      // standard media behaviour: restart current shot, or previous shot
      const j = t - starts[i] > 0.5 ? i : Math.max(0, i - 1);
      this.seek(starts[j] + 1e-6);
    },

    /** Map a normalized [0,1] progress (e.g. whole-view scroll) onto the timeline. */
    scrollProgress(p) {
      assertLive();
      if (!timeline || control === "user" || control === "auto") return;
      control = "scroll";
      const x = Math.min(1, Math.max(0, Number(p) || 0));
      this.seek(x * total);
    },

    /** Map one section's (index, progress) pair onto its shot segment. */
    seekShotProgress(index, p) {
      assertLive();
      if (!timeline || !shots.length || control === "user" || control === "auto") return;
      control = "scroll";
      const i = Math.min(shots.length - 1, Math.max(0, Math.trunc(index) || 0));
      const x = Math.min(0.999, Math.max(0, Number(p) || 0));
      this.seek(starts[i] + x * shots[i].duration);
    },

    /** The user grabbed the camera: pause automation immediately. */
    notifyUserInput() {
      assertLive();
      if (control === "user") return;
      this.takeControl();
    },

    takeControl() {
      assertLive();
      if (timeline) timeline.pause();
      stopLoop();
      control = "user";
      emit("state", { playing: false, control });
    },

    /** Hand control back; the tour stays paused until play()/scroll resumes. */
    releaseControl() {
      assertLive();
      control = timeline && timeline.t > 0 ? "scroll" : "idle";
      emit("state", { playing: false, control });
    },

    update,

    dispose() {
      if (disposed) return;
      disposed = true;
      stopLoop();
      if (timeline) timeline.dispose();
      timeline = null;
      shots = [];
      starts = [];
    },
  };
}

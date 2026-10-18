// js/cinematic/runtime.mjs — assembles the cinematic system for the browser.
//
// Exposed as window.QGA_CINEMATIC by bootstrap.mjs. Owns:
//  - one CameraDirector for the active view's shot manifest,
//  - the Scene3D shot-space registry (bridges come and go with scenes),
//  - the scroll driver mapping section intersection to timeline progress,
//  - the capability-gated scene transition used on every view change.
//
// Accessibility contract: reduced motion disables camera interpolation
// (director.reducedMotion) and spatial distortion (crossfade transitions).
// No audio is ever started by this system — deep links only place the
// camera, they never autoplay anything.

import { createCameraDirector } from "./camera-director.mjs";
import { createSceneTransition } from "./scene-transition.mjs";
import { createScrollDriver } from "./scroll-driver.mjs";
import { shotsForView, findShot } from "./shot-manifests.mjs";

export function createCinematicRuntime() {
  const spaces = new Map();          // spaceId → bridge {getPose,setPose}
  const listeners = new Set();
  let director = null;
  let scroll = null;
  let settings = { reducedMotion: false, vizMode: "cinematic" };
  let lastError = null;
  let bulk = false; // suppress intermediate shot events during setView/seek
  // The director may only move a scene's camera once the tour is engaged:
  // a deep-linked shot, an explicit play, or scroll-driven narrative. A plain
  // visit to a view keeps the scene's own default framing untouched.
  let engaged = false;
  let state = {
    view: null, shots: [], shot: null, index: -1,
    playing: false, control: "idle", progress: 0, hasBar: false,
  };

  const transition = createSceneTransition({
    reducedMotion: settings.reducedMotion, vizMode: settings.vizMode,
    onError: (message) => { lastError = message; },
  });

  const emit = (patch) => {
    state = { ...state, ...patch };
    for (const fn of listeners) { try { fn(state); } catch (e) {} }
  };

  const currentSpaceId = () => (state.shot ? state.shot.space : null);

  const applyPose = (pose, shot) => {
    const bridge = spaces.get(shot.space);
    if (bridge && bridge.setPose) bridge.setPose(pose);
  };

  const onDirectorEvent = (ev) => {
    if (ev.type === "shot") { if (!bulk) emit({ shot: ev.shot, index: ev.index }); return; }
    if (ev.type === "state") {
      emit({
        playing: ev.playing, control: ev.control,
        progress: director && director.timeline() ? director.timeline().progress() : 0,
      });
    }
  };

  function destroyDirector() {
    if (director) director.dispose();
    director = null;
    if (scroll) scroll.dispose();
    scroll = null;
    engaged = false;
  }

  function attachScroll() {
    if (scroll) scroll.dispose();
    if (!director || !director.shotCount) return;
    const seen = new Set();
    const getSections = () => {
      const out = [];
      director.shots().forEach((s, i) => {
        if (!s.section || seen.has(s.section)) return;
        const el = document.querySelector(s.section);
        if (el) { seen.add(s.section); out.push({ el, index: i }); }
      });
      return out;
    };
    // All shots of a view share one section anchor per scene; map the
    // section traversal across the shots that reference it.
    const onProgress = (index, p) => {
      if (!director) return;
      engaged = true; // the reader's scroll has taken up the narrative
      const shots = director.shots();
      const section = shots[index] && shots[index].section;
      const group = shots.map((s, i) => i).filter((i) => shots[i].section === section);
      const k = Math.min(group.length - 1, Math.floor(p * group.length));
      const local = p * group.length - k;
      director.seekShotProgress(group[k], local);
      emit({ progress: director.timeline() ? director.timeline().progress() : 0 });
    };
    scroll = createScrollDriver({ getSections, onProgress });
    scroll.attach();
  }

  return {
    // ---------- spaces (Scene3D bridges) ----------
    registerSpace(id, bridge) {
      spaces.set(id, bridge);
      // a scene that mounts mid-shot adopts the current pose immediately
      if (engaged && director && state.shot && state.shot.space === id && director.currentPose) {
        bridge.setPose(director.currentPose);
      }
    },
    unregisterSpace(id, bridge) {
      if (spaces.get(id) === bridge || bridge === undefined) spaces.delete(id);
    },
    notifySceneInput(spaceId) {
      if (!director) return;
      if (currentSpaceId() !== spaceId) return;
      director.notifyUserInput();
    },

    // ---------- settings ----------
    configure(next) {
      settings = { ...settings, ...next };
      transition.configure(settings);
      if (director && director.reducedMotion !== settings.reducedMotion) {
        // reduced-motion flag is constructor-scoped: rebuild to apply
        this.setView(state.view, { keepTime: false });
      }
    },
    get lastError() { return lastError; },

    // ---------- view lifecycle ----------
    setView(view, { shot = null } = {}) {
      destroyDirector();
      const shots = shotsForView(view);
      if (!shots.length) {
        emit({ view, shots: [], shot: null, index: -1, playing: false, control: "idle", progress: 0, hasBar: false });
        return;
      }
      director = createCameraDirector({
        applyPose, onEvent: onDirectorEvent,
        minRadius: 4,
        reducedMotion: settings.reducedMotion,
        requestFrame: (fn) => requestAnimationFrame(fn),
        cancelFrame: (id) => cancelAnimationFrame(id),
      });
      bulk = true;
      director.loadManifest(shots);
      if (shot && findShot(shot) && findShot(shot).view === view) {
        engaged = true;                    // deep link: the tour owns the camera
        director.seekToShot(shot);         // place camera, never autoplay
      }
      bulk = false;
      emit({
        view, shots, shot: director.currentShot, index: shots.indexOf(director.currentShot),
        playing: false, control: "idle", progress: 0, hasBar: true,
      });
      attachScroll();
    },

    // ---------- transport (CinemaBar) ----------
    play() { if (director) { engaged = true; director.play(); } },
    pause() { if (director) director.pause(); },
    toggle() {
      if (!director) return;
      if (director.playing) director.pause();
      else { engaged = true; director.play(); }
    },
    next() { if (director) { engaged = true; director.next(); } },
    previous() { if (director) { engaged = true; director.previous(); } },
    takeControl() { if (director) director.takeControl(); },
    releaseControl() { if (director) director.releaseControl(); },
    progress() { return director && director.timeline() ? director.timeline().progress() : 0; },

    // ---------- transitions ----------
    runTransition() { transition.run(); },
    transitionMode() { return transition.mode; },
    transitionLoops() { return transition.activeLoops(); },
    prewarmTransition() { return transition.prewarm(); },

    // ---------- UI subscription ----------
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    get state() { return state; },
    hasShots(view) { return shotsForView(view).length > 0; },
    findShot,

    /** Re-attach the scroll driver after the view DOM has mounted. */
    refreshScroll() { attachScroll(); },

    dispose() {
      destroyDirector();
      transition.dispose();
      listeners.clear();
      spaces.clear();
    },
  };
}

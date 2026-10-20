// js/cinematic/shot-manifests.mjs — declarative cinematic shots (Prompt 09).
//
// Each shot: id, view, space (Scene3D shot-space bridge), chapter, title,
// duration (s), pose {radius, theta, phi, target, fov?}, focal, exposure,
// annotations[], easing, section (scroll anchor selector), minSafeRadius
// (scene protected core — validated by the director at load time).
//
// Poses are authored against each flagship scene's orbit rig (its initial
// radius/minR/maxR), so every shot is reachable without crossing invalid
// geometry.

export const QGA_SHOT_MANIFESTS = Object.freeze({
  bh: Object.freeze([
    Object.freeze({
      id: "bh-wide", view: "bh", space: "bh-kerr",
      chapter: "Black Hole Observatory", title: "Wide field — the lensed disk in context",
      duration: 8, focal: 40, exposure: 1, easing: "easeInOutQuint",
      annotations: ["accretion disk", "lensed photon ring"],
      section: "#shot-section-bh", minSafeRadius: 14,
      pose: Object.freeze({ radius: 84, theta: 0.35, phi: 1.32, target: Object.freeze([0, 0, 0]) }),
    }),
    Object.freeze({
      id: "bh-photon", view: "bh", space: "bh-kerr",
      chapter: "Black Hole Observatory", title: "Photon ring — light bent around the horizon",
      duration: 9, focal: 40, exposure: 1.1, easing: "easeInOutCubic",
      annotations: ["photon ring", "event horizon"],
      section: "#shot-section-bh", minSafeRadius: 14,
      pose: Object.freeze({ radius: 26, theta: 0.9, phi: 1.22, target: Object.freeze([0, 0, 0]) }),
    }),
    Object.freeze({
      id: "bh-polar", view: "bh", space: "bh-kerr",
      chapter: "Black Hole Observatory", title: "Polar view — looking down the spin axis",
      duration: 8, focal: 40, exposure: 1, easing: "easeInOutQuint",
      annotations: ["spin axis", "ISCO"],
      section: "#shot-section-bh", minSafeRadius: 14,
      pose: Object.freeze({ radius: 46, theta: 0.12, phi: 0.24, target: Object.freeze([0, 0, 0]) }),
    }),
  ]),
  gr: Object.freeze([
    Object.freeze({
      id: "gr-engine", view: "gr", space: "gr-curvature",
      chapter: "Spacetime Curvature", title: "The curvature engine — geodesics on a warped sheet",
      duration: 8, focal: 45, exposure: 1, easing: "easeInOutQuint",
      annotations: ["precessing geodesics", "lensed light fan"],
      section: "#shot-section-gr", minSafeRadius: 9,
      pose: Object.freeze({ radius: 26, theta: 0.4, phi: 1.02, target: Object.freeze([0, -1.2, 0]) }),
    }),
    Object.freeze({
      id: "gr-dip", view: "gr", space: "gr-curvature",
      chapter: "Spacetime Curvature", title: "The gravity well — matter tells spacetime how to curve",
      duration: 9, focal: 45, exposure: 1, easing: "easeInOutCubic",
      annotations: ["embedding dip", "photon-sphere graze"],
      section: "#shot-section-gr", minSafeRadius: 9,
      pose: Object.freeze({ radius: 11, theta: 2.3, phi: 1.3, target: Object.freeze([0, -1.2, 0]) }),
    }),
  ]),
  exp: Object.freeze([
    Object.freeze({
      id: "exp-sheet", view: "exp", space: "exp-gw",
      chapter: "Gravitational Waves", title: "A binary inspiral radiates across the sheet",
      duration: 8, focal: 45, exposure: 1, easing: "easeInOutQuint",
      annotations: ["quadrupole waves", "spacetime sheet"],
      section: "#shot-section-exp", minSafeRadius: 8,
      pose: Object.freeze({ radius: 19, theta: 0.5, phi: 0.98, target: Object.freeze([0, 0, 0]) }),
    }),
    Object.freeze({
      id: "exp-merger", view: "exp", space: "exp-gw",
      chapter: "Gravitational Waves", title: "Merger — the chirp peaks as the orbit shrinks",
      duration: 9, focal: 45, exposure: 1.05, easing: "easeInOutCubic",
      annotations: ["chirp", "ringdown"],
      section: "#shot-section-exp", minSafeRadius: 8,
      pose: Object.freeze({ radius: 9.5, theta: 2.6, phi: 0.86, target: Object.freeze([0, 0, 0]) }),
    }),
  ]),
  qft: Object.freeze([
    Object.freeze({
      id: "qft-membrane", view: "qft", space: "qft-field",
      chapter: "Quantum Fields", title: "The scalar field membrane — excitations are particles",
      duration: 8, focal: 45, exposure: 1, easing: "easeInOutQuint",
      annotations: ["Klein–Gordon field", "mass gap"],
      section: "#shot-section-qft", minSafeRadius: 8,
      pose: Object.freeze({ radius: 19, theta: 0.52, phi: 1.0, target: Object.freeze([0, 0, 0]) }),
    }),
    Object.freeze({
      id: "qft-ripple", view: "qft", space: "qft-field",
      chapter: "Quantum Fields", title: "A localized excitation disperses at the Compton scale",
      duration: 8, focal: 45, exposure: 1, easing: "easeInOutCubic",
      annotations: ["wave packet", "dispersion"],
      section: "#shot-section-qft", minSafeRadius: 8,
      pose: Object.freeze({ radius: 10.5, theta: 2.4, phi: 1.22, target: Object.freeze([0, 0, 0]) }),
    }),
  ]),
});

export function shotsForView(view) {
  return Object.prototype.hasOwnProperty.call(QGA_SHOT_MANIFESTS, view)
    ? QGA_SHOT_MANIFESTS[view] : [];
}

export function findShot(id) {
  for (const shots of Object.values(QGA_SHOT_MANIFESTS)) {
    const s = shots.find((x) => x.id === id);
    if (s) return s;
  }
  return null;
}

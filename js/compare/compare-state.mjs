/**
 * A/B comparison state (Prompt 10): validated snapshot pairs, render-mode
 * presets mapped to render-pipeline presets, camera-space compatibility and
 * deterministic parameter-tween planning.
 *
 * A compare side is always a VALIDATED app state: presets are declared as
 * state patches over the app defaults, and every side is round-tripped
 * through the app's own state reader (injected here as `readState`) before
 * it may mount. Camera synchronization is opt-in per scene: both sides must
 * declare a compatible camera space (same view + orbit rig); anything else
 * renders independently with a visible "camera not synced" badge.
 */

/** Render-mode labels map 1:1 onto render-pipeline presets. */
export const COMPARE_RENDER_MODES = Object.freeze({
  scientific: Object.freeze({ label: "Scientific", pipelinePreset: "scientific" }),
  cinematic: Object.freeze({ label: "Cinematic", pipelinePreset: "cinematic" }),
});

/**
 * Built-in presets. Each side is a patch over the app default state; the
 * view must match on both sides so the comparison is scientifically honest
 * (same scene family, differing parameters or render mode).
 */
export const COMPARE_PRESETS = Object.freeze([
  Object.freeze({
    id: "schwarzschild-vs-kerr",
    label: "Schwarzschild vs Kerr a★ = 0.9",
    description: "Static black hole against a near-extremal Kerr disk — ISCO, photon ring and Doppler beaming respond to spin.",
    sides: Object.freeze([
      Object.freeze({ label: "Schwarzschild", patch: Object.freeze({ view: "bh", bhMass: 1, bhSpin: 0 }), renderMode: "scientific" }),
      Object.freeze({ label: "Kerr a★ = 0.9", patch: Object.freeze({ view: "bh", bhMass: 1, bhSpin: 0.9 }), renderMode: "scientific" }),
    ]),
  }),
  Object.freeze({
    id: "scientific-vs-cinematic",
    label: "Scientific vs cinematic render",
    description: "Identical Kerr state (a★ = 0.7) rendered through the scientific and cinematic render-pipeline presets.",
    sides: Object.freeze([
      Object.freeze({ label: "Scientific render", patch: Object.freeze({ view: "bh", bhMass: 1, bhSpin: 0.7 }), renderMode: "scientific" }),
      Object.freeze({ label: "Cinematic render", patch: Object.freeze({ view: "bh", bhMass: 1, bhSpin: 0.7 }), renderMode: "cinematic" }),
    ]),
  }),
]);

/**
 * Validate one compare side. `readState(search)` is the app's canonical
 * URL→state reader (qgaReadState); the side's patch is serialized to a URL
 * (through the app's short-key map) and read back so clamps, enums and
 * sanitization all apply.
 */
export function validateCompareSide({ patch, renderMode = "scientific", readState, defaults, stateKeys = null }) {
  if (typeof readState !== "function") throw new TypeError("validateCompareSide requires the app state reader");
  if (!COMPARE_RENDER_MODES[renderMode]) return { ok: false, errors: [`unknown render mode "${renderMode}"`] };
  if (!defaults || typeof defaults !== "object") return { ok: false, errors: ["app default state is required"] };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (!(key in defaults)) return { ok: false, errors: [`patch key "${key}" is not an app state key`] };
    const param = stateKeys?.[key] ?? key;
    search.set(param, String(value));
  }
  let state;
  try {
    state = readState("?" + search.toString());
  } catch (error) {
    return { ok: false, errors: [`state validation failed: ${error.message}`] };
  }
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (String(state[key]) !== String(value)) {
      return { ok: false, errors: [`patch value for "${key}" did not survive validation (${state[key]} ≠ ${value})`] };
    }
  }
  return { ok: true, state, renderMode };
}

/**
 * Camera-space compatibility: sync only when both sides run the same view
 * AND both declare an orbit-rig camera space. Scene3D declares "orbit";
 * 2D-only views declare null.
 */
export function cameraSpacesCompatible(left, right) {
  if (!left || !right) return false;
  if (left.view !== right.view) return false;
  return left.cameraSpace === "orbit" && right.cameraSpace === "orbit";
}

/**
 * Deterministic diff of two states for tweening. Numeric keys interpolate;
 * enum/boolean/string keys are "switch" keys applied at the tween midpoint.
 * Physics quantities are NOT baked: the consumer re-applies the
 * interpolated state every frame so every derived quantity stays live.
 */
export function diffStates(from, to, { numericKeys = null } = {}) {
  if (!from || !to) throw new TypeError("diffStates requires two states");
  const tweenable = [];
  const switches = [];
  const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
  for (const key of keys) {
    const a = from[key], b = to[key];
    if (a === b) continue;
    const bothNumeric = Number.isFinite(Number(a)) && Number.isFinite(Number(b)) && typeof a !== "boolean" && typeof b !== "boolean";
    const allowed = numericKeys == null || numericKeys.includes(key);
    if (bothNumeric && allowed) tweenable.push({ key, from: Number(a), to: Number(b) });
    else switches.push({ key, value: b });
  }
  tweenable.sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
  switches.sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
  return Object.freeze({ tweenable: Object.freeze(tweenable.map(Object.freeze)), switches: Object.freeze(switches.map(Object.freeze)) });
}

/**
 * Sample the interpolated state at progress t in [0, 1] (easing already
 * applied by the caller). Switch keys land at t >= 0.5.
 */
export function sampleTweenState(base, diff, t) {
  const next = { ...base };
  for (const entry of diff.tweenable) next[entry.key] = entry.from + (entry.to - entry.from) * t;
  if (t >= 0.5) for (const entry of diff.switches) next[entry.key] = entry.value;
  return next;
}

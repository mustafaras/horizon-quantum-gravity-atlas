/*
 * When does a scene need frames? Pure policy shared by Scene3D and AtlasStage, tested in Node.
 *
 * A scene declares `animated`:
 *   true      it evolves while the simulation is playing, with or without motion (a field integrating in time,
 *             a binary inspiral)
 *   "motion"  its motion is ambient or decorative and the scene's own code freezes it when the motion factor is 0
 *             (pulses, jitter, drift, orbiting labels): it animates only while playing AND motion > 0, so under
 *             reduced motion it settles on one frame and idles
 *   false     it changes only on input and `invalidate()`
 *
 * A scene may instead report its own state (`builtAnimated`, e.g. the Kerr observatory while its accumulation is
 * unconverged); that replaces the declaration. Transient motion (inertia, camera easing, the intro, a highlight, a
 * drag, cinematic drift) always keeps the scene animated until it settles.
 */

export const ANIMATED_DECLARATIONS = Object.freeze([true, "motion", false]);

export function isAnimatedDeclaration(value) {
  return value === true || value === false || value === "motion";
}

export function resolveAnimated({ declared = true, playing = true, motion = 1, transient = false, builtAnimated = null } = {}) {
  if (!isAnimatedDeclaration(declared)) throw new TypeError(`animated must be true, "motion" or false, received ${JSON.stringify(declared)}`);
  let base;
  if (builtAnimated !== null && builtAnimated !== undefined) base = !!builtAnimated;
  else if (declared === true) base = !!playing;
  else if (declared === "motion") base = !!playing && motion > 0;
  else base = false;
  return base || !!transient;
}

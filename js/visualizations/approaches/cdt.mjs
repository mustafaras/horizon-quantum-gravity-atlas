/**
 * The CDT cylinder — Scene3D runtime (S23).
 *
 * A two-dimensional causal dynamical triangulation is a cylinder: T rings of triangles, one ring per discrete time
 * slice, with the slice volume L_t setting the ring's circumference. The scene draws exactly that: an engraved ring
 * per slice at its own radius, and one quad per (ring segment × time step) whose colour is the diffusion's local
 * occupation. Nothing here is decorative mathematics — the geometry and the colour both come from
 * `js/science/cdt-2d.mjs`.
 *
 * The theory is CONJECTURAL; what is computed is the simulation arithmetic. The caller labels this in-canvas.
 */

import { Color, DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import { tagLayer as tag } from "../../render/scene-layers.mjs";
import * as TK from "../../design/tokens.mjs";

const tokenColor = (name) => new Color().fromArray(TK.linearRef(name));
const HEIGHT = 5.6;
const RADIUS = 1.9;
const REVEAL_MS = 800;

/** The occupation of slice t, from the measured return probability: early slices light up first. */
function sliceHeat(profile, index) {
  const mean = profile.reduce((a, b) => a + b, 0) / profile.length;
  return Math.max(0, Math.min(1, profile[index] / Math.max(1, mean * 1.6)));
}

export function createCdtRuntime({ profile = [], seed = 42, engraved, reveal = "auto" } = {}) {
  if (!engraved) throw new TypeError("createCdtRuntime needs ctx.engraved (the scene's engraved line API)");
  if (!Array.isArray(profile) || profile.length < 4) throw new TypeError("createCdtRuntime needs a slice profile");
  const group = new Group();
  group.name = "cdt-lab";
  const slices = profile.length;
  const maxVolume = Math.max(...profile);

  // Rings: one engraved circle per time slice, sized by that slice's volume.
  const rings = [];
  for (let t = 0; t < slices; t++) {
    const y = HEIGHT / 2 - (t / (slices - 1)) * HEIGHT;
    const r = RADIUS * (0.55 + 0.45 * (profile[t] / maxVolume));
    const points = [];
    const segments = Math.max(24, Math.min(96, profile[t] * 6));
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      points.push(Math.cos(a) * r, y, Math.sin(a) * r);
    }
    const ring = engraved.line(new Float32Array(points), {
      color: "pigment-blue-64", opacity: 0.5, widthPx: engraved.WIDTH_PX.hairline, layer: "model",
    });
    ring.frustumCulled = false;
    group.add(tag(ring, "model"));
    rings.push(ring);
  }

  // The lateral surface: one thin quad per slice gap, coloured by the occupied volume of that slice.
  const warm = tokenColor("pigment-amber-84");
  const cool = tokenColor("pigment-blue-54");
  const bands = [];
  for (let t = 0; t < slices - 1; t++) {
    const heat = sliceHeat(profile, t);
    const colour = cool.clone().lerp(warm, heat * 0.85);
    const y0 = HEIGHT / 2 - (t / (slices - 1)) * HEIGHT;
    const y1 = HEIGHT / 2 - ((t + 1) / (slices - 1)) * HEIGHT;
    const r0 = RADIUS * (0.55 + 0.45 * (profile[t] / maxVolume));
    const r1 = RADIUS * (0.55 + 0.45 * (profile[t + 1] / maxVolume));
    const geometry = new PlaneGeometry(r0 * 2, Math.abs(y1 - y0), 1, 1);
    const material = new MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.16 + heat * 0.3, side: DoubleSide, depthWrite: false });
    const band = new Mesh(geometry, material);
    band.position.set(0, (y0 + y1) / 2, 0);
    band.rotation.y = (t % 2) * (Math.PI / 2);
    band.scale.set(1, 1, Math.max(0.2, r1 / Math.max(0.001, r0)));
    group.add(tag(band, "data"));
    bands.push(band);
  }

  let elapsed = reveal === "auto" ? 0 : REVEAL_MS;
  let progress = reveal === "auto" ? 0 : 1;
  const applyReveal = () => {
    const shown = progress >= 1 ? rings.length : Math.max(1, Math.round(rings.length * progress));
    rings.forEach((ring, i) => { ring.visible = i < shown; });
    bands.forEach((band, i) => { band.visible = i < Math.max(1, shown - 1); });
  };
  applyReveal();

  return {
    group,
    revealMs: REVEAL_MS,
    tick: (t) => {
      if (progress >= 1) return false;
      elapsed += Math.max(0, Number(t) || 0) * 1000; // t arrives in seconds
      progress = Math.min(1, elapsed / REVEAL_MS);
      applyReveal();
      return progress < 1;
    },
    completeReveal: () => { elapsed = REVEAL_MS; progress = 1; applyReveal(); },
    stats: () => ({ slices, seed, maxVolume, minVolume: Math.min(...profile), rings: rings.length, bands: bands.length, reveal: progress }),
    dispose: () => {
      for (const ring of rings) { group.remove(ring); ring.geometry?.dispose?.(); }
      for (const band of bands) { group.remove(band); band.geometry.dispose(); band.material.dispose(); }
      group.clear();
    },
  };
}

export { CDT_PROVENANCE } from "../../science/cdt-2d.mjs";

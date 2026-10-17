/**
 * Hawking horizon lab — Scene3D runtime (Prompt 07).
 *
 * A dark horizon disk with a photon-ring rim, orbited by a deterministic
 * emission field: seeded pair-production events spawn just outside the
 * horizon, one partner falls in (fades inward, dim red) and the partner
 * escapes outward. Escaping-particle COLOR tracks the Hawking temperature
 * (cool red → white-hot blue) and the visible RATE tracks the relative
 * emission power times the DISPLAY AMPLIFICATION (always disclosed by the
 * caller). As spin → 1 the shared temperature model drives emission to zero:
 * the field visibly empties, with no division by zero anywhere.
 *
 * The pair picture is SCHEMATIC (see HAWKING_LAB_PROVENANCE); the caller
 * labels it in-canvas. All numbers come from js/science/hawking.mjs.
 */

import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, Line,
  LineBasicMaterial, Mesh, MeshBasicMaterial, RingGeometry, Sprite,
  SpriteMaterial, SphereGeometry, Vector3,
} from "three";
import {
  hawkingLabState, sampleEmission, referenceTemperatureK,
  HAWKING_LAB_DEFAULTS,
} from "../../science/hawking.mjs";

const R_HORIZON = 1.4;
const COLD = new Color(1.0, 0.35, 0.18);
const HOT = new Color(0.62, 0.9, 1.0);
const FALL_COLOR = new Color(0.55, 0.16, 0.1);

export function createHawkingLabRuntime({
  massSolar = HAWKING_LAB_DEFAULTS.massSolar, spin = 0,
  amplification = HAWKING_LAB_DEFAULTS.amplification, seed = 42,
} = {}) {
  const lab = hawkingLabState({ massSolar, spin, amplification });
  const emission = sampleEmission({ massSolar, spin, seed, count: HAWKING_LAB_DEFAULTS.samples });
  const group = new Group();
  group.name = "bh-hawking-lab";

  // ---- horizon + rim ----
  const holeGeo = new SphereGeometry(R_HORIZON, 32, 24);
  const holeMat = new MeshBasicMaterial({ color: 0x01030a });
  group.add(new Mesh(holeGeo, holeMat));
  const rimGeo = new RingGeometry(R_HORIZON * 1.04, R_HORIZON * 1.16, 64);
  const rimMat = new MeshBasicMaterial({
    color: 0xffb060, transparent: true, opacity: 0.8,
    blending: AdditiveBlending, depthWrite: false, side: 2,
  });
  const rim = new Mesh(rimGeo, rimMat);
  rim.rotation.x = -Math.PI / 2.4;
  group.add(rim);

  // ---- temperature color: normalized log of T against a 10 M☉ reference ----
  const tRef = referenceTemperatureK(); // shared model's own 10 M☉, a*=0 value
  const heat = Math.max(0, Math.min(1, 0.5 + 0.14 * Math.log10(Math.max(1e-30, lab.temperatureK / tRef))));
  const hotColor = COLD.clone().lerp(HOT, heat);

  // ---- emission field: deterministic schedule over the sampled directions ----
  // Visible escaping count scales with displayPower (saturating at the sample
  // budget); extremal spin ⇒ relativePower → 0 ⇒ the field empties.
  const power = Math.max(0, lab.displayPower);
  const visible = Math.min(emission.samples.length, Math.round(emission.samples.length * Math.min(1, power / 40)));
  const escaping = emission.samples.filter((s) => s.escapes).slice(0, visible);
  const falling = emission.samples.filter((s) => !s.escapes).slice(0, Math.min(24, visible >> 2));

  const period = 6.5; // seconds per emission cycle (display pacing)
  const sprites = [];
  const spriteMats = [];

  const makeSprite = (color, scale) => {
    const m = new SpriteMaterial({ color, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false });
    const s = new Sprite(m);
    s.scale.setScalar(scale);
    spriteMats.push(m);
    sprites.push(s);
    group.add(s);
    return s;
  };

  const escapeRig = escaping.map((s, i) => {
    const sprite = makeSprite(hotColor.clone(), 0.16 + 0.1 * s.energyOverT / 6);
    const dir = new Vector3(
      Math.cos(s.azimuth) * Math.sqrt(1 - s.cosPolar * s.cosPolar),
      s.cosPolar,
      Math.sin(s.azimuth) * Math.sqrt(1 - s.cosPolar * s.cosPolar),
    ).normalize();
    return { sprite, dir, t0: (i / Math.max(1, escaping.length)) * period, energy: s.energyOverT };
  });

  const fallRig = falling.map((s, i) => {
    const sprite = makeSprite(FALL_COLOR.clone(), 0.14);
    const dir = new Vector3(
      Math.cos(s.azimuth) * Math.sqrt(1 - s.cosPolar * s.cosPolar),
      -Math.abs(s.cosPolar) * 0.4,
      Math.sin(s.azimuth) * Math.sqrt(1 - s.cosPolar * s.cosPolar),
    ).normalize();
    return { sprite, dir, t0: (i / Math.max(1, falling.length)) * period };
  });

  function sync({ time = 0, motion = 1 } = {}) {
    // Reduced motion: freeze the emission cycle on a fixed phase so captures
    // are frame-deterministic; the field is still fully populated.
    const phase = motion === 0
      ? period * 0.42
      : ((Number(time) || 0) % period + period) % period;
    const speed = 0.5 + 0.5 * motion;
    for (const r of escapeRig) {
      const local = ((phase - r.t0) / period + 1) % 1;
      const rad = R_HORIZON * 1.08 + local * (5.2 * speed + r.energy * 0.25);
      r.sprite.position.copy(r.dir).multiplyScalar(rad);
      r.sprite.material.opacity = 0.9 * (1 - local) * (1 - Math.max(0, 1 - lab.displayPower / 8));
    }
    for (const r of fallRig) {
      const local = ((phase - r.t0) / period + 1) % 1;
      const rad = Math.max(R_HORIZON * 0.2, R_HORIZON * 2.2 - local * R_HORIZON * 1.9);
      r.sprite.position.copy(r.dir).multiplyScalar(rad);
      r.sprite.material.opacity = 0.7 * local * (1 - local) * 4;
    }
    rimMat.opacity = 0.55 + 0.35 * heat;
  }

  // ---- correlation-style reference curve: extremal T(a*)/T(0) on the floor ----
  const curveGeo = new BufferGeometry();
  {
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const a = i / 48;
      const root = Math.sqrt(Math.max(0, 1 - a * a));
      const rp = 1 + root, rm = 1 - root;
      const kappa = a >= 1 ? 0 : (rp - rm) / (2 * (rp * rp + a * a)) / 0.25;
      pts.push(-5 + a * 10, -2.6 + kappa * 1.6, -4.2);
    }
    curveGeo.setAttribute("position", new BufferAttribute(new Float32Array(pts), 3));
  }
  const curveMat = new LineBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false });
  const curve = new Line(curveGeo, curveMat);
  group.add(curve);

  function dispose() {
    holeGeo.dispose(); holeMat.dispose(); rimGeo.dispose(); rimMat.dispose();
    curveGeo.dispose(); curveMat.dispose();
    for (const m of spriteMats) m.dispose();
    group.removeFromParent?.();
  }

  return {
    mesh: group,
    kind: "cpu-samples",
    stats: () => ({
      kind: "cpu-samples",
      particles: escapeRig.length + fallRig.length,
      escaping: escapeRig.length,
      temperatureK: lab.temperatureK,
      extremal: lab.extremal,
      displayAmplification: lab.displayGain,
    }),
    sync,
    dispose,
    recoverable: () => false,
  };
}

/**
 * Hawking horizon lab — Scene3D runtime (Prompt 07, premium rendering).
 *
 * A black horizon disc wrapped in a billboarded radial glow, a bright photon
 * ring torus, and a seeded starfield, orbited by a deterministic emission
 * field: seeded pair-production events spawn just outside the horizon, one
 * partner falls in (dim red glow, fading inward) and the partner escapes
 * outward as a soft glow sprite with a short luminous trail. Escaping-particle
 * COLOR tracks the Hawking temperature (cool red → white-hot blue) and the
 * visible RATE tracks the relative emission power times the DISPLAY
 * AMPLIFICATION (always disclosed by the caller). As spin → 1 the shared
 * temperature model drives emission to zero: the field visibly empties, with
 * no division by zero anywhere.
 *
 * The pair picture is SCHEMATIC (see HAWKING_LAB_PROVENANCE); the caller
 * labels it in-canvas. All numbers come from js/science/hawking.mjs.
 */

import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group,
  LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, PlaneGeometry,
  Points, PointsMaterial, Sprite, SpriteMaterial, SphereGeometry,
  CatmullRomCurve3, TorusGeometry, TubeGeometry, Vector3,
} from "three";
import {
  hawkingLabState, sampleEmission, referenceTemperatureK,
  HAWKING_LAB_DEFAULTS,
} from "../../science/hawking.mjs";
import { seededRng } from "../../physics.mjs";
import { sharedGlowTexture, ringGlowTexture } from "../glow-texture.mjs";

const R_HORIZON = 1.4;
const COLD = new Color(1.0, 0.35, 0.18);
const HOT = new Color(0.62, 0.9, 1.0);
const FALL_COLOR = new Color(0.55, 0.16, 0.1);

export function createHawkingLabRuntime({
  massSolar = HAWKING_LAB_DEFAULTS.massSolar, spin = 0,
  amplification = HAWKING_LAB_DEFAULTS.amplification, seed = 42,
  camera = null,
} = {}) {
  const lab = hawkingLabState({ massSolar, spin, amplification });
  const emission = sampleEmission({ massSolar, spin, seed, count: HAWKING_LAB_DEFAULTS.samples });
  const group = new Group();
  group.name = "bh-hawking-lab";
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  // ---- temperature color: normalized log of T against a 10 M☉ reference ----
  const tRef = referenceTemperatureK(); // shared model's own 10 M☉, a*=0 value
  const heat = Math.max(0, Math.min(1, 0.5 + 0.14 * Math.log10(Math.max(1e-30, lab.temperatureK / tRef))));
  const hotColor = COLD.clone().lerp(HOT, heat);

  // ---- seeded starfield (fixed shell, subtle color temperature spread) ----
  {
    const rng = seededRng(11);
    const n = 520;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const tmp = new Color();
    for (let i = 0; i < n; i++) {
      const u = rng() * 2 - 1, th = rng() * Math.PI * 2;
      const r = 34 + rng() * 14;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(th);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(th);
      const t = rng();
      tmp.setHSL(0.55 + 0.12 * t, 0.35, 0.6 + 0.35 * rng());
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    const starGeo = track(new BufferGeometry());
    starGeo.setAttribute("position", new BufferAttribute(pos, 3));
    starGeo.setAttribute("color", new BufferAttribute(col, 3));
    const starMat = track(new PointsMaterial({
      size: 0.55, sizeAttenuation: true, map: sharedGlowTexture(), vertexColors: true,
      transparent: true, opacity: 0.85, depthWrite: false, blending: AdditiveBlending,
    }));
    const stars = new Points(starGeo, starMat);
    stars.frustumCulled = false;
    group.add(stars);
  }

  // ---- billboarded horizon glow (transparent core → warm ring → fade) ----
  const glowMat = track(new MeshBasicMaterial({
    map: track(ringGlowTexture(0.24, 0.34, 1.0)), color: hotColor.clone().lerp(new Color(0xffc27a), 0.5),
    transparent: true, opacity: 0.55 + 0.35 * heat,
    blending: AdditiveBlending, depthWrite: false,
  }));
  const glowDisc = new Mesh(track(new PlaneGeometry(11, 11)), glowMat);
  glowDisc.renderOrder = 1;
  group.add(glowDisc);

  // ---- horizon + rim halo shells ----
  const holeGeo = track(new SphereGeometry(R_HORIZON, 48, 32));
  const holeMat = track(new MeshBasicMaterial({ color: 0x01030a }));
  group.add(new Mesh(holeGeo, holeMat));
  for (const [scale, opacity] of [[1.025, 0.20], [1.07, 0.08]]) {
    const shellGeo = track(new SphereGeometry(R_HORIZON * scale, 32, 24));
    const shellMat = track(new MeshBasicMaterial({
      color: 0xffb060, transparent: true, opacity,
      blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(new Mesh(shellGeo, shellMat));
  }

  // ---- photon ring: bright torus + soft halo torus, tilted with the disk plane ----
  const ringTilt = -Math.PI / 2.4;
  for (const [radius, tube, color, opacity] of [
    [R_HORIZON * 1.06, 0.016, 0xffe2b0, 0.95],
    [R_HORIZON * 1.09, 0.055, 0xff9a3c, 0.28],
  ]) {
    const torusGeo = track(new TorusGeometry(radius, tube, 10, 128));
    const torusMat = track(new MeshBasicMaterial({
      color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false,
    }));
    const torus = new Mesh(torusGeo, torusMat);
    torus.rotation.x = ringTilt;
    group.add(torus);
  }

  // ---- emission field: deterministic schedule over the sampled directions ----
  const power = Math.max(0, lab.displayPower);
  const visible = Math.min(emission.samples.length, Math.round(emission.samples.length * Math.min(1, power / 40)));
  const escaping = emission.samples.filter((s) => s.escapes).slice(0, visible);
  const falling = emission.samples.filter((s) => !s.escapes).slice(0, Math.min(24, visible >> 2));

  const period = 6.5; // seconds per emission cycle (display pacing)
  const spriteMats = [];

  const makeSprite = (color, scale) => {
    const m = track(new SpriteMaterial({
      map: sharedGlowTexture(), color, transparent: true, opacity: 0.9,
      blending: AdditiveBlending, depthWrite: false,
    }));
    spriteMats.push(m);
    const s = new Sprite(m);
    s.scale.setScalar(scale);
    group.add(s);
    return s;
  };

  const dirOf = (s, flipY = 0) => new Vector3(
    Math.cos(s.azimuth) * Math.sqrt(1 - s.cosPolar * s.cosPolar),
    (flipY ? -Math.abs(s.cosPolar) * 0.4 : s.cosPolar),
    Math.sin(s.azimuth) * Math.sqrt(1 - s.cosPolar * s.cosPolar),
  ).normalize();

  const escapeRig = escaping.map((s, i) => ({
    sprite: makeSprite(hotColor.clone(), 0.34 + 0.14 * s.energyOverT / 6),
    dir: dirOf(s), t0: (i / Math.max(1, escaping.length)) * period, energy: s.energyOverT,
  }));
  const fallRig = falling.map((s, i) => ({
    sprite: makeSprite(FALL_COLOR.clone(), 0.26),
    dir: dirOf(s, true), t0: (i / Math.max(1, falling.length)) * period,
  }));

  // ---- trails: one LineSegments per group, head bright → tail dark ----
  const mkTrails = (rig, color) => {
    const pos = new Float32Array(rig.length * 6);
    const col = new Float32Array(rig.length * 6);
    const geo = track(new BufferGeometry());
    geo.setAttribute("position", new BufferAttribute(pos, 3));
    geo.setAttribute("color", new BufferAttribute(col, 3));
    const mat = track(new LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.7,
      blending: AdditiveBlending, depthWrite: false,
    }));
    const lines = new LineSegments(geo, mat);
    lines.frustumCulled = false;
    group.add(lines);
    return { geo, pos, col, color: new Color(color) };
  };
  const escapeTrails = mkTrails(escapeRig, 0x9fd8ff);
  const fallTrails = mkTrails(fallRig, 0x8a2a1a);

  function writeTrail(tr, rig, radOf, tailLen, alphaOf) {
    for (let i = 0; i < rig.length; i++) {
      const p = rig[i].sprite.position;
      const d = rig[i].dir;
      const a = alphaOf(i);
      tr.pos[i * 6] = p.x; tr.pos[i * 6 + 1] = p.y; tr.pos[i * 6 + 2] = p.z;
      tr.pos[i * 6 + 3] = p.x - d.x * tailLen;
      tr.pos[i * 6 + 4] = p.y - d.y * tailLen;
      tr.pos[i * 6 + 5] = p.z - d.z * tailLen;
      tr.col[i * 6] = tr.color.r * a; tr.col[i * 6 + 1] = tr.color.g * a; tr.col[i * 6 + 2] = tr.color.b * a;
      tr.col[i * 6 + 3] = 0; tr.col[i * 6 + 4] = 0; tr.col[i * 6 + 5] = 0;
    }
    tr.geo.attributes.position.needsUpdate = true;
    tr.geo.attributes.color.needsUpdate = true;
  }

  function sync({ time = 0, motion = 1 } = {}) {
    // Reduced motion: freeze the emission cycle on a fixed phase so captures
    // are frame-deterministic; the field is still fully populated.
    const phase = motion === 0
      ? period * 0.42
      : ((Number(time) || 0) % period + period) % period;
    const speed = 0.5 + 0.5 * motion;
    const fade = 1 - Math.max(0, 1 - lab.displayPower / 8);
    for (const r of escapeRig) {
      const local = ((phase - r.t0) / period + 1) % 1;
      const rad = R_HORIZON * 1.08 + local * (5.2 * speed + r.energy * 0.25);
      r.sprite.position.copy(r.dir).multiplyScalar(rad);
      r.sprite.material.opacity = 0.9 * (1 - local) * fade;
    }
    for (const r of fallRig) {
      const local = ((phase - r.t0) / period + 1) % 1;
      const rad = Math.max(R_HORIZON * 0.2, R_HORIZON * 2.2 - local * R_HORIZON * 1.9);
      r.sprite.position.copy(r.dir).multiplyScalar(rad);
      r.sprite.material.opacity = 0.7 * local * (1 - local) * 4;
    }
    writeTrail(escapeTrails, escapeRig, null, 0.55, (i) => escapeRig[i].sprite.material.opacity);
    writeTrail(fallTrails, fallRig, null, 0.3, (i) => fallRig[i].sprite.material.opacity);
    glowMat.opacity = (0.4 + 0.4 * heat) * (0.6 + 0.4 * fade);
    if (camera) glowDisc.quaternion.copy(camera.quaternion);
  }

  // ---- reference curve: extremal T(a*)/T(0) on the floor, glowing tube ----
  {
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const a = i / 48;
      const root = Math.sqrt(Math.max(0, 1 - a * a));
      const rp = 1 + root, rm = 1 - root;
      const kappa = a >= 1 ? 0 : (rp - rm) / (2 * (rp * rp + a * a)) / 0.25;
      pts.push(new Vector3(-5 + a * 10, -2.6 + kappa * 1.6, -4.2));
    }
    const curve = new CatmullRomCurve3(pts);
    const tubeGeo = track(new TubeGeometry(curve, 96, 0.03, 6, false));
    const tubeMat = track(new MeshBasicMaterial({
      color: 0x8fd0ff, transparent: true, opacity: 0.9,
      blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(new Mesh(tubeGeo, tubeMat));
    const haloGeo = track(new TubeGeometry(curve, 96, 0.1, 6, false));
    const haloMat = track(new MeshBasicMaterial({
      color: 0x2a6cff, transparent: true, opacity: 0.14,
      blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(new Mesh(haloGeo, haloMat));
  }

  function dispose() {
    for (const d of disposables) d.dispose?.();
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

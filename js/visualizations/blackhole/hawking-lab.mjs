/**
 * Hawking horizon lab — Scene3D runtime (Prompt 07, ultra-premium rendering).
 *
 * Scene grammar (designed for instant readability):
 *   1. A crisp black horizon sphere with a thin billboarded photon-ring halo
 *      (ring texture hugging the silhouette — no soft blob), plus a whisper
 *      of ambient warmth.
 *   2. A faint equatorial reference disk marking the horizon, photon sphere
 *      (1.5 r+) and ISCO (3 r+) radii — the same radii-map language as the
 *      observatory scene.
 *   3. A glowing "temperature rail" arcing over the scene: T(a*)/T(0) from
 *      the shared surface-gravity model, with ticks at a* = 0, 1/2, 1 and a
 *      marker that slides down the rail to the current spin value, dropping
 *      a guide line to the disk plane.
 *   4. A deterministic pair-emission field: seeded partners escape outward
 *      on gently curved, temperature-coloured paths with luminous trails,
 *      while their partners fall in (dim red). The VISIBLE RATE follows the
 *      real Stefan-Boltzmann power shape P ~ A T^4 (display-amplified, always
 *      disclosed by the caller), with a small display floor so finite-mass
 *      holes never look dead, and an exact zero as kappa/kappa0 -> 0 toward
 *      extremal spin: the field visibly empties.
 *
 * The pair picture is SCHEMATIC (see HAWKING_LAB_PROVENANCE); the caller
 * labels it in-canvas. All numbers come from js/science/hawking.mjs.
 */

import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, Group,
  Mesh, MeshBasicMaterial,
  PlaneGeometry, Points, PointsMaterial, RingGeometry, Sprite, SpriteMaterial,
  SphereGeometry, TorusGeometry, TubeGeometry, Vector3, DoubleSide,
} from "three";
import {
  hawkingLabState, sampleEmission, referenceTemperatureK,
  HAWKING_LAB_DEFAULTS,
} from "../../science/hawking.mjs";
import { seededRng } from "../../physics.mjs";
import { sharedGlowTexture, ringGlowTexture } from "../glow-texture.mjs";
import * as TK from "../../design/tokens.mjs";

const tokenColor = (name) => new Color().fromArray(TK.linearRef(name));

const R_HORIZON = 1.4;

/* Display-rate mapping: the true relative power P(a*,M)/P(10 solar, a*=0)
 * spans ~30 orders of magnitude across the sliders, so the scene maps it
 * through a display window (disclosed by the caller's amplification readout).
 * Hard zero below the window keeps the extremal punchline exact. */
const RATE_FLOOR = 0.018;    // displayPower below this -> no visible emission
const RATE_CEIL = 4.2;       // displayPower above this -> full field
const RATE_MIN_FLOOR = 0.06; // display floor for cold-but-finite holes
const DRAIN_KAPPA = 0.27;    // kappa/kappa0 at/below this (a* >~ 0.988) -> zero

const clamp01 = (x) => Math.max(0, Math.min(1, x));

export function createHawkingLabRuntime({
  massSolar = HAWKING_LAB_DEFAULTS.massSolar, spin = 0,
  amplification = HAWKING_LAB_DEFAULTS.amplification, seed = 42,
  camera = null, engraved,
} = {}) {
  if (!engraved) throw new TypeError("createHawkingLabRuntime needs ctx.engraved (the scene's engraved line API)");
  const lab = hawkingLabState({ massSolar, spin, amplification });
  const emission = sampleEmission({ massSolar, spin, seed, count: HAWKING_LAB_DEFAULTS.samples });
  const group = new Group();
  group.name = "bh-hawking-lab";
  const COLD = tokenColor("emit-hawking-cold");
  const HOT = tokenColor("emit-hawking-hot");
  const FALL_COLOR = tokenColor("emit-infall");
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };
  const trackLine = (line) => { track(line.geometry); track(line.material); return line; };

  // ---- temperature colour: normalized log of T against a 10 solar-mass ref ----
  const tRef = referenceTemperatureK(); // shared model's own 10 solar, a*=0 value
  const heat = clamp01(0.5 + 0.14 * Math.log10(Math.max(1e-30, lab.temperatureK / tRef)));
  const hotColor = COLD.clone().lerp(HOT, heat);

  // ---- visible rate: real power shape through a display window ----
  const kappa = lab.temperatureFactor; // 1 at a*=0 -> 0 at extremal
  const drainFloor = clamp01((kappa - DRAIN_KAPPA) / (0.9 - DRAIN_KAPPA));
  const hardRate = clamp01((lab.displayPower - RATE_FLOOR) / (RATE_CEIL - RATE_FLOOR));
  const rate = Math.max(hardRate, RATE_MIN_FLOOR * drainFloor);
  const fieldFade = 0.35 + 0.65 * rate;
  const pace = 0.35 + 0.65 * rate; // colder holes emit slower, lazier particles

  // ---- seeded starfield (fixed shell, subtle colour-temperature spread) ----
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
    stars.renderOrder = 0;
    group.add(stars);
  }

  // ---- crisp photon-ring halo: billboarded ring texture hugging the rim ----
  const billboards = [];
  const haloMat = track(new MeshBasicMaterial({
    map: track(ringGlowTexture(0.5, 0.6, 0.8)),
    color: hotColor.clone().lerp(new Color(TK.hex("pigment-orange-90")), 0.45),
    transparent: true, opacity: 0.5 + 0.25 * heat,
    blending: AdditiveBlending, depthWrite: false, depthTest: false,
  }));
  const haloDisc = new Mesh(track(new PlaneGeometry(4.9, 4.9)), haloMat);
  haloDisc.renderOrder = 6;
  haloDisc.frustumCulled = false;
  group.add(haloDisc);
  billboards.push(haloDisc);

  // whisper of ambient warmth (kept very faint — depth, never a blob)
  const ambMat = track(new MeshBasicMaterial({
    map: track(ringGlowTexture(0.16, 0.3, 1.0)),
    color: hotColor.clone().lerp(new Color(TK.hex("pigment-orange-78-c15-h055")), 0.6),
    transparent: true, opacity: 0.1 + 0.08 * heat,
    blending: AdditiveBlending, depthWrite: false, depthTest: false,
  }));
  const ambDisc = new Mesh(track(new PlaneGeometry(10.5, 10.5)), ambMat);
  ambDisc.renderOrder = 5;
  ambDisc.frustumCulled = false;
  group.add(ambDisc);
  billboards.push(ambDisc);

  // ---- horizon sphere + tight atmosphere shells ----
  const holeGeo = track(new SphereGeometry(R_HORIZON, 64, 48));
  const holeMat = track(new MeshBasicMaterial({ color: TK.hex("pigment-grey-10") }));
  group.add(new Mesh(holeGeo, holeMat));
  for (const [scale, opacity] of [[1.018, 0.16], [1.05, 0.06]]) {
    const shellGeo = track(new SphereGeometry(R_HORIZON * scale, 48, 32));
    const shellMat = track(new MeshBasicMaterial({
      color: TK.hex("pigment-orange-82-c13-h064"), transparent: true, opacity,
      blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(new Mesh(shellGeo, shellMat));
  }

  // ---- photon ring: bright torus + soft halo torus in the disk plane ----
  for (const [radius, tube, color, opacity] of [
    [R_HORIZON * 1.055, 0.014, TK.hex("pigment-orange-94"), 0.95],
    [R_HORIZON * 1.1, 0.05, TK.hex("pigment-orange-78-c16"), 0.22],
  ]) {
    const torusGeo = track(new TorusGeometry(radius, tube, 10, 160));
    const torusMat = track(new MeshBasicMaterial({
      color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false,
    }));
    const torus = new Mesh(torusGeo, torusMat);
    torus.rotation.x = -Math.PI / 2; // lie flat in the reference-disk plane
    group.add(torus);
  }

  // ---- equatorial reference disk: horizon / photon sphere / ISCO + spokes ----
  {
    const disk = new Group();
    disk.name = "bh-hawking-radii";
    const rings = [
      [R_HORIZON, TK.hex("pigment-orange-82-c13-h064"), 0.2],
      [R_HORIZON * 1.5, TK.hex("pigment-orange-87"), 0.12],
      [R_HORIZON * 3, TK.hex("pigment-blue-73"), 0.12],
    ];
    for (const [r, color, opacity] of rings) {
      const ringGeo = track(new RingGeometry(r - 0.014, r + 0.014, 180, 1));
      const ringMat = track(new MeshBasicMaterial({
        color, transparent: true, opacity, blending: AdditiveBlending,
        depthWrite: false, side: DoubleSide,
      }));
      const ring = new Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      disk.add(ring);
    }
    const spokePos = [];
    for (let i = 0; i < 16; i++) {
      const th = (i / 16) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      spokePos.push(c * R_HORIZON * 1.12, 0, s * R_HORIZON * 1.12,
        c * R_HORIZON * 3.25, 0, s * R_HORIZON * 3.25);
    }
    const spokes = trackLine(engraved.segments(spokePos, {
      color: "pigment-blue-78", opacity: 0.07, additive: true, widthPx: engraved.WIDTH_PX.hairline, layer: "decoration",
    }));
    spokes.frustumCulled = false;
    disk.add(spokes);
    group.add(disk);
  }

  // ---- temperature rail: T(a*)/T(0) arcing over the scene, with marker ----
  const RAIL = { x0: -5.0, x1: 5.0, yBase: 0.35, amp: 2.55, z: -3.4 };
  const kappaOf = (a) => {
    const root = Math.sqrt(Math.max(0, 1 - a * a));
    const rp = 1 + root, rm = 1 - root;
    return a >= 1 ? 0 : ((rp - rm) / (2 * (rp * rp + a * a))) / 0.25;
  };
  const railPoint = (a) => new Vector3(
    RAIL.x0 + a * (RAIL.x1 - RAIL.x0),
    RAIL.yBase + kappaOf(a) * RAIL.amp,
    RAIL.z,
  );
  {
    const pts = [];
    for (let i = 0; i <= 64; i++) pts.push(railPoint(i / 64));
    const curve = new CatmullRomCurve3(pts);
    const tubeGeo = track(new TubeGeometry(curve, 128, 0.026, 8, false));
    const tubeMat = track(new MeshBasicMaterial({
      color: TK.hex("pigment-azure-83-c09"), transparent: true, opacity: 0.95,
      blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(new Mesh(tubeGeo, tubeMat));
    const haloGeo = track(new TubeGeometry(curve, 128, 0.085, 6, false));
    const haloMat2 = track(new MeshBasicMaterial({
      color: TK.hex("pigment-blue-58"), transparent: true, opacity: 0.13,
      blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(new Mesh(haloGeo, haloMat2));

    // ticks at a* = 0, 1/2, 1 (short marks rising from the disk plane)
    const tickPos = [];
    for (const a of [0, 0.5, 1]) {
      const x = RAIL.x0 + a * (RAIL.x1 - RAIL.x0);
      tickPos.push(x, 0.05, RAIL.z, x, 0.34, RAIL.z);
    }
    const ticks = trackLine(engraved.segments(tickPos, {
      color: "pigment-azure-64", opacity: 0.5, additive: true, widthPx: engraved.WIDTH_PX.standard, layer: "model",
    }));
    ticks.frustumCulled = false;
    group.add(ticks);

    // endpoint dots on the rail
    for (const a of [0, 1]) {
      const dotMat = track(new SpriteMaterial({
        map: sharedGlowTexture(), color: TK.hex("pigment-azure-91"), transparent: true, opacity: 0.85,
        blending: AdditiveBlending, depthWrite: false,
      }));
      const dot = new Sprite(dotMat);
      dot.scale.setScalar(0.22);
      dot.position.copy(railPoint(a));
      group.add(dot);
    }
  }

  // sliding marker at the current |a*| + guide line dropping to the disk
  const markerA = Math.min(1, Math.abs(lab.spin));
  const markerMat = track(new SpriteMaterial({
    map: sharedGlowTexture(), color: TK.hex("pigment-azure-95"), transparent: true, opacity: 1,
    blending: AdditiveBlending, depthWrite: false,
  }));
  const marker = new Sprite(markerMat);
  marker.scale.setScalar(0.34);
  marker.position.copy(railPoint(markerA));
  group.add(marker);
  const guide = trackLine(engraved.segments(
    [marker.position.x, 0.05, RAIL.z, marker.position.x, marker.position.y, RAIL.z],
    { color: "pigment-azure-85-c08", opacity: 0.35, additive: true, widthPx: engraved.WIDTH_PX.hairline, layer: "decoration" },
  ));
  guide.frustumCulled = false;
  group.add(guide);

  // ---- emission field: deterministic schedule over the sampled directions ----
  const escapePool = emission.samples.filter((s) => s.escapes);
  const visible = Math.round(Math.min(escapePool.length, 110) * rate);
  const escaping = escapePool.slice(0, visible);
  const falling = emission.samples.filter((s) => !s.escapes)
    .slice(0, Math.min(40, Math.round(visible * 0.35)));

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

  const dirOf = (s, dip = 0) => new Vector3(
    Math.cos(s.azimuth) * Math.sqrt(1 - s.cosPolar * s.cosPolar),
    (dip ? -Math.abs(s.cosPolar) * 0.4 : s.cosPolar),
    Math.sin(s.azimuth) * Math.sqrt(1 - s.cosPolar * s.cosPolar),
  ).normalize();

  // gentle azimuthal swirl so escaping paths curve elegantly
  const swirlOf = (dir) => {
    const t = new Vector3().crossVectors(dir, new Vector3(0, 1, 0));
    if (t.lengthSq() < 1e-4) t.set(1, 0, 0);
    return t.normalize().multiplyScalar(0.55);
  };

  const escapePath = (dir, swirl, local, energy) => {
    const rad = R_HORIZON * 1.08 + local * (4.6 * pace + energy * 0.22);
    return new Vector3()
      .copy(dir).multiplyScalar(rad)
      .addScaledVector(swirl, local * local);
  };

  const escapeRig = escaping.map((s, i) => {
    const dir = dirOf(s);
    return {
      sprite: makeSprite(hotColor.clone(), 0.4 + 0.16 * s.energyOverT / 6),
      dir, swirl: swirlOf(dir), energy: s.energyOverT,
      t0: (i / Math.max(1, escaping.length)) * period,
    };
  });
  const fallRig = falling.map((s, i) => ({
    sprite: makeSprite(FALL_COLOR.clone(), 0.24),
    dir: dirOf(s, true), t0: (i / Math.max(1, falling.length)) * period,
  }));

  // ---- trails: one LineSegments per group, head bright -> tail dark ----
  const mkTrails = (rig, color) => {
    const pos = new Float32Array(rig.length * 6);
    const col = new Float32Array(rig.length * 6);
    const lines = trackLine(engraved.segments(pos, {
      colors: col, opacity: 0.85, additive: true, widthPx: engraved.WIDTH_PX.standard, layer: "model",
    }));
    lines.frustumCulled = false;
    group.add(lines);
    return { lines, pos, col, color: new Color(color) };
  };
  const escapeTrails = mkTrails(escapeRig, hotColor);
  const fallTrails = mkTrails(fallRig, TK.hex("pigment-red-43"));

  function writeEscapeTrails(phase) {
    for (let i = 0; i < escapeRig.length; i++) {
      const r = escapeRig[i];
      const local = ((phase - r.t0) / period + 1) % 1;
      const head = escapePath(r.dir, r.swirl, local, r.energy);
      const tail = escapePath(r.dir, r.swirl, Math.max(0, local - 0.13), r.energy);
      const a = r.sprite.material.opacity;
      const p = escapeTrails.pos, c = escapeTrails.col, cc = escapeTrails.color;
      p[i * 6] = head.x; p[i * 6 + 1] = head.y; p[i * 6 + 2] = head.z;
      p[i * 6 + 3] = tail.x; p[i * 6 + 4] = tail.y; p[i * 6 + 5] = tail.z;
      c[i * 6] = cc.r * a; c[i * 6 + 1] = cc.g * a; c[i * 6 + 2] = cc.b * a;
      c[i * 6 + 3] = 0; c[i * 6 + 4] = 0; c[i * 6 + 5] = 0;
    }
    engraved.update(escapeTrails.lines, escapeTrails.pos, escapeTrails.col);
  }

  function writeFallTrails() {
    for (let i = 0; i < fallRig.length; i++) {
      const r = fallRig[i];
      const p = r.sprite.position, d = r.dir;
      const a = r.sprite.material.opacity;
      const pos = fallTrails.pos, col = fallTrails.col, cc = fallTrails.color;
      pos[i * 6] = p.x; pos[i * 6 + 1] = p.y; pos[i * 6 + 2] = p.z;
      pos[i * 6 + 3] = p.x + d.x * 0.32;
      pos[i * 6 + 4] = p.y + d.y * 0.32;
      pos[i * 6 + 5] = p.z + d.z * 0.32;
      col[i * 6] = cc.r * a; col[i * 6 + 1] = cc.g * a; col[i * 6 + 2] = cc.b * a;
      col[i * 6 + 3] = 0; col[i * 6 + 4] = 0; col[i * 6 + 5] = 0;
    }
    engraved.update(fallTrails.lines, fallTrails.pos, fallTrails.col);
  }

  function sync({ time = 0, motion = 1 } = {}) {
    // Reduced motion: freeze the emission cycle on a fixed phase so captures
    // are frame-deterministic; the field is still fully populated.
    const phase = motion === 0
      ? period * 0.42
      : ((Number(time) || 0) % period + period) % period;
    for (const r of escapeRig) {
      const local = ((phase - r.t0) / period + 1) % 1;
      r.sprite.position.copy(escapePath(r.dir, r.swirl, local, r.energy));
      r.sprite.material.opacity =
        0.95 * Math.pow(Math.sin(Math.PI * Math.min(1, local)), 0.7) * fieldFade;
    }
    for (const r of fallRig) {
      const local = ((phase - r.t0) / period + 1) % 1;
      const rad = Math.max(R_HORIZON * 0.2, R_HORIZON * 2.2 - local * R_HORIZON * 1.9);
      r.sprite.position.copy(r.dir).multiplyScalar(rad);
      r.sprite.material.opacity =
        0.75 * Math.pow(Math.sin(Math.PI * Math.min(1, local)), 0.7) * fieldFade;
    }
    writeEscapeTrails(phase);
    writeFallTrails();
    haloMat.opacity = (0.42 + 0.3 * heat) * (0.55 + 0.45 * fieldFade);
    ambMat.opacity = (0.07 + 0.09 * heat) * (0.5 + 0.5 * fieldFade);
    if (camera) for (const b of billboards) b.quaternion.copy(camera.quaternion);
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

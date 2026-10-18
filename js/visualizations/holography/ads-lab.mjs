/**
 * AdS holography lab — Scene3D runtime (Prompt 08, premium rendering).
 *
 * A Poincaré disk lying flat in the xz-plane: the conformal boundary is a
 * glowing cyan ring, the bulk carries the tested hyperbolic grid (geodesic
 * circles crowding toward the boundary), and the link partition weaves violet
 * geodesic arcs between boundary nodes. The FEATURED boundary region (centered
 * at angle π/2, deterministic) anchors a gold RT geodesic tube with a
 * magenta entanglement-wedge fan filling the region between geodesic and
 * boundary arc. Every curve comes from js/science/ads-geometry.mjs — nothing
 * here is eyeballed. The AdS/CFT reading is CONJECTURAL and labeled in-canvas
 * by the caller.
 */

import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CatmullRomCurve3, Color,
  DoubleSide, Group, Line, LineBasicMaterial, LineSegments, Mesh,
  MeshBasicMaterial, Points, PointsMaterial, PlaneGeometry, SphereGeometry,
  Sprite, SpriteMaterial, TorusGeometry, TubeGeometry, Vector3,
} from "three";
import { adsLabState, ADS_LAB_DEFAULTS } from "../../science/ads-geometry.mjs";
import { seededRng } from "../../physics.mjs";
import { sharedGlowTexture, ringGlowTexture } from "../glow-texture.mjs";

const S = 3.2; // disk radius in world units
const GOLD = new Color(1.0, 0.78, 0.35);
const MAGENTA = new Color(0.88, 0.35, 0.85);

const to3 = (p, lift = 0) => new Vector3(p.x * S, lift, p.y * S);

export function createAdsLabRuntime({
  links = ADS_LAB_DEFAULTS.links,
  region = ADS_LAB_DEFAULTS.region,
  regulator = ADS_LAB_DEFAULTS.regulator,
  centralCharge = ADS_LAB_DEFAULTS.centralCharge,
  seed = 42,
  camera = null,
} = {}) {
  const lab = adsLabState({ links, region, regulator, centralCharge });
  const group = new Group();
  group.name = "ads-holography-lab";
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  // ---- seeded starfield (fixed shell, cool spread) ----
  {
    const rng = seededRng(seed >>> 0);
    const n = 420;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const tmp = new Color();
    for (let i = 0; i < n; i++) {
      const u = rng() * 2 - 1, th = rng() * Math.PI * 2;
      const r = 26 + rng() * 12;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(th);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(th);
      tmp.setHSL(0.58 + 0.1 * rng(), 0.3, 0.55 + 0.35 * rng());
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    const starGeo = track(new BufferGeometry());
    starGeo.setAttribute("position", new BufferAttribute(pos, 3));
    starGeo.setAttribute("color", new BufferAttribute(col, 3));
    const starMat = track(new PointsMaterial({
      size: 0.5, sizeAttenuation: true, map: sharedGlowTexture(), vertexColors: true,
      transparent: true, opacity: 0.7, depthWrite: false, blending: AdditiveBlending,
    }));
    const stars = new Points(starGeo, starMat);
    stars.frustumCulled = false;
    group.add(stars);
  }

  // ---- disk floor: faint radial glow so the bulk reads as a surface ----
  const floorMat = track(new MeshBasicMaterial({
    map: track(ringGlowTexture(0.0, 0.08, 0.98)), color: 0x1a2a4a,
    transparent: true, opacity: 0.55, depthWrite: false,
  }));
  const floor = new Mesh(track(new PlaneGeometry(S * 2.3, S * 2.3)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.015;
  group.add(floor);

  // ---- hyperbolic grid: rings, spokes, weaving geodesic arcs (all tested) ----
  const gridLineMat = track(new LineBasicMaterial({
    color: 0x4a6ea8, transparent: true, opacity: 0.22, depthWrite: false,
  }));
  const arcLineMat = track(new LineBasicMaterial({
    color: 0x5a7ec8, transparent: true, opacity: 0.3, depthWrite: false,
  }));
  for (const poly of lab.grid.ringPolys) {
    const g = track(new BufferGeometry());
    // LineSegments pairs, not LineLoop: the WebGPU renderer does not draw LineLoop.
    const arr = new Float32Array(poly.length * 6);
    poly.forEach((p, i) => {
      const v = to3(p);
      const w = to3(poly[(i + 1) % poly.length]);
      arr[i * 6] = v.x; arr[i * 6 + 1] = v.y; arr[i * 6 + 2] = v.z;
      arr[i * 6 + 3] = w.x; arr[i * 6 + 4] = w.y; arr[i * 6 + 5] = w.z;
    });
    g.setAttribute("position", new BufferAttribute(arr, 3));
    group.add(new LineSegments(g, gridLineMat));
  }
  {
    const segs = new Float32Array(lab.grid.spokeLines.length * 6);
    lab.grid.spokeLines.forEach(([a, b], i) => {
      const va = to3(a), vb = to3(b);
      segs.set([va.x, va.y, va.z, vb.x, vb.y, vb.z], i * 6);
    });
    const g = track(new BufferGeometry());
    g.setAttribute("position", new BufferAttribute(segs, 3));
    const ls = new LineSegments(g, gridLineMat);
    ls.frustumCulled = false;
    group.add(ls);
  }
  for (const poly of lab.grid.arcPolys) {
    const g = track(new BufferGeometry());
    const arr = new Float32Array(poly.length * 3);
    poly.forEach((p, i) => { const v = to3(p, 0.004); arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z; });
    g.setAttribute("position", new BufferAttribute(arr, 3));
    const l = new Line(g, arcLineMat);
    l.frustumCulled = false;
    group.add(l);
  }

  // ---- conformal boundary: bright ring + partition nodes with glow ----
  const ringGeo = track(new TorusGeometry(S, 0.028, 10, 160));
  const ringMat = track(new MeshBasicMaterial({
    color: 0x6fd0e0, transparent: true, opacity: 0.9,
    blending: AdditiveBlending, depthWrite: false,
  }));
  const ring = new Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const nodeGeo = track(new SphereGeometry(0.05, 12, 10));
  const nodeGlows = [];
  for (const iv of lab.geodesics) {
    const p = iv.points[0]; // first boundary endpoint of each interval
    const gm = track(new SpriteMaterial({
      map: sharedGlowTexture(), color: 0x9fe8f0, transparent: true, opacity: 0.55,
      blending: AdditiveBlending, depthWrite: false,
    }));
    const sp = new Sprite(gm);
    sp.scale.setScalar(0.42);
    const v = to3(p, 0.02);
    sp.position.copy(v);
    group.add(sp);
    nodeGlows.push(sp);
  }

  // ---- partition geodesics: one violet tube per link interval ----
  const partitionMats = [];
  for (const iv of lab.geodesics) {
    const curve = new CatmullRomCurve3(iv.points.map((p) => to3(p, 0.012)));
    const geo = track(new TubeGeometry(curve, 48, 0.022, 6, false));
    const mat = track(new MeshBasicMaterial({
      color: 0xb06ae0, transparent: true, opacity: 0.5,
      blending: AdditiveBlending, depthWrite: false,
    }));
    partitionMats.push(mat);
    group.add(new Mesh(geo, mat));
  }

  // ---- featured RT geodesic: gold core tube + magenta halo ----
  const featuredCurve = new CatmullRomCurve3(lab.featured.points.map((p) => to3(p, 0.02)));
  const rtCoreMat = track(new MeshBasicMaterial({
    color: GOLD, transparent: true, opacity: 0.95,
    blending: AdditiveBlending, depthWrite: false,
  }));
  const rtHaloMat = track(new MeshBasicMaterial({
    color: MAGENTA, transparent: true, opacity: 0.22,
    blending: AdditiveBlending, depthWrite: false,
  }));
  group.add(new Mesh(track(new TubeGeometry(featuredCurve, 96, 0.045, 8, false)), rtCoreMat));
  group.add(new Mesh(track(new TubeGeometry(featuredCurve, 96, 0.13, 8, false)), rtHaloMat));

  // ---- featured boundary arc: gold highlight on the boundary ring ----
  {
    const arcPts = [];
    for (let i = 0; i <= 64; i++) {
      const th = lab.featured.start + (lab.featured.span * i) / 64;
      arcPts.push(new Vector3(Math.cos(th) * S, 0.02, Math.sin(th) * S));
    }
    const curve = new CatmullRomCurve3(arcPts);
    group.add(new Mesh(track(new TubeGeometry(curve, 96, 0.05, 8, false)), rtCoreMat));
  }

  // ---- entanglement wedge: ribbon between RT geodesic and boundary arc ----
  let wedgeMat = null;
  {
    const inner = lab.wedge.inner;      // geodesic samples (disk coords)
    const boundary = lab.wedge.boundary; // boundary arc samples (disk coords)
    const n = Math.min(inner.length, boundary.length);
    const pos = new Float32Array(n * 6); // triangle strip as line-pair ribbon
    const idx = [];
    for (let i = 0; i < n; i++) {
      const a = to3(inner[i], 0.018);
      const b = to3(boundary[i], 0.018);
      pos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
      if (i < n - 1) {
        const r = i * 2;
        idx.push(r, r + 1, r + 2, r + 1, r + 3, r + 2);
      }
    }
    const g = track(new BufferGeometry());
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    wedgeMat = track(new MeshBasicMaterial({
      color: MAGENTA, transparent: true, opacity: 0.14, side: DoubleSide,
      blending: AdditiveBlending, depthWrite: false,
    }));
    const wedge = new Mesh(g, wedgeMat);
    wedge.frustumCulled = false;
    group.add(wedge);
  }

  // ---- endpoint glows for the featured region ----
  const endGlows = [];
  for (const th of [lab.featured.start, lab.featured.end]) {
    const gm = track(new SpriteMaterial({
      map: sharedGlowTexture(), color: GOLD, transparent: true, opacity: 0.85,
      blending: AdditiveBlending, depthWrite: false,
    }));
    const sp = new Sprite(gm);
    sp.scale.setScalar(0.6);
    sp.position.set(Math.cos(th) * S, 0.05, Math.sin(th) * S);
    group.add(sp);
    endGlows.push(sp);
  }

  const period = 5.0; // seconds per shimmer cycle (display pacing)

  function sync({ time = 0, motion = 1 } = {}) {
    const phase = motion === 0
      ? period * 0.42
      : ((Number(time) || 0) % period + period) % period;
    const pulse = 0.5 + 0.5 * Math.sin(phase * 1.9);
    for (let i = 0; i < nodeGlows.length; i++) {
      nodeGlows[i].material.opacity = 0.4 + 0.3 * Math.sin(phase * 1.6 + i * 1.3);
    }
    for (let i = 0; i < partitionMats.length; i++) {
      partitionMats[i].opacity = 0.38 + 0.2 * Math.sin(phase * 1.3 + i * 0.9);
    }
    rtCoreMat.opacity = 0.8 + 0.2 * pulse;
    rtHaloMat.opacity = 0.14 + 0.16 * pulse;
    wedgeMat.opacity = 0.1 + 0.09 * pulse;
    for (const sp of endGlows) sp.material.opacity = 0.65 + 0.3 * pulse;
  }

  function dispose() {
    for (const d of disposables) d.dispose?.();
    group.removeFromParent?.();
  }

  return {
    mesh: group,
    kind: "ads-lab",
    stats: () => ({
      kind: "ads-lab",
      links: lab.links,
      regionSpan: lab.featured.span,
      geodesicLength: lab.featured.length,
      entropy: lab.featured.entropy,
      wedgeFraction: lab.featured.span / (Math.PI * 2),
    }),
    sync,
    dispose,
    recoverable: () => false,
  };
}
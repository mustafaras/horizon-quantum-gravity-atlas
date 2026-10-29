/**
 * Curvature engine scene (S07): the Scene3D builder for the GR module's luminous gravity well, moved out of mod-gr.jsx.
 *
 * The React side (controls, readouts, panels) stays in mod-gr.jsx and feeds this builder through live refs; the builder owns
 * the three.js objects. Materials are TSL (./curvature-materials.mjs, on the material kit), so the scene runs on the WebGPU
 * renderer and on the node renderer's WebGL2 backend. The dynamics are in ./curvature-sim.mjs (pure).
 */

import { seededRng } from "../../physics.mjs";
import * as TK from "../../design/tokens.mjs";
import { createDataPoints } from "../../render/materials/index.mjs";
import { LENS_MIN_RADIUS, createStarfield, createStarMaterial, createWellMaterial } from "./curvature-materials.mjs";
import { appendTrails, applyRadiationReaction, makeRay, projectBodies, stepDynamics, syncSimBodies } from "./curvature-sim.mjs";
import { attachLens } from "../common/lens-scenes.mjs";
import { tagLayer as tag } from "../../render/scene-layers.mjs";

const TAU = Math.PI * 2;
const EXT = 17;
/** GM/c^2 in scene length units per unit of the mass slider (the well is a display-scaled schematic). */
const GM_SCALE = 0.55;
/** The mass slider of mod-gr.jsx ([min, max]); test/formula-lens-scenes.test.mjs keeps the two in step. */
export const GR_MASS_SLIDER = Object.freeze([1, 10]);

/**
 * @param ctx  Scene3D build context ({ THREE, scene, camera, settings, motion, label, annotation, glow, engraved, conceptTarget }).
 * @param env  { refs: { mass, view, ray, trail, rr, spin, speed, light, bodies, sel, st }, setSelected, constants: { GR_RAY_B, GR_C2,
 *             GR_MAX_BODIES }, precessionDeg(M, a, e) }; every `refs.*` is a React ref read live.
 */
export async function buildCurvatureScene(ctx, env) {
  const { THREE, scene, camera } = ctx;
  const { refs, constants } = env;
  const { GR_RAY_B, GR_C2, GR_MAX_BODIES } = constants;
  const P = globalThis.QGA_PHYSICS;
  const hexOf = (token) => TK.hex(token);
  scene.fog = new THREE.FogExp2(hexOf("pigment-grey-11-c02-h261"), 0.012);
  scene.add(new THREE.AmbientLight(hexOf("pigment-blue-68"), 0.4));
  const key = new THREE.DirectionalLight(hexOf("pigment-blue-86"), 0.7);
  key.position.set(6, 10, 4);
  scene.add(key);
  const starLight = new THREE.PointLight(hexOf("pigment-orange-90"), 2.2, 28, 1.7);
  scene.add(starLight);

  const det = ctx.settings.current.detail3d;
  const SEG = det === "low" ? 56 : det === "ultra" ? 128 : 88;
  const rng = seededRng(2718);

  const mkRadialTex = (stops) => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    for (const [o, col] of stops) grad.addColorStop(o, col);
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  };

  // ---------- twinkling starfield + nebulae ----------
  const starfield = createStarfield({ count: det === "low" ? 320 : det === "ultra" ? 1100 : 640 });
  scene.add(tag(starfield.object, "decoration"));

  const nebTex = mkRadialTex([
    [0, TK.alpha("pigment-violet-57", 0.34)], [0.4, TK.alpha("pigment-blue-48", 0.16)], [1, TK.alpha("pigment-black", 0)],
  ]);
  for (let i = 0; i < 3; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nebTex, transparent: true, opacity: 0.5, depthWrite: false,
      blending: THREE.AdditiveBlending, rotation: i * 1.7,
    }));
    const ang = i * 2.1 + 0.6;
    sp.position.set(Math.cos(ang) * 52, 26 + i * 9, Math.sin(ang) * 52);
    sp.scale.setScalar(46 + i * 14);
    scene.add(tag(sp, "decoration"));
  }

  // ---------- luminous gravity well (engraved grid + depth heatmap, polar near the throat) ----------
  const geo = new THREE.PlaneGeometry(EXT, EXT, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const well = createWellMaterial();
  const wellUniforms = well.uniforms;
  const surf = new THREE.Mesh(geo, well.material);
  surf.userData.qgaGeometryMode = wellUniforms.flamm;
  surf.renderOrder = -2;
  scene.add(tag(surf, "model"));
  const pos = geo.attributes.position;

  const depth = (x, z, GM) => {
    if (refs.geometry.current === "flamm") {
      const rs = 2 * GM / GR_C2, r = Math.max(rs, Math.hypot(x, z));
      return 2 * Math.sqrt(rs * (r - rs)) - 2 * Math.sqrt(rs * (EXT / 2 - rs));
    }
    return -0.92 * GM / Math.sqrt(x * x + z * z + 0.62);
  };
  let lastM = -1, lastView = "", lastGeometry = "";
  const reshape = () => {
    const GM = GM_SCALE * refs.mass.current;
    for (let k = 0; k < pos.count; k++) pos.setY(k, depth(pos.getX(k), pos.getZ(k), GM));
    pos.needsUpdate = true;
    wellUniforms.maxDepth.value = Math.max(0.5, 0.92 * GM / Math.sqrt(0.62));
    wellUniforms.mass.value = GM;
    wellUniforms.rs.value = 2 * GM / GR_C2;
    wellUniforms.flamm.value = refs.geometry.current === "flamm" ? 1 : 0;
  };
  const hAt = (x, z) => depth(x, z, GM_SCALE * refs.mass.current);

  // ---------- central mass: fBm-granulated star, corona, Einstein ring ----------
  const core = createStarMaterial();
  const star = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), core.material);
  scene.add(tag(star, "model"));
  const starGlow = ctx.glow(hexOf("pigment-amber-93-c07"), 5, 0.5);
  scene.add(starGlow);
  const corona = ctx.glow(hexOf("pigment-orange-78-c15"), 7, 0.18);
  scene.add(corona);
  const throat = ctx.glow(hexOf("pigment-blue-62"), 6, 0.34);   // luminous well throat
  scene.add(throat);
  const ringTex = mkRadialTex([
    [0, TK.alpha("pigment-black", 0)], [0.34, TK.alpha("pigment-black", 0)], [0.42, TK.alpha("pigment-violet-79", 0.9)],
    [0.47, TK.alpha("pigment-orange-96", 0.35)], [0.55, TK.alpha("pigment-black", 0)], [1, TK.alpha("pigment-black", 0)],
  ]);
  const einstein = new THREE.Sprite(new THREE.SpriteMaterial({
    map: ringTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(tag(einstein, "model"));
  // frame-dragging vortex disc (visible only with spin > 0)
  const vortexTex = mkRadialTex([
    [0, TK.alpha("pigment-black", 0)], [0.30, TK.alpha("pigment-black", 0)], [0.40, TK.alpha("pigment-cyan-87", 0.55)],
    [0.46, TK.alpha("pigment-black", 0)], [0.56, TK.alpha("pigment-cyan-87", 0.30)], [0.62, TK.alpha("pigment-black", 0)], [1, TK.alpha("pigment-black", 0)],
  ]);
  const vortex = new THREE.Sprite(new THREE.SpriteMaterial({
    map: vortexTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(tag(vortex, "decoration"));

  // ---------- gradient-fading trails with comet dust ----------
  const TRAIL_N = det === "low" ? 220 : 360;
  const mkTrail = (hex) => {
    // Per-vertex colours fade each engraved tail to black (additive: a black tail is a fade-out).
    const l = ctx.engraved.stream(TRAIL_N, {
      vertexColors: true, opacity: 0.95, additive: true, widthPx: ctx.engraved.WIDTH_PX.standard, layer: "model",
    });
    scene.add(l);
    const pos = new Float32Array(TRAIL_N * 3), col = new Float32Array(TRAIL_N * 3);
    let dots = null, pn = 0, dotPos = null, dotCol = null;
    if (det !== "low") {
      pn = Math.floor(TRAIL_N / 6);
      dotPos = new Float32Array(pn * 3);
      dotCol = new Float32Array(pn * 3);
      dots = createDataPoints({
        positions: dotPos, colors: dotCol, sizePx: 0.16, sizeAttenuation: true, profile: "soft", additive: true, opacity: 0.7, dynamic: true,
      });
      dots.setCount(0);
      scene.add(tag(dots.object, "model"));
    }
    return { pos, col, l, dots, dotPos, dotCol, pn, hex: new THREE.Color(hex) };
  };
  const writeTrail = (tr, list) => {
    const n = Math.min(list.length, TRAIL_N);
    for (let i = 0; i < n; i++) {
      const q = list[list.length - n + i];
      tr.pos[i * 3] = q[0]; tr.pos[i * 3 + 1] = q[1]; tr.pos[i * 3 + 2] = q[2];
      const f = Math.pow(i / Math.max(n - 1, 1), 1.7);   // additive: black tail = fade-out
      tr.col[i * 3] = tr.hex.r * f; tr.col[i * 3 + 1] = tr.hex.g * f; tr.col[i * 3 + 2] = tr.hex.b * f;
      if (tr.dots && i % 6 === 0) {
        const j = i / 6;
        if (j < tr.pn) {
          tr.dotPos.set([q[0], q[1] + 0.02, q[2]], j * 3);
          tr.dotCol.set([tr.hex.r * f * 0.8, tr.hex.g * f * 0.8, tr.hex.b * f * 0.8], j * 3);
        }
      }
    }
    ctx.engraved.setPoints(tr.l, tr.pos, n, tr.col);
    if (tr.dots) {
      tr.dots.setPositions(tr.dotPos); tr.dots.setColors(tr.dotCol);
      tr.dots.setCount(Math.min(tr.pn, Math.ceil(n / 6)));
    }
  };

  // pre-built body visuals (slots toggled by count; colors/scales set per frame)
  const bodyVis = [];
  for (let i = 0; i < GR_MAX_BODIES; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), new THREE.MeshStandardMaterial({
      color: hexOf("pigment-white"), emissive: hexOf("pigment-white"), emissiveIntensity: 0.3, roughness: 0.32, metalness: 0.15,
    }));
    mesh.userData.bodyIndex = i;
    mesh.visible = false;
    scene.add(tag(mesh, "model"));
    const glow = ctx.glow(hexOf("pigment-white"), 1, 0.6);
    glow.visible = false;
    scene.add(glow);
    bodyVis.push({ mesh, glow, trail: mkTrail(hexOf("pigment-white")) });
  }
  const selRing = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 48), new THREE.MeshBasicMaterial({
    color: hexOf("pigment-white"), transparent: true, opacity: 0.85, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  selRing.visible = false;
  scene.add(tag(selRing, "model"));

  // lensing fan of light rays
  const rayVis = refs.st.current.rays.map(() => mkTrail(hexOf("pigment-amber-88")));

  // Strong-field markers: the photon sphere (r = 3GM/c^2) and the critical curve (b = 3 sqrt(3) GM/c^2) that separates escape from
  // capture. Drawn as thin filled annuli, legible without depth test where they pass behind the star.
  const mkRing = (hex, opacity) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 96, 1), new THREE.MeshBasicMaterial({
      color: hex, transparent: true, opacity, side: THREE.DoubleSide,
      depthTest: false, depthWrite: false,
    }));
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 3;
    m.visible = false;
    scene.add(tag(m, "model"));
    return m;
  };
  const ringPhoton = mkRing(hexOf("pigment-azure-88"), 0.7);
  const ringCrit = mkRing(hexOf("pigment-orange-82-c13"), 0.6);
  const placeRing = (mesh, radius) => {
    mesh.scale.setScalar(radius);
    mesh.position.set(0, hAt(radius, 0) + 0.05, 0);
  };

  // capture / close-approach flash pool
  const flashes = [];
  for (let i = 0; i < 4; i++) {
    const sp = ctx.glow(hexOf("pigment-white"), 0.001, 0);
    sp.visible = false;
    scene.add(sp);
    flashes.push({ sp, t: 9, dur: 0.7 });
  }
  const triggerFlash = (x, y, z, token) => {
    const f = flashes.find((fl) => fl.t >= fl.dur) || flashes[0];
    f.t = 0;
    f.sp.position.set(x, y, z);
    f.sp.material.color.setHex(hexOf(token));
    f.sp.visible = true;
  };

  // infalling dust motes spiralling down the funnel
  let dust = null, dustData = null, dustPos = null;
  if (det !== "low") {
    const DN = det === "ultra" ? 320 : 180;
    dustPos = new Float32Array(DN * 3);
    dustData = [];
    for (let i = 0; i < DN; i++) {
      const r = 2.5 + rng() * 6.5, a = rng() * TAU;
      dustData.push({ r, a, fall: 0.12 + rng() * 0.25 });
      dustPos[i * 3] = Math.cos(a) * r; dustPos[i * 3 + 1] = 0; dustPos[i * 3 + 2] = Math.sin(a) * r;
    }
    dust = createDataPoints({
      positions: dustPos, sizePx: 0.09, sizeAttenuation: true, profile: "soft", additive: true, opacity: 0.42, dynamic: true,
      color: TK.linear("pigment-blue-79-c11"),
    });
    scene.add(tag(dust.object, "decoration"));
  }

  // Prompt 10 formula linking: map the module's formula symbols onto the scene objects they describe, with live numerical readouts.
  const bodyParams = (i) => refs.bodies.current[Math.min(i, refs.bodies.current.length - 1)];
  const precessionOf = (i) => {
    const b = bodyParams(i);
    return refs.view.current === "gr" && b ? env.precessionDeg(refs.mass.current, b.a, b.e) : 0;
  };
  ctx.conceptTarget("T_{\\mu\\nu}", {
    object: star,
    readout: () => ({ label: "Curvature source mass", value: refs.mass.current.toFixed(1), unit: "M☉ (scene scale)" }),
  });
  ctx.conceptTarget("g_{\\mu\\nu}", {
    object: surf,
    readout: () => ({
      label: "Embedding depth at throat",
      value: (0.92 * GM_SCALE * refs.mass.current / Math.sqrt(0.62)).toFixed(2),
      unit: "scene units",
    }),
  });
  ctx.conceptTarget("x^\\mu(\\tau)", {
    object: bodyVis[0]?.mesh,
    readout: () => ({ label: "Inner-body perihelion precession", value: precessionOf(0).toFixed(2), unit: "°/orbit" }),
  });
  ctx.conceptTarget("\\Gamma^{\\mu}_{\\alpha\\beta}", {
    object: bodyVis[1]?.mesh ?? bodyVis[0]?.mesh,
    readout: () => ({ label: "Outer-body perihelion precession", value: precessionOf(1).toFixed(2), unit: "°/orbit" }),
  });

  const force = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1.4, hexOf("pigment-red-65"), 0.35, 0.2);
  // ArrowHelper draws its shaft as a 1 px line: swap in an engraved shaft (same unit-length +Y geometry, so ArrowHelper.setLength
  // still scales it).
  force.remove(force.line);
  force.line.geometry.dispose(); force.line.material.dispose();
  force.line = ctx.engraved.line([0, 0, 0, 0, 1, 0], { color: "pigment-red-65", widthPx: ctx.engraved.WIDTH_PX.standard, layer: "model" });
  force.add(force.line);
  force.visible = false;
  scene.add(tag(force, "model"));

  ctx.label("M — curvature source", () => ({ x: 0, y: hAt(0.01, 0.01) + 1.9, z: 0 }), "s3d-strong");
  const pLabel = ctx.label("geodesic — free fall, no force",
    () => {
      const sim = refs.st.current.sim;
      const b = sim[Math.min(refs.sel.current, sim.length - 1)];
      return b ? { x: b.X, y: hAt(b.X, b.Y) + 0.55 + b.Z, z: b.Y } : { x: 0, y: 1, z: 0 };
    }, "s3d-quiet");
  const lensLabel = ctx.label("null geodesics — light follows the curved optical geometry",
    () => ({ x: 4.4, y: 0.6, z: 0 }), "s3d-quiet");
  ctx.annotation("embedding-diagram intuition — the 'rubber sheet' shows spatial curvature only; time curvature dominates everyday gravity",
    () => ({ x: 0, y: 0.4, z: EXT / 2 - 1 }));

  const hooks = {
    flash: triggerFlash,
    ripple: () => { wellUniforms.rippleT.value = 0; },
  };

  // Formula Lens (S10): the Newtonian-potential card paints its term over the well.
  await attachLens("gr-well", ctx, {
    surface: surf, nodes: well.nodes, geometricMass: () => GM_SCALE * refs.mass.current,
    massRange: GR_MASS_SLIDER.map((mass) => GM_SCALE * mass), radiusRange: [LENS_MIN_RADIUS, EXT / 2],
  });

  return {
    autoRotate: true,
    pickables: bodyVis.map((v) => v.mesh),
    onPick: (obj) => {
      if (obj && obj.userData.bodyIndex != null && obj.userData.bodyIndex < refs.bodies.current.length) {
        env.setSelected(obj.userData.bodyIndex);
      }
    },
    update: (t, dt) => {
      const M = refs.mass.current, GM = GM_SCALE * M;
      const newton = refs.view.current === "newton";
      const st = refs.st.current;
      if (lastM !== M || lastView !== refs.view.current || lastGeometry !== refs.geometry.current) {
        lastM = M; lastView = refs.view.current; lastGeometry = refs.geometry.current; reshape();
        // ray dynamics differ fundamentally between GR/Newton — relaunch the fan
        st.rays = GR_RAY_B.map((b) => makeRay(b, newton));
      }
      const mo = ctx.motion();
      wellUniforms.time.value += dt * 60 * 0.016 * mo;
      wellUniforms.flat.value += ((newton ? 1 : 0) - wellUniforms.flat.value) * Math.min(1, dt * 6);
      if (wellUniforms.rippleT.value >= 0) {
        wellUniforms.rippleT.value += dt;
        if (wellUniforms.rippleT.value > 4) wellUniforms.rippleT.value = -1;
      }
      core.uniforms.time.value += dt * mo;
      starfield.uniforms.time.value += dt * mo;

      syncSimBodies(st, refs.bodies.current);

      // Exact embedding has a horizon boundary, not a drawn stellar photosphere.
      const exactSurface = refs.geometry.current === "flamm";
      star.visible = !exactSurface; starGlow.visible = !exactSurface; corona.visible = !exactSurface;
      throat.visible = !exactSurface; einstein.visible = !exactSurface; vortex.visible = !exactSurface;
      if (dust) dust.object.visible = !exactSurface;
      // ---- central star ----
      const sc = 0.45 + M * 0.07;
      star.scale.setScalar(sc);
      star.position.y = hAt(0.01, 0.01) + sc * 0.4;
      starLight.position.copy(star.position);
      starLight.intensity = 1.6 + M * 0.12;
      const pulse = 1 + 0.05 * Math.sin(t * 2.0) * mo;
      starGlow.position.copy(star.position); starGlow.scale.setScalar(sc * 4.4 * pulse);
      corona.position.copy(star.position); corona.scale.setScalar(sc * 7 * pulse);
      einstein.position.copy(star.position);
      einstein.scale.setScalar(sc * (5.2 + M * 0.25) * pulse);
      einstein.material.opacity = (newton ? 0.06 : 0.4) * (1 - wellUniforms.flat.value);
      vortex.position.copy(star.position);
      vortex.scale.setScalar(sc * (8.5 + M * 0.4) * (1 + 0.04 * Math.sin(t * 1.4) * mo));
      vortex.material.rotation += dt * refs.spin.current * 0.9 * (0.3 + 0.7 * mo);
      vortex.material.opacity = newton ? 0 : refs.spin.current * 0.55;
      throat.position.set(0, hAt(0.01, 0.01) - 0.2, 0);
      throat.scale.setScalar((1 - wellUniforms.flat.value) * (3 + M * 0.5));
      throat.material.opacity = 0.34 * (1 - wellUniforms.flat.value);
      starfield.object.rotation.y += dt * 0.012 * mo;

      // ---- dynamics ----
      const mu = GM;
      const rs = 2 * mu / GR_C2;
      // Newtonian rays are stopped by the opaque star's visual radius; GR rays are stopped by the horizon. Using the visual radius for
      // GR made the capture test disagree with the b_crit colouring at every mass except M = 5, 8 and 12. For b > b_crit the turning
      // point sits above r_ph = 1.5 rs, so a 1.1 rs test can only be crossed by a plunging ray.
      const capRay = Math.max(1.5 * rs, sc * 0.9);
      const showRings = refs.ray.current && !newton;
      ringPhoton.visible = showRings;
      ringCrit.visible = showRings;
      if (showRings) {
        placeRing(ringPhoton, 1.5 * rs);
        placeRing(ringCrit, P.grCriticalImpactParameter(mu, GR_C2));
      }
      stepDynamics(st, {
        P, mu, c2: GR_C2, newton, dt, speed: refs.speed.current, lightSpeed: refs.light.current,
        raysOn: refs.ray.current, spin: refs.spin.current, capRay, hAt,
      }, hooks);
      // ---- radiation reaction (Peters orbit-averaged, amplified) + ISCO plunge ----
      if (refs.rr.current && !newton) applyRadiationReaction(st, { P, isco: P.grIscoRadius(mu, GR_C2), dt, speed: refs.speed.current });
      projectBodies(st);
      if (dt > 0) appendTrails(st, { hAt, trailN: TRAIL_N, raysOn: refs.ray.current });

      // ---- body visuals + selection ring ----
      const showT = refs.trail.current;
      st.sim.forEach((p, i) => {
        const v = bodyVis[i];
        const y = hAt(p.X, p.Y) + 0.16 + p.Z;
        v.mesh.visible = true; v.glow.visible = true;
        v.mesh.material.color.setHex(p.hex);
        v.mesh.material.emissive.setHex(p.hex);
        v.mesh.position.set(p.X, y, p.Y);
        v.mesh.scale.setScalar(p.r);
        v.glow.position.set(p.X, y, p.Y);
        v.glow.scale.setScalar(p.r * 9 * (1 + 0.12 * Math.sin(t * 3 + i) * mo));
        v.trail.hex.setHex(p.hex);
        v.trail.l.visible = showT;
        if (v.trail.dots) v.trail.dots.object.visible = showT;
        if (showT) writeTrail(v.trail, p.trail);
      });
      for (let i = st.sim.length; i < GR_MAX_BODIES; i++) {
        const v = bodyVis[i];
        v.mesh.visible = false; v.glow.visible = false;
        v.trail.l.visible = false;
        if (v.trail.dots) v.trail.dots.object.visible = false;
      }
      const selIdx = Math.min(refs.sel.current, st.sim.length - 1);
      if (st.sim.length) {
        const p = st.sim[selIdx];
        st.selR = Math.hypot(p.X, p.Y);
        selRing.visible = true;
        selRing.position.set(p.X, hAt(p.X, p.Y) + 0.16 + p.Z, p.Y);
        selRing.quaternion.copy(camera.quaternion);
        selRing.scale.setScalar(Math.max(1, p.r * 7));
      } else selRing.visible = false;

      // Fate is exact, not decorative: b_crit is the boundary between capture and escape, so the fan reads itself — red rays are
      // doomed, amber rays leave. In the Newtonian view there is no capture cone, so the only fate is hitting the opaque star.
      const showRays = refs.ray.current;
      const bCritNow = P.grCriticalImpactParameter(mu, GR_C2);
      rayVis.forEach((rv, i) => {
        const q = st.rays[i];
        const doomed = newton ? Math.abs(q.b) < capRay : Math.abs(q.b) < bCritNow;
        rv.hex.setHex(hexOf(doomed ? "pigment-red-71-c18" : "pigment-amber-88"));
        rv.l.visible = showRays;
        if (rv.dots) rv.dots.object.visible = false;
        if (showRays) writeTrail(rv, q.trail);
      });
      lensLabel.setShow(showRays);

      // ---- flashes ----
      for (const f of flashes) {
        if (f.t >= f.dur) { if (f.sp.visible) f.sp.visible = false; continue; }
        f.t += dt;
        const k = Math.min(f.t / f.dur, 1);
        f.sp.scale.setScalar(0.5 + 7 * k);
        f.sp.material.opacity = 0.85 * (1 - k);
      }

      // ---- infalling dust ----
      if (dust) {
        for (let i = 0; i < dustData.length; i++) {
          const d = dustData[i];
          d.a += dt * (0.25 + 2.2 / (d.r + 0.5)) * refs.speed.current * (0.3 + 0.7 * mo) * (1 + refs.spin.current * 1.6);
          d.r -= dt * d.fall * (0.6 + 2.5 / (d.r + 1)) * (0.3 + 0.7 * mo);
          if (d.r < 0.7) { d.r = 7.5 + rng() * 1.5; d.a = rng() * TAU; }
          const x = Math.cos(d.a) * d.r, z = Math.sin(d.a) * d.r;
          dustPos.set([x, hAt(x, z) + 0.06, z], i * 3);
        }
        dust.setPositions(dustPos);
      }

      // ---- Newtonian force overlay ----
      force.visible = newton && st.sim.length > 0;
      pLabel.set(newton ? "F = −GMm r̂ / r² — force picture"
        : (st.sim[selIdx] && st.sim[selIdx].free ? "plunge — integrated geodesic, captured at r = 3GM/c²"
          : "geodesic — free fall, no force"));
      if (newton && st.sim.length) {
        const b = st.sim[selIdx];
        const r = Math.hypot(b.X, b.Y) + 1e-6;
        force.position.set(b.X, hAt(b.X, b.Y) + 0.16 + b.Z, b.Y);
        force.setDirection(new THREE.Vector3(-b.X / r, 0, -b.Y / r));
        force.setLength(1.5, 0.4, 0.22);
      }
    },
  };
}

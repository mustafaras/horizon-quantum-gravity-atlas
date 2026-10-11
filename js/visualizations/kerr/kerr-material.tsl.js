/**
 * WebGPU backend of the Kerr observatory: a TSL compute integrator with
 * storage-buffer temporal accumulation (Prompt 04, three r186).
 *
 *   compute pass  (one invocation per pixel, every frame the history is not converged)
 *       Halton-jittered rays -> Carter/Mino RK4 geodesic (same equations, step law,
 *       first-integral projection and shading order as the GLSL backend and the
 *       CPU reference tracer) -> disk crossings + lensed sky -> running mean
 *       written into a vec4 storage buffer.
 *   display pass  (full-screen quad, NodeMaterial)
 *       reads the storage buffer, applies the focus defocus, and leaves tone
 *       mapping to the node render pipeline (exactly one tone map + sRGB).
 *
 * Compute shaders have no implicit derivatives, so the distortion-aware sky
 * filter measures the pixel footprint by tracing two neighbouring rays (the
 * finite-difference equivalent of dFdx/dFdy) and reads the mip chain with
 * manual trilinear textureLoad fetches.
 */

import {
  Break, Fn, If, Loop, Return, acos, atan, clamp, cos, exp2, float, floor, instanceIndex, instancedArray,
  int, ivec2, length, log, max, min, mix, mod, positionGeometry, pow, screenCoordinate, select, sin, sqrt,
  texture, textureLoad, uniform, vec2, vec3, vec4,
} from "three/tsl";
import {
  ClampToEdgeWrapping, DataTexture, FloatType, LinearFilter, LinearMipmapLinearFilter, Mesh, MeshBasicNodeMaterial,
  NearestFilter, NoColorSpace, PlaneGeometry, RGBAFormat, RepeatWrapping, UnsignedByteType, Vector2, Vector4,
} from "three/webgpu";
import {
  KERR_RENDER_CONSTANTS,
  KerrTemporalAccumulator,
  buildKerrRenderState,
  kerrAccumulationKey,
  kerrJitter,
  kerrObserverFromCamera,
  kerrQualityBudget,
  normalizeKerrState,
} from "./kerr-observatory.mjs";
import { STARFIELD_MAX_FOOTPRINT_RAD, STARFIELD_VMAX, renderStarfield } from "./starfield-texture.mjs";

const TWO_PI = 2 * Math.PI;
const WORKGROUP = 64;
const MAX_STEPS = 512;

function floatTexture(data, size) {
  const t = new DataTexture(data, size, 1, RGBAFormat, FloatType);
  t.minFilter = NearestFilter; t.magFilter = NearestFilter;
  t.generateMipmaps = false; t.colorSpace = NoColorSpace; t.needsUpdate = true;
  return t;
}

function skyTexture(sky) {
  const t = new DataTexture(sky.levels[0].data, sky.width, sky.height, RGBAFormat, UnsignedByteType);
  t.mipmaps = sky.levels.map((l) => ({ data: l.data, width: l.width, height: l.height }));
  t.generateMipmaps = false;
  t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter;
  t.wrapS = RepeatWrapping; t.wrapT = ClampToEdgeWrapping;
  t.colorSpace = NoColorSpace; t.needsUpdate = true;
  return t;
}

const skyCache = new Map();
function skyFor(quality, seed) {
  const key = `${quality}|${seed}`;
  if (!skyCache.has(key)) {
    if (skyCache.size >= 2) skyCache.delete(skyCache.keys().next().value);
    skyCache.set(key, renderStarfield({ seed, quality }));
  }
  return skyCache.get(key);
}

export function createKerrTslRuntime({ seed = 42 } = {}) {
  const accumulator = new KerrTemporalAccumulator(1);
  const size = new Vector2(2, 2);

  const U = {
    res: uniform(new Vector2(2, 2)),
    tanHalfFov: uniform(0.4), aspect: uniform(1),
    spin: uniform(0), rPlus: uniform(2), rIn: uniform(6), rOut: uniform(KERR_RENDER_CONSTANTS.diskOuter),
    r0: uniform(40), u0: uniform(0.25), sinT0: uniform(0.97), phi0: uniform(0),
    coef: uniform(new Vector4()), mom: uniform(new Vector2()),
    stepK: uniform(0.16), escape: uniform(KERR_RENDER_CONSTANTS.escapeRadius), margin: uniform(KERR_RENDER_CONSTANTS.captureMargin),
    maxSteps: uniform(224, "int"), samples: uniform(1, "int"),
    j0: uniform(new Vector2()), j1: uniform(new Vector2()), j2: uniform(new Vector2()), j3: uniform(new Vector2()),
    transmit: uniform(0.35), exposure: uniform(1), diskGain: uniform(KERR_RENDER_CONSTANTS.diskGain), orderTint: uniform(1),
    colorLogMin: uniform(0), colorLogSpan: uniform(1),
    skyVmax: uniform(STARFIELD_VMAX), skyGain: uniform(KERR_RENDER_CONSTANTS.skyGain), maxFootprint: uniform(STARFIELD_MAX_FOOTPRINT_RAD),
    skySize: uniform(new Vector2(2, 2)), skyLevels: uniform(1, "int"),
    historyWeight: uniform(1),
    focus: uniform(new Vector4(0.5, 0.5, 0.2, 0)),
    pixelCount: uniform(4),
  };

  // Texture nodes are created once with 1x1 placeholders and re-pointed with `.value`, so the compiled
  // compute graph survives table and sky-quality changes.
  const placeholder = (type) => {
    const t = new DataTexture(type === FloatType ? new Float32Array(4) : new Uint8Array(4), 1, 1, RGBAFormat, type);
    t.minFilter = NearestFilter; t.magFilter = NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return t;
  };
  const diskNode = texture(placeholder(FloatType));
  const colorNodeTex = texture(placeholder(FloatType));
  const skyNode = texture(placeholder(UnsignedByteType));
  let diskTex = null;
  let colorTex = null;
  let skyTex = null;
  let skyQuality = null;
  let diskRef = null;
  let capacity = 0;
  let buffer = null;
  let kernel = null;
  let mesh = null;
  let wasConverged = false;
  let pending = true;
  let latest = { backend: "webgpu", frames: 0, resets: 0, resolution: [0, 0], budget: null };

  const sq = (x) => x.mul(x);

  function diskRow(r) {
    const s = clamp(r.sub(U.rIn).div(U.rOut.sub(U.rIn)), 0, 1);
    const x = sqrt(s).mul(float(KERR_RENDER_CONSTANTS.diskLutSize - 1));
    const i0 = floor(x).min(float(KERR_RENDER_CONSTANTS.diskLutSize - 2));
    const f = x.sub(i0);
    const a = textureLoad(diskNode, ivec2(int(i0), int(0)), int(0));
    const b = textureLoad(diskNode, ivec2(int(i0.add(1)), int(0)), int(0));
    return mix(a, b, f);
  }

  function chroma(kelvin) {
    const t = clamp(log(max(kelvin, 1)).div(2.302585093).sub(U.colorLogMin).div(U.colorLogSpan), 0, 1);
    const x = t.mul(float(KERR_RENDER_CONSTANTS.colorLutSize - 1));
    const i0 = floor(x).min(float(KERR_RENDER_CONSTANTS.colorLutSize - 2));
    const f = x.sub(i0);
    const a = textureLoad(colorNodeTex, ivec2(int(i0), int(0)), int(0)).rgb;
    const b = textureLoad(colorNodeTex, ivec2(int(i0.add(1)), int(0)), int(0)).rgb;
    return mix(a, b, f);
  }

  /** Manual trilinear read of the encoded sky mip chain, then decode (enc^2 * vmax). */
  function skyLookup(dir, footprint) {
    const u = atan(dir.z, dir.x).div(TWO_PI).add(0.5);
    const v = acos(clamp(dir.y, -1, 1)).div(Math.PI);
    const fp = min(footprint, U.maxFootprint);
    // Isotropic texel footprint: content is stretched along u near the poles, so the mip level is set by v.
    const texels = fp.mul(U.skySize.x).div(TWO_PI);
    const lod = clamp(texels.max(1).log2(), 0, float(U.skyLevels.sub(1)));
    const l0 = floor(lod);
    const tl = lod.sub(l0);
    const bilinear = (level) => {
      const wl = max(floor(U.skySize.x.div(exp2(level))), 1);
      const hl = max(floor(U.skySize.y.div(exp2(level))), 1);
      const fx = u.mul(wl).sub(0.5);
      const fy = v.mul(hl).sub(0.5);
      const x0 = floor(fx);
      const y0 = floor(fy);
      const tx = fx.sub(x0);
      const ty = fy.sub(y0);
      const fetch = (xx, yy) => textureLoad(
        skyNode, ivec2(int(mod(xx, wl)), int(clamp(yy, 0, hl.sub(1)))), int(level),
      ).rgb;
      return mix(
        mix(fetch(x0, y0), fetch(x0.add(1), y0), tx),
        mix(fetch(x0, y0.add(1)), fetch(x0.add(1), y0.add(1)), tx), ty);
    };
    const enc = mix(bilinear(l0), bilinear(l0.add(1).min(float(U.skyLevels.sub(1)))), tl);
    return enc.mul(enc).mul(U.skyVmax).mul(U.skyGain);
  }

  /**
   * Build the integrator for one ray. Declares its variables in the current
   * stack and returns them. Same equations as KERR_ACCUMULATE_FRAGMENT.
   */
  function traceRay(ndc) {
    const a = U.spin;
    const a2 = a.mul(a);
    const sx = ndc.x.mul(U.tanHalfFov).mul(U.aspect);
    const sy = ndc.y.mul(U.tanHalfFov);
    const inv = float(1).div(sqrt(float(1).add(sx.mul(sx)).add(sy.mul(sy))));
    const n = vec3(inv.negate(), sy.mul(inv).negate(), sx.mul(inv));
    const E = U.coef.x.add(U.coef.y.mul(n.z)).toVar("E");
    const Lz = U.coef.z.add(U.coef.w.mul(n.z)).toVar("Lz");
    const pth = U.mom.x.mul(n.y);
    const u = U.u0.toVar("u");
    const Q = sq(pth).add(sq(u).mul(a2.negate().mul(sq(E)).add(sq(Lz).div(max(float(1).sub(sq(u)), 1e-12))))).toVar("Q");
    const K = sq(Lz.sub(a.mul(E))).add(Q).toVar("K");
    const r = U.r0.toVar("r");
    const vr = sq(U.r0).sub(U.r0.mul(2)).add(a2).mul(U.mom.y).mul(n.x).toVar("vr");
    const vu = U.sinT0.negate().mul(pth).toVar("vu");
    const phi = U.phi0.toVar("phi");
    const rgb = vec3(0).toVar("rgb");
    const transmit = float(1).toVar("transmit");
    const escaped = float(0).toVar("escaped");
    const order = float(0).toVar("order");

    const accR = (rr) => {
      const P = E.mul(sq(rr).add(a2)).sub(a.mul(Lz));
      return float(2).mul(E).mul(rr).mul(P).sub(rr.sub(1).mul(K));
    };
    const accU = (uu) => uu.negate().mul(Q.add(sq(Lz)).sub(a2.mul(sq(E)))).sub(float(2).mul(a2).mul(sq(E)).mul(uu).mul(uu).mul(uu));
    const dPhi = (rr, uu) => {
      const P = E.mul(sq(rr).add(a2)).sub(a.mul(Lz));
      const D = max(sq(rr).sub(rr.mul(2)).add(a2), 1e-6);
      return a.mul(E).sub(Lz.div(max(float(1).sub(sq(uu)), 1e-6))).negate().add(a.mul(P).div(D));
    };

    Loop({ start: int(0), end: U.maxSteps, name: "stepIdx", type: "int", condition: "<" }, () => {
      const h = U.stepK.mul(min(float(1).div(r), r.sub(U.rPlus).div(vr.abs().add(1)))).toVar("h");
      const hh = h.mul(0.5);
      const k1r = vr; const k1v = accR(r).toVar(); const k1u = vu; const k1w = accU(u).toVar(); const k1p = dPhi(r, u).toVar();
      const r2 = r.add(hh.mul(k1r)); const v2 = vr.add(hh.mul(k1v)); const u2 = u.add(hh.mul(k1u)); const w2 = vu.add(hh.mul(k1w));
      const k2v = accR(r2).toVar(); const k2w = accU(u2).toVar(); const k2p = dPhi(r2, u2).toVar();
      const r3 = r.add(hh.mul(v2)); const v3 = vr.add(hh.mul(k2v)); const u3 = u.add(hh.mul(w2)); const w3 = vu.add(hh.mul(k2w));
      const k3v = accR(r3).toVar(); const k3w = accU(u3).toVar(); const k3p = dPhi(r3, u3).toVar();
      const r4 = r.add(h.mul(v3)); const v4 = vr.add(h.mul(k3v)); const u4 = u.add(h.mul(w3)); const w4 = vu.add(h.mul(k3w));
      const k4v = accR(r4).toVar(); const k4w = accU(u4).toVar(); const k4p = dPhi(r4, u4).toVar();
      const s6 = h.div(6);
      const rn = r.add(s6.mul(vr.add(v2.mul(2)).add(v3.mul(2)).add(v4))).toVar("rn");
      const vn = vr.add(s6.mul(k1v.add(k2v.mul(2)).add(k3v.mul(2)).add(k4v))).toVar("vn");
      const un = u.add(s6.mul(vu.add(w2.mul(2)).add(w3.mul(2)).add(w4))).toVar("un");
      const wn = vu.add(s6.mul(k1w.add(k2w.mul(2)).add(k3w.mul(2)).add(k4w))).toVar("wn");
      const pn = phi.add(s6.mul(k1p.add(k2p.mul(2)).add(k3p.mul(2)).add(k4p))).toVar("pn");

      // first-integral projection, sign kept
      const P = E.mul(sq(rn).add(a2)).sub(a.mul(Lz));
      const R = sq(P).sub(sq(rn).sub(rn.mul(2)).add(a2).mul(K));
      const Th = Q.sub(sq(un).mul(Q.add(sq(Lz)).sub(a2.mul(sq(E))))).sub(a2.mul(sq(E)).mul(sq(un)).mul(sq(un)));
      vn.assign(select(vn.greaterThanEqual(0), float(1), float(-1)).mul(sqrt(max(R, 0))));
      wn.assign(select(wn.greaterThanEqual(0), float(1), float(-1)).mul(sqrt(max(Th, 0))));

      const done = float(0).toVar("done");
      If(u.mul(un).lessThan(0), () => {
        const f = u.div(u.sub(un));
        const rc = r.add(f.mul(rn.sub(r)));
        If(rc.greaterThanEqual(U.rIn).and(rc.lessThanEqual(U.rOut)), () => {
          const row = diskRow(rc);
          const den = row.y.mul(E.sub(row.x.mul(Lz)));
          If(den.greaterThan(1e-4), () => {
            const g = float(1).div(den);
            const I = pow(g, 4).mul(row.z).mul(U.diskGain).mul(U.exposure);
            const emission = chroma(g.mul(row.w)).mul(I).toVar("emission");
            If(U.orderTint.greaterThan(0.5), () => {
              If(order.greaterThan(1.5), () => { emission.mulAssign(vec3(1.25, 0.55, 1.2)); })
                .ElseIf(order.greaterThan(0.5), () => { emission.mulAssign(vec3(0.5, 1.0, 1.25)); });
            });
            rgb.addAssign(transmit.mul(emission));
          });
          transmit.mulAssign(U.transmit);
          If(transmit.lessThanEqual(1e-4), () => { transmit.assign(0); done.assign(1); });
        });
        order.addAssign(1);
      });
      r.assign(rn); vr.assign(vn); u.assign(un); vu.assign(wn); phi.assign(pn);
      If(done.greaterThan(0.5), () => { Break(); });
      If(r.lessThan(U.rPlus.add(U.margin)).and(vr.lessThan(0)), () => { transmit.assign(0); Break(); });
      If(r.greaterThan(U.escape).and(vr.greaterThan(0)), () => { escaped.assign(1); Break(); });
    });

    const sinT = max(sqrt(max(float(1).sub(sq(u)), 0)), 1e-4);
    const sp = sin(phi);
    const cp = cos(phi);
    // Tangent without 1/sin(theta) (see the GLSL backend): exact on the spin axis.
    const Pf = E.mul(sq(r).add(a2)).sub(a.mul(Lz));
    const cDrift = a.mul(Pf).div(max(sq(r).sub(r.mul(2)).add(a2), 1e-6)).sub(a.mul(E));
    const lPhi = Lz.add(float(1).sub(sq(u)).mul(cDrift));
    const tangent = vec3(
      vu.negate().mul(u).mul(cp).sub(lPhi.mul(sp)),
      vu.mul(sinT),
      vu.negate().mul(u).mul(sp).add(lPhi.mul(cp)),
    );
    const tangentNorm = length(tangent);
    const angMom = sqrt(max(Q.add(sq(Lz)).add(a2.mul(sq(E)).mul(sq(u))), 0));
    const pos = vec3(sinT.mul(cp), u, sinT.mul(sp));
    const v = pos.mul(vr).add(select(tangentNorm.greaterThan(1e-12),
      tangent.mul(r.mul(angMom).div(tangentNorm.max(1e-12))), vec3(0)));
    const dir = select(escaped.greaterThan(0.5), v.div(length(v).max(1e-12)), pos);
    return { rgb, transmit, escaped, dir };
  }

  function buildKernel(count) {
    buffer = instancedArray(count, "vec4");
    kernel = Fn(() => {
      If(float(instanceIndex).greaterThanEqual(U.pixelCount), () => { Return(); });
      const idx = float(instanceIndex);
      const py = floor(idx.div(U.res.x));
      const px = idx.sub(py.mul(U.res.x));
      const acc = vec3(0).toVar("acc");
      Loop({ start: int(0), end: U.samples, name: "sIdx", type: "int", condition: "<" }, ({ sIdx }) => {
        const jit = select(sIdx.equal(0), U.j0, select(sIdx.equal(1), U.j1, select(sIdx.equal(2), U.j2, U.j3)));
        const pix = vec2(px.add(0.5), py.add(0.5)).add(jit);
        const ndc0 = vec2(pix.x.div(U.res.x).mul(2).sub(1), float(1).sub(pix.y.div(U.res.y).mul(2)));
        const dir0 = vec3(0).toVar("dir0");
        const dirX = vec3(0).toVar("dirX");
        const dirY = vec3(0).toVar("dirY");
        const rgb0 = vec3(0).toVar("rgb0");
        const t0 = float(0).toVar("t0");
        const e0 = float(0).toVar("e0");
        Loop({ start: int(0), end: int(3), name: "kIdx", type: "int", condition: "<" }, ({ kIdx }) => {
          const offset = select(kIdx.equal(1), vec2(float(2).div(U.res.x), 0),
            select(kIdx.equal(2), vec2(0, float(-2).div(U.res.y)), vec2(0, 0)));
          const ray = traceRay(ndc0.add(offset));
          If(kIdx.equal(0), () => {
            rgb0.assign(ray.rgb); t0.assign(ray.transmit); e0.assign(ray.escaped); dir0.assign(ray.dir);
          }).ElseIf(kIdx.equal(1), () => { dirX.assign(ray.dir); })
            .Else(() => { dirY.assign(ray.dir); });
        });
        const footprint = max(length(dirX.sub(dir0)), length(dirY.sub(dir0)));
        const col = rgb0.toVar("col");
        If(e0.greaterThan(0.5).and(t0.greaterThan(0)), () => {
          col.addAssign(t0.mul(skyLookup(dir0, footprint)));
        });
        acc.addAssign(col);
      });
      const current = acc.div(float(U.samples));
      const element = buffer.element(instanceIndex);
      element.assign(vec4(mix(element.xyz, current, U.historyWeight), 1));
    })().compute(count, [WORKGROUP]);
  }

  function buildMesh() {
    const read = (ox, oy) => {
      const x = clamp(floor(screenCoordinate.x).add(ox), 0, U.res.x.sub(1));
      const y = clamp(floor(screenCoordinate.y).add(oy), 0, U.res.y.sub(1));
      return buffer.element(int(y.mul(U.res.x).add(x))).xyz;
    };
    const material = new MeshBasicNodeMaterial();
    material.name = "kerr-display-node";
    material.depthTest = false;
    material.depthWrite = false;
    material.toneMapped = false;
    material.vertexNode = vec4(positionGeometry.xy, 0, 1);
    material.fragmentNode = Fn(() => {
      const c = read(0, 0).toVar("c");
      const uvTop = screenCoordinate.xy.div(U.res);
      const d = length(uvTop.sub(U.focus.xy).mul(vec2(U.aspect, 1)));
      const defocus = U.focus.w.mul(clamp(d.sub(U.focus.z).div(U.focus.z.mul(1.4)), 0, 1));
      If(defocus.greaterThan(0.001), () => {
        const blur = vec3(0).toVar("blur");
        const radius = float(1).add(defocus.mul(2.5));
        for (let j = -2; j <= 2; j += 1) {
          for (let i = -2; i <= 2; i += 1) blur.addAssign(read(radius.mul(i), radius.mul(j)));
        }
        c.assign(mix(c, blur.div(25), defocus));
      });
      return vec4(c, 1);
    })();
    const quad = new Mesh(new PlaneGeometry(2, 2), material);
    quad.frustumCulled = false;
    quad.renderOrder = -10;
    quad.name = "kerr-observatory-display";
    return quad;
  }

  function ensureCapacity(count) {
    if (count <= capacity && buffer) return false;
    capacity = Math.ceil((count * 1.25) / WORKGROUP) * WORKGROUP;
    buildKernel(capacity);
    const next = buildMesh();
    if (mesh) {
      mesh.parent?.add(next);
      mesh.parent?.remove(mesh);
      mesh.material.dispose();
      mesh.geometry.dispose();
    }
    mesh = next;
    wasConverged = false;
    pending = true;
    return true;
  }

  // The first display mesh exists up front so it can be added to the scene before a renderer does.
  ensureCapacity(1280 * 720);

  function sync({ renderer, camera, atlasState, detail3d = "medium", reducedMotion = false, governorRaySteps = null }) {
    if (!renderer.isWebGPURenderer || !renderer.backend?.isWebGPUBackend) {
      throw new Error("Kerr compute path requires the native WebGPU backend");
    }
    renderer.getDrawingBufferSize(size);
    const width = Math.max(2, Math.round(size.x));
    const height = Math.max(2, Math.round(size.y));
    const grown = ensureCapacity(width * height);
    U.res.value.set(width, height);
    U.pixelCount.value = width * height;

    const normalized = normalizeKerrState(atlasState);
    const budget = kerrQualityBudget(normalized.quality, { detail3d, reducedMotion, governorRaySteps });
    const observer = kerrObserverFromCamera([camera.position.x, camera.position.y, camera.position.z]);
    const state = buildKerrRenderState(normalized, { observer, budget, backend: "webgpu" });

    if (skyQuality !== budget.sky) {
      skyQuality = budget.sky;
      skyTex?.dispose();
      const sky = skyFor(budget.sky, seed);
      skyTex = skyTexture(sky);
      skyNode.value = skyTex;
      U.skySize.value.set(sky.width, sky.height);
      U.skyLevels.value = sky.levels.length;
      pending = true;
    }
    if (diskRef !== state.disk) {
      diskRef = state.disk;
      diskTex?.dispose();
      diskTex = floatTexture(state.disk.data, state.disk.size);
      diskNode.value = diskTex;
      if (!colorTex) {
        colorTex = floatTexture(state.colorTable.data, state.colorTable.size);
        colorNodeTex.value = colorTex;
        U.colorLogMin.value = state.colorTable.logMin;
        U.colorLogSpan.value = state.colorTable.logMax - state.colorTable.logMin;
      }
    }
    const key = kerrAccumulationKey({
      aStar: state.aStar, massLog10: state.massLog10, inclinationDeg: normalized.inclinationDeg,
      observer: state.observer, resolution: [width, height], backend: "webgpu",
      quality: budget.effective, diskModel: normalized.diskModel, budget,
    });
    const step = accumulator.update(key, budget.temporalSamples);
    const advance = step.reset || !wasConverged || grown;
    wasConverged = step.converged;

    const { coef } = state.observer;
    U.tanHalfFov.value = Math.tan((camera.fov * Math.PI) / 360);
    U.aspect.value = camera.aspect || 1;
    U.spin.value = state.aStar;
    U.rPlus.value = state.radii.rPlus;
    U.rIn.value = state.disk.rIn;
    U.rOut.value = state.disk.rOut;
    U.r0.value = state.observer.r0;
    U.u0.value = state.observer.u0;
    U.sinT0.value = Math.sin(state.observer.theta0);
    U.phi0.value = state.observer.phi0;
    U.coef.value.set(coef.E0, coef.E1, coef.L0, coef.L1);
    U.mom.value.set(coef.P1, coef.R1);
    U.stepK.value = budget.stepK;
    U.maxSteps.value = Math.min(MAX_STEPS, budget.maxSteps);
    U.samples.value = Math.min(4, budget.samplesPerFrame);
    U.transmit.value = state.transmittance;
    U.exposure.value = state.exposure;
    U.orderTint.value = state.annotations ? 1 : 0;
    U.historyWeight.value = step.reset ? 1 : 1 / (step.frame + 1);
    [U.j0, U.j1, U.j2, U.j3].forEach((node, s) => {
      const [jx, jy] = kerrJitter(step.frame * U.samples.value + s);
      node.value.set(jx, jy);
    });
    if (advance) renderer.compute(kernel);

    latest = {
      backend: "webgpu", frames: step.frame + 1, resets: accumulator.resets,
      resolution: [width, height], budget, converged: step.converged, reducedMotion,
    };
    return { state, budget, observer, step };
  }

  return {
    get mesh() { return mesh; },
    sync,
    setFocus({ x, y, radius, strength }) {
      U.focus.value.set(x * 0.5 + 0.5, 0.5 - y * 0.5, radius, strength);
    },
    clearFocus() { U.focus.value.set(0.5, 0.5, 0.2, 0); },
    forceRender() { pending = true; wasConverged = false; },
    snapshot: () => ({ ...latest }),
    dispose() {
      skyTex?.dispose(); diskTex?.dispose(); colorTex?.dispose();
      mesh?.material.dispose(); mesh?.geometry.dispose();
    },
  };
}

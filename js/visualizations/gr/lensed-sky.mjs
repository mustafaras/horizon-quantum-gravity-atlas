/**
 * Lensed-sky panel renderer (moved out of mod-gr.jsx by S07, unchanged in behaviour): the lens model, the procedural sky textures
 * and the per-pixel ray trace. `ngLensModel` takes the physics module `P` (js/physics.mjs) and the scene's c^2 explicitly.
 */

import * as TK from "../../design/tokens.mjs";

/* ── Lensed-sky panel ────────────────────────────────────────────────────────
   A real gravitational-lensing render, not a painted ring. For every pixel we
   take the observer's ray, convert its angular offset from the mass into an
   impact parameter b = D·sin θ, look up the exact Schwarzschild deflection
   α(b) from the same integrator the 3D fan uses, and sample a procedural
   celestial sphere at the deflected direction β = θ − α. Rays with b < b_crit
   are captured and render black.

   The source sky is an azimuthal-equidistant map with the lens axis at its
   centre, so the pole is a point rather than a seam and the Einstein ring is a
   clean circle. The two background sources are evaluated analytically in
   (β, φ) instead of being baked into the texture: a texture cannot resolve a
   source small enough to produce a ring thinner than the panel. */
const NG_TEX = 1024;
let ngTexCache = null;
function ngSkyTexture(mode) {
  const N = NG_TEX, R = N / 2;
  const cv = document.createElement("canvas");
  cv.width = cv.height = N;
  const g = cv.getContext("2d");
  const img = g.createImageData(N, N), d = img.data;
  let nx = 0.40, ny = 0.80, nz = 0.45;
  const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
  const grid = mode === "grid";
  for (let j = 0; j < N; j++) {
    const dy = (j + 0.5 - R) / R;
    for (let i = 0; i < N; i++) {
      const dx = (i + 0.5 - R) / R;
      const o = (j * N + i) * 4;
      const rr = Math.hypot(dx, dy);
      if (rr > 1) { d[o + 3] = 0; continue; }
      const beta = rr * Math.PI, phi = Math.atan2(dy, dx);
      const sb = Math.sin(beta), cb = Math.cos(beta);
      const ux = sb * Math.cos(phi), uy = sb * Math.sin(phi), uz = cb;
      const gl = ux * nx + uy * ny + uz * nz;
      let r = 1, gg = 2, b = 6;
      if (!grid) {
        const band = Math.exp(-(gl / 0.19) * (gl / 0.19));
        const core = Math.exp(-(gl / 0.055) * (gl / 0.055));
        const m = 0.5 + 0.5 * Math.sin(ux * 7.1 + uy * 4.3 + uz * 5.7);
        r += band * (13 + m * 8) + core * 40;
        gg += band * (16 + m * 6) + core * 31;
        b += band * (44 + m * 15) + core * 80;
      }
      d[o] = Math.min(255, r); d[o + 1] = Math.min(255, gg); d[o + 2] = Math.min(255, b); d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  if (grid) {
    g.lineWidth = 1.4;
    for (let k = 1; k <= 12; k++) {
      g.strokeStyle = k % 3 === 0 ? TK.alpha("pigment-azure-82-c10", 0.62) : TK.alpha("pigment-azure-66", 0.30);
      g.beginPath(); g.arc(R, R, (k / 12) * R, 0, 6.2832); g.stroke();
    }
    for (let k = 0; k < 24; k++) {
      const a = k / 24 * 6.2832;
      g.strokeStyle = k % 6 === 0 ? TK.alpha("pigment-azure-82-c10", 0.62) : TK.alpha("pigment-azure-66", 0.30);
      g.beginPath(); g.moveTo(R, R); g.lineTo(R + Math.cos(a) * R, R + Math.sin(a) * R); g.stroke();
    }
  } else {
    let s = 0x9e3779b9;
    const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
    for (let k = 0; k < 13000; k++) {
      const u = rnd() * 2 - 1, beta = Math.acos(u), phi = rnd() * 6.2832;
      const rad = beta / Math.PI * R;
      const x = R + Math.cos(phi) * rad, y = R + Math.sin(phi) * rad;
      const mag = Math.pow(rnd(), 3.1);
      const tint = rnd();
      const col = tint < 0.62 ? "pigment-white" : tint < 0.82 ? "pigment-blue-89" : tint < 0.94 ? "pigment-orange-94-c05" : "pigment-red-89";
      g.fillStyle = TK.alpha(col, 0.25 + mag * 0.75);
      g.beginPath(); g.arc(x, y, 0.35 + mag * 1.9, 0, 6.2832); g.fill();
    }
    for (let k = 0; k < 26; k++) {
      const u = rnd() * 2 - 1, beta = Math.acos(u), phi = rnd() * 6.2832;
      const rad = beta / Math.PI * R;
      const x = R + Math.cos(phi) * rad, y = R + Math.sin(phi) * rad;
      const gr = g.createRadialGradient(x, y, 0, x, y, 7);
      gr.addColorStop(0, TK.alpha("pigment-white", 0.95));
      gr.addColorStop(0.25, TK.alpha("pigment-azure-90", 0.5));
      gr.addColorStop(1, TK.alpha("pigment-blue-74", 0));
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 7, 0, 6.2832); g.fill();
    }
  }
  return g.getImageData(0, 0, N, N);
}
export function ngTextures() {
  if (!ngTexCache) ngTexCache = { sky: ngSkyTexture("sky"), grid: ngSkyTexture("grid") };
  return ngTexCache;
}
const NG_SRC = [
  { b: 0.0, p: 0.0, s: 0.0135, i: 1.10, c: [255, 246, 220] },
  { b: 0.0, p: 0.0, s: 0.030, i: 0.16, c: [255, 196, 120] },
  { b: 0.30, p: 0.62, s: 0.009, i: 0.60, c: [190, 222, 255] },
];
export function ngLensModel(mass, P, GR_C2) {
  const gm = 0.55 * mass;
  const bCrit = P.grCriticalImpactParameter(gm, GR_C2);
  const D = 12;
  const TN = 200, bLo = bCrit * 1.00002, bHi = bCrit * 9;
  const lo = Math.log(bLo), hi = Math.log(bHi);
  const tab = new Float64Array(TN);
  for (let i = 0; i < TN; i++) {
    const b = Math.exp(lo + (hi - lo) * i / (TN - 1));
    tab[i] = P.grNullDeflection(b, gm, GR_C2, { maxSteps: 200000 }).deflection;
  }
  const alphaAt = (b) => {
    if (b >= bHi) return (4 * gm) / (GR_C2 * b);
    const t = (Math.log(b) - lo) / (hi - lo) * (TN - 1);
    const i = Math.min(TN - 2, Math.max(0, Math.floor(t)));
    const f = Math.min(1, Math.max(0, t - i));
    return tab[i] * (1 - f) + tab[i + 1] * f;
  };
  const thetaShadow = Math.asin(Math.min(1, bCrit / D));
  let a0 = thetaShadow * 1.0001, a1 = 1.2;
  for (let k = 0; k < 80; k++) {
    const mid = 0.5 * (a0 + a1);
    if (mid - alphaAt(D * Math.sin(mid)) > 0) a1 = mid; else a0 = mid;
  }
  const thetaE = 0.5 * (a0 + a1);
  const FOV = Math.min(1.05, Math.max(0.22, 2.5 * thetaE));
  return { gm, bCrit, D, alphaAt, thetaShadow, thetaE, FOV };
}
export function renderLensedSky(cv, L, tex, lensed) {
  const N = cv.width, ctx = cv.getContext("2d");
  const img = ctx.createImageData(N, N), out = img.data;
  const sw = tex.width, sh = tex.height, sd = tex.data;
  const half = N / 2, FOV = L.FOV, D = L.D;
  for (let j = 0; j < N; j++) {
    const y = (j + 0.5) / half - 1;
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / half - 1;
      const o = (j * N + i) * 4;
      const rho = Math.hypot(x, y);
      if (rho > 1) { out[o + 3] = 0; continue; }
      const theta = FOV * rho;
      const b = D * Math.sin(theta);
      let phi = Math.atan2(y, x);
      if (lensed && b <= L.bCrit) {
        const rim = Math.exp(-Math.pow((L.bCrit - b) / (L.bCrit * 0.035), 2));
        out[o] = 1 + rim * 6; out[o + 1] = 2 + rim * 9; out[o + 2] = 6 + rim * 20; out[o + 3] = 255;
        continue;
      }
      let a = theta;
      if (lensed) {
        const beta = theta - L.alphaAt(b);
        a = Math.abs(beta) % (2 * Math.PI);
        if (beta < 0) phi += Math.PI;
        if (a > Math.PI) { a = 2 * Math.PI - a; phi += Math.PI; }
      }
      const rr = a / Math.PI;
      const tx = 0.5 + 0.5 * rr * Math.cos(phi);
      const ty = 0.5 + 0.5 * rr * Math.sin(phi);
      const fx = tx * sw - 0.5, fy = ty * sh - 0.5;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const ax = fx - x0, ay = fy - y0;
      const xx0 = Math.max(0, Math.min(sw - 1, x0)), yy0 = Math.max(0, Math.min(sh - 1, y0));
      const xx1 = Math.max(0, Math.min(sw - 1, x0 + 1)), yy1 = Math.max(0, Math.min(sh - 1, y0 + 1));
      const i00 = (yy0 * sw + xx0) * 4, i10 = (yy0 * sw + xx1) * 4;
      const i01 = (yy1 * sw + xx0) * 4, i11 = (yy1 * sw + xx1) * 4;
      const w00 = (1 - ax) * (1 - ay), w10 = ax * (1 - ay);
      const w01 = (1 - ax) * ay, w11 = ax * ay;
      let r = sd[i00] * w00 + sd[i10] * w10 + sd[i01] * w01 + sd[i11] * w11;
      let g = sd[i00 + 1] * w00 + sd[i10 + 1] * w10 + sd[i01 + 1] * w01 + sd[i11 + 1] * w11;
      let bl = sd[i00 + 2] * w00 + sd[i10 + 2] * w10 + sd[i01 + 2] * w01 + sd[i11 + 2] * w11;
      const ca = Math.cos(a), sa = Math.sin(a);
      for (let k = 0; k < NG_SRC.length; k++) {
        const S = NG_SRC[k];
        const cosg = ca * Math.cos(S.b) + sa * Math.sin(S.b) * Math.cos(phi - S.p);
        const gam = Math.acos(Math.max(-1, Math.min(1, cosg)));
        const t = gam / S.s;
        if (t < 3.2) {
          const I = Math.exp(-t * t) * S.i;
          r += S.c[0] * I; g += S.c[1] * I; bl += S.c[2] * I;
        }
      }
      if (lensed) {
        const pr = Math.exp(-Math.pow((b - L.bCrit * 1.03) / (L.bCrit * 0.055), 2));
        r += pr * 70; g += pr * 58; bl += pr * 40;
      }
      out[o] = r > 255 ? 255 : r;
      out[o + 1] = g > 255 ? 255 : g;
      out[o + 2] = bl > 255 ? 255 : bl;
      out[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

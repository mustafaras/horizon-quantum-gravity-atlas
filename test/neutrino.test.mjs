// Three-flavour neutrino oscillations in constant-density matter (S12).
//
// The library evolves the flavour state with exp(-iHL) from an analytic Hermitian eigendecomposition. Everything here is
// checked against something that does not share that code: the closed vacuum formula in terms of U, a Taylor series of
// the matrix exponential, the two-flavour formula, and the MSW resonance condition.

import test from "node:test";
import assert from "node:assert/strict";

import {
  pmnsMatrix, hamiltonian, oscillationProbabilities, matterPotentialEv, electronDensityPerCm3,
  resonanceEnergyGeV, deltaM31FromOrdering, PHASE_KM_PER_GEV, FERMI_CONSTANT_PER_GEV2, mixingAngles,
} from "../js/science/neutrino.mjs";
import { NUFIT, NUFIT_SOURCE, EXPERIMENTS, defaultParams } from "../js/science/data/nufit.mjs";
import { hasReferenceIdentifier } from "../js/science/references.mjs";

const NO = defaultParams("NO");
const IO = defaultParams("IO");
const FLAVOURS = [0, 1, 2];
// hbar c in eV km from the exact SI values of hbar, c and e (not a rounded literal: a 3e-10 relative error in hbar c is
// a 1e-6 rad phase error at the thousands of radians of the 8000 km cases).
const HBAR_C_EV_KM = (1.054571817e-34 * 299792458) / 1.602176634e-19 / 1000;

/* ---------- independent references ---------- */
const cmul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const conj = (a) => ({ re: a.re, im: -a.im });

/** Closed vacuum formula: P(a->b) = d_ab - 4 sum_{i>j} Re(W) sin^2(D_ij) + 2 sum_{i>j} Im(W) sin(2 D_ij), W = U_ai* U_bi U_aj U_bj*. */
function vacuumClosedForm(U, dm2, E, L, a, b, anti) {
  const mass = [0, dm2.dm21, dm2.dm31];
  let p = a === b ? 1 : 0;
  for (let i = 1; i < 3; i += 1) {
    for (let j = 0; j < i; j += 1) {
      const Uai = anti ? conj(U[a][i]) : U[a][i], Ubi = anti ? conj(U[b][i]) : U[b][i];
      const Uaj = anti ? conj(U[a][j]) : U[a][j], Ubj = anti ? conj(U[b][j]) : U[b][j];
      const w = cmul(cmul(conj(Uai), Ubi), cmul(Uaj, conj(Ubj)));
      const d = PHASE_KM_PER_GEV * (mass[i] - mass[j]) * L / E;
      p += -4 * w.re * Math.sin(d) ** 2 + 2 * w.im * Math.sin(2 * d);
    }
  }
  return p;
}

/** exp(-i H t) by scaling and squaring of a 40-term Taylor series, in complex arithmetic. */
function matrixExpTaylor(H, t) {
  const mul = (A, B) => A.map((row, r) => row.map((_, c) => {
    let s = { re: 0, im: 0 };
    for (let k = 0; k < 3; k += 1) { const m = cmul(A[r][k], B[k][c]); s = { re: s.re + m.re, im: s.im + m.im }; }
    return s;
  }));
  let norm = 0;
  for (const row of H) for (const x of row) norm = Math.max(norm, Math.hypot(x.re, x.im));
  const squarings = Math.max(0, Math.ceil(Math.log2(Math.max(1e-300, norm * t * 3))) + 2);
  const scale = t / 2 ** squarings;
  const A = H.map((row) => row.map((x) => ({ re: x.im * scale, im: -x.re * scale }))); // -i H t
  let term = [0, 1, 2].map((r) => [0, 1, 2].map((c) => ({ re: r === c ? 1 : 0, im: 0 })));
  let sum = term.map((row) => row.map((x) => ({ ...x })));
  for (let n = 1; n <= 40; n += 1) {
    term = mul(term, A).map((row) => row.map((x) => ({ re: x.re / n, im: x.im / n })));
    sum = sum.map((row, r) => row.map((x, c) => ({ re: x.re + term[r][c].re, im: x.im + term[r][c].im })));
  }
  for (let s = 0; s < squarings; s += 1) sum = mul(sum, sum);
  return sum;
}

const GRID = [];
for (const params of [NO, IO]) {
  for (const E_GeV of [0.1, 0.6, 2, 2.5, 10]) {
    for (const L_km of [52.5, 295, 810, 1300, 8000]) {
      for (const rhoGcm3 of [0, 2.6, 13]) {
        for (const antineutrino of [false, true]) GRID.push({ params, E_GeV, L_km, rhoGcm3, antineutrino });
      }
    }
  }
}

/* ---------- constants and conversions ---------- */
test("the phase factor 1.267 is derived from hbar c and equals 1.2669 within 1e-3", () => {
  assert.ok(Math.abs(PHASE_KM_PER_GEV - 1.267) < 1e-3);
  // Delta m^2 L / (4 E hbar c) with hbar c = 1.973269804e-7 eV m, E in GeV
  assert.ok(Math.abs(PHASE_KM_PER_GEV - 1 / (4 * HBAR_C_EV_KM * 1e9)) < 1e-6);
});

test("the matter potential V = sqrt(2) G_F N_e is 7.63e-14 eV x Y_e rho[g/cm^3] within 0.5 per cent", () => {
  const v = matterPotentialEv({ rhoGcm3: 1, Ye: 1 });
  assert.ok(Math.abs(v / 7.63e-14 - 1) < 5e-3, `V = ${v}`);
  assert.equal(matterPotentialEv({ rhoGcm3: 0, Ye: 0.5 }), 0);
  assert.ok(Math.abs(matterPotentialEv({ rhoGcm3: 2.6, Ye: 0.5 }) / (0.5 * 2.6 * v) - 1) < 1e-12);
});

test("N_e = rho Y_e / m_u is 3.011e23 per cm^3 for rho = 1 g/cm^3 and Y_e = 0.5", () => {
  assert.ok(Math.abs(electronDensityPerCm3({ rhoGcm3: 1, Ye: 0.5 }) / 3.0115e23 - 1) < 1e-3);
});

test("the ordering sets Delta m^2_31 from Delta m^2_3l", () => {
  assert.equal(deltaM31FromOrdering({ ordering: "NO", dm3l: 2.5e-3, dm21: 7.5e-5 }), 2.5e-3);
  assert.ok(Math.abs(deltaM31FromOrdering({ ordering: "IO", dm3l: -2.5e-3, dm21: 7.5e-5 }) - (-2.5e-3 + 7.5e-5)) < 1e-15);
});

/* ---------- PMNS ---------- */
test("the PMNS matrix is unitary and has the PDG moduli", () => {
  for (const p of [NO, IO]) {
    const U = pmnsMatrix(p);
    for (let a = 0; a < 3; a += 1) {
      for (let b = 0; b < 3; b += 1) {
        let s = { re: 0, im: 0 };
        for (let i = 0; i < 3; i += 1) { const m = cmul(U[a][i], conj(U[b][i])); s = { re: s.re + m.re, im: s.im + m.im }; }
        assert.ok(Math.abs(s.re - (a === b ? 1 : 0)) < 1e-14 && Math.abs(s.im) < 1e-14);
      }
    }
    assert.ok(Math.abs(Math.hypot(U[0][2].re, U[0][2].im) - Math.sin(p.theta13)) < 1e-15);
    assert.ok(Math.abs(Math.hypot(U[1][2].re, U[1][2].im) - Math.sin(p.theta23) * Math.cos(p.theta13)) < 1e-15);
    assert.ok(Math.abs(Math.hypot(U[0][0].re, U[0][0].im) - Math.cos(p.theta12) * Math.cos(p.theta13)) < 1e-15);
  }
});

test("delta_CP enters U_e3 as s13 exp(-i delta)", () => {
  const U = pmnsMatrix({ ...NO, deltaCP: Math.PI / 3 });
  assert.ok(Math.abs(U[0][2].re - Math.sin(NO.theta13) * Math.cos(Math.PI / 3)) < 1e-15);
  assert.ok(Math.abs(U[0][2].im + Math.sin(NO.theta13) * Math.sin(Math.PI / 3)) < 1e-15);
});

test("mixingAngles inverts sin^2 theta and returns radians", () => {
  const a = mixingAngles({ sin2theta12: 0.308, sin2theta13: 0.02215, sin2theta23: 0.47 });
  assert.ok(Math.abs(Math.sin(a.theta12) ** 2 - 0.308) < 1e-15);
  assert.ok(Math.abs(a.theta13 * 180 / Math.PI - 8.56) < 0.01); // NuFIT 6.0 Table 1 prints theta_13 = 8.56 deg
  assert.ok(Math.abs(a.theta23 * 180 / Math.PI - 43.3) < 0.05); // and theta_23 = 43.3 deg
});

/* ---------- the probability matrix ---------- */
test("rows and columns of P sum to 1 within 1e-12 over the parameter grid", () => {
  for (const g of GRID) {
    const P = oscillationProbabilities(g);
    for (const a of FLAVOURS) {
      assert.ok(Math.abs(P[a][0] + P[a][1] + P[a][2] - 1) < 1e-12, `row ${a} E=${g.E_GeV} L=${g.L_km} rho=${g.rhoGcm3}`);
      assert.ok(Math.abs(P[0][a] + P[1][a] + P[2][a] - 1) < 1e-12, `column ${a} E=${g.E_GeV} L=${g.L_km} rho=${g.rhoGcm3}`);
      for (const b of FLAVOURS) assert.ok(P[a][b] >= -1e-13 && P[a][b] <= 1 + 1e-13);
    }
  }
});

test("the exact exponential agrees with a Taylor-series matrix exponential to 1e-10", () => {
  for (const g of GRID.filter((_, i) => i % 7 === 0)) {
    const H = hamiltonian(g); // eV
    const L = g.L_km / HBAR_C_EV_KM; // eV^-1
    const S = matrixExpTaylor(H, L);
    const P = oscillationProbabilities(g);
    for (const a of FLAVOURS) for (const b of FLAVOURS) {
      const taylor = S[b][a].re ** 2 + S[b][a].im ** 2; // P(a -> b) = |S_ba|^2
      assert.ok(Math.abs(P[a][b] - taylor) < 1e-10, `P(${a}->${b}) ${P[a][b]} vs ${taylor}`);
    }
  }
});

test("rho = 0 equals the closed vacuum formula in terms of U", () => {
  for (const p of [NO, IO, { ...NO, deltaCP: 1.3 }]) {
    const U = pmnsMatrix(p);
    const dm2 = { dm21: p.dm21, dm31: p.dm31 };
    for (const antineutrino of [false, true]) {
      for (const [E_GeV, L_km] of [[0.6, 295], [2, 810], [2.5, 1300], [0.004, 52.5], [0.3, 4000]]) {
        const P = oscillationProbabilities({ E_GeV, L_km, params: p, rhoGcm3: 0, antineutrino });
        for (const a of FLAVOURS) for (const b of FLAVOURS) {
          assert.ok(Math.abs(P[a][b] - vacuumClosedForm(U, dm2, E_GeV, L_km, a, b, antineutrino)) < 1e-10, `${a}->${b}`);
        }
      }
    }
  }
});

test("theta13 = 0 and Delta m^2_21 = 0 reproduce the two-flavour formula to 1e-10", () => {
  const p = { ...NO, theta13: 0, dm21: 0 };
  for (const [E_GeV, L_km] of [[0.6, 295], [2.5, 1300], [1, 500], [3, 6000]]) {
    const P = oscillationProbabilities({ E_GeV, L_km, params: p, rhoGcm3: 0 });
    const twoFlavour = Math.sin(2 * p.theta23) ** 2 * Math.sin(PHASE_KM_PER_GEV * p.dm31 * L_km / E_GeV) ** 2;
    assert.ok(Math.abs(P[1][2] - twoFlavour) < 1e-10, `mu->tau ${P[1][2]} vs ${twoFlavour}`);
    assert.ok(Math.abs(P[1][1] - (1 - twoFlavour)) < 1e-10);
    assert.ok(Math.abs(P[0][0] - 1) < 1e-10);
    assert.ok(P[0][1] < 1e-10 && P[1][0] < 1e-10);
  }
});

test("the vacuum limit does not depend on the electron fraction", () => {
  const a = oscillationProbabilities({ E_GeV: 1, L_km: 700, params: NO });
  const b = oscillationProbabilities({ E_GeV: 1, L_km: 700, params: NO, rhoGcm3: 0, Ye: 0.3 });
  for (const i of FLAVOURS) for (const j of FLAVOURS) assert.equal(a[i][j], b[i][j]);
});

test("CPT: P(nu_a -> nu_b) = P(anti-nu_b -> anti-nu_a) in vacuum", () => {
  for (const p of [NO, IO]) {
    for (const [E_GeV, L_km] of [[0.6, 295], [2, 810], [2.5, 1300]]) {
      const nu = oscillationProbabilities({ E_GeV, L_km, params: p, rhoGcm3: 0 });
      const anti = oscillationProbabilities({ E_GeV, L_km, params: p, rhoGcm3: 0, antineutrino: true });
      for (const a of FLAVOURS) for (const b of FLAVOURS) assert.ok(Math.abs(nu[a][b] - anti[b][a]) < 1e-12);
    }
  }
});

test("delta = 0 or pi leaves no CP asymmetry in vacuum, delta = 3 pi / 2 does", () => {
  for (const deltaCP of [0, Math.PI]) {
    const p = { ...NO, deltaCP };
    const nu = oscillationProbabilities({ E_GeV: 0.6, L_km: 295, params: p, rhoGcm3: 0 });
    const anti = oscillationProbabilities({ E_GeV: 0.6, L_km: 295, params: p, rhoGcm3: 0, antineutrino: true });
    for (const a of FLAVOURS) for (const b of FLAVOURS) assert.ok(Math.abs(nu[a][b] - anti[a][b]) < 1e-12);
  }
  const p = { ...NO, deltaCP: 1.5 * Math.PI };
  const nu = oscillationProbabilities({ E_GeV: 0.6, L_km: 295, params: p, rhoGcm3: 0 });
  const anti = oscillationProbabilities({ E_GeV: 0.6, L_km: 295, params: p, rhoGcm3: 0, antineutrino: true });
  assert.ok(Math.abs(nu[1][0] - anti[1][0]) > 0.01);
});

test("matter makes neutrinos and antineutrinos differ even for delta = 0, with opposite sign in the other ordering", () => {
  const args = { E_GeV: 2.5, L_km: 1300, rhoGcm3: 2.848 };
  const asym = (params) => {
    const nu = oscillationProbabilities({ ...args, params: { ...params, deltaCP: 0 } });
    const anti = oscillationProbabilities({ ...args, params: { ...params, deltaCP: 0 }, antineutrino: true });
    return nu[1][0] - anti[1][0];
  };
  assert.ok(asym(NO) > 0.01, `NO ${asym(NO)}`);
  assert.ok(asym(IO) < -0.005, `IO ${asym(IO)}`);
});

test("the MSW resonance energy of the 1-3 sector is the argmax of P(nu_mu -> nu_e) in a constant-density scan", () => {
  // theta12 = 0 and Delta m^2_21 = 0 decouple the problem to e-3 mixing. The baseline is the half oscillation length
  // at resonance, where sin^2 of the phase is extremal, so the maximum over E sits at E_res.
  const rhoGcm3 = 2.8, Ye = 0.5;
  const p = { ...NO, theta12: 0, dm21: 0, deltaCP: 0 };
  const Eres = resonanceEnergyGeV({ dm31: p.dm31, theta13: p.theta13, rhoGcm3, Ye });
  assert.ok(Eres > 5 && Eres < 20, `E_res = ${Eres} GeV`);
  const dmMatter = p.dm31 * Math.sin(2 * p.theta13); // Delta m^2 in matter at resonance
  const L_km = (Math.PI * Eres) / (2 * PHASE_KM_PER_GEV * dmMatter); // PHASE dm L / E = pi / 2: sin^2 = 1
  const step = 0.01 * Eres;
  let best = { E: 0, P: -1 };
  for (let E = 0.5 * Eres; E <= 1.5 * Eres; E += step) {
    const P = oscillationProbabilities({ E_GeV: E, L_km, params: p, rhoGcm3, Ye })[1][0];
    if (P > best.P) best = { E, P };
  }
  assert.ok(Math.abs(best.E - Eres) <= step, `argmax ${best.E} vs E_res ${Eres}`);
  assert.ok(best.P > 0.9 * Math.sin(p.theta23) ** 2, `resonant P ${best.P}`);
});

test("E_res = dm31 cos(2 theta13) / (2 sqrt(2) G_F N_e) in natural units", () => {
  const Ne = electronDensityPerCm3({ rhoGcm3: 2.8, Ye: 0.5 });
  const NeGev3 = Ne * (1.973269804e-14) ** 3; // cm^-3 -> GeV^3 (hbar c = 1.9733e-14 GeV cm)
  const E = (NO.dm31 * 1e-18 * Math.cos(2 * NO.theta13)) / (2 * Math.SQRT2 * FERMI_CONSTANT_PER_GEV2 * NeGev3);
  assert.ok(Math.abs(resonanceEnergyGeV({ dm31: NO.dm31, theta13: NO.theta13, rhoGcm3: 2.8, Ye: 0.5 }) / E - 1) < 1e-9);
  assert.equal(resonanceEnergyGeV({ dm31: NO.dm31, theta13: NO.theta13, rhoGcm3: 0 }), Infinity);
});

test("sanity: at the T2K peak the appearance probability is a few per cent in both orderings", () => {
  const t2k = EXPERIMENTS.find((e) => e.id === "t2k");
  for (const p of [NO, IO]) {
    const P = oscillationProbabilities({ E_GeV: t2k.peakEnergyGeV, L_km: t2k.baselineKm, params: p, rhoGcm3: t2k.rhoGcm3 });
    assert.ok(P[1][0] > 0.03 && P[1][0] < 0.09, `P(mu->e) = ${P[1][0]}`);
    assert.ok(P[1][1] < 0.2, `P(mu->mu) = ${P[1][1]}`);
  }
});

test("inputs are validated", () => {
  assert.throws(() => oscillationProbabilities({ E_GeV: 0, L_km: 295, params: NO }), /E_GeV/);
  assert.throws(() => oscillationProbabilities({ E_GeV: 1, L_km: -1, params: NO }), /L_km/);
  assert.throws(() => oscillationProbabilities({ E_GeV: 1, L_km: 1, params: NO, rhoGcm3: -1 }), /rhoGcm3/);
  assert.throws(() => oscillationProbabilities({ E_GeV: 1, L_km: 1, params: { ...NO, theta12: NaN } }), /theta12/);
  assert.throws(() => oscillationProbabilities({ E_GeV: 1, L_km: 1, params: NO, Ye: 2 }), /Ye/);
});

test("the result is frozen data and L = 0 is the identity", () => {
  const P = oscillationProbabilities({ E_GeV: 1, L_km: 0, params: NO, rhoGcm3: 2.6 });
  for (const a of FLAVOURS) for (const b of FLAVOURS) assert.ok(Math.abs(P[a][b] - (a === b ? 1 : 0)) < 1e-14);
  assert.throws(() => { P[0][0] = 0; }, TypeError);
});

/* ---------- data ---------- */
test("NuFIT 6.0 values are those of Table 1 of the paper (IC24 with SK-atm, normal ordering)", () => {
  const v = NUFIT.variants["IC24-with-SK-atm"].NO;
  assert.equal(v.sin2theta12.value, 0.308);
  assert.equal(v.sin2theta23.value, 0.470);
  assert.deepEqual([v.sin2theta23.plus, v.sin2theta23.minus], [0.017, 0.013]);
  assert.equal(v.sin2theta13.value, 0.02215);
  assert.equal(v.deltaCP.value, 212);
  assert.deepEqual([v.deltaCP.plus, v.deltaCP.minus], [26, 41]);
  assert.equal(v.dm21.value, 7.49e-5);
  assert.equal(v.dm3l.value, 2.513e-3);
});

test("NuFIT 6.0 values are those of Table 1 of the paper (IC24 with SK-atm, inverted ordering)", () => {
  const v = NUFIT.variants["IC24-with-SK-atm"].IO;
  assert.equal(v.sin2theta23.value, 0.550);
  assert.equal(v.sin2theta13.value, 0.02231);
  assert.equal(v.deltaCP.value, 274);
  assert.equal(v.dm3l.value, -2.484e-3);
  assert.deepEqual([v.dm3l.plus, v.dm3l.minus], [0.020e-3, 0.020e-3]);
});

test("NuFIT 6.0 values of the IC19 without SK-atm variant", () => {
  const no = NUFIT.variants["IC19-without-SK-atm"].NO;
  const io = NUFIT.variants["IC19-without-SK-atm"].IO;
  assert.equal(no.sin2theta23.value, 0.561);
  assert.equal(no.deltaCP.value, 177);
  assert.equal(io.deltaCP.value, 285);
  assert.equal(io.dm3l.value, -2.510e-3);
  assert.equal(no.sin2theta12.value, 0.307);
});

test("the data carry their source, release, retrieval date and identifiers", () => {
  assert.match(NUFIT_SOURCE.release, /NuFIT 6\.0/);
  assert.match(NUFIT_SOURCE.retrieved, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(hasReferenceIdentifier(NUFIT_SOURCE.citation));
  assert.match(NUFIT_SOURCE.citation, /2410\.05380|JHEP12\(2024\)216/);
  for (const experiment of EXPERIMENTS) {
    assert.ok(experiment.baselineKm > 0 && experiment.peakEnergyGeV > 0 && experiment.rhoGcm3 >= 0, experiment.id);
    assert.ok(hasReferenceIdentifier(experiment.source), `${experiment.id}: ${experiment.source}`);
    assert.ok(experiment.energyRangeGeV[0] < experiment.peakEnergyGeV && experiment.peakEnergyGeV < experiment.energyRangeGeV[1], experiment.id);
  }
});

test("the experiment presets are T2K, NOvA, DUNE and JUNO with their published baselines", () => {
  const byId = Object.fromEntries(EXPERIMENTS.map((e) => [e.id, e]));
  assert.deepEqual(Object.keys(byId).sort(), ["dune", "juno", "nova", "t2k"]);
  assert.equal(byId.t2k.baselineKm, 295);
  assert.equal(byId.nova.baselineKm, 810);
  assert.equal(byId.dune.baselineKm, 1300);
  assert.equal(byId.juno.baselineKm, 52.5);
  assert.equal(byId.juno.antineutrino, true);
  assert.equal(byId.juno.initialFlavour, 0);
});

test("defaultParams returns radians, a signed Delta m^2_31 and the requested variant", () => {
  const p = defaultParams("IO", "IC24-with-SK-atm");
  assert.ok(Math.abs(p.deltaCP - 274 * Math.PI / 180) < 1e-12);
  assert.ok(p.dm31 < 0);
  assert.ok(Math.abs(p.dm31 - (-2.484e-3 + 7.49e-5)) < 1e-15);
  assert.throws(() => defaultParams("XX"), /ordering/);
  assert.throws(() => defaultParams("NO", "nope"), /variant/);
});

/* ---------- Formula Core: the two-flavour limit and the matter potential ---------- */
import { library } from "../js/formula/library/index.mjs";

test("the two-flavour formula is the theta13 = 0, dm21 = 0 limit of the exact calculation", () => {
  const f = library.twoFlavourOscillation;
  const p = { ...NO, theta13: 0, dm21: 0 };
  for (const [E, L] of [[0.6, 295], [2.5, 1300], [1, 500]]) {
    const exact = oscillationProbabilities({ E_GeV: E, L_km: L, params: p })[1][2];
    assert.ok(Math.abs(f.evaluate({ theta: p.theta23, dm2: p.dm31, L, E }) - exact) < 1e-9, `E=${E} L=${L}`);
  }
  assert.equal(f.status, "established");
  assert.equal(f.constants.k, PHASE_KM_PER_GEV);
  assert.match(f.tex, /\\sin/);
});

test("the matter potential formula gives V = sqrt(2) G_F N_e in joules, equal to matterPotentialEv", () => {
  const f = library.matterPotential;
  const Ne = electronDensityPerCm3({ rhoGcm3: 2.6, Ye: 0.5 }) * 1e6; // m^-3
  const joules = f.evaluate({ Ne });
  const ev = matterPotentialEv({ rhoGcm3: 2.6, Ye: 0.5 });
  assert.ok(Math.abs(joules / 1.602176634e-19 / ev - 1) < 1e-9, `${joules / 1.602176634e-19} eV vs ${ev} eV`);
  assert.equal(f.status, "established");
  assert.equal(f.dimString.length > 0, true);
});

/* ---------- curves for the flavour ribbon ---------- */
import { flavourCurves } from "../js/science/neutrino.mjs";

test("flavourCurves over energy at fixed baseline are the probability matrix column by column", () => {
  const c = flavourCurves({ initial: 1, mode: "energy", range: [0.2, 2], fixed: 295, samples: 60, params: NO, rhoGcm3: 2.6 });
  assert.equal(c.x.length, 61);
  assert.equal(c.x[0], 0.2); assert.ok(Math.abs(c.x.at(-1) - 2) < 1e-12);
  for (const i of [0, 17, 60]) {
    const P = oscillationProbabilities({ E_GeV: c.x[i], L_km: 295, params: NO, rhoGcm3: 2.6 });
    for (const b of FLAVOURS) assert.ok(Math.abs(c.P[b][i] - P[1][b]) < 1e-15);
    assert.ok(Math.abs(c.P[0][i] + c.P[1][i] + c.P[2][i] - 1) < 1e-12);
  }
});

test("flavourCurves over L/E at fixed energy put L = (L/E) E and follow the antineutrino channel", () => {
  const c = flavourCurves({ initial: 0, mode: "baseline", range: [0, 600], fixed: 0.004, samples: 30, params: NO, rhoGcm3: 0, antineutrino: true });
  const i = 12;
  const P = oscillationProbabilities({ E_GeV: 0.004, L_km: c.x[i] * 0.004, params: NO, rhoGcm3: 0, antineutrino: true });
  for (const b of FLAVOURS) assert.ok(Math.abs(c.P[b][i] - P[0][b]) < 1e-15);
  assert.equal(c.P[0][0], 1); // L = 0
});

test("flavourCurves rejects a bad flavour, mode, range or sample count", () => {
  const base = { initial: 1, mode: "energy", range: [0.2, 2], fixed: 295, params: NO };
  assert.throws(() => flavourCurves({ ...base, initial: 3 }), /initial/);
  assert.throws(() => flavourCurves({ ...base, mode: "x" }), /mode/);
  assert.throws(() => flavourCurves({ ...base, range: [2, 0.2] }), /range/);
  assert.throws(() => flavourCurves({ ...base, samples: 1 }), /samples/);
  assert.throws(() => flavourCurves({ ...base, fixed: 0 }), /fixed/);
});

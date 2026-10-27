import test from "node:test";
import assert from "node:assert/strict";

import {
  ELECTRON, MUON, DEFAULT_PARAMS, ALPHA_ZERO, GEV2_TO_NB,
  couplings, zPropagator, differentialCrossSection, totalCrossSection, forwardBackwardAsymmetry,
  qedCrossSection, channelTerms, zeroCrossing, peakEnergy, crossSectionScan,
  bhabhaTerms, mollerTerms, electronMuonTerms, channelDecomposition, CHANNEL_PROCESSES,
} from "../js/science/electroweak.mjs";
import { LEP_POLE, LEP_SOURCE, derivedMuonPoleCrossSection } from "../js/science/data/electroweak.mjs";

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b} (tol ${tol})`);
const rel = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${msg ?? ""} ${a} vs ${b} (rel tol ${tol})`);

// Independent route: the four helicity amplitudes of e-_i e+ -> f_j fbar, A_ij = QeQf + chi (gVe -+ gAe)(gVf -+ gAf).
function helicityCrossSection(sqrtS, c, params) {
  const s = sqrtS * sqrtS;
  const chi = zPropagator(s, params);
  const ge = couplings(ELECTRON, params.sin2), gf = couplings(MUON, params.sin2);
  const amp = (se, sf) => {
    const k = (ge.gV + se * ge.gA) * (gf.gV + sf * gf.gA);
    const re = 1 + chi.re * k, im = chi.im * k;
    return re * re + im * im;
  };
  const same = amp(1, 1) + amp(-1, -1), opposite = amp(1, -1) + amp(-1, 1);
  return (Math.PI * params.alpha * params.alpha / (8 * s)) * (same * (1 + c) ** 2 + opposite * (1 - c) ** 2) * GEV2_TO_NB;
}

test("couplings follow g_V = T3 - 2 Q sin^2, g_A = T3", () => {
  const { gV, gA } = couplings(MUON, 0.23122);
  close(gV, -0.5 + 2 * 0.23122, 1e-15);
  assert.equal(gA, -0.5);
});

test("the Breit-Wigner factor is purely imaginary at the pole", () => {
  const chi = zPropagator(DEFAULT_PARAMS.mZ ** 2, DEFAULT_PARAMS);
  close(chi.re, 0, 1e-9);
  assert.ok(chi.im < 0);
});

test("the QED limit is sigma = 4 pi alpha^2 / 3s, 86.8 nb GeV^2 / s", () => {
  const params = { ...DEFAULT_PARAMS, alpha: ALPHA_ZERO };
  for (const sqrtS of [1, 2, 5]) {
    rel(totalCrossSection(sqrtS, params), qedCrossSection(sqrtS, ALPHA_ZERO), 2e-3, `sqrtS=${sqrtS}`);
  }
  close(qedCrossSection(1, ALPHA_ZERO), 86.8, 0.1);
});

test("the closed form agrees with the helicity-amplitude sum", () => {
  for (const sqrtS of [10, 50, 88, DEFAULT_PARAMS.mZ, 93, 200]) {
    for (const c of [-0.9, -0.3, 0, 0.4, 0.95]) {
      rel(differentialCrossSection(sqrtS, c, DEFAULT_PARAMS), helicityCrossSection(sqrtS, c, DEFAULT_PARAMS), 1e-12, `${sqrtS} ${c}`);
    }
  }
});

test("the total cross-section is the angular integral", () => {
  let sum = 0;
  const n = 2000;
  for (let i = 0; i < n; i++) sum += differentialCrossSection(91, -1 + (2 * (i + 0.5)) / n, DEFAULT_PARAMS) * (2 / n);
  rel(sum, totalCrossSection(91, DEFAULT_PARAMS), 1e-6); // midpoint rule on a quadratic: error h^2 / 24 ~ 4e-8
});

test("A_FB changes sign below the Z pole and is positive on it", () => {
  assert.ok(forwardBackwardAsymmetry(50, DEFAULT_PARAMS) < 0);
  assert.ok(forwardBackwardAsymmetry(DEFAULT_PARAMS.mZ, DEFAULT_PARAMS) > 0);
  const crossing = zeroCrossing(DEFAULT_PARAMS, { lo: 40, hi: DEFAULT_PARAMS.mZ });
  assert.ok(crossing > 80 && crossing < DEFAULT_PARAMS.mZ, `crossing ${crossing}`);
  close(forwardBackwardAsymmetry(crossing, DEFAULT_PARAMS), 0, 1e-9);
});

test("the cross-section peaks at M_Z within 0.1 GeV", () => {
  close(peakEnergy(DEFAULT_PARAMS), DEFAULT_PARAMS.mZ, 0.1);
});

test("the pole asymmetry is (3/4) A_e A_mu and sits within the LEP uncertainty", () => {
  const { gV, gA } = couplings(MUON, DEFAULT_PARAMS.sin2);
  const a = (2 * gV * gA) / (gV * gV + gA * gA);
  const afb = forwardBackwardAsymmetry(DEFAULT_PARAMS.mZ, DEFAULT_PARAMS);
  close(afb, 0.75 * a * a, 5e-4);
  close(afb, LEP_POLE.afbMu0.value, LEP_POLE.afbMu0.uncertainty);
});

test("the peak cross-section lies within 3 percent of the LEP pole value", () => {
  const pole = derivedMuonPoleCrossSection();
  rel(totalCrossSection(DEFAULT_PARAMS.mZ, DEFAULT_PARAMS), pole.value, 0.03);
});

test("the channel terms add up to the full cross-section", () => {
  for (const sqrtS of [10, 91, 150]) {
    const t = channelTerms(sqrtS, 0.3, DEFAULT_PARAMS);
    const full = differentialCrossSection(sqrtS, 0.3, DEFAULT_PARAMS);
    rel(t.photon + t.z + t.interference, full, 1e-12);
    rel(t.total, full, 1e-12);
  }
  const low = channelTerms(10, 0.3, DEFAULT_PARAMS);
  assert.ok(low.photon > low.z && low.photon > Math.abs(low.interference));
});

test("the scan returns aligned arrays over the requested range", () => {
  const scan = crossSectionScan({ from: 10, to: 200, n: 191, params: DEFAULT_PARAMS });
  assert.equal(scan.sqrtS.length, 191);
  assert.equal(scan.sigma.length, 191);
  assert.equal(scan.afb.length, 191);
  assert.equal(scan.sqrtS[0], 10);
  assert.equal(scan.sqrtS[190], 200);
});

const ALPHA = 1 / 137.035999084;

test("Bhabha matches the plan's closed form in the angle and the Mandelstam form", () => {
  const sqrtS = 10, s = sqrtS * sqrtS;
  for (const c of [-0.8, -0.2, 0, 0.5, 0.9]) {
    const half = Math.acos(c) / 2, sn = Math.sin(half), cs = Math.cos(half);
    const planned = (ALPHA * ALPHA / (2 * s)) * ((1 + cs ** 4) / sn ** 4 - (2 * cs ** 4) / sn ** 2 + (1 + c * c) / 2) * GEV2_TO_NB;
    const t = -s * sn * sn, u = -s * cs * cs;
    const mandelstam = (ALPHA * ALPHA / (2 * s)) * ((s * s + u * u) / (t * t) + (2 * u * u) / (s * t) + (t * t + u * u) / (s * s)) * GEV2_TO_NB;
    const terms = bhabhaTerms(sqrtS, c, ALPHA);
    rel(terms.total, planned, 1e-12);
    rel(terms.total, mandelstam, 1e-12);
    rel(terms.s + terms.t + terms.interference, terms.total, 1e-12);
  }
});

test("Bhabha at 90 degrees: s-channel term is (1 + cos^2)/2, interference is negative", () => {
  const terms = bhabhaTerms(10, 0, ALPHA);
  rel(terms.s, (ALPHA * ALPHA / 200) * 0.5 * GEV2_TO_NB, 1e-12);
  assert.ok(terms.interference < 0);
});

test("Bhabha forward limit is the Rutherford pole alpha^2 / (s sin^4(theta/2))", () => {
  const theta = 0.01;
  const terms = bhabhaTerms(10, Math.cos(theta), ALPHA);
  rel(terms.total, ((ALPHA * ALPHA) / 100 / Math.sin(theta / 2) ** 4) * GEV2_TO_NB, 2e-3);
});

test("Moller is symmetric under theta -> pi - theta and matches alpha^2 (3 + cos^2)^2 / (s sin^4)", () => {
  for (const c of [0.1, 0.5, 0.9]) {
    rel(mollerTerms(10, c, ALPHA).total, mollerTerms(10, -c, ALPHA).total, 1e-12);
    const closed = ((ALPHA * ALPHA) / 100) * (3 + c * c) ** 2 / (1 - c * c) ** 2 * GEV2_TO_NB;
    rel(mollerTerms(10, c, ALPHA).total, closed, 1e-12);
    const m = mollerTerms(10, c, ALPHA);
    rel(m.t + m.u + m.interference, m.total, 1e-12);
  }
});

test("Moller forward limit is the Rutherford pole", () => {
  const theta = 0.01;
  rel(mollerTerms(10, Math.cos(theta), ALPHA).total, ((ALPHA * ALPHA) / 100 / Math.sin(theta / 2) ** 4) * GEV2_TO_NB, 2e-3);
});

test("electron-muon scattering is the single t-channel term (s^2 + u^2) / t^2", () => {
  const sqrtS = 10, s = 100, c = 0.3;
  const t = -s * (1 - c) / 2, u = -s * (1 + c) / 2;
  rel(electronMuonTerms(sqrtS, c, ALPHA).t, (ALPHA * ALPHA / (2 * s)) * ((s * s + u * u) / (t * t)) * GEV2_TO_NB, 1e-12);
});

test("every LEP number carries a table, an uncertainty and the paper's identifiers", () => {
  assert.match(LEP_SOURCE.citation, /10\.1016\/j\.physrep\.2005\.12\.006/);
  assert.match(LEP_SOURCE.citation, /hep-ex\/0509008/);
  for (const [key, entry] of Object.entries(LEP_POLE)) {
    assert.ok(entry.table, key);
    assert.ok(entry.uncertainty > 0, key);
    assert.ok(Number.isFinite(entry.value), key);
  }
});

test("the derived muon pole cross-section is sigma_had / R_mu with the printed correlation", () => {
  const pole = derivedMuonPoleCrossSection();
  close(pole.value, 41.541 / 20.785, 1e-12);
  close(pole.uncertainty, 0.00343, 2e-5);
});

test("channelDecomposition splits each process into thin terms whose sum is the total", () => {
  for (const id of CHANNEL_PROCESSES) {
    const split = channelDecomposition(id, 91, 0.35);
    assert.ok(split.terms.length >= 1, id);
    close(split.terms.reduce((sum, t) => sum + t.value, 0), split.total, 1e-12 * Math.abs(split.total) + 1e-300, id);
    assert.ok(split.terms.every((t) => typeof t.tex === "string" && t.tex.length > 0), id);
  }
  assert.equal(channelDecomposition("compton", 10, 0.2), null);
});

test("the gamma-Z split has three terms, and the interference changes sign across the pole", () => {
  const below = channelDecomposition("s-channel", 80, 0.5), above = channelDecomposition("s-channel", 100, 0.5);
  assert.deepEqual(below.terms.map((t) => t.id), ["photon", "z", "interference"]);
  assert.ok(below.terms[2].value < 0 && above.terms[2].value > 0);
});

test("the Bhabha split is s, t and s-t interference; the Moller split is t, u and t-u interference", () => {
  assert.deepEqual(channelDecomposition("bhabha", 10, 0.1).terms.map((t) => t.id), ["s", "t", "interference"]);
  assert.deepEqual(channelDecomposition("moller", 10, 0.1).terms.map((t) => t.id), ["t", "u", "interference"]);
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  COLLIDER_LAB_PROVENANCE, COLLIDER_LAB_VIEW_ID, COLLIDER_LAB_DEFAULTS,
  COLLIDER_CHANNELS, REFERENCE_MASSES,
  makeFourVector, addFourVectors, invariantMass, invariantMassSq, pT,
  pseudorapidity, azimuth, deltaPhi, deltaR, boostZ, kallen, twoBodyDecay,
  syntheticEvent, clusterJets, eventSummary, colliderExportMetadata,
  registerColliderLabProvenance,
} from "../js/science/collider-kinematics.mjs";
import { getVisualizationProvenance } from "../js/science/provenance.mjs";
import { seededRng } from "../js/physics.mjs";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `|${a} − ${b}| > ${eps}`);

test("provenance registers as schematic with the fixture disclaimer", () => {
  const p = registerColliderLabProvenance();
  assert.deepEqual(p, COLLIDER_LAB_PROVENANCE);
  assert.deepEqual(getVisualizationProvenance(COLLIDER_LAB_VIEW_ID), COLLIDER_LAB_PROVENANCE);
  assert.equal(p.status, "schematic");
  assert.ok(p.assumptions.some((a) => /SYNTHETIC FIXTURES/i.test(a) && /not CERN/i.test(a)));
});

test("four-vector algebra: invariant masses and transverse quantities", () => {
  const v = makeFourVector(5, 3, 4, 0);
  close(invariantMassSq(v), 0, 1e-12);
  close(invariantMass(v), 0, 1e-12);
  close(pT(v), 5, 1e-12);
  const z = makeFourVector(125.25, 0, 0, 0);
  close(invariantMass(z), 125.25, 1e-12);
  close(pseudorapidity(makeFourVector(10, 3, 4, 0)), 0, 1e-12);
  assert.equal(pseudorapidity(makeFourVector(10, 0, 0, 10)), Infinity);
  close(azimuth(makeFourVector(1, 0, 1, 0)), Math.PI / 2, 1e-12);
  assert.throws(() => makeFourVector(NaN, 0, 0, 0), TypeError);
});

test("deltaPhi wraps into (−π, π]", () => {
  const a = makeFourVector(1, 1, 0, 0);
  close(deltaPhi(a, makeFourVector(1, 0, 1, 0)), -Math.PI / 2, 1e-12);
  close(deltaPhi(a, makeFourVector(1, -1, 0, 0)), Math.PI, 1e-12);
  close(deltaPhi(a, makeFourVector(1, Math.cos(3.5), Math.sin(3.5), 0)), 2 * Math.PI - 3.5, 1e-12);
});

test("deltaR combines η and φ in quadrature", () => {
  const a = makeFourVector(10, 1, 0, 1);
  const b = makeFourVector(10, 1, 0, 2);
  close(deltaR(a, b), Math.abs(pseudorapidity(a) - pseudorapidity(b)), 1e-12);
});

test("boostZ: energy–momentum transformation and invariants preserved", () => {
  const v = makeFourVector(10, 3, 0, 4);
  const beta = 0.5;
  const w = boostZ(v, beta);
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  close(w.E, gamma * (10 + beta * 4), 1e-12);
  close(w.pz, gamma * (4 + beta * 10), 1e-12);
  close(w.px, 3, 1e-12);
  close(invariantMassSq(w), invariantMassSq(v), 1e-9);
  assert.throws(() => boostZ(v, 1), RangeError);
  assert.throws(() => boostZ(v, -1.2), RangeError);
});

test("kallen: known values", () => {
  close(kallen(25, 16, 9), -576, 1e-9); // 3-4-5 triangle: −16·A², A = 6 (Heron)
  close(kallen(4, 4, 4), -48, 1e-9); // λ(a,a,a) = −3a²
  close(kallen(100, 0, 0), 10000, 1e-9); // massless 2-body: λ = M⁴
});

test("twoBodyDecay: exact momentum conservation and parent mass reconstruction", () => {
  for (const seed of [1, 7, 42, 1234]) {
    const rng = seededRng(seed);
    // On-shell parent: pick (E, px, py) then solve pz for M = 125.25.
    const M = 125.25;
    const E = 200, px = 30, py = -12;
    const pz = Math.sqrt(E * E - px * px - py * py - M * M);
    const parent = makeFourVector(E, px, py, pz);
    close(invariantMass(parent), M, 1e-9);
    const [d1, d2] = twoBodyDecay({ parentMass: M, m1: 0, m2: 0, rng, parent });
    const sum = addFourVectors(d1, d2);
    close(sum.E, parent.E, 1e-9);
    close(sum.px, parent.px, 1e-9);
    close(sum.py, parent.py, 1e-9);
    close(sum.pz, parent.pz, 1e-9);
    close(invariantMass(sum), M, 1e-9);
    // Massless daughter: m² cancels to ~1e-12, so m itself ~1e-6 from roundoff.
    close(invariantMass(d1), 0, 1e-5);
  }
});

test("twoBodyDecay: isotropic in the parent rest frame", () => {
  const n = 4000;
  let sumCos = 0;
  for (let i = 0; i < n; i++) {
    const [d1] = twoBodyDecay({ parentMass: 10, m1: 0, m2: 0, rng: seededRng(i + 1) });
    sumCos += d1.pz / Math.hypot(d1.px, d1.py, d1.pz);
  }
  const mean = sumCos / n;
  // Uniform in cosθ has mean 0; σ_mean = 1/√(3n) ≈ 0.0091.
  assert.ok(Math.abs(mean) < 0.04, `mean cosθ = ${mean} too far from 0`);
});

test("twoBodyDecay: massive daughters and impossible decays rejected", () => {
  const [d1, d2] = twoBodyDecay({ parentMass: 91.188, m1: 0.105658, m2: 0.105658, rng: seededRng(3) });
  close(invariantMass(addFourVectors(d1, d2)), 91.188, 1e-9);
  close(invariantMass(d1), 0.105658, 1e-9);
  assert.throws(() => twoBodyDecay({ parentMass: 1, m1: 2, m2: 0, rng: seededRng(1) }), RangeError);
  assert.throws(() => twoBodyDecay({ parentMass: 0, m1: 0, m2: 0, rng: seededRng(1) }), RangeError);
});

test("syntheticEvent: deterministic per seed, correct channel content", () => {
  const a = syntheticEvent({ channel: "h2gg", seed: 42 });
  const b = syntheticEvent({ channel: "h2gg", seed: 42 });
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  assert.ok(a.particles.every((p) => p.kind === "photon"));
  assert.equal(a.particles.length, 2);
  close(a.met.et, 0, 1e-12);

  const zMu = syntheticEvent({ channel: "z2mm", seed: 5 });
  assert.deepEqual(zMu.particles.map((p) => p.kind).sort(), ["antimuon", "muon"]);
  close(zMu.met.et, 0, 1e-12);

  const zE = syntheticEvent({ channel: "z2ee", seed: 5 });
  assert.deepEqual(zE.particles.map((p) => p.kind).sort(), ["electron", "positron"]);

  const tt = syntheticEvent({ channel: "ttbar", seed: 9 });
  const kinds = tt.particles.map((p) => p.kind);
  assert.equal(kinds.filter((k) => k === "bquark").length, 2);
  assert.equal(kinds.filter((k) => k === "neutrino").length, 1);
  assert.equal(kinds.filter((k) => k === "jet").length, 2);
  assert.ok(tt.met.et > 0, "ttbar must have nonzero MET from the neutrino");

  const qcd = syntheticEvent({ channel: "qcd", seed: 11 });
  assert.ok(qcd.particles.length >= 3);
  assert.ok(qcd.particles.every((p) => p.kind === "jet"));
});

test("syntheticEvent: validation and energy ceiling", () => {
  assert.throws(() => syntheticEvent({ channel: "nope" }), TypeError);
  assert.throws(() => syntheticEvent({ channel: "h2gg", sqrtSGev: 14000 }), RangeError);
  assert.doesNotThrow(() => syntheticEvent({ channel: "h2gg", sqrtSGev: 13600 }));
});

test("reconstructed masses land near the PDG references", () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const s = eventSummary(syntheticEvent({ channel: "h2gg", seed }));
    assert.ok(Math.abs(s.masses.mGammaGamma - REFERENCE_MASSES.higgs) < 4, `mγγ = ${s.masses.mGammaGamma}`);
  }
  for (const seed of [1, 2, 3]) {
    const s = eventSummary(syntheticEvent({ channel: "z2mm", seed }));
    assert.ok(Math.abs(s.masses.mMuMu - REFERENCE_MASSES.z) < 3, `mμμ = ${s.masses.mMuMu}`);
  }
  for (const seed of [1, 2, 3]) {
    const s = eventSummary(syntheticEvent({ channel: "ttbar", seed }));
    assert.ok(Math.abs(s.masses.mTopHad - REFERENCE_MASSES.top) < 1e-6, `m(top, had) = ${s.masses.mTopHad}`);
    assert.ok(Math.abs(s.masses.mWqq - REFERENCE_MASSES.w) < 1e-6, `m(W→qq) = ${s.masses.mWqq}`);
  }
});

test("clusterJets: greedy cone behavior", () => {
  // Two well-separated high-pT jets from qcd.
  const qcd = syntheticEvent({ channel: "qcd", seed: 11 });
  const jets = clusterJets(qcd.particles, { coneR: 0.4 });
  assert.ok(jets.length >= 2);
  for (let i = 1; i < jets.length; i++) assert.ok(pT(jets[i - 1]) >= pT(jets[i]), "jets must be pT-ordered");
  // Leptons and photons never enter jets.
  const zMu = syntheticEvent({ channel: "z2mm", seed: 5 });
  assert.equal(clusterJets(zMu.particles).length, 0);
  const h = syntheticEvent({ channel: "h2gg", seed: 5 });
  assert.equal(clusterJets(h.particles).length, 0);
  assert.throws(() => clusterJets([], { coneR: 0 }), RangeError);
});

test("eventSummary: shape and fixture flag", () => {
  const s = eventSummary(syntheticEvent({ channel: "ttbar", seed: 9 }));
  assert.equal(s.channel, "ttbar");
  assert.equal(s.fixture, true);
  assert.ok(s.nParticles >= 6);
  assert.ok(Array.isArray(s.jets));
  assert.ok(Number.isFinite(s.metEt));
  assert.throws(() => eventSummary(null), TypeError);
});

test("export metadata flags the fixture and mirrors state", () => {
  const meta = colliderExportMetadata({ colliderChannel: "z2ee" }, { kind: "collider-event", particles: 2 });
  assert.equal(meta.colliderLab.view, COLLIDER_LAB_VIEW_ID);
  assert.equal(meta.colliderLab.channel, "z2ee");
  assert.ok(/synthetic/i.test(meta.colliderLab.fixture));
  assert.equal(meta.colliderLab.provenance.status, "schematic");
  assert.equal(COLLIDER_CHANNELS.length, 5);
  assert.equal(COLLIDER_LAB_DEFAULTS.channel, "h2gg");
  assert.equal(REFERENCE_MASSES.higgs, 125.25);
});
/**
 * Collider kinematics lab — pure event-construction contract for Prompt 08.
 *
 * Builds DETERMINISTIC SYNTHETIC collision events at leading order: a
 * seeded RNG picks the hard-process kinematics, four-vector algebra
 * propagates momenta, and a schematic greedy cone algorithm clusters jets.
 *
 * Honest boundaries (mirrored in provenance):
 * - These are SYNTHETIC FIXTURES for teaching detector anatomy. They are
 *   NOT CERN/ATLAS/CMS observations and must never be presented as data.
 * - No detector simulation, no pileup, no reconstruction, no PDFs, no
 *   higher-order corrections: truth-level leading-order kinematics only.
 * - Jet clustering is a greedy cone (documented schematic), not anti-kT.
 * - Center-of-mass energy is capped at the LHC Run 3 ceiling (13.6 TeV).
 *
 * DOM-free and deterministic: every stochastic generator takes a seed and
 * identical arguments always produce identical events.
 */

import { seededRng } from "../physics.mjs";
import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";
import { REF } from "./references.mjs";

export const COLLIDER_LAB_VIEW_ID = "collider-event-lab";

export const COLLIDER_LAB_DEFAULTS = Object.freeze({
  channel: "h2gg",
  sqrtSGev: 13600,
  coneR: 0.4,
});

export const COLLIDER_CHANNELS = Object.freeze(["h2gg", "z2mm", "z2ee", "ttbar", "qcd"]);

/** PDG reference masses in GeV (frozen shared constants, never duplicated). */
export const REFERENCE_MASSES = Object.freeze({
  higgs: 125.25,
  z: 91.188,
  w: 80.377,
  top: 172.57,
  electron: 0.000511,
  muon: 0.105658,
  bottom: 4.18,
});

export const COLLIDER_LAB_PROVENANCE = Object.freeze({
  model: "Leading-order synthetic collision events (H→γγ, Z→μμ/ee, tt̄, QCD dijets) with four-vector kinematics, greedy-cone jets and missing transverse energy, shown in a schematic detector",
  status: "schematic",
  assumptions: [
    "DETERMINISTIC SYNTHETIC FIXTURES — not CERN/ATLAS/CMS observations; never presented as detector data",
    "Truth-level leading order only: no detector simulation, no pileup, no reconstruction, no parton distribution functions",
    "Jet clustering is a greedy cone algorithm (documented schematic), not the anti-kT algorithm used by the LHC collaborations",
    "Center-of-mass energy capped at the LHC Run 3 ceiling of 13.6 TeV; masses are PDG reference values",
  ],
  validity: [
    "Four-vector algebra (invariant masses, boosts, ΔR) is exact special relativity and is unit-tested",
    "Two-body decays conserve four-momentum exactly at leading order; reconstructed parent masses are exact by construction",
    "MET is the true vector sum of invisible particles (neutrinos); it is exactly zero for fully visible two-body channels",
  ],
  numericalMethod:
    "Seeded LCG kinematics; exact four-vector algebra (E, px, py, pz); two-body decays via the Källén function with isotropic angles; "
    + "greedy cone clustering seeded on the highest-pT unclustered particle; invariant masses from M² = E² − |p⃗|²",
  references: [
    REF.PDG_2024,
    REF.CACCIARI_ANTI_KT,
    REF.ATLAS_2008,
  ],
  layers: [{ name: "Seeded decay kinematics, tracks and jets", class: "model" }, { name: "Detector layer outline and glow", class: "decoration" }],
  seed: "URL state seed (key seed, default 42); every event is deterministic in (channel, seed, sqrt s)",
});

export function registerColliderLabProvenance() {
  if (!getVisualizationProvenance(COLLIDER_LAB_VIEW_ID)) {
    registerVisualization(COLLIDER_LAB_VIEW_ID, COLLIDER_LAB_PROVENANCE);
  }
  return COLLIDER_LAB_PROVENANCE;
}

// ---------------------------------------------------------------------------
// Four-vector algebra (exact)
// ---------------------------------------------------------------------------

/** Metric signature (+,−,−,−). */
export function makeFourVector(E, px, py, pz) {
  const v = { E: Number(E), px: Number(px), py: Number(py), pz: Number(pz) };
  for (const k of ["E", "px", "py", "pz"]) {
    if (!Number.isFinite(v[k])) throw new TypeError(`four-vector component ${k} is not finite`);
  }
  return v;
}

export function addFourVectors(a, b) {
  return makeFourVector(a.E + b.E, a.px + b.px, a.py + b.py, a.pz + b.pz);
}

export function invariantMassSq(v) {
  const m2 = v.E * v.E - v.px * v.px - v.py * v.py - v.pz * v.pz;
  // Guard against tiny negative values from floating-point roundoff.
  return m2 < 0 && m2 > -1e-9 ? 0 : m2;
}

export function invariantMass(v) {
  return Math.sqrt(Math.max(0, invariantMassSq(v)));
}

export function pT(v) {
  return Math.hypot(v.px, v.py);
}

/** Pseudorapidity η = atanh(pz/|p|); ±Infinity on the beam axis. */
export function pseudorapidity(v) {
  const p = Math.hypot(v.px, v.py, v.pz);
  if (p === 0) return 0;
  const c = v.pz / p;
  return Math.atanh(Math.max(-1, Math.min(1, c)));
}

export function azimuth(v) {
  return Math.atan2(v.py, v.px);
}

/** Δφ wrapped into (−π, π]. */
export function deltaPhi(a, b) {
  let d = azimuth(a) - azimuth(b);
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}

export function deltaR(a, b) {
  const dEta = pseudorapidity(a) - pseudorapidity(b);
  const dPhi = deltaPhi(a, b);
  return Math.hypot(dEta, dPhi);
}

/** Longitudinal boost with velocity β along +z: γ = 1/√(1−β²). */
export function boostZ(v, beta) {
  const b = Number(beta);
  if (!(b > -1 && b < 1)) throw new RangeError("boost velocity must satisfy |β| < 1");
  const gamma = 1 / Math.sqrt(1 - b * b);
  return makeFourVector(gamma * (v.E + b * v.pz), v.px, v.py, gamma * (v.pz + b * v.E));
}

/** Källén triangle function λ(a,b,c) = a²+b²+c²−2ab−2bc−2ca. */
export function kallen(a, b, c) {
  return a * a + b * b + c * c - 2 * a * b - 2 * b * c - 2 * c * a;
}

/**
 * Isotropic two-body decay of a parent of mass M into daughters of masses
 * m1, m2 in the parent rest frame, then boosted by the parent's four-vector.
 * cosθ = 2·rng() − 1 gives a uniform distribution in cosθ (isotropic).
 */
export function twoBodyDecay({ parentMass, m1, m2, rng, parent = null }) {
  const M = Number(parentMass);
  if (!(M > 0)) throw new RangeError("parentMass must be > 0");
  if (m1 + m2 > M + 1e-9) throw new RangeError(`two-body decay impossible: ${m1} + ${m2} > ${M}`);
  const pStar = Math.sqrt(Math.max(0, kallen(M * M, m1 * m1, m2 * m2))) / (2 * M);
  const cosTheta = 2 * (typeof rng === "function" ? rng() : 0.5) - 1;
  const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
  const phi = (typeof rng === "function" ? rng() : 0.5) * 2 * Math.PI;
  const d1 = makeFourVector(
    Math.sqrt(pStar * pStar + m1 * m1),
    pStar * sinTheta * Math.cos(phi),
    pStar * sinTheta * Math.sin(phi),
    pStar * cosTheta,
  );
  const d2 = makeFourVector(
    Math.sqrt(pStar * pStar + m2 * m2),
    -d1.px, -d1.py, -d1.pz,
  );
  if (!parent) return [d1, d2];
  return [boostDaughter(d1, parent), boostDaughter(d2, parent)];
}

function boostDaughter(d, parent) {
  // Boost from the parent rest frame to the lab along the parent direction:
  // rotate so the parent momentum points along +z, boost, rotate back.
  const p = Math.hypot(parent.px, parent.py, parent.pz);
  if (p === 0) return d;
  const beta = p / parent.E;
  const ptParent = Math.hypot(parent.px, parent.py);
  const cphi = parent.px / ptParent;
  const sphi = parent.py / ptParent;
  // R(−φ) about z maps the parent's transverse direction onto +x.
  const rot = {
    E: d.E,
    px: d.px * cphi + d.py * sphi,
    py: -d.px * sphi + d.py * cphi,
    pz: d.pz,
  };
  const ctheta = parent.pz / p;
  const stheta = ptParent / p;
  // R(−θ) about y maps the parent direction onto +z.
  const aligned = {
    E: rot.E,
    px: rot.px * ctheta - rot.pz * stheta,
    py: rot.py,
    pz: rot.px * stheta + rot.pz * ctheta,
  };
  const boosted = boostZ(aligned, beta);
  // Inverse rotations: R(+θ) about y, then R(+φ) about z.
  const back1 = {
    E: boosted.E,
    px: boosted.px * ctheta + boosted.pz * stheta,
    py: boosted.py,
    pz: -boosted.px * stheta + boosted.pz * ctheta,
  };
  return makeFourVector(back1.E, back1.px * cphi - back1.py * sphi, back1.px * sphi + back1.py * cphi, back1.pz);
}

// ---------------------------------------------------------------------------
// Synthetic event generation
// ---------------------------------------------------------------------------

const PARTICLE_KINDS = Object.freeze({
  photon: { color: "photon", charge: 0, visible: true },
  jet: { color: "jet", charge: null, visible: true },
  electron: { color: "electron", charge: -1, visible: true },
  positron: { color: "electron", charge: 1, visible: true },
  muon: { color: "muon", charge: -1, visible: true },
  antimuon: { color: "muon", charge: 1, visible: true },
  neutrino: { color: "met", charge: 0, visible: false },
  bquark: { color: "jet", charge: -1 / 3, visible: true },
});

function particle(kind, fourVector, extra = {}) {
  const spec = PARTICLE_KINDS[kind];
  if (!spec) throw new TypeError(`unknown particle kind: ${kind}`);
  return { kind, ...fourVector, charge: spec.charge, visible: spec.visible, ...extra };
}

const LEPTON_KINDS = new Set(["electron", "positron", "muon", "antimuon"]);

function isLepton(p) {
  return LEPTON_KINDS.has(p.kind);
}

/** Triangular smear of a Breit–Wigner-ish peak (schematic, bounded). */
function smearedMass(rng, central, halfWidth) {
  // Sum of two uniforms gives a triangular distribution centered on 0.
  return central + (rng() + rng() - 1) * halfWidth;
}

/**
 * Generate one synthetic event. Deterministic in (channel, seed, sqrtSGev).
 * Returns { channel, seed, sqrtSGev, particles, met: {et, phi}, beams }.
 */
export function syntheticEvent({ channel = COLLIDER_LAB_DEFAULTS.channel, seed = 1, sqrtSGev = COLLIDER_LAB_DEFAULTS.sqrtSGev } = {}) {
  if (!COLLIDER_CHANNELS.includes(channel)) {
    throw new TypeError(`unknown channel: ${channel} (expected one of ${COLLIDER_CHANNELS.join(", ")})`);
  }
  const energy = Number(sqrtSGev);
  if (!(energy > 0) || energy > 13600 + 1e-9) {
    throw new RangeError("sqrtSGev must be in (0, 13600] — the LHC Run 3 ceiling");
  }
  const rng = seededRng(Number(seed) >>> 0);
  const particles = [];
  const invisibles = [];

  const emit = (p) => {
    particles.push(p);
    if (!p.visible) invisibles.push(p);
    return p;
  };

  if (channel === "h2gg") {
    const mH = smearedMass(rng, REFERENCE_MASSES.higgs, 3.6);
    const yH = (rng() * 2 - 1) * 1.8;
    const pTH = (rng() * 2 - 1) * 18;
    const E = Math.sqrt(mH * mH + pTH * pTH) * Math.cosh(yH);
    const H = makeFourVector(E, pTH * Math.cos(rng() * 2 * Math.PI), pTH * Math.sin(rng() * 2 * Math.PI), pTH * Math.sinh(yH));
    const [g1, g2] = twoBodyDecay({ parentMass: mH, m1: 0, m2: 0, rng, parent: H });
    emit(particle("photon", g1, { parent: "H" }));
    emit(particle("photon", g2, { parent: "H" }));
  } else if (channel === "z2mm" || channel === "z2ee") {
    const isMu = channel === "z2mm";
    const mZ = smearedMass(rng, REFERENCE_MASSES.z, 2.5);
    const yZ = (rng() * 2 - 1) * 1.8;
    const pTZ = (rng() * 2 - 1) * 14;
    const E = Math.sqrt(mZ * mZ + pTZ * pTZ) * Math.cosh(yZ);
    const Z = makeFourVector(E, pTZ * Math.cos(rng() * 2 * Math.PI), pTZ * Math.sin(rng() * 2 * Math.PI), pTZ * Math.sinh(yZ));
    const mLepton = isMu ? REFERENCE_MASSES.muon : REFERENCE_MASSES.electron;
    const [l1, l2] = twoBodyDecay({ parentMass: mZ, m1: mLepton, m2: mLepton, rng, parent: Z });
    emit(particle(isMu ? "muon" : "electron", l1, { parent: "Z" }));
    emit(particle(isMu ? "antimuon" : "positron", l2, { parent: "Z" }));
  } else if (channel === "ttbar") {
    const mt = REFERENCE_MASSES.top;
    const yT = (rng() * 2 - 1) * 1.2;
    const pTT = (rng() * 2 - 1) * 40;
    const ET = Math.sqrt(mt * mt + pTT * pTT) * Math.cosh(yT);
    const phiT = rng() * 2 * Math.PI;
    const T = makeFourVector(ET, pTT * Math.cos(phiT), pTT * Math.sin(phiT), pTT * Math.sinh(yT));
    const Tbar = makeFourVector(ET, -pTT * Math.cos(phiT), -pTT * Math.sin(phiT), -pTT * Math.sinh(yT));
    const lepton = rng() < 0.5 ? "electron" : "muon";
    const mLepton = lepton === "muon" ? REFERENCE_MASSES.muon : REFERENCE_MASSES.electron;
    // t → b W+, W+ → ℓ+ ν
    const [bPos, wPos] = twoBodyDecay({ parentMass: mt, m1: REFERENCE_MASSES.bottom, m2: REFERENCE_MASSES.w, rng, parent: T });
    emit(particle("bquark", bPos, { parent: "t" }));
    const [lep, nu] = twoBodyDecay({ parentMass: REFERENCE_MASSES.w, m1: mLepton, m2: 0, rng, parent: wPos });
    emit(particle(lepton, lep, { parent: "W+" }));
    emit(particle("neutrino", nu, { parent: "W+" }));
    // t̄ → b̄ W−, W− → q q̄
    const [bNeg, wNeg] = twoBodyDecay({ parentMass: mt, m1: REFERENCE_MASSES.bottom, m2: REFERENCE_MASSES.w, rng, parent: Tbar });
    emit(particle("bquark", bNeg, { parent: "t̄" }));
    const [q1, q2] = twoBodyDecay({ parentMass: REFERENCE_MASSES.w, m1: 0, m2: 0, rng, parent: wNeg });
    emit(particle("jet", q1, { parent: "W−" }));
    emit(particle("jet", q2, { parent: "W−" }));
  } else if (channel === "qcd") {
    const pT1 = 250 + rng() * 1750;
    const phi1 = rng() * 2 * Math.PI;
    const eta1 = (rng() * 2 - 1) * 2.2;
    const phi2 = phi1 + Math.PI + (rng() * 2 - 1) * 0.25;
    const eta2 = (rng() * 2 - 1) * 2.2;
    const pT2 = pT1 * (0.55 + rng() * 0.4);
    const mkJet = (pt, phi, eta) => {
      const pmag = pt * Math.cosh(eta);
      return makeFourVector(pmag, pt * Math.cos(phi), pt * Math.sin(phi), pmag * Math.tanh(eta));
    };
    emit(particle("jet", mkJet(pT1, phi1, eta1), { parent: "hard scatter" }));
    emit(particle("jet", mkJet(pT2, phi2, eta2), { parent: "hard scatter" }));
    // A few soft initial-state-radiation jets (schematic).
    const nISR = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < nISR; i++) {
      const pt = 20 + rng() * 90;
      emit(particle("jet", mkJet(pt, rng() * 2 * Math.PI, (rng() * 2 - 1) * 3.5), { parent: "ISR" }));
    }
  }

  // Missing transverse energy: true vector sum of invisible pT.
  let metX = 0, metY = 0;
  for (const p of invisibles) {
    metX += p.px;
    metY += p.py;
  }
  const met = { et: Math.hypot(metX, metY), phi: Math.atan2(metY, metX) };

  return {
    channel,
    seed: Number(seed) >>> 0,
    sqrtSGev: energy,
    particles,
    met,
    fixture: true,
  };
}

/**
 * Greedy cone jet clustering (documented schematic, NOT anti-kT):
 * repeatedly seed on the highest-pT unclustered particle and absorb every
 * unclustered particle within ΔR < coneR of the seed; the jet four-vector
 * is the sum of its members.
 */
export function clusterJets(particles, { coneR = COLLIDER_LAB_DEFAULTS.coneR } = {}) {
  const r = Number(coneR);
  if (!(r > 0)) throw new RangeError("coneR must be > 0");
  const pool = particles
    .filter((p) => p.visible && p.kind !== "photon" && !isLepton(p))
    .map((p, i) => ({ p, i }));
  const used = new Set();
  const jets = [];
  // Sort by pT descending for deterministic seeding.
  pool.sort((a, b) => pT(b.p) - pT(a.p));
  for (const { p } of pool) {
    if (used.has(p)) continue;
    const members = [];
    for (const q of pool) {
      if (used.has(q.p)) continue;
      if (deltaR(p, q.p) < r) {
        members.push(q.p);
        used.add(q.p);
      }
    }
    let sum = makeFourVector(0, 0, 0, 0);
    for (const m of members) sum = addFourVectors(sum, m);
    jets.push({
      ...sum,
      kind: "jet",
      visible: true,
      nMembers: members.length,
      members: members.map((m) => m.kind),
      et: pT(sum),
      eta: pseudorapidity(sum),
      phi: azimuth(sum),
    });
  }
  jets.sort((a, b) => pT(b) - pT(a));
  return jets;
}

/**
 * Human-readable summary of an event: multiplicities, MET, and the
 * reconstructed invariant masses that define each channel's signature.
 */
export function eventSummary(event) {
  if (!event || !Array.isArray(event.particles)) throw new TypeError("eventSummary requires a syntheticEvent result");
  const jets = clusterJets(event.particles, { coneR: COLLIDER_LAB_DEFAULTS.coneR });
  const byKind = {};
  for (const p of event.particles) byKind[p.kind] = (byKind[p.kind] || 0) + 1;

  const masses = {};
  const ofKind = (k) => event.particles.filter((p) => p.kind === k);
  const pair = (k1, k2) => {
    if (k1 === k2) {
      const list = ofKind(k1);
      return list.length >= 2 ? invariantMass(addFourVectors(list[0], list[1])) : null;
    }
    const a = event.particles.find((p) => p.kind === k1);
    const b = event.particles.find((p) => p.kind === k2);
    return a && b ? invariantMass(addFourVectors(a, b)) : null;
  };
  if (event.channel === "h2gg") masses.mGammaGamma = pair("photon", "photon");
  if (event.channel === "z2mm") masses.mMuMu = pair("muon", "antimuon");
  if (event.channel === "z2ee") masses.mEE = pair("electron", "positron");
  if (event.channel === "ttbar") {
    const lep = event.particles.find((p) => p.kind === "electron" || p.kind === "muon");
    const nu = event.particles.find((p) => p.kind === "neutrino");
    const qs = event.particles.filter((p) => p.kind === "jet" && p.parent === "W−");
    const bs = event.particles.filter((p) => p.kind === "bquark");
    if (lep && nu) masses.mLeptonNu = invariantMass(addFourVectors(lep, nu));
    if (qs.length === 2) masses.mWqq = invariantMass(addFourVectors(qs[0], qs[1]));
    if (qs.length === 2 && bs[1]) masses.mTopHad = invariantMass(addFourVectors(addFourVectors(qs[0], qs[1]), bs[1]));
  }

  return {
    channel: event.channel,
    nParticles: event.particles.length,
    nJets: jets.length,
    jets: jets.map((j) => ({ et: j.et, eta: j.eta, phi: j.phi, nMembers: j.nMembers })),
    metEt: event.met.et,
    metPhi: event.met.phi,
    masses,
    fixture: true,
  };
}

/** Export metadata for the collider lab (mirrors adsExportMetadata). */
export function colliderExportMetadata(state, runtime = {}) {
  const channel = COLLIDER_CHANNELS.includes(state?.colliderChannel) ? state.colliderChannel : COLLIDER_LAB_DEFAULTS.channel;
  let summary = null;
  try {
    summary = eventSummary(syntheticEvent({ channel, seed: 1 }));
  } catch {
    summary = null;
  }
  return {
    colliderLab: {
      view: COLLIDER_LAB_VIEW_ID,
      channel,
      sqrtSGev: COLLIDER_LAB_DEFAULTS.sqrtSGev,
      nParticles: summary?.nParticles ?? null,
      nJets: summary?.nJets ?? null,
      metEt: summary?.metEt ?? null,
      invariantMasses: summary?.masses ?? null,
      fixture: "synthetic — not a CERN observation",
      runtime: { kind: runtime.kind || null, particles: runtime.particles || null },
      provenance: { status: COLLIDER_LAB_PROVENANCE.status },
    },
  };
}
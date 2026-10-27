import test from "node:test";
import assert from "node:assert/strict";

import {
  SPIN_FOAM_LAB_PROVENANCE, SPIN_FOAM_LAB_VIEW_ID, SPIN_FOAM_LAB_DEFAULTS,
  SPIN_TOPOLOGIES, SPIN_LADDER,
  spinLadder, areaSpectrum, triangleAdmissible, intertwinerAdmissible,
  topologyGraph, tetraVolumeCayleyMenger, tetraVolumeFromSpins,
  generateSpinNetwork, simplexProjection, spinFoamSequence,
  spinFoamLabState, spinFoamExportMetadata, registerSpinFoamLabProvenance,
} from "../js/science/spin-networks.mjs";
import { getVisualizationProvenance } from "../js/science/provenance.mjs";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `|${a} − ${b}| > ${eps}`);

test("provenance registers as conjectural with honest boundaries", () => {
  const p = registerSpinFoamLabProvenance();
  assert.deepEqual(p, SPIN_FOAM_LAB_PROVENANCE);
  assert.deepEqual(getVisualizationProvenance(SPIN_FOAM_LAB_VIEW_ID), SPIN_FOAM_LAB_PROVENANCE);
  assert.equal(p.status, "conjectural");
  assert.ok(p.assumptions.some((a) => /established within/i.test(a)));
  assert.ok(p.assumptions.some((a) => /no spin-foam amplitudes are computed/i.test(a)));
});

test("spinLadder: state integer 1–4 maps to spins ≤ jMaxHalf/2", () => {
  assert.deepEqual(spinLadder(1), [0.5]);
  assert.deepEqual(spinLadder(2), [0.5, 1]);
  assert.deepEqual(spinLadder(3), [0.5, 1, 1.5]);
  assert.deepEqual(spinLadder(4), [0.5, 1, 1.5, 2]);
  assert.deepEqual(spinLadder(99), [0.5, 1, 1.5, 2]);
  assert.deepEqual(spinLadder(0), [0.5]);
});

test("areaSpectrum: exact LQG values at γ = 1", () => {
  close(areaSpectrum(0.5), 4 * Math.PI * Math.sqrt(3), 1e-12); // 8π·√(3)/2
  close(areaSpectrum(0.5), 21.7655923708106, 1e-9);
  close(areaSpectrum(1), 8 * Math.PI * Math.SQRT2, 1e-12);
  close(areaSpectrum(1), 35.54306350526693, 1e-9);
  close(areaSpectrum(2), 8 * Math.PI * Math.sqrt(6), 1e-12);
  close(areaSpectrum(0), 0, 1e-12);
  assert.throws(() => areaSpectrum(-1), RangeError);
  assert.throws(() => areaSpectrum(1, { immirzi: 0 }), RangeError);
});

test("triangleAdmissible: exact 3-valent condition", () => {
  assert.ok(triangleAdmissible(0.5, 0.5, 0.5));
  assert.ok(triangleAdmissible(2, 1, 1));
  assert.ok(!triangleAdmissible(2, 0.5, 0.5));
  assert.ok(!triangleAdmissible(1, 1, 3));
});

test("intertwinerAdmissible: exact interval-overlap condition (verified cases)", () => {
  assert.ok(intertwinerAdmissible([2, 2, 0.5, 0.5]));   // sum 5 odd — polygon heuristic would fail
  assert.ok(!intertwinerAdmissible([2, 0.5, 0.5, 0.5])); // max(1.5, 0) = 1.5 > min(2.5, 1) = 1
  assert.ok(intertwinerAdmissible([1, 1, 1, 1]));
  assert.ok(intertwinerAdmissible([0.5, 0.5, 0.5, 0.5]));
  assert.ok(intertwinerAdmissible([3, 1, 1, 1]));        // j12 = 2 works
  assert.ok(!intertwinerAdmissible([3, 0.5, 1, 1]));     // max(2.5, 0) = 2.5 > min(3.5, 2) = 2
  assert.ok(intertwinerAdmissible([2, 2, 2, 0.5]));      // lo = max(0, 1.5) = 1.5 ≤ hi = min(4, 2.5) = 2.5 → j12 = 2 ✓
  assert.throws(() => intertwinerAdmissible([1, 1, 1]), TypeError);
});

test("topologyGraph: K4 and K5 structure", () => {
  const k4 = topologyGraph("tetrahedron");
  assert.equal(k4.nodes.length, 4);
  assert.equal(k4.edges.length, 6);
  assert.equal(k4.valence, 3);
  assert.equal(k4.faces.length, 4);
  const k5 = topologyGraph("four-simplex");
  assert.equal(k5.nodes.length, 5);
  assert.equal(k5.edges.length, 10);
  assert.equal(k5.valence, 4);
  assert.equal(k5.faces.length, 10);
  assert.throws(() => topologyGraph("cube"), TypeError);
});

test("tetraVolumeCayleyMenger: regular tetrahedron and degenerate rejection", () => {
  close(tetraVolumeCayleyMenger([1, 1, 1, 1, 1, 1]), 1 / (6 * Math.SQRT2), 1e-12);
  // [1,1,1,1,1,2]: P3P4 = 2 impossible when both are at distance 1 from P1, P2 (max 1.73).
  assert.equal(tetraVolumeCayleyMenger([1, 1, 1, 1, 1, 2]), null);
  // Scaled regular tetrahedron: V scales as l³.
  close(tetraVolumeCayleyMenger([2, 2, 2, 2, 2, 2]), 8 / (6 * Math.SQRT2), 1e-12);
  assert.throws(() => tetraVolumeCayleyMenger([1, 1, 1, 1, 1]), TypeError);
  assert.throws(() => tetraVolumeCayleyMenger([1, 1, 1, 1, 1, 0]), RangeError);
});

test("tetraVolumeFromSpins: schematic stand-in is deterministic", () => {
  const v = tetraVolumeFromSpins([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
  const l = Math.sqrt(0.75);
  close(v, tetraVolumeCayleyMenger([l, l, l, l, l, l]), 1e-12);
  assert.ok(v > 0);
});

test("generateSpinNetwork: deterministic, all nodes admissible, structure complete", () => {
  for (const topology of SPIN_TOPOLOGIES) {
    for (const jMaxHalf of [1, 2, 3, 4]) {
      for (const seed of [1, 42, 777]) {
        const net = generateSpinNetwork({ topology, seed, jMaxHalf });
        const b = generateSpinNetwork({ topology, seed, jMaxHalf });
        assert.deepEqual(JSON.parse(JSON.stringify(net)), JSON.parse(JSON.stringify(b)));
        assert.equal(net.edges.length, topology === "tetrahedron" ? 6 : 10);
        assert.equal(net.nodes.length, topology === "tetrahedron" ? 4 : 5);
        assert.ok(net.nodes.every((n) => n.admissible), `inadmissible node in ${topology} seed ${seed}`);
        assert.ok(net.edges.every((e) => net.ladder.includes(e.spin)));
        close(net.totalArea, net.edges.reduce((s, e) => s + e.area, 0), 1e-9);
        assert.ok(net.maxSpin <= jMaxHalf / 2 + 1e-9);
      }
    }
  }
});

test("generateSpinNetwork: repair actually engages (high spins get fixed)", () => {
  // jMaxHalf = 4 with many seeds: every result must still be admissible.
  for (let seed = 0; seed < 60; seed++) {
    const net = generateSpinNetwork({ topology: "four-simplex", seed, jMaxHalf: 4 });
    assert.ok(net.nodes.every((n) => n.admissible), `seed ${seed} produced inadmissible node`);
  }
});

test("simplexProjection: even-parity tetrahedron, Schlegel four-simplex", () => {
  const tetra = simplexProjection("tetrahedron");
  assert.equal(tetra.points.length, 4);
  const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  for (let i = 0; i < 4; i++) {
    for (let k = i + 1; k < 4; k++) close(d(tetra.points[i], tetra.points[k]), 2 * Math.SQRT2, 1e-12);
  }
  const simplex = simplexProjection("four-simplex");
  assert.equal(simplex.points.length, 5);
  const center = simplex.points[4];
  close(center.x, 0, 1e-12);
  for (let i = 0; i < 4; i++) close(d(center, simplex.points[i]), Math.sqrt(3), 1e-12);
});

test("spinFoamSequence: deterministic configs with staggered seeds", () => {
  const seq = spinFoamSequence({ topology: "four-simplex", seed: 42, jMaxHalf: 4, steps: 5 });
  assert.equal(seq.steps, 5);
  assert.equal(seq.configs.length, 5);
  const again = spinFoamSequence({ topology: "four-simplex", seed: 42, jMaxHalf: 4, steps: 5 });
  assert.deepEqual(JSON.parse(JSON.stringify(seq)), JSON.parse(JSON.stringify(again)));
  // Config 0 uses the base seed itself.
  const first = generateSpinNetwork({ topology: "four-simplex", seed: 42, jMaxHalf: 4 });
  assert.deepEqual(JSON.parse(JSON.stringify(seq.configs[0])), JSON.parse(JSON.stringify(first)));
});

test("spinFoamLabState: step wrapping and clamps", () => {
  const lab = spinFoamLabState({ topology: "tetrahedron", jMaxHalf: 2, seed: 7, step: 9 });
  assert.equal(lab.topology, "tetrahedron");
  assert.equal(lab.jMaxHalf, 2);
  assert.equal(lab.step, 9 % lab.steps);
  assert.equal(lab.spectrum.length, 2);
  close(lab.spectrum[0].area, areaSpectrum(0.5), 1e-12);
  const clamped = spinFoamLabState({ jMaxHalf: 99, step: -3 });
  assert.equal(clamped.jMaxHalf, 4);
  assert.ok(clamped.step >= 0);
  assert.throws(() => spinFoamLabState({ topology: "cube" }), TypeError);
});

test("export metadata flags the conjectural dynamics", () => {
  const meta = spinFoamExportMetadata({ spinFoamJMax: 3 }, { kind: "spin-foam", faces: 10 });
  assert.equal(meta.spinFoam.view, SPIN_FOAM_LAB_VIEW_ID);
  assert.equal(meta.spinFoam.jMaxHalf, 3);
  assert.ok(/conjectural/.test(meta.spinFoam.dynamics));
  assert.equal(meta.spinFoam.provenance.status, "conjectural");
  assert.equal(SPIN_FOAM_LAB_DEFAULTS.topology, "four-simplex");
  assert.equal(SPIN_LADDER.length, 4);
});
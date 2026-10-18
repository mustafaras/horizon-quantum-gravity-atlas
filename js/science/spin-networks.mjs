/**
 * Spin-network / spin-foam lab — pure combinatorial geometry for Prompt 08.
 *
 * Builds labeled graphs (tetrahedron K4, four-simplex K5) whose edges carry
 * SU(2) spins from the ladder {½, 1, 3/2, 2}, with EXACT admissibility
 * conditions at every node, exact LQG area spectrum, and a schematic
 * Cayley–Menger volume stand-in.
 *
 * Honest boundaries (mirrored in provenance):
 * - The area spectrum A = 8πγ√(j(j+1)) ℓ_P² is established WITHIN the LQG
 *   formalism (it follows from the kinematics); LQG itself is conjectural
 *   as a theory of quantum gravity.
 * - Node admissibility uses the exact recoupling condition (interval
 *   overlap), not the polygon inequality.
 * - Volumes use a documented schematic stand-in (Cayley–Menger on
 *   √(j(j+1)) lengths), NOT the full 6j/9j volume operator.
 * - The spin-foam DYNAMICS (amplitudes) is conjectural and NOT computed:
 *   the foam mode interpolates between independently sampled spin states,
 *   illustrating the sum-over-geometries idea, not a path integral.
 *
 * DOM-free and deterministic: every stochastic generator takes a seed.
 */

import { seededRng } from "../physics.mjs";
import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";

export const SPIN_FOAM_LAB_VIEW_ID = "spin-foam-lab";

export const SPIN_FOAM_LAB_DEFAULTS = Object.freeze({
  topology: "four-simplex",
  jMaxHalf: 4, // state integer 1–4; max spin = jMaxHalf / 2
  seed: 42,
});

export const SPIN_TOPOLOGIES = Object.freeze(["tetrahedron", "four-simplex"]);

/** Allowed spin values (half-integers), frozen shared ladder. */
export const SPIN_LADDER = Object.freeze([0.5, 1, 1.5, 2]);

/** Spins available for a state value jMaxHalf ∈ [1, 4]: j ≤ jMaxHalf/2. */
export function spinLadder(jMaxHalf) {
  const jMax = Math.max(0.5, (Math.trunc(Number(jMaxHalf)) || 1) / 2);
  return SPIN_LADDER.filter((j) => j <= jMax + 1e-9);
}

export const SPIN_FOAM_LAB_PROVENANCE = Object.freeze({
  model: "Spin networks on K4/K5 graphs with SU(2) spins, exact node admissibility and the LQG area spectrum; a spin-foam mode cycles between sampled spin states",
  status: "conjectural",
  assumptions: [
    "The area spectrum A = 8πγ√(j(j+1))·ℓ_P² is established within loop quantum gravity's kinematics; LQG as a theory of our universe is CONJECTURAL",
    "Node admissibility uses the exact SU(2) recoupling condition (interval overlap), not the polygon inequality",
    "Node volumes use a documented schematic stand-in (Cayley–Menger on √(j(j+1)) lengths), not the full 6j/9j volume operator",
    "The spin-foam mode illustrates the sum-over-geometries idea by cycling sampled states; NO spin-foam amplitudes are computed",
    "The four-simplex is drawn as a 3D projection (Schlegel-style) of a genuinely 4-dimensional object",
  ],
  validity: [
    "Admissibility is exact: a 4-valent node admits an intertwiner iff the intervals [max(|s1−s2|,|s3−s4|), min(s1+s2, s3+s4)] contain a half-integer; verified by tests",
    "Area values are exact for the chosen Immirzi parameter; j = ½ gives ≈ 21.77 ℓ_P² at γ = 1",
    "The repair algorithm terminates deterministically: the all-½ assignment is globally admissible, so forcing ½ always converges",
  ],
  numericalMethod:
    "Seeded LCG edge-spin assignment with deterministic repair (resample highest-spin incident edge of the first invalid node, then force ½ to fixpoint); "
    + "exact Cayley–Menger 5×5 determinant for tetrahedron volumes; closed-form area spectrum",
  references: [
    "Prompt 08 spec: docs/superpowers/plans/2026-10-08-ultra-realistic-atlas-prompts.md",
    "Rovelli & Smolin, Nucl. Phys. B442 (1995) 593 (area/volume spectra)",
    "Baez, Adv. Math. 134 (1998) 253 (spin networks and spin foam review)",
    "Ponzano & Regge (1968) (semiclassical 3D spin-foam model)",
  ],
});

export function registerSpinFoamLabProvenance() {
  if (!getVisualizationProvenance(SPIN_FOAM_LAB_VIEW_ID)) {
    registerVisualization(SPIN_FOAM_LAB_VIEW_ID, SPIN_FOAM_LAB_PROVENANCE);
  }
  return SPIN_FOAM_LAB_PROVENANCE;
}

// ---------------------------------------------------------------------------
// Spectra and admissibility (exact)
// ---------------------------------------------------------------------------

/** LQG area spectrum A(j) = 8πγ√(j(j+1)) ℓ_P², in Planck units (ℓ_P = 1). */
export function areaSpectrum(j, { immirzi = 1 } = {}) {
  const s = Number(j);
  if (!(s >= 0)) throw new RangeError("spin must be ≥ 0");
  const gamma = Number(immirzi);
  if (!(gamma > 0)) throw new RangeError("immirzi must be > 0");
  return 8 * Math.PI * gamma * Math.sqrt(s * (s + 1));
}

/** Triangle condition for a 3-valent node: |a−b| ≤ c ≤ a+b (half-integers). */
export function triangleAdmissible(a, b, c) {
  return c >= Math.abs(a - b) - 1e-9 && c <= a + b + 1e-9;
}

/**
 * EXACT intertwiner existence for a 4-valent node with incident spins
 * (s1, s2, s3, s4): an intertwiner exists iff there is a half-integer j12
 * with max(|s1−s2|, |s3−s4|) ≤ j12 ≤ min(s1+s2, s3+s4).
 * Note the polygon/even-sum heuristics are WRONG — e.g. [2,2,½,½] is
 * admissible (sum 5, odd) because j12 = 5/2 works... via interval overlap:
 * max(0, 0) = 0 ≤ j12 ≤ min(4, 1) = 1 → j12 ∈ {0, ½, 1} ✓.
 */
export function intertwinerAdmissible(spins4) {
  if (!Array.isArray(spins4) || spins4.length !== 4) throw new TypeError("intertwinerAdmissible requires 4 spins");
  const [s1, s2, s3, s4] = spins4.map(Number);
  const lo = Math.max(Math.abs(s1 - s2), Math.abs(s3 - s4));
  const hi = Math.min(s1 + s2, s3 + s4);
  if (lo > hi + 1e-9) return false;
  // Any half-integer (multiple of 0.5) in [lo, hi]?
  const first = Math.ceil(lo * 2 - 1e-9) / 2;
  return first <= hi + 1e-9;
}

// ---------------------------------------------------------------------------
// Graph topologies
// ---------------------------------------------------------------------------

/** Complete-graph node/edge structure for the two supported topologies. */
export function topologyGraph(topology) {
  if (topology === "tetrahedron") {
    return {
      topology,
      nodes: [0, 1, 2, 3],
      edges: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]],
      valence: 3,
      faces: [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]],
    };
  }
  if (topology === "four-simplex") {
    return {
      topology,
      nodes: [0, 1, 2, 3, 4],
      edges: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]],
      valence: 4,
      faces: [
        [0, 1, 2], [0, 1, 3], [0, 1, 4], [0, 2, 3], [0, 2, 4],
        [0, 3, 4], [1, 2, 3], [1, 2, 4], [1, 3, 4], [2, 3, 4],
      ],
    };
  }
  throw new TypeError(`unknown topology: ${topology} (expected ${SPIN_TOPOLOGIES.join(" | ")})`);
}

// ---------------------------------------------------------------------------
// Volumes (schematic stand-in, documented)
// ---------------------------------------------------------------------------

/**
 * Cayley–Menger tetrahedron volume from six edge lengths ordered
 * (12, 13, 14, 23, 24, 34). Returns null when no classical embedding
 * exists (det ≤ 0): the labeled graph is quantum-geometric only.
 * Regular edge 1 → V = 1/(6√2) ≈ 0.117851 (det = 4).
 */
export function tetraVolumeCayleyMenger(l6) {
  if (!Array.isArray(l6) || l6.length !== 6) throw new TypeError("tetraVolumeCayleyMenger requires 6 edge lengths");
  const d = l6.map((l) => {
    const v = Number(l);
    if (!(v > 0)) throw new RangeError("edge lengths must be > 0");
    return v * v;
  });
  const [d12, d13, d14, d23, d24, d34] = d;
  const m = [
    [0, 1, 1, 1, 1],
    [1, 0, d12, d13, d14],
    [1, d12, 0, d23, d24],
    [1, d13, d23, 0, d34],
    [1, d14, d24, d34, 0],
  ];
  // Bareiss fraction-free elimination for an exact-ish 5×5 determinant.
  const n = 5;
  const a = m.map((row) => [...row]);
  let sign = 1, prev = 1;
  for (let k = 0; k < n - 1; k++) {
    if (Math.abs(a[k][k]) < 1e-14) {
      let swap = -1;
      for (let i = k + 1; i < n; i++) {
        if (Math.abs(a[i][k]) > 1e-14) { swap = i; break; }
      }
      if (swap < 0) return 0; // singular → degenerate
      [a[k], a[swap]] = [a[swap], a[k]];
      sign = -sign;
    }
    for (let i = k + 1; i < n; i++) {
      for (let j = k + 1; j < n; j++) {
        a[i][j] = (a[i][j] * a[k][k] - a[i][k] * a[k][j]) / prev;
      }
    }
    prev = a[k][k];
  }
  const det = sign * a[n - 1][n - 1];
  if (!(det > 1e-12)) return null;
  return Math.sqrt(det / 288);
}

/**
 * Schematic volume from six spins: classical lengths l = √(j(j+1)) fed to
 * Cayley–Menger. This is a stand-in for the 6j-symbol volume operator —
 * documented as schematic, never presented as the LQG volume.
 */
export function tetraVolumeFromSpins(spins6) {
  if (!Array.isArray(spins6) || spins6.length !== 6) throw new TypeError("tetraVolumeFromSpins requires 6 spins");
  return tetraVolumeCayleyMenger(spins6.map((j) => Math.sqrt(j * (j + 1))));
}

// ---------------------------------------------------------------------------
// Spin-network generation with deterministic repair
// ---------------------------------------------------------------------------

function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

/**
 * Generate a spin network: seeded random spins on every edge, then a
 * deterministic repair loop until every node is admissible.
 *
 * Repair (deterministic, terminating):
 * 1. ≤ 48 passes: find the first invalid node (in node order), resample
 *    its highest-spin incident edge from the ladder with the shared rng.
 * 2. If still invalid: force every incident edge of every invalid node to
 *    ½, repeated to fixpoint (≤ 64 passes). All-½ is globally admissible,
 *    so this always converges.
 */
export function generateSpinNetwork({ topology = SPIN_FOAM_LAB_DEFAULTS.topology, seed = SPIN_FOAM_LAB_DEFAULTS.seed, jMaxHalf = SPIN_FOAM_LAB_DEFAULTS.jMaxHalf } = {}) {
  const graph = topologyGraph(topology);
  const ladder = spinLadder(jMaxHalf);
  if (ladder.length === 0) throw new RangeError("empty spin ladder");
  const rng = seededRng(Number(seed) >>> 0);

  const spins = new Map();
  for (const [a, b] of graph.edges) spins.set(edgeKey(a, b), ladder[Math.floor(rng() * ladder.length)]);

  const incident = new Map();
  for (const n of graph.nodes) incident.set(n, []);
  graph.edges.forEach(([a, b], i) => {
    incident.get(a).push({ edge: i, other: b });
    incident.get(b).push({ edge: i, other: a });
  });

  const nodeSpinsOf = (n) => incident.get(n).map(({ edge }) => spins.get(edgeKeyOf(graph.edges[edge])));

  function edgeKeyOf([a, b]) {
    return edgeKey(a, b);
  }

  const nodeValid = (n) => {
    const s = nodeSpinsOf(n);
    return graph.valence === 4 ? intertwinerAdmissible(s) : triangleAdmissible(s[0], s[1], s[2]);
  };

  const invalidNodes = () => graph.nodes.filter((n) => !nodeValid(n));

  // Pass 1: resample the highest-spin incident edge of the first invalid node.
  for (let pass = 0; pass < 48; pass++) {
    const bad = invalidNodes();
    if (bad.length === 0) break;
    const n = bad[0];
    const inc = incident.get(n);
    let best = inc[0], bestSpin = -1;
    for (const ref of inc) {
      const s = spins.get(edgeKeyOf(graph.edges[ref.edge]));
      if (s > bestSpin) { bestSpin = s; best = ref; }
    }
    spins.set(edgeKeyOf(graph.edges[best.edge]), ladder[Math.floor(rng() * ladder.length)]);
  }

  // Pass 2: force ½ on invalid nodes' incident edges, to fixpoint.
  for (let pass = 0; pass < 64; pass++) {
    const bad = invalidNodes();
    if (bad.length === 0) break;
    for (const n of bad) {
      for (const ref of incident.get(n)) {
        spins.set(edgeKeyOf(graph.edges[ref.edge]), 0.5);
      }
    }
  }

  const remaining = invalidNodes();
  if (remaining.length > 0) throw new Error(`spin-network repair failed to converge for topology ${topology}`);

  // Assemble output.
  const edges = graph.edges.map(([a, b], i) => {
    const j = spins.get(edgeKey(a, b));
    return { index: i, a, b, spin: j, area: areaSpectrum(j) };
  });
  const edgeSpin = (a, b) => spins.get(edgeKey(a, b));
  const nodes = graph.nodes.map((n) => {
    const inc = incident.get(n).map(({ edge }) => ({ edge, spin: spins.get(edgeKeyOf(graph.edges[edge])) }));
    const incidentSpins = inc.map((r) => r.spin);
    const admissible = graph.valence === 4
      ? intertwinerAdmissible(incidentSpins)
      : triangleAdmissible(incidentSpins[0], incidentSpins[1], incidentSpins[2]);
    // Volume: 4-valent nodes carry the tetrahedron of their 4 neighbors
    // (all six mutual edges exist in K5); 3-valent nodes are gauge (0).
    let volume = 0;
    if (graph.valence === 4) {
      const others = incident.get(n).map(({ other }) => other);
      const vspins = [];
      for (let i = 0; i < others.length; i++) {
        for (let k = i + 1; k < others.length; k++) vspins.push(edgeSpin(others[i], others[k]));
      }
      const v = tetraVolumeFromSpins(vspins);
      volume = v ?? 0;
    }
    const weight = volume > 0 ? volume : inc.reduce((s, r) => s + r.spin, 0);
    return { index: n, incident: inc, incidentSpins, admissible, volume, weight };
  });

  const faces = graph.faces.map((tri, i) => {
    const boundary = [edgeSpin(tri[0], tri[1]), edgeSpin(tri[1], tri[2]), edgeSpin(tri[2], tri[0])];
    return { index: i, nodes: tri, spins: boundary, spinSum: boundary[0] + boundary[1] + boundary[2] };
  });

  const totalArea = edges.reduce((s, e) => s + e.area, 0);
  const totalVolume = nodes.reduce((s, n) => s + n.volume, 0);
  const maxSpin = edges.reduce((m, e) => Math.max(m, e.spin), 0);

  return {
    topology,
    seed: Number(seed) >>> 0,
    jMaxHalf: Math.trunc(Number(jMaxHalf)) || 1,
    ladder,
    nodes,
    edges,
    faces,
    totalArea,
    totalVolume,
    maxSpin,
    admissible: true,
  };
}

// ---------------------------------------------------------------------------
// Projection (for rendering)
// ---------------------------------------------------------------------------

/**
 * 3D projection of the graph. Tetrahedron: 4 vertices at the even-parity
 * cube corners (±1,±1,±1) with an even number of minus signs — all pairwise
 * distances 2√2. Four-simplex: Schlegel-style, outer tetrahedron plus the
 * center point; spokes are √3, outer edges 2√2 — an honest projection of a
 * 4D object, labeled as such.
 */
export function simplexProjection(topology) {
  const graph = topologyGraph(topology);
  let points;
  if (topology === "tetrahedron") {
    points = [
      { x: 1, y: 1, z: 1 }, { x: 1, y: -1, z: -1 }, { x: -1, y: 1, z: -1 }, { x: -1, y: -1, z: 1 },
    ];
  } else {
    points = [
      { x: 1, y: 1, z: 1 }, { x: 1, y: -1, z: -1 }, { x: -1, y: 1, z: -1 }, { x: -1, y: -1, z: 1 },
      { x: 0, y: 0, z: 0 },
    ];
  }
  return { topology, points, edges: graph.edges, faces: graph.faces, valence: graph.valence };
}

// ---------------------------------------------------------------------------
// Spin-foam sequence and lab state
// ---------------------------------------------------------------------------

/**
 * A spin foam as a sequence of independently sampled spin-network states
 * (one per "foam step"). Config i uses seed (seed + i·7919) mod 2³² so the
 * sequence is deterministic and stable across state changes.
 */
export function spinFoamSequence({ topology = SPIN_FOAM_LAB_DEFAULTS.topology, seed = SPIN_FOAM_LAB_DEFAULTS.seed, jMaxHalf = SPIN_FOAM_LAB_DEFAULTS.jMaxHalf, steps = 6 } = {}) {
  const n = Math.max(1, Math.min(24, Math.trunc(Number(steps)) || 6));
  const configs = [];
  for (let i = 0; i < n; i++) {
    configs.push(generateSpinNetwork({ topology, seed: (Number(seed) + i * 7919) >>> 0, jMaxHalf }));
  }
  return { topology, seed: Number(seed) >>> 0, jMaxHalf, steps: n, configs };
}

/**
 * Full lab state for the scene: the current step's config plus the whole
 * sequence for foam-mode interpolation.
 */
export function spinFoamLabState({ topology = SPIN_FOAM_LAB_DEFAULTS.topology, jMaxHalf = SPIN_FOAM_LAB_DEFAULTS.jMaxHalf, seed = SPIN_FOAM_LAB_DEFAULTS.seed, step = 0 } = {}) {
  if (!SPIN_TOPOLOGIES.includes(topology)) {
    throw new TypeError(`unknown topology: ${topology} (expected ${SPIN_TOPOLOGIES.join(" | ")})`);
  }
  const j = Math.max(1, Math.min(4, Math.trunc(Number(jMaxHalf)) || 1));
  const s = Number(seed) >>> 0;
  const sequence = spinFoamSequence({ topology, seed: s, jMaxHalf: j });
  const stepIndex = ((Math.trunc(Number(step)) || 0) % sequence.steps + sequence.steps) % sequence.steps;
  const config = sequence.configs[stepIndex];
  const projection = simplexProjection(topology);
  const spectrum = spinLadder(j).map((spin) => ({ spin, area: areaSpectrum(spin) }));
  return {
    topology,
    jMaxHalf: j,
    seed: s,
    step: stepIndex,
    steps: sequence.steps,
    config,
    sequence,
    projection,
    spectrum,
  };
}

/** Export metadata for the spin-foam lab (mirrors adsExportMetadata). */
export function spinFoamExportMetadata(state, runtime = {}) {
  let lab = null;
  try {
    lab = spinFoamLabState({
      topology: SPIN_TOPOLOGIES.includes(state?.spinFoamTopology) ? state.spinFoamTopology : SPIN_FOAM_LAB_DEFAULTS.topology,
      jMaxHalf: state?.spinFoamJMax ?? SPIN_FOAM_LAB_DEFAULTS.jMaxHalf,
      seed: SPIN_FOAM_LAB_DEFAULTS.seed,
    });
  } catch {
    lab = null;
  }
  return {
    spinFoam: {
      view: SPIN_FOAM_LAB_VIEW_ID,
      topology: lab?.topology ?? null,
      jMaxHalf: lab?.jMaxHalf ?? null,
      nodes: lab?.config?.nodes.length ?? null,
      edges: lab?.config?.edges.length ?? null,
      totalAreaPlanck2: lab?.config?.totalArea ?? null,
      maxSpin: lab?.config?.maxSpin ?? null,
      dynamics: "conjectural — amplitudes not computed",
      runtime: { kind: runtime.kind || null, faces: runtime.faces || null },
      provenance: { status: SPIN_FOAM_LAB_PROVENANCE.status },
    },
  };
}
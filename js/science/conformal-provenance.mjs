// Provenance of the three figures of the Penrose atlas (S19): the Minkowski diagram, the maximally extended
// Schwarzschild diagram and the schematic Reissner-Nordstrom block.
//
// The first two are exact: every curve on them is the image of a point of the spacetime under a written coordinate map.
// The third is a labelled schematic and says so wherever it appears, in the canvas and in the caption.

import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";
import { REF } from "./references.mjs";

const MAP_ASSUMPTIONS = [
  "A conformal map scales the metric by a positive factor and therefore preserves every null direction, but it does not preserve lengths, areas or proper times: the vertical distance between two events on these diagrams is not a duration and the horizontal distance is not a length",
  "The compactification applies the same monotone function, arctan, to both null coordinates; that is what keeps null rays at exactly 45 degrees. Because arctan is applied and not a function of the Kruskal coordinates that differs between U and V, the 45-degree property is exact arithmetic, not an approximation",
  "Region III is the image of region I under the isometry (U, V) -> (-U, -V), which reverses the sense of the Killing field: its future is the mirror of region I's future, so its i+ sits at (-pi/2, -pi/2). Drawing it with region I's time arrow would make the diagram say something false about which way its observers fall (ledger D-114)",
  "Units are G = c = 1, so M is a length and the diagrams carry no scale: the same picture serves every mass, and the only thing that sets where a worldline starts is the ratio r0/M",
];

const BASE = {
  "gr-penrose-atlas": {
    model: "Three conformal diagrams side by side: flat Minkowski spacetime on its causal diamond; the maximally extended Schwarzschild solution in Kruskal-Szekeres coordinates, compactified, with its four regions, its two singularities and its four horizons; and one block of the Reissner-Nordstrom maximal extension as a labelled schematic. Coordinate lines of constant t and constant r, every horizon and singularity, and four worldlines of the Schwarzschild panel (radial free fall from rest at r0 as the one focal curve, a static observer at r0, and the outgoing and ingoing radial null rays)",
    status: "established",
    assumptions: [...MAP_ASSUMPTIONS,
      "The free fall is the exact closed-form radial geodesic from rest at r0: r = (r0/2)(1 + cos eta), tau = sqrt(r0^3/8M)(eta + sin eta), with the exterior coordinate time t(eta) that accompanies it. Both closed forms are checked in test/conformal.test.mjs against numerical integrations of the geodesic equation, and the Kruskal pair of the same eta satisfies UV = rho(r) to 1e-13 along the whole curve, which is what carries it through the horizon",
      "The maximally extended Schwarzschild diagram is a solution of the vacuum field equations. It is not the spacetime of a collapsed star, and its region III has no counterpart in one; the caption says so",
      "The worldline drawn is the free fall from rest at the slider's r0, which starts at t = 0 in the exterior chart. It is one geodesic, not a family, and the static observer beside it is a different observer at the same radius, not a frame transformation",
    ],
    validity: ["The exact maps are valid for every r > 0 in every region of the maximal extension, and for the flat spacetime they are global", "The Reissner-Nordstrom panel is valid as a qualitative statement of the nesting r > r+, r- < r < r+, r < r- and of the timelike character of r = 0; it is not a computed solution and the maximal extension is an infinite chain of such blocks rather than the one drawn"],
    numericalMethod: "The maps are evaluated directly (js/science/conformal.mjs): arctan of the two null coordinates, and for Schwarzschild the Kruskal pair from the tortoise r* = r + 2M ln|r/2M - 1| through the identity UV = rho(r) = (1 - r/2M)e^(r/2M), inverted by 240-step bisection on each branch. Coordinate lines, boundaries and worldlines are sampled polylines of those maps at 96 to 361 points; the light-cone glyphs are two segments at exactly 45 degrees. The singularity lines are triangle-wave polylines generated in js/visualizations/gr/penrose-geometry.mjs, never a texture",
    references: [REF.KRUSKAL_1960, REF.PENROSE_1965, REF.HAWKING_ELLIS, REF.GRIFFITHS_PODOLSKY, REF.MTW],
    layers: [{ name: "Coordinate lines, horizons, singularities, boundaries and the four worldlines", class: "model" }, { name: "The singularity zig-zag and the light-cone glyphs", class: "decoration" }],
    seed: "none: every point is deterministic",
  },
  "gr-penrose-minkowski": {
    model: "Flat Minkowski spacetime on its conformal diamond: the coordinate lines of t and r, the null rays of the four null-infinity edges, the four infinity points i-, i+, i0, and the light-cone structure that the map preserves",
    status: "established",
    assumptions: [...MAP_ASSUMPTIONS, "The diagram is the maximal extension of flat spacetime itself: the boundary is infinity, not a horizon, so nothing on it can be crossed"],
    validity: ["Global: the map covers every event of Minkowski spacetime, at every t and r"],
    numericalMethod: "U = arctan(t - r), V = arctan(t + r), T = (U + V)/2, R = (V - U)/2, evaluated directly; the boundary is the limit |U| -> pi/2 or |V| -> pi/2 and is drawn at that limit",
    references: [REF.PENROSE_1965, REF.HAWKING_ELLIS],
    layers: [{ name: "Coordinate lines and the causal diamond", class: "model" }, { name: "The infinity labels", class: "decoration" }],
    seed: "none",
  },
  "gr-penrose-schwarzschild": {
    model: "The maximally extended Schwarzschild solution in compactified Kruskal-Szekeres coordinates: the four regions I to IV, the four horizon segments on the diagonals, the two spacelike singularities at r = 0, the four infinity points, and the region's null infinity on both sides",
    status: "established",
    assumptions: [...MAP_ASSUMPTIONS, "The diagram shows the analytic extension of the vacuum solution and not the collapse of matter; a real black hole formed by collapse has no region III and no past singularity, and its diagram stops at the collapsing matter"],
    validity: ["Every r > 0 in every region, and the horizons themselves in the limit U -> 0 or V -> 0", "The exterior chart is static only outside r = 2M; the interior is not static and the drawn t coordinate diverges at the horizon, which is why the worldlines are carried by U and V rather than by t"],
    numericalMethod: "The Kruskal pair comes from the tortoise coordinate through UV = rho(r) = (1 - r/2M)e^(r/2M), with the sign of each coordinate set by the region (js/science/conformal.mjs). The singularities are at rho = 1 and map to T = +-pi/2; the horizons are at rho = 0 and map to T = +-R. The free fall is the closed-form radial geodesic from rest at r0 and the static observer is t -> +-infinity at fixed r0; both satisfy the geodesic equation and UV = rho along the curve to 1e-13",
    references: [REF.KRUSKAL_1960, REF.PENROSE_1965, REF.HAWKING_ELLIS, REF.MTW],
    layers: [{ name: "Coordinate lines, horizons, singularities, infinity and the worldlines", class: "model" }, { name: "The singularity zig-zag and the proper-time light-cone glyphs", class: "decoration" }],
    seed: "none",
  },
  "gr-penrose-reissner-nordstrom": {
    model: "One block of the maximal extension of Reissner-Nordstrom with 0 < |Q| < M, drawn as a labelled schematic: the exterior region r > r+, the region between the two horizons r- < r < r+, and the region 0 < r < r- bounded by a timelike singularity, with both r+ and r- null",
    status: "schematic",
    assumptions: ["This panel is a SCHEMATIC and is labelled as one. It is not obtained from a coordinate map: the exact Reissner-Nordstrom maximal extension is an infinite chain of such blocks joined at the inner horizons, with a timelike singularity, and the drawn block is one link of that chain with the standard nesting of the three regions",
      "The drawing asserts three things and no more: r+ and r- are null surfaces, the singularity at r = 0 is timelike rather than spacelike, and r decreases inward through all three regions in that order",
      "The inner horizon is a Cauchy horizon: the future of the block is not determined by data on it, which is what makes the exact global structure, and not just this drawing, hard to state",
      "Charged black holes are astrophysically marginal: a black hole of a few solar masses that carried the charge it would need to make |Q| comparable with M would be neutralised by the surrounding plasma almost immediately, so this panel is about the mathematical structure of the solution and not about an object expected to be found"],
    validity: ["A qualitative statement of the causal structure of the exact solution, not a computed one"],
    numericalMethod: "Explicit polylines in the same (R, T) layout as the exact panels, with every null edge at exactly 45 degrees (checked in test/conformal.test.mjs); the zig-zag of the singularity is generated, not a texture",
    references: [REF.REISSNER_1916, REF.GRAVES_BRILL_1960, REF.CARTER_1968, REF.GRIFFITHS_PODOLSKY, REF.HAWKING_ELLIS],
    layers: [{ name: "The two horizons, the singularity and the three regions", class: "model" }, { name: "The singularity zig-zag", class: "decoration" }],
    seed: "none",
  },
};

export const CONFORMAL_PROVENANCE = Object.freeze(BASE);

/** Idempotent registration of the atlas's figures in the shared provenance registry. */
export function registerConformalProvenance() {
  for (const [id, entry] of Object.entries(CONFORMAL_PROVENANCE)) {
    if (!getVisualizationProvenance(id)) registerVisualization(id, entry);
  }
}

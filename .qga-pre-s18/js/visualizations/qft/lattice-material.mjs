/**
 * The surface of the lattice lab (S14): one plane mesh with a vertex per lattice site, drawn by a TSL node material that reads the
 * simulation's storage buffers in the vertex stage (js/visualizations/qft/lattice-gpu.mjs). Nothing is uploaded per frame: the height is phi
 * at the vertex, the colour is the energy density above the vacuum through the kit's field heat map (sequential, viridis), the engraved grid
 * is the kit's line coverage every 16 cells, and the focal contour is the line phi = 0 (the core of a kink).
 *
 * The energy density is the buffer the analysis kernel filled with the Formula Core expression qft-phi4-hamiltonian. The Formula Lens
 * (js/visualizations/common/lens-scenes.mjs) adds its terms as further colours behind one uniform each, using the varyings returned in `nodes`.
 */

import { DoubleSide, MeshBasicNodeMaterial } from "three/webgpu";
import * as TSL from "three/tsl";
import * as TK from "../../design/tokens.mjs";
import { fieldColorNode, lineCoverage, paletteTexture } from "../../render/materials/index.mjs";

const { max, mix, positionLocal, sqrt, uniform, varying, vec3, vec4, vertexIndex } = TSL;

export const LATTICE_SIZE = 11.5; // world units across the plane
const GRID_EVERY = 16; // sites between engraved grid lines
const GRID_WIDTH_PX = 1;
const GRID_GAIN = 0.75;
const HEAT_DIM = 0.55;
const CONTOUR_WIDTH_PX = 2.2;
const CONTOUR_RANGE_FACTOR = 4; // the contour coordinate is phi / (4 x the display scale), so only the line phi = 0 falls inside the field
const CONTOUR_COLOR = "pigment-amber-80";

/**
 * @param lattice  the createLatticeGpu() result
 * @param scales   { height, energy, phi } from presetStart (phi: the 99th percentile of |phi|)
 * @param contour  whether the phi = 0 contour is drawn at first (the kink preset)
 * @returns { material, nodes, uniforms, lut } where nodes are the varyings the Formula Lens binds ({ phi, pi, g2, m2, lambda })
 */
export function createLatticeMaterial({ lattice, scales, contour }) {
  const { buffers, uniforms: simulation, n } = lattice;
  const uniforms = { height: uniform(scales.height), vacuum: uniform(0), contour: uniform(contour ? 1 : 0) };
  const phi = buffers.phi.element(vertexIndex);

  const material = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  material.positionNode = vec3(positionLocal.x, phi.mul(uniforms.height), positionLocal.z);

  const nodes = {
    phi: varying(phi, "latticePhi"),
    pi: varying(buffers.momentum.element(vertexIndex), "latticePi"),
    g2: varying(buffers.gradient.element(vertexIndex), "latticeGradient"),
    m2: simulation.mass2,
    lambda: simulation.lambda,
  };
  const energy = varying(buffers.energy.element(vertexIndex).sub(uniforms.vacuum), "latticeEnergy");

  const lut = paletteTexture({ range: [0, 1], palette: "sequential", paletteName: "viridis" });
  const heat = fieldColorNode(sqrt(max(energy, 0)), [0, Math.sqrt(scales.energy)], lut);
  const cell = (LATTICE_SIZE / n) * GRID_EVERY;
  const grid = max(lineCoverage(positionLocal.x.div(cell), GRID_WIDTH_PX), lineCoverage(positionLocal.z.div(cell), GRID_WIDTH_PX));
  const line = lineCoverage(nodes.phi.div(CONTOUR_RANGE_FACTOR * scales.phi), CONTOUR_WIDTH_PX).mul(uniforms.contour);
  const [r, g, b] = TK.linear(CONTOUR_COLOR);
  const surface = mix(heat.mul(HEAT_DIM), heat, grid.mul(GRID_GAIN));
  material.colorNode = vec4(mix(surface, vec3(r, g, b), line), 1);
  material.userData.qgaNodeKit = true;
  material.userData.kit = "qft-lattice";
  return { material, nodes, uniforms, lut };
}

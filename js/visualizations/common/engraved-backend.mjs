// Backend selection for engraved lines (S06, D-028).
//
// Two line implementations ship, both vendored from the pinned three 0.186.1 tarball:
//   "node"    lines/webgpu/Line2 + Line2NodeMaterial (TSL). Runs on the WebGPU renderer and on the node
//             renderer's WebGL2 backend. Used whenever the scene can reach a node renderer.
//   "classic" lines/Line2 + LineMaterial. Used wherever the scene is drawn by the classic WebGLRenderer:
//             no navigator.gpu, ?render=webgl2 / settings.renderBackend "webgl2", or a recovery rebuild
//             after the node renderer failed. LineMaterial is a ShaderMaterial, so a scene holding one
//             can never use the node renderer; the choice therefore has to be made BEFORE the scene is built.
//
// The node module imports "three/webgpu" (2.2 MB), so it is loaded lazily and only when selected.

const BACKENDS = new Map();
let current = null;

/** Mirrors create-renderer.mjs: the node renderer is attempted exactly when WebGPU exists and nothing forces WebGL2. */
export function resolveEngravedBackendKind({ hasWebGPU = !!globalThis.navigator?.gpu, forceBackend = null, recovery = false } = {}) {
  if (![null, "auto", "webgpu", "webgl2", "static"].includes(forceBackend)) throw new RangeError(`Invalid forceBackend: ${forceBackend}`);
  if (recovery || !hasWebGPU || forceBackend === "webgl2" || forceBackend === "static") return "classic";
  return "node";
}

async function loadClassic() {
  const [{ Line2 }, { LineSegments2 }, { LineGeometry }, { LineSegmentsGeometry }, { LineMaterial }, three] = await Promise.all([
    import("three/addons/lines/Line2.js"), import("three/addons/lines/LineSegments2.js"),
    import("three/addons/lines/LineGeometry.js"), import("three/addons/lines/LineSegmentsGeometry.js"),
    import("three/addons/lines/LineMaterial.js"), import("three"),
  ]);
  return { kind: "classic", Line2, LineSegments2, LineGeometry, LineSegmentsGeometry, LineMaterial, three };
}

async function loadNode() {
  const [{ Line2 }, { LineSegments2 }, { LineGeometry }, { LineSegmentsGeometry }, webgpu, tsl] = await Promise.all([
    import("three/addons/lines/webgpu/Line2.js"), import("three/addons/lines/webgpu/LineSegments2.js"),
    import("three/addons/lines/LineGeometry.js"), import("three/addons/lines/LineSegmentsGeometry.js"),
    import("three/webgpu"), import("three/tsl"),
  ]);
  const { Line2NodeMaterial } = webgpu;
  /**
   * Line2NodeMaterial blends by sampling the opaque scene when `transparent` is set, and its blending is NoBlending.
   * Engraved lines use real framebuffer blending instead (so halos, additive glow and overlap with other
   * transparent objects are right), which means that sampling branch must not be built.
   */
  class EngravedLine2NodeMaterial extends Line2NodeMaterial {
    setupDiffuseColor(builder) {
      const transparent = this.transparent;
      this.transparent = false;
      try { super.setupDiffuseColor(builder); } finally { this.transparent = transparent; }
    }
  }
  return { kind: "node", Line2, LineSegments2, LineGeometry, LineSegmentsGeometry, NodeMaterial: EngravedLine2NodeMaterial, tsl, three: webgpu };
}

/** Load (once) and select the backend for the scene that is about to be built. Returns the backend. */
export async function prepareEngravedLines(options = {}) {
  const kind = resolveEngravedBackendKind(options);
  if (!BACKENDS.has(kind)) BACKENDS.set(kind, kind === "node" ? loadNode() : loadClassic());
  current = await BACKENDS.get(kind);
  return current;
}

/** The backend chosen by the last prepareEngravedLines(); throws when a scene is built before it. */
export function engravedBackend() {
  if (!current) throw new Error("Engraved lines used before prepareEngravedLines() selected a backend.");
  return current;
}

/** Test seam: install a backend (or null). */
export function setEngravedBackend(backend) { current = backend; }

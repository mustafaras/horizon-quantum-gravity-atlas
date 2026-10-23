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
   *
   * The quad is ENGRAVED_PAD_PX wider than the line and the edge coverage is computed analytically from the
   * distance to the centre line, so the edges are anti-aliased even where the target has no MSAA (the node
   * renderer's WebGL2 backend, a post-processing scene pass with samples 0, the software renderer).
   */
  const { uniform, uv, float, clamp, screenDPR, materialLineWidth, diffuseColor } = tsl;
  class EngravedLine2NodeMaterial extends Line2NodeMaterial {
    constructor(parameters) {
      super(parameters);
      this.engravedWidth = uniform(1);
    }

    // The pipeline reads `alphaToCoverage` to enable alpha-to-coverage, which on top of real blending attenuates
    // the edge twice (measured: 2.5 px reads 2.06 px on WebGPU). The shader keeps its own cap smoothing through
    // `_useAlphaToCoverage`, so only the pipeline-facing accessor reports false.
    get alphaToCoverage() { return false; }

    set alphaToCoverage(value) { this._useAlphaToCoverage = value; }

    setupDiffuseColor(builder) {
      const transparent = this.transparent;
      this.transparent = false;
      try { super.setupDiffuseColor(builder); } finally { this.transparent = transparent; }
      const halfQuad = materialLineWidth.mul(screenDPR).mul(0.5);
      const halfLine = float(this.engravedWidth).mul(screenDPR).mul(0.5);
      diffuseColor.a.mulAssign(clamp(halfLine.sub(uv().x.abs().mul(halfQuad)).add(0.5), 0, 1));
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

/**
 * prepareEngravedLines() for a scene about to be built under the live atlas settings. The forced backend is
 * resolved exactly as render-session.mjs does (page option first, then the settings tweak), so a scene and its
 * renderer agree. `recovery` rebuilds on the classic lines after the node renderer failed.
 */
export function prepareEngravedLinesFor(settings = {}, { recovery = false } = {}) {
  const forced = globalThis.QGA_RENDER_OPTIONS?.forceBackend ?? (settings.renderBackend === "auto" ? null : settings.renderBackend ?? null);
  return prepareEngravedLines({ forceBackend: forced, recovery });
}

/** The backend chosen by the last prepareEngravedLines(); throws when a scene is built before it. */
export function engravedBackend() {
  if (!current) throw new Error("Engraved lines used before prepareEngravedLines() selected a backend.");
  return current;
}

/** Test seam: install a backend (or null). */
export function setEngravedBackend(backend) { current = backend; }

// qft-compute-lab.jsx — the vacuum-fluctuations lab of the QFT module (Prompt 07): the Fourier-mode free field as a time waterfall, read as the field,
// its correlation function or a schematic flux tube. Moved unchanged from js/mod-qft.jsx in S15 so that the module could take the Casimir cavity
// without growing; the computation is js/science/qft-fields.mjs (window.QGA_LABS).

/* ---------- Prompt 07: vacuum fluctuations compute lab (Fourier-mode field) ---------- */
function QftComputeLab() {
  const [state, setState] = useQGAState();
  const mode = state.qftLabMode;
  const mass = state.qftLabMass;
  const seed = state.seed;

  const build = async (ctx) => {
    const LABS = window.QGA_LABS;
    if (!LABS) throw new Error("Compute-lab module unavailable");
    const { createQftFieldLabRuntime } = await LABS.loadQftLab();
    ctx.scene.fog = new ctx.THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.016);
    const runtime = createQftFieldLabRuntime({ seed, mass, mode, showParticles: true });
    ctx.scene.add(runtime.mesh);
    ctx.label(mode === "flux"
      ? "SCHEMATIC · flux-tube profile — a modelled cross-section, not a lattice-QCD result"
      : "EFFECTIVE · free Klein–Gordon vacuum — Fourier modes to the disclosed cutoff k ≤ 14",
    () => ({ x: -4.2, y: 3.2, z: -3.4 }), "s3d-strong");
    ctx.label("each row is one time slice · the front row is the field right now",
    () => ({ x: 2.6, y: -1.6, z: 3.4 }), "s3d-quiet");
    return {
      update: (t) => {
        runtime.sync({ time: t, motion: ctx.motion() === 0 ? 0 : 1 });
        window.__qgaQftLab = { kind: runtime.kind, mode, mass, ...runtime.stats() };
      },
      prepare: (renderer) => runtime.prepare(renderer),
      compute: (renderer, dt) => runtime.compute(renderer, dt),
      dispose: () => {
        runtime.dispose();
        delete window.__qgaQftLab;
      },
      recoverable: () => false,
    };
  };

  return (
    <div className="viz-frame">
      <div className="viz-toolbar lab-toolbar">
        <div className="kerr-control-group" aria-label="Vacuum lab view">
          <span className="kerr-control-label">View</span>
          {[
            ["field", "Field φ(x, t)"], ["correlation", "Correlation ⟨φφ⟩"], ["flux", "Flux tube"],
          ].map(([key, label]) => (
            <button key={key} className={"kerr-chip" + (mode === key ? " on" : "")}
            aria-pressed={mode === key} onClick={() => setState({ qftLabMode: key })}>{label}</button>
          ))}
        </div>
        <SliderRow label="mass m" min={0} max={3} step={0.05} value={mass}
        onChange={(v) => setState({ qftLabMass: v })} format={(v) => v.toFixed(2)}></SliderRow>
      </div>
      <Scene3D animated="motion" nodeKit height={420} aria="Three-dimensional waterfall of a free quantum field vacuum built from Fourier modes; the view switches between field amplitude, equal-time correlation and a schematic flux tube"
      initial={{ radius: 15.5, theta: 0.55, phi: 1.06, minR: 6, maxR: 34, bloom: { strength: 0.62, radius: 0.5, threshold: 0.2 } }}
      build={build} deps={[mode, mass, seed]}
      fallback={<div className="lab-fallback">The 3-D vacuum lab needs WebGL; the module numerics remain available via the export.</div>}></Scene3D>
      <VizCaption provenanceId={mode === "flux" ? "qft-flux-tube" : "qft-field-lab"} status={mode === "flux" ? "schematic" : "effective"}>
        {mode === "flux" ? (
          <>The tube is a <strong>schematic</strong> cross-section of a confining flux tube (a transverse
            Gaussian profile whose width shrinks as the string tension grows); it illustrates the shape of the
            energy distribution quoted in the literature, not a lattice-QCD computation. The underlying field
            rows remain the same effective free-field modes.</>
        ) : mode === "correlation" ? (
          <>The highlighted curve is the equal-time two-point correlation ⟨φ(x)φ(x+r)⟩ of exactly the field
            drawn here, measured over 96 sample separations — the free-field result computed numerically, not
            fitted. Correlations decay faster as the mass grows: the mass gap suppresses long-distance
            entanglement, which is why the nuclear force is short-ranged.</>
        ) : (
          <>The vacuum is rendered as a superposition of plane-wave modes with frequencies
            <Eq tex="\omega_k=\sqrt{k^2+m^2}"></Eq>, amplitudes drawn from a seeded distribution and truncated at
            a disclosed cutoff k ≤ 14 — an <strong>effective</strong> free field, not the interacting vacuum.
            Bright sprites mark local maxima of the newest slice: the “particle” reading of the same field.
            Change m and watch the temporal oscillation at k = 0 speed up or stop.</>
        )}
      </VizCaption>
    </div>);

}

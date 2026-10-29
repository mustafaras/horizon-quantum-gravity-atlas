// S23: the one quantitative cross-program comparison the field has.
function SpectralDimensionChart() {
  const D = window.QGA_SPECTRAL_DIMENSION;
  const spec = useMemo(() => window.QGA_FIGURE.plots.spectralDimension.spectralDimensionSpec(), []);
  const summary = D.convergenceSummary();
  return (
    <div className="viz-frame spectral-chart" id="approaches-spectral-dimension">
      <div className="spectral-intro">
        <span className="constraint-kicker">01 / THE ONLY QUANTITATIVE COMPARISON</span>
        <h3>How many dimensions does a random walk see?</h3>
        <p>
          A diffusion process measures the dimension it moves in: the return probability falls as
          <Eq tex="P(\sigma)\propto\sigma^{-d_s/2}"></Eq>, so <Eq tex="d_s"></Eq> is the number of dimensions the walk
          actually explores at the scale it has reached. Five programs predict the same shape — four at large scales,
          two at short ones — and this is the one place where the field can compare them on one axis.
        </p>
      </div>
      <Figure spec={spec}></Figure>
      <div className="spectral-detail">
        <div className="spectral-list" role="list">
          {D.SPECTRAL_DIMENSION.map((entry, i) => (
            <div key={entry.id} className="spectral-row" role="listitem">
              <span className="spectral-swatch" style={{ background: `var(--cat-${i + 1})` }} aria-hidden="true"></span>
              <div>
                <strong>{entry.label}</strong>
                <span className="spectral-values" title="infrared to ultraviolet">{entry.ir} → {entry.uv} <small>IR→UV</small></span>
                <span className={'spectral-kind' + (entry.kind === 'measured' ? ' measured' : '')}>
                  {entry.kind === 'measured' ? 'measured on the theory' : 'computed estimate'}
                </span>
                <p className="spectral-note">{entry.note}</p>
                <a href={entry.source.reference.match(/https:\/\/[^\s,;]+/)?.[0] ?? '#'} target="_blank" rel="noreferrer">
                  {entry.source.reference.split(',')[0]} ↗
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="spectral-warning">
          <strong>Read this as a shape, not a measurement.</strong> {summary.count} of {summary.total} programs run
          from about 4 toward about 2, but each defines <Eq tex="d_s"></Eq> differently — a lattice diffusion
          measurement, a functional renormalisation-group anomalous dimension, a semiclassical spin-foam estimate and
          an anisotropic-scaling exponent are not interchangeable. The scale axis is schematic because no program
          publishes its crossover length.
        </p>
      </div>
      <VizCaption provenanceId="approaches-spectral-dimension" status="effective">
        <Eq tex="d_s"></Eq> collected from five programs and read against Carlip's review. Only the 4D CDT entry is a
        diffusion measured on the theory's own configurations; the rest are analytic or semi-analytic estimates, and
        they are drawn dashed to say so. The shared 4 → 2 shape is a qualitative agreement, not a measurement of a
        common theory, and no experiment measures <Eq tex="d_s"></Eq> at either end.
      </VizCaption>
    </div>
  );
}

// S23: the CDTs themselves — a triangulated cylinder with the diffusion painted on it.
function CdtLab() {
  const C = window.QGA_CDT;
  const reduced = usePRM();
  const [slices, setSlices] = useState(24);
  const [targetVolume, setTargetVolume] = useState(8);
  const [seed, setSeed] = useState(42);

  const run = useMemo(() => C.thermalize({ slices, targetVolume, seed, sweeps: 240 }), [slices, targetVolume, seed]);
  const graph = useMemo(() => C.dualNeighbours(run.profile), [run]);
  // The cylinder's own dual graph is degree-irregular whenever neighbouring slices differ in volume, so its d_s
  // drifts with the profile. The honeycomb — the dual of a *flat* triangulation — is the clean control that shows
  // the estimator reading two dimensions, and it is what the readout quotes.
  const flat = useMemo(() => C.spectralDimensionOnFlat({ width: 24, height: 24, walkers: 1200, seed }), [seed]);
  const dsMean = flat.mean;
  const state = useRef({ profile: run.profile, seed });
  state.current = { profile: run.profile, seed };

  const build = async (ctx) => {
    const { createCdtRuntime } = await window.QGA_LABS.loadCdt();
    const runtime = createCdtRuntime({ ...state.current, engraved: ctx.engraved });
    ctx.scene.add(runtime.group);
    if (typeof ctx.mountOverlay === "function" && globalThis.document) {
      const chip = globalThis.document.createElement("div");
      chip.className = "s3d-label s3d-strong cdt-status";
      chip.textContent = "CONJECTURAL · 2D CDT cylinder";
      ctx.mountOverlay(chip);
    }
    window.__qgaCdt = runtime.stats();
    const still = reduced;
    if (still) runtime.completeReveal();
    return {
      isAnimated: () => !still,
      update: (t) => { if (!still && runtime.tick(t)) ctx.invalidate(); window.__qgaCdt = runtime.stats(); },
      dispose: () => { runtime.dispose(); delete window.__qgaCdt; },
    };
  };

  return (
    <div className="viz-frame cdt-lab" id="approaches-cdt">
      <div className="viz-toolbar">
        <SliderRow label="time slices" min={8} max={48} step={4} value={slices} onChange={setSlices}
          format={(v) => String(v)}></SliderRow>
        <SliderRow label="triangles per slice" min={3} max={16} step={1} value={targetVolume} onChange={setTargetVolume}
          format={(v) => String(v)}></SliderRow>
        <label className="cdt-seed">
          seed
          <input type="range" min={1} max={99} step={1} value={seed}
            onChange={(e) => setSeed(Number(e.target.value))} aria-label="cdt seed"></input>
          <strong>{seed}</strong>
        </label>
      </div>
      <Scene3D animated="motion" nodeKit height={420}
        aria="A triangulated cylinder of two-dimensional causal dynamical triangulations: horizontal rings are time slices, and the triangles are coloured by how much the diffusion has visited them."
        initial={{ radius: 15, theta: 0.5, phi: 1.25, target: [0, 0, 0], minR: 8, maxR: 34 }}
        build={build} deps={[slices, targetVolume, seed, reduced]}
        fallback={<div className="lab-fallback">The cylinder needs WebGL. The profile and the spectral dimension below are still computed.</div>}></Scene3D>
      <div className="readout-grid cdt-readouts" aria-live="polite">
        <div className="readout">
          <div className="readout-label">volume per slice</div>
          <div className="readout-value">{run.meanVolume.toFixed(2)}<span className="unit">triangles</span></div>
          <div className="readout-note">target {targetVolume}; spread {run.spreadVolume.toFixed(2)}, range {run.minVolume}–{run.maxVolume}</div>
        </div>
        <div className="readout">
          <div className="readout-label">triangulation</div>
          <div className="readout-value">{run.triangles}<span className="unit">triangles</span></div>
          <div className="readout-note">fixed volume: the pair moves conserve N₂ exactly; dual degrees {Object.entries(graph.degreeHistogram).map(([d, n]) => `${n}×${d}`).join(', ')}</div>
        </div>
        <div className="readout">
          <div className="readout-label">sweeps accepted</div>
          <div className="readout-value">{run.accepted}<span className="unit">of {run.proposed}</span></div>
          <div className="readout-note">Metropolis with an explicit exp(−ΔS) at λ = {run.lambda}</div>
        </div>
        <div className="readout">
          <div className="readout-label">measured d_s</div>
          <div className="readout-value">{Number.isFinite(dsMean) ? dsMean.toFixed(2) : '—'}<span className="unit">σ 3–8</span></div>
          <div className="readout-note">on the flat honeycomb control, 1200 walkers; the cylinder's own dual is degree-irregular</div>
        </div>
      </div>
      <VizCaption provenanceId="approaches-cdt" status="conjectural">
        Two-dimensional CDT: a cylinder of time slices, relaxed by volume-conserving Metropolis moves. Each ring is a
        slice; the triangles are coloured by the return probability of the diffusion that measures
        <Eq tex="d_s = -2\,d\ln P/d\ln\sigma"></Eq>. The simulation is exact arithmetic and the estimator is tested
        against a flat triangulation, where it returns <Eq tex="d_s = 2"></Eq>; CDT as a theory of quantum gravity is
        conjectural, and two dimensions reproduce the method, not the four-dimensional result.
      </VizCaption>
    </div>
  );
}

// S23: the free open bosonic string, level by level.
function StringSpectrumLab() {
  const S = window.QGA_STRING;
  const [maxLevel, setMaxLevel] = useState(6);
  const rows = useMemo(() => S.spectrumRows(maxLevel), [maxLevel]);
  const spec = useMemo(() => window.QGA_FIGURE.plots.stringSpectrum.stringSpectrumSpec(maxLevel), [maxLevel]);
  const steps = useMemo(() => S.criticalDimensionSteps(), []);
  return (
    <div className="viz-frame string-lab" id="approaches-string-spectrum">
      <div className="viz-toolbar">
        <SliderRow label="max level N" min={2} max={8} step={1} value={maxLevel} onChange={setMaxLevel}
          format={(v) => String(v)}></SliderRow>
      </div>
      <Figure spec={spec}></Figure>
      <div className="string-steps" role="list" aria-label="The critical-dimension derivation">
        {steps.map((step, i) => (
          <div key={step.id} className="string-step" role="listitem">
            <span className="string-step-num" aria-hidden="true">{i + 1}</span>
            <div>
              <p>{step.statement}</p>
              <Eq tex={step.tex}></Eq>
            </div>
          </div>
        ))}
      </div>
      <VizCaption provenanceId="approaches-string-spectrum" status="established">
        The free open bosonic string. The mass formula <Eq tex="\alpha'M^2 = N - 1"></Eq> is exact, and the level
        degeneracies are the coefficients of <Eq tex="\prod_{n\ge1}(1-q^n)^{-24}"></Eq> — twenty-four transverse
        oscillators supplying <Eq tex="N"></Eq> units of level. The ground state at <Eq tex="N=0"></Eq> has negative
        mass squared: the tachyon is a property of the bosonic theory, not an artefact, and it is why the superstring
        replaces it. The five steps below derive <Eq tex="D=26"></Eq> from the normal-ordering constant.
      </VizCaption>
    </div>
  );
}

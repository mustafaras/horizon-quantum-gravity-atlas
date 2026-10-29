// S22: the causal-set laboratory. A sprinkle you can change, with the dimension measured from the order alone.
function CausalSetLab() {
  const S = window.QGA_CAUSAL_SETS;
  const reduced = usePRM();
  const [n, setN] = useState(600);
  const [dim, setDim] = useState(2);
  const [seed, setSeed] = useState(42);
  const [showLinks, setShowLinks] = useState(true);

  const run = useMemo(() => S.estimate({ dim, n, seed }), [dim, n, seed]);
  // The readout quotes the spread over five seeds, never a single draw.
  const spread = useMemo(() => S.ensemble({ dim, n, seeds: 5, firstSeed: seed }), [dim, n, seed]);
  const state = useRef({ run, dim, showLinks });
  state.current = { run, dim, showLinks };

  const build = async (ctx) => {
    const { createCausalSetRuntime } = await window.QGA_LABS.loadCausalSet();
    const runtime = createCausalSetRuntime({ ...state.current, engraved: ctx.engraved });
    ctx.scene.add(runtime.group);
    // The in-scene label stays short enough to fit a phone viewport; the caption carries the full statement.
    const dim = state.current.dim;
    ctx.label(
      window.matchMedia("(max-width: 640px)").matches
        ? `CONJECTURAL · ${dim}D causal diamond`
        : `CONJECTURAL · Poisson sprinkle into a ${dim}D causal diamond — order is the only structure`,
      () => (window.matchMedia("(max-width: 640px)").matches ? { x: 0, y: 2.1, z: 0 } : { x: -2.6, y: 3.9, z: 1.6 }),
      "s3d-strong");
    ctx.label(
      state.current.dim === 2
        ? "t vertical, x horizontal — the diamond drawn literally"
        : "4D projected: time vertical, space through a fixed frame",
      () => (window.matchMedia("(max-width: 640px)").matches ? { x: 0, y: -3.6, z: 0 } : { x: -2.6, y: -3.6, z: 1.6 }),
      "s3d-quiet");
    // The scene is static (it renders on demand), so the QA hook is written at build time, not in update().
    window.__qgaCausalSet = runtime.stats();
    return {
      dispose: () => { runtime.dispose(); delete window.__qgaCausalSet; },
    };
  };

  const mm = run.myrheimMeyer;
  const chainIdeal = Math.pow(n, 1 / dim);
  return (
    <div className="viz-frame causal-set-lab" id="approaches-causal-set">
      <div className="viz-toolbar">
        <SliderRow label="elements N" min={100} max={4000} step={100} value={n} onChange={setN}
          format={(v) => String(v)}></SliderRow>
        <span className="seg" role="group" aria-label="spacetime dimension">
          <button type="button" className={"btn" + (dim === 2 ? " on" : "")} aria-pressed={dim === 2}
            onClick={() => setDim(2)}>2D</button>
          <button type="button" className={"btn" + (dim === 4 ? " on" : "")} aria-pressed={dim === 4}
            onClick={() => setDim(4)}>4D</button>
        </span>
        <label className="causal-toggle">
          <input type="checkbox" checked={showLinks} onChange={(e) => setShowLinks(e.target.checked)}></input>
          show links
        </label>
        <label className="causal-seed">
          seed
          <input type="range" min={1} max={99} step={1} value={seed}
            onChange={(e) => setSeed(Number(e.target.value))} aria-label="causal set seed"></input>
          <strong>{seed}</strong>
        </label>
      </div>
      <Scene3D animated={false} nodeKit height={460}
        aria={`A Poisson sprinkle of ${n} elements into a ${dim}-dimensional causal diamond. Points are the elements, faint lines their causal links, and the golden line the longest chain.`}
        initial={{ radius: 13, theta: 0.42, phi: 1.32, target: [0, 0, 0], minR: 7, maxR: 30 }}
        build={build} deps={[dim, n, seed, showLinks]}
        fallback={<div className="lab-fallback">The constellation view needs WebGL. Every estimator below is still computed.</div>}></Scene3D>
      <div className="readout-grid causal-readouts" aria-live="polite">
        <div className="readout">
          <div className="readout-label">Myrheim–Meyer dimension</div>
          <div className="readout-value">{mm.dim.toFixed(2)}<span className="unit">d</span></div>
          <div className="readout-note">from {n} elements; {spread.seeds} seeds give {spread.meanDimension.toFixed(2)} ± {spread.spreadDimension.toFixed(2)}</div>
        </div>
        <div className="readout">
          <div className="readout-label">ordering fraction</div>
          <div className="readout-value">{run.orderingFraction.toFixed(4)}</div>
          <div className="readout-note">theory f({dim}) = {mm.expected.toFixed(4)}</div>
        </div>
        <div className="readout">
          <div className="readout-label">longest chain</div>
          <div className="readout-value">{run.chain.length}<span className="unit">elements</span></div>
          <div className="readout-note">N^(1/d) ≈ {chainIdeal.toFixed(1)} — the order's own proper-time estimate</div>
        </div>
        <div className="readout">
          <div className="readout-label">links / relations</div>
          <div className="readout-value">{run.links.length}<span className="unit">of {run.relations}</span></div>
          <div className="readout-note">cover relations after transitive reduction</div>
        </div>
      </div>
      {reduced ? <p className="causal-note">Reduced motion is on. The scene is static by design; change N, the dimension or the seed to redraw it.</p> : null}
      <VizCaption provenanceId="approaches-causal-set" status="conjectural">
        Elements are sprinkled at random into a diamond of flat spacetime; the <strong>only</strong> structure kept is
        the causal order — which element can influence which. From that order alone the dimension is recovered by the
        Myrheim–Meyer relation <Eq tex="f(d)=\Gamma(d+1)\Gamma(d/2)\,/\,(2\Gamma(3d/2))"></Eq>, and the longest chain
        estimates proper time, growing as <Eq tex="N^{1/d}"></Eq>. The recovered value is a statistical estimate; the
        readout quotes its spread over five seeds. Whether spacetime really is a causal set is an open conjecture, and
        the 4D view is a projection, not four dimensions on screen.
      </VizCaption>
    </div>
  );
}

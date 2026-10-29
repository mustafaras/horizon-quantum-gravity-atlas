// S20: interactive, properly labelled test-particle tidal deformation.
function TidalLab() {
  const T = window.QGA_GR.tidal;
  const reduced = usePRM();
  const [solar, setSolar] = useState(10);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const mass = solar * T.SOLAR_MASS;
  const rs = T.schwarzschildRadius(mass);
  const threshold = T.spaghettificationRadius(mass, 2, 100);
  const start = Math.max(30 * rs, 1.2 * threshold);
  const run = useMemo(() => T.integrateTidalRing({ mass, startRadius: start, endRadius: 1.02 * rs, count: 96, steps: 800 }), [solar]);
  const snapshot = run.snapshots[index];
  const state = useRef(snapshot); state.current = snapshot;
  const spec = useMemo(() => window.QGA_FIGURE.plots.grTides.stretchSpec(run, rs, threshold), [run]);
  useEffect(() => {
    if (!playing || reduced) return undefined;
    const timer = setInterval(() => setIndex(i => {
      if (i >= 800) { setPlaying(false); return 800; }
      return Math.min(800, i + 4);
    }), 40);
    return () => clearInterval(timer);
  }, [playing, reduced]);
  const choose = (m) => { setPlaying(false); setIndex(0); setSolar(m); };
  const build = async (ctx) => (await window.QGA_GR.loadTidalRing()).buildTidalRing(ctx, state);
  const rate = -T.tidalEigenvalues(mass, snapshot.radius).radial;
  return (
    <div className="viz-frame tidal-lab" id="gr-tidal-lab">
      <div className="tidal-intro"><div><span className="tidal-kicker">01 / THE SHAPE OF FREE FALL</span>
        <h3>Gravity pulls unevenly</h3><p>Nearby paths fall at different rates. Follow a small ring toward a black hole and watch it stretch along the radial direction while it narrows across it.</p></div>
        <div className="tidal-formula"><Eq tex="\Delta a_r \simeq \frac{2GM}{r^3}\,\Delta r"></Eq><small>difference in acceleration across a separation</small></div></div>
      <div className="tidal-controls" role="group" aria-label="Black hole mass">
        <span>Choose a black hole</span>
        <button type="button" className={'btn' + (solar === 10 ? ' on' : '')} aria-pressed={solar === 10} onClick={() => choose(10)}>10 solar masses</button>
        <button type="button" className={'btn' + (solar === 1000000 ? ' on' : '')} aria-pressed={solar === 1000000} onClick={() => choose(1000000)}>1 million solar masses</button>
      </div>
      <div className="tidal-scene-shell" onKeyDownCapture={e => { if (e.key === " " && e.target.classList.contains("s3d-stage")) { e.preventDefault(); e.stopPropagation(); } }}><div className="tidal-overlay">MODEL · LINEAR TIDAL DEVIATION <span>radial direction →</span></div>
        <Scene3D animated={playing && !reduced} nodeKit height={350} invalidateKey={index}
          aria="A ring of test particles stretches radially and contracts transversely during free fall. The ring is rescaled to fit the view."
          initial={{ radius: 13, theta: 0, phi: 1.5707963267948966, target: [0,0,0], minR: 8, maxR: 25 }} build={build}
          fallback={<div className="lab-fallback">The particle view needs WebGL. The calculated readouts and plot remain available.</div>}></Scene3D>
      </div>
      <div className="tidal-transport">
        <button type="button" className="btn" aria-pressed={playing} onClick={() => { if (index === 800) setIndex(0); setPlaying(!playing); }} disabled={reduced}>{playing ? 'Pause' : 'Play fall'}</button>
        <label>Fall progress <input type="range" min="0" max="800" step="1" value={index} onChange={e => { setPlaying(false); setIndex(Number(e.target.value)); }}></input></label>
        <span>{(index / 8).toFixed(0)}%</span>
      </div>
      {reduced && <p className="tidal-note">Reduced motion is on. Use the slider to explore the fall.</p>}
      <div className="tidal-stats" aria-live="polite">
        <div><span>Radius</span><strong>{(snapshot.radius / rs).toFixed(2)} <small>rₛ</small></strong></div>
        <div><span>Radial gradient</span><strong>{rate.toExponential(2)} <small>m/s² per m</small></strong></div>
        <div><span>Radial stretch</span><strong>{snapshot.radialScale.toFixed(2)} <small>× initial</small></strong></div>
        <div><span>100 m/s² threshold</span><strong>{(threshold / rs).toFixed(2)} <small>rₛ · {threshold > rs ? 'outside' : 'inside'}</small></strong></div>
      </div>
      <VizCaption provenanceId="gr-tidal-ring" status="effective">The centre follows exact radial Schwarzschild free fall from rest. The small, initially comoving ring follows linear geodesic deviation; its size is rescaled to fit, so its shape is meaningful, not its apparent size. No material strength or self-gravity is included.</VizCaption>
      <Figure spec={spec}><span className="tidal-note">The threshold is the radius where the differential acceleration across 2 m reaches 100 m/s². It is a chosen comparison, not a universal survival limit.</span></Figure>
    </div>
  );
}

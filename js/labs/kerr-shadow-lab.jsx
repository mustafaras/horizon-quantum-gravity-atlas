// S25: the shadow's critical curve, compared with what the EHT actually measured.
function KerrShadowLab() {
  const K = window.QGA_KERR_SHADOW;
  const E = window.QGA_EHT;
  const [spin, setSpin] = useState(0);
  const [inclination, setInclination] = useState(90);
  const [target, setTarget] = useState("m87");

  const bardeen = useMemo(
    () => window.QGA_FIGURE.plots.kerrShadow.bardeenSpec({ a: spin, inclinationDeg: inclination }),
    [spin, inclination],
  );
  const comparison = useMemo(() => window.QGA_FIGURE.plots.kerrShadow.ehtComparisonSpec(), []);
  const row = E.EHT_COMPARISONS.find((c) => c.id === target) ?? E.EHT_COMPARISONS[0];
  const curve = useMemo(() => K.criticalCurve({ a: spin, inclinationDeg: inclination, samples: 240, M: 1 }), [spin, inclination]);
  const width = Math.max(...curve.alpha) - Math.min(...curve.alpha);
  const height = 2 * Math.max(...curve.beta.map(Math.abs));
  const flattening = height > 0 ? Math.max(width / height, height / width) : 1;
  const subring = K.firstSubringFraction({ a: spin });

  return (
    <div className="viz-frame kerr-shadow-lab" id="bh-kerr-shadow">
      <div className="viz-toolbar">
        <SliderRow label="spin a*" min={0} max={0.998} step={0.001} value={spin} onChange={setSpin}
          format={(v) => v.toFixed(3)}></SliderRow>
        <SliderRow label="inclination" min={5} max={90} step={1} value={inclination} onChange={setInclination}
          format={(v) => v + "\u00b0"}></SliderRow>
      </div>
      <div className="kerr-shadow-grid">
        <Figure spec={bardeen}></Figure>
        <div className="kerr-shadow-readouts" aria-live="polite">
          <div className="readout">
            <div className="readout-label">shadow width / height</div>
            <div className="readout-value">{flattening.toFixed(3)}</div>
            <div className="readout-note">{flattening > 1.05 ? "flattened on the prograde edge" : flattening > 1.01 ? "slightly flattened" : "very nearly circular"}</div>
          </div>
          <div className="readout">
            <div className="readout-label">alpha range</div>
            <div className="readout-value">{(width).toFixed(2)}<span className="unit">M</span></div>
            <div className="readout-note">{Math.min(...curve.alpha).toFixed(2)} to {Math.max(...curve.alpha).toFixed(2)} M</div>
          </div>
          <div className="readout">
            <div className="readout-label">n = 1 sub-ring</div>
            <div className="readout-value">{(100 * subring).toFixed(2)}<span className="unit">%</span></div>
            <div className="readout-note">each half orbit demagnifies by e^(-gamma); gamma = pi at a = 0</div>
          </div>
        </div>
      </div>
      <div className="kerr-eht-block">
        <div className="kerr-eht-head">
          <h4>The shadow, measured</h4>
          <span className="seg" role="group" aria-label="EHT target">
            {E.EHT_TARGETS.map((t) => (
              <button key={t.id} type="button" className={"btn" + (t.id === target ? " on" : "")}
                aria-pressed={t.id === target} onClick={() => setTarget(t.id)}>{t.label}</button>
            ))}
          </span>
        </div>
        <Figure spec={comparison}></Figure>
        <div className="readout-grid kerr-eht-readouts" aria-live="polite">
          <div className="readout">
            <div className="readout-label">measured ring</div>
            <div className="readout-value">{row.measuredUas}<span className="unit">± {row.sigmaUas} µas</span></div>
            <div className="readout-note">{row.label}, from the EHT paper cited below</div>
          </div>
          <div className="readout">
            <div className="readout-label">predicted shadow</div>
            <div className="readout-value">{row.predictedUas.toFixed(2)}<span className="unit">µas</span></div>
            <div className="readout-note">2√27 GM/(c²D) with M = {row.massSolar.toExponential(1)} M☉</div>
          </div>
          <div className="readout">
            <div className="readout-label">difference</div>
            <div className="readout-value">{row.differencePercent >= 0 ? "+" : ""}{row.differencePercent.toFixed(1)}<span className="unit">%</span></div>
            <div className="readout-note">the ring is calibrated to the shadow, so this is a ~10 % comparison</div>
          </div>
        </div>
        <p className="kerr-eht-note">{row.note} <a href={row.source.reference.match(/https:\/\/[^\s,;]+/)?.[0] ?? "#"} target="_blank" rel="noreferrer">{row.source.reference.split(",")[0]} ↗</a></p>
      </div>
      <VizCaption provenanceId="bh-kerr-shadow" status="effective">
        The boundary of the shadow is the set of spherical photon orbits, drawn in the observer's sky as
        <Eq tex="\alpha=-\xi/\sin\theta_o"></Eq> and <Eq tex="\beta=\pm\sqrt{\eta+a^2\cos^2\theta_o-\xi^2\cot^2\theta_o}"></Eq>.
        At zero spin it is the circle of radius <Eq tex="\sqrt{27}\,M=5.196\,M"></Eq>; as the hole spins up the prograde
        edge is dragged inward and the shadow flattens. Each half orbit around the photon sphere demagnifies the
        image by <Eq tex="e^{-\gamma}"></Eq> (<Eq tex="\gamma=\pi"></Eq> for Schwarzschild), which is why the photon
        sub-rings are so faint — they are predicted, not observed. The EHT ring is compared through a modelling
        factor, so the agreement is quoted at the ~10 % level.
      </VizCaption>
    </div>
  );
}

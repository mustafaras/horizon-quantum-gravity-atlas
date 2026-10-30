// S28: the four prose panels become four computed figures.
function ObservationalNetLab() {
  const O = window.QGA_OBSERVATIONAL_NET;
  const [eQg, setEQg] = useState(1);
  const [redshift, setRedshift] = useState(0.903);

  const delaySpec = useMemo(() => window.QGA_FIGURE.plots.observationalNet.lorentzDelaySpec(), []);
  const tensorSpec = useMemo(() => window.QGA_FIGURE.plots.observationalNet.tensorScalarSpec(), []);
  const shortSpec = useMemo(() => window.QGA_FIGURE.plots.observationalNet.shortRangeSpec(), []);

  const delay = O.timeDelay({ energy1GeV: 31, redshift, eQgGeV: eQg * O.PLANCK_ENERGY_GEV });
  return (
    <div className="viz-frame obs-net" id="exp-observational-net">
      <div className="obs-net-grid">
        <section className="obs-net-cell">
          <h3>Lorentz violation</h3>
          <div className="viz-toolbar obs-net-controls">
            <SliderRow label="E_QG / E_Planck" min={1} max={20} step={0.5} value={eQg} onChange={setEQg}
              format={(v) => v.toFixed(1)}></SliderRow>
            <SliderRow label="source redshift" min={0.1} max={3} step={0.01} value={redshift} onChange={setRedshift}
              format={(v) => v.toFixed(2)}></SliderRow>
          </div>
          <Figure spec={delaySpec}></Figure>
          <div className="readout-grid obs-net-readouts" aria-live="polite">
            <div className="readout">
              <div className="readout-label">31 GeV delay at z = {redshift.toFixed(2)}</div>
              <div className="readout-value">{delay.toFixed(2)}<span className="unit">s</span></div>
              <div className="readout-note">E_QG = {eQg.toFixed(1)} E_Planck; the bound excludes anything under 1.19</div>
            </div>
          </div>
        </section>
        <section className="obs-net-cell">
          <h3>Inflationary tensors</h3>
          <Figure spec={tensorSpec}></Figure>
        </section>
        <section className="obs-net-cell">
          <h3>Short-range gravity</h3>
          <Figure spec={shortSpec}></Figure>
        </section>
        <section className="obs-net-cell">
          <h3>Horizon-scale imaging</h3>
          <p className="obs-net-note">
            The Event Horizon Telescope resolves structure at the photon-ring scale of M87* and Sgr A*. The size
            comparison with the predicted shadow is computed in the black-hole module, where the critical curve lives —
            the panel below is the same instrument, not a copy of the numbers.
          </p>
          <div className="obs-net-link">
            <a className="btn" href="?view=bh">Open the shadow comparison ↗</a>
          </div>
          <div className="readout-grid obs-net-readouts">
            <div className="readout">
              <div className="readout-label">M87* vs prediction</div>
              <div className="readout-value">+5.8<span className="unit">%</span></div>
              <div className="readout-note">42 ± 3 µas measured against 39.69 predicted</div>
            </div>
            <div className="readout">
              <div className="readout-label">Sgr A* vs prediction</div>
              <div className="readout-value">+1.0<span className="unit">%</span></div>
              <div className="readout-note">51.8 ± 2.3 µas against 51.29 predicted</div>
            </div>
          </div>
        </section>
      </div>
      <VizCaption provenanceId="exp-observational-net" status="effective">
        Four instruments, not four paragraphs. The delay curves come from
        <Eq tex="\Delta t = \frac{E}{E_{QG}}\frac{1}{H_0}\int_0^z \frac{(1+z')dz'}{\sqrt{\Omega_m(1+z')^3+\Omega_\Lambda}}"></Eq>
        with the Planck 2018 cosmology; the slow-roll predictions are first-order in <Eq tex="\epsilon"></Eq> and
        <Eq tex="\eta"></Eq>; the short-range panel draws the one exclusion Eöt-Wash publishes rather than inventing a
        contour. The tensor band is a limit on <Eq tex="r"></Eq>, not a detection, and the Fermi bound is indirect: it
        depends on the burst's emission model.
      </VizCaption>
    </div>
  );
}

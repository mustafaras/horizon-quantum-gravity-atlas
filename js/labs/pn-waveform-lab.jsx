// S26: the 3.5PN inspiral and the remnant it leaves, computed rather than asserted.
function PnWaveformLab() {
  const W = window.QGA_PN_WAVEFORM;
  const [m1, setM1] = useState(36);
  const [m2, setM2] = useState(29);
  const [inclination, setInclination] = useState(23);

  const run = useMemo(() => W.evolveInspiral({ m1, m2, fStartHz: 30, maxTime: 3 }), [m1, m2]);
  const fit = useMemo(() => W.remnant({ m1, m2 }), [m1, m2]);
  const qnm = W.ringdownHz((m1 + m2) * fit.massRatio, fit.spin, 0);
  const tau = W.ringdownTauSeconds((m1 + m2) * fit.massRatio, fit.spin, 0);
  const newtonian = W.newtonianTimeToCoalescence(30, W.chirpMassSeconds(m1, m2));
  const waveSpec = useMemo(() => window.QGA_FIGURE.plots.gwWaveform.waveformSpec({ m1, m2, inclinationRad: (inclination * Math.PI) / 180 }), [m1, m2, inclination]);
  const freqSpec = useMemo(() => window.QGA_FIGURE.plots.gwWaveform.waveformFrequencySpec({ m1, m2 }), [m1, m2]);

  const total = m1 + m2;
  return (
    <div className="viz-frame pn-lab" id="gw-pn-waveform">
      <div className="viz-toolbar">
        <SliderRow label="m1 (solar masses)" min={5} max={60} step={1} value={m1} onChange={setM1}
          format={(v) => String(v)}></SliderRow>
        <SliderRow label="m2 (solar masses)" min={5} max={60} step={1} value={m2} onChange={setM2}
          format={(v) => String(v)}></SliderRow>
        <SliderRow label="inclination" min={0} max={90} step={1} value={inclination} onChange={setInclination}
          format={(v) => v + "\u00b0"}></SliderRow>
      </div>
      <div className="pn-grid">
        <Figure spec={waveSpec}></Figure>
        <Figure spec={freqSpec}></Figure>
      </div>
      <div className="readout-grid pn-readouts" aria-live="polite">
        <div className="readout">
          <div className="readout-label">coalescence from 30 Hz</div>
          <div className="readout-value">{run.coalescenceTime.toFixed(3)}<span className="unit">s</span></div>
          <div className="readout-note">3.5PN merges {(100 * (1 - run.coalescenceTime / newtonian)).toFixed(0)} % sooner than the Newtonian {newtonian.toFixed(3)} s</div>
        </div>
        <div className="readout">
          <div className="readout-label">remnant spin</div>
          <div className="readout-value">{fit.spin.toFixed(3)}</div>
          <div className="readout-note">from the NR fit; 0.686 at equal mass</div>
        </div>
        <div className="readout">
          <div className="readout-label">remnant mass</div>
          <div className="readout-value">{(fit.massRatio * total).toFixed(1)}<span className="unit">M&#9737;</span></div>
          <div className="readout-note">{(100 * fit.radiatedEnergyFraction).toFixed(2)} % of {total} M&#9737; radiated</div>
        </div>
        <div className="readout">
          <div className="readout-label">ringdown (2,2,0)</div>
          <div className="readout-value">{qnm.toFixed(0)}<span className="unit">Hz</span></div>
          <div className="readout-note">damping time {(1000 * tau).toFixed(1)} ms; the old waveform used a fixed 190 Hz / 60 ms</div>
        </div>
      </div>
      <VizCaption provenanceId="gw-pn-waveform" status="effective">
        The inspiralling phase is TaylorT4 at 3.5 post-Newtonian order with the Blanchet (2014) coefficients, run in
        <Eq tex="x=(GM\omega/c^3)^{2/3}"></Eq> until the Schwarzschild ISCO at <Eq tex="x=1/6"></Eq>. Everything after
        that is a fit, not a derivation: the remnant mass and spin come from the Jiménez-Forteza et al. (2017)
        numerical-relativity calibration, and the ringdown is the <Eq tex="(2,2,0)"></Eq> quasi-normal mode of that
        remnant from Berti, Cardoso &amp; Will (2006). The amplitude is normalised rather than physical, and the binary
        is non-spinning — a spinning or eccentric system needs terms this module does not carry.
      </VizCaption>
    </div>
  );
}

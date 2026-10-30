// S27: the matched filter, the Q-transform, and the real CMS spectrum — three views of real measurement.
function MatchedFilterLab() {
  const M = window.QGA_MATCHED_FILTER;
  const Q = window.QGA_QTRANSFORM;
  const G = window.QGA_GW;
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [transform, setTransform] = useState(null);

  // The fixture is synthetic and says so; the search demonstrates the method, not an observation. When no fixture is
  // loaded — the deployed app has none — the search runs on the app's own seeded teaching signal, and the readout
  // says which source it used rather than implying a detector file.
  const search = () => {
    setRunning(true);
    setTimeout(() => {
      try {
        const n = 1024, sampleRate = 128;
        const fixture = window.__qgaGwFixtureStrain ?? null;
        const generated = fixture ? null : window.QGA_PHYSICS.generatedChirp({ seed: 42, sampleRate, duration: n / sampleRate, m1: 36, m2: 29 });
        const strain = Float64Array.from(fixture ? fixture.slice(0, n) : generated.samples);
        const source = fixture ? "GWOSC fixture (synthetic)" : "seeded teaching signal";
        const psd = G.estimatePsd(strain, { sampleRate, segmentSize: 128 });
        const bank = M.buildBank({ count: 32, mcMin: 10, mcMax: 40, sampleRate, duration: n / sampleRate });
        const best = M.searchBank({ strain, sampleRate, bank, psd, bandLow: 20 });
        setResult({ peakSnr: best.peakSnr, bestMc: best.bestMc, tPeak: best.tPeak, spacing: bank.spacing, templates: bank.count, source });
        const tf = Q.qTransform(strain, { sampleRate, fMin: 20, bins: 40, hop: 6 });
        setTransform({ tf, track: Q.dominantTrack(tf) });
      } finally { setRunning(false); }
    }, 0);
  };

  const qtSpec = useMemo(() => (transform ? window.QGA_FIGURE.plots.expRealData.qTransformSpec({
    transform: transform.tf, track: transform.track, title: 'Q-transform of the loaded strain',
  }) : null), [transform]);
  const cmsSpec = useMemo(() => window.QGA_FIGURE.plots.expRealData.cmsDimuonSpec(), []);

  return (
    <div className="viz-frame mf-lab" id="exp-matched-filter">
      <div className="viz-toolbar">
        <button type="button" className="btn" onClick={search} disabled={running}>
          {running ? "Searching…" : "Run matched filter"}
        </button>
        <span className="mf-status" aria-live="polite">
          {result?.error ? result.error : result ? `peak SNR ${result.peakSnr.toFixed(1)} at ${result.tPeak.toFixed(2)} s` : "a 32-template bank, 10–40 solar masses"}
        </span>
      </div>
      {result && !result.error ? (
        <div className="readout-grid mf-readouts" aria-live="polite">
          <div className="readout">
            <div className="readout-label">peak SNR</div>
            <div className="readout-value">{result.peakSnr.toFixed(2)}</div>
            <div className="readout-note">from the {result.source}; single detector, no chi-squared veto</div>
          </div>
          <div className="readout">
            <div className="readout-label">recovered chirp mass</div>
            <div className="readout-value">{result.bestMc.toFixed(1)}<span className="unit">M☉</span></div>
            <div className="readout-note">bank spacing {result.spacing.toFixed(2)} M☉ over {result.templates} templates</div>
          </div>
          <div className="readout">
            <div className="readout-label">peak time</div>
            <div className="readout-value">{result.tPeak.toFixed(3)}<span className="unit">s</span></div>
            <div className="readout-note">the template's coalescence lands on the loudest point of the data</div>
          </div>
        </div>
      ) : null}
      {qtSpec ? <Figure spec={qtSpec}></Figure> : null}
      <div className="readout-grid mf-readouts" aria-live="polite">
        <div className="readout">
          <div className="readout-label">signal-to-noise</div>
          <div className="readout-value">{result?.peakSnr != null ? result.peakSnr.toFixed(1) : "—"}</div>
          <div className="readout-note">not the LVK detection statistic: no false-alarm rate is computed</div>
        </div>
      </div>
      <VizCaption provenanceId="gw-matched-filter" status="effective">
        The statistic is <Eq tex="\rho(t)=4\,\mathrm{Re}\int \tilde s(f)\tilde h^*(f)e^{2\pi ift}/S_n(f)\,df/\sigma_h"></Eq>,
        the matched filter: the data correlated against a template, weighted by the inverse noise power. The bank is
        non-spinning TaylorT4, spaced in chirp mass. <strong>This is a simplified search</strong> — no
        <Eq tex="\chi^2"></Eq> veto, no coincidence between detectors and no background estimate — so the peak SNR is
        not a detection and must not be read as one. The bundled fixture is
        <strong>synthetic</strong>; the panel below is real data.
      </VizCaption>
      <div className="mf-cms">
        <Figure spec={cmsSpec}></Figure>
      </div>
      <VizCaption provenanceId="exp-cms-dimuon" status="established">
        The dimuon invariant-mass spectrum from the CMS Run2010B public Mu dataset — real open data from the CERN Open
        Data Portal, CC0, not a simulation. The J/psi, psi(2S), Upsilon family and Z appear at their known masses
        because the events put them there. Error bars are <Eq tex="\sqrt{N}"></Eq>; the logarithmic axis is what lets
        a 10⁰-event Z peak and a 10³-event J/psi peak sit in one picture.
      </VizCaption>
    </div>
  );
}

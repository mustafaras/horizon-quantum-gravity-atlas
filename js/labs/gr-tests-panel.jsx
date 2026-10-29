function grObservationNumber(value) {
  return value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) ? value.toExponential(3) : Number(value.toPrecision(5)).toString();
}
function GRTestsPanel() {
  const D = window.QGA_GR.tests;
  const spec = useMemo(() => window.QGA_FIGURE.plots.grTides.grPullSpec(), []);
  const gps = D.gpsClockOffset();
  return <div className="viz-frame gr-tests-panel" id="gr-tests-pull">
    <div className="tidal-intro"><div><span className="tidal-kicker">02 / THE TESTED UNIVERSE</span><h3>One theory, many independent questions</h3>
      <p>Each point compares a published measurement with its own prediction. Zero is perfect agreement; the bar shows the reported uncertainty.</p></div></div>
    <div className="gr-pull-layout"><Figure spec={spec}><span className="tidal-note">Bands show one and two standard errors. These tests use different observables and are not a combined fit.</span></Figure>
      <ol className="gr-test-list">{D.GR_TESTS.map((entry, i) => <li key={entry.id}><span className="gr-test-number">{D.GR_TESTS.length - i}</span><div>
        <strong>{entry.label}</strong><span>Measured {grObservationNumber(entry.measured)} ± {grObservationNumber(entry.sigma)} · predicted {grObservationNumber(entry.predicted())} · {entry.unit}</span><span>pull {D.pull(entry).toFixed(2)} σ</span>
        <a href={entry.url} target="_blank" rel="noreferrer" title={entry.note || entry.citation}>{entry.citation} ↗</a>
        {entry.note && <small>{entry.note}</small>}</div></li>)}</ol></div>
    <div className="gr-gps-note"><strong>GPS in practice</strong><span>For a spherical Earth and a 26,560 km orbit: +{gps.gravitational.toFixed(2)} gravitational, {gps.kinematic.toFixed(2)} kinematic, {gps.net.toFixed(2)} μs/day net. This calculation is separate from the GPS measurement in the plot.</span></div>
    <VizCaption provenanceId="gr-tests-pull" status="established">Published values and uncertainties are linked by row. The Mercury error bar is statistical; its source also estimates a larger systematic uncertainty. The GPS point is a redshift experiment, not the calculated operating offset.</VizCaption>
  </div>;
}

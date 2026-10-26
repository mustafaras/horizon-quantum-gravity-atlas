// casimir-lab.jsx — the Casimir cavity (S15): two plates, the standing modes between them, and the pressure that results.
// The calculation is js/science/casimir.mjs (window.QGA_CASIMIR), the scene js/visualizations/qft/casimir-cavity.mjs and the pressure
// plot a Figure Kit figure (js/figure/plots/casimir.mjs); this file holds the controls and the readouts.

const CV_LOG_RANGE = [-8, -5]; // log10 of the gap in metres: 10 nm to 10 um
const CV_BAND_SAMPLES = 25;
const CV_CURVE_SAMPLES = 61;
const CV_SUM_RATIOS = [10, 20, 40]; // the cutoffs of the mode sum, in units of the fundamental frequency
const CV_PRESETS = [{ tex: "100\\,\\mathrm{nm}", log: -7 }, { tex: "1\\,\\mu\\mathrm{m}", log: -6 }];

const cvLogSpace = (lo, hi, n) => Array.from({ length: n }, (_, i) => lo * (hi / lo) ** (i / (n - 1)));

function CasimirLab() {
  const K = window.QGA_CASIMIR;
  const { science, data, view } = K;
  const [logGap, setLogGap] = useState(-6);
  const gap = view.gapFromLog(logGap);
  const control = useRef({ gap }).current;
  control.gap = gap;
  const narrow = window.matchMedia("(max-width: 640px)").matches; // a narrow stage needs the camera further back to show both plates

  const pressure = science.idealPressure(gap);
  const energy = science.idealEnergyPerArea(gap);
  const curve = useMemo(() => science.pressureCurve({ min: view.gapRange[0], max: view.gapRange[1], count: CV_CURVE_SAMPLES }), []);
  const bands = useMemo(() => ({
    bressi: science.dataBand("bressi2002", cvLogSpace(...data.bressi2002.range, CV_BAND_SAMPLES)),
    lamoreaux: science.dataBand("lamoreaux1997", cvLogSpace(...data.lamoreaux1997.range, CV_BAND_SAMPLES)),
  }), []);
  const spec = useMemo(() => window.QGA_FIGURE.plots.casimir.pressureSpec({
    curve, bressi: bands.bressi, lamoreaux: bands.lamoreaux, probe: { gap, pressure: -pressure },
  }), [curve, bands, gap]);
  const agreement = useMemo(() => window.QGA_FIGURE.plots.casimir.agreementSpec({
    bressi: science.ratioBand(bands.bressi), lamoreaux: science.ratioBand(bands.lamoreaux),
  }), [bands]);
  const sums = useMemo(() => CV_SUM_RATIOS.map((ratio) => {
    const r = science.modeSumDifference({ gap, cutoff: science.cutoffForRatio(gap, ratio) });
    return { ratio, deviation: r.difference / r.limit - 1, limit: r.limit };
  }), [gap]);

  const build = async (ctx) => {
    const { buildCasimirCavity } = await K.loadScene();
    return buildCasimirCavity(ctx, { control });
  };

  return (
    <div className="viz-frame cv-lab" id="shot-section-casimir">
      <div className="viz-toolbar cv-bar" role="group" aria-label="Casimir cavity controls">
        {CV_PRESETS.map((preset) => (
          <button key={preset.tex} type="button" className={"btn cv-btn" + (logGap === preset.log ? " on" : "")} aria-pressed={logGap === preset.log}
            onClick={() => setLogGap(preset.log)}><Eq tex={preset.tex}></Eq></button>
        ))}
      </div>
      <Scene3D animated={false} nodeKit height={440} shotSpace="qft-casimir" invalidateKey={logGap}
        aria="Two parallel plates with the gap between them on a logarithmic scale; the first eight standing modes of a field between the plates drawn as sinusoids that vanish at the plates, and a denser, fainter continuum of lines outside them; the pressure between the plates is printed below."
        initial={{ radius: narrow ? 25 : 13.5, theta: 0.32, phi: 1.28, minR: 8, maxR: 40, target: [0, 0, 0] }}
        build={build} deps={[]}
        fallback={<div className="lab-fallback">The 3-D cavity needs WebGL; the readouts and the plot below are computed without it.</div>}></Scene3D>
      <div className="viz-toolbar cv-bar cv-controls">
        <div className="cv-sliders">
          <SliderRow label="plate separation" min={CV_LOG_RANGE[0]} max={CV_LOG_RANGE[1]} step={0.01} value={logGap}
            onChange={setLogGap} format={(l) => <Eq tex={view.gapTex(view.gapFromLog(l))}></Eq>}></SliderRow>
        </div>
      </div>
      <VizCaption provenanceId="qft-casimir-cavity" status="schematic">
        Between two plates a field can only oscillate in modes that vanish at both: in one dimension, <Eq tex="\omega_n=n\pi c/a"></Eq> with <Eq tex="n=1,2,\dots"></Eq>,
        drawn as the engraved sinusoids with amplitude proportional to <Eq tex="1/\sqrt{\omega_n}"></Eq>. Outside, the same lines at three times the density
        and 30 percent ink stand for a continuum. Fewer frequencies fit between the plates than outside, and the zero-point energy that is missing is the
        pressure <Eq tex="P=-\pi^2\hbar c/240a^4"></Eq> read out under the plates, for ideal plates at zero temperature. The picture is schematic: the drawn gap is a
        log map of <Eq tex="a"></Eq>, one dimension and one polarisation stand in for the electromagnetic field, and the amplitudes are in units of the first mode&apos;s.
        The vacuum-energy reading is one way to this number, not the only one: Jaffe (2005, arXiv:hep-th/0503158) shows that Casimir forces can be computed
        without reference to zero-point energies, as relativistic quantum forces between charges and currents.
      </VizCaption>
      <Figure spec={spec}>
        The attractive pressure <Eq tex="|P|"></Eq> on log-log axes: the amber line is the ideal-plate result <Eq tex="\pi^2\hbar c/240a^4"></Eq>, a straight line of
        slope <Eq tex="-4"></Eq>, and the black dot is the gap above. The two bands are what experiments reported, not points: Lamoreaux (1997) found agreement at the
        level of 5 percent between 0.6 and 6 <Eq tex="\mu\mathrm{m}"></Eq> with a sphere and a plate, and Bressi et al. (2002) fixed the coefficient to 15 percent
        between 0.5 and 3 <Eq tex="\mu\mathrm{m}"></Eq> with parallel plates. On fourteen decades of pressure they are a pixel or two thick, so the next figure
        shows the same bands as a ratio to the line.
      </Figure>
      <VizCaption provenanceId="qft-casimir-pressure" status="established">
        Ideal plates: perfect conductors, zero temperature. Real metals and finite temperature change the force at the smallest and the largest gaps, and the plot does
        not model them. No measured point is drawn: the publisher licenses a figure for reuse case by case, and no permission was requested.
      </VizCaption>
      <Figure spec={agreement}>
        The measured pressure over the ideal-plate pressure, <Eq tex="P/P_{\mathrm{ideal}}"></Eq>, for the two reported bands. The amber line is the ideal result, one by definition.
      </Figure>
      <VizCaption provenanceId="qft-casimir-agreement" status="established">
        The Lamoreaux band is the 5 percent agreement of his abstract drawn about one, although he compared with theory that included corrections he estimated at no more
        than 3 percent. The Bressi et al. band is their fitted coefficient, <Eq tex="K=(1.22\pm0.18)\times10^{-27}\,\mathrm{N\,m^2}"></Eq>, over the ideal <Eq tex="\pi^2\hbar c/240"></Eq>:
        one constant, so flat in the ratio, and they report that their fit does not follow the points systematically between 1 and 2 <Eq tex="\mu\mathrm{m}"></Eq>.
      </VizCaption>
      <div className="cv-readouts" role="group" aria-label="Casimir readouts">
        <div className="readout"><div className="readout-label">gap <Eq tex="a"></Eq></div>
          <div className="readout-value"><Eq tex={view.gapTex(gap)}></Eq></div></div>
        <div className="readout"><div className="readout-label">pressure <Eq tex="P"></Eq></div>
          <div className="readout-value"><Eq tex={view.pressureTex(pressure)}></Eq></div></div>
        <div className="readout"><div className="readout-label">energy per area <Eq tex="E/A"></Eq></div>
          <div className="readout-value"><Eq tex={"E/A=" + sciTex(energy, 2) + "\\,\\mathrm{J/m^2}"}></Eq></div></div>
      </div>
      <div className="cv-sums">
        <p className="cv-note">
          The mode sum in one dimension, with the exponential regulator <Eq tex="e^{-\omega/\Lambda}"></Eq>: the regularised difference between the modes between the plates
          and the continuum of the same length outside, <Eq tex="E_{\mathrm{in}}-E_{\mathrm{out}}"></Eq>, against its limit <Eq tex="-\pi\hbar c/24a"></Eq>
          {" "}(<Eq tex={"=" + sciTex(sums[0].limit, 2) + "\\,\\mathrm{J}"}></Eq> at this gap).
        </p>
        <div className="cv-readouts" role="group" aria-label="Mode sum convergence">
          {sums.map((s) => (
            <div className="readout" key={s.ratio}><div className="readout-label">cutoff <Eq tex={"\\Lambda=" + s.ratio + "\\,\\pi c/a"}></Eq></div>
              <div className="readout-value"><Eq tex={"\\text{ratio to limit}=1" + (s.deviation < 0 ? "-" : "+") + sciTex(Math.abs(s.deviation), 2)}></Eq></div></div>
          ))}
        </div>
      </div>
      <VizCaption provenanceId="qft-casimir-mode-sum" status="established">
        <Eq tex="E_{\mathrm{in}}=\sum_n\tfrac12\hbar\omega_n e^{-\omega_n/\Lambda}"></Eq> and <Eq tex="E_{\mathrm{out}}=\hbar a\Lambda^2/2\pi c"></Eq>: outside, the modes are so
        dense that their sum is the integral over the density of states <Eq tex="a/\pi c"></Eq>. Both diverge as <Eq tex="\Lambda^2 a"></Eq>, the difference does not, and it falls to
        its limit as <Eq tex="1/\Lambda^2"></Eq>: each doubling of the cutoff cuts the remainder by four. This is a scalar field in one dimension; its limit is not the three-dimensional
        pressure above.
      </VizCaption>
      <div className="cv-cards">
        <FormulaCard title="Casimir pressure between ideal plates" formulaId="casimir-plates-pressure" status="established"
          symbols={[
            { s: "a", d: "Separation of the plates. Click it to outline the gap between the plates." },
            { s: "\\hbar", d: "Reduced Planck constant. Click it to mark the pressure readout it scales." },
            { s: "c", d: "Speed of light. Click it to mark the pressure readout it scales." },
          ]}
          meaning="Between perfectly conducting plates only some modes of the electromagnetic field fit; the energy that is missing per area, $-\pi^2\hbar c/720a^3$, falls as the plates approach, and its derivative is an attractive pressure that grows as the fourth power of the inverse gap: about $1.3\times10^{-3}\ \mathrm{Pa}$ at $1\ \mu\mathrm{m}$ and $13\ \mathrm{Pa}$ at $100\ \mathrm{nm}$."
          limits="Ideal plates at zero temperature. Real metals are not perfect conductors, the plates are rough and warm, and the sphere-plate geometry of most experiments is reached through the proximity force approximation."></FormulaCard>
      </div>
    </div>
  );
}

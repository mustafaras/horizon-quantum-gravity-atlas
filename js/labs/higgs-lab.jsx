// higgs-lab.jsx — the physical Higgs potential and the stability of its vacuum (S13).
// The calculation is js/science/higgs.mjs and higgs-running.mjs (window.QGA_HIGGS), the hat is the TSL scene
// js/visualizations/sm/mexican-hat.mjs, and the two plots are Figure Kit figures (js/figure/plots/higgs.mjs);
// this file holds the controls and the readouts.

const HG_MT_RANGE = [160, 185];
const HG_MH_RANGE = [120, 130];
const HG_DIAGRAM_MT = [164, 182];
const HG_BOUNDARY_MH = Array.from({ length: 21 }, (_, i) => 120 + i * 0.5);
const HG_BOUNDARY_MT = [150, 200];
const HG_REGION_TEXT = { stable: "absolutely stable", metastable: "metastable", unstable: "unstable" };

// "7.96e+8" -> "7.96\times10^{8}": every number the readouts show with an exponent is typeset, not printed as e-notation.
function hgSciTex(x, digits) {
  const [mantissa, exponent] = x.toExponential(digits).split("e");
  return mantissa + "\\times10^{" + Number(exponent) + "}";
}

function HiggsLab({ go }) {
  const H = window.QGA_HIGGS;
  const { PDG } = H;
  const [symmetric, setSymmetric] = useState(false);
  const [mt, setMt] = useState(PDG.mt.value);
  const [mH, setMH] = useState(PDG.mH.value);
  const control = useRef({ symmetric: false }).current;
  control.symmetric = symmetric;

  const v = useMemo(() => H.vevFromFermi(PDG.GF.value), []);
  const moved = mt !== PDG.mt.value || mH !== PDG.mH.value;
  const run = useMemo(() => H.runFromInputs({ mt, mH, alphaS: PDG.alphaS.value }), [mt, mH]);
  const band = useMemo(() => H.lambdaBand({ mt: { value: mt, uncertainty: PDG.mt.uncertainty }, mH, alphaS: PDG.alphaS }), [mt, mH]);
  const boundaries = useMemo(() => H.stabilityBoundaries({ mHValues: HG_BOUNDARY_MH, mtRange: HG_BOUNDARY_MT }), []);
  const decay = useMemo(() => H.vacuumDecay(run), [run]);
  const instability = useMemo(() => H.instabilityScale(run), [run]);
  const region = H.regionOf(decay);

  const runningSpec = useMemo(() => window.QGA_FIGURE.plots.higgs.couplingRunSpec({
    mu: run.t.map(Math.exp), lambda: run.states.map((s) => s[0]), lower: band.lower, upper: band.upper,
    instabilityGeV: instability, treeLambda: run.states[0][0], mtGeV: mt,
  }), [run, band, instability, mt]);
  const diagramSpec = useMemo(() => window.QGA_FIGURE.plots.higgs.stabilityDiagramSpec({
    boundaries, measured: { mt: PDG.mt, mH: PDG.mH }, probe: moved ? { mt, mH } : null, mtDomain: HG_DIAGRAM_MT, mHDomain: HG_MH_RANGE,
  }), [boundaries, moved, mt, mH]);

  const build = async (ctx) => {
    const { buildMexicanHat } = await window.QGA_SM_VIZ.loadMexicanHat();
    return buildMexicanHat(ctx, { control, vGeV: v });
  };

  return (
    <div className="viz-frame hg-lab">
      <div className="viz-toolbar hg-bar" role="group" aria-label="Higgs lab controls">
        <button type="button" className={"btn hg-btn" + (symmetric ? " on" : "")} aria-pressed={symmetric}
          onClick={() => setSymmetric(!symmetric)}>Symmetric phase</button>
        <button type="button" className="btn hg-btn" disabled={!moved} onClick={() => { setMt(PDG.mt.value); setMH(PDG.mH.value); }}>measured masses</button>
      </div>
      <Scene3D animated={false} nodeKit height={440} invalidateKey={symmetric}
        aria="Three-dimensional Mexican hat: the Higgs potential over the complex plane of the field, a ring of minima at the vacuum value, a red arrow along the radial direction and a cyan arrow along the flat Goldstone direction."
        initial={{ radius: 15.5, theta: -1.45, phi: 0.95, minR: 6, maxR: 34, target: [0, 0.8, 0] }}
        build={build} deps={[]}
        fallback={<div className="lab-fallback">The 3-D Higgs potential needs WebGL; the plots and readouts below are computed without it.</div>}></Scene3D>
      <VizCaption provenanceId="sm-higgs-hat" status="established">
        The surface is the formula: its height is <Eq tex="V/\lambda v^4 = x^4/4 - s\,x^2/2"></Eq> with <Eq tex="x=|\phi|/v"></Eq>, compiled
        to the GPU from the same expression as the typeset card below. Convention: <Eq tex="V=-\mu^2|H|^2+\lambda|H|^4"></Eq>, so the Higgs
        phase is <Eq tex="\mu^2>0"></Eq> and <Eq tex="s=\mu^2/\lambda v^2=1"></Eq>. The gold ring is the vacuum circle <Eq tex="|\phi|=v"></Eq>;
        along the red arrow the surface curves with <Eq tex="m_H^2=2\lambda v^2"></Eq>, along the cyan arrow it is flat (the Goldstone modes
        that become the longitudinal W and Z). The symmetric phase flips the sign of <Eq tex="\mu^2"></Eq> as a what-if; the physical point
        stays pinned at <Eq tex="|\phi|=v"></Eq>. The vertical scale is one display factor.
      </VizCaption>
      <div className="viz-toolbar hg-bar hg-controls">
        <div className="hg-sliders">
          <SliderRow label="top quark mass" min={HG_MT_RANGE[0]} max={HG_MT_RANGE[1]} step={0.05} value={mt}
            onChange={setMt} format={(x) => x.toFixed(2) + " GeV"}></SliderRow>
          <SliderRow label="Higgs boson mass" min={HG_MH_RANGE[0]} max={HG_MH_RANGE[1]} step={0.01} value={mH}
            onChange={setMH} format={(x) => x.toFixed(2) + " GeV"}></SliderRow>
        </div>
      </div>
      <Figure spec={runningSpec}>
        Two-loop running of <Eq tex="\lambda"></Eq> from <Eq tex="\mu=m_t"></Eq> to the Planck mass for {moved ? "the chosen" : "the measured"} masses.
        The cyan dot is the tree-level <Eq tex="\lambda=m_H^2/2v^2"></Eq> from the Higgs mass, the band the <Eq tex="1\sigma"></Eq> ranges of <Eq tex="m_t"></Eq> and{" "}
        <Eq tex="\alpha_s"></Eq>, and the rule the scale where <Eq tex="\lambda"></Eq> crosses zero.
      </Figure>
      <VizCaption provenanceId="sm-higgs-running" status="effective">
        Inputs: {H.PDG_SOURCE.edition}, retrieved {H.PDG_SOURCE.retrieved}, and the two-loop equations of Buttazzo et al. (2013).
        This is the Standard Model alone, extrapolated 17 decades with no new physics, from a leading-order matching at <Eq tex="m_t"></Eq>; the full
        threshold corrections of the literature move the zero of <Eq tex="\lambda"></Eq> up to about <Eq tex="10^{10}\,\mathrm{GeV}"></Eq> (see the provenance drawer).
        The top mass is the direct-measurement average, ambiguous by about 0.2 GeV.
      </VizCaption>
      <Figure spec={diagramSpec}>
        The (<Eq tex="m_t"></Eq>, <Eq tex="m_H"></Eq>) plane divided by this lab's own running into absolutely stable, metastable and unstable. The black
        ellipse is the measured point with its <Eq tex="1\sigma"></Eq> errors{moved ? "; the triangle is the masses set above" : ""}.
      </Figure>
      <VizCaption provenanceId="sm-higgs-stability" status="effective">
        Metastable means the electroweak vacuum is not the lowest state but the chance that a bubble of true vacuum formed in our past light
        cone is below one (Buttazzo et al., eq. 83). The lines move with the matching: they show the structure of the plane, not the
        published boundary position.
      </VizCaption>
      <div className="hg-readouts">
        <div className="readout"><div className="readout-label">vacuum value <Eq tex="v"></Eq></div>
          <div className="readout-value">{v.toFixed(2)} GeV</div></div>
        <div className="readout"><div className="readout-label">tree quartic at <Eq tex="m_t"></Eq></div>
          <div className="readout-value">{run.states[0][0].toFixed(5)}</div></div>
        <div className="readout"><div className="readout-label">quartic crosses zero</div>
          <div className="readout-value">{instability
            ? <Eq tex={hgSciTex(instability, 2) + "\\,\\mathrm{GeV}"}></Eq>
            : <React.Fragment>never below <Eq tex="M_{\mathrm{Pl}}"></Eq></React.Fragment>}</div></div>
        <div className="readout"><div className="readout-label">smallest quartic</div>
          <div className="readout-value">{decay.lambdaMin.toFixed(4)} at <Eq tex={hgSciTex(decay.scaleGeV, 1) + "\\,\\mathrm{GeV}"}></Eq></div></div>
        <div className="readout"><div className="readout-label">vacuum</div>
          <div className="readout-value">{HG_REGION_TEXT[region]}{Number.isFinite(decay.log10Probability)
            ? <React.Fragment> · <Eq tex={"\\log_{10}p = " + decay.log10Probability.toFixed(0)}></Eq></React.Fragment> : null}</div></div>
      </div>
      <div className="hg-cards">
        <FormulaCard title="Higgs potential" formulaId="higgs-potential" status="established"
          symbols={[
            { s: "x", d: "Radial Higgs field $h$ in units of the vacuum value $v = (\\sqrt{2}\\,G_F)^{-1/2}$, $x = h/v$." },
            { s: "s", d: "$\\mu^2$ in units of $\\lambda v^2$: $1$ in the Higgs phase, zero or less in the symmetric phase." },
          ]}
          meaning="In units of $\lambda v^4$ the whole potential has no free number: a quartic wall and a quadratic term whose sign decides whether the origin or a ring of minima at $|\phi| = v$ is the vacuum."
          limits="Tree level. Radiative corrections change the shape; the running of $\lambda$ is in the figure."></FormulaCard>
        <FormulaCard title="Tree-level quartic coupling" formulaId="higgs-quartic-tree" status="established"
          symbols={[
            { s: "m_H", d: "Higgs boson pole mass." },
            { s: "v", d: "Vacuum expectation value from the Fermi constant." },
          ]}
          meaning="The radial curvature of the potential at its minimum is $m_H^2 = 2\lambda v^2$, which fixes $\lambda$ once the Higgs mass and $v$ are measured: about $0.129$ at the top-quark mass."
          limits="Before radiative matching: the $\overline{\mathrm{MS}}$ value of $\lambda$ at $m_t$ is 2 to 3 percent lower once the loop corrections are included."></FormulaCard>
      </div>
      <ConceptBridge id="higgs-rg" go={go}></ConceptBridge>
      <ConceptBridge id="higgs-planck" go={go}></ConceptBridge>
    </div>
  );
}

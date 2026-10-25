// neutrino-lab.jsx — three-flavour neutrino oscillations in constant-density matter (S12).
// The calculation is js/science/neutrino.mjs (window.QGA_NEUTRINO) and the figure is the Figure Kit flavour ribbon
// (js/figure/plots/neutrino.mjs); this file holds the controls and the readouts.

const NU_FLAVOUR_TEX = ["\\nu_e", "\\nu_\\mu", "\\nu_\\tau"];
const NU_FLAVOUR_PLAIN = ["electron", "muon", "tau"];
const NU_BASELINE_SPAN = 2.5; // the L/E axis runs to this many design L/E
const NU_DIAL_RADIUS = 52;
const NU_DIAL_STEP = 1;
const NU_DIAL_BIG_STEP = 15;

const nuPoint = (degrees, radius) => {
  const a = (degrees * Math.PI) / 180;
  return [radius * Math.sin(a), -radius * Math.cos(a)];
};

/** The delta_CP dial: an engraved circle, keyboard steps of 1 degree (15 with Shift or the Page keys), drag with a pointer. */
function DeltaCpDial({ value, onChange, band }) {
  const dragging = useRef(false);
  const clamp = (v) => Math.max(0, Math.min(360, Math.round(v)));
  const fromPointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2), dy = event.clientY - (rect.top + rect.height / 2);
    const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI;
    onChange(clamp((degrees + 360) % 360));
  };
  const onKeyDown = (event) => {
    const big = event.shiftKey ? NU_DIAL_BIG_STEP : NU_DIAL_STEP;
    const moves = { ArrowRight: big, ArrowUp: big, ArrowLeft: -big, ArrowDown: -big, PageUp: NU_DIAL_BIG_STEP, PageDown: -NU_DIAL_BIG_STEP };
    if (event.key in moves) onChange(clamp(value + moves[event.key]));
    else if (event.key === "Home") onChange(0);
    else if (event.key === "End") onChange(360);
    else return;
    event.preventDefault();
  };
  const ticks = [];
  for (let d = 0; d < 360; d += NU_DIAL_BIG_STEP) {
    const major = d % 90 === 0;
    const [x1, y1] = nuPoint(d, NU_DIAL_RADIUS + 1), [x2, y2] = nuPoint(d, NU_DIAL_RADIUS + (major ? 8 : 4));
    ticks.push(<line key={d} className={"nu-dial-tick" + (major ? " major" : "")} x1={x1} y1={y1} x2={x2} y2={y2}></line>);
  }
  const [hx, hy] = nuPoint(value, NU_DIAL_RADIUS);
  let arc = null;
  if (band) {
    const inner = NU_DIAL_RADIUS - 6;
    const [x1, y1] = nuPoint(band[0], inner), [x2, y2] = nuPoint(band[1], inner);
    arc = <path className="nu-dial-band" d={`M ${x1} ${y1} A ${inner} ${inner} 0 ${band[1] - band[0] > 180 ? 1 : 0} 1 ${x2} ${y2}`}></path>;
  }
  return (
    <div className="nu-dial-wrap">
      <svg className="nu-dial" viewBox="-70 -70 140 140" role="slider" tabIndex={0} aria-label="CP phase delta"
        aria-valuemin={0} aria-valuemax={360} aria-valuenow={value} aria-valuetext={value + " degrees"}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e); }}
        onPointerMove={(e) => { if (dragging.current) fromPointer(e); }}
        onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
        <circle className="nu-dial-ring" r={NU_DIAL_RADIUS}></circle>
        {arc}
        {ticks}
        <text className="nu-dial-label" x="0" y="-30" textAnchor="middle">0°</text>
        <text className="nu-dial-label" x="30" y="4" textAnchor="middle">90°</text>
        <text className="nu-dial-label" x="0" y="38" textAnchor="middle">180°</text>
        <text className="nu-dial-label" x="-30" y="4" textAnchor="middle">270°</text>
        <line className="nu-dial-hand" x1="0" y1="0" x2={hx} y2={hy}></line>
        <circle className="nu-dial-knob" cx={hx} cy={hy} r="5"></circle>
      </svg>
      <div className="nu-dial-readout"><Eq tex="\delta_{\mathrm{CP}}"></Eq> = {value}°</div>
    </div>
  );
}

const nuPreset = (e) => ({ id: e.id, L: e.baselineKm, rho: e.rhoGcm3, initial: e.initialFlavour, anti: e.antineutrino, E: e.peakEnergyGeV });

function NeutrinoLab() {
  const N = window.QGA_NEUTRINO;
  const experiments = N.EXPERIMENTS;
  const variant = N.NUFIT.variants[N.DEFAULT_VARIANT];
  const [preset, setPreset] = useState(() => nuPreset(experiments[0]));
  const [ordering, setOrdering] = useState("NO");
  const [degrees, setDegrees] = useState(() => Math.round(variant.NO.deltaCP.value));
  const [mode, setMode] = useState("energy");
  const [channel, setChannel] = useState(0);
  const experiment = experiments.find((e) => e.id === preset.id) ?? null;
  const fit = variant[ordering];
  const params = useMemo(() => ({ ...N.defaultParams(ordering), deltaCP: (degrees * Math.PI) / 180 }), [ordering, degrees]);
  const energyMode = mode === "energy";
  const energyRange = experiment ? experiment.energyRangeGeV : [0.1, 2 * Math.max(0.5, preset.E)];
  const range = energyMode ? energyRange : [0, (NU_BASELINE_SPAN * preset.L) / preset.E];
  const fixed = energyMode ? preset.L : preset.E;
  const matter = preset.rho > 0;

  const spec = useMemo(() => {
    const common = { initial: preset.initial, mode, range, fixed, params, antineutrino: preset.anti };
    const curves = N.flavourCurves({ ...common, rhoGcm3: preset.rho });
    const ghost = matter ? N.flavourCurves({ ...common, rhoGcm3: 0 }) : null;
    const markX = energyMode ? preset.E : preset.L / preset.E;
    const marker = markX >= range[0] && markX <= range[1] ? { x: markX, text: experiment ? experiment.label : "design point" } : null;
    return window.QGA_FIGURE.plots.neutrino.flavourRibbonSpec({
      curves, ghost, mode, channel, initial: preset.initial, antineutrino: preset.anti, matter, marker,
    });
  }, [params, preset, mode, channel, range[0], range[1], fixed, matter]);

  const point = useMemo(() => N.oscillationProbabilities({
    E_GeV: preset.E, L_km: preset.L, params, rhoGcm3: preset.rho, antineutrino: preset.anti,
  })[preset.initial], [params, preset]);
  const potential = N.matterPotentialEv({ rhoGcm3: preset.rho });
  const resonance = N.resonanceEnergyGeV({ dm31: params.dm31, theta13: params.theta13, rhoGcm3: preset.rho });
  const resonanceFor = (params.dm31 > 0) !== preset.anti ? "neutrinos" : "antineutrinos";
  const setOrderingAndFit = (next) => { setOrdering(next); setDegrees(Math.round(variant[next].deltaCP.value)); };
  const band = [Math.max(0, fit.deltaCP.value - fit.deltaCP.minus), Math.min(360, fit.deltaCP.value + fit.deltaCP.plus)];

  return (
    <div className="viz-frame nu-lab">
      <div className="viz-toolbar nu-bar" role="group" aria-label="Experiment presets">
        {experiments.map((e) => (
          <button key={e.id} type="button" className={"btn nu-btn" + (preset.id === e.id ? " on" : "")} aria-pressed={preset.id === e.id}
            onClick={() => setPreset(nuPreset(e))}>{e.label} · {e.baselineKm} km</button>
        ))}
      </div>
      <div className="viz-toolbar nu-bar">
        <span className="seg" role="group" aria-label="Initial flavour">
          {NU_FLAVOUR_PLAIN.map((name, i) => (
            <button key={name} type="button" className={"btn nu-btn" + (preset.initial === i ? " on" : "")} aria-pressed={preset.initial === i}
              aria-label={"Born as " + name} onClick={() => setPreset({ ...preset, initial: i })}><Eq tex={NU_FLAVOUR_TEX[i]}></Eq></button>
          ))}
        </span>
        <span className="seg" role="group" aria-label="Neutrino or antineutrino">
          <button type="button" className={"btn nu-btn" + (!preset.anti ? " on" : "")} aria-pressed={!preset.anti} onClick={() => setPreset({ ...preset, anti: false })}>ν</button>
          <button type="button" className={"btn nu-btn" + (preset.anti ? " on" : "")} aria-pressed={preset.anti} onClick={() => setPreset({ ...preset, anti: true })}>ν̄</button>
        </span>
        <span className="seg" role="group" aria-label="Mass ordering">
          <button type="button" className={"btn nu-btn" + (ordering === "NO" ? " on" : "")} aria-pressed={ordering === "NO"} onClick={() => setOrderingAndFit("NO")}>NO</button>
          <button type="button" className={"btn nu-btn" + (ordering === "IO" ? " on" : "")} aria-pressed={ordering === "IO"} onClick={() => setOrderingAndFit("IO")}>IO</button>
        </span>
        <span className="seg" role="group" aria-label="Horizontal axis">
          <button type="button" className={"btn nu-btn" + (energyMode ? " on" : "")} aria-pressed={energyMode} onClick={() => setMode("energy")}>E at fixed L</button>
          <button type="button" className={"btn nu-btn" + (!energyMode ? " on" : "")} aria-pressed={!energyMode} onClick={() => setMode("baseline")}>L/E at fixed E</button>
        </span>
        <span className="seg" role="group" aria-label="Highlighted flavour">
          {NU_FLAVOUR_PLAIN.map((name, i) => (
            <button key={name} type="button" className={"btn nu-btn" + (channel === i ? " on" : "")} aria-pressed={channel === i}
              aria-label={"Highlight " + name} onClick={() => setChannel(i)}><Eq tex={NU_FLAVOUR_TEX[i]}></Eq></button>
          ))}
        </span>
      </div>
      <div className="viz-toolbar nu-bar nu-controls">
        <DeltaCpDial value={degrees} onChange={setDegrees} band={band}></DeltaCpDial>
        <div className="nu-sliders">
          <SliderRow label="matter density" min={0} max={13} step={0.01} value={preset.rho}
            onChange={(v) => setPreset({ ...preset, rho: v })} format={(v) => v.toFixed(2) + " g/cm³"}></SliderRow>
          <SliderRow label="baseline L" min={10} max={13000} step={10} value={preset.L}
            onChange={(v) => setPreset({ ...preset, id: "custom", L: v })} format={(v) => v + " km"}></SliderRow>
          {energyMode ? null : (
            <SliderRow label="energy E" min={0.002} max={10} step={0.002} value={preset.E}
              onChange={(v) => setPreset({ ...preset, id: "custom", E: v })} format={(v) => v.toFixed(3) + " GeV"}></SliderRow>
          )}
          <button type="button" className="btn nu-btn" onClick={() => setDegrees(Math.round(fit.deltaCP.value))}>δ best fit {Math.round(fit.deltaCP.value)}°</button>
        </div>
      </div>
      <Figure spec={spec}>
        Exact three-flavour oscillation, <Eq tex="P(\nu_\alpha\to\nu_\beta)=|\langle\nu_\beta|e^{-iHL}|\nu_\alpha\rangle|^2"></Eq>, with the PMNS matrix
        at the {N.NUFIT_SOURCE.release} best fit ({variant.label}). The arc inside the dial is the 1σ range
        of <Eq tex="\delta_{\mathrm{CP}}"></Eq>, which the fit itself calls indicative only. Matter is one constant density with <Eq tex="Y_e=0.5"></Eq>.
      </Figure>
      <div className="nu-readouts">
        <div className="readout"><div className="readout-label">at the design point</div>
          <div className="readout-value">P<sub>e</sub> {point[0].toFixed(4)} · P<sub>μ</sub> {point[1].toFixed(4)} · P<sub>τ</sub> {point[2].toFixed(4)}</div></div>
        <div className="readout"><div className="readout-label">matter potential V</div>
          <div className="readout-value">{potential === 0 ? "0 (vacuum)" : potential.toExponential(2) + " eV"}</div></div>
        <div className="readout"><div className="readout-label">1–3 resonance ({resonanceFor})</div>
          <div className="readout-value">{Number.isFinite(resonance) ? Math.abs(resonance).toFixed(1) + " GeV" : "none without matter"}</div></div>
      </div>
      <VizCaption provenanceId={matter ? "sm-neutrino-flavour-matter" : "sm-neutrino-flavour-vacuum"} status={matter ? "effective" : "established"}>
        Source: {N.NUFIT_SOURCE.release}, {N.NUFIT_SOURCE.table}, retrieved {N.NUFIT_SOURCE.retrieved}. Neutrino oscillation is the laboratory-confirmed crack in
        the minimal Standard Model: it needs neutrino masses. The curves are probabilities for single-energy neutrinos, not event rates.
      </VizCaption>
      <div className="nu-cards">
        <FormulaCard title="Two-flavour limit" formulaId="two-flavour-oscillation" status="established"
          symbols={[
            { s: "\\theta", d: "Mixing angle of the two flavours." },
            { s: "\\Delta m^2", d: "Difference of the squared masses of the two mass states." },
            { s: "L", d: "Baseline: the distance from source to detector." },
            { s: "E", d: "Neutrino energy." },
          ]}
          meaning="With $\theta_{13}=0$ and $\Delta m^2_{21}=0$ the three-flavour result reduces to this formula, which the tests check to $10^{-9}$. The $1.267$ is $1/(4\hbar c)$ in $\mathrm{eV}^2$, km and GeV."
          limits="Vacuum, two flavours. The three-flavour calculation above is exact for three flavours and constant density."></FormulaCard>
        <FormulaCard title="Matter potential" formulaId="matter-potential" status="established"
          symbols={[
            { s: "G_F", d: "Fermi coupling constant of the weak interaction." },
            { s: "N_e", d: "Electron number density, $\\rho Y_e/m_u$." },
          ]}
          meaning="Electron neutrinos scatter forward on the electrons of matter and acquire this energy; antineutrinos acquire its negative. It is why neutrinos and antineutrinos oscillate differently inside the Earth."
          limits="Charged-current term only, constant density. Neutral-current scattering is the same for all flavours and drops out."></FormulaCard>
      </div>
    </div>
  );
}

// amplitude-room.jsx — the amplitude room of the QFT module: a 2 → 2 process bench with the Mandelstam variables recomputed live, the angular
// distribution in polar form and split into its channels (S16: photon, Z and their interference; s, t and u terms), and the tree-level γ + Z energy
// scan of the cross-section and the forward-backward asymmetry beside the LEP Z-pole values. Every number is a pure function in
// js/science/electroweak.mjs or js/physics.mjs; the animation is presentation only. The JSX sources are evaluated as one script, so feyAnalyze
// from mod-qft.jsx is shared and resolved when the components render.

const QFT_M_E = 0.51099895e-3; // GeV — electron rest energy (CODATA)

const QFT_PROCESSES = [
{
  id: "s-channel",
  name: "e⁺e⁻ → μ⁺μ⁻", nameTex: "e^+e^-\\to\\mu^+\\mu^-",
  sub: "γ + Z exchange",
  in: ["e-", "e+"], out: ["mu-", "mu+"],
  masses: [0, 0, 0, 0],
  angleLabel: "cos θ (μ⁻)",
  shapeLabel: "$A_0(1+\\cos^2\\theta)+A_1\\cos\\theta$",
  shapeTex: "\\dfrac{d\\sigma}{d\\cos\\theta} = \\dfrac{\\pi\\alpha^2}{2s}\\left[A_0(1+\\cos^2\\theta) + A_1\\cos\\theta\\right]",
  ref: "Peskin & Schroeder, An Introduction to QFT, §5.1; PDG 2026 electroweak review; LEP/SLD, Phys. Rep. 427 (2006)",
  note: "Tree level, massless fermions. A₀ and A₁ carry the photon, the Z and their interference; at √s ≪ M_Z they reduce to the pure-QED 1 + cos²θ."
},
{
  id: "bhabha",
  name: "e⁺e⁻ → e⁺e⁻", nameTex: "e^+e^-\\to e^+e^-",
  sub: "Bhabha scattering",
  in: ["e-", "e+"], out: ["e-", "e+"],
  masses: [0, 0, 0, 0],
  angleLabel: "cos θ (e⁻)",
  shapeLabel: "s, t and interference",
  shapeTex: "\\dfrac{d\\sigma}{d\\Omega} = \\dfrac{\\alpha^2}{2s}\\left[\\dfrac{s^2+u^2}{t^2} + \\dfrac{2u^2}{st} + \\dfrac{t^2+u^2}{s^2}\\right]",
  ref: "Massless QED, derived from helicity amplitudes and cross-checked in test/electroweak.test.mjs",
  note: "Photon exchange in the s and t channels. The t channel gives the Coulomb pole at small angles; the interference term is negative."
},
{
  id: "moller",
  name: "e⁻e⁻ → e⁻e⁻", nameTex: "e^-e^-\\to e^-e^-",
  sub: "Møller scattering",
  in: ["e-", "e-"], out: ["e-", "e-"],
  masses: [0, 0, 0, 0],
  angleLabel: "cos θ (e⁻)",
  shapeLabel: "t, u and interference",
  shapeTex: "\\dfrac{d\\sigma}{d\\Omega} = \\dfrac{\\alpha^2}{2s}\\left[\\dfrac{s^2+u^2}{t^2} + \\dfrac{2s^2}{tu} + \\dfrac{s^2+t^2}{u^2}\\right]",
  ref: "Massless QED, derived from helicity amplitudes and cross-checked in test/electroweak.test.mjs",
  note: "Identical electrons: symmetric under θ → π − θ, with a pole at both ends. The curve covers the full range of cos θ; a total cross-section integrates over half the sphere."
},
{
  id: "t-channel",
  name: "e⁻μ⁻ → e⁻μ⁻", nameTex: "e^-\\mu^-\\to e^-\\mu^-",
  sub: "t-channel exchange",
  in: ["e-", "mu-"], out: ["e-", "mu-"],
  masses: [0, 0, 0, 0],
  angleLabel: "cos θ (e⁻)",
  shapeLabel: "$(s^2+u^2)/t^2$",
  shapeTex: "\\dfrac{d\\sigma}{d\\Omega} = \\dfrac{\\alpha^2}{2s}\\,\\dfrac{s^2+u^2}{t^2}",
  ref: "Massless QED, derived and cross-checked in test/electroweak.test.mjs; Mott (1929) for the forward pole",
  note: "A single photon in the t channel: the complete massless result, whose small-angle limit is the Rutherford pole 1/sin⁴(θ/2)."
},
{
  id: "compton",
  name: "γe⁻ → γe⁻", nameTex: "\\gamma e^-\\to\\gamma e^-",
  sub: "Compton scattering",
  in: ["ph", "e-"], out: ["ph", "e-"],
  masses: [0, QFT_M_E, 0, QFT_M_E],
  angleLabel: "cos θ (γ)",
  shapeLabel: "Klein–Nishina",
  shapeTex: "\\dfrac{d\\sigma}{d\\Omega} = \\dfrac{\\alpha^2}{2m_e^2}\\left(\\dfrac{E'}{E}\\right)^{2}\\left[\\dfrac{E'}{E} + \\dfrac{E}{E'} - \\sin^2\\theta\\right]",
  ref: "Klein & Nishina (1929)",
  note: "x = E_γ/mₑc² is a separate lab-frame slider, decoupled from √s: tying x to a 10 GeV centre-of-mass energy would give x ≈ 2 × 10⁸ and a visually degenerate curve."
}];

/* The shape of the angular distribution of a process: the sum of its channels, or Klein–Nishina. The poles at cos θ = ±1 are sampled just inside. */
const QFT_POLE_MARGIN = 1 - 1e-6;
function qftShape({ process, sqrtS, cosTheta, photonX }) {
  const c = Math.max(-QFT_POLE_MARGIN, Math.min(QFT_POLE_MARGIN, cosTheta));
  if (process.id === "compton") return window.QGA_PHYSICS.angularDistribution({ process: "compton", cosTheta: c, photonX });
  return window.QGA_ELECTROWEAK.science.channelDecomposition(process.id, sqrtS, c).total;
}

function useQFTFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {if (live) setReady(true);});
    }
    return () => {live = false;};
  }, []);
  return ready;
}

/* DPR-aware canvas sizing. `draw(ctx, w, h)` receives CSS-pixel dimensions. */
function useQFTCanvas(draw, deps) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth,h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);cv.height = Math.round(h * dpr);
    }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h);
  }, deps);
  return ref;
}

/* Readout card. `formula` stays the plain-text caption for callers that pass
   prose; `formulaTex` carries the governing relation as KaTeX, and `note` keeps
   a prose gloss that would otherwise have to be crammed into the TeX. */
function QFTReadout({ label, labelTex, value, unit, formula, formulaTex, note, lead }) {
  return (
    <div className={"kerr-readout" + (lead ? " lead" : "")}>
      <div className="kerr-readout-label">{labelTex ? <Eq tex={labelTex}></Eq> : label}</div>
      <div className="kerr-readout-value">{value}{unit ? <span className="unit">{unit}</span> : null}</div>
      {formulaTex
        ? <div className="kerr-readout-formula"><Eq tex={formulaTex}></Eq></div>
        : formula ? <div className="kerr-readout-formula">{formula}</div> : null}
      {note ? <div className="kerr-readout-note">{note}</div> : null}
    </div>);

}

/* Scattering plane: the dσ/dΩ envelope drawn in polar coordinates, with the
   two incoming packets converging on the vertex and the outgoing pair
   receding at ±θ. */
function QFTScatterCanvas({ process, sqrtS, cosTheta, photonX, tau, fontsReady }) {
  const ref = useQFTCanvas((ctx, w, h) => {
    const cx = w * 0.5,cy = h * 0.5;
    const R = Math.min(w * 0.40, h * 0.42);
    const shape = (c) => qftShape({ process, sqrtS, cosTheta: c, photonX });
    const s90 = shape(0) || 1;
    let maxRatio = 0;
    for (let i = 0; i <= 180; i++) maxRatio = Math.max(maxRatio, shape(-1 + 2 * i / 180) / s90);
    const rMax = Math.min(6, maxRatio);
    const radius = (c) => R * Math.min(6, shape(c) / s90) / rMax;

    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.10);
    ctx.lineWidth = 1;
    ctx.beginPath();ctx.arc(cx, cy, R, 0, Math.PI * 2);ctx.stroke();
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.06);
    for (const f of [0.5, 0.75]) {
      ctx.beginPath();ctx.arc(cx, cy, R * f, 0, Math.PI * 2);ctx.stroke();
    }

    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.28);
    ctx.beginPath();ctx.moveTo(cx - R * 1.18, cy);ctx.lineTo(cx + R * 1.18, cy);ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.22);
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const tx = cx + R * 1.18 * i / 3;
      ctx.beginPath();ctx.moveTo(tx, cy - 3);ctx.lineTo(tx, cy + 3);ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i <= 360; i++) {
      const a = i / 360 * Math.PI * 2;
      const r = radius(Math.cos(a));
      const x = cx + r * Math.cos(a),y = cy - r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    grad.addColorStop(0, QGA_TOKENS.alpha("pigment-azure-76", 0.20));
    grad.addColorStop(1, QGA_TOKENS.alpha("pigment-violet-59", 0.05));
    ctx.fillStyle = grad;ctx.fill();
    ctx.save();
    ctx.shadowColor = QGA_TOKENS.alpha("pigment-azure-80-c11", 0.6);
    ctx.shadowBlur = 9;
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-azure-80-c11", 0.6);ctx.lineWidth = 1.4;ctx.stroke();
    ctx.restore();

    const L = R * 1.05;
    const th = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
    const pr = Math.max(5, R * 0.075);
    const blob = (x, y, tint) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, pr);
      g.addColorStop(0, QGA_TOKENS.alpha(tint, 0.95));
      g.addColorStop(0.45, QGA_TOKENS.alpha(tint, 0.35));
      g.addColorStop(1, QGA_TOKENS.alpha(tint, 0));
      ctx.fillStyle = g;
      ctx.beginPath();ctx.arc(x, y, pr, 0, Math.PI * 2);ctx.fill();
    };
    if (tau <= 0.5) {
      const f = 1 - tau / 0.5;
      blob(cx - L * f, cy, "pigment-azure-80-c11");
      blob(cx + L * f, cy, "pigment-red-78");
    } else {
      const g = (tau - 0.5) / 0.5;
      blob(cx + L * g * Math.cos(th), cy - L * g * Math.sin(th), "pigment-azure-80-c11");
      blob(cx - L * g * Math.cos(th), cy + L * g * Math.sin(th), "pigment-red-78");
    }

    const flash = Math.max(0, 1 - Math.abs(tau - 0.5) / 0.14);
    if (flash > 0.01) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5 * flash);
      g.addColorStop(0, QGA_TOKENS.alpha("pigment-amber-94-c07", 0.85 * flash));
      g.addColorStop(1, QGA_TOKENS.alpha("pigment-amber-86-c14", 0));
      ctx.fillStyle = g;
      ctx.beginPath();ctx.arc(cx, cy, R * 0.5 * flash, 0, Math.PI * 2);ctx.fill();
    }

    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-amber-89", 0.75);
    ctx.lineWidth = 1.2;
    ctx.beginPath();ctx.arc(cx, cy, R * 0.34, 0, -th, true);ctx.stroke();
    ctx.font = QGA_TOKENS.monoPx(10);
    ctx.fillStyle = QGA_TOKENS.alpha("pigment-amber-89", 0.9);
    ctx.fillText("θ = " + (th * 180 / Math.PI).toFixed(0) + "°",
    cx + R * 0.44 * Math.cos(th / 2) - 14, cy - R * 0.44 * Math.sin(th / 2) + 3);

    ctx.font = QGA_TOKENS.monoPx(9.5);
    ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.55);
    ctx.fillText("incoming", 8, cy - 8);
    ctx.fillText("forward", cx + R * 1.18 - 42, cy - 8);
    ctx.fillStyle = QGA_TOKENS.alpha("pigment-azure-80-c11", 0.5);
    ctx.fillText("dσ/dΩ", 8, 14);
  }, [process.id, sqrtS, cosTheta, photonX, tau, fontsReady]);
  return (
    <canvas ref={ref} className="qft-scatter"
    aria-label="Scattering plane: polar angular cross-section envelope with animated wave packets"></canvas>);

}

/* Spacetime picture: the two incoming packets converge along the beam axis,
   meet at τ = 0.5, and the outgoing pair recedes with longitudinal speed
   cos θ. The fringe pattern is the superposition of the two carrier waves. */
function QFTWaterfall({ cosTheta, tau }) {
  const spec = useMemo(() => window.QGA_FIGURE.plots.qft.waterfallSpec({ cosTheta, tau }), [cosTheta, tau]);
  return <Figure spec={spec}></Figure>;
}

/* Angular distribution, normalised to its 90° value, split into its channels where the process has them: thin lines for the terms and the
   total as the focal line. Compton keeps the single Klein–Nishina curve. The y axis is clipped so the forward poles stay on screen. */
function QFTAngularPlot({ process, sqrtS, cosTheta, photonX }) {
  const spec = useMemo(() => process.id === "compton"
  ? window.QGA_FIGURE.plots.qft.angularSpec({ process, cosTheta, photonX })
  : window.QGA_FIGURE.plots.electroweak.channelsSpec({ processId: process.id, name: process.name, sqrtS, cosTheta }),
  [process.id, sqrtS, cosTheta, photonX]);
  return <Figure spec={spec}></Figure>;
}

/* The tree-level γ + Z energy scan of e⁺e⁻ → μ⁺μ⁻ from 10 to 200 GeV: the cross-section (log axis) and the forward-backward asymmetry stacked
   over one shared energy axis, with the LEP Z-pole values on the data layer. */
function QFTResonancePlot({ sqrtS }) {
  const sigma = useMemo(() => window.QGA_FIGURE.plots.electroweak.crossSectionSpec({ sqrtS }), [sqrtS]);
  const asymmetry = useMemo(() => window.QGA_FIGURE.plots.electroweak.asymmetrySpec({ sqrtS }), [sqrtS]);
  return (
    <div className="qft-stack">
      <Figure spec={sigma}></Figure>
      <Figure spec={asymmetry}></Figure>
    </div>);
}

function AmplitudeRoom() {
  const [atlasState, setAtlasState] = useQGAState();
  const processId = atlasState.qftProcess;
  const process = QFT_PROCESSES.find((p) => p.id === processId) || QFT_PROCESSES[0];
  const sqrtS = atlasState.qftSqrtS;
  const cosTheta = atlasState.qftAngle;
  const photonX = atlasState.qftPhotonX;
  const fontsReady = useQFTFontsReady();

  /* Presentation-only clock over a normalised τ ∈ [0, 1]. The physics
     readouts below do not depend on it. */
  const [tau, setTau] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const reducedMotion = useMemo(() =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  useEffect(() => {
    if (!playing) return undefined;
    let raf = 0,last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;last = now;
      setTau((t) => Math.min(1, t + dt * speed * 0.5));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);
  useEffect(() => {if (playing && tau >= 1) setPlaying(false);}, [tau, playing]);
  useEffect(() => {setTau(0);setPlaying(!reducedMotion);}, [processId, reducedMotion]);
  const togglePlay = () => {if (!playing && tau >= 1) setTau(0);setPlaying(!playing);};

  const kin = window.QGA_PHYSICS.mandelstamKinematics({ sqrtS, cosTheta, masses: process.masses });
  const EW = window.QGA_ELECTROWEAK.science;
  const sigma = EW.totalCrossSection(sqrtS);
  const asymmetry = EW.forwardBackwardAsymmetry(sqrtS);
  const shapeNow = qftShape({ process, sqrtS, cosTheta, photonX });
  const shape90 = qftShape({ process, sqrtS, cosTheta: 0, photonX });
  const verdict = feyAnalyze(process.in[0], process.in[1], process.out[0], process.out[1]);
  const identityOk = Math.abs(kin.residual) < 1e-6;
  const phase = tau < 0.46 ? "incoming" : tau > 0.54 ? "outgoing" : "interaction";

  return (
    <div className="viz-frame qft-room">
      <div className="kerr-observatory-head">
        <div className="kerr-head-plate">
          <div className="kerr-head-ident">QFT<span>AMP</span></div>
          <div>
            <h3>The Amplitude Room</h3>
            <p>A live 2 → 2 scattering bench: Mandelstam kinematics, angular distributions split into their channels, and the
            photon + Z energy scan, evaluated from the pure functions in <code>js/science/electroweak.mjs</code>.</p>
          </div>
        </div>
        <div className="kerr-head-state">
          <span className="badge badge-effective">Tree level, photon + Z</span>
          <div className="kerr-state-line">
            {process.name} · <Eq tex="\sqrt{s}"></Eq> = {sqrtS.toFixed(1)} GeV · <Eq tex="\cos\theta"></Eq> = {cosTheta.toFixed(2)}
          </div>
          <div className="kerr-state-line">
            <Eq tex="\sigma(\mu^+\mu^-)"></Eq> = {sigma.toFixed(4)} nb · {verdict.ok ? verdict.channels.join(" + ") + "-channel" : "forbidden"} · {phase}
          </div>
        </div>
      </div>

      <div className="kerr-instrument-bar">
        <div className="kerr-control-group" aria-label="Process">
          <span className="kerr-control-label">Process</span>
          {QFT_PROCESSES.map((p) =>
          <button key={p.id} className={"kerr-chip" + (p.id === process.id ? " on" : "")}
          aria-pressed={p.id === process.id}
          onClick={() => setAtlasState({ qftProcess: p.id })}><Eq tex={p.nameTex}></Eq></button>
          )}
        </div>
        <div className="kerr-control-group" aria-label="Kinematic controls">
          <SliderRow label="√s" min={1} max={200} step={0.5} value={sqrtS}
          onChange={(v) => setAtlasState({ qftSqrtS: v })} format={(v) => v.toFixed(1) + " GeV"}></SliderRow>
          <SliderRow label={process.angleLabel} min={-1} max={1} step={0.01} value={cosTheta}
          onChange={(v) => setAtlasState({ qftAngle: v })} format={(v) => v.toFixed(2)}></SliderRow>
          {process.id === "compton" ?
          <SliderRow label="x = E_γ/mₑc²" min={0.05} max={20} step={0.05} value={photonX}
          onChange={(v) => setAtlasState({ qftPhotonX: v })} format={(v) => v.toFixed(2)}></SliderRow> :
          null}
        </div>
      </div>

      <div className="qft-transport-strip">
        <span className="qft-transport-label">Collision clock</span>
        <div className="gw-transport" aria-label="Collision playback transport">
          <button className="gw-play-btn" onClick={togglePlay}
          aria-label={playing ? "Pause collision" : "Play collision"}>{playing ? "❚❚" : "▶"}</button>
          <button className="gw-replay-btn" onClick={() => {setTau(0);setPlaying(!reducedMotion);}}
          aria-label="Replay from the start">↺</button>
          <div className="gw-progress" role="slider" aria-label="Collision phase"
          aria-valuemin={0} aria-valuemax={1} aria-valuenow={Number(tau.toFixed(3))}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const r = e.currentTarget.getBoundingClientRect();
            setTau(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
          }}
          onPointerMove={(e) => {
            if (!(e.buttons & 1)) return;
            const r = e.currentTarget.getBoundingClientRect();
            setTau(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
          }}>
            <div className="gw-progress-fill" style={{ width: 100 * tau + "%" }}></div>
          </div>
          <span className="gw-time">τ = {tau.toFixed(2)}</span>
          <div className="gw-speed" aria-label="Playback speed">
            {[0.5, 1, 2, 4].map((s) =>
            <button key={s} className={"kerr-chip" + (speed === s ? " on" : "")} aria-pressed={speed === s}
            onClick={() => setSpeed(s)}>{s}×</button>
            )}
          </div>
        </div>
        <span className="qft-phase-chip">{phase}</span>
      </div>

      <div className="qft-stage">
        <figure className="qft-panel">
          <header className="qft-panel-head">
            <span className="qft-panel-title">Scattering plane</span>
            <span className="qft-panel-note">dσ/dΩ envelope · <RichText text={process.shapeLabel}></RichText></span>
          </header>
          <div className="qft-panel-body">
            <QFTScatterCanvas process={process} sqrtS={sqrtS} cosTheta={cosTheta} photonX={photonX} tau={tau}
            fontsReady={fontsReady}></QFTScatterCanvas>
          </div>
        </figure>
        <QFTWaterfall cosTheta={cosTheta} tau={tau}></QFTWaterfall>
      </div>

      <div className="qft-plots">
        <div>
          <div className="qft-formula"><Eq tex={process.shapeTex} display={true}></Eq></div>
          <QFTAngularPlot process={process} sqrtS={sqrtS} cosTheta={cosTheta} photonX={photonX}></QFTAngularPlot>
        </div>
        <QFTResonancePlot sqrtS={sqrtS}></QFTResonancePlot>
      </div>

      <div className="kerr-deck">
        <section className="kerr-rgroup">
          <header><h4>Mandelstam kinematics</h4><span>natural units · GeV²</span></header>
          <div className="kerr-rgrid">
            <QFTReadout lead labelTex="\sqrt{s}" value={sqrtS.toFixed(1)} unit="GeV"
            formula="centre-of-mass energy"></QFTReadout>
            <QFTReadout labelTex="s" value={kin.s.toFixed(2)} unit="GeV²"
            formulaTex="s = (p_1 + p_2)^2"></QFTReadout>
            <QFTReadout labelTex="t" value={kin.t.toFixed(2)} unit="GeV²"
            formulaTex="t = m_1^2 + m_3^2 - 2E_1E_3 + 2p_1p_3\cos\theta"></QFTReadout>
            <QFTReadout labelTex="u" value={kin.u.toFixed(2)} unit="GeV²"
            formulaTex="u = m_1^2 + m_4^2 - 2E_1E_4 - 2p_1p_3\cos\theta"></QFTReadout>
            <QFTReadout labelTex="\sum m_i^2" value={kin.sum.toFixed(4)} unit="GeV²"
            formulaTex="\Sigma\, m_i^2 = m_1^2 + m_2^2 + m_3^2 + m_4^2"></QFTReadout>
            <QFTReadout labelTex="s+t+u-\sum m_i^2" value={kin.residual.toExponential(1)} unit="GeV²"
            formula="exact identity — residual is floating-point noise"></QFTReadout>
          </div>
        </section>
        <section className="kerr-rgroup">
          <header><h4>Observables</h4><span>tree level</span></header>
          <div className="kerr-rgrid">
            <QFTReadout lead labelTex="\sigma(\mu^+\mu^-)" value={sigma.toFixed(4)} unit="nb"
            formulaTex="\sigma = \dfrac{4\pi\alpha^2}{3s}A_0"
            note="photon + Z, tree level"></QFTReadout>
            <QFTReadout labelTex="A_{\mathrm{FB}}" value={asymmetry.toFixed(4)}
            formulaTex="A_{\mathrm{FB}} = \dfrac{3A_1}{8A_0}"
            note="zero where the photon–Z interference cancels"></QFTReadout>
            <QFTReadout labelTex="\mathrm{shape\ at}\ \cos\theta" value={(shapeNow / shape90).toFixed(3)} unit="× 90°"
            formulaTex={process.shapeTex}></QFTReadout>
            {process.id === "compton" ?
            <QFTReadout label="photon energy ratio" value={photonX.toFixed(2)} unit="× mₑc²"
            formulaTex="x = E_\gamma / m_e c^2" note="lab frame"></QFTReadout> :
            <QFTReadout labelTex="\mathrm{beam\ energy}\ E_1" value={kin.E1.toFixed(2)} unit="GeV"
            formula="centre-of-mass frame"></QFTReadout>}
          </div>
        </section>
      </div>

      <div className="qft-identity">
        <span className={"kerr-check " + (identityOk ? "ok" : "bad")}>
          {identityOk ? "s + t + u = Σmᵢ² ✓" : "identity residual " + kin.residual.toExponential(1)}
        </span>
        <span className={"kerr-check " + (verdict.ok ? "ok" : "bad")}>
          {verdict.ok ? "conservation laws satisfied" : "forbidden process"}
        </span>
        <span className="qft-identity-note">{verdict.ok ? verdict.note : verdict.reason}</span>
      </div>

      <details className="kerr-validity">
        <summary>
          <span>Assumptions, validity &amp; uncertainty</span>
          <span className="kerr-check ok">tree level · closed forms</span>
        </summary>
        <div className="kerr-validity-body">
          <dl>
            <dt>What is exact</dt>
            <dd>
              The Mandelstam identity <Eq tex="s + t + u = \sum_i m_i^2"></Eq>, the tree-level <Eq tex="e^+e^-\to\mu^+\mu^-"></Eq> cross-section
              with its photon, <Eq tex="Z"></Eq> and interference terms, the complete massless Bhabha, Møller and electron–muon distributions, and the
              Klein–Nishina shape are closed-form results of the lowest order in the couplings. They are evaluated live by <code>js/science/electroweak.mjs</code>
              and <code>js/physics.mjs</code>, and covered by <code>node:test</code> cases: the <Eq tex="\gamma+Z"></Eq> form against an independent
              helicity-amplitude sum, the QED limit <Eq tex="\sigma = 4\pi\alpha^2/3s"></Eq>, the Rutherford limit of the poles and the
              <Eq tex="\theta\to\pi-\theta"></Eq> symmetry of Møller scattering.
            </dd>
            <dt>What is approximate</dt>
            <dd>
              Tree level only: no initial-state radiation, which at LEP lowers and broadens the Z peak by about a third, no loop corrections and a
              constant Z width. <Eq tex="\alpha"></Eq> is fixed at its Z-scale value for <Eq tex="\gamma+Z"></Eq> and does not run below the Z, so the
              10 GeV cross-section is about 13 percent higher than with <Eq tex="\alpha(0)"></Eq>. The LEP points are Z-pole pseudo-observables,
              deconvoluted for radiation, and are compared with the model only at the pole. Fermion masses are zero except in the Compton process.
              The Bhabha and Møller formulas were derived here and checked against each other, not copied from a printed source.
            </dd>
            <dt>What is schematic</dt>
            <dd>
              The scattering-plane and spacetime canvases are pedagogical animations. The wave packets are
              Gaussian envelopes with a carrier wave, not solutions of the QED amplitude; the envelope radius is
              the angular distribution normalised to its 90° value and clipped at 6×. The spacetime panel's
              longitudinal separation tracks cos θ, which is the correct kinematic trend, but the fringe pattern
              is a two-packet superposition rather than a field-theory calculation.
            </dd>
            <dt>References</dt>
            <dd>
              {process.ref}. Mandelstam variables: Mandelstam (1958). Klein–Nishina: Klein &amp; Nishina (1929).
              Inputs (PDG 2026): <Eq tex="M_Z = 91.1879\ \mathrm{GeV}"></Eq>, <Eq tex="\Gamma_Z = 2.4955\ \mathrm{GeV}"></Eq>,
              <Eq tex="\sin^2\theta_W = 0.23122"></Eq> (<Eq tex="\overline{\mathrm{MS}}"></Eq>). Fine-structure constant:
              <Eq tex="1/\alpha = 128.945"></Eq> at the Z scale (LEP Electroweak Working Group, Phys. Rep. 427, §1) for <Eq tex="\gamma+Z"></Eq>, CODATA
              <Eq tex="\alpha = 1/137.035999084"></Eq> for the QED processes. LEP/SLD pole values: Phys. Rep. 427 (2006), doi:10.1016/j.physrep.2005.12.006,
              Table 2.13.
            </dd>
            <dt>Units</dt>
            <dd>
              Natural units <Eq tex="\hbar = c = 1"></Eq>. Energies in GeV, cross-sections in nanobarns
              (<Eq tex="1\ \mathrm{GeV}^{-2} = 3.8938\times10^{5}\ \mathrm{nb}"></Eq>). The Compton slider
              <Eq tex="x"></Eq> is a lab-frame ratio and is deliberately decoupled from <Eq tex="\sqrt{s}"></Eq>.
            </dd>
          </dl>
        </div>
      </details>

      <VizCaption provenanceId="qft-scattering-explorer" status="schematic">
        The readouts and curves are tree-level results, with the LEP Z-pole values marked on the energy scan; the two canvases are a schematic
        animation of the same process. Drag the transport to scrub the collision, or change the energy and the angle to watch the Mandelstam
        variables, the channels of the angular distribution and the scan respond. Every value is a pure function of the sliders — the
        animation adds no physics of its own.
      </VizCaption>
    </div>);

}

// amplitude-room.jsx — the amplitude room of the QFT module (moved out of mod-qft.jsx in S14, unchanged): a 2 → 2 process bench with the Mandelstam
// variables recomputed live, the angular distribution in polar and Cartesian form, and the energy scan with the Z⁰ resonance. It reads QFT_PROCESSES
// from mod-qft.jsx: the JSX sources are evaluated as one script, so the top-level bindings are shared and the components resolve them when they render.

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
function QFTReadout({ label, value, unit, formula, formulaTex, note, lead }) {
  return (
    <div className={"kerr-readout" + (lead ? " lead" : "")}>
      <div className="kerr-readout-label">{label}</div>
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
function QFTScatterCanvas({ process, cosTheta, photonX, tau, fontsReady }) {
  const ref = useQFTCanvas((ctx, w, h) => {
    const cx = w * 0.5,cy = h * 0.5;
    const R = Math.min(w * 0.40, h * 0.42);
    const shape = (c) => window.QGA_PHYSICS.angularDistribution({ process: process.id, cosTheta: c, photonX });
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
  }, [process.id, cosTheta, photonX, tau, fontsReady]);
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

/* Angular distribution, normalised to its 90° value. The y axis is clipped at
   min(20, max) so the t-channel forward pole stays on screen. */
function QFTAngularPlot({ process, cosTheta, photonX }) {
  const spec = useMemo(() => window.QGA_FIGURE.plots.qft.angularSpec({ process, cosTheta, photonX }), [process.id, cosTheta, photonX]);
  return <Figure spec={spec}></Figure>;
}

/* Two-panel energy scan: the photon 1/s cross-section on a log axis, and the
   Z⁰ Breit–Wigner shape on a linear axis zoomed to ±3Γ. */
function QFTResonancePlot({ sqrtS }) {
  const photon = useMemo(() => window.QGA_FIGURE.plots.qft.photonCrossSectionSpec({ sqrtS }), [sqrtS]);
  const zPole = useMemo(() => window.QGA_FIGURE.plots.qft.zResonanceSpec({ sqrtS }), [sqrtS]);
  return (
    <div className="qft-stack">
      <Figure spec={photon}></Figure>
      <Figure spec={zPole}></Figure>
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
  const sigma = window.QGA_PHYSICS.qftTotalCrossSection({ sqrtS });
  const bw = window.QGA_PHYSICS.breitWignerResonance({ sqrtS });
  const shapeNow = window.QGA_PHYSICS.angularDistribution({ process: process.id, cosTheta, photonX });
  const shape90 = window.QGA_PHYSICS.angularDistribution({ process: process.id, cosTheta: 0, photonX });
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
            <p>A live 2 → 2 scattering bench: Mandelstam kinematics, angular distributions and the Z⁰ resonance,
            evaluated from the pure functions in <code>js/physics.mjs</code>.</p>
          </div>
        </div>
        <div className="kerr-head-state">
          <span className="badge badge-established">Leading-order QED</span>
          <div className="kerr-state-line">
            {process.name} · <Eq tex="\sqrt{s}"></Eq> = {sqrtS.toFixed(1)} GeV · <Eq tex="\cos\theta"></Eq> = {cosTheta.toFixed(2)}
          </div>
          <div className="kerr-state-line">
            <Eq tex="\sigma"></Eq> = {sigma.toFixed(4)} nb · {verdict.ok ? verdict.topo + "-channel" : "forbidden"} · {phase}
          </div>
        </div>
      </div>

      <div className="kerr-instrument-bar">
        <div className="kerr-control-group" aria-label="Process">
          <span className="kerr-control-label">Process</span>
          {QFT_PROCESSES.map((p) =>
          <button key={p.id} className={"kerr-chip" + (p.id === process.id ? " on" : "")}
          aria-pressed={p.id === process.id}
          onClick={() => setAtlasState({ qftProcess: p.id })}>{p.name}</button>
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
            <QFTScatterCanvas process={process} cosTheta={cosTheta} photonX={photonX} tau={tau}
            fontsReady={fontsReady}></QFTScatterCanvas>
          </div>
        </figure>
        <QFTWaterfall cosTheta={cosTheta} tau={tau}></QFTWaterfall>
      </div>

      <div className="qft-plots">
        <div>
          <div className="qft-formula"><Eq tex={process.shapeTex} display={true}></Eq></div>
          <QFTAngularPlot process={process} cosTheta={cosTheta} photonX={photonX}></QFTAngularPlot>
        </div>
        <QFTResonancePlot sqrtS={sqrtS}></QFTResonancePlot>
      </div>

      <div className="kerr-deck">
        <section className="kerr-rgroup">
          <header><h4>Mandelstam kinematics</h4><span>natural units · GeV²</span></header>
          <div className="kerr-rgrid">
            <QFTReadout lead label="√s" value={sqrtS.toFixed(1)} unit="GeV"
            formula="centre-of-mass energy"></QFTReadout>
            <QFTReadout label="s" value={kin.s.toFixed(2)} unit="GeV²"
            formulaTex="s = (p_1 + p_2)^2"></QFTReadout>
            <QFTReadout label="t" value={kin.t.toFixed(2)} unit="GeV²"
            formulaTex="t = m_1^2 + m_3^2 - 2E_1E_3 + 2p_1p_3\cos\theta"></QFTReadout>
            <QFTReadout label="u" value={kin.u.toFixed(2)} unit="GeV²"
            formulaTex="u = m_1^2 + m_4^2 - 2E_1E_4 - 2p_1p_3\cos\theta"></QFTReadout>
            <QFTReadout label="Σ mᵢ²" value={kin.sum.toFixed(4)} unit="GeV²"
            formulaTex="\Sigma\, m_i^2 = m_1^2 + m_2^2 + m_3^2 + m_4^2"></QFTReadout>
            <QFTReadout label="s+t+u−Σmᵢ²" value={kin.residual.toExponential(1)} unit="GeV²"
            formula="exact identity — residual is floating-point noise"></QFTReadout>
          </div>
        </section>
        <section className="kerr-rgroup">
          <header><h4>Observables</h4><span>leading order</span></header>
          <div className="kerr-rgrid">
            <QFTReadout lead label="σ_γ" value={sigma.toFixed(4)} unit="nb"
            formulaTex="\sigma_\gamma = \dfrac{4\pi\alpha^2}{3s}"
            note="massless s-channel benchmark"></QFTReadout>
            <QFTReadout label="Z⁰ Breit–Wigner" value={bw.toFixed(4)}
            formulaTex="\dfrac{m^2\Gamma^2}{(s - m^2)^2 + m^2\Gamma^2}"
            note="1 at √s = m"></QFTReadout>
            <QFTReadout label="dσ/dΩ at cos θ" value={(shapeNow / shape90).toFixed(3)} unit="× 90°"
            formulaTex={process.shapeTex}></QFTReadout>
            {process.id === "compton" ?
            <QFTReadout label="photon energy ratio" value={photonX.toFixed(2)} unit="× mₑc²"
            formulaTex="x = E_\gamma / m_e c^2" note="lab frame"></QFTReadout> :
            <QFTReadout label="beam energy E₁" value={kin.E1.toFixed(2)} unit="GeV"
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
          <span className="kerr-check ok">leading order · closed forms</span>
        </summary>
        <div className="kerr-validity-body">
          <dl>
            <dt>What is exact</dt>
            <dd>
              The Mandelstam identity <Eq tex="s + t + u = \sum_i m_i^2"></Eq>, the massless s-channel shape
              <Eq tex="1 + \cos^2\theta"></Eq>, the total cross-section <Eq tex="\sigma = 4\pi\alpha^2/3s"></Eq>,
              the Klein–Nishina shape and the Breit–Wigner form are closed-form leading-order results. They are evaluated live by <code>js/physics.mjs</code> and covered by
              <code> node:test</code> cases in <code>test/physics.test.mjs</code>.
            </dd>
            <dt>What is approximate</dt>
            <dd>
              The t-channel curve plots only the leading pole <Eq tex="1/\sin^4(\theta/2)"></Eq>. The complete Møller and Bhabha
              amplitudes also contain s- and u-channel terms and their interference, which are deliberately not
              drawn — guessing their coefficients would be worse than omitting them. The Z⁰ panel shows the
              Breit–Wigner shape alone, not the γ–Z⁰ interference term, and the fermion masses are set to zero
              except in the Compton process.
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
              Z⁰ mass and width: PDG values <Eq tex="m_Z = 91.1876\ \mathrm{GeV}"></Eq>,
              <Eq tex="\Gamma_Z = 2.4952\ \mathrm{GeV}"></Eq>. Fine-structure constant: CODATA
              <Eq tex="\alpha = 1/137.035999084"></Eq>.
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
        The readouts are exact leading-order QED results; the two canvases are a schematic animation of the same
        process. Drag the transport to scrub the collision, or change √s and cos θ to watch the Mandelstam
        variables, the angular shape and the resonance curve respond. Every value is a pure function of the
        sliders — the animation adds no physics of its own.
      </VizCaption>
    </div>);

}

// mod-blackholes.jsx — Module 07: Black Holes, Entropy, and Holography
/* ---------- Eased Kerr geometry ----------
   Interpolates the numeric fields of kerrGeometry() so the coordinate map and
   the characteristic-radius rings glide between slider values instead of
   snapping. Purely presentational: the readouts always print the exact target
   values, and reduced-motion users get an instant snap. */
const KERR_EASE_KEYS = [
  "a", "rPlus", "rMinus", "rErgoEquator", "rIsco", "rIscoRetrograde",
  "rPhoton", "rPhotonRetrograde", "z1", "z2", "surfaceGravity", "temperatureFactor",
];
function useEasedKerr(target, duration = 0.55) {
  const prm = usePRM();
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const targetRef = useRef(target);
  targetRef.current = target;
  const rafRef = useRef(0);
  // kerrGeometry() is a pure function of the spin parameter, so the spin is a
  // complete and stable dependency key for the whole geometry object.
  const key = target.a;
  useEffect(() => {
    const goal = targetRef.current;
    if (prm) {
      cancelAnimationFrame(rafRef.current);
      shownRef.current = goal;
      setShown(goal);
      return undefined;
    }
    const from = shownRef.current;
    let moved = false;
    for (const k of KERR_EASE_KEYS) if (Math.abs(from[k] - goal[k]) > 1e-9) { moved = true; break; }
    if (!moved) { shownRef.current = goal; return undefined; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / (duration * 1000));
      const e = 1 - Math.pow(1 - p, 3);
      const next = {};
      for (const k of KERR_EASE_KEYS) next[k] = from[k] + (goal[k] - from[k]) * e;
      shownRef.current = next;
      setShown(next);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [key, duration, prm]);
  return shown;
}

/* ---------- Hawking blackbody spectrum (responds to mass & spin) ---------- */
function HawkingSpectrumPlot({ logM, tempFactor }) {
  const cvRef = useRef(null);
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = 150;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const padL = 34, padR = 12, padT = 18, padB = 24;
    const pw = w - padL - padR, ph = h - padT - padB;
    // visual temperature: smaller mass / lower spin-suppression → hotter (peak at higher x)
    // map so the curve visibly shifts with the sliders; absolute scale is illustrative.
    const Tvis = Math.max(0.06, (1 - logM / 9) * tempFactor * 0.95 + 0.05);
    const planck = (x) => window.QGA_PHYSICS.hawkingSpectralShape(x, Tvis);
    let pk = 0; for (let i = 1; i <= 200; i++) { const x = i / 200 * 3; pk = Math.max(pk, planck(x)); }
    ctx.strokeStyle = "rgba(148,176,224,0.22)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + ph); ctx.lineTo(padL + pw, padT + ph); ctx.stroke();
    ctx.font = "10px IBM Plex Mono"; ctx.fillStyle = "rgba(148,176,224,0.6)";
    ctx.fillText("Hawking spectrum  (blackbody)", padL, 12);
    // filled curve
    const grad = ctx.createLinearGradient(padL, 0, padL + pw, 0);
    grad.addColorStop(0, "oklch(0.7 0.16 25 / 0.7)"); grad.addColorStop(0.5, "oklch(0.78 0.15 60 / 0.7)"); grad.addColorStop(1, "oklch(0.82 0.13 230 / 0.7)");
    ctx.beginPath(); ctx.moveTo(padL, padT + ph);
    for (let i = 0; i <= 200; i++) { const x = i / 200 * 3; const px = padL + (x / 3) * pw, py = padT + ph * (1 - planck(x) / pk); ctx.lineTo(px, py); }
    ctx.lineTo(padL + pw, padT + ph); ctx.closePath(); ctx.fillStyle = grad; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const x = i / 200 * 3; const px = padL + (x / 3) * pw, py = padT + ph * (1 - planck(x) / pk); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.strokeStyle = "oklch(0.85 0.13 70)"; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.fillStyle = "rgba(148,176,224,0.55)"; ctx.fillText("photon energy →", padL + pw - 96, padT + ph + 16);
  }, [logM, tempFactor]);
  return <div className="viz-frame" style={{ padding: 6 }}><canvas ref={cvRef} style={{ width: "100%", height: 150, display: "block" }}
    aria-label="Hawking blackbody spectrum; peak shifts with black hole mass and spin"></canvas></div>;
}

/* ---------- Page curve: entanglement entropy of Hawking radiation vs time ---------- */
function PageCurvePlot() {
  const cvRef = useRef(null);
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = 150;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const padL = 34, padR = 12, padT = 18, padB = 24;
    const pw = w - padL - padR, ph = h - padT - padB;
    const X = (f) => padL + f * pw, Y = (s) => padT + ph * (1 - s);
    ctx.strokeStyle = "rgba(148,176,224,0.22)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + ph); ctx.lineTo(padL + pw, padT + ph); ctx.stroke();
    ctx.font = "10px IBM Plex Mono"; ctx.fillStyle = "rgba(148,176,224,0.6)";
    ctx.fillText("Page curve  S_rad(t)", padL, 12);
    // Hawking's (naive) ever-rising thermal entropy
    ctx.setLineDash([4, 4]); ctx.strokeStyle = "rgba(217,106,90,0.7)"; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) { const f = i / 100; const s = Math.min(1.6, 1.7 * f); ctx.lineTo(X(f), Y(Math.min(1, s))); }
    ctx.stroke(); ctx.setLineDash([]);
    // unitary Page curve: S_rad = min(thermal, remaining BH entropy)
    ctx.strokeStyle = "oklch(0.82 0.13 230)"; ctx.lineWidth = 2;
    ctx.shadowColor = "oklch(0.82 0.13 230)"; ctx.shadowBlur = 7;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) { const f = i / 100; const s = 0.85 * window.QGA_PHYSICS.pageCurveEntropy(f); ctx.lineTo(X(f), Y(s)); }
    ctx.stroke(); ctx.shadowBlur = 0;
    // Page time marker
    ctx.strokeStyle = "rgba(224,179,90,0.5)"; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(X(0.5), padT); ctx.lineTo(X(0.5), padT + ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(224,179,90,0.85)"; ctx.fillText("Page time", X(0.5) + 4, padT + 24);
    ctx.fillStyle = "rgba(217,106,90,0.85)"; ctx.fillText("Hawking (info lost)", X(0.04), padT + 12);
    ctx.fillStyle = "rgba(148,176,224,0.55)"; ctx.fillText("evaporation →", padL + pw - 86, padT + ph + 16);
  }, []);
  return <div className="viz-frame" style={{ padding: 6 }}><canvas ref={cvRef} style={{ width: "100%", height: 150, display: "block" }}
    aria-label="Page curve: entanglement entropy of Hawking radiation rising then falling for unitary evaporation"></canvas></div>;
}

// Camera presets expressed as observatory state: inclination from the spin axis (deg) and
// observer distance (GM/c²). The orbit camera is the observer, so these drive the render.
const KERR_CAMERA_PRESETS = {
  edge: { inclination: 80, distance: 40, theta: 0.35 },
  polar: { inclination: 8, distance: 40, theta: 0.25 },
  photon: { inclination: 70, distance: 22, theta: 0.5 },
  wide: { inclination: 75, distance: 90, theta: -0.45 },
};
function kerrCameraGoal(inclinationDeg, distance, theta = 0.35) {
  return { radius: distance, theta, phi: (inclinationDeg * Math.PI) / 180 };
}

const KERR_CURVES = [
  { key: "isco", sense: "retro", color: "#b388ff", dash: "5 4", width: 1.2, label: "ISCO retrograde", read: (g) => g.rIscoRetrograde },
  { key: "isco", sense: "pro", color: "#54aeff", dash: "", width: 1.9, label: "ISCO prograde", read: (g) => g.rIsco },
  { key: "photon", sense: "retro", color: "#ffb454", dash: "3 4", width: 1.1, label: "Photon retrograde", read: (g) => g.rPhotonRetrograde },
  { key: "photon", sense: "pro", color: "#ffd38a", dash: "", width: 1.9, label: "Photon prograde", read: (g) => g.rPhoton },
  { key: "ergo", sense: "", color: "#46d4e0", dash: "", width: 1.6, label: "Ergosurface (eq.)", read: (g) => g.rErgoEquator, fill: "rgba(70,212,224,0.07)" },
  { key: "horizon", sense: "", color: "#ff7b72", dash: "", width: 2.3, label: "Outer horizon r₊", read: (g) => g.rPlus, fill: "rgba(4,7,13,0.97)" },
];

function KerrGeometryMap({ geometry, exact, layers, open, onToggle, settling, motion }) {
  const cx = 118, cy = 110, span = 94;
  const visible = KERR_CURVES.filter((curve) => layers[curve.key]);
  const widest = visible.reduce((acc, curve) => Math.max(acc, curve.read(geometry)), 2);
  const domain = Math.max(4, Math.ceil(widest));
  const px = (radius) => span * radius / domain;
  const tickStep = domain > 12 ? 4 : domain > 6 ? 2 : 1;
  const ticks = [];
  for (let r = tickStep; r <= domain; r += tickStep) ticks.push(r);
  const readout = exact || geometry;

  if (!open) {
    return (
      <button className="kerr-map-toggle" type="button" aria-expanded="false" onClick={onToggle}>
        <span className="kerr-map-toggle-icon" aria-hidden="true"></span>
        <span><strong>Radii map</strong><small>Show exact Kerr geometry</small></span>
      </button>
    );
  }

  return (
    <figure className={"kerr-map" + (settling ? " settling" : "") + (motion ? " live" : "")}
      aria-label="Exact Kerr equatorial coordinate-radius figure">
      <figcaption className="kerr-map-head">
        <span className="kerr-map-ident">
          <span className="kerr-map-id">FIG.1</span>
          <span className="kerr-map-title">Equatorial Kerr radii</span>
        </span>
        <span className="kerr-map-head-tools">
          <span className="kerr-map-unit">R / r<sub>g</sub></span>
          <button type="button" className="kerr-map-close" aria-label="Hide Kerr radii map"
            aria-expanded="true" onClick={onToggle}>Hide</button>
        </span>
      </figcaption>
      <svg viewBox="0 0 236 232" role="img"
        aria-label={"Nested Kerr radii in units of GM over c squared, plotted to " + domain + " GM/c²"}>
        <defs>
          <radialGradient id="kerr-scope-field" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10243c" stopOpacity="0.42"></stop>
            <stop offset="68%" stopColor="#08111f" stopOpacity="0.18"></stop>
            <stop offset="100%" stopColor="#02060c" stopOpacity="0"></stop>
          </radialGradient>
          <linearGradient id="kerr-sweep-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#54aeff" stopOpacity="0"></stop>
            <stop offset="100%" stopColor="#54aeff" stopOpacity="0.5"></stop>
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={span} fill="url(#kerr-scope-field)"
          stroke="rgba(148,176,224,0.18)" strokeWidth="0.7"></circle>
        <line x1={cx - span - 10} y1={cy} x2={cx + span + 10} y2={cy} className="kerr-axis"></line>
        <line x1={cx} y1={cy - span - 10} x2={cx} y2={cy + span + 10} className="kerr-axis"></line>
        <text x={cx - span + 6} y={cy - span + 12} className="kerr-scope-label">RETROGRADE</text>
        <text x={cx + span - 6} y={cy + span - 8} className="kerr-scope-label kerr-scope-label-end">PROGRADE</text>
        {ticks.map((r) => (
          <g key={r}>
            <line x1={cx + px(r)} y1={cy - 3} x2={cx + px(r)} y2={cy + 3} className="kerr-tick"></line>
            <text x={cx + px(r)} y={cy + 13} className="kerr-tick-label">{r}</text>
          </g>
        ))}
        <g className="kerr-sweep" aria-hidden="true">
          <line x1={cx} y1={cy} x2={cx + span} y2={cy} stroke="url(#kerr-sweep-fade)" strokeWidth="1.1"></line>
        </g>
        {visible.map((curve, index) => (
          <circle key={index} cx={cx} cy={cy} r={px(curve.read(geometry))}
            className={"kerr-ring kerr-ring-" + curve.key + (curve.sense ? " kerr-ring-" + curve.sense : "")}
            fill={curve.fill || "none"} stroke={curve.color} strokeWidth={curve.width}
            strokeDasharray={curve.dash}></circle>
        ))}
        <circle cx={cx} cy={cy} r="1.8" fill="#e8eef8"></circle>
        <g className="kerr-spin-mark">
          <path d={"M " + (cx + 56) + " " + (cy - 72) + " a 46 46 0 0 1 26 22"} fill="none"
            stroke="rgba(233,246,255,0.5)" strokeWidth="1.1"></path>
          <path d={"M " + (cx + 82) + " " + (cy - 50) + " l -6 -1 l 1 6"} fill="none"
            stroke="rgba(233,246,255,0.5)" strokeWidth="1.1"></path>
          <text x={cx + 50} y={cy - 78} className="kerr-tick-label">a★ {readout.a.toFixed(2)}</text>
        </g>
        <line x1={cx - span} y1={cy + span + 24} x2={cx - span + px(tickStep)} y2={cy + span + 24}
          stroke="rgba(205,219,241,0.6)" strokeWidth="1.3"></line>
        <line x1={cx - span} y1={cy + span + 20} x2={cx - span} y2={cy + span + 28}
          stroke="rgba(205,219,241,0.6)" strokeWidth="1"></line>
        <line x1={cx - span + px(tickStep)} y1={cy + span + 20} x2={cx - span + px(tickStep)} y2={cy + span + 28}
          stroke="rgba(205,219,241,0.6)" strokeWidth="1"></line>
        <text x={cx - span + px(tickStep) + 24} y={cy + span + 27} className="kerr-tick-label">
          {tickStep} GM/c²
        </text>
      </svg>
      <table className="kerr-map-legend">
        <tbody>
          {visible.map((curve, index) => (
            <tr key={index}>
              <td>
                <svg width="16" height="6" aria-hidden="true">
                  <line x1="0" y1="3" x2="16" y2="3" stroke={curve.color}
                    strokeWidth={curve.width} strokeDasharray={curve.dash}></line>
                </svg>
              </td>
              <th scope="row">{curve.label}</th>
              <td className="kerr-legend-value">{curve.read(readout).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="kerr-map-note">Boyer–Lindquist coordinate radii, exact Kerr · not image-plane distances</p>
    </figure>
  );
}

function KerrReadout({ label, value, unit, formula, sub, lead, pair }) {
  return (
    <div className={"kerr-readout" + (lead ? " lead" : "")}>
      <div className="kerr-readout-label">
        {label}{pair && unit ? <span className="in-unit"> · {unit}</span> : null}
      </div>
      {pair ? (
        <div className="kerr-readout-pair">
          {pair.map(([sense, amount]) => (
            <div key={sense}>
              <span className="sense">{sense}</span>
              <span className="amount">{amount}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="kerr-readout-value">{value}{unit ? <span className="unit">{unit}</span> : null}</div>
      )}
      <div className="kerr-readout-formula">{formula}</div>
      {sub ? <div className="kerr-readout-sub">{sub}</div> : null}
    </div>
  );
}

function KerrValidity({ geometry }) {
  const limit = window.QGA_PHYSICS.kerrGeometry(0);
  const checks = [
    ["r₊ → 2", limit.rPlus, 2],
    ["ISCO → 6", limit.rIsco, 6],
    ["photon → 3", limit.rPhoton, 3],
    ["T_H / T_Schw → 1", limit.temperatureFactor, 1],
  ];
  const allPass = checks.every(([, got, want]) => Math.abs(got - want) < 1e-9);
  return (
    <details className="kerr-validity">
      <summary>
        <span>Assumptions, validity &amp; uncertainty</span>
        <span className={"kerr-check" + (allPass ? " ok" : " bad")}>
          {allPass ? "Schwarzschild limit verified" : "limit check failed"}
        </span>
      </summary>
      <div className="kerr-validity-body">
        <dl>
          <dt>Exact, closed form</dt>
          <dd>
            Horizon, equatorial ergosurface, photon orbits and ISCO follow the standard equatorial Kerr
            expressions (Bardeen, Press &amp; Teukolsky 1972). They are evaluated analytically, not fitted,
            and are reported in geometrised units <Eq tex="GM/c^2"></Eq>.
          </dd>
          <dt>Ray-traced Kerr geodesics</dt>
          <dd>
            The observatory integrates Carter's separated null-geodesic equations in the full Kerr metric for every
            pixel (Runge–Kutta 4 in Mino time, first integrals re-imposed each step) — frame dragging is part of the
            integration. Disk flux, orbital kinematics, redshift and blackbody colour come from the validated science
            core. What is <em>not</em> physical: the display-scaled 7000 K peak temperature, the per-crossing disk
            transmittance used to separate image orders, the synthetic star catalogue and the 16 GM/c² disk outer edge.
            Orders beyond the ray budget are not drawn; no photon ring is thickened.
          </dd>
          <dt>Semiclassical</dt>
          <dd>
            Hawking temperature and Bekenstein–Hawking entropy assume a stationary black hole in the
            semiclassical regime, with no backreaction and no surrounding matter. Hawking radiation has
            never been observed. Evaporation time is an order-of-magnitude estimate only.
          </dd>
          <dt>Self-check at a★ = 0</dt>
          <dd className="kerr-limit-row">
            {checks.map(([name, got]) => (
              <span key={name}>{name} = {got.toFixed(3)}</span>
            ))}
          </dd>
        </dl>
        <p className="kerr-validity-state">
          Current state: a★ = {geometry.a.toFixed(3)} · r₊ = {geometry.rPlus.toFixed(3)} ·
          ergoregion width = {(geometry.rErgoEquator - geometry.rPlus).toFixed(3)} GM/c²
        </p>
      </div>
    </details>
  );
}

/* ---------- Live formulation: governing equations with the current numbers
   substituted. Every expression below is the closed form already implemented in
   js/physics.mjs (kerrGeometry / kerrErgosphere); nothing new is asserted here. */
function KerrFormulation({ geometry, massSolar, temperature, entropy }) {
  const g = geometry;
  const a = g.a;
  const rows = [
    {
      id: "rpm",
      name: "Horizon pair",
      sym: "r± = M ± √(M² − a²)",
      sub: "r₊ = 1 + √(1 − " + a.toFixed(3) + "²) = " + g.rPlus.toFixed(3) +
        "  ·  r₋ = 1 − √(1 − " + a.toFixed(3) + "²) = " + g.rMinus.toFixed(3),
      val: g.rPlus.toFixed(3) + " / " + g.rMinus.toFixed(3),
      unit: "GM/c²",
    },
    {
      id: "ergo",
      name: "Ergosurface",
      sym: "r_E(θ) = M + √(M² − a² cos²θ)",
      sub: "θ = 90° → 1 + √(1 − " + a.toFixed(3) + "²·0) = " + g.rErgoEquator.toFixed(3) +
        "  ·  θ = 0° → " + g.rPlus.toFixed(3),
      val: g.rErgoEquator.toFixed(3),
      unit: "GM/c²",
    },
    {
      id: "photon",
      name: "Photon orbit",
      sym: "r_ph = 2M[1 + cos(⅔ arccos(∓a★))]",
      sub: "pro: 2[1 + cos(⅔ arccos(−" + a.toFixed(3) + "))] = " + g.rPhoton.toFixed(3) +
        "  ·  retro: " + g.rPhotonRetrograde.toFixed(3),
      val: g.rPhoton.toFixed(3) + " / " + g.rPhotonRetrograde.toFixed(3),
      unit: "GM/c²",
    },
    {
      id: "isco",
      name: "ISCO",
      sym: "r_isco = M[3 + Z₂ ∓ √((3−Z₁)(3+Z₁+2Z₂))]",
      sub: "Z₁ = " + g.z1.toFixed(3) + "  ·  Z₂ = " + g.z2.toFixed(3) +
        "  →  pro " + g.rIsco.toFixed(3) + "  ·  retro " + g.rIscoRetrograde.toFixed(3),
      val: g.rIsco.toFixed(3) + " / " + g.rIscoRetrograde.toFixed(3),
      unit: "GM/c²",
    },
    {
      id: "kappa",
      name: "Surface gravity",
      sym: "κ = (r₊ − M) / (r₊² + a²)",
      sub: "(" + g.rPlus.toFixed(3) + " − 1) / (" + g.rPlus.toFixed(3) + "² + " + a.toFixed(3) +
        "²) = " + g.surfaceGravity.toFixed(4) + "  →  T_H/T_Schw = " + g.temperatureFactor.toFixed(3),
      val: g.temperatureFactor.toFixed(3),
      unit: "× T_Schw",
    },
    {
      id: "entropy",
      name: "Bekenstein–Hawking entropy",
      sym: "S/k_B = 1.05×10⁷⁷ (M/M☉)² (r₊/2M)",
      sub: "1.05×10⁷⁷ × " + sciNotation(massSolar, 2) + "² × " + (g.rPlus / 2).toFixed(3) +
        " = " + sciNotation(entropy, 2),
      val: sciNotation(entropy, 2),
      unit: "k_B",
    },
    {
      id: "temp",
      name: "Hawking temperature",
      sym: "T_H = (ħc³ / 8πGMk_B) · κ/κ₀",
      sub: "6.17×10⁻⁸ K / " + sciNotation(massSolar, 2) + " × " + g.temperatureFactor.toFixed(3) +
        " = " + sciNotation(temperature, 2),
      val: sciNotation(temperature, 2),
      unit: "K",
    },
  ];
  return (
    <section className="kerr-formulation" aria-label="Live Kerr formulation with current parameter values">
      <header className="kerr-formulation-head">
        <span className="kerr-formulation-ident">LIVE FORMULATION</span>
        <span className="kerr-formulation-state">
          a★ = {a.toFixed(3)} · M = {sciNotation(massSolar, 2)} M☉
        </span>
      </header>
      <ol className="kerr-formulation-list">
        {rows.map((row) => (
          <li key={row.id} className="kerr-formulation-row">
            <span className="kerr-formulation-name">{row.name}</span>
            <span className="kerr-formulation-sym">{row.sym}</span>
            <span className="kerr-formulation-sub">{row.sub}</span>
            <span className="kerr-formulation-val">{row.val}<em>{row.unit}</em></span>
          </li>
        ))}
      </ol>
      <p className="kerr-formulation-note">
        Closed-form Kerr quantities in Boyer–Lindquist coordinates, evaluated at the current sliders.
        These are exact coordinate radii; the ray-traced image above integrates Carter's Kerr geodesics numerically (see the validity panel).
      </p>
    </section>
  );
}

/* ---------- 3D black hole laboratory ---------- */
function BlackHoleLab3D() {
  const [atlasState, setAtlasState] = useQGAState();
  const prm = usePRM();
  const [cameraPreset, setCameraPreset] = useState("edge");
  const [layers, setLayers] = useState({ horizon: true, ergo: true, photon: true, isco: true });
  const mapPreferenceKey = useRef(
    window.matchMedia("(max-width: 760px)").matches
      ? "qga-kerr-map-open-mobile"
      : "qga-kerr-map-open-desktop"
  ).current;
  const [mapOpen, setMapOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(mapPreferenceKey);
      if (stored !== null) return stored === "true";
    } catch (error) {
      console.warn("Kerr map preference could not be read.", error);
    }
    return mapPreferenceKey.endsWith("-desktop");
  });
  const logM = atlasState.bhMass;
  const aStar = atlasState.bhSpin;
  const logRef = useRef(logM); logRef.current = logM;
  const spinRef = useRef(aStar); spinRef.current = aStar;
  const stateRef = useRef(atlasState); stateRef.current = atlasState;
  const governorRef = useRef(null);
  const [focus, setFocus] = useState(null);
  const focusRef = useRef({ x: 0, y: 0, radius: 0.2, strength: 0 });
  const [cameraGoal, setCameraGoal] = useState(null);

  // Focus: dolly the camera toward the feature (snaps under reduced motion — Scene3D
  // applies a goal instantly when motion is 0) and drive the image-plane defocus disc.
  const orbitThetaOf = (observer) => (observer ? Math.PI / 2 - observer.phi0 : 0.35);
  const focusFeature = (kind, ndc) => {
    const kerrApi = window.QGA_KERR;
    if (!kerrApi) return;
    const cur = stateRef.current;
    const normalized = kerrApi.normalizeKerrState({ ...cur, bhMass: cur.bhMass, bhSpin: cur.bhSpin });
    const snapshot = window.__qgaKerrRuntime;
    const observer = snapshot?.observer;
    const budget = kerrApi.kerrQualityBudget(normalized.quality, { detail3d: snapshot?.detail3d ?? "medium" });
    const renderState = kerrApi.buildKerrRenderState(normalized, { observer, budget });
    const lens = snapshot?.lens ?? { tanHalfFov: Math.tan((40 * Math.PI) / 360), aspect: 1.6 };
    // A click classifies the traced pixel; a Focus button locates its feature in the image first.
    const point = ndc ?? kerrApi.locateKerrFeature(renderState, kind, lens);
    const picked = kerrApi.pickKerrPixel(renderState, point.x, point.y, lens);
    const resolved = ndc ? picked.kind : kind;
    const hit = picked.trace.hits.find((h) => h.inDisk);
    const extra = hit
      ? { order: hit.order, r: hit.r, g: kerrApi.shadeDiskHit(renderState, hit.r, picked.trace.E, picked.trace.Lz).g }
      : {};
    const plan = kerrApi.kerrFocusPlan(resolved, { observerDistance: normalized.observerDistance, rIscoPro: renderState.radii.rIsco });
    focusRef.current = { x: point.x, y: point.y, radius: plan.radius, strength: plan.strength };
    if (resolved !== "sky") {
      setCameraGoal(kerrCameraGoal(observer ? (observer.theta0 * 180) / Math.PI : normalized.inclinationDeg,
        plan.distance, orbitThetaOf(observer)));
      setAtlasState({ bhObserverDistance: Math.round(plan.distance) });
    }
    setFocus({ kind: resolved, explanation: kerrApi.kerrFeatureExplanation(resolved, renderState, extra), ndc: point });
  };
  const onFocusRef = useRef(null);
  onFocusRef.current = ({ ndc }) => focusFeature(null, ndc);
  const onCameraSettledRef = useRef(null);
  onCameraSettledRef.current = (patch) => setAtlasState(patch);
  const clearFocus = () => {
    focusRef.current = { ...focusRef.current, strength: 0 };
    setFocus(null);
  };
  const requestCamera = ({ inclination, distance }) => {
    const cur = stateRef.current;
    const o = window.__qgaKerrRuntime?.observer;
    setCameraGoal(kerrCameraGoal(inclination ?? cur.bhInclination, distance ?? cur.bhObserverDistance,
      orbitThetaOf(o)));
  };

  useEffect(() => {
    try {
      localStorage.setItem(mapPreferenceKey, String(mapOpen));
    } catch (error) {
      console.warn("Kerr map preference could not be saved.", error);
    }
  }, [mapOpen, mapPreferenceKey]);

  // Kerr observatory scene (Prompt 04). The runtime (WebGPU compute path when the
  // device offers it, WebGL2 fragment integrator otherwise) integrates Carter's
  // geodesic equations per pixel; every physical number comes from js/science/
  // via window.QGA_KERR. This build only wires camera, state, picking and focus.
  const build = async (ctx) => {
    const { scene } = ctx;
    const kerr = window.QGA_KERR;
    if (!kerr) throw new Error("Kerr observatory module is unavailable; reload the page.");
    const { createKerrRuntime } = await kerr.loadRuntime();
    const runtime = await createKerrRuntime({
      backendPreference: window.QGA_RENDER_OPTIONS?.forceBackend ?? ctx.settings.current.renderBackend ?? "auto",
      seed: stateRef.current.seed ?? 42,
    });
    scene.add(runtime.mesh);
    let lastLens = { tanHalfFov: 0.35, aspect: 1.6 };
    let lastPlan = null;
    let settleTimer = 0;
    let lastObserver = null;

    const publish = (frame) => {
      window.__qgaKerrRuntime = {
        ...runtime.snapshot(), detail3d: ctx.settings.current.detail3d,
        reducedMotion: ctx.motion() === 0, observer: frame.observer, lens: lastLens,
      };
    };
    return {
      autoRotate: false,
      renderCapabilities: { depth: false },
      applyRenderQuality: (quality) => { governorRef.current = quality.raySteps; },
      recoverable: (error) => runtime.recoverable ? runtime.recoverable(error) : false,
      onScreenPick: (ndc) => { if (lastPlan) onFocusRef.current({ ndc }); },
      update: (t, dt) => {
        const renderer = ctx.renderer;
        if (!renderer) return;
        const cam = ctx.camera;
        lastLens = { tanHalfFov: Math.tan((cam.fov * Math.PI) / 360), aspect: cam.aspect || 1 };
        lastPlan = runtime.sync({
          renderer, camera: cam, atlasState: { ...stateRef.current, bhMass: logRef.current, bhSpin: spinRef.current },
          detail3d: ctx.settings.current.detail3d, reducedMotion: ctx.motion() === 0,
          governorRaySteps: governorRef.current,
        });
        runtime.setFocus(focusRef.current);
        publish(lastPlan);
        // Camera is the observer: write a settled orbit back to the shareable state.
        const o = lastPlan.observer;
        const incl = (o.theta0 * 180) / Math.PI;
        if (!lastObserver || Math.abs(lastObserver.r0 - o.r0) > 1e-3 || Math.abs(lastObserver.theta0 - o.theta0) > 1e-4) {
          lastObserver = o;
          window.clearTimeout(settleTimer);
          settleTimer = window.setTimeout(() => {
            const cur = stateRef.current;
            const nextIncl = Math.min(89, Math.max(3, Math.round(incl)));
            const nextDist = Math.min(120, Math.max(12, Math.round(o.r0)));
            if (Math.abs(cur.bhInclination - nextIncl) >= 1 || Math.abs(cur.bhObserverDistance - nextDist) >= 1) {
              onCameraSettledRef.current({ bhInclination: nextIncl, bhObserverDistance: nextDist });
            }
          }, 450);
        }
      },
      dispose() {
        window.clearTimeout(settleTimer);
        window.__qgaKerrRuntime = null;
        runtime.dispose();
      },
    };
  };

  const M = Math.pow(10, logM);
  const rs_km = window.QGA_PHYSICS.schwarzschildRadius(M);
  // Thermodynamic quantities are symmetric in the sign of a★; the legacy summary is spin-clamped to ≥ 0.
  const kerr = window.QGA_PHYSICS.kerrGeometry(Math.abs(aStar));
  const a = kerr.a;
  // Characteristic radii for the signed spin come straight from the validated science core;
  // "prograde" means orbiting in the +φ sense of the disk, so a★ < 0 is a retrograde disk.
  const sci = window.QGA_PHYSICS;
  const horizons = sci.kerrHorizonRadii(aStar);
  const rPlus = horizons.rPlus;          // outer horizon
  const rIsco = sci.kerrIsco(aStar, { prograde: true });
  const rPhoton = sci.kerrPhotonSphere(aStar, { prograde: true });
  const exactGeometry = {
    ...kerr, a: aStar, rPlus, rMinus: horizons.rMinus, rIsco,
    rIscoRetrograde: sci.kerrIsco(aStar, { prograde: false }),
    rPhoton, rPhotonRetrograde: sci.kerrPhotonSphere(aStar, { prograde: false }),
  };
  const eased = useEasedKerr(exactGeometry);
  const settling = Math.abs(eased.a - aStar) > 1e-4;
  const tempFactor = kerr.temperatureFactor;
  const T_H = window.QGA_PHYSICS.hawkingTemperature(M, a);
  const S = window.QGA_PHYSICS.blackHoleEntropyAreaUnits(M, a);
  const t_ev = window.QGA_PHYSICS.blackHoleEvaporationTimeYears(M);

  return (
    <div className="viz-frame">
      <div className="kerr-observatory-head">
        <div className="kerr-head-plate">
          <div className="kerr-head-ident">KERR<span>OBS</span></div>
          <div>
            <h3>Black Hole Observatory</h3>
            <p>Ray-traced Kerr geodesics read against exact Kerr coordinate radii.</p>
          </div>
        </div>
        <div className="kerr-head-state">
          <span className="badge badge-effective">Kerr null geodesics · thin disk · display-scaled colour</span>
          <div className="kerr-state-line">
            M = {sciNotation(M, 2)} M☉ · a★ = {aStar.toFixed(3)} · r₊ = {rPlus.toFixed(3)} GM/c²
          </div>
        </div>
      </div>
      <div className="viz-toolbar">
        <SliderRow label="black hole mass" min={0} max={9} step={0.05} value={logM} onChange={(v) => setAtlasState({ bhMass: v })}
          format={(v) => sciNotation(Math.pow(10, v), 2) + " M☉"}></SliderRow>
        <SliderRow label="spin a★ (negative = retrograde disk)" min={-0.998} max={0.998} step={0.002} value={aStar} onChange={(v) => setAtlasState({ bhSpin: v })}
          format={(v) => v.toFixed(3)}></SliderRow>
      </div>
      <div className="kerr-instrument-bar">
        <div className="kerr-control-group" aria-label="Geometry layers">
          <span className="kerr-control-label">Geometry</span>
          {[
            ["horizon", "Horizon"], ["ergo", "Ergosphere"], ["photon", "Photon orbit"], ["isco", "ISCO"],
          ].map(([key, label]) => (
            <button key={key} className={"kerr-chip" + (layers[key] ? " on" : "")}
              aria-pressed={layers[key]} onClick={() => setLayers((current) => ({ ...current, [key]: !current[key] }))}>
              {label}
            </button>
          ))}
        </div>
        <div className="kerr-control-group" aria-label="Camera presets">
          <span className="kerr-control-label">Camera</span>
          {[
            ["edge", "Disk edge"], ["polar", "Polar"], ["photon", "Photon ring"], ["wide", "Wide field"],
          ].map(([key, label]) => (
            <button key={key} className={"kerr-chip" + (cameraPreset === key ? " on" : "")}
              aria-pressed={cameraPreset === key} onClick={() => {
                const preset = KERR_CAMERA_PRESETS[key];
                setCameraPreset(key);
                setAtlasState({ bhInclination: preset.inclination, bhObserverDistance: preset.distance });
                setCameraGoal(kerrCameraGoal(preset.inclination, preset.distance, preset.theta));
              }}>{label}</button>
          ))}
        </div>
      </div>
      <Scene3D height={460} aria="Ray-traced Kerr black hole with a lensed accretion disk, photon ring and physical readouts. Click a feature to focus it."
        initial={{ ...kerrCameraGoal(atlasState.bhInclination, atlasState.bhObserverDistance, 0.35), fov: 40, minR: 12, maxR: 120 }}
        cameraGoal={cameraGoal}
        overlay={<KerrGeometryMap geometry={eased} exact={exactGeometry} layers={layers} open={mapOpen}
          settling={settling} motion={!prm}
          onToggle={() => setMapOpen((current) => !current)}></KerrGeometryMap>}
        build={build} fallback={<BlackHoleSim></BlackHoleSim>}></Scene3D>
      <KerrObservatoryControls state={atlasState} setState={setAtlasState} onCameraRequest={requestCamera}
        onFocusKind={(kind) => focusFeature(kind, null)} focusKind={focus?.kind ?? null}></KerrObservatoryControls>
      <KerrFocusPanel focus={focus} onClose={clearFocus}></KerrFocusPanel>
      <div className="kerr-deck">
        <section className="kerr-rgroup">
          <header>
            <h4>Geometry</h4>
            <span>exact Kerr · Boyer–Lindquist · GM/c² · prograde = disk orbit sense</span>
          </header>
          <div className="kerr-rgrid">
            <KerrReadout lead label="outer horizon r₊" value={rPlus.toFixed(3)} unit="GM/c²"
              formula="M + √(M² − a²)"
              sub={"1 + √(1 − " + a.toFixed(3) + "²) = " + rPlus.toFixed(3)}></KerrReadout>
            <KerrReadout label="ergosurface (equator)" value={kerr.rErgoEquator.toFixed(3)} unit="GM/c²"
              formula="r_E(θ) = M + √(M² − a² cos²θ)"
              sub={"θ = 90° → 1 + √(1 − " + a.toFixed(3) + "²·0) = " + kerr.rErgoEquator.toFixed(3)}></KerrReadout>
            <KerrReadout lead label="ISCO" unit="GM/c²"
              pair={[["prograde", rIsco.toFixed(3)], ["retrograde", exactGeometry.rIscoRetrograde.toFixed(3)]]}
              formula="3 + Z₂ ∓ √((3−Z₁)(3+Z₁+2Z₂))"
              sub={"Z₁ = " + kerr.z1.toFixed(3) + " · Z₂ = " + kerr.z2.toFixed(3) + (aStar < 0 ? " · a★ < 0: the +φ disk is retrograde" : "")}></KerrReadout>
            <KerrReadout label="photon orbit" unit="GM/c²"
              pair={[["prograde", rPhoton.toFixed(3)], ["retrograde", exactGeometry.rPhotonRetrograde.toFixed(3)]]}
              formula="2[1 + cos(⅔ arccos(∓a★))]"
              sub={"2[1 + cos(⅔ arccos(−" + aStar.toFixed(3) + "))] = " + rPhoton.toFixed(3)}></KerrReadout>
            <KerrReadout label="Schwarzschild radius r_s" value={sciNotation(rs_km)} unit="km"
              formula="2GM/c²"
              sub={"2.95 km × " + sciNotation(M, 2) + " = " + sciNotation(rs_km) + " km"}></KerrReadout>
            <KerrReadout label="spin a★" value={aStar.toFixed(3)}
              formula="a★ = Jc/GM², extremal at |a★| = 1"
              sub={"clamped to |a★| ≤ 0.998 · r₋ = " + horizons.rMinus.toFixed(3) + " GM/c²"}></KerrReadout>
          </div>
        </section>
        <section className="kerr-rgroup">
          <header>
            <h4>Thermodynamics</h4>
            <span>semiclassical · never observed</span>
          </header>
          <div className="kerr-rgrid">
            <KerrReadout lead label="Hawking temperature T_H" value={sciNotation(T_H)} unit="K"
              formula="T_H = ħκ / 2πck_B"
              sub={"6.17×10⁻⁸ K / " + sciNotation(M, 2) + " × " + tempFactor.toFixed(3) + " = " + sciNotation(T_H) + " K"}></KerrReadout>
            <KerrReadout label="T_H / T_Schw at this spin" value={tempFactor.toFixed(3)}
              formula="κ(a) / κ(0), → 0 at extremality"
              sub={"κ = (" + rPlus.toFixed(3) + " − 1) / (" + rPlus.toFixed(3) + "² + " + a.toFixed(3) + "²) = " + kerr.surfaceGravity.toFixed(4)}></KerrReadout>
            <KerrReadout lead label="entropy S / k_B" value={sciNotation(S, 2)}
              formula="S = A c³ / 4Għ"
              sub={"1.05×10⁷⁷ × " + sciNotation(M, 2) + "² × " + (rPlus / 2).toFixed(3) + " = " + sciNotation(S, 2)}></KerrReadout>
            <KerrReadout label="evaporation time" value={sciNotation(t_ev, 2)} unit="yr"
              formula="∝ M³, order of magnitude"
              sub={"2.1×10⁶⁷ yr × " + sciNotation(M, 2) + "³ = " + sciNotation(t_ev, 2) + " yr"}></KerrReadout>
          </div>
        </section>
      </div>
      <KerrFormulation geometry={kerr} massSolar={M} temperature={T_H} entropy={S}></KerrFormulation>
      <KerrValidity geometry={kerr}></KerrValidity>
      <div className="grid-2" style={{ marginTop: 6 }}>
        <HawkingSpectrumPlot logM={logM} tempFactor={tempFactor}></HawkingSpectrumPlot>
        <PageCurvePlot></PageCurvePlot>
      </div>
      <VizCaption status="schematic">
        Spin reshapes the geometry. The outer horizon <Eq tex="r_+ = M + \sqrt{M^2 - a^2}"></Eq> shrinks as the hole
        spins up, the prograde <strong>ISCO</strong> falls from 6 to 1 <Eq tex="GM/c^2"></Eq> as
        <Eq tex="a_\star\!:0\to1"></Eq> (Bardeen 1972) while retrograde orbits move outward — which is why prograde
        matter orbits closer and radiates more efficiently. The equatorial stationary-limit surface stays
        at <Eq tex="r=2GM/c^2"></Eq>, so spin opens the ergoregion between it and the horizon, and the surface
        gravity (hence Hawking temperature) falls to zero at extremality. Mass inverts the thermodynamics: doubling
        it doubles r_s, quadruples the entropy and <em>halves</em> the temperature — black holes have negative
        specific heat. The two plots show the thermal <strong>Hawking spectrum</strong> and the
        <strong> Page curve</strong>, the entanglement entropy any unitary evaporation must follow. See the validity
        panel above for what is exact here and what is approximated.
      </VizCaption>
    </div>
  );
}

function BlackHoleSim() {
  const [logM, setLogM] = useState(1); // log10(M / M_sun), 0..9
  const [overlay, setOverlay] = useState(true);
  const logMRef = useRef(logM); logMRef.current = logM;
  const ovRef = useRef(overlay); ovRef.current = overlay;
  const prm = usePRM();

  const sim = useSimLoop((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const rs = Math.min(w, h) * 0.16; // screen-space horizon radius (fixed; physics in readouts)
    // lensed background grid: radial displacement r' = r + k/r (schematic lens map)
    const k = rs * rs * 1.35;
    ctx.lineWidth = 1;
    const warp = (x, y) => {
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) + 1e-6;
      const rp = r + k / r;
      return [cx + (dx / r) * rp, cy + (dy / r) * rp];
    };
    ctx.strokeStyle = "rgba(110,140,200,0.13)";
    const step = 36;
    for (let gx = -step * 14; gx <= w + step * 2; gx += step) {
      ctx.beginPath();
      let started = false;
      for (let gy = -step * 6; gy <= h + step * 6; gy += 8) {
        const [px, py] = warp(gx, gy);
        if (Math.hypot(px - cx, py - cy) < rs * 1.4) { started = false; continue; }
        if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    for (let gy = -step * 6; gy <= h + step * 6; gy += step) {
      ctx.beginPath();
      let started = false;
      for (let gx = -step * 6; gx <= w + step * 6; gx += 8) {
        const [px, py] = warp(gx, gy);
        if (Math.hypot(px - cx, py - cy) < rs * 1.4) { started = false; continue; }
        if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // accretion disk (behind + front, doppler-asymmetric brightness)
    const drawDisk = (front) => {
      for (let i = 0; i < 42; i++) {
        const a0 = (i / 42) * Math.PI * 2 + (prm ? 0 : t * 0.35);
        const rr = rs * (1.7 + 0.5 * Math.sin(i * 2.7));
        const x = cx + Math.cos(a0) * rr * 1.55;
        const y = cy + Math.sin(a0) * rr * 0.4;
        const isFront = Math.sin(a0) > 0;
        if (isFront !== front) continue;
        const doppler = 0.45 + 0.55 * (1 + Math.cos(a0)) / 2; // brighter approaching side
        ctx.fillStyle = "rgba(240,205,140," + (0.5 * doppler).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(x, y, 1.6 + doppler * 1.4, 0, Math.PI * 2); ctx.fill();
      }
    };
    drawDisk(false);
    // photon ring glow
    const ringR = rs * 1.32;
    const rg = ctx.createRadialGradient(cx, cy, ringR * 0.86, cx, cy, ringR * 1.25);
    rg.addColorStop(0, "rgba(255,235,190,0)");
    rg.addColorStop(0.5, "rgba(255,230,175,0.55)");
    rg.addColorStop(1, "rgba(255,230,175,0)");
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(cx, cy, ringR * 1.3, 0, Math.PI * 2); ctx.fill();
    // shadow / horizon
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(cx, cy, rs, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,235,190,0.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, rs, 0, Math.PI * 2); ctx.stroke();
    drawDisk(true);
    // annotations
    if (ovRef.current) {
      ctx.font = "10px IBM Plex Mono"; ctx.fillStyle = "rgba(200,215,240,0.75)";
      ctx.strokeStyle = "rgba(200,215,240,0.35)";
      ctx.beginPath(); ctx.moveTo(cx + rs * 0.71, cy - rs * 0.71); ctx.lineTo(cx + rs * 1.7, cy - rs * 1.55); ctx.stroke();
      ctx.fillText("event horizon  r = r_s", cx + rs * 1.76, cy - rs * 1.55);
      ctx.beginPath(); ctx.moveTo(cx - ringR * 0.8, cy - ringR * 0.62); ctx.lineTo(cx - ringR * 2.0, cy - ringR * 1.15); ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText("photon-ring glow (lensed light)", cx - ringR * 2.04, cy - ringR * 1.15);
      ctx.textAlign = "left";
      // entropy-area tiling hint: dotted arc segments on horizon
      ctx.strokeStyle = "rgba(140,190,255,0.5)";
      ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.arc(cx, cy, rs * 0.999, -0.6, 0.9); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(140,190,255,0.7)";
      ctx.fillText("S ∝ horizon area / 4 l_P²", cx + rs * 0.75, cy + rs * 1.05);
    }
  }, [prm]);

  const M = Math.pow(10, logM);
  const rs_km = 2.95 * M;
  const T_H = 6.17e-8 / M;
  const S = 1.05e77 * M * M;
  const t_ev = window.QGA_PHYSICS.blackHoleEvaporationTimeYears(M);

  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="black hole mass" min={0} max={9} step={0.05} value={logM} onChange={setLogM}
          format={(v) => sciNotation(Math.pow(10, v), 2) + " M☉"}></SliderRow>
        <Toggle label="annotations" checked={overlay} onChange={setOverlay}></Toggle>
      </div>
      <canvas ref={sim.canvasRef} className="viz-canvas" style={{ height: 360 }}></canvas>
      <div className="viz-toolbar viz-toolbar-bottom readout-grid" style={{ display: "grid" }}>
        <div className="readout"><div className="readout-label">Schwarzschild radius r_s</div>
          <div className="readout-value">{sciNotation(rs_km)}<span className="unit">km</span></div></div>
        <div className="readout"><div className="readout-label">Hawking temperature T_H</div>
          <div className="readout-value">{sciNotation(T_H)}<span className="unit">K</span></div></div>
        <div className="readout"><div className="readout-label">Entropy S / k_B</div>
          <div className="readout-value">{sciNotation(S, 2)}</div></div>
        <div className="readout"><div className="readout-label">Evaporation time (order of magnitude)</div>
          <div className="readout-value">{sciNotation(t_ev, 2)}<span className="unit">yr</span></div></div>
      </div>
      <VizCaption status="schematic">
        Visual scale is fixed; the readouts carry the physics. Note the inversions: doubling the mass doubles r_s,
        quadruples the entropy, and <em>halves</em> the temperature — black holes have negative specific heat.
        A solar-mass black hole at 6×10⁻⁸ K is far colder than the cosmic microwave background and is currently
        absorbing more than it radiates.
      </VizCaption>
    </div>
  );
}

function HolographyViz() {
  const [links, setLinks] = useState(5);
  const linksRef = useRef(links); linksRef.current = links;
  const prm = usePRM();
  const sim = useSimLoop((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.4;
    const tt = prm ? 0 : t;
    // bulk: concentric hyperbolic-style grid (radial + circles crowding to boundary)
    ctx.lineWidth = 1;
    for (let i = 1; i <= 6; i++) {
      const rr = R * Math.tanh(i * 0.42);
      ctx.strokeStyle = "rgba(110,140,200," + (0.08 + i * 0.012).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.strokeStyle = "rgba(110,140,200,0.08)";
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
    }
    // boundary circle
    ctx.strokeStyle = "oklch(0.78 0.1 200)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    // boundary nodes
    const nB = 18;
    for (let i = 0; i < nB; i++) {
      const a = (i / nB) * Math.PI * 2;
      const pulse = prm ? 0.8 : 0.65 + 0.35 * Math.sin(tt * 1.6 + i * 1.3);
      ctx.fillStyle = "rgba(140,210,230," + pulse.toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 3, 0, Math.PI * 2); ctx.fill();
    }
    // entanglement geodesics: arcs between boundary node pairs, bulging through the bulk
    const L = linksRef.current;
    for (let i = 0; i < L; i++) {
      const a1 = ((i * 3.1) % nB) / nB * Math.PI * 2 + 0.1;
      const span = 0.8 + (i % 3) * 0.85;
      const a2 = a1 + span;
      const p1 = [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R];
      const p2 = [cx + Math.cos(a2) * R, cy + Math.sin(a2) * R];
      const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
      // pull control point toward center — deeper for wider spans (RT-surface intuition)
      const depth = Math.min(1, span / Math.PI);
      const c = [mid[0] + (cx - mid[0]) * depth * 0.9, mid[1] + (cy - mid[1]) * depth * 0.9];
      const glow = prm ? 0.5 : 0.4 + 0.2 * Math.sin(tt * 1.2 + i * 2);
      ctx.strokeStyle = "oklch(0.72 0.13 300 / " + glow.toFixed(3) + ")";
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.quadraticCurveTo(c[0], c[1], p2[0], p2[1]); ctx.stroke();
    }
    ctx.font = "10px IBM Plex Mono"; ctx.fillStyle = "rgba(170,195,230,0.75)";
    ctx.fillText("boundary: quantum theory without gravity", 12, 20);
    ctx.fillText("bulk: emergent curved spacetime", 12, h - 14);
    ctx.fillStyle = "oklch(0.72 0.13 300 / 0.8)";
    ctx.fillText("arcs ~ entanglement (RT surfaces)", w - 230, 20);
  }, [prm]);
  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="boundary entanglement links" min={0} max={12} step={1} value={links} onChange={setLinks}
          format={(v) => String(v)}></SliderRow>
      </div>
      <canvas ref={sim.canvasRef} className="viz-canvas" style={{ height: 340 }}></canvas>
      <VizCaption status="conjectural">
        Conceptual rendering of holographic duality: a gravity-free quantum theory on the boundary circle encodes
        geometry in the interior. Per the Ryu–Takayanagi proposal, the entanglement entropy of a boundary region
        equals the area of the minimal bulk surface anchored to it — increase the links and more of the bulk is
        'woven'. AdS/CFT is precise in specific theoretical settings; it is not a proven description of our universe.
      </VizCaption>
    </div>
  );
}

function ModuleBH({ go }) {
  return (
    <article>
      <ModuleHeader num="07" kicker="The theoretical laboratory" title="Black Holes, Entropy, and Holography"
        lede="Black holes are where general relativity, quantum field theory, and thermodynamics collide in a single object. They are the closest thing quantum gravity has to an experimental apparatus — even if, so far, only a theoretical one."></ModuleHeader>

      <Section title="Thermodynamics simulator">
        <p>
          Classically, a black hole is characterized by mass, charge, and spin alone. Bekenstein argued it must carry
          entropy proportional to horizon area; Hawking's 1975 calculation of quantum fields near the horizon
          confirmed the thermodynamic picture by assigning a temperature. Adjust the mass and observe how all
          quantities scale together.
        </p>
        <BlackHoleLab3D></BlackHoleLab3D>
        <div className="formula-grid" style={{ marginTop: 16 }}>
          <FormulaCard title="Schwarzschild radius" status="established"
            tex="r_s = \frac{2GM}{c^2}"
            symbols={[
              { s: "M", d: "Black hole mass." },
              { s: "r_s", d: "Horizon radius for a non-rotating, uncharged black hole: ≈ 3 km per solar mass." },
            ]}
            meaning="The point of no return. Within r_s, all future-directed paths point inward; escape would require exceeding the speed of light."
            limits="Idealized static, spherically symmetric solution; astrophysical black holes rotate (Kerr metric)."></FormulaCard>
          <FormulaCard title="Hawking temperature" status="established"
            tex="T_H = \frac{\hbar c^3}{8\pi G M k_B}"
            symbols={[
              { s: "T_H", d: "Temperature of the thermal radiation seen by a distant observer." },
              { s: "M^{-1}", d: "Inverse mass dependence: small black holes are hot, large ones are cold — hence negative specific heat." },
            ]}
            meaning="Derived from quantum field theory on the curved Schwarzschild background — a semiclassical result combining ħ, G, and c, widely regarded as the most trustworthy landmark in quantum gravity."
            limits="A theoretical prediction: for astrophysical masses T_H is unobservably small, and Hawking radiation has never been directly detected."></FormulaCard>
          <FormulaCard title="Bekenstein–Hawking entropy" status="established"
            tex="S_{BH} = \frac{k_B c^3 A}{4 G \hbar} = k_B \frac{A}{4\, l_P^2}"
            symbols={[
              { s: "A", d: "Horizon area, A = 4πr_s² for Schwarzschild." },
              { s: "A / 4 l_P^2", d: "One quarter of the horizon area counted in Planck-area units — about 10⁷⁷ for a solar-mass black hole." },
            ]}
            meaning="Entropy proportional to area, not volume. Taken at face value, the information capacity of a region is bounded by its surface — the seed of the holographic principle."
            limits="The microstates being counted remain unidentified in general; candidate countings exist in string theory and LQG for special cases."></FormulaCard>
        </div>
      </Section>

      <Section title="The information paradox">
        <p>
          Hawking radiation appears exactly thermal — independent of what formed the black hole. If the hole
          evaporates completely, the final state seems to carry no memory of the initial one, violating quantum
          unitarity. Four decades of debate sharpened this into the field's central thought experiment. The modern
          consensus, driven by holography and by the 2019 replica-wormhole calculations of the Page curve, leans
          toward information being preserved — but <em>how</em> it escapes, and what an infalling observer
          experiences, remain genuinely open.
        </p>
      </Section>

      <Section title="Holography: boundary and bulk">
        <HolographyViz></HolographyViz>
      </Section>

      <Misconception title="The pair-production picture of Hawking radiation is heuristic.">
        The cartoon of 'one particle falling in while its partner escapes' does not appear in the derivation, which
        analyzes field modes in curved spacetime. The picture is a useful mnemonic — and misleading if taken
        literally, e.g. it wrongly suggests the radiation originates exactly at the horizon point.
      </Misconception>
      <Misconception title="Holography does not mean the universe is a projection.">
        The holographic principle is a statement about information capacity scaling with area, made precise only in
        special settings (AdS/CFT). It does not assert that the world is an illusion, a simulation, or a literal
        hologram in the optical sense.
      </Misconception>
      <ConceptBridge id="bh-exp" go={go}></ConceptBridge>
    </article>
  );
}

window.ModuleBH = ModuleBH;

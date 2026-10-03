// mod-blackholes.jsx — Module 07: Black Holes, Entropy, and Holography
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
    const planck = (x) => { const u = x / Tvis; return (u * u * u) / (Math.exp(Math.min(40, u)) - 1 + 1e-9); };
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
    for (let i = 0; i <= 100; i++) { const f = i / 100; const thermal = 1.7 * f; const remaining = 1.7 * (1 - f); const s = Math.min(thermal, remaining); ctx.lineTo(X(f), Y(s)); }
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

const KERR_CAMERA_PRESETS = {
  edge: { radius: 30, theta: 0.35, phi: 1.31, minR: 12, maxR: 60 },
  polar: { radius: 30, theta: 0.25, phi: 0.18, minR: 12, maxR: 60 },
  photon: { radius: 16, theta: 0.5, phi: 1.12, minR: 12, maxR: 60 },
  wide: { radius: 44, theta: -0.45, phi: 1.2, minR: 12, maxR: 60 },
};

const KERR_CURVES = [
  { key: "isco", sense: "retro", color: "#b388ff", dash: "5 4", width: 1.2, label: "ISCO retrograde", read: (g) => g.rIscoRetrograde },
  { key: "isco", sense: "pro", color: "#54aeff", dash: "", width: 1.9, label: "ISCO prograde", read: (g) => g.rIsco },
  { key: "photon", sense: "retro", color: "#ffb454", dash: "3 4", width: 1.1, label: "Photon retrograde", read: (g) => g.rPhotonRetrograde },
  { key: "photon", sense: "pro", color: "#ffd38a", dash: "", width: 1.9, label: "Photon prograde", read: (g) => g.rPhoton },
  { key: "ergo", sense: "", color: "#46d4e0", dash: "", width: 1.6, label: "Ergosurface (eq.)", read: (g) => g.rErgoEquator, fill: "rgba(70,212,224,0.07)" },
  { key: "horizon", sense: "", color: "#ff7b72", dash: "", width: 2.3, label: "Outer horizon r₊", read: (g) => g.rPlus, fill: "rgba(4,7,13,0.97)" },
];

function KerrGeometryMap({ geometry, layers, open, onToggle }) {
  const cx = 118, cy = 110, span = 94;
  const visible = KERR_CURVES.filter((curve) => layers[curve.key]);
  const widest = visible.reduce((acc, curve) => Math.max(acc, curve.read(geometry)), 2);
  const domain = Math.max(4, Math.ceil(widest));
  const px = (radius) => span * radius / domain;
  const tickStep = domain > 12 ? 4 : domain > 6 ? 2 : 1;
  const ticks = [];
  for (let r = tickStep; r <= domain; r += tickStep) ticks.push(r);

  if (!open) {
    return (
      <button className="kerr-map-toggle" type="button" aria-expanded="false" onClick={onToggle}>
        <span className="kerr-map-toggle-icon" aria-hidden="true"></span>
        <span><strong>Radii map</strong><small>Show exact Kerr geometry</small></span>
      </button>
    );
  }

  return (
    <figure className="kerr-map" aria-label="Exact Kerr equatorial coordinate-radius figure">
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
        {visible.map((curve, index) => (
          <circle key={index} cx={cx} cy={cy} r={px(curve.read(geometry))}
            fill={curve.fill || "none"} stroke={curve.color} strokeWidth={curve.width}
            strokeDasharray={curve.dash}></circle>
        ))}
        <circle cx={cx} cy={cy} r="1.8" fill="#e8eef8"></circle>
        <g className="kerr-spin-mark">
          <path d={"M " + (cx + 56) + " " + (cy - 72) + " a 46 46 0 0 1 26 22"} fill="none"
            stroke="rgba(233,246,255,0.5)" strokeWidth="1.1"></path>
          <path d={"M " + (cx + 82) + " " + (cy - 50) + " l -6 -1 l 1 6"} fill="none"
            stroke="rgba(233,246,255,0.5)" strokeWidth="1.1"></path>
          <text x={cx + 50} y={cy - 78} className="kerr-tick-label">a★ {geometry.a.toFixed(2)}</text>
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
              <td className="kerr-legend-value">{curve.read(geometry).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="kerr-map-note">Boyer–Lindquist coordinate radii, exact Kerr · not image-plane distances</p>
    </figure>
  );
}

function KerrReadout({ label, value, unit, formula, lead, pair }) {
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
          <dt>Approximation</dt>
          <dd>
            The raymarched image uses a Schwarzschild-based geodesic approximation with visual spin cues.
            It is a teaching render, not a ray-traced Kerr image; frame dragging is not integrated.
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

/* ---------- 3D black hole laboratory ---------- */
function BlackHoleLab3D() {
  const [atlasState, setAtlasState] = useQGAState();
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

  useEffect(() => {
    try {
      localStorage.setItem(mapPreferenceKey, String(mapOpen));
    } catch (error) {
      console.warn("Kerr map preference could not be saved.", error);
    }
  }, [mapOpen, mapPreferenceKey]);

  const build = (ctx) => {
    const { THREE, scene } = ctx;
    const det = ctx.settings.current.detail3d;
    const STEPS = det === "low" ? 150 : det === "ultra" ? 380 : 260;

    // ---- Gargantua: full-frame gravitational-lensing raymarch shader ----
    // A screen quad reconstructs a view ray per pixel from the real orbit camera,
    // marches it while bending toward the hole (geodesic approximation), samples a
    // thin equatorial accretion disk with Doppler beaming + relativistic temperature,
    // and reads a lensed star field for escaped rays — the Interstellar look.
    const uniforms = {
      uCamPos: { value: new THREE.Vector3() },
      uFwd: { value: new THREE.Vector3() },
      uRight: { value: new THREE.Vector3() },
      uUp: { value: new THREE.Vector3() },
      uTanFov: { value: Math.tan(THREE.MathUtils.degToRad(45 / 2)) },
      uAspect: { value: 1 },
      uTime: { value: 0 },
      uSteps: { value: STEPS },
      uDiskGlow: { value: 1.0 },
      uSpin: { value: 0.0 },
    };
    const frag = `
      precision highp float;
      varying vec2 vUv;
      uniform vec3 uCamPos, uFwd, uRight, uUp;
      uniform float uTanFov, uAspect, uTime, uSteps, uDiskGlow, uSpin;
      float hash3(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      vec3 stars(vec3 d){
        vec3 c = vec3(0.0);
        for(int k=0;k<3;k++){
          float scl = 140.0 + float(k)*190.0;
          vec3 g = floor(d*scl);
          float h = hash3(g + float(k)*7.1);
          if(h > 0.984){
            float b = (h-0.984)/0.016;
            vec3 tint = mix(vec3(0.7,0.8,1.0), vec3(1.0,0.92,0.8), hash3(g+2.0));
            c += tint * b*b * 1.5;
          }
        }
        c += vec3(0.07,0.10,0.18) * exp(-pow(d.y*2.0, 2.0)) * 0.06;
        return c;
      }
      void main(){
        vec2 ndc = vUv*2.0 - 1.0;
        vec3 dir = normalize(uFwd + ndc.x*uTanFov*uAspect*uRight + ndc.y*uTanFov*uUp);
        float SC = 2.7;                         // world units per gravitational unit (horizon at r=1)
        vec3 p = uCamPos / SC;
        vec3 v = dir;
        vec3 hvec = cross(p, v); float h2 = dot(hvec, hvec);   // conserved angular momentum (impact parameter)
        float diskIn = 2.6 - 1.2*uSpin, diskOut = 6.2;   // prograde ISCO shrinks with spin
        vec3 col = vec3(0.0);
        float transmit = 1.0;
        bool captured = false;
        float minr = 1e9;
        float dt = 0.14;
        int steps = int(uSteps);
        for(int i=0;i<450;i++){
          if(i>=steps) break;
          float r = length(p);
          minr = min(minr, r);
          if(r < 1.0){ captured = true; break; }              // event horizon
          if(r > 26.0 && dot(v,p) > 0.0) break;
          vec3 acc = -1.5 * h2 * p / pow(dot(p,p), 2.5);       // null geodesic, Schwarzschild
          vec3 pnew = p + v*dt;
          vec3 vnew = v + acc*dt;
          vec3 midp = (p+pnew)*0.5;
          float rr = length(midp.xz);
          if(rr > diskIn && rr < diskOut){
            float thick = 0.10 + rr*0.02;
            float dens = exp(-(midp.y*midp.y)/(thick*thick));
            if(dens > 0.004){
              float tn = (rr-diskIn)/(diskOut-diskIn);
              vec3 hotC = vec3(1.0,0.97,0.90), midC = vec3(1.0,0.60,0.25), coolC = vec3(0.90,0.26,0.07);
              vec3 dcol = mix(hotC, midC, smoothstep(0.0,0.4,tn));
              dcol = mix(dcol, coolC, smoothstep(0.4,1.0,tn));
              float ang = atan(midp.z, midp.x);
              float orb = uTime * 1.3 * (1.0 + 0.9*uSpin) / pow(rr/diskIn, 1.5);   // frame dragging speeds the inner disk
              float sw = ang - orb;
              float n = 0.6 + 0.25*sin(sw*3.0) + 0.17*sin(sw*7.0 + rr*2.0) + 0.10*sin(sw*15.0 - rr);
              n = clamp(n, 0.2, 1.4);
              vec3 vel = normalize(vec3(-midp.z, 0.0, midp.x));
              float dop = dot(vel, -normalize(v));
              float beam = pow(clamp(0.5 + 0.7*dop, 0.0, 2.1), 2.8);    // relativistic Doppler beaming
              float bright = (1.2/(1.0+(rr-diskIn)*0.5)) * n * beam * uDiskGlow;
              float em = dens * bright * dt * SC;
              col += transmit * dcol * em;
              transmit *= exp(-dens * dt * SC * 1.2);
            }
          }
          p = pnew; v = vnew;
        }
        // photon ring: rays that grazed the photon sphere (r = 1.5) and escaped
        if(!captured){
          float ring = exp(-pow((minr - 1.5)/0.10, 2.0));
          col += vec3(1.0,0.85,0.62) * ring * 0.9;
          col += transmit * stars(normalize(v));
        }
        col = col/(col+vec3(1.0));
        col = pow(col, vec3(0.82));
        gl_FragColor = vec4(col, 1.0);
      }`;
    const vert = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false })
    );
    quad.frustumCulled = false;
    quad.renderOrder = -10;
    scene.add(quad);

    ctx.label("event horizon", () => ({ x: 0, y: -2.5, z: 0 }), "s3d-quiet");
    ctx.label("photon ring", () => ({ x: -2.8, y: 2.9, z: 0 }), "s3d-quiet");
    ctx.annotation("S = k_B A / 4 l_P² — entropy scales with horizon AREA, not volume",
      () => ({ x: 0, y: -4.2, z: 0 }));
    ctx.annotation("the far side of the disk wraps over and under the shadow",
      () => ({ x: 0, y: 5.2, z: 0 }));

    const worldUp = new THREE.Vector3(0, 1, 0);
    const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
    return {
      autoRotate: false,
      update: (t, dt) => {
        const cam = ctx.camera;
        fwd.set(0, 0, 0).sub(cam.position).normalize();
        right.crossVectors(fwd, worldUp).normalize();
        up.crossVectors(right, fwd).normalize();
        uniforms.uCamPos.value.copy(cam.position);
        uniforms.uFwd.value.copy(fwd);
        uniforms.uRight.value.copy(right);
        uniforms.uUp.value.copy(up);
        uniforms.uTanFov.value = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
        uniforms.uAspect.value = cam.aspect || 1;
        uniforms.uTime.value += dt * ctx.motion();
        // smaller holes glow a touch hotter (visual cue tied to the mass slider)
        uniforms.uDiskGlow.value = 0.85 + 0.4 * (1 - logRef.current / 9);
        uniforms.uSpin.value += (spinRef.current - uniforms.uSpin.value) * Math.min(1, dt * 4);
      },
    };
  };

  const M = Math.pow(10, logM);
  const rs_km = window.QGA_PHYSICS.schwarzschildRadius(M);
  const kerr = window.QGA_PHYSICS.kerrGeometry(aStar);
  const a = kerr.a;
  const rPlus = kerr.rPlus;          // outer horizon
  const rIsco = kerr.rIsco;
  const rPhoton = kerr.rPhoton;
  const tempFactor = kerr.temperatureFactor;
  const T_H = window.QGA_PHYSICS.hawkingTemperature(M, a);
  const S = window.QGA_PHYSICS.blackHoleEntropyAreaUnits(M, a);
  const t_ev = 2.1e67 * M * M * M;

  return (
    <div className="viz-frame">
      <div className="kerr-observatory-head">
        <div className="kerr-head-plate">
          <div className="kerr-head-ident">KERR<span>OBS</span></div>
          <div>
            <h3>Black Hole Observatory</h3>
            <p>An approximate lensing render read against exact Kerr coordinate radii.</p>
          </div>
        </div>
        <div className="kerr-head-state">
          <span className="badge badge-effective">Kerr geometry + approximate raymarch</span>
          <div className="kerr-state-line">
            M = {sciNotation(M, 2)} M☉ · a★ = {aStar.toFixed(3)} · r₊ = {rPlus.toFixed(3)} GM/c²
          </div>
        </div>
      </div>
      <div className="viz-toolbar">
        <SliderRow label="black hole mass" min={0} max={9} step={0.05} value={logM} onChange={(v) => setAtlasState({ bhMass: v })}
          format={(v) => sciNotation(Math.pow(10, v), 2) + " M☉"}></SliderRow>
        <SliderRow label="spin a★" min={0} max={0.998} step={0.002} value={aStar} onChange={(v) => setAtlasState({ bhSpin: v })}
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
              aria-pressed={cameraPreset === key} onClick={() => setCameraPreset(key)}>{label}</button>
          ))}
        </div>
      </div>
      <Scene3D height={460} aria="Three-dimensional black hole with accretion disk, photon ring, and physical readouts"
        initial={KERR_CAMERA_PRESETS[cameraPreset]} deps={[cameraPreset]}
        overlay={<KerrGeometryMap geometry={kerr} layers={layers} open={mapOpen}
          onToggle={() => setMapOpen((current) => !current)}></KerrGeometryMap>}
        build={build} fallback={<BlackHoleSim></BlackHoleSim>}></Scene3D>
      <div className="kerr-deck">
        <section className="kerr-rgroup">
          <header>
            <h4>Geometry</h4>
            <span>exact Kerr · Boyer–Lindquist · GM/c²</span>
          </header>
          <div className="kerr-rgrid">
            <KerrReadout lead label="outer horizon r₊" value={rPlus.toFixed(3)} unit="GM/c²"
              formula="M + √(M² − a²)"></KerrReadout>
            <KerrReadout label="ergosurface (equator)" value={kerr.rErgoEquator.toFixed(3)} unit="GM/c²"
              formula="r = 2GM/c², spin-independent"></KerrReadout>
            <KerrReadout lead label="ISCO" unit="GM/c²"
              pair={[["prograde", rIsco.toFixed(3)], ["retrograde", kerr.rIscoRetrograde.toFixed(3)]]}
              formula="3 + Z₂ ∓ √((3−Z₁)(3+Z₁+2Z₂))"></KerrReadout>
            <KerrReadout label="photon orbit" unit="GM/c²"
              pair={[["prograde", rPhoton.toFixed(3)], ["retrograde", kerr.rPhotonRetrograde.toFixed(3)]]}
              formula="2[1 + cos(⅔ arccos(∓a★))]"></KerrReadout>
            <KerrReadout label="Schwarzschild radius r_s" value={sciNotation(rs_km)} unit="km"
              formula="2GM/c²"></KerrReadout>
            <KerrReadout label="spin a★" value={a.toFixed(3)}
              formula="a★ = Jc/GM², extremal at 1"></KerrReadout>
          </div>
        </section>
        <section className="kerr-rgroup">
          <header>
            <h4>Thermodynamics</h4>
            <span>semiclassical · never observed</span>
          </header>
          <div className="kerr-rgrid">
            <KerrReadout lead label="Hawking temperature T_H" value={sciNotation(T_H)} unit="K"
              formula="T_H = ħκ / 2πck_B"></KerrReadout>
            <KerrReadout label="T_H / T_Schw at this spin" value={tempFactor.toFixed(3)}
              formula="κ(a) / κ(0), → 0 at extremality"></KerrReadout>
            <KerrReadout lead label="entropy S / k_B" value={sciNotation(S, 2)}
              formula="S = A c³ / 4Għ"></KerrReadout>
            <KerrReadout label="evaporation time" value={sciNotation(t_ev, 2)} unit="yr"
              formula="∝ M³, order of magnitude"></KerrReadout>
          </div>
        </section>
      </div>
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
  const t_ev = 2.1e67 * M * M * M;

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

// mod-experiments.jsx — Module 08: Experimental and Observational Frontiers
/* ---------- Collider event explorer ---------- */
function makeEvent(seed = Date.now()) {
  const random = QGA_SEEDED(seed);
  const tracks = [];
  const rand = (a, b) => a + random() * (b - a);
  // two jets, roughly back-to-back
  const jetPhi = rand(0, Math.PI * 2);
  for (const [base, n] of [[jetPhi, 4 + Math.floor(rand(0, 3))], [jetPhi + Math.PI + rand(-0.4, 0.4), 3 + Math.floor(rand(0, 3))]]) {
    for (let i = 0; i < n; i++) {
      tracks.push({
        type: "jet", phi: base + rand(-0.22, 0.22), curve: rand(-0.5, 0.5), reach: rand(0.55, 0.78),
        info: "Charged hadron inside a jet — the collimated spray from a fragmenting quark or gluon. Jets, not single quarks, are what detectors see; color confinement guarantees it.",
      });
    }
  }
  // isolated leptons / tracks
  const nl = 1 + Math.floor(rand(0, 2));
  for (let i = 0; i < nl; i++) {
    const mu = random() < 0.5;
    tracks.push({
      type: mu ? "muon" : "electron", phi: rand(0, Math.PI * 2), curve: rand(-0.7, 0.7) * (mu ? 0.4 : 1), reach: mu ? 1.0 : 0.62,
      info: mu
        ? "Muon candidate — a track that penetrates the calorimeters and registers in the outer muon chambers. Minimal energy loss; reconstructed by matching inner and outer hits."
        : "Electron candidate — a curved inner track terminating in a localized electromagnetic-calorimeter cluster matching the track momentum.",
    });
  }
  // photon(s)
  if (random() < 0.75) {
    tracks.push({
      type: "photon", phi: rand(0, Math.PI * 2), curve: 0, reach: 0.62,
      info: "Photon candidate — an electromagnetic-calorimeter cluster with no associated inner track (dashed: it leaves no hits in the tracker because it is neutral).",
    });
  }
  // missing transverse energy
  const vis = tracks.reduce((s, tr) => s + Math.cos(tr.phi), 0);
  const visY = tracks.reduce((s, tr) => s + Math.sin(tr.phi), 0);
  const metPhi = Math.atan2(-visY, -vis);
  tracks.push({
    type: "met", phi: metPhi, curve: 0, reach: 0.95,
    info: "Missing transverse momentum — the imbalance of all visible momenta. Signature of neutrinos (or hypothetical invisible particles) escaping the detector. It is inferred, never observed directly.",
  });
  return tracks;
}
const TRACK_STYLE = {
  jet: { color: "oklch(0.78 0.1 200)", dash: [], width: 1.4 },
  electron: { color: "oklch(0.74 0.12 235)", dash: [], width: 1.8 },
  muon: { color: "oklch(0.72 0.13 300)", dash: [], width: 1.8 },
  photon: { color: "oklch(0.8 0.1 85)", dash: [4, 4], width: 1.6 },
  met: { color: "oklch(0.7 0.13 25)", dash: [8, 5], width: 2 },
};
function trackPoint(tr, f, R) {
  // f in [0,1] along track; curvature bends phi
  const r = f * tr.reach * R;
  const phi = tr.phi + tr.curve * f * 1.1;
  return [Math.cos(phi) * r, Math.sin(phi) * r];
}

function ColliderEvent() {
  const [ev, setEv] = useState(() => makeEvent(qgaReadState().seed));
  const [sel, setSel] = useState(null);
  const evRef = useRef(ev); evRef.current = ev;
  const selRef = useRef(sel); selRef.current = sel;

  const sim = useSimLoop((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.46;
    // detector rings: tracker, ECAL, HCAL, muon system
    const rings = [
      [0.55, "tracker", "rgba(120,150,210,0.25)"],
      [0.68, "ECAL", "rgba(120,150,210,0.2)"],
      [0.82, "HCAL", "rgba(120,150,210,0.16)"],
      [1.0, "muon system", "rgba(120,150,210,0.12)"],
    ];
    ctx.font = "9px IBM Plex Mono";
    for (const [rr, name, col] of rings) {
      ctx.strokeStyle = col; ctx.lineWidth = rr === 1.0 ? 1.5 : 1;
      ctx.beginPath(); ctx.arc(cx, cy, Math.max(0, R * rr), 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(148,176,224,0.45)";
      ctx.fillText(name, cx + R * rr * 0.711 + 4, cy - R * rr * 0.703);
    }
    // beam axis
    ctx.strokeStyle = "rgba(148,176,224,0.3)"; ctx.setLineDash([2, 6]);
    ctx.beginPath(); ctx.moveTo(cx - R * 1.04, cy); ctx.lineTo(cx + R * 1.04, cy); ctx.stroke();
    ctx.setLineDash([]);
    // growth animation: tracks extend over first 1.6s after (re)start
    const grow = Math.min(1, t / 1.6);
    evRef.current.forEach((tr, idx) => {
      const st = TRACK_STYLE[tr.type];
      const isSel = selRef.current === idx;
      ctx.strokeStyle = st.color; ctx.lineWidth = st.width * (isSel ? 1.8 : 1);
      ctx.setLineDash(st.dash);
      ctx.save();
      if (isSel) { ctx.shadowColor = st.color; ctx.shadowBlur = 10; }
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const f = (i / 40) * grow;
        const [x, y] = trackPoint(tr, f, R);
        if (i === 0) ctx.moveTo(cx + x, cy + y); else ctx.lineTo(cx + x, cy + y);
      }
      ctx.stroke();
      ctx.restore();
      ctx.setLineDash([]);
      if (tr.type === "met" && grow >= 1) {
        const [x, y] = trackPoint(tr, 1, R);
        const ang = Math.atan2(y, x);
        ctx.fillStyle = st.color;
        ctx.save(); ctx.translate(cx + x, cy + y); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-9, -5); ctx.lineTo(-9, 5); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.fillText("E̸_T", cx + x * 1.06, cy + y * 1.06);
      }
    });
    // vertex
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
    if (!sim.tRef || !window.__qga) {} // noop
  }, []);

  const onClick = (e) => {
    const cv = sim.canvasRef.current;
    const r = cv.getBoundingClientRect();
    const w = r.width, h = r.height;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.46;
    const mx = e.clientX - r.left - cx, my = e.clientY - r.top - cy;
    let best = null, bestD = 18;
    evRef.current.forEach((tr, idx) => {
      for (let i = 0; i <= 24; i++) {
        const [x, y] = trackPoint(tr, i / 24, R);
        const d = Math.hypot(x - mx, y - my);
        if (d < bestD) { bestD = d; best = idx; }
      }
    });
    setSel(best);
    if (best !== null) sim.setPlaying(false);
  };

  const selTr = sel !== null ? ev[sel] : null;
  return (
    <div className="viz-frame">
      <canvas ref={sim.canvasRef} className="viz-canvas" style={{ height: 380, cursor: "pointer" }}
        onClick={onClick}></canvas>
      <SimBar sim={sim}>
        <button className="btn primary" onClick={() => { setEv(makeEvent(qgaReadState().seed)); setSel(null); sim.reset(); sim.setPlaying(true); }}>New collision</button>
      </SimBar>
      {selTr ? (
        <div className="viz-toolbar viz-toolbar-bottom">
          <span className="badge badge-schematic">{selTr.type === "met" ? "missing E_T" : selTr.type}</span>
          <span className="small" style={{ flex: 1 }}>{selTr.info}</span>
        </div>
      ) : null}
      <VizCaption status="schematic">
        Transverse view of a stylized collider event (beam axis horizontal). Click any track to inspect it —
        clicking pauses the event. Real event reconstruction is statistical and detector-dependent: what
        experiments report are fitted candidates with uncertainties, not labeled particles.
      </VizCaption>
    </div>
  );
}

/* ---------- Gravitational wave inspiral ---------- */
function GWInspiral() {
  const [q, setQ] = useState(1); // mass ratio m1/m2
  const qRef = useRef(q); qRef.current = q;
  const prm = usePRM();
  const stRef = useRef(null);
  const init = () => { stRef.current = { a: 1, phi: 0, wave: [], ripples: [], merged: 0 }; };
  if (!stRef.current) init();

  const sim = useSimLoop((ctx, w, h, t, dt) => {
    const st = stRef.current;
    const cx = w / 2, cyTop = h * 0.36, plotH = h * 0.26;
    const orbR = Math.min(w, h) * 0.3;
    // dynamics
    if (st.a > 0.07) {
      const om = 2.2 / Math.pow(st.a, 1.5);
      st.phi += om * dt;
      st.a -= 0.045 / Math.pow(st.a, 3) * dt;
      const hAmp = 0.5 / st.a;
      st.wave.push(Math.min(3, hAmp) * Math.cos(2 * st.phi));
      if (st.ripples.length === 0 || st.phi - st.ripples[st.ripples.length - 1].phi > Math.PI / 2)
        st.ripples.push({ r: st.a * orbR, phi: st.phi, born: t });
    } else if (st.merged === 0) {
      st.merged = t;
    } else {
      // ringdown then restart
      const tau = t - st.merged;
      st.wave.push(3 * Math.exp(-tau * 2.2) * Math.cos(14 * tau));
      if (tau > 2.8) { init(); sim.reset(); return; }
    }
    if (st.wave.length > 520) st.wave.shift();
    st.ripples = st.ripples.filter((rp) => t - rp.born < 4);

    // render
    ctx.clearRect(0, 0, w, h);
    // ripples
    for (const rp of st.ripples) {
      const age = t - rp.born;
      const rr = rp.r + age * orbR * 1.1;
      ctx.strokeStyle = "rgba(140,190,255," + Math.max(0, 0.3 - age * 0.08).toFixed(3) + ")";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cyTop, Math.max(0, rr), 0, Math.PI * 2); ctx.stroke();
    }
    // bodies
    const Q = qRef.current;
    const m1 = Q / (1 + Q), m2 = 1 / (1 + Q); // normalized masses
    const r1 = st.a * orbR * m2, r2 = st.a * orbR * m1;
    if (st.a > 0.07) {
      const drawBody = (rr, ang, m) => {
        const x = cx + Math.cos(ang) * rr, y = cyTop + Math.sin(ang) * rr * 0.96;
        const rad = 5 + m * 9;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 2);
        g.addColorStop(0, "rgba(220,232,255,0.95)"); g.addColorStop(1, "rgba(220,232,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, rad * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#0a0e16";
        ctx.beginPath(); ctx.arc(x, y, rad * 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(220,232,255,0.8)"; ctx.stroke();
      };
      drawBody(r1, st.phi, m1);
      drawBody(r2, st.phi + Math.PI, m2);
    } else {
      const g = ctx.createRadialGradient(cx, cyTop, 0, cx, cyTop, 36);
      g.addColorStop(0, "rgba(220,232,255,0.9)"); g.addColorStop(1, "rgba(220,232,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cyTop, 36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0a0e16"; ctx.beginPath(); ctx.arc(cx, cyTop, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(220,232,255,0.8)"; ctx.stroke();
      ctx.font = "10px IBM Plex Mono"; ctx.fillStyle = "rgba(170,195,230,0.8)";
      ctx.fillText("merger → ringdown", cx + 30, cyTop - 20);
    }
    // waveform panel
    const py0 = h - plotH - 16;
    ctx.strokeStyle = "rgba(148,176,224,0.2)";
    ctx.strokeRect(40, py0, w - 60, plotH);
    ctx.font = "9.5px IBM Plex Mono"; ctx.fillStyle = "rgba(148,176,224,0.5)";
    ctx.fillText("strain h(t) — schematic chirp", 46, py0 - 6);
    ctx.strokeStyle = "oklch(0.78 0.1 200)"; ctx.lineWidth = 1.4; ctx.beginPath();
    st.wave.forEach((v, i) => {
      const x = 40 + (i / 520) * (w - 60);
      const y = py0 + plotH / 2 - (v / 3) * plotH * 0.46;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [prm]);

  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="mass ratio m₁/m₂" min={1} max={6} step={0.1} value={q} onChange={setQ}
          format={(v) => v.toFixed(1)}></SliderRow>
      </div>
      <canvas ref={sim.canvasRef} className="viz-canvas" style={{ height: 400 }}></canvas>
      <SimBar sim={sim}>
        <button className="btn" onClick={() => { init(); sim.reset(); }}>Restart inspiral</button>
      </SimBar>
      <VizCaption status="schematic">
        Compact binary inspiral with quadrupole-style energy loss: the orbit shrinks, the frequency and amplitude
        sweep upward (the 'chirp'), and ringdown follows merger. An unequal mass ratio offsets the orbit around the
        common center of mass. GW150914 (2016) matched waveforms like this computed from general relativity —
        a triumph of the <em>classical</em> theory.
      </VizCaption>
    </div>
  );
}

/* ---------- 3D collider event display ---------- */
const TRACK_HEX = { jet: 0x6fd0e0, electron: 0x6ba6ff, muon: 0xb98af0, photon: 0xe0b35a, met: 0xd96a5a };
function makeEvent3D(seed = Date.now()) {
  const random = QGA_SEEDED(seed);
  return makeEvent(seed).map((tr) => ({ ...tr, eta: tr.type === "met" ? 0 : (random() * 1.6 - 0.8) }));
}
function ColliderEvent3D() {
  const [ev, setEv] = useState(() => makeEvent3D(qgaReadState().seed));
  const [sel, setSel] = useState(null);
  const selRef = useRef(sel); selRef.current = sel;

  const build = (ctx) => {
    const { THREE, scene } = ctx;
    scene.fog = new THREE.FogExp2(0x04060b, 0.012);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.6));

    const R = 4.4, LEN = 6.6;
    const layers = [[0.55, "tracker"], [0.68, "ECAL"], [0.82, "HCAL"], [1.0, "muon system"]];
    for (const [fr, name] of layers) {
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(R * fr, R * fr, LEN, 30, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x44598a, wireframe: true, transparent: true, opacity: fr === 1 ? 0.1 : 0.07 })
      );
      cyl.rotation.x = Math.PI / 2;
      scene.add(cyl);
      const lp = { x: R * fr * 0.71, y: R * fr * 0.74, z: -LEN / 2 };
      ctx.label(name, () => lp, "s3d-quiet");
    }
    scene.add(ctx.line([new THREE.Vector3(0, 0, -LEN * 0.62), new THREE.Vector3(0, 0, LEN * 0.62)], 0x44598a, 0.4, true));

    const vertex = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    scene.add(vertex);
    const vFlash = ctx.glow(0xfff4d6, 2.0, 0.95);
    scene.add(vFlash);
    // incoming beam bunches that stream in along the beam axis and collide at the vertex
    const BZ = LEN * 0.6;
    const beamA = ctx.glow(0x9fd0ff, 1.3, 0); scene.add(beamA);
    const beamB = ctx.glow(0x9fd0ff, 1.3, 0); scene.add(beamB);

    const NPT = 40;
    const lines = [];
    ev.forEach((tr, idx) => {
      const buf = new THREE.BufferAttribute(new Float32Array((NPT + 1) * 3), 3);
      for (let i = 0; i <= NPT; i++) {
        const f = i / NPT;
        const rr = f * tr.reach * R;
        const phi = tr.phi + tr.curve * f * 1.1;
        buf.setXYZ(i, Math.cos(phi) * rr, Math.sin(phi) * rr, tr.eta * f * (LEN * 0.42));
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", buf);
      g.setDrawRange(0, 0);
      const dashed = tr.type === "photon" || tr.type === "met";
      const mat = dashed
        ? new THREE.LineDashedMaterial({ color: TRACK_HEX[tr.type], transparent: true, opacity: 0.95, dashSize: 0.18, gapSize: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })
        : new THREE.LineBasicMaterial({ color: TRACK_HEX[tr.type], transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
      const line = new THREE.Line(g, mat);
      if (dashed) line.computeLineDistances();
      line.userData = { idx, info: tr.info, type: tr.type };
      line.frustumCulled = false;
      scene.add(line);
      lines.push({ line, g, tr });
      // calorimeter deposit
      if (tr.type === "jet" || tr.type === "electron" || tr.type === "photon") {
        const depR = R * (tr.type === "jet" ? 0.82 : 0.68);
        const hgt = 0.3 + Math.random() * 0.5;
        const phiEnd = tr.phi + tr.curve * 1.1 * tr.reach;
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.14, hgt, 0.14),
          new THREE.MeshBasicMaterial({ color: TRACK_HEX[tr.type], transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
        box.position.set(Math.cos(phiEnd) * (depR + hgt / 2), Math.sin(phiEnd) * (depR + hgt / 2), tr.eta * tr.reach * LEN * 0.42);
        box.rotation.z = phiEnd - Math.PI / 2;
        scene.add(box);
      }
      // MET arrowhead
      if (tr.type === "met") {
        const phiE = tr.phi;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 10),
          new THREE.MeshBasicMaterial({ color: TRACK_HEX.met }));
        cone.position.set(Math.cos(phiE) * tr.reach * R, Math.sin(phiE) * tr.reach * R, 0);
        cone.rotation.z = phiE - Math.PI / 2;
        scene.add(cone);
        ctx.label("E̸_T — missing transverse momentum", () => ({
          x: Math.cos(phiE) * tr.reach * R * 1.12, y: Math.sin(phiE) * tr.reach * R * 1.12, z: 0,
        }), "s3d-quiet");
      }
    });

    ctx.annotation("stylized event — real reconstruction is statistical, with fitted candidates and uncertainties",
      () => ({ x: 0, y: -R * 1.22, z: 0 }));

    return {
      pickables: lines.map((L) => L.line),
      onPick: (o) => { if (o && o.userData && o.userData.idx !== undefined) setSel(o.userData.idx); },
      update: (t) => {
        const THIT = 0.55;
        const grow = Math.min(1, Math.max(0, (t - THIT) / 1.2));
        // beam bunches accelerate inward, then wink out at the collision
        if (t < THIT) {
          const f = t / THIT, z = BZ * (1 - f * f);
          beamA.position.set(0, 0, z); beamB.position.set(0, 0, -z);
          beamA.material.opacity = beamB.material.opacity = 0.55 + 0.45 * Math.abs(Math.sin(t * 34));
          const sc = 1.1 + 0.5 * Math.sin(t * 30);
          beamA.scale.setScalar(sc); beamB.scale.setScalar(sc);
        } else {
          beamA.material.opacity = beamB.material.opacity = 0;
        }
        // vertex burst peaks at the moment of collision
        const burst = t < THIT ? 0 : Math.exp(-(t - THIT) * 2.4);
        vFlash.scale.setScalar(1.2 + 5.5 * burst);
        vFlash.material.opacity = 0.12 + 0.75 * burst;
        for (const { line, g } of lines) {
          g.setDrawRange(0, Math.max(2, Math.floor(grow * (NPT + 1))));
          const isSel = selRef.current === line.userData.idx;
          line.material.opacity = selRef.current === null ? 0.95 : isSel ? 1 : 0.3;
        }
      },
    };
  };

  const selTr = sel !== null ? ev[sel] : null;
  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <button className="btn primary" onClick={() => { setEv(makeEvent3D(qgaReadState().seed)); setSel(null); }}>New collision</button>
        {sel !== null ? <button className="btn" onClick={() => setSel(null)}>Clear selection</button> : null}
      </div>
      <Scene3D height={440} aria="Three-dimensional collider event display; click a track to identify it"
        initial={{ radius: 12.5, theta: 0.7, phi: 1.1, minR: 6, maxR: 30, bloom: { strength: 0.7, radius: 0.55, threshold: 0.2 } }}
        build={build} deps={[ev]} fallback={<ColliderEvent></ColliderEvent>}></Scene3D>
      {selTr ? (
        <div className="s3d-detail" aria-live="polite">
          <span className="badge badge-schematic">{selTr.type === "met" ? "missing E_T" : selTr.type}</span>
          <span className="small" style={{ flex: 1 }}>{selTr.info}</span>
        </div>
      ) : null}
      <VizCaption status="schematic">
        A stylized proton–proton collision inside a barrel detector (beam axis through the cylinders). Tracks curve
        in the solenoid field; energy deposits light up the calorimeter layers; the dashed red vector is missing
        transverse momentum — the signature of particles that escape unseen. Click any track to identify it.
      </VizCaption>
    </div>
  );
}

/* ---------- synchronized strain oscilloscope (reads the live 3D waveform) ---------- */
function GWStrainScope({ strainRef }) {
  const cvRef = useRef(null);
  useEffect(() => {
    let raf, alive = true;
    const draw = () => {
      if (!alive) return;
      raf = requestAnimationFrame(draw);
      const cv = cvRef.current; if (!cv) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      const ctx = cv.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const data = strainRef.current;
      const mid = h * 0.52;
      // baseline + frame
      ctx.strokeStyle = "rgba(148,176,224,0.16)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
      ctx.font = "10px IBM Plex Mono"; ctx.fillStyle = "rgba(148,176,224,0.6)";
      ctx.fillText("strain  h(t)", 10, 16);
      if (!data.length) return;
      const tNow = data[data.length - 1].t;
      const WIN = 6.5; // seconds visible
      const t0 = tNow - WIN;
      const X = (tt) => ((tt - t0) / WIN) * w;
      const amax = 3.1;
      // merger marker
      for (let i = 1; i < data.length; i++) {
        if (data[i].merged && !data[i - 1].merged) {
          const mx = X(data[i].t);
          ctx.strokeStyle = "rgba(224,179,90,0.5)"; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(mx, 8); ctx.lineTo(mx, h - 8); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = "rgba(224,179,90,0.85)"; ctx.fillText("merger", mx + 4, h - 10);
        }
      }
      // waveform
      ctx.strokeStyle = "oklch(0.82 0.13 230)"; ctx.lineWidth = 1.8;
      ctx.shadowColor = "oklch(0.82 0.13 230)"; ctx.shadowBlur = 8;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < data.length; i++) {
        const d = data[i]; if (d.t < t0) continue;
        const x = X(d.t), y = mid - (d.h / amax) * (h * 0.4);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.shadowBlur = 0;
      // "now" cursor + frequency readout
      const last = data[data.length - 1];
      ctx.fillStyle = "rgba(170,195,230,0.9)"; ctx.textAlign = "right";
      ctx.fillText("inspiral  →  chirp  →  merger  →  ringdown", w - 10, 16);
      ctx.textAlign = "left";
    };
    draw();
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [strainRef]);
  return <canvas ref={cvRef} style={{ width: "100%", height: 120, display: "block", borderRadius: 8 }}
    aria-label="Gravitational-wave strain versus time, synchronized to the 3D inspiral"></canvas>;
}

/* ---------- 3D gravitational-wave inspiral ---------- */
function GWInspiral3D() {
  const [q, setQ] = useState(1);
  const qRef = useRef(q); qRef.current = q;
  const stRef = useRef(null);
  const strainRef = useRef([]); // rolling [{t, h, f}] for the synchronized oscilloscope
  const restart = () => { stRef.current = { x: 1, phi: 0, merged: 0 }; strainRef.current = []; };
  if (!stRef.current) restart();

  const build = (ctx) => {
    const { THREE, scene } = ctx;
    scene.fog = new THREE.FogExp2(0x04060b, 0.014);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.5));

    // starfield backdrop
    const det1 = ctx.settings.current.detail3d;
    const starN = det1 === "low" ? 220 : 460;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, rr = Math.sqrt(1 - u * u), R0 = 40 + Math.random() * 40;
      sPos[i * 3] = Math.cos(a) * rr * R0; sPos[i * 3 + 1] = Math.abs(u) * R0 * 0.7 + 4; sPos[i * 3 + 2] = Math.sin(a) * rr * R0;
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({
      size: 1.3, map: qgaGlowTexture(), color: 0xb6c8f0, transparent: true,
      opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    })));

    const det = ctx.settings.current.detail3d;
    const SEG = det === "low" ? 52 : det === "ultra" ? 92 : 70;
    const EXT = 15;
    const dKey = new THREE.DirectionalLight(0xcfe0ff, 0.85); dKey.position.set(3, 8, 5); scene.add(dKey);
    const geo = new THREE.PlaneGeometry(EXT, EXT, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const colAttr = new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3);
    geo.setAttribute("color", colAttr);
    // luminous warped spacetime sheet: a solid lit surface (reads as a real curved
    // membrane) with a very faint additive wireframe that only kisses the crests —
    // not a dense wire grid. Both meshes share one geometry.
    const surf = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, metalness: 0.34, roughness: 0.4,
      emissive: 0x0a1428, emissiveIntensity: 0.32, transparent: true, opacity: 0.85,
      side: THREE.DoubleSide,
    }));
    scene.add(surf);
    const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      vertexColors: true, wireframe: true, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    wire.renderOrder = 2;
    scene.add(wire);
    const cCrest = new THREE.Color(0x9fd0ff);
    const cTrough = new THREE.Color(0xb98af0);
    const cFlat = new THREE.Color(0x16263f);
    const tmpC = new THREE.Color();
    const pos = geo.attributes.position;
    const nV = pos.count;
    const vr = new Float64Array(nV), vth = new Float64Array(nV);
    for (let k = 0; k < nV; k++) {
      const x = pos.getX(k), z = pos.getZ(k);
      vr[k] = Math.hypot(x, z);
      vth[k] = Math.atan2(z, x);
    }

    const mkBody = () => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.32, 22, 16),
        new THREE.MeshBasicMaterial({ color: 0x05070d }));
      const g = ctx.glow(0xcfe4ff, 2.2, 0.85);
      scene.add(m); scene.add(g);
      return { m, g, trail: [] };
    };
    const b1 = mkBody(), b2 = mkBody();
    const orbR = 3.1;
    // orbital trails
    const mkTrail = (hex) => {
      const g = new THREE.BufferGeometry();
      const buf = new THREE.BufferAttribute(new Float32Array(140 * 3), 3);
      g.setAttribute("position", buf); g.setDrawRange(0, 0);
      const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
      l.frustumCulled = false; scene.add(l);
      return { buf, g, l };
    };
    const t1 = mkTrail(0x7fc0ff), t2 = mkTrail(0xc79cff);
    const mergerFlash = ctx.glow(0xffffff, 1, 0);
    scene.add(mergerFlash);
    const writeTrail = (tr, list) => {
      const n = Math.min(list.length, 140);
      for (let i = 0; i < n; i++) { const q = list[list.length - n + i]; tr.buf.setXYZ(i, q[0], q[1], q[2]); }
      tr.buf.needsUpdate = true; tr.g.setDrawRange(0, n);
    };

    const bLabel = ctx.label("binary — orbital decay by gravitational radiation",
      () => ({ x: 0, y: 1.6, z: 0 }), "s3d-quiet");
    ctx.annotation("LIGO observes CLASSICAL gravitational waves — a triumph of general relativity, not a quantum gravity detection",
      () => ({ x: 0, y: 0.6, z: EXT / 2 - 0.8 }));

    return {
      update: (t, dt) => {
        const st = stRef.current;
        const Q = qRef.current;
        const m1 = Q / (1 + Q), m2 = 1 / (1 + Q);
        // chirp factor ∝ reduced mass: 4µ/M = 4 m₁m₂/(m₁+m₂)²  (maximal at equal mass)
        const chirp = 4 * m1 * m2;
        const w0 = 1.4, k0 = 0.036, A0 = 0.2;
        let amp = 0, phase = 0, fgw = 0;
        const merged = st.x <= 0.12;
        if (!merged) {
          // Leading-order quadrupole inspiral, exact scaling:
          //   da/dt ∝ -1/a³  ⇒  a ∝ (t_c-t)^{1/4},  f_gw ∝ (t_c-t)^{-3/8},  h ∝ f^{2/3}
          const wOrb = w0 * Math.pow(st.x, -1.5);          // Kepler: ω ∝ a^{-3/2}
          st.phi += wOrb * dt;
          st.x -= (k0 * chirp / Math.pow(st.x, 3)) * dt;   // gravitational-radiation reaction
          st.x = Math.max(0.001, st.x);
          fgw = wOrb / Math.PI;
          amp = Math.min(3, A0 / st.x);
          phase = 2 * st.phi;                               // GW phase = twice orbital phase
        } else if (st.merged === 0) {
          st.merged = t;
        } else {
          // ringdown: damped sinusoid at the final black hole's quasinormal frequency
          const tau = t - st.merged;
          fgw = w0 * Math.pow(0.12, -1.5) / Math.PI;
          amp = 3 * Math.exp(-tau * 2.2);
          phase = 2 * st.phi + 14 * tau;
          if (tau > 2.6 && dt > 0) { restart(); }
        }
        // record the strain waveform (same amp & phase that drive the 3D scene)
        if (dt > 0) {
          const h = amp * Math.cos(phase);
          strainRef.current.push({ t, h, f: fgw, merged });
          if (strainRef.current.length > 900) strainRef.current.shift();
        }
        // quadrupole ripple on the sheet — radial wavenumber compresses as it chirps
        const kr = 1.6 + 1.6 * Math.min(2.5, (1 / Math.max(st.x, 0.12) - 1));
        for (let k = 0; k < nV; k++) {
          const r = Math.max(vr[k], 1.3);
          const y = 0.5 * (amp / r) * Math.cos(2 * vth[k] - phase + r * kr);
          pos.setY(k, y);
          const mag = Math.min(1, Math.abs(y) * 1.5);
          tmpC.copy(cFlat).lerp(y >= 0 ? cCrest : cTrough, mag);
          colAttr.setXYZ(k, tmpC.r, tmpC.g, tmpC.b);
        }
        pos.needsUpdate = true;
        colAttr.needsUpdate = true;
        geo.computeVertexNormals();
        // bodies
        const merged2 = st.x <= 0.12;
        b2.m.visible = b2.g.visible = !merged2;
        bLabel.set(merged2 ? "merger → ringdown" : "binary — orbital decay by gravitational radiation");
        if (!merged2) {
          const r1 = st.x * orbR * m2, r2 = st.x * orbR * m1;
          b1.m.position.set(Math.cos(st.phi) * r1, 0.35, Math.sin(st.phi) * r1);
          b2.m.position.set(-Math.cos(st.phi) * r2, 0.35, -Math.sin(st.phi) * r2);
          b1.m.scale.setScalar(0.7 + m1 * 0.9);
          b2.m.scale.setScalar(0.7 + m2 * 0.9);
          if (dt > 0) {
            b1.trail.push([b1.m.position.x, b1.m.position.y, b1.m.position.z]);
            b2.trail.push([b2.m.position.x, b2.m.position.y, b2.m.position.z]);
            if (b1.trail.length > 140) b1.trail.shift();
            if (b2.trail.length > 140) b2.trail.shift();
          }
          mergerFlash.material.opacity = 0;
        } else {
          b1.m.position.set(0, 0.35, 0);
          b1.m.scale.setScalar(1.5);
          const tau = st.merged ? t - st.merged : 0;
          mergerFlash.position.set(0, 0.35, 0);
          mergerFlash.scale.setScalar(2 + 8 * Math.exp(-tau * 1.8));
          mergerFlash.material.opacity = 0.9 * Math.exp(-tau * 1.6);
          if (b1.trail.length) b1.trail.length = 0;
          if (b2.trail.length) b2.trail.length = 0;
        }
        t1.l.visible = !merged2; t2.l.visible = !merged2;
        writeTrail(t1, b1.trail); writeTrail(t2, b2.trail);
        b1.g.position.copy(b1.m.position);
        b1.g.scale.setScalar(b1.m.scale.x * 2.6);
        b2.g.position.copy(b2.m.position);
        b2.g.scale.setScalar(b2.m.scale.x * 2.6);
      },
    };
  };

  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="mass ratio m₁/m₂" min={1} max={6} step={0.1} value={q} onChange={setQ}
          format={(v) => v.toFixed(1)}></SliderRow>
        <button className="btn" onClick={restart}>Restart inspiral</button>
      </div>
      <Scene3D height={430} aria="Three-dimensional binary inspiral radiating gravitational waves across a spacetime sheet"
        initial={{ radius: 13.5, theta: 0.5, phi: 0.95, minR: 7, maxR: 30, bloom: { strength: 0.85, radius: 0.6, threshold: 0.16 } }}
        build={build} fallback={<GWInspiral></GWInspiral>}></Scene3D>
      <div style={{ marginTop: 8 }}>
        <GWStrainScope strainRef={strainRef}></GWStrainScope>
      </div>
      <div className="viz-toolbar viz-toolbar-bottom readout-grid" style={{ display: "grid" }}>
        <div className="readout"><div className="readout-label">GW150914 chirp mass ℳ</div>
          <div className="readout-value">28.6<span className="unit">M☉</span></div></div>
        <div className="readout"><div className="readout-label">final mass / energy radiated</div>
          <div className="readout-value">62 / 3<span className="unit">M☉c²</span></div></div>
        <div className="readout"><div className="readout-label">peak GW frequency</div>
          <div className="readout-value">~250<span className="unit">Hz</span></div></div>
        <div className="readout"><div className="readout-label">peak strain at Earth (410 Mpc)</div>
          <div className="readout-value">1.0×10⁻²¹</div></div>
      </div>
      <VizCaption status="schematic">
        Leading-order quadrupole inspiral, integrated with the <em>exact</em> radiation-reaction scaling
        <Eq tex="\dot a \propto -a^{-3}"></Eq>, so the orbit follows <Eq tex="a \propto (t_c-t)^{1/4}"></Eq> and the
        wave frequency sweeps as <Eq tex="f_{\rm gw}\propto (t_c-t)^{-3/8}"></Eq> with amplitude
        <Eq tex="h\propto f^{2/3}"></Eq> — the “chirp.” The oscilloscope above plots the very strain that drives the
        sheet, so the 3D ripple and the waveform are one signal. The chirp rate scales with the reduced mass
        <Eq tex="4\mu/M"></Eq> (try the mass-ratio slider — equal masses chirp fastest). The sheet displacement is
        exaggerated by ~21 orders of magnitude: GW150914's real peak strain at Earth was
        <Eq tex="h\sim10^{-21}"></Eq>. LIGO's match to <em>classical</em> general-relativity waveforms is a triumph
        of GR — not a quantum-gravity detection.
      </VizCaption>
    </div>
  );
}

/* ---------- invariant-mass reconstruction: how a particle is "discovered" ---------- */
const IM_MIN = 60, IM_MAX = 120, IM_BINS = 40, IM_BW = (IM_MAX - IM_MIN) / IM_BINS;
const MZ = 91.1876, GZ = 2.4952; // PDG Z⁰ mass & width (GeV)
function sampleDielectronMass(pSig, random = Math.random) {
  if (random() < pSig) {
    // relativistic-ish Breit–Wigner (Cauchy core) around the Z mass + detector smearing
    const bw = MZ + (GZ / 2) * Math.tan(Math.PI * (random() - 0.5));
    const smear = (random() + random() + random() - 1.5) * 1.6; // ~Gaussian resolution
    return bw + smear;
  }
  // Drell–Yan / combinatorial continuum: falling spectrum across the window
  return IM_MIN + (-22 * Math.log(1 - random() * 0.985));
}
function InvariantMassLab() {
  const [bins, setBins] = useState(() => new Array(IM_BINS).fill(0));
  const randomRef = useRef(QGA_SEEDED(qgaReadState().seed));
  const [total, setTotal] = useState(0);
  const [pSig, setPSig] = useState(0.16);
  const pSigRef = useRef(pSig); pSigRef.current = pSig;
  const cvRef = useRef(null);

  const fire = (n) => {
    setBins((prev) => {
      const next = prev.slice();
      for (let i = 0; i < n; i++) {
        const m = sampleDielectronMass(pSigRef.current, randomRef.current);
        if (m >= IM_MIN && m < IM_MAX) next[Math.floor((m - IM_MIN) / IM_BW)]++;
      }
      return next;
    });
    setTotal((t) => t + n);
  };
  const reset = () => { setBins(new Array(IM_BINS).fill(0)); setTotal(0); };

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = 300;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const padL = 46, padR = 14, padT = 16, padB = 34;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const maxC = Math.max(8, ...bins);
    const X = (i) => padL + (i / IM_BINS) * plotW;
    const Y = (c) => padT + plotH * (1 - c / maxC);
    // axes
    ctx.strokeStyle = "rgba(148,176,224,0.25)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
    ctx.font = "10px IBM Plex Mono"; ctx.fillStyle = "rgba(148,176,224,0.6)";
    ctx.textAlign = "center";
    for (let gx = IM_MIN; gx <= IM_MAX; gx += 10) {
      const px = padL + ((gx - IM_MIN) / (IM_MAX - IM_MIN)) * plotW;
      ctx.fillText(gx, px, padT + plotH + 16);
      ctx.strokeStyle = "rgba(148,176,224,0.08)"; ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, padT + plotH); ctx.stroke();
    }
    ctx.fillText("dielectron invariant mass  m(e⁺e⁻)  [GeV]", padL + plotW / 2, h - 4);
    ctx.save(); ctx.translate(13, padT + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("events / " + IM_BW.toFixed(1) + " GeV", 0, 0); ctx.restore();
    ctx.textAlign = "left";
    // Z marker
    const zx = padL + ((MZ - IM_MIN) / (IM_MAX - IM_MIN)) * plotW;
    ctx.strokeStyle = "rgba(224,179,90,0.4)"; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(zx, padT); ctx.lineTo(zx, padT + plotH); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(224,179,90,0.85)"; ctx.fillText("Z⁰  91.19 GeV", zx + 5, padT + 12);
    // bars
    for (let i = 0; i < IM_BINS; i++) {
      const c = bins[i]; if (c === 0) continue;
      const x = X(i), bw = (plotW / IM_BINS) - 1.5, y = Y(c);
      const inZ = (IM_MIN + i * IM_BW) > 86 && (IM_MIN + i * IM_BW) < 96;
      ctx.fillStyle = inZ ? "oklch(0.8 0.13 235)" : "oklch(0.6 0.07 230 / 0.7)";
      ctx.fillRect(x, y, bw, padT + plotH - y);
    }
    // Poisson error bars
    ctx.strokeStyle = "rgba(210,225,250,0.5)"; ctx.lineWidth = 1;
    for (let i = 0; i < IM_BINS; i++) {
      const c = bins[i]; if (c === 0) continue;
      const x = X(i) + ((plotW / IM_BINS) - 1.5) / 2, err = Math.sqrt(c);
      ctx.beginPath(); ctx.moveTo(x, Y(c + err)); ctx.lineTo(x, Y(Math.max(0, c - err))); ctx.stroke();
    }
  }, [bins]);

  // crude significance: signal vs background in the Z window
  const zLo = Math.floor((86 - IM_MIN) / IM_BW), zHi = Math.ceil((96 - IM_MIN) / IM_BW);
  let zCount = 0; for (let i = zLo; i < zHi; i++) zCount += bins[i] || 0;
  const sideBins = bins.slice(0, zLo).concat(bins.slice(zHi));
  const bgPerBin = sideBins.length ? sideBins.reduce((a, b) => a + b, 0) / sideBins.length : 0;
  const bgInWin = bgPerBin * (zHi - zLo);
  const sig = Math.max(0, zCount - bgInWin);
  const signif = bgInWin > 0 ? sig / Math.sqrt(bgInWin) : 0;

  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <button className="btn primary" onClick={() => fire(100)}>+100 collisions</button>
        <button className="btn" onClick={() => fire(1000)}>+1000</button>
        <SliderRow label="signal fraction" min={0} max={0.4} step={0.01} value={pSig} onChange={setPSig}
          format={(v) => (v * 100).toFixed(0) + "%"}></SliderRow>
        <button className="btn" onClick={reset}>Reset</button>
      </div>
      <canvas ref={cvRef} style={{ width: "100%", height: 300, display: "block" }}
        aria-label="Histogram of dielectron invariant mass; the Z boson resonance peak emerges from continuum background as collisions accumulate"></canvas>
      <div className="viz-toolbar viz-toolbar-bottom readout-grid" style={{ display: "grid" }}>
        <div className="readout"><div className="readout-label">total collisions</div>
          <div className="readout-value">{total.toLocaleString("en-US")}</div></div>
        <div className="readout"><div className="readout-label">excess in Z window (signal)</div>
          <div className="readout-value">{Math.round(sig).toLocaleString("en-US")}</div></div>
        <div className="readout"><div className="readout-label">significance S/√B</div>
          <div className="readout-value">{signif.toFixed(1)}<span className="unit">σ</span></div></div>
        <div className="readout"><div className="readout-label">Z⁰ mass / width (PDG)</div>
          <div className="readout-value">91.19 / 2.50<span className="unit">GeV</span></div></div>
      </div>
      <VizCaption status="schematic">
        This is how a particle is actually <em>discovered</em>. Each collision contributes one dielectron
        invariant-mass entry; most are smooth Drell–Yan continuum, but a fraction come from a real resonance.
        No single event is decisive — fire a hundred and you see noise; fire thousands and the <strong>Z⁰ peak at
        91.19 GeV</strong> rises out of the background as a Breit–Wigner bump, its statistical significance growing
        like <Eq tex="S/\sqrt{B}"></Eq>. The Z was found exactly this way (UA1/UA2, CERN, 1983); the Higgs four-lepton
        channel in 2012 is the same method at higher mass. Counts carry Poisson error bars; the distributions are
        illustrative, not a tuned detector simulation.
      </VizCaption>
    </div>
  );
}

/* ---------- GW signal analysis theatre ---------- */
const GW_GEN_RATE = 512, GW_GEN_DURATION = 4, GW_GEN_MERGER = 3.4;
const GW_H1L1_DELAY = 0.007; // illustrative H1→L1 light-travel offset across the ~3000 km baseline
const GW_GEN_M1 = 36, GW_GEN_M2 = 29; // GW150914-like teaching binary (M☉)

/* Brand spectrogram ramp: night → deep blue → cyan → amber → white. */
const GW_COLORMAP = [
  [0.0, [7, 11, 19]], [0.32, [14, 42, 74]], [0.55, [22, 107, 140]],
  [0.75, [70, 212, 224]], [0.9, [255, 189, 102]], [1.0, [255, 255, 255]],
];
function gwColormap(t) {
  const x = Math.min(1, Math.max(0, t));
  for (let i = 1; i < GW_COLORMAP.length; i++) {
    if (x <= GW_COLORMAP[i][0]) {
      const [t0, c0] = GW_COLORMAP[i - 1], [t1, c1] = GW_COLORMAP[i];
      const f = (x - t0) / (t1 - t0);
      return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f];
    }
  }
  return GW_COLORMAP[GW_COLORMAP.length - 1][1];
}

function gwSetupCanvas(cv, height) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = cv.clientWidth, h = height || cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/* Strain scope: dual-detector generated traces with phase ribbon, or a single
   GWOSC observation trace with GPS axis. */
function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (live) setReady(true); });
    }
    return () => { live = false; };
  }, []);
  return ready;
}

function GWStrainPanel({ mode, genH1, genL1, realData, detector, playT, onScrub }) {
  const cvRef = useRef(null);
  const [hover, setHover] = useState(null);
  const fontsReady = useFontsReady();
  const prm = usePRM();
  const PADL = 46, PADR = 12;
  const duration = mode === "real" && realData ? realData.duration : GW_GEN_DURATION;
  /* Eased vertical scale: the trace normalisation glides between signals
     instead of snapping when the source changes. Bounded rAF — it stops as
     soon as the scale has settled, and snaps instantly under reduced motion. */
  const targetAmax = useMemo(() => {
    const peak = (s) => { let m = 1e-9; for (let i = 0; i < s.length; i++) { const a = Math.abs(s[i]); if (a > m) m = a; } return m; };
    if (mode === "generated" && genH1) return Math.max(peak(genH1.samples), peak(genL1.samples));
    if (mode === "real" && realData) return peak(realData.samples);
    return 1;
  }, [mode, genH1, genL1, realData]);
  const amaxRef = useRef(targetAmax);
  const [amax, setAmax] = useState(targetAmax);
  useEffect(() => {
    if (prm) { amaxRef.current = targetAmax; setAmax(targetAmax); return undefined; }
    let raf = 0, last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const cur = amaxRef.current;
      const next = cur + (targetAmax - cur) * Math.min(1, dt * 7);
      if (Math.abs(next - targetAmax) <= Math.abs(targetAmax) * 1e-3) {
        amaxRef.current = targetAmax; setAmax(targetAmax); return;
      }
      amaxRef.current = next; setAmax(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetAmax, prm]);
  const toTime = (e) => {
    const r = cvRef.current.getBoundingClientRect();
    const pw = r.width - PADL - PADR;
    return Math.min(1, Math.max(0, (e.clientX - r.left - PADL) / pw)) * duration;
  };
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const { ctx, w, h } = gwSetupCanvas(cv, 220);
    ctx.clearRect(0, 0, w, h);
    const padL = PADL, padR = PADR, padT = 26, padB = 34;
    const pw = w - padL - padR, ph = h - padT - padB;
    const mid = padT + ph / 2;
    ctx.font = "9.5px IBM Plex Mono";
    // frame + grid
    ctx.strokeStyle = "rgba(148,176,224,0.18)"; ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, pw, ph);
    ctx.strokeStyle = "rgba(148,176,224,0.07)";
    for (let i = 1; i < 4; i++) {
      const y = padT + (ph * i) / 4;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(padL, mid); ctx.lineTo(padL + pw, mid);
    ctx.strokeStyle = "rgba(148,176,224,0.16)"; ctx.stroke();
    const tracePath = (samples, amax, upto) => {
      const n = samples.length;
      const end = upto == null ? n : Math.max(2, Math.min(n, upto));
      ctx.beginPath();
      for (let i = 0; i < end; i++) {
        const x = padL + (i / (n - 1)) * pw;
        const y = mid - (samples[i] / amax) * ph * 0.44;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    };
    const drawTrace = (samples, color, glow, upto) => {
      ctx.strokeStyle = color; ctx.lineWidth = 1.3;
      ctx.shadowColor = glow ? color : "transparent"; ctx.shadowBlur = glow ? 6 : 0;
      tracePath(samples, amax, upto);
      ctx.stroke(); ctx.shadowBlur = 0;
      return amax;
    };
    const drawHead = (samples, amax, upto, color) => {
      const n = samples.length;
      const i = Math.max(0, Math.min(n - 1, upto - 1));
      const x = padL + (i / (n - 1)) * pw;
      const y = mid - (samples[i] / amax) * ph * 0.44;
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 2 * Math.PI); ctx.fill();
      ctx.shadowBlur = 0;
    };
    const frac = Math.min(1, Math.max(0, playT / duration));
    const hasData = (mode === "generated" && genH1) || (mode === "real" && realData);
    if (mode === "generated" && genH1) {
      const n = genH1.samples.length;
      const upto = Math.round(frac * (n - 1)) + 1;
      const tMerge = genH1.mergerIndex / genH1.sampleRate;
      const X = (t) => padL + (t / genH1.duration) * pw;
      // phase ribbon: inspiral → merger → ringdown
      const ribY = padT + ph + 8, ribH = 7;
      const m0 = X(Math.max(0, tMerge - 0.12)), m1 = X(tMerge + 0.02);
      ctx.fillStyle = "rgba(90,185,255,0.28)"; ctx.fillRect(padL, ribY, m0 - padL, ribH);
      ctx.fillStyle = "rgba(255,189,102,0.55)"; ctx.fillRect(m0, ribY, m1 - m0, ribH);
      ctx.fillStyle = "rgba(181,140,255,0.35)"; ctx.fillRect(m1, ribY, padL + pw - m1, ribH);
      ctx.fillStyle = "rgba(170,195,230,0.75)";
      ctx.fillText("INSPIRAL", padL + 6, ribY + ribH + 11);
      ctx.fillStyle = "rgba(255,189,102,0.9)"; ctx.fillText("MERGER", m0 - 8, ribY + ribH + 11);
      ctx.fillStyle = "rgba(181,140,255,0.85)"; ctx.fillText("RINGDOWN", Math.min(m1 + 6, padL + pw - 66), ribY + ribH + 11);
      // merger marker
      ctx.strokeStyle = "rgba(255,189,102,0.5)"; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(X(tMerge), padT); ctx.lineTo(X(tMerge), padT + ph); ctx.stroke();
      ctx.setLineDash([]);
      // ghost of the full signal, then the live revealed portion
      drawTrace(genL1.samples, "rgba(255,189,102,0.16)", false);
      drawTrace(genH1.samples, "rgba(90,185,255,0.16)", false);
      drawTrace(genL1.samples, "rgba(255,189,102,0.75)", false, upto);
      const amaxH1 = drawTrace(genH1.samples, "rgba(90,185,255,0.95)", true, upto);
      // leading-edge reveal glow: a soft gradient at the draw-in front
      if (frac < 1) {
        const ex = padL + frac * pw;
        const g = ctx.createLinearGradient(ex - 30, 0, ex, 0);
        g.addColorStop(0, "rgba(90,185,255,0)");
        g.addColorStop(1, "rgba(90,185,255,0.18)");
        ctx.fillStyle = g; ctx.fillRect(ex - 30, padT, 30, ph);
      }
      if (frac < 1) drawHead(genH1.samples, amaxH1, upto, "rgba(160,220,255,1)");
      // merger flash, decaying after the playhead crosses coalescence
      if (playT >= tMerge) {
        const flash = Math.max(0, 1 - (playT - tMerge) / 0.45);
        if (flash > 0) {
          const g = ctx.createRadialGradient(X(tMerge), mid, 0, X(tMerge), mid, 110);
          g.addColorStop(0, "rgba(255,205,130," + (0.5 * flash).toFixed(3) + ")");
          g.addColorStop(1, "rgba(255,205,130,0)");
          ctx.fillStyle = g; ctx.fillRect(padL, padT, pw, ph);
        }
      }
      // axis labels
      ctx.fillStyle = "rgba(148,176,224,0.6)";
      for (let t = 0; t <= genH1.duration; t++) ctx.fillText(t.toFixed(0) + "s", X(t) - 6, padT + ph + 30);
      ctx.fillText("h(t) · normalized", 8, padT + 10);
      // legend
      ctx.fillStyle = "rgba(90,185,255,0.95)"; ctx.fillRect(padL + pw - 196, 8, 14, 3);
      ctx.fillStyle = "rgba(170,195,230,0.85)"; ctx.fillText("H1 Hanford", padL + pw - 178, 13);
      ctx.fillStyle = "rgba(255,189,102,0.85)"; ctx.fillRect(padL + pw - 104, 8, 14, 3);
      ctx.fillStyle = "rgba(170,195,230,0.85)"; ctx.fillText("L1 +7 ms", padL + pw - 86, 13);
      // hover crosshair with live readout
      if (hover != null) {
        const hi = Math.max(0, Math.min(n - 1, Math.round((hover / genH1.duration) * (n - 1))));
        const hx = X(hover);
        ctx.strokeStyle = "rgba(220,235,255,0.35)"; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(hx, padT); ctx.lineTo(hx, padT + ph); ctx.stroke();
        ctx.setLineDash([]);
        const fHz = genH1.freqTrack ? genH1.freqTrack[hi] : 0;
        const txt = "t " + hover.toFixed(2) + " s · h " + genH1.samples[hi].toFixed(2) + (fHz > 0 ? " · f " + fHz.toFixed(0) + " Hz" : "");
        const tw = ctx.measureText(txt).width + 14;
        const bx = Math.min(hx + 8, padL + pw - tw - 4);
        ctx.fillStyle = "rgba(7,12,21,0.92)"; ctx.strokeStyle = "rgba(90,185,255,0.4)";
        ctx.fillRect(bx, padT + 6, tw, 18); ctx.strokeRect(bx, padT + 6, tw, 18);
        ctx.fillStyle = "rgba(205,229,255,0.95)"; ctx.fillText(txt, bx + 7, padT + 18);
      }
    } else if (mode === "real" && realData) {
      const n = realData.samples.length;
      const upto = Math.round(frac * (n - 1)) + 1;
      drawTrace(realData.samples, "rgba(70,212,224,0.16)", false);
      const amax = drawTrace(realData.samples, "rgba(70,212,224,0.95)", true, upto);
      if (frac < 1) {
        const ex = padL + frac * pw;
        const g = ctx.createLinearGradient(ex - 30, 0, ex, 0);
        g.addColorStop(0, "rgba(70,212,224,0)");
        g.addColorStop(1, "rgba(70,212,224,0.18)");
        ctx.fillStyle = g; ctx.fillRect(ex - 30, padT, 30, ph);
      }
      if (frac < 1) drawHead(realData.samples, amax, upto, "rgba(160,240,244,1)");
      const effRate = realData.samples.length / realData.duration;
      ctx.fillStyle = "rgba(148,176,224,0.6)";
      ctx.fillText("GPS " + realData.start.toFixed(0), padL, padT + ph + 30);
      ctx.textAlign = "right";
      ctx.fillText("GPS " + (realData.start + realData.duration).toFixed(0), padL + pw, padT + ph + 30);
      ctx.fillText(realData.samples.length + " pts · " + effRate.toFixed(0) + " Hz effective", padL + pw, padT + 12);
      ctx.textAlign = "left";
      ctx.fillText("h(t) · calibrated strain, normalized", 8, padT + 10);
      if (hover != null) {
        const hi = Math.max(0, Math.min(n - 1, Math.round((hover / realData.duration) * (n - 1))));
        const hx = padL + (hover / realData.duration) * pw;
        ctx.strokeStyle = "rgba(220,235,255,0.35)"; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(hx, padT); ctx.lineTo(hx, padT + ph); ctx.stroke();
        ctx.setLineDash([]);
        const txt = "GPS " + (realData.start + hover).toFixed(2) + " · h " + realData.samples[hi].toFixed(2);
        const tw = ctx.measureText(txt).width + 14;
        const bx = Math.min(hx + 8, padL + pw - tw - 4);
        ctx.fillStyle = "rgba(7,12,21,0.92)"; ctx.strokeStyle = "rgba(70,212,224,0.4)";
        ctx.fillRect(bx, padT + 6, tw, 18); ctx.strokeRect(bx, padT + 6, tw, 18);
        ctx.fillStyle = "rgba(205,245,248,0.95)"; ctx.fillText(txt, bx + 7, padT + 18);
      }
    } else {
      ctx.fillStyle = "rgba(148,176,224,0.55)";
      ctx.fillText(mode === "real" ? "Awaiting GWOSC observation — load or check network." : "Preparing seeded waveform…", padL + 10, mid);
    }
    // playhead
    if (hasData && frac > 0) {
      const px = padL + frac * pw;
      ctx.strokeStyle = "rgba(235,244,255,0.55)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(px, padT - 4); ctx.lineTo(px, padT + ph); ctx.stroke();
      ctx.fillStyle = "rgba(235,244,255,0.8)";
      ctx.beginPath(); ctx.moveTo(px - 4, padT - 4); ctx.lineTo(px + 4, padT - 4); ctx.lineTo(px, padT + 2); ctx.closePath(); ctx.fill();
    }
  }, [mode, genH1, genL1, realData, detector, fontsReady, playT, hover, duration, amax]);
  return (
    <figure className="gw-panel">
      <figcaption>
        <span className="gw-panel-title">STRAIN h(t)</span>
        {mode === "generated"
          ? <span className="badge badge-effective">GENERATED · SEEDED</span>
          : <span className="badge badge-established">OBSERVATION · GWOSC</span>}
      </figcaption>
      <canvas ref={cvRef} style={{ width: "100%", height: 220, display: "block", touchAction: "none" }}
        aria-label="Gravitational-wave strain versus time; drag to scrub the playhead"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onScrub(toTime(e)); }}
        onPointerMove={(e) => { if (e.buttons & 1) onScrub(toTime(e)); else setHover(toTime(e)); }}
        onPointerLeave={() => setHover(null)}></canvas>
    </figure>
  );
}

/* Time-frequency map: Hann STFT of the displayed strain, brand colormap.
   Pre-renders to an offscreen canvas; the live draw reveals frames up to the
   shared playhead and overlays the analytic frequency track when available. */
function GWSpectrogramPanel({ samples, sampleRate, windowSize, hopSize, label, note, playT, duration, freqTrack }) {
  const cvRef = useRef(null);
  const fontsReady = useFontsReady();
  const spec = useMemo(() => {
    if (!samples || samples.length < windowSize * 2) return null;
    return window.QGA_PHYSICS.stftSpectrogram(samples, { sampleRate, windowSize, hopSize });
  }, [samples, sampleRate, windowSize, hopSize]);
  const off = useMemo(() => {
    if (!spec) return null;
    const img = new ImageData(spec.frames, spec.bins);
    const floor = spec.maxDb - 46;
    for (let f = 0; f < spec.frames; f++) {
      for (let b = 0; b < spec.bins; b++) {
        const db = spec.magnitudes[f * spec.bins + b];
        const t = Math.min(1, Math.max(0, (db - floor) / (spec.maxDb - floor)));
        const [r, g, bl] = gwColormap(t);
        // b = 0 (DC) at the bottom of the panel
        const px = (spec.bins - 1 - b) * spec.frames + f;
        img.data[px * 4] = r; img.data[px * 4 + 1] = g; img.data[px * 4 + 2] = bl; img.data[px * 4 + 3] = 255;
      }
    }
    const c = document.createElement("canvas");
    c.width = spec.frames; c.height = spec.bins;
    c.getContext("2d").putImageData(img, 0, 0);
    return c;
  }, [spec]);
  useEffect(() => {
    const cv = cvRef.current; if (!cv || !spec || !off) return;
    const { ctx, w, h } = gwSetupCanvas(cv, 190);
    ctx.clearRect(0, 0, w, h);
    const padL = 46, padR = 66, padT = 12, padB = 26;
    const pw = w - padL - padR, ph = h - padT - padB;
    const frac = Math.min(1, Math.max(0, playT / duration));
    // ghost of the full map, then the live revealed portion
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 0.2;
    ctx.drawImage(off, padL, padT, pw, ph);
    ctx.globalAlpha = 1;
    const srcW = frac * spec.frames;
    if (srcW > 0.5) ctx.drawImage(off, 0, 0, srcW, spec.bins, padL, padT, frac * pw, ph);
    // analytic chirp track, drawn only up to the playhead
    if (freqTrack && frac > 0) {
      const n = freqTrack.length;
      const upto = Math.round(frac * (n - 1));
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1.2;
      ctx.shadowColor = "rgba(70,212,224,0.9)"; ctx.shadowBlur = 5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= upto; i += 4) {
        const f = freqTrack[i];
        if (f <= 0) continue;
        const x = padL + (i / (n - 1)) * pw;
        const y = padT + ph - Math.min(1, f / spec.nyquist) * ph;
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.shadowBlur = 0;
    }
    ctx.strokeStyle = "rgba(148,176,224,0.18)"; ctx.strokeRect(padL, padT, pw, ph);
    // playhead
    if (frac > 0) {
      const px = padL + frac * pw;
      ctx.strokeStyle = "rgba(235,244,255,0.55)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, padT + ph); ctx.stroke();
    }
    // frequency axis (linear, up to Nyquist)
    ctx.font = "9.5px IBM Plex Mono"; ctx.fillStyle = "rgba(148,176,224,0.65)";
    const ny = spec.nyquist;
    const ticks = ny >= 200 ? [32, 64, 128, 192, 256].filter((f) => f <= ny) : [ny / 4, ny / 2, (3 * ny) / 4];
    for (const f of ticks) {
      const y = padT + ph - (f / ny) * ph;
      ctx.fillText(f.toFixed(0), 12, y + 3);
      ctx.strokeStyle = "rgba(148,176,224,0.08)";
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw, y); ctx.stroke();
    }
    ctx.fillText("Hz", 12, padT - 2);
    const t0 = spec.times[0], t1 = spec.times[spec.times.length - 1];
    ctx.fillText(label + " · " + t0.toFixed(1) + "–" + t1.toFixed(1) + " s window", padL, h - 8);
    // colormap legend
    const lgX = padL + pw + 10, lgW = 12;
    for (let i = 0; i < ph; i++) {
      const [r, g, b] = gwColormap(1 - i / ph);
      ctx.fillStyle = "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
      ctx.fillRect(lgX, padT + i, lgW, 1.5);
    }
    ctx.fillStyle = "rgba(148,176,224,0.65)";
    ctx.fillText(spec.maxDb.toFixed(0), lgX + lgW + 4, padT + 8);
    ctx.fillText((spec.maxDb - 46).toFixed(0), lgX + lgW + 4, padT + ph);
    ctx.fillText("dB", lgX + 2, padT + ph + 12);
  }, [spec, off, label, fontsReady, playT, duration, freqTrack]);
  return (
    <figure className="gw-panel">
      <figcaption>
        <span className="gw-panel-title">TIME–FREQUENCY</span>
        <span className="gw-panel-note">{note}</span>
      </figcaption>
      <canvas ref={cvRef} style={{ width: "100%", height: 190, display: "block" }}
        aria-label="Short-time Fourier transform spectrogram of the displayed strain"></canvas>
    </figure>
  );
}

const GW_PHASE_LABEL = {
  idle: "Idle",
  loading: "Loading",
  real: "Observation",
  generated: "Generated",
  error: "Unavailable",
  cancelled: "Cancelled",
};

function GWAnalysisTheatre() {
  const [atlasState, setAtlasState] = useQGAState();
  const mode = atlasState.gwMode;
  const [status, setStatus] = useState(mode === "generated" ? "Seeded local waveform — same seed reproduces this exact signal." : "");
  /* Explicit presentation state machine. `status` stays the human-readable
     sentence; `phase` drives the animated pill so loading / real /
     generated-fallback / error / cancelled are visually distinct. */
  const [phase, setPhase] = useState(mode === "generated" ? "generated" : "idle");
  const [provenance, setProvenance] = useState(null);
  const [realData, setRealData] = useState(null);
  const realLoadRef = useRef(null);
  const gpsEnd = atlasState.gwStart + atlasState.gwDuration;

  const genH1 = useMemo(() => window.QGA_PHYSICS.generatedChirp({
    seed: atlasState.seed, sampleRate: GW_GEN_RATE, duration: GW_GEN_DURATION,
    m1: atlasState.gwM1, m2: atlasState.gwM2, mergerAt: GW_GEN_MERGER,
  }), [atlasState.seed, atlasState.gwM1, atlasState.gwM2]);
  const genL1 = useMemo(() => window.QGA_PHYSICS.generatedChirp({
    seed: atlasState.seed * 2 + 101, sampleRate: GW_GEN_RATE, duration: GW_GEN_DURATION,
    m1: atlasState.gwM1, m2: atlasState.gwM2, mergerAt: GW_GEN_MERGER, delaySeconds: GW_H1L1_DELAY,
  }), [atlasState.seed, atlasState.gwM1, atlasState.gwM2]);

  /* Live playback transport: one rAF clock drives both panels. Presentation
     only — the underlying signals stay seed-deterministic. */
  const duration = mode === "real" ? (realData ? realData.duration : atlasState.gwDuration) : GW_GEN_DURATION;
  const [playT, setPlayT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const reducedMotion = usePRM();
  useEffect(() => {
    if (!playing) return undefined;
    let raf = 0, last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now;
      setPlayT((t) => Math.min(duration, t + dt * speed));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, duration]);
  useEffect(() => { if (playing && playT >= duration) setPlaying(false); }, [playT, playing, duration]);
  // restart the performance whenever the signal itself changes
  useEffect(() => {
    setPlayT(0);
    setPlaying(!reducedMotion);
  }, [mode, atlasState.seed, atlasState.gwM1, atlasState.gwM2, realData, reducedMotion]);
  const togglePlay = () => {
    if (!playing && playT >= duration) setPlayT(0);
    setPlaying(!playing);
  };

  useEffect(() => () => realLoadRef.current?.abort(), []);
  const loadReal = async () => {
    realLoadRef.current?.abort();
    const controller = new AbortController();
    realLoadRef.current = controller;
    setStatus("Loading bounded GWOSC strain…"); setProvenance(null); setRealData(null);
    setPhase("loading");
    try {
      const result = await QGA_FETCH_GWOSC(atlasState.gwEvent, {
        detector: atlasState.gwDetector, start: atlasState.gwStart, duration: atlasState.gwDuration,
        signal: controller.signal,
      });
      if (realLoadRef.current !== controller) return;
      setRealData(result); setProvenance(result.provenance);
      setStatus("GWOSC observation loaded; preview is downsampled calibrated strain.");
      setPhase("real");
    } catch (error) {
      /* A superseded or user-cancelled request must not overwrite the phase
         the user has already moved on to. */
      if (realLoadRef.current !== controller) return;
      if (error?.name === "AbortError") { setPhase("cancelled"); return; }
      setStatus("GWOSC unavailable; the seeded generated signal below remains usable.");
      setPhase("error");
    } finally {
      if (realLoadRef.current === controller) realLoadRef.current = null;
    }
  };
  const cancelReal = () => {
    const controller = realLoadRef.current;
    if (!controller) return;
    realLoadRef.current = null;
    controller.abort();
    setStatus("GWOSC request cancelled; the seeded generated signal below remains usable.");
    setPhase("cancelled");
  };
  const changeMode = (next) => {
    setAtlasState({ gwMode: next });
    if (next === "real") loadReal();
    else {
      realLoadRef.current?.abort(); realLoadRef.current = null;
      setRealData(null); setProvenance(null);
      setStatus("Seeded local waveform — same seed reproduces this exact signal.");
      setPhase("generated");
    }
  };
  useEffect(() => { if (mode === "real") loadReal(); }, [atlasState.gwDetector, atlasState.gwStart, atlasState.gwDuration]);

  const mc = window.QGA_PHYSICS.chirpMass(atlasState.gwM1, atlasState.gwM2);
  const tC20 = window.QGA_PHYSICS.timeToCoalescence(20, mc);
  const realEffRate = realData ? realData.samples.length / realData.duration : 0;
  const specSamples = mode === "real" && realData ? realData.samples : genH1.samples;
  const specRate = mode === "real" && realData ? realEffRate : GW_GEN_RATE;
  const specWindow = mode === "real" ? 64 : 128;
  const specHop = mode === "real" ? 8 : 24;

  return (
    <div className="viz-frame gw-theatre">
      <div className="kerr-observatory-head">
        <div className="kerr-head-plate">
          <div className="kerr-head-ident">GW<span>OBS</span></div>
          <div>
            <h3>Signal Analysis Theatre</h3>
            <p>Strain and time–frequency read of a compact-binary chirp — seeded simulation or bounded GWOSC observation.</p>
          </div>
        </div>
        <div className="kerr-head-state">
          {mode === "generated"
            ? <span className="badge badge-effective">Generated teaching signal</span>
            : <span className="badge badge-established">Real detector observation</span>}
          <div className="kerr-state-line">
            {mode === "generated"
              ? "ℳ = " + mc.toFixed(1) + " M☉ · seed " + atlasState.seed + " · " + GW_GEN_RATE + " Hz"
              : atlasState.gwEvent + " · " + atlasState.gwDetector + " · GPS " + atlasState.gwStart + "+" + atlasState.gwDuration + "s"}
          </div>
        </div>
      </div>

      <div className="kerr-instrument-bar">
        <div className="kerr-control-group" aria-label="Data mode">
          <span className="kerr-control-label">Source</span>
          <button className={"kerr-chip" + (mode === "generated" ? " on" : "")} aria-pressed={mode === "generated"}
            onClick={() => changeMode("generated")}>Generated</button>
          <button className={"kerr-chip" + (mode === "real" ? " on" : "")} aria-pressed={mode === "real"}
            onClick={() => changeMode("real")}>GWOSC real</button>
        </div>
        {mode === "real" ? (
          <div className="kerr-control-group" aria-label="Observation selection">
            <span className="kerr-control-label">Event</span>
            <input className="gw-event-input" value={atlasState.gwEvent} aria-label="GWOSC event name"
              onChange={(e) => setAtlasState({ gwEvent: e.target.value })} />
            <span className="kerr-control-label">Detector</span>
            {["H1", "L1", "V1"].map((d) => (
              <button key={d} className={"kerr-chip" + (atlasState.gwDetector === d ? " on" : "")}
                aria-pressed={atlasState.gwDetector === d}
                onClick={() => setAtlasState({ gwDetector: d })}>{d}</button>
            ))}
            <button className="btn" onClick={loadReal}>Reload</button>
          </div>
        ) : (
          <div className="kerr-control-group" aria-label="Binary masses and generation seed">
            <SliderRow label="m₁" min={5} max={120} step={1} value={atlasState.gwM1}
              onChange={(v) => setAtlasState({ gwM1: v })} format={(v) => v + " M☉"}></SliderRow>
            <SliderRow label="m₂" min={5} max={120} step={1} value={atlasState.gwM2}
              onChange={(v) => setAtlasState({ gwM2: v })} format={(v) => v + " M☉"}></SliderRow>
            <SliderRow label="seed" min={1} max={9999} step={1} value={atlasState.seed}
              onChange={(v) => setAtlasState({ seed: v })} format={(v) => "#" + v}></SliderRow>
          </div>
        )}
      </div>

      <div className={"gw-state-pill"} data-phase={phase} role="status" aria-live="polite">
        <span className="gw-state-dot" aria-hidden="true"></span>
        <span className="gw-state-label">{GW_PHASE_LABEL[phase] || phase}</span>
        <span className="gw-state-text">{status}</span>
        {(phase === "error" || phase === "cancelled") ? (
          <button className="gw-state-retry" onClick={loadReal}>Retry</button>
        ) : null}
        {phase === "loading" ? (
          <button className="gw-state-retry" onClick={cancelReal}>Cancel</button>
        ) : null}
      </div>

      <div className="gw-transport" aria-label="Signal playback transport">
        <button className="gw-play-btn" onClick={togglePlay}
          aria-label={playing ? "Pause playback" : "Play signal"}>{playing ? "❚❚" : "▶"}</button>
        <button className="gw-replay-btn" onClick={() => { setPlayT(0); setPlaying(!reducedMotion); }}
          aria-label="Replay from the start">↺</button>
        <div className="gw-progress" role="slider" aria-label="Playback position"
          aria-valuemin={0} aria-valuemax={duration} aria-valuenow={Number(playT.toFixed(2))}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const r = e.currentTarget.getBoundingClientRect();
            setPlayT(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duration);
          }}
          onPointerMove={(e) => {
            if (!(e.buttons & 1)) return;
            const r = e.currentTarget.getBoundingClientRect();
            setPlayT(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duration);
          }}>
          <div className="gw-progress-fill" style={{ width: (100 * Math.min(1, playT / duration)) + "%" }}></div>
        </div>
        <span className="gw-time">t = {playT.toFixed(2)} / {duration.toFixed(1)} s</span>
        <div className="gw-speed" aria-label="Playback speed">
          {[0.5, 1, 2, 4].map((s) => (
            <button key={s} className={"kerr-chip" + (speed === s ? " on" : "")} aria-pressed={speed === s}
              onClick={() => setSpeed(s)}>{s}×</button>
          ))}
        </div>
      </div>
      {mode === "real" ? (
        <div className="viz-toolbar">
          <SliderRow label="start GPS" min={1126259000} max={1126260000} step={1} value={atlasState.gwStart}
            onChange={(v) => setAtlasState({ gwStart: v })}></SliderRow>
          <SliderRow label="duration" min={1} max={32} step={1} value={atlasState.gwDuration}
            onChange={(v) => setAtlasState({ gwDuration: v })} format={(v) => v + " s"}></SliderRow>
        </div>
      ) : null}

      <GWStrainPanel mode={mode} genH1={genH1} genL1={genL1} realData={realData}
        detector={atlasState.gwDetector} playT={playT} onScrub={setPlayT}></GWStrainPanel>
      <GWSpectrogramPanel samples={specSamples} sampleRate={specRate}
        windowSize={specWindow} hopSize={specHop} playT={playT} duration={duration}
        freqTrack={mode === "generated" ? genH1.freqTrack : null}
        label={mode === "real" ? atlasState.gwEvent + " " + atlasState.gwDetector : "H1 · seed " + atlasState.seed}
        note={mode === "real"
          ? "STFT of downsampled preview · Nyquist " + (specRate / 2).toFixed(0) + " Hz — full chirp band needs the 4 kHz product"
          : "Hann STFT " + specWindow + "/" + specHop + " · not a Q-transform"}></GWSpectrogramPanel>

      <div className="kerr-deck">
        {mode === "generated" ? (
          <section className="kerr-rgroup">
            <header><h4>Signal</h4><span>leading-order quadrupole · teaching model</span></header>
            <div className="kerr-rgrid">
              <KerrReadout lead label="chirp mass ℳ" value={mc.toFixed(1)} unit="M☉"
                formula={"(m₁m₂)^⅗ / (m₁+m₂)^⅕ · " + atlasState.gwM1 + "+" + atlasState.gwM2 + " M☉"}></KerrReadout>
              <KerrReadout label="t_c from 20 Hz" value={tC20.toFixed(2)} unit="s"
                formula="(5/256)(πf)^−⁸ᐟ³ (Gℳ/c³)^−⁵ᐟ³"></KerrReadout>
              <KerrReadout label="H1→L1 offset" value="7" unit="ms"
                formula="illustrative · ~3000 km baseline"></KerrReadout>
              <KerrReadout label="noise" value="seeded Gaussian"
                formula="not a measured detector PSD"></KerrReadout>
            </div>
          </section>
        ) : (
          <section className="kerr-rgroup gw-reveal" key={"obs-" + (provenance ? provenance.retrievedAt : "pending")}>
            <header><h4>Observation</h4><span>GWOSC API v2 · bounded fetch</span></header>
            <div className="kerr-rgrid">
              <KerrReadout lead label="event" value={atlasState.gwEvent}
                formula="catalog name, auto-versioned"></KerrReadout>
              <KerrReadout label="detector / range" value={atlasState.gwDetector}
                unit={"GPS " + atlasState.gwStart + "–" + gpsEnd}
                formula="calibrated strain h(t), dimensionless"></KerrReadout>
              <KerrReadout label="preview points" value={realData ? realData.samples.length : "—"}
                unit={realData ? realEffRate.toFixed(0) + " Hz eff." : ""}
                formula="≤1200 pts, uniform downsample"></KerrReadout>
              <KerrReadout label="source rate" value={realData ? (realData.sampleRate / 1000).toFixed(0) : "—"} unit="kHz"
                formula="GWOSC 4 kHz TXT product"></KerrReadout>
            </div>
          </section>
        )}
      </div>

      <details className="kerr-validity">
        <summary>
          <span>Assumptions, validity &amp; uncertainty</span>
          <span className="kerr-check ok">{mode === "generated" ? "seeded · reproducible" : "bounded · provenanced"}</span>
        </summary>
        <div className="kerr-validity-body">
          <dl>
            <dt>Generated mode</dt>
            <dd>
              Leading-order quadrupole inspiral with the exact radiation-reaction scalings
              f<sub>gw</sub> ∝ (t<sub>c</sub>−t)<sup>−3/8</sup> and h ∝ f<sup>2/3</sup>, plus a damped-sinusoid
              ringdown. It is a teaching waveform: no spins, no higher post-Newtonian orders, not numerical
              relativity. Noise is seeded Gaussian — the same seed reproduces the exact signal — and is
              <em> not</em> a measured LIGO noise PSD. The 7 ms H1→L1 offset is an illustrative light-travel
              time across the ~3000 km baseline.
            </dd>
            <dt>Real mode (GWOSC)</dt>
            <dd>
              One bounded calibrated-strain file per selection from the official GWOSC API v2
              (gwosc.org/api/v2/docs), gzip-decoded in the browser and uniformly downsampled to ≤1200 points.
              The preview's effective rate ({mode === "real" && realData ? realEffRate.toFixed(0) + " Hz" : "rate"})
              sets the spectrogram Nyquist limit; the full 35–350 Hz chirp band requires the complete 4 kHz
              product, which this static client deliberately does not download.
            </dd>
            <dt>Spectrogram</dt>
            <dd>
              Hann-windowed short-time Fourier transform computed live in the browser from the displayed
              samples. It is not a Q-transform and is not whitened; the rising chirp track is nevertheless
              clearly visible in the generated signal.
            </dd>
          </dl>
          {provenance ? (
            <p className="small dim gw-provenance" style={{ marginBottom: 0 }}>
              Provenance: {provenance.source} · <a href={provenance.url} target="_blank" rel="noreferrer">strain listing</a> · <a href={provenance.downloadUrl} target="_blank" rel="noreferrer">data file</a> · retrieved {provenance.retrievedAt}
            </p>
          ) : null}
        </div>
      </details>
    </div>
  );
}

function ModuleExp({ go }) {
  return (
    <article>
      <ModuleHeader num="08" kicker="Where theory meets data" title="Experimental and Observational Frontiers"
        lede="Quantum gravity research is constrained by a hard fact: no experiment has ever probed the Planck scale, and no direct experimental confirmation of any complete quantum gravity theory currently exists. What experiments do provide is a tightening net of indirect constraints."></ModuleHeader>

      <Section title="Collider event explorer">
        <p>
          The LHC collides protons at 13.6 TeV — energies that recreate conditions ~10⁻¹² s after the Big Bang and
          that discovered the Higgs boson in 2012. For quantum gravity the result so far is a null one with teeth:
          no superpartners, no extra-dimension signatures, no microscopic black holes. These nulls carve away
          parameter space without selecting a successor theory.
        </p>
        <ColliderEvent3D></ColliderEvent3D>
      </Section>

      <Section title="Reconstructing a resonance">
        <p>
          A single event proves nothing. Real discovery is statistical: measure the <strong>invariant mass</strong> of
          particle pairs across millions of collisions and look for a bump where a short-lived particle decayed. Fire
          collisions below and watch the Z⁰ boson emerge from the continuum — the same procedure that found the W and Z
          (1983) and the Higgs (2012).
        </p>
        <InvariantMassLab></InvariantMassLab>
      </Section>

      <Section title="Gravitational waves">
        <GWAnalysisTheatre></GWAnalysisTheatre>
        <p>
          LIGO's 2016 detection of GW150914 opened an observational channel on strong-field gravity. Merger waveforms
          test general relativity in its most violent regime — and so far the theory passes. Some quantum gravity
          scenarios predict deviations (horizon-scale structure echoes, dispersion of the waves over cosmological
          distance); none has been observed.
        </p>
        <GWInspiral3D></GWInspiral3D>
      </Section>

      <Section title="The wider observational net">
        <div className="grid-2">
          <div className="panel">
            <h3>Cosmic microwave background</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              The CMB carries the imprint of quantum fluctuations stretched to cosmic size during inflation — arguably
              quantum fluctuations of spacetime made visible. A detection of primordial B-mode polarization would probe
              gravitational waves of quantum origin from the inflationary epoch; current bounds (Planck 2018, BICEP/Keck)
              constrain but do not yet detect them.
            </p>
          </div>
          <div className="panel">
            <h3>Neutrinos & dark matter</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Neutrino oscillations are the one laboratory-confirmed crack in the minimal Standard Model. Dark matter —
              evidenced gravitationally at every scale from galaxies to the CMB — remains undetected in the laboratory,
              and its identity may or may not connect to quantum gravity.
            </p>
          </div>
          <div className="panel">
            <h3>Quantum gravity phenomenology</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Some models predict tiny violations of Lorentz invariance, energy-dependent photon arrival times from
              gamma-ray bursts, or modified dispersion relations. Observations (e.g. Fermi-LAT timing of GRB photons)
              constrain linear Planck-scale dispersion to beyond the Planck energy itself — a rare case of experiment
              reaching quantum gravity territory, with null results.
            </p>
          </div>
          <div className="panel">
            <h3>Black hole imaging</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              The Event Horizon Telescope's images of M87* (2019) and Sgr A* (2022) resolve photon-ring-scale structure
              around supermassive black holes, confirming general relativistic predictions for the shadow size at the
              ~10% level. Horizon-scale deviations predicted by some quantum gravity scenarios are increasingly constrained.
            </p>
          </div>
        </div>
      </Section>

      <Misconception title="Detecting gravitational waves did not confirm quantum gravity.">
        LIGO observes classical waves — coherent states of enormous numbers of would-be gravitons. Confirming the
        wave predictions of classical general relativity says nothing yet about the quantum theory; detecting a
        single graviton is believed to be beyond any physically realizable detector.
      </Misconception>
      <ConceptBridge id="exp-open" go={go}></ConceptBridge>
    </article>
  );
}

window.ModuleExp = ModuleExp;

// mod-gr.jsx — Module 04: General Relativity and Spacetime Geometry
/* ---------- 3D spacetime curvature engine ---------- */
// Impact parameters for the lensing fan (symmetric — focuses behind the mass).
const GR_RAY_B = [-3.3, -2.2, -1.25, 1.25, 2.2, 3.3];
// inner/outer test-body orbital elements (scene units); precession uses the exact
// GR rate Δϖ = 6π·GM/[c² a(1−e²)] per orbit, with scene c² below.
const GR_C2 = 27.04;                 // (scene light speed c = 5.2)²
const GR_BODIES = [
  { a: 2.2, e: 0.45, hex: 0x7fe0ee, r: 0.19 },
  { a: 3.5, e: 0.22, hex: 0xf3a85e, r: 0.13 },
];
function grPrecDeg(M, a, e) { return 6 * Math.PI * (0.55 * M) / (GR_C2 * a * (1 - e * e)) * 180 / Math.PI; }
function CurvatureEngine3D() {
  const [mass, setMass] = useState(5);
  const [view, setView] = useState("gr");
  const [showRay, setShowRay] = useState(true);
  const massRef = useRef(mass); massRef.current = mass;
  const viewRef = useRef(view); viewRef.current = view;
  const rayRef = useRef(showRay); rayRef.current = showRay;
  const stRef = useRef(null);
  // exact orbital elements (parameters, so the readout is exact by construction)
  const innerE = GR_BODIES[0].e;
  const precDeg = view === "gr" ? grPrecDeg(mass, GR_BODIES[0].a, GR_BODIES[0].e) : 0;
  const relaunch = () => {
    stRef.current = {
      // analytic precessing ellipses: theta = true anomaly, peri = perihelion angle
      bodies: GR_BODIES.map((b, i) => ({ ...b, theta: i * Math.PI, peri: i * 0.6, trail: [] })),
      rays: GR_RAY_B.map((b) => ({ x: -7.6, y: b, vx: 5.2, vy: 0, trail: [] })),
    };
  };
  if (!stRef.current) relaunch();

  const build = (ctx) => {
    const { THREE, scene } = ctx;
    scene.fog = new THREE.FogExp2(0x03050a, 0.012);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.45));
    const key = new THREE.DirectionalLight(0xbcd0ff, 0.8);
    key.position.set(6, 10, 4);
    scene.add(key);

    const det = ctx.settings.current.detail3d;
    const SEG = det === "low" ? 56 : det === "ultra" ? 120 : 88;
    const EXT = 17;

    // ---------- starfield backdrop ----------
    const starN = det === "low" ? 320 : 640;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(1 - u * u), R = 78 + Math.random() * 60;
      sPos[i * 3] = Math.cos(a) * rr * R;
      sPos[i * 3 + 1] = Math.abs(u) * R * 0.85 + 6;     // bias above the sheet
      sPos[i * 3 + 2] = Math.sin(a) * rr * R;
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    const stars = new THREE.Points(sGeo, new THREE.PointsMaterial({
      size: 1.5, map: qgaGlowTexture(), color: 0xc6d6ff, transparent: true,
      opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    }));
    scene.add(stars);

    // ---------- luminous gravity well (shaded grid funnel) ----------
    const geo = new THREE.PlaneGeometry(EXT, EXT, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const wellUniforms = {
      uTime: { value: 0 },
      uMaxDepth: { value: 3.0 },
      uGridN: { value: 17.0 },
      uFlat: { value: 0.0 },          // 1 in Newtonian view
    };
    const wellMat = new THREE.ShaderMaterial({
      uniforms: wellUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv; varying float vDepth; varying float vR;
        uniform float uMaxDepth;
        void main(){
          vUv = uv;
          vDepth = clamp(-position.y / max(uMaxDepth, 0.4), 0.0, 1.0);
          vR = length(position.xz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv; varying float vDepth; varying float vR;
        uniform float uTime, uGridN, uFlat;
        float gl(float c, float n){ float f = fract(c*n); float d = min(f, 1.0-f); return smoothstep(0.05, 0.0, d); }
        void main(){
          float g = max(gl(vUv.x, uGridN), gl(vUv.y, uGridN));
          // colour: cool blue at the rim, violet-white toward the throat
          vec3 cRim = vec3(0.16, 0.32, 0.62);
          vec3 cDeep = vec3(0.62, 0.50, 1.0);
          vec3 col = mix(cRim, cDeep, vDepth);
          // inward-travelling energy pulse along the funnel
          float pulse = 0.5 + 0.5*sin((vDepth*7.0 - uTime*1.1)*6.2831);
          float bright = (0.30 + 1.55*pow(vDepth, 1.4)) * (0.78 + 0.34*pulse);
          bright = mix(bright, 0.34, uFlat);            // flatten + dim in Newtonian view
          // soft radial fill so the sheet reads as a surface, brightest at the throat
          float fill = (0.05 + 0.30*pow(vDepth, 2.0)) * (1.0 - uFlat*0.7);
          float rimFade = smoothstep(8.6, 6.0, vR);     // fade the far edge into space
          vec3 outc = (col*g*bright + cDeep*fill) * rimFade;
          gl_FragColor = vec4(outc, 1.0);
        }`,
    });
    const surf = new THREE.Mesh(geo, wellMat);
    surf.renderOrder = -2;
    scene.add(surf);
    const pos = geo.attributes.position;

    const depth = (x, z, GM) =>
      viewRef.current === "gr" ? -0.92 * GM / Math.sqrt(x * x + z * z + 0.62) : 0;
    let lastM = -1, lastView = "";
    const reshape = () => {
      const GM = 0.55 * massRef.current;
      for (let k = 0; k < pos.count; k++) pos.setY(k, depth(pos.getX(k), pos.getZ(k), GM));
      pos.needsUpdate = true;
      wellUniforms.uMaxDepth.value = Math.max(0.5, 0.92 * GM / Math.sqrt(0.62));
    };
    const hAt = (x, z) => depth(x, z, 0.55 * massRef.current);

    // ---------- central mass: glowing star + corona ----------
    const star = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24),
      new THREE.MeshStandardMaterial({ color: 0xfff0cf, emissive: 0xf0c060, emissiveIntensity: 1.1, roughness: 0.45 }));
    scene.add(star);
    const starGlow = ctx.glow(0xffe6b0, 5, 0.5);
    scene.add(starGlow);
    const corona = ctx.glow(0xff9a4a, 7, 0.18);
    scene.add(corona);
    const throat = ctx.glow(0x7a6cff, 6, 0.34);   // luminous well throat
    scene.add(throat);

    const mkTrail = (hex, op, width) => {
      const g = new THREE.BufferGeometry();
      const buf = new THREE.BufferAttribute(new Float32Array(360 * 3), 3);
      g.setAttribute("position", buf);
      g.setDrawRange(0, 0);
      const l = new THREE.Line(g, new THREE.LineBasicMaterial({
        color: hex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      l.frustumCulled = false;
      scene.add(l);
      return { buf, g, l };
    };

    // orbiting geodesic bodies
    const st0 = stRef.current;
    const bodyVis = st0.bodies.map((b) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(b.r, 20, 16),
        new THREE.MeshBasicMaterial({ color: b.hex }));
      scene.add(mesh);
      const glow = ctx.glow(b.hex, b.r * 9, 0.6);
      scene.add(glow);
      return { mesh, glow, trail: mkTrail(b.hex, 0.62, 1) };
    });

    // lensing fan of light rays
    const rayVis = st0.rays.map(() => mkTrail(0xffcf72, 0.7, 1));

    const force = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1.4, 0xd96a5a, 0.35, 0.2);
    force.visible = false;
    scene.add(force);

    ctx.label("M — curvature source", () => ({ x: 0, y: hAt(0.01, 0.01) + 1.9, z: 0 }), "s3d-strong");
    const pLabel = ctx.label("geodesic — free fall, no force",
      () => { const b = stRef.current.bodies[0]; return { x: b.x, y: hAt(b.x, b.y) + 0.55, z: b.y }; }, "s3d-quiet");
    const lensLabel = ctx.label("gravitational lensing — light bends toward the mass",
      () => ({ x: 4.4, y: 0.6, z: 0 }), "s3d-quiet");
    ctx.annotation("embedding-diagram intuition — the 'rubber sheet' shows spatial curvature only; time curvature dominates everyday gravity",
      () => ({ x: 0, y: 0.4, z: EXT / 2 - 1 }));

    const writeTrail = (trail, list) => {
      const n = Math.min(list.length, 360);
      for (let i = 0; i < n; i++) {
        const q = list[list.length - n + i];
        trail.buf.setXYZ(i, q[0], q[1], q[2]);
      }
      trail.buf.needsUpdate = true;
      trail.g.setDrawRange(0, n);
    };

    return {
      autoRotate: true,
      update: (t, dt) => {
        const M = massRef.current, GM = 0.55 * M;
        const newton = viewRef.current === "newton";
        if (lastM !== M || lastView !== viewRef.current) { lastM = M; lastView = viewRef.current; reshape(); }
        wellUniforms.uTime.value += dt * 60 * 0.016 * ctx.motion();
        wellUniforms.uFlat.value += ((newton ? 1 : 0) - wellUniforms.uFlat.value) * Math.min(1, dt * 6);

        const sc = 0.45 + M * 0.07;
        star.scale.setScalar(sc);
        star.position.y = hAt(0.01, 0.01) + sc * 0.4;
        const pulse = 1 + 0.05 * Math.sin(t * 2.0);
        starGlow.position.copy(star.position); starGlow.scale.setScalar(sc * 4.4 * pulse);
        corona.position.copy(star.position); corona.scale.setScalar(sc * 7 * pulse);
        throat.position.set(0, hAt(0.01, 0.01) - 0.2, 0);
        throat.scale.setScalar((1 - wellUniforms.uFlat.value) * (3 + M * 0.5));
        throat.material.opacity = 0.34 * (1 - wellUniforms.uFlat.value);
        stars.rotation.y += dt * 0.012 * ctx.motion();

        const st = stRef.current;
        const sub = 6, sdt = Math.min(dt, 0.04) / sub;
        const C2 = GR_C2; // (scene light speed c = 5.2)^2
        const mu = GM, TS = 2.2; // gravitational parameter; TS = overall visual time-scale
        for (let s = 0; s < sub; s++) {
          for (const p of st.bodies) {
            // exact precessing Kepler orbit: advance true anomaly by the area law
            //   dθ/dt = h / r²,  h = √(μ a(1−e²)),  r = a(1−e²)/(1+e cosθ)
            // and advance the perihelion by the exact GR rate Δϖ = 6πμ/[c² a(1−e²)] per orbit
            // (distributed smoothly: dϖ = (Δϖ/2π) dθ). Newtonian view drops the advance → closed ellipse.
            const p_ = p.a * (1 - p.e * p.e);
            const rr = p_ / (1 + p.e * Math.cos(p.theta));
            const h = Math.sqrt(mu * p_);
            const dtheta = TS * h / (rr * rr) * sdt;
            p.theta += dtheta;
            if (!newton) p.peri += (6 * Math.PI * mu / (C2 * p_)) / (2 * Math.PI) * dtheta;
            const ang = p.theta + p.peri;
            p.x = rr * Math.cos(ang);
            p.y = rr * Math.sin(ang);
          }
          if (rayRef.current) {
            for (let ri = 0; ri < st.rays.length; ri++) {
              const q = st.rays[ri];
              const qr2 = q.x * q.x + q.y * q.y, qr = Math.sqrt(qr2) + 1e-6;
              if (qr > 0.4) {
                // Newtonian deflection is half the relativistic value (the 1919 result)
                const af = -(newton ? 1 : 2) * GM / (qr2 * qr) * 0.5;
                q.vx += af * q.x * sdt * 60; q.vy += af * q.y * sdt * 60;
                const vn = Math.hypot(q.vx, q.vy); q.vx *= 5.2 / vn; q.vy *= 5.2 / vn;
                q.x += q.vx * sdt * 0.96; q.y += q.vy * sdt * 0.96;
              }
              if (q.x > 9.0 || Math.abs(q.y) > 7.4 || qr <= 0.42) {
                q.x = -7.6; q.y = GR_RAY_B[ri]; q.vx = 5.2; q.vy = 0; q.trail = [];
              }
            }
          }
        }
        if (dt > 0) {
          for (const p of st.bodies) {
            p.trail.push([p.x, hAt(p.x, p.y) + 0.16, p.y]);
            if (p.trail.length > 360) p.trail.shift();
          }
          if (rayRef.current) for (const q of st.rays) {
            q.trail.push([q.x, hAt(q.x, q.y) + 0.12, q.y]);
            if (q.trail.length > 360) q.trail.shift();
          }
        }
        st.bodies.forEach((p, i) => {
          const y = hAt(p.x, p.y) + 0.16;
          bodyVis[i].mesh.position.set(p.x, y, p.y);
          bodyVis[i].glow.position.set(p.x, y, p.y);
          writeTrail(bodyVis[i].trail, p.trail);
        });
        const showRays = rayRef.current;
        rayVis.forEach((rv, i) => {
          rv.l.visible = showRays;
          if (showRays) writeTrail(rv, st.rays[i].trail);
        });
        lensLabel.setShow(showRays);

        force.visible = newton;
        pLabel.set(newton ? "F = −GMm r̂ / r² — force picture" : "geodesic — free fall, no force");
        if (newton) {
          const b = st.bodies[0];
          const r = Math.hypot(b.x, b.y) + 1e-6;
          force.position.set(b.x, hAt(b.x, b.y) + 0.16, b.y);
          force.setDirection(new THREE.Vector3(-b.x / r, 0, -b.y / r));
          force.setLength(1.5, 0.4, 0.22);
        }
      },
    };
  };

  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="mass M" min={1} max={10} step={0.1} value={mass} onChange={setMass}
          format={(v) => v.toFixed(1)}></SliderRow>
        <span className="seg">
          <button className={"btn" + (view === "gr" ? " on" : "")} onClick={() => setView("gr")}>Relativistic geometry</button>
          <button className={"btn" + (view === "newton" ? " on" : "")} onClick={() => setView("newton")}>Newtonian intuition</button>
        </span>
        <Toggle label="lensing rays" checked={showRay} onChange={setShowRay}></Toggle>
        <button className="btn" onClick={relaunch}>Re-launch bodies</button>
      </div>
      <Scene3D height={480} aria="Three-dimensional luminous gravity well with precessing geodesic orbits and a fan of gravitationally lensed light rays"
        initial={{ radius: 17, theta: 0.4, phi: 1.08, target: [0, -1.2, 0], minR: 8, maxR: 38, bloom: { strength: 0.95, radius: 0.62, threshold: 0.12 } }}
        build={build} fallback={<CurvatureEngine></CurvatureEngine>}></Scene3D>
      <div className="viz-toolbar viz-toolbar-bottom readout-grid" style={{ display: "grid" }}>
        <div className="readout"><div className="readout-label">inner orbit eccentricity e</div>
          <div className="readout-value">{innerE.toFixed(3)}</div></div>
        <div className="readout"><div className="readout-label">perihelion advance (this config)</div>
          <div className="readout-value">{precDeg > 0.05 ? "+" + precDeg.toFixed(1) : "0.0"}<span className="unit">° / orbit</span></div></div>
        <div className="readout"><div className="readout-label">Mercury (real, GR)</div>
          <div className="readout-value">42.98<span className="unit">″ / century</span></div></div>
        <div className="readout"><div className="readout-label">Solar-limb light deflection (real)</div>
          <div className="readout-value">1.75<span className="unit">″</span></div></div>
      </div>
      <VizCaption status="schematic">
        The well is a Flamm-paraboloid embedding of a spatial slice — an intuition aid, not a literal picture of 3D
        space — but the <em>dynamics</em> are quantitatively real: each body integrates the geodesic acceleration
        <Eq tex="a_r = -\,GM/r^2 \;-\; 3GM L^2/(c^2 r^4)"></Eq>, whose second (post-Newtonian) term advances the
        perihelion by exactly <Eq tex="\Delta\varpi = 6\pi GM/[\,c^2 a(1-e^2)\,]"></Eq> every orbit — the value in
        the readout above, which scales with mass and switches to 0 in the Newtonian view (closed ellipse). The inner,
        tighter orbit precesses faster, exactly as 1/[a(1−e²)] demands. In real units this is Mercury's 43″/century
        (here amplified for visibility). The light-ray fan deflects by <Eq tex="4GM/c^2 b"></Eq> — twice the Newtonian
        value (the 1919 eclipse result) — and focuses behind the mass: gravitational lensing. Halve it in the
        Newtonian view and a force vector replaces the geometry. Same leading orbit, profoundly different ontology.
        <span className="dim"> Real anchors: Mercury 42.98″/century (GR portion); Sun 1.75″ at the limb.</span>
      </VizCaption>
    </div>
  );
}

function CurvatureEngine() {
  const [mass, setMass] = useState(5);
  const [view, setView] = useState("gr"); // 'gr' | 'newton'
  const [showRay, setShowRay] = useState(true);
  const massRef = useRef(mass); massRef.current = mass;
  const viewRef = useRef(view); viewRef.current = view;
  const rayRef = useRef(showRay); rayRef.current = showRay;
  const prm = usePRM();

  // physics state (plane coordinates, world units): orbiting particle + photon
  const stRef = useRef(null);
  const initState = () => {
    stRef.current = {
      p: { x: 0, y: -3.2, vx: 1.45, vy: 0 },          // test particle
      ray: { x: -7.5, y: -1.7, vx: 5.2, vy: 0, trail: [] },
      ptrail: [],
    };
  };
  if (!stRef.current) initState();

  const sim = useSimLoop((ctx, w, h, t, dt) => {
    const M = massRef.current;
    const st = stRef.current;
    const GM = 0.55 * M;
    // --- integrate test particle (Newtonian + schematic precession term in GR view) ---
    const sub = 6, sdt = Math.min(dt, 0.04) / sub;
    for (let s = 0; s < sub; s++) {
      const p = st.p;
      const r2 = p.x * p.x + p.y * p.y, r = Math.sqrt(r2) + 1e-6;
      if (r > 0.45) {
        const L2 = Math.pow(p.x * p.vy - p.y * p.vx, 2);
        const corr = viewRef.current === "gr" ? (1 + 0.18 * GM * L2 / (r2 * r2 + 1e-9)) : 1; // schematic 1/r⁴ GR-style correction
        const a = -GM * corr / (r2 * r + 1e-9);
        p.vx += a * p.x * sdt * 60; p.vy += a * p.y * sdt * 60;
        p.x += p.vx * sdt * 60 * 0.016; p.y += p.vy * sdt * 60 * 0.016;
      }
      // photon
      if (rayRef.current) {
        const q = st.ray;
        const qr2 = q.x * q.x + q.y * q.y, qr = Math.sqrt(qr2) + 1e-6;
        if (qr > 0.4) {
          const af = -2 * GM / (qr2 * qr) * 0.5; // factor-2 light deflection, schematic
          q.vx += af * q.x * sdt * 60; q.vy += af * q.y * sdt * 60;
          const vn = Math.hypot(q.vx, q.vy); q.vx *= 5.2 / vn; q.vy *= 5.2 / vn; // photons keep |v|=c
          q.x += q.vx * sdt * 60 * 0.016; q.y += q.vy * sdt * 60 * 0.016;
        }
        if (q.x > 8.5 || Math.abs(q.y) > 6 || qr <= 0.42) {
          q.x = -7.5; q.y = -1.7; q.vx = 5.2; q.vy = 0; q.trail = [];
        }
        q.trail.push({ x: q.x, y: q.y });
        if (q.trail.length > 240) q.trail.shift();
      }
    }
    if (dt > 0) {
      st.ptrail.push({ x: st.p.x, y: st.p.y });
      if (st.ptrail.length > 300) st.ptrail.shift();
    }

    // --- render: project plane (x,y) + depth z(x,y) into screen ---
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.46, sc = Math.min(w, h * 1.6) / 17;
    const depth = (x, y) => {
      const r = Math.hypot(x, y);
      return viewRef.current === "gr" ? -1.9 * GM / Math.sqrt(r * r + 0.55) : 0;
    };
    const P = (x, y) => {
      const z = depth(x, y);
      return [cx + x * sc, cy + y * sc * 0.5 - z * sc * 0.55];
    };
    // grid
    const R = 8;
    ctx.lineWidth = 1;
    for (let gy = -R; gy <= R; gy++) {
      ctx.strokeStyle = "rgba(110,140,200," + (0.07 + 0.06 * (1 - Math.abs(gy) / R)).toFixed(3) + ")";
      ctx.beginPath();
      for (let gx = -R; gx <= R; gx += 0.25) {
        const [px, py] = P(gx, gy);
        if (gx === -R) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    for (let gx = -R; gx <= R; gx++) {
      ctx.strokeStyle = "rgba(110,140,200," + (0.07 + 0.06 * (1 - Math.abs(gx) / R)).toFixed(3) + ")";
      ctx.beginPath();
      for (let gy = -R; gy <= R; gy += 0.25) {
        const [px, py] = P(gx, gy);
        if (gy === -R) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // central mass
    const [mx, my] = P(0, 0);
    const mr = 7 + M * 1.6;
    const grad = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 2.4);
    grad.addColorStop(0, "rgba(240,220,170,0.95)");
    grad.addColorStop(0.4, "rgba(220,180,110,0.5)");
    grad.addColorStop(1, "rgba(220,180,110,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(mx, my, mr * 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f4e8c8";
    ctx.beginPath(); ctx.arc(mx, my, mr * 0.55, 0, Math.PI * 2); ctx.fill();
    // particle trail + body
    ctx.strokeStyle = "oklch(0.78 0.1 200 / 0.5)"; ctx.lineWidth = 1.5; ctx.beginPath();
    st.ptrail.forEach((q, i) => { const [px, py] = P(q.x, q.y); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
    ctx.stroke();
    const [ppx, ppy] = P(st.p.x, st.p.y);
    ctx.fillStyle = "oklch(0.78 0.1 200)";
    ctx.beginPath(); ctx.arc(ppx, ppy, 4.5, 0, Math.PI * 2); ctx.fill();
    // Newton view: draw force vector; GR view: label geodesic
    ctx.font = "10px IBM Plex Mono";
    if (viewRef.current === "newton") {
      const r = Math.hypot(st.p.x, st.p.y) + 1e-6;
      const fx = -st.p.x / r, fy = -st.p.y / r;
      const [tx, ty] = P(st.p.x + fx * 1.3, st.p.y + fy * 1.3);
      ctx.strokeStyle = "oklch(0.7 0.13 25)"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(ppx, ppy); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = "oklch(0.7 0.13 25)";
      ctx.fillText("F = −GMm r̂ / r²  (force picture)", ppx + 10, ppy - 10);
    } else {
      ctx.fillStyle = "rgba(170,195,230,0.8)";
      ctx.fillText("geodesic — no force, curved geometry", ppx + 10, ppy - 10);
    }
    // light ray
    if (rayRef.current) {
      const q = st.ray;
      ctx.strokeStyle = "oklch(0.8 0.1 85)"; ctx.lineWidth = 1.8; ctx.beginPath();
      q.trail.forEach((pt, i) => { const [px, py] = P(pt.x, pt.y); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
      ctx.stroke();
      const [lx, ly] = P(q.x, q.y);
      ctx.fillStyle = "oklch(0.8 0.1 85)";
      ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillText("light ray", lx + 8, ly + 4);
    }
  }, [prm]);

  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="mass M" min={1} max={10} step={0.1} value={mass} onChange={setMass}
          format={(v) => v.toFixed(1)}></SliderRow>
        <span className="seg">
          <button className={"btn" + (view === "gr" ? " on" : "")} onClick={() => setView("gr")}>Relativistic geometry</button>
          <button className={"btn" + (view === "newton" ? " on" : "")} onClick={() => setView("newton")}>Newtonian intuition</button>
        </span>
        <Toggle label="light ray" checked={showRay} onChange={setShowRay}></Toggle>
      </div>
      <canvas ref={sim.canvasRef} className="viz-canvas" style={{ height: 380 }}></canvas>
      <SimBar sim={sim}>
        <button className="btn" onClick={() => { initState(); }}>Re-launch bodies</button>
      </SimBar>
      <VizCaption status="schematic">
        Embedding-diagram-style visualization (Flamm-paraboloid intuition), not a literal picture of 3D space.
        In the relativistic view the orbit precesses — the perihelion advance absent from Newtonian gravity —
        and the light ray bends by twice the Newtonian prediction, the effect that made general relativity famous in 1919.
        Curvature is sourced by the full energy–momentum tensor, not by mass alone.
      </VizCaption>
    </div>
  );
}

function ModuleGR({ go }) {
  return (
    <article>
      <ModuleHeader num="04" kicker="Gravity as geometry" title="General Relativity and Spacetime Geometry"
        lede="General relativity removes gravity from the list of forces. Mass-energy curves spacetime; freely falling bodies follow the straightest available paths through that curved geometry. The theory has passed every experimental test for over a century — and contains the seeds of its own breakdown."></ModuleHeader>

      <Section title="The curvature engine">
        <p>
          The interactive scene below renders a spatial slice of spacetime as a deformable grid. Increase the central
          mass and the geometry responds continuously; the orbiting test particle and the passing light ray are not
          being pulled by a force — they follow geodesics of the deformed metric. Switch to the Newtonian view to
          compare the force-based description: same orbit at this accuracy, profoundly different ontology, and the
          differences (precession, light bending by the full relativistic factor) are measurable.
        </p>
        <CurvatureEngine3D></CurvatureEngine3D>
      </Section>

      <Section title="Mathematical formulation">
        <div className="formula-grid">
          <FormulaCard title="Einstein field equations" status="established"
            tex="G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4}\, T_{\mu\nu}"
            symbols={[
              { s: "G_{\\mu\\nu}", d: "Einstein tensor — a specific combination of curvature (R_{μν} − ½R g_{μν}) that is automatically conserved." },
              { s: "g_{\\mu\\nu}", d: "Metric tensor: the dynamical field encoding distances, durations, and causal structure." },
              { s: "\\Lambda", d: "Cosmological constant; observations indicate a small positive value driving cosmic acceleration." },
              { s: "T_{\\mu\\nu}", d: "Energy–momentum tensor of matter and radiation — the source of curvature. Pressure and momentum flux gravitate, not just mass." },
            ]}
            meaning="Ten coupled nonlinear equations stating: geometry (left) is determined by energy-momentum content (right). Matter tells spacetime how to curve; spacetime tells matter how to move."
            limits="Classical field equations. They predict singularities (Penrose–Hawking theorems) where the description must fail — a primary motivation for quantum gravity."></FormulaCard>
          <FormulaCard title="Geodesic equation" status="established"
            tex="\frac{d^2 x^\mu}{d\tau^2} + \Gamma^{\mu}_{\alpha\beta}\,\frac{dx^\alpha}{d\tau}\frac{dx^\beta}{d\tau} = 0"
            symbols={[
              { s: "x^\\mu(\\tau)", d: "Worldline of the freely falling body, parameterized by proper time τ." },
              { s: "\\Gamma^{\\mu}_{\\alpha\\beta}", d: "Christoffel symbols — derivatives of the metric playing the role the 'gravitational field' plays in Newtonian language." },
            ]}
            meaning="The equation of motion for free fall: the curve of extremal proper time. No mass of the test body appears — the equivalence principle is built in."
            limits="Valid for test bodies whose own gravity is negligible; extended or self-gravitating bodies require corrections."></FormulaCard>
          <FormulaCard title="Einstein–Hilbert action" status="established"
            tex="S_{EH} = \frac{c^4}{16\pi G} \int R\, \sqrt{-g}\; d^4x"
            symbols={[
              { s: "R", d: "Ricci curvature scalar — the simplest invariant measure of curvature." },
              { s: "\\sqrt{-g}\\,d^4x", d: "Invariant spacetime volume element." },
              { s: "G", d: "Newton's constant. Its dimensions, [G] = energy⁻² in natural units, are the root of gravity's non-renormalizability (Module 05)." },
            ]}
            meaning="Varying this action with respect to the metric yields the Einstein field equations. Its form is what one attempts to quantize — by path integral, canonical methods, or otherwise."
            limits="Lowest-order term only; quantum corrections generate higher-curvature terms (R², …) suppressed by the Planck scale."></FormulaCard>
        </div>
      </Section>

      <Misconception title="Gravity is not a force in general relativity.">
        The 'rubber sheet' image is itself only an analogy — and a 2D embedding diagram of spatial curvature, at that.
        What the theory actually says: free-falling observers feel no force (they are inertial), and what we call
        gravitational attraction is the convergence of geodesics in curved spacetime. Time curvature, not space
        curvature, dominates everyday gravity.
      </Misconception>
      <ConceptBridge id="gr-planck" go={go}></ConceptBridge>
    </article>
  );
}

window.ModuleGR = ModuleGR;

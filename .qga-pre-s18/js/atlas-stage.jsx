// atlas-stage.jsx — HORIZON cinematic full-viewport 3D backdrop.
// A persistent, module-aware WebGL scene living behind the entire app:
// depth starfield, drifting nebulae, an undulating "spacetime fabric",
// pointer parallax, and a slow cosmic drift. Module changes lerp the
// palette + fabric warp. Reduced-motion → static. No WebGL → 2D fallback.

const ATLAS_DPR = { low: 1, medium: 1.4, ultra: 1.85 };
const ATLAS_MOTION = { reduced: 0, balanced: 0.62, full: 1 };

// per-view signature: [hue, accentHueShift, fabricWarp, nebulaDensity]
const ATLAS_PALETTE = {
  overview:   [222, 60, 1.0, 1.0],
  sm:         [266, -34, 0.7, 1.05],
  qft:        [196, 24, 1.25, 1.1],
  rg:         [222, 48, 0.85, 0.95],
  gr:         [42, 18, 1.7, 0.85],
  planck:     [228, 70, 1.15, 1.2],
  approaches: [284, -30, 0.95, 1.1],
  bh:         [34, 14, 1.45, 0.95],
  exp:        [196, 36, 1.05, 1.0],
  glossary:   [222, 50, 0.6, 0.8],
  refs:       [222, 50, 0.55, 0.75],
  open:       [10, 30, 0.9, 0.85],
};

function AtlasStage({ view = "overview", motion = "balanced", detail = "medium", enabled = true, paused = false }) {
  const settings = useAtlasSettings();
  const prm = usePRM();
  const mountRef = useRef(null);
  const sessionRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [rebuildNonce, setRebuildNonce] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [phase, setPhase] = useState("initializing");
  const diagnosticRef = useRef(null);
  useEffect(() => () => {
    if (diagnosticRef.current) QGA_RENDER.renderDiagnostics.remove(diagnosticRef.current);
  }, []);
  useEffect(() => { setFailed(false); }, [settings.renderBackend, detail, settings.vizMode, settings.motion, settings.toneMapping]);
  const targetRef = useRef(ATLAS_PALETTE[view] || ATLAS_PALETTE.overview);
  targetRef.current = ATLAS_PALETTE[view] || ATLAS_PALETTE.overview;
  const motionRef = useRef(motion); motionRef.current = motion;
  const detailRef = useRef(detail); detailRef.current = detail;
  const prmRef = useRef(prm); prmRef.current = prm;
  const pausedRef = useRef(paused); pausedRef.current = paused;
  // On a shared stage the backdrop draws only when something changed: a palette, pause or motion change owes it a frame.
  useEffect(() => { sessionRef.current?.invalidate({ input: false }); }, [view, paused, motion]);

  useEffect(() => {
    if (!enabled || failed) return;
    const mount = mountRef.current;
    if (!mount) return;

    const abort = new AbortController();
    let alive = true, stop = () => {}, renderer, session;
    if (diagnosticRef.current) QGA_RENDER.renderDiagnostics.remove(diagnosticRef.current);
    const diagnosticId = QGA_RENDER.renderDiagnostics.allocate("Atlas backdrop");
    diagnosticRef.current = diagnosticId;
    const fail = (error) => {
      if (!alive || error.name === "AbortError") return;
      const message = QGA_RENDER.describeRenderError(error);
      QGA_RENDER.renderDiagnostics.message(diagnosticId, message);
      QGA_RENDER.renderDiagnostics.update(diagnosticId, { phase: "static", backend: "static", effects: [] });
      setErrorMessage(message);
      setFailed(true);
      stop();
    };
    const start = async () => {
    const detail0 = detailRef.current;
    // The starfield is a material-kit sprite (S08), so the backdrop needs the node renderer (WebGPU, or its WebGL2 backend) and has no
    // classic fallback: its engraved lines are the node ones.
    const engraved = await QGA_ENGRAVED.prepare(settings, { requireNode: true });
    const { createBackdropStars } = await QGA_BACKDROP.loadStars();
    if (!alive) return;
    const scene = new THREE.Scene();
    let resourcesReleased = false, initPromise = null;
    stop = () => {
      if (resourcesReleased) return;
      resourcesReleased = true;
      // Scene GPU resources must outlive every submit that references them:
      // dispose the session first (it stops the loop and drains the queue),
      // then destroy the scene. The reverse order raises "used in submit
      // while destroyed" on the shared WebGPU device.
      const releaseScene = () => s3dDispose(scene);
      const teardown = session ? session.dispose()
        : initPromise ? initPromise.then((early) => early.dispose(), () => undefined)
        : Promise.resolve();
      void Promise.resolve(teardown)
        .catch((error) => QGA_RENDER.renderDiagnostics.message(diagnosticId, error.message))
        .finally(releaseScene);
    };
    scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.018);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);
    camera.position.set(0, 2.5, 34);

    const renderFrame = (dt = 0, now = performance.now(), sample = false, frameMs = dt * 1000) => session.render(dt, now, sample, frameMs);

    const root = new THREE.Group();
    scene.add(root);

    // live palette (smoothly lerped toward target)
    let hue = targetRef.current[0], aShift = targetRef.current[1], warp = targetRef.current[2], neb = targetRef.current[3];
    const colPrimary = new THREE.Color(), colAccent = new THREE.Color();
    const tintPrimary = QGA_TOKENS.tint("primary"), tintAccent = QGA_TOKENS.tint("accent");
    const setCols = () => {
      colPrimary.setHSL(((hue % 360) + 360) % 360 / 360, tintPrimary.s, tintPrimary.l);
      colAccent.setHSL(((hue + aShift) % 360 + 360) % 360 / 360, tintAccent.s, tintAccent.l);
    };
    setCols();

    const N = detail0 === "low" ? 1400 : detail0 === "ultra" ? 4200 : 2600;

    // ---------- depth starfield ----------
    // A static seeded buffer: the twinkle runs in the vertex stage from the time uniform, the palette tint is a uniform, and the CPU
    // uploads nothing per frame (js/visualizations/atlas/backdrop-stars.mjs).
    const starField = createBackdropStars({ count: N });
    root.add(starField.object);

    // galactic core: large soft glows giving the scene a luminous heart
    let core = null, core2 = null, core3 = null;
    if (window.s3dGlow) {
      core = s3dGlow(colPrimary.getHex(), 84, 0.32);
      core.position.set(-14, 7, -72);
      root.add(core);
      core2 = s3dGlow(colAccent.getHex(), 54, 0.28);
      core2.position.set(28, -10, -56);
      root.add(core2);
      core3 = s3dGlow(QGA_TOKENS.hex("pigment-grey-96"), 30, 0.22);
      core3.position.set(-6, 2, -50);
      root.add(core3);
    }

    // bright foreground "hero" stars (fewer, larger, with the glow sprite)
    const heroN = detail0 === "low" ? 7 : 12;
    const heroes = [], rnd = QGA_SEEDED(0xa71a5);
    for (let i = 0; i < heroN; i++) {
      const s = window.s3dGlow ? s3dGlow(QGA_TOKENS.hex("pigment-blue-94"), 2.6, 0.85) : null;
      if (!s) break;
      s.position.set((rnd() - 0.5) * 76, (rnd() - 0.5) * 38, -8 - rnd() * 52);
      s.userData.tw = rnd() * Math.PI * 2;
      s.userData.sc = 1.6 + rnd() * 2.8;
      s.scale.setScalar(s.userData.sc);
      root.add(s); heroes.push(s);
    }

    // ---------- nebula clouds (large additive glow sprites) ----------
    const nebN = detail0 === "low" ? 4 : 7;
    const nebs = [];
    for (let i = 0; i < nebN; i++) {
      const s = window.s3dGlow ? s3dGlow(i % 2 ? colAccent.getHex() : colPrimary.getHex(), 34, 0.34) : null;
      if (!s) break;
      s.position.set((rnd() - 0.5) * 90, (rnd() - 0.5) * 46 - 4, -24 - rnd() * 46);
      s.userData = { baseX: s.position.x, baseY: s.position.y, drift: rnd() * Math.PI * 2, sc: 30 + rnd() * 34, accent: i % 2 === 1 };
      root.add(s); nebs.push(s);
    }

    // ---------- spacetime fabric (undulating wire grid, far below) ----------
    const GX = detail0 === "low" ? 26 : detail0 === "ultra" ? 46 : 36;
    const GZ = GX;
    const span = 150, stepX = span / GX, stepZ = span / GZ;
    const fabricPos = new Float32Array(GX * GZ * 3);
    const idx = (i, j) => (i * GZ + j);
    for (let i = 0; i < GX; i++) for (let j = 0; j < GZ; j++) {
      fabricPos[idx(i, j) * 3] = -span / 2 + i * stepX;
      fabricPos[idx(i, j) * 3 + 1] = 0;
      fabricPos[idx(i, j) * 3 + 2] = -span / 2 + j * stepZ;
    }
    // line segments connecting the grid
    const segIndex = [];
    for (let i = 0; i < GX; i++) for (let j = 0; j < GZ; j++) {
      if (i < GX - 1) { segIndex.push(idx(i, j), idx(i + 1, j)); }
      if (j < GZ - 1) { segIndex.push(idx(i, j), idx(i, j + 1)); }
    }
    const fabricFlat = engraved.expand(fabricPos, segIndex);
    const fabric = engraved.segments(fabricFlat, { color: colPrimary, opacity: 0.2, additive: true, widthPx: engraved.WIDTH_PX.hairline, layer: "decoration" });
    fabric.frustumCulled = false;
    fabric.position.y = -20;
    fabric.rotation.x = 0.06;
    root.add(fabric);
    // seed the fabric with a static warped shape so a single (even paused) frame looks alive
    for (let i = 0; i < GX; i++) for (let j = 0; j < GZ; j++) {
      const x = -span / 2 + i * stepX, z = -span / 2 + j * stepZ, d = Math.hypot(x, z);
      fabricPos[idx(i, j) * 3 + 1] = (Math.sin(x * 0.06) * Math.cos(z * 0.05)) * 2.6 * warp - 6.0 * Math.exp(-d * d / 1600) * warp;
    }
    engraved.expand(fabricPos, segIndex, fabricFlat);
    engraved.update(fabric, fabricFlat);

    camera.lookAt(0, 0, -10);
    initPromise = QGA_RENDER.initializeRenderSession({
      scene, camera, mount, settings: { ...settings, motion: prmRef.current ? "reduced" : motionRef.current },
      view: "atlas-backdrop", signal: abort.signal, diagnosticId, onError: fail,
      onPhase: (value) => { if (alive) setPhase(value); }, shared: true,
    });
    session = await initPromise;
    if (!alive) { await session.dispose(); return; }
    if (session.backend === "static") {
      fail(new Error(session.capabilities.diagnostics.join(" ")));
      return;
    }
    sessionRef.current = session;
    renderer = session.renderer;
    const releaseResources = stop;

    // ---------- interaction: pointer parallax ----------
    const mouse = { x: 0, y: 0, ex: 0, ey: 0 };
    const onMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // ---------- sizing ----------
    const resize = () => {
      const w = Math.max(2, mount.clientWidth), h = Math.max(2, mount.clientHeight);
      session.resize();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(mount);

    // ---------- loop ----------
    let raf, last = performance.now(), clk = 0, hidden = document.hidden;
    const onVis = () => { hidden = document.hidden; session.invalidate({ input: false }); };
    document.addEventListener("visibilitychange", onVis);
    const motionVal = () => (prmRef.current ? 0 : (ATLAS_MOTION[motionRef.current] ?? 0.62));

    const tick = (now) => {
      if (!alive) return;
      if (!session.shared && !renderer.isWebGPURenderer) raf = requestAnimationFrame(tick);
      try {
      const frameMs = Math.max(0, now - last);
      const rawDt = Math.min(0.05, frameMs / 1000);
      last = now;
      if (pausedRef.current || hidden) { session.suspend(); session.setAnimated(false); return; }
      const mo = motionVal();
      clk += rawDt * (mo > 0 ? 1 : 0);

      // lerp palette toward target. Under reduced motion the palette snaps to
      // its target instead of easing: the eased value depends on how many
      // frames have elapsed, which would make the "static" backdrop differ
      // between otherwise identical captures.
      const tg = targetRef.current;
      if (mo > 0) {
        const lp = 1 - Math.pow(0.001, rawDt); // ~time-based ease
        hue += ((tg[0] - hue + 540) % 360 - 180) * lp;
        aShift += (tg[1] - aShift) * lp;
        warp += (tg[2] - warp) * lp;
        neb += (tg[3] - neb) * lp;
      } else {
        hue = tg[0]; aShift = tg[1]; warp = tg[2]; neb = tg[3];
      }
      setCols();
      fabric.material.color.copy(colPrimary);

      // camera parallax + slow cosmic drift. The per-frame ease below is
      // frame-count dependent, so under reduced motion the camera is placed
      // directly at its easing target — the documented "reduced-motion →
      // static" contract, and byte-stable across captures.
      const driftX = Math.sin(clk * 0.05) * 2.0;
      const driftY = Math.cos(clk * 0.037) * 1.1;
      if (mo > 0) {
        mouse.ex += (mouse.x - mouse.ex) * 0.045;
        mouse.ey += (mouse.y - mouse.ey) * 0.045;
        camera.position.x += ((mouse.ex * 5 + driftX) - camera.position.x) * 0.05;
        camera.position.y += ((2.5 - mouse.ey * 3 + driftY) - camera.position.y) * 0.05;
      } else {
        camera.position.x = driftX;
        camera.position.y = 2.5 + driftY;
      }
      root.rotation.y = Math.sin(clk * 0.02) * 0.06 * mo;
      camera.lookAt(0, 0, -10);

      // when the tab is hidden, draw a single static frame (never black) and skip heavy work
      // twinkle: the time uniform drives it (0 under reduced motion: a still, byte-stable sky); tint the stars toward the palette
      starField.uniforms.time.value = mo > 0 ? clk : 0;
      starField.uniforms.tint.value.copy(colPrimary).multiplyScalar(0.06);

      // hero stars pulse + recolor
      for (const s of heroes) {
        s.material.color.copy(colPrimary);
        const pu = 0.4 + 0.18 * Math.sin(clk * 1.1 + s.userData.tw) * (mo > 0 ? 1 : 0);
        s.material.opacity = pu;
        s.scale.setScalar(s.userData.sc * (1 + 0.06 * Math.sin(clk + s.userData.tw) * mo));
      }

      // nebula drift + recolor + density
      for (const s of nebs) {
        s.material.color.copy(s.userData.accent ? colAccent : colPrimary);
        s.material.opacity = (0.22 + 0.12 * neb) * (0.72 + 0.28 * Math.sin(clk * 0.3 + s.userData.drift));
        s.position.x = s.userData.baseX + Math.sin(clk * 0.08 + s.userData.drift) * 6 * mo;
        s.position.y = s.userData.baseY + Math.cos(clk * 0.06 + s.userData.drift) * 3 * mo;
        s.scale.setScalar(s.userData.sc * (1 + 0.08 * Math.sin(clk * 0.2 + s.userData.drift) * mo));
      }
      if (core) { core.material.color.copy(colPrimary); core.material.opacity = 0.28 + 0.06 * Math.sin(clk * 0.16); }
      if (core2) { core2.material.color.copy(colAccent); core2.material.opacity = 0.24 + 0.06 * Math.cos(clk * 0.12); }
      if (core3) { core3.material.opacity = 0.2 + 0.05 * Math.sin(clk * 0.2 + 1); }

      // undulate the fabric (sum of travelling sines, amplitude ~ warp)
      const amp = 2.6 * warp;
      for (let i = 0; i < GX; i++) for (let j = 0; j < GZ; j++) {
        const x = -span / 2 + i * stepX, z = -span / 2 + j * stepZ;
        const d = Math.hypot(x, z);
        const y = (mo > 0 ? (
          Math.sin(x * 0.06 + clk * 0.5) * Math.cos(z * 0.05 - clk * 0.3) +
          Math.sin(d * 0.05 - clk * 0.6) * 0.6
        ) : Math.sin(x * 0.06) * Math.cos(z * 0.05)) * amp
          - 6.0 * Math.exp(-d * d / 1600) * warp; // central gravitational dip
        fabricPos[idx(i, j) * 3 + 1] = y;
      }
      engraved.expand(fabricPos, segIndex, fabricFlat);
      engraved.update(fabric, fabricFlat);
      engraved.setOpacity(fabric, 0.16 + 0.08 * warp);

      // Motion on: the backdrop animates every frame. Motion off: it settles on one frame and idles.
      session.setAnimated(QGA_RENDER.resolveAnimated({ declared: "motion", playing: true, motion: mo }));
      renderFrame(rawDt, now, mo > 0, frameMs);
      }
      catch (error) { fail(error); }
    };
    let released = false;
    stop = () => {
      if (released) return;
      released = true;
      sessionRef.current = null;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      releaseResources();
    };
    try { renderFrame(); }
    catch (error) { fail(error); return; }
    if (session.drive(tick)) { /* the shared stage calls tick, and only when the backdrop has a frame to draw */ }
    else if (renderer.isWebGPURenderer) void renderer.setAnimationLoop(tick).catch(fail);
    else raf = requestAnimationFrame(tick);
    };
    void start().catch((error) => { fail(error); stop(); });
    return () => {
      alive = false;
      abort.abort();
      stop();
    };
  }, [enabled, failed, detail, settings.motion, settings.vizMode, settings.renderBackend, settings.toneMapping, rebuildNonce]); // palette handled live

  if (!enabled) return null;
  if (failed) {
    // graceful 2D fallback — reuse the lightweight starfield
    return <React.Fragment>
      <Starfield enabled={true} motionScale={prm ? 0 : ATLAS_MOTION[motion] ?? 0.62} hue={(ATLAS_PALETTE[view] || ATLAS_PALETTE.overview)[0]}></Starfield>
      <div className="render-fallback-notice" role="status">Static backdrop: {errorMessage}</div>
    </React.Fragment>;
  }
  return <React.Fragment>
    <div className="atlas-stage" ref={mountRef} aria-hidden="true"></div>
    {phase !== "ready" ? <div className="render-fallback-notice" role="status">Initializing backdrop and compiling shaders…</div> : null}
  </React.Fragment>;
}

Object.assign(window, { AtlasStage });

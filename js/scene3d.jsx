// scene3d.jsx — shared cinematic 3D layer for Quantum Gravity Atlas
// Provides: Scene3D (managed WebGL stage with orbit rig, HTML label overlay,
// picking, lifecycle/cleanup, reduced-motion + fallback behavior) and small
// scene-building helpers. Every module's flagship 3D scene goes through this.

/* ---------- capability detection ---------- */
function qgaWebGLAvailable() {
  if (window.__qgaWebGL !== undefined) return window.__qgaWebGL;
  let ok = false;
  try {
    const c = document.createElement("canvas");
    ok = !!(window.WebGL2RenderingContext && c.getContext("webgl2"));
  } catch (e) { ok = false; }
  window.__qgaWebGL = ok && !!window.THREE;
  return window.__qgaWebGL;
}

/* ---------- bloom post-processing (UnrealBloomPass) — the "real glow" layer ---------- */
function qgaBloomAvailable() {
  return !!(window.THREE && window.THREE.EffectComposer && window.THREE.UnrealBloomPass && window.THREE.RenderPass);
}
function qgaMakeComposer(renderer, scene, camera, w, h, opts) {
  if (!qgaBloomAvailable()) return null;
  opts = opts || {};
  const T = window.THREE;
  try {
    const composer = new T.EffectComposer(renderer);
    composer.addPass(new T.RenderPass(scene, camera));
    const bloom = new T.UnrealBloomPass(new T.Vector2(w, h),
      opts.strength != null ? opts.strength : 0.72,
      opts.radius != null ? opts.radius : 0.5,
      opts.threshold != null ? opts.threshold : 0.16);
    composer.addPass(bloom);
    if (T.GammaCorrectionShader && T.ShaderPass) {
      composer.addPass(new T.ShaderPass(T.GammaCorrectionShader)); // preserve the legacy linear → sRGB display pass
    }
    composer.setSize(w, h);
    return composer;
  } catch (e) { return null; }
}

/* ---------- shared sprite texture (cached; never disposed) ---------- */
function qgaGlowTexture() {
  if (window.__qgaGlowTex) return window.__qgaGlowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.12)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  window.__qgaGlowTex = new THREE.CanvasTexture(c);
  return window.__qgaGlowTex;
}

/* ---------- small builder helpers ---------- */
function s3dGlow(color, scale = 1, opacity = 0.8) {
  const m = new THREE.SpriteMaterial({
    map: qgaGlowTexture(), color: new THREE.Color(color),
    transparent: true, opacity, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(scale);
  return s;
}
function s3dLine(points, color, opacity = 0.8, dashed = false) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.22, gapSize: 0.14 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.Line(geo, mat);
  if (dashed) line.computeLineDistances();
  return line;
}
function s3dGrid(size, divisions, color = 0x2a3a58, opacity = 0.35) {
  const g = new THREE.GridHelper(size, divisions, color, color);
  g.material.transparent = true;
  g.material.opacity = opacity;
  g.material.depthWrite = false;
  return g;
}
function s3dDispose(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for (const m of mats) {
      // shared glow texture is cached globally — never dispose it
      if (m.map && m.map !== window.__qgaGlowTex) m.map.dispose();
      m.dispose();
    }
  });
}

const S3D_DPR = { low: 1, medium: 1.5, ultra: 2 };
const S3D_MOTION = { reduced: 0, balanced: 0.55, full: 1 };

/* =========================================================================
   Scene3D — managed interactive 3D stage.

   props:
     height        css px height of the stage
     aria          accessible label for the scene
     initial       { radius, theta, phi, fov?, target?:[x,y,z], minR?, maxR? }
     build(ctx)    called once per (re)build. ctx = { THREE, scene, camera,
                   renderer, settings (ref → live atlas settings), motion()
                   → 0..1 motion factor, label(text, posFn, cls) → handle,
                   annotation(text, posFn) (hidden by annotations toggle) }
                   Must return {} or:
                     update(t, dt)     per-frame; dt = 0 while paused
                     pickables: []     meshes for click-raycast
                     onPick(obj|null)  click result (obj.userData yours)
                     autoRotate: bool  default true (cinematic mode only)
                     dispose()         extra cleanup
     deps          rebuild triggers (detail level is added automatically)
     fallback      node rendered if WebGL/THREE unavailable or context lost
     overlay       extra React overlay (legends etc.), absolutely positioned
   ========================================================================= */
function Scene3D({ height = 420, aria, initial = {}, build, deps = [], fallback = null, overlay = null, cameraGoal = null }) {
  const settings = useAtlasSettings();
  const prm = usePRM();
  const mountRef = useRef(null);
  const hudStateRef = useRef({});
  const [failed, setFailed] = useState(!qgaWebGLAvailable());
  const [playing, setPlaying] = useState(true);
  const [full, setFull] = useState(false);
  const settingsRef = useRef(settings); settingsRef.current = settings;
  const prmRef = useRef(prm); prmRef.current = prm;
  const playingRef = useRef(playing); playingRef.current = playing;
  // Eased camera-preset target. Held in a ref so changing it never rebuilds the
  // WebGL scene; the frame loop glides the orbit rig toward it instead.
  const goalRef = useRef(null);
  useEffect(() => {
    if (!cameraGoal) return;
    goalRef.current = {
      radius: cameraGoal.radius, theta: cameraGoal.theta, phi: cameraGoal.phi,
      fromR: null, fromT: 0, fromP: 0, t: 0, active: true,
    };
  }, [cameraGoal]);

  useEffect(() => {
    if (!qgaWebGLAvailable()) { setFailed(true); return; }
    const mount = mountRef.current;
    if (!mount) return;

    const detail = settingsRef.current.detail3d || "medium";
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: detail !== "low", alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true,
      });
    } catch (e) { setFailed(true); return; }

    const scene = new THREE.Scene();
    const fov = initial.fov || 45;
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 600);
    const target = new THREE.Vector3(...(initial.target || [0, 0, 0]));
    // bloom composer (skip on low detail for performance)
    let composer = detail !== "low" ? qgaMakeComposer(renderer, scene, camera, 100, 100, initial.bloom) : null;
    const renderFrame = () => { if (composer) composer.render(); else renderer.render(scene, camera); };

    // orbit rig state
    const orbit = {
      radius: initial.radius ?? 12,
      theta: initial.theta ?? 0.6,
      phi: initial.phi ?? 1.1,
      vTheta: 0, vPhi: 0,
      minR: initial.minR ?? (initial.radius ?? 12) * 0.35,
      maxR: initial.maxR ?? (initial.radius ?? 12) * 3,
      lastInteract: -10,
      introT: 0,
    };
    const home = { radius: orbit.radius, theta: orbit.theta, phi: orbit.phi };
    const motion = () => (prmRef.current ? 0 : (S3D_MOTION[settingsRef.current.motion] ?? 0.55));
    // cinematic intro: ease in from a pulled-back camera
    if (motion() > 0) { orbit.radius = home.radius * 1.45; orbit.introT = 1; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, S3D_DPR[detail] || 1.5));
    renderer.domElement.className = "s3d-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    // label overlay
    const labelLayer = document.createElement("div");
    labelLayer.className = "s3d-labels";
    mount.appendChild(labelLayer);
    const labels = [];
    const makeLabel = (annotationOnly) => (text, posFn, cls) => {
      const el = document.createElement("div");
      el.className = "s3d-label" + (cls ? " " + cls : "") + (annotationOnly ? " s3d-annot" : "");
      el.textContent = text;
      labelLayer.appendChild(el);
      const h = {
        el, posFn, annotationOnly,
        set: (t2) => { el.textContent = t2; },
        show: true,
        setShow: (v) => { h.show = v; },
      };
      labels.push(h);
      return h;
    };

    const ctx = {
      THREE, scene, camera, renderer,
      settings: settingsRef, motion,
      label: makeLabel(false),
      annotation: makeLabel(true),
      glow: s3dGlow, line: s3dLine, grid: s3dGrid,
    };

    let built = {};
    try { built = build(ctx) || {}; }
    catch (e) { console.error("Scene3D build failed:", e); setFailed(true); }

    // ---------- interaction ----------
    const el = renderer.domElement;
    const ptr = { down: false, id: null, x: 0, y: 0, moved: 0, pinch: 0 };
    const touches = new Map();
    const markInteract = () => { orbit.lastInteract = clockT; orbit.introT = 0; };

    const onPointerDown = (e) => {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      ptr.down = true; ptr.id = e.pointerId; ptr.x = e.clientX; ptr.y = e.clientY; ptr.moved = 0;
      if (touches.size === 2) {
        const ts = [...touches.values()];
        ptr.pinch = Math.hypot(ts[0].x - ts[1].x, ts[0].y - ts[1].y);
      }
      el.setPointerCapture(e.pointerId);
      markInteract();
    };
    const onPointerMove = (e) => {
      if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) {
        const ts = [...touches.values()];
        const d = Math.hypot(ts[0].x - ts[1].x, ts[0].y - ts[1].y);
        if (ptr.pinch > 0) {
          orbit.radius = Math.max(orbit.minR, Math.min(orbit.maxR, orbit.radius * (ptr.pinch / d)));
        }
        ptr.pinch = d;
        markInteract();
        return;
      }
      if (!ptr.down || e.pointerId !== ptr.id) {
        if (built.pickables && built.pickables.length && e.pointerType !== "touch") hoverCheck(e);
        return;
      }
      const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
      ptr.x = e.clientX; ptr.y = e.clientY;
      ptr.moved += Math.abs(dx) + Math.abs(dy);
      orbit.vTheta = -dx * 0.0042;
      orbit.vPhi = -dy * 0.0042;
      orbit.theta += orbit.vTheta;
      orbit.phi = Math.max(0.08, Math.min(Math.PI - 0.08, orbit.phi + orbit.vPhi));
      markInteract();
    };
    const onPointerUp = (e) => {
      touches.delete(e.pointerId);
      if (e.pointerId === ptr.id) {
        ptr.down = false;
        if (ptr.moved < 6 && built.onPick && built.pickables) pickAt(e);
      }
      ptr.pinch = 0;
    };
    const onWheel = (e) => {
      e.preventDefault();
      orbit.radius = Math.max(orbit.minR, Math.min(orbit.maxR, orbit.radius * Math.exp(e.deltaY * 0.0011)));
      markInteract();
    };

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line = { threshold: 0.25 };
    const ndc = (e) => {
      const r = el.getBoundingClientRect();
      return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    const pickAt = (e) => {
      raycaster.setFromCamera(ndc(e), camera);
      const hits = raycaster.intersectObjects(built.pickables, true);
      built.onPick(hits.length ? hits[0].object : null, hits.length ? hits[0] : null);
    };
    let hoverThrottle = 0;
    const hoverCheck = (e) => {
      const now = performance.now();
      if (now - hoverThrottle < 80) return;
      hoverThrottle = now;
      raycaster.setFromCamera(ndc(e), camera);
      const hits = raycaster.intersectObjects(built.pickables, true);
      el.style.cursor = hits.length ? "pointer" : "grab";
      if (built.onHover) built.onHover(hits.length ? hits[0].object : null);
    };

    const onKeyDown = (e) => {
      const step = 0.12;
      let used = true;
      if (e.key === "ArrowLeft") orbit.theta -= step;
      else if (e.key === "ArrowRight") orbit.theta += step;
      else if (e.key === "ArrowUp") orbit.phi = Math.max(0.08, orbit.phi - step);
      else if (e.key === "ArrowDown") orbit.phi = Math.min(Math.PI - 0.08, orbit.phi + step);
      else if (e.key === "+" || e.key === "=") orbit.radius = Math.max(orbit.minR, orbit.radius * 0.9);
      else if (e.key === "-" || e.key === "_") orbit.radius = Math.min(orbit.maxR, orbit.radius * 1.1);
      else if (e.key === "r" || e.key === "R" || e.key === "Home") resetCam();
      else if (e.key === "f" || e.key === "F") setFull((v) => !v);
      else if (e.key === " ") { setPlaying((p) => !p); }
      else used = false;
      if (used) { e.preventDefault(); markInteract(); }
    };

    const resetCam = () => {
      orbit.radius = home.radius; orbit.theta = home.theta; orbit.phi = home.phi;
      orbit.vTheta = 0; orbit.vPhi = 0;
    };
    hudStateRef.current.reset = resetCam;

    el.style.cursor = "grab";
    el.style.touchAction = "none";
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    mount.addEventListener("keydown", onKeyDown);

    const onContextLost = (e) => { e.preventDefault(); setFailed(true); };
    el.addEventListener("webglcontextlost", onContextLost);

    // ---------- sizing ----------
    const resize = () => {
      const w = Math.max(40, mount.clientWidth);
      const h = Math.max(40, mount.clientHeight);
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (composer) composer.setSize(w, h);
      try { renderFrame(); } catch (e) {}
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ---------- offscreen pause ----------
    let visible = true;
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.02 });
    io.observe(mount);

    // ---------- frame loop ----------
    let raf, alive = true, last = performance.now(), clockT = 0;
    const v3 = new THREE.Vector3();
    const tick = (now) => {
      if (!alive) return;
      raf = requestAnimationFrame(tick);
      const rawDt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return; // offscreen: keep rAF cheap, do no work

      clockT += rawDt;
      const mo = motion();

      // eased camera-preset transition (no scene rebuild)
      const goal = goalRef.current;
      if (goal && goal.active) {
        if (ptr.down) {
          goal.active = false;
        } else if (mo === 0) {
          // reduced motion: snap straight to the preset
          orbit.radius = goal.radius; orbit.theta = goal.theta; orbit.phi = goal.phi;
          orbit.introT = 0; orbit.vTheta = 0; orbit.vPhi = 0;
          goal.active = false;
        } else {
          if (goal.fromR == null) {
            goal.fromR = orbit.radius; goal.fromT = orbit.theta; goal.fromP = orbit.phi;
            orbit.introT = 0; orbit.vTheta = 0; orbit.vPhi = 0;
            orbit.lastInteract = clockT;
          }
          goal.t = Math.min(1, goal.t + rawDt / 0.9);
          const e = 1 - Math.pow(1 - goal.t, 3);
          orbit.radius = goal.fromR + (goal.radius - goal.fromR) * e;
          orbit.theta = goal.fromT + (goal.theta - goal.fromT) * e;
          orbit.phi = goal.fromP + (goal.phi - goal.fromP) * e;
          if (goal.t >= 1) goal.active = false;
        }
      }
      const easing = !!(goal && goal.active);

      // cinematic intro ease
      if (orbit.introT > 0 && !easing) {
        orbit.introT = Math.max(0, orbit.introT - rawDt / 1.4);
        const k = 1 - orbit.introT * orbit.introT;
        orbit.radius = home.radius * (1.45 - 0.45 * k);
      }
      // inertia
      if (!ptr.down && mo > 0 && !easing) {
        orbit.theta += orbit.vTheta;
        orbit.phi = Math.max(0.08, Math.min(Math.PI - 0.08, orbit.phi + orbit.vPhi));
        orbit.vTheta *= 0.9; orbit.vPhi *= 0.9;
        if (Math.abs(orbit.vTheta) < 1e-5) orbit.vTheta = 0;
        if (Math.abs(orbit.vPhi) < 1e-5) orbit.vPhi = 0;
      }
      // gentle auto-drift in cinematic mode after idle
      if (mo > 0 && !easing && built.autoRotate !== false && settingsRef.current.vizMode === "cinematic"
          && clockT - orbit.lastInteract > 4 && !ptr.down) {
        orbit.theta += 0.03 * mo * rawDt;
      }

      camera.position.set(
        target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
        target.y + orbit.radius * Math.cos(orbit.phi),
        target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta)
      );
      camera.lookAt(target);

      const dt = playingRef.current ? rawDt : 0;
      if (built.update) built.update(clockT, dt);

      // project labels
      const showLabels = settingsRef.current.labels3d !== false;
      const showAnnot = settingsRef.current.annotations3d !== false;
      const r = renderer.domElement.getBoundingClientRect();
      for (const L of labels) {
        const on = L.show && (L.annotationOnly ? showAnnot && showLabels : showLabels);
        if (!on) { L.el.style.display = "none"; continue; }
        const p = L.posFn();
        v3.set(p.x, p.y, p.z).project(camera);
        if (v3.z > 1 || v3.x < -1.15 || v3.x > 1.15 || v3.y < -1.15 || v3.y > 1.15) {
          L.el.style.display = "none"; continue;
        }
        L.el.style.display = "block";
        L.el.style.transform = "translate(-50%,-130%) translate(" +
          ((v3.x * 0.5 + 0.5) * r.width).toFixed(1) + "px," +
          ((-v3.y * 0.5 + 0.5) * r.height).toFixed(1) + "px)";
      }
      renderFrame();
    };
    // one synchronous frame so the scene paints instantly even if rAF is throttled/frozen
    try {
      camera.position.set(
        target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
        target.y + orbit.radius * Math.cos(orbit.phi),
        target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta)
      );
      camera.lookAt(target);
      if (built.update) built.update(0, 0);
      renderFrame();
    } catch (e) {}
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("webglcontextlost", onContextLost);
      mount.removeEventListener("keydown", onKeyDown);
      if (built.dispose) { try { built.dispose(); } catch (e) {} }
      s3dDispose(scene);
      if (composer && composer.dispose) { try { composer.dispose(); } catch (e) {} }
      renderer.dispose();
      if (labelLayer.parentNode) labelLayer.parentNode.removeChild(labelLayer);
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [failed, settings.detail3d, ...deps]); // eslint-disable-line

  // exit fullscreen on Escape
  useEffect(() => {
    if (!full) return;
    const onKey = (e) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.documentElement.classList.add("s3d-fs-open");
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.style.overflow = ""; document.documentElement.classList.remove("s3d-fs-open"); };
  }, [full]);

  if (failed) {
    return (
      <div className="s3d-fallback" style={{ minHeight: fallback ? undefined : 180 }}>
        <div className="s3d-fallback-note">
          <span className="badge badge-schematic">3D unavailable</span>
          <span className="small dim">Interactive 3D rendering could not start on this device — showing the 2D analytical view instead. All scientific content remains available.</span>
        </div>
        {fallback}
      </div>
    );
  }
  return (
    <div className={"s3d-stage" + (full ? " s3d-full" : "")} style={full ? null : { height }} ref={mountRef} tabIndex={0} role="application"
      aria-label={(aria || "Interactive 3D scientific visualization") + ". Drag to orbit, scroll to zoom, arrow keys to rotate, R to reset camera, space to pause, F for fullscreen."}>
      <div className="s3d-hud" data-omelette-chrome="">
        <button className="s3d-hud-btn" title="Reset camera (R)" aria-label="Reset camera"
          onClick={() => hudStateRef.current.reset && hudStateRef.current.reset()}>⌖</button>
        <button className="s3d-hud-btn" title={playing ? "Pause simulation (space)" : "Play simulation (space)"}
          aria-label={playing ? "Pause simulation" : "Play simulation"}
          onClick={() => setPlaying(!playing)}>{playing ? "❚❚" : "▶"}</button>
        <button className="s3d-hud-btn s3d-hud-full" title={full ? "Exit fullscreen (Esc)" : "Expand to fullscreen"}
          aria-label={full ? "Exit fullscreen" : "Expand to fullscreen"}
          onClick={() => setFull((v) => !v)}>{full ? "✕" : "⛶"}</button>
      </div>
      <div className="s3d-hint" aria-hidden="true">{full ? "drag · zoom · click · esc to exit" : "drag · zoom · click · ⛶ fullscreen"}</div>
      {overlay}
    </div>
  );
}

Object.assign(window, {
  Scene3D, qgaWebGLAvailable, qgaGlowTexture, qgaMakeComposer, qgaBloomAvailable,
  s3dGlow, s3dLine, s3dGrid, s3dDispose,
});

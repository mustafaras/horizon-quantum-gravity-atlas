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
  grad.addColorStop(0, QGA_TOKENS.css("pigment-white"));
  grad.addColorStop(0.25, QGA_TOKENS.alpha("pigment-white", 0.55));
  grad.addColorStop(0.6, QGA_TOKENS.alpha("pigment-white", 0.12));
  grad.addColorStop(1, QGA_TOKENS.alpha("pigment-white", 0));
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
function s3dGrid(size, divisions, color = QGA_TOKENS.hex("pigment-blue-35"), opacity = 0.35) {
  const g = new THREE.GridHelper(size, divisions, color, color);
  g.material.transparent = true;
  g.material.opacity = opacity;
  g.material.depthWrite = false;
  return g;
}
function s3dDispose(root) {
  root.traverse((o) => {
    // THREE.Sprite instances share one module-level geometry across every
    // scene and renderer; disposing it destroys GPU buffers still in use elsewhere.
    if (o.geometry && !o.isSprite) o.geometry.dispose();
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
     animated      true (default) | "motion" | false: when the scene needs frames on the shared stage. true: it evolves
                   while playing. "motion": ambient motion that its own code freezes at motion 0 (it idles under
                   reduced motion). false: it changes only on input. A build may return isAnimated() to report its own
                   state instead (Kerr: until its accumulation converges); see js/render/stage/animation-policy.mjs.
     invalidateKey any value; a change owes the scene one frame (e.g. a transport clock owned by the parent)
     shared        false opts a scene out of the shared stage (it then keeps its own renderer)
     overlay       extra React overlay (legends etc.), absolutely positioned
   ========================================================================= */
function Scene3D({ height = 420, aria, initial = {}, build, deps = [], fallback = null, overlay = null, cameraGoal = null, shotSpace = null, shared = true, animated = true, invalidateKey = null }) {
  const settings = useAtlasSettings();
  const prm = usePRM();
  const mountRef = useRef(null);
  const hudStateRef = useRef({});
  const sessionRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [rebuildNonce, setRebuildNonce] = useState(0);
  const [phase, setPhase] = useState("initializing");
  const [errorMessage, setErrorMessage] = useState("");
  const diagnosticRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [full, setFull] = useState(false);
  const settingsRef = useRef(settings); settingsRef.current = settings;
  const prmRef = useRef(prm); prmRef.current = prm;
  const playingRef = useRef(playing); playingRef.current = playing;
  useEffect(() => () => {
    if (diagnosticRef.current) QGA_RENDER.renderDiagnostics.remove(diagnosticRef.current);
  }, []);
  // On a shared stage a static scene draws only when invalidated: React-side changes owe it a frame. `build` is a
  // new closure whenever the owning module renders, and modules feed live parameters to a built scene through refs
  // (the Kerr observatory's spin, corona and jets, the Planck probe's scale), so a render owes one frame as well.
  useEffect(() => { sessionRef.current?.invalidate({ input: false }); }, [playing, full, cameraGoal, settings.labels3d, settings.annotations3d, invalidateKey, build]);
  const animatedRef = useRef(animated); animatedRef.current = animated;
  useEffect(() => { setFailed(false); }, [settings.renderBackend, settings.detail3d, settings.vizMode, settings.motion, settings.toneMapping]);
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
    if (failed) return;
    const mount = mountRef.current;
    if (!mount) return;
    const abort = new AbortController();
    let alive = true, stop = () => {}, renderer, session, scene, built = {}, recovered = false;
    if (diagnosticRef.current) QGA_RENDER.renderDiagnostics.remove(diagnosticRef.current);
    const diagnosticId = QGA_RENDER.renderDiagnostics.allocate(aria || "Module scene");
    diagnosticRef.current = diagnosticId;
    setPhase("initializing");
    const fail = (error) => {
      if (!alive || error.name === "AbortError") return;
      // A scene may declare one automatic recovery (e.g. rebuild on a different material backend).
      if (!recovered && built.recoverable && built.recoverable(error)) {
        recovered = true;
        QGA_RENDER.renderDiagnostics.message(diagnosticId, `Recovering scene: ${QGA_RENDER.describeRenderError(error)}`);
        stop();
        setRebuildNonce((n) => n + 1);
        return;
      }
      const message = QGA_RENDER.describeRenderError(error);
      QGA_RENDER.renderDiagnostics.message(diagnosticId, message);
      QGA_RENDER.renderDiagnostics.update(diagnosticId, { phase: "static", backend: "static", effects: [] });
      setErrorMessage(message);
      setFailed(true);
      stop();
    };
    const start = async () => {
    scene = new THREE.Scene();
    const fov = initial.fov || 45;
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 600);
    const target = new THREE.Vector3(...(initial.target || [0, 0, 0]));
    const renderFrame = (dt = 0, now = performance.now(), sample = false, frameMs = dt * 1000) => session.render(dt, now, sample, frameMs);

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

    // label overlay
    const labelLayer = document.createElement("div");
    labelLayer.className = "s3d-labels";
    mount.appendChild(labelLayer);
    let resourcesReleased = false, initPromise = null, spaceBridge = null;
    stop = () => {
      if (resourcesReleased) return;
      resourcesReleased = true;
      if (spaceBridge) { window.QGA_CINEMATIC.unregisterSpace(shotSpace, spaceBridge); spaceBridge = null; }
      const releaseScene = () => {
        if (built.dispose) {
          try { built.dispose(); }
          catch (error) { QGA_RENDER.renderDiagnostics.message(diagnosticId, `Scene cleanup failed: ${error.message}`); }
        }
        s3dDispose(scene);
        labelLayer.remove();
      };
      // GPU buffers must outlive every submit that references them: stop the
      // render loop and dispose the renderer (which drains the queue) first,
      // and only then destroy scene-owned resources. Disposing earlier raises
      // "used in submit while destroyed" on the shared WebGPU device.
      const teardown = session ? session.dispose()
        : initPromise ? initPromise.then((early) => early.dispose(), () => undefined)
        : Promise.resolve();
      void Promise.resolve(teardown)
        .catch((error) => QGA_RENDER.renderDiagnostics.message(diagnosticId, error.message))
        .finally(releaseScene);
    };
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

    // Prompt 10 formula linking: scenes register concept targets mapping a
    // formula symbol (tex id) to a scene object plus a live readout. Unknown
    // symbols stay invisible (dev diagnostic only) — never an exception.
    const conceptTargets = new Map();
    const conceptPulse = { active: null, focusTween: null, focusBase: null, symbol: null };
    const startConceptPulse = (symbol, target, { intensity = 1 } = {}) => {
      const object = target.object;
      if (!object) return;
      conceptPulse.lastInteraction = intensity < 1 ? "preview" : "highlight";
      let overlay;
      if (object.isMesh && object.geometry) {
        const material = new THREE.MeshBasicMaterial({
          color: QGA_TOKENS.hex("pigment-azure-75"), transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        });
        overlay = new THREE.Mesh(object.geometry, material);
        overlay.scale.copy(object.scale).multiplyScalar(1.03);
        overlay.position.copy(object.position);
        overlay.rotation.copy(object.rotation);
        overlay.renderOrder = 6;
      } else {
        overlay = s3dGlow(QGA_TOKENS.hex("pigment-azure-75"), (target.glowScale ?? 4.5) * intensity, 0);
        overlay.position.copy(object.position);
      }
      (object.parent ?? scene).add(overlay);
      if (conceptPulse.active) conceptPulse.active.overlay.removeFromParent();
      conceptPulse.active = { overlay, object, target, startTime: clockT, duration: 0.8, intensity, hold: true };
      conceptPulse.symbol = symbol;
      session.invalidate({ input: false });
      // Dev/QA diagnostic: the active concept highlight (also lets the QA
      // suite assert the scene reacted without touching scene internals).
      window.__qgaConceptHighlight = { symbol, interaction: conceptPulse.lastInteraction ?? "hover", at: performance.now() };
      // Live numerical readout for the highlighted symbol.
      try {
        const readout = target.readout?.();
        if (readout) window.QGA_CONCEPT_BUS?.publish("formula-readout", {
          symbol, label: String(readout.label ?? ""),
          value: String(readout.value ?? ""), unit: String(readout.unit ?? ""),
        });
      } catch (error) { /* readouts are best-effort; never break the scene */ }
      // Cinematic mode only: pull the depth-of-field focus to the object's
      // view-space depth (≤450ms, easeInOutQuint). Scientific mode keeps DOF
      // untouched — highlight stays emissive + outline only.
      const pipeline = session?.pipeline;
      if (settingsRef.current.vizMode === "cinematic" && pipeline?.focusDistanceSupported && !prmRef.current) {
        const depth = object.getWorldPosition(new THREE.Vector3())
          .applyMatrix4(camera.matrixWorldInverse).z;
        const focusDistance = Math.max(camera.near, -depth);
        const from = conceptPulse.focusBase ?? Math.max(camera.near * 2, 8);
        conceptPulse.focusBase = focusDistance;
        conceptPulse.focusTween?.();
        conceptPulse.focusTween = window.QGA_MOTION?.runtime
          ? window.QGA_MOTION.runtime.tween({
              from, to: focusDistance, duration: 450, easing: "easeInOutQuint",
              reducedMotion: window.QGA_MOTION.systemReducedMotion(),
              onUpdate: (value) => { try { pipeline.setFocusDistance(value); } catch (error) { /* pipeline may swap */ } },
            })
          : null;
      }
    };
    const stopConceptPulse = () => {
      if (conceptPulse.active) conceptPulse.active.hold = false;
      session.invalidate({ input: false });
      conceptPulse.focusTween?.();
      conceptPulse.focusTween = null;
    };

    const ctx = {
      THREE, scene, camera, get renderer() { return renderer; },
      settings: settingsRef, motion, playing: () => playingRef.current,
      invalidate: () => session?.invalidate({ input: false }),
      label: makeLabel(false),
      annotation: makeLabel(true),
      glow: s3dGlow, line: s3dLine, grid: s3dGrid,
      conceptTarget: (id, target) => {
        if (typeof id !== "string" || !id || !target || !target.object) {
          throw new TypeError("conceptTarget(id, { object, readout? }) requires an id and an object");
        }
        conceptTargets.set(id, target);
        return target;
      },
    };

    built = (await build(ctx)) || {};
    if (!alive) { if (built.dispose) built.dispose(); s3dDispose(scene); labelLayer.remove(); return; }
    camera.position.set(
      target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
      target.y + orbit.radius * Math.cos(orbit.phi),
      target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta)
    );
    camera.lookAt(target);
    if (built.update) built.update(0, 0);
    setPhase("prewarming");
    initPromise = QGA_RENDER.initializeRenderSession({
      scene, camera, mount, settings: settingsRef.current, view: aria || "scene",
      signal: abort.signal, diagnosticId, onError: fail, onPhase: (value) => { if (alive) setPhase(value); },
      source: built.lightSource || null, applyQuality: built.applyRenderQuality || null,
      depthValid: built.renderCapabilities?.depth !== false, shared,
    });
    session = await initPromise;
    if (!alive) { await session.dispose(); return; }
    if (session.backend === "static") {
      fail(new Error(session.capabilities.diagnostics.join(" ")));
      return;
    }
    sessionRef.current = session;
    renderer = session.renderer;
    session.element.className = "s3d-canvas";
    setPhase("ready");
    const releaseResources = stop;

    // ---------- cinematic shot-space bridge (Prompt 09) ----------
    // The camera director places this scene's orbit rig through this bridge;
    // radii/angles are clamped to the rig's own limits so a shot can never
    // push the camera through invalid geometry.
    if (shotSpace && window.QGA_CINEMATIC) {
      spaceBridge = {
        getPose: () => ({ radius: orbit.radius, theta: orbit.theta, phi: orbit.phi, target: [target.x, target.y, target.z] }),
        setPose: (pose) => {
          if (!pose) return;
          orbit.radius = Math.max(orbit.minR, Math.min(orbit.maxR, pose.radius));
          orbit.theta = pose.theta;
          orbit.phi = Math.max(0.08, Math.min(Math.PI - 0.08, pose.phi));
          orbit.vTheta = 0; orbit.vPhi = 0; orbit.introT = 0;
          orbit.lastInteract = clockT;
          if (Array.isArray(pose.target)) target.set(pose.target[0], pose.target[1], pose.target[2]);
          session.invalidate({ input: false });
        },
      };
      window.QGA_CINEMATIC.registerSpace(shotSpace, spaceBridge);
    }

    // ---------- interaction ----------
    const el = session.element;
    const ptr = { down: false, id: null, x: 0, y: 0, moved: 0, pinch: 0 };
    const touches = new Map();
    const markInteract = () => {
      orbit.lastInteract = clockT; orbit.introT = 0;
      session.invalidate();
      broadcastPose();
      // user orbit/pan/zoom immediately pauses automated cinematic direction
      if (shotSpace && window.QGA_CINEMATIC) window.QGA_CINEMATIC.notifySceneInput(shotSpace);
    };

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
        if (ptr.moved < 6 && maybePlaceAnnotation(e)) { /* consumed as an annotation anchor */ }
        else if (ptr.moved < 6 && built.onPick && built.pickables) pickAt(e);
        else if (ptr.moved < 6 && built.onScreenPick) built.onScreenPick(ndc(e), e);
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
      session.invalidate({ input: false });
    };
    hudStateRef.current.reset = resetCam;
    // Prompt 10 snapshot/compare camera bridge: read the live orbit pose and
    // fly to a stored one (easeInOutQuint ≤900ms; snaps under reduced motion
    // via the goal glide's motion===0 branch).
    hudStateRef.current.getPose = () => ({ radius: orbit.radius, theta: orbit.theta, phi: orbit.phi });
    hudStateRef.current.flyTo = (pose, opts = {}) => {
      if (!pose || !Number.isFinite(pose.radius)) return;
      goalRef.current = {
        radius: Math.max(orbit.minR, Math.min(orbit.maxR, pose.radius)),
        theta: Number.isFinite(pose.theta) ? pose.theta : orbit.theta,
        phi: Math.max(0.08, Math.min(Math.PI - 0.08, Number.isFinite(pose.phi) ? pose.phi : orbit.phi)),
        fromR: null, fromT: 0, fromP: 0, t: 0, active: true,
        easing: opts.easing === "quint" ? "quint" : "cubic",
        duration: Number.isFinite(opts.duration) ? Math.min(0.9, Math.max(0.1, opts.duration)) : 0.9,
      };
      session.invalidate({ input: false });
    };

    // ---------- Prompt 10 interaction bridges ----------
    // ConceptBus: formula symbols → scene highlight. Unknown mappings are a
    // benign dev diagnostic; nothing visible happens (spec requirement).
    const offFormulaHighlight = window.QGA_CONCEPT_BUS?.on("formula-highlight", (payload) => {
      const target = conceptTargets.get(payload.symbol);
      if (!target) {
        try { console.debug(`[Scene3D] no concept target for symbol "${payload.symbol}"`); } catch (e) {}
        return;
      }
      startConceptPulse(payload.symbol, target, { intensity: payload.interaction === "preview" ? 0.45 : 1 });
    });
    const offFormulaClear = window.QGA_CONCEPT_BUS?.on("formula-clear", () => stopConceptPulse());
    // Bidirectional annotation linking: hovering a pin that was dropped on a
    // registered concept object re-highlights that object.
    const offAnnotationHover = window.QGA_CONCEPT_BUS?.on("annotation-hover", (payload) => {
      const target = conceptTargets.get(payload.concept);
      if (!target) return; // unknown mapping: silent, dev diagnostic only
      startConceptPulse(payload.concept, target, { intensity: 0.8 });
    });
    // Palette open: the active scene keeps rendering but idle auto-drift
    // pauses while the command palette is open (cinematic discipline).
    let paletteOpen = false;
    const offPalette = window.QGA_CONCEPT_BUS?.on("palette-visibility", (payload) => { paletteOpen = payload.open; session.invalidate({ input: false }); });

    // Compare embed bridge: broadcast the orbit pose on interaction and
    // apply synchronized poses from the twin scene (single blended pose).
    const compareRole = window.__qgaCompareRole;
    let lastPoseBroadcast = 0;
    const broadcastPose = () => {
      if (!compareRole || window.parent === window) return;
      const now = performance.now();
      if (now - lastPoseBroadcast < 80) return;
      lastPoseBroadcast = now;
      window.parent.postMessage({ type: "qga-camera", side: compareRole, pose: hudStateRef.current.getPose() }, "*");
    };
    const onCompareMessage = (event) => {
      const data = event.data;
      if (!data || data.type !== "qga-camera-sync" || !data.pose) return;
      orbit.radius = Math.max(orbit.minR, Math.min(orbit.maxR, Number(data.pose.radius) || orbit.radius));
      orbit.theta = Number.isFinite(data.pose.theta) ? data.pose.theta : orbit.theta;
      orbit.phi = Math.max(0.08, Math.min(Math.PI - 0.08, Number.isFinite(data.pose.phi) ? data.pose.phi : orbit.phi));
      orbit.vTheta = 0; orbit.vPhi = 0; orbit.introT = 0;
      session.invalidate({ input: false });
    };
    if (compareRole) {
      window.addEventListener("message", onCompareMessage);
      window.parent?.postMessage({ type: "qga-scene-mounted", side: compareRole, cameraSpace: "orbit" }, "*");
    }

    // Annotation placement: while the annotation layer arms placement, a
    // click on this scene raycasts the geometry and offers a world anchor.
    const maybePlaceAnnotation = (e) => {
      if (!window.__qgaAnnotationPlacing) return false;
      raycaster.setFromCamera(ndc(e), camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      if (!hits.length) return false; // sky click → the layer falls back to a screen pin
      window.__qgaAnnotationPlacing = false;
      const point = hits[0].point;
      // Bidirectional linking: a pin dropped on a registered concept object
      // remembers the symbol so hovering the pin re-highlights the object.
      let concept = null;
      for (const [symbol, target] of conceptTargets) {
        let node = hits[0].object;
        while (node && concept == null) {
          if (node === target.object) concept = symbol;
          node = node.parent;
        }
        if (concept) break;
      }
      document.dispatchEvent(new CustomEvent("qga-annotation-place", {
        detail: { kind: "world", point: { x: point.x, y: point.y, z: point.z }, concept },
      }));
      return true;
    };

    // Global scene registry: the annotation layer projects world pins through
    // the active scene (per-frame NDC projection + depth-aware occlusion).
    const registryVector = new THREE.Vector3();
    const registryRay = new THREE.Raycaster();
    const sceneHandle = Object.freeze({
      element: mount,
      cameraSpace: "orbit",
      capture: () => session.capture(),
      getPose: hudStateRef.current.getPose,
      flyTo: hudStateRef.current.flyTo,
      projectPoint(point) {
        registryVector.set(point.x, point.y, point.z);
        const worldPosition = registryVector.clone();
        registryVector.project(camera);
        const rect = session.element.getBoundingClientRect();
        const result = {
          x: (registryVector.x * 0.5 + 0.5) * rect.width,
          y: (-registryVector.y * 0.5 + 0.5) * rect.height,
          inFront: registryVector.z < 1,
          occluded: false, rect,
        };
        const direction = worldPosition.clone().sub(camera.position);
        const distance = direction.length();
        registryRay.set(camera.position, direction.normalize());
        registryRay.far = Math.max(0, distance - 0.05);
        result.occluded = registryRay.intersectObjects(scene.children, true).length > 0;
        return result;
      },
    });
    (window.__qgaActiveScenes ??= new Set()).add(sceneHandle);

    el.style.cursor = "grab";
    el.style.touchAction = "none";
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    mount.addEventListener("keydown", onKeyDown);

    // ---------- sizing ----------
    const resize = () => {
      const w = Math.max(40, mount.clientWidth);
      const h = Math.max(40, mount.clientHeight);
      session.resize();
      session.element.style.width = "100%";
      session.element.style.height = "100%";
      session.invalidate({ input: false });
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ---------- offscreen pause ----------
    let visible = true;
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; session.setVisible(visible); }, { threshold: 0.02 });
    io.observe(mount);

    // ---------- frame loop ----------
    let raf, last = performance.now(), clockT = 0;
    const v3 = new THREE.Vector3();
    const tick = (now) => {
      if (!alive) return;
      if (!session.shared && !renderer.isWebGPURenderer) raf = requestAnimationFrame(tick);
      try {
      const frameMs = Math.max(0, now - last);
      const rawDt = Math.min(0.05, frameMs / 1000);
      last = now;
      if (!visible || document.hidden) { session.suspend(); session.setAnimated(false); return; }

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
          goal.t = Math.min(1, goal.t + rawDt / (goal.duration ?? 0.9));
          // Prompt 10: snapshot/compare fly-to uses easeInOutQuint; module
          // camera goals keep the original easeOutCubic glide.
          const e = goal.easing === "quint"
            ? (window.QGA_MOTION?.EASINGS?.easeInOutQuint ?? ((t) => 1 - Math.pow(1 - t, 3)))(goal.t)
            : 1 - Math.pow(1 - goal.t, 3);
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
      // gentle auto-drift in cinematic mode after idle (paused while the
      // command palette is open — the scene renders but does not wander)
      if (mo > 0 && !easing && built.autoRotate !== false && settingsRef.current.vizMode === "cinematic"
          && clockT - orbit.lastInteract > 4 && !ptr.down && !paletteOpen) {
        orbit.theta += 0.03 * mo * rawDt;
      }

      // Prompt 10 concept-highlight pulse: uniform-driven emissive overlay,
      // 600–900ms easeOutCubic attack/decay, looping while held. The target
      // object's own materials are never mutated.
      if (conceptPulse.active) {
        const pulse = conceptPulse.active;
        const elapsed = clockT - pulse.startTime;
        const t = elapsed / pulse.duration;
        if (!pulse.overlay.parent || (!pulse.hold && t >= 1)) {
          pulse.overlay.removeFromParent();
          pulse.overlay.material.dispose();
          if (pulse.overlay.geometry && !pulse.object.isMesh) pulse.overlay.geometry.dispose();
          conceptPulse.active = null;
        } else {
          if (t >= 1) { pulse.startTime = clockT; }
          const cycle = Math.min(1, (clockT - pulse.startTime) / pulse.duration);
          const easeOutCubic = window.QGA_MOTION?.EASINGS?.easeOutCubic ?? ((x) => 1 - Math.pow(1 - x, 3));
          const envelope = cycle < 0.25
            ? easeOutCubic(cycle / 0.25)
            : 1 - easeOutCubic((cycle - 0.25) / 0.75);
          const strength = envelope * pulse.intensity;
          if (pulse.overlay.isMesh) {
            pulse.overlay.material.opacity = 0.5 * strength;
            const base = pulse.object.scale.x * 1.03;
            pulse.overlay.scale.setScalar(base * (1 + 0.035 * strength));
          } else {
            pulse.overlay.material.opacity = 0.85 * strength;
          }
          pulse.overlay.position.copy(pulse.object.position);
        }
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
      const r = session.element.getBoundingClientRect();
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
      // A shared stage draws a static scene only when invalidated: keep ticking while anything can still
      // change (running simulation, inertia, easing, intro, a highlight, a drag, or cinematic drift).
      const transient = easing || orbit.introT > 0 || orbit.vTheta !== 0 || orbit.vPhi !== 0 || !!conceptPulse.active || ptr.down
        || (animatedRef.current !== false && mo > 0 && built.autoRotate !== false && settingsRef.current.vizMode === "cinematic" && !paletteOpen);
      session.setAnimated(QGA_RENDER.resolveAnimated({
        declared: animatedRef.current, playing: playingRef.current, motion: mo, transient,
        builtAnimated: built.isAnimated ? built.isAnimated() : null,
      }));
      renderFrame(rawDt, now, mo > 0 && playingRef.current, frameMs);
      }
      catch (error) { fail(error); }
    };
    let released = false;
    stop = () => {
      if (released) return;
      released = true;
      sessionRef.current = null;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      mount.removeEventListener("keydown", onKeyDown);
      // Prompt 10 bridges: bus subscriptions, compare channel, scene registry
      // and any live highlight overlay/focus tween all die with the scene.
      offFormulaHighlight?.(); offFormulaClear?.(); offPalette?.(); offAnnotationHover?.();
      if (compareRole) window.removeEventListener("message", onCompareMessage);
      window.__qgaActiveScenes?.delete(sceneHandle);
      conceptPulse.focusTween?.();
      if (conceptPulse.active) {
        conceptPulse.active.overlay.removeFromParent();
        conceptPulse.active.overlay.material.dispose();
        conceptPulse.active = null;
      }
      releaseResources();
    };
    try { renderFrame(); }
    catch (error) { fail(error); return; }
    if (session.drive(tick)) { /* the shared stage calls tick, and only when this view has a frame to draw */ }
    else if (renderer.isWebGPURenderer) void renderer.setAnimationLoop(tick).catch(fail);
    else raf = requestAnimationFrame(tick);
    };
    void start().catch((error) => {
      fail(error);
      stop();
    });
    return () => {
      alive = false;
      abort.abort();
      stop();
    };
  }, [failed, settings.detail3d, settings.vizMode, settings.motion, settings.renderBackend, settings.toneMapping, rebuildNonce, ...deps]); // eslint-disable-line

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
          <span className="small" role="alert">{errorMessage}</span>
          <button className="btn" onClick={() => setFailed(false)}>Retry 3D initialization</button>
        </div>
        {fallback}
      </div>
    );
  }
  return (
    <div className={"s3d-stage" + (full ? " s3d-full" : "")} style={full ? null : { height }} ref={mountRef} tabIndex={0} role="application" aria-busy={phase !== "ready"}
      data-qga-anchor="primary-scene"
      aria-label={(aria || "Interactive 3D scientific visualization") + ". Drag to orbit, scroll to zoom, arrow keys to rotate, R to reset camera, space to pause, F for fullscreen."}>
      {/* adaptive material prewarms no longer republish "prewarming" (they keep
          the last frame on screen), so this overlay only appears for the first
          setup and true pipeline swaps */}
      {phase !== "ready" ? <div className="render-loading" role="status">Initializing renderer and compiling shaders…</div> : null}
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

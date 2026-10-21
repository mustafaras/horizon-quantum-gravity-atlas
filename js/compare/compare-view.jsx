// compare-view.jsx — Prompt 10 A/B scientific comparison.
//
// Two validated state snapshots rendered as embedded atlas instances (same
// origin, minimal chrome via the #embed-A/#embed-B hash). Modes:
//   - side-by-side: two independent panes;
//   - swipe: a draggable seam with a GPU divider overlay (WebGL2 fullscreen
//     triangle, thin lens distortion + ±2px chromatic fringe) that degrades
//     to a CSS divider on failure/timeout/software rasterizers.
// Parameter changes between presets tween with the shared EASINGS (700ms
// default); every interpolated frame is applied as a silent state patch so
// physics quantities recompute live — no baked keyframes. Cameras sync only
// when both sides declare compatible orbit spaces (same view + Scene3D rig);
// otherwise each side orbits independently under a visible badge.

function CompareView({ go }) {
  const prm = usePRM();
  const [presetId, setPresetId] = useState("schwarzschild-vs-kerr");
  const [mode, setMode] = useState("swipe");
  const [sides, setSides] = useState(() => resolvePresetSides("schwarzschild-vs-kerr"));
  // The iframe srcs change ONLY on reload-worthy transitions (initial mount,
  // view change, reduced motion). Preset switches with the same view tween
  // through silent state patches instead — the embeds never reload.
  const [mountedUrls, setMountedUrls] = useState(() => {
    const initial = resolvePresetSides("schwarzschild-vs-kerr");
    return initial ? { A: sideUrlOf(initial[0], "A"), B: sideUrlOf(initial[1], "B") } : null;
  });
  const [ready, setReady] = useState({ A: false, B: false });
  const [sceneSpace, setSceneSpace] = useState({ A: null, B: null });
  const [dividerPercent, setDividerPercent] = useState(50);
  const stageRef = useRef(null);
  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const handleRef = useRef(null);
  const shaderCanvasRef = useRef(null);
  const dividerRef = useRef(0.5);
  const iframesRef = useRef({ A: null, B: null });
  const sidesRef = useRef(sides); sidesRef.current = sides;
  const readyRef = useRef(ready); readyRef.current = ready;

  function resolvePresetSides(id) {
    const COMPARE = window.QGA_COMPARE;
    if (!COMPARE?.COMPARE_PRESETS?.length) return null; // guarded below
    const preset = COMPARE.COMPARE_PRESETS.find((entry) => entry.id === id)
      ?? COMPARE.COMPARE_PRESETS[0];
    const defaults = window.QGA_DEFAULT_STATE;
    const readState = window.QGA_READ_STATE;
    return preset.sides.map((side) => {
      const validation = COMPARE.validateCompareSide({
        patch: side.patch, renderMode: side.renderMode, readState, defaults,
        stateKeys: QGA_STATE_KEYS,
      });
      if (!validation.ok) throw new Error("Invalid compare side: " + validation.errors.join("; "));
      return { label: side.label, renderMode: side.renderMode, state: validation.state, view: validation.state.view };
    });
  }

  function sideUrlOf(side, role) {
    // qgaStateSearch is the canonical serializer (shared lexical scope with
    // state.jsx): short keys, defaults elision and the Kerr bhv versioning
    // all stay consistent with the rest of the atlas.
    return location.pathname + qgaStateSearch(side.state) + "#embed-" + role;
  }

  // Bootstrap-degradation guard: without the compare tooling the view stays
  // honest instead of crashing.
  if (!sides || !mountedUrls) {
    return (
      <div className="compare-view">
        <header className="compare-head">
          <div>
            <div className="module-kicker">Prompt 10 · A/B comparison</div>
            <h1>Compare two validated states</h1>
          </div>
          <button className="btn" onClick={() => go("overview")}>← Back to the atlas</button>
        </header>
        <div className="lab-fallback">The compare tooling could not initialize (bootstrap degradation). Reload the page; everything else remains available.</div>
      </div>
    );
  }

  // ---- preset switching: tween changed parameters (700ms, shared EASINGS) ----
  const switchPreset = (id) => {
    const next = resolvePresetSides(id);
    const previous = sidesRef.current;
    setPresetId(id);
    setSides(next);
    // Same view on every preset side → keep the mounted embeds and tween.
    const sameViews = next.every((side, index) => side.view === previous[index]?.view);
    if (!sameViews || prm) {
      // View changed (or reduced motion): reload the embeds at the final
      // state — reduced motion must never animate. Identical URLs (re-click)
      // keep the mounted embeds and readiness.
      const nextUrls = { A: sideUrlOf(next[0], "A"), B: sideUrlOf(next[1], "B") };
      const changed = nextUrls.A !== mountedUrls.A || nextUrls.B !== mountedUrls.B;
      setMountedUrls(nextUrls);
      if (changed) {
        setReady({ A: false, B: false });
        setSceneSpace({ A: null, B: null });
      }
      return;
    }
    const MOTION = window.QGA_MOTION;
    next.forEach((side, index) => {
      const from = previous[index].state;
      const diff = window.QGA_COMPARE.diffStates(from, side.state);
      if (!diff.tweenable.length && !diff.switches.length) return;
      const target = iframesRef.current[index === 0 ? "A" : "B"];
      if (!target) return;
      if (!MOTION) {
        // No motion runtime (bootstrap degradation): apply the final state.
        target.contentWindow?.postMessage({ type: "qga-state-patch", patch: side.state }, "*");
        return;
      }
      MOTION.runtime.tween({
        from: 0, to: 1, duration: 700, easing: "easeInOutCubic", reducedMotion: prm,
        onUpdate: (t) => {
          const sampled = window.QGA_COMPARE.sampleTweenState(from, diff, t);
          target.contentWindow?.postMessage({ type: "qga-state-patch", patch: sampled }, "*");
        },
      });
    });
  };

  // ---- embed protocol: readiness, settings, camera sync ----
  useEffect(() => {
    const onMessage = (event) => {
      const data = event.data;
      if (!data || typeof data.type !== "string") return;
      const side = data.side === "A" ? "A" : data.side === "B" ? "B" : null;
      if (data.type === "qga-embed-ready" && side) {
        setReady((current) => (current[side] ? current : { ...current, [side]: true }));
      } else if (data.type === "qga-scene-mounted" && side) {
        setSceneSpace((current) => ({ ...current, [side]: data.cameraSpace ?? null }));
      } else if (data.type === "qga-camera" && side) {
        // Forward the pose to the twin scene when both declared orbit spaces.
        if (cameraSyncedRef.current) {
          const target = iframesRef.current[side === "A" ? "B" : "A"];
          target?.contentWindow?.postMessage({ type: "qga-camera-sync", pose: data.pose }, "*");
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const cameraSynced = ready.A && ready.B
    && window.QGA_COMPARE?.cameraSpacesCompatible(
      { view: sides[0]?.view, cameraSpace: sceneSpace.A },
      { view: sides[1]?.view, cameraSpace: sceneSpace.B });
  const cameraSyncedRef = useRef(cameraSynced);
  cameraSyncedRef.current = cameraSynced;

  // Push each side's render mode once its embed is ready.
  useEffect(() => {
    for (const side of ["A", "B"]) {
      if (!ready[side]) continue;
      const renderMode = sides[side === "A" ? 0 : 1]?.renderMode;
      if (!renderMode) continue;
      iframesRef.current[side]?.contentWindow?.postMessage({ type: "qga-embed-settings", vizMode: renderMode }, "*");
    }
  }, [ready, sides]);

  // ---- swipe divider: GPU overlay + critically damped spring inertia ----
  const dividerSpringRef = useRef(null);
  useEffect(() => {
    if (mode !== "swipe") return undefined;
    const MOTION = window.QGA_MOTION;
    if (!MOTION) return undefined;
    const spring = MOTION.createCriticallyDampedSpring({ omega: 16, initial: dividerRef.current });
    dividerSpringRef.current = spring;
    let overlay = null, overlayFailed = false;
    const canvas = shaderCanvasRef.current;
    if (canvas && !prm) {
      // Capability-gated GPU seam: software rasterizers refuse, failures and
      // slow first draws degrade to the CSS divider (never blocks the UI).
      try {
        overlay = window.QGA_COMPARE.createDividerOverlay(canvas, {
          softwareRendererClamp: window.QGA_RENDER?.softwareRendererClamp ?? null,
        });
        const rect = stageRef.current?.getBoundingClientRect();
        if (rect) overlay.resize(rect.width, rect.height);
        let drew = false;
        const watchdog = setTimeout(() => { if (!drew) { overlay.dispose(); overlay = null; overlayFailed = true; } }, 1500);
        overlay.render(dividerRef.current, 0);
        drew = true;
        clearTimeout(watchdog);
      } catch (error) {
        overlay = null; overlayFailed = true;
      }
    }
    // Keep the overlay canvas matched to the stage size.
    const resizeObserver = overlay && stageRef.current
      ? new ResizeObserver(() => {
          const rect = stageRef.current?.getBoundingClientRect();
          if (rect) overlay?.resize(rect.width, rect.height);
        })
      : null;
    resizeObserver?.observe(stageRef.current);
    let time = 0;
    const removeListener = MOTION.runtime.addFrameListener({
      onFrame: (now, dt) => {
        time += dt;
        const { position } = spring.step(dt);
        dividerRef.current = position;
        applyDivider(position);
        if (overlay) overlay.render(position, time, { reduced: prm });
      },
    });
    return () => {
      removeListener();
      resizeObserver?.disconnect();
      overlay?.dispose();
      dividerSpringRef.current = null;
    };
  }, [mode, prm]);

  const applyDivider = (x) => {
    const percent = (x * 100).toFixed(2) + "%";
    if (leftPaneRef.current) leftPaneRef.current.style.clipPath = `inset(0 ${100 - x * 100}% 0 0)`;
    if (rightPaneRef.current) rightPaneRef.current.style.clipPath = `inset(0 0 0 ${x * 100}%)`;
    if (handleRef.current) handleRef.current.style.left = percent;
    // Throttle the a11y/React value to whole percents.
    const whole = Math.round(x * 100);
    if (whole !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = whole;
      setDividerPercent(whole);
    }
  };
  const lastAnnouncedRef = useRef(-1);

  // Pointer drag on the seam handle drives the spring target (inertia).
  const onHandlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const stage = stageRef.current.getBoundingClientRect();
    const move = (event) => {
      const x = Math.min(1, Math.max(0, (event.clientX - stage.left) / stage.width));
      dividerSpringRef.current?.setTarget(x, { snap: prm });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const onHandleKeyDown = (e) => {
    const step = e.shiftKey ? 0.01 : 0.05;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      dividerSpringRef.current?.setTarget(Math.max(0, dividerRef.current - step), { snap: prm });
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      dividerSpringRef.current?.setTarget(Math.min(1, dividerRef.current + step), { snap: prm });
    } else if (e.key === "Home") { e.preventDefault(); dividerSpringRef.current?.setTarget(0, { snap: prm }); }
    else if (e.key === "End") { e.preventDefault(); dividerSpringRef.current?.setTarget(1, { snap: prm }); }
  };

  const preset = window.QGA_COMPARE?.COMPARE_PRESETS.find((entry) => entry.id === presetId);

  return (
    <div className="compare-view" data-ready-a={ready.A ? "true" : "false"} data-ready-b={ready.B ? "true" : "false"}
      data-camera-synced={cameraSynced ? "true" : "false"} data-preset={presetId}>
      <header className="compare-head">
        <div>
          <div className="module-kicker">Prompt 10 · A/B comparison</div>
          <h1>Compare two validated states</h1>
          <p className="module-lede">{preset?.description ?? "Side-by-side or swipe comparison of two atlas states."}</p>
        </div>
        <button className="btn" onClick={() => go("overview")}>← Back to the atlas</button>
      </header>
      <div className="section-head" style={{ marginTop: 4 }}>
        <h2>Comparison stage</h2>
      </div>
      <div className="compare-toolbar viz-toolbar" role="toolbar" aria-label="Comparison controls">
        <span className="seg">
          {window.QGA_COMPARE?.COMPARE_PRESETS.map((entry) => (
            <button key={entry.id} className={"btn" + (entry.id === presetId ? " on" : "")}
              aria-pressed={entry.id === presetId} onClick={() => switchPreset(entry.id)}>{entry.label}</button>
          ))}
        </span>
        <span className="seg">
          <button className={"btn" + (mode === "swipe" ? " on" : "")} aria-pressed={mode === "swipe"}
            onClick={() => setMode("swipe")}>Swipe</button>
          <button className={"btn" + (mode === "side-by-side" ? " on" : "")} aria-pressed={mode === "side-by-side"}
            onClick={() => setMode("side-by-side")}>Side by side</button>
        </span>
        <span className={"compare-sync-badge" + (cameraSynced ? " on" : "")} role="status"
          title={cameraSynced ? "Both scenes declared a compatible orbit camera space" : "Scenes orbit independently"}>
          {cameraSynced ? "◎ cameras synced" : "camera not synced"}
        </span>
      </div>
      <div className={"compare-stage" + (mode === "swipe" ? " swipe" : "")} ref={stageRef}>
        <div className={"compare-pane" + (mode === "swipe" ? " clipped" : "")} ref={leftPaneRef}>
          <div className="compare-pane-label">{sides[0]?.label}</div>
          <iframe ref={(node) => { iframesRef.current.A = node; }} title={"Comparison side A: " + (sides[0]?.label ?? "")}
            src={mountedUrls.A} className="compare-iframe"></iframe>
        </div>
        <div className={"compare-pane" + (mode === "swipe" ? " clipped" : "")} ref={rightPaneRef}>
          <div className="compare-pane-label compare-pane-label-b">{sides[1]?.label}</div>
          <iframe ref={(node) => { iframesRef.current.B = node; }} title={"Comparison side B: " + (sides[1]?.label ?? "")}
            src={mountedUrls.B} className="compare-iframe"></iframe>
        </div>
        {mode === "swipe" ? (
          <React.Fragment>
            <canvas ref={shaderCanvasRef} className="compare-divider-canvas" aria-hidden="true"></canvas>
            <div className="compare-divider-css" aria-hidden="true"></div>
            <button className="compare-handle" ref={handleRef} role="slider"
              aria-label="Comparison divider — drag or use arrow keys to reveal each side"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={dividerPercent}
              onPointerDown={onHandlePointerDown} onKeyDown={onHandleKeyDown}
              style={{ left: dividerPercent + "%" }}></button>
          </React.Fragment>
        ) : null}
        {(!ready.A || !ready.B) && mode === "swipe" ? <div className="compare-loading" role="status">Loading comparison scenes…</div> : null}
      </div>
      <VizCaption status="schematic">
        Each side is a full, independently validated atlas state (URL-clamped parameters, seeded physics).
        {cameraSynced
          ? " Both scenes declared the same orbit camera space, so dragging one camera moves both."
          : " The scenes currently orbit independently."}
        Parameter changes tween over 700 ms with every physical quantity recomputed each frame — nothing is baked.
      </VizCaption>
    </div>
  );
}

window.CompareView = CompareView;

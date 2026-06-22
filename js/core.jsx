// core.jsx — shared scientific UI components for Quantum Gravity Atlas
const { useState, useEffect, useRef, useMemo, useCallback, useContext } = React;

/* ---------- global atlas settings (visualization mode, motion, detail, pathway) ---------- */
const QGA_SETTINGS_DEFAULTS = {
  vizMode: "cinematic",      // scientific | cinematic | minimal
  motion: "balanced",        // reduced | balanced | full
  detail3d: "medium",        // low | medium | ultra
  labels3d: true,
  annotations3d: true,
  pathway: "student",        // beginner | student | advanced
};
const AtlasSettingsContext = React.createContext(QGA_SETTINGS_DEFAULTS);
function useAtlasSettings() { return useContext(AtlasSettingsContext); }

/* ---------- hooks ---------- */
function usePRM() {
  const [prm, setPrm] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = (e) => setPrm(e.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return prm;
}

// Canvas helper: fits canvas to its CSS box at devicePixelRatio, returns logical dims.
function fitCanvas(canvas) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(10, r.width), h = Math.max(10, r.height);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// Generic simulation loop. draw(ctx, w, h, t, dt) is called each frame while playing.
// Returns canvas ref + control state for SimBar.
function useSimLoop(draw, deps = []) {
  const canvasRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [resetCount, setResetCount] = useState(0);
  const tRef = useRef(0);
  const playingRef = useRef(true);
  const speedRef = useRef(1);
  playingRef.current = playing;
  speedRef.current = speed;
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => { tRef.current = 0; }, [resetCount]);

  useEffect(() => {
    let raf, last = performance.now(), alive = true, visible = true;
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.02 });
    if (canvasRef.current) io.observe(canvasRef.current);
    const tick = (now) => {
      if (!alive) return;
      raf = requestAnimationFrame(tick);
      const cv = canvasRef.current;
      if (cv && visible) {
        const rawDt = Math.min(0.05, (now - last) / 1000);
        const dt = playingRef.current ? rawDt * speedRef.current : 0;
        tRef.current += dt;
        const { ctx, w, h } = fitCanvas(cv);
        drawRef.current(ctx, w, h, tRef.current, dt);
      }
      last = now;
    };
    raf = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); };
  }, deps); // eslint-disable-line
  const reset = useCallback(() => setResetCount((c) => c + 1), []);
  return { canvasRef, playing, setPlaying, speed, setSpeed, reset, resetCount, tRef };
}

/* ---------- equation rendering (KaTeX) ---------- */
function Eq({ tex, display = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.katex) {
      try { window.katex.render(tex, el, { displayMode: display, throwOnError: false }); }
      catch (e) { el.textContent = tex; }
    } else {
      el.textContent = tex;
      // katex may still be loading; retry once shortly after
      const id = setTimeout(() => {
        if (window.katex && ref.current) {
          try { window.katex.render(tex, ref.current, { displayMode: display, throwOnError: false }); } catch (e) {}
        }
      }, 600);
      return () => clearTimeout(id);
    }
  }, [tex, display]);
  return <span ref={ref} className={display ? "eq-display" : "eq-inline"}></span>;
}

/* ---------- badges ---------- */
const BADGE_LABELS = {
  established: "Established physics",
  effective: "Effective theory",
  conjectural: "Conjectural",
  schematic: "Schematic",
  heuristic: "Heuristic picture",
  open: "Open problem",
};
function Badge({ kind }) {
  return <span className={"badge badge-" + kind}>{BADGE_LABELS[kind] || kind}</span>;
}

/* ---------- formula card with built-in Formula Lens ---------- */
function FormulaCard({ title, tex, status, symbols = [], meaning, limits }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"formula-card" + (open ? " open" : "")}>
      <button className="fc-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="fc-title-row">
          <span className="fc-title">{title}</span>
          {status ? <Badge kind={status}></Badge> : null}
        </div>
        <div className="fc-eq"><Eq tex={tex} display={true}></Eq></div>
        <span className="fc-hint">{open ? "− collapse lens" : "+ formula lens · symbols & meaning"}</span>
      </button>
      {open ? (
        <div className="fc-body">
          {symbols.length > 0 ? (
            <table className="fc-symbols">
              <tbody>
                {symbols.map((s, i) => (
                  <tr key={i}>
                    <td><Eq tex={s.s}></Eq></td>
                    <td>{s.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {meaning ? <p className="fc-meaning">{meaning}</p> : null}
          {limits ? <p className="fc-limits"><strong>Assumptions / limits.</strong> {limits}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- misconception alert ---------- */
function Misconception({ title, children }) {
  return (
    <div className="misconception">
      <div className="misc-label">Misconception alert</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

/* ---------- layout pieces ---------- */
function Section({ index, title, children }) {
  return (
    <section className="section">
      <div className="section-head">
        {index ? <span className="section-index">{index}</span> : null}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ModuleHeader({ num, kicker, title, lede, label }) {
  return (
    <header data-screen-label={label || title}>
      <div className="module-kicker">Module {num} — {kicker}</div>
      <h1>{title}</h1>
      <p className="module-lede">{lede}</p>
    </header>
  );
}

/* ---------- controls ---------- */
function SliderRow({ label, min, max, step, value, onChange, format }) {
  return (
    <div className="ctl-row">
      <span className="ctl-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} aria-label={label}></input>
      <span className="ctl-value">{format ? format(value) : value}</span>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <span className="toggle-row" onClick={() => onChange(!checked)} role="switch" aria-checked={checked} tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(!checked); } }}>
      <span className={"toggle-track" + (checked ? " on" : "")}><span className="toggle-dot"></span></span>
      <span className="ctl-label" style={{ color: checked ? "var(--text)" : undefined }}>{label}</span>
    </span>
  );
}

function SimBar({ sim, children }) {
  return (
    <div className="viz-toolbar viz-toolbar-bottom">
      <span className="seg">
        <button className={"btn" + (sim.playing ? " on" : "")} onClick={() => sim.setPlaying(true)}>Play</button>
        <button className={"btn" + (!sim.playing ? " on" : "")} onClick={() => sim.setPlaying(false)}>Pause</button>
      </span>
      <span className="seg">
        <button className={"btn" + (sim.speed === 0.25 ? " on" : "")} onClick={() => sim.setSpeed(0.25)}>0.25×</button>
        <button className={"btn" + (sim.speed === 1 ? " on" : "")} onClick={() => sim.setSpeed(1)}>1×</button>
      </span>
      <button className="btn" onClick={sim.reset}>Reset</button>
      {children}
    </div>
  );
}

function VizCaption({ status, children }) {
  return (
    <div className="viz-caption">
      {status ? <Badge kind={status}></Badge> : null}
      <span>{children}</span>
    </div>
  );
}

/* ---------- status legend (epistemic key) ---------- */
function StatusLegend() {
  const items = [
    ["established", "experimentally confirmed physics"],
    ["effective", "rigorous within a limited energy domain"],
    ["schematic", "simplified pedagogical rendering"],
    ["heuristic", "intuition aid — not the actual derivation"],
    ["conjectural", "mathematically serious, experimentally unconfirmed"],
    ["open", "unsolved research question"],
  ];
  return (
    <div className="status-legend">
      {items.map(([k, d]) => (
        <span key={k} className="status-legend-item"><Badge kind={k}></Badge><span>{d}</span></span>
      ))}
    </div>
  );
}

/* ---------- concept bridge (pathway-aware module connector) ---------- */
function ConceptBridge({ id, go }) {
  const { pathway } = useAtlasSettings();
  const b = (window.QGA_BRIDGES || []).find((x) => x.id === id);
  if (!b) return null;
  const text = b[pathway] || b.student;
  return (
    <aside className="bridge" aria-label="Concept bridge to next module">
      <div className="bridge-text">
        <div className="bridge-kicker">Concept bridge · {b.from} → {b.to}</div>
        <p>{text}</p>
      </div>
      {go ? <button className="bridge-go" onClick={() => go(b.next)}>Continue → {b.to}</button> : null}
    </aside>
  );
}

/* ---------- ambient cosmic background ----------
   Module-aware depth starfield: three parallax layers, a slow hue drift
   toward the active module's tint, and subtle pointer parallax. Fully
   static under prefers-reduced-motion or motion="reduced". */
function Starfield({ enabled = true, motionScale = 1, hue = 226 }) {
  const prm = usePRM();
  const ref = useRef(null);
  const hueTargetRef = useRef(hue); hueTargetRef.current = hue;
  const motionRef = useRef(motionScale); motionRef.current = motionScale;
  useEffect(() => {
    const cv = ref.current;
    if (!cv || !enabled) return;
    let raf, alive = true;
    const stars = [];
    for (let i = 0; i < 170; i++) {
      const z = 0.25 + Math.random() * 0.75; // depth: far (0.25) → near (1)
      stars.push({
        x: Math.random(), y: Math.random(), z,
        r: 0.35 + z * 1.15,
        p: Math.random() * Math.PI * 2,
        s: 0.3 + Math.random() * 0.7,
      });
    }
    let hueNow = hueTargetRef.current;
    const mouse = { x: 0.5, y: 0.5, ex: 0.5, ey: 0.5 };
    const onMove = (e) => { mouse.x = e.clientX / window.innerWidth; mouse.y = e.clientY / window.innerHeight; };
    window.addEventListener("mousemove", onMove, { passive: true });
    const draw = (now) => {
      if (!alive) return;
      const mo = prm ? 0 : motionRef.current;
      const { ctx, w, h } = fitCanvas(cv);
      ctx.clearRect(0, 0, w, h);
      hueNow += (hueTargetRef.current - hueNow) * 0.03;
      mouse.ex += (mouse.x - mouse.ex) * 0.04 * (mo > 0 ? 1 : 0);
      mouse.ey += (mouse.y - mouse.ey) * 0.04 * (mo > 0 ? 1 : 0);
      const px = (mouse.ex - 0.5) * 26 * mo, py = (mouse.ey - 0.5) * 18 * mo;
      // faint coordinate grid
      ctx.strokeStyle = "hsla(" + hueNow.toFixed(0) + ", 45%, 65%, 0.035)";
      ctx.lineWidth = 1;
      const g = 90;
      ctx.beginPath();
      for (let x = 0; x <= w; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += g) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
      // module-tinted cosmic glow
      const grad = ctx.createRadialGradient(w * 0.75 - px * 2, h * 0.08 - py * 2, 0, w * 0.75, h * 0.1, Math.max(w, h) * 0.9);
      grad.addColorStop(0, "hsla(" + hueNow.toFixed(0) + ", 50%, 42%, 0.1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      const t = (mo > 0 ? now / 1000 : 0) * mo;
      const starCol = "hsl(" + hueNow.toFixed(0) + ", 38%, 80%)";
      for (const st of stars) {
        const tw = mo > 0 ? 0.45 + 0.4 * Math.sin(t * st.s + st.p) : 0.6;
        ctx.globalAlpha = Math.max(0.08, tw * (0.3 + st.z * 0.35));
        ctx.fillStyle = starCol;
        ctx.beginPath();
        ctx.arc(st.x * w + px * st.z, st.y * h + py * st.z, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); };
  }, [enabled, prm]);
  if (!enabled) return null;
  return <canvas ref={ref} className="starfield-canvas"></canvas>;
}

/* ---------- formatting helpers ---------- */
function sciNotation(x, digits = 3) {
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  const m = x / Math.pow(10, e);
  if (e >= -2 && e <= 3) return x.toPrecision(digits);
  return m.toFixed(digits - 1) + "×10" + supScript(e);
}
function supScript(n) {
  const map = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  return String(n).split("").map((c) => map[c] || c).join("");
}

Object.assign(window, {
  usePRM, fitCanvas, useSimLoop, Eq, Badge, FormulaCard, Misconception,
  Section, ModuleHeader, SliderRow, Toggle, SimBar, VizCaption, Starfield,
  sciNotation, supScript, StatusLegend, ConceptBridge,
  AtlasSettingsContext, useAtlasSettings, QGA_SETTINGS_DEFAULTS,
  useState, useEffect, useRef, useMemo, useCallback,
});

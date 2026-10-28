// penrose-atlas.jsx — conformal diagrams from exact coordinate maps (S19).
//
// The science is js/science/conformal.mjs (window.QGA_CONFORMAL), the picture is js/visualizations/gr/penrose.mjs, and
// this file holds the slider, the release button, the region overlay and the formula cards. Every number shown is
// computed by that module; nothing here invents one.

/** The stage height is derived from the drawn aspect of the atlas, so a wide stage is not mostly empty. */
const PN_FALLBACK_WIDTH = 1100;
/** Infall radii the slider offers, in units of M. Below 2.6M the fall is over almost at once. */
const PN_R0 = Object.freeze({ min: 2.6, max: 30, step: 0.2 });
/**
 * A fall from rest at a large radius crosses the horizon within a hair of i+ in the diagram, because the map compresses
 * the whole exterior into the wedge beside it: at r0 = 10M the curve's interior leg is six thousandths of a diagram
 * unit long. 2.6M — just outside the horizon — is where the fall is legible as a curve rather than as a line hugging a
 * corner, and the slider is there to show how the crossing moves out toward i+ as r0 grows.
 */
const PN_DEFAULT_R0 = 2.6;
/** A small field of view from far away: the diagrams are a flat map, so the projection has to stay close to orthographic. */
const PN_FOV = 13;

function PenroseAtlas() {
  const C = window.QGA_CONFORMAL;
  const [r0, setR0] = useState(PN_DEFAULT_R0);
  const [focused, setFocused] = useState(null);
  const [released, setReleased] = useState("idle");
  const reduced = usePRM();
  const wrap = useRef(null);
  const [width, setWidth] = useState(0);
  const atlas = useRef(null);
  const latest = useRef({ r0 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => setWidth(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const geometry = C.geometry;
  const fall = useMemo(() => C.freeFallFromRest({ r0, M: 1, samples: 361 }), [r0]);
  const regionsById = useMemo(() => {
    const out = {};
    for (const id of ["minkowski", "schwarzschild", "reissner-nordstrom"]) for (const region of C.regions(id)) out[region.id] = region;
    return out;
  }, []);
  const regionList = useMemo(() => Object.values(regionsById), [regionsById]);
  const active = focused ? regionsById[focused] ?? null : null;

  // The scene rebuilds whenever the frame changes (that is what `deps` means), and a rebuilt scene starts from its own
  // defaults. Everything the controls show therefore has to be replayed into it, or the picture and the readouts would
  // disagree: `latest` is the state the controls are in, read by `build`.
  latest.current = { r0, released };

  // The scene reports the region under the pointer or the keyboard back to the overlay.
  useEffect(() => {
    const handle = atlas.current;
    if (!handle?.onFocusChange) return undefined;
    return handle.onFocusChange(setFocused);
  }, [atlas.current]);

  const stage = useMemo(() => {
    const span = width || PN_FALLBACK_WIDTH;
    const height = geometry.stageHeight(span);
    return { height, radius: geometry.framing(PN_FOV, span / height) };
  }, [width, geometry]);

  // The slider drives the live scene in place, so changing the radius does not rebuild it.
  useEffect(() => {
    if (!atlas.current) return;
    atlas.current.setStartRadius(r0);
    setReleased("idle");
  }, [r0]);

  const build = async (ctx) => {
    const { buildPenroseAtlas } = await C.loadAtlas();
    const handle = await buildPenroseAtlas(ctx);
    atlas.current = handle;
    // Replay the controls into the new scene: the radius the reader chose, and the cursor if it had been run.
    handle.setStartRadius(latest.current.r0);
    if (latest.current.released !== "idle") handle.release();
    handle.onFocusChange?.(setFocused);
    // QA hook, like window.__qgaRgFlow3d: qa/specs/penrose-atlas.spec.mjs reads the atlas it is looking at, rather
    // than guessing which entry of the shared scene registry is the current one.
    window.__qgaPenroseAtlas = handle;
    return handle;
  };

  const release = () => {
    const result = atlas.current?.release?.() ?? "idle";
    setReleased(result);
  };

  // Keyboard cycling of the regions: the overlay is a real control, not a decoration.
  const cycle = (event) => {
    if (!regionList.length) return;
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const index = regionList.findIndex((region) => region.id === focused);
    const next = (index + step + regionList.length) % regionList.length;
    setFocused(regionList[next].id);
    atlas.current?.focusRegion(regionList[next].id);
  };

  const status = (id) => (id === "gr-penrose-reissner-nordstrom" ? "schematic" : "established");

  return (
    <div className="viz-frame pn-lab">
      <div ref={wrap}>
        <Scene3D animated={false} height={stage.height} deps={[stage.radius]}
          aria="Three conformal diagrams side by side. Left: flat Minkowski spacetime on its causal diamond, with the infinity points i-minus, i-zero and i-plus and the null-infinity edges. Middle: the maximally extended Schwarzschild solution, with regions one and three the two exteriors, region two the black-hole interior, region four the white-hole interior, the four horizons on the diagonals, the two singularities at r = 0 along the top and bottom edges, and the free fall from rest at r-zero as the heavy curve. Right: one block of the Reissner-Nordstrom extension, drawn as a labelled schematic."
          initial={{ radius: stage.radius, theta: 0, phi: 0.02, fov: PN_FOV, minR: stage.radius * 0.55, maxR: stage.radius * 1.8, target: [0, 0, 0] }}
          build={build}
          fallback={<div className="lab-fallback">The diagrams need WebGL. The readouts below are computed without it.</div>}></Scene3D>
      </div>

      <p className="pn-note">{C.RN_SCHEMATIC.note}</p>

      <VizCaption provenanceId="gr-penrose-atlas" status="established">
        Three conformal diagrams, drawn from the coordinate maps of <Eq tex="js/science/conformal.mjs"></Eq> and
        evaluated in the browser. Left, flat Minkowski spacetime: <Eq tex="U=\arctan(t-r)"></Eq>,{" "}
        <Eq tex="V=\arctan(t+r)"></Eq>, so the whole of spacetime becomes a diamond and every light ray is at 45 degrees.
        Middle, the Schwarzschild solution in Kruskal–Szekeres coordinates from the tortoise{" "}
        <Eq tex="r^*=r+2M\ln|r/2M-1|"></Eq>: four regions meet at the horizons on the diagonals, and the singularity at{" "}
        <Eq tex="r=0"></Eq> is the two horizontal edges. The heavy curve is a radial free fall from rest at{" "}
        <Eq tex={String.raw`r_0=${r0.toFixed(1)}M`}></Eq>, and the small crosses along it are light cones at equal steps of
        proper time: they crowd where the diagram compresses the fall, not where the fall speeds up. Right, one block of
        the Reissner–Nordström extension, drawn as a labelled <strong>schematic</strong>: it is not computed.
      </VizCaption>

      <div className="viz-toolbar pn-bar" role="group" aria-label="Infall">
        <div className="pn-range">
          <span className="ctl-label"><Eq tex="r_0"></Eq></span>
          <input type="range" min={PN_R0.min} max={PN_R0.max} step={PN_R0.step} value={r0}
            aria-label="infall start radius in units of M"
            onChange={(e) => setR0(parseFloat(e.target.value))}></input>
          <span className="ctl-value"><Eq tex={String.raw`${r0.toFixed(1)}M`}></Eq></span>
        </div>
        <button type="button" className="btn pn-release" onClick={release} disabled={reduced && released === "snapped"}>
          release
        </button>
      </div>

      <div className="pn-regions">
        <div className="pn-region-list" role="group" aria-label="Regions of the diagrams" tabIndex={0} onKeyDown={cycle}>
          {regionList.map((region) => (
            <button key={region.id} type="button" className={"btn pn-region" + (focused === region.id ? " on" : "")}
              aria-pressed={focused === region.id}
              onMouseEnter={() => { setFocused(region.id); atlas.current?.focusRegion(region.id); }}
              onFocus={() => { setFocused(region.id); atlas.current?.focusRegion(region.id); }}
              onClick={() => { setFocused(region.id); atlas.current?.focusRegion(region.id); }}>
              <span className="pn-region-id">{region.id}</span>
              <span className="pn-region-name">{region.name}</span>
            </button>
          ))}
        </div>
        <div className="pn-overlay" role="status" aria-live="polite">
          {active ? (
            <React.Fragment>
              <div className="pn-overlay-title"><Eq tex={regionTex(active)}></Eq>{active.name}</div>
              <p className="pn-overlay-body">{active.meaning}</p>
            </React.Fragment>
          ) : (
            <p className="pn-overlay-body pn-overlay-hint">
              Point at a region, or use the arrow keys here, to read what each one means. Arrow keys cycle; the
              regions are also buttons.
            </p>
          )}
        </div>
      </div>

      <div className="pn-readouts" role="status" aria-live="polite">
        <div className="readout"><div className="readout-label">horizon crossing</div>
          <div className="readout-value"><Eq tex={pnPointTex(fall.horizonCrossing)}></Eq></div></div>
        <div className="readout"><div className="readout-label">proper time to <Eq tex="r=0"></Eq></div>
          <div className="readout-value"><Eq tex={String.raw`\tau=${fall.properTimeEnd.toFixed(3)}\,M`}></Eq></div></div>
        <div className="readout"><div className="readout-label"><Eq tex="\eta"></Eq> at the horizon</div>
          <div className="readout-value"><Eq tex={String.raw`${fall.etaHorizon.toFixed(4)}`}></Eq></div></div>
        <div className="readout"><div className="readout-label">coordinate time <Eq tex="t"></Eq> at <Eq tex="r_0"></Eq></div>
          <div className="readout-value"><Eq tex={String.raw`0`}></Eq><span className="unit">the fall starts at rest</span></div></div>
      </div>

      <VizCaption provenanceId="gr-penrose-schwarzschild" status="established">
        The Schwarzschild panel's numbers. The free fall crosses the horizon at a finite point of the diagram —{" "}
        <Eq tex={pnPointTex(fall.horizonCrossing)}></Eq> — because the Kruskal coordinates are smooth there even though the
        exterior coordinate time <Eq tex="t"></Eq> diverges; that divergence is why the curve is carried by{" "}
        <Eq tex="U"></Eq> and <Eq tex="V"></Eq> rather than by <Eq tex="t"></Eq>. It then meets the singularity at{" "}
        <Eq tex="r=0"></Eq>, which is the edge <Eq tex="T=\pi/2"></Eq>, and ends there. The proper time to the singularity is{" "}
        <Eq tex={String.raw`\tau=\sqrt{r_0^3/8M}\,(\eta+\sin\eta)`}></Eq> evaluated at <Eq tex="\eta=\pi"></Eq>. The crossing
        moves toward the corner as <Eq tex={String.raw`r_0`}></Eq> grows and toward the centre of the diagram as it shrinks:
        everything the fall does is set by the ratio <Eq tex={String.raw`r_0/M`}></Eq>.
      </VizCaption>

      <div className="formula-grid">
        <FormulaCard title="Tortoise coordinate" formulaId="penrose-tortoise" status="established"
          symbols={[
            { s: "r", d: "Schwarzschild radial coordinate." },
            { s: "r^*", d: "The tortoise coordinate: the radial coordinate in which light rays move at 45 degrees. It goes to $-\\infty$ at the horizon, which is what the Kruskal chart repairs." },
            { s: "M", d: "Black-hole mass, a length in geometric units ($G=c=1$)." },
          ]}
          meaning="A change of radial coordinate that stretches the region near the horizon without bound. Written with the absolute value it is defined inside the horizon too, which is what makes the maximal extension possible."
          limits="Geometric units. $r^*\\to-\\infty$ at $r=2M$ and $r^*\\to+\\infty$ as $r\\to\\infty$; the coordinate covers each side of the horizon separately."></FormulaCard>
        <FormulaCard title="Kruskal coordinates" formulaId="penrose-compact-t" status="established"
          symbols={[
            { s: "U", d: "Retarded null coordinate, $U=-e^{-(t-r^*)/4M}$. Vanishes on the horizon, negative in region I and positive in region II." },
            { s: "V", d: "Advanced null coordinate, $V=e^{(t+r^*)/4M}$. Positive everywhere and zero on the horizon." },
            { s: "T", d: "The compactified time of the diagram, $T=\\arctan U+\\arctan V$." },
          ]}
          meaning="The chart in which the horizon is not a coordinate singularity: $U$ and $V$ are smooth across it. Compactifying both with the same arctan turns the infinite Kruskal plane into the finite diagram and keeps every light ray at 45 degrees."
          limits="The compactification is not a physical change: $T$ and $R$ have no units of time or length, and distances on the diagram are not proper distances."></FormulaCard>
        <FormulaCard title="Compactified radial coordinate" formulaId="penrose-compact-r" status="established"
          symbols={[
            { s: "R", d: "The compactified radial coordinate, $R=\\arctan V-\\arctan U$." },
            { s: "U", d: "Retarded null coordinate." },
            { s: "V", d: "Advanced null coordinate." },
          ]}
          meaning="With $T=\\arctan U+\\arctan V$ this completes the map from the Kruskal plane to the diagram. Because only one of $U$ and $V$ moves along a light ray, every null direction comes out at exactly 45 degrees."
          limits="Region I is $R>|T|$, region II $T>|R|$, region III $R<-|T|$ and region IV $T<-|R|$: the four wedges between the horizons."></FormulaCard>
      </div>

      <VizCaption provenanceId="gr-penrose-reissner-nordstrom" status="schematic">
        The right-hand panel is a <strong>schematic</strong> and is labelled as one in the canvas. It states three things:
        that <Eq tex="r_+"></Eq> and <Eq tex="r_-"></Eq> are null surfaces, so the diagram edges they form run at 45 degrees;
        that the singularity at <Eq tex="r=0"></Eq> is <em>timelike</em> — a vertical line here, where Schwarzschild's is
        horizontal — and so can be avoided; and that the regions nest <Eq tex="r>r_+"></Eq>, then{" "}
        <Eq tex="r_-<r<r_+"></Eq>, then <Eq tex="0<r<r_-"></Eq>. The exact maximal extension is an infinite chain of such
        blocks joined at <Eq tex="r_-"></Eq>, which is a Cauchy horizon: data on it does not determine the future. Charged
        black holes with <Eq tex="|Q|"></Eq> comparable to <Eq tex="M"></Eq> are not expected to exist in the sky — the
        surrounding plasma neutralises them — so this panel is about the structure of the solution, not about an object.
      </VizCaption>
    </div>
  );
}

/** The (T, R) of a diagram point as TeX, to three decimals: the readouts above show exactly these numbers. */
function pnPointTex(point) {
  return String.raw`T=${point.T.toFixed(3)},\quad R=${point.R.toFixed(3)}`;
}

/** A region's defining relation as TeX, for the overlay title. */
function regionTex(region) {
  switch (region.id) {
    case "I": return String.raw`\text{I}`;
    case "II": return String.raw`\text{II}`;
    case "III": return String.raw`\text{III}`;
    case "IV": return String.raw`\text{IV}`;
    case "M": return String.raw`\text{M}`;
    case "E": return String.raw`r>r_+`;
    case "C": return String.raw`r_-<r<r_+`;
    case "S": return String.raw`r=0`;
    default: return String.raw`\text{${region.id}}`;
  }
}

window.PenroseAtlas = PenroseAtlas;

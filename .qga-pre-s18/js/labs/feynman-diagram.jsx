// feynman-diagram.jsx — one Feynman diagram of the QFT builder (S16). The geometry comes from js/visualizations/qft/feynman-svg.mjs through
// window.QGA_FEYNMAN.layout; the lines, arrows and vertex dots are SVG, and the labels are KaTeX spans laid over it at the positions the layout
// returns. Colours are design tokens read here, so the diagram follows the theme. Nothing moves: the diagram is a figure, and the collision
// animation above it carries the motion.

const FEYNMAN_ROLE_TOKENS = {
  fermion: "ink", photon: "cat-1", boson: "cat-6", gluon: "cat-7", scalar: "ink-dim",
  vertex: "accent", momentum: "ink-dim",
};
const FEYNMAN_ANCHOR_SHIFT = { start: "translate(0, -50%)", middle: "translate(-50%, -50%)", end: "translate(-100%, -50%)" };
const FEYNMAN_ARROW = "-4,-3.5 4,0 -4,3.5";

function FeynmanDiagram({ def, ariaLabel }) {
  const F = window.QGA_FEYNMAN;
  const [theme, setTheme] = useState(0);
  useEffect(() => window.QGA_TOKENS.onThemeChange(() => setTheme((t) => t + 1)), []);
  const layout = useMemo(() => F.layout(def), [def]);
  const paint = useMemo(
    () => Object.fromEntries(Object.entries(FEYNMAN_ROLE_TOKENS).map(([role, token]) => [role, window.QGA_TOKENS.css(token)])),
    [theme]);
  const { width, height } = F.DIAGRAM_SIZE;
  const degrees = (radians) => (radians * 180) / Math.PI;
  return (
    <div className="fey-diagram" role="img" aria-label={ariaLabel}>
      <svg viewBox={"0 0 " + width + " " + height} aria-hidden="true" focusable="false">
        {layout.paths.map((p) =>
        <path key={"p" + p.index} d={p.d} fill="none" stroke={paint[p.kind === "antifermion" ? "fermion" : p.kind]} strokeWidth={p.width}
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray={p.dash || undefined}></path>
        )}
        {layout.arrows.map((a) =>
        <polygon key={"a" + a.index} points={FEYNMAN_ARROW} fill={paint.fermion}
        transform={"translate(" + a.x.toFixed(2) + "," + a.y.toFixed(2) + ") rotate(" + degrees(a.angle).toFixed(2) + ")"}></polygon>
        )}
        {layout.momenta.map((m) =>
        <g key={"m" + m.index}>
            <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={paint.momentum} strokeWidth="1"></line>
            <polygon points={FEYNMAN_ARROW} fill={paint.momentum}
            transform={"translate(" + m.x2.toFixed(2) + "," + m.y2.toFixed(2) + ") rotate(" + degrees(m.angle).toFixed(2) + ") scale(0.8)"}></polygon>
          </g>
        )}
        {layout.dots.map((d) => <circle key={d.id} cx={d.x} cy={d.y} r={d.r} fill={paint.vertex}></circle>)}
      </svg>
      <div className="fey-tex-layer" aria-hidden="true">
        {layout.labels.map((l, i) =>
        <span key={i} className={"fey-tex" + (l.momentum ? " fey-tex-momentum" : "")}
        style={{ left: (100 * l.x / width) + "%", top: (100 * l.y / height) + "%", transform: FEYNMAN_ANCHOR_SHIFT[l.anchor] }}>
            <Eq tex={l.tex}></Eq>
          </span>
        )}
      </div>
    </div>);

}

/* The key to the line conventions: one line of every kind the drawing knows, folded away until asked for. */
function FeynmanLegend() {
  const def = useMemo(() => window.QGA_FEYNMAN.legendDiagram(), []);
  return (
    <details className="fey-legend">
      <summary>Line conventions</summary>
      <FeynmanDiagram def={def}
      ariaLabel="Key to the lines of the diagrams: fermion, antifermion, photon, W or Z boson, gluon and scalar."></FeynmanDiagram>
    </details>);

}

/* Every tree diagram of the process the builder analysed (`result.channels`: s; s and t for Bhabha; t and u for Moller; s and u for
   Compton), one figure each, for the external particles `ids` = [in1, in2, out1, out2] of FEY_PARTICLES. */
const FEYNMAN_CHANNEL_NAMES = { s: "s channel", t: "t channel", u: "u channel" };

function FeynmanDiagramSet({ result, ids }) {
  const F = window.QGA_FEYNMAN;
  const key = ids.join("|") + "|" + result.topo;
  const diagrams = useMemo(() => {
    const ends = ids.map((id) => {
      const p = FEY_PARTICLES.find((q) => q.id === id);
      return { tex: p.tex, plain: p.label.split(" ")[0], anti: p.anti, photon: p.type === "photon" };
    });
    return result.channels.map((channel) => ({
      channel,
      def: F.diagramFor({ topo: result.topo, channel, boson: result.bosonTex, ends }),
      label: F.describeDiagram({ topo: result.topo, channel, ends }),
    }));
  }, [key]);
  return (
    <div className={"fey-diagram-set" + (diagrams.length > 1 ? " fey-diagram-pair" : "")}>
      {diagrams.map((d) =>
      <figure key={d.channel} className="fey-diagram-fig">
          <figcaption className="fey-diagram-cap">{diagrams.length > 1 ? FEYNMAN_CHANNEL_NAMES[d.channel] + " · " : ""}time <span aria-hidden="true">→</span></figcaption>
          <FeynmanDiagram def={d.def} ariaLabel={d.label}></FeynmanDiagram>
        </figure>
      )}
    </div>);

}

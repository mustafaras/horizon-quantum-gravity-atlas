// S29: the atlas map — the whole argument as one navigable graph, below the Arena of Scales on the overview.
//
// The layout is committed (js/science/data/atlas-map-layout.mjs), so this draws and never simulates: an SVG graph, not a
// WebGL scene. That is deliberate. The overview already runs two WebGL scenes and the performance contract forbids
// making its first frame slower by more than 5 %; a third context for 30 static discs would buy nothing the SVG does
// not already give — crisp engraved lines at any DPR, real focus rings, and text that a screen reader can read.
//
// Keyboard: arrow keys walk the graph along its edges, Enter opens the chapter, Escape clears the selection. The
// selection also drives a detail panel, and the whole graph has a text alternative.
function AtlasMap({ go }) {
  const M = window.QGA_ATLAS_MAP;
  const { ATLAS_MAP_LAYOUT } = window.QGA_ATLAS_MAP_LAYOUT;
  const [theme, setTheme] = useState(0);
  const [selectedId, setSelectedId] = useState("planck");
  const reduced = usePRM();
  const wrap = useRef(null);
  const [size, setSize] = useState({ width: 900, height: 620 });

  useEffect(() => window.QGA_TOKENS.onThemeChange(() => setTheme((t) => t + 1)), []);

  const nodes = useMemo(() => M.atlasNodes(), []);
  const edges = useMemo(() => M.atlasEdges(), []);
  const adjacency = useMemo(() => M.atlasAdjacency(edges), [edges]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const textAlternative = useMemo(() => M.atlasTextAlternative(nodes, edges), [nodes, edges]);
  const selected = byId.get(selectedId) ?? null;

  // Colour by status, from the design tokens; the theme counter re-reads them so the map follows the palette.
  const paint = useMemo(() => {
    const status = {};
    for (const name of ["established", "effective", "schematic", "conjectural", "open"]) {
      status[name] = window.QGA_TOKENS.css(`status-${name}`);
    }
    return {
      status,
      // A solid ink, with the alpha applied once through strokeOpacity. Nesting a translucent token inside
      // stroke-opacity multiplies the two and the edges all but vanish (0.14 x 0.42 = 0.06).
      edge: Object.fromEntries(["bridge", "result", "blocks"].map((k) => [k, window.QGA_TOKENS.css("ink-dim")])),
      ink: window.QGA_TOKENS.css("ink"),
      inkDim: window.QGA_TOKENS.css("ink-dim"),
      head: window.QGA_TOKENS.css("head"),
      paper: window.QGA_TOKENS.css("surface-1"),
    };
  }, [theme]);

  // The stage is square-ish on desktop and taller than wide on a phone; the layout is fitted to whichever it is. The
  // first measurement can read 0 before the section has been laid out (the overview mounts behind the intro), and a
  // ResizeObserver does not fire again when the box never changes size — so measure on the next frame and retry until
  // a real width arrives, rather than drawing the whole map at the desktop default on a phone.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const measure = (width) => {
      if (!width) return false;
      setSize({ width, height: Math.round(Math.max(360, Math.min(660, width * (width < 520 ? 1.5 : 0.72)))) });
      return true;
    };
    const ro = new ResizeObserver((entries) => measure(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    let frames = 0;
    let raf = 0;
    const retry = () => {
      if (measure(Math.floor(el.getBoundingClientRect().width)) || frames >= 90) return;
      frames += 1;
      raf = requestAnimationFrame(retry);
    };
    raf = requestAnimationFrame(retry);
    const onResize = () => measure(Math.floor(el.getBoundingClientRect().width));
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Exact label widths for the fonts actually in use, so placement never guesses: a canvas measureText is the only
  // reliable way to know how wide "Background independence" is in the body face at 10.5 px.
  const measurer = useMemo(() => {
    const canvas = globalThis.document ? globalThis.document.createElement("canvas") : null;
    const ctx = canvas ? canvas.getContext("2d") : null;
    return (text, kind) => {
      if (!ctx) return text.length * 5.9;
      const compact = size.width < 520;
      // The canvas needs a resolvable font stack, not a CSS custom property; getComputedStyle reads it off the document.
      const stack = (name, fallback) => globalThis.getComputedStyle?.(globalThis.document.documentElement)
        ?.getPropertyValue(name)?.trim() || fallback;
      ctx.font = kind === "module"
        ? `600 ${compact ? 11 : 12.5}px ${stack("--font-head", "sans-serif")}`
        : `${compact ? 9 : 10.5}px ${stack("--font-body", "sans-serif")}`;
      return ctx.measureText(text).width + 2;
    };
  }, [size.width, theme]);

  const selectedNeighbours = selectedId ? (adjacency[selectedId] ?? []) : [];
  const R = AtlasMap.geometry(ATLAS_MAP_LAYOUT, nodes, edges, {
    ...size, measure: measurer, selectedId, neighbours: selectedNeighbours,
  });

  const move = (direction) => {
    const neighbours = adjacency[selectedId] ?? [];
    if (!neighbours.length) return;
    const here = R.pos.get(selectedId);
    // Arrows move to the neighbour that lies most nearly in the pressed direction; a neighbour that would move the
    // viewer backwards wins only when nothing else is available, so the graph is walkable from any node.
    const target = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[direction];
    if (!target) return;
    let best = null;
    let bestScore = -Infinity;
    for (const id of neighbours) {
      const p = R.pos.get(id);
      const dx = p.x - here.x;
      const dy = p.y - here.y;
      const len = Math.hypot(dx, dy) || 1e-6;
      const score = (dx * target[0] + dy * target[1]) / len;
      if (score > bestScore) { bestScore = score; best = id; }
    }
    if (best) setSelectedId(best);
  };

  const onKeyDown = (event) => {
    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      move(event.key);
    } else if (event.key === "Enter" && selected) {
      event.preventDefault();
      go(selected.view ?? selected.id);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSelectedId(null);
    }
  };

  const ariaId = "atlas-map-text-alt";
  const nodeLabel = (node) => {
    if (node.kind === "module") return `${node.num} ${node.title}, ${node.status} chapter`;
    if (node.kind === "result") return `${node.label}, ${node.value}, ${node.status}`;
    return `open problem, ${node.title}`;
  };
  const neighbours = selectedId ? (adjacency[selectedId] ?? []).map((id) => byId.get(id)).filter(Boolean) : [];

  return (
    <div className="viz-frame atlas-map" id="overview-atlas-map" ref={wrap}>
      <div className="atlas-map-intro">
        <span className="constraint-kicker">THE ARGUMENT AS A GRAPH</span>
        <h3>Thirty nodes, thirty-eight edges — and where the argument stops.</h3>
        <p>
          The eight chapters lead into one another; each computes results you can read on the map; nine open problems
          pull back on the chapters they bear on. Arrow keys walk the edges, Enter opens the chapter a node belongs to.
          Distance on this map is a drawing, not a quantity.
        </p>
      </div>
      <div className="atlas-map-stage" style={{ height: R.height }}
        role="group" aria-label="Atlas map: eight chapters, fourteen key results and nine open problems"
        aria-describedby={ariaId}>
        <svg viewBox={`0 0 ${R.width} ${R.height}`} width={R.width} height={R.height} aria-hidden="true" focusable="false">
          <defs>
            {["bridge", "result", "blocks"].map((kind) => (
              <marker key={kind} id={`atlas-arrow-${kind}`} viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={paint.edge[kind]} opacity={kind === "bridge" ? 0.9 : 0.55}></path>
              </marker>
            ))}
          </defs>
          {R.edges.map((edge) => {
            const active = edge.from === selectedId || edge.to === selectedId;
            return (
              <line key={edge.id} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                stroke={paint.edge[edge.kind]}
                strokeOpacity={active ? 0.9 : edge.kind === "bridge" ? 0.5 : 0.26}
                strokeWidth={active ? 1.6 : 1}
                strokeDasharray={edge.kind === "bridge" ? undefined : edge.kind === "result" ? "3 3" : "1.5 4"}
                markerEnd={edge.kind === "bridge" ? undefined : `url(#atlas-arrow-${edge.kind})`}></line>
            );
          })}
          {R.nodes.map((node) => {
            const isSelected = node.id === selectedId;
            const isNeighbour = neighbours.some((n) => n.id === node.id);
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                {isSelected ? <circle r={node.r + 6} fill="none" stroke={paint.head} strokeWidth="1.5" opacity="0.9"></circle> : null}
                {isNeighbour ? <circle r={node.r + 3} fill="none" stroke={paint.status[node.status] ?? paint.status.open} strokeWidth="1" opacity="0.55"></circle> : null}
                <circle r={node.r}
                  fill={node.kind === "module" ? paint.paper : paint.status[node.status] ?? paint.status.open}
                  fillOpacity={node.kind === "module" ? 1 : 0.9}
                  stroke={paint.status[node.status] ?? paint.status.open}
                  strokeWidth={node.kind === "module" ? 2 : 1}
                  strokeOpacity={isNeighbour || isSelected ? 1 : 0.8}></circle>
                {node.kind === "module" ? (
                  <text className="atlas-map-numeral" textAnchor="middle" dy="4" fill={paint.status[node.status]}
                    fontSize={R.compact ? "10" : "11"} fontFamily="var(--font-mono)" letterSpacing="0.06em">{node.num}</text>
                ) : null}
              </g>
            );
          })}
          {R.nodes.map((node) => {
            const label = R.labels[node.id];
            if (!label) return null;
            const isSelected = node.id === selectedId;
            return (
              <text key={`label-${node.id}`} className="atlas-map-label" x={label.x} y={label.baseline}
                fill={node.kind === "module" ? paint.head : isSelected ? paint.ink : paint.inkDim}
                fontSize={node.kind === "module" ? (R.compact ? 11 : 12.5) : (R.compact ? 9 : 10.5)}
                fontFamily={node.kind === "module" ? "var(--font-head)" : "var(--font-body)"}
                opacity={isSelected ? 1 : 0.88}
                paintOrder="stroke" stroke={paint.paper} strokeWidth="2.6" strokeLinejoin="round">{label.text}</text>
            );
          })}
        </svg>
        <div className="atlas-map-legend" aria-hidden="true">
          {["established", "effective", "schematic", "conjectural", "open"].map((name) => (
            <span key={name} className="atlas-map-legend-item">
              <span className="atlas-map-swatch" style={{ background: paint.status[name] }}></span>{name}
            </span>
          ))}
          <span className="atlas-map-legend-item"><span className="atlas-map-swatch-line"></span>reading path</span>
          <span className="atlas-map-legend-item"><span className="atlas-map-swatch-line dashed"></span>result / problem</span>
        </div>
      </div>
      <div className="atlas-map-nav">
        <label className="atlas-map-select">
          <span>node</span>
          <select value={selectedId ?? ""} onChange={(e) => setSelectedId(e.target.value || null)}
            aria-describedby={ariaId}>
            <option value="">— none —</option>
            {nodes.map((node) => <option key={node.id} value={node.id}>{nodeLabel(node)}</option>)}
          </select>
        </label>
        <div className="atlas-map-arrows" role="group" aria-label="Move between connected nodes">
          <button type="button" className="btn" onClick={() => move("ArrowLeft")} aria-label="previous connected node">←</button>
          <button type="button" className="btn" onClick={() => move("ArrowUp")} aria-label="connected node above">↑</button>
          <button type="button" className="btn" onClick={() => move("ArrowDown")} aria-label="connected node below">↓</button>
          <button type="button" className="btn" onClick={() => move("ArrowRight")} aria-label="next connected node">→</button>
        </div>
        <button type="button" className="btn" disabled={!selected?.view}
          onClick={() => selected?.view && go(selected.view)}>Open {selected?.view ? `module ${byId.get(selected.view)?.num ?? ""}` : "—"} ↗</button>
        <button type="button" className="btn" onClick={() => setSelectedId("planck")}>Reset</button>
      </div>
      <div className="atlas-map-detail" role="status" aria-live="polite" onKeyDown={onKeyDown} tabIndex={0}>
        {selected ? (
          <>
            <div className="atlas-map-detail-head">
              <strong>{selected.kind === "module" ? `${selected.num} ${selected.title}` : selected.title ?? selected.label}</strong>
              <Badge kind={selected.status}></Badge>
              {selected.tex ? <span className="atlas-map-tex"><Eq tex={selected.tex}></Eq></span> : null}
            </div>
            {selected.kind === "result" ? (
              <p className="atlas-map-value">{selected.value}</p>
            ) : null}
            <p className="small dim" style={{ margin: "6px 0 0 0" }}>
              {selected.kind === "result" ? selected.detail : selected.kind === "problem" ? selected.detail : `Chapter ${selected.num} of the atlas.`}
            </p>
            {selected.kind === "result" ? (
              <p className="mono dim" style={{ fontSize: 10.5, margin: "6px 0 0 0", letterSpacing: "0.08em" }}>
                recomputed as {String(selected.check())} · {selected.reference.split(",")[0]}
              </p>
            ) : null}
            {neighbours.length ? (
              <p className="mono dim" style={{ fontSize: 10.5, margin: "6px 0 0 0", letterSpacing: "0.08em" }}>
                {neighbours.length} connected: {neighbours.map((n) => n.id).join(", ")}
              </p>
            ) : null}
          </>
        ) : (
          <p className="small dim" style={{ margin: 0 }}>No node selected. Arrow keys walk the graph from the last selection.</p>
        )}
      </div>
      <ul id={ariaId} className="atlas-map-sr">
        {textAlternative.map((line, i) => <li key={i}>{line}</li>)}
      </ul>
      <VizCaption provenanceId="atlas-map" status="schematic">
        The argument of the atlas as a graph: eight chapters, the fourteen numbers they compute, and the nine open
        problems that pull back on them. The edges are the reading path, not a claim that the chapters are equivalent.
        Positions come from a seeded force simulation committed as data, so the map is identical in every browser and
        carries no quantity: <strong>distance and angle mean nothing</strong>, only adjacency does. Every result node
        repeats a number computed in its chapter and is recomputed again in the panel, so the map cannot drift from the
        science it summarises. On a narrow screen the names move out of the drawing into the selector and the panel:
        thirty labels do not fit in 308 px, and the graph stays readable as a navigator with numbered chapter discs.
      </VizCaption>
    </div>
  );
}

/**
 * Fit the committed unit-square layout into the stage. The labels sit on the right of every node, so the graph is
 * pushed to the left of the drawing area and labels are allowed to run into the right margin; a phone turns the map
 * portrait and gets a wider margin.
 */
AtlasMap.geometry = function geometry(layout, nodes, edges, opts) {
  const { width, height } = opts;
  const compact = width < 520;
  const pad = compact ? 10 : 34;
  // The legend sits over the stage's bottom edge; the drawing area stops above it so no node is ever hidden by it.
  const legendBand = compact ? 52 : 34;
  const drawH = Math.max(120, height - pad * 2 - legendBand);
  const scale = Math.max(120, Math.min(width - pad * 2, drawH));
  // Labels are placed around each node, not stacked to its right: two result nodes a few pixels apart would collide
  // otherwise, and on a phone there is no right margin to run into. `placeLabels` picks one of eight anchors per node
  // in a fixed order, rejecting anchors whose box overlaps a box already placed.
  const ox = pad + (width - pad * 2 - scale) / 2;
  const oy = pad + (drawH - scale) / 2;
  const project = (id) => {
    const p = layout[id];
    if (!p) throw new Error(`atlas map: no committed position for ${id}`);
    return { x: ox + scale * (p.x + 0.5), y: oy + scale * (p.y + 0.5) };
  };
  const pos = new Map(nodes.map((node) => [node.id, project(node.id)]));
  const placed = nodes.map((node) => Object.freeze({
    ...node, ...pos.get(node.id),
    r: node.kind === "module" ? (compact ? 13 : 16) : node.kind === "result" ? (compact ? 5.5 : 7) : (compact ? 7 : 9),
  }));
  // A phone cannot hold thirty labels in 308 px: the map then labels the eight chapters, the selected node and its
  // neighbours, and leaves the rest to the selector, the panel and the text alternative. Nothing is invented and
  // nothing is silently dropped — the full list is always one control away.
  // At 308 px thirty discs leave no room for thirty names, and a name printed over a disc is worse than no name: the
  // phone draws the graph as a navigator — numbered chapter discs and status-coloured dots — while the selector, the
  // detail panel and the text alternative carry every name. Desktop labels in place.
  const labelled = compact ? [] : placed;
  const labels = AtlasMap.placeLabels(labelled, { width, height: drawH, compact, measure: opts.measure });
  return Object.freeze({
    width, height, scale, pad, compact,
    pos,
    nodes: placed,
    labels,
    labelledIds: Object.freeze(labelled.map((node) => node.id)),
    edges: edges.map((edge) => Object.freeze({
      ...edge, x1: pos.get(edge.from).x, y1: pos.get(edge.from).y, x2: pos.get(edge.to).x, y2: pos.get(edge.to).y,
    })),
  });
};

/**
 * Place one label per node without overlaps. Candidates are tried in a fixed order — right, left, above, below, then the
 * four diagonals — and the first that collides with neither a placed label nor a node disc wins. A node whose eight
 * candidates all collide keeps the least-bad one, so a label is never dropped silently; `clipped` marks it so the
 * caller can decide. Module labels are ranked first: they are the anchors of the picture.
 */
AtlasMap.placeLabels = function placeLabels(nodes, { width, height, compact, measure: measureText = null }) {
  const GAP = 3;
  // Without a measuring function (Node tests) a character-width estimate is used; in the browser the component passes
  // a canvas measurement, which is exact for the font actually rendering the label.
  const CHAR_W = compact ? 5.4 : 5.9;
  const LINE_H = compact ? 12 : 13;
  const measure = (node) => {
    const text = node.kind === "module" ? node.title : node.label ?? node.title;
    const kind = node.kind;
    return { w: Math.max(24, measureText ? measureText(text, kind) : text.length * CHAR_W), h: LINE_H, text };
  };
  const boxes = nodes.map((node) => ({ node, ...measure(node) }));
  const order = [...boxes].sort((a, b) => {
    const rank = (n) => (n.kind === "module" ? 0 : n.kind === "problem" ? 1 : 2);
    return rank(a.node) - rank(b.node) || a.node.id.localeCompare(b.node.id);
  });
  const overlaps = (a, b) => !(a.x2 + GAP <= b.x1 || b.x2 + GAP <= a.x1 || a.y2 + GAP <= b.y1 || b.y2 + GAP <= a.y1);
  const discBox = (node) => ({ x1: node.x - node.r - 1.5, y1: node.y - node.r - 1.5, x2: node.x + node.r + 1.5, y2: node.y + node.r + 1.5 });
  const discs = new Map(nodes.map((node) => [node.id, discBox(node)]));
  const taken = [];
  const anchors = [
    { id: "right", place: (b) => ({ x1: b.node.x + b.node.r + GAP + 2, y1: b.node.y - b.h / 2 }) },
    { id: "left", place: (b) => ({ x1: b.node.x - b.node.r - GAP - 2 - b.w, y1: b.node.y - b.h / 2 }) },
    { id: "above", place: (b) => ({ x1: b.node.x - b.w / 2, y1: b.node.y - b.node.r - GAP - 2 - b.h }) },
    { id: "below", place: (b) => ({ x1: b.node.x - b.w / 2, y1: b.node.y + b.node.r + GAP + 2 }) },
    { id: "up-right", place: (b) => ({ x1: b.node.x + b.node.r * 0.72 + 2, y1: b.node.y - b.node.r * 0.72 - 2 - b.h }) },
    { id: "up-left", place: (b) => ({ x1: b.node.x - b.node.r * 0.72 - 2 - b.w, y1: b.node.y - b.node.r * 0.72 - 2 - b.h }) },
    { id: "down-right", place: (b) => ({ x1: b.node.x + b.node.r * 0.72 + 2, y1: b.node.y + b.node.r * 0.72 + 2 }) },
    { id: "down-left", place: (b) => ({ x1: b.node.x - b.node.r * 0.72 - 2 - b.w, y1: b.node.y + b.node.r * 0.72 + 2 }) },
    // Nudged variants: a label one line up or down often clears a neighbour without leaving its node.
    ...[1, -1].flatMap((dir) => [
      { id: `right${dir > 0 ? "down" : "up"}`, place: (b) => ({ x1: b.node.x + b.node.r + GAP + 2, y1: b.node.y - b.h / 2 + dir * (b.h + GAP) }) },
      { id: `left${dir > 0 ? "down" : "up"}`, place: (b) => ({ x1: b.node.x - b.node.r - GAP - 2 - b.w, y1: b.node.y - b.h / 2 + dir * (b.h + GAP) }) },
    ]),
    // Radial fallback: rings at increasing distance, eight directions each. Crowded regions of the graph are exactly
    // where a label must move further out rather than sit on a node, so this runs last and almost always succeeds.
    ...[1, 2, 3].flatMap((ring) => [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
      const angle = (k * Math.PI) / 4;
      return {
        id: `ring${ring}-${k}`,
        // The distance depends on the node being placed, so it is computed inside `place`, never at list-build time.
        place: (b) => {
          const dist = b.node.r + GAP + 2 + ring * (b.h + GAP);
          const cx = b.node.x + Math.cos(angle) * dist;
          const cy = b.node.y + Math.sin(angle) * dist;
          return {
            x1: cx - (Math.cos(angle) < 0 ? b.w : 0) - (Math.abs(Math.cos(angle)) < 0.2 ? b.w / 2 : 0),
            y1: cy - b.h / 2,
          };
        },
      };
    })),
  ];
  const out = {};
  for (const box of order) {
    let best = null;
    for (const anchor of anchors) {
      const rect = anchor.place(box);
      const candidate = { ...rect, x2: rect.x1 + box.w, y2: rect.y1 + box.h };
      const outside = candidate.x1 < 2 || candidate.y1 < 2 || candidate.x2 > width - 2 || candidate.y2 > height - 2;
      // A label may never sit on a node disc, its own included (that would hide the node it names); it may only
      // overlap another label as a last resort, which `clipped` reports rather than hides.
      let hitsDisc = false;
      for (const [id, disc] of discs) {
        if (overlaps(candidate, disc)) { hitsDisc = true; break; }
      }
      let hitsLabel = false;
      for (const other of taken) if (overlaps(candidate, other)) { hitsLabel = true; break; }
      const cost = (outside ? 8 : 0) + (hitsLabel ? 3 : 0) + (hitsDisc ? 100 : 0);
      if (cost === 0) { best = { ...candidate, anchor: anchor.id, clipped: false, cost }; break; }
      if (!best || cost < best.cost) best = { ...candidate, anchor: anchor.id, clipped: outside || hitsDisc || hitsLabel, cost };
    }
    // Deterministic last resort: a fine ring scan around the node. A crowded region of the graph is exactly where a
    // label has to travel further out rather than sit on a node, and the search is cheap because the map is static.
    if (best.cost >= 100) {
      const free = (rect) => {
        const candidate = { ...rect, x2: rect.x1 + box.w, y2: rect.y1 + box.h };
        if (candidate.x1 < 2 || candidate.y1 < 2 || candidate.x2 > width - 2 || candidate.y2 > height - 2) return null;
        for (const disc of discs.values()) if (overlaps(candidate, disc)) return null;
        for (const other of taken) if (overlaps(candidate, other)) return null;
        return candidate;
      };
      search: for (let radius = box.node.r + GAP + 2; radius < box.node.r + 140; radius += 3) {
        for (let k = 0; k < 32; k += 1) {
          const angle = (k * Math.PI) / 16;
          const cx = box.node.x + Math.cos(angle) * radius;
          const cy = box.node.y + Math.sin(angle) * radius;
          const found = free({ x1: cx - box.w / 2, y1: cy - box.h / 2 });
          if (found) { best = { ...found, anchor: "scan", clipped: false, cost: 0 }; break search; }
        }
      }
    }
    taken.push({ x1: best.x1, y1: best.y1, x2: best.x2, y2: best.y2 });
    out[box.node.id] = Object.freeze({
      x: best.x1, y: best.y1, w: box.w, h: box.h,
      anchor: best.anchor, clipped: best.clipped, text: box.text,
      baseline: best.y1 + box.h * 0.78,
    });
  }
  return Object.freeze(out);
};

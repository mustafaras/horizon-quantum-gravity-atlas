// katex-overlay.jsx — KaTeX spans positioned over a Figure Kit canvas. Axis titles, legend math and
// callouts are typeset here; the canvas never draws Greek letters or operators.

const FIG_TEX_ANCHOR = {
  left: { x: "0%", textAlign: "left" },
  center: { x: "-50%", textAlign: "center" },
  right: { x: "-100%", textAlign: "right" },
};
const FIG_TEX_BASE = { top: "0%", middle: "-50%", bottom: "-100%" };

function FigureTex({ items }) {
  return (
    <div className="fig-tex" aria-hidden="true">
      {items.map((t, i) => {
        const a = FIG_TEX_ANCHOR[t.align] ?? FIG_TEX_ANCHOR.left;
        const y = FIG_TEX_BASE[t.base] ?? "-50%";
        const rotate = t.rotate ? ` rotate(${t.rotate}deg)` : "";
        return (
          <span key={t.role + i} className={"fig-tex-item fig-tex-" + t.role}
            style={{ left: t.x, top: t.y, fontSize: t.size + "px", color: "var(--" + t.c + ")", opacity: t.a,
              transform: `translate(${a.x}, ${y})${rotate}`, textAlign: a.textAlign }}>
            <Eq tex={t.tex}></Eq>
          </span>
        );
      })}
    </div>
  );
}

Object.assign(window, { FigureTex });

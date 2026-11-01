/* Compiled from js/figure/katex-overlay.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

// katex-overlay.jsx — KaTeX spans positioned over a Figure Kit canvas. Axis titles, legend math and
// callouts are typeset here; the canvas never draws Greek letters or operators.

var FIG_TEX_ANCHOR = {
  left: {
    x: "0%",
    textAlign: "left"
  },
  center: {
    x: "-50%",
    textAlign: "center"
  },
  right: {
    x: "-100%",
    textAlign: "right"
  }
};
var FIG_TEX_BASE = {
  top: "0%",
  middle: "-50%",
  bottom: "-100%"
};
function FigureTex(_ref) {
  var items = _ref.items;
  return /*#__PURE__*/React.createElement("div", {
    className: "fig-tex",
    "aria-hidden": "true"
  }, items.map(function (t, i) {
    var _FIG_TEX_ANCHOR$t$ali, _FIG_TEX_BASE$t$base;
    var a = (_FIG_TEX_ANCHOR$t$ali = FIG_TEX_ANCHOR[t.align]) !== null && _FIG_TEX_ANCHOR$t$ali !== void 0 ? _FIG_TEX_ANCHOR$t$ali : FIG_TEX_ANCHOR.left;
    var y = (_FIG_TEX_BASE$t$base = FIG_TEX_BASE[t.base]) !== null && _FIG_TEX_BASE$t$base !== void 0 ? _FIG_TEX_BASE$t$base : "-50%";
    var rotate = t.rotate ? " rotate(".concat(t.rotate, "deg)") : "";
    return /*#__PURE__*/React.createElement("span", {
      key: t.role + i,
      className: "fig-tex-item fig-tex-" + t.role,
      style: {
        left: t.x,
        top: t.y,
        fontSize: t.size + "px",
        color: "var(--" + t.c + ")",
        opacity: t.a,
        transform: "translate(".concat(a.x, ", ").concat(y, ")").concat(rotate),
        textAlign: a.textAlign
      }
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: t.tex
    }));
  }));
}
Object.assign(window, {
  FigureTex: FigureTex
});
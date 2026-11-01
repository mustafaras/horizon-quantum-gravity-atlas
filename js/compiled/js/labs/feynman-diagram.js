/* Compiled from js/labs/feynman-diagram.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// feynman-diagram.jsx — one Feynman diagram of the QFT builder (S16). The geometry comes from js/visualizations/qft/feynman-svg.mjs through
// window.QGA_FEYNMAN.layout; the lines, arrows and vertex dots are SVG, and the labels are KaTeX spans laid over it at the positions the layout
// returns. Colours are design tokens read here, so the diagram follows the theme. Nothing moves: the diagram is a figure, and the collision
// animation above it carries the motion.

var FEYNMAN_ROLE_TOKENS = {
  fermion: "ink",
  photon: "cat-1",
  boson: "cat-6",
  gluon: "cat-7",
  scalar: "ink-dim",
  vertex: "accent",
  momentum: "ink-dim"
};
var FEYNMAN_ANCHOR_SHIFT = {
  start: "translate(0, -50%)",
  middle: "translate(-50%, -50%)",
  end: "translate(-100%, -50%)"
};
var FEYNMAN_ARROW = "-4,-3.5 4,0 -4,3.5";
function FeynmanDiagram(_ref) {
  var def = _ref.def,
    ariaLabel = _ref.ariaLabel;
  var F = window.QGA_FEYNMAN;
  var _useState = useState(0),
    _useState2 = _slicedToArray(_useState, 2),
    theme = _useState2[0],
    setTheme = _useState2[1];
  useEffect(function () {
    return window.QGA_TOKENS.onThemeChange(function () {
      return setTheme(function (t) {
        return t + 1;
      });
    });
  }, []);
  var layout = useMemo(function () {
    return F.layout(def);
  }, [def]);
  var paint = useMemo(function () {
    return Object.fromEntries(Object.entries(FEYNMAN_ROLE_TOKENS).map(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 2),
        role = _ref3[0],
        token = _ref3[1];
      return [role, window.QGA_TOKENS.css(token)];
    }));
  }, [theme]);
  var _F$DIAGRAM_SIZE = F.DIAGRAM_SIZE,
    width = _F$DIAGRAM_SIZE.width,
    height = _F$DIAGRAM_SIZE.height;
  var degrees = function degrees(radians) {
    return radians * 180 / Math.PI;
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fey-diagram",
    role: "img",
    "aria-label": ariaLabel
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 " + width + " " + height,
    "aria-hidden": "true",
    focusable: "false"
  }, layout.paths.map(function (p) {
    return /*#__PURE__*/React.createElement("path", {
      key: "p" + p.index,
      d: p.d,
      fill: "none",
      stroke: paint[p.kind === "antifermion" ? "fermion" : p.kind],
      strokeWidth: p.width,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeDasharray: p.dash || undefined
    });
  }), layout.arrows.map(function (a) {
    return /*#__PURE__*/React.createElement("polygon", {
      key: "a" + a.index,
      points: FEYNMAN_ARROW,
      fill: paint.fermion,
      transform: "translate(" + a.x.toFixed(2) + "," + a.y.toFixed(2) + ") rotate(" + degrees(a.angle).toFixed(2) + ")"
    });
  }), layout.momenta.map(function (m) {
    return /*#__PURE__*/React.createElement("g", {
      key: "m" + m.index
    }, /*#__PURE__*/React.createElement("line", {
      x1: m.x1,
      y1: m.y1,
      x2: m.x2,
      y2: m.y2,
      stroke: paint.momentum,
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("polygon", {
      points: FEYNMAN_ARROW,
      fill: paint.momentum,
      transform: "translate(" + m.x2.toFixed(2) + "," + m.y2.toFixed(2) + ") rotate(" + degrees(m.angle).toFixed(2) + ") scale(0.8)"
    }));
  }), layout.dots.map(function (d) {
    return /*#__PURE__*/React.createElement("circle", {
      key: d.id,
      cx: d.x,
      cy: d.y,
      r: d.r,
      fill: paint.vertex
    });
  })), /*#__PURE__*/React.createElement("div", {
    className: "fey-tex-layer",
    "aria-hidden": "true"
  }, layout.labels.map(function (l, i) {
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      className: "fey-tex" + (l.momentum ? " fey-tex-momentum" : ""),
      style: {
        left: 100 * l.x / width + "%",
        top: 100 * l.y / height + "%",
        transform: FEYNMAN_ANCHOR_SHIFT[l.anchor]
      }
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: l.tex
    }));
  })));
}

/* The key to the line conventions: one line of every kind the drawing knows, folded away until asked for. */
function FeynmanLegend() {
  var def = useMemo(function () {
    return window.QGA_FEYNMAN.legendDiagram();
  }, []);
  return /*#__PURE__*/React.createElement("details", {
    className: "fey-legend"
  }, /*#__PURE__*/React.createElement("summary", null, "Line conventions"), /*#__PURE__*/React.createElement(FeynmanDiagram, {
    def: def,
    ariaLabel: "Key to the lines of the diagrams: fermion, antifermion, photon, W or Z boson, gluon and scalar."
  }));
}

/* Every tree diagram of the process the builder analysed (`result.channels`: s; s and t for Bhabha; t and u for Moller; s and u for
   Compton), one figure each, for the external particles `ids` = [in1, in2, out1, out2] of FEY_PARTICLES. */
var FEYNMAN_CHANNEL_NAMES = {
  s: "s channel",
  t: "t channel",
  u: "u channel"
};
function FeynmanDiagramSet(_ref4) {
  var result = _ref4.result,
    ids = _ref4.ids;
  var F = window.QGA_FEYNMAN;
  var key = ids.join("|") + "|" + result.topo;
  var diagrams = useMemo(function () {
    var ends = ids.map(function (id) {
      var p = FEY_PARTICLES.find(function (q) {
        return q.id === id;
      });
      return {
        tex: p.tex,
        plain: p.label.split(" ")[0],
        anti: p.anti,
        photon: p.type === "photon"
      };
    });
    return result.channels.map(function (channel) {
      return {
        channel: channel,
        def: F.diagramFor({
          topo: result.topo,
          channel: channel,
          boson: result.bosonTex,
          ends: ends
        }),
        label: F.describeDiagram({
          topo: result.topo,
          channel: channel,
          ends: ends
        })
      };
    });
  }, [key]);
  return /*#__PURE__*/React.createElement("div", {
    className: "fey-diagram-set" + (diagrams.length > 1 ? " fey-diagram-pair" : "")
  }, diagrams.map(function (d) {
    return /*#__PURE__*/React.createElement("figure", {
      key: d.channel,
      className: "fey-diagram-fig"
    }, /*#__PURE__*/React.createElement("figcaption", {
      className: "fey-diagram-cap"
    }, diagrams.length > 1 ? FEYNMAN_CHANNEL_NAMES[d.channel] + " · " : "", "time ", /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true"
    }, "\u2192")), /*#__PURE__*/React.createElement(FeynmanDiagram, {
      def: d.def,
      ariaLabel: d.label
    }));
  }));
}
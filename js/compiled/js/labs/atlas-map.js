/* Compiled from js/labs/atlas-map.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// S29: the atlas map — the whole argument as one navigable graph, below the Arena of Scales on the overview.
//
// The layout is committed (js/science/data/atlas-map-layout.mjs), so this draws and never simulates: an SVG graph, not a
// WebGL scene. That is deliberate. The overview already runs two WebGL scenes and the performance contract forbids
// making its first frame slower by more than 5 %; a third context for 30 static discs would buy nothing the SVG does
// not already give — crisp engraved lines at any DPR, real focus rings, and text that a screen reader can read.
//
// Keyboard: arrow keys walk the graph along its edges, Enter opens the chapter, Escape clears the selection. The
// selection also drives a detail panel, and the whole graph has a text alternative.
function AtlasMap(_ref) {
  var _byId$get, _adjacency$selectedId, _adjacency$selectedId3, _byId$get$num, _byId$get2, _selected$title;
  var go = _ref.go;
  var M = window.QGA_ATLAS_MAP;
  var ATLAS_MAP_LAYOUT = window.QGA_ATLAS_MAP_LAYOUT.ATLAS_MAP_LAYOUT;
  var _useState = useState(0),
    _useState2 = _slicedToArray(_useState, 2),
    theme = _useState2[0],
    setTheme = _useState2[1];
  var _useState3 = useState("planck"),
    _useState4 = _slicedToArray(_useState3, 2),
    selectedId = _useState4[0],
    setSelectedId = _useState4[1];
  var reduced = usePRM();
  var wrap = useRef(null);
  var _useState5 = useState({
      width: 900,
      height: 620
    }),
    _useState6 = _slicedToArray(_useState5, 2),
    size = _useState6[0],
    setSize = _useState6[1];
  useEffect(function () {
    return window.QGA_TOKENS.onThemeChange(function () {
      return setTheme(function (t) {
        return t + 1;
      });
    });
  }, []);
  var nodes = useMemo(function () {
    return M.atlasNodes();
  }, []);
  var edges = useMemo(function () {
    return M.atlasEdges();
  }, []);
  var adjacency = useMemo(function () {
    return M.atlasAdjacency(edges);
  }, [edges]);
  var byId = useMemo(function () {
    return new Map(nodes.map(function (n) {
      return [n.id, n];
    }));
  }, [nodes]);
  var textAlternative = useMemo(function () {
    return M.atlasTextAlternative(nodes, edges);
  }, [nodes, edges]);
  var selected = (_byId$get = byId.get(selectedId)) !== null && _byId$get !== void 0 ? _byId$get : null;

  // Colour by status, from the design tokens; the theme counter re-reads them so the map follows the palette.
  var paint = useMemo(function () {
    var status = {};
    for (var _i = 0, _arr = ["established", "effective", "schematic", "conjectural", "open"]; _i < _arr.length; _i++) {
      var name = _arr[_i];
      status[name] = window.QGA_TOKENS.css("status-".concat(name));
    }
    return {
      status: status,
      // A solid ink, with the alpha applied once through strokeOpacity. Nesting a translucent token inside
      // stroke-opacity multiplies the two and the edges all but vanish (0.14 x 0.42 = 0.06).
      edge: Object.fromEntries(["bridge", "result", "blocks"].map(function (k) {
        return [k, window.QGA_TOKENS.css("ink-dim")];
      })),
      ink: window.QGA_TOKENS.css("ink"),
      inkDim: window.QGA_TOKENS.css("ink-dim"),
      head: window.QGA_TOKENS.css("ink-strong"),
      paper: window.QGA_TOKENS.css("surface-1")
    };
  }, [theme]);

  // The stage is square-ish on desktop and taller than wide on a phone; the layout is fitted to whichever it is. The
  // first measurement can read 0 before the section has been laid out (the overview mounts behind the intro), and a
  // ResizeObserver does not fire again when the box never changes size — so measure on the next frame and retry until
  // a real width arrives, rather than drawing the whole map at the desktop default on a phone.
  useEffect(function () {
    var el = wrap.current;
    if (!el) return undefined;
    var measure = function measure(width) {
      if (!width) return false;
      setSize({
        width: width,
        height: Math.round(Math.max(360, Math.min(660, width * (width < 520 ? 1.5 : 0.72))))
      });
      return true;
    };
    var ro = new ResizeObserver(function (entries) {
      return measure(Math.floor(entries[0].contentRect.width));
    });
    ro.observe(el);
    var frames = 0;
    var raf = 0;
    var _retry = function retry() {
      if (measure(Math.floor(el.getBoundingClientRect().width)) || frames >= 90) return;
      frames += 1;
      raf = requestAnimationFrame(_retry);
    };
    raf = requestAnimationFrame(_retry);
    var onResize = function onResize() {
      return measure(Math.floor(el.getBoundingClientRect().width));
    };
    window.addEventListener("resize", onResize);
    return function () {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Exact label widths for the fonts actually in use, so placement never guesses: a canvas measureText is the only
  // reliable way to know how wide "Background independence" is in the body face at 10.5 px.
  var measurer = useMemo(function () {
    var canvas = globalThis.document ? globalThis.document.createElement("canvas") : null;
    var ctx = canvas ? canvas.getContext("2d") : null;
    return function (text, kind) {
      if (!ctx) return text.length * 5.9;
      var compact = size.width < 520;
      // The canvas needs a resolvable font stack, not a CSS custom property; getComputedStyle reads it off the document.
      var stack = function stack(name, fallback) {
        var _globalThis$getComput;
        return ((_globalThis$getComput = globalThis.getComputedStyle) === null || _globalThis$getComput === void 0 || (_globalThis$getComput = _globalThis$getComput.call(globalThis, globalThis.document.documentElement)) === null || _globalThis$getComput === void 0 || (_globalThis$getComput = _globalThis$getComput.getPropertyValue(name)) === null || _globalThis$getComput === void 0 ? void 0 : _globalThis$getComput.trim()) || fallback;
      };
      ctx.font = kind === "module" ? "600 ".concat(compact ? 11 : 12.5, "px ").concat(stack("--font-head", "sans-serif")) : "".concat(compact ? 9 : 10.5, "px ").concat(stack("--font-body", "sans-serif"));
      return ctx.measureText(text).width + 2;
    };
  }, [size.width, theme]);
  var selectedNeighbours = selectedId ? (_adjacency$selectedId = adjacency[selectedId]) !== null && _adjacency$selectedId !== void 0 ? _adjacency$selectedId : [] : [];
  var R = AtlasMap.geometry(ATLAS_MAP_LAYOUT, nodes, edges, _objectSpread(_objectSpread({}, size), {}, {
    measure: measurer,
    selectedId: selectedId,
    neighbours: selectedNeighbours
  }));
  var move = function move(direction) {
    var _adjacency$selectedId2;
    var neighbours = (_adjacency$selectedId2 = adjacency[selectedId]) !== null && _adjacency$selectedId2 !== void 0 ? _adjacency$selectedId2 : [];
    if (!neighbours.length) return;
    var here = R.pos.get(selectedId);
    // Arrows move to the neighbour that lies most nearly in the pressed direction; a neighbour that would move the
    // viewer backwards wins only when nothing else is available, so the graph is walkable from any node.
    var target = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    }[direction];
    if (!target) return;
    var best = null;
    var bestScore = -Infinity;
    var _iterator = _createForOfIteratorHelper(neighbours),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var id = _step.value;
        var p = R.pos.get(id);
        var dx = p.x - here.x;
        var dy = p.y - here.y;
        var len = Math.hypot(dx, dy) || 1e-6;
        var score = (dx * target[0] + dy * target[1]) / len;
        if (score > bestScore) {
          bestScore = score;
          best = id;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    if (best) setSelectedId(best);
  };
  var onKeyDown = function onKeyDown(event) {
    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      move(event.key);
    } else if (event.key === "Enter" && selected) {
      var _selected$view;
      event.preventDefault();
      go((_selected$view = selected.view) !== null && _selected$view !== void 0 ? _selected$view : selected.id);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSelectedId(null);
    }
  };
  var ariaId = "atlas-map-text-alt";
  var nodeLabel = function nodeLabel(node) {
    if (node.kind === "module") return "".concat(node.num, " ").concat(node.title, ", ").concat(node.status, " chapter");
    if (node.kind === "result") return "".concat(node.label, ", ").concat(node.value, ", ").concat(node.status);
    return "open problem, ".concat(node.title);
  };
  var neighbours = selectedId ? ((_adjacency$selectedId3 = adjacency[selectedId]) !== null && _adjacency$selectedId3 !== void 0 ? _adjacency$selectedId3 : []).map(function (id) {
    return byId.get(id);
  }).filter(Boolean) : [];
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame atlas-map",
    id: "overview-atlas-map",
    ref: wrap
  }, /*#__PURE__*/React.createElement("div", {
    className: "atlas-map-intro"
  }, /*#__PURE__*/React.createElement("span", {
    className: "constraint-kicker"
  }, "THE ARGUMENT AS A GRAPH"), /*#__PURE__*/React.createElement("h3", null, "Thirty nodes, thirty-eight edges \u2014 and where the argument stops."), /*#__PURE__*/React.createElement("p", null, "The eight chapters lead into one another; each computes results you can read on the map; nine open problems pull back on the chapters they bear on. Arrow keys walk the edges, Enter opens the chapter a node belongs to. Distance on this map is a drawing, not a quantity.")), /*#__PURE__*/React.createElement("div", {
    className: "atlas-map-stage",
    style: {
      height: R.height
    },
    role: "group",
    "aria-label": "Atlas map: eight chapters, fourteen key results and nine open problems",
    "aria-describedby": ariaId
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 ".concat(R.width, " ").concat(R.height),
    width: R.width,
    height: R.height,
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("defs", null, ["bridge", "result", "blocks"].map(function (kind) {
    return /*#__PURE__*/React.createElement("marker", {
      key: kind,
      id: "atlas-arrow-".concat(kind),
      viewBox: "0 0 10 10",
      refX: "9",
      refY: "5",
      markerWidth: "5",
      markerHeight: "5",
      orient: "auto-start-reverse"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M 0 0 L 10 5 L 0 10 z",
      fill: paint.edge[kind],
      opacity: kind === "bridge" ? 0.9 : 0.55
    }));
  })), R.edges.map(function (edge) {
    var active = edge.from === selectedId || edge.to === selectedId;
    return /*#__PURE__*/React.createElement("line", {
      key: edge.id,
      x1: edge.x1,
      y1: edge.y1,
      x2: edge.x2,
      y2: edge.y2,
      stroke: paint.edge[edge.kind],
      strokeOpacity: active ? 0.9 : edge.kind === "bridge" ? 0.5 : 0.26,
      strokeWidth: active ? 1.6 : 1,
      strokeDasharray: edge.kind === "bridge" ? undefined : edge.kind === "result" ? "3 3" : "1.5 4",
      markerEnd: edge.kind === "bridge" ? undefined : "url(#atlas-arrow-".concat(edge.kind, ")")
    });
  }), R.nodes.map(function (node) {
    var _paint$status$node$st, _paint$status$node$st2, _paint$status$node$st3;
    var isSelected = node.id === selectedId;
    var isNeighbour = neighbours.some(function (n) {
      return n.id === node.id;
    });
    return /*#__PURE__*/React.createElement("g", {
      key: node.id,
      transform: "translate(".concat(node.x, ", ").concat(node.y, ")")
    }, isSelected ? /*#__PURE__*/React.createElement("circle", {
      r: node.r + 6,
      fill: "none",
      stroke: paint.head,
      strokeWidth: "1.5",
      opacity: "0.9"
    }) : null, isNeighbour ? /*#__PURE__*/React.createElement("circle", {
      r: node.r + 3,
      fill: "none",
      stroke: (_paint$status$node$st = paint.status[node.status]) !== null && _paint$status$node$st !== void 0 ? _paint$status$node$st : paint.status.open,
      strokeWidth: "1",
      opacity: "0.55"
    }) : null, /*#__PURE__*/React.createElement("circle", {
      r: node.r,
      fill: node.kind === "module" ? paint.paper : (_paint$status$node$st2 = paint.status[node.status]) !== null && _paint$status$node$st2 !== void 0 ? _paint$status$node$st2 : paint.status.open,
      fillOpacity: node.kind === "module" ? 1 : 0.9,
      stroke: (_paint$status$node$st3 = paint.status[node.status]) !== null && _paint$status$node$st3 !== void 0 ? _paint$status$node$st3 : paint.status.open,
      strokeWidth: node.kind === "module" ? 2 : 1,
      strokeOpacity: isNeighbour || isSelected ? 1 : 0.8
    }), node.kind === "module" ? /*#__PURE__*/React.createElement("text", {
      className: "atlas-map-numeral",
      textAnchor: "middle",
      dy: "4",
      fill: paint.status[node.status],
      fontSize: R.compact ? "10" : "11",
      fontFamily: "var(--font-mono)",
      letterSpacing: "0.06em"
    }, node.num) : null);
  }), R.nodes.map(function (node) {
    var label = R.labels[node.id];
    if (!label) return null;
    var isSelected = node.id === selectedId;
    return /*#__PURE__*/React.createElement("text", {
      key: "label-".concat(node.id),
      className: "atlas-map-label",
      x: label.x,
      y: label.baseline,
      fill: node.kind === "module" ? paint.head : isSelected ? paint.ink : paint.inkDim,
      fontSize: node.kind === "module" ? R.compact ? 11 : 12.5 : R.compact ? 9 : 10.5,
      fontFamily: node.kind === "module" ? "var(--font-head)" : "var(--font-body)",
      opacity: isSelected ? 1 : 0.88,
      paintOrder: "stroke",
      stroke: paint.paper,
      strokeWidth: "2.6",
      strokeLinejoin: "round"
    }, label.text);
  })), /*#__PURE__*/React.createElement("div", {
    className: "atlas-map-legend",
    "aria-hidden": "true"
  }, ["established", "effective", "schematic", "conjectural", "open"].map(function (name) {
    return /*#__PURE__*/React.createElement("span", {
      key: name,
      className: "atlas-map-legend-item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "atlas-map-swatch",
      style: {
        background: paint.status[name]
      }
    }), name);
  }), /*#__PURE__*/React.createElement("span", {
    className: "atlas-map-legend-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "atlas-map-swatch-line"
  }), "reading path"), /*#__PURE__*/React.createElement("span", {
    className: "atlas-map-legend-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "atlas-map-swatch-line dashed"
  }), "result / problem"))), /*#__PURE__*/React.createElement("div", {
    className: "atlas-map-nav"
  }, /*#__PURE__*/React.createElement("label", {
    className: "atlas-map-select"
  }, /*#__PURE__*/React.createElement("span", null, "node"), /*#__PURE__*/React.createElement("select", {
    value: selectedId !== null && selectedId !== void 0 ? selectedId : "",
    onChange: function onChange(e) {
      return setSelectedId(e.target.value || null);
    },
    "aria-describedby": ariaId
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 none \u2014"), nodes.map(function (node) {
    return /*#__PURE__*/React.createElement("option", {
      key: node.id,
      value: node.id
    }, nodeLabel(node));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "atlas-map-arrows",
    role: "group",
    "aria-label": "Move between connected nodes"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: function onClick() {
      return move("ArrowLeft");
    },
    "aria-label": "previous connected node"
  }, "\u2190"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: function onClick() {
      return move("ArrowUp");
    },
    "aria-label": "connected node above"
  }, "\u2191"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: function onClick() {
      return move("ArrowDown");
    },
    "aria-label": "connected node below"
  }, "\u2193"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: function onClick() {
      return move("ArrowRight");
    },
    "aria-label": "next connected node"
  }, "\u2192")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    disabled: !(selected !== null && selected !== void 0 && selected.view),
    onClick: function onClick() {
      return (selected === null || selected === void 0 ? void 0 : selected.view) && go(selected.view);
    }
  }, "Open ", selected !== null && selected !== void 0 && selected.view ? "module ".concat((_byId$get$num = (_byId$get2 = byId.get(selected.view)) === null || _byId$get2 === void 0 ? void 0 : _byId$get2.num) !== null && _byId$get$num !== void 0 ? _byId$get$num : "") : "—", " \u2197"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: function onClick() {
      return setSelectedId("planck");
    }
  }, "Reset")), /*#__PURE__*/React.createElement("div", {
    className: "atlas-map-detail",
    role: "status",
    "aria-live": "polite",
    onKeyDown: onKeyDown,
    tabIndex: 0
  }, selected ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "atlas-map-detail-head"
  }, /*#__PURE__*/React.createElement("strong", null, selected.kind === "module" ? "".concat(selected.num, " ").concat(selected.title) : (_selected$title = selected.title) !== null && _selected$title !== void 0 ? _selected$title : selected.label), /*#__PURE__*/React.createElement(Badge, {
    kind: selected.status
  }), selected.tex ? /*#__PURE__*/React.createElement("span", {
    className: "atlas-map-tex"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: selected.tex
  })) : null), selected.kind === "result" ? /*#__PURE__*/React.createElement("p", {
    className: "atlas-map-value"
  }, selected.value) : null, /*#__PURE__*/React.createElement("p", {
    className: "small dim",
    style: {
      margin: "6px 0 0 0"
    }
  }, selected.kind === "result" ? selected.detail : selected.kind === "problem" ? selected.detail : "Chapter ".concat(selected.num, " of the atlas.")), selected.kind === "result" ? /*#__PURE__*/React.createElement("p", {
    className: "mono dim",
    style: {
      fontSize: 10.5,
      margin: "6px 0 0 0",
      letterSpacing: "0.08em"
    }
  }, "recomputed as ", String(selected.check()), " \xB7 ", selected.reference.split(",")[0]) : null, neighbours.length ? /*#__PURE__*/React.createElement("p", {
    className: "mono dim",
    style: {
      fontSize: 10.5,
      margin: "6px 0 0 0",
      letterSpacing: "0.08em"
    }
  }, neighbours.length, " connected: ", neighbours.map(function (n) {
    return n.id;
  }).join(", ")) : null) : /*#__PURE__*/React.createElement("p", {
    className: "small dim",
    style: {
      margin: 0
    }
  }, "No node selected. Arrow keys walk the graph from the last selection.")), /*#__PURE__*/React.createElement("ul", {
    id: ariaId,
    className: "atlas-map-sr"
  }, textAlternative.map(function (line, i) {
    return /*#__PURE__*/React.createElement("li", {
      key: i
    }, line);
  })), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "atlas-map",
    status: "schematic"
  }, "The argument of the atlas as a graph: eight chapters, the fourteen numbers they compute, and the nine open problems that pull back on them. The edges are the reading path, not a claim that the chapters are equivalent. Positions come from a seeded force simulation committed as data, so the map is identical in every browser and carries no quantity: ", /*#__PURE__*/React.createElement("strong", null, "distance and angle mean nothing"), ", only adjacency does. Every result node repeats a number computed in its chapter and is recomputed again in the panel, so the map cannot drift from the science it summarises. On a narrow screen the names move out of the drawing into the selector and the panel: thirty labels do not fit in 308 px, and the graph stays readable as a navigator with numbered chapter discs."));
}

/**
 * Fit the committed unit-square layout into the stage. The labels sit on the right of every node, so the graph is
 * pushed to the left of the drawing area and labels are allowed to run into the right margin; a phone turns the map
 * portrait and gets a wider margin.
 */
AtlasMap.geometry = function geometry(layout, nodes, edges, opts) {
  var width = opts.width,
    height = opts.height;
  var compact = width < 520;
  var pad = compact ? 10 : 34;
  // The legend sits over the stage's bottom edge; the drawing area stops above it so no node is ever hidden by it.
  var legendBand = compact ? 52 : 34;
  var drawH = Math.max(120, height - pad * 2 - legendBand);
  var scale = Math.max(120, Math.min(width - pad * 2, drawH));
  // Labels are placed around each node, not stacked to its right: two result nodes a few pixels apart would collide
  // otherwise, and on a phone there is no right margin to run into. `placeLabels` picks one of eight anchors per node
  // in a fixed order, rejecting anchors whose box overlaps a box already placed.
  var ox = pad + (width - pad * 2 - scale) / 2;
  var oy = pad + (drawH - scale) / 2;
  var project = function project(id) {
    var p = layout[id];
    if (!p) throw new Error("atlas map: no committed position for ".concat(id));
    return {
      x: ox + scale * (p.x + 0.5),
      y: oy + scale * (p.y + 0.5)
    };
  };
  var pos = new Map(nodes.map(function (node) {
    return [node.id, project(node.id)];
  }));
  var placed = nodes.map(function (node) {
    return Object.freeze(_objectSpread(_objectSpread(_objectSpread({}, node), pos.get(node.id)), {}, {
      r: node.kind === "module" ? compact ? 13 : 16 : node.kind === "result" ? compact ? 5.5 : 7 : compact ? 7 : 9
    }));
  });
  // A phone cannot hold thirty labels in 308 px: the map then labels the eight chapters, the selected node and its
  // neighbours, and leaves the rest to the selector, the panel and the text alternative. Nothing is invented and
  // nothing is silently dropped — the full list is always one control away.
  // At 308 px thirty discs leave no room for thirty names, and a name printed over a disc is worse than no name: the
  // phone draws the graph as a navigator — numbered chapter discs and status-coloured dots — while the selector, the
  // detail panel and the text alternative carry every name. Desktop labels in place.
  var labelled = compact ? [] : placed;
  var labels = AtlasMap.placeLabels(labelled, {
    width: width,
    height: drawH,
    compact: compact,
    measure: opts.measure
  });
  return Object.freeze({
    width: width,
    height: height,
    scale: scale,
    pad: pad,
    compact: compact,
    pos: pos,
    nodes: placed,
    labels: labels,
    labelledIds: Object.freeze(labelled.map(function (node) {
      return node.id;
    })),
    edges: edges.map(function (edge) {
      return Object.freeze(_objectSpread(_objectSpread({}, edge), {}, {
        x1: pos.get(edge.from).x,
        y1: pos.get(edge.from).y,
        x2: pos.get(edge.to).x,
        y2: pos.get(edge.to).y
      }));
    })
  });
};

/**
 * Place one label per node without overlaps. Candidates are tried in a fixed order — right, left, above, below, then the
 * four diagonals — and the first that collides with neither a placed label nor a node disc wins. A node whose eight
 * candidates all collide keeps the least-bad one, so a label is never dropped silently; `clipped` marks it so the
 * caller can decide. Module labels are ranked first: they are the anchors of the picture.
 */
AtlasMap.placeLabels = function placeLabels(nodes, _ref2) {
  var width = _ref2.width,
    height = _ref2.height,
    compact = _ref2.compact,
    _ref2$measure = _ref2.measure,
    measureText = _ref2$measure === void 0 ? null : _ref2$measure;
  var GAP = 3;
  // Without a measuring function (Node tests) a character-width estimate is used; in the browser the component passes
  // a canvas measurement, which is exact for the font actually rendering the label.
  var CHAR_W = compact ? 5.4 : 5.9;
  var LINE_H = compact ? 12 : 13;
  var measure = function measure(node) {
    var _node$label;
    var text = node.kind === "module" ? node.title : (_node$label = node.label) !== null && _node$label !== void 0 ? _node$label : node.title;
    var kind = node.kind;
    return {
      w: Math.max(24, measureText ? measureText(text, kind) : text.length * CHAR_W),
      h: LINE_H,
      text: text
    };
  };
  var boxes = nodes.map(function (node) {
    return _objectSpread({
      node: node
    }, measure(node));
  });
  var order = _toConsumableArray(boxes).sort(function (a, b) {
    var rank = function rank(n) {
      return n.kind === "module" ? 0 : n.kind === "problem" ? 1 : 2;
    };
    return rank(a.node) - rank(b.node) || a.node.id.localeCompare(b.node.id);
  });
  var overlaps = function overlaps(a, b) {
    return !(a.x2 + GAP <= b.x1 || b.x2 + GAP <= a.x1 || a.y2 + GAP <= b.y1 || b.y2 + GAP <= a.y1);
  };
  var discBox = function discBox(node) {
    return {
      x1: node.x - node.r - 1.5,
      y1: node.y - node.r - 1.5,
      x2: node.x + node.r + 1.5,
      y2: node.y + node.r + 1.5
    };
  };
  var discs = new Map(nodes.map(function (node) {
    return [node.id, discBox(node)];
  }));
  var taken = [];
  var anchors = [{
    id: "right",
    place: function place(b) {
      return {
        x1: b.node.x + b.node.r + GAP + 2,
        y1: b.node.y - b.h / 2
      };
    }
  }, {
    id: "left",
    place: function place(b) {
      return {
        x1: b.node.x - b.node.r - GAP - 2 - b.w,
        y1: b.node.y - b.h / 2
      };
    }
  }, {
    id: "above",
    place: function place(b) {
      return {
        x1: b.node.x - b.w / 2,
        y1: b.node.y - b.node.r - GAP - 2 - b.h
      };
    }
  }, {
    id: "below",
    place: function place(b) {
      return {
        x1: b.node.x - b.w / 2,
        y1: b.node.y + b.node.r + GAP + 2
      };
    }
  }, {
    id: "up-right",
    place: function place(b) {
      return {
        x1: b.node.x + b.node.r * 0.72 + 2,
        y1: b.node.y - b.node.r * 0.72 - 2 - b.h
      };
    }
  }, {
    id: "up-left",
    place: function place(b) {
      return {
        x1: b.node.x - b.node.r * 0.72 - 2 - b.w,
        y1: b.node.y - b.node.r * 0.72 - 2 - b.h
      };
    }
  }, {
    id: "down-right",
    place: function place(b) {
      return {
        x1: b.node.x + b.node.r * 0.72 + 2,
        y1: b.node.y + b.node.r * 0.72 + 2
      };
    }
  }, {
    id: "down-left",
    place: function place(b) {
      return {
        x1: b.node.x - b.node.r * 0.72 - 2 - b.w,
        y1: b.node.y + b.node.r * 0.72 + 2
      };
    }
  }].concat(_toConsumableArray([1, -1].flatMap(function (dir) {
    return [{
      id: "right".concat(dir > 0 ? "down" : "up"),
      place: function place(b) {
        return {
          x1: b.node.x + b.node.r + GAP + 2,
          y1: b.node.y - b.h / 2 + dir * (b.h + GAP)
        };
      }
    }, {
      id: "left".concat(dir > 0 ? "down" : "up"),
      place: function place(b) {
        return {
          x1: b.node.x - b.node.r - GAP - 2 - b.w,
          y1: b.node.y - b.h / 2 + dir * (b.h + GAP)
        };
      }
    }];
  })), _toConsumableArray([1, 2, 3].flatMap(function (ring) {
    return [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) {
      var angle = k * Math.PI / 4;
      return {
        id: "ring".concat(ring, "-").concat(k),
        // The distance depends on the node being placed, so it is computed inside `place`, never at list-build time.
        place: function place(b) {
          var dist = b.node.r + GAP + 2 + ring * (b.h + GAP);
          var cx = b.node.x + Math.cos(angle) * dist;
          var cy = b.node.y + Math.sin(angle) * dist;
          return {
            x1: cx - (Math.cos(angle) < 0 ? b.w : 0) - (Math.abs(Math.cos(angle)) < 0.2 ? b.w / 2 : 0),
            y1: cy - b.h / 2
          };
        }
      };
    });
  })));
  var out = {};
  var _iterator2 = _createForOfIteratorHelper(order),
    _step2;
  try {
    var _loop = function _loop() {
      var box = _step2.value;
      var best = null;
      var _iterator3 = _createForOfIteratorHelper(anchors),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var anchor = _step3.value;
          var rect = anchor.place(box);
          var candidate = _objectSpread(_objectSpread({}, rect), {}, {
            x2: rect.x1 + box.w,
            y2: rect.y1 + box.h
          });
          var outside = candidate.x1 < 2 || candidate.y1 < 2 || candidate.x2 > width - 2 || candidate.y2 > height - 2;
          // A label may never sit on a node disc, its own included (that would hide the node it names); it may only
          // overlap another label as a last resort, which `clipped` reports rather than hides.
          var hitsDisc = false;
          var _iterator5 = _createForOfIteratorHelper(discs),
            _step5;
          try {
            for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
              var _step5$value = _slicedToArray(_step5.value, 2),
                id = _step5$value[0],
                disc = _step5$value[1];
              if (overlaps(candidate, disc)) {
                hitsDisc = true;
                break;
              }
            }
          } catch (err) {
            _iterator5.e(err);
          } finally {
            _iterator5.f();
          }
          var hitsLabel = false;
          for (var _i3 = 0, _taken2 = taken; _i3 < _taken2.length; _i3++) {
            var other = _taken2[_i3];
            if (overlaps(candidate, other)) {
              hitsLabel = true;
              break;
            }
          }
          var cost = (outside ? 8 : 0) + (hitsLabel ? 3 : 0) + (hitsDisc ? 100 : 0);
          if (cost === 0) {
            best = _objectSpread(_objectSpread({}, candidate), {}, {
              anchor: anchor.id,
              clipped: false,
              cost: cost
            });
            break;
          }
          if (!best || cost < best.cost) best = _objectSpread(_objectSpread({}, candidate), {}, {
            anchor: anchor.id,
            clipped: outside || hitsDisc || hitsLabel,
            cost: cost
          });
        }
        // Deterministic last resort: a fine ring scan around the node. A crowded region of the graph is exactly where a
        // label has to travel further out rather than sit on a node, and the search is cheap because the map is static.
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      if (best.cost >= 100) {
        var free = function free(rect) {
          var candidate = _objectSpread(_objectSpread({}, rect), {}, {
            x2: rect.x1 + box.w,
            y2: rect.y1 + box.h
          });
          if (candidate.x1 < 2 || candidate.y1 < 2 || candidate.x2 > width - 2 || candidate.y2 > height - 2) return null;
          var _iterator4 = _createForOfIteratorHelper(discs.values()),
            _step4;
          try {
            for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
              var disc = _step4.value;
              if (overlaps(candidate, disc)) return null;
            }
          } catch (err) {
            _iterator4.e(err);
          } finally {
            _iterator4.f();
          }
          for (var _i2 = 0, _taken = taken; _i2 < _taken.length; _i2++) {
            var other = _taken[_i2];
            if (overlaps(candidate, other)) return null;
          }
          return candidate;
        };
        search: for (var radius = box.node.r + GAP + 2; radius < box.node.r + 140; radius += 3) {
          for (var k = 0; k < 32; k += 1) {
            var angle = k * Math.PI / 16;
            var cx = box.node.x + Math.cos(angle) * radius;
            var cy = box.node.y + Math.sin(angle) * radius;
            var found = free({
              x1: cx - box.w / 2,
              y1: cy - box.h / 2
            });
            if (found) {
              best = _objectSpread(_objectSpread({}, found), {}, {
                anchor: "scan",
                clipped: false,
                cost: 0
              });
              break search;
            }
          }
        }
      }
      taken.push({
        x1: best.x1,
        y1: best.y1,
        x2: best.x2,
        y2: best.y2
      });
      out[box.node.id] = Object.freeze({
        x: best.x1,
        y: best.y1,
        w: box.w,
        h: box.h,
        anchor: best.anchor,
        clipped: best.clipped,
        text: box.text,
        baseline: best.y1 + box.h * 0.78
      });
    };
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      _loop();
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return Object.freeze(out);
};
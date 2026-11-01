/* Compiled from js/figure/Figure.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
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
// Figure.jsx — mounts one Figure Kit figure: title bar, canvas plot, KaTeX overlay, crosshair with
// nearest-sample readout, keyboard control, generated summary and a decimated data table.
//
//   <Figure spec={useMemo(() => buildSpec(...), [...])}>caption…</Figure>
//
// `spec` comes from QGA_FIGURE.figure(); keep it memoised so the scene is rebuilt only on change.
// Optional controlled interaction (the RG scale plot, the strain scrubber):
//   onHover(x | null)  pointer position in data x; onSelect(x)  click or tap in data x;
//   onNudge(dir, big)  arrow keys / Home (-Infinity) / End (+Infinity) instead of the built-in crosshair;
//   backdrop(ctx, plot) paints under the scene (a rendered image) and backdropKey redraws it;
//   onScrub(x)         press and drag (capture) in data x; the strain panels seek with it;
//   slider             { min, max, now, text } turns the plot into role="slider"; readout replaces the crosshair text.
//   lens               { sceneId, formulaId, termTargets, live }, memoised: focusing a term of the formula lights the marks it names
//                      (figure/lens.mjs); the lit marks are drawn at the focal width and the others recede.

var FIG_FORMAT = function FIG_FORMAT(v) {
  return Number.isFinite(v) ? Number(v.toPrecision(4)).toString() : "n/a";
};
function useFigureMeasure() {
  var _useState = useState(0),
    _useState2 = _slicedToArray(_useState, 2),
    version = _useState2[0],
    setVersion = _useState2[1];
  var measure = useMemo(function () {
    var F = window.QGA_FIGURE;
    return F.canvasMeasure(document.createElement("canvas").getContext("2d"));
  }, [version]);
  useEffect(function () {
    var live = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      if (live) setVersion(function (v) {
        return v + 1;
      });
    });
    return function () {
      live = false;
    };
  }, []);
  return {
    measure: measure,
    version: version
  };
}
function Figure(_ref) {
  var spec = _ref.spec,
    children = _ref.children,
    _ref$className = _ref.className,
    className = _ref$className === void 0 ? "" : _ref$className,
    onHover = _ref.onHover,
    onSelect = _ref.onSelect,
    onNudge = _ref.onNudge,
    slider = _ref.slider,
    extra = _ref.extra,
    readoutOverride = _ref.readout,
    onScrub = _ref.onScrub,
    backdrop = _ref.backdrop,
    backdropKey = _ref.backdropKey,
    lens = _ref.lens;
  var F = window.QGA_FIGURE;
  var _useState3 = useState([]),
    _useState4 = _slicedToArray(_useState3, 2),
    lit = _useState4[0],
    setLit = _useState4[1];
  var specRef = useRef(spec);
  specRef.current = spec;
  useEffect(function () {
    if (!lens) return undefined;
    var handle = F.createFigureLens(_objectSpread(_objectSpread({
      spec: function spec() {
        return specRef.current;
      }
    }, lens), {}, {
      onChange: setLit
    }));
    return function () {
      return handle.dispose();
    };
  }, [lens]); // eslint-disable-line
  var wrapRef = useRef(null);
  var cvRef = useRef(null);
  var scratch = useRef({});
  var _useState5 = useState(0),
    _useState6 = _slicedToArray(_useState5, 2),
    width = _useState6[0],
    setWidth = _useState6[1];
  var _useState7 = useState(0),
    _useState8 = _slicedToArray(_useState7, 2),
    theme = _useState8[0],
    setTheme = _useState8[1];
  var _useState9 = useState(null),
    _useState0 = _slicedToArray(_useState9, 2),
    cursor = _useState0[0],
    setCursor = _useState0[1];
  var _useState1 = useState(false),
    _useState10 = _slicedToArray(_useState1, 2),
    tableOpen = _useState10[0],
    setTableOpen = _useState10[1];
  var _useFigureMeasure = useFigureMeasure(),
    measure = _useFigureMeasure.measure,
    version = _useFigureMeasure.version;
  var uid = useMemo(function () {
    return "fig-" + spec.id;
  }, [spec.id]);
  useEffect(function () {
    var el = wrapRef.current;
    if (!el) return undefined;
    var ro = new ResizeObserver(function (entries) {
      return setWidth(Math.floor(entries[0].contentRect.width));
    });
    ro.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return function () {
      return ro.disconnect();
    };
  }, []);
  useEffect(function () {
    return window.QGA_TOKENS.onThemeChange(function () {
      return setTheme(function (t) {
        return t + 1;
      });
    });
  }, []);
  var fonts = useMemo(function () {
    var T = window.QGA_TOKENS.current();
    return {
      tick: T.font.mono(-2),
      label: T.font.mono(-1),
      family: T.font.family.mono
    };
  }, [theme]);
  var scene = useMemo(function () {
    return width >= 120 ? F.buildScene(spec, {
      width: width,
      height: spec.height,
      measure: measure,
      fonts: fonts,
      lit: lit
    }) : null;
  }, [spec, width, measure, fonts, version, lit]);
  useEffect(function () {
    setCursor(null);
  }, [spec.id]);
  useEffect(function () {
    var _window;
    if (!scene || !cvRef.current) return;
    var ctx = F.prepareCanvas(cvRef.current, scene.width, scene.height);
    // Diagnostics for qa/specs/figure-kit.spec.mjs: the resolved scene of each mounted figure.
    ((_window = window).QGA_FIGURE_SCENES || (_window.QGA_FIGURE_SCENES = new Map())).set(spec.id, scene);
    if (backdrop) backdrop(ctx, scene.plot);
    F.drawScene(ctx, scene, {
      fonts: fonts,
      scratch: scratch.current
    });
  }, [scene, fonts, theme, backdropKey]); // eslint-disable-line

  var summary = useMemo(function () {
    return F.figureSummary(spec);
  }, [spec]);
  var table = useMemo(function () {
    return tableOpen ? F.dataTable(spec) : null;
  }, [spec, tableOpen]);
  var focal = scene && scene.focal;
  var n = focal ? focal.x.length : 0;
  var clampIndex = function clampIndex(i) {
    return Math.max(0, Math.min(n - 1, i));
  };
  var onKeyDown = function onKeyDown(e) {
    if (onNudge) {
      var dir = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : e.key === "End" ? Infinity : e.key === "Home" ? -Infinity : 0;
      if (dir) {
        e.preventDefault();
        onNudge(dir, e.shiftKey);
      }
      return;
    }
    if (!n) return;
    var big = e.shiftKey ? 10 : 1;
    var next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = clampIndex((cursor !== null && cursor !== void 0 ? cursor : -1) + big);else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = clampIndex((cursor !== null && cursor !== void 0 ? cursor : n) - big);else if (e.key === "Home") next = 0;else if (e.key === "End") next = n - 1;else if (e.key === "Escape") {
      setCursor(null);
      return;
    }
    if (next !== null) {
      e.preventDefault();
      setCursor(next);
    }
  };
  var dataX = function dataX(e) {
    var r = e.currentTarget.getBoundingClientRect();
    var px = Math.min(scene.plot.x + scene.plot.w, Math.max(scene.plot.x, e.clientX - r.left));
    return scene.sx.invert(px);
  };
  var onPointer = function onPointer(e) {
    if (!scene) return;
    if (onHover) onHover(dataX(e));
    if (onScrub && e.buttons & 1) onScrub(dataX(e));
    if (!focal || onNudge || onHover) return;
    var x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    if (x < scene.plot.x || x > scene.plot.x + scene.plot.w) return;
    setCursor(F.nearestIndex(focal.x, scene.sx.invert(x)));
  };
  var cx = scene && cursor !== null ? scene.sx.map(focal.x[cursor]) : null;
  var cy = scene && cursor !== null ? scene.sy.map(focal.y[cursor]) : null;
  var readout = readoutOverride ? readoutOverride : cursor !== null ? "".concat(focal.label, ": ").concat(spec.x.label ? spec.x.label.plain : "x", " = ").concat(FIG_FORMAT(focal.x[cursor]), ", ").concat(spec.y.label ? spec.y.label.plain : "y", " = ").concat(FIG_FORMAT(focal.y[cursor])) : "";
  return /*#__PURE__*/React.createElement("figure", {
    className: "fig " + className,
    "data-figure": spec.id,
    "data-status": spec.status,
    "aria-labelledby": uid + "-title"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fig-bar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fig-kicker"
  }, "Figure"), /*#__PURE__*/React.createElement("span", {
    className: "fig-id"
  }, spec.provenanceId), /*#__PURE__*/React.createElement("span", {
    id: uid + "-title",
    className: "fig-title"
  }, spec.title), /*#__PURE__*/React.createElement(Badge, {
    kind: spec.status
  })), /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "fig-plot",
    style: {
      height: scene ? scene.height : spec.height
    },
    tabIndex: 0,
    role: slider ? "slider" : "group",
    "aria-roledescription": slider ? undefined : "plot",
    "aria-label": spec.title + ". Arrow keys move along the data, Home and End jump to the ends.",
    "aria-valuemin": slider && slider.min,
    "aria-valuemax": slider && slider.max,
    "aria-valuenow": slider && slider.now,
    "aria-valuetext": slider && slider.text,
    "aria-describedby": uid + "-summary",
    onKeyDown: onKeyDown,
    onPointerMove: onPointer,
    onClick: function onClick(e) {
      if (onSelect && scene) onSelect(dataX(e));
    },
    onPointerDown: function onPointerDown(e) {
      if (onScrub && scene) {
        e.currentTarget.setPointerCapture(e.pointerId);
        onScrub(dataX(e));
      }
    },
    onPointerLeave: function onPointerLeave() {
      setCursor(null);
      if (onHover) onHover(null);
    },
    onBlur: function onBlur() {
      return setCursor(null);
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: cvRef,
    className: "fig-canvas",
    style: {
      width: width || "100%",
      height: scene ? scene.height : spec.height
    }
  }), scene ? /*#__PURE__*/React.createElement(FigureTex, {
    items: scene.overlays
  }) : null, extra && scene ? extra(scene) : null, cx !== null && Number.isFinite(cx) && Number.isFinite(cy) ? /*#__PURE__*/React.createElement("div", {
    className: "fig-cross",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("i", {
    className: "fig-cross-v",
    style: {
      left: cx,
      top: scene.plot.y,
      height: scene.plot.h
    }
  }), /*#__PURE__*/React.createElement("i", {
    className: "fig-cross-dot",
    style: {
      left: cx,
      top: cy
    }
  })) : null), /*#__PURE__*/React.createElement("div", {
    className: "fig-readout",
    role: "status",
    "aria-live": "polite"
  }, readout), /*#__PURE__*/React.createElement("p", {
    id: uid + "-summary",
    className: "fig-summary"
  }, summary), /*#__PURE__*/React.createElement("details", {
    className: "fig-data",
    onToggle: function onToggle(e) {
      return setTableOpen(e.currentTarget.open);
    }
  }, /*#__PURE__*/React.createElement("summary", null, "Data"), table && table.rows.length ? /*#__PURE__*/React.createElement("div", {
    className: "fig-table-wrap",
    tabIndex: 0,
    role: "region",
    "aria-label": spec.title + " data table"
  }, /*#__PURE__*/React.createElement("table", {
    className: "fig-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, table.columns.map(function (c) {
    return /*#__PURE__*/React.createElement("th", {
      key: c,
      scope: "col"
    }, c);
  }))), /*#__PURE__*/React.createElement("tbody", null, table.rows.map(function (row, i) {
    return /*#__PURE__*/React.createElement("tr", {
      key: i
    }, row.map(function (v, j) {
      return /*#__PURE__*/React.createElement("td", {
        key: j
      }, FIG_FORMAT(v));
    }));
  }))), table.truncated ? /*#__PURE__*/React.createElement("p", {
    className: "fig-note"
  }, "Showing ", table.rows.length, " evenly spaced rows.") : null) : table ? /*#__PURE__*/React.createElement("p", {
    className: "fig-note"
  }, "This figure has no tabulated series.") : null), children ? /*#__PURE__*/React.createElement("figcaption", {
    className: "fig-caption"
  }, children) : null);
}
Object.assign(window, {
  Figure: Figure
});
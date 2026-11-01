/* Compiled from js/core.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
// core.jsx — shared scientific UI components for Quantum Gravity Atlas
var _React = React,
  useState = _React.useState,
  useEffect = _React.useEffect,
  useRef = _React.useRef,
  useMemo = _React.useMemo,
  useCallback = _React.useCallback,
  useContext = _React.useContext;

/* ---------- global atlas settings (visualization mode, motion, detail, pathway) ---------- */
var QGA_SETTINGS_DEFAULTS = {
  vizMode: "cinematic",
  // scientific | cinematic | minimal
  motion: "balanced",
  // reduced | balanced | full
  detail3d: "medium",
  // low | medium | ultra
  renderBackend: "auto",
  toneMapping: "agx",
  labels3d: true,
  annotations3d: true,
  pathway: "student" // beginner | student | advanced
};
var AtlasSettingsContext = React.createContext(QGA_SETTINGS_DEFAULTS);
function useAtlasSettings() {
  return useContext(AtlasSettingsContext);
}

/* ---------- hooks ---------- */
function usePRM() {
  var _useState = useState(function () {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }),
    _useState2 = _slicedToArray(_useState, 2),
    prm = _useState2[0],
    setPrm = _useState2[1];
  useEffect(function () {
    var m = window.matchMedia("(prefers-reduced-motion: reduce)");
    var f = function f(e) {
      return setPrm(e.matches);
    };
    m.addEventListener("change", f);
    return function () {
      return m.removeEventListener("change", f);
    };
  }, []);
  return prm;
}

// Canvas helper: fits canvas to its CSS box at devicePixelRatio, returns logical dims.
function fitCanvas(canvas) {
  var r = canvas.getBoundingClientRect();
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var w = Math.max(10, r.width),
    h = Math.max(10, r.height);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  var ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return {
    ctx: ctx,
    w: w,
    h: h
  };
}

// Generic simulation loop. draw(ctx, w, h, t, dt) is called each frame while playing.
// Returns canvas ref + control state for SimBar.
function useSimLoop(draw) {
  var deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var canvasRef = useRef(null);
  var _useState3 = useState(true),
    _useState4 = _slicedToArray(_useState3, 2),
    playing = _useState4[0],
    setPlaying = _useState4[1];
  var _useState5 = useState(1),
    _useState6 = _slicedToArray(_useState5, 2),
    speed = _useState6[0],
    setSpeed = _useState6[1];
  var _useState7 = useState(0),
    _useState8 = _slicedToArray(_useState7, 2),
    resetCount = _useState8[0],
    setResetCount = _useState8[1];
  var tRef = useRef(0);
  var playingRef = useRef(true);
  var speedRef = useRef(1);
  playingRef.current = playing;
  speedRef.current = speed;
  var drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(function () {
    tRef.current = 0;
  }, [resetCount]);
  useEffect(function () {
    var raf,
      last = performance.now(),
      alive = true,
      visible = true;
    var io = new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
    }, {
      threshold: 0.02
    });
    if (canvasRef.current) io.observe(canvasRef.current);
    var _tick = function tick(now) {
      if (!alive) return;
      raf = requestAnimationFrame(_tick);
      var cv = canvasRef.current;
      if (cv && visible) {
        var rawDt = Math.min(0.05, (now - last) / 1000);
        var dt = playingRef.current ? rawDt * speedRef.current : 0;
        tRef.current += dt;
        var _fitCanvas = fitCanvas(cv),
          ctx = _fitCanvas.ctx,
          w = _fitCanvas.w,
          h = _fitCanvas.h;
        drawRef.current(ctx, w, h, tRef.current, dt);
      }
      last = now;
    };
    raf = requestAnimationFrame(_tick);
    return function () {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, deps); // eslint-disable-line
  var reset = useCallback(function () {
    return setResetCount(function (c) {
      return c + 1;
    });
  }, []);
  return {
    canvasRef: canvasRef,
    playing: playing,
    setPlaying: setPlaying,
    speed: speed,
    setSpeed: setSpeed,
    reset: reset,
    resetCount: resetCount,
    tRef: tRef
  };
}

/* ---------- equation rendering (KaTeX) ---------- */
// Formula Core (js/formula) marks addressable terms with \htmlData; KaTeX 0.16.9 renders that only
// under `trust`, so trust exactly that command and nothing else.
var KATEX_BASE_OPTIONS = {
  throwOnError: false,
  trust: function trust(ctx) {
    return ctx.command === "\\htmlData";
  },
  strict: function strict(code) {
    return code === "htmlExtension" ? "ignore" : "warn";
  }
};
function Eq(_ref) {
  var tex = _ref.tex,
    _ref$display = _ref.display,
    display = _ref$display === void 0 ? false : _ref$display;
  var ref = useRef(null);
  useEffect(function () {
    var el = ref.current;
    if (!el) return;
    if (window.katex) {
      try {
        window.katex.render(tex, el, _objectSpread(_objectSpread({}, KATEX_BASE_OPTIONS), {}, {
          displayMode: display
        }));
      } catch (e) {
        el.textContent = tex;
      }
    } else {
      el.textContent = tex;
      // katex may still be loading; retry once shortly after
      var id = setTimeout(function () {
        if (window.katex && ref.current) {
          try {
            window.katex.render(tex, ref.current, _objectSpread(_objectSpread({}, KATEX_BASE_OPTIONS), {}, {
              displayMode: display
            }));
          } catch (e) {}
        }
      }, 600);
      return function () {
        return clearTimeout(id);
      };
    }
  }, [tex, display]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    className: display ? "eq-display" : "eq-inline"
  });
}

/* Renders a string with inline math delimited by $…$ through KaTeX. Data
   modules stay plain, searchable strings while any formula in them is
   typeset; text without a $ is returned untouched. */
function RichText(_ref2) {
  var text = _ref2.text;
  if (typeof text !== "string") return text;
  if (text.indexOf("$") < 0) return text;
  var parts = text.split(/\$([^$]+)\$/g);
  return /*#__PURE__*/React.createElement(React.Fragment, null, parts.map(function (p, i) {
    return i % 2 ? /*#__PURE__*/React.createElement(Eq, {
      key: i,
      tex: p
    }) : p;
  }));
}

/* A number in scientific notation as TeX: sciTex(7.96e8, 2) is "7.96\times10^{8}", so a readout can be typeset with Eq instead of printed as 7.96e+8. */
function sciTex(x, digits) {
  var _x$toExponential$spli = x.toExponential(digits).split("e"),
    _x$toExponential$spli2 = _slicedToArray(_x$toExponential$spli, 2),
    mantissa = _x$toExponential$spli2[0],
    exponent = _x$toExponential$spli2[1];
  return mantissa + "\\times10^{" + Number(exponent) + "}";
}

/* Plain-text projection of a RichText string, for search and aria labels. */
function richPlain(text) {
  return typeof text === "string" ? text.replace(/\$[^$]*\$/g, " ") : "";
}

/* ---------- badges ---------- */
var BADGE_LABELS = {
  established: "Established physics",
  effective: "Effective theory",
  conjectural: "Conjectural",
  schematic: "Schematic",
  heuristic: "Heuristic picture",
  open: "Open problem"
};
function Badge(_ref3) {
  var kind = _ref3.kind;
  return /*#__PURE__*/React.createElement("span", {
    className: "badge badge-" + kind
  }, BADGE_LABELS[kind] || kind);
}

/* ---------- formula card with built-in Formula Lens ---------- */
// Prompt 10 formula linking: every symbol row is a ConceptBus publisher.
// Hover, keyboard focus and click all highlight the matching scene object
// (when the mounted scene registered one) and surface its live numerical
// value + unit. Unknown mappings do nothing visible — by design.
function FormulaCard(_ref4) {
  var _window$QGA_FORMULA$l, _window$QGA_FORMULA;
  var title = _ref4.title,
    tex = _ref4.tex,
    status = _ref4.status,
    _ref4$symbols = _ref4.symbols,
    symbols = _ref4$symbols === void 0 ? [] : _ref4$symbols,
    meaning = _ref4.meaning,
    limits = _ref4.limits,
    formulaId = _ref4.formulaId,
    texAfter = _ref4.texAfter;
  var _useState9 = useState(false),
    _useState0 = _slicedToArray(_useState9, 2),
    open = _useState0[0],
    setOpen = _useState0[1];
  var _useState1 = useState(null),
    _useState10 = _slicedToArray(_useState1, 2),
    readout = _useState10[0],
    setReadout = _useState10[1];
  var _useState11 = useState(null),
    _useState12 = _slicedToArray(_useState11, 2),
    termReadout = _useState12[0],
    setTermReadout = _useState12[1];
  var rootRef = useRef(null);
  var eqRef = useRef(null);
  // Formula Lens (S10): with a formulaId the equation is the Formula Core TeX (its \htmlData terms are focusable and
  // drive the scene through the ConceptBus); `texAfter` appends TeX the formula does not hold. Without it nothing changes.
  var formula = formulaId ? (_window$QGA_FORMULA$l = (_window$QGA_FORMULA = window.QGA_FORMULA) === null || _window$QGA_FORMULA === void 0 ? void 0 : _window$QGA_FORMULA.lens.formula(formulaId)) !== null && _window$QGA_FORMULA$l !== void 0 ? _window$QGA_FORMULA$l : null : null;
  // A definition whose output.tex is empty states a relation with no subject (a gauge group, an operator); it renders as
  // the expression alone, not as " = <equation>".
  var cardTex = formula ? (formula.output.tex ? formula.output.tex + " = " : "") + formula.tex + (texAfter || "") : tex;
  useEffect(function () {
    if (!formula || !eqRef.current) return undefined;
    return window.QGA_LINKING.attachFormulaTerms({
      container: eqRef.current,
      formula: formula,
      onReadout: setTermReadout
    });
  }, [formula]);
  var reveal = useCallback(function () {
    setOpen(true);
    var smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(function () {
      var _rootRef$current;
      return (_rootRef$current = rootRef.current) === null || _rootRef$current === void 0 ? void 0 : _rootRef$current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "center"
      });
    });
  }, []);
  useEffect(function () {
    // Palette "jump to formula": open this card when asked by title (live
    // event for same-view jumps, pending focus for cross-view navigation).
    var onOpen = function onOpen(event) {
      var _event$detail;
      if (((_event$detail = event.detail) === null || _event$detail === void 0 ? void 0 : _event$detail.title) === title) reveal();
    };
    window.addEventListener("qga-open-formula", onOpen);
    if (window.__qgaPendingFormulaFocus === title) {
      window.__qgaPendingFormulaFocus = null;
      reveal();
    }
    return function () {
      return window.removeEventListener("qga-open-formula", onOpen);
    };
  }, [title, reveal]);
  var publishHighlight = function publishHighlight(symbol, interaction) {
    var _window$QGA_CONCEPT_B;
    (_window$QGA_CONCEPT_B = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B === void 0 || _window$QGA_CONCEPT_B.publish("formula-highlight", {
      symbol: symbol,
      title: title,
      view: window.__qgaCurrentView || "unknown",
      interaction: interaction
    });
  };
  var clearHighlight = function clearHighlight() {
    var _window$QGA_CONCEPT_B2;
    (_window$QGA_CONCEPT_B2 = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B2 === void 0 || _window$QGA_CONCEPT_B2.publish("formula-clear", {
      reason: "blur"
    });
  };
  // Live readout subscription: the scene reports the highlighted symbol's
  // current numerical value and unit.
  useEffect(function () {
    var bus = window.QGA_CONCEPT_BUS;
    if (!bus) return undefined;
    var onReadout = function onReadout(payload) {
      return setReadout(payload);
    };
    var onClear = function onClear() {
      return setReadout(null);
    };
    var offReadout = bus.on("formula-readout", onReadout);
    var offClear = bus.on("formula-clear", onClear);
    return function () {
      offReadout();
      offClear();
    };
  }, []); // eslint-disable-line
  return /*#__PURE__*/React.createElement("div", {
    className: "formula-card" + (open ? " open" : "") + (formula ? " fc-lens" : ""),
    "data-qga-formula": title,
    ref: rootRef
  }, /*#__PURE__*/React.createElement("button", {
    className: "fc-head",
    onClick: function onClick() {
      return setOpen(!open);
    },
    "aria-expanded": open
  }, /*#__PURE__*/React.createElement("div", {
    className: "fc-title-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fc-title"
  }, title), status ? /*#__PURE__*/React.createElement(Badge, {
    kind: status
  }) : null), formula ? null : /*#__PURE__*/React.createElement("div", {
    className: "fc-eq"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: cardTex,
    display: true
  })), /*#__PURE__*/React.createElement("span", {
    className: "fc-hint"
  }, open ? "− collapse lens" : "+ formula lens · symbols & meaning")), formula ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "fc-eq fc-eq-lens",
    ref: eqRef,
    role: "group",
    "aria-label": title + ": equation, terms are interactive"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: cardTex,
    display: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "fc-lens-readout",
    role: "status",
    "aria-live": "polite"
  }, termReadout ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "fc-lens-label"
  }, termReadout.label), " = ", /*#__PURE__*/React.createElement("strong", null, termReadout.value), termReadout.unit ? " " + termReadout.unit : "") : null)) : null, open ? /*#__PURE__*/React.createElement("div", {
    className: "fc-body"
  }, symbols.length > 0 ? /*#__PURE__*/React.createElement("table", {
    className: "fc-symbols"
  }, /*#__PURE__*/React.createElement("tbody", null, symbols.map(function (s, i) {
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "fc-symbol-row",
      tabIndex: 0,
      "aria-label": "Symbol " + s.s + ": " + richPlain(s.d) + (readout && readout.symbol === s.s ? ". Live scene value: " + readout.value + " " + readout.unit : ""),
      onMouseEnter: function onMouseEnter() {
        return publishHighlight(s.s, "hover");
      },
      onMouseLeave: clearHighlight,
      onFocus: function onFocus() {
        return publishHighlight(s.s, "focus");
      },
      onBlur: clearHighlight,
      onClick: function onClick() {
        return publishHighlight(s.s, "click");
      }
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Eq, {
      tex: s.s
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(RichText, {
      text: s.d
    }), readout && readout.symbol === s.s ? /*#__PURE__*/React.createElement("span", {
      className: "fc-readout",
      role: "status"
    }, /*#__PURE__*/React.createElement("span", {
      className: "fc-readout-label"
    }, readout.label), /*#__PURE__*/React.createElement("strong", {
      className: "fc-readout-value"
    }, readout.value), /*#__PURE__*/React.createElement("span", {
      className: "fc-readout-unit"
    }, readout.unit)) : null));
  }))) : null, meaning ? /*#__PURE__*/React.createElement("p", {
    className: "fc-meaning"
  }, /*#__PURE__*/React.createElement(RichText, {
    text: meaning
  })) : null, limits ? /*#__PURE__*/React.createElement("p", {
    className: "fc-limits"
  }, /*#__PURE__*/React.createElement("strong", null, "Assumptions / limits."), " ", /*#__PURE__*/React.createElement(RichText, {
    text: limits
  })) : null) : null);
}

/* ---------- misconception alert ---------- */
function Misconception(_ref5) {
  var title = _ref5.title,
    children = _ref5.children;
  return /*#__PURE__*/React.createElement("div", {
    className: "misconception"
  }, /*#__PURE__*/React.createElement("div", {
    className: "misc-label"
  }, "Misconception alert"), /*#__PURE__*/React.createElement("h3", null, title), /*#__PURE__*/React.createElement("p", null, children));
}

/* ---------- layout pieces ---------- */
function Section(_ref6) {
  var index = _ref6.index,
    title = _ref6.title,
    children = _ref6.children;
  return /*#__PURE__*/React.createElement("section", {
    className: "section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, index ? /*#__PURE__*/React.createElement("span", {
    className: "section-index"
  }, index) : null, /*#__PURE__*/React.createElement("h2", null, title)), children);
}

// The chapter's signature image, rendered from its own science by scripts/render-covers.mjs. Clicking it scrolls to
// the figure that produced it, so the cover is a door rather than decoration.
var COVER_SLUG = {
  "01": "standard-model",
  "02": "qft",
  "03": "rg",
  "04": "gr",
  "05": "planck",
  "06": "approaches",
  "07": "blackholes",
  "08": "experiments"
};

// A cover file is only as wide as the figure it frames (794-998 px) and it is drawn at that width, never stretched to
// fill the column. `sizes` states the band so the browser can pick, and `max-width` pins the file at its intrinsic
// width: before this, `srcset` claimed 1200w and 2400w for 794 and 950 px files, so the browser chose the thumbnail
// for a 1000 px slot and the band upscaled it.
var COVER_SIZES = "min(100vw, 1000px)";
function coverSidecar(slug) {
  return typeof window !== "undefined" && window.QGA_COVERS && window.QGA_COVERS[slug] || null;
}
function ModuleHeader(_ref7) {
  var num = _ref7.num,
    kicker = _ref7.kicker,
    title = _ref7.title,
    lede = _ref7.lede,
    label = _ref7.label,
    target = _ref7.target;
  var slug = COVER_SLUG[num];
  var reduced = usePRM();
  var openSource = function openSource() {
    if (!target) return;
    var el = document.querySelector(target);
    if (el) el.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start"
    });
  };
  return /*#__PURE__*/React.createElement("header", {
    "data-screen-label": label || title
  }, /*#__PURE__*/React.createElement("div", {
    className: "module-kicker"
  }, "Module ", num, " \u2014 ", kicker), /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("p", {
    className: "module-lede"
  }, lede), slug ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "module-cover",
    onClick: openSource,
    disabled: !target,
    "aria-label": "".concat(title, ": show the figure that produced this cover")
  }, function () {
    var meta = coverSidecar(slug);
    var sizes = meta && Array.isArray(meta.sizes) && meta.sizes.length === 2 ? meta.sizes : null;
    var hero = sizes ? sizes.find(function (s) {
      return !/-sm\.png$/.test(s.file);
    }) : null;
    return /*#__PURE__*/React.createElement("img", {
      src: hero ? "docs/covers/".concat(hero.file) : "docs/covers/".concat(slug, ".png"),
      srcSet: sizes ? sizes.map(function (s) {
        return "docs/covers/".concat(s.file, " ").concat(s.width, "w");
      }).join(", ") : undefined,
      sizes: sizes ? COVER_SIZES : undefined
      // Pinned to the file's own width: the band is 1000 px but a 950 px cover must not be stretched to fill it.
      ,
      style: hero ? {
        maxWidth: "".concat(hero.width, "px")
      } : undefined,
      alt: "",
      loading: "eager",
      fetchpriority: "high",
      decoding: "async",
      width: hero ? hero.width : undefined,
      height: hero ? hero.height : undefined
    });
  }(), /*#__PURE__*/React.createElement("span", {
    className: "module-cover-hint"
  }, "the figure behind this chapter")) : null);
}

/* ---------- controls ---------- */
function SliderRow(_ref8) {
  var label = _ref8.label,
    labelTex = _ref8.labelTex,
    min = _ref8.min,
    max = _ref8.max,
    step = _ref8.step,
    value = _ref8.value,
    _onChange = _ref8.onChange,
    format = _ref8.format;
  return /*#__PURE__*/React.createElement("div", {
    className: "ctl-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ctl-label"
  }, labelTex ? /*#__PURE__*/React.createElement(Eq, {
    tex: labelTex
  }) : label), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: function onChange(e) {
      return _onChange(parseFloat(e.target.value));
    },
    "aria-label": label
  }), /*#__PURE__*/React.createElement("span", {
    className: "ctl-value"
  }, format ? format(value) : value));
}
function Toggle(_ref9) {
  var label = _ref9.label,
    checked = _ref9.checked,
    onChange = _ref9.onChange;
  return /*#__PURE__*/React.createElement("span", {
    className: "toggle-row",
    onClick: function onClick() {
      return onChange(!checked);
    },
    role: "switch",
    "aria-checked": checked,
    tabIndex: 0,
    onKeyDown: function onKeyDown(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onChange(!checked);
      }
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "toggle-track" + (checked ? " on" : "")
  }, /*#__PURE__*/React.createElement("span", {
    className: "toggle-dot"
  })), /*#__PURE__*/React.createElement("span", {
    className: "ctl-label",
    style: {
      color: checked ? "var(--ink)" : undefined
    }
  }, label));
}
function SimBar(_ref0) {
  var sim = _ref0.sim,
    children = _ref0.children;
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar viz-toolbar-bottom"
  }, /*#__PURE__*/React.createElement("span", {
    className: "seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn" + (sim.playing ? " on" : ""),
    onClick: function onClick() {
      return sim.setPlaying(true);
    }
  }, "Play"), /*#__PURE__*/React.createElement("button", {
    className: "btn" + (!sim.playing ? " on" : ""),
    onClick: function onClick() {
      return sim.setPlaying(false);
    }
  }, "Pause")), /*#__PURE__*/React.createElement("span", {
    className: "seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn" + (sim.speed === 0.25 ? " on" : ""),
    onClick: function onClick() {
      return sim.setSpeed(0.25);
    }
  }, "0.25\xD7"), /*#__PURE__*/React.createElement("button", {
    className: "btn" + (sim.speed === 1 ? " on" : ""),
    onClick: function onClick() {
      return sim.setSpeed(1);
    }
  }, "1\xD7")), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: sim.reset
  }, "Reset"), children);
}

// The status chip is a button: it opens the provenance drawer of the registry entry named by provenanceId (S11).
// The registry owns the status; a status stated here must agree with it (assertCaption throws otherwise).
function VizCaption(_ref1) {
  var status = _ref1.status,
    provenanceId = _ref1.provenanceId,
    children = _ref1.children;
  var entry = window.QGA_PROVENANCE.assertCaption(provenanceId, status);
  var _useState13 = useState(false),
    _useState14 = _slicedToArray(_useState13, 2),
    open = _useState14[0],
    setOpen = _useState14[1];
  var chipRef = useRef(null);
  var close = useCallback(function () {
    var _chipRef$current;
    setOpen(false);
    (_chipRef$current = chipRef.current) === null || _chipRef$current === void 0 || _chipRef$current.focus();
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-caption"
  }, /*#__PURE__*/React.createElement("button", {
    ref: chipRef,
    type: "button",
    className: "badge badge-" + entry.status + " prov-chip",
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    "data-provenance-id": provenanceId,
    onClick: function onClick() {
      return setOpen(true);
    }
  }, BADGE_LABELS[entry.status] || entry.status), /*#__PURE__*/React.createElement("span", null, children), open ? /*#__PURE__*/React.createElement(ProvenanceDrawer, {
    id: provenanceId,
    onClose: close
  }) : null);
}

/* ---------- status legend (epistemic key) ---------- */
function StatusLegend() {
  var items = [["established", "experimentally confirmed physics"], ["effective", "rigorous within a limited energy domain"], ["schematic", "simplified pedagogical rendering"], ["heuristic", "intuition aid — not the actual derivation"], ["conjectural", "mathematically serious, experimentally unconfirmed"], ["open", "unsolved research question"]];
  return /*#__PURE__*/React.createElement("div", {
    className: "status-legend"
  }, items.map(function (_ref10) {
    var _ref11 = _slicedToArray(_ref10, 2),
      k = _ref11[0],
      d = _ref11[1];
    return /*#__PURE__*/React.createElement("span", {
      key: k,
      className: "status-legend-item"
    }, /*#__PURE__*/React.createElement(Badge, {
      kind: k
    }), /*#__PURE__*/React.createElement("span", null, d));
  }));
}

/* ---------- concept bridge (pathway-aware module connector) ---------- */
function ConceptBridge(_ref12) {
  var id = _ref12.id,
    go = _ref12.go;
  var _useAtlasSettings = useAtlasSettings(),
    pathway = _useAtlasSettings.pathway;
  var b = (window.QGA_BRIDGES || []).find(function (x) {
    return x.id === id;
  });
  if (!b) return null;
  var text = b[pathway] || b.student;
  return /*#__PURE__*/React.createElement("aside", {
    className: "bridge",
    "aria-label": "Concept bridge to next module"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bridge-text"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bridge-kicker"
  }, "Concept bridge \xB7 ", b.from, " \u2192 ", b.to), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(RichText, {
    text: text
  }))), go ? /*#__PURE__*/React.createElement("button", {
    className: "bridge-go",
    onClick: function onClick() {
      return go(b.next);
    }
  }, "Continue \u2192 ", b.to) : null);
}

/* ---------- ambient cosmic background ----------
   Module-aware depth starfield: three parallax layers, a slow hue drift
   toward the active module's tint, and subtle pointer parallax. Fully
   static under prefers-reduced-motion or motion="reduced". */
function Starfield(_ref13) {
  var _ref13$enabled = _ref13.enabled,
    enabled = _ref13$enabled === void 0 ? true : _ref13$enabled,
    _ref13$motionScale = _ref13.motionScale,
    motionScale = _ref13$motionScale === void 0 ? 1 : _ref13$motionScale,
    _ref13$hue = _ref13.hue,
    hue = _ref13$hue === void 0 ? 226 : _ref13$hue;
  var prm = usePRM();
  var ref = useRef(null);
  var hueTargetRef = useRef(hue);
  hueTargetRef.current = hue;
  var motionRef = useRef(motionScale);
  motionRef.current = motionScale;
  useEffect(function () {
    var cv = ref.current;
    if (!cv || !enabled) return;
    var raf,
      alive = true;
    var stars = [],
      rnd = QGA_SEEDED(0x57a2f1d);
    for (var i = 0; i < 170; i++) {
      var z = 0.25 + rnd() * 0.75; // depth: far (0.25) → near (1)
      stars.push({
        x: rnd(),
        y: rnd(),
        z: z,
        r: 0.35 + z * 1.15,
        p: rnd() * Math.PI * 2,
        s: 0.3 + rnd() * 0.7
      });
    }
    var hueNow = hueTargetRef.current;
    var mouse = {
      x: 0.5,
      y: 0.5,
      ex: 0.5,
      ey: 0.5
    };
    var onMove = function onMove(e) {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove, {
      passive: true
    });
    var _draw = function draw(now) {
      if (!alive) return;
      var mo = prm ? 0 : motionRef.current;
      var _fitCanvas2 = fitCanvas(cv),
        ctx = _fitCanvas2.ctx,
        w = _fitCanvas2.w,
        h = _fitCanvas2.h;
      ctx.clearRect(0, 0, w, h);
      hueNow += (hueTargetRef.current - hueNow) * 0.03;
      mouse.ex += (mouse.x - mouse.ex) * 0.04 * (mo > 0 ? 1 : 0);
      mouse.ey += (mouse.y - mouse.ey) * 0.04 * (mo > 0 ? 1 : 0);
      var px = (mouse.ex - 0.5) * 26 * mo,
        py = (mouse.ey - 0.5) * 18 * mo;
      // faint coordinate grid
      ctx.strokeStyle = QGA_TOKENS.hueTint("grid", hueNow, 0.035);
      ctx.lineWidth = 1;
      var g = 90;
      ctx.beginPath();
      for (var x = 0; x <= w; x += g) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (var y = 0; y <= h; y += g) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
      // module-tinted cosmic glow
      var grad = ctx.createRadialGradient(w * 0.75 - px * 2, h * 0.08 - py * 2, 0, w * 0.75, h * 0.1, Math.max(w, h) * 0.9);
      grad.addColorStop(0, QGA_TOKENS.hueTint("glow", hueNow, 0.1));
      grad.addColorStop(1, QGA_TOKENS.alpha("pigment-black", 0));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      var t = (mo > 0 ? now / 1000 : 0) * mo;
      var starCol = QGA_TOKENS.hueTint("star", hueNow);
      for (var _i = 0, _stars = stars; _i < _stars.length; _i++) {
        var st = _stars[_i];
        var tw = mo > 0 ? 0.45 + 0.4 * Math.sin(t * st.s + st.p) : 0.6;
        ctx.globalAlpha = Math.max(0.08, tw * (0.3 + st.z * 0.35));
        ctx.fillStyle = starCol;
        ctx.beginPath();
        ctx.arc(st.x * w + px * st.z, st.y * h + py * st.z, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(_draw);
    };
    raf = requestAnimationFrame(_draw);
    return function () {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [enabled, prm]);
  if (!enabled) return null;
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    className: "starfield-canvas"
  });
}

/* ---------- formatting helpers ---------- */
function sciNotation(x) {
  var digits = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;
  if (x === 0) return "0";
  var e = Math.floor(Math.log10(Math.abs(x)));
  var m = x / Math.pow(10, e);
  if (e >= -2 && e <= 3) return x.toPrecision(digits);
  return m.toFixed(digits - 1) + "×10" + supScript(e);
}
function supScript(n) {
  var map = {
    "-": "⁻",
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹"
  };
  return String(n).split("").map(function (c) {
    return map[c] || c;
  }).join("");
}
Object.assign(window, {
  usePRM: usePRM,
  fitCanvas: fitCanvas,
  useSimLoop: useSimLoop,
  Eq: Eq,
  Badge: Badge,
  FormulaCard: FormulaCard,
  Misconception: Misconception,
  Section: Section,
  ModuleHeader: ModuleHeader,
  SliderRow: SliderRow,
  Toggle: Toggle,
  SimBar: SimBar,
  VizCaption: VizCaption,
  Starfield: Starfield,
  sciNotation: sciNotation,
  supScript: supScript,
  StatusLegend: StatusLegend,
  ConceptBridge: ConceptBridge,
  AtlasSettingsContext: AtlasSettingsContext,
  useAtlasSettings: useAtlasSettings,
  QGA_SETTINGS_DEFAULTS: QGA_SETTINGS_DEFAULTS,
  useState: useState,
  useEffect: useEffect,
  useRef: useRef,
  useMemo: useMemo,
  useCallback: useCallback
});
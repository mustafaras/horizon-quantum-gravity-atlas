/* Compiled from js/mod-experiments.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorValues(e) { if (null != e) { var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0; if (t) return t.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) return { next: function next() { return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e }; } }; } throw new TypeError(_typeof(e) + " is not iterable"); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// mod-experiments.jsx — Module 08: Experimental and Observational Frontiers
/* ---------- Collider event explorer ---------- */
function makeEvent() {
  var seed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Date.now();
  var random = QGA_SEEDED(seed);
  var tracks = [];
  var rand = function rand(a, b) {
    return a + random() * (b - a);
  };
  // two jets, roughly back-to-back
  var jetPhi = rand(0, Math.PI * 2);
  for (var _i = 0, _arr = [[jetPhi, 4 + Math.floor(rand(0, 3))], [jetPhi + Math.PI + rand(-0.4, 0.4), 3 + Math.floor(rand(0, 3))]]; _i < _arr.length; _i++) {
    var _arr$_i = _slicedToArray(_arr[_i], 2),
      base = _arr$_i[0],
      n = _arr$_i[1];
    for (var i = 0; i < n; i++) {
      tracks.push({
        type: "jet",
        phi: base + rand(-0.22, 0.22),
        curve: rand(-0.5, 0.5),
        reach: rand(0.55, 0.78),
        info: "Charged hadron inside a jet — the collimated spray from a fragmenting quark or gluon. Jets, not single quarks, are what detectors see; color confinement guarantees it."
      });
    }
  }
  // isolated leptons / tracks
  var nl = 1 + Math.floor(rand(0, 2));
  for (var _i2 = 0; _i2 < nl; _i2++) {
    var mu = random() < 0.5;
    tracks.push({
      type: mu ? "muon" : "electron",
      phi: rand(0, Math.PI * 2),
      curve: rand(-0.7, 0.7) * (mu ? 0.4 : 1),
      reach: mu ? 1.0 : 0.62,
      info: mu ? "Muon candidate — a track that penetrates the calorimeters and registers in the outer muon chambers. Minimal energy loss; reconstructed by matching inner and outer hits." : "Electron candidate — a curved inner track terminating in a localized electromagnetic-calorimeter cluster matching the track momentum."
    });
  }
  // photon(s)
  if (random() < 0.75) {
    tracks.push({
      type: "photon",
      phi: rand(0, Math.PI * 2),
      curve: 0,
      reach: 0.62,
      info: "Photon candidate — an electromagnetic-calorimeter cluster with no associated inner track (dashed: it leaves no hits in the tracker because it is neutral)."
    });
  }
  // missing transverse energy
  var vis = tracks.reduce(function (s, tr) {
    return s + Math.cos(tr.phi);
  }, 0);
  var visY = tracks.reduce(function (s, tr) {
    return s + Math.sin(tr.phi);
  }, 0);
  var metPhi = Math.atan2(-visY, -vis);
  tracks.push({
    type: "met",
    phi: metPhi,
    curve: 0,
    reach: 0.95,
    info: "Missing transverse momentum — the imbalance of all visible momenta. Signature of neutrinos (or hypothetical invisible particles) escaping the detector. It is inferred, never observed directly."
  });
  return tracks;
}
var TRACK_STYLE = {
  jet: {
    color: QGA_TOKENS.css("pigment-cyan-78"),
    dash: [],
    width: 1.4
  },
  electron: {
    color: QGA_TOKENS.css("pigment-azure-74"),
    dash: [],
    width: 1.8
  },
  muon: {
    color: QGA_TOKENS.css("pigment-violet-72"),
    dash: [],
    width: 1.8
  },
  photon: {
    color: QGA_TOKENS.css("pigment-amber-80"),
    dash: [4, 4],
    width: 1.6
  },
  met: {
    color: QGA_TOKENS.css("pigment-red-70"),
    dash: [8, 5],
    width: 2
  }
};
function trackPoint(tr, f, R) {
  // f in [0,1] along track; curvature bends phi
  var r = f * tr.reach * R;
  var phi = tr.phi + tr.curve * f * 1.1;
  return [Math.cos(phi) * r, Math.sin(phi) * r];
}
function ColliderEvent() {
  var _useState = useState(function () {
      return makeEvent(qgaReadState().seed);
    }),
    _useState2 = _slicedToArray(_useState, 2),
    ev = _useState2[0],
    setEv = _useState2[1];
  var _useState3 = useState(null),
    _useState4 = _slicedToArray(_useState3, 2),
    sel = _useState4[0],
    setSel = _useState4[1];
  var evRef = useRef(ev);
  evRef.current = ev;
  var selRef = useRef(sel);
  selRef.current = sel;
  var sim = useSimLoop(function (ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    var cx = w / 2,
      cy = h / 2,
      R = Math.min(w, h) * 0.46;
    // detector rings: tracker, ECAL, HCAL, muon system
    var rings = [[0.55, "tracker", QGA_TOKENS.alpha("pigment-blue-67", 0.25)], [0.68, "ECAL", QGA_TOKENS.alpha("pigment-blue-67", 0.2)], [0.82, "HCAL", QGA_TOKENS.alpha("pigment-blue-67", 0.16)], [1.0, "muon system", QGA_TOKENS.alpha("pigment-blue-67", 0.12)]];
    ctx.font = QGA_TOKENS.monoPx(10);
    for (var _i3 = 0, _rings = rings; _i3 < _rings.length; _i3++) {
      var _rings$_i = _slicedToArray(_rings[_i3], 3),
        rr = _rings$_i[0],
        name = _rings$_i[1],
        col = _rings$_i[2];
      ctx.strokeStyle = col;
      ctx.lineWidth = rr === 1.0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0, R * rr), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.45);
      ctx.fillText(name, cx + R * rr * 0.711 + 4, cy - R * rr * 0.703);
    }
    // beam axis
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.3);
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.moveTo(cx - R * 1.04, cy);
    ctx.lineTo(cx + R * 1.04, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    // growth animation: tracks extend over first 1.6s after (re)start
    var grow = Math.min(1, t / 1.6);
    evRef.current.forEach(function (tr, idx) {
      var st = TRACK_STYLE[tr.type];
      var isSel = selRef.current === idx;
      ctx.strokeStyle = st.color;
      ctx.lineWidth = st.width * (isSel ? 1.8 : 1);
      ctx.setLineDash(st.dash);
      ctx.save();
      if (isSel) {
        ctx.shadowColor = st.color;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      for (var i = 0; i <= 40; i++) {
        var f = i / 40 * grow;
        var _trackPoint = trackPoint(tr, f, R),
          _trackPoint2 = _slicedToArray(_trackPoint, 2),
          x = _trackPoint2[0],
          y = _trackPoint2[1];
        if (i === 0) ctx.moveTo(cx + x, cy + y);else ctx.lineTo(cx + x, cy + y);
      }
      ctx.stroke();
      ctx.restore();
      ctx.setLineDash([]);
      if (tr.type === "met" && grow >= 1) {
        var _trackPoint3 = trackPoint(tr, 1, R),
          _trackPoint4 = _slicedToArray(_trackPoint3, 2),
          _x = _trackPoint4[0],
          _y = _trackPoint4[1];
        var ang = Math.atan2(_y, _x);
        ctx.fillStyle = st.color;
        ctx.save();
        ctx.translate(cx + _x, cy + _y);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-9, -5);
        ctx.lineTo(-9, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillText("E̸_T", cx + _x * 1.06, cy + _y * 1.06);
      }
    });
    // vertex
    ctx.fillStyle = QGA_TOKENS.css("pigment-white");
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (!sim.tRef || !window.__qga) {} // noop
  }, []);
  var onClick = function onClick(e) {
    var cv = sim.canvasRef.current;
    var r = cv.getBoundingClientRect();
    var w = r.width,
      h = r.height;
    var cx = w / 2,
      cy = h / 2,
      R = Math.min(w, h) * 0.46;
    var mx = e.clientX - r.left - cx,
      my = e.clientY - r.top - cy;
    var best = null,
      bestD = 18;
    evRef.current.forEach(function (tr, idx) {
      for (var i = 0; i <= 24; i++) {
        var _trackPoint5 = trackPoint(tr, i / 24, R),
          _trackPoint6 = _slicedToArray(_trackPoint5, 2),
          x = _trackPoint6[0],
          y = _trackPoint6[1];
        var d = Math.hypot(x - mx, y - my);
        if (d < bestD) {
          bestD = d;
          best = idx;
        }
      }
    });
    setSel(best);
    if (best !== null) sim.setPlaying(false);
  };
  var selTr = sel !== null ? ev[sel] : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: sim.canvasRef,
    className: "viz-canvas",
    style: {
      height: 380,
      cursor: "pointer"
    },
    onClick: onClick
  }), /*#__PURE__*/React.createElement(SimBar, {
    sim: sim
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: function onClick() {
      setEv(makeEvent(qgaReadState().seed));
      setSel(null);
      sim.reset();
      sim.setPlaying(true);
    }
  }, "New collision")), selTr ? /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar viz-toolbar-bottom"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-schematic"
  }, selTr.type === "met" ? "missing E_T" : selTr.type), /*#__PURE__*/React.createElement("span", {
    className: "small",
    style: {
      flex: 1
    }
  }, selTr.info)) : null, /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "experiments-collider-event",
    status: "schematic"
  }, "Transverse view of a stylized collider event (beam axis horizontal). Click any track to inspect it \u2014 clicking pauses the event. Real event reconstruction is statistical and detector-dependent: what experiments report are fitted candidates with uncertainties, not labeled particles."));
}

/* ---------- Gravitational wave inspiral ---------- */
function GWInspiral() {
  var _useState5 = useState(1),
    _useState6 = _slicedToArray(_useState5, 2),
    q = _useState6[0],
    setQ = _useState6[1]; // mass ratio m1/m2
  var qRef = useRef(q);
  qRef.current = q;
  var prm = usePRM();
  var stRef = useRef(null);
  var init = function init() {
    stRef.current = {
      a: 1,
      phi: 0,
      wave: [],
      ripples: [],
      merged: 0
    };
  };
  if (!stRef.current) init();
  var sim = useSimLoop(function (ctx, w, h, t, dt) {
    var st = stRef.current;
    var cx = w / 2,
      cyTop = h * 0.36,
      plotH = h * 0.26;
    var orbR = Math.min(w, h) * 0.3;
    // dynamics
    if (st.a > 0.07) {
      var om = 2.2 / Math.pow(st.a, 1.5);
      st.phi += om * dt;
      st.a -= 0.045 / Math.pow(st.a, 3) * dt;
      var hAmp = 0.5 / st.a;
      st.wave.push(Math.min(3, hAmp) * Math.cos(2 * st.phi));
      if (st.ripples.length === 0 || st.phi - st.ripples[st.ripples.length - 1].phi > Math.PI / 2) st.ripples.push({
        r: st.a * orbR,
        phi: st.phi,
        born: t
      });
    } else if (st.merged === 0) {
      st.merged = t;
    } else {
      // ringdown then restart
      var tau = t - st.merged;
      st.wave.push(3 * Math.exp(-tau * 2.2) * Math.cos(14 * tau));
      if (tau > 2.8) {
        init();
        sim.reset();
        return;
      }
    }
    if (st.wave.length > 520) st.wave.shift();
    st.ripples = st.ripples.filter(function (rp) {
      return t - rp.born < 4;
    });

    // render
    ctx.clearRect(0, 0, w, h);
    // ripples
    var _iterator = _createForOfIteratorHelper(st.ripples),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var rp = _step.value;
        var age = t - rp.born;
        var rr = rp.r + age * orbR * 1.1;
        ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-79", Math.max(0, 0.3 - age * 0.08).toFixed(3));
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cyTop, Math.max(0, rr), 0, Math.PI * 2);
        ctx.stroke();
      }
      // bodies
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    var Q = qRef.current;
    var m1 = Q / (1 + Q),
      m2 = 1 / (1 + Q); // normalized masses
    var r1 = st.a * orbR * m2,
      r2 = st.a * orbR * m1;
    if (st.a > 0.07) {
      var drawBody = function drawBody(rr, ang, m) {
        var x = cx + Math.cos(ang) * rr,
          y = cyTop + Math.sin(ang) * rr * 0.96;
        var rad = 5 + m * 9;
        var g = ctx.createRadialGradient(x, y, 0, x, y, rad * 2);
        g.addColorStop(0, QGA_TOKENS.alpha("pigment-blue-93", 0.95));
        g.addColorStop(1, QGA_TOKENS.alpha("pigment-blue-93", 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = QGA_TOKENS.css("pigment-grey-16");
        ctx.beginPath();
        ctx.arc(x, y, rad * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-93", 0.8);
        ctx.stroke();
      };
      drawBody(r1, st.phi, m1);
      drawBody(r2, st.phi + Math.PI, m2);
    } else {
      var g = ctx.createRadialGradient(cx, cyTop, 0, cx, cyTop, 36);
      g.addColorStop(0, QGA_TOKENS.alpha("pigment-blue-93", 0.9));
      g.addColorStop(1, QGA_TOKENS.alpha("pigment-blue-93", 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cyTop, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = QGA_TOKENS.css("pigment-grey-16");
      ctx.beginPath();
      ctx.arc(cx, cyTop, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-93", 0.8);
      ctx.stroke();
      ctx.font = QGA_TOKENS.monoPx(10);
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-81", 0.8);
      ctx.fillText("merger → ringdown", cx + 30, cyTop - 20);
    }
    // waveform panel
    var py0 = h - plotH - 16;
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.2);
    ctx.strokeRect(40, py0, w - 60, plotH);
    ctx.font = QGA_TOKENS.monoPx(10);
    ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.5);
    ctx.fillText("strain h(t) — schematic chirp", 46, py0 - 6);
    ctx.strokeStyle = QGA_TOKENS.css("pigment-cyan-78");
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    st.wave.forEach(function (v, i) {
      var x = 40 + i / 520 * (w - 60);
      var y = py0 + plotH / 2 - v / 3 * plotH * 0.46;
      if (i === 0) ctx.moveTo(x, y);else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [prm]);
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "mass ratio m\u2081/m\u2082",
    min: 1,
    max: 6,
    step: 0.1,
    value: q,
    onChange: setQ,
    format: function format(v) {
      return v.toFixed(1);
    }
  })), /*#__PURE__*/React.createElement("canvas", {
    ref: sim.canvasRef,
    className: "viz-canvas",
    style: {
      height: 400
    }
  }), /*#__PURE__*/React.createElement(SimBar, {
    sim: sim
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      init();
      sim.reset();
    }
  }, "Restart inspiral")), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "experiments-gw-chirp",
    status: "schematic"
  }, "Compact binary inspiral with quadrupole-style energy loss: the orbit shrinks, the frequency and amplitude sweep upward (the 'chirp'), and ringdown follows merger. An unequal mass ratio offsets the orbit around the common center of mass. GW150914 (2016) matched waveforms like this computed from general relativity \u2014 a triumph of the ", /*#__PURE__*/React.createElement("em", null, "classical"), " theory."));
}

/* ---------- 3D collider event display (Prompt 08: science-backed ColliderLabSection) ---------- */
function ColliderEvent3D() {
  return /*#__PURE__*/React.createElement(ColliderLabSection, {
    compact: true,
    fallback: /*#__PURE__*/React.createElement(ColliderEvent, null)
  });
}

/* ---------- synchronized strain oscilloscope (reads the live 3D waveform) ---------- */
function GWStrainScope(_ref) {
  var strainRef = _ref.strainRef;
  var cvRef = useRef(null);
  useEffect(function () {
    var raf,
      alive = true;
    var _draw = function draw() {
      if (!alive) return;
      raf = requestAnimationFrame(_draw);
      var cv = cvRef.current;
      if (!cv) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = cv.clientWidth,
        h = cv.clientHeight;
      if (cv.width !== w * dpr || cv.height !== h * dpr) {
        cv.width = w * dpr;
        cv.height = h * dpr;
      }
      var ctx = cv.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var data = strainRef.current;
      var mid = h * 0.52;
      // baseline + frame
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.16);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.stroke();
      ctx.font = QGA_TOKENS.monoPx(10);
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.6);
      ctx.fillText("strain  h(t)", 10, 16);
      if (!data.length) return;
      var tNow = data[data.length - 1].t;
      var WIN = 6.5; // seconds visible
      var t0 = tNow - WIN;
      var X = function X(tt) {
        return (tt - t0) / WIN * w;
      };
      var amax = 3.1;
      // merger marker
      for (var i = 1; i < data.length; i++) {
        if (data[i].merged && !data[i - 1].merged) {
          var mx = X(data[i].t);
          ctx.strokeStyle = QGA_TOKENS.alpha("pigment-amber-79-c12", 0.5);
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(mx, 8);
          ctx.lineTo(mx, h - 8);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = QGA_TOKENS.alpha("pigment-amber-79-c12", 0.85);
          ctx.fillText("merger", mx + 4, h - 10);
        }
      }
      // waveform
      ctx.strokeStyle = QGA_TOKENS.css("pigment-azure-82");
      ctx.lineWidth = 1.8;
      ctx.shadowColor = QGA_TOKENS.css("pigment-azure-82");
      ctx.shadowBlur = 8;
      ctx.beginPath();
      var started = false;
      for (var _i4 = 0; _i4 < data.length; _i4++) {
        var d = data[_i4];
        if (d.t < t0) continue;
        var x = X(d.t),
          y = mid - d.h / amax * (h * 0.4);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      // "now" cursor + frequency readout
      var last = data[data.length - 1];
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-81", 0.9);
      ctx.textAlign = "right";
      ctx.fillText("inspiral  →  chirp  →  merger  →  ringdown", w - 10, 16);
      ctx.textAlign = "left";
    };
    _draw();
    return function () {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [strainRef]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: cvRef,
    style: {
      width: "100%",
      height: 120,
      display: "block",
      borderRadius: 8
    },
    "aria-label": "Gravitational-wave strain versus time, synchronized to the 3D inspiral"
  });
}

/* ---------- 3D gravitational-wave inspiral ---------- */
function GWInspiral3D() {
  var _useState7 = useState(1),
    _useState8 = _slicedToArray(_useState7, 2),
    q = _useState8[0],
    setQ = _useState8[1];
  var qRef = useRef(q);
  qRef.current = q;
  var stRef = useRef(null);
  var strainRef = useRef([]); // rolling [{t, h, f}] for the synchronized oscilloscope
  var restart = function restart() {
    stRef.current = {
      x: 1,
      phi: 0,
      merged: 0,
      tau: 0
    };
    strainRef.current = [];
  };
  if (!stRef.current) restart();
  var build = function build(ctx) {
    var THREE = ctx.THREE,
      scene = ctx.scene,
      camera = ctx.camera;
    var parked = ctx.motion() === 0; // reduced motion: park at a deterministic showcase state
    scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.011);
    scene.add(new THREE.AmbientLight(QGA_TOKENS.hex("pigment-blue-68"), 0.5));

    // seeded starfield backdrop (deterministic across loads, not just captures)
    var starRandom = QGA_SEEDED((qgaReadState().seed ^ 0x9e37) >>> 0);
    var det1 = ctx.settings.current.detail3d;
    var starN = det1 === "low" ? 260 : 520;
    var sGeo = new THREE.BufferGeometry();
    var sPos = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) {
      var u = starRandom() * 2 - 1,
        a = starRandom() * Math.PI * 2,
        rr = Math.sqrt(1 - u * u),
        R0 = 40 + starRandom() * 40;
      sPos[i * 3] = Math.cos(a) * rr * R0;
      sPos[i * 3 + 1] = Math.abs(u) * R0 * 0.7 + 4;
      sPos[i * 3 + 2] = Math.sin(a) * rr * R0;
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    scene.add(ctx.tag(new THREE.Points(sGeo, new THREE.PointsMaterial({
      size: 1.3,
      map: qgaGlowTexture(),
      color: QGA_TOKENS.hex("pigment-blue-83"),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })), "decoration"));
    var det = ctx.settings.current.detail3d;
    var SEG = det === "low" ? 52 : det === "ultra" ? 96 : 72;
    var EXT = 13;
    var dKey = new THREE.DirectionalLight(QGA_TOKENS.hex("pigment-blue-90"), 0.85);
    dKey.position.set(3, 8, 5);
    scene.add(dKey);
    var geo = new THREE.PlaneGeometry(EXT, EXT, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    var colAttr = new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3);
    geo.setAttribute("color", colAttr);
    // luminous warped spacetime sheet: a lit membrane whose square edges dissolve
    // into the fog (vertex colours fall to black), plus an additive wire lattice
    // with its own colours so the "grid of spacetime points" stays readable even
    // in the flat far field.
    var surf = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.38,
      roughness: 0.36,
      emissive: QGA_TOKENS.hex("pigment-blue-19-c04"),
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    }));
    scene.add(ctx.tag(surf, "model"));
    var wColAttr = new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3);
    var wireGeo = new THREE.BufferGeometry();
    wireGeo.setIndex(geo.index);
    wireGeo.setAttribute("position", geo.attributes.position);
    wireGeo.setAttribute("color", wColAttr);
    var wire = new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    wire.renderOrder = 2;
    scene.add(ctx.tag(wire, "model"));
    var cCrest = new THREE.Color(QGA_TOKENS.hex("pigment-azure-85"));
    var cTrough = new THREE.Color(QGA_TOKENS.hex("pigment-violet-71-c15"));
    var cFlat = new THREE.Color(QGA_TOKENS.hex("pigment-blue-23-c05"));
    var cHot = new THREE.Color(QGA_TOKENS.hex("pigment-grey-97-c02"));
    var cWire = new THREE.Color(QGA_TOKENS.hex("pigment-blue-41"));
    var tmpC = new THREE.Color();
    var pos = geo.attributes.position;
    var nV = pos.count;
    var vr = new Float64Array(nV),
      vth = new Float64Array(nV),
      vfade = new Float64Array(nV);
    for (var k = 0; k < nV; k++) {
      var x = pos.getX(k),
        z = pos.getZ(k);
      vr[k] = Math.hypot(x, z);
      vth[k] = Math.atan2(z, x);
      var e = Math.max(Math.abs(x), Math.abs(z)) / (EXT / 2);
      var t0 = Math.min(1, Math.max(0, (e - 0.74) / 0.26));
      vfade[k] = 1 - t0 * t0 * (3 - 2 * t0);
    }

    // per-build ring texture (crisp halo ring); s3dDispose reclaims it at teardown
    var ringTex = function () {
      var c = document.createElement("canvas");
      c.width = c.height = 256;
      var g = c.getContext("2d");
      var grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, QGA_TOKENS.alpha("pigment-white", 0));
      grad.addColorStop(0.4, QGA_TOKENS.alpha("pigment-white", 0));
      grad.addColorStop(0.55, QGA_TOKENS.alpha("pigment-white", 0.9));
      grad.addColorStop(0.72, QGA_TOKENS.alpha("pigment-white", 0.2));
      grad.addColorStop(0.9, QGA_TOKENS.alpha("pigment-white", 0));
      g.fillStyle = grad;
      g.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(c);
    }();

    // crisp black holes: opaque silhouette + billboarded photon-ring halo
    var mkHole = function mkHole(tint) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.34, 48, 32), new THREE.MeshBasicMaterial({
        color: QGA_TOKENS.hex("pigment-grey-11-c02")
      }));
      var halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
        map: ringTex,
        color: tint,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
      }));
      halo.renderOrder = 6;
      var warmth = new THREE.Sprite(new THREE.SpriteMaterial({
        map: qgaGlowTexture(),
        color: QGA_TOKENS.hex("pigment-blue-78-c07"),
        transparent: true,
        opacity: 0.26,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
      scene.add(ctx.tag(m, "model"));
      scene.add(ctx.tag(halo, "decoration"));
      scene.add(ctx.tag(warmth, "decoration"));
      return {
        m: m,
        halo: halo,
        warmth: warmth,
        trail: []
      };
    };
    var b1 = mkHole(QGA_TOKENS.hex("pigment-blue-82")),
      b2 = mkHole(QGA_TOKENS.hex("pigment-violet-78"));
    var orbR = 3.1;

    // orbital trails: additive lines whose colour fades head → tail to black
    var TRAIL_N = 220;
    var mkTrail = function mkTrail(hex) {
      // The two inspiral trails are this scene's focal curves.
      var l = ctx.engraved.stream(TRAIL_N, {
        vertexColors: true,
        opacity: 0.9,
        additive: true,
        widthPx: ctx.engraved.WIDTH_PX.focal,
        layer: "model"
      });
      scene.add(l);
      return {
        pos: new Float32Array(TRAIL_N * 3),
        col: new Float32Array(TRAIL_N * 3),
        l: l,
        base: new THREE.Color(hex)
      };
    };
    var t1 = mkTrail(QGA_TOKENS.hex("pigment-azure-83-c09")),
      t2 = mkTrail(QGA_TOKENS.hex("pigment-violet-78"));
    var writeTrail = function writeTrail(tr, list) {
      var n = Math.min(list.length, TRAIL_N);
      for (var _i5 = 0; _i5 < n; _i5++) {
        var p = list[list.length - n + _i5];
        tr.pos[_i5 * 3] = p[0];
        tr.pos[_i5 * 3 + 1] = p[1];
        tr.pos[_i5 * 3 + 2] = p[2];
        var f = Math.pow(_i5 / Math.max(1, n - 1), 2); // head bright, tail fades out
        tr.col[_i5 * 3] = tr.base.r * f;
        tr.col[_i5 * 3 + 1] = tr.base.g * f;
        tr.col[_i5 * 3 + 2] = tr.base.b * f;
      }
      ctx.engraved.setPoints(tr.l, tr.pos, n, tr.col);
    };

    // merger read-out: an expanding crisp ring + a brief compact core flash
    var burst = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
      map: ringTex,
      color: QGA_TOKENS.hex("pigment-grey-96"),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false
    }));
    burst.renderOrder = 7;
    scene.add(ctx.tag(burst, "decoration"));
    var coreFlash = ctx.glow(QGA_TOKENS.hex("pigment-white"), 1, 0);
    scene.add(coreFlash);

    // expanding wavefront rings: the radiation visibly leaves the binary
    var wavefronts = [];
    for (var _i6 = 0; _i6 < 3; _i6++) {
      var ring = new THREE.Mesh(new THREE.RingGeometry(0.972, 1, 128), new THREE.MeshBasicMaterial({
        color: QGA_TOKENS.hex("pigment-azure-77"),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      scene.add(ctx.tag(ring, "model"));
      wavefronts.push(ring);
    }
    var bLabel = ctx.label("binary — orbital decay by gravitational radiation", function () {
      return {
        x: 0,
        y: 2.35,
        z: 0
      };
    }, "s3d-quiet");
    ctx.annotation("LIGO observes CLASSICAL gravitational waves — a triumph of general relativity, not a quantum gravity detection", function () {
      return {
        x: 0,
        y: 1.05,
        z: 1.4
      };
    });
    ctx.label("two-arm quadrupole wavefront", function () {
      return {
        x: 4.3,
        y: 0.4,
        z: 3.2
      };
    }, "s3d-quiet");

    // deterministic showcase state for reduced motion: mid-inspiral, clearly
    // visible ripple, prefilled trails and strain history (exact integrals)
    var parkState = function parkState() {
      stRef.current = {
        x: 0.48,
        phi: 0.9,
        merged: 0,
        tau: 0,
        park: true,
        q: qRef.current
      };
      var Q0 = qRef.current,
        m10 = Q0 / (1 + Q0),
        m20 = 1 / (1 + Q0);
      var r10 = 0.48 * orbR * m20,
        r20 = 0.48 * orbR * m10;
      b1.trail.length = 0;
      b2.trail.length = 0;
      for (var _i7 = 0; _i7 < TRAIL_N; _i7++) {
        var back = _i7 / (TRAIL_N - 1) * 1.9; // ~110° arc behind each body
        b1.trail.push([Math.cos(0.9 - back) * r10, 0.35, Math.sin(0.9 - back) * r10]);
        b2.trail.push([Math.cos(0.9 - back + Math.PI) * r20, 0.35, Math.sin(0.9 - back + Math.PI) * r20]);
      }
      var k0s = 0.036,
        w0s = 1.4,
        A0s = 0.2,
        chirp0 = 4 * m10 * m20;
      var x0 = 1.0,
        x1 = 0.48;
      var phiOfX = function phiOfX(x) {
        return 2 * w0s * (Math.pow(x0, 2.5) - Math.pow(x, 2.5)) / (2.5 * k0s * chirp0);
      };
      var Phi0 = 2 * 0.9 - phiOfX(x1);
      var tEnd = (Math.pow(x0, 4) - Math.pow(x1, 4)) / (4 * k0s * chirp0);
      strainRef.current = [];
      for (var _i8 = 0; _i8 <= 260; _i8++) {
        var tt = _i8 / 260 * tEnd;
        var _x2 = Math.pow(Math.max(0.05, Math.pow(x0, 4) - 4 * k0s * chirp0 * tt), 0.25);
        strainRef.current.push({
          t: tt,
          h: Math.min(3, A0s / _x2) * Math.cos(Phi0 + phiOfX(_x2)),
          f: w0s * Math.pow(_x2, -1.5) / Math.PI,
          merged: false
        });
      }
    };
    if (parked) parkState();
    return {
      update: function update(t, dt) {
        var st = stRef.current;
        var Q = qRef.current;
        if (parked && (!st.park || st.q !== Q)) parkState(); // covers a Restart click while parked
        var m1 = Q / (1 + Q),
          m2 = 1 / (1 + Q);
        // chirp factor ∝ reduced mass: 4µ/M = 4 m₁m₂/(m₁+m₂)²  (maximal at equal mass)
        var chirp = 4 * m1 * m2;
        var w0 = 1.4,
          k0 = 0.036,
          A0 = 0.2;
        var run = !parked && dt > 0;
        var amp = 0,
          phase = 0,
          fgw = 0;
        var merged = st.x <= 0.12;
        if (!merged) {
          // Leading-order quadrupole inspiral, exact scaling:
          //   da/dt ∝ -1/a³  ⇒  a ∝ (t_c-t)^{1/4},  f_gw ∝ (t_c-t)^{-3/8},  h ∝ f^{2/3}
          var wOrb = w0 * Math.pow(st.x, -1.5); // Kepler: ω ∝ a^{-3/2}
          if (run) {
            st.phi += wOrb * dt;
            st.x = Math.max(0.001, st.x - k0 * chirp / Math.pow(st.x, 3) * dt);
          }
          fgw = w0 * Math.pow(st.x, -1.5) / Math.PI;
          amp = Math.min(3, A0 / st.x);
          phase = 2 * st.phi; // GW phase = twice orbital phase
        } else if (st.merged === 0) {
          if (run) st.merged = t;
          fgw = w0 * Math.pow(0.12, -1.5) / Math.PI;
          amp = 3;
          phase = 2 * st.phi;
        } else {
          // ringdown: damped sinusoid at the final black hole's quasinormal frequency
          if (run) st.tau = (st.tau || 0) + dt;
          var tau = st.tau || 0;
          fgw = w0 * Math.pow(0.12, -1.5) / Math.PI;
          amp = 3 * Math.exp(-tau * 2.2);
          phase = 2 * st.phi + 14 * tau;
          if (tau > 2.6 && run) {
            restart();
          }
        }
        // record the strain waveform (same amp & phase that drive the 3D scene)
        if (run) {
          strainRef.current.push({
            t: t,
            h: amp * Math.cos(phase),
            f: fgw,
            merged: merged
          });
          if (strainRef.current.length > 900) strainRef.current.shift();
        }
        // quadrupole ripple on the sheet — radial wavenumber compresses as it chirps
        var kr = 1.6 + 1.6 * Math.min(2.5, 1 / Math.max(st.x, 0.12) - 1);
        var yMax = 1.15;
        for (var _k = 0; _k < nV; _k++) {
          var r = Math.max(vr[_k], 1.0);
          var yRaw = 1.5 * (amp / r) * Math.cos(2 * vth[_k] - phase + r * kr);
          var y = yMax * Math.tanh(yRaw / yMax);
          pos.setY(_k, y);
          var ay = Math.abs(y);
          var mag = Math.min(1, ay * 1.35);
          tmpC.copy(cFlat).lerp(y >= 0 ? cCrest : cTrough, mag);
          if (ay > 0.72) tmpC.lerp(cHot, Math.min(1, (ay - 0.72) * 2.2));
          tmpC.multiplyScalar(vfade[_k]);
          colAttr.setXYZ(_k, tmpC.r, tmpC.g, tmpC.b);
          tmpC.copy(cWire).lerp(y >= 0 ? cCrest : cTrough, mag * 0.85);
          if (ay > 0.6) tmpC.lerp(cHot, Math.min(1, (ay - 0.6) * 1.4));
          tmpC.multiplyScalar(vfade[_k]);
          wColAttr.setXYZ(_k, tmpC.r, tmpC.g, tmpC.b);
        }
        pos.needsUpdate = true;
        colAttr.needsUpdate = true;
        wColAttr.needsUpdate = true;
        geo.computeVertexNormals();
        // bodies
        var merged2 = st.x <= 0.12;
        b2.m.visible = b2.halo.visible = b2.warmth.visible = !merged2;
        bLabel.set(merged2 ? "merger → ringdown" : "binary — orbital decay by gravitational radiation");
        if (!merged2) {
          var r1 = st.x * orbR * m2,
            r2 = st.x * orbR * m1;
          b1.m.position.set(Math.cos(st.phi) * r1, 0.35, Math.sin(st.phi) * r1);
          b2.m.position.set(-Math.cos(st.phi) * r2, 0.35, -Math.sin(st.phi) * r2);
          b1.m.scale.setScalar(0.7 + m1 * 0.9);
          b2.m.scale.setScalar(0.7 + m2 * 0.9);
          if (run) {
            b1.trail.push([b1.m.position.x, b1.m.position.y, b1.m.position.z]);
            b2.trail.push([b2.m.position.x, b2.m.position.y, b2.m.position.z]);
            if (b1.trail.length > TRAIL_N) b1.trail.shift();
            if (b2.trail.length > TRAIL_N) b2.trail.shift();
          }
          burst.material.opacity = 0;
          coreFlash.material.opacity = 0;
        } else {
          b1.m.position.set(0, 0.35, 0);
          b1.m.scale.setScalar(1.5);
          var _tau = st.tau || 0;
          burst.position.set(0, 0.38, 0);
          burst.scale.setScalar(1.6 + 9 * (1 - Math.exp(-_tau * 2.2)));
          burst.material.opacity = 0.85 * Math.exp(-_tau * 1.9);
          burst.quaternion.copy(camera.quaternion);
          coreFlash.position.set(0, 0.38, 0);
          coreFlash.scale.setScalar(2 + 3 * Math.exp(-_tau * 3));
          coreFlash.material.opacity = 0.7 * Math.exp(-_tau * 2.8);
          b1.trail.length = 0;
          b2.trail.length = 0;
        }
        t1.l.visible = !merged2;
        t2.l.visible = !merged2;
        writeTrail(t1, b1.trail);
        writeTrail(t2, b2.trail);
        // halos hug each silhouette (billboard) and track the body scale
        b1.halo.position.copy(b1.m.position);
        b1.halo.scale.setScalar(b1.m.scale.x * 2.4);
        b1.halo.quaternion.copy(camera.quaternion);
        b1.warmth.position.copy(b1.m.position);
        b1.warmth.scale.setScalar(b1.m.scale.x * 1.7);
        if (!merged2) {
          b2.halo.position.copy(b2.m.position);
          b2.halo.scale.setScalar(b2.m.scale.x * 2.4);
          b2.halo.quaternion.copy(camera.quaternion);
          b2.warmth.position.copy(b2.m.position);
          b2.warmth.scale.setScalar(b2.m.scale.x * 1.7);
        }
        // wavefront rings ride outward; opacity tracks the wave amplitude
        var ampNorm = Math.min(1, amp / 0.5);
        for (var _i9 = 0; _i9 < 3; _i9++) {
          var ph = parked ? 0.25 + _i9 * 0.33 : (t * 0.42 + _i9 / 3) % 1;
          var _rr = 1.0 + ph * EXT * 0.55;
          wavefronts[_i9].scale.set(_rr, _rr, 1);
          wavefronts[_i9].material.opacity = ampNorm * 0.7 * (1 - ph) * (1 - ph);
        }
      }
    };
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame",
    id: "shot-section-exp"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "mass ratio m\u2081/m\u2082",
    min: 1,
    max: 6,
    step: 0.1,
    value: q,
    onChange: setQ,
    format: function format(v) {
      return v.toFixed(1);
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: restart
  }, "Restart inspiral")), /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    height: 430,
    shotSpace: "exp-gw",
    aria: "Three-dimensional binary inspiral radiating gravitational waves across a spacetime sheet",
    initial: {
      radius: 12.5,
      theta: 0.5,
      phi: 1.02,
      minR: 7,
      maxR: 30,
      bloom: {
        strength: 0.9,
        radius: 0.55,
        threshold: 0.14
      }
    },
    build: build,
    fallback: /*#__PURE__*/React.createElement(GWInspiral, null)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(GWStrainScope, {
    strainRef: strainRef
  })), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar viz-toolbar-bottom readout-grid",
    style: {
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "GW150914 chirp mass \u2133"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, "28.6", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "M\u2609"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "final mass / energy radiated"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, "62 / 3", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "M\u2609c\xB2"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "peak GW frequency"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, "~250", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "Hz"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "peak strain at Earth (410 Mpc)"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, "1.0\xD710\u207B\xB2\xB9"))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "experiments-gw-sheet",
    status: "schematic"
  }, "Leading-order quadrupole inspiral, integrated with the ", /*#__PURE__*/React.createElement("em", null, "exact"), " radiation-reaction scaling", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\dot a \\propto -a^{-3}"
  }), ", so the orbit follows ", /*#__PURE__*/React.createElement(Eq, {
    tex: "a \\propto (t_c-t)^{1/4}"
  }), " and the wave frequency sweeps as ", /*#__PURE__*/React.createElement(Eq, {
    tex: "f_{\\rm gw}\\propto (t_c-t)^{-3/8}"
  }), " with amplitude", /*#__PURE__*/React.createElement(Eq, {
    tex: "h\\propto f^{2/3}"
  }), " \u2014 the \u201Cchirp.\u201D The oscilloscope above plots the very strain that drives the sheet, so the 3D ripple and the waveform are one signal. The chirp rate scales with the reduced mass", /*#__PURE__*/React.createElement(Eq, {
    tex: "4\\mu/M"
  }), " (try the mass-ratio slider \u2014 equal masses chirp fastest). The sheet displacement is exaggerated by ~21 orders of magnitude: GW150914's real peak strain at Earth was", /*#__PURE__*/React.createElement(Eq, {
    tex: "h\\sim10^{-21}"
  }), ". LIGO's match to ", /*#__PURE__*/React.createElement("em", null, "classical"), " general-relativity waveforms is a triumph of GR \u2014 not a quantum-gravity detection."));
}

/* ---------- invariant-mass reconstruction: how a particle is "discovered" ---------- */
var IM_MIN = 60,
  IM_MAX = 120,
  IM_BINS = 40,
  IM_BW = (IM_MAX - IM_MIN) / IM_BINS;
var MZ = 91.1876,
  GZ = 2.4952; // PDG Z⁰ mass & width (GeV)
function sampleDielectronMass(pSig, random) {
  if (random() < pSig) {
    // relativistic-ish Breit–Wigner (Cauchy core) around the Z mass + detector smearing
    var bw = MZ + GZ / 2 * Math.tan(Math.PI * (random() - 0.5));
    var smear = (random() + random() + random() - 1.5) * 1.6; // ~Gaussian resolution
    return bw + smear;
  }
  // Drell–Yan / combinatorial continuum: falling spectrum across the window
  return IM_MIN + -22 * Math.log(1 - random() * 0.985);
}
function InvariantMassLab() {
  var _useState9 = useState(function () {
      return new Array(IM_BINS).fill(0);
    }),
    _useState0 = _slicedToArray(_useState9, 2),
    bins = _useState0[0],
    setBins = _useState0[1];
  var randomRef = useRef(QGA_SEEDED(qgaReadState().seed));
  var _useState1 = useState(0),
    _useState10 = _slicedToArray(_useState1, 2),
    total = _useState10[0],
    setTotal = _useState10[1];
  var _useState11 = useState(0.16),
    _useState12 = _slicedToArray(_useState11, 2),
    pSig = _useState12[0],
    setPSig = _useState12[1];
  var pSigRef = useRef(pSig);
  pSigRef.current = pSig;
  var fire = function fire(n) {
    setBins(function (prev) {
      var next = prev.slice();
      for (var i = 0; i < n; i++) {
        var m = sampleDielectronMass(pSigRef.current, randomRef.current);
        if (m >= IM_MIN && m < IM_MAX) next[Math.floor((m - IM_MIN) / IM_BW)]++;
      }
      return next;
    });
    setTotal(function (t) {
      return t + n;
    });
  };
  var reset = function reset() {
    setBins(new Array(IM_BINS).fill(0));
    setTotal(0);
  };
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.gw.invariantMassSpec({
      bins: bins,
      imMin: IM_MIN,
      imMax: IM_MAX,
      binWidth: IM_BW,
      mZ: MZ
    });
  }, [bins]);

  // crude significance: signal vs background in the Z window
  var zLo = Math.floor((86 - IM_MIN) / IM_BW),
    zHi = Math.ceil((96 - IM_MIN) / IM_BW);
  var zCount = 0;
  for (var i = zLo; i < zHi; i++) zCount += bins[i] || 0;
  var sideBins = bins.slice(0, zLo).concat(bins.slice(zHi));
  var bgPerBin = sideBins.length ? sideBins.reduce(function (a, b) {
    return a + b;
  }, 0) / sideBins.length : 0;
  var bgInWin = bgPerBin * (zHi - zLo);
  var sig = Math.max(0, zCount - bgInWin);
  var signif = bgInWin > 0 ? sig / Math.sqrt(bgInWin) : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: function onClick() {
      return fire(100);
    }
  }, "+100 collisions"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      return fire(1000);
    }
  }, "+1000"), /*#__PURE__*/React.createElement(SliderRow, {
    label: "signal fraction",
    min: 0,
    max: 0.4,
    step: 0.01,
    value: pSig,
    onChange: setPSig,
    format: function format(v) {
      return (v * 100).toFixed(0) + "%";
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: reset
  }, "Reset")), /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar viz-toolbar-bottom readout-grid",
    style: {
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "total collisions"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, total.toLocaleString("en-US"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "excess in Z window (signal)"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, Math.round(sig).toLocaleString("en-US"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "significance S/\u221AB"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, signif.toFixed(1), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "\u03C3"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "Z\u2070 mass / width (PDG)"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, "91.19 / 2.50", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "GeV")))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "experiments-dielectron-mass",
    status: "schematic"
  }, "This is how a particle is actually ", /*#__PURE__*/React.createElement("em", null, "discovered"), ". Each collision contributes one dielectron invariant-mass entry; most are smooth Drell\u2013Yan continuum, but a fraction come from a real resonance. No single event is decisive \u2014 fire a hundred and you see noise; fire thousands and the ", /*#__PURE__*/React.createElement("strong", null, "Z\u2070 peak at 91.19 GeV"), " rises out of the background as a Breit\u2013Wigner bump, its statistical significance growing like ", /*#__PURE__*/React.createElement(Eq, {
    tex: "S/\\sqrt{B}"
  }), ". The Z was found exactly this way (UA1/UA2, CERN, 1983); the Higgs four-lepton channel in 2012 is the same method at higher mass. Counts carry Poisson error bars; the distributions are illustrative, not a tuned detector simulation."));
}

/* ---------- GW signal analysis theatre ---------- */
var GW_GEN_RATE = 512,
  GW_GEN_DURATION = 4,
  GW_GEN_MERGER = 3.4;
var GW_H1L1_DELAY = 0.007; // illustrative H1→L1 light-travel offset across the ~3000 km baseline
var GW_GEN_M1 = 36,
  GW_GEN_M2 = 29; // GW150914-like teaching binary (M☉)

/* Strain panel: dual-detector generated traces with phase bands, or a single GWOSC
   observation trace; both are Figure Kit figures (js/figure/plots/gw.mjs). */
function GWStrainPanel(_ref2) {
  var mode = _ref2.mode,
    genH1 = _ref2.genH1,
    genL1 = _ref2.genL1,
    realData = _ref2.realData,
    detector = _ref2.detector,
    playT = _ref2.playT,
    _onScrub = _ref2.onScrub;
  var _useState13 = useState(null),
    _useState14 = _slicedToArray(_useState13, 2),
    hover = _useState14[0],
    setHover = _useState14[1];
  var prm = usePRM();
  var duration = mode === "real" && realData ? realData.duration : GW_GEN_DURATION;
  /* Eased vertical scale: the trace normalisation glides between signals
     instead of snapping when the source changes. Bounded rAF — it stops as
     soon as the scale has settled, and snaps instantly under reduced motion. */
  var targetAmax = useMemo(function () {
    var peak = function peak(s) {
      var m = 1e-9;
      for (var i = 0; i < s.length; i++) {
        var a = Math.abs(s[i]);
        if (a > m) m = a;
      }
      return m;
    };
    if (mode === "generated" && genH1) return Math.max(peak(genH1.samples), peak(genL1.samples));
    if (mode === "real" && realData) return peak(realData.samples);
    return 1;
  }, [mode, genH1, genL1, realData]);
  var amaxRef = useRef(targetAmax);
  var _useState15 = useState(targetAmax),
    _useState16 = _slicedToArray(_useState15, 2),
    amax = _useState16[0],
    setAmax = _useState16[1];
  useEffect(function () {
    if (prm) {
      amaxRef.current = targetAmax;
      setAmax(targetAmax);
      return undefined;
    }
    var raf = 0,
      last = performance.now();
    var _tick = function tick(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      var cur = amaxRef.current;
      var next = cur + (targetAmax - cur) * Math.min(1, dt * 7);
      if (Math.abs(next - targetAmax) <= Math.abs(targetAmax) * 1e-3) {
        amaxRef.current = targetAmax;
        setAmax(targetAmax);
        return;
      }
      amaxRef.current = next;
      setAmax(next);
      raf = requestAnimationFrame(_tick);
    };
    raf = requestAnimationFrame(_tick);
    return function () {
      return cancelAnimationFrame(raf);
    };
  }, [targetAmax, prm]);
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.gw.strainSpec({
      mode: mode === "real" ? "real" : "generated",
      h1: genH1,
      l1: genL1,
      real: realData,
      playT: playT,
      amax: amax
    });
  }, [mode, genH1, genL1, realData, playT, amax]);
  var ready = mode === "generated" && genH1 || mode === "real" && realData;
  var clampT = function clampT(x) {
    return Math.min(duration, Math.max(0, x));
  };
  var readout = "";
  if (hover != null && ready) {
    var src = mode === "real" ? realData : genH1;
    var n = src.samples.length;
    var hi = Math.max(0, Math.min(n - 1, Math.round(hover / duration * (n - 1))));
    if (mode === "real") readout = "GPS " + (realData.start + hover).toFixed(2) + " · h " + realData.samples[hi].toFixed(2);else {
      var fHz = genH1.freqTrack ? genH1.freqTrack[hi] : 0;
      readout = "t " + hover.toFixed(2) + " s · h " + genH1.samples[hi].toFixed(2) + (fHz > 0 ? " · f " + fHz.toFixed(0) + " Hz" : "");
    }
  }
  if (!ready) {
    return /*#__PURE__*/React.createElement("figure", {
      className: "gw-panel"
    }, /*#__PURE__*/React.createElement("figcaption", null, /*#__PURE__*/React.createElement("span", {
      className: "gw-panel-title"
    }, "STRAIN h(t)")), /*#__PURE__*/React.createElement("p", {
      className: "dim",
      style: {
        padding: "24px 12px"
      }
    }, mode === "real" ? "Awaiting GWOSC observation — load or check network." : "Preparing seeded waveform…"));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "gw-panel"
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: spec,
    readout: readout,
    onHover: function onHover(x) {
      return setHover(x == null ? null : clampT(x));
    },
    onScrub: function onScrub(x) {
      return _onScrub(clampT(x));
    }
  }));
}

/* Time-frequency map: Hann STFT of the displayed strain, brand colormap.
   Pre-renders to an offscreen canvas; the live draw reveals frames up to the
   shared playhead and overlays the analytic frequency track when available. */
function GWSpectrogramPanel(_ref3) {
  var samples = _ref3.samples,
    sampleRate = _ref3.sampleRate,
    windowSize = _ref3.windowSize,
    hopSize = _ref3.hopSize,
    label = _ref3.label,
    note = _ref3.note,
    playT = _ref3.playT,
    duration = _ref3.duration,
    freqTrack = _ref3.freqTrack;
  var stft = useMemo(function () {
    if (!samples || samples.length < windowSize * 2) return null;
    return window.QGA_PHYSICS.stftSpectrogram(samples, {
      sampleRate: sampleRate,
      windowSize: windowSize,
      hopSize: hopSize
    });
  }, [samples, sampleRate, windowSize, hopSize]);
  var spec = useMemo(function () {
    return stft ? window.QGA_FIGURE.plots.gw.spectrogramSpec({
      spec: stft,
      playT: playT,
      duration: duration,
      freqTrack: freqTrack,
      label: label
    }) : null;
  }, [stft, playT, duration, freqTrack, label]);
  if (!spec) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "gw-panel"
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }, /*#__PURE__*/React.createElement("span", {
    className: "dim"
  }, note)));
}
var GW_PHASE_LABEL = {
  idle: "Idle",
  loading: "Loading",
  real: "Observation",
  generated: "Generated",
  error: "Unavailable",
  cancelled: "Cancelled"
};

/* ---------- Spacetime instrument + sonification (Prompt 06) ---------- */

/* Energy-weighted centroid of the 20 Hz–1 kHz analysis band; this is the
   frequency the audibilization maps onto A4 = 440 Hz. Falls back to a sane
   centre for degenerate inputs so audio setup can never crash the theatre. */
function gwBandCenter(samples, sampleRate) {
  var GW = window.QGA_GW;
  try {
    var psd = GW.estimatePsd(samples, {
      sampleRate: sampleRate,
      segmentSize: 128,
      hop: 64
    });
    var hi = Math.min(GW.GW_BAND_DEFAULTS.fHigh, sampleRate / 2);
    var num = 0,
      den = 0;
    for (var i = 0; i < psd.freqs.length; i++) {
      var f = psd.freqs[i];
      if (f < GW.GW_BAND_DEFAULTS.fLow || f > hi) continue;
      num += f * psd.psd[i];
      den += psd.psd[i];
    }
    return den > 0 && num / den > 0 ? num / den : 150;
  } catch (_unused) {
    return 150;
  }
}
function GWAudioConsole(_ref4) {
  var signal = _ref4.signal,
    audioOn = _ref4.audioOn,
    error = _ref4.error,
    onEnable = _ref4.onEnable,
    onDisable = _ref4.onDisable,
    onAudioCtl = _ref4.onAudioCtl;
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 2),
    atlasState = _useQGAState2[0],
    setAtlasState = _useQGAState2[1];
  var mode = atlasState.gwAudioMode;
  var ctl = function ctl(patch) {
    setAtlasState(patch);
    onAudioCtl(patch);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "gw-audio-bar",
    "aria-label": "Sonification controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "gw-audio-enable" + (audioOn ? " on" : ""),
    "aria-pressed": audioOn,
    onClick: function onClick() {
      return audioOn ? onDisable() : onEnable();
    }
  }, audioOn ? "■ Audio on" : "▶ Enable audio"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    "aria-label": "Audibilization mode"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Mode"), /*#__PURE__*/React.createElement("button", {
    className: "kerr-chip" + (mode === "original" ? " on" : ""),
    "aria-pressed": mode === "original",
    onClick: function onClick() {
      return ctl({
        gwAudioMode: "original"
      });
    }
  }, "Original"), /*#__PURE__*/React.createElement("button", {
    className: "kerr-chip" + (mode === "shifted" ? " on" : ""),
    "aria-pressed": mode === "shifted",
    onClick: function onClick() {
      return ctl({
        gwAudioMode: "shifted"
      });
    }
  }, "Shifted")), mode === "shifted" ? /*#__PURE__*/React.createElement(SliderRow, {
    label: "pitch",
    min: 0.25,
    max: 4,
    step: 0.05,
    value: atlasState.gwPitch,
    onChange: function onChange(v) {
      return ctl({
        gwPitch: v
      });
    },
    format: function format(v) {
      return "×" + Number(v).toFixed(2);
    }
  }) : null, /*#__PURE__*/React.createElement(SliderRow, {
    label: "volume",
    min: 0,
    max: 1,
    step: 0.01,
    value: atlasState.gwVolume,
    onChange: function onChange(v) {
      return ctl({
        gwVolume: v
      });
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "kerr-chip" + (atlasState.gwLoop ? " on" : ""),
    "aria-pressed": atlasState.gwLoop,
    onClick: function onClick() {
      return ctl({
        gwLoop: !atlasState.gwLoop
      });
    }
  }, "Loop"), /*#__PURE__*/React.createElement("span", {
    className: "gw-audio-note"
  }, audioOn && signal ? "Mapping " + (signal.bandCenterHz || 0).toFixed(0) + " Hz → 440 Hz (A4)" : "Web Audio starts only from this click; the browser clock drives the visible cursor."), error ? /*#__PURE__*/React.createElement("span", {
    className: "gw-audio-error",
    role: "alert"
  }, error) : null);
}
function GWAnalysisTheatre() {
  var _useQGAState3 = useQGAState(),
    _useQGAState4 = _slicedToArray(_useQGAState3, 2),
    atlasState = _useQGAState4[0],
    setAtlasState = _useQGAState4[1];
  var mode = atlasState.gwMode;
  var _useState17 = useState(mode === "generated" ? "Seeded local waveform — same seed reproduces this exact signal." : ""),
    _useState18 = _slicedToArray(_useState17, 2),
    status = _useState18[0],
    setStatus = _useState18[1];
  /* Explicit presentation state machine. `status` stays the human-readable
     sentence; `phase` drives the animated pill so loading / real /
     generated-fallback / error / cancelled are visually distinct. */
  var _useState19 = useState(mode === "generated" ? "generated" : "idle"),
    _useState20 = _slicedToArray(_useState19, 2),
    phase = _useState20[0],
    setPhase = _useState20[1];
  var _useState21 = useState(null),
    _useState22 = _slicedToArray(_useState21, 2),
    provenance = _useState22[0],
    setProvenance = _useState22[1];
  var _useState23 = useState(null),
    _useState24 = _slicedToArray(_useState23, 2),
    realData = _useState24[0],
    setRealData = _useState24[1];
  var realLoadRef = useRef(null);
  var gpsEnd = atlasState.gwStart + atlasState.gwDuration;
  var genH1 = useMemo(function () {
    return window.QGA_PHYSICS.generatedChirp({
      seed: atlasState.seed,
      sampleRate: GW_GEN_RATE,
      duration: GW_GEN_DURATION,
      m1: atlasState.gwM1,
      m2: atlasState.gwM2,
      mergerAt: GW_GEN_MERGER
    });
  }, [atlasState.seed, atlasState.gwM1, atlasState.gwM2]);
  var genL1 = useMemo(function () {
    return window.QGA_PHYSICS.generatedChirp({
      seed: atlasState.seed * 2 + 101,
      sampleRate: GW_GEN_RATE,
      duration: GW_GEN_DURATION,
      m1: atlasState.gwM1,
      m2: atlasState.gwM2,
      mergerAt: GW_GEN_MERGER,
      delaySeconds: GW_H1L1_DELAY
    });
  }, [atlasState.seed, atlasState.gwM1, atlasState.gwM2]);

  /* Live playback transport: one rAF clock drives both panels. Presentation
     only — the underlying signals stay seed-deterministic. */
  var duration = mode === "real" ? realData ? realData.duration : atlasState.gwDuration : GW_GEN_DURATION;
  var _useState25 = useState(0),
    _useState26 = _slicedToArray(_useState25, 2),
    playT = _useState26[0],
    setPlayT = _useState26[1];
  var _useState27 = useState(false),
    _useState28 = _slicedToArray(_useState27, 2),
    playing = _useState28[0],
    setPlaying = _useState28[1];
  var _useState29 = useState(1),
    _useState30 = _slicedToArray(_useState29, 2),
    speed = _useState30[0],
    setSpeed = _useState30[1];
  var reducedMotion = usePRM();
  useEffect(function () {
    if (!playing) return undefined;
    var raf = 0,
      last = performance.now();
    var _tick2 = function tick(now) {
      var dt = (now - last) / 1000;
      last = now;
      var son = sonRef.current;
      if (audioEnabledRef.current && son && son.stats().playing) {
        var t = son.position();
        setPlayT(t);
        // The Scene3D publish pauses when the canvas is culled; keep the QA
        // hook truthful from the transport clock, which always runs.
        if (window.__qgaGwRuntime) {
          window.__qgaGwRuntime.timelineTime = t;
          window.__qgaGwRuntime.audioPosition = t;
          window.__qgaGwRuntime.audioPlaying = true;
        }
      } else setPlayT(function (t) {
        return Math.min(duration, t + dt * speed);
      });
      raf = requestAnimationFrame(_tick2);
    };
    raf = requestAnimationFrame(_tick2);
    return function () {
      return cancelAnimationFrame(raf);
    };
  }, [playing, speed, duration]);
  useEffect(function () {
    if (playing && playT >= duration) setPlaying(false);
  }, [playT, playing, duration]);
  // restart the performance whenever the signal itself changes
  useEffect(function () {
    setPlayT(0);
    setPlaying(!reducedMotion);
  }, [mode, atlasState.seed, atlasState.gwM1, atlasState.gwM2, realData, reducedMotion]);
  var togglePlay = function togglePlay() {
    if (!playing && playT >= duration) setPlayT(0);
    setPlaying(!playing);
  };
  useEffect(function () {
    return function () {
      var _realLoadRef$current;
      return (_realLoadRef$current = realLoadRef.current) === null || _realLoadRef$current === void 0 ? void 0 : _realLoadRef$current.abort();
    };
  }, []);
  var loadReal = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var _realLoadRef$current2;
      var controller, result, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            (_realLoadRef$current2 = realLoadRef.current) === null || _realLoadRef$current2 === void 0 || _realLoadRef$current2.abort();
            controller = new AbortController();
            realLoadRef.current = controller;
            setStatus("Loading bounded GWOSC strain…");
            setProvenance(null);
            setRealData(null);
            setPhase("loading");
            _context.p = 1;
            _context.n = 2;
            return QGA_FETCH_GWOSC(atlasState.gwEvent, {
              detector: atlasState.gwDetector,
              start: atlasState.gwStart,
              duration: atlasState.gwDuration,
              signal: controller.signal
            });
          case 2:
            result = _context.v;
            if (!(realLoadRef.current !== controller)) {
              _context.n = 3;
              break;
            }
            return _context.a(2);
          case 3:
            setRealData(result);
            setProvenance(result.provenance);
            setStatus("GWOSC observation loaded; preview is downsampled calibrated strain.");
            setPhase("real");
            _context.n = 7;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            if (!(realLoadRef.current !== controller)) {
              _context.n = 5;
              break;
            }
            return _context.a(2);
          case 5:
            if (!((_t === null || _t === void 0 ? void 0 : _t.name) === "AbortError")) {
              _context.n = 6;
              break;
            }
            setPhase("cancelled");
            return _context.a(2);
          case 6:
            setStatus("GWOSC unavailable; the seeded generated signal below remains usable.");
            setPhase("error");
          case 7:
            _context.p = 7;
            if (realLoadRef.current === controller) realLoadRef.current = null;
            return _context.f(7);
          case 8:
            return _context.a(2);
        }
      }, _callee, null, [[1, 4, 7, 8]]);
    }));
    return function loadReal() {
      return _ref5.apply(this, arguments);
    };
  }();
  var cancelReal = function cancelReal() {
    var controller = realLoadRef.current;
    if (!controller) return;
    realLoadRef.current = null;
    controller.abort();
    setStatus("GWOSC request cancelled; the seeded generated signal below remains usable.");
    setPhase("cancelled");
  };
  var changeMode = function changeMode(next) {
    setAtlasState({
      gwMode: next
    });
    if (next === "real") loadReal();else {
      var _realLoadRef$current3;
      (_realLoadRef$current3 = realLoadRef.current) === null || _realLoadRef$current3 === void 0 || _realLoadRef$current3.abort();
      realLoadRef.current = null;
      setRealData(null);
      setProvenance(null);
      setStatus("Seeded local waveform — same seed reproduces this exact signal.");
      setPhase("generated");
    }
  };
  useEffect(function () {
    if (mode === "real") loadReal();
  }, [atlasState.gwDetector, atlasState.gwStart, atlasState.gwDuration]);
  var mc = window.QGA_PHYSICS.chirpMass(atlasState.gwM1, atlasState.gwM2);
  var tC20 = window.QGA_PHYSICS.timeToCoalescence(20, mc);
  var realEffRate = realData ? realData.samples.length / realData.duration : 0;
  var specSamples = mode === "real" && realData ? realData.samples : genH1.samples;
  var specRate = mode === "real" && realData ? realEffRate : GW_GEN_RATE;
  var specWindow = mode === "real" ? 64 : 128;
  var specHop = mode === "real" ? 8 : 24;

  /* ----- Spacetime instrument + sonification (Prompt 06) -----
     Bundles never mutate their raw samples; the instrument contract derives
     both GPU representations from them. `playT` is the single timeline: when
     audio is on it *follows* the AudioContext clock (sonifier.position()),
     so the visible cursor and the sound are the same clock, not two clocks
     agreeing — the spec's 50 ms bound is a frame, not a negotiation. */
  var GW = window.QGA_GW;
  var playTRef = useRef(0);
  playTRef.current = playT;
  var transportPlayingRef = useRef(false);
  transportPlayingRef.current = playing;
  var durationRef = useRef(duration);
  durationRef.current = duration;
  var instrumentRef = useRef({
    signalTex: null,
    sigVersion: 0,
    duration: GW_GEN_DURATION,
    layout: null
  });
  var sonRef = useRef(null);
  var audioEnabledRef = useRef(false);
  var _useState31 = useState(false),
    _useState32 = _slicedToArray(_useState31, 2),
    audioOn = _useState32[0],
    setAudioOn = _useState32[1];
  var _useState33 = useState(""),
    _useState34 = _slicedToArray(_useState33, 2),
    audioError = _useState34[0],
    setAudioError = _useState34[1];
  var instrumentBundles = useMemo(function () {
    if (!GW) return [];
    if (mode === "real" && realData) {
      try {
        return [GW.buildRealBundle({
          samples: realData.samples,
          sampleRate: realData.sampleRate,
          start: realData.start,
          duration: realData.duration,
          provenance: realData.provenance
        })];
      } catch (_unused2) {
        return [];
      }
    }
    if (mode === "generated") {
      var prov = GW.syntheticProvenance({
        seed: atlasState.seed
      });
      var h1 = GW.buildGeneratedBundle({
        samples: genH1.samples,
        sampleRate: GW_GEN_RATE,
        duration: GW_GEN_DURATION,
        provenance: prov,
        extra: {
          plus: genH1.samples,
          freqTrack: genH1.freqTrack
        }
      });
      var l1 = GW.buildGeneratedBundle({
        samples: genL1.samples,
        sampleRate: GW_GEN_RATE,
        duration: GW_GEN_DURATION,
        provenance: prov,
        extra: {
          plus: genL1.samples
        }
      });
      return [h1, l1];
    }
    return [];
  }, [GW, mode, realData, genH1, genL1, atlasState.seed]);
  var instrumentTex = useMemo(function () {
    return GW ? GW.INSTRUMENT.buildSignalTextureRows(instrumentBundles) : null;
  }, [GW, instrumentBundles]);
  useEffect(function () {
    var layout = GW.INSTRUMENT.splitLayout({
      detectors: instrumentBundles.length >= 2 ? ["H1", "L1"] : ["H1"]
    });
    instrumentRef.current = {
      signalTex: instrumentTex,
      sigVersion: instrumentRef.current.sigVersion + 1,
      duration: duration,
      layout: layout
    };
  }, [GW, instrumentTex, instrumentBundles.length, duration]);
  var audioSignal = useMemo(function () {
    if (!GW) return null;
    var isReal = mode === "real" && realData;
    var samples = isReal ? realData.samples : genH1.samples;
    var sampleRate = isReal ? realData.samples.length / realData.duration : GW_GEN_RATE;
    return {
      samples: samples,
      sampleRate: sampleRate,
      bandCenterHz: gwBandCenter(samples, sampleRate)
    };
  }, [GW, mode, realData, genH1]);

  /* Instrument HUD phase + cinematic merger punch (generated mode only:
     real GWOSC windows have no known coalescence time). The goal object is
     memoized on the boolean so Scene3D re-triggers only on punch in/out. */
  var gwPhase = playT < GW_GEN_MERGER - 0.15 ? "inspiral" : playT <= GW_GEN_MERGER + 0.25 ? "merger" : "ringdown";
  var mergerPunch = mode === "generated" && playT >= GW_GEN_MERGER - 0.15 && playT <= GW_GEN_MERGER + 0.8;
  var instrumentCameraGoal = useMemo(function () {
    return mergerPunch ? {
      radius: 9.4,
      theta: 0.6,
      phi: 1.05
    } : null;
  }, [mergerPunch]);
  useEffect(function () {
    if (!GW) return undefined;
    var son = GW.createGwSonifier({
      // When a non-looped clip plays out, park the shared cursor at the end,
      // matching the transport's own stop-at-duration behaviour.
      onEnded: function onEnded() {
        return setPlayT(durationRef.current);
      }
    });
    sonRef.current = son;
    return function () {
      sonRef.current = null;
      audioEnabledRef.current = false;
      setAudioOn(false);
      son.dispose();
    };
  }, [GW]);
  useEffect(function () {
    var son = sonRef.current;
    if (!son || !audioSignal) return;
    son.loadSignal(audioSignal);
  }, [audioSignal]);
  useEffect(function () {
    var son = sonRef.current;
    if (!son || !audioEnabledRef.current) return;
    // Audio failures degrade to a silent console, never a crashed theatre.
    try {
      if (playing) son.play(playTRef.current >= duration ? 0 : playTRef.current);else son.pause();
    } catch (error) {
      audioEnabledRef.current = false;
      setAudioOn(false);
      setAudioError("Audio stopped: " + (error && error.message ? error.message : String(error)));
    }
  }, [playing, audioOn, duration, audioSignal]);
  var enableAudio = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var son, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            son = sonRef.current;
            if (!(!son || !audioSignal)) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            _context2.p = 1;
            _context2.n = 2;
            return son.enable();
          case 2:
            son.setVolume(atlasState.gwVolume);
            son.setMode(atlasState.gwAudioMode, atlasState.gwPitch);
            son.setLoop(atlasState.gwLoop === true);
            audioEnabledRef.current = true;
            setAudioOn(true);
            setAudioError("");
            if (playing) son.play(playTRef.current >= duration ? 0 : playTRef.current);else son.seek(playTRef.current);
            _context2.n = 4;
            break;
          case 3:
            _context2.p = 3;
            _t2 = _context2.v;
            setAudioError("Audio unavailable: " + (_t2 && _t2.message ? _t2.message : String(_t2)));
          case 4:
            return _context2.a(2);
        }
      }, _callee2, null, [[1, 3]]);
    }));
    return function enableAudio() {
      return _ref6.apply(this, arguments);
    };
  }();
  var disableAudio = function disableAudio() {
    var son = sonRef.current;
    if (!son) return;
    son.pause();
    audioEnabledRef.current = false;
    setAudioOn(false);
  };
  var onAudioCtl = function onAudioCtl(patch) {
    var son = sonRef.current;
    if (!son || !audioEnabledRef.current) return;
    if ("gwAudioMode" in patch) son.setMode(patch.gwAudioMode, atlasState.gwPitch);else if ("gwPitch" in patch) son.setPitch(patch.gwPitch);else if ("gwVolume" in patch) son.setVolume(patch.gwVolume);else if ("gwLoop" in patch) son.setLoop(patch.gwLoop === true);
  };

  /* Scrubbing retargets both clocks: the visible transport and the audio. */
  var scrubTo = function scrubTo(t) {
    setPlayT(t);
    var son = sonRef.current;
    if (audioEnabledRef.current && son) son.seek(t);
  };
  var buildInstrument = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(ctx) {
      var _ref8, _window$QGA_RENDER_OP, _window$QGA_RENDER_OP2, _atlasState$seed, _ctx$settings$current, _instrumentRef$curren;
      var _yield$GW$loadRuntime, createGwRuntime, runtime, armEnd, labelRows, _iterator2, _step2, _loop, appliedSig, _t3;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            if (GW) {
              _context4.n = 1;
              break;
            }
            throw new Error("GW instrument module unavailable");
          case 1:
            _context4.n = 2;
            return GW.loadRuntime();
          case 2:
            _yield$GW$loadRuntime = _context4.v;
            createGwRuntime = _yield$GW$loadRuntime.createGwRuntime;
            _context4.n = 3;
            return createGwRuntime({
              backendPreference: (_ref8 = (_window$QGA_RENDER_OP = (_window$QGA_RENDER_OP2 = window.QGA_RENDER_OPTIONS) === null || _window$QGA_RENDER_OP2 === void 0 ? void 0 : _window$QGA_RENDER_OP2.forceBackend) !== null && _window$QGA_RENDER_OP !== void 0 ? _window$QGA_RENDER_OP : ctx.settings.current.renderBackend) !== null && _ref8 !== void 0 ? _ref8 : "auto",
              seed: (_atlasState$seed = atlasState.seed) !== null && _atlasState$seed !== void 0 ? _atlasState$seed : 42,
              detail3d: (_ctx$settings$current = ctx.settings.current.detail3d) !== null && _ctx$settings$current !== void 0 ? _ctx$settings$current : "balanced",
              reducedMotion: ctx.motion() === 0,
              mergerSeconds: mode === "generated" ? GW_GEN_MERGER : null
            });
          case 3:
            runtime = _context4.v;
            ctx.scene.add(runtime.mesh);
            runtime.mesh.position.y = -0.6;
            // Detector-arm labels anchor the abstract lattice to the interferometer.
            armEnd = 9 * 0.92;
            labelRows = ((_instrumentRef$curren = instrumentRef.current.layout) === null || _instrumentRef$curren === void 0 ? void 0 : _instrumentRef$curren.rows) || [{
              detector: "H1",
              offsetX: 0
            }];
            _iterator2 = _createForOfIteratorHelper(labelRows);
            _context4.p = 4;
            _loop = /*#__PURE__*/_regenerator().m(function _loop() {
              var row;
              return _regenerator().w(function (_context3) {
                while (1) switch (_context3.n) {
                  case 0:
                    row = _step2.value;
                    ctx.label(row.detector + " · x-arm", function () {
                      return new THREE.Vector3(row.offsetX + armEnd, -0.35, 0);
                    }, "gw-arm-label");
                    ctx.label(row.detector + " · y-arm", function () {
                      return new THREE.Vector3(row.offsetX, -0.35, armEnd);
                    }, "gw-arm-label");
                  case 1:
                    return _context3.a(2);
                }
              }, _loop);
            });
            _iterator2.s();
          case 5:
            if ((_step2 = _iterator2.n()).done) {
              _context4.n = 7;
              break;
            }
            return _context4.d(_regeneratorValues(_loop()), 6);
          case 6:
            _context4.n = 5;
            break;
          case 7:
            _context4.n = 9;
            break;
          case 8:
            _context4.p = 8;
            _t3 = _context4.v;
            _iterator2.e(_t3);
          case 9:
            _context4.p = 9;
            _iterator2.f();
            return _context4.f(9);
          case 10:
            appliedSig = -1;
            return _context4.a(2, {
              autoRotate: false,
              // The lattice follows the transport clock (React state, advanced while playing) and the audio clock: it needs
              // frames while either is running, and one frame per scrub (the parent passes playT as invalidateKey).
              isAnimated: function isAnimated() {
                var _sonRef$current;
                return transportPlayingRef.current || audioEnabledRef.current && !!((_sonRef$current = sonRef.current) !== null && _sonRef$current !== void 0 && _sonRef$current.stats().playing);
              },
              recoverable: function recoverable(error) {
                return runtime.recoverable ? runtime.recoverable(error) : false;
              },
              update: function update() {
                var renderer = ctx.renderer;
                if (!renderer) return;
                // When audio is live, the AudioContext clock is the single source of
                // truth: pull it straight into playTRef every frame so the lattice and
                // the published cursor read position() within this same rAF callback.
                // React's setPlayT (transport tick) still drives the DOM progress bar,
                // but a render-lagged ref would drift by playbackRate × frame-time on
                // the audibilized (fast) clock.
                var son = sonRef.current;
                if (audioEnabledRef.current && son && son.stats().playing) {
                  playTRef.current = son.position();
                }
                var snap = instrumentRef.current;
                if (snap.sigVersion !== appliedSig) {
                  appliedSig = snap.sigVersion;
                  if (snap.signalTex) {
                    runtime.setSignal(snap.signalTex);
                    if (runtime.setRows) runtime.setRows(snap.layout ? snap.layout.rows : null);
                  }
                }
                runtime.sync({
                  renderer: renderer,
                  timelineTime: playTRef.current,
                  durationSeconds: snap.duration || duration,
                  gain: 0.55,
                  motion: ctx.motion() === 0 ? 0.25 : 1,
                  ratio: Math.min(2, window.devicePixelRatio || 1)
                });
                window.__qgaGwRuntime = {
                  kind: runtime.kind,
                  particles: runtime.particleCount,
                  rows: snap.layout ? snap.layout.rows.length : 1,
                  timelineTime: playTRef.current,
                  audioPosition: audioEnabledRef.current && son ? son.position() : null,
                  audioPlaying: audioEnabledRef.current && son ? son.stats().playing : false,
                  duration: snap.duration,
                  audioEnabled: audioEnabledRef.current,
                  sig: snap.sigVersion
                };
              },
              dispose: function dispose() {
                runtime.dispose();
                delete window.__qgaGwRuntime;
              }
            });
        }
      }, _callee3, null, [[4, 8, 9, 10]]);
    }));
    return function buildInstrument(_x3) {
      return _ref7.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame gw-theatre"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-observatory-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-plate"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-ident"
  }, "GW", /*#__PURE__*/React.createElement("span", null, "OBS")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Signal Analysis Theatre"), /*#__PURE__*/React.createElement("p", null, "Strain and time\u2013frequency read of a compact-binary chirp \u2014 seeded simulation or bounded GWOSC observation."))), /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-state"
  }, mode === "generated" ? /*#__PURE__*/React.createElement("span", {
    className: "badge badge-effective"
  }, "Generated teaching signal") : /*#__PURE__*/React.createElement("span", {
    className: "badge badge-established"
  }, "Real detector observation"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-state-line"
  }, mode === "generated" ? "ℳ = " + mc.toFixed(1) + " M☉ · seed " + atlasState.seed + " · " + GW_GEN_RATE + " Hz" : atlasState.gwEvent + " · " + atlasState.gwDetector + " · GPS " + atlasState.gwStart + "+" + atlasState.gwDuration + "s"))), /*#__PURE__*/React.createElement("div", {
    className: "kerr-instrument-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    "aria-label": "Data mode"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Source"), /*#__PURE__*/React.createElement("button", {
    className: "kerr-chip" + (mode === "generated" ? " on" : ""),
    "aria-pressed": mode === "generated",
    onClick: function onClick() {
      return changeMode("generated");
    }
  }, "Generated"), /*#__PURE__*/React.createElement("button", {
    className: "kerr-chip" + (mode === "real" ? " on" : ""),
    "aria-pressed": mode === "real",
    onClick: function onClick() {
      return changeMode("real");
    }
  }, "GWOSC real")), mode === "real" ? /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    "aria-label": "Observation selection"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Event"), /*#__PURE__*/React.createElement("input", {
    className: "gw-event-input",
    value: atlasState.gwEvent,
    "aria-label": "GWOSC event name",
    onChange: function onChange(e) {
      return setAtlasState({
        gwEvent: e.target.value
      });
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Detector"), ["H1", "L1", "V1"].map(function (d) {
    return /*#__PURE__*/React.createElement("button", {
      key: d,
      className: "kerr-chip" + (atlasState.gwDetector === d ? " on" : ""),
      "aria-pressed": atlasState.gwDetector === d,
      onClick: function onClick() {
        return setAtlasState({
          gwDetector: d
        });
      }
    }, d);
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: loadReal
  }, "Reload")) : /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    "aria-label": "Binary masses and generation seed"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "m\u2081",
    min: 5,
    max: 120,
    step: 1,
    value: atlasState.gwM1,
    onChange: function onChange(v) {
      return setAtlasState({
        gwM1: v
      });
    },
    format: function format(v) {
      return v + " M☉";
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "m\u2082",
    min: 5,
    max: 120,
    step: 1,
    value: atlasState.gwM2,
    onChange: function onChange(v) {
      return setAtlasState({
        gwM2: v
      });
    },
    format: function format(v) {
      return v + " M☉";
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "seed",
    min: 1,
    max: 9999,
    step: 1,
    value: atlasState.seed,
    onChange: function onChange(v) {
      return setAtlasState({
        seed: v
      });
    },
    format: function format(v) {
      return "#" + v;
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "gw-state-pill",
    "data-phase": phase,
    role: "status",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("span", {
    className: "gw-state-dot",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    className: "gw-state-label"
  }, GW_PHASE_LABEL[phase] || phase), /*#__PURE__*/React.createElement("span", {
    className: "gw-state-text"
  }, status), phase === "error" || phase === "cancelled" ? /*#__PURE__*/React.createElement("button", {
    className: "gw-state-retry",
    onClick: loadReal
  }, "Retry") : null, phase === "loading" ? /*#__PURE__*/React.createElement("button", {
    className: "gw-state-retry",
    onClick: cancelReal
  }, "Cancel") : null), /*#__PURE__*/React.createElement("div", {
    className: "gw-transport",
    "aria-label": "Signal playback transport"
  }, /*#__PURE__*/React.createElement("button", {
    className: "gw-play-btn",
    onClick: togglePlay,
    "aria-label": playing ? "Pause playback" : "Play signal"
  }, playing ? "❚❚" : "▶"), /*#__PURE__*/React.createElement("button", {
    className: "gw-replay-btn",
    onClick: function onClick() {
      scrubTo(0);
      setPlaying(!reducedMotion);
    },
    "aria-label": "Replay from the start"
  }, "\u21BA"), /*#__PURE__*/React.createElement("div", {
    className: "gw-progress",
    role: "slider",
    "aria-label": "Playback position",
    "aria-valuemin": 0,
    "aria-valuemax": duration,
    "aria-valuenow": Number(playT.toFixed(2)),
    onPointerDown: function onPointerDown(e) {
      e.currentTarget.setPointerCapture(e.pointerId);
      var r = e.currentTarget.getBoundingClientRect();
      scrubTo(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duration);
    },
    onPointerMove: function onPointerMove(e) {
      if (!(e.buttons & 1)) return;
      var r = e.currentTarget.getBoundingClientRect();
      scrubTo(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duration);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "gw-progress-fill",
    style: {
      width: 100 * Math.min(1, playT / duration) + "%"
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "gw-time"
  }, "t = ", playT.toFixed(2), " / ", duration.toFixed(1), " s"), /*#__PURE__*/React.createElement("div", {
    className: "gw-speed",
    "aria-label": "Playback speed"
  }, [0.5, 1, 2, 4].map(function (s) {
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      className: "kerr-chip" + (speed === s ? " on" : ""),
      "aria-pressed": speed === s,
      onClick: function onClick() {
        return setSpeed(s);
      }
    }, s, "\xD7");
  }))), mode === "real" ? /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "start GPS",
    min: 1126259000,
    max: 1126260000,
    step: 1,
    value: atlasState.gwStart,
    onChange: function onChange(v) {
      return setAtlasState({
        gwStart: v
      });
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "duration",
    min: 1,
    max: 32,
    step: 1,
    value: atlasState.gwDuration,
    onChange: function onChange(v) {
      return setAtlasState({
        gwDuration: v
      });
    },
    format: function format(v) {
      return v + " s";
    }
  })) : null, /*#__PURE__*/React.createElement(GWStrainPanel, {
    mode: mode,
    genH1: genH1,
    genL1: genL1,
    realData: realData,
    detector: atlasState.gwDetector,
    playT: playT,
    onScrub: scrubTo
  }), /*#__PURE__*/React.createElement(GWSpectrogramPanel, {
    samples: specSamples,
    sampleRate: specRate,
    windowSize: specWindow,
    hopSize: specHop,
    playT: playT,
    duration: duration,
    freqTrack: mode === "generated" ? genH1.freqTrack : null,
    label: mode === "real" ? atlasState.gwEvent + " " + atlasState.gwDetector : "H1 · seed " + atlasState.seed,
    note: mode === "real" ? "STFT of downsampled preview · Nyquist " + (specRate / 2).toFixed(0) + " Hz — full chirp band needs the 4 kHz product" : "Hann STFT " + specWindow + "/" + specHop + " · not a Q-transform"
  }), /*#__PURE__*/React.createElement(GWAudioConsole, {
    signal: audioSignal,
    audioOn: audioOn,
    error: audioError,
    onEnable: enableAudio,
    onDisable: disableAudio,
    onAudioCtl: onAudioCtl
  }), /*#__PURE__*/React.createElement("figure", {
    className: "gw-panel gw-instrument-figure"
  }, /*#__PURE__*/React.createElement("figcaption", null, /*#__PURE__*/React.createElement("span", {
    className: "gw-panel-title"
  }, "SPACETIME INSTRUMENT"), mode === "generated" ? /*#__PURE__*/React.createElement("span", {
    className: "badge badge-effective"
  }, "GENERATED \xB7 SEEDED") : /*#__PURE__*/React.createElement("span", {
    className: "badge badge-established"
  }, "OBSERVATION \xB7 GWOSC"), /*#__PURE__*/React.createElement("span", {
    className: "gw-panel-note"
  }, instrumentBundles.length >= 2 ? "H1 + L1 lattices · 7 ms apart" : "single-detector lattice", " · the wave squeezes and stretches the grid as it travels outward — colors show direction, brightness shows strength; motion is amplified for visibility")), /*#__PURE__*/React.createElement(Scene3D, {
    animated: false,
    invalidateKey: playT,
    height: 460,
    aria: "Three-dimensional spacetime lattice deforming as the gravitational wave passes, driven by the same clock as the audio cursor",
    build: buildInstrument,
    deps: [],
    cameraGoal: instrumentCameraGoal,
    overlay: /*#__PURE__*/React.createElement("div", {
      className: "gw-instr-hud"
    }, /*#__PURE__*/React.createElement("div", {
      className: "gw-instr-clock"
    }, /*#__PURE__*/React.createElement("span", {
      className: "gw-instr-t"
    }, "t = ", playT.toFixed(2), " s"), mode === "generated" ? /*#__PURE__*/React.createElement("span", {
      className: "gw-instr-phase" + (gwPhase === "merger" ? " merger" : "")
    }, gwPhase) : null), /*#__PURE__*/React.createElement("div", {
      className: "gw-instr-legend",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("span", null, "squeeze"), /*#__PURE__*/React.createElement("i", {
      className: "gw-instr-ramp"
    }), /*#__PURE__*/React.createElement("span", null, "stretch"))),
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "gw-instrument-fallback"
    }, "The 3-D spacetime instrument needs WebGL \u2014 the strain and time\u2013frequency panels above carry the same signal.")
  })), /*#__PURE__*/React.createElement("div", {
    className: "kerr-deck"
  }, mode === "generated" ? /*#__PURE__*/React.createElement("section", {
    className: "kerr-rgroup"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h4", null, "Signal"), /*#__PURE__*/React.createElement("span", null, "leading-order quadrupole \xB7 teaching model")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-rgrid"
  }, /*#__PURE__*/React.createElement(KerrReadout, {
    lead: true,
    label: "chirp mass \u2133",
    value: mc.toFixed(1),
    unit: "M\u2609",
    formulaTex: "\\mathcal{M} = \\frac{(m_1 m_2)^{3/5}}{(m_1+m_2)^{1/5}} = " + mc.toFixed(1) + "\\,M_\\odot"
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "t_c from 20 Hz",
    value: tC20.toFixed(2),
    unit: "s",
    formulaTex: "t_c = \\\\frac{5}{256}\\\\,\\\\frac{(\\\\pi f)^{-8/3}}{(G\\\\mathcal{M}/c^3)^{-5/3}}"
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "H1\u2192L1 offset",
    value: "7",
    unit: "ms",
    formula: "illustrative \xB7 ~3000 km baseline"
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "noise",
    value: "seeded Gaussian",
    formula: "not a measured detector PSD"
  }))) : /*#__PURE__*/React.createElement("section", {
    className: "kerr-rgroup gw-reveal",
    key: "obs-" + (provenance ? provenance.retrievedAt : "pending")
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h4", null, "Observation"), /*#__PURE__*/React.createElement("span", null, "GWOSC API v2 \xB7 bounded fetch")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-rgrid"
  }, /*#__PURE__*/React.createElement(KerrReadout, {
    lead: true,
    label: "event",
    value: atlasState.gwEvent,
    formula: "catalog name, auto-versioned"
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "detector / range",
    value: atlasState.gwDetector,
    unit: "GPS " + atlasState.gwStart + "–" + gpsEnd,
    formula: "calibrated strain h(t), dimensionless"
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "preview points",
    value: realData ? realData.samples.length : "—",
    unit: realData ? realEffRate.toFixed(0) + " Hz eff." : "",
    formula: "\u22641200 pts, uniform downsample"
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "source rate",
    value: realData ? (realData.sampleRate / 1000).toFixed(0) : "—",
    unit: "kHz",
    formula: "GWOSC 4 kHz TXT product"
  })))), /*#__PURE__*/React.createElement("details", {
    className: "kerr-validity"
  }, /*#__PURE__*/React.createElement("summary", null, /*#__PURE__*/React.createElement("span", null, "Assumptions, validity & uncertainty"), /*#__PURE__*/React.createElement("span", {
    className: "kerr-check ok"
  }, mode === "generated" ? "seeded · reproducible" : "bounded · provenanced")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-validity-body"
  }, /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("dt", null, "Generated mode"), /*#__PURE__*/React.createElement("dd", null, "Leading-order quadrupole inspiral with the exact radiation-reaction scalings f", /*#__PURE__*/React.createElement("sub", null, "gw"), " \u221D (t", /*#__PURE__*/React.createElement("sub", null, "c"), "\u2212t)", /*#__PURE__*/React.createElement("sup", null, "\u22123/8"), " and h \u221D f", /*#__PURE__*/React.createElement("sup", null, "2/3"), ", plus a damped-sinusoid ringdown. It is a teaching waveform: no spins, no higher post-Newtonian orders, not numerical relativity. Noise is seeded Gaussian \u2014 the same seed reproduces the exact signal \u2014 and is", /*#__PURE__*/React.createElement("em", null, " not"), " a measured LIGO noise PSD. The 7 ms H1\u2192L1 offset is an illustrative light-travel time across the ~3000 km baseline."), /*#__PURE__*/React.createElement("dt", null, "Real mode (GWOSC)"), /*#__PURE__*/React.createElement("dd", null, "One bounded calibrated-strain file per selection from the official GWOSC API v2 (gwosc.org/api/v2/docs), gzip-decoded in the browser and uniformly downsampled to \u22641200 points. The preview's effective rate (", mode === "real" && realData ? realEffRate.toFixed(0) + " Hz" : "rate", ") sets the spectrogram Nyquist limit; the full 35\u2013350 Hz chirp band requires the complete 4 kHz product, which this static client deliberately does not download."), /*#__PURE__*/React.createElement("dt", null, "Spectrogram"), /*#__PURE__*/React.createElement("dd", null, "Hann-windowed short-time Fourier transform computed live in the browser from the displayed samples. It is not a Q-transform and is not whitened; the rising chirp track is nevertheless clearly visible in the generated signal.")), provenance ? /*#__PURE__*/React.createElement("p", {
    className: "small dim gw-provenance",
    style: {
      marginBottom: 0
    }
  }, "Provenance: ", provenance.source, " \xB7 ", /*#__PURE__*/React.createElement("a", {
    href: provenance.url,
    target: "_blank",
    rel: "noreferrer"
  }, "strain listing"), " \xB7 ", /*#__PURE__*/React.createElement("a", {
    href: provenance.downloadUrl,
    target: "_blank",
    rel: "noreferrer"
  }, "data file"), " \xB7 retrieved ", provenance.retrievedAt) : null)));
}
function ModuleExp(_ref9) {
  var go = _ref9.go;
  return /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement(ModuleHeader, {
    num: "08",
    kicker: "Where theory meets data",
    title: "Experimental and Observational Frontiers",
    lede: "Quantum gravity research is constrained by a hard fact: no experiment has ever probed the Planck scale, and no direct experimental confirmation of any complete quantum gravity theory currently exists. What experiments do provide is a tightening net of indirect constraints.",
    target: "[data-figure=\"exp-gw-qtransform\"]"
  }), /*#__PURE__*/React.createElement(Section, {
    title: "Collider event explorer"
  }, /*#__PURE__*/React.createElement("p", null, "The LHC collides protons at 13.6 TeV \u2014 energies that recreate conditions ~10\u207B\xB9\xB2 s after the Big Bang and that discovered the Higgs boson in 2012. For quantum gravity the result so far is a null one with teeth: no superpartners, no extra-dimension signatures, no microscopic black holes. These nulls carve away parameter space without selecting a successor theory."), /*#__PURE__*/React.createElement(ColliderEvent3D, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Reconstructing a resonance"
  }, /*#__PURE__*/React.createElement("p", null, "A single event proves nothing. Real discovery is statistical: measure the ", /*#__PURE__*/React.createElement("strong", null, "invariant mass"), " of particle pairs across millions of collisions and look for a bump where a short-lived particle decayed. Fire collisions below and watch the Z\u2070 boson emerge from the continuum \u2014 the same procedure that found the W and Z (1983) and the Higgs (2012)."), /*#__PURE__*/React.createElement(InvariantMassLab, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Gravitational waves"
  }, /*#__PURE__*/React.createElement(GWAnalysisTheatre, null), /*#__PURE__*/React.createElement("p", null, "LIGO's 2016 detection of GW150914 opened an observational channel on strong-field gravity. Merger waveforms test general relativity in its most violent regime \u2014 and so far the theory passes. Some quantum gravity scenarios predict deviations (horizon-scale structure echoes, dispersion of the waves over cosmological distance); none has been observed."), /*#__PURE__*/React.createElement(GWInspiral3D, null)), /*#__PURE__*/React.createElement(Section, {
    title: "The waveform, computed"
  }, /*#__PURE__*/React.createElement("p", null, "The signal above is now generated from a real expansion, not a power law with a tuned ringdown. Move the masses and the inspiral shortens, the remnant spins faster and the ringdown climbs \u2014 all three follow from the same two numbers."), /*#__PURE__*/React.createElement(PnWaveformLab, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Finding the signal: matched filtering"
  }, /*#__PURE__*/React.createElement("p", null, "A detector records noise; the search asks whether a template is hiding in it. The matched filter answers that with a single number per template, weighted by how noisy the detector is at each frequency. Below is a real search over a 32-template bank, and \u2014 separately \u2014 a real measurement from CMS open data, so the synthetic and the observed are never mixed."), /*#__PURE__*/React.createElement(MatchedFilterLab, null)), /*#__PURE__*/React.createElement(Section, {
    title: "The wider observational net"
  }, /*#__PURE__*/React.createElement("p", null, "Four windows onto quantum gravity, each now a computed instrument rather than a paragraph: the arrival time of a gamma-ray photon, the tensor-to-scalar ratio inflation would leave in the microwave background, the short-range test of Newton's law, and the horizon-scale image."), /*#__PURE__*/React.createElement(ObservationalNetLab, null)), /*#__PURE__*/React.createElement(Misconception, {
    title: "Detecting gravitational waves did not confirm quantum gravity."
  }, "LIGO observes classical waves \u2014 coherent states of enormous numbers of would-be gravitons. Confirming the wave predictions of classical general relativity says nothing yet about the quantum theory; detecting a single graviton is believed to be beyond any physically realizable detector."), /*#__PURE__*/React.createElement(ConceptBridge, {
    id: "exp-open",
    go: go
  }));
}
window.ModuleExp = ModuleExp;
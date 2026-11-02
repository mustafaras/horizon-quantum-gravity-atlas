/* Compiled from js/labs/planck-labs.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regeneratorValues(e) { if (null != e) { var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0; if (t) return t.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) return { next: function next() { return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e }; } }; } throw new TypeError(_typeof(e) + " is not iterable"); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// Planck scale and spin foam labs.
var LADDER_STOPS = [{
  log: 0,
  name: "Human scale — 1 m",
  note: "Classical physics; gravity and quantum theory both apply, in separate regimes."
}, {
  log: -5,
  name: "Cell / micron scale — 10⁻⁵ m",
  note: "Biology and soft matter; thermal physics dominates."
}, {
  log: -10,
  name: "Atomic scale — 10⁻¹⁰ m",
  note: "Quantum mechanics governs structure; gravity utterly negligible between particles."
}, {
  log: -15,
  name: "Nuclear scale — 10⁻¹⁵ m",
  note: "QCD territory: quarks, gluons, confinement. Probed by nuclear and hadron physics."
}, {
  log: -18,
  name: "Electroweak scale — ~10⁻¹⁸ m",
  note: "W, Z, Higgs physics. Roughly the resolution of the LHC (~10 TeV)."
}, {
  log: -19,
  name: "Collider frontier — ~10⁻¹⁹ m",
  note: "The shortest distance directly probed by any experiment to date."
}, {
  log: -30,
  name: "Speculative desert / GUT region",
  note: "No data. Grand unification, if real, would live near 10⁻³¹ m (10¹⁶ GeV)."
}, {
  log: -35,
  name: "Planck scale — 1.6×10⁻³⁵ m",
  note: "Quantum gravity regime: the classical picture of smooth spacetime can no longer be trusted."
}];
function PlanckFluctuationCanvas(_ref) {
  var logRef = _ref.logRef;
  var prm = usePRM();
  var sim = useSimLoop(function (ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    // proximity to Planck scale: 0 (far) → 1 (at Planck)
    var prox = Math.max(0, Math.min(1, (Math.max(-35, logRef.current) + 19) / (-35 + 19)));
    var fluct = Math.pow(Math.max(0, (prox - 0.55) / 0.45), 2); // only ramps up near the end
    var n = 13,
      gw = w / (n - 1),
      gh = h / (n - 1);
    var jit = function jit(i, j, k) {
      if (fluct === 0 || prm) return 0;
      return Math.sin(i * 2.7 + j * 1.9 + t * (1.5 + k) + k * 7) * fluct * Math.min(gw, gh) * 0.42;
    };
    ctx.lineWidth = 1;
    for (var j = 0; j < n; j++) {
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-67", (0.16 + fluct * 0.25).toFixed(3));
      ctx.beginPath();
      for (var i = 0; i < n; i++) {
        var x = i * gw + jit(i, j, 1),
          y = j * gh + jit(i, j, 2);
        if (i === 0) ctx.moveTo(x, y);else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (var _i = 0; _i < n; _i++) {
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-67", (0.16 + fluct * 0.25).toFixed(3));
      ctx.beginPath();
      for (var _j = 0; _j < n; _j++) {
        var _x = _i * gw + jit(_i, _j, 1),
          _y = _j * gh + jit(_i, _j, 2);
        if (_j === 0) ctx.moveTo(_x, _y);else ctx.lineTo(_x, _y);
      }
      ctx.stroke();
    }
    ctx.font = QGA_TOKENS.monoPx(10);
    ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-81", 0.75);
    if (fluct > 0.04) {
      ctx.fillText("metric fluctuations ~ O(1): classical geometry unreliable", 12, 20);
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-amber-79-c12", 0.8);
      ctx.fillText("visualization is theory-dependent — discreteness/foam NOT established", 12, h - 12);
    } else {
      ctx.fillText("smooth classical spacetime — excellent approximation at this scale", 12, 20);
    }
  }, [prm]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: sim.canvasRef,
    className: "viz-canvas",
    style: {
      height: 280
    }
  });
}
function ScaleLadder() {
  var _useState = useState(-10),
    _useState2 = _slicedToArray(_useState, 2),
    logL = _useState2[0],
    setLogL = _useState2[1];
  useEffect(function () {
    var _window$QGA_CONCEPT_B;
    (_window$QGA_CONCEPT_B = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B === void 0 || _window$QGA_CONCEPT_B.publish("planck-scale", {
      logLength: logL
    });
  }, [logL]);
  var logRef = useRef(logL);
  logRef.current = logL;
  var build = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var THREE, scene, yOf, depthColor, det0, starN, rnd, sGeo, sPos, i, u, a, rr, R, axis, _loop, e, desTop, desBot, desert, rings, _loop2, _i2, _LADDER_STOPS, probe, pGlow, pHalo, beam, det, NSEG, lat, latBase, latMesh, foam, _i3, g, _a, latPos;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            THREE = ctx.THREE, scene = ctx.scene;
            scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.016);
            scene.add(new THREE.AmbientLight(QGA_TOKENS.hex("pigment-blue-68"), 0.6));
            yOf = function yOf(lg) {
              return 5 - -lg / 35 * 10;
            };
            depthColor = function depthColor(lg) {
              var f = Math.min(1, -lg / 35);
              var c = new THREE.Color(QGA_TOKENS.hex("pigment-blue-72"));
              return c.lerp(new THREE.Color(QGA_TOKENS.hex("pigment-violet-65")), Math.min(1, f * 1.3)).lerp(new THREE.Color(QGA_TOKENS.hex("pigment-orange-77")), Math.max(0, f - 0.7) / 0.3);
            }; // faint starfield for depth
            det0 = ctx.settings.current.detail3d;
            starN = det0 === "low" ? 200 : 420, rnd = QGA_SEEDED(0x9a1c4);
            sGeo = new THREE.BufferGeometry();
            sPos = new Float32Array(starN * 3);
            for (i = 0; i < starN; i++) {
              u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, rr = Math.sqrt(1 - u * u), R = 30 + rnd() * 36;
              sPos[i * 3] = Math.cos(a) * rr * R;
              sPos[i * 3 + 1] = u * R;
              sPos[i * 3 + 2] = Math.sin(a) * rr * R;
            }
            sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
            scene.add(ctx.tag(new THREE.Points(sGeo, new THREE.PointsMaterial({
              size: 1.1,
              map: qgaGlowTexture(),
              color: QGA_TOKENS.hex("pigment-blue-78-c08"),
              transparent: true,
              opacity: 0.6,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
              sizeAttenuation: true
            })), "decoration"));

            // glowing descent axis
            axis = ctx.line([new THREE.Vector3(0, 5.6, 0), new THREE.Vector3(0, -5.4, 0)], QGA_TOKENS.hex("pigment-blue-72"), 0.6);
            axis.material.blending = THREE.AdditiveBlending;
            axis.material.depthWrite = false;
            scene.add(axis);

            // truthful logarithmic ruler: a tick at every power of ten, labelled every 5 decades,
            // so the spacing between named stops reflects real decade counts (the "scales" are honest).
            _loop = /*#__PURE__*/_regenerator().m(function _loop() {
              var y, major, tick;
              return _regenerator().w(function (_context2) {
                while (1) switch (_context2.n) {
                  case 0:
                    y = yOf(e);
                    major = e % 5 === 0;
                    tick = ctx.line([new THREE.Vector3(-(major ? 0.52 : 0.26), y, 0), new THREE.Vector3(major ? 0.52 : 0.26, y, 0)], depthColor(e).getHex(), major ? 0.5 : 0.22);
                    tick.material.blending = THREE.AdditiveBlending;
                    tick.material.depthWrite = false;
                    scene.add(tick);
                    if (major) ctx.label("10" + supScript(e) + " m", function () {
                      return {
                        x: -2.7,
                        y: y,
                        z: 0
                      };
                    }, "s3d-quiet");
                  case 1:
                    return _context2.a(2);
                }
              }, _loop);
            });
            e = 0;
          case 1:
            if (!(e >= -35)) {
              _context3.n = 3;
              break;
            }
            return _context3.d(_regeneratorValues(_loop()), 2);
          case 2:
            e--;
            _context3.n = 1;
            break;
          case 3:
            // "the desert": 16 orders of magnitude with no experimental data, between the collider
            // frontier (~10⁻¹⁹ m) and the Planck scale (~10⁻³⁵ m). Rendered as a dim shaded band.
            desTop = yOf(-19), desBot = yOf(-35);
            desert = new THREE.Mesh(new THREE.PlaneGeometry(1.5, desTop - desBot), new THREE.MeshBasicMaterial({
              color: QGA_TOKENS.hex("pigment-blue-31"),
              transparent: true,
              opacity: 0.32,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              side: THREE.DoubleSide
            }));
            desert.position.set(0, (desTop + desBot) / 2, -0.05);
            scene.add(ctx.tag(desert, "model"));
            ctx.annotation("the desert — 16 orders of magnitude, no experimental data", function () {
              return {
                x: 1.0,
                y: (desTop + desBot) / 2,
                z: 0
              };
            });
            rings = [];
            _loop2 = /*#__PURE__*/_regenerator().m(function _loop2() {
              var s, hex, ring, lp;
              return _regenerator().w(function (_context) {
                while (1) switch (_context.n) {
                  case 0:
                    s = _LADDER_STOPS[_i2];
                    hex = depthColor(s.log).getHex();
                    ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.04, 10, 80), new THREE.MeshBasicMaterial({
                      color: hex,
                      transparent: true,
                      opacity: 0.32,
                      blending: THREE.AdditiveBlending,
                      depthWrite: false
                    }));
                    ring.rotation.x = Math.PI / 2;
                    ring.position.y = yOf(s.log);
                    scene.add(ctx.tag(ring, "model"));
                    rings.push({
                      ring: ring,
                      log: s.log,
                      hex: hex
                    });
                    lp = {
                      x: 2.05,
                      y: ring.position.y,
                      z: 0
                    };
                    ctx.label(s.name.split(" — ")[0], function () {
                      return lp;
                    }, "s3d-quiet");
                  case 1:
                    return _context.a(2);
                }
              }, _loop2);
            });
            _i2 = 0, _LADDER_STOPS = LADDER_STOPS;
          case 4:
            if (!(_i2 < _LADDER_STOPS.length)) {
              _context3.n = 6;
              break;
            }
            return _context3.d(_regeneratorValues(_loop2()), 5);
          case 5:
            _i2++;
            _context3.n = 4;
            break;
          case 6:
            _context3.n = 7;
            return window.QGA_TERM_LENS.attach("planck-descent", ctx, {
              rings: rings
            });
          case 7:
            probe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), new THREE.MeshBasicMaterial({
              color: QGA_TOKENS.hex("pigment-cyan-89-c07")
            }));
            scene.add(ctx.tag(probe, "model"));
            pGlow = ctx.glow(QGA_TOKENS.hex("pigment-cyan-85"), 2.0, 0.7);
            scene.add(pGlow);
            pHalo = ctx.glow(QGA_TOKENS.hex("pigment-cyan-85"), 4.0, 0.28);
            scene.add(pHalo);
            // descent beam: probe down to the Planck floor
            beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.13, 1, 12, 1, true), new THREE.MeshBasicMaterial({
              color: QGA_TOKENS.hex("pigment-blue-75"),
              transparent: true,
              opacity: 0.32,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              side: THREE.DoubleSide
            }));
            scene.add(ctx.tag(beam, "decoration"));

            // Planck lattice at the bottom — distorts as the probe approaches
            det = ctx.settings.current.detail3d;
            NSEG = det === "low" ? 18 : det === "ultra" ? 30 : 24;
            lat = new THREE.PlaneGeometry(6.5, 6.5, NSEG, NSEG);
            lat.rotateX(-Math.PI / 2);
            latBase = lat.attributes.position.array.slice();
            latMesh = new THREE.Mesh(lat, new THREE.MeshBasicMaterial({
              color: QGA_TOKENS.hex("pigment-amber-84"),
              wireframe: true,
              transparent: true,
              opacity: 0.3,
              blending: THREE.AdditiveBlending,
              depthWrite: false
            }));
            latMesh.position.y = -5.6;
            scene.add(ctx.tag(latMesh, "decoration"));
            // foam glow bubbles that bloom up near the Planck scale
            foam = [];
            for (_i3 = 0; _i3 < 7; _i3++) {
              g = ctx.glow(_i3 % 2 ? QGA_TOKENS.hex("pigment-orange-82") : QGA_TOKENS.hex("pigment-violet-67"), 1.2, 0);
              _a = _i3 / 7 * Math.PI * 2;
              g.position.set(Math.cos(_a) * 1.9, -5.6, Math.sin(_a) * 1.9);
              scene.add(g);
              foam.push({
                g: g,
                a: _a,
                ph: _i3 * 1.7
              });
            }
            ctx.annotation("Planck-scale rendering is speculative — discreteness / 'foam' is NOT established", function () {
              return {
                x: 0,
                y: -6.4,
                z: 0
              };
            });
            ctx.label("descent: 1 m → 10⁻³⁵ m", function () {
              return {
                x: -2.6,
                y: 5.9,
                z: 0
              };
            }, "s3d-strong");
            latPos = lat.attributes.position;
            return _context3.a(2, {
              // The probe eases toward its slider target one frame at a time: keep drawing until it arrives, then idle
              // (the ambient shimmer only runs while playing with motion).
              isAnimated: function isAnimated() {
                return Math.abs(yOf(logRef.current) - probe.position.y) > 1e-3 || ctx.playing() && ctx.motion() > 0;
              },
              update: function update(t) {
                var lg = logRef.current;
                probe.position.y += (yOf(lg) - probe.position.y) * 0.12;
                pGlow.position.copy(probe.position);
                pHalo.position.copy(probe.position);
                var pulse = 1 + 0.08 * Math.sin(t * 3);
                pGlow.scale.setScalar(2.0 * pulse);
                pHalo.scale.setScalar(4.0 * pulse);
                // beam from probe to the floor
                var top = probe.position.y,
                  bot = -5.6,
                  hbeam = Math.max(0.1, top - bot);
                beam.position.set(0, (top + bot) / 2, 0);
                beam.scale.set(1, hbeam, 1);
                for (var _i4 = 0, _rings = rings; _i4 < _rings.length; _i4++) {
                  var _rings$_i = _rings[_i4],
                    ring = _rings$_i.ring,
                    log = _rings$_i.log,
                    hex = _rings$_i.hex;
                  var d = Math.abs(log - lg);
                  ring.material.opacity = d < 2.5 ? 0.95 - d * 0.22 : 0.24;
                  ring.scale.setScalar(d < 2.5 ? 1 + (2.5 - d) * 0.06 : 1);
                }
                var prox = Math.max(0, Math.min(1, (Math.max(-35, lg) + 19) / (-35 + 19)));
                var fluct = Math.pow(Math.max(0, (prox - 0.55) / 0.45), 2);
                var mo = ctx.motion();
                var tt = mo > 0 ? t * (1 + mo) : 0.7;
                for (var k = 0; k < latPos.count; k++) {
                  var bx = latBase[k * 3],
                    bz = latBase[k * 3 + 2];
                  latPos.setY(k, fluct > 0 ? Math.sin(bx * 2.9 + bz * 2.1 + tt * 1.6) * fluct * 0.6 : 0);
                }
                latPos.needsUpdate = true;
                latMesh.material.opacity = 0.18 + fluct * 0.5;
                for (var _i5 = 0, _foam = foam; _i5 < _foam.length; _i5++) {
                  var f = _foam[_i5];
                  var s = 0.6 + 0.5 * Math.sin(tt * 1.8 + f.ph);
                  f.g.scale.setScalar((1.0 + s) * fluct);
                  f.g.material.opacity = 0.55 * fluct;
                  f.g.position.y = -5.6 + Math.sin(tt * 1.3 + f.ph) * 0.5 * fluct;
                }
              }
            });
        }
      }, _callee);
    }));
    return function build(_x2) {
      return _ref2.apply(this, arguments);
    };
  }();
  var L = Math.pow(10, logL);
  var E_GeV = window.QGA_PHYSICS.probeEnergyGeV(L); // ħc ≈ 1.973×10⁻¹⁶ GeV·m
  var active = LADDER_STOPS.reduce(function (best, s) {
    return Math.abs(s.log - logL) < Math.abs(best.log - logL) ? s : best;
  }, LADDER_STOPS[0]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "length scale",
    min: -35,
    max: 0,
    step: 0.1,
    value: logL,
    onChange: setLogL,
    format: function format(v) {
      return "10" + supScript(Math.round(v)) + " m";
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "seg"
  }, LADDER_STOPS.map(function (s) {
    return /*#__PURE__*/React.createElement("button", {
      key: s.log,
      className: "btn" + (Math.abs(s.log - logL) < 0.6 ? " on" : ""),
      title: s.name,
      onClick: function onClick() {
        return setLogL(s.log);
      }
    }, "10", supScript(s.log));
  }))), /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    height: 540,
    aria: "Three-dimensional descent from human scale to the Planck scale",
    initial: {
      radius: 15.5,
      theta: 0.32,
      phi: 1.2,
      target: [0, 0, 0],
      minR: 8,
      maxR: 34,
      bloom: {
        strength: 0.85,
        radius: 0.6,
        threshold: 0.14
      }
    },
    build: build,
    fallback: /*#__PURE__*/React.createElement(PlanckFluctuationCanvas, {
      logRef: logRef
    })
  }), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar viz-toolbar-bottom readout-grid",
    style: {
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "probe length l"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, sciNotation(L), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "m"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "probe energy \u0127c / l"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, sciNotation(E_GeV), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "GeV"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "vs. Planck energy"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, sciNotation(E_GeV / 1.22e19, 2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "\xD7 E_P"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "current regime"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value",
    style: {
      fontSize: 12.5
    }
  }, active.name.split(" — ")[0]))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "planck-descent",
    status: "schematic"
  }, "Resolving a length ", /*#__PURE__*/React.createElement(Eq, {
    tex: "l"
  }), " requires energy ", /*#__PURE__*/React.createElement(Eq, {
    tex: "E \\approx \\hbar c/l"
  }), ". Each tick is one power of ten, so the gulf you descend is honest: sixteen empty decades \u2014 ", /*#__PURE__*/React.createElement("strong", null, "the desert"), " \u2014 separate the collider frontier from the Planck scale. Near ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\ell_P"
  }), " the energy needed to probe a region would itself curve spacetime into a black hole of that size, and measurement and geometry become entangled.")), /*#__PURE__*/React.createElement("div", {
    className: "panel",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("h3", null, "The scale ladder"), /*#__PURE__*/React.createElement("div", {
    className: "ladder-stops",
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 4
    }
  }, LADDER_STOPS.map(function (s) {
    return /*#__PURE__*/React.createElement("button", {
      key: s.log,
      className: "ladder-stop" + (s.log === active.log ? " on" : ""),
      onClick: function onClick() {
        return setLogL(s.log);
      },
      style: {
        cursor: "pointer",
        background: "none",
        border: "1px solid " + (s.log === active.log ? "var(--line-strong)" : "transparent"),
        font: "inherit",
        color: "inherit",
        textAlign: "left",
        width: "100%"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "ls-len"
    }, "10", supScript(s.log), " m"), /*#__PURE__*/React.createElement("span", {
      className: "ls-name"
    }, s.name.split(" — ")[0]));
  })), /*#__PURE__*/React.createElement("p", {
    className: "small",
    style: {
      marginTop: 14
    }
  }, active.note), /*#__PURE__*/React.createElement("p", {
    className: "small dim",
    style: {
      marginBottom: 0
    }
  }, "Note the desert: sixteen orders of magnitude separate the collider frontier from the Planck scale \u2014 the same ratio as between a coin and the distance to the nearest star.")));
}

/* ---------- Prompt 08: spin-network / spin-foam lab ---------- */
function SpinFoamLab() {
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 2),
    state = _useQGAState2[0],
    setState = _useQGAState2[1];
  var _useState3 = useState(0),
    _useState4 = _slicedToArray(_useState3, 2),
    step = _useState4[0],
    setStep = _useState4[1];
  var topology = "four-simplex";
  var jMax = state.spinFoamJMax;
  var mode = state.spinFoamMode;
  var seed = state.seed;
  var lab = window.QGA_LABS && window.QGA_LABS.spinFoamLabState ? window.QGA_LABS.spinFoamLabState({
    topology: topology,
    jMaxHalf: jMax,
    seed: seed,
    step: 0
  }) : null;
  var steps = lab ? lab.steps : 1;
  var stepIndex = Math.min(step, steps - 1);
  var build = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(ctx) {
      var LABS, _yield$LABS$loadSpinF, createSpinFoamRuntime, runtime;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.n) {
          case 0:
            LABS = window.QGA_LABS;
            if (LABS) {
              _context4.n = 1;
              break;
            }
            throw new Error("Compute-lab module unavailable");
          case 1:
            _context4.n = 2;
            return LABS.loadSpinFoam();
          case 2:
            _yield$LABS$loadSpinF = _context4.v;
            createSpinFoamRuntime = _yield$LABS$loadSpinF.createSpinFoamRuntime;
            ctx.scene.fog = new ctx.THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-11-c02"), 0.013);
            runtime = createSpinFoamRuntime({
              topology: topology,
              jMaxHalf: jMax,
              seed: seed,
              step: stepIndex,
              mode: mode,
              camera: ctx.camera,
              engraved: ctx.engraved
            });
            ctx.scene.add(runtime.mesh);
            ctx.label("CONJECTURAL · pedagogical spin network — geometry from area ∝ √(j(j+1)), no amplitudes computed", function () {
              return {
                x: -4.2,
                y: 3.3,
                z: -3.2
              };
            }, "s3d-strong");
            ctx.label(mode === "foam" ? "each slice is one step of the deterministic foam history · y = evolution" : "tube color = spin (cyan → gold) · node size = schematic volume proxy", function () {
              return {
                x: -4.2,
                y: -3.0,
                z: 3.2
              };
            }, "s3d-quiet");
            return _context4.a(2, {
              update: function update(t) {
                runtime.sync({
                  time: t,
                  motion: ctx.motion() === 0 ? 0 : 1
                });
                window.__qgaSpinFoamLab = _objectSpread({
                  kind: runtime.kind
                }, runtime.stats());
              },
              dispose: function dispose() {
                runtime.dispose();
                delete window.__qgaSpinFoamLab;
              },
              recoverable: function recoverable() {
                return false;
              }
            });
        }
      }, _callee2);
    }));
    return function build(_x3) {
      return _ref3.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar lab-toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    "aria-label": "Spin-foam view"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "View"), [["network", "Spin network"], ["foam", "Foam history"]].map(function (_ref4) {
    var _ref5 = _slicedToArray(_ref4, 2),
      key = _ref5[0],
      label = _ref5[1];
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      className: "kerr-chip" + (mode === key ? " on" : ""),
      "aria-pressed": mode === key,
      onClick: function onClick() {
        return setState({
          spinFoamMode: key
        });
      }
    }, label);
  })), /*#__PURE__*/React.createElement(SliderRow, {
    label: "max spin j",
    min: 1,
    max: 4,
    step: 1,
    value: jMax,
    onChange: function onChange(v) {
      return setState({
        spinFoamJMax: v
      });
    },
    format: function format(v) {
      return String(v);
    }
  }), mode === "foam" ? /*#__PURE__*/React.createElement(SliderRow, {
    label: "foam step",
    min: 0,
    max: steps - 1,
    step: 1,
    value: stepIndex,
    onChange: function onChange(v) {
      return setStep(v);
    },
    format: function format(v) {
      return "".concat(v + 1, " / ").concat(steps);
    }
  }) : null, /*#__PURE__*/React.createElement("div", {
    className: "kerr-state-line lab-readout"
  }, lab ? /*#__PURE__*/React.createElement(React.Fragment, null, lab.projection.points.length, " nodes \xB7 ", lab.projection.edges.length, " edges \xB7", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\sum"
  }), " area = ", lab.config.totalArea.toFixed(2), " \xB7 ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\sum"
  }), " volume proxy = ", lab.config.totalVolume.toFixed(2)) : "—")), /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    height: 440,
    aria: "Three-dimensional spin network: a Schlegel-projected four-simplex with colored edge tubes, proxy-volume-weighted node spheres and translucent face membranes; foam mode ghosts the deterministic step history along an evolution axis",
    initial: {
      radius: 9.5,
      theta: 0.7,
      phi: 1.25,
      minR: 4,
      maxR: 28,
      bloom: {
        strength: 0.75,
        radius: 0.55,
        threshold: 0.16
      }
    },
    build: build,
    deps: [jMax, mode, seed, stepIndex],
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The 3-D spin-foam lab needs WebGL; the area spectrum above is computed without it.")
  }), /*#__PURE__*/React.createElement(PlanckSpectra, {
    jMaxHalf: jMax
  }), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "spin-foam-lab",
    status: "conjectural"
  }, "The graph is a real combinatorial object: edges carry half-integer spins j, and the area of each surface is", /*#__PURE__*/React.createElement(Eq, {
    tex: "A = 8\\pi\\gamma\\,\\ell_P^2\\,\\sqrt{j(j+1)}"
  }), " \u2014 the LQG area spectrum, computed here in Planck units by ", /*#__PURE__*/React.createElement("code", null, "js/science/spin-networks.mjs"), ". Node volumes come from the Cayley\u2013Menger determinant of the four edge spins (4-valent nodes only). Foam mode walks a deterministic sequence of re-labellings \u2014 a", /*#__PURE__*/React.createElement("strong", null, "pedagogical sketch"), " of a spin-foam history, not a path integral: no spin-foam amplitudes are computed, and the model is conjectural. What is established is the spectrum arithmetic; what is open is whether spacetime really is made of this."));
}
/* Compiled from js/atlas-stage.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// atlas-stage.jsx — HORIZON cinematic full-viewport 3D backdrop.
// A persistent, module-aware WebGL scene living behind the entire app:
// depth starfield, drifting nebulae, an undulating "spacetime fabric",
// pointer parallax, and a slow cosmic drift. Module changes lerp the
// palette + fabric warp. Reduced-motion → static. No WebGL → 2D fallback.

var ATLAS_DPR = {
  low: 1,
  medium: 1.4,
  ultra: 1.85
};
var ATLAS_MOTION = {
  reduced: 0,
  balanced: 0.62,
  full: 1
};

// per-view signature: [hue, accentHueShift, fabricWarp, nebulaDensity]
var ATLAS_PALETTE = {
  overview: [222, 60, 1.0, 1.0],
  sm: [266, -34, 0.7, 1.05],
  qft: [196, 24, 1.25, 1.1],
  rg: [222, 48, 0.85, 0.95],
  gr: [42, 18, 1.7, 0.85],
  planck: [228, 70, 1.15, 1.2],
  approaches: [284, -30, 0.95, 1.1],
  bh: [34, 14, 1.45, 0.95],
  exp: [196, 36, 1.05, 1.0],
  glossary: [222, 50, 0.6, 0.8],
  refs: [222, 50, 0.55, 0.75],
  open: [10, 30, 0.9, 0.85]
};
function AtlasStage(_ref) {
  var _ref$view = _ref.view,
    view = _ref$view === void 0 ? "overview" : _ref$view,
    _ref$motion = _ref.motion,
    motion = _ref$motion === void 0 ? "balanced" : _ref$motion,
    _ref$detail = _ref.detail,
    detail = _ref$detail === void 0 ? "medium" : _ref$detail,
    _ref$enabled = _ref.enabled,
    enabled = _ref$enabled === void 0 ? true : _ref$enabled,
    _ref$paused = _ref.paused,
    paused = _ref$paused === void 0 ? false : _ref$paused;
  var settings = useAtlasSettings();
  var prm = usePRM();
  var mountRef = useRef(null);
  var sessionRef = useRef(null);
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    failed = _useState2[0],
    setFailed = _useState2[1];
  var _useState3 = useState(0),
    _useState4 = _slicedToArray(_useState3, 2),
    rebuildNonce = _useState4[0],
    setRebuildNonce = _useState4[1];
  var _useState5 = useState(""),
    _useState6 = _slicedToArray(_useState5, 2),
    errorMessage = _useState6[0],
    setErrorMessage = _useState6[1];
  var _useState7 = useState("initializing"),
    _useState8 = _slicedToArray(_useState7, 2),
    phase = _useState8[0],
    setPhase = _useState8[1];
  var diagnosticRef = useRef(null);
  useEffect(function () {
    return function () {
      if (diagnosticRef.current) QGA_RENDER.renderDiagnostics.remove(diagnosticRef.current);
    };
  }, []);
  useEffect(function () {
    setFailed(false);
  }, [settings.renderBackend, detail, settings.vizMode, settings.motion, settings.toneMapping]);
  var targetRef = useRef(ATLAS_PALETTE[view] || ATLAS_PALETTE.overview);
  targetRef.current = ATLAS_PALETTE[view] || ATLAS_PALETTE.overview;
  var motionRef = useRef(motion);
  motionRef.current = motion;
  var detailRef = useRef(detail);
  detailRef.current = detail;
  var prmRef = useRef(prm);
  prmRef.current = prm;
  var pausedRef = useRef(paused);
  pausedRef.current = paused;
  // On a shared stage the backdrop draws only when something changed: a palette, pause or motion change owes it a frame.
  useEffect(function () {
    var _sessionRef$current;
    (_sessionRef$current = sessionRef.current) === null || _sessionRef$current === void 0 || _sessionRef$current.invalidate({
      input: false
    });
  }, [view, paused, motion]);
  useEffect(function () {
    if (!enabled || failed) return;
    var mount = mountRef.current;
    if (!mount) return;
    var abort = new AbortController();
    var alive = true,
      stop = function stop() {},
      renderer,
      session;
    if (diagnosticRef.current) QGA_RENDER.renderDiagnostics.remove(diagnosticRef.current);
    var diagnosticId = QGA_RENDER.renderDiagnostics.allocate("Atlas backdrop");
    diagnosticRef.current = diagnosticId;
    var fail = function fail(error) {
      if (!alive || error.name === "AbortError") return;
      var message = QGA_RENDER.describeRenderError(error);
      QGA_RENDER.renderDiagnostics.message(diagnosticId, message);
      QGA_RENDER.renderDiagnostics.update(diagnosticId, {
        phase: "static",
        backend: "static",
        effects: []
      });
      setErrorMessage(message);
      setFailed(true);
      stop();
    };
    var start = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var detail0, engraved, _yield$QGA_BACKDROP$l, createBackdropStars, scene, resourcesReleased, initPromise, camera, renderFrame, root, hue, aShift, warp, neb, colPrimary, colAccent, tintPrimary, tintAccent, setCols, N, starField, core, core2, core3, heroN, heroes, rnd, i, s, nebN, nebs, _i, _s, GX, GZ, span, stepX, stepZ, fabricPos, idx, _i2, j, segIndex, _i3, _j, fabricFlat, fabric, _i4, _j2, x, z, d, releaseResources, mouse, onMove, resize, ro, raf, last, clk, hidden, onVis, motionVal, _tick, released, _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              detail0 = detailRef.current; // The starfield is a material-kit sprite (S08), so the backdrop needs the node renderer (WebGPU, or its WebGL2 backend) and has no
              // classic fallback: its engraved lines are the node ones.
              _context.n = 1;
              return QGA_ENGRAVED.prepare(settings, {
                requireNode: true
              });
            case 1:
              engraved = _context.v;
              _context.n = 2;
              return QGA_BACKDROP.loadStars();
            case 2:
              _yield$QGA_BACKDROP$l = _context.v;
              createBackdropStars = _yield$QGA_BACKDROP$l.createBackdropStars;
              if (alive) {
                _context.n = 3;
                break;
              }
              return _context.a(2);
            case 3:
              scene = new THREE.Scene();
              resourcesReleased = false, initPromise = null;
              stop = function stop() {
                if (resourcesReleased) return;
                resourcesReleased = true;
                // Scene GPU resources must outlive every submit that references them:
                // dispose the session first (it stops the loop and drains the queue),
                // then destroy the scene. The reverse order raises "used in submit
                // while destroyed" on the shared WebGPU device.
                var releaseScene = function releaseScene() {
                  return s3dDispose(scene);
                };
                var teardown = session ? session.dispose() : initPromise ? initPromise.then(function (early) {
                  return early.dispose();
                }, function () {
                  return undefined;
                }) : Promise.resolve();
                void Promise.resolve(teardown)["catch"](function (error) {
                  return QGA_RENDER.renderDiagnostics.message(diagnosticId, error.message);
                })["finally"](releaseScene);
              };
              scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.018);
              camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);
              camera.position.set(0, 2.5, 34);
              renderFrame = function renderFrame() {
                var dt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
                var now = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : performance.now();
                var sample = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                var frameMs = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : dt * 1000;
                return session.render(dt, now, sample, frameMs);
              };
              root = new THREE.Group();
              scene.add(root);

              // live palette (smoothly lerped toward target)
              hue = targetRef.current[0], aShift = targetRef.current[1], warp = targetRef.current[2], neb = targetRef.current[3];
              colPrimary = new THREE.Color(), colAccent = new THREE.Color();
              tintPrimary = QGA_TOKENS.tint("primary"), tintAccent = QGA_TOKENS.tint("accent");
              setCols = function setCols() {
                colPrimary.setHSL((hue % 360 + 360) % 360 / 360, tintPrimary.s, tintPrimary.l);
                colAccent.setHSL(((hue + aShift) % 360 + 360) % 360 / 360, tintAccent.s, tintAccent.l);
              };
              setCols();
              N = detail0 === "low" ? 1400 : detail0 === "ultra" ? 4200 : 2600; // ---------- depth starfield ----------
              // A static seeded buffer: the twinkle runs in the vertex stage from the time uniform, the palette tint is a uniform, and the CPU
              // uploads nothing per frame (js/visualizations/atlas/backdrop-stars.mjs).
              starField = createBackdropStars({
                count: N
              });
              root.add(starField.object);

              // galactic core: large soft glows giving the scene a luminous heart
              core = null, core2 = null, core3 = null;
              if (window.s3dGlow) {
                core = s3dGlow(colPrimary.getHex(), 84, 0.32);
                core.position.set(-14, 7, -72);
                root.add(core);
                core2 = s3dGlow(colAccent.getHex(), 54, 0.28);
                core2.position.set(28, -10, -56);
                root.add(core2);
                core3 = s3dGlow(QGA_TOKENS.hex("pigment-grey-96"), 30, 0.22);
                core3.position.set(-6, 2, -50);
                root.add(core3);
              }

              // bright foreground "hero" stars (fewer, larger, with the glow sprite)
              heroN = detail0 === "low" ? 7 : 12;
              heroes = [], rnd = QGA_SEEDED(0xa71a5);
              i = 0;
            case 4:
              if (!(i < heroN)) {
                _context.n = 7;
                break;
              }
              s = window.s3dGlow ? s3dGlow(QGA_TOKENS.hex("pigment-blue-94"), 2.6, 0.85) : null;
              if (s) {
                _context.n = 5;
                break;
              }
              return _context.a(3, 7);
            case 5:
              s.position.set((rnd() - 0.5) * 76, (rnd() - 0.5) * 38, -8 - rnd() * 52);
              s.userData.tw = rnd() * Math.PI * 2;
              s.userData.sc = 1.6 + rnd() * 2.8;
              s.scale.setScalar(s.userData.sc);
              root.add(s);
              heroes.push(s);
            case 6:
              i++;
              _context.n = 4;
              break;
            case 7:
              // ---------- nebula clouds (large additive glow sprites) ----------
              nebN = detail0 === "low" ? 4 : 7;
              nebs = [];
              _i = 0;
            case 8:
              if (!(_i < nebN)) {
                _context.n = 11;
                break;
              }
              _s = window.s3dGlow ? s3dGlow(_i % 2 ? colAccent.getHex() : colPrimary.getHex(), 34, 0.34) : null;
              if (_s) {
                _context.n = 9;
                break;
              }
              return _context.a(3, 11);
            case 9:
              _s.position.set((rnd() - 0.5) * 90, (rnd() - 0.5) * 46 - 4, -24 - rnd() * 46);
              _s.userData = {
                baseX: _s.position.x,
                baseY: _s.position.y,
                drift: rnd() * Math.PI * 2,
                sc: 30 + rnd() * 34,
                accent: _i % 2 === 1
              };
              root.add(_s);
              nebs.push(_s);
            case 10:
              _i++;
              _context.n = 8;
              break;
            case 11:
              // ---------- spacetime fabric (undulating wire grid, far below) ----------
              GX = detail0 === "low" ? 26 : detail0 === "ultra" ? 46 : 36;
              GZ = GX;
              span = 150, stepX = span / GX, stepZ = span / GZ;
              fabricPos = new Float32Array(GX * GZ * 3);
              idx = function idx(i, j) {
                return i * GZ + j;
              };
              for (_i2 = 0; _i2 < GX; _i2++) for (j = 0; j < GZ; j++) {
                fabricPos[idx(_i2, j) * 3] = -span / 2 + _i2 * stepX;
                fabricPos[idx(_i2, j) * 3 + 1] = 0;
                fabricPos[idx(_i2, j) * 3 + 2] = -span / 2 + j * stepZ;
              }
              // line segments connecting the grid
              segIndex = [];
              for (_i3 = 0; _i3 < GX; _i3++) for (_j = 0; _j < GZ; _j++) {
                if (_i3 < GX - 1) {
                  segIndex.push(idx(_i3, _j), idx(_i3 + 1, _j));
                }
                if (_j < GZ - 1) {
                  segIndex.push(idx(_i3, _j), idx(_i3, _j + 1));
                }
              }
              fabricFlat = engraved.expand(fabricPos, segIndex);
              fabric = engraved.segments(fabricFlat, {
                color: colPrimary,
                opacity: 0.2,
                additive: true,
                widthPx: engraved.WIDTH_PX.hairline,
                layer: "decoration"
              });
              fabric.frustumCulled = false;
              fabric.position.y = -20;
              fabric.rotation.x = 0.06;
              root.add(fabric);
              // seed the fabric with a static warped shape so a single (even paused) frame looks alive
              for (_i4 = 0; _i4 < GX; _i4++) for (_j2 = 0; _j2 < GZ; _j2++) {
                x = -span / 2 + _i4 * stepX, z = -span / 2 + _j2 * stepZ, d = Math.hypot(x, z);
                fabricPos[idx(_i4, _j2) * 3 + 1] = Math.sin(x * 0.06) * Math.cos(z * 0.05) * 2.6 * warp - 6.0 * Math.exp(-d * d / 1600) * warp;
              }
              engraved.expand(fabricPos, segIndex, fabricFlat);
              engraved.update(fabric, fabricFlat);
              camera.lookAt(0, 0, -10);
              initPromise = QGA_RENDER.initializeRenderSession({
                scene: scene,
                camera: camera,
                mount: mount,
                settings: _objectSpread(_objectSpread({}, settings), {}, {
                  motion: prmRef.current ? "reduced" : motionRef.current
                }),
                view: "atlas-backdrop",
                signal: abort.signal,
                diagnosticId: diagnosticId,
                onError: fail,
                onPhase: function onPhase(value) {
                  if (alive) setPhase(value);
                },
                shared: true
              });
              _context.n = 12;
              return initPromise;
            case 12:
              session = _context.v;
              if (alive) {
                _context.n = 14;
                break;
              }
              _context.n = 13;
              return session.dispose();
            case 13:
              return _context.a(2);
            case 14:
              if (!(session.backend === "static")) {
                _context.n = 15;
                break;
              }
              fail(new Error(session.capabilities.diagnostics.join(" ")));
              return _context.a(2);
            case 15:
              sessionRef.current = session;
              renderer = session.renderer;
              releaseResources = stop; // ---------- interaction: pointer parallax ----------
              mouse = {
                x: 0,
                y: 0,
                ex: 0,
                ey: 0
              };
              onMove = function onMove(e) {
                mouse.x = e.clientX / window.innerWidth * 2 - 1;
                mouse.y = e.clientY / window.innerHeight * 2 - 1;
              };
              window.addEventListener("pointermove", onMove, {
                passive: true
              });

              // ---------- sizing ----------
              resize = function resize() {
                var w = Math.max(2, mount.clientWidth),
                  h = Math.max(2, mount.clientHeight);
                session.resize();
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
              };
              resize();
              ro = new ResizeObserver(resize);
              ro.observe(mount);

              // ---------- loop ----------
              last = performance.now(), clk = 0, hidden = document.hidden;
              onVis = function onVis() {
                hidden = document.hidden;
                session.invalidate({
                  input: false
                });
              };
              document.addEventListener("visibilitychange", onVis);
              motionVal = function motionVal() {
                var _ATLAS_MOTION$motionR;
                return prmRef.current ? 0 : (_ATLAS_MOTION$motionR = ATLAS_MOTION[motionRef.current]) !== null && _ATLAS_MOTION$motionR !== void 0 ? _ATLAS_MOTION$motionR : 0.62;
              };
              _tick = function tick(now) {
                if (!alive) return;
                if (!session.shared && !renderer.isWebGPURenderer) raf = requestAnimationFrame(_tick);
                try {
                  var frameMs = Math.max(0, now - last);
                  var rawDt = Math.min(0.05, frameMs / 1000);
                  last = now;
                  if (pausedRef.current || hidden) {
                    session.suspend();
                    session.setAnimated(false);
                    return;
                  }
                  var mo = motionVal();
                  clk += rawDt * (mo > 0 ? 1 : 0);

                  // lerp palette toward target. Under reduced motion the palette snaps to
                  // its target instead of easing: the eased value depends on how many
                  // frames have elapsed, which would make the "static" backdrop differ
                  // between otherwise identical captures.
                  var tg = targetRef.current;
                  if (mo > 0) {
                    var lp = 1 - Math.pow(0.001, rawDt); // ~time-based ease
                    hue += ((tg[0] - hue + 540) % 360 - 180) * lp;
                    aShift += (tg[1] - aShift) * lp;
                    warp += (tg[2] - warp) * lp;
                    neb += (tg[3] - neb) * lp;
                  } else {
                    hue = tg[0];
                    aShift = tg[1];
                    warp = tg[2];
                    neb = tg[3];
                  }
                  setCols();
                  fabric.material.color.copy(colPrimary);

                  // camera parallax + slow cosmic drift. The per-frame ease below is
                  // frame-count dependent, so under reduced motion the camera is placed
                  // directly at its easing target — the documented "reduced-motion →
                  // static" contract, and byte-stable across captures.
                  var driftX = Math.sin(clk * 0.05) * 2.0;
                  var driftY = Math.cos(clk * 0.037) * 1.1;
                  if (mo > 0) {
                    mouse.ex += (mouse.x - mouse.ex) * 0.045;
                    mouse.ey += (mouse.y - mouse.ey) * 0.045;
                    camera.position.x += (mouse.ex * 5 + driftX - camera.position.x) * 0.05;
                    camera.position.y += (2.5 - mouse.ey * 3 + driftY - camera.position.y) * 0.05;
                  } else {
                    camera.position.x = driftX;
                    camera.position.y = 2.5 + driftY;
                  }
                  root.rotation.y = Math.sin(clk * 0.02) * 0.06 * mo;
                  camera.lookAt(0, 0, -10);

                  // when the tab is hidden, draw a single static frame (never black) and skip heavy work
                  // twinkle: the time uniform drives it (0 under reduced motion: a still, byte-stable sky); tint the stars toward the palette
                  starField.uniforms.time.value = mo > 0 ? clk : 0;
                  starField.uniforms.tint.value.copy(colPrimary).multiplyScalar(0.06);

                  // hero stars pulse + recolor
                  for (var _i5 = 0, _heroes = heroes; _i5 < _heroes.length; _i5++) {
                    var _s2 = _heroes[_i5];
                    _s2.material.color.copy(colPrimary);
                    var pu = 0.4 + 0.18 * Math.sin(clk * 1.1 + _s2.userData.tw) * (mo > 0 ? 1 : 0);
                    _s2.material.opacity = pu;
                    _s2.scale.setScalar(_s2.userData.sc * (1 + 0.06 * Math.sin(clk + _s2.userData.tw) * mo));
                  }

                  // nebula drift + recolor + density
                  for (var _i6 = 0, _nebs = nebs; _i6 < _nebs.length; _i6++) {
                    var _s3 = _nebs[_i6];
                    _s3.material.color.copy(_s3.userData.accent ? colAccent : colPrimary);
                    _s3.material.opacity = (0.22 + 0.12 * neb) * (0.72 + 0.28 * Math.sin(clk * 0.3 + _s3.userData.drift));
                    _s3.position.x = _s3.userData.baseX + Math.sin(clk * 0.08 + _s3.userData.drift) * 6 * mo;
                    _s3.position.y = _s3.userData.baseY + Math.cos(clk * 0.06 + _s3.userData.drift) * 3 * mo;
                    _s3.scale.setScalar(_s3.userData.sc * (1 + 0.08 * Math.sin(clk * 0.2 + _s3.userData.drift) * mo));
                  }
                  if (core) {
                    core.material.color.copy(colPrimary);
                    core.material.opacity = 0.28 + 0.06 * Math.sin(clk * 0.16);
                  }
                  if (core2) {
                    core2.material.color.copy(colAccent);
                    core2.material.opacity = 0.24 + 0.06 * Math.cos(clk * 0.12);
                  }
                  if (core3) {
                    core3.material.opacity = 0.2 + 0.05 * Math.sin(clk * 0.2 + 1);
                  }

                  // undulate the fabric (sum of travelling sines, amplitude ~ warp)
                  var amp = 2.6 * warp;
                  for (var _i7 = 0; _i7 < GX; _i7++) for (var _j3 = 0; _j3 < GZ; _j3++) {
                    var _x = -span / 2 + _i7 * stepX,
                      _z = -span / 2 + _j3 * stepZ;
                    var _d = Math.hypot(_x, _z);
                    var y = (mo > 0 ? Math.sin(_x * 0.06 + clk * 0.5) * Math.cos(_z * 0.05 - clk * 0.3) + Math.sin(_d * 0.05 - clk * 0.6) * 0.6 : Math.sin(_x * 0.06) * Math.cos(_z * 0.05)) * amp - 6.0 * Math.exp(-_d * _d / 1600) * warp; // central gravitational dip
                    fabricPos[idx(_i7, _j3) * 3 + 1] = y;
                  }
                  engraved.expand(fabricPos, segIndex, fabricFlat);
                  engraved.update(fabric, fabricFlat);
                  engraved.setOpacity(fabric, 0.16 + 0.08 * warp);

                  // Motion on: the backdrop animates every frame. Motion off: it settles on one frame and idles.
                  session.setAnimated(QGA_RENDER.resolveAnimated({
                    declared: "motion",
                    playing: true,
                    motion: mo
                  }));
                  renderFrame(rawDt, now, mo > 0, frameMs);
                } catch (error) {
                  fail(error);
                }
              };
              released = false;
              stop = function stop() {
                if (released) return;
                released = true;
                sessionRef.current = null;
                cancelAnimationFrame(raf);
                ro.disconnect();
                window.removeEventListener("pointermove", onMove);
                document.removeEventListener("visibilitychange", onVis);
                releaseResources();
              };
              _context.p = 16;
              renderFrame();
              _context.n = 18;
              break;
            case 17:
              _context.p = 17;
              _t = _context.v;
              fail(_t);
              return _context.a(2);
            case 18:
              if (session.drive(_tick)) {/* the shared stage calls tick, and only when the backdrop has a frame to draw */} else if (renderer.isWebGPURenderer) void renderer.setAnimationLoop(_tick)["catch"](fail);else raf = requestAnimationFrame(_tick);
            case 19:
              return _context.a(2);
          }
        }, _callee, null, [[16, 17]]);
      }));
      return function start() {
        return _ref2.apply(this, arguments);
      };
    }();
    void start()["catch"](function (error) {
      fail(error);
      stop();
    });
    return function () {
      alive = false;
      abort.abort();
      stop();
    };
  }, [enabled, failed, detail, settings.motion, settings.vizMode, settings.renderBackend, settings.toneMapping, rebuildNonce]); // palette handled live

  if (!enabled) return null;
  if (failed) {
    var _ATLAS_MOTION$motion;
    // graceful 2D fallback — reuse the lightweight starfield
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Starfield, {
      enabled: true,
      motionScale: prm ? 0 : (_ATLAS_MOTION$motion = ATLAS_MOTION[motion]) !== null && _ATLAS_MOTION$motion !== void 0 ? _ATLAS_MOTION$motion : 0.62,
      hue: (ATLAS_PALETTE[view] || ATLAS_PALETTE.overview)[0]
    }), /*#__PURE__*/React.createElement("div", {
      className: "render-fallback-notice",
      role: "status"
    }, "Static backdrop: ", errorMessage));
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "atlas-stage",
    ref: mountRef,
    "aria-hidden": "true"
  }), phase !== "ready" ? /*#__PURE__*/React.createElement("div", {
    className: "render-fallback-notice",
    role: "status"
  }, "Initializing backdrop and compiling shaders\u2026") : null);
}
Object.assign(window, {
  AtlasStage: AtlasStage
});
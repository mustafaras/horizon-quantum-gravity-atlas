/* Compiled from js/scene3d.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _construct(t, e, r) { if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && _setPrototypeOf(p, r.prototype), p; }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// scene3d.jsx — shared cinematic 3D layer for Quantum Gravity Atlas
// Provides: Scene3D (managed WebGL stage with orbit rig, HTML label overlay,
// picking, lifecycle/cleanup, reduced-motion + fallback behavior) and small
// scene-building helpers. Every module's flagship 3D scene goes through this.

/* ---------- capability detection ---------- */
function qgaWebGLAvailable() {
  if (window.__qgaWebGL !== undefined) return window.__qgaWebGL;
  var ok = false;
  try {
    var c = document.createElement("canvas");
    ok = !!(window.WebGL2RenderingContext && c.getContext("webgl2"));
  } catch (e) {
    ok = false;
  }
  window.__qgaWebGL = ok && !!window.THREE;
  return window.__qgaWebGL;
}

/* ---------- bloom post-processing (UnrealBloomPass) — the "real glow" layer ---------- */
function qgaBloomAvailable() {
  return !!(window.THREE && window.THREE.EffectComposer && window.THREE.UnrealBloomPass && window.THREE.RenderPass);
}
function qgaMakeComposer(renderer, scene, camera, w, h, opts) {
  if (!qgaBloomAvailable()) return null;
  opts = opts || {};
  var T = window.THREE;
  try {
    var composer = new T.EffectComposer(renderer);
    composer.addPass(new T.RenderPass(scene, camera));
    var bloom = new T.UnrealBloomPass(new T.Vector2(w, h), opts.strength != null ? opts.strength : 0.72, opts.radius != null ? opts.radius : 0.5, opts.threshold != null ? opts.threshold : 0.16);
    composer.addPass(bloom);
    if (T.GammaCorrectionShader && T.ShaderPass) {
      composer.addPass(new T.ShaderPass(T.GammaCorrectionShader)); // preserve the legacy linear → sRGB display pass
    }
    composer.setSize(w, h);
    return composer;
  } catch (e) {
    return null;
  }
}

/* ---------- shared sprite texture (cached; never disposed) ---------- */
function qgaGlowTexture() {
  if (window.__qgaGlowTex) return window.__qgaGlowTex;
  var c = document.createElement("canvas");
  c.width = c.height = 128;
  var g = c.getContext("2d");
  var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, QGA_TOKENS.css("pigment-white"));
  grad.addColorStop(0.25, QGA_TOKENS.alpha("pigment-white", 0.55));
  grad.addColorStop(0.6, QGA_TOKENS.alpha("pigment-white", 0.12));
  grad.addColorStop(1, QGA_TOKENS.alpha("pigment-white", 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  window.__qgaGlowTex = new THREE.CanvasTexture(c);
  return window.__qgaGlowTex;
}

/* ---------- small builder helpers ---------- */
function s3dGlow(color) {
  var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
  var opacity = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.8;
  var m = new THREE.SpriteMaterial({
    map: qgaGlowTexture(),
    color: new THREE.Color(color),
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var s = new THREE.Sprite(m);
  s.scale.setScalar(scale);
  s.userData.layer = "decoration"; // a glow carries no quantity (S11); a scene that uses one as a marker re-tags it
  return s;
}
// Engraved line (S06): constant-pixel-width, anti-aliased, dashable. `engraved` is the API bound to the scene's
// backend (ctx.engraved); colour is a token name, a THREE.Color or a resolved hex from a palette function.
var S3D_DASH = {
  size: 0.22,
  gap: 0.14
};
var S3D_PICK_PX = 6;
function s3dLine(points, color) {
  var opacity = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.8;
  var dashed = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var engraved = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
  if (!engraved) throw new Error("s3dLine needs the scene's engraved API (ctx.engraved)");
  return engraved.line(points, {
    color: color,
    opacity: opacity,
    widthPx: engraved.WIDTH_PX.standard,
    dash: dashed ? S3D_DASH : null
  });
}
function s3dGrid(size, divisions) {
  var color = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : QGA_TOKENS.hex("pigment-blue-35");
  var opacity = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.35;
  var engraved = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
  if (!engraved) throw new Error("s3dGrid needs the scene's engraved API (ctx.engraved)");
  return engraved.grid(size, divisions, {
    color: color,
    opacity: opacity,
    widthPx: engraved.WIDTH_PX.hairline,
    layer: "decoration"
  });
}
function s3dDispose(root) {
  root.traverse(function (o) {
    // THREE.Sprite instances share one module-level geometry across every
    // scene and renderer; disposing it destroys GPU buffers still in use elsewhere.
    if (o.geometry && !o.isSprite) o.geometry.dispose();
    var mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    var _iterator = _createForOfIteratorHelper(mats),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var m = _step.value;
        // shared glow texture is cached globally — never dispose it
        if (m.map && m.map !== window.__qgaGlowTex) m.map.dispose();
        m.dispose();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  });
}
var S3D_DPR = {
  low: 1,
  medium: 1.5,
  ultra: 2
};
var S3D_MOTION = {
  reduced: 0,
  balanced: 0.55,
  full: 1
};

/* =========================================================================
   Scene3D — managed interactive 3D stage.

   props:
     height        css px height of the stage
     aria          accessible label for the scene
     initial       { radius, theta, phi, fov?, target?:[x,y,z], minR?, maxR? }
     build(ctx)    called once per (re)build. ctx = { THREE, scene, camera,
                   renderer, settings (ref → live atlas settings), motion()
                   → 0..1 motion factor, label(text, posFn, cls) → handle,
                   annotation(text, posFn) (hidden by annotations toggle) }
                   Must return {} or:
                     update(t, dt)     per-frame; dt = 0 while paused
                     prepare(renderer) async, once, after the renderer exists and before the first frame (compile and seed
                                       GPU compute systems)
                     compute(renderer, dt) per-frame, after update(): advance GPU compute systems
                     pickables: []     meshes for click-raycast
                     onPick(obj|null)  click result (obj.userData yours)
                     autoRotate: bool  default true (cinematic mode only)
                     dispose()         extra cleanup
     deps          rebuild triggers (detail level is added automatically)
     fallback      node rendered if WebGL/THREE unavailable or context lost
     animated      true (default) | "motion" | false: when the scene needs frames on the shared stage. true: it evolves
                   while playing. "motion": ambient motion that its own code freezes at motion 0 (it idles under
                   reduced motion). false: it changes only on input. A build may return isAnimated() to report its own
                   state instead (Kerr: until its accumulation converges); see js/render/stage/animation-policy.mjs.
     invalidateKey any value; a change owes the scene one frame (e.g. a transport clock owned by the parent)
     nodeKit       true when the scene is built from TSL node materials (the S07 material kit): it needs the node
                   renderer, on WebGPU or on its WebGL2 backend, and has no classic fallback
     classicLines  true when the scene holds a classic-only material (ShaderMaterial); its engraved lines then
                   use the classic LineMaterial from the first build instead of after an automatic rebuild
     shared        false opts a scene out of the shared stage (it then keeps its own renderer)
     overlay       extra React overlay (legends etc.), absolutely positioned
   ========================================================================= */
function Scene3D(_ref) {
  var _ref$height = _ref.height,
    height = _ref$height === void 0 ? 420 : _ref$height,
    aria = _ref.aria,
    _ref$initial = _ref.initial,
    initial = _ref$initial === void 0 ? {} : _ref$initial,
    build = _ref.build,
    _ref$deps = _ref.deps,
    deps = _ref$deps === void 0 ? [] : _ref$deps,
    _ref$fallback = _ref.fallback,
    fallback = _ref$fallback === void 0 ? null : _ref$fallback,
    _ref$overlay = _ref.overlay,
    overlay = _ref$overlay === void 0 ? null : _ref$overlay,
    _ref$cameraGoal = _ref.cameraGoal,
    cameraGoal = _ref$cameraGoal === void 0 ? null : _ref$cameraGoal,
    _ref$shotSpace = _ref.shotSpace,
    shotSpace = _ref$shotSpace === void 0 ? null : _ref$shotSpace,
    _ref$shared = _ref.shared,
    shared = _ref$shared === void 0 ? true : _ref$shared,
    _ref$animated = _ref.animated,
    animated = _ref$animated === void 0 ? true : _ref$animated,
    _ref$invalidateKey = _ref.invalidateKey,
    invalidateKey = _ref$invalidateKey === void 0 ? null : _ref$invalidateKey,
    _ref$classicLines = _ref.classicLines,
    classicLines = _ref$classicLines === void 0 ? false : _ref$classicLines,
    _ref$nodeKit = _ref.nodeKit,
    nodeKit = _ref$nodeKit === void 0 ? false : _ref$nodeKit,
    _ref$fixedView = _ref.fixedView,
    fixedView = _ref$fixedView === void 0 ? false : _ref$fixedView;
  var settings = useAtlasSettings();
  var prm = usePRM();
  var mountRef = useRef(null);
  var hudStateRef = useRef({});
  var sessionRef = useRef(null);
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    failed = _useState2[0],
    setFailed = _useState2[1];
  var _useState3 = useState(0),
    _useState4 = _slicedToArray(_useState3, 2),
    rebuildNonce = _useState4[0],
    setRebuildNonce = _useState4[1];
  // Set when the node renderer failed with node lines in the scene: the rebuild uses the classic lines (D-028).
  var classicLinesRef = useRef(false);
  var classicReasonRef = useRef("");
  var _useState5 = useState("initializing"),
    _useState6 = _slicedToArray(_useState5, 2),
    phase = _useState6[0],
    setPhase = _useState6[1];
  var _useState7 = useState(""),
    _useState8 = _slicedToArray(_useState7, 2),
    errorMessage = _useState8[0],
    setErrorMessage = _useState8[1];
  var diagnosticRef = useRef(null);
  var _useState9 = useState(true),
    _useState0 = _slicedToArray(_useState9, 2),
    playing = _useState0[0],
    setPlaying = _useState0[1];
  var _useState1 = useState(false),
    _useState10 = _slicedToArray(_useState1, 2),
    full = _useState10[0],
    setFull = _useState10[1];
  var settingsRef = useRef(settings);
  settingsRef.current = settings;
  var prmRef = useRef(prm);
  prmRef.current = prm;
  var playingRef = useRef(playing);
  playingRef.current = playing;
  useEffect(function () {
    return function () {
      if (diagnosticRef.current) QGA_RENDER.renderDiagnostics.remove(diagnosticRef.current);
    };
  }, []);
  // On a shared stage a static scene draws only when invalidated: React-side changes owe it a frame. `build` is a
  // new closure whenever the owning module renders, and modules feed live parameters to a built scene through refs
  // (the Kerr observatory's spin, corona and jets, the Planck probe's scale), so a render owes one frame as well.
  useEffect(function () {
    var _sessionRef$current;
    (_sessionRef$current = sessionRef.current) === null || _sessionRef$current === void 0 || _sessionRef$current.invalidate({
      input: false
    });
  }, [playing, full, cameraGoal, settings.labels3d, settings.annotations3d, invalidateKey, build]);
  var animatedRef = useRef(animated);
  animatedRef.current = animated;
  useEffect(function () {
    classicLinesRef.current = false;
    classicReasonRef.current = "";
    setFailed(false);
  }, [settings.renderBackend, settings.detail3d, settings.vizMode, settings.motion, settings.toneMapping]);
  // Eased camera-preset target. Held in a ref so changing it never rebuilds the
  // WebGL scene; the frame loop glides the orbit rig toward it instead.
  var goalRef = useRef(null);
  useEffect(function () {
    if (!cameraGoal) return;
    goalRef.current = {
      radius: cameraGoal.radius,
      theta: cameraGoal.theta,
      phi: cameraGoal.phi,
      fromR: null,
      fromT: 0,
      fromP: 0,
      t: 0,
      active: true
    };
  }, [cameraGoal]);
  useEffect(function () {
    if (failed) return;
    var mount = mountRef.current;
    if (!mount) return;
    var abort = new AbortController();
    var alive = true,
      stop = function stop() {},
      renderer,
      session,
      scene,
      built = {},
      recovered = false,
      engravedKind = null;
    if (diagnosticRef.current) QGA_RENDER.renderDiagnostics.remove(diagnosticRef.current);
    var diagnosticId = QGA_RENDER.renderDiagnostics.allocate(aria || "Module scene");
    diagnosticRef.current = diagnosticId;
    if (classicLinesRef.current && classicReasonRef.current) QGA_RENDER.renderDiagnostics.message(diagnosticId, classicReasonRef.current);
    setPhase("initializing");
    var fail = function fail(error) {
      if (!alive || error.name === "AbortError") return;
      // Node lines cannot be drawn by the classic WebGLRenderer: if the node renderer failed, rebuild once on classic lines.
      if (engravedKind === "node" && !classicLinesRef.current && !nodeKit) {
        classicLinesRef.current = true;
        classicReasonRef.current = "webgpu initialization/compile failed: ".concat(QGA_RENDER.describeRenderError(error), ". Retrying classic WebGL2 once, on classic engraved lines.");
        QGA_RENDER.renderDiagnostics.message(diagnosticId, "Recovering scene on classic engraved lines: ".concat(QGA_RENDER.describeRenderError(error)));
        stop();
        setRebuildNonce(function (n) {
          return n + 1;
        });
        return;
      }
      // A scene may declare one automatic recovery (e.g. rebuild on a different material backend).
      if (!recovered && built.recoverable && built.recoverable(error)) {
        recovered = true;
        QGA_RENDER.renderDiagnostics.message(diagnosticId, "Recovering scene: ".concat(QGA_RENDER.describeRenderError(error)));
        stop();
        setRebuildNonce(function (n) {
          return n + 1;
        });
        return;
      }
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
        var _initial$radius, _initial$theta, _initial$phi, _initial$minR, _initial$radius2, _initial$maxR, _initial$radius3, _built$renderCapabili, _window$QGA_CONCEPT_B2, _window$QGA_CONCEPT_B3, _window$QGA_CONCEPT_B4, _window$QGA_CONCEPT_B5, _window, _window$__qgaActiveSc;
        var fov, camera, target, renderFrame, orbit, home, motion, labelLayer, resourcesReleased, initPromise, spaceBridge, disposers, labels, makeLabel, conceptTargets, conceptPulse, startConceptPulse, stopConceptPulse, ctx, releaseResources, el, ptr, touches, markInteract, onPointerDown, onPointerMove, onPointerUp, onWheel, raycaster, ndc, pickAt, hoverThrottle, hoverCheck, onKeyDown, resetCam, offFormulaHighlight, offFormulaClear, offAnnotationHover, paletteOpen, offPalette, compareRole, lastPoseBroadcast, broadcastPose, onCompareMessage, _window$parent, maybePlaceAnnotation, registryVector, registryRay, sceneHandle, resize, ro, visible, io, raf, last, clockT, v3, _tick, released, _t, _t2, _t3, _t4, _t5, _t6, _t7, _t8, _t9, _t0, _t1, _t10, _t11, _t12, _t13, _t14, _t15, _t16, _t17;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              scene = new THREE.Scene();
              fov = initial.fov || 45;
              camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 600);
              if (fixedView) camera.up.set(0, 0, -1);
              target = _construct(THREE.Vector3, _toConsumableArray(initial.target || [0, 0, 0]));
              renderFrame = function renderFrame() {
                var dt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
                var now = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : performance.now();
                var sample = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                var frameMs = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : dt * 1000;
                return session.render(dt, now, sample, frameMs);
              }; // orbit rig state
              orbit = {
                radius: (_initial$radius = initial.radius) !== null && _initial$radius !== void 0 ? _initial$radius : 12,
                theta: (_initial$theta = initial.theta) !== null && _initial$theta !== void 0 ? _initial$theta : 0.6,
                phi: (_initial$phi = initial.phi) !== null && _initial$phi !== void 0 ? _initial$phi : 1.1,
                vTheta: 0,
                vPhi: 0,
                minR: (_initial$minR = initial.minR) !== null && _initial$minR !== void 0 ? _initial$minR : ((_initial$radius2 = initial.radius) !== null && _initial$radius2 !== void 0 ? _initial$radius2 : 12) * 0.35,
                maxR: (_initial$maxR = initial.maxR) !== null && _initial$maxR !== void 0 ? _initial$maxR : ((_initial$radius3 = initial.radius) !== null && _initial$radius3 !== void 0 ? _initial$radius3 : 12) * 3,
                lastInteract: -10,
                introT: 0
              };
              home = {
                radius: orbit.radius,
                theta: orbit.theta,
                phi: orbit.phi
              };
              motion = function motion() {
                var _S3D_MOTION$settingsR;
                return prmRef.current ? 0 : (_S3D_MOTION$settingsR = S3D_MOTION[settingsRef.current.motion]) !== null && _S3D_MOTION$settingsR !== void 0 ? _S3D_MOTION$settingsR : 0.55;
              }; // cinematic intro: ease in from a pulled-back camera
              if (motion() > 0) {
                orbit.radius = home.radius * 1.45;
                orbit.introT = 1;
              }

              // label overlay
              labelLayer = document.createElement("div");
              labelLayer.className = "s3d-labels";
              mount.appendChild(labelLayer);
              resourcesReleased = false, initPromise = null, spaceBridge = null;
              disposers = [];
              stop = function stop() {
                if (resourcesReleased) return;
                resourcesReleased = true;
                if (spaceBridge) {
                  window.QGA_CINEMATIC.unregisterSpace(shotSpace, spaceBridge);
                  spaceBridge = null;
                }
                var releaseScene = function releaseScene() {
                  var _iterator2 = _createForOfIteratorHelper(disposers.splice(0)),
                    _step2;
                  try {
                    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                      var release = _step2.value;
                      try {
                        release();
                      } catch (error) {
                        QGA_RENDER.renderDiagnostics.message(diagnosticId, "Scene cleanup failed: ".concat(error.message));
                      }
                    }
                  } catch (err) {
                    _iterator2.e(err);
                  } finally {
                    _iterator2.f();
                  }
                  if (built.dispose) {
                    try {
                      built.dispose();
                    } catch (error) {
                      QGA_RENDER.renderDiagnostics.message(diagnosticId, "Scene cleanup failed: ".concat(error.message));
                    }
                  }
                  s3dDispose(scene);
                  labelLayer.remove();
                };
                // GPU buffers must outlive every submit that references them: stop the
                // render loop and dispose the renderer (which drains the queue) first,
                // and only then destroy scene-owned resources. Disposing earlier raises
                // "used in submit while destroyed" on the shared WebGPU device.
                var teardown = session ? session.dispose() : initPromise ? initPromise.then(function (early) {
                  return early.dispose();
                }, function () {
                  return undefined;
                }) : Promise.resolve();
                void Promise.resolve(teardown)["catch"](function (error) {
                  return QGA_RENDER.renderDiagnostics.message(diagnosticId, error.message);
                })["finally"](releaseScene);
              };
              labels = [];
              makeLabel = function makeLabel(annotationOnly) {
                return function (text, posFn, cls) {
                  var el = document.createElement("div");
                  el.className = "s3d-label" + (cls ? " " + cls : "") + (annotationOnly ? " s3d-annot" : "");
                  el.textContent = text;
                  labelLayer.appendChild(el);
                  var h = {
                    el: el,
                    posFn: posFn,
                    annotationOnly: annotationOnly,
                    set: function set(t2) {
                      el.textContent = t2;
                    },
                    show: true,
                    setShow: function setShow(v) {
                      h.show = v;
                    }
                  };
                  labels.push(h);
                  return h;
                };
              }; // Prompt 10 formula linking: scenes register concept targets mapping a
              // formula symbol (tex id) to a scene object plus a live readout. Unknown
              // symbols stay invisible (dev diagnostic only) — never an exception.
              conceptTargets = new Map();
              conceptPulse = {
                active: null,
                focusTween: null,
                focusBase: null,
                symbol: null
              };
              startConceptPulse = function startConceptPulse(symbol, target) {
                var _object$parent, _conceptPulse$lastInt, _session;
                var _ref3 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
                  _ref3$intensity = _ref3.intensity,
                  intensity = _ref3$intensity === void 0 ? 1 : _ref3$intensity;
                var object = target.object;
                if (!object) return;
                conceptPulse.lastInteraction = intensity < 1 ? "preview" : "highlight";
                var overlay;
                if (object.isMesh && object.geometry) {
                  var material = new THREE.MeshBasicMaterial({
                    color: QGA_TOKENS.hex("pigment-azure-75"),
                    transparent: true,
                    opacity: 0,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                  });
                  overlay = new THREE.Mesh(object.geometry, material);
                  overlay.scale.copy(object.scale).multiplyScalar(1.03);
                  overlay.position.copy(object.position);
                  overlay.rotation.copy(object.rotation);
                  overlay.renderOrder = 6;
                } else {
                  var _target$glowScale;
                  overlay = s3dGlow(QGA_TOKENS.hex("pigment-azure-75"), ((_target$glowScale = target.glowScale) !== null && _target$glowScale !== void 0 ? _target$glowScale : 4.5) * intensity, 0);
                  overlay.position.copy(object.position);
                }
                overlay.userData.layer = "model"; // the highlight stays visible in the scientific mode
                ((_object$parent = object.parent) !== null && _object$parent !== void 0 ? _object$parent : scene).add(overlay);
                if (conceptPulse.active) conceptPulse.active.overlay.removeFromParent();
                conceptPulse.active = {
                  overlay: overlay,
                  object: object,
                  target: target,
                  startTime: clockT,
                  duration: 0.8,
                  intensity: intensity,
                  hold: true
                };
                conceptPulse.symbol = symbol;
                session.invalidate({
                  input: false
                });
                // Dev/QA diagnostic: the active concept highlight (also lets the QA
                // suite assert the scene reacted without touching scene internals).
                window.__qgaConceptHighlight = {
                  symbol: symbol,
                  interaction: (_conceptPulse$lastInt = conceptPulse.lastInteraction) !== null && _conceptPulse$lastInt !== void 0 ? _conceptPulse$lastInt : "hover",
                  at: performance.now()
                };
                // Live numerical readout for the highlighted symbol.
                try {
                  var _target$readout, _window$QGA_CONCEPT_B, _readout$label, _readout$value, _readout$unit;
                  var readout = (_target$readout = target.readout) === null || _target$readout === void 0 ? void 0 : _target$readout.call(target);
                  if (readout) (_window$QGA_CONCEPT_B = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B === void 0 || _window$QGA_CONCEPT_B.publish("formula-readout", {
                    symbol: symbol,
                    label: String((_readout$label = readout.label) !== null && _readout$label !== void 0 ? _readout$label : ""),
                    value: String((_readout$value = readout.value) !== null && _readout$value !== void 0 ? _readout$value : ""),
                    unit: String((_readout$unit = readout.unit) !== null && _readout$unit !== void 0 ? _readout$unit : "")
                  });
                } catch (error) {/* readouts are best-effort; never break the scene */}
                // Cinematic mode only: pull the depth-of-field focus to the object's
                // view-space depth (≤450ms, easeInOutQuint). Scientific mode keeps DOF
                // untouched — highlight stays emissive + outline only.
                var pipeline = (_session = session) === null || _session === void 0 ? void 0 : _session.pipeline;
                if (settingsRef.current.vizMode === "cinematic" && pipeline !== null && pipeline !== void 0 && pipeline.focusDistanceSupported && !prmRef.current) {
                  var _conceptPulse$focusBa, _conceptPulse$focusTw, _window$QGA_MOTION;
                  var depth = object.getWorldPosition(new THREE.Vector3()).applyMatrix4(camera.matrixWorldInverse).z;
                  var focusDistance = Math.max(camera.near, -depth);
                  var from = (_conceptPulse$focusBa = conceptPulse.focusBase) !== null && _conceptPulse$focusBa !== void 0 ? _conceptPulse$focusBa : Math.max(camera.near * 2, 8);
                  conceptPulse.focusBase = focusDistance;
                  (_conceptPulse$focusTw = conceptPulse.focusTween) === null || _conceptPulse$focusTw === void 0 || _conceptPulse$focusTw.call(conceptPulse);
                  conceptPulse.focusTween = (_window$QGA_MOTION = window.QGA_MOTION) !== null && _window$QGA_MOTION !== void 0 && _window$QGA_MOTION.runtime ? window.QGA_MOTION.runtime.tween({
                    from: from,
                    to: focusDistance,
                    duration: 450,
                    easing: "easeInOutQuint",
                    reducedMotion: window.QGA_MOTION.systemReducedMotion(),
                    onUpdate: function onUpdate(value) {
                      try {
                        pipeline.setFocusDistance(value);
                      } catch (error) {/* pipeline may swap */}
                    }
                  }) : null;
                }
              };
              stopConceptPulse = function stopConceptPulse() {
                var _conceptPulse$focusTw2;
                if (conceptPulse.active) conceptPulse.active.hold = false;
                session.invalidate({
                  input: false
                });
                (_conceptPulse$focusTw2 = conceptPulse.focusTween) === null || _conceptPulse$focusTw2 === void 0 || _conceptPulse$focusTw2.call(conceptPulse);
                conceptPulse.focusTween = null;
              };
              _t = THREE;
              _t2 = scene;
              _t3 = camera;
              _t4 = settingsRef;
              _t5 = motion;
              _t6 = function playing() {
                return playingRef.current;
              };
              _t7 = function invalidate() {
                var _session2;
                return (_session2 = session) === null || _session2 === void 0 ? void 0 : _session2.invalidate({
                  input: false
                });
              };
              _t8 = makeLabel(false);
              _t9 = makeLabel(true);
              _t0 = function tag(object, layerClass) {
                return QGA_LAYERS.tag(object, layerClass);
              };
              _t1 = s3dGlow;
              _t10 = function line(points, color, opacity, dashed) {
                return s3dLine(points, color, opacity, dashed, ctx.engraved);
              };
              _t11 = function grid(size, divisions, color, opacity) {
                return s3dGrid(size, divisions, color, opacity, ctx.engraved);
              };
              _t12 = function mountOverlay(element) {
                return labelLayer.appendChild(element);
              };
              _t13 = function onDispose(release) {
                disposers.push(release);
              };
              _t14 = function conceptTarget(id, target) {
                if (typeof id !== "string" || !id || !target || !target.object) {
                  throw new TypeError("conceptTarget(id, { object, readout? }) requires an id and an object");
                }
                conceptTargets.set(id, target);
                return target;
              };
              ctx = {
                THREE: _t,
                scene: _t2,
                camera: _t3,
                get renderer() {
                  return renderer;
                },
                settings: _t4,
                motion: _t5,
                playing: _t6,
                invalidate: _t7,
                label: _t8,
                annotation: _t9,
                tag: _t0,
                glow: _t1,
                line: _t10,
                grid: _t11,
                engraved: null,
                mountOverlay: _t12,
                onDispose: _t13,
                conceptTarget: _t14
              };
              _context.n = 1;
              return QGA_ENGRAVED.prepare(settingsRef.current, {
                recovery: classicLines || classicLinesRef.current,
                requireNode: nodeKit
              });
            case 1:
              ctx.engraved = _context.v;
              engravedKind = ctx.engraved.kind;
              mount.dataset.engravedBackend = engravedKind;
              // QA hook (like window.__qgaKerrRuntime): lets the browser suite inspect the live scene without touching React.
              mount.__qga = {
                scene: scene,
                camera: camera,
                engraved: ctx.engraved
              };
              _context.n = 2;
              return build(ctx);
            case 2:
              _t15 = _context.v;
              if (_t15) {
                _context.n = 3;
                break;
              }
              _t15 = {};
            case 3:
              built = _t15;
              QGA_LAYERS.applyMode(scene, settingsRef.current.vizMode); // the scientific mode hides decoration and nothing else (S11)
              if (alive) {
                _context.n = 4;
                break;
              }
              if (built.dispose) built.dispose();
              s3dDispose(scene);
              labelLayer.remove();
              return _context.a(2);
            case 4:
              if (!(engravedKind === "node" && !QGA_RENDER.inspectSceneCompatibility(scene).nodeCompatible)) {
                _context.n = 5;
                break;
              }
              classicLinesRef.current = true;
              stop();
              setRebuildNonce(function (n) {
                return n + 1;
              });
              return _context.a(2);
            case 5:
              camera.position.set(target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta), target.y + orbit.radius * Math.cos(orbit.phi), target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta));
              camera.lookAt(target);
              if (built.update) built.update(0, 0);
              setPhase("prewarming");
              initPromise = QGA_RENDER.initializeRenderSession({
                scene: scene,
                camera: camera,
                mount: mount,
                settings: settingsRef.current,
                view: aria || "scene",
                signal: abort.signal,
                diagnosticId: diagnosticId,
                onError: fail,
                onPhase: function onPhase(value) {
                  if (alive) setPhase(value);
                },
                source: built.lightSource || null,
                applyQuality: built.applyRenderQuality || null,
                depthValid: ((_built$renderCapabili = built.renderCapabilities) === null || _built$renderCapabili === void 0 ? void 0 : _built$renderCapabili.depth) !== false,
                shared: shared
              });
              _context.n = 6;
              return initPromise;
            case 6:
              session = _context.v;
              if (alive) {
                _context.n = 8;
                break;
              }
              _context.n = 7;
              return session.dispose();
            case 7:
              return _context.a(2);
            case 8:
              if (!(session.backend === "static")) {
                _context.n = 9;
                break;
              }
              fail(new Error(session.capabilities.diagnostics.join(" ")));
              return _context.a(2);
            case 9:
              sessionRef.current = session;
              renderer = session.renderer;
              // A scene with GPU compute systems (S08) compiles and seeds them once the live node renderer exists, before the first frame.
              // A scene parked by the WebGL2 pool has no renderer yet: its systems seed themselves on the first compute step after it gets one.
              if (!(built.prepare && renderer)) {
                _context.n = 14;
                break;
              }
              _context.p = 10;
              _context.n = 11;
              return built.prepare(renderer);
            case 11:
              _context.n = 13;
              break;
            case 12:
              _context.p = 12;
              _t16 = _context.v;
              fail(_t16);
              return _context.a(2);
            case 13:
              if (alive) {
                _context.n = 14;
                break;
              }
              return _context.a(2);
            case 14:
              session.element.className = "s3d-canvas";
              setPhase("ready");
              releaseResources = stop; // ---------- cinematic shot-space bridge (Prompt 09) ----------
              // The camera director places this scene's orbit rig through this bridge;
              // radii/angles are clamped to the rig's own limits so a shot can never
              // push the camera through invalid geometry.
              if (shotSpace && window.QGA_CINEMATIC) {
                spaceBridge = {
                  getPose: function getPose() {
                    return {
                      radius: orbit.radius,
                      theta: orbit.theta,
                      phi: orbit.phi,
                      target: [target.x, target.y, target.z]
                    };
                  },
                  setPose: function setPose(pose) {
                    if (!pose) return;
                    orbit.radius = Math.max(orbit.minR, Math.min(orbit.maxR, pose.radius));
                    orbit.theta = pose.theta;
                    orbit.phi = Math.max(0.08, Math.min(Math.PI - 0.08, pose.phi));
                    orbit.vTheta = 0;
                    orbit.vPhi = 0;
                    orbit.introT = 0;
                    orbit.lastInteract = clockT;
                    if (Array.isArray(pose.target)) target.set(pose.target[0], pose.target[1], pose.target[2]);
                    session.invalidate({
                      input: false
                    });
                  }
                };
                window.QGA_CINEMATIC.registerSpace(shotSpace, spaceBridge);
              }

              // ---------- interaction ----------
              el = session.element;
              ptr = {
                down: false,
                id: null,
                x: 0,
                y: 0,
                moved: 0,
                pinch: 0
              };
              touches = new Map();
              markInteract = function markInteract() {
                orbit.lastInteract = clockT;
                orbit.introT = 0;
                session.invalidate();
                broadcastPose();
                // user orbit/pan/zoom immediately pauses automated cinematic direction
                if (shotSpace && window.QGA_CINEMATIC) window.QGA_CINEMATIC.notifySceneInput(shotSpace);
              };
              onPointerDown = function onPointerDown(e) {
                touches.set(e.pointerId, {
                  x: e.clientX,
                  y: e.clientY
                });
                ptr.down = true;
                ptr.id = e.pointerId;
                ptr.x = e.clientX;
                ptr.y = e.clientY;
                ptr.moved = 0;
                if (touches.size === 2) {
                  var ts = _toConsumableArray(touches.values());
                  ptr.pinch = Math.hypot(ts[0].x - ts[1].x, ts[0].y - ts[1].y);
                }
                el.setPointerCapture(e.pointerId);
                markInteract();
              };
              onPointerMove = function onPointerMove(e) {
                if (touches.has(e.pointerId)) touches.set(e.pointerId, {
                  x: e.clientX,
                  y: e.clientY
                });
                if (touches.size === 2) {
                  var ts = _toConsumableArray(touches.values());
                  var d = Math.hypot(ts[0].x - ts[1].x, ts[0].y - ts[1].y);
                  if (ptr.pinch > 0) {
                    orbit.radius = Math.max(orbit.minR, Math.min(orbit.maxR, orbit.radius * (ptr.pinch / d)));
                  }
                  ptr.pinch = d;
                  markInteract();
                  return;
                }
                if (!ptr.down || e.pointerId !== ptr.id) {
                  if (built.pickables && built.pickables.length && e.pointerType !== "touch") hoverCheck(e);
                  return;
                }
                var dx = e.clientX - ptr.x,
                  dy = e.clientY - ptr.y;
                ptr.x = e.clientX;
                ptr.y = e.clientY;
                ptr.moved += Math.abs(dx) + Math.abs(dy);
                if (fixedView) {
                  var _built$onScreenDrag, _built;
                  (_built$onScreenDrag = (_built = built).onScreenDrag) === null || _built$onScreenDrag === void 0 || _built$onScreenDrag.call(_built, ndc(e), e);
                  markInteract();
                  return;
                }
                orbit.vTheta = -dx * 0.0042;
                orbit.vPhi = -dy * 0.0042;
                orbit.theta += orbit.vTheta;
                orbit.phi = Math.max(0.08, Math.min(Math.PI - 0.08, orbit.phi + orbit.vPhi));
                markInteract();
              };
              onPointerUp = function onPointerUp(e) {
                touches["delete"](e.pointerId);
                if (e.pointerId === ptr.id) {
                  ptr.down = false;
                  if (ptr.moved < 6 && maybePlaceAnnotation(e)) {/* consumed as an annotation anchor */} else if (ptr.moved < 6 && built.onPick && built.pickables) pickAt(e);else if (ptr.moved < 6 && built.onScreenPick) built.onScreenPick(ndc(e), e);
                }
                ptr.pinch = 0;
              };
              onWheel = function onWheel(e) {
                e.preventDefault();
                orbit.radius = Math.max(orbit.minR, Math.min(orbit.maxR, orbit.radius * Math.exp(e.deltaY * 0.0011)));
                markInteract();
              };
              raycaster = new THREE.Raycaster();
              raycaster.params.Line = {
                threshold: 0.25
              };
              raycaster.params.Line2 = {
                threshold: S3D_PICK_PX
              }; // engraved lines pick within a few screen pixels
              ndc = function ndc(e) {
                var r = el.getBoundingClientRect();
                return new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
              };
              pickAt = function pickAt(e) {
                raycaster.setFromCamera(ndc(e), camera);
                var hits = raycaster.intersectObjects(built.pickables, true);
                built.onPick(hits.length ? hits[0].object : null, hits.length ? hits[0] : null);
              };
              hoverThrottle = 0;
              hoverCheck = function hoverCheck(e) {
                var now = performance.now();
                if (now - hoverThrottle < 80) return;
                hoverThrottle = now;
                raycaster.setFromCamera(ndc(e), camera);
                var hits = raycaster.intersectObjects(built.pickables, true);
                el.style.cursor = hits.length ? "pointer" : "grab";
                if (built.onHover) built.onHover(hits.length ? hits[0].object : null);
              };
              onKeyDown = function onKeyDown(e) {
                var step = 0.12;
                var used = true;
                if (fixedView && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
                if (e.key === "ArrowLeft") orbit.theta -= step;else if (e.key === "ArrowRight") orbit.theta += step;else if (e.key === "ArrowUp") orbit.phi = Math.max(0.08, orbit.phi - step);else if (e.key === "ArrowDown") orbit.phi = Math.min(Math.PI - 0.08, orbit.phi + step);else if (e.key === "+" || e.key === "=") orbit.radius = Math.max(orbit.minR, orbit.radius * 0.9);else if (e.key === "-" || e.key === "_") orbit.radius = Math.min(orbit.maxR, orbit.radius * 1.1);else if (e.key === "r" || e.key === "R" || e.key === "Home") resetCam();else if (e.key === "f" || e.key === "F") setFull(function (v) {
                  return !v;
                });else if (e.key === " ") {
                  setPlaying(function (p) {
                    return !p;
                  });
                } else used = false;
                if (used) {
                  e.preventDefault();
                  markInteract();
                }
              };
              resetCam = function resetCam() {
                orbit.radius = home.radius;
                orbit.theta = home.theta;
                orbit.phi = home.phi;
                orbit.vTheta = 0;
                orbit.vPhi = 0;
                session.invalidate({
                  input: false
                });
              };
              hudStateRef.current.reset = resetCam;
              // Prompt 10 snapshot/compare camera bridge: read the live orbit pose and
              // fly to a stored one (easeInOutQuint ≤900ms; snaps under reduced motion
              // via the goal glide's motion===0 branch).
              hudStateRef.current.getPose = function () {
                return {
                  radius: orbit.radius,
                  theta: orbit.theta,
                  phi: orbit.phi
                };
              };
              hudStateRef.current.flyTo = function (pose) {
                var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
                if (!pose || !Number.isFinite(pose.radius)) return;
                goalRef.current = {
                  radius: Math.max(orbit.minR, Math.min(orbit.maxR, pose.radius)),
                  theta: Number.isFinite(pose.theta) ? pose.theta : orbit.theta,
                  phi: Math.max(0.08, Math.min(Math.PI - 0.08, Number.isFinite(pose.phi) ? pose.phi : orbit.phi)),
                  fromR: null,
                  fromT: 0,
                  fromP: 0,
                  t: 0,
                  active: true,
                  easing: opts.easing === "quint" ? "quint" : "cubic",
                  duration: Number.isFinite(opts.duration) ? Math.min(0.9, Math.max(0.1, opts.duration)) : 0.9
                };
                session.invalidate({
                  input: false
                });
              };

              // ---------- Prompt 10 interaction bridges ----------
              // ConceptBus: formula symbols → scene highlight. Unknown mappings are a
              // benign dev diagnostic; nothing visible happens (spec requirement).
              offFormulaHighlight = (_window$QGA_CONCEPT_B2 = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B2 === void 0 ? void 0 : _window$QGA_CONCEPT_B2.on("formula-highlight", function (payload) {
                var target = conceptTargets.get(payload.symbol);
                if (!target) {
                  try {
                    console.debug("[Scene3D] no concept target for symbol \"".concat(payload.symbol, "\""));
                  } catch (e) {}
                  return;
                }
                startConceptPulse(payload.symbol, target, {
                  intensity: payload.interaction === "preview" ? 0.45 : 1
                });
              });
              offFormulaClear = (_window$QGA_CONCEPT_B3 = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B3 === void 0 ? void 0 : _window$QGA_CONCEPT_B3.on("formula-clear", function () {
                return stopConceptPulse();
              }); // Bidirectional annotation linking: hovering a pin that was dropped on a
              // registered concept object re-highlights that object.
              offAnnotationHover = (_window$QGA_CONCEPT_B4 = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B4 === void 0 ? void 0 : _window$QGA_CONCEPT_B4.on("annotation-hover", function (payload) {
                var target = conceptTargets.get(payload.concept);
                if (!target) return; // unknown mapping: silent, dev diagnostic only
                startConceptPulse(payload.concept, target, {
                  intensity: 0.8
                });
              }); // Palette open: the active scene keeps rendering but idle auto-drift
              // pauses while the command palette is open (cinematic discipline).
              paletteOpen = false;
              offPalette = (_window$QGA_CONCEPT_B5 = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B5 === void 0 ? void 0 : _window$QGA_CONCEPT_B5.on("palette-visibility", function (payload) {
                paletteOpen = payload.open;
                session.invalidate({
                  input: false
                });
              }); // Compare embed bridge: broadcast the orbit pose on interaction and
              // apply synchronized poses from the twin scene (single blended pose).
              compareRole = window.__qgaCompareRole;
              lastPoseBroadcast = 0;
              broadcastPose = function broadcastPose() {
                if (!compareRole || window.parent === window) return;
                var now = performance.now();
                if (now - lastPoseBroadcast < 80) return;
                lastPoseBroadcast = now;
                window.parent.postMessage({
                  type: "qga-camera",
                  side: compareRole,
                  pose: hudStateRef.current.getPose()
                }, "*");
              };
              onCompareMessage = function onCompareMessage(event) {
                var data = event.data;
                if (!data || data.type !== "qga-camera-sync" || !data.pose) return;
                orbit.radius = Math.max(orbit.minR, Math.min(orbit.maxR, Number(data.pose.radius) || orbit.radius));
                orbit.theta = Number.isFinite(data.pose.theta) ? data.pose.theta : orbit.theta;
                orbit.phi = Math.max(0.08, Math.min(Math.PI - 0.08, Number.isFinite(data.pose.phi) ? data.pose.phi : orbit.phi));
                orbit.vTheta = 0;
                orbit.vPhi = 0;
                orbit.introT = 0;
                session.invalidate({
                  input: false
                });
              };
              if (compareRole) {
                window.addEventListener("message", onCompareMessage);
                (_window$parent = window.parent) === null || _window$parent === void 0 || _window$parent.postMessage({
                  type: "qga-scene-mounted",
                  side: compareRole,
                  cameraSpace: "orbit"
                }, "*");
              }

              // Annotation placement: while the annotation layer arms placement, a
              // click on this scene raycasts the geometry and offers a world anchor.
              maybePlaceAnnotation = function maybePlaceAnnotation(e) {
                if (!window.__qgaAnnotationPlacing) return false;
                raycaster.setFromCamera(ndc(e), camera);
                var hits = raycaster.intersectObjects(scene.children, true);
                if (!hits.length) return false; // sky click → the layer falls back to a screen pin
                window.__qgaAnnotationPlacing = false;
                var point = hits[0].point;
                // Bidirectional linking: a pin dropped on a registered concept object
                // remembers the symbol so hovering the pin re-highlights the object.
                var concept = null;
                var _iterator3 = _createForOfIteratorHelper(conceptTargets),
                  _step3;
                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    var _step3$value = _slicedToArray(_step3.value, 2),
                      symbol = _step3$value[0],
                      _target = _step3$value[1];
                    var node = hits[0].object;
                    while (node && concept == null) {
                      if (node === _target.object) concept = symbol;
                      node = node.parent;
                    }
                    if (concept) break;
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }
                document.dispatchEvent(new CustomEvent("qga-annotation-place", {
                  detail: {
                    kind: "world",
                    point: {
                      x: point.x,
                      y: point.y,
                      z: point.z
                    },
                    concept: concept
                  }
                }));
                return true;
              }; // Global scene registry: the annotation layer projects world pins through
              // the active scene (per-frame NDC projection + depth-aware occlusion).
              registryVector = new THREE.Vector3();
              registryRay = new THREE.Raycaster();
              registryRay.camera = camera; // engraved lines (Line2) raycast in screen space and need the camera
              sceneHandle = Object.freeze({
                element: mount,
                cameraSpace: "orbit",
                capture: function capture() {
                  return session.capture();
                },
                // S32: a real render at a target size, copied before the surface is restored. The export studio applies the
                // memory guard before it asks for this, so a size the GPU cannot hold is never requested.
                captureAt: function captureAt(size) {
                  return session.captureAt(size);
                },
                // A scene may expose a small QA readout (live uniforms, counts) through `state` in the object it returns from build.
                state: function state() {
                  var _built$state, _built$state2, _built2;
                  return (_built$state = (_built$state2 = (_built2 = built).state) === null || _built$state2 === void 0 ? void 0 : _built$state2.call(_built2)) !== null && _built$state !== void 0 ? _built$state : null;
                },
                getPose: hudStateRef.current.getPose,
                flyTo: hudStateRef.current.flyTo,
                projectPoint: function projectPoint(point) {
                  registryVector.set(point.x, point.y, point.z);
                  var worldPosition = registryVector.clone();
                  registryVector.project(camera);
                  var rect = session.element.getBoundingClientRect();
                  var result = {
                    x: (registryVector.x * 0.5 + 0.5) * rect.width,
                    y: (-registryVector.y * 0.5 + 0.5) * rect.height,
                    inFront: registryVector.z < 1,
                    occluded: false,
                    rect: rect
                  };
                  var direction = worldPosition.clone().sub(camera.position);
                  var distance = direction.length();
                  registryRay.set(camera.position, direction.normalize());
                  registryRay.far = Math.max(0, distance - 0.05);
                  result.occluded = registryRay.intersectObjects(scene.children, true).length > 0;
                  return result;
                }
              });
              ((_window$__qgaActiveSc = (_window = window).__qgaActiveScenes) !== null && _window$__qgaActiveSc !== void 0 ? _window$__qgaActiveSc : _window.__qgaActiveScenes = new Set()).add(sceneHandle);
              el.style.cursor = "grab";
              el.style.touchAction = "none";
              el.addEventListener("pointerdown", onPointerDown);
              el.addEventListener("pointermove", onPointerMove);
              el.addEventListener("pointerup", onPointerUp);
              el.addEventListener("pointercancel", onPointerUp);
              el.addEventListener("wheel", onWheel, {
                passive: false
              });
              mount.addEventListener("keydown", onKeyDown);

              // ---------- sizing ----------
              resize = function resize() {
                var w = Math.max(40, mount.clientWidth);
                var h = Math.max(40, mount.clientHeight);
                session.resize();
                session.element.style.width = "100%";
                session.element.style.height = "100%";
                session.invalidate({
                  input: false
                });
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
              };
              resize();
              ro = new ResizeObserver(resize);
              ro.observe(mount);

              // ---------- offscreen pause ----------
              visible = true;
              io = new IntersectionObserver(function (entries) {
                visible = entries[entries.length - 1].isIntersecting;
                session.setVisible(visible);
              }, {
                threshold: 0.02
              });
              io.observe(mount);

              // ---------- frame loop ----------
              last = performance.now(), clockT = 0;
              v3 = new THREE.Vector3();
              _tick = function tick(now) {
                if (!alive) return;
                if (!session.shared && !renderer.isWebGPURenderer) raf = requestAnimationFrame(_tick);
                try {
                  var frameMs = Math.max(0, now - last);
                  var rawDt = Math.min(0.05, frameMs / 1000);
                  last = now;
                  if (!visible || document.hidden) {
                    session.suspend();
                    session.setAnimated(false);
                    return;
                  }
                  clockT += rawDt;
                  var mo = motion();

                  // eased camera-preset transition (no scene rebuild)
                  var goal = goalRef.current;
                  if (goal && goal.active) {
                    if (ptr.down) {
                      goal.active = false;
                    } else if (mo === 0) {
                      // reduced motion: snap straight to the preset
                      orbit.radius = goal.radius;
                      orbit.theta = goal.theta;
                      orbit.phi = goal.phi;
                      orbit.introT = 0;
                      orbit.vTheta = 0;
                      orbit.vPhi = 0;
                      goal.active = false;
                    } else {
                      var _goal$duration, _window$QGA_MOTION$EA, _window$QGA_MOTION2;
                      if (goal.fromR == null) {
                        goal.fromR = orbit.radius;
                        goal.fromT = orbit.theta;
                        goal.fromP = orbit.phi;
                        orbit.introT = 0;
                        orbit.vTheta = 0;
                        orbit.vPhi = 0;
                        orbit.lastInteract = clockT;
                      }
                      goal.t = Math.min(1, goal.t + rawDt / ((_goal$duration = goal.duration) !== null && _goal$duration !== void 0 ? _goal$duration : 0.9));
                      // Prompt 10: snapshot/compare fly-to uses easeInOutQuint; module
                      // camera goals keep the original easeOutCubic glide.
                      var e = goal.easing === "quint" ? ((_window$QGA_MOTION$EA = (_window$QGA_MOTION2 = window.QGA_MOTION) === null || _window$QGA_MOTION2 === void 0 || (_window$QGA_MOTION2 = _window$QGA_MOTION2.EASINGS) === null || _window$QGA_MOTION2 === void 0 ? void 0 : _window$QGA_MOTION2.easeInOutQuint) !== null && _window$QGA_MOTION$EA !== void 0 ? _window$QGA_MOTION$EA : function (t) {
                        return 1 - Math.pow(1 - t, 3);
                      })(goal.t) : 1 - Math.pow(1 - goal.t, 3);
                      orbit.radius = goal.fromR + (goal.radius - goal.fromR) * e;
                      orbit.theta = goal.fromT + (goal.theta - goal.fromT) * e;
                      orbit.phi = goal.fromP + (goal.phi - goal.fromP) * e;
                      if (goal.t >= 1) goal.active = false;
                    }
                  }
                  var easing = !!(goal && goal.active);

                  // cinematic intro ease
                  if (orbit.introT > 0 && !easing) {
                    orbit.introT = Math.max(0, orbit.introT - rawDt / 1.4);
                    var k = 1 - orbit.introT * orbit.introT;
                    orbit.radius = home.radius * (1.45 - 0.45 * k);
                  }
                  // inertia
                  if (!fixedView && !ptr.down && mo > 0 && !easing) {
                    orbit.theta += orbit.vTheta;
                    orbit.phi = Math.max(0.08, Math.min(Math.PI - 0.08, orbit.phi + orbit.vPhi));
                    orbit.vTheta *= 0.9;
                    orbit.vPhi *= 0.9;
                    if (Math.abs(orbit.vTheta) < 1e-5) orbit.vTheta = 0;
                    if (Math.abs(orbit.vPhi) < 1e-5) orbit.vPhi = 0;
                  }
                  // gentle auto-drift in cinematic mode after idle (paused while the
                  // command palette is open — the scene renders but does not wander)
                  if (mo > 0 && !easing && built.autoRotate !== false && settingsRef.current.vizMode === "cinematic" && clockT - orbit.lastInteract > 4 && !ptr.down && !paletteOpen) {
                    orbit.theta += 0.03 * mo * rawDt;
                  }

                  // Prompt 10 concept-highlight pulse: uniform-driven emissive overlay,
                  // 600–900ms easeOutCubic attack/decay, looping while held. The target
                  // object's own materials are never mutated.
                  if (conceptPulse.active) {
                    var pulse = conceptPulse.active;
                    var elapsed = clockT - pulse.startTime;
                    var t = elapsed / pulse.duration;
                    if (!pulse.overlay.parent || !pulse.hold && t >= 1) {
                      pulse.overlay.removeFromParent();
                      pulse.overlay.material.dispose();
                      if (pulse.overlay.geometry && !pulse.object.isMesh) pulse.overlay.geometry.dispose();
                      conceptPulse.active = null;
                    } else {
                      var _window$QGA_MOTION$EA2, _window$QGA_MOTION3;
                      if (t >= 1) {
                        pulse.startTime = clockT;
                      }
                      var cycle = Math.min(1, (clockT - pulse.startTime) / pulse.duration);
                      var easeOutCubic = (_window$QGA_MOTION$EA2 = (_window$QGA_MOTION3 = window.QGA_MOTION) === null || _window$QGA_MOTION3 === void 0 || (_window$QGA_MOTION3 = _window$QGA_MOTION3.EASINGS) === null || _window$QGA_MOTION3 === void 0 ? void 0 : _window$QGA_MOTION3.easeOutCubic) !== null && _window$QGA_MOTION$EA2 !== void 0 ? _window$QGA_MOTION$EA2 : function (x) {
                        return 1 - Math.pow(1 - x, 3);
                      };
                      var envelope = cycle < 0.25 ? easeOutCubic(cycle / 0.25) : 1 - easeOutCubic((cycle - 0.25) / 0.75);
                      var strength = envelope * pulse.intensity;
                      if (pulse.overlay.isMesh) {
                        pulse.overlay.material.opacity = 0.5 * strength;
                        var base = pulse.object.scale.x * 1.03;
                        pulse.overlay.scale.setScalar(base * (1 + 0.035 * strength));
                      } else {
                        pulse.overlay.material.opacity = 0.85 * strength;
                      }
                      pulse.overlay.position.copy(pulse.object.position);
                    }
                  }
                  camera.position.set(target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta), target.y + orbit.radius * Math.cos(orbit.phi), target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta));
                  camera.lookAt(target);
                  var dt = playingRef.current ? rawDt : 0;
                  if (built.update) built.update(clockT, dt);
                  // GPU compute systems (S08) run on the session's live renderer: a WebGL2 pool eviction releases it (and a resume makes a new one),
                  // so it is read from the session every frame and nothing runs while the context is suspended.
                  if (built.compute && session.renderer && !session.suspended) built.compute(session.renderer, dt);

                  // project labels
                  var showLabels = settingsRef.current.labels3d !== false;
                  var showAnnot = settingsRef.current.annotations3d !== false;
                  var r = session.element.getBoundingClientRect();
                  for (var _i = 0, _labels = labels; _i < _labels.length; _i++) {
                    var L = _labels[_i];
                    var on = L.show && (L.annotationOnly ? showAnnot && showLabels : showLabels);
                    if (!on) {
                      L.el.style.display = "none";
                      continue;
                    }
                    var p = L.posFn();
                    v3.set(p.x, p.y, p.z).project(camera);
                    if (v3.z > 1 || v3.x < -1.15 || v3.x > 1.15 || v3.y < -1.15 || v3.y > 1.15) {
                      L.el.style.display = "none";
                      continue;
                    }
                    L.el.style.display = "block";
                    L.el.style.transform = "translate(-50%,-130%) translate(" + ((v3.x * 0.5 + 0.5) * r.width).toFixed(1) + "px," + ((-v3.y * 0.5 + 0.5) * r.height).toFixed(1) + "px)";
                  }
                  // A shared stage draws a static scene only when invalidated: keep ticking while anything can still
                  // change (running simulation, inertia, easing, intro, a highlight, a drag, or cinematic drift).
                  var _transient = easing || orbit.introT > 0 || orbit.vTheta !== 0 || orbit.vPhi !== 0 || !!conceptPulse.active || ptr.down || animatedRef.current !== false && mo > 0 && built.autoRotate !== false && settingsRef.current.vizMode === "cinematic" && !paletteOpen;
                  session.setAnimated(QGA_RENDER.resolveAnimated({
                    declared: animatedRef.current,
                    playing: playingRef.current,
                    motion: mo,
                    "transient": _transient,
                    builtAnimated: built.isAnimated ? built.isAnimated() : null
                  }));
                  renderFrame(rawDt, now, mo > 0 && playingRef.current, frameMs);
                } catch (error) {
                  fail(error);
                }
              };
              released = false;
              stop = function stop() {
                var _window$__qgaActiveSc2, _conceptPulse$focusTw3;
                if (released) return;
                released = true;
                sessionRef.current = null;
                cancelAnimationFrame(raf);
                ro.disconnect();
                io.disconnect();
                el.removeEventListener("pointerdown", onPointerDown);
                el.removeEventListener("pointermove", onPointerMove);
                el.removeEventListener("pointerup", onPointerUp);
                el.removeEventListener("pointercancel", onPointerUp);
                el.removeEventListener("wheel", onWheel);
                mount.removeEventListener("keydown", onKeyDown);
                // Prompt 10 bridges: bus subscriptions, compare channel, scene registry
                // and any live highlight overlay/focus tween all die with the scene.
                offFormulaHighlight === null || offFormulaHighlight === void 0 || offFormulaHighlight();
                offFormulaClear === null || offFormulaClear === void 0 || offFormulaClear();
                offPalette === null || offPalette === void 0 || offPalette();
                offAnnotationHover === null || offAnnotationHover === void 0 || offAnnotationHover();
                if (compareRole) window.removeEventListener("message", onCompareMessage);
                (_window$__qgaActiveSc2 = window.__qgaActiveScenes) === null || _window$__qgaActiveSc2 === void 0 || _window$__qgaActiveSc2["delete"](sceneHandle);
                (_conceptPulse$focusTw3 = conceptPulse.focusTween) === null || _conceptPulse$focusTw3 === void 0 || _conceptPulse$focusTw3.call(conceptPulse);
                if (conceptPulse.active) {
                  conceptPulse.active.overlay.removeFromParent();
                  conceptPulse.active.overlay.material.dispose();
                  conceptPulse.active = null;
                }
                releaseResources();
              };
              _context.p = 15;
              renderFrame();
              _context.n = 17;
              break;
            case 16:
              _context.p = 16;
              _t17 = _context.v;
              fail(_t17);
              return _context.a(2);
            case 17:
              if (session.drive(_tick)) {/* the shared stage calls tick, and only when this view has a frame to draw */} else if (renderer.isWebGPURenderer) void renderer.setAnimationLoop(_tick)["catch"](fail);else raf = requestAnimationFrame(_tick);
            case 18:
              return _context.a(2);
          }
        }, _callee, null, [[15, 16], [10, 12]]);
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
  }, [failed, settings.detail3d, settings.vizMode, settings.motion, settings.renderBackend, settings.toneMapping, rebuildNonce].concat(_toConsumableArray(deps))); // eslint-disable-line

  // exit fullscreen on Escape
  useEffect(function () {
    if (!full) return;
    var onKey = function onKey(e) {
      if (e.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.documentElement.classList.add("s3d-fs-open");
    return function () {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.documentElement.classList.remove("s3d-fs-open");
    };
  }, [full]);
  if (failed) {
    return /*#__PURE__*/React.createElement("div", {
      className: "s3d-fallback",
      style: {
        minHeight: fallback ? undefined : 180
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "s3d-fallback-note"
    }, /*#__PURE__*/React.createElement("span", {
      className: "badge badge-schematic"
    }, "3D unavailable"), /*#__PURE__*/React.createElement("span", {
      className: "small dim"
    }, "Interactive 3D rendering could not start on this device \u2014 showing the 2D analytical view instead. All scientific content remains available."), /*#__PURE__*/React.createElement("span", {
      className: "small",
      role: "alert"
    }, errorMessage), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: function onClick() {
        return setFailed(false);
      }
    }, "Retry 3D initialization")), fallback);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "s3d-stage" + (full ? " s3d-full" : ""),
    style: full ? null : {
      height: height
    },
    ref: mountRef,
    tabIndex: 0,
    role: "application",
    "aria-busy": phase !== "ready",
    "data-qga-anchor": "primary-scene",
    "aria-label": (aria || "Interactive 3D scientific visualization") + (fixedView ? ". Click to select; scroll to zoom, R to reset camera, F for fullscreen." : ". Drag to orbit, scroll to zoom, arrow keys to rotate, R to reset camera, space to pause, F for fullscreen.")
  }, phase !== "ready" ? /*#__PURE__*/React.createElement("div", {
    className: "render-loading",
    role: "status"
  }, "Initializing renderer and compiling shaders\u2026") : null, /*#__PURE__*/React.createElement("div", {
    className: "s3d-hud",
    "data-omelette-chrome": ""
  }, /*#__PURE__*/React.createElement("button", {
    className: "s3d-hud-btn",
    title: "Reset camera (R)",
    "aria-label": "Reset camera",
    onClick: function onClick() {
      return hudStateRef.current.reset && hudStateRef.current.reset();
    }
  }, "\u2316"), !fixedView && /*#__PURE__*/React.createElement("button", {
    className: "s3d-hud-btn",
    title: playing ? "Pause simulation (space)" : "Play simulation (space)",
    "aria-label": playing ? "Pause simulation" : "Play simulation",
    onClick: function onClick() {
      return setPlaying(!playing);
    }
  }, playing ? "❚❚" : "▶"), /*#__PURE__*/React.createElement("button", {
    className: "s3d-hud-btn s3d-hud-full",
    title: full ? "Exit fullscreen (Esc)" : "Expand to fullscreen",
    "aria-label": full ? "Exit fullscreen" : "Expand to fullscreen",
    onClick: function onClick() {
      return setFull(function (v) {
        return !v;
      });
    }
  }, full ? "✕" : "⛶")), /*#__PURE__*/React.createElement("div", {
    className: "s3d-hint",
    "aria-hidden": "true"
  }, fixedView ? full ? "click · zoom · esc to exit" : "click · zoom · ⛶ fullscreen" : full ? "drag · zoom · click · esc to exit" : "drag · zoom · click · ⛶ fullscreen"), overlay);
}
Object.assign(window, {
  Scene3D: Scene3D,
  qgaWebGLAvailable: qgaWebGLAvailable,
  qgaGlowTexture: qgaGlowTexture,
  qgaMakeComposer: qgaMakeComposer,
  qgaBloomAvailable: qgaBloomAvailable,
  s3dGlow: s3dGlow,
  s3dLine: s3dLine,
  s3dGrid: s3dGrid,
  s3dDispose: s3dDispose
});
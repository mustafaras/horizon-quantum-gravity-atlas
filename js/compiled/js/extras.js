/* Compiled from js/extras.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// extras.jsx — Overview, Glossary, References, Open Problems

/* Deterministic scientific hero: a live "energy ladder" spanning 60 decades,
   from the largest cosmic structures to the Planck length. Pure canvas reads
   its x-positions from real exponents; motion (drift + probe pulse) is gated
   by prefers-reduced-motion and the atlas motion setting. No randomness:
   every render is bit-identical for a given frame index. */
var OVERVIEW_LADDER = [{
  e: 27,
  label: "observable universe",
  tag: "horizon ≃ 93 Gly"
}, {
  e: 21,
  label: "galactic voids",
  tag: "Laniakea scale"
}, {
  e: 16,
  label: "stellar system",
  tag: "Neptune orbit"
}, {
  e: 9,
  label: "human",
  tag: "1.7 m"
}, {
  e: 6,
  label: "cell nucleus",
  tag: "optics fails"
}, {
  e: -9,
  label: "atom",
  tag: "Bohr radius"
}, {
  e: -12,
  label: "proton",
  tag: "LHC resolves"
}, {
  e: -15,
  label: "electroweak",
  tag: "W, Z probes"
}, {
  e: -18,
  label: "collider frontier",
  tag: "14 TeV → ħc/E"
}, {
  e: -35,
  label: "Planck length",
  tag: "quantum gravity"
}];
var OVERVIEW_L_MIN = -35,
  OVERVIEW_L_MAX = 27;
function OverviewEnergyLadder() {
  var prm = usePRM();
  var _useAtlasSettings = useAtlasSettings(),
    motion = _useAtlasSettings.motion;
  var ref = useRef(null);
  var motionRef = useRef(0);
  var tRef = useRef(0);
  useEffect(function () {
    var cv = ref.current;
    if (!cv) return undefined;
    var drift = prm ? 0 : motion === "full" ? 1 : 0.45;
    motionRef.current = drift;
    var raf;
    var alive = true;
    var last = performance.now();
    var _draw = function draw(now) {
      if (!alive) return;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tRef.current += dt * motionRef.current;
      var t = tRef.current;
      var _fitCanvas = fitCanvas(cv),
        ctx = _fitCanvas.ctx,
        w = _fitCanvas.w,
        h = _fitCanvas.h;
      var xOf = function xOf(e) {
        return 40 + (e - OVERVIEW_L_MIN) / (OVERVIEW_L_MAX - OVERVIEW_L_MIN) * (w - 80);
      };
      var midY = h * 0.52;
      ctx.clearRect(0, 0, w, h);
      // decade ticks: 62 decades, minor labels every 10
      ctx.font = QGA_TOKENS.monoPx(10);
      for (var e = Math.ceil(OVERVIEW_L_MIN / 5) * 5; e <= OVERVIEW_L_MAX; e += 5) {
        var x = xOf(e);
        var major = e % 10 === 0;
        ctx.strokeStyle = major ? QGA_TOKENS.alpha("pigment-blue-75-c08", 0.3) : QGA_TOKENS.alpha("pigment-blue-75-c08", 0.12);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, midY - (major ? 15 : 8));
        ctx.lineTo(x, midY + (major ? 15 : 8));
        ctx.stroke();
        if (major && e >= -30) {
          ctx.fillStyle = QGA_TOKENS.alpha("ink-dim", 0.85);
          ctx.fillText("10" + supScript(e) + " m", x - 14, midY + 32);
        }
      }
      // the axis itself
      var grad = ctx.createLinearGradient(40, 0, w - 40, 0);
      grad.addColorStop(0, QGA_TOKENS.alpha("accent-2", 0.55));
      grad.addColorStop(0.55, QGA_TOKENS.alpha("accent", 0.55));
      grad.addColorStop(1, QGA_TOKENS.alpha("pigment-orange-75", 0.55));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(40, midY);
      ctx.lineTo(w - 40, midY);
      ctx.stroke();
      // ladder stops with a slow, deterministic probe sweep
      var sweep = Math.sin(t * 0.55);
      OVERVIEW_LADDER.forEach(function (stop, i) {
        var x = xOf(stop.e);
        var phase = Math.sin(t * 0.9 - i * 0.7);
        var lift = (motionRef.current > 0 ? phase * 3.2 : 0) - 12;
        var near = Math.max(0, 1 - Math.abs(sweep * (w - 80) * 0.5 + 20 - (x - 40)) / 140);
        var y = midY + lift;
        var hot = 0.55 + 0.45 * near;
        ctx.beginPath();
        ctx.arc(x, y, 3.1 + 1.1 * near, 0, Math.PI * 2);
        ctx.fillStyle = stop.e === -35 ? QGA_TOKENS.alpha("signal-danger", hot.toFixed(3)) : QGA_TOKENS.alpha("accent", hot.toFixed(3));
        ctx.fill();
        if (stop.e === -35 || stop.e === 27) {
          ctx.strokeStyle = QGA_TOKENS.alpha("signal-danger", 0.4);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 7.5 + 2.5 * near, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = near > 0.45 ? QGA_TOKENS.css("ink-strong") : QGA_TOKENS.alpha("ink", 0.85);
        ctx.font = QGA_TOKENS.headPx(10.5, 600);
        ctx.textAlign = "center";
        ctx.fillText(stop.label, x, y - 9);
        // alternating leader lines below the axis
        var below = i % 2 === 0;
        ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.34);
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (below) {
          ctx.moveTo(x, y + 5);
          ctx.lineTo(x, midY - 4);
        } else {
          ctx.moveTo(x, y + 5);
          ctx.lineTo(x, midY + 18);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, midY - (i % 2 === 0 ? 0 : 0), 0, 0, Math.PI * 2);
        ctx.stroke();
        if (below) {
          ctx.fillStyle = QGA_TOKENS.alpha("accent-2", 0.75);
          ctx.font = QGA_TOKENS.monoPx(10);
          ctx.fillText(stop.tag, x, y + 15);
        } else {
          ctx.fillStyle = QGA_TOKENS.alpha("accent-2", 0.75);
          ctx.font = QGA_TOKENS.monoPx(10);
          ctx.fillText(stop.tag, x, y - 22);
        }
        ctx.textAlign = "start";
      });
      raf = requestAnimationFrame(_draw);
    };
    raf = requestAnimationFrame(_draw);
    return function () {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [prm, motion]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    className: "ov-ladder-canvas",
    style: {
      width: "100%",
      height: 190
    },
    "aria-label": "Logarithmic length scale ladder from the observable universe to the Planck length, sixty orders of magnitude"
  });
}

/* ---------- 3D "Arena of Scales" premium hero ---------- */
// Exponent → scene z along a straight luminous corridor: Planck at the deep
// end (z = 0), the observable-universe horizon at the far end (z = +RAMP_LEN).
// The mapping is the scientific content — distance in the scene IS Δlog₁₀ l.
var ARENA_RAMP_LEN = 44;
var ARENA_SPAN = OVERVIEW_L_MAX - OVERVIEW_L_MIN; // 62 decades walked + 1 gate each
var arenaZ = function arenaZ(e) {
  return (e - OVERVIEW_L_MIN) / (OVERVIEW_L_MAX - OVERVIEW_L_MIN) * ARENA_RAMP_LEN;
};
var ARENA_COLORS = {
  cosmic: QGA_TOKENS.hex("accent"),
  human: QGA_TOKENS.hex("accent-2"),
  quantum: QGA_TOKENS.hex("pigment-orange-88-c10"),
  planck: QGA_TOKENS.hex("signal-danger")
};
function OverviewArena3D() {
  var _useState = useState(null),
    _useState2 = _slicedToArray(_useState, 2),
    focus = _useState2[0],
    setFocus = _useState2[1];
  var focusRef = useRef(null);
  focusRef.current = focus;
  var rng = window.QGA_PHYSICS && window.QGA_PHYSICS.seededRng ? window.QGA_PHYSICS.seededRng(42) : function () {
    return 0.5;
  };
  var build = function build(ctx) {
    var THREE = ctx.THREE,
      scene = ctx.scene;
    scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-11-c02-h261"), 0.0042);
    scene.add(new THREE.AmbientLight(QGA_TOKENS.hex("pigment-blue-71-c06-h263"), 0.5));
    var key = new THREE.DirectionalLight(QGA_TOKENS.hex("pigment-blue-89-c05"), 0.7);
    key.position.set(10, 26, -18);
    scene.add(key);
    var det = ctx.settings.current.detail3d;
    var dustN = det === "low" ? 240 : 640;
    var disposables = [];
    var track = function track(obj) {
      disposables.push(obj);
      return obj;
    };
    // Shared materials only: every per-frame animation is an object transform,
    // so materialSignature stays constant and the prewarm/change loop terminates
    // instead of rebuilding the shader graph every frame.
    var classMat = {
      cosmic: track(new THREE.MeshBasicMaterial({
        color: ARENA_COLORS.cosmic,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })),
      human: track(new THREE.MeshBasicMaterial({
        color: ARENA_COLORS.human,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })),
      quantum: track(new THREE.MeshBasicMaterial({
        color: ARENA_COLORS.quantum,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })),
      planck: track(new THREE.MeshBasicMaterial({
        color: ARENA_COLORS.planck,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }))
    };
    var glowMat = {
      cosmic: track(new THREE.SpriteMaterial({
        map: qgaGlowTexture(),
        color: ARENA_COLORS.cosmic,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })),
      human: track(new THREE.SpriteMaterial({
        map: qgaGlowTexture(),
        color: ARENA_COLORS.human,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })),
      quantum: track(new THREE.SpriteMaterial({
        map: qgaGlowTexture(),
        color: ARENA_COLORS.quantum,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })),
      planck: track(new THREE.SpriteMaterial({
        map: qgaGlowTexture(),
        color: ARENA_COLORS.planck,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }))
    };
    var classOf = function classOf(stop) {
      return stop.e === -35 ? "planck" : stop.e < 0 ? "quantum" : stop.e <= 16 ? "human" : "cosmic";
    };
    var hoopGeo = track(new THREE.TorusGeometry(4.2, 0.085, 10, det === "low" ? 32 : 72));
    var coreGeo = track(new THREE.SphereGeometry(0.16, 12, 10));
    var coreMat = track(new THREE.MeshBasicMaterial({
      color: QGA_TOKENS.hex("pigment-white")
    }));

    // ---------- seeded drifting dust (deterministic layout) ----------
    var dustGeo = track(new THREE.BufferGeometry());
    var dustPos = new Float32Array(dustN * 3);
    var dustSeed = new Float32Array(dustN);
    for (var i = 0; i < dustN; i++) {
      var jitter = 8 + rng() * 5;
      dustPos[i * 3] = (rng() * 2 - 1) * jitter;
      dustPos[i * 3 + 1] = rng() * 8.4;
      dustPos[i * 3 + 2] = rng() * (ARENA_RAMP_LEN + 14) - 8;
      dustSeed[i] = rng() * Math.PI * 2;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    var dust = new THREE.Points(dustGeo, track(new THREE.PointsMaterial({
      size: 0.55,
      map: qgaGlowTexture(),
      color: QGA_TOKENS.hex("pigment-blue-86-c07"),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })));
    scene.add(ctx.tag(dust, "decoration"));

    // ---------- corridor: floor panel + grid, rails and ticks merged ----------
    var floor = new THREE.Mesh(track(new THREE.PlaneGeometry(16, ARENA_RAMP_LEN + 10)), track(new THREE.MeshBasicMaterial({
      color: QGA_TOKENS.hex("pigment-blue-19"),
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    })));
    floor.geometry.rotateX(-Math.PI / 2);
    floor.position.set(0, -0.02, ARENA_RAMP_LEN / 2 - 6);
    floor.renderOrder = -3;
    scene.add(ctx.tag(floor, "decoration"));
    var grid = ctx.grid(16, 16, QGA_TOKENS.hex("pigment-blue-35"), 0.16);
    grid.geometry.rotateX(-Math.PI / 2);
    grid.position.set(0, 0.01, ARENA_RAMP_LEN / 2 - 6);
    grid.renderOrder = -2;
    scene.add(grid);
    var railPts = [];
    var railColors = [];
    var pushSeg = function pushSeg(x1, z1, x2, z2, color) {
      railPts.push(x1, 0.04, z1, x2, 0.04, z2);
      railColors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    };
    var cRail = new THREE.Color(QGA_TOKENS.hex("pigment-blue-47-c09")),
      cTick = new THREE.Color(QGA_TOKENS.hex("pigment-blue-35")),
      cMajor = new THREE.Color(QGA_TOKENS.hex("pigment-blue-60"));
    pushSeg(-6.2, -5, -6.2, ARENA_RAMP_LEN + 3, cRail);
    pushSeg(6.2, -5, 6.2, ARENA_RAMP_LEN + 3, cRail);
    for (var e = Math.ceil(OVERVIEW_L_MIN / 5) * 5; e <= OVERVIEW_L_MAX; e += 5) {
      var z = arenaZ(e);
      pushSeg(-6.2, z, 6.2, z, e % 10 === 0 ? cMajor : cTick);
    }
    scene.add(ctx.engraved.segments(railPts, {
      colors: new Float32Array(railColors),
      opacity: 0.55,
      widthPx: ctx.engraved.WIDTH_PX.hairline,
      layer: "decoration"
    }));

    // ---------- gates: one per scale stop ----------
    var gates = [];
    var _loop = function _loop(_i) {
      var stop = OVERVIEW_LADDER[_i];
      var cls = classOf(stop);
      var z = arenaZ(stop.e);
      var hoop = new THREE.Mesh(hoopGeo, classMat[cls]);
      hoop.position.set(0, 4.2, z);
      if (cls === "planck") hoop.scale.setScalar(1.06);
      scene.add(ctx.tag(hoop, "model"));
      var core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0, 4.2, z);
      core.userData = {
        gateIndex: _i
      };
      scene.add(ctx.tag(core, "model"));
      var glow = new THREE.Sprite(glowMat[cls]);
      glow.position.set(0, 4.2, z);
      glow.scale.setScalar(2.6 + (cls === "planck" ? 1.4 : 0));
      scene.add(ctx.tag(glow, "decoration"));
      gates.push({
        hoop: hoop,
        core: core,
        glow: glow,
        cls: cls,
        phase: _i * 0.61
      });
      ctx.label(stop.label, function () {
        return {
          x: 0,
          y: 6.7 + _i % 2 * 1.0,
          z: z
        };
      }, "s3d-strong");
      ctx.label("10" + supScript(stop.e) + " m", function () {
        return {
          x: 0,
          y: 0.7,
          z: z
        };
      }, "s3d-quiet");
      if (stop.tag) ctx.annotation(stop.tag, function () {
        return {
          x: 0,
          y: 5.15,
          z: z
        };
      });
    };
    for (var _i = 0; _i < OVERVIEW_LADDER.length; _i++) {
      _loop(_i);
    }

    // ---------- traveling probe pulse ----------
    var probe = new THREE.Sprite(glowMat.human);
    probe.scale.setScalar(2.0);
    probe.position.set(0, 4.2, ARENA_RAMP_LEN * 0.5);
    scene.add(ctx.tag(probe, "model"));

    // ---------- the Planck end-wall: where measurement ends ----------
    var wall = new THREE.Mesh(track(new THREE.CircleGeometry(4.6, 40)), track(new THREE.MeshBasicMaterial({
      color: QGA_TOKENS.hex("signal-danger"),
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })));
    wall.position.set(0, 4.2, -2.6);
    scene.add(ctx.tag(wall, "model"));
    ctx.annotation("measurement and geometry entangle — the Planck gate", function () {
      return {
        x: 0,
        y: 9.4,
        z: -2.6
      };
    });

    // ---------- per-frame: transforms only, never material mutations ----------
    return {
      dispose: function dispose() {
        for (var _i2 = 0, _disposables = disposables; _i2 < _disposables.length; _i2++) {
          var obj = _disposables[_i2];
          obj.dispose();
        }
      },
      pickables: gates.map(function (g) {
        return g.core;
      }),
      onPick: function onPick(obj) {
        if (obj && obj.userData && obj.userData.gateIndex != null) setFocus(OVERVIEW_LADDER[obj.userData.gateIndex]);
      },
      update: function update(t, dt) {
        var mo = ctx.motion();
        var wave = mo > 0 ? 1 : 0;
        // probe glides cosmic → Planck and back, one cosine period
        var cycle = t * 0.35 % 1;
        var eased = 0.5 - 0.5 * Math.cos(Math.PI * cycle);
        probe.position.set(0, 4.2, ARENA_RAMP_LEN * (1 - eased) + 0.6);
        probe.scale.setScalar(1.6 + 0.9 * Math.sin(t * 2.2) * wave + 0.9);
        for (var _i3 = 0, _gates = gates; _i3 < _gates.length; _i3++) {
          var gate = _gates[_i3];
          var s = 1 + 0.1 * Math.sin(t * 1.2 - gate.phase) * wave;
          gate.core.scale.setScalar(s);
          gate.glow.scale.setScalar((gate.cls === "planck" ? 2.4 : 1.5) * (1 + 0.18 * Math.sin(t * 1.1 - gate.phase) * wave));
          gate.hoop.rotation.set(Math.sin(t * 0.22 * wave + gate.phase) * 0.05, 0, Math.cos(t * 0.17 * wave + gate.phase) * 0.05);
        }
        wall.scale.setScalar(1 + 0.05 * Math.sin(t * 1.7) * (wave ? 1 : 0.35));
        if (mo > 0 && dt > 0) {
          var positions = dustGeo.attributes.position;
          for (var _i4 = 0; _i4 < dustN; _i4++) {
            var next = positions.getY(_i4) + dt * (0.35 + 0.3 * Math.sin(dustSeed[_i4]));
            positions.setY(_i4, next > 8.4 ? 0 : next);
          }
          positions.needsUpdate = true;
        }
      }
    };
  };
  var focused = focusRef.current;
  return /*#__PURE__*/React.createElement("div", {
    className: "ov-arena"
  }, /*#__PURE__*/React.createElement(Scene3D, {
    animated: true,
    height: 440,
    aria: "Three-dimensional corridor of decade gates from the observable universe down to the Planck length; click a glowing gate to focus its scale",
    initial: {
      fov: 55,
      radius: 30,
      theta: 0.32,
      phi: 0.95,
      target: [0, 2.0, ARENA_RAMP_LEN * 0.52],
      minR: 10,
      maxR: 60
    },
    build: build,
    fallback: /*#__PURE__*/React.createElement(OverviewEnergyLadder, null)
  }), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar viz-toolbar-bottom readout-grid",
    style: {
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "focused stop ", focus ? "" : "— click a gate"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value",
    style: {
      fontSize: 12.5
    }
  }, focus ? focus.label : "the corridor")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "exponent"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, "10", focus ? supScript(focus.e) : "·", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "m"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "meaning"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value",
    style: {
      fontSize: 12.5
    }
  }, focus ? focus.tag : "sixty decades, one map"))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "extras-scale-corridor",
    status: "schematic"
  }, "Distance in this corridor is logarithmic: every gate is a fixed ratio of ten in length. The probe travels from the cosmic horizon to the Planck gate, where probing would require a black hole \u2014 the atlas marks the frontier instead of crossing it."));
}

/* Live readouts computed in-page from the pure physics layer,
   window.QGA_PHYSICS (js/physics.mjs → js/science/). */
function OverviewPhysicsStrip() {
  var p = window.QGA_PHYSICS || {};
  var units = p.planckUnits ? p.planckUnits() : null;
  var items = units ? [{
    label: "Planck length",
    value: "1.616 × 10⁻³⁵ m",
    note: "where gravity quantizes"
  }, {
    label: "Planck energy",
    value: "1.2209 × 10¹⁹ GeV",
    note: "proton collider limit ≈ 14 × 10³ GeV"
  }, {
    label: "Mercury perihelion",
    value: "42.98″/century",
    note: "6πGM/c²a(1−e²), confirmed"
  }, {
    label: "1919 light deflection",
    value: "1.75″ at the limb",
    note: "4GM/c²b, twice Newton"
  }] : [];
  return /*#__PURE__*/React.createElement("div", {
    className: "ov-physics-strip"
  }, items.map(function (it) {
    return /*#__PURE__*/React.createElement("div", {
      key: it.label,
      className: "ov-physics-cell"
    }, /*#__PURE__*/React.createElement("div", {
      className: "readout-label"
    }, it.label), /*#__PURE__*/React.createElement("div", {
      className: "readout-value",
      style: {
        fontSize: 13.5
      }
    }, it.value), /*#__PURE__*/React.createElement("div", {
      className: "ov-physics-note"
    }, it.note));
  }));
}

/* Per-module scientific metadata so the module grid reads like a map of
   domains of validity, not a menu. Blurb text stays honest and short. */
var OVERVIEW_MODULE_META = {
  sm: {
    scale: "1–10 TeV",
    statusKind: "established",
    cue: "SU(3)×SU(2)×U(1)"
  },
  qft: {
    scale: "all E (effective)",
    statusKind: "established",
    cue: "ħ drives the path integral"
  },
  rg: {
    scale: "μ runs to 10¹⁹ GeV",
    statusKind: "established",
    cue: "β(g) flow"
  },
  gr: {
    scale: "weak field to horizons",
    statusKind: "established",
    cue: "g_μν geometry"
  },
  planck: {
    scale: "10¹⁹ GeV",
    statusKind: "open",
    cue: "16 empty decades"
  },
  approaches: {
    scale: "untested",
    statusKind: "conjectural",
    cue: "5 rival programs"
  },
  bh: {
    scale: "r₊ … ISCO",
    statusKind: "effective",
    cue: "S = k_B A/4"
  },
  exp: {
    scale: "GW: 10⁻²¹ strain",
    statusKind: "effective",
    cue: "GW150914 + collider"
  }
};

/* S29: the share of a chapter's figures per status, from the provenance registry rather than from a constant. A
   five-segment bar under the chapter number, with the counts beside it so colour never carries the answer alone. */
function ChapterStatusBar(_ref) {
  var id = _ref.id;
  var _useState3 = useState(0),
    _useState4 = _slicedToArray(_useState3, 2),
    theme = _useState4[0],
    setTheme = _useState4[1];
  useEffect(function () {
    return window.QGA_TOKENS.onThemeChange(function () {
      return setTheme(function (t) {
        return t + 1;
      });
    });
  }, []);
  var shares = useMemo(function () {
    var _M$chapterStatusShare;
    var M = window.QGA_ATLAS_MAP;
    var registry = window.QGA_PROVENANCE;
    return (_M$chapterStatusShare = M.chapterStatusShares(function (figureId) {
      var _registry$get$status, _registry$get;
      return (_registry$get$status = (_registry$get = registry.get(figureId)) === null || _registry$get === void 0 ? void 0 : _registry$get.status) !== null && _registry$get$status !== void 0 ? _registry$get$status : null;
    })[id]) !== null && _M$chapterStatusShare !== void 0 ? _M$chapterStatusShare : null;
  }, [id]);
  if (!shares || !shares.total) return null;
  var order = window.QGA_ATLAS_MAP.CHAPTER_STATUS_ORDER;
  void theme;
  return /*#__PURE__*/React.createElement("div", {
    className: "chapter-status-bar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "chapter-status-track",
    "aria-hidden": "true"
  }, order.map(function (status) {
    return shares.fractions[status] > 0 ? /*#__PURE__*/React.createElement("span", {
      key: status,
      style: {
        width: "".concat(shares.fractions[status] * 100, "%"),
        background: "var(--status-".concat(status, ")")
      }
    }) : null;
  })), /*#__PURE__*/React.createElement("span", {
    className: "chapter-status-label"
  }, shares.total, " figures \xB7 ", order.filter(function (s) {
    return shares.counts[s];
  }).map(function (s) {
    return "".concat(shares.counts[s], " ").concat(s);
  }).join(" · ")));
}
function ViewOverview(_ref2) {
  var go = _ref2.go;
  return /*#__PURE__*/React.createElement("article", {
    "data-screen-label": "Overview"
  }, /*#__PURE__*/React.createElement("header", {
    className: "ov-hero",
    "data-screen-label": "Overview"
  }, /*#__PURE__*/React.createElement("div", {
    className: "module-kicker",
    style: {
      fontSize: 12,
      letterSpacing: "0.34em"
    }
  }, "HORIZON \xB7 Quantum Gravity Atlas"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: "clamp(40px, 6.4vw, 76px)",
      lineHeight: 1.02,
      margin: "16px 0 18px 0",
      maxWidth: 900,
      letterSpacing: "-0.02em"
    }
  }, "From fields to geometry \u2014", /*#__PURE__*/React.createElement("br", null), "then past both."), /*#__PURE__*/React.createElement("p", {
    className: "module-lede",
    style: {
      fontSize: 19,
      maxWidth: 760
    }
  }, "A quantitative, interactive map of modern physics: eight modules sweep the sixty decades between the observable universe and the Planck length, each rendering computed live and labeled with what is", /*#__PURE__*/React.createElement("em", null, " established"), ", ", /*#__PURE__*/React.createElement("em", null, "effective"), ", or ", /*#__PURE__*/React.createElement("em", null, "conjectural"), ". Nothing here is shown as confirmed that is not."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 18,
      flexWrap: "wrap",
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "bridge-go",
    style: {
      fontSize: 14.5,
      padding: "13px 22px"
    },
    onClick: function onClick() {
      return go("sm");
    }
  }, "Begin \xB7 Module 01 \u2192"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      return go("bh");
    }
  }, "Jump to Black Holes"), /*#__PURE__*/React.createElement("span", {
    className: "mono dim",
    style: {
      fontSize: 11,
      letterSpacing: "0.14em"
    }
  }, "8 MODULES \xB7 INTERACTIVE 3D \xB7 LIVE FORMULAS")), /*#__PURE__*/React.createElement("div", {
    className: "ov-hero-ladder",
    style: {
      marginTop: 30
    }
  }, /*#__PURE__*/React.createElement(OverviewArena3D, null), /*#__PURE__*/React.createElement("div", {
    className: "ov-ladder-caption viz-caption",
    style: {
      borderTop: "none",
      padding: "2px 6px 10px 6px"
    }
  }, /*#__PURE__*/React.createElement("span", null, "fig. 1 \u2014 the arena: sixty decades walked, one gate per scale, from the cosmic horizon to the Planck gate"), /*#__PURE__*/React.createElement("span", {
    className: "mono dim"
  }, "drag to orbit \xB7 click a gate to focus"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    kind: "established"
  }), " ", /*#__PURE__*/React.createElement(Badge, {
    kind: "effective"
  }), " ", /*#__PURE__*/React.createElement(Badge, {
    kind: "conjectural"
  }), " ", /*#__PURE__*/React.createElement(Badge, {
    kind: "schematic"
  }), " ", /*#__PURE__*/React.createElement(Badge, {
    kind: "open"
  }))), /*#__PURE__*/React.createElement(OverviewPhysicsStrip, null), /*#__PURE__*/React.createElement(Section, {
    title: "The eight modules"
  }, /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, QGA_MODULES.map(function (m) {
    var meta = OVERVIEW_MODULE_META[m.id];
    return /*#__PURE__*/React.createElement("button", {
      key: m.id,
      className: "ov-card gauge-sector",
      style: {
        "--sector-color": "var(--accent)",
        position: "relative",
        overflow: "hidden"
      },
      onClick: function onClick() {
        return go(m.id);
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        position: "absolute",
        right: 10,
        top: -14,
        fontFamily: "var(--font-head)",
        fontSize: 64,
        fontWeight: 700,
        color: "var(--ink-strong)",
        opacity: 0.05,
        lineHeight: 1
      }
    }, m.num), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "gs-name",
      style: {
        color: "var(--accent)"
      }
    }, "Module ", m.num), /*#__PURE__*/React.createElement(Badge, {
      kind: meta.statusKind
    })), /*#__PURE__*/React.createElement("div", {
      className: "gs-group",
      style: {
        fontSize: 17,
        marginTop: 4
      }
    }, m.title), /*#__PURE__*/React.createElement(ChapterStatusBar, {
      id: m.id
    }), /*#__PURE__*/React.createElement("p", {
      className: "small dim",
      style: {
        margin: "8px 0 0 0"
      }
    }, MODULE_BLURBS[m.id]), /*#__PURE__*/React.createElement("div", {
      className: "ov-card-meta",
      style: {
        marginTop: 12,
        paddingTop: 10,
        borderTop: "1px solid var(--rule)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "ov-cue mono"
    }, meta.cue), /*#__PURE__*/React.createElement("span", {
      className: "ov-scale mono"
    }, meta.scale)));
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "A note on scientific honesty"
  }, /*#__PURE__*/React.createElement("p", null, "This atlas presents quantum gravity as it is: an unsolved research frontier. The Standard Model and general relativity are among the most precisely confirmed theories in science; their unification is not. Where the field is open, the interface says so. Where a visualization is heuristic, it is labeled. No approach is presented as confirmed, because none is."), /*#__PURE__*/React.createElement("div", {
    className: "panel"
  }, /*#__PURE__*/React.createElement(StatusLegend, null))), /*#__PURE__*/React.createElement(Section, {
    title: "The argument as a graph"
  }, /*#__PURE__*/React.createElement(AtlasMap, {
    go: go
  })));
}
var MODULE_BLURBS = {
  sm: "Seventeen fields, three forces, one symmetry principle. Interactive particle atlas and gauge structure.",
  qft: "Fields as fundamental objects. Excite a lattice field, build Feynman diagrams, read the path integral.",
  rg: "Local symmetry dictates interactions; couplings run with scale. One-loop RG flow simulator.",
  gr: "Gravity as geometry. Deform spacetime with mass, watch geodesics and light bending respond.",
  planck: "Where and why quantization of gravity fails: dimensional analysis, non-renormalizability, the scale ladder.",
  approaches: "Strings, loops, effective field theory, asymptotic safety, holography — compared honestly.",
  bh: "Black hole thermodynamics simulator, the information paradox, and boundary-bulk holography.",
  exp: "Collider events, gravitational waves, cosmology — what experiment does and does not constrain."
};
function ViewGlossary() {
  var _useState5 = useState(""),
    _useState6 = _slicedToArray(_useState5, 2),
    query = _useState6[0],
    setQuery = _useState6[1];
  var _useState7 = useState(null),
    _useState8 = _slicedToArray(_useState7, 2),
    open = _useState8[0],
    setOpen = _useState8[1];
  var q = query.toLowerCase();
  var items = QGA_GLOSSARY.filter(function (g) {
    return g.term.toLowerCase().includes(q) || richPlain(g.def).toLowerCase().includes(q) || richPlain(g.adv).toLowerCase().includes(q);
  });
  return /*#__PURE__*/React.createElement("article", {
    "data-screen-label": "Glossary"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("div", {
    className: "module-kicker"
  }, "Reference"), /*#__PURE__*/React.createElement("h1", null, "Interactive Glossary"), /*#__PURE__*/React.createElement("p", {
    className: "module-lede"
  }, "Concise and advanced definitions, with the most common misconception attached to each term.")), /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "Term index")), /*#__PURE__*/React.createElement("input", {
    className: "glossary-search",
    type: "search",
    placeholder: "Search terms \u2014 e.g. gauge, entropy, geodesic\u2026",
    value: query,
    onChange: function onChange(e) {
      return setQuery(e.target.value);
    },
    "aria-label": "Search glossary"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, items.map(function (g) {
    return /*#__PURE__*/React.createElement("div", {
      key: g.term,
      className: "gloss-item"
    }, /*#__PURE__*/React.createElement("button", {
      className: "gloss-head",
      onClick: function onClick() {
        return setOpen(open === g.term ? null : g.term);
      },
      "aria-expanded": open === g.term
    }, /*#__PURE__*/React.createElement("span", {
      className: "gloss-term"
    }, g.term), /*#__PURE__*/React.createElement("span", {
      className: "fc-hint"
    }, open === g.term ? "− close" : "+ expand")), /*#__PURE__*/React.createElement("div", {
      className: "gloss-body",
      style: {
        display: open === g.term ? "block" : "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "gloss-sub"
    }, "Definition"), /*#__PURE__*/React.createElement("p", {
      style: {
        marginBottom: 0
      }
    }, /*#__PURE__*/React.createElement(RichText, {
      text: g.def
    })), /*#__PURE__*/React.createElement("div", {
      className: "gloss-sub"
    }, "Advanced"), /*#__PURE__*/React.createElement("p", {
      style: {
        marginBottom: 0
      }
    }, /*#__PURE__*/React.createElement(RichText, {
      text: g.adv
    })), /*#__PURE__*/React.createElement("div", {
      className: "gloss-sub",
      style: {
        color: "var(--signal-warm)"
      }
    }, "Common misconception"), /*#__PURE__*/React.createElement("p", {
      style: {
        marginBottom: 0
      }
    }, /*#__PURE__*/React.createElement(RichText, {
      text: g.misc
    }))), open !== g.term ? /*#__PURE__*/React.createElement("div", {
      className: "gloss-body"
    }, /*#__PURE__*/React.createElement("p", {
      className: "dim small",
      style: {
        marginBottom: 0
      }
    }, /*#__PURE__*/React.createElement(RichText, {
      text: g.def
    }))) : null);
  }), items.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "dim"
  }, "No terms match \u201C", query, "\u201D.") : null)));
}
function ViewReferences() {
  var _useState9 = useState("all"),
    _useState0 = _slicedToArray(_useState9, 2),
    tag = _useState0[0],
    setTag = _useState0[1];
  var tags = ["all"].concat(_toConsumableArray(Array.from(new Set(QGA_REFERENCES.map(function (r) {
    return r.tag;
  })))));
  var items = QGA_REFERENCES.filter(function (r) {
    return tag === "all" || r.tag === tag;
  });
  return /*#__PURE__*/React.createElement("article", {
    "data-screen-label": "References"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("div", {
    className: "module-kicker"
  }, "Reference"), /*#__PURE__*/React.createElement("h1", null, "Scientific Bibliography"), /*#__PURE__*/React.createElement("p", {
    className: "module-lede"
  }, "Curated primary literature and standard graduate texts. All entries are well-established, verifiable publications; no citation here is fabricated. Module content paraphrases these sources at textbook level.")), /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "Curated entries")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, tags.map(function (tg) {
    return /*#__PURE__*/React.createElement("button", {
      key: tg,
      className: "btn" + (tag === tg ? " on primary" : ""),
      onClick: function onClick() {
        return setTag(tg);
      }
    }, tg);
  })), /*#__PURE__*/React.createElement("div", null, items.map(function (r, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "ref-item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "ref-num"
    }, "[", String(QGA_REFERENCES.indexOf(r) + 1).padStart(2, "0"), "]"), /*#__PURE__*/React.createElement("span", null, r.text, /*#__PURE__*/React.createElement("span", {
      className: "ref-tag"
    }, r.tag)));
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-head",
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("h2", null, "Reading path")), /*#__PURE__*/React.createElement("p", {
    className: "small dim"
  }, "Peskin & Schroeder (QFT) \u2192 Wald (GR) \u2192 Donoghue (EFT of gravity) \u2192 the 1973\u20131975 black hole thermodynamics papers \u2192 \u2019t Hooft / Susskind / Maldacena (holography), alongside Rovelli and Polchinski for the two largest research programs.")));
}
function ViewOpenProblems() {
  return /*#__PURE__*/React.createElement("article", {
    "data-screen-label": "Open Problems"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("div", {
    className: "module-kicker"
  }, "Limitations & frontiers"), /*#__PURE__*/React.createElement("h1", null, "Limitations and Open Problems"), /*#__PURE__*/React.createElement("p", {
    className: "module-lede"
  }, "Quantum gravity is an unsolved research frontier. This page collects what this atlas \u2014 and the field \u2014 cannot currently tell you, stated plainly.")), /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "Frontier problems")), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, QGA_OPEN_PROBLEMS.map(function (p) {
    return /*#__PURE__*/React.createElement("div", {
      key: p.title,
      className: "panel"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("h3", null, p.title), /*#__PURE__*/React.createElement(Badge, {
      kind: "open"
    })), /*#__PURE__*/React.createElement("p", {
      className: "small",
      style: {
        marginBottom: 0
      }
    }, /*#__PURE__*/React.createElement(RichText, {
      text: p.body
    })));
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "Limitations of this atlas"
  }, /*#__PURE__*/React.createElement("p", {
    className: "small"
  }, "The simulations here are pedagogical instruments, not research codes: lattice field dynamics, orbital mechanics, lensing, and waveform sketches are qualitatively faithful but numerically simplified, and each carries a status label. Masses and couplings are quoted to orientation precision; consult the Particle Data Group for current values. Visualizations of Planck-scale physics are necessarily speculative renderings of mathematics \u2014 treat every such image as a hypothesis about reality, not a photograph of it.")));
}
function ViewSymbols(_ref3) {
  var go = _ref3.go;
  var _useState1 = useState(""),
    _useState10 = _slicedToArray(_useState1, 2),
    query = _useState10[0],
    setQuery = _useState10[1];
  var _useState11 = useState("all"),
    _useState12 = _slicedToArray(_useState11, 2),
    cat = _useState12[0],
    setCat = _useState12[1];
  var cats = ["all"].concat(_toConsumableArray(Array.from(new Set(QGA_SYMBOLS.map(function (s) {
    return s.cat;
  })))));
  var catCount = function catCount(c) {
    return c === "all" ? QGA_SYMBOLS.length : QGA_SYMBOLS.filter(function (s) {
      return s.cat === c;
    }).length;
  };
  var q = query.trim().toLowerCase();
  var items = QGA_SYMBOLS.filter(function (s) {
    return (cat === "all" || s.cat === cat) && (q === "" || s.sym.toLowerCase().includes(q) || s.cat.toLowerCase().includes(q) || s.contexts.some(function (c) {
      return c.ctx.toLowerCase().includes(q) || richPlain(c.meaning).toLowerCase().includes(q) || c.unit.toLowerCase().includes(q);
    }));
  });
  var ctxCount = items.reduce(function (n, s) {
    return n + s.contexts.length;
  }, 0);
  var moduleShort = function moduleShort(id) {
    return (QGA_MODULES.find(function (m) {
      return m.id === id;
    }) || {})["short"] || id;
  };
  return /*#__PURE__*/React.createElement("article", {
    "data-screen-label": "Symbol Atlas"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("div", {
    className: "module-kicker"
  }, "Reference \xB7 Notation"), /*#__PURE__*/React.createElement("h1", null, "Symbol Atlas"), /*#__PURE__*/React.createElement("p", {
    className: "module-lede"
  }, "Every symbol the atlas uses \u2014 typeset exactly as it appears in the formulas, with its meaning, its unit, its home module, and the contexts where the same letter means something different. Notation is a convention, not a truth: this page makes ours explicit.")), /*#__PURE__*/React.createElement("div", {
    className: "section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("h2", null, "Symbol index")), /*#__PURE__*/React.createElement("div", {
    className: "sym-toolbar"
  }, /*#__PURE__*/React.createElement("input", {
    className: "glossary-search",
    type: "search",
    placeholder: "Search symbols \u2014 e.g. beta, coupling, kelvin\u2026",
    value: query,
    onChange: function onChange(e) {
      return setQuery(e.target.value);
    },
    "aria-label": "Search symbols"
  }), /*#__PURE__*/React.createElement("div", {
    className: "sym-chips",
    role: "group",
    "aria-label": "Filter symbols by category"
  }, cats.map(function (c) {
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      className: "sym-chip" + (cat === c ? " active" : ""),
      onClick: function onClick() {
        return setCat(c);
      },
      "aria-pressed": cat === c
    }, c === "all" ? "All categories" : c, /*#__PURE__*/React.createElement("span", {
      className: "sym-chip-count"
    }, catCount(c)));
  }))), /*#__PURE__*/React.createElement("p", {
    className: "dim small",
    style: {
      marginTop: 0
    }
  }, items.length, " of ", QGA_SYMBOLS.length, " symbols \xB7 ", ctxCount, " contexts \u2014 same letters, different physics."), /*#__PURE__*/React.createElement("div", {
    className: "sym-grid"
  }, items.map(function (s, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: s.sym,
      className: "sym-card",
      role: "group",
      "aria-label": "".concat(s.sym, " \u2014 ").concat(s.cat),
      style: {
        "--i": Math.min(i, 14)
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "sym-head"
    }, /*#__PURE__*/React.createElement("div", {
      className: "sym-glyph-tile",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: s.tex || s.sym
    })), /*#__PURE__*/React.createElement("div", {
      className: "sym-head-meta"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sym-cat"
    }, s.cat), /*#__PURE__*/React.createElement("span", {
      className: "sym-contexts-count"
    }, s.contexts.length, " context", s.contexts.length > 1 ? "s" : ""))), s.contexts.map(function (c, j) {
      return /*#__PURE__*/React.createElement("div", {
        key: j,
        className: "sym-ctx"
      }, /*#__PURE__*/React.createElement("div", {
        className: "sym-ctx-label"
      }, c.ctx), c.eq ? /*#__PURE__*/React.createElement("div", {
        className: "sym-eq"
      }, /*#__PURE__*/React.createElement(Eq, {
        tex: c.eq,
        display: true
      })) : null, /*#__PURE__*/React.createElement("p", {
        className: "sym-ctx-meaning"
      }, /*#__PURE__*/React.createElement(RichText, {
        text: c.meaning
      })), /*#__PURE__*/React.createElement("div", {
        className: "sym-ctx-meta"
      }, /*#__PURE__*/React.createElement("span", {
        className: "sym-unit"
      }, "[ " + c.unit + " ]"), c.module ? /*#__PURE__*/React.createElement("button", {
        className: "sym-module-chip",
        onClick: function onClick() {
          return go(c.module);
        },
        title: "Open " + moduleShort(c.module) + " module"
      }, "→ " + moduleShort(c.module)) : null));
    }));
  }), items.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "dim"
  }, "No symbols match \u201C", query, "\u201D.") : null), /*#__PURE__*/React.createElement("div", {
    className: "panel sym-conv-panel"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "gloss-sub sym-conv-head"
  }, "Conventions used throughout the atlas"), /*#__PURE__*/React.createElement("div", {
    className: "sym-conv-grid"
  }, QGA_CONVENTIONS.map(function (c, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: c.title,
      className: "sym-conv",
      style: {
        "--i": i
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "sym-conv-title"
    }, c.title), c.tex ? /*#__PURE__*/React.createElement("div", {
      className: "sym-eq sym-conv-eq"
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: c.tex,
      display: true
    })) : null, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(RichText, {
      text: c.body
    })));
  })))));
}

/* ---------- Whitepaper · in-app companion document ---------- */
function PaperEq(_ref4) {
  var tex = _ref4.tex,
    note = _ref4.note;
  return /*#__PURE__*/React.createElement("figure", {
    className: "paper-eq"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-eq-body"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: tex,
    display: true
  })), note ? /*#__PURE__*/React.createElement("figcaption", {
    className: "paper-eq-note"
  }, note) : null);
}
function PaperNote(_ref5) {
  var _ref5$kind = _ref5.kind,
    kind = _ref5$kind === void 0 ? "note" : _ref5$kind,
    title = _ref5.title,
    children = _ref5.children;
  return /*#__PURE__*/React.createElement("aside", {
    className: "paper-note paper-note-" + kind
  }, title ? /*#__PURE__*/React.createElement("div", {
    className: "paper-note-title"
  }, title) : null, /*#__PURE__*/React.createElement("div", {
    className: "paper-note-body"
  }, children));
}
function PaperSection(_ref6) {
  var id = _ref6.id,
    index = _ref6.index,
    title = _ref6.title,
    children = _ref6.children;
  return /*#__PURE__*/React.createElement("section", {
    className: "section paper-section",
    id: "paper-" + id
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, index ? /*#__PURE__*/React.createElement("span", {
    className: "section-index"
  }, index) : null, /*#__PURE__*/React.createElement("h2", null, title)), children);
}
function PaperSub(_ref7) {
  var index = _ref7.index,
    title = _ref7.title,
    children = _ref7.children;
  return /*#__PURE__*/React.createElement("div", {
    className: "paper-sub"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "paper-sub-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "paper-sub-num"
  }, index), " ", title), children);
}

// Backticks in the generated paragraphs mark code, as they do in docs/whitepaper.md.
function PaperCodeText(_ref8) {
  var text = _ref8.text;
  return text.split("`").map(function (part, i) {
    return i % 2 ? /*#__PURE__*/React.createElement("span", {
      key: i,
      className: "mono"
    }, part) : /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, part);
  });
}

// S35: the version-2 section, rendered from the data scripts/build-whitepaper.mjs generates from the ledger, the
// provenance registry and Formula Core (js/whitepaper/), the same data that writes the block in docs/whitepaper.md.
function PaperV2() {
  var v2 = window.QGA_WHITEPAPER;
  if (!v2) return null;
  return /*#__PURE__*/React.createElement(PaperSection, {
    id: v2.id,
    index: v2.index,
    title: v2.title
  }, /*#__PURE__*/React.createElement("p", null, v2.intro), v2.sections.map(function (s) {
    return /*#__PURE__*/React.createElement(PaperSub, {
      key: s.id,
      index: s.index,
      title: s.title
    }, s.paragraphs.map(function (p, i) {
      return /*#__PURE__*/React.createElement("p", {
        key: i
      }, /*#__PURE__*/React.createElement(PaperCodeText, {
        text: p
      }));
    }));
  }), /*#__PURE__*/React.createElement("div", {
    className: "paper-record"
  }, v2.record.prompts.map(function (p) {
    return /*#__PURE__*/React.createElement("details", {
      key: p.id,
      className: "paper-record-prompt"
    }, /*#__PURE__*/React.createElement("summary", null, /*#__PURE__*/React.createElement("span", {
      className: "mono"
    }, p.id), " ", p.title, " \xB7 ", p.measurements.length), p.measurements.length ? /*#__PURE__*/React.createElement("ul", {
      className: "paper-list"
    }, p.measurements.map(function (m, i) {
      return /*#__PURE__*/React.createElement("li", {
        key: i
      }, m);
    })) : /*#__PURE__*/React.createElement("p", {
      className: "dim"
    }, "no measurement recorded"));
  })));
}
var PAPER_TOC = [["intro", "1", "Introduction"], ["epistemic", "2", "Epistemic framework"], ["chain", "3", "The chain of reasoning"], ["design", "4", "Design methodology"], ["architecture", "5", "Software architecture"], ["verification", "6", "Verification and validation"], ["limits", "7", "Limitations"], ["conclusion", "8", "Conclusion"], ["v2", "9", "Version 2 and verification record"], ["spine", "A", "Formulation spine"], ["refs", "R", "References"]];
var PAPER_STATUSES = [["established", "Experimentally confirmed, or a measurement-grade theory.", "QFT as the framework of the Standard Model; classical general relativity; the Higgs boson; GW150914; the M87* horizon-scale image."], ["effective", "Rigorous within a stated energy or coupling domain, with known limits.", "Low-energy quantum gravity as an effective field theory; the one-loop running of the QED and QCD couplings."], ["schematic", "A deliberately simplified illustration — not a measurement.", "The collider event display; the Planck-foam scene; the scattering-plane animation."], ["conjectural", "A mathematically serious research program, experimentally unconfirmed.", "String theory; loop quantum gravity; asymptotic safety; causal sets; holography."], ["open", "No confirmed answer exists.", "The information paradox; the ultraviolet completion of quantum gravity."]];
var PAPER_REFS = ["A. Einstein, “Die Feldgleichungen der Gravitation,” Sitzungsberichte der Preussischen Akademie der Wissenschaften, 1915.", "P. A. M. Dirac, “The Quantum Theory of the Electron,” Proceedings of the Royal Society A, 1928.", "R. P. Feynman, “Space-Time Approach to Non-Relativistic Quantum Mechanics,” Reviews of Modern Physics, 1948.", "C. N. Yang and R. L. Mills, “Conservation of Isotopic Spin and Isotopic Gauge Invariance,” Physical Review, 1954.", "S. Weinberg, “A Model of Leptons,” Physical Review Letters, 1967.", "D. J. Gross and F. Wilczek, “Ultraviolet Behavior of Non-Abelian Gauge Theories,” Physical Review Letters, 1973.", "H. D. Politzer, “Reliable Perturbative Results for Strong Interactions?,” Physical Review Letters, 1973.", "J. D. Bekenstein, “Black Holes and Entropy,” Physical Review D, 1973.", "S. W. Hawking, “Particle Creation by Black Holes,” Communications in Mathematical Physics, 1975.", "G. ’t Hooft and M. Veltman, “One-loop divergencies in the theory of gravitation,” Annales de l’Institut Henri Poincaré A, 1974.", "S. Weinberg, “Ultraviolet divergences in quantum theories of gravitation,” in General Relativity: An Einstein Centenary Survey, 1979.", "M. H. Goroff and A. Sagnotti, “The ultraviolet behavior of Einstein gravity,” Nuclear Physics B, 1986.", "A. Ashtekar, “New Variables for Classical and Quantum Gravity,” Physical Review Letters, 1986.", "G. ’t Hooft, “Dimensional Reduction in Quantum Gravity,” arXiv:gr-qc/9310026, 1993.", "L. Susskind, “The World as a Hologram,” Journal of Mathematical Physics, 1995.", "A. Strominger and C. Vafa, “Microscopic Origin of the Bekenstein-Hawking Entropy,” Physics Letters B, 1996.", "J. Maldacena, “The Large N Limit of Superconformal Field Theories and Supergravity,” Advances in Theoretical and Mathematical Physics, 1998.", "J. F. Donoghue, “General relativity as an effective field theory: The leading quantum corrections,” Physical Review D, 1994.", "S. Ryu and T. Takayanagi, “Holographic Derivation of Entanglement Entropy from AdS/CFT,” Physical Review Letters, 2006.", "ATLAS and CMS Collaborations, Higgs boson discovery papers, Physics Letters B, 2012.", "LIGO Scientific and Virgo Collaborations, “Observation of Gravitational Waves from a Binary Black Hole Merger,” Physical Review Letters, 2016.", "Event Horizon Telescope Collaboration, “First M87 Event Horizon Telescope Results,” Astrophysical Journal Letters, 2019.", "G. Penington, “Entanglement Wedge Reconstruction and the Information Paradox,” JHEP, 2020.", "A. Almheiri, N. Engelhardt, D. Marolf, and H. Maxfield, “The entropy of bulk quantum fields and the entanglement wedge of an evaporating black hole,” JHEP, 2019.", "M. E. Peskin and D. V. Schroeder, An Introduction to Quantum Field Theory, 1995.", "S. Weinberg, The Quantum Theory of Fields, Vols. I–II, 1995–1996.", "C. W. Misner, K. S. Thorne, and J. A. Wheeler, Gravitation, 1973.", "R. M. Wald, General Relativity, 1984.", "J. Polchinski, String Theory, Vols. I–II, 1998.", "C. Rovelli, Quantum Gravity, 2004.", "M. Gell-Mann and F. E. Low, “Quantum Electrodynamics at Small Distances,” Physical Review 95, 1300–1312 (1954).", "M. Reuter, “Nonperturbative Evolution Equation for Quantum Gravity,” Physical Review D 57, 971–985 (1998)."];
function ViewWhitepaper() {
  var jump = function jump(id) {
    var el = document.getElementById("paper-" + id);
    if (el) el.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };
  return /*#__PURE__*/React.createElement("article", {
    "data-screen-label": "Whitepaper",
    className: "paper-doc"
  }, /*#__PURE__*/React.createElement("header", {
    className: "paper-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "module-kicker",
    style: {
      fontSize: 12,
      letterSpacing: "0.34em"
    }
  }, "HORIZON \xB7 Companion document"), /*#__PURE__*/React.createElement("h1", {
    className: "paper-title"
  }, "A Quantum Gravity Atlas"), /*#__PURE__*/React.createElement("p", {
    className: "paper-subtitle"
  }, "An epistemically labeled, interactive atlas of the quantum-gravity problem"), /*#__PURE__*/React.createElement("div", {
    className: "paper-meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-meta-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "paper-meta-k"
  }, "Artifact"), /*#__PURE__*/React.createElement("span", {
    className: "paper-meta-v"
  }, "Interactive static web atlas \xB7 14 views \xB7 8 physics modules")), /*#__PURE__*/React.createElement("div", {
    className: "paper-meta-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "paper-meta-k"
  }, "Access"), /*#__PURE__*/React.createElement("span", {
    className: "paper-meta-v"
  }, "mustafaras.github.io/horizon-quantum-gravity-atlas")), /*#__PURE__*/React.createElement("div", {
    className: "paper-meta-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "paper-meta-k"
  }, "License"), /*#__PURE__*/React.createElement("span", {
    className: "paper-meta-v"
  }, "MIT \xB7 citation via CITATION.cff (CFF 1.2.0)"))), /*#__PURE__*/React.createElement("div", {
    className: "paper-badges"
  }, /*#__PURE__*/React.createElement(Badge, {
    kind: "established"
  }), " ", /*#__PURE__*/React.createElement(Badge, {
    kind: "effective"
  }), " ", /*#__PURE__*/React.createElement(Badge, {
    kind: "schematic"
  }), " ", /*#__PURE__*/React.createElement(Badge, {
    kind: "conjectural"
  }), " ", /*#__PURE__*/React.createElement(Badge, {
    kind: "open"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "paper-abstract"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-abstract-label"
  }, "Abstract"), /*#__PURE__*/React.createElement("p", null, "Quantum gravity is not a single missing equation but a collision between two extraordinarily successful frameworks, and communicating that collision honestly is a persistent failure point of public physics media: speculation is routinely blended with established result. This document describes ", /*#__PURE__*/React.createElement("strong", null, "HORIZON"), ", an interactive atlas that maps ", /*#__PURE__*/React.createElement("em", null, "why the problem of quantum gravity exists"), " \u2014 from the experimentally established core, through the formal machinery of quantum field theory and general relativity, to the point where the two frameworks conflict and the major research programs diverge. The atlas enforces a single central rule: ", /*#__PURE__*/React.createElement("em", null, "a visualization may be cinematic, but the epistemic status of the physics must remain explicit."), "Every panel carries one of five machine-consistent status labels, and every equation is treated as an interface object paired with symbol definitions, meaning, and limitations. We describe the epistemic framework, the chain of physical reasoning, the design methodology, the zero-build software architecture, and the verification infrastructure: literature-anchored unit tests, a manifest-driven browser QA harness with per-capture justified visual tolerances, and deterministic offline fixtures for real-data network phases. The atlas does not claim that quantum gravity has been solved; it claims something more defensible \u2014 that the boundary between what is known, what is effective, and what is conjectured can itself be made a first-class object of interactive study.")), /*#__PURE__*/React.createElement("nav", {
    className: "paper-toc",
    "aria-label": "Whitepaper contents"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-toc-label"
  }, "Contents"), /*#__PURE__*/React.createElement("div", {
    className: "paper-toc-grid"
  }, PAPER_TOC.map(function (_ref9) {
    var _ref0 = _slicedToArray(_ref9, 3),
      id = _ref0[0],
      num = _ref0[1],
      title = _ref0[2];
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      className: "paper-toc-item",
      onClick: function onClick() {
        return jump(id);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "paper-toc-num"
    }, num), /*#__PURE__*/React.createElement("span", {
      className: "paper-toc-title"
    }, title));
  }))), /*#__PURE__*/React.createElement(PaperSection, {
    id: "intro",
    index: "1",
    title: "Introduction"
  }, /*#__PURE__*/React.createElement(PaperSub, {
    index: "1.1",
    title: "The pedagogical problem"
  }, /*#__PURE__*/React.createElement("p", null, "The quantum-gravity problem is unusually badly served by popular science communication. Three failure modes recur, and the atlas is built against all three."), /*#__PURE__*/React.createElement("ol", {
    className: "paper-list"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "Blending."), " Speculative frameworks are presented alongside established physics without epistemic distinction, so a reader cannot tell where experiment ends and conjecture begins."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "Equation avoidance."), " The mathematics that makes the problem ", /*#__PURE__*/React.createElement("em", null, "quantitative"), " \u2014 the negative mass dimension of Newton\u2019s constant, the power-law growth of the gravitational coupling \u2014 is replaced by metaphor, precisely where metaphor is least trustworthy."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("strong", null, "False closure."), " Research programs are presented as competing answers rather than as serious, unresolved research agendas.")), /*#__PURE__*/React.createElement("p", null, "HORIZON is an ", /*#__PURE__*/React.createElement("em", null, "atlas"), " in the cartographic sense: it does not argue for a destination, it maps the terrain, marks the borders of the known, and labels the unexplored regions as unexplored.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "1.2",
    title: "What the atlas is"
  }, /*#__PURE__*/React.createElement("p", null, "HORIZON is a static, zero-build web application of fourteen views: eight physics modules (Standard Model, quantum field theory, gauge symmetry and renormalization-group flow, general relativity, the Planck frontier, a theory comparator, black holes, and experiment), plus reference and laboratory surfaces \u2014 a Kerr observatory, a gravitational-wave theatre with a bounded real-data mode, a causal spacetime laboratory, an RG-flow landscape, a Symbol Atlas of 27 symbols across 33 contexts, and this document. It runs from a plain local HTTP server with no backend and no build step, yet presents itself as a research-grade instrument rather than a web demo.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "1.3",
    title: "Contributions"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "paper-list"
  }, /*#__PURE__*/React.createElement("li", null, "an ", /*#__PURE__*/React.createElement("strong", null, "epistemic labeling system"), " (\xA72) that classifies every claim into five statuses and is enforced consistently across UI, README, and tests;"), /*#__PURE__*/React.createElement("li", null, "a ", /*#__PURE__*/React.createElement("strong", null, "chain of reasoning"), " (\xA73) that leads from established physics to the open problem without an unmotivated leap;"), /*#__PURE__*/React.createElement("li", null, "a ", /*#__PURE__*/React.createElement("strong", null, "design methodology"), " (\xA74) in which equations are interface objects and interactivity carries interpretation;"), /*#__PURE__*/React.createElement("li", null, "a ", /*#__PURE__*/React.createElement("strong", null, "zero-build architecture"), " (\xA75) chosen for archival stability and reproducibility;"), /*#__PURE__*/React.createElement("li", null, "a ", /*#__PURE__*/React.createElement("strong", null, "verification infrastructure"), " (\xA76) that anchors the implemented physics to literature values and pins the visual output with justified tolerances;"), /*#__PURE__*/React.createElement("li", null, "a ", /*#__PURE__*/React.createElement("strong", null, "formulation spine"), " (Appendix A) collecting the equations the atlas actually implements.")))), /*#__PURE__*/React.createElement(PaperSection, {
    id: "epistemic",
    index: "2",
    title: "Epistemic framework"
  }, /*#__PURE__*/React.createElement(PaperSub, {
    index: "2.1",
    title: "The five status labels"
  }, /*#__PURE__*/React.createElement("p", null, "Every major panel carries exactly one of five labels, ordered by evidential strength. The labels are not decorative: they are the same tokens the test suite and the capture manifest assert against."), /*#__PURE__*/React.createElement("div", {
    className: "paper-status-table"
  }, PAPER_STATUSES.map(function (_ref1) {
    var _ref10 = _slicedToArray(_ref1, 3),
      kind = _ref10[0],
      meaning = _ref10[1],
      example = _ref10[2];
    return /*#__PURE__*/React.createElement("div", {
      key: kind,
      className: "paper-status-row"
    }, /*#__PURE__*/React.createElement("div", {
      className: "paper-status-badge"
    }, /*#__PURE__*/React.createElement(Badge, {
      kind: kind
    })), /*#__PURE__*/React.createElement("div", {
      className: "paper-status-meaning"
    }, meaning), /*#__PURE__*/React.createElement("div", {
      className: "paper-status-example"
    }, example));
  }))), /*#__PURE__*/React.createElement(PaperSub, {
    index: "2.2",
    title: "Honesty rules"
  }, /*#__PURE__*/React.createElement("p", null, "The atlas states explicitly what it may and may not claim. It ", /*#__PURE__*/React.createElement("strong", null, "may"), " claim that quantum field theory and general relativity are the established frameworks of their domains; that low-energy quantum gravity is a valid effective field theory; that black-hole thermodynamics is a semiclassical theoretical landmark; and that collider and gravitational-wave observations constrain theory space."), /*#__PURE__*/React.createElement(PaperNote, {
    kind: "warn",
    title: "What the atlas must not claim"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "paper-list"
  }, /*#__PURE__*/React.createElement("li", null, "that a complete quantum-gravity theory is confirmed;"), /*#__PURE__*/React.createElement("li", null, "that Planck-scale discreteness is observed;"), /*#__PURE__*/React.createElement("li", null, "that Hawking radiation from astrophysical black holes has been directly detected;"), /*#__PURE__*/React.createElement("li", null, "that AdS/CFT is the proven description of our universe;"), /*#__PURE__*/React.createElement("li", null, "that a schematic 3D visualization is a literal measurement."))), /*#__PURE__*/React.createElement("p", null, "These rules are design inputs, not disclaimers appended after the fact. The strongest visual panels carry the strongest caveats: the Planck foam is labeled speculative, the collider display schematic, the holography panel conjectural."))), /*#__PURE__*/React.createElement(PaperSection, {
    id: "chain",
    index: "3",
    title: "The chain of reasoning"
  }, /*#__PURE__*/React.createElement("p", null, "The atlas leads a reader through a single continuous argument. Each step is either established physics or an explicitly labeled extrapolation."), /*#__PURE__*/React.createElement(PaperSub, {
    index: "3.1",
    title: "Two successful frameworks"
  }, /*#__PURE__*/React.createElement("p", null, "Quantum field theory describes fields on a spacetime ", /*#__PURE__*/React.createElement("em", null, "background"), ". General relativity says that background is itself ", /*#__PURE__*/React.createElement("em", null, "dynamical"), ". Both are extraordinarily successful in their domains \u2014 the tension is not philosophical decoration; it becomes quantitative the moment one tries to perturbatively quantize the Einstein\u2013Hilbert action."), /*#__PURE__*/React.createElement(PaperEq, {
    tex: "S_{\\mathrm{EH}} = \\frac{c^3}{16\\pi G}\\int d^4x\\,\\sqrt{-g}\\,(R - 2\\Lambda) + S_{\\mathrm{matter}}",
    note: "The Einstein\u2013Hilbert action: the object whose quantization is the problem."
  })), /*#__PURE__*/React.createElement(PaperSub, {
    index: "3.2",
    title: "Dimensional analysis and the failure of perturbation"
  }, /*#__PURE__*/React.createElement("p", null, "In four spacetime dimensions Newton\u2019s constant carries negative mass dimension. This single fact drives the whole story."), /*#__PURE__*/React.createElement(PaperEq, {
    tex: "[G_N] = -2 \\quad (\\text{in units where } \\hbar = c = 1)",
    note: "Negative mass dimension: the coupling is not dimensionless."
  }), /*#__PURE__*/React.createElement("p", null, "Consequently the effective dimensionless strength of gravity grows with energy as a ", /*#__PURE__*/React.createElement("em", null, "power law"), ", rather than logarithmically as in a renormalizable gauge theory:"), /*#__PURE__*/React.createElement(PaperEq, {
    tex: "\\alpha_{\\mathrm{grav}}(E) \\;\\sim\\; \\frac{G_N E^2}{\\hbar c^5} \\;=\\; \\left(\\frac{E}{E_P}\\right)^2",
    note: "Power-law growth: the perturbative expansion degrades as E approaches the Planck energy."
  }), /*#__PURE__*/React.createElement("p", null, "Expanding the metric around a background exposes the graviton field and the coupling normalization:"), /*#__PURE__*/React.createElement(PaperEq, {
    tex: "g_{\\mu\\nu} = \\eta_{\\mu\\nu} + \\kappa\\, h_{\\mu\\nu}, \\qquad \\kappa^2 = 32\\pi G",
    note: "The graviton field h_\u03BC\u03BD and its coupling \u03BA."
  }), /*#__PURE__*/React.createElement("p", null, "The effective action then contains an infinite tower of higher-curvature operators, each suppressed by further powers of the cutoff:"), /*#__PURE__*/React.createElement(PaperEq, {
    tex: "S_{\\mathrm{EFT}} = \\int d^4x\\,\\sqrt{-g}\\left[\\frac{R}{16\\pi G} + c_1 R^2 + c_2 R_{\\mu\\nu}R^{\\mu\\nu} + c_3 R_{\\mu\\nu\\rho\\sigma}R^{\\mu\\nu\\rho\\sigma} + \\cdots\\right]",
    note: "An infinite tower of operators: at E \u226A E_P only the first few matter; at Planckian energies infinitely many become relevant."
  }), /*#__PURE__*/React.createElement("p", null, "The Goroff\u2013Sagnotti two-loop computation makes the obstruction concrete: the divergence structure requires new counterterms of the ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "R\xB3"), " type, so the theory is non-renormalizable in the ordinary sense. At low energies, however, quantum gravity is a perfectly valid effective field theory \u2014 the atlas implements this honestly and marks the boundary rather than papering over it."), /*#__PURE__*/React.createElement(PaperNote, {
    kind: "note",
    title: "Why this is the honest framing"
  }, "The EFT is ", /*#__PURE__*/React.createElement("em", null, "reliable below the cutoff"), " and ", /*#__PURE__*/React.createElement("em", null, "silent about the ultraviolet completion"), ". The atlas presents both halves of that sentence together, because presenting only the first is the most common overclaim in the field.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "3.3",
    title: "Black holes as theoretical laboratories"
  }, /*#__PURE__*/React.createElement("p", null, "Black holes sharpen the issue because they combine horizons, thermodynamics, quantum fields in curved spacetime, entropy\u2013area scaling, and information flow in a single object. The Schwarzschild geometry sets the scale:"), /*#__PURE__*/React.createElement(PaperEq, {
    tex: "r_s = \\frac{2GM}{c^2}, \\qquad A = 4\\pi r_s^2",
    note: "Horizon radius and area."
  }), /*#__PURE__*/React.createElement("p", null, "The Bekenstein\u2013Hawking entropy is the most famous area law in gravitational physics \u2014 entropy scales with", /*#__PURE__*/React.createElement("em", null, "area"), ", not volume:"), /*#__PURE__*/React.createElement(PaperEq, {
    tex: "S_{BH} = \\frac{k_B c^3 A}{4G\\hbar} = k_B\\,\\frac{A}{4\\ell_P^2}",
    note: "Area law: the entropy of a black hole is proportional to its horizon area in Planck units."
  }), /*#__PURE__*/React.createElement("p", null, "The Hawking temperature and the evaporation timescale follow from the semiclassical calculation:"), /*#__PURE__*/React.createElement(PaperEq, {
    tex: "T_H = \\frac{\\hbar c^3}{8\\pi G M k_B}, \\qquad t_{\\mathrm{evap}} \\propto M^3",
    note: "Hawking temperature and the cubic mass scaling of the evaporation time."
  }), /*#__PURE__*/React.createElement("p", null, "For a rotating (Kerr) black hole the outer and inner horizons are"), /*#__PURE__*/React.createElement(PaperEq, {
    tex: "r_\\pm = \\frac{GM}{c^2}\\left[1 \\pm \\sqrt{1 - a_\\star^2}\\right], \\qquad a_\\star = \\frac{cJ}{GM^2}",
    note: "Kerr horizons in terms of the dimensionless spin a\u2605."
  }), /*#__PURE__*/React.createElement("p", null, "and the surface gravity \u2014 hence the temperature \u2014 decreases toward the extremal limit:"), /*#__PURE__*/React.createElement(PaperEq, {
    tex: "\\kappa = \\frac{c^4}{2GM}\\,\\frac{\\sqrt{1-a_\\star^2}}{1+\\sqrt{1-a_\\star^2}}, \\qquad T_{\\mathrm{Kerr}} = \\frac{\\hbar\\kappa}{2\\pi c k_B} \\;\\xrightarrow[a_\\star \\to 1]{}\\; 0",
    note: "Surface gravity and the vanishing extremal temperature."
  }), /*#__PURE__*/React.createElement("p", null, "Any credible quantum-gravity program must explain why black holes carry entropy proportional to horizon area and how unitary quantum evolution is reconciled with semiclassical evaporation. The atlas gives the information paradox its own decision-tree treatment and the modern entanglement-wedge literature its own conjectural panel.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "3.4",
    title: "Research programs, compared without a winner"
  }, /*#__PURE__*/React.createElement("p", null, "The theory comparator places string theory, loop quantum gravity, asymptotic safety, causal sets, and holography side by side \u2014 with their leading ideas, their achievements, and their open questions \u2014 and deliberately declares no winner, because none is experimentally confirmed.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "3.5",
    title: "Experimental anchors"
  }, /*#__PURE__*/React.createElement("p", null, "The experiment module grounds the atlas in data: the Higgs boson (2012), the first direct gravitational-wave observation GW150914 (2016), and the EHT horizon-scale image of M87* (2019). The gravitational-wave theatre includes a bounded real-data mode that fetches from GWOSC with a full deterministic offline fixture for every network phase, so the data path itself is honest: success, HTTP error, abort, oversize, and cancel are all first-class, tested states."))), /*#__PURE__*/React.createElement(PaperSection, {
    id: "design",
    index: "4",
    title: "Design methodology"
  }, /*#__PURE__*/React.createElement(PaperSub, {
    index: "4.1",
    title: "Equations are interface objects"
  }, /*#__PURE__*/React.createElement("p", null, "Equations are not decorative glyphs. Each formula is paired with symbol definitions, meaning, and limitations; the interface treats a formula as a compact map of assumptions. The Symbol Atlas extends this to the notation layer itself: 27 symbols across 33 contexts, disambiguating reused letters \u2014 \u03B2 as v/c versus \u03B2(g) as an RG function; the metric g", /*#__PURE__*/React.createElement("sub", null, "\u03BC\u03BD"), " versus a coupling g versus a fixed point g\u2605 \u2014 with every glyph and defining equation typeset live with KaTeX.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "4.2",
    title: "Interactivity carries interpretation"
  }, /*#__PURE__*/React.createElement("p", null, "Sliders are not UI ornaments. A mass slider changes the black-hole radius, temperature, entropy, evaporation time, and Kerr geometry readouts together, so a single gesture moves a ", /*#__PURE__*/React.createElement("em", null, "family"), " of related quantities. A scale slider shows how many decades separate collider physics from the Planck length. A collision selector changes both a 3D scattering animation and the matching diagrammatic amplitude. The causal laboratory computes exact Lorentz transformations and invariant intervals from draggable, keyboard-accessible events. The RG-flow landscape integrates one-loop QED/QCD flows deterministically in both directions and marks the b\u2080 = 0 boundary at n", /*#__PURE__*/React.createElement("sub", null, "f"), " = 16.5.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "4.3",
    title: "Aesthetic density must not hide epistemic boundaries"
  }, /*#__PURE__*/React.createElement("p", null, "The atlas uses a dark scientific atmosphere, raymarched scenes, bloom, and instrument-like typography. The design rule is that aesthetic density is permitted only where the epistemic labeling survives it \u2014 cinematic visuals, never cinematic certainty.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "4.4",
    title: "Accessibility as a scientific requirement"
  }, /*#__PURE__*/React.createElement("p", null, "Motion is fully bounded and every animated surface snaps under ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "prefers-reduced-motion"), ". Keyboard focus, arrow-key sliders, 44 px touch targets, and horizontal chart scrolling are tested, not aspirational. An atlas that claims to serve understanding must be usable by the people trying to understand it."))), /*#__PURE__*/React.createElement(PaperSection, {
    id: "architecture",
    index: "5",
    title: "Software architecture"
  }, /*#__PURE__*/React.createElement(PaperSub, {
    index: "5.1",
    title: "Zero-build, static-first"
  }, /*#__PURE__*/React.createElement("p", null, "The application is intentionally a folder of static files. It loads React, Babel, Three.js, KaTeX, and its web fonts from self-hosted copies under ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "vendor/"), ", runs from any plain HTTP server, and requires no backend and no build step. This is an archival decision: a reader in ten years should be able to serve the repository and see the same atlas, with no third-party host in the request path, and a reviewer can audit the exact bytes that ship.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "5.2",
    title: "Module structure"
  }, /*#__PURE__*/React.createElement("p", null, "Pure physics lives in ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "js/physics.mjs"), " as framework-free ES modules, mirrored into the browser through a bridge, so the same code paths are testable under ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "node --test"), "and exercised by the UI. Views are declarative components over a shared state layer; every laboratory view supports URL state, back/forward restoration, and a versioned export JSON schema.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "5.3",
    title: "Reproducible sharing"
  }, /*#__PURE__*/React.createElement("p", null, "Every laboratory view encodes its full state in the URL, so an exact configuration \u2014 a Kerr geometry, an RG flow, a causal-lab arrangement \u2014 is a shareable, citable object."))), /*#__PURE__*/React.createElement(PaperSection, {
    id: "verification",
    index: "6",
    title: "Verification and validation"
  }, /*#__PURE__*/React.createElement(PaperSub, {
    index: "6.1",
    title: "Literature-anchored unit tests"
  }, /*#__PURE__*/React.createElement("p", null, "The pure-physics suite (", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "test/physics.test.mjs"), ", run under ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "node --test"), ") anchors the implemented observables to literature values."), /*#__PURE__*/React.createElement("div", {
    className: "paper-anchor-table"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-anchor-head"
  }, /*#__PURE__*/React.createElement("span", null, "Observable"), /*#__PURE__*/React.createElement("span", null, "Literature anchor")), [["Mercury perihelion advance", "42.98″ per century"], ["Solar-limb light deflection", "1.75″"], ["Planck units", "CODATA values"], ["Solar-mass evaporation timescale", "$\\approx 2.1\\times10^{67}$ yr"], ["Hawking spectrum Wien peak", "$u \\approx 2.8214$"], ["RG: QED UV growth, QCD asymptotic freedom, $b_0 = 0$ at $n_f = 16.5$", "standard one-loop results"]].map(function (_ref11) {
    var _ref12 = _slicedToArray(_ref11, 2),
      obs = _ref12[0],
      anchor = _ref12[1];
    return /*#__PURE__*/React.createElement("div", {
      key: obs,
      className: "paper-anchor-row"
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(RichText, {
      text: obs
    })), /*#__PURE__*/React.createElement("span", {
      className: "mono"
    }, /*#__PURE__*/React.createElement(RichText, {
      text: anchor
    })));
  })), /*#__PURE__*/React.createElement("p", null, "The RG cases additionally cover analytic and numerical fixed points, the UV/IR stability convention, deterministic integration and reversal, invalid inputs, and graceful QED/QCD validity termination.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "6.2",
    title: "Manifest-driven browser QA"
  }, /*#__PURE__*/React.createElement("p", null, "A persistent browser-QA harness (", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "qa/"), ", pinned Chromium, separate CI job) is driven by a machine-readable capture manifest validated against a JSON schema. It covers: clean mounting of all fourteen views with zero console/page errors; URL-state round-trips, reload persistence, back/forward navigation, copy-link, and the versioned export schema; observable differences between reduced and normal motion; keyboard focus, arrow-key sliders, mobile overflow, 44 px touch targets, and horizontal chart scrolling; conjectural labeling and preset reset; every GWOSC network phase through a deterministic offline fixture; and per-capture visual regression against committed baselines, each with its own justified pixel tolerance. A single live gwosc.org smoke test exists but runs only on explicit request, never in CI.")), /*#__PURE__*/React.createElement(PaperSub, {
    index: "6.3",
    title: "Repository-presentation guardrails"
  }, /*#__PURE__*/React.createElement("p", null, "A validation suite (", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "npm run validate"), ") enforces the academic packaging itself: every relative link and image in the README, ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "docs/"), " and ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "paper/"), " resolves to a file, the README shows every chapter cover, every committed diagram is referenced, the generated parts of this paper are current, Open Graph and manifest metadata are present and point to real assets, PNGs have expected dimensions, diagram SVGs are structurally complete, and every asset the entry document and the vendored stylesheets reference resolves to a real local file with no third-party host in the request path. A schema-validated ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "CITATION.cff"), " (CFF 1.2.0, no unverified identifiers) is kept consistent with ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "package.json"), " and", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "LICENSE"), " by its own test suite."))), /*#__PURE__*/React.createElement(PaperSection, {
    id: "limits",
    index: "7",
    title: "Limitations and epistemic boundaries"
  }, /*#__PURE__*/React.createElement("p", null, "The atlas is explicit about what it is not. It is not a claim that quantum gravity has been solved. It does not present Planck-scale discreteness as observed. It does not present Hawking radiation from astrophysical black holes as directly detected. It does not present AdS/CFT as the proven description of our universe. Its 3D scenes are labeled schematic where they are schematic. Its research-program comparison is a map of agendas, not a ranking of merits. Where the atlas visualizes beyond established physics, the visualization itself carries the conjectural label \u2014 the epistemic boundary is drawn inside the instrument, not in a footnote outside it.")), /*#__PURE__*/React.createElement(PaperSection, {
    id: "conclusion",
    index: "8",
    title: "Conclusion"
  }, /*#__PURE__*/React.createElement("p", null, "HORIZON demonstrates that the boundary between established physics, effective theory, schematic modeling, and conjecture can be made a first-class object of interactive study. Its contribution is not a new physical result but a discipline: an atlas in which every claim is labeled, every equation is an interface object, every laboratory is reproducible from its URL, and every visual regression is pinned to a justified tolerance. The quantum-gravity problem is hard precisely because it sits at the edge of what is known; an honest atlas of that edge is the appropriate instrument for studying it.")), /*#__PURE__*/React.createElement(PaperV2, null), /*#__PURE__*/React.createElement(PaperSection, {
    id: "spine",
    index: "A",
    title: "Formulation spine"
  }, /*#__PURE__*/React.createElement("p", null, "The equations the atlas actually implements, module by module. Each card opens a ", /*#__PURE__*/React.createElement("em", null, "formula lens"), " with the symbol table, the meaning, and the assumptions the instrument carries."), /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-label"
  }, "A.1 \xB7 Standard Model gauge structure"), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Gauge group",
    status: "established",
    formulaId: "sm-gauge-group-bare",
    symbols: [{
      s: "SU(3)_C",
      d: "color (strong) factor"
    }, {
      s: "SU(2)_L",
      d: "weak isospin factor"
    }, {
      s: "U(1)_Y",
      d: "hypercharge factor"
    }],
    meaning: "The Standard Model is organized by a product of three gauge groups; the three factors correspond to color, weak isospin, and hypercharge.",
    limits: "The minimal Standard Model does not include gravity; neutrino masses require additional structure; the hierarchy problem remains unresolved."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Electric charge",
    status: "established",
    formulaId: "sm-electric-charge",
    symbols: [{
      s: "T_3",
      d: "third component of weak isospin"
    }, {
      s: "Y",
      d: "hypercharge"
    }],
    meaning: "Electric charge emerges after electroweak symmetry breaking as a fixed combination of weak isospin and hypercharge.",
    limits: "Holds for the minimal Higgs sector; extended sectors modify the relation."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Covariant derivative",
    status: "established",
    formulaId: "sm-covariant-derivative",
    symbols: [{
      s: "g_s, g, g'",
      d: "strong, weak, hypercharge couplings"
    }, {
      s: "G, W, B",
      d: "gauge fields"
    }, {
      s: "T^a, \\tau^i",
      d: "generators"
    }],
    meaning: "The covariant derivative packages all three gauge interactions into a single object that transforms correctly under local symmetry.",
    limits: "Written for the minimal Standard Model; gravitational coupling is absent."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Higgs potential",
    status: "established",
    formulaId: "higgs-potential-full",
    symbols: [{
      s: "\\mu^2",
      d: "mass parameter (negative for breaking)"
    }, {
      s: "\\lambda",
      d: "quartic self-coupling"
    }, {
      s: "v",
      d: "vacuum expectation value"
    }],
    meaning: "For $\\mu^2<0$ the field acquires a nonzero vacuum expectation value, giving masses to the $W^\\pm$ and $Z^0$ bosons and to fermions through Yukawa couplings.",
    limits: "The measured value of $v$ is an input, not a prediction; the stability of the electroweak vacuum depends on $\\lambda$ at high scales."
  }))), /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-label"
  }, "A.2 \xB7 Quantum field theory and amplitudes"), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Path integral",
    status: "effective",
    formulaId: "qft-path-integral",
    symbols: [{
      s: "\\mathcal{A}_{i\\to f}",
      d: "transition amplitude"
    }, {
      s: "S[\\phi]",
      d: "action functional"
    }, {
      s: "\\mathcal{D}\\phi",
      d: "formal path-integral measure"
    }],
    meaning: "A transition amplitude is expressed as a sum over field configurations weighted by the phase of the action.",
    limits: "The path-integral measure is formal except in special rigorously defined cases; the expression is a computational device, not a literal sum."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Scalar action and Klein\u2013Gordon",
    status: "established",
    formulaId: "qft-scalar-action",
    symbols: [{
      s: "\\Box",
      d: "d’Alembertian operator"
    }, {
      s: "m",
      d: "field mass"
    }],
    meaning: "The free scalar field obeys the Klein\u2013Gordon equation; its dispersion relation $\\omega^2=c^2k^2+m^2c^4/\\hbar^2$ shows the mass gap as a nonzero frequency at zero wavenumber.",
    limits: "Free-field statement; interactions are handled perturbatively."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Propagator and Mandelstam invariants",
    status: "effective",
    formulaId: "qft-propagator-mandelstam",
    symbols: [{
      s: "\\Delta_F",
      d: "Feynman propagator"
    }, {
      s: "s, t, u",
      d: "Mandelstam invariants"
    }],
    meaning: "The propagator is the internal line of a Feynman diagram; the Mandelstam identity is exact for any 2\u21922 process and is displayed on screen as a floating-point residual rather than hidden.",
    limits: "Feynman diagrams are terms in a perturbative expansion; virtual particles are calculational structures, not directly observed objects."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Leading cross-section",
    status: "effective",
    formulaId: "qft-leading-cross-section",
    symbols: [{
      s: "\\alpha",
      d: "fine-structure constant"
    }, {
      s: "s",
      d: "centre-of-mass energy squared"
    }],
    meaning: "The leading high-energy scaling of the QED annihilation cross-section; the Amplitude Room evaluates it live alongside the Breit\u2013Wigner resonance shape.",
    limits: "Leading order only; the $Z^0$ panel shows the Breit\u2013Wigner shape alone, not the $\\gamma$\u2013$Z^0$ interference term."
  }))), /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-label"
  }, "A.3 \xB7 Gauge symmetry and renormalization-group flow"), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Yang\u2013Mills field strength",
    status: "established",
    formulaId: "gauge-field-strength",
    symbols: [{
      s: "A_\\mu^a",
      d: "gauge potential"
    }, {
      s: "f^{abc}",
      d: "structure constants"
    }],
    meaning: "The non-Abelian term produces gauge-boson self-interactions, the structural difference from electromagnetism.",
    limits: "Classical statement; quantization introduces the usual gauge-fixing and ghost machinery."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "One-loop beta function",
    status: "effective",
    formulaId: "gauge-one-loop-beta",
    symbols: [{
      s: "b_0",
      d: "one-loop coefficient"
    }, {
      s: "n_f",
      d: "active quark flavours"
    }],
    meaning: "For QCD with sufficiently few flavours $b_0>0$ and the coupling weakens at high energy \u2014 asymptotic freedom. The $b_0=0$ boundary sits at $n_f=16.5$.",
    limits: "One loop only; higher orders and scheme dependence are not shown."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Running coupling solution",
    status: "effective",
    formulaId: "gauge-running-solution",
    symbols: [{
      s: "\\mu",
      d: "renormalization scale"
    }, {
      s: "\\mu_0",
      d: "reference scale"
    }],
    meaning: "The integrated one-loop solution the RG landscape plots; the QED preset uses a documented unit-charge Dirac-fermion convention whose Landau pole is shown only as a formal extrapolation.",
    limits: "The instrument stops its numerical trajectory at the conservative display boundary $\\alpha=1$ before the pole."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Fixed point and linearization",
    status: "conjectural",
    formulaId: "rg-fixed-point",
    symbols: [{
      s: "g_*",
      d: "fixed-point coupling"
    }, {
      s: "\\beta'(g_*)",
      d: "slope at the fixed point"
    }],
    meaning: "With $t=\\ln\\mu$ increasing toward the ultraviolet, $\\beta'(g_\\star)<0$ is UV-attractive and $\\beta'(g_\\star)>0$ is IR-attractive. The asymptotic-safety-style polynomial $\\beta(g)=ag-bg^3$ is an explicitly conjectural illustration.",
    limits: "The interacting UV fixed point is built into the chosen toy function; it is not evidence for quantum-gravity asymptotic safety."
  }))), /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-label"
  }, "A.4 \xB7 General relativity and local causal structure"), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Einstein field equations",
    status: "established",
    formulaId: "gr-einstein-field-equations",
    symbols: [{
      s: "G_{\\mu\\nu}",
      d: "Einstein tensor"
    }, {
      s: "T_{\\mu\\nu}",
      d: "stress-energy tensor"
    }, {
      s: "\\Lambda",
      d: "cosmological constant"
    }],
    meaning: "Matter and energy curve spacetime; the Einstein tensor encodes the curvature response.",
    limits: "The theory is classical; singularity theorems indicate its own domain of failure."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Geodesic equation",
    status: "established",
    formulaId: "gr-geodesic",
    symbols: [{
      s: "\\Gamma^\\mu_{\\alpha\\beta}",
      d: "Christoffel connection"
    }, {
      s: "\\tau",
      d: "proper time"
    }],
    meaning: "Free particles follow geodesics; the connection encodes how the coordinate basis twists across spacetime.",
    limits: "Classical test-particle statement; back-reaction is neglected."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Minkowski interval and boost",
    status: "established",
    formulaId: "gr-minkowski-interval",
    symbols: [{
      s: "\\Delta s^2",
      d: "invariant interval"
    }, {
      s: "\\beta",
      d: "v/c"
    }, {
      s: "\\gamma",
      d: "Lorentz factor"
    }],
    meaning: "The causal laboratory uses flat 1+1D Minkowski spacetime with signature (\u2212,+,+,+) as the local foundation for GR; the boost transforms events and axes between frames.",
    limits: "These relations do not simulate curvature or gravity; they expose the invariant local causal structure inherited by general relativity."
  }))), /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-label"
  }, "A.5 \xB7 Planck scale and the perturbative obstruction"), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Planck units",
    status: "established",
    formulaId: "planck-units",
    symbols: [{
      s: "\\ell_P",
      d: "$\\approx 1.616\\times10^{-35}$ m"
    }, {
      s: "t_P",
      d: "$\\approx 5.39\\times10^{-44}$ s"
    }, {
      s: "m_P",
      d: "$\\approx 2.18\\times10^{-8}$ kg"
    }, {
      s: "E_P",
      d: "$\\approx 1.22\\times10^{19}$ GeV"
    }],
    meaning: "The natural scale built from \u0127, G, and c. The Planck scale is not an experimentally measured threshold.",
    limits: "It is a dimensional-analysis scale, not an observed boundary."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Heuristic obstruction",
    status: "heuristic",
    formulaId: "planck-heuristic-obstruction",
    symbols: [{
      s: "\\lambda_C",
      d: "Compton wavelength"
    }, {
      s: "r_s",
      d: "Schwarzschild radius"
    }],
    meaning: "Equating the Compton wavelength and the Schwarzschild radius gives a scale of order the Planck length \u2014 an intuition aid, not the actual derivation.",
    limits: "This is a heuristic picture; the real obstruction is the non-renormalizability of the perturbative expansion."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Graviton expansion and EFT tower",
    status: "effective",
    formulaId: "planck-graviton-expansion",
    symbols: [{
      s: "h_{\\mu\\nu}",
      d: "metric perturbation / graviton field"
    }, {
      s: "\\kappa",
      d: "coupling normalization"
    }],
    meaning: "Expanding around a background gives a graviton field at low energy; the effective action then contains an infinite tower of higher-curvature terms.",
    limits: "The EFT is reliable below the cutoff but does not tell us the ultraviolet completion."
  }))), /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-label"
  }, "A.6 \xB7 Black-hole thermodynamics and holography"), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Bekenstein\u2013Hawking entropy",
    status: "effective",
    formulaId: "bh-entropy-area-law",
    symbols: [{
      s: "A",
      d: "horizon area"
    }, {
      s: "\\ell_P",
      d: "Planck length"
    }],
    meaning: "Entropy scales with horizon area rather than volume \u2014 the most famous area law in gravitational physics.",
    limits: "Semiclassical landmark; the microscopic origin of the entropy is not fully known for generic black holes."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Hawking temperature and evaporation",
    status: "effective",
    formulaId: "bh-hawking-evaporation",
    symbols: [{
      s: "T_H",
      d: "Hawking temperature"
    }, {
      s: "M",
      d: "black-hole mass"
    }],
    meaning: "Smaller black holes are hotter and evaporate faster; the cubic mass scaling makes stellar-mass evaporation astronomically slow.",
    limits: "Astrophysical Hawking radiation has not been directly observed."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Kerr horizons and surface gravity",
    status: "established",
    formulaId: "bh-kerr-horizons",
    symbols: [{
      s: "a_\\star",
      d: "dimensionless spin $cJ/GM^2$"
    }, {
      s: "\\kappa",
      d: "surface gravity"
    }],
    meaning: "The Kerr Observatory prints exact coordinate radii and the live formulation panel substitutes the current parameters into these relations; the surface gravity \u2014 hence the temperature \u2014 tends to zero in the extremal limit.",
    limits: "The image beside the map integrates Carter's Kerr null geodesics per pixel, so frame dragging and the spin-dependent shadow are computed; the thin disk, its display-scaled colour and the corona and jets are models (see docs/science/kerr-observatory.md)."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Ryu\u2013Takayanagi formula",
    status: "conjectural",
    formulaId: "bh-ryu-takayanagi",
    symbols: [{
      s: "\\gamma_A",
      d: "extremal bulk surface anchored to boundary region A"
    }],
    meaning: "In AdS/CFT, boundary entanglement entropy is computed by the area of an extremal bulk surface \u2014 a precise link between quantum information and spacetime geometry.",
    limits: "AdS/CFT is precise in special settings; our universe is not known to be asymptotically anti-de Sitter; holography is not a claim that reality is an optical projection."
  }))), /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "paper-spine-label"
  }, "A.7 \xB7 Gravitational waves and collider constraints"), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Quadrupole radiated power",
    status: "established",
    formulaId: "gw-quadrupole-power",
    symbols: [{
      s: "Q_{ij}",
      d: "mass quadrupole moment"
    }, {
      s: "Q^{(3)}_{ij}",
      d: "third time derivative of the quadrupole"
    }],
    meaning: "The leading quadrupole power radiated by a source; for compact binary inspirals the orbital frequency increases and the waveform chirps upward.",
    limits: "The Signal Analysis Theatre\u2019s generated waveform is a leading-order quadrupole teaching model \u2014 no spins, no higher post-Newtonian orders, not numerical relativity."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Scale gap",
    status: "open",
    formulaId: "planck-scale-gap",
    symbols: [{
      s: "E_P",
      d: "Planck energy"
    }, {
      s: "E_{\\mathrm{LHC}}",
      d: "collider reach"
    }],
    meaning: "Roughly fifteen orders of magnitude separate collider physics from the Planck regime; collider null results constrain beyond-Standard-Model scenarios but do not directly access quantum gravity.",
    limits: "Collider events are presented as indirect constraints, not as quantum-gravity observations."
  })))), /*#__PURE__*/React.createElement(PaperSection, {
    id: "refs",
    index: "R",
    title: "References"
  }, /*#__PURE__*/React.createElement("p", {
    className: "dim"
  }, "The atlas ships a larger in-app references list; the following are especially central to the chain of reasoning in \xA73."), /*#__PURE__*/React.createElement("ol", {
    className: "paper-refs"
  }, PAPER_REFS.map(function (r, i) {
    return /*#__PURE__*/React.createElement("li", {
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: "paper-ref-num"
    }, i + 1), /*#__PURE__*/React.createElement("span", null, r));
  }))));
}
Object.assign(window, {
  ViewOverview: ViewOverview,
  ViewGlossary: ViewGlossary,
  ViewReferences: ViewReferences,
  ViewOpenProblems: ViewOpenProblems,
  ViewSymbols: ViewSymbols,
  ViewWhitepaper: ViewWhitepaper
});
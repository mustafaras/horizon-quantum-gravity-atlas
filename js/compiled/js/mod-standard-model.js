/* Compiled from js/mod-standard-model.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _construct(t, e, r) { if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && _setPrototypeOf(p, r.prototype), p; }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// mod-standard-model.jsx — Module 01: The Standard Model
var SM3D_HEX = {
  quark: QGA_TOKENS.hex("pigment-violet-72-c15"),
  lepton: QGA_TOKENS.hex("pigment-cyan-80-c09"),
  gauge: QGA_TOKENS.hex("pigment-blue-72"),
  higgs: QGA_TOKENS.hex("pigment-amber-83")
};
var SM3D_POS = {
  u: [-2.8, 2.1, 0],
  c: [0, 2.1, 0],
  t: [2.8, 2.1, 0],
  d: [-2.8, 0.7, 0],
  s: [0, 0.7, 0],
  b: [2.8, 0.7, 0],
  e: [-2.8, -0.7, 0],
  mu: [0, -0.7, 0],
  tau: [2.8, -0.7, 0],
  nue: [-2.8, -2.1, 0],
  numu: [0, -2.1, 0],
  nutau: [2.8, -2.1, 0],
  g: [-4.6, 0.9, -3.2],
  ph: [-1.6, 1.7, -3.6],
  w: [1.6, 1.7, -3.6],
  z: [4.6, 0.9, -3.2],
  h: [0, 3.7, -1.4]
};
function sm3dRelated(p) {
  var s = new Set();
  if (p.cls === "gauge" || p.cls === "higgs") {
    var _iterator = _createForOfIteratorHelper(QGA_PARTICLES),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var q = _step.value;
        if (q.id !== p.id && QGA_couplings(q).includes(p.id)) s.add(q.id);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    if (p.id === "g") s.add("g");
    if (p.id === "h") {
      s.add("w");
      s.add("z");
      s.add("h");
    }
  } else {
    var _iterator2 = _createForOfIteratorHelper(QGA_couplings(p)),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var b = _step2.value;
        s.add(b);
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
  return _toConsumableArray(s);
}
function ParticleArchitecture3D() {
  var _useState = useState("h"),
    _useState2 = _slicedToArray(_useState, 2),
    sel = _useState2[0],
    setSel = _useState2[1];
  var _useState3 = useState(false),
    _useState4 = _slicedToArray(_useState3, 2),
    higgsOn = _useState4[0],
    setHiggsOn = _useState4[1];
  var _useState5 = useState(false),
    _useState6 = _slicedToArray(_useState5, 2),
    layersOn = _useState6[0],
    setLayersOn = _useState6[1];
  var selRef = useRef(sel);
  selRef.current = sel;
  var higgsRef = useRef(higgsOn);
  higgsRef.current = higgsOn;
  var layersRef = useRef(layersOn);
  layersRef.current = layersOn;
  var build = function build(ctx) {
    var THREE = ctx.THREE,
      scene = ctx.scene;
    scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.016);
    scene.add(new THREE.AmbientLight(QGA_TOKENS.hex("pigment-blue-68"), 0.6));
    var key = new THREE.DirectionalLight(QGA_TOKENS.hex("pigment-blue-86"), 0.9);
    key.position.set(4, 8, 6);
    scene.add(key);
    // quantum-field substrate: an undulating grid the particles live above (the "vacuum")
    var FN = 26,
      FSPAN = 26,
      fstep = FSPAN / FN;
    var fidx = function fidx(i, j) {
      return i * FN + j;
    };
    var fPos = new Float32Array(FN * FN * 3);
    for (var i = 0; i < FN; i++) for (var j = 0; j < FN; j++) {
      fPos[fidx(i, j) * 3] = -FSPAN / 2 + i * fstep;
      fPos[fidx(i, j) * 3 + 1] = 0;
      fPos[fidx(i, j) * 3 + 2] = -FSPAN / 2 + j * fstep;
    }
    var fSeg = [];
    for (var _i = 0; _i < FN; _i++) for (var _j = 0; _j < FN; _j++) {
      if (_i < FN - 1) fSeg.push(fidx(_i, _j), fidx(_i + 1, _j));
      if (_j < FN - 1) fSeg.push(fidx(_i, _j), fidx(_i, _j + 1));
    }
    var engraved = ctx.engraved;
    var fSegFlat = engraved.expand(fPos, fSeg);
    var fieldFloor = engraved.segments(fSegFlat, {
      color: "pigment-blue-35",
      opacity: 0.26,
      additive: true,
      widthPx: engraved.WIDTH_PX.hairline,
      layer: "decoration"
    });
    fieldFloor.frustumCulled = false;
    fieldFloor.position.y = -3.4;
    var floorHiggs = false;
    scene.add(fieldFloor);
    var nodes = [],
      rnd = QGA_SEEDED(0x5d0e);
    var halos = [];
    var geoFor = function geoFor(cls) {
      return cls === "quark" ? new THREE.IcosahedronGeometry(1, 1) : cls === "gauge" ? new THREE.OctahedronGeometry(1, 1) : new THREE.SphereGeometry(1, 24, 18);
    };
    var _iterator3 = _createForOfIteratorHelper(QGA_PARTICLES),
      _step3;
    try {
      var _loop3 = function _loop3() {
        var _m$position;
        var p = _step3.value;
        var hex = SM3D_HEX[p.cls];
        var scl = (p.cls === "higgs" ? 0.56 : p.cls === "gauge" ? 0.46 : p.cls === "quark" ? 0.4 : p.charge === "0" ? 0.26 : 0.34) * (p.gen ? 1 + 0.07 * (p.gen - 1) : 1);
        var mat = new THREE.MeshStandardMaterial({
          color: hex,
          emissive: hex,
          emissiveIntensity: 0.22,
          metalness: 0.35,
          roughness: 0.4,
          flatShading: p.cls !== "lepton" && p.cls !== "higgs"
        });
        var m = new THREE.Mesh(geoFor(p.cls), mat);
        m.scale.setScalar(scl);
        (_m$position = m.position).set.apply(_m$position, _toConsumableArray(SM3D_POS[p.id]));
        m.userData = {
          id: p.id,
          baseScale: scl,
          hex: hex,
          base: m.position.clone(),
          jit: rnd() * Math.PI * 2,
          spin: p.cls === "gauge" ? 1.0 : p.cls === "higgs" ? 0 : 0.5
        };
        scene.add(ctx.tag(m, "data"));
        nodes.push(m);
        var gl = s3dGlow(hex, scl * 4.2, 0.34);
        gl.position.copy(m.position);
        scene.add(gl);
        m.userData.glow = gl;
        ctx.label(p.sym, function () {
          return {
            x: m.position.x,
            y: m.position.y - scl - 0.45,
            z: m.position.z
          };
        }, "s3d-quiet");
        // Higgs-coupling halo (gold ring), shown by the overlay toggle
        if (p.higgs === true) {
          var halo = new THREE.Mesh(new THREE.TorusGeometry(scl * 1.7, 0.025, 8, 40), new THREE.MeshBasicMaterial({
            color: QGA_TOKENS.hex("pigment-amber-83"),
            transparent: true,
            opacity: 0.75
          }));
          halo.position.copy(m.position);
          halo.visible = false;
          halo.userData = {
            node: m,
            phase: rnd()
          };
          scene.add(ctx.tag(halo, "data"));
          halos.push(halo);
        }
      };
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        _loop3();
      }

      // selection marker
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
    var marker = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 48), new THREE.MeshBasicMaterial({
      color: QGA_TOKENS.hex("pigment-white"),
      transparent: true,
      opacity: 0.9
    }));
    scene.add(ctx.tag(marker, "model"));

    // gauge-group symmetry layers (schematic): three stacked rings
    var layers = new THREE.Group();
    var layerDefs = [["SU(3)ᴄ · color", 5.8, -1.0, QGA_TOKENS.hex("pigment-violet-72-c15")], ["SU(2)ʟ · weak isospin", 5.1, -1.9, QGA_TOKENS.hex("pigment-blue-72")], ["U(1)ʏ · hypercharge", 4.4, -2.8, QGA_TOKENS.hex("pigment-cyan-80-c09")]];
    var _loop = function _loop() {
      var _layerDefs$_i = _slicedToArray(_layerDefs[_i2], 4),
        name = _layerDefs$_i[0],
        R = _layerDefs$_i[1],
        z = _layerDefs$_i[2],
        hex = _layerDefs$_i[3];
      var ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.022, 8, 80), new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.5
      }));
      ring.position.set(0, 0.6, z);
      layers.add(ring);
      var disc = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.04,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
      disc.position.copy(ring.position);
      layers.add(disc);
      var lp = new THREE.Vector3(0, 0.6 + R, z);
      var lh = ctx.label(name, function () {
        return lp;
      }, "s3d-quiet");
      ring.userData.labelHandle = lh;
    };
    for (var _i2 = 0, _layerDefs = layerDefs; _i2 < _layerDefs.length; _i2++) {
      _loop();
    }
    layers.visible = false;
    scene.add(ctx.tag(layers, "data"));
    ctx.annotation("gravity is NOT part of the Standard Model — no graviton node exists here", function () {
      return {
        x: 0,
        y: -3.4,
        z: 2.2
      };
    });

    // coupling lines, rebuilt when selection changes
    var linesGroup = new THREE.Group();
    scene.add(linesGroup);
    var activeCurves = []; // {curve, hex} for the currently-shown couplings
    var lastSel = null;
    var rebuildLines = function rebuildLines(id) {
      while (linesGroup.children.length) {
        var c = linesGroup.children.pop();
        c.geometry.dispose();
        c.material.dispose();
      }
      activeCurves.length = 0;
      var p = QGA_PARTICLES.find(function (q) {
        return q.id === id;
      });
      if (!p) return;
      var selIsBoson = p.cls === "gauge" || p.cls === "higgs";
      var a = _construct(THREE.Vector3, _toConsumableArray(SM3D_POS[id]));
      var _iterator4 = _createForOfIteratorHelper(sm3dRelated(p)),
        _step4;
      try {
        var _loop2 = function _loop2() {
          var rid = _step4.value;
          if (rid === id) return 1; // continue
          // self-couplings noted in the readout
          var other = QGA_PARTICLES.find(function (q) {
            return q.id === rid;
          });
          var b = _construct(THREE.Vector3, _toConsumableArray(SM3D_POS[rid]));
          var mid = a.clone().add(b).multiplyScalar(0.5);
          mid.z += 1.3;
          mid.y += 0.4;
          var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
          // colour each arc by the mediating boson (so the carrier is identifiable)
          var medCls = selIsBoson ? p.cls : other ? other.cls : p.cls;
          var hex = SM3D_HEX[medCls] || SM3D_HEX[p.cls];
          linesGroup.add(engraved.line(curve.getPoints(40), {
            color: hex,
            opacity: 0.45,
            additive: true,
            widthPx: engraved.WIDTH_PX.standard,
            layer: "model"
          }));
          activeCurves.push({
            curve: curve,
            hex: hex
          });
        };
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          if (_loop2()) continue;
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    };

    // pool of travelling force-carrier packets (visualizes interaction = boson exchange)
    var packets = [];
    for (var _i3 = 0; _i3 < 18; _i3++) {
      var s = s3dGlow(QGA_TOKENS.hex("pigment-white"), 0.85, 0.0);
      s.userData = {
        t: rnd(),
        speed: 0.32 + rnd() * 0.36
      };
      scene.add(ctx.tag(s, "decoration"));
      packets.push(s);
    }
    return {
      pickables: nodes,
      onPick: function onPick(o) {
        if (o && o.userData && o.userData.id) setSel(o.userData.id);
      },
      update: function update(t, dt) {
        var mo = ctx.motion();
        if (lastSel !== selRef.current) {
          lastSel = selRef.current;
          rebuildLines(lastSel);
        }

        // quantum-field substrate ripple (stronger / gold-tinted when the Higgs field is shown)
        var fa = fPos;
        var famp = (higgsRef.current ? 0.34 : 0.2) * mo;
        for (var _i4 = 0; _i4 < FN; _i4++) for (var _j2 = 0; _j2 < FN; _j2++) {
          var x = -FSPAN / 2 + _i4 * fstep,
            z = -FSPAN / 2 + _j2 * fstep;
          fa[fidx(_i4, _j2) * 3 + 1] = Math.sin(x * 0.5 + t * 0.9) * Math.cos(z * 0.4 - t * 0.7) * famp;
        }
        engraved.expand(fPos, fSeg, fSegFlat);
        engraved.update(fieldFloor, fSegFlat);
        if (floorHiggs !== higgsRef.current) {
          floorHiggs = higgsRef.current;
          engraved.setColor(fieldFloor, floorHiggs ? "pigment-amber-47" : "pigment-blue-35");
        }
        engraved.setOpacity(fieldFloor, 0.24 + (higgsRef.current ? 0.14 : 0));

        // nodes: zero-point jitter + spin-correct motion
        for (var _i5 = 0, _nodes = nodes; _i5 < _nodes.length; _i5++) {
          var n = _nodes[_i5];
          var u = n.userData;
          var sf = 0.05 * mo;
          n.position.set(u.base.x + Math.sin(t * 2.1 + u.jit) * sf, u.base.y + Math.cos(t * 1.7 + u.jit * 1.3) * sf, u.base.z + Math.sin(t * 1.4 + u.jit * 0.7) * sf);
          u.glow.position.copy(n.position);
          if (u.spin > 0) {
            n.rotation.y += dt * 0.5 * u.spin * mo;
            n.rotation.x += dt * 0.18 * u.spin * mo;
          } else {
            n.scale.setScalar(u.baseScale * (1 + 0.07 * Math.sin(t * 2.4) * mo)); // scalar Higgs breathes
          }
          var isSel = u.id === selRef.current;
          u.glow.material.opacity = isSel ? 0.6 : 0.3 + (mo > 0 ? 0.06 * Math.sin(t * 1.3 + n.position.x) : 0);
        }

        // force-carrier exchange packets travelling along the active couplings
        var nc = activeCurves.length;
        for (var _i6 = 0; _i6 < packets.length; _i6++) {
          var pk = packets[_i6];
          if (nc === 0 || mo <= 0) {
            pk.material.opacity = 0;
            continue;
          }
          var c = activeCurves[_i6 % nc];
          pk.userData.t = (pk.userData.t + dt * pk.userData.speed * mo) % 1;
          c.curve.getPoint(pk.userData.t, pk.position);
          pk.material.color.setHex(c.hex);
          pk.material.opacity = 0.95 * Math.sin(pk.userData.t * Math.PI); // born at one end, absorbed at the other
        }
        var pulse = 0.4 + 0.18 * Math.sin(t * 1.8) * mo;
        var _iterator5 = _createForOfIteratorHelper(linesGroup.children),
          _step5;
        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
            var L = _step5.value;
            L.material.opacity = pulse;
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }
        var selNode = nodes.find(function (n) {
          return n.userData.id === selRef.current;
        });
        if (selNode) {
          marker.position.copy(selNode.position);
          marker.scale.setScalar(selNode.userData.baseScale * 1.9);
          marker.lookAt(ctx.camera.position);
        }
        layers.visible = layersRef.current;
        var _iterator6 = _createForOfIteratorHelper(layers.children),
          _step6;
        try {
          for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
            var ring = _step6.value;
            if (ring.userData && ring.userData.labelHandle) ring.userData.labelHandle.setShow(layersRef.current);
          }
          // Higgs-field interaction: continuous ripples emanate from every massive particle
        } catch (err) {
          _iterator6.e(err);
        } finally {
          _iterator6.f();
        }
        for (var _i7 = 0, _halos = halos; _i7 < _halos.length; _i7++) {
          var halo = _halos[_i7];
          halo.visible = higgsRef.current;
          if (!higgsRef.current) continue;
          var _u = halo.userData;
          halo.position.copy(_u.node.position);
          var ph = (t * 0.5 + _u.phase) % 1;
          halo.scale.setScalar(1 + ph * 1.7);
          halo.material.opacity = 0.8 * (1 - ph);
          halo.lookAt(ctx.camera.position);
        }
      }
    };
  };
  var p = QGA_PARTICLES.find(function (q) {
    return q.id === sel;
  });
  var extra = QGA_PARTICLE_EXTRA[sel];
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(Toggle, {
    label: "Higgs coupling overlay",
    checked: higgsOn,
    onChange: setHiggsOn
  }), /*#__PURE__*/React.createElement(Toggle, {
    label: "gauge symmetry layers",
    checked: layersOn,
    onChange: setLayersOn
  })), /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    height: 440,
    aria: "Three-dimensional map of the seventeen Standard Model particles",
    initial: {
      radius: 13.5,
      theta: 0.0,
      phi: 1.12,
      target: [0, 0.3, -0.8],
      minR: 6,
      maxR: 30
    },
    build: build
  }), p ? /*#__PURE__*/React.createElement("div", {
    className: "s3d-detail",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("b", null, p.name, " ", /*#__PURE__*/React.createElement("span", {
    className: "dim mono",
    style: {
      fontWeight: 400
    }
  }, p.sym)), /*#__PURE__*/React.createElement("span", {
    className: "mono dim"
  }, "Q = ", p.charge, " e \xB7 spin ", p.spin, " \xB7 ", p.mass, p.gen ? " · gen " + p.gen : ""), /*#__PURE__*/React.createElement("span", {
    className: "small",
    style: {
      flexBasis: "100%"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dim"
  }, "Interactions: "), [p.color && "strong", p.em && p.charge !== "0" && "electromagnetic", p.weak && "weak", p.higgs === true && "Yukawa/Higgs"].filter(Boolean).join(", ") || "—", extra ? /*#__PURE__*/React.createElement("span", null, " \xB7 ", /*#__PURE__*/React.createElement("span", {
    className: "dim"
  }, "Discovered:"), " ", extra.year, " \u2014 ", extra.via) : null), extra ? /*#__PURE__*/React.createElement("span", {
    className: "small dim",
    style: {
      flexBasis: "100%"
    }
  }, extra.role, " ", p.notes) : null) : null, /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "sm-interaction-map",
    status: "schematic"
  }, "Click a node to select it. Glowing packets stream along each arc \u2014 these are the force carriers being exchanged (coloured by the mediating boson: violet gluons, blue W/Z, etc.); gluon and Higgs self-couplings are listed, not drawn. Every particle shows zero-point jitter and spin-correct motion; the floor is the quantum-field vacuum they live in. Toggle the Higgs overlay to watch mass-giving ripples emanate from each massive particle. Node shapes encode class \u2014 faceted: quarks, smooth: leptons, octahedral: gauge bosons. Spatial arrangement is pedagogical, not physical. Gravity does not appear: the Standard Model has no graviton."));
}
function ParticleAtlas() {
  var _useState7 = useState(null),
    _useState8 = _slicedToArray(_useState7, 2),
    hover = _useState8[0],
    setHover = _useState8[1];
  var _useState9 = useState("h"),
    _useState0 = _slicedToArray(_useState9, 2),
    selected = _useState0[0],
    setSelected = _useState0[1];
  var _useState1 = useState(false),
    _useState10 = _slicedToArray(_useState1, 2),
    higgsOn = _useState10[0],
    setHiggsOn = _useState10[1];
  var prm = usePRM();

  // layout: 6 columns — q gen1..3, lepton gen1..3; then bottom rows gauge + higgs
  var fermions = QGA_PARTICLES.filter(function (p) {
    return p.cls === "quark" || p.cls === "lepton";
  });
  var upQ = ["u", "c", "t"],
    downQ = ["d", "s", "b"],
    chL = ["e", "mu", "tau"],
    nuL = ["nue", "numu", "nutau"];
  var rows = [upQ, downQ, chL, nuL].map(function (ids) {
    return ids.map(function (id) {
      return QGA_PARTICLES.find(function (p) {
        return p.id === id;
      });
    });
  });
  var bosons = ["g", "ph", "w", "z", "h"].map(function (id) {
    return QGA_PARTICLES.find(function (p) {
      return p.id === id;
    });
  });
  var focus = hover || selected;
  var focusP = QGA_PARTICLES.find(function (p) {
    return p.id === focus;
  });
  // related set: for a gauge boson, all particles it couples to; for matter, its mediators
  var related = useMemo(function () {
    if (!focusP) return new Set();
    var s = new Set([focusP.id]);
    if (focusP.cls === "gauge" || focusP.cls === "higgs") {
      var _iterator7 = _createForOfIteratorHelper(QGA_PARTICLES),
        _step7;
      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var p = _step7.value;
          if (p.id !== focusP.id && QGA_couplings(p).includes(focusP.id)) s.add(p.id);
        }
        // boson self-couplings
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }
      if (focusP.id === "g") s.add("g");
      if (focusP.id === "h") {
        s.add("w");
        s.add("z");
        s.add("h");
      }
    } else {
      var _iterator8 = _createForOfIteratorHelper(QGA_couplings(focusP)),
        _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
          var b = _step8.value;
          s.add(b);
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
    }
    return s;
  }, [focus]);
  var sel = QGA_PARTICLES.find(function (p) {
    return p.id === selected;
  });
  var cell = function cell(p) {
    if (!p) return null;
    var color = QGA_CLASS_COLORS[p.cls];
    var lit = related.has(p.id) && p.id !== focus;
    var dim = focus && !related.has(p.id);
    var higgsLit = higgsOn && p.higgs === true;
    return /*#__PURE__*/React.createElement("button", {
      key: p.id,
      className: "pt-cell" + (lit ? " lit" : "") + (dim && !higgsLit ? " dimmed" : "") + (selected === p.id ? " selected" : ""),
      style: {
        "--cell-color": color,
        outline: higgsLit ? "1px solid ".concat(QGA_TOKENS.alpha("pigment-amber-80", 0.55)) : "none"
      },
      onMouseEnter: function onMouseEnter() {
        return setHover(p.id);
      },
      onMouseLeave: function onMouseLeave() {
        return setHover(null);
      },
      onFocus: function onFocus() {
        return setHover(p.id);
      },
      onBlur: function onBlur() {
        return setHover(null);
      },
      onClick: function onClick() {
        return setSelected(p.id);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "pt-class-dot"
    }), /*#__PURE__*/React.createElement("div", {
      className: "pt-sym"
    }, p.sym), /*#__PURE__*/React.createElement("div", {
      className: "pt-name"
    }, p.name), /*#__PURE__*/React.createElement("div", {
      className: "pt-mass"
    }, p.mass));
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "pt-wrap"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "pt-grid"
  }, rows.map(function (r, i) {
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, r.map(cell), /*#__PURE__*/React.createElement("div", {
      style: {
        gridColumn: "span 3",
        display: "flex",
        alignItems: "center",
        paddingLeft: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "ctl-label"
    }, ["up-type quarks", "down-type quarks", "charged leptons", "neutrinos"][i])));
  }), bosons.map(cell), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      paddingLeft: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ctl-label"
  }, "bosons"))), /*#__PURE__*/React.createElement("div", {
    className: "pt-legend"
  }, Object.entries({
    quark: "quarks",
    lepton: "leptons",
    gauge: "gauge bosons",
    higgs: "Higgs sector"
  }).map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      k = _ref2[0],
      v = _ref2[1];
    return /*#__PURE__*/React.createElement("span", {
      key: k,
      className: "pt-legend-item"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pt-legend-dot",
      style: {
        background: QGA_CLASS_COLORS[k]
      }
    }), v);
  }), /*#__PURE__*/React.createElement(Toggle, {
    label: "Higgs field coupling overlay",
    checked: higgsOn,
    onChange: setHiggsOn
  })), higgsOn ? /*#__PURE__*/React.createElement("p", {
    className: "small dim",
    style: {
      marginTop: 10
    }
  }, "Gold outline marks particles that acquire mass through interaction with the Higgs field (W, Z, charged fermions, and the Higgs boson itself). Photon and gluon remain massless; neutrino masses require physics beyond the minimal Standard Model.") : null), /*#__PURE__*/React.createElement("aside", {
    className: "pt-detail",
    "aria-live": "polite"
  }, sel ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      marginBottom: 2
    }
  }, sel.name, " ", /*#__PURE__*/React.createElement("span", {
    className: "dim mono",
    style: {
      fontSize: 13
    }
  }, sel.sym)), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-established"
  }, sel.cls)), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("dt", null, "Electric charge"), /*#__PURE__*/React.createElement("dd", {
    className: "mono"
  }, sel.charge, " e"), /*#__PURE__*/React.createElement("dt", null, "Spin"), /*#__PURE__*/React.createElement("dd", {
    className: "mono"
  }, sel.spin, " \u0127"), /*#__PURE__*/React.createElement("dt", null, "Mass (approx., PDG)"), /*#__PURE__*/React.createElement("dd", {
    className: "mono"
  }, sel.mass, sel.mass.includes("*") ? " — oscillation bound" : ""), /*#__PURE__*/React.createElement("dt", null, "Interactions"), /*#__PURE__*/React.createElement("dd", null, [sel.color && "strong", sel.em && sel.charge !== "0" && "electromagnetic", sel.weak && "weak", sel.higgs === true && "Yukawa / Higgs"].filter(Boolean).join(", ") || "—"), sel.mediates ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Mediates"), /*#__PURE__*/React.createElement("dd", null, sel.mediates)) : null, /*#__PURE__*/React.createElement("dt", null, "Notes"), /*#__PURE__*/React.createElement("dd", null, sel.notes))) : /*#__PURE__*/React.createElement("p", {
    className: "dim"
  }, "Select a particle."))), /*#__PURE__*/React.createElement("p", {
    className: "small dim",
    style: {
      marginTop: 12
    }
  }, "Hover a particle to illuminate its interaction channels: matter particles highlight the bosons that couple to them; bosons highlight every particle they mediate interactions between. Click for quantum numbers."));
}
function GaugeSectors() {
  var _useState11 = useState("su2"),
    _useState12 = _slicedToArray(_useState11, 2),
    open = _useState12[0],
    setOpen = _useState12[1];
  var sec = QGA_SECTORS.find(function (s) {
    return s.id === open;
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "gauge-sectors"
  }, QGA_SECTORS.map(function (s) {
    return /*#__PURE__*/React.createElement("button", {
      key: s.id,
      className: "gauge-sector" + (open === s.id ? " on" : ""),
      style: {
        "--sector-color": s.color
      },
      onClick: function onClick() {
        return setOpen(s.id);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "gs-group"
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: s.id === "su3" ? "SU(3)_C" : s.id === "su2" ? "SU(2)_L" : "U(1)_Y"
    })), /*#__PURE__*/React.createElement("div", {
      className: "gs-name"
    }, s.name));
  })), sec ? /*#__PURE__*/React.createElement("div", {
    className: "panel",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      marginBottom: 0,
      fontSize: 14
    }
  }, sec.body)) : null, /*#__PURE__*/React.createElement("p", {
    className: "small dim",
    style: {
      marginTop: 12
    }
  }, "After electroweak symmetry breaking, ", /*#__PURE__*/React.createElement(Eq, {
    tex: "SU(2)_L \\times U(1)_Y \\to U(1)_{\\mathrm{EM}}"
  }), ": the photon is the surviving massless combination, while three would-be Goldstone modes become the longitudinal polarizations of W\xB1 and Z\u2070."));
}

/* ---------- PMNS & CKM mixing-matrix magnitudes (PDG / NuFIT) ---------- */
var CKM_MAG = [[0.97435, 0.22500, 0.00369], [0.22486, 0.97349, 0.04182], [0.00857, 0.04110, 0.999118]];
var PMNS_MAG = [[0.821, 0.550, 0.150], [0.376, 0.610, 0.697], [0.428, 0.580, 0.701]];
function MixingGrid(_ref3) {
  var title = _ref3.title,
    rows = _ref3.rows,
    cols = _ref3.cols,
    mat = _ref3.mat,
    sub = _ref3.sub;
  return /*#__PURE__*/React.createElement("div", {
    className: "panel",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      marginBottom: 4
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "small dim",
    style: {
      margin: "0 0 10px"
    }
  }, sub), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "auto repeat(3, 1fr)",
      gap: 4,
      fontFamily: "var(--font-mono)",
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement("div", null), cols.map(function (c) {
    return /*#__PURE__*/React.createElement("div", {
      key: c,
      style: {
        textAlign: "center",
        color: "var(--dim)",
        paddingBottom: 2
      }
    }, c);
  }), rows.map(function (r, i) {
    return [/*#__PURE__*/React.createElement("div", {
      key: "r" + i,
      style: {
        color: "var(--dim)",
        alignSelf: "center"
      }
    }, r)].concat(_toConsumableArray(mat[i].map(function (v, j) {
      var a = 0.1 + 0.85 * v; // magnitude → opacity
      // Chip lightness is held at 0.48 so the light label clears 4.5:1 at
      // every opacity in the ramp; a lighter chip would need dark text in
      // the mid range, where neither label colour reaches the floor.
      return /*#__PURE__*/React.createElement("div", {
        key: i + "-" + j,
        style: {
          textAlign: "center",
          padding: "8px 2px",
          borderRadius: 5,
          background: QGA_TOKENS.alpha("pigment-azure-48", a.toFixed(2)),
          color: QGA_TOKENS.css("pigment-blue-88-c03"),
          fontWeight: v > 0.4 ? 600 : 400
        }
      }, v < 0.01 ? v.toExponential(1) : v.toFixed(3));
    })));
  })));
}
function MixingMatrices() {
  return /*#__PURE__*/React.createElement("div", {
    className: "grid-2",
    style: {
      alignItems: "stretch"
    }
  }, /*#__PURE__*/React.createElement(MixingGrid, {
    title: "CKM matrix |V| \u2014 quarks",
    sub: "Nearly diagonal: quark flavour mixing is small (Cabibbo angle \u03BB \u2248 0.225).",
    rows: ["d", "s", "b"],
    cols: ["u", "c", "t"],
    mat: CKM_MAG
  }), /*#__PURE__*/React.createElement(MixingGrid, {
    title: "PMNS matrix |U| \u2014 neutrinos",
    sub: "Strongly off-diagonal: lepton mixing is large \u2014 why is one of the open puzzles.",
    rows: ["e", "μ", "τ"],
    cols: ["ν₁", "ν₂", "ν₃"],
    mat: PMNS_MAG
  }));
}
function ModuleSM(_ref4) {
  var go = _ref4.go;
  return /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement(ModuleHeader, {
    num: "01",
    kicker: "Matter & forces",
    title: "The Standard Model of Particle Physics",
    lede: "The Standard Model is a quantum field theory describing all known matter particles and three of the four fundamental interactions. Its structure is dictated almost entirely by one principle: local gauge symmetry under the group SU(3)\xD7SU(2)\xD7U(1).",
    target: ".pmns-ribbon, .feyn-row"
  }), /*#__PURE__*/React.createElement(Section, {
    title: "The particle architecture"
  }, /*#__PURE__*/React.createElement("p", null, "Seventeen fields suffice to describe every confirmed particle physics experiment to date. Twelve fermions (spin-\xBD) constitute matter, arranged in three generations of increasing mass. Four gauge bosons (spin-1) mediate the strong, electromagnetic, and weak interactions. One scalar \u2014 the Higgs boson \u2014 is the visible excitation of the field whose vacuum value breaks electroweak symmetry and endows particles with mass. Orbit the architecture below: matter in the front lattice, force carriers behind, the Higgs above."), /*#__PURE__*/React.createElement(ParticleArchitecture3D, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Analytical particle atlas"
  }, /*#__PURE__*/React.createElement("p", null, "The same seventeen fields as a reference table, with full quantum numbers and interaction channels. Hover to illuminate couplings; click for details."), /*#__PURE__*/React.createElement(ParticleAtlas, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Gauge structure"
  }, /*#__PURE__*/React.createElement("p", null, "Each factor of the gauge group corresponds to one interaction sector. Demanding that the theory be invariant under ", /*#__PURE__*/React.createElement("em", null, "local"), " transformations of these groups forces the existence of the gauge fields and fixes their couplings \u2014 the interactions are not added by hand, they are required by symmetry."), /*#__PURE__*/React.createElement(GaugeSectors, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Symmetry breaking and mass"
  }, /*#__PURE__*/React.createElement("p", null, "A mass term for gauge bosons would violate gauge invariance, yet W and Z are measurably heavy. The resolution is spontaneous symmetry breaking: the Higgs field's potential makes the symmetric configuration unstable, and the field settles into a vacuum with ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\langle\\phi\\rangle = v \\approx 246\\ \\mathrm{GeV}"
  }), ". Particles interacting with this background acquire effective masses while the underlying equations remain symmetric."), /*#__PURE__*/React.createElement(HiggsLab, {
    go: go
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Flavor mixing and neutrino oscillations"
  }, /*#__PURE__*/React.createElement("p", null, "Mass eigenstates and interaction eigenstates are not the same basis \u2014 the mismatch is encoded in two unitary mixing matrices: ", /*#__PURE__*/React.createElement("strong", null, "CKM"), " for quarks and ", /*#__PURE__*/React.createElement("strong", null, "PMNS"), " for leptons. The quark matrix is nearly diagonal (small mixing); the lepton matrix is strongly off-diagonal, and its reality is established by neutrino oscillations \u2014 flavor that changes with distance, which is only possible if neutrinos have mass. This is the single confirmed crack in the minimal Standard Model."), /*#__PURE__*/React.createElement(NeutrinoLab, null), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(MixingMatrices, null))), /*#__PURE__*/React.createElement(Section, {
    title: "Collisions, computed"
  }, /*#__PURE__*/React.createElement("p", null, "The Standard Model is tested by colliding particles and reading the debris. This lab generates a synthetic proton\u2013proton event from the shared seed \u2014 exact two-body kinematics, on-shell masses, and a disclosed jet clusterer \u2014 and renders it inside a barrel detector: beams collide at the vertex, charged tracks curve by charge over p", /*#__PURE__*/React.createElement("sub", null, "T"), ", calorimeter towers rise with transverse energy, jet cones mark hadronic clusters, and the dashed arrow balances missing transverse momentum. Pick a channel, click a track, and watch the invariant-mass readout recover the Higgs, Z, or top. Everything is computed by", /*#__PURE__*/React.createElement("code", null, " js/science/collider-kinematics.mjs"), "; the events are synthetic fixtures, not observations."), /*#__PURE__*/React.createElement(ColliderLabSection, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Mathematical formulation"
  }, /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Standard Model gauge group",
    status: "established",
    formulaId: "sm-gauge-group",
    symbols: [{
      s: "SU(3)_C",
      d: "Color symmetry of the strong interaction; acts on quark color triplets via eight gluons."
    }, {
      s: "SU(2)_L",
      d: "Weak isospin; acts only on left-handed fermion doublets (parity violation)."
    }, {
      s: "U(1)_Y",
      d: "Hypercharge phase symmetry; combines with SU(2)_L to yield electromagnetism after symmetry breaking."
    }],
    meaning: "The full symmetry group of the Standard Model Lagrangian. Every interaction (other than gravity) follows from gauging these three factors.",
    limits: "Gravity is absent. Neutrino masses require additional structure. Why this group, with these representations and three generations, is unexplained."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Higgs potential",
    status: "established",
    formulaId: "higgs-potential-card",
    symbols: [{
      s: "\\phi",
      d: "Complex SU(2) doublet scalar field (four real components)."
    }, {
      s: "\\mu^2",
      d: "Mass-squared parameter; $\\mu^2<0$ destabilizes the symmetric vacuum."
    }, {
      s: "\\lambda",
      d: "Quartic self-coupling; $\\lambda>0$ ensures the potential is bounded below."
    }],
    meaning: "With $\\mu^2<0$ the minimum sits at $|\\phi|^2=-\\mu^2/2\\lambda\\equiv v^2/2$. Three components become longitudinal modes of $W^\\pm$ and $Z$; the fourth is the 125 GeV Higgs boson.",
    limits: "Why $\\mu^2$ is small compared to the Planck scale (the hierarchy problem) has no accepted explanation."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Lagrangian structure (schematic)",
    status: "established",
    formulaId: "sm-lagrangian",
    symbols: [{
      s: "F_{\\mu\\nu}^a",
      d: "Field strength tensors of the three gauge sectors (kinetic terms and self-interactions)."
    }, {
      s: "\\bar\\psi\\,\\gamma^\\mu D_\\mu\\psi",
      d: "Fermion kinetic terms; the covariant derivative D encodes all gauge interactions."
    }, {
      s: "|D_\\mu\\phi|^2",
      d: "Higgs kinetic term; generates W and Z masses after symmetry breaking."
    }, {
      s: "Y",
      d: "Yukawa coupling matrices; generate fermion masses and quark mixing (CKM)."
    }],
    meaning: "A compressed schematic of the full Standard Model Lagrangian \u2014 each displayed term stands for a family of terms summed over gauge groups, generations, and chiralities.",
    limits: "Schematic form: gauge-fixing, ghost terms, and the $\\theta$-term are omitted; indices are suppressed."
  }))), /*#__PURE__*/React.createElement(Misconception, {
    title: "The Standard Model does not include gravity."
  }, "All Standard Model successes concern three interactions only. Gravity is described separately by general relativity, and no experiment yet probes a regime where both quantum field theory and dynamical spacetime matter simultaneously. That gap is the subject of this atlas."), /*#__PURE__*/React.createElement(Misconception, {
    title: "The Higgs field does not work like friction."
  }, "Mass generation is not a drag force \u2014 a viscous medium would violate momentum conservation and Lorentz invariance. Masses arise from interaction energy with a uniform, Lorentz-invariant background field value."), /*#__PURE__*/React.createElement(ConceptBridge, {
    id: "sm-qft",
    go: go
  }));
}
window.ModuleSM = ModuleSM;
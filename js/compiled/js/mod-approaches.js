/* Compiled from js/mod-approaches.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _construct(t, e, r) { if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && _setPrototypeOf(p, r.prototype), p; }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// mod-approaches.jsx — Module 06: Major Quantum Gravity Approaches
/* ---------- 3D theory constellation ---------- */
var CONST_NODES = [{
  id: "string",
  pos: [-4.6, 1.8, -0.6],
  hex: QGA_TOKENS.hex("pigment-violet-72-c15")
}, {
  id: "lqg",
  pos: [4.6, 1.8, -0.6],
  hex: QGA_TOKENS.hex("pigment-cyan-80-c09")
}, {
  id: "eft",
  pos: [0, -0.2, 4.2],
  hex: QGA_TOKENS.hex("pigment-green-82")
}, {
  id: "asymsafe",
  pos: [-3.6, -1.4, -3.8],
  hex: QGA_TOKENS.hex("pigment-blue-72")
}, {
  id: "holo",
  pos: [3.6, -1.4, -3.8],
  hex: QGA_TOKENS.hex("pigment-amber-79-c12")
}];
function TheoryConstellation3D() {
  var _useState = useState("string"),
    _useState2 = _slicedToArray(_useState, 2),
    sel = _useState2[0],
    setSel = _useState2[1];
  var selRef = useRef(sel);
  selRef.current = sel;
  var build = function build(ctx) {
    var THREE = ctx.THREE,
      scene = ctx.scene;
    scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.016);
    scene.add(new THREE.AmbientLight(QGA_TOKENS.hex("pigment-blue-68"), 0.6));
    var key = new THREE.DirectionalLight(QGA_TOKENS.hex("pigment-blue-86"), 0.85);
    key.position.set(4, 8, 6);
    scene.add(key);
    var floor = ctx.grid(20, 20, QGA_TOKENS.hex("pigment-blue-35"), 0.18);
    floor.position.y = -3.2;
    scene.add(floor);

    // starfield backdrop
    var det0 = ctx.settings.current.detail3d;
    var starN = det0 === "low" ? 220 : 480,
      rnd = QGA_SEEDED(0x61e5c);
    var sGeo = new THREE.BufferGeometry();
    var sPos = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) {
      var u = rnd() * 2 - 1,
        a = rnd() * Math.PI * 2,
        rr = Math.sqrt(1 - u * u),
        R = 34 + rnd() * 40;
      sPos[i * 3] = Math.cos(a) * rr * R;
      sPos[i * 3 + 1] = u * R * 0.8;
      sPos[i * 3 + 2] = Math.sin(a) * rr * R;
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    var starField = new THREE.Points(sGeo, new THREE.PointsMaterial({
      size: 1.2,
      map: qgaGlowTexture(),
      color: QGA_TOKENS.hex("pigment-blue-83"),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    }));
    scene.add(ctx.tag(starField, "decoration"));
    var core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 26, 18), new THREE.MeshStandardMaterial({
      color: QGA_TOKENS.hex("pigment-grey-96-c01"),
      emissive: QGA_TOKENS.hex("pigment-blue-78-c05"),
      emissiveIntensity: 0.85
    }));
    scene.add(ctx.tag(core, "data"));
    var coreGlow = ctx.glow(QGA_TOKENS.hex("pigment-blue-91-c03"), 4.2, 0.5);
    scene.add(coreGlow);
    ctx.label("the quantum gravity problem", function () {
      return {
        x: 0,
        y: 1.05,
        z: 0
      };
    }, "s3d-strong");
    var geoFor = function geoFor(id) {
      return id === "string" ? new THREE.TorusKnotGeometry(0.42, 0.13, 80, 12) : id === "lqg" ? new THREE.IcosahedronGeometry(0.58, 0) : id === "eft" ? new THREE.SphereGeometry(0.5, 24, 18) : id === "asymsafe" ? new THREE.OctahedronGeometry(0.6, 0) : new THREE.TorusGeometry(0.46, 0.16, 14, 36);
    };
    var nodes = [];
    var links = [];
    var _iterator = _createForOfIteratorHelper(CONST_NODES),
      _step;
    try {
      var _loop = function _loop() {
        var _m$position;
        var n = _step.value;
        var th = QGA_THEORIES.find(function (x) {
          return x.id === n.id;
        });
        var m = new THREE.Mesh(geoFor(n.id), new THREE.MeshStandardMaterial({
          color: n.hex,
          emissive: n.hex,
          emissiveIntensity: 0.6,
          metalness: 0.35,
          roughness: 0.4,
          flatShading: n.id === "lqg" || n.id === "asymsafe"
        }));
        (_m$position = m.position).set.apply(_m$position, _toConsumableArray(n.pos));
        m.userData = {
          id: n.id,
          base: _construct(THREE.Vector3, _toConsumableArray(n.pos)),
          hex: n.hex
        };
        scene.add(ctx.tag(m, "data"));
        var g = ctx.glow(n.hex, 3.0, 0.34);
        g.position.copy(m.position);
        scene.add(g);
        m.userData.glow = g;
        var link = ctx.line([new THREE.Vector3(0, 0, 0), m.position.clone()], n.hex, 0.45, true);
        link.material.blending = THREE.AdditiveBlending;
        link.material.depthWrite = false;
        link.userData = {
          id: n.id
        };
        scene.add(ctx.tag(link, "data"));
        links.push(link);
        ctx.label(th.name, function () {
          return {
            x: m.position.x,
            y: m.position.y - 1.0,
            z: m.position.z
          };
        }, "s3d-quiet");
        nodes.push(m);
      };
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        _loop();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    var ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 10, 64), new THREE.MeshBasicMaterial({
      color: QGA_TOKENS.hex("pigment-white"),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    scene.add(ctx.tag(ring, "model"));
    ctx.annotation("no winner is implied — none of these programs is experimentally confirmed", function () {
      return {
        x: 0,
        y: -2.7,
        z: 3.4
      };
    });
    return {
      pickables: nodes,
      onPick: function onPick(o) {
        if (o && o.userData && o.userData.id) setSel(o.userData.id);
      },
      update: function update(t, dt) {
        var mo = ctx.motion();
        starField.rotation.y += dt * 0.01 * mo;
        for (var _i = 0, _nodes = nodes; _i < _nodes.length; _i++) {
          var m = _nodes[_i];
          var on = m.userData.id === selRef.current;
          m.rotation.y += dt * 0.4 * mo;
          m.position.y = m.userData.base.y + (mo > 0 ? Math.sin(t * 0.8 + m.userData.base.x) * 0.12 * mo : 0);
          m.userData.glow.position.copy(m.position);
          m.userData.glow.material.opacity = on ? 0.7 : 0.3;
          m.material.emissiveIntensity = on ? 1.0 : 0.6;
        }
        for (var _i2 = 0, _links = links; _i2 < _links.length; _i2++) {
          var link = _links[_i2];
          link.material.opacity = link.userData.id === selRef.current ? 0.85 : 0.4;
        }
        var selNode = nodes.find(function (m) {
          return m.userData.id === selRef.current;
        });
        if (selNode) {
          ring.position.copy(selNode.position);
          ring.scale.setScalar(1.25 + (mo > 0 ? 0.06 * Math.sin(t * 3) : 0));
          ring.lookAt(ctx.camera.position);
        }
        coreGlow.material.opacity = 0.45 + (mo > 0 ? 0.1 * Math.sin(t * 1.1) : 0);
      }
    };
  };
  var t = QGA_THEORIES.find(function (x) {
    return x.id === sel;
  });
  var meta = QGA_THEORY_META[sel];
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    height: 430,
    aria: "Constellation of the major quantum gravity research programs; click a node to inspect it",
    initial: {
      radius: 13,
      theta: 0.2,
      phi: 1.05,
      minR: 7,
      maxR: 28,
      bloom: {
        strength: 0.8,
        radius: 0.6,
        threshold: 0.16
      }
    },
    build: build,
    fallback: /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "14px"
      },
      className: "small dim"
    }, "The comparator below carries the full content of this scene.")
  }), t ? /*#__PURE__*/React.createElement("div", {
    className: "s3d-detail",
    "aria-live": "polite",
    style: {
      flexDirection: "column",
      alignItems: "stretch",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "baseline",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("b", null, t.name), /*#__PURE__*/React.createElement(Badge, {
    kind: t.status
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono dim small"
  }, meta.since, " \xB7 ", meta.founders)), /*#__PURE__*/React.createElement("span", {
    className: "small"
  }, /*#__PURE__*/React.createElement(RichText, {
    text: t.rows.idea["short"]
  }), " ", /*#__PURE__*/React.createElement(RichText, {
    text: t.rows.spacetime["short"]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono dim",
    style: {
      fontSize: 10.5,
      letterSpacing: "0.08em",
      textTransform: "uppercase"
    }
  }, meta.eqName), /*#__PURE__*/React.createElement(Eq, {
    tex: meta.eq
  })), /*#__PURE__*/React.createElement("span", {
    className: "small dim"
  }, "Open: ", /*#__PURE__*/React.createElement(RichText, {
    text: t.rows.problems["short"]
  }), " \xB7 Experiment: ", /*#__PURE__*/React.createElement(RichText, {
    text: t.rows.experiment["short"]
  }))) : null, /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "approaches-orrery",
    status: "conjectural"
  }, "Five research programs orbiting the same unsolved problem. Click a node for its core idea, defining equation, experimental status, and open problems \u2014 the comparator below makes the full aspect-by-aspect comparison. Positions and shapes are mnemonic, not meaningful."));
}
function MicrostructureViz() {
  var _useState3 = useState("string"),
    _useState4 = _slicedToArray(_useState3, 2),
    mode = _useState4[0],
    setMode = _useState4[1];
  var modeRef = useRef(mode);
  modeRef.current = mode;
  var _useState5 = useState(3),
    _useState6 = _slicedToArray(_useState5, 2),
    n = _useState6[0],
    setN = _useState6[1]; // string harmonic
  var nRef = useRef(n);
  nRef.current = n;
  var prm = usePRM();
  var netRef = useRef(null);
  if (!netRef.current) {
    // build a small random spin network graph
    var nodes = [],
      rnd = QGA_SEEDED(0x5e17);
    for (var i = 0; i < 14; i++) nodes.push({
      x: 0.12 + rnd() * 0.76,
      y: 0.15 + rnd() * 0.7
    });
    var edges = [];
    var _loop2 = function _loop2(_i3) {
      var dists = nodes.map(function (q, j) {
        return {
          j: j,
          d: Math.hypot(q.x - nodes[_i3].x, q.y - nodes[_i3].y)
        };
      }).filter(function (e) {
        return e.j !== _i3;
      }).sort(function (a, b) {
        return a.d - b.d;
      });
      var _loop3 = function _loop3() {
        var j = dists[k].j;
        if (!edges.some(function (e) {
          return e.a === _i3 && e.b === j || e.a === j && e.b === _i3;
        })) edges.push({
          a: _i3,
          b: j,
          spin: [["1/2", 1], ["1", 2], ["3/2", 3], ["2", 4]][Math.floor(rnd() * 4)]
        });
      };
      for (var k = 0; k < 2; k++) {
        _loop3();
      }
    };
    for (var _i3 = 0; _i3 < nodes.length; _i3++) {
      _loop2(_i3);
    }
    netRef.current = {
      nodes: nodes,
      edges: edges
    };
  }
  var sim = useSimLoop(function (ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    var tt = prm ? 0.7 : t;
    if (modeRef.current === "string") {
      var cx = w / 2,
        cy = h / 2,
        len = Math.min(w * 0.7, 420),
        amp = h * 0.22;
      var k = nRef.current;
      // standing wave on a string: y = A sin(nπx/L) cos(ωt), ω ∝ n
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.25);
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(cx - len / 2, cy);
      ctx.lineTo(cx + len / 2, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.save();
      ctx.shadowColor = QGA_TOKENS.css("pigment-violet-72");
      ctx.shadowBlur = 12;
      ctx.strokeStyle = QGA_TOKENS.css("pigment-violet-72");
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (var _i4 = 0; _i4 <= 120; _i4++) {
        var f = _i4 / 120;
        var x = cx - len / 2 + f * len;
        var y = cy + amp * Math.sin(k * Math.PI * f) * Math.cos(tt * (1.1 + 0.8 * k));
        if (_i4 === 0) ctx.moveTo(x, y);else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = QGA_TOKENS.css("pigment-grey-92");
      ctx.beginPath();
      ctx.arc(cx - len / 2, cy, 3, 0, Math.PI * 2);
      ctx.arc(cx + len / 2, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = QGA_TOKENS.monoPx(10);
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-81", 0.7);
      ctx.fillText("vibration mode n = " + k + "  →  one particle species (mass² ∝ mode number)", 14, 22);
      ctx.fillText("n = 2 closed-string mode: massless spin-2 → the graviton", 14, h - 14);
    } else {
      var _netRef$current = netRef.current,
        _nodes2 = _netRef$current.nodes,
        _edges = _netRef$current.edges;
      var px = function px(q) {
        return [q.x * w, q.y * h];
      };
      ctx.font = QGA_TOKENS.monoPx(10);
      var _iterator2 = _createForOfIteratorHelper(_edges),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var e = _step2.value;
          var _px = px(_nodes2[e.a]),
            _px2 = _slicedToArray(_px, 2),
            x1 = _px2[0],
            y1 = _px2[1],
            _px3 = px(_nodes2[e.b]),
            _px4 = _slicedToArray(_px3, 2),
            x2 = _px4[0],
            y2 = _px4[1];
          var pulse = prm ? 0.5 : 0.4 + 0.25 * Math.sin(tt * 1.4 + e.a + e.b);
          ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-71", pulse.toFixed(3));
          ctx.lineWidth = e.spin[1] * 0.8;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.fillStyle = QGA_TOKENS.alpha("pigment-amber-79-c12", 0.85);
          ctx.fillText("j=" + e.spin[0], (x1 + x2) / 2 + 4, (y1 + y2) / 2 - 4);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      var _iterator3 = _createForOfIteratorHelper(_nodes2),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var q = _step3.value;
          var _px5 = px(q),
            _px6 = _slicedToArray(_px5, 2),
            _x = _px6[0],
            _y = _px6[1];
          ctx.fillStyle = QGA_TOKENS.css("pigment-cyan-78");
          ctx.beginPath();
          ctx.arc(_x, _y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-81", 0.7);
      ctx.fillText("spin network: edges carry SU(2) spins j; a surface crossing an edge gains area ∝ √(j(j+1)) l_P²", 14, 22);
      ctx.fillText("nodes carry quantized volume — geometry itself is the quantum variable", 14, h - 14);
    }
  }, [prm]);
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn" + (mode === "string" ? " on" : ""),
    onClick: function onClick() {
      return setMode("string");
    }
  }, "String vibration"), /*#__PURE__*/React.createElement("button", {
    className: "btn" + (mode === "spin" ? " on" : ""),
    onClick: function onClick() {
      return setMode("spin");
    }
  }, "Spin network")), mode === "string" ? /*#__PURE__*/React.createElement(SliderRow, {
    label: "harmonic n",
    min: 1,
    max: 6,
    step: 1,
    value: n,
    onChange: setN,
    format: function format(v) {
      return String(v);
    }
  }) : null), /*#__PURE__*/React.createElement("canvas", {
    ref: sim.canvasRef,
    className: "viz-canvas",
    style: {
      height: 260
    }
  }), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "approaches-microstructure",
    status: "schematic"
  }, "Two candidate microstructures for the same macroscopic spacetime. Left mode: in string theory the particle spectrum is the harmonic spectrum of an extended object. Right mode: in loop quantum gravity, space is a superposition of spin networks with discrete geometric spectra. Both are conceptual renderings of mathematics, not images of observed objects."));
}
function TheoryComparator() {
  var _useState7 = useState("matrix"),
    _useState8 = _slicedToArray(_useState7, 2),
    mode = _useState8[0],
    setMode = _useState8[1]; // matrix | duel
  var _useState9 = useState({
      th: "string",
      row: "idea"
    }),
    _useState0 = _slicedToArray(_useState9, 2),
    sel = _useState0[0],
    setSel = _useState0[1];
  var _useState1 = useState(["string", "lqg"]),
    _useState10 = _slicedToArray(_useState1, 2),
    duel = _useState10[0],
    setDuel = _useState10[1];
  var T = QGA_THEORIES;
  var selTheory = T.find(function (t) {
    return t.id === sel.th;
  });
  var selRow = QGA_ROWS.find(function (r) {
    return r.id === sel.row;
  });
  var statusBadge = function statusBadge(t) {
    return /*#__PURE__*/React.createElement(Badge, {
      kind: t.status
    });
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn" + (mode === "matrix" ? " on" : ""),
    onClick: function onClick() {
      return setMode("matrix");
    }
  }, "Full matrix"), /*#__PURE__*/React.createElement("button", {
    className: "btn" + (mode === "duel" ? " on" : ""),
    onClick: function onClick() {
      return setMode("duel");
    }
  }, "Compare two")), mode === "duel" ? /*#__PURE__*/React.createElement("span", {
    className: "fey-row"
  }, /*#__PURE__*/React.createElement("select", {
    value: duel[0],
    onChange: function onChange(e) {
      return setDuel([e.target.value, duel[1]]);
    }
  }, T.map(function (t) {
    return /*#__PURE__*/React.createElement("option", {
      key: t.id,
      value: t.id
    }, t.name);
  })), /*#__PURE__*/React.createElement("span", {
    className: "ctl-label"
  }, "vs"), /*#__PURE__*/React.createElement("select", {
    value: duel[1],
    onChange: function onChange(e) {
      return setDuel([duel[0], e.target.value]);
    }
  }, T.map(function (t) {
    return /*#__PURE__*/React.createElement("option", {
      key: t.id,
      value: t.id
    }, t.name);
  }))) : null), mode === "matrix" ? /*#__PURE__*/React.createElement("div", {
    className: "cmp-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "cmp-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "cmp-rowlabel"
  }, "aspect"), T.map(function (t) {
    return /*#__PURE__*/React.createElement("th", {
      key: t.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
        alignItems: "flex-start"
      }
    }, /*#__PURE__*/React.createElement("span", null, t.name), statusBadge(t)));
  }))), /*#__PURE__*/React.createElement("tbody", null, QGA_ROWS.map(function (r) {
    return /*#__PURE__*/React.createElement("tr", {
      key: r.id
    }, /*#__PURE__*/React.createElement("td", {
      className: "cmp-rowlabel"
    }, r.label), T.map(function (t) {
      return /*#__PURE__*/React.createElement("td", {
        key: t.id,
        className: "cmp-cell" + (sel.th === t.id && sel.row === r.id ? " sel" : ""),
        onClick: function onClick() {
          return setSel({
            th: t.id,
            row: r.id
          });
        }
      }, /*#__PURE__*/React.createElement(RichText, {
        text: t.rows[r.id]["short"]
      }));
    }));
  })))) : /*#__PURE__*/React.createElement("div", {
    className: "cmp-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "cmp-table",
    style: {
      minWidth: 560
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "cmp-rowlabel"
  }, "aspect"), duel.map(function (id) {
    var t = T.find(function (x) {
      return x.id === id;
    });
    return /*#__PURE__*/React.createElement("th", {
      key: id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
        alignItems: "flex-start"
      }
    }, /*#__PURE__*/React.createElement("span", null, t.name), statusBadge(t)));
  }))), /*#__PURE__*/React.createElement("tbody", null, QGA_ROWS.map(function (r) {
    return /*#__PURE__*/React.createElement("tr", {
      key: r.id
    }, /*#__PURE__*/React.createElement("td", {
      className: "cmp-rowlabel"
    }, r.label), duel.map(function (id) {
      var t = T.find(function (x) {
        return x.id === id;
      });
      return /*#__PURE__*/React.createElement("td", {
        key: id,
        className: "cmp-cell" + (sel.th === id && sel.row === r.id ? " sel" : ""),
        onClick: function onClick() {
          return setSel({
            th: id,
            row: r.id
          });
        }
      }, t.rows[r.id]["long"]);
    }));
  })))), mode === "matrix" && selTheory ? /*#__PURE__*/React.createElement("div", {
    className: "panel cmp-expand"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      marginBottom: 4
    }
  }, selTheory.name, " \u2014 ", selRow.label.toLowerCase()), statusBadge(selTheory)), /*#__PURE__*/React.createElement("p", {
    style: {
      marginBottom: 0,
      fontSize: 14
    }
  }, selTheory.rows[selRow.id]["long"])) : null, /*#__PURE__*/React.createElement("p", {
    className: "small dim",
    style: {
      marginTop: 10
    }
  }, "Click any cell for the expanded explanation. Confidence labels: ", /*#__PURE__*/React.createElement(Badge, {
    kind: "effective"
  }), " = rigorous within a limited domain; ", /*#__PURE__*/React.createElement(Badge, {
    kind: "conjectural"
  }), " = mathematically developed but experimentally unconfirmed."));
}
function ModuleApproaches(_ref) {
  var go = _ref.go;
  return /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement(ModuleHeader, {
    num: "06",
    kicker: "The contenders",
    title: "Major Approaches to Quantum Gravity",
    lede: "No complete, experimentally confirmed theory of quantum gravity exists. What exists is a set of serious research programs, each rescuing a different virtue \u2014 perturbative finiteness, background independence, nonperturbative definition \u2014 at a different cost. This module compares them honestly.",
    target: "[data-figure=\"approaches-spectral-dimension\"]"
  }), /*#__PURE__*/React.createElement(Section, {
    title: "The theory constellation"
  }, /*#__PURE__*/React.createElement(TheoryConstellation3D, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Candidate microstructures"
  }, /*#__PURE__*/React.createElement(MicrostructureViz, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Causal sets, computed"
  }, /*#__PURE__*/React.createElement("p", null, "The first program in this module you can run yourself. A causal set keeps one thing and throws everything else away: the order of events. Sprinkle points at random into a diamond of flat spacetime, keep only which element can influence which, and the dimension comes back out of that order alone. Nothing in the code below knows how many dimensions it is drawing \u2014 the estimator has to work it out."), /*#__PURE__*/React.createElement(CausalSetLab, null)), /*#__PURE__*/React.createElement(Section, {
    title: "The spectral dimension, compared"
  }, /*#__PURE__*/React.createElement(SpectralDimensionChart, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Causal dynamical triangulations, computed"
  }, /*#__PURE__*/React.createElement("p", null, "The one program in this comparison whose number is ", /*#__PURE__*/React.createElement("em", null, "measured"), " rather than argued. Build a cylinder of time slices out of triangles, let the slice volumes relax under volume-conserving moves, then set a random walk loose on the dual graph: the rate at which it returns tells you how many dimensions it is moving in."), /*#__PURE__*/React.createElement(CdtLab, null)), /*#__PURE__*/React.createElement(Section, {
    title: "The string spectrum, counted"
  }, /*#__PURE__*/React.createElement("p", null, "The other computed program. Every level of the open bosonic string is a whole tower of states, and the tower heights are a number-theory fact rather than a parameter: they are the coefficients of a single generating function. The ground state is a tachyon, which is why this spectrum is a lesson and not a theory of nature."), /*#__PURE__*/React.createElement(StringSpectrumLab, null), /*#__PURE__*/React.createElement("div", {
    className: "derivation-grid"
  }, /*#__PURE__*/React.createElement(DerivationStepper, {
    derivationId: "derivation-critical-dimension"
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "The comparator"
  }, /*#__PURE__*/React.createElement(TheoryComparator, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Key equations across the programs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Polyakov action (string theory)",
    status: "conjectural",
    formulaId: "qg-polyakov-action",
    symbols: [{
      s: "X^\\mu(\\sigma,\\tau)",
      d: "Embedding of the string worldsheet into spacetime."
    }, {
      s: "h_{ab}",
      d: "Independent worldsheet metric; integrating it out recovers the Nambu–Goto area action."
    }, {
      s: "T",
      d: "String tension, setting the string scale; $T=1/(2\\pi\\alpha')$."
    }],
    meaning: "The starting point of string perturbation theory: a 2D field theory whose consistency conditions (conformal invariance) reproduce Einstein's equations for the background \u2014 gravity emerges from the worldsheet.",
    limits: "Defines the theory only perturbatively, around a chosen background. Conjectural as a description of nature."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Wheeler\u2013DeWitt equation (canonical QG)",
    status: "conjectural",
    formulaId: "qg-wheeler-dewitt",
    symbols: [{
      s: "\\Psi[h_{ij}]",
      d: "Wave functional over 3-geometries — the 'wave function of the universe'."
    }, {
      s: "\\hat{\\mathcal{H}}",
      d: "Hamiltonian constraint operator of quantized general relativity."
    }, {
      s: "= 0",
      d: "Time has disappeared: dynamics is encoded as a constraint, not an evolution equation — the 'problem of time'."
    }],
    meaning: "The formal core of canonical quantum gravity (DeWitt 1967), ancestral to loop quantum gravity. Solving it \u2014 even defining it precisely \u2014 remains the central open task of the canonical program.",
    limits: "Formally divergent as written; LQG's spin-network representation is one attempt to make it well-defined."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Bekenstein\u2013Hawking entropy",
    status: "established",
    formulaId: "bh-entropy-plain",
    symbols: [{
      s: "A",
      d: "Area of the event horizon."
    }, {
      s: "k_B",
      d: "Boltzmann constant — this is genuine thermodynamic entropy."
    }, {
      s: "G\\hbar",
      d: "Gravity and quantum theory in one formula: the only confirmed-by-consistency window into quantum gravity."
    }],
    meaning: "Entropy scaling with area rather than volume is the single most influential clue in the field \u2014 every serious approach is judged by whether it can derive this formula microscopically. String theory (Strominger\u2013Vafa) and LQG both claim derivations in special cases.",
    limits: "The formula itself is semiclassical; a direct measurement of black hole thermodynamics remains far beyond experiment."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "AdS/CFT dictionary (schematic)",
    status: "conjectural",
    formulaId: "bh-ads-cft",
    symbols: [{
      s: "Z_{\\mathrm{grav}}",
      d: "Gravitational partition function in the anti-de Sitter bulk, with boundary condition $J$ for the field $\\phi$."
    }, {
      s: "\\mathcal{O}",
      d: "Dual operator in the boundary conformal field theory."
    }, {
      s: "J",
      d: "Source on the boundary — knobs on the CFT side correspond to boundary values of bulk fields."
    }],
    meaning: "The Gubser\u2013Klebanov\u2013Polyakov\u2013Witten relation: every bulk gravitational question can in principle be translated into a boundary gauge-theory computation. Quantum gravity in AdS is defined by an ordinary quantum theory.",
    limits: "Precise duality conjectured for specific theories (e.g. $\\mathrm{AdS}_5\\times S^5\\leftrightarrow\\mathcal{N}=4$ SYM); unproven mathematically; our universe is not anti-de Sitter."
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "Holography, computed"
  }, /*#__PURE__*/React.createElement("p", null, "The holographic principle claims that the physics of a volume is encoded on its boundary. In AdS/CFT this becomes a precise (if conjectural) dictionary, and the Ryu\u2013Takayanagi proposal turns entanglement entropy into geometry: the entropy of a boundary region equals the length of the minimal surface anchoring it. This lab makes that statement visible \u2014 a true Poincar\xE9 disk with exact hyperbolic geodesics, a featured boundary region, its gold minimal surface, and the magenta entanglement wedge it encloses. The entropy readout is the tested formula ", /*#__PURE__*/React.createElement("code", null, "S = (c/6)\xB7L_reg"), ", computed by", /*#__PURE__*/React.createElement("code", null, " js/science/ads-geometry.mjs"), "; the duality itself remains conjecture."), /*#__PURE__*/React.createElement(AdsLabSection, null)), /*#__PURE__*/React.createElement(Misconception, {
    title: "No quantum gravity theory is experimentally confirmed."
  }, "Every entry in the comparator is constrained by internal consistency and by recovering known physics \u2014 not by Planck-scale data. Statements like 'string theory predicts X was confirmed' or 'LQG proved space is discrete' overstate the field. The honest summary: several mathematically serious programs, zero decisive experiments."), /*#__PURE__*/React.createElement(ConceptBridge, {
    id: "approaches-bh",
    go: go
  }));
}
window.ModuleApproaches = ModuleApproaches;
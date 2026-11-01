/* Compiled from js/mod-qft.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _construct(t, e, r) { if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && _setPrototypeOf(p, r.prototype), p; }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// mod-qft.jsx — Module 02: Quantum Field Theory
/* ---------- Feynman diagram builder ---------- */
var FEY_PARTICLES = [{
  id: "e-",
  label: "e⁻",
  tex: "e^-",
  anti: false,
  q: -1,
  le: 1,
  lmu: 0,
  type: "lepton"
}, {
  id: "e+",
  label: "e⁺",
  tex: "e^+",
  anti: true,
  q: 1,
  le: -1,
  lmu: 0,
  type: "lepton"
}, {
  id: "mu-",
  label: "μ⁻",
  tex: "\\mu^-",
  anti: false,
  q: -1,
  le: 0,
  lmu: 1,
  type: "lepton"
}, {
  id: "mu+",
  label: "μ⁺",
  tex: "\\mu^+",
  anti: true,
  q: 1,
  le: 0,
  lmu: -1,
  type: "lepton"
}, {
  id: "q",
  label: "q (quark)",
  tex: "q",
  anti: false,
  q: 2 / 3,
  le: 0,
  lmu: 0,
  type: "quark"
}, {
  id: "qbar",
  label: "q̄ (antiquark)",
  tex: "\\bar{q}",
  anti: true,
  q: -2 / 3,
  le: 0,
  lmu: 0,
  type: "quark"
}, {
  id: "ph",
  label: "γ",
  tex: "\\gamma",
  anti: false,
  q: 0,
  le: 0,
  lmu: 0,
  type: "photon"
}];
var GAMMA_Z_TEX = "\\gamma / Z^0";
function feyAnalyze(in1, in2, out1, out2) {
  var P = function P(id) {
    return FEY_PARTICLES.find(function (p) {
      return p.id === id;
    });
  };
  var a = P(in1),
    b = P(in2),
    c = P(out1),
    d = P(out2);
  var sum = function sum(f) {
    return f(a) + f(b) - f(c) - f(d);
  };
  var dQ = sum(function (p) {
      return p.q;
    }),
    dLe = sum(function (p) {
      return p.le;
    }),
    dLmu = sum(function (p) {
      return p.lmu;
    });
  if (Math.abs(dQ) > 1e-9) return {
    ok: false,
    reason: "Electric charge is not conserved (ΔQ = " + dQ.toFixed(2) + " e). Every interaction vertex in the Standard Model conserves electric charge exactly, so no diagram exists for this process."
  };
  if (Math.abs(dLe) > 1e-9 || Math.abs(dLmu) > 1e-9) return {
    ok: false,
    reason: "Lepton flavor number is not conserved (ΔLₑ = " + dLe + ", ΔL_μ = " + dLmu + "). In the Standard Model with massless neutrinos, electron number and muon number are separately conserved at every vertex. (Neutrino oscillations violate flavor conservation, but only via neutrino mass terms — not in charged-lepton processes at tree level.)"
  };
  var ids = [in1, in2].sort().join(","),
    ods = [out1, out2].sort().join(",");
  var isPair = function isPair(x, y, m) {
    return x === m + "-" && y === m + "+" || x === m + "+" && y === m + "-";
  };
  // classify topology
  if (isPair(in1, in2, "e") && isPair(out1, out2, "mu")) return {
    ok: true,
    topo: "s",
    boson: "γ / Z⁰",
    bosonTex: GAMMA_Z_TEX,
    channels: ["s"],
    note: "s-channel annihilation: the e⁺e⁻ pair annihilates into a virtual photon (or Z⁰), which materializes as a μ⁺μ⁻ pair. The classic QED benchmark process."
  };
  if (isPair(in1, in2, "mu") && isPair(out1, out2, "e")) return {
    ok: true,
    topo: "s",
    boson: "γ / Z⁰",
    bosonTex: GAMMA_Z_TEX,
    channels: ["s"],
    note: "s-channel annihilation: μ⁺μ⁻ → γ* → e⁺e⁻."
  };
  if (isPair(in1, in2, "e") && isPair(out1, out2, "e") || isPair(in1, in2, "mu") && isPair(out1, out2, "mu")) return {
    ok: true,
    topo: "s",
    boson: "γ / Z⁰",
    bosonTex: GAMMA_Z_TEX,
    channels: ["s", "t"],
    note: "Bhabha-type scattering: the s-channel annihilation and the t-channel exchange diagrams both contribute and interfere; both are drawn."
  };
  if (ids === "q,qbar".split(",").sort().join(",") && isPair(out1, out2, "e")) return {
    ok: true,
    topo: "s",
    boson: "γ / Z⁰",
    bosonTex: GAMMA_Z_TEX,
    channels: ["s"],
    note: "Drell–Yan-type process: quark–antiquark annihilation into a lepton pair via a virtual photon or Z⁰."
  };
  if (isPair(in1, in2, "e") && ods === "q,qbar".split(",").sort().join(",")) return {
    ok: true,
    topo: "s",
    boson: "γ / Z⁰",
    bosonTex: GAMMA_Z_TEX,
    channels: ["s"],
    note: "e⁺e⁻ → q q̄: the basis of hadron production at lepton colliders; the quarks subsequently hadronize into jets."
  };
  if (ids === ods && a.id !== b.id && a.q !== 0 && b.q !== 0) return {
    ok: true,
    topo: "t",
    boson: "γ",
    bosonTex: "\\gamma",
    channels: ["t"],
    note: "t-channel exchange: the two charged particles scatter elastically by exchanging a virtual photon — Mott-type scattering of distinguishable particles."
  };
  if (ids === ods && a.id === b.id && a.q !== 0) return {
    ok: true,
    topo: "t",
    boson: "γ",
    bosonTex: "\\gamma",
    channels: ["t", "u"],
    note: "Møller scattering of identical particles: the t- and u-channel photon-exchange diagrams both contribute and interfere; both are drawn."
  };
  if ([in1, in2].includes("ph") && [out1, out2].includes("ph") && ids.replace("ph", "") === ods.replace("ph", "")) return {
    ok: true,
    topo: "compton",
    boson: null,
    bosonTex: null,
    channels: ["s", "u"],
    note: "Compton scattering: the fermion absorbs and re-emits a photon via an internal fermion propagator; the direct (s) and crossed (u) orderings are both drawn."
  };
  if (ids === "ph,ph" || ods === "ph,ph") return {
    ok: false,
    reason: "A single fermion cannot turn into (or come from) two photons while conserving energy–momentum on-shell, and γγ states require loop-level processes (e.g. H → γγ) not representable as a single tree vertex. Tree-level QED has no γγ ↔ γγ vertex — light-by-light scattering first occurs at one loop."
  };
  return {
    ok: false,
    reason: "No tree-level Standard Model diagram connects these states with a single mediator: the required vertex structure does not exist. Try a particle–antiparticle pair in, and a pair of a (possibly different) flavor out."
  };
}

/* ---------- process templates + leading-order physics ---------- */
var FEY_TEMPLATES = [{
  name: "e⁺e⁻ → μ⁺μ⁻",
  sub: "s-channel annihilation",
  "in": ["e-", "e+"],
  out: ["mu-", "mu+"]
}, {
  name: "e⁺e⁻ → q q̄",
  sub: "hadron production",
  "in": ["e-", "e+"],
  out: ["q", "qbar"]
}, {
  name: "q q̄ → μ⁺μ⁻",
  sub: "Drell–Yan",
  "in": ["q", "qbar"],
  out: ["mu-", "mu+"]
}, {
  name: "e⁻μ⁻ → e⁻μ⁻",
  sub: "t-channel exchange",
  "in": ["e-", "mu-"],
  out: ["e-", "mu-"]
}, {
  name: "e⁻e⁻ → e⁻e⁻",
  sub: "Møller scattering",
  "in": ["e-", "e-"],
  out: ["e-", "e-"]
}, {
  name: "e⁺e⁻ → e⁺e⁻",
  sub: "Bhabha scattering",
  "in": ["e-", "e+"],
  out: ["e-", "e+"]
}, {
  name: "γe⁻ → γe⁻",
  sub: "Compton scattering",
  "in": ["ph", "e-"],
  out: ["ph", "e-"]
}, {
  name: "e⁻e⁻ → γγ",
  sub: "forbidden — see why",
  "in": ["e-", "e-"],
  out: ["ph", "ph"]
}];
function feyPhysics(result) {
  if (!result || !result.ok) return null;
  if (result.topo === "s" && result.channels.length > 1) return {
    order: "$O(e^2)$ · two diagrams, s and t channel, with a relative minus sign",
    amp: "\\mathcal{M} \\sim e^2\\left[\\dfrac{\\bar v\\gamma^\\mu u\\;\\bar u\\gamma_\\mu v}{s} - \\dfrac{\\bar u\\gamma^\\mu u\\;\\bar v\\gamma_\\mu v}{t}\\right]",
    sigma: "\\dfrac{d\\sigma}{d\\Omega} = \\dfrac{\\alpha^2}{2s}\\left[\\dfrac{s^2+u^2}{t^2} + \\dfrac{2u^2}{st} + \\dfrac{t^2+u^2}{s^2}\\right]",
    sigmaNote: "Massless Bhabha scattering. The $t$-channel pole $1/\\sin^4(\\theta/2)$ dominates at small angles; the $s$-channel term and the interference matter at large angles. The amplitude room draws the three terms."
  };
  if (result.topo === "t" && result.channels.length > 1) return {
    order: "$O(e^2)$ · two diagrams, t and u channel, with a relative minus sign",
    amp: "\\mathcal{M} \\sim e^2\\left[\\dfrac{1}{t} - \\dfrac{1}{u}\\right]\\ \\text{(spinor structures omitted)}",
    sigma: "\\dfrac{d\\sigma}{d\\Omega} = \\dfrac{\\alpha^2}{2s}\\left[\\dfrac{s^2+u^2}{t^2} + \\dfrac{2s^2}{tu} + \\dfrac{s^2+t^2}{u^2}\\right]",
    sigmaNote: "Massless Møller scattering of identical electrons: symmetric under $\\theta \\to \\pi - \\theta$, with a Coulomb pole at both ends. A total cross-section integrates over half the sphere."
  };
  if (result.topo === "s") return {
    order: "$O(e^2)$ · leading order — one virtual boson",
    amp: "\\mathcal{M} \\sim \\dfrac{e^2}{s}\\,[\\bar v\\,\\gamma^\\mu u]\\,[\\bar u'\\,\\gamma_\\mu v']",
    sigma: "\\sigma = \\dfrac{4\\pi\\alpha^2}{3s}",
    sigmaNote: "Cross-section falls as $1/s$ — numerically $\\sigma \\approx 86.8\\ \\mathrm{nb}/(\\sqrt{s}/\\mathrm{GeV})^2$, so $\\sigma(e^+e^-\\to\\mu^+\\mu^-) \\approx 0.87$ nb at $\\sqrt{s} = 10$ GeV. Near $\\sqrt{s} \\approx 91$ GeV the $Z^0$ propagator pole produces a sharp resonance on top of the photon term."
  };
  if (result.topo === "t") return {
    order: "$O(e^2)$ · one exchanged photon",
    amp: "\\mathcal{M} \\sim \\dfrac{e^2}{t}",
    sigma: "\\dfrac{d\\sigma}{d\\Omega} \\sim \\dfrac{\\alpha^2}{4E^2\\sin^4(\\theta/2)}",
    sigmaNote: "The Mott/Rutherford form: the t-channel pole at small scattering angle drives the forward Coulomb divergence."
  };
  if (result.topo === "compton") return {
    order: "$O(e^2)$ · two vertices, one fermion propagator",
    amp: "\\mathcal{M} \\sim e^2\\,\\bar u'\\,\\Big[\\tfrac{\\gamma\\cdot(p+k)+m}{(p+k)^2-m^2} + \\ldots\\Big]\\,u",
    sigma: "\\sigma_{\\mathrm{KN}} = \\sigma_T\\,f\\!\\left(\\dfrac{E_\\gamma}{m_e c^2}\\right)",
    sigmaNote: "The Klein–Nishina cross-section; it reduces to the classical Thomson value $\\sigma_T$ as $E_\\gamma \\to 0$ and falls at high energy."
  };
  return null;
}

/* ---------- cinematic 3D collision scene for the selected process ----------
   Renders the chosen 2→2 reaction as a real-time event: incoming quanta stream
   in from the beamline, collide at a luminous vertex, the force carrier is
   exchanged (s-channel propagator / t-channel exchange / Compton fermion line),
   and the products fly out with glowing motion trails. Synced to the builder. */
var FEY_COL = {
  "e-": QGA_TOKENS.hex("pigment-blue-72"),
  "e+": QGA_TOKENS.hex("pigment-azure-80-c10"),
  "mu-": QGA_TOKENS.hex("pigment-violet-72-c15"),
  "mu+": QGA_TOKENS.hex("pigment-violet-81-c11"),
  "q": QGA_TOKENS.hex("pigment-cyan-80-c09"),
  "qbar": QGA_TOKENS.hex("pigment-cyan-88"),
  "ph": QGA_TOKENS.hex("pigment-amber-79-c12")
};
var feyColHex = function feyColHex(id) {
  return FEY_COL[id] || QGA_TOKENS.hex("pigment-blue-78-c08");
};
function FeynmanCollision3D(_ref) {
  var proc = _ref.proc,
    procKey = _ref.procKey;
  var build = function build(ctx) {
    var THREE = ctx.THREE,
      scene = ctx.scene;
    var P = proc;
    scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.02);
    scene.add(new THREE.AmbientLight(QGA_TOKENS.hex("pigment-blue-71-c06"), 0.7));
    var key = new THREE.DirectionalLight(QGA_TOKENS.hex("pigment-blue-90"), 0.8);
    key.position.set(4, 7, 6);
    scene.add(key);
    var rim = new THREE.DirectionalLight(QGA_TOKENS.hex("pigment-blue-55"), 0.5);
    rim.position.set(-5, -3, -4);
    scene.add(rim);

    // beamline + faint reference plane
    var grid = ctx.grid(20, 20, QGA_TOKENS.hex("pigment-blue-31-c06"), 0.1);
    grid.position.y = -3.0;
    scene.add(grid);
    var beam = ctx.line([new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0)], QGA_TOKENS.hex("pigment-blue-43"), 0.35, true);
    scene.add(beam);
    var TRAIL = 30;
    var V = new THREE.Vector3();
    var perpZ = new THREE.Vector3(0, 0, 1);
    var ss = function ss(x) {
      x = Math.max(0, Math.min(1, x));
      return x * x * (3 - 2 * x);
    };
    var lerp3 = function lerp3(a, b, f) {
      return V.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
    };

    // a luminous quantum: emissive core + additive glow halo + motion trail
    var makeQ = function makeQ(hex, rad) {
      var core = new THREE.Mesh(new THREE.SphereGeometry(rad, 22, 16), new THREE.MeshStandardMaterial({
        color: hex,
        emissive: hex,
        emissiveIntensity: 1.5,
        metalness: 0.25,
        roughness: 0.35
      }));
      var glow = ctx.glow(hex, rad * 6.5, 0.9);
      scene.add(ctx.tag(core, "model"));
      scene.add(glow);
      var tl = ctx.engraved.stream(TRAIL, {
        color: hex,
        opacity: 0.55,
        additive: true,
        widthPx: ctx.engraved.WIDTH_PX.standard,
        layer: "model"
      });
      scene.add(tl);
      return {
        core: core,
        glow: glow,
        tl: tl,
        hex: hex,
        trail: []
      };
    };
    var setQ = function setQ(q, vec, vis) {
      q.core.visible = q.glow.visible = vis;
      if (!vis) {
        q.tl.visible = false;
        return;
      }
      q.core.position.copy(vec);
      q.glow.position.copy(vec);
    };
    var pushTrail = function pushTrail(q, on) {
      if (!on) {
        q.trail.length = 0;
        q.tl.visible = false;
        return;
      }
      q.tl.visible = true;
      q.trail.push(q.core.position.x, q.core.position.y, q.core.position.z);
      if (q.trail.length > TRAIL * 3) q.trail.splice(0, q.trail.length - TRAIL * 3);
      var n = q.trail.length / 3;
      ctx.engraved.setPoints(q.tl, q.trail, n);
    };
    var SPAN = 7.0,
      OFF = 2.6;
    var isT = P.topo === "t";
    var isCompton = P.topo === "compton";

    // geometry per topology
    var v1 = [-1.8, 0, 0],
      v2 = [1.8, 0, 0]; // s / compton vertices
    var vt = [0, 1.8, 0],
      vb = [0, -1.8, 0]; // t-channel vertices
    var spawnA = isT ? [-SPAN, 1.8, 0] : [-SPAN, OFF, 0];
    var spawnB = isT ? [-SPAN, -1.8, 0] : [-SPAN, -OFF, 0];
    var exitC = isT ? [SPAN, 1.8, 0] : [SPAN, OFF, 0];
    var exitD = isT ? [SPAN, -1.8, 0] : [SPAN, -OFF, 0];

    // quanta
    var qA = makeQ(feyColHex(P["in"][0]), 0.26);
    var qB = makeQ(feyColHex(P["in"][1]), 0.26);
    var qC = makeQ(feyColHex(P.out[0]), 0.26);
    var qD = makeQ(feyColHex(P.out[1]), 0.26);

    // mediator: animated wavy/straight glowing line + a travelling energy packet
    var medN = 46;
    var medFlat = new Float32Array((medN + 1) * 3);
    var medHex = isCompton ? QGA_TOKENS.hex("pigment-blue-87") : QGA_TOKENS.hex("pigment-amber-88-c12");
    // The mediator is this scene's focal curve.
    var medLine = ctx.engraved.stream(medN + 1, {
      color: medHex,
      opacity: 0,
      additive: true,
      widthPx: ctx.engraved.WIDTH_PX.focal,
      layer: "model"
    });
    scene.add(medLine);
    var packet = ctx.glow(medHex, 0.9, 0);
    scene.add(packet);

    // collision flashes
    var flashA = ctx.glow(QGA_TOKENS.hex("pigment-amber-96"), 2.2, 0);
    scene.add(flashA); // primary vertex
    var flashB = ctx.glow(QGA_TOKENS.hex("pigment-amber-96"), 2.2, 0);
    scene.add(flashB); // secondary vertex

    // labels follow the live particles
    var lblA = ctx.label(P.labels[0], function () {
      return qA.core.position;
    }, "s3d-strong");
    var lblB = ctx.label(P.labels[1], function () {
      return qB.core.position;
    }, "s3d-strong");
    var lblC = ctx.label(P.labels[2], function () {
      return qC.core.position;
    }, "s3d-strong");
    var lblD = ctx.label(P.labels[3], function () {
      return qD.core.position;
    }, "s3d-strong");
    var medMid = new THREE.Vector3();
    ctx.label(P.boson || (isCompton ? "fermion propagator" : "γ"), function () {
      return medMid;
    }, "s3d-quiet");
    ctx.annotation(isT ? "t-channel: a virtual boson is exchanged — momentum transfer t" : isCompton ? "Compton: photon absorbed & re-emitted via an internal fermion line" : "s-channel: the pair annihilates into a virtual " + (P.boson || "boson") + ", then re-materializes", function () {
      return {
        x: 0,
        y: -3.0,
        z: 0
      };
    });
    var pp = 0.0;
    var setMed = function setMed(aArr, bArr, frac, amp, wavy, tphase, op) {
      ctx.engraved.setOpacity(medLine, op);
      var a = _construct(THREE.Vector3, _toConsumableArray(aArr)),
        b = _construct(THREE.Vector3, _toConsumableArray(bArr));
      var dir = new THREE.Vector3().subVectors(b, a);
      medMid.copy(a).addScaledVector(dir, 0.5).add(new THREE.Vector3(0, isT ? 0 : 0.5, 0));
      for (var i = 0; i <= medN; i++) {
        var f = i / medN;
        var off = wavy ? Math.sin(f * Math.PI * 7 + tphase) * amp * Math.sin(f * Math.PI) : 0;
        V.copy(a).addScaledVector(dir, f).addScaledVector(perpZ, off);
        medFlat[i * 3] = V.x;
        medFlat[i * 3 + 1] = V.y;
        medFlat[i * 3 + 2] = V.z;
      }
      ctx.engraved.setPoints(medLine, medFlat, medN + 1);
      // travelling packet rides the exchange
      packet.material.opacity = op > 0 ? 0.95 : 0;
      V.copy(a).addScaledVector(dir, frac);
      packet.position.copy(V);
      packet.scale.setScalar(0.9 + 0.5 * Math.sin(tphase));
    };
    var hideMed = function hideMed() {
      ctx.engraved.setOpacity(medLine, 0);
      packet.material.opacity = 0;
    };
    return {
      autoRotate: true,
      dispose: function dispose() {},
      update: function update(t, dt) {
        var mo = ctx.motion();
        // advance the event clock (frozen, composed frame under reduced motion)
        if (mo > 0) {
          pp += dt * 0.165;
          if (pp > 1) {
            pp -= 1;
            [qA, qB, qC, qD].forEach(function (q) {
              return q.trail.length = 0;
            });
          }
        }
        var stat = mo === 0;
        var p = stat ? 0.5 : pp;
        var tph = t * 9;
        if (isT) {
          // two particles sweep left→right; mediator exchanged as they cross the centre
          var fA = stat ? 0.6 : ss((p - 0.04) / 0.92);
          setQ(qA, lerp3(spawnA, exitC, fA), true);
          pushTrail(qA, !stat && fA > 0.001 && fA < 0.999);
          var fB = fA;
          setQ(qB, lerp3(spawnB, exitD, fB), true);
          pushTrail(qB, !stat && fB > 0.001 && fB < 0.999);
          setQ(qC, V.set(0, 0, 0), false);
          setQ(qD, V.set(0, 0, 0), false);
          var exP = (p - 0.40) / 0.24;
          if (stat || p > 0.36 && p < 0.68) {
            var _flashA$position, _flashB$position;
            setMed(vt, vb, ss(exP), 0.34, true, tph, 0.9 * (stat ? 1 : Math.sin(Math.max(0, Math.min(1, exP)) * Math.PI)));
            var fl = stat ? 1 : Math.sin(Math.max(0, Math.min(1, (p - 0.42) / 0.18)) * Math.PI);
            (_flashA$position = flashA.position).set.apply(_flashA$position, vt);
            (_flashB$position = flashB.position).set.apply(_flashB$position, vb);
            flashA.material.opacity = flashB.material.opacity = 0.85 * fl;
            flashA.scale.setScalar(1.6 + 2 * fl);
            flashB.scale.setScalar(1.6 + 2 * fl);
          } else {
            hideMed();
            flashA.material.opacity = flashB.material.opacity = 0;
          }
        } else {
          var _flashA$position2, _flashB$position2;
          // s-channel / Compton: in → vertex1, exchange v1→v2, vertex2 → out
          var fin = stat ? 1 : ss((p - 0.05) / 0.34);
          var inVis = stat || p < 0.48;
          setQ(qA, lerp3(spawnA, v1, fin), inVis);
          pushTrail(qA, !stat && inVis && fin > 0.001);
          setQ(qB, lerp3(spawnB, v1, fin), inVis);
          pushTrail(qB, !stat && inVis && fin > 0.001);
          var fout = stat ? 0.5 : ss((p - 0.60) / 0.34);
          var outVis = stat || p > 0.56;
          setQ(qC, lerp3(v2, exitC, fout), outVis);
          pushTrail(qC, !stat && outVis && fout > 0.001);
          setQ(qD, lerp3(v2, exitD, fout), outVis);
          pushTrail(qD, !stat && outVis && fout > 0.001);
          var _exP = (p - 0.40) / 0.26;
          if (stat || p > 0.36 && p < 0.72) {
            setMed(v1, v2, ss(_exP), 0.32, !isCompton, tph, 0.9 * (stat ? 1 : Math.sin(Math.max(0, Math.min(1, _exP)) * Math.PI)));
          } else hideMed();
          // vertex flashes
          var flIn = stat ? 0.5 : Math.sin(Math.max(0, Math.min(1, (p - 0.34) / 0.16)) * Math.PI);
          var flOut = stat ? 0.5 : Math.sin(Math.max(0, Math.min(1, (p - 0.54) / 0.16)) * Math.PI);
          (_flashA$position2 = flashA.position).set.apply(_flashA$position2, v1);
          (_flashB$position2 = flashB.position).set.apply(_flashB$position2, v2);
          flashA.material.opacity = 0.9 * flIn;
          flashB.material.opacity = 0.9 * flOut;
          flashA.scale.setScalar(1.4 + 2.2 * flIn);
          flashB.scale.setScalar(1.4 + 2.2 * flOut);
        }
        // glow halos pulse gently with the cores
        [qA, qB, qC, qD].forEach(function (q) {
          if (q.core.visible) {
            q.glow.scale.setScalar(0.26 * 6.5 * (1 + 0.12 * Math.sin(t * 4 + q.hex)));
          }
        });
        // hide labels for invisible particles
        lblA.setShow(qA.core.visible);
        lblB.setShow(qB.core.visible);
        lblC.setShow(qC.core.visible);
        lblD.setShow(qD.core.visible);
      }
    };
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    height: 360,
    aria: "Cinematic three-dimensional animation of the collision " + procKey,
    initial: {
      radius: 15,
      theta: 0.62,
      phi: 1.04,
      minR: 8,
      maxR: 30,
      fov: 42,
      bloom: {
        strength: 0.95,
        radius: 0.6,
        threshold: 0.12
      }
    },
    build: build,
    deps: [procKey],
    fallback: null
  }));
}
function FeynmanBuilder() {
  var _useState = useState("e-"),
    _useState2 = _slicedToArray(_useState, 2),
    in1 = _useState2[0],
    setIn1 = _useState2[1];
  var _useState3 = useState("e+"),
    _useState4 = _slicedToArray(_useState3, 2),
    in2 = _useState4[0],
    setIn2 = _useState4[1];
  var _useState5 = useState("mu-"),
    _useState6 = _slicedToArray(_useState5, 2),
    out1 = _useState6[0],
    setOut1 = _useState6[1];
  var _useState7 = useState("mu+"),
    _useState8 = _slicedToArray(_useState7, 2),
    out2 = _useState8[0],
    setOut2 = _useState8[1];
  var result = feyAnalyze(in1, in2, out1, out2);
  var lbl = function lbl(id) {
    return FEY_PARTICLES.find(function (p) {
      return p.id === id;
    }).label.split(" ")[0];
  };
  var phys = feyPhysics(result);
  var proc = result.ok ? {
    "in": [in1, in2],
    out: [out1, out2],
    topo: result.topo,
    boson: result.boson,
    labels: [lbl(in1), lbl(in2), lbl(out1), lbl(out2)]
  } : null;
  var procKey = proc ? [in1, in2, out1, out2, proc.topo].join("|") : "none";
  var applyTemplate = function applyTemplate(tpl) {
    setIn1(tpl["in"][0]);
    setIn2(tpl["in"][1]);
    setOut1(tpl.out[0]);
    setOut2(tpl.out[1]);
  };
  var activeTpl = FEY_TEMPLATES.find(function (tp) {
    return tp["in"][0] === in1 && tp["in"][1] === in2 && tp.out[0] === out1 && tp.out[1] === out2;
  });
  var sel = function sel(v, set) {
    return /*#__PURE__*/React.createElement("select", {
      value: v,
      onChange: function onChange(e) {
        return set(e.target.value);
      }
    }, FEY_PARTICLES.map(function (p) {
      return /*#__PURE__*/React.createElement("option", {
        key: p.id,
        value: p.id
      }, p.label);
    }));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fey-templates",
    role: "group",
    "aria-label": "Process templates"
  }, FEY_TEMPLATES.map(function (tp) {
    return /*#__PURE__*/React.createElement("button", {
      key: tp.name,
      className: "fey-chip" + (activeTpl === tp ? " on" : ""),
      onClick: function onClick() {
        return applyTemplate(tp);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "fey-chip-name"
    }, tp.name), /*#__PURE__*/React.createElement("span", {
      className: "fey-chip-sub"
    }, tp.sub));
  })), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar fey-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ctl-label"
  }, "incoming"), sel(in1, setIn1), sel(in2, setIn2), /*#__PURE__*/React.createElement("span", {
    className: "ctl-label",
    style: {
      margin: "0 4px"
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("span", {
    className: "ctl-label"
  }, "outgoing"), sel(out1, setOut1), sel(out2, setOut2)), result.ok ? /*#__PURE__*/React.createElement(FeynmanCollision3D, {
    proc: proc,
    procKey: procKey
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px"
    }
  }, result.ok ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FeynmanDiagramSet, {
    result: result,
    ids: [in1, in2, out1, out2]
  }), /*#__PURE__*/React.createElement(FeynmanLegend, null), /*#__PURE__*/React.createElement("div", {
    className: "fey-verdict ok"
  }, /*#__PURE__*/React.createElement("strong", null, "Allowed at tree level."), " ", result.note), phys ? /*#__PURE__*/React.createElement("div", {
    className: "fey-phys-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fey-phys-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fey-phys-label"
  }, "Leading-order amplitude"), /*#__PURE__*/React.createElement(Eq, {
    tex: phys.amp,
    display: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "fey-phys-note"
  }, /*#__PURE__*/React.createElement(RichText, {
    text: phys.order
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fey-phys-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fey-phys-label"
  }, "Cross-section scaling"), /*#__PURE__*/React.createElement(Eq, {
    tex: phys.sigma,
    display: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "fey-phys-note"
  }, /*#__PURE__*/React.createElement(RichText, {
    text: phys.sigmaNote
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fey-phys-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fey-phys-label"
  }, "Coupling"), /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha = \\dfrac{e^2}{4\\pi\\varepsilon_0 \\hbar c} \\approx \\dfrac{1}{137}",
    display: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "fey-phys-note"
  }, "Each vertex contributes one power of ", /*#__PURE__*/React.createElement(Eq, {
    tex: "e"
  }), " (", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\sqrt{\\alpha}"
  }), "). Every extra photon loop suppresses the amplitude by ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha"
  }), " \u2014 why QED perturbation theory converges so well."))) : null) : /*#__PURE__*/React.createElement("div", {
    className: "fey-verdict bad"
  }, /*#__PURE__*/React.createElement("strong", null, "Forbidden."), " ", result.reason)), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "qft-feynman-builder",
    status: "schematic"
  }, "Pick a process template or build a custom 2 \u2192 2 reaction. The animation shows time flowing left \u2192 right: incoming quanta stream into a vertex, the force carrier (gold) is exchanged, and outgoing quanta emerge. External lines are real (on-shell) particles; the internal line is a propagator \u2014 a term in the perturbative expansion, not an observable object. Arrows track fermion number; the builder enforces the conservation laws every Standard Model vertex obeys."));
}
function ModuleQFT(_ref2) {
  var go = _ref2.go;
  return /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement(ModuleHeader, {
    num: "02",
    kicker: "Fields before particles",
    title: "Quantum Field Theory",
    lede: "Quantum field theory merges quantum mechanics with special relativity by taking fields, not particles, as fundamental. A particle is a localized, quantized excitation of a field that fills all of spacetime \u2014 every electron is a ripple in one and the same electron field.",
    target: ".qft-field-lab, [data-figure=\"qft-lattice-energy\"]"
  }), /*#__PURE__*/React.createElement(Section, {
    title: "The field laboratory"
  }, /*#__PURE__*/React.createElement("p", null, "Each particle species corresponds to a field defined at every point of spacetime. In the vacuum, the field rests near zero expectation value (with irreducible quantum fluctuations). Energy deposited into the field creates excitations; in the quantum theory these excitations come in discrete units \u2014 quanta \u2014 which we register as particles. Creation and annihilation operators add and remove these quanta from a state."), /*#__PURE__*/React.createElement(LatticeLab, {
    go: go
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Vacuum fluctuations, computed"
  }, /*#__PURE__*/React.createElement("p", null, "The membrane above integrates the field in time; this lab shows what the ", /*#__PURE__*/React.createElement("em", null, "vacuum itself"), " is. A free quantum field in its lowest energy state is not still \u2014 it is a superposition of independent harmonic oscillators, one per Fourier mode, each jittering with its zero-point amplitude. Here that superposition is built explicitly from a seeded set of modes, rendered as a time waterfall, and read three ways: the field amplitude, its equal-time correlation function, and a schematic flux tube. Everything on screen is computed by ", /*#__PURE__*/React.createElement("code", null, "js/science/qft-fields.mjs"), " with a disclosed cutoff, so the same seed replays the same vacuum, frame for frame."), /*#__PURE__*/React.createElement(QftComputeLab, null)), /*#__PURE__*/React.createElement(Section, {
    title: "The Casimir cavity"
  }, /*#__PURE__*/React.createElement("p", null, "Put two uncharged plates a micrometre apart and they are pushed together. Between them only some modes of the field fit, and the energy that is missing from the gap is measurable: this is the vacuum effect that experiments have seen, drawn mode by mode."), /*#__PURE__*/React.createElement(CasimirLab, null), /*#__PURE__*/React.createElement("div", {
    className: "derivation-grid"
  }, /*#__PURE__*/React.createElement(DerivationStepper, {
    derivationId: "derivation-casimir-energy"
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "Amplitudes and diagrams"
  }, /*#__PURE__*/React.createElement("p", null, "Interacting field theories are solved perturbatively: the amplitude for a scattering process is expanded in powers of the coupling, and Feynman diagrams are the bookkeeping for the terms. Each diagram translates directly into a number through the Feynman rules \u2014 a factor for every external line, a propagator for every internal line, and a coupling for every vertex \u2014 which are squared and integrated over phase space to give a measurable cross-section. Pick a process below (or build your own); the lab animates the exchange, enforces the conservation laws every vertex obeys, and shows the leading-order amplitude and cross-section."), /*#__PURE__*/React.createElement(FeynmanBuilder, null)), /*#__PURE__*/React.createElement(Section, {
    title: "The amplitude room"
  }, /*#__PURE__*/React.createElement("p", null, "A diagram is only a picture until the Feynman rules turn it into a number. This bench does that conversion live: pick a 2 \u2192 2 process, then move the centre-of-mass energy \u221As and the scattering angle \u03B8. The Mandelstam variables s, t and u are recomputed from the four-momenta on every frame, the angular distribution is drawn in polar and Cartesian form, and the energy scan shows the photon 1/s fall-off alongside the Z\u2070 resonance. Every readout is a closed-form leading-order result evaluated by the pure functions in ", /*#__PURE__*/React.createElement("code", null, "js/physics.mjs"), "; the animation is presentation only."), /*#__PURE__*/React.createElement(AmplitudeRoom, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Mathematical formulation"
  }, /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Path integral amplitude",
    status: "established",
    formulaId: "qft-path-integral-amplitude",
    symbols: [{
      s: "\\mathcal{D}\\phi",
      d: "Functional integration over all field configurations connecting initial and final states."
    }, {
      s: "S[\\phi]",
      d: "Classical action — the time integral of the Lagrangian, evaluated on each configuration."
    }, {
      s: "\\hbar",
      d: "Reduced Planck constant; as ħ → 0 stationary phase selects classical solutions."
    }],
    meaning: "Feynman's formulation: the quantum amplitude is a coherent sum over every possible history, each weighted by a phase. Interference between histories produces all quantum phenomena.",
    limits: "The measure $\\mathcal{D}\\phi$ is defined rigorously only in special cases; in practice the integral is computed perturbatively or on a lattice."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Klein\u2013Gordon equation",
    status: "established",
    formulaId: "qft-klein-gordon",
    symbols: [{
      s: "\\phi",
      d: "Scalar field amplitude."
    }, {
      s: "\\Box",
      d: "d'Alembert wave operator — the relativistic generalization of the Laplacian."
    }, {
      s: "m",
      d: "Mass of the field's quanta; sets the dispersion relation $E^2=p^2c^2+m^2c^4$."
    }],
    meaning: "The free relativistic wave equation for spin-0 fields. The field laboratory above integrates exactly this equation on a lattice.",
    limits: "Free (non-interacting) field only. As a single-particle wave equation it fails (negative probabilities); it is consistent only as a field equation."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Dirac equation",
    status: "established",
    formulaId: "qft-dirac",
    symbols: [{
      s: "\\psi",
      d: "Four-component spinor field describing spin-½ particles."
    }, {
      s: "\\gamma^\\mu",
      d: "Dirac matrices satisfying $\\{\\gamma^\\mu,\\gamma^\\nu\\}=2\\eta^{\\mu\\nu}$ — the algebra that linearizes the relativistic energy relation."
    }, {
      s: "m",
      d: "Fermion mass."
    }],
    meaning: "The relativistic equation for electrons and all matter fermions. Spin-\xBD and the existence of antimatter are consequences, not assumptions.",
    limits: "Free-field form shown; interactions enter by replacing $\\partial$ with the gauge-covariant derivative $D$."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Feynman propagator",
    status: "established",
    formulaId: "qft-feynman-propagator",
    symbols: [{
      s: "p",
      d: "Four-momentum flowing through the internal line ($p^2=E^2-|\\vec p|^2$ in natural units)."
    }, {
      s: "m",
      d: "Mass of the exchanged field's quanta; the pole at $p^2=m^2$ corresponds to a real particle."
    }, {
      s: "i\\epsilon",
      d: "Infinitesimal prescription enforcing causal boundary conditions."
    }],
    meaning: "The amplitude for a field disturbance to propagate between two vertices. Internal lines in the diagram builder carry exactly this factor, integrated over off-shell momenta.",
    limits: "Internal momenta need not satisfy $p^2=m^2$ \u2014 which is why 'virtual particles' are calculational terms rather than observed objects."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Mandelstam variables",
    status: "established",
    formulaId: "qft-mandelstam",
    symbols: [{
      s: "s",
      d: "Centre-of-mass energy squared — the invariant that sets the energy scale of a collision; the s-channel propagator carries it."
    }, {
      s: "t",
      d: "Momentum transfer squared — the invariant probed in t-channel exchange; small t means forward (glancing) scattering."
    }, {
      s: "u",
      d: "The crossed channel; for identical outgoing particles u- and t-channel diagrams interfere."
    }],
    meaning: "Lorentz-invariant combinations of the external momenta. Every amplitude in the lab above is a function of s, t, and u \u2014 which channel dominates is exactly which template you selected.",
    limits: "Defined for 2 \u2192 2 kinematics; multi-particle final states need a larger set of invariants."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Fermi's golden rule",
    status: "established",
    formulaId: "qft-fermi-golden-rule",
    symbols: [{
      s: "\\Gamma",
      d: "Transition rate (decay width, or per-collision probability) — what experiments actually measure."
    }, {
      s: "|\\mathcal{M}|^2",
      d: "Squared matrix element from the diagrams: the modulus-squared coherent sum of all contributing amplitudes."
    }, {
      s: "d\\rho_f",
      d: "Density of final states (phase space) available to the products."
    }],
    meaning: "The bridge from a Feynman amplitude to an observable: square the diagram sum, weight by available phase space, integrate. Rates and cross-sections follow directly.",
    limits: "First-order (Born) form; strong couplings or near-resonance kinematics require resummation."
  }))), /*#__PURE__*/React.createElement(Misconception, {
    title: "Particles are not tiny classical balls."
  }, "A 'particle' in quantum field theory is a unit of excitation of a field mode \u2014 it has no trajectory, no definite surface, and its number can change in interactions. The classical-ball picture fails for identical-particle statistics, particle creation, and vacuum effects alike."), /*#__PURE__*/React.createElement(Misconception, {
    title: "Virtual particles are calculation tools."
  }, "Internal lines of Feynman diagrams represent terms in a perturbative series. They are not directly observed objects 'briefly violating energy conservation' \u2014 energy is conserved exactly at every vertex; it is the mass-shell condition that internal lines need not satisfy."), /*#__PURE__*/React.createElement(ConceptBridge, {
    id: "qft-rg",
    go: go
  }));
}
window.ModuleQFT = ModuleQFT;
/* Compiled from js/physics.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

var _excluded = ["massSolar"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// Browser bridge for the pure calculations in js/physics.mjs.
function qcdB0(nf) {
  var flavors = Number(nf);
  return Number.isFinite(flavors) && flavors >= 0 ? 11 - 2 * flavors / 3 : NaN;
}
function rgBeta(model, coupling) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
    _ref$nf = _ref.nf,
    nf = _ref$nf === void 0 ? 1 : _ref$nf,
    _ref$a = _ref.a,
    a = _ref$a === void 0 ? 1 : _ref$a,
    _ref$b = _ref.b,
    b = _ref$b === void 0 ? 1 : _ref$b,
    _ref$gStar = _ref.gStar,
    gStar = _ref$gStar === void 0 ? 1 : _ref$gStar;
  var g = Number(coupling),
    flavors = Number(nf),
    aa = Number(a),
    bb = Number(b),
    fixed = Number(gStar);
  if (!Number.isFinite(g)) return NaN;
  if (model === "qed") return Number.isFinite(flavors) && flavors >= 0 ? flavors * Math.pow(g, 3) / (12 * Math.pow(Math.PI, 2)) : NaN;
  if (model === "qcd") {
    var coefficient = qcdB0(flavors);
    return Number.isFinite(coefficient) ? -(coefficient * Math.pow(g, 3)) / (16 * Math.pow(Math.PI, 2)) : NaN;
  }
  if (model === "gaussian") return Number.isFinite(aa) ? -aa * g : NaN;
  if (model === "linear") return Number.isFinite(aa) && Number.isFinite(fixed) ? aa * (g - fixed) : NaN;
  if (model === "asymptotic-safety") return Number.isFinite(aa) && Number.isFinite(bb) ? aa * g - bb * Math.pow(g, 3) : NaN;
  return NaN;
}
function rgBetaDerivative(model, coupling) {
  var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
    _ref2$nf = _ref2.nf,
    nf = _ref2$nf === void 0 ? 1 : _ref2$nf,
    _ref2$a = _ref2.a,
    a = _ref2$a === void 0 ? 1 : _ref2$a,
    _ref2$b = _ref2.b,
    b = _ref2$b === void 0 ? 1 : _ref2$b;
  var g = Number(coupling),
    flavors = Number(nf),
    aa = Number(a),
    bb = Number(b);
  if (!Number.isFinite(g)) return NaN;
  if (model === "qed") return Number.isFinite(flavors) && flavors >= 0 ? flavors * g * g / (4 * Math.pow(Math.PI, 2)) : NaN;
  if (model === "qcd") {
    var coefficient = qcdB0(flavors);
    return Number.isFinite(coefficient) ? -(3 * coefficient * g * g) / (16 * Math.pow(Math.PI, 2)) : NaN;
  }
  if (model === "gaussian" || model === "linear") return Number.isFinite(aa) ? model === "gaussian" ? -aa : aa : NaN;
  if (model === "asymptotic-safety") return Number.isFinite(aa) && Number.isFinite(bb) ? aa - 3 * bb * g * g : NaN;
  return NaN;
}
function rgStability(derivative) {
  var tolerance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1e-9;
  var slope = Number(derivative);
  if (!Number.isFinite(slope)) return "invalid";
  if (slope < -Math.abs(tolerance)) return "UV-attractive";
  if (slope > Math.abs(tolerance)) return "IR-attractive";
  return "marginal";
}
function rgFixedPoints(model) {
  var parameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _parameters$a = parameters.a,
    a = _parameters$a === void 0 ? 1 : _parameters$a,
    _parameters$b = parameters.b,
    b = _parameters$b === void 0 ? 1 : _parameters$b,
    _parameters$gStar = parameters.gStar,
    gStar = _parameters$gStar === void 0 ? 1 : _parameters$gStar;
  var roots = [];
  if (model === "qed" || model === "qcd" || model === "gaussian") roots = [0];else if (model === "linear" && Number.isFinite(Number(gStar))) roots = [Number(gStar)];else if (model === "asymptotic-safety" && Number(a) >= 0 && Number(b) > 0) roots = [0, Math.sqrt(Number(a) / Number(b))];
  return roots.map(function (g) {
    var derivative = rgBetaDerivative(model, g, parameters);
    return {
      g: g,
      beta: rgBeta(model, g, parameters),
      derivative: derivative,
      stability: rgStability(derivative),
      source: "analytic"
    };
  });
}
function findRGFixedPoints(model) {
  var parameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _ref3 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
    _ref3$gMin = _ref3.gMin,
    gMin = _ref3$gMin === void 0 ? 0 : _ref3$gMin,
    _ref3$gMax = _ref3.gMax,
    gMax = _ref3$gMax === void 0 ? 4 : _ref3$gMax,
    _ref3$samples = _ref3.samples,
    samples = _ref3$samples === void 0 ? 512 : _ref3$samples,
    _ref3$tolerance = _ref3.tolerance,
    tolerance = _ref3$tolerance === void 0 ? 1e-9 : _ref3$tolerance;
  var lo = Number(gMin),
    hi = Number(gMax),
    count = Math.max(16, Math.min(4096, Math.trunc(Number(samples))));
  var tol = Math.max(1e-14, Math.abs(Number(tolerance)) || 1e-9);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || !(hi > lo)) return [];
  var roots = [];
  var add = function add(value) {
    if (!Number.isFinite(value) || value < lo - tol || value > hi + tol) return;
    if (!roots.some(function (root) {
      return Math.abs(root - value) <= Math.max(tol * 10, 1e-7);
    })) roots.push(value);
  };
  var left = lo,
    fLeft = rgBeta(model, left, parameters);
  if (Number.isFinite(fLeft) && Math.abs(fLeft) <= tol) add(left);
  for (var index = 1; index <= count; index++) {
    var right = lo + (hi - lo) * index / count;
    var fRight = rgBeta(model, right, parameters);
    if (Number.isFinite(fRight) && Math.abs(fRight) <= tol) add(right);
    if (Number.isFinite(fLeft) && Number.isFinite(fRight) && fLeft * fRight < 0) {
      var a0 = left,
        b0 = right,
        fa = fLeft;
      for (var iteration = 0; iteration < 80 && b0 - a0 > tol; iteration++) {
        var middle = (a0 + b0) / 2,
          fm = rgBeta(model, middle, parameters);
        if (!Number.isFinite(fm)) break;
        if (Math.abs(fm) <= tol) {
          a0 = middle;
          b0 = middle;
          break;
        }
        if (fa * fm <= 0) b0 = middle;else {
          a0 = middle;
          fa = fm;
        }
      }
      add((a0 + b0) / 2);
    }
    left = right;
    fLeft = fRight;
  }
  return roots.sort(function (x, y) {
    return x - y;
  }).map(function (g) {
    var derivative = rgBetaDerivative(model, g, parameters);
    return {
      g: g,
      beta: rgBeta(model, g, parameters),
      derivative: derivative,
      stability: rgStability(derivative),
      source: "numeric",
      tolerance: tol
    };
  });
}
function rgOneLoopRunning(model, g0, deltaLogMu) {
  var _ref4 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
    _ref4$nf = _ref4.nf,
    nf = _ref4$nf === void 0 ? 1 : _ref4$nf;
  var coupling = Number(g0),
    t = Number(deltaLogMu),
    flavors = Number(nf);
  if (!(coupling >= 0) || !Number.isFinite(coupling) || !Number.isFinite(t) || !Number.isFinite(flavors) || flavors < 0 || !["qed", "qcd"].includes(model)) {
    return {
      g: NaN,
      alpha: NaN,
      denominator: NaN,
      status: "invalid",
      poleDelta: NaN
    };
  }
  var coefficient = model === "qed" ? flavors / (6 * Math.pow(Math.PI, 2)) : -qcdB0(flavors) / (8 * Math.pow(Math.PI, 2));
  var denominator = 1 - coefficient * coupling * coupling * t;
  var poleDelta = coefficient > 0 && coupling > 0 ? 1 / (coefficient * coupling * coupling) : Infinity;
  if (!(denominator > 0) || !Number.isFinite(denominator)) {
    return {
      g: NaN,
      alpha: NaN,
      denominator: denominator,
      status: "pole",
      poleDelta: poleDelta
    };
  }
  var g = coupling / Math.sqrt(denominator),
    alpha = g * g / (4 * Math.PI);
  var status = alpha >= 1 ? model === "qcd" ? "strong-coupling" : "perturbative-limit" : "perturbative";
  return {
    g: g,
    alpha: alpha,
    denominator: denominator,
    status: status,
    poleDelta: poleDelta
  };
}
function integrateRGFlow() {
  var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
    model = _ref5.model,
    g0 = _ref5.g0,
    _ref5$t = _ref5.t0,
    t0 = _ref5$t === void 0 ? 0 : _ref5$t,
    _ref5$tMin = _ref5.tMin,
    tMin = _ref5$tMin === void 0 ? -8 : _ref5$tMin,
    _ref5$tMax = _ref5.tMax,
    tMax = _ref5$tMax === void 0 ? 8 : _ref5$tMax,
    _ref5$step = _ref5.step,
    step = _ref5$step === void 0 ? 0.02 : _ref5$step,
    _ref5$gLimit = _ref5.gLimit,
    gLimit = _ref5$gLimit === void 0 ? Math.sqrt(4 * Math.PI) : _ref5$gLimit,
    _ref5$maxSteps = _ref5.maxSteps,
    maxSteps = _ref5$maxSteps === void 0 ? 20000 : _ref5$maxSteps,
    _ref5$parameters = _ref5.parameters,
    parameters = _ref5$parameters === void 0 ? {} : _ref5$parameters;
  var startG = Number(g0),
    startT = Number(t0),
    minT = Number(tMin),
    maxT = Number(tMax);
  var hMax = Math.abs(Number(step)),
    limit = Math.abs(Number(gLimit)),
    iterationLimit = Math.max(1, Math.trunc(Number(maxSteps)));
  var invalid = !Number.isFinite(startG) || startG < 0 || !Number.isFinite(startT) || !Number.isFinite(minT) || !Number.isFinite(maxT) || !(minT <= startT && startT <= maxT) || !(hMax > 0) || !(limit > 0) || !Number.isFinite(rgBeta(model, startG, parameters));
  var diagnostics = {
    method: "fixed-step-rk4",
    step: hMax,
    tolerance: 1e-10,
    gLimit: limit,
    maxSteps: iterationLimit
  };
  if (invalid) {
    return _objectSpread({
      points: [],
      infrared: {
        status: "invalid",
        reached: startT
      },
      ultraviolet: {
        status: "invalid",
        reached: startT
      },
      status: "invalid"
    }, diagnostics);
  }
  var boundaryStatus = function boundaryStatus() {
    return model === "qcd" ? "strong-coupling" : model === "qed" ? "perturbative-limit" : "coupling-boundary";
  };
  var advance = function advance(target) {
    var direction = target >= startT ? 1 : -1;
    var points = [{
      t: startT,
      g: startG,
      beta: rgBeta(model, startG, parameters)
    }];
    var t = startT,
      g = startG,
      status = "range-complete",
      iterations = 0;
    while (Math.abs(target - t) > 1e-12 && iterations < iterationLimit) {
      var h = direction * Math.min(hMax, Math.abs(target - t));
      var k1 = rgBeta(model, g, parameters),
        k2 = rgBeta(model, g + h * k1 / 2, parameters);
      var k3 = rgBeta(model, g + h * k2 / 2, parameters),
        k4 = rgBeta(model, g + h * k3, parameters);
      var next = g + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
      if (![k1, k2, k3, k4, next].every(Number.isFinite)) {
        status = "divergent";
        break;
      }
      if (Math.abs(next) > limit) {
        var fraction = Math.max(0, Math.min(1, (limit - Math.abs(g)) / Math.max(1e-15, Math.abs(next) - Math.abs(g))));
        var boundaryT = t + h * fraction,
          boundaryG = Math.sign(next || g || 1) * limit;
        points.push({
          t: boundaryT,
          g: boundaryG,
          beta: rgBeta(model, boundaryG, parameters),
          boundary: true
        });
        t = boundaryT;
        g = boundaryG;
        status = boundaryStatus();
        break;
      }
      t += h;
      g = next;
      iterations += 1;
      points.push({
        t: t,
        g: g,
        beta: rgBeta(model, g, parameters)
      });
    }
    if (iterations >= iterationLimit && Math.abs(target - t) > 1e-12) status = "iteration-limit";
    return {
      points: points,
      status: status,
      reached: t,
      coupling: g,
      iterations: iterations,
      terminated: status !== "range-complete"
    };
  };
  var infrared = advance(minT),
    ultraviolet = advance(maxT);
  var points = infrared.points.slice(1).reverse().concat(ultraviolet.points);
  return _objectSpread({
    points: points,
    infrared: infrared,
    ultraviolet: ultraviolet,
    status: infrared.terminated || ultraviolet.terminated ? "bounded-termination" : "range-complete"
  }, diagnostics);
}
/* =====================================================================
 * Kerr / accretion-disk / spectrum science core (browser mirror).
 *
 * This block mirrors the Node-importable modules in js/science/. The
 * no-build runtime evaluates this file as a single classic script, so ESM
 * `import` is unavailable here and the formulas are transcribed rather than
 * imported. js/science/*.mjs remains the single source of truth; the parity
 * test in test/physics-bridge.test.mjs checks this mirror against it over a
 * grid of inputs, so the two cannot drift silently.
 *
 * Model status, unit conventions, and the full reference list live in the
 * ESM modules and in docs/science/kerr-rendering.md.
 * ===================================================================== */
var QGA_SCIENCE = function () {
  /* ---------- constants (js/science/constants.mjs) ---------- */

  var G = 6.67430e-11;
  var C = 299792458;
  var HBAR = 1.054571817e-34;
  var H_PLANCK = 6.62607015e-34;
  var KB = 1.380649e-23;
  var SOLAR_MASS = 1.98847e30;
  var STEFAN_BOLTZMANN = 5.670374419e-8;
  var WIEN_DISPLACEMENT_B = 2.897771955e-3;
  var MAX_SPIN_MAGNITUDE = 1;
  var TWO_PI = 2 * Math.PI;
  function describe(value) {
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : String(value);
    if (typeof value === "string") return JSON.stringify(value);
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (_typeof(value) === "object") return Array.isArray(value) ? "an array" : "an object";
    return _typeof(value);
  }
  function assertFiniteNumber(value, name) {
    var numeric = typeof value === "number" ? value : Number(value);
    if (typeof value === "boolean" || value === null || value === "" || !Number.isFinite(numeric)) {
      throw new TypeError("".concat(name, " must be a finite number; received ").concat(describe(value)));
    }
    return numeric;
  }
  function assertPositiveNumber(value, name) {
    var numeric = assertFiniteNumber(value, name);
    if (!(numeric > 0)) throw new RangeError("".concat(name, " must be greater than zero; received ").concat(numeric));
    return numeric;
  }
  function assertNonNegativeNumber(value, name) {
    var numeric = assertFiniteNumber(value, name);
    if (numeric < 0) throw new RangeError("".concat(name, " must be non-negative; received ").concat(numeric));
    return numeric;
  }
  function assertPositiveInteger(value, name) {
    var numeric = assertFiniteNumber(value, name);
    if (!Number.isInteger(numeric) || numeric < 1) {
      throw new RangeError("".concat(name, " must be a positive integer; received ").concat(numeric));
    }
    return numeric;
  }
  function assertSpinParameter(value) {
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "aStar";
    var numeric = assertFiniteNumber(value, name);
    if (Math.abs(numeric) > MAX_SPIN_MAGNITUDE) {
      throw new RangeError("".concat(name, " must satisfy |a*| <= ").concat(MAX_SPIN_MAGNITUDE, " for a Kerr exterior; received ").concat(numeric));
    }
    return numeric;
  }
  function assertMassSolar(value) {
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "massSolar";
    return assertPositiveNumber(value, name);
  }
  function assertTemperature(value) {
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "temperatureK";
    return assertPositiveNumber(value, name);
  }
  function assertWavelength(value) {
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "wavelengthMeters";
    return assertPositiveNumber(value, name);
  }
  function assertTolerance(value, name) {
    var numeric = assertFiniteNumber(value, name);
    if (!(numeric > 0)) throw new RangeError("".concat(name, " must be a strictly positive tolerance; received ").concat(numeric));
    return numeric;
  }
  function assertStepSize(value, name) {
    var numeric = assertFiniteNumber(value, name);
    if (!(numeric > 0)) throw new RangeError("".concat(name, " must be a strictly positive step size; received ").concat(numeric));
    return numeric;
  }
  function assertStepCeiling(value, name) {
    if (value === Infinity) return Infinity;
    return assertStepSize(value, name);
  }
  function assertFiniteState(state) {
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "state";
    if (!state || typeof state.length !== "number" || state.length === 0) {
      throw new TypeError("".concat(name, " must be a non-empty array-like of numbers"));
    }
    for (var index = 0; index < state.length; index += 1) {
      if (!Number.isFinite(state[index])) {
        throw new RangeError("".concat(name, "[").concat(index, "] must be finite; received ").concat(describe(state[index])));
      }
    }
    return state;
  }
  function massKilograms(massSolar) {
    return assertMassSolar(massSolar) * SOLAR_MASS;
  }
  function geometricLengthUnitMeters(massSolar) {
    return G * massKilograms(massSolar) / (C * C);
  }
  function geometricTimeUnitSeconds(massSolar) {
    return G * massKilograms(massSolar) / (C * C * C);
  }
  function geometricTemperatureUnitKelvin(massSolar) {
    return HBAR * C * C * C / (G * massKilograms(massSolar) * KB);
  }
  function geometricLengthToMeters(length, massSolar) {
    return assertFiniteNumber(length, "length") * geometricLengthUnitMeters(massSolar);
  }
  function metersToGeometricLength(meters, massSolar) {
    return assertFiniteNumber(meters, "meters") / geometricLengthUnitMeters(massSolar);
  }
  function geometricTimeToSeconds(time, massSolar) {
    return assertFiniteNumber(time, "time") * geometricTimeUnitSeconds(massSolar);
  }
  function secondsToGeometricTime(seconds, massSolar) {
    return assertFiniteNumber(seconds, "seconds") / geometricTimeUnitSeconds(massSolar);
  }
  function geometricMassToKilograms(mass, massSolar) {
    return assertFiniteNumber(mass, "mass") * massKilograms(massSolar);
  }
  function geometricFrequencyToHertz(frequency, massSolar) {
    return assertFiniteNumber(frequency, "frequency") / geometricTimeUnitSeconds(massSolar);
  }
  function hertzToGeometricFrequency(hertz, massSolar) {
    return assertFiniteNumber(hertz, "hertz") * geometricTimeUnitSeconds(massSolar);
  }
  function geometricTemperatureToKelvin(temperature, massSolar) {
    return assertFiniteNumber(temperature, "temperature") * geometricTemperatureUnitKelvin(massSolar);
  }
  function kelvinToGeometricTemperature(kelvin, massSolar) {
    return assertFiniteNumber(kelvin, "kelvin") / geometricTemperatureUnitKelvin(massSolar);
  }
  function geometricLuminosityToWatts(luminosity, massSolar) {
    assertMassSolar(massSolar);
    return assertFiniteNumber(luminosity, "luminosity") * Math.pow(C, 5) / G;
  }
  function geometricMassRateToKgPerSecond(massRate, massSolar) {
    assertMassSolar(massSolar);
    return assertFiniteNumber(massRate, "massRate") * Math.pow(C, 3) / G;
  }
  function kgPerSecondToGeometricMassRate(kgPerSecond, massSolar) {
    assertMassSolar(massSolar);
    return assertFiniteNumber(kgPerSecond, "kgPerSecond") * G / Math.pow(C, 3);
  }
  function geometricAngularMomentumToSI(angularMomentum, massSolar) {
    var mass = massKilograms(massSolar);
    return assertFiniteNumber(angularMomentum, "angularMomentum") * G * mass * mass / C;
  }
  function geometricFluxToSI(flux, massSolar) {
    var mass = massKilograms(massSolar);
    return assertFiniteNumber(flux, "flux") * Math.pow(C, 9) / (Math.pow(G, 3) * mass * mass);
  }
  function siFluxToGeometric(fluxSI, massSolar) {
    var mass = massKilograms(massSolar);
    return assertFiniteNumber(fluxSI, "fluxSI") * Math.pow(G, 3) * mass * mass / Math.pow(C, 9);
  }
  function geometricEnergyToJoules(energy, massSolar) {
    return assertFiniteNumber(energy, "energy") * massKilograms(massSolar) * C * C;
  }

  /* ---------- Kerr geometry (js/science/kerr.mjs) ---------- */

  function metricAt(a, r, theta) {
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var s2 = sin * sin;
    var c2 = cos * cos;
    var delta = r * r - 2 * r + a * a;
    var sigma = r * r + a * a * c2;
    var A = Math.pow(r * r + a * a, 2) - a * a * delta * s2;
    return {
      aStar: a,
      r: r,
      theta: theta,
      sin: sin,
      cos: cos,
      delta: delta,
      sigma: sigma,
      A: A,
      gTT: -(1 - 2 * r / sigma),
      gTPhi: -2 * a * r * s2 / sigma,
      gPhiPhi: A * s2 / sigma,
      gRR: sigma / delta,
      gThetaTheta: sigma
    };
  }
  function inverseMetricAt(a, r, theta) {
    var m = metricAt(a, r, theta);
    var delta = m.delta,
      sigma = m.sigma,
      A = m.A,
      sin = m.sin;
    var s2 = sin * sin;
    var v = sigma * delta;
    return _objectSpread(_objectSpread({}, m), {}, {
      gTTUp: -A / v,
      gTPhiUp: -2 * a * r / v,
      gPhiPhiUp: (delta - a * a * s2) / (v * s2),
      gRRUp: delta / sigma,
      gThetaThetaUp: 1 / sigma
    });
  }
  function inverseMetricDerivativesAt(a, r, theta) {
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var s2 = sin * sin;
    var c2 = cos * cos;
    var delta = r * r - 2 * r + a * a;
    var deltaR = 2 * r - 2;
    var sigma = r * r + a * a * c2;
    var sigmaR = 2 * r;
    var sigmaTh = -2 * a * a * sin * cos;
    var A = Math.pow(r * r + a * a, 2) - a * a * delta * s2;
    var AR = 4 * r * (r * r + a * a) - a * a * deltaR * s2;
    var ATh = -2 * a * a * delta * sin * cos;
    var v = sigma * delta;
    var vR = sigmaR * delta + sigma * deltaR;
    var vTh = sigmaTh * delta;
    var w = delta - a * a * s2;
    var wR = deltaR;
    var wTh = -2 * a * a * sin * cos;
    var v2 = v * v;
    return {
      gTTUpR: -(AR * v - A * vR) / v2,
      gTTUpTh: -(ATh * v - A * vTh) / v2,
      gTPhiUpR: -2 * a * (v - r * vR) / v2,
      gTPhiUpTh: 2 * a * r * vTh / v2,
      gPhiPhiUpR: (wR * v - w * vR) / (v2 * s2),
      gPhiPhiUpTh: (wTh * v - w * vTh) / (v2 * s2) - 2 * w * cos / (v * sin * s2),
      gRRUpR: (deltaR * sigma - delta * sigmaR) / (sigma * sigma),
      gRRUpTh: -delta * sigmaTh / (sigma * sigma),
      gThetaThetaUpR: -sigmaR / (sigma * sigma),
      gThetaThetaUpTh: -sigmaTh / (sigma * sigma)
    };
  }
  function kerrMetricComponents(aStar, r, theta) {
    return metricAt(assertSpinParameter(aStar, "aStar"), assertPositiveNumber(r, "r"), assertFiniteNumber(theta, "theta"));
  }
  function kerrInverseMetricComponents(aStar, r, theta) {
    return inverseMetricAt(assertSpinParameter(aStar, "aStar"), assertPositiveNumber(r, "r"), assertFiniteNumber(theta, "theta"));
  }
  function kerrInverseMetricDerivatives(aStar, r, theta) {
    return inverseMetricDerivativesAt(assertSpinParameter(aStar, "aStar"), assertPositiveNumber(r, "r"), assertFiniteNumber(theta, "theta"));
  }
  function kerrHorizonRadii(aStar) {
    var a = assertSpinParameter(aStar, "aStar");
    var discriminant = 1 - a * a;
    var root = Math.sqrt(Math.max(0, discriminant));
    return {
      rPlus: 1 + root,
      rMinus: 1 - root,
      extremal: discriminant === 0,
      aStar: a
    };
  }
  function kerrIsco(aStar) {
    var _ref6 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref6$prograde = _ref6.prograde,
      prograde = _ref6$prograde === void 0 ? true : _ref6$prograde;
    var a = assertSpinParameter(aStar, "aStar");
    var abs = Math.abs(a);
    var z1 = 1 + Math.cbrt(1 - abs * abs) * (Math.cbrt(1 + abs) + Math.cbrt(1 - abs));
    var z2 = Math.sqrt(3 * abs * abs + z1 * z1);
    var root = Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    var coRotating = 3 + z2 - root;
    var counterRotating = 3 + z2 + root;
    var coRotatingIsPrograde = a >= 0;
    var wantPrograde = Boolean(prograde);
    return wantPrograde === coRotatingIsPrograde ? coRotating : counterRotating;
  }
  function kerrPhotonSphere(aStar) {
    var _ref7 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref7$prograde = _ref7.prograde,
      prograde = _ref7$prograde === void 0 ? true : _ref7$prograde;
    var a = assertSpinParameter(aStar, "aStar");
    var abs = Math.abs(a);
    var coRotating = 2 * (1 + Math.cos(2 / 3 * Math.acos(-abs)));
    var counterRotating = 2 * (1 + Math.cos(2 / 3 * Math.acos(abs)));
    var coRotatingIsPrograde = a >= 0;
    var wantPrograde = Boolean(prograde);
    return wantPrograde === coRotatingIsPrograde ? coRotating : counterRotating;
  }
  function kerrErgosphereRadius(aStar) {
    var theta = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Math.PI / 2;
    var a = assertSpinParameter(aStar, "aStar");
    var th = assertFiniteNumber(theta, "theta");
    var c = Math.cos(th);
    return 1 + Math.sqrt(Math.max(0, 1 - a * a * c * c));
  }
  function kerrRadialPotential() {
    var _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      aStar = _ref8.aStar,
      E = _ref8.E,
      Lz = _ref8.Lz,
      Q = _ref8.Q,
      r = _ref8.r;
    var a = assertSpinParameter(aStar, "aStar");
    var radius = assertPositiveNumber(r, "r");
    var energy = assertFiniteNumber(E, "E");
    var lz = assertFiniteNumber(Lz, "Lz");
    var carter = assertFiniteNumber(Q, "Q");
    var delta = radius * radius - 2 * radius + a * a;
    var p = energy * (radius * radius + a * a) - a * lz;
    return p * p - delta * (Math.pow(lz - a * energy, 2) + carter);
  }
  function kerrPolarPotential() {
    var _ref9 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      aStar = _ref9.aStar,
      E = _ref9.E,
      Lz = _ref9.Lz,
      Q = _ref9.Q,
      theta = _ref9.theta;
    var a = assertSpinParameter(aStar, "aStar");
    var th = assertFiniteNumber(theta, "theta");
    var energy = assertFiniteNumber(E, "E");
    var lz = assertFiniteNumber(Lz, "Lz");
    var carter = assertFiniteNumber(Q, "Q");
    var sin = Math.sin(th);
    var cos = Math.cos(th);
    var s2 = sin * sin;
    if (s2 === 0) return lz === 0 ? carter + a * a * energy * energy : -Infinity;
    return carter + a * a * energy * energy * cos * cos - lz * lz * cos * cos / s2;
  }
  function normalizeDirection(direction) {
    if (!direction || typeof direction.length !== "number" || direction.length !== 3) {
      throw new TypeError("direction must be a 3-component array [n_r, n_theta, n_phi]");
    }
    var _direction = _slicedToArray(direction, 3),
      nr = _direction[0],
      nth = _direction[1],
      nph = _direction[2];
    var _iterator = _createForOfIteratorHelper([nr, nth, nph].entries()),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _step$value = _slicedToArray(_step.value, 2),
          index = _step$value[0],
          value = _step$value[1];
        if (!Number.isFinite(value)) throw new TypeError("direction[".concat(index, "] must be a finite number"));
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    var norm = Math.hypot(nr, nth, nph);
    if (!(norm > 0)) throw new RangeError("direction must be a non-zero vector");
    return [nr / norm, nth / norm, nph / norm];
  }
  function kerrZamoFrame(aStar, r, theta) {
    var a = assertSpinParameter(aStar, "aStar");
    var radius = assertPositiveNumber(r, "r");
    var th = assertFiniteNumber(theta, "theta");
    var m = metricAt(a, radius, th);
    var delta = m.delta,
      sigma = m.sigma,
      A = m.A,
      sin = m.sin;
    var alpha = Math.sqrt(sigma * delta / A);
    var omega = 2 * a * radius / A;
    return {
      aStar: a,
      r: radius,
      theta: th,
      lapse: alpha,
      frameDragging: omega,
      eT: [1 / alpha, 0, 0, omega / alpha],
      eR: [0, Math.sqrt(delta / sigma), 0, 0],
      eTheta: [0, 0, 1 / Math.sqrt(sigma), 0],
      ePhi: [0, 0, 0, Math.sqrt(sigma / A) / sin]
    };
  }
  function kerrConservedQuantities() {
    var _ref0 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      aStar = _ref0.aStar,
      r = _ref0.r,
      theta = _ref0.theta,
      direction = _ref0.direction,
      _ref0$observer = _ref0.observer,
      observer = _ref0$observer === void 0 ? "zamo" : _ref0$observer;
    var a = assertSpinParameter(aStar, "aStar");
    var radius = assertPositiveNumber(r, "r");
    var th = assertFiniteNumber(theta, "theta");
    var _normalizeDirection = normalizeDirection(direction),
      _normalizeDirection2 = _slicedToArray(_normalizeDirection, 3),
      nr = _normalizeDirection2[0],
      nth = _normalizeDirection2[1],
      nph = _normalizeDirection2[2];
    var m = metricAt(a, radius, th);
    var sin = Math.sin(th);
    var cos = Math.cos(th);
    var pT;
    var pR;
    var pTheta;
    var pPhi;
    if (observer === "zamo") {
      var frame = kerrZamoFrame(a, radius, th);
      pT = frame.eT[0] + nr * frame.eR[0] + nth * frame.eTheta[0] + nph * frame.ePhi[0];
      pR = frame.eT[1] + nr * frame.eR[1] + nth * frame.eTheta[1] + nph * frame.ePhi[1];
      pTheta = frame.eT[2] + nr * frame.eR[2] + nth * frame.eTheta[2] + nph * frame.ePhi[2];
      pPhi = frame.eT[3] + nr * frame.eR[3] + nth * frame.eTheta[3] + nph * frame.ePhi[3];
    } else if (observer === "static") {
      if (!(m.gTT < 0)) {
        throw new RangeError("static observer requires g_tt < 0, i.e. a position outside the ergosphere");
      }
      pT = 1 / Math.sqrt(-m.gTT);
      pR = nr / Math.sqrt(m.gRR);
      pTheta = nth / Math.sqrt(m.gThetaTheta);
      pPhi = nph / Math.sqrt(m.gPhiPhi);
    } else {
      throw new TypeError("observer must be \"zamo\" or \"static\"; received ".concat(JSON.stringify(observer)));
    }
    var pt = m.gTT * pT + m.gTPhi * pPhi;
    var pphi = m.gTPhi * pT + m.gPhiPhi * pPhi;
    var ptheta = m.gThetaTheta * pTheta;
    var pr = m.gRR * pR;
    var E = -pt;
    var Lz = pphi;
    var Q = ptheta * ptheta + cos * cos * (-a * a * E * E + Lz * Lz / (sin * sin));
    return {
      aStar: a,
      r: radius,
      theta: th,
      observer: observer,
      E: E,
      Lz: Lz,
      Q: Q,
      pT: pT,
      pR: pR,
      pTheta: pTheta,
      pPhi: pPhi,
      pt: pt,
      pr: pr,
      ptheta: ptheta,
      pphi: pphi
    };
  }
  function carterConstantFromState(state, aStar) {
    assertFiniteState(state, "state");
    if (state.length !== 8) throw new RangeError("state must have 8 components; received ".concat(state.length));
    var a = assertSpinParameter(aStar, "aStar");
    var theta = state[2];
    var ptheta = state[6];
    var pphi = state[7];
    var pt = state[4];
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var E = -pt;
    var Lz = pphi;
    return ptheta * ptheta + cos * cos * (-a * a * E * E + Lz * Lz / (sin * sin));
  }
  function hamiltonianValue(state, aStar) {
    assertFiniteState(state, "state");
    if (state.length !== 8) throw new RangeError("state must have 8 components; received ".concat(state.length));
    var a = assertSpinParameter(aStar, "aStar");
    var m = inverseMetricAt(a, state[1], state[2]);
    var pt = state[4];
    var pr = state[5];
    var ptheta = state[6];
    var pphi = state[7];
    return 0.5 * (m.gTTUp * pt * pt + 2 * m.gTPhiUp * pt * pphi + m.gPhiPhiUp * pphi * pphi + m.gRRUp * pr * pr + m.gThetaThetaUp * ptheta * ptheta);
  }
  function kerrHamiltonianRHS(state, params) {
    assertFiniteState(state, "state");
    if (state.length !== 8) throw new RangeError("state must have 8 components; received ".concat(state.length));
    if (!params || _typeof(params) !== "object") throw new TypeError("params must be an object with an aStar field");
    var a = assertSpinParameter(params.aStar, "params.aStar");
    var r = state[1];
    var theta = state[2];
    var pt = state[4];
    var pr = state[5];
    var ptheta = state[6];
    var pphi = state[7];
    var m = inverseMetricAt(a, r, theta);
    var d = inverseMetricDerivativesAt(a, r, theta);
    var dt = m.gTTUp * pt + m.gTPhiUp * pphi;
    var dphi = m.gTPhiUp * pt + m.gPhiPhiUp * pphi;
    var dr = m.gRRUp * pr;
    var dtheta = m.gThetaThetaUp * ptheta;
    var dpr = -0.5 * (d.gTTUpR * pt * pt + 2 * d.gTPhiUpR * pt * pphi + d.gPhiPhiUpR * pphi * pphi + d.gRRUpR * pr * pr + d.gThetaThetaUpR * ptheta * ptheta);
    var dptheta = -0.5 * (d.gTTUpTh * pt * pt + 2 * d.gTPhiUpTh * pt * pphi + d.gPhiPhiUpTh * pphi * pphi + d.gRRUpTh * pr * pr + d.gThetaThetaUpTh * ptheta * ptheta);
    return [dt, dr, dtheta, dphi, 0, dpr, dptheta, 0];
  }
  function kerrSchildTimeOffset(aStar, r) {
    var a = assertSpinParameter(aStar, "aStar");
    var radius = assertPositiveNumber(r, "r");
    var delta = radius * radius - 2 * radius + a * a;
    if (delta <= 0) {
      throw new RangeError("Kerr-Schild time offset is defined only outside the horizon (Delta > 0); received r = ".concat(radius));
    }
    var k2 = 1 - a * a;
    if (k2 === 0) return radius + Math.log(delta) - 2 / (radius - 1);
    var k = Math.sqrt(k2);
    return radius + Math.log(delta) + 1 / k * Math.log(Math.abs((radius - 1 - k) / (radius - 1 + k)));
  }
  function boyerLindquistToKerrSchild() {
    var _ref1 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      aStar = _ref1.aStar,
      r = _ref1.r,
      theta = _ref1.theta,
      _ref1$phi = _ref1.phi,
      phi = _ref1$phi === void 0 ? 0 : _ref1$phi,
      _ref1$t = _ref1.t,
      t = _ref1$t === void 0 ? 0 : _ref1$t;
    var a = assertSpinParameter(aStar, "aStar");
    var radius = assertPositiveNumber(r, "r");
    var th = assertFiniteNumber(theta, "theta");
    var ph = assertFiniteNumber(phi, "phi");
    var time = assertFiniteNumber(t, "t");
    var sin = Math.sin(th);
    var cos = Math.cos(th);
    var x = radius * sin * Math.cos(ph) - a * sin * Math.sin(ph);
    var y = radius * sin * Math.sin(ph) + a * sin * Math.cos(ph);
    var z = radius * cos;
    return {
      t: time + kerrSchildTimeOffset(a, radius),
      x: x,
      y: y,
      z: z,
      aStar: a,
      r: radius
    };
  }

  /* ---------- integrators (js/science/integrators.mjs) ---------- */

  var DP_C = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];
  var DP_A = [[], [1 / 5], [3 / 40, 9 / 40], [44 / 45, -56 / 15, 32 / 9], [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729], [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656], [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]];
  var DP_B5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
  var DP_B4 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];
  var SAFETY = 0.9;
  var MIN_FACTOR = 0.2;
  var MAX_FACTOR = 5;
  function assertRhs(rhs) {
    if (typeof rhs !== "function") {
      throw new TypeError("rhs must be a function (state, params) => derivative array");
    }
  }
  function assertStateLength(state, derivative, name) {
    if (derivative.length !== state.length) {
      throw new RangeError("".concat(name, " returned ").concat(derivative.length, " components for a ").concat(state.length, "-component state"));
    }
  }
  function allFinite(values) {
    for (var index = 0; index < values.length; index += 1) {
      if (!Number.isFinite(values[index])) return false;
    }
    return true;
  }
  function combine(state, h, weights, stages) {
    var out = new Array(state.length);
    for (var i = 0; i < state.length; i += 1) {
      var sum = 0;
      for (var s = 0; s < stages.length; s += 1) {
        var w = weights[s];
        if (w !== 0) sum += w * stages[s][i];
      }
      out[i] = state[i] + h * sum;
    }
    return out;
  }
  function rk4Step(rhs, state, h, params) {
    assertRhs(rhs);
    assertFiniteState(state, "state");
    assertStepSize(h, "h");
    var n = state.length;
    var k1 = rhs(state, params);
    assertStateLength(state, k1, "rhs");
    var y2 = new Array(n);
    for (var i = 0; i < n; i += 1) y2[i] = state[i] + h / 2 * k1[i];
    var k2 = rhs(y2, params);
    assertStateLength(state, k2, "rhs");
    var y3 = new Array(n);
    for (var _i = 0; _i < n; _i += 1) y3[_i] = state[_i] + h / 2 * k2[_i];
    var k3 = rhs(y3, params);
    assertStateLength(state, k3, "rhs");
    var y4 = new Array(n);
    for (var _i2 = 0; _i2 < n; _i2 += 1) y4[_i2] = state[_i2] + h * k3[_i2];
    var k4 = rhs(y4, params);
    assertStateLength(state, k4, "rhs");
    var out = new Array(n);
    for (var _i3 = 0; _i3 < n; _i3 += 1) {
      out[_i3] = state[_i3] + h / 6 * (k1[_i3] + 2 * k2[_i3] + 2 * k3[_i3] + k4[_i3]);
    }
    return out;
  }
  function rk45Step(rhs, state, h, params) {
    var atol = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1e-11;
    var rtol = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1e-11;
    assertRhs(rhs);
    assertFiniteState(state, "state");
    assertStepSize(h, "h");
    assertTolerance(atol, "atol");
    assertTolerance(rtol, "rtol");
    var n = state.length;
    var stages = new Array(7);
    stages[0] = rhs(state, params);
    assertStateLength(state, stages[0], "rhs");
    for (var s = 1; s < 7; s += 1) {
      var y = new Array(n);
      for (var i = 0; i < n; i += 1) {
        var sum = 0;
        for (var j = 0; j < s; j += 1) {
          var a = DP_A[s][j];
          if (a !== 0) sum += a * stages[j][i];
        }
        y[i] = state[i] + h * sum;
      }
      stages[s] = rhs(y, params);
      assertStateLength(state, stages[s], "rhs");
    }
    var high = combine(state, h, DP_B5, stages);
    var low = combine(state, h, DP_B4, stages);
    var error = new Array(n);
    var sumSquares = 0;
    for (var _i4 = 0; _i4 < n; _i4 += 1) {
      var e = high[_i4] - low[_i4];
      error[_i4] = e;
      var scale = atol + rtol * Math.abs(state[_i4]);
      var ratio = e / scale;
      sumSquares += ratio * ratio;
    }
    var errorNorm = Math.sqrt(sumSquares / n);
    return {
      state: high,
      error: error,
      errorNorm: errorNorm,
      finite: allFinite(high) && Number.isFinite(errorNorm)
    };
  }
  function createRadialTermination() {
    var _ref10 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref10$innerRadius = _ref10.innerRadius,
      innerRadius = _ref10$innerRadius === void 0 ? -Infinity : _ref10$innerRadius,
      _ref10$outerRadius = _ref10.outerRadius,
      outerRadius = _ref10$outerRadius === void 0 ? Infinity : _ref10$outerRadius,
      _ref10$innerType = _ref10.innerType,
      innerType = _ref10$innerType === void 0 ? "inner-boundary" : _ref10$innerType,
      _ref10$outerType = _ref10.outerType,
      outerType = _ref10$outerType === void 0 ? "outer-boundary" : _ref10$outerType;
    return function (state) {
      var radius = state[1];
      if (Number.isFinite(innerRadius) && radius <= innerRadius) {
        return {
          type: innerType,
          state: state.slice(),
          fraction: 1,
          radius: radius
        };
      }
      if (Number.isFinite(outerRadius) && radius >= outerRadius) {
        return {
          type: outerType,
          state: state.slice(),
          fraction: 1,
          radius: radius
        };
      }
      return null;
    };
  }
  function createPlaneCrossingTermination() {
    var _ref11 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref11$planeTheta = _ref11.planeTheta,
      planeTheta = _ref11$planeTheta === void 0 ? Math.PI / 2 : _ref11$planeTheta,
      _ref11$innerRadius = _ref11.innerRadius,
      innerRadius = _ref11$innerRadius === void 0 ? -Infinity : _ref11$innerRadius,
      _ref11$outerRadius = _ref11.outerRadius,
      outerRadius = _ref11$outerRadius === void 0 ? Infinity : _ref11$outerRadius,
      _ref11$type = _ref11.type,
      type = _ref11$type === void 0 ? "plane-crossing" : _ref11$type;
    var target = Math.cos(planeTheta);
    return function (state, previousState) {
      if (!previousState) return null;
      var before = Math.cos(previousState[2]) - target;
      var after = Math.cos(state[2]) - target;
      if (before === 0) return null;
      if (before * after > 0) return null;
      var denominator = before - after;
      var fraction = denominator === 0 ? 0 : before / denominator;
      var interpolated = state.map(function (value, index) {
        return previousState[index] + fraction * (value - previousState[index]);
      });
      interpolated[2] = planeTheta;
      var radius = interpolated[1];
      if (radius < innerRadius || radius > outerRadius) return null;
      return {
        type: type,
        state: interpolated,
        fraction: fraction,
        radius: radius
      };
    };
  }
  function combineTerminations() {
    for (var _len = arguments.length, predicates = new Array(_len), _key = 0; _key < _len; _key++) {
      predicates[_key] = arguments[_key];
    }
    var active = predicates.filter(function (predicate) {
      return typeof predicate === "function";
    });
    return function (state, previousState, h) {
      var _iterator2 = _createForOfIteratorHelper(active),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var predicate = _step2.value;
          var hit = predicate(state, previousState, h);
          if (hit) return hit;
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      return null;
    };
  }
  function refineEvent(attempt, previous, hit, event) {
    var fallback = Array.isArray(hit.state) ? hit.state : null;
    if (!previous || typeof attempt.refine !== "function") return {
      state: fallback,
      event: hit
    };
    if (!(hit.fraction > 0 && hit.fraction < 1)) return {
      state: fallback,
      event: hit
    };
    var lo = 0;
    var hi = 1;
    var best = null;
    for (var iteration = 0; iteration < 24; iteration += 1) {
      var mid = 0.5 * (lo + hi);
      var refined = attempt.refine(previous, mid);
      if (!refined || !refined.finite) break;
      var refinedHit = event(refined.state, previous, attempt.h * mid);
      if (refinedHit) {
        best = {
          state: Array.isArray(refinedHit.state) ? refinedHit.state : refined.state,
          event: refinedHit
        };
        hi = mid;
      } else {
        lo = mid;
      }
      if (hi - lo < 1e-12) break;
    }
    return best || {
      state: fallback,
      event: hit
    };
  }
  function runDriver(_ref12) {
    var rhs = _ref12.rhs,
      state = _ref12.state,
      params = _ref12.params,
      event = _ref12.event,
      maxSteps = _ref12.maxSteps,
      stepper = _ref12.stepper;
    var current = state.slice();
    var previous = null;
    var steps = 0;
    var rejected = 0;
    var status = "max-steps";
    var termination = null;
    var lastError = 0;
    var h = 0;
    while (steps + rejected < maxSteps) {
      var attempt = stepper(current, previous);
      h = attempt.h;
      if (!attempt.finite) {
        rejected += 1;
        if (attempt.exhausted) {
          status = "non-finite";
          break;
        }
        continue;
      }
      steps += 1;
      lastError = attempt.errorNorm;
      previous = current;
      current = attempt.state;
      if (event) {
        var hit = event(current, previous, h);
        if (hit) {
          var refined = refineEvent(attempt, previous, hit, event);
          termination = refined.event;
          status = "event";
          if (refined.state) current = refined.state;
          break;
        }
      }
      if (attempt.done) {
        status = "completed";
        break;
      }
    }
    return {
      state: current,
      previousState: previous,
      steps: steps,
      rejected: rejected,
      h: h,
      errorNorm: lastError,
      status: status,
      event: termination
    };
  }
  function integrateFixedStep() {
    var _ref13 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      rhs = _ref13.rhs,
      state = _ref13.state,
      h = _ref13.h,
      steps = _ref13.steps,
      params = _ref13.params,
      _ref13$event = _ref13.event,
      event = _ref13$event === void 0 ? null : _ref13$event;
    assertRhs(rhs);
    assertFiniteState(state, "state");
    var step = assertStepSize(h, "h");
    var total = assertPositiveInteger(steps, "steps");
    if (event !== null && typeof event !== "function") throw new TypeError("event must be a function or null");
    var taken = 0;
    return runDriver({
      rhs: rhs,
      state: state,
      params: params,
      event: event,
      maxSteps: total,
      stepper: function stepper(current) {
        var next = rk4Step(rhs, current, step, params);
        var finite = allFinite(next);
        if (finite) taken += 1;
        return {
          state: next,
          h: step,
          finite: finite,
          exhausted: true,
          errorNorm: 0,
          done: finite && taken >= total,
          refine: function refine(from, fraction) {
            var refined = rk4Step(rhs, from, step * fraction, params);
            return {
              state: refined,
              finite: allFinite(refined)
            };
          }
        };
      }
    });
  }
  function integrateAdaptive() {
    var _ref14 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      rhs = _ref14.rhs,
      state = _ref14.state,
      h0 = _ref14.h0,
      _ref14$hMin = _ref14.hMin,
      hMin = _ref14$hMin === void 0 ? 1e-12 : _ref14$hMin,
      _ref14$hMax = _ref14.hMax,
      hMax = _ref14$hMax === void 0 ? Infinity : _ref14$hMax,
      _ref14$maxSteps = _ref14.maxSteps,
      maxSteps = _ref14$maxSteps === void 0 ? 100000 : _ref14$maxSteps,
      _ref14$atol = _ref14.atol,
      atol = _ref14$atol === void 0 ? 1e-11 : _ref14$atol,
      _ref14$rtol = _ref14.rtol,
      rtol = _ref14$rtol === void 0 ? 1e-11 : _ref14$rtol,
      params = _ref14.params,
      _ref14$event = _ref14.event,
      event = _ref14$event === void 0 ? null : _ref14$event;
    assertRhs(rhs);
    assertFiniteState(state, "state");
    var initialStep = assertStepSize(h0, "h0");
    var floor = assertStepSize(hMin, "hMin");
    var ceiling = assertStepCeiling(hMax, "hMax");
    if (floor > ceiling) throw new RangeError("hMin (".concat(floor, ") must not exceed hMax (").concat(ceiling, ")"));
    var budget = assertPositiveInteger(maxSteps, "maxSteps");
    var absTol = assertTolerance(atol, "atol");
    var relTol = assertTolerance(rtol, "rtol");
    if (event !== null && typeof event !== "function") throw new TypeError("event must be a function or null");
    var h = Math.min(initialStep, ceiling);
    return runDriver({
      rhs: rhs,
      state: state,
      params: params,
      event: event,
      maxSteps: budget,
      stepper: function stepper(current) {
        var attempt = rk45Step(rhs, current, h, params, absTol, relTol);
        if (!attempt.finite) {
          var _shrunk = h * MIN_FACTOR;
          if (_shrunk < floor) {
            return {
              state: current,
              h: h,
              finite: false,
              exhausted: true,
              errorNorm: Infinity,
              done: false
            };
          }
          h = _shrunk;
          return {
            state: current,
            h: h,
            finite: false,
            exhausted: false,
            errorNorm: Infinity,
            done: false
          };
        }
        var norm = attempt.errorNorm;
        var factor;
        if (norm === 0) factor = MAX_FACTOR;else factor = SAFETY * Math.pow(norm, -1 / 5);
        if (norm <= 1) {
          var stepUsed = h;
          var next = Math.min(ceiling, Math.max(floor, h * Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, factor))));
          var result = {
            state: attempt.state,
            h: stepUsed,
            finite: true,
            errorNorm: norm,
            done: false,
            refine: function refine(from, fraction) {
              return rk45Step(rhs, from, stepUsed * fraction, params, absTol, relTol);
            }
          };
          h = next;
          return result;
        }
        var shrunk = Math.max(floor, h * Math.min(1, Math.max(MIN_FACTOR, factor)));
        if (shrunk >= h) {
          var _stepUsed = h;
          var _result = {
            state: attempt.state,
            h: _stepUsed,
            finite: true,
            errorNorm: norm,
            done: false,
            refine: function refine(from, fraction) {
              return rk45Step(rhs, from, _stepUsed * fraction, params, absTol, relTol);
            }
          };
          h = Math.min(ceiling, h * MAX_FACTOR);
          return _result;
        }
        h = shrunk;
        return {
          state: current,
          h: h,
          finite: false,
          exhausted: false,
          errorNorm: norm,
          done: false
        };
      }
    });
  }
  function integrateUntilEvent(options) {
    return integrateAdaptive(options);
  }
  function traceKerrRay() {
    var _ref15 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref15$aStar = _ref15.aStar,
      aStar = _ref15$aStar === void 0 ? 0 : _ref15$aStar,
      r = _ref15.r,
      theta = _ref15.theta,
      _ref15$phi = _ref15.phi,
      phi = _ref15$phi === void 0 ? 0 : _ref15$phi,
      direction = _ref15.direction,
      _ref15$observer = _ref15.observer,
      observer = _ref15$observer === void 0 ? "zamo" : _ref15$observer,
      _ref15$rEscape = _ref15.rEscape,
      rEscape = _ref15$rEscape === void 0 ? 1e4 : _ref15$rEscape,
      _ref15$diskInner = _ref15.diskInner,
      diskInner = _ref15$diskInner === void 0 ? null : _ref15$diskInner,
      _ref15$diskOuter = _ref15.diskOuter,
      diskOuter = _ref15$diskOuter === void 0 ? null : _ref15$diskOuter,
      _ref15$maxSteps = _ref15.maxSteps,
      maxSteps = _ref15$maxSteps === void 0 ? 200000 : _ref15$maxSteps,
      _ref15$atol = _ref15.atol,
      atol = _ref15$atol === void 0 ? 1e-11 : _ref15$atol,
      _ref15$rtol = _ref15.rtol,
      rtol = _ref15$rtol === void 0 ? 1e-11 : _ref15$rtol,
      _ref15$h = _ref15.h0,
      h0 = _ref15$h === void 0 ? 0.05 : _ref15$h,
      _ref15$hMax = _ref15.hMax,
      hMax = _ref15$hMax === void 0 ? 1 : _ref15$hMax,
      _ref15$hMin = _ref15.hMin,
      hMin = _ref15$hMin === void 0 ? 1e-10 : _ref15$hMin,
      _ref15$horizonEpsilon = _ref15.horizonEpsilon,
      horizonEpsilon = _ref15$horizonEpsilon === void 0 ? 1e-3 : _ref15$horizonEpsilon;
    var a = assertSpinParameter(aStar, "aStar");
    var radius = assertPositiveNumber(r, "r");
    var th = assertFiniteNumber(theta, "theta");
    var ph = assertFiniteNumber(phi, "phi");
    var escape = assertPositiveNumber(rEscape, "rEscape");
    var budget = assertPositiveInteger(maxSteps, "maxSteps");
    var absTol = assertTolerance(atol, "atol");
    var relTol = assertTolerance(rtol, "rtol");
    var initialStep = assertStepSize(h0, "h0");
    var ceiling = assertStepSize(hMax, "hMax");
    var floor = assertStepSize(hMin, "hMin");
    var epsilon = assertPositiveNumber(horizonEpsilon, "horizonEpsilon");
    if (!(th > 0 && th < Math.PI)) {
      throw new RangeError("theta must lie strictly between 0 and pi; received ".concat(th));
    }
    var _kerrHorizonRadii = kerrHorizonRadii(a),
      rPlus = _kerrHorizonRadii.rPlus;
    if (!(radius > rPlus)) {
      throw new RangeError("r must lie outside the event horizon (r > r_+ = ".concat(rPlus, "); received ").concat(radius));
    }
    if (radius >= escape) throw new RangeError("r (".concat(radius, ") must be smaller than rEscape (").concat(escape, ")"));
    var conserved = kerrConservedQuantities({
      aStar: a,
      r: radius,
      theta: th,
      direction: direction,
      observer: observer
    });
    var initialState = [0, radius, th, ph, -conserved.E, conserved.pr, conserved.ptheta, conserved.Lz];
    var predicates = [createRadialTermination({
      innerRadius: rPlus + epsilon,
      innerType: "captured",
      outerRadius: escape,
      outerType: "escaped"
    })];
    if (Number.isFinite(diskInner) && Number.isFinite(diskOuter)) {
      if (!(diskInner < diskOuter)) {
        throw new RangeError("diskInner (".concat(diskInner, ") must be smaller than diskOuter (").concat(diskOuter, ")"));
      }
      predicates.push(createPlaneCrossingTermination({
        planeTheta: Math.PI / 2,
        innerRadius: diskInner,
        outerRadius: diskOuter,
        type: "disk"
      }));
    }
    var result = integrateAdaptive({
      rhs: kerrHamiltonianRHS,
      state: initialState,
      h0: initialStep,
      hMin: floor,
      hMax: ceiling,
      maxSteps: budget,
      atol: absTol,
      rtol: relTol,
      params: {
        aStar: a
      },
      event: combineTerminations.apply(void 0, predicates)
    });
    var finalState = result.state;
    var finalE = -finalState[4];
    var finalLz = finalState[7];
    var finalQ = carterConstantFromState(finalState, a);
    return {
      status: result.event ? result.event.type : result.status,
      state: finalState,
      initialState: initialState,
      event: result.event,
      steps: result.steps,
      rejected: result.rejected,
      h: result.h,
      errorNorm: result.errorNorm,
      aStar: a,
      observer: observer,
      conserved: {
        E: conserved.E,
        Lz: conserved.Lz,
        Q: conserved.Q
      },
      "final": {
        E: finalE,
        Lz: finalLz,
        Q: finalQ
      },
      drift: {
        E: finalE - conserved.E,
        Lz: finalLz - conserved.Lz,
        Q: finalQ - conserved.Q,
        hamiltonian: hamiltonianValue(finalState, a)
      }
    };
  }
  function kerrGeometry(spin) {
    var a = Math.min(0.998, Math.max(0, Number(spin) || 0));
    var root = Math.sqrt(Math.max(0, 1 - a * a));
    var rPlus = 1 + root;
    var rMinus = 1 - root;
    var z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
    var z2 = Math.sqrt(3 * a * a + z1 * z1);
    var rIsco = 3 + z2 - Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    var rIscoRetrograde = 3 + z2 + Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    var rPhoton = 2 * (1 + Math.cos(2 / 3 * Math.acos(-a)));
    var rPhotonRetrograde = 2 * (1 + Math.cos(2 / 3 * Math.acos(a)));
    var surfaceGravity = (rPlus - 1) / (rPlus * rPlus + a * a);
    return {
      a: a,
      rPlus: rPlus,
      rMinus: rMinus,
      rErgoEquator: 2,
      rIsco: rIsco,
      rIscoRetrograde: rIscoRetrograde,
      rPhoton: rPhoton,
      rPhotonRetrograde: rPhotonRetrograde,
      z1: z1,
      z2: z2,
      surfaceGravity: surfaceGravity,
      temperatureFactor: surfaceGravity / 0.25
    };
  }
  function kerrErgosphere(spin) {
    var theta = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Math.PI / 2;
    var a = Math.min(0.998, Math.max(0, Number(spin) || 0));
    var c = Math.cos(Number(theta) || 0);
    return 1 + Math.sqrt(Math.max(0, 1 - a * a * c * c));
  }

  /* ---------- accretion disk (js/science/accretion-disk.mjs) ---------- */

  var DEFAULT_QUADRATURE_ORDER = 64;
  var legendreCache = new Map();
  function gaussLegendreNodes(order) {
    assertPositiveInteger(order, "order");
    var cached = legendreCache.get(order);
    if (cached) return cached;
    var nodes = new Float64Array(order);
    var weights = new Float64Array(order);
    var half = order + 1 >> 1;
    for (var i = 0; i < half; i += 1) {
      var z = Math.cos(Math.PI * (i + 0.75) / (order + 0.5));
      var derivative = 0;
      for (var iteration = 0; iteration < 100; iteration += 1) {
        var previous = 1;
        var current = 0;
        for (var j = 0; j < order; j += 1) {
          var before = current;
          current = previous;
          previous = ((2 * (j + 1) - 1) * z * current - j * before) / (j + 1);
        }
        derivative = order * (z * previous - current) / (z * z - 1);
        var next = z - previous / derivative;
        var converged = Math.abs(next - z) <= 1e-15;
        z = next;
        if (converged) break;
      }
      var weight = 2 / ((1 - z * z) * derivative * derivative);
      nodes[i] = -z;
      nodes[order - 1 - i] = z;
      weights[i] = weight;
      weights[order - 1 - i] = weight;
    }
    var rule = Object.freeze({
      order: order,
      nodes: nodes,
      weights: weights
    });
    legendreCache.set(order, rule);
    return rule;
  }
  function gaussLegendreIntegrate(f, a, b) {
    var order = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : DEFAULT_QUADRATURE_ORDER;
    if (typeof f !== "function") throw new TypeError("f must be a function");
    var lower = assertFiniteNumber(a, "a");
    var upper = assertFiniteNumber(b, "b");
    if (upper === lower) return 0;
    var _gaussLegendreNodes = gaussLegendreNodes(order),
      nodes = _gaussLegendreNodes.nodes,
      weights = _gaussLegendreNodes.weights;
    var halfSpan = (upper - lower) / 2;
    var midpoint = (lower + upper) / 2;
    var sum = 0;
    for (var i = 0; i < nodes.length; i += 1) sum += weights[i] * f(midpoint + halfSpan * nodes[i]);
    return sum * halfSpan;
  }
  function kerrCircularOrbit(aStar, r) {
    var _ref16 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref16$prograde = _ref16.prograde,
      prograde = _ref16$prograde === void 0 ? true : _ref16$prograde;
    var spin = assertSpinParameter(aStar);
    var radius = assertPositiveNumber(r, "r");
    if (typeof prograde !== "boolean") throw new TypeError("prograde must be a boolean");
    var sign = prograde ? 1 : -1;
    var rootR = Math.sqrt(radius);
    var denominator = Math.pow(radius, 1.5) - 3 * rootR + 2 * sign * spin;
    if (!(denominator > 0)) {
      throw new RangeError("r must exceed the ".concat(prograde ? "prograde" : "retrograde", " photon sphere for a circular orbit; received r = ").concat(radius));
    }
    var rootDenominator = Math.sqrt(denominator);
    var weight = Math.pow(radius, 0.75) * rootDenominator;
    var energyNumerator = Math.pow(radius, 1.5) - 2 * rootR + sign * spin;
    var angularMomentumNumerator = sign * (radius * radius - 2 * sign * spin * rootR + spin * spin);
    var energy = energyNumerator / weight;
    var angularMomentum = angularMomentumNumerator / weight;
    var omegaDenominator = Math.pow(radius, 1.5) + sign * spin;
    var omega = sign / omegaDenominator;
    var omegaDerivative = -sign * 1.5 * rootR / (omegaDenominator * omegaDenominator);
    var denominatorDerivative = 1.5 * rootR - 1.5 / rootR;
    var weightDerivative = 0.75 * Math.pow(radius, -0.25) * rootDenominator + Math.pow(radius, 0.75) * denominatorDerivative / (2 * rootDenominator);
    var energyNumeratorDerivative = 1.5 * rootR - 1 / rootR;
    var angularMomentumNumeratorDerivative = sign * (2 * radius - sign * spin / rootR);
    var energyDerivative = (energyNumeratorDerivative * weight - energyNumerator * weightDerivative) / (weight * weight);
    var angularMomentumDerivative = (angularMomentumNumeratorDerivative * weight - angularMomentumNumerator * weightDerivative) / (weight * weight);
    var metric = kerrMetricComponents(spin, radius, Math.PI / 2);
    var norm = -(metric.gTT + 2 * omega * metric.gTPhi + omega * omega * metric.gPhiPhi);
    if (!(norm > 0)) throw new RangeError("circular orbit at r = ".concat(radius, " is not timelike for a* = ").concat(spin));
    var timeComponent = 1 / Math.sqrt(norm);
    return {
      aStar: spin,
      r: radius,
      prograde: prograde,
      sign: sign,
      omega: omega,
      omegaDerivative: omegaDerivative,
      energy: energy,
      energyDerivative: energyDerivative,
      angularMomentum: angularMomentum,
      angularMomentumDerivative: angularMomentumDerivative,
      timeComponent: timeComponent,
      specificEnergyFromMetric: -(metric.gTT + omega * metric.gTPhi) * timeComponent,
      specificAngularMomentumFromMetric: (metric.gTPhi + omega * metric.gPhiPhi) * timeComponent
    };
  }
  function pageThorneFluxGeometric() {
    var _ref17 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref17$aStar = _ref17.aStar,
      aStar = _ref17$aStar === void 0 ? 0 : _ref17$aStar,
      r = _ref17.r,
      _ref17$massRate = _ref17.massRate,
      massRate = _ref17$massRate === void 0 ? 1 : _ref17$massRate,
      _ref17$prograde = _ref17.prograde,
      prograde = _ref17$prograde === void 0 ? true : _ref17$prograde,
      innerRadius = _ref17.innerRadius,
      _ref17$quadratureOrde = _ref17.quadratureOrder,
      quadratureOrder = _ref17$quadratureOrde === void 0 ? DEFAULT_QUADRATURE_ORDER : _ref17$quadratureOrde;
    var spin = assertSpinParameter(aStar);
    var radius = assertPositiveNumber(r, "r");
    var rate = assertNonNegativeNumber(massRate, "massRate");
    if (typeof prograde !== "boolean") throw new TypeError("prograde must be a boolean");
    var inner = innerRadius === undefined ? kerrIsco(spin, {
      prograde: prograde
    }) : assertPositiveNumber(innerRadius, "innerRadius");
    assertPositiveInteger(quadratureOrder, "quadratureOrder");
    if (radius <= inner) return 0;
    var orbit = kerrCircularOrbit(spin, radius, {
      prograde: prograde
    });
    var innerOrbit = kerrCircularOrbit(spin, inner, {
      prograde: prograde
    });
    var integrand = function integrand(radiusPrime) {
      var local = kerrCircularOrbit(spin, radiusPrime, {
        prograde: prograde
      });
      return (local.energy - local.omega * local.angularMomentum) * local.angularMomentumDerivative;
    };
    var integral = gaussLegendreIntegrate(integrand, inner, radius, quadratureOrder);
    var frameEnergy = orbit.energy - orbit.omega * orbit.angularMomentum;
    var innerFrameEnergy = innerOrbit.energy - innerOrbit.omega * innerOrbit.angularMomentum;
    if (!(frameEnergy > 0) || !(innerFrameEnergy > 0)) {
      throw new RangeError("circular orbit at r = ".concat(radius, " has a non-positive comoving energy"));
    }
    return rate / (4 * Math.PI * radius) * -orbit.omegaDerivative / (frameEnergy * frameEnergy) * integral;
  }
  function pageThorneFluxSI() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var massSolar = options.massSolar,
      rest = _objectWithoutProperties(options, _excluded);
    return geometricFluxToSI(pageThorneFluxGeometric(rest), massSolar);
  }
  function newtonianDiskFluxGeometric() {
    var _ref18 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      r = _ref18.r,
      _ref18$massRate = _ref18.massRate,
      massRate = _ref18$massRate === void 0 ? 1 : _ref18$massRate,
      _ref18$innerRadius = _ref18.innerRadius,
      innerRadius = _ref18$innerRadius === void 0 ? 6 : _ref18$innerRadius;
    var radius = assertPositiveNumber(r, "r");
    var rate = assertNonNegativeNumber(massRate, "massRate");
    var inner = assertPositiveNumber(innerRadius, "innerRadius");
    if (radius <= inner) return 0;
    return 3 * rate / (8 * Math.PI * Math.pow(radius, 3)) * (1 - Math.sqrt(inner / radius));
  }
  function geometricStefanBoltzmannConstant(massSolar) {
    var mass = massKilograms(assertPositiveNumber(massSolar, "massSolar"));
    return Math.pow(Math.PI, 2) * HBAR * C / (60 * G * mass * mass);
  }
  function diskEffectiveTemperatureKelvin(fluxGeometric, massSolar) {
    var flux = assertNonNegativeNumber(fluxGeometric, "fluxGeometric");
    var sigma = geometricStefanBoltzmannConstant(massSolar);
    if (flux === 0) return 0;
    return geometricTemperatureToKelvin(Math.pow(flux / sigma, 0.25), massSolar);
  }
  function diskEffectiveTemperatureGeometric(fluxGeometric, massSolar) {
    var flux = assertNonNegativeNumber(fluxGeometric, "fluxGeometric");
    var sigma = geometricStefanBoltzmannConstant(massSolar);
    return flux === 0 ? 0 : Math.pow(flux / sigma, 0.25);
  }
  function kerrGravitationalRedshiftOrbiting(aStar, r) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return 1 / kerrCircularOrbit(aStar, r, options).timeComponent;
  }
  function kerrOrbitalDopplerFactor() {
    var _ref19 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      energy = _ref19.energy,
      angularMomentum = _ref19.angularMomentum,
      omega = _ref19.omega,
      lz = _ref19.lz;
    var E = assertFiniteNumber(energy, "energy");
    var L = assertFiniteNumber(angularMomentum, "angularMomentum");
    var O = assertFiniteNumber(omega, "omega");
    var Lz = assertFiniteNumber(lz, "lz");
    if (!(E > 0)) throw new RangeError("energy must be positive for a future-directed photon; received ".concat(E));
    var denominator = E - O * Lz;
    if (!(denominator > 0)) throw new RangeError("E - Omega Lz must be positive; received ".concat(denominator));
    return E / denominator;
  }
  function kerrTotalRedshiftFactor() {
    var _ref20 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      aStar = _ref20.aStar,
      r = _ref20.r,
      _ref20$prograde = _ref20.prograde,
      prograde = _ref20$prograde === void 0 ? true : _ref20$prograde,
      energy = _ref20.energy,
      lz = _ref20.lz;
    var orbit = kerrCircularOrbit(aStar, r, {
      prograde: prograde
    });
    var gravitational = 1 / orbit.timeComponent;
    var orbital = kerrOrbitalDopplerFactor({
      energy: energy,
      angularMomentum: orbit.angularMomentum,
      omega: orbit.omega,
      lz: lz
    });
    return {
      total: gravitational * orbital,
      gravitational: gravitational,
      orbital: orbital,
      timeComponent: orbit.timeComponent
    };
  }
  function kerrGravitationalRedshiftStatic(aStar, r) {
    var theta = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Math.PI / 2;
    var spin = assertSpinParameter(aStar);
    var radius = assertPositiveNumber(r, "r");
    var polar = assertFiniteNumber(theta, "theta");
    var metric = kerrMetricComponents(spin, radius, polar);
    var norm = -metric.gTT;
    if (!(norm > 0)) {
      throw new RangeError("no static observer exists at r = ".concat(radius, ", theta = ").concat(polar, " (inside the ergosphere)"));
    }
    return Math.sqrt(norm);
  }
  function observedTemperatureKelvin(emittedKelvin, g) {
    var emitted = assertNonNegativeNumber(emittedKelvin, "emittedKelvin");
    var factor = assertPositiveNumber(g, "g");
    return emitted * factor;
  }

  /* ---------- spectrum (js/science/spectrum.mjs) ---------- */

  var NANOMETRE_TO_METRE = 1e-9;
  var WIEN_FREQUENCY_COEFFICIENT = 2.8214393721220787;
  var SRGB_GAMMA_THRESHOLD = 0.0031308;
  var SRGB_GAMMA_SLOPE = 12.92;
  var SRGB_GAMMA_OFFSET = 0.055;
  var SRGB_GAMMA_EXPONENT = 1 / 2.4;
  var FAST_FIT_STEP_NM = 20;
  var XYZ_TO_LINEAR_SRGB = Object.freeze([Object.freeze([3.2404542, -1.5371385, -0.4985314]), Object.freeze([-0.969266, 1.8760108, 0.041556]), Object.freeze([0.0556434, -0.2040259, 1.0572252])]);
  var CIE_1931_2DEG_WAVELENGTH_START_NM = 380;
  var CIE_1931_2DEG_WAVELENGTH_STEP_NM = 5;
  var CIE_1931_2DEG_WAVELENGTH_END_NM = 780;
  var CIE_1931_2DEG_SAMPLE_COUNT = 81;
  var CIE_1931_2DEG_SOURCE = Object.freeze({
    name: "CIE 1931 2-deg standard observer colour-matching functions",
    table: "ciexyz31_1",
    origin: "CIE 15:2004 / CIE 018:2019 standard-observer tabulation",
    distributor: "Colour & Vision Research Laboratory (CVRL), UCL Institute of Ophthalmology",
    url: "http://cvrl.ioo.ucl.ac.uk/",
    license: "CVRL research/educational redistribution of factual CIE standard-observer data",
    spacingNm: 5,
    rangeNm: [380, 780]
  });
  var CIE_1931_2DEG_X = Object.freeze([0.001368, 0.002236, 0.004243, 0.00765, 0.01431, 0.02319, 0.04351, 0.07763, 0.13438, 0.21477, 0.2839, 0.3285, 0.34828, 0.34806, 0.3362, 0.3187, 0.2908, 0.2511, 0.19536, 0.1421, 0.09564, 0.05795001, 0.03201, 0.0147, 0.0049, 0.0024, 0.0093, 0.0291, 0.06327, 0.1096, 0.1655, 0.2257499, 0.2904, 0.3597, 0.4334499, 0.5120501, 0.5945, 0.6784, 0.7621, 0.8425, 0.9163, 0.9786, 1.0263, 1.0567, 1.0622, 1.0456, 1.0026, 0.9384, 0.8544499, 0.7514, 0.6424, 0.5419, 0.4479, 0.3608, 0.2835, 0.2187, 0.1649, 0.1212, 0.0874, 0.0636, 0.04677, 0.0329, 0.0227, 0.01584, 0.01135916, 0.008110916, 0.005790346, 0.004109457, 0.002899327, 0.00204919, 0.001439971, 0.000999949, 0.000690079, 0.000476021, 0.000332301, 0.000234826, 0.000166151, 0.000117413, 0.000083075, 0.000058707, 0.00004151]);
  var CIE_1931_2DEG_Y = Object.freeze([0.000039, 0.000064, 0.00012, 0.000217, 0.000396, 0.00064, 0.00121, 0.00218, 0.004, 0.0073, 0.0116, 0.01684, 0.023, 0.0298, 0.038, 0.048, 0.06, 0.0739, 0.09098, 0.1126, 0.13902, 0.1693, 0.20802, 0.2586, 0.323, 0.4073, 0.503, 0.6082, 0.71, 0.7932, 0.862, 0.9148501, 0.954, 0.9803, 0.9949501, 1.0, 0.995, 0.9786, 0.952, 0.9154, 0.87, 0.8163, 0.757, 0.6949, 0.631, 0.5668, 0.503, 0.4412, 0.381, 0.321, 0.265, 0.217, 0.175, 0.1382, 0.107, 0.0816, 0.061, 0.04458, 0.032, 0.0232, 0.017, 0.01192, 0.00821, 0.005723, 0.004102, 0.002929, 0.002091, 0.001484, 0.001047, 0.00074, 0.00052, 0.0003611, 0.0002492, 0.0001719, 0.00012, 0.0000848, 0.00006, 0.0000424, 0.00003, 0.0000212, 0.00001499]);
  var CIE_1931_2DEG_Z = Object.freeze([0.006450001, 0.01054999, 0.02005001, 0.03621, 0.06785001, 0.1102, 0.2074, 0.3713, 0.6456, 1.0390501, 1.3856, 1.62296, 1.74706, 1.7826, 1.77211, 1.7441, 1.6692, 1.5281, 1.28764, 1.0419, 0.8129501, 0.6162, 0.46518, 0.3533, 0.272, 0.2123, 0.1582, 0.1117, 0.07824999, 0.05725001, 0.04216, 0.02984, 0.0203, 0.0134, 0.008749999, 0.005749999, 0.0039, 0.002749999, 0.0021, 0.0018, 0.001650001, 0.0014, 0.0011, 0.001, 0.0008, 0.0006, 0.00034, 0.00024, 0.00019, 0.0001, 0.00005, 0.00003, 0.00002, 0.00001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
  function planckSpectralRadiance(wavelengthMeters, temperatureK) {
    var wavelength = assertWavelength(wavelengthMeters);
    var temperature = assertTemperature(temperatureK);
    var exponent = H_PLANCK * C / (wavelength * KB * temperature);
    if (exponent > 700) return 0;
    var numerator = 2 * H_PLANCK * C * C / Math.pow(wavelength, 5);
    return numerator / Math.expm1(exponent);
  }
  function planckSpectralRadiancePerFrequency(frequencyHz, temperatureK) {
    var frequency = assertWavelength(frequencyHz, "frequencyHz");
    var temperature = assertTemperature(temperatureK);
    var exponent = H_PLANCK * frequency / (KB * temperature);
    if (exponent > 700) return 0;
    var numerator = 2 * H_PLANCK * Math.pow(frequency, 3) / (C * C);
    return numerator / Math.expm1(exponent);
  }
  function wienPeakWavelengthMeters(temperatureK) {
    return WIEN_DISPLACEMENT_B / assertTemperature(temperatureK);
  }
  function wienPeakFrequencyHz(temperatureK) {
    return WIEN_FREQUENCY_COEFFICIENT * KB * assertTemperature(temperatureK) / H_PLANCK;
  }
  function gaussianLobe(x, mu, sigmaShort, sigmaLong) {
    var sigma = x < mu ? sigmaShort : sigmaLong;
    var z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z);
  }
  function cieXyzBarAnalytic(wavelengthNm) {
    var lambda = assertFiniteNumber(wavelengthNm, "wavelengthNm");
    var x = 1.056 * gaussianLobe(lambda, 599.8, 37.9, 31.0) + 0.362 * gaussianLobe(lambda, 442.0, 16.0, 26.7) - 0.065 * gaussianLobe(lambda, 501.1, 20.4, 26.2);
    var y = 0.821 * gaussianLobe(lambda, 568.8, 46.9, 40.5) + 0.286 * gaussianLobe(lambda, 530.9, 16.3, 31.1);
    var z = 1.217 * gaussianLobe(lambda, 437.0, 11.8, 36.0) + 0.681 * gaussianLobe(lambda, 459.0, 26.0, 13.8);
    return {
      x: x,
      y: y,
      z: z
    };
  }
  function cieXyzBarTabulated(index) {
    var i = assertPositiveInteger(index + 1, "index") - 1;
    if (i >= CIE_1931_2DEG_SAMPLE_COUNT) {
      throw new RangeError("index must be < ".concat(CIE_1931_2DEG_SAMPLE_COUNT, "; received ").concat(index));
    }
    return {
      x: CIE_1931_2DEG_X[i],
      y: CIE_1931_2DEG_Y[i],
      z: CIE_1931_2DEG_Z[i]
    };
  }
  function cieXyzFromSpectralRadiance(radiance) {
    if (typeof radiance !== "function") throw new TypeError("radiance must be a function");
    var stepMeters = CIE_1931_2DEG_WAVELENGTH_STEP_NM * NANOMETRE_TO_METRE;
    var x = 0;
    var y = 0;
    var z = 0;
    for (var i = 0; i < CIE_1931_2DEG_SAMPLE_COUNT; i += 1) {
      var wavelengthNm = CIE_1931_2DEG_WAVELENGTH_START_NM + i * CIE_1931_2DEG_WAVELENGTH_STEP_NM;
      var value = radiance(wavelengthNm * NANOMETRE_TO_METRE);
      if (!Number.isFinite(value)) throw new RangeError("radiance returned a non-finite value at ".concat(wavelengthNm, " nm"));
      var weight = i === 0 || i === CIE_1931_2DEG_SAMPLE_COUNT - 1 ? 0.5 : 1;
      x += weight * value * CIE_1931_2DEG_X[i];
      y += weight * value * CIE_1931_2DEG_Y[i];
      z += weight * value * CIE_1931_2DEG_Z[i];
    }
    return {
      x: x * stepMeters,
      y: y * stepMeters,
      z: z * stepMeters
    };
  }
  function cieXyzFromSpectralRadianceFast(radiance) {
    var _ref21 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref21$stepNm = _ref21.stepNm,
      stepNm = _ref21$stepNm === void 0 ? FAST_FIT_STEP_NM : _ref21$stepNm;
    if (typeof radiance !== "function") throw new TypeError("radiance must be a function");
    var step = assertFiniteNumber(stepNm, "stepNm");
    if (!(step > 0)) throw new RangeError("stepNm must be greater than zero; received ".concat(step));
    var start = CIE_1931_2DEG_WAVELENGTH_START_NM;
    var end = CIE_1931_2DEG_WAVELENGTH_END_NM;
    var count = Math.round((end - start) / step);
    if (count < 2) throw new RangeError("stepNm = ".concat(step, " is too coarse for the ").concat(start, "-").concat(end, " nm range"));
    var actualStep = (end - start) / count;
    var stepMeters = actualStep * NANOMETRE_TO_METRE;
    var x = 0;
    var y = 0;
    var z = 0;
    for (var i = 0; i <= count; i += 1) {
      var wavelengthNm = start + i * actualStep;
      var value = radiance(wavelengthNm * NANOMETRE_TO_METRE);
      if (!Number.isFinite(value)) throw new RangeError("radiance returned a non-finite value at ".concat(wavelengthNm, " nm"));
      var bar = cieXyzBarAnalytic(wavelengthNm);
      var weight = i === 0 || i === count ? 0.5 : 1;
      x += weight * value * bar.x;
      y += weight * value * bar.y;
      z += weight * value * bar.z;
    }
    return {
      x: x * stepMeters,
      y: y * stepMeters,
      z: z * stepMeters
    };
  }
  function xyzToChromaticity() {
    var _ref22 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      x = _ref22.x,
      y = _ref22.y,
      z = _ref22.z;
    var X = assertFiniteNumber(x, "x");
    var Y = assertFiniteNumber(y, "y");
    var Z = assertFiniteNumber(z, "z");
    var sum = X + Y + Z;
    if (!(sum > 0)) throw new RangeError("tristimulus values must have a positive sum to define a chromaticity");
    return {
      x: X / sum,
      y: Y / sum
    };
  }
  function xyzToLinearSrgb() {
    var _ref23 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      x = _ref23.x,
      y = _ref23.y,
      z = _ref23.z;
    var X = assertFiniteNumber(x, "x");
    var Y = assertFiniteNumber(y, "y");
    var Z = assertFiniteNumber(z, "z");
    var m = XYZ_TO_LINEAR_SRGB;
    return {
      r: m[0][0] * X + m[0][1] * Y + m[0][2] * Z,
      g: m[1][0] * X + m[1][1] * Y + m[1][2] * Z,
      b: m[2][0] * X + m[2][1] * Y + m[2][2] * Z
    };
  }
  function linearSrgbToSrgb(value) {
    var v = assertFiniteNumber(value, "value");
    if (v <= 0) return 0;
    if (v >= 1) return 1;
    if (v <= SRGB_GAMMA_THRESHOLD) return SRGB_GAMMA_SLOPE * v;
    return (1 + SRGB_GAMMA_OFFSET) * Math.pow(v, SRGB_GAMMA_EXPONENT) - SRGB_GAMMA_OFFSET;
  }
  function srgbToLinearSrgb(value) {
    var v = assertFiniteNumber(value, "value");
    if (v <= 0) return 0;
    if (v >= 1) return 1;
    if (v <= SRGB_GAMMA_SLOPE * SRGB_GAMMA_THRESHOLD) return v / SRGB_GAMMA_SLOPE;
    return Math.pow((v + SRGB_GAMMA_OFFSET) / (1 + SRGB_GAMMA_OFFSET), 1 / SRGB_GAMMA_EXPONENT);
  }
  function normalizeLinearRgb(rgb) {
    var peak = Math.max(rgb.r, rgb.g, rgb.b);
    if (!(peak > 0)) return {
      r: 0,
      g: 0,
      b: 0
    };
    return {
      r: Math.min(1, Math.max(0, rgb.r / peak)),
      g: Math.min(1, Math.max(0, rgb.g / peak)),
      b: Math.min(1, Math.max(0, rgb.b / peak))
    };
  }
  function linearSrgbToHex(linearRgb) {
    var channels = ["r", "g", "b"].map(function (key) {
      var encoded = linearSrgbToSrgb(linearRgb[key]);
      return Math.round(encoded * 255).toString(16).padStart(2, "0");
    });
    return "#".concat(channels.join(""));
  }
  function blackbodyToSrgb(temperatureK) {
    var temperature = assertTemperature(temperatureK);
    var raw = cieXyzFromSpectralRadiance(function (wavelength) {
      return planckSpectralRadiance(wavelength, temperature);
    });
    if (!(raw.y > 0)) throw new RangeError("blackbody at ".concat(temperature, " K has zero luminance in the visible band"));
    var xyz = {
      x: raw.x / raw.y,
      y: 1,
      z: raw.z / raw.y
    };
    var linearRgb = normalizeLinearRgb(xyzToLinearSrgb(xyz));
    var srgb = {
      r: linearSrgbToSrgb(linearRgb.r),
      g: linearSrgbToSrgb(linearRgb.g),
      b: linearSrgbToSrgb(linearRgb.b)
    };
    return {
      temperatureK: temperature,
      xyz: xyz,
      linearRgb: linearRgb,
      srgb: srgb,
      hex: linearSrgbToHex(linearRgb)
    };
  }
  function fastBlackbodyToSrgb(temperatureK) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var temperature = assertTemperature(temperatureK);
    var raw = cieXyzFromSpectralRadianceFast(function (wavelength) {
      return planckSpectralRadiance(wavelength, temperature);
    }, options);
    if (!(raw.y > 0)) throw new RangeError("blackbody at ".concat(temperature, " K has zero luminance in the visible band"));
    var xyz = {
      x: raw.x / raw.y,
      y: 1,
      z: raw.z / raw.y
    };
    var linearRgb = normalizeLinearRgb(xyzToLinearSrgb(xyz));
    var srgb = {
      r: linearSrgbToSrgb(linearRgb.r),
      g: linearSrgbToSrgb(linearRgb.g),
      b: linearSrgbToSrgb(linearRgb.b)
    };
    return {
      temperatureK: temperature,
      xyz: xyz,
      linearRgb: linearRgb,
      srgb: srgb,
      hex: linearSrgbToHex(linearRgb)
    };
  }
  function fastBlackbodyToSrgbMaxError() {
    var _ref24 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref24$minK = _ref24.minK,
      minK = _ref24$minK === void 0 ? 1000 : _ref24$minK,
      _ref24$maxK = _ref24.maxK,
      maxK = _ref24$maxK === void 0 ? 40000 : _ref24$maxK,
      _ref24$samples = _ref24.samples,
      samples = _ref24$samples === void 0 ? 400 : _ref24$samples,
      _ref24$stepNm = _ref24.stepNm,
      stepNm = _ref24$stepNm === void 0 ? FAST_FIT_STEP_NM : _ref24$stepNm;
    var low = assertTemperature(minK, "minK");
    var high = assertTemperature(maxK, "maxK");
    if (!(high > low)) throw new RangeError("maxK must exceed minK; received ".concat(low, " and ").concat(high));
    var count = assertPositiveInteger(samples, "samples");
    var step = assertFiniteNumber(stepNm, "stepNm");
    var logLow = Math.log(low);
    var logHigh = Math.log(high);
    var perChannel = {
      r: 0,
      g: 0,
      b: 0
    };
    var maxChannelError = 0;
    var maxLinearChannelError = 0;
    var maxChromaticityError = 0;
    var maxErrorTemperatureK = low;
    for (var i = 0; i < count; i += 1) {
      var temperature = Math.exp(logLow + (logHigh - logLow) * i / (count - 1));
      var reference = blackbodyToSrgb(temperature);
      var fast = fastBlackbodyToSrgb(temperature, {
        stepNm: step
      });
      var worst = 0;
      var worstLinear = 0;
      for (var _i5 = 0, _arr = ["r", "g", "b"]; _i5 < _arr.length; _i5++) {
        var key = _arr[_i5];
        var delta = Math.abs(fast.srgb[key] - reference.srgb[key]);
        var deltaLinear = Math.abs(fast.linearRgb[key] - reference.linearRgb[key]);
        if (delta > perChannel[key]) perChannel[key] = delta;
        if (delta > worst) worst = delta;
        if (deltaLinear > worstLinear) worstLinear = deltaLinear;
      }
      var referenceChromaticity = xyzToChromaticity(reference.xyz);
      var fastChromaticity = xyzToChromaticity(fast.xyz);
      var chromaticityError = Math.hypot(fastChromaticity.x - referenceChromaticity.x, fastChromaticity.y - referenceChromaticity.y);
      if (chromaticityError > maxChromaticityError) maxChromaticityError = chromaticityError;
      if (worst > maxChannelError) {
        maxChannelError = worst;
        maxErrorTemperatureK = temperature;
      }
      if (worstLinear > maxLinearChannelError) maxLinearChannelError = worstLinear;
    }
    return {
      minK: low,
      maxK: high,
      samples: count,
      stepNm: step,
      maxChannelError: maxChannelError,
      maxLinearChannelError: maxLinearChannelError,
      maxChromaticityError: maxChromaticityError,
      maxErrorTemperatureK: maxErrorTemperatureK,
      perChannel: perChannel
    };
  }
  return {
    /* constants */
    G: G,
    C: C,
    HBAR: HBAR,
    H_PLANCK: H_PLANCK,
    KB: KB,
    SOLAR_MASS: SOLAR_MASS,
    STEFAN_BOLTZMANN: STEFAN_BOLTZMANN,
    WIEN_DISPLACEMENT_B: WIEN_DISPLACEMENT_B,
    MAX_SPIN_MAGNITUDE: MAX_SPIN_MAGNITUDE,
    GRAVITATIONAL_CONSTANT: G,
    SPEED_OF_LIGHT: C,
    PLANCK_H: H_PLANCK,
    BOLTZMANN_K: KB,
    SOLAR_MASS_KG: SOLAR_MASS,
    /* validation */
    assertFiniteNumber: assertFiniteNumber,
    assertPositiveNumber: assertPositiveNumber,
    assertNonNegativeNumber: assertNonNegativeNumber,
    assertPositiveInteger: assertPositiveInteger,
    assertSpinParameter: assertSpinParameter,
    assertMassSolar: assertMassSolar,
    assertTemperature: assertTemperature,
    assertWavelength: assertWavelength,
    assertTolerance: assertTolerance,
    assertStepSize: assertStepSize,
    assertStepCeiling: assertStepCeiling,
    assertFiniteState: assertFiniteState,
    /* conversions */
    massKilograms: massKilograms,
    geometricLengthUnitMeters: geometricLengthUnitMeters,
    geometricTimeUnitSeconds: geometricTimeUnitSeconds,
    geometricTemperatureUnitKelvin: geometricTemperatureUnitKelvin,
    geometricLengthToMeters: geometricLengthToMeters,
    metersToGeometricLength: metersToGeometricLength,
    geometricTimeToSeconds: geometricTimeToSeconds,
    secondsToGeometricTime: secondsToGeometricTime,
    geometricMassToKilograms: geometricMassToKilograms,
    geometricFrequencyToHertz: geometricFrequencyToHertz,
    hertzToGeometricFrequency: hertzToGeometricFrequency,
    geometricTemperatureToKelvin: geometricTemperatureToKelvin,
    kelvinToGeometricTemperature: kelvinToGeometricTemperature,
    geometricLuminosityToWatts: geometricLuminosityToWatts,
    geometricMassRateToKgPerSecond: geometricMassRateToKgPerSecond,
    kgPerSecondToGeometricMassRate: kgPerSecondToGeometricMassRate,
    geometricAngularMomentumToSI: geometricAngularMomentumToSI,
    geometricFluxToSI: geometricFluxToSI,
    siFluxToGeometric: siFluxToGeometric,
    geometricEnergyToJoules: geometricEnergyToJoules,
    /* kerr */
    TWO_PI: TWO_PI,
    kerrMetricComponents: kerrMetricComponents,
    kerrInverseMetricComponents: kerrInverseMetricComponents,
    kerrInverseMetricDerivatives: kerrInverseMetricDerivatives,
    kerrHorizonRadii: kerrHorizonRadii,
    kerrIsco: kerrIsco,
    kerrPhotonSphere: kerrPhotonSphere,
    kerrErgosphereRadius: kerrErgosphereRadius,
    kerrRadialPotential: kerrRadialPotential,
    kerrPolarPotential: kerrPolarPotential,
    kerrZamoFrame: kerrZamoFrame,
    kerrConservedQuantities: kerrConservedQuantities,
    carterConstantFromState: carterConstantFromState,
    hamiltonianValue: hamiltonianValue,
    kerrHamiltonianRHS: kerrHamiltonianRHS,
    kerrSchildTimeOffset: kerrSchildTimeOffset,
    boyerLindquistToKerrSchild: boyerLindquistToKerrSchild,
    traceKerrRay: traceKerrRay,
    kerrGeometry: kerrGeometry,
    kerrErgosphere: kerrErgosphere,
    /* integrators */
    rk4Step: rk4Step,
    rk45Step: rk45Step,
    createRadialTermination: createRadialTermination,
    createPlaneCrossingTermination: createPlaneCrossingTermination,
    combineTerminations: combineTerminations,
    integrateFixedStep: integrateFixedStep,
    integrateAdaptive: integrateAdaptive,
    integrateUntilEvent: integrateUntilEvent,
    /* accretion disk */
    DEFAULT_QUADRATURE_ORDER: DEFAULT_QUADRATURE_ORDER,
    gaussLegendreNodes: gaussLegendreNodes,
    gaussLegendreIntegrate: gaussLegendreIntegrate,
    kerrCircularOrbit: kerrCircularOrbit,
    pageThorneFluxGeometric: pageThorneFluxGeometric,
    pageThorneFluxSI: pageThorneFluxSI,
    newtonianDiskFluxGeometric: newtonianDiskFluxGeometric,
    geometricStefanBoltzmannConstant: geometricStefanBoltzmannConstant,
    diskEffectiveTemperatureKelvin: diskEffectiveTemperatureKelvin,
    diskEffectiveTemperatureGeometric: diskEffectiveTemperatureGeometric,
    kerrGravitationalRedshiftOrbiting: kerrGravitationalRedshiftOrbiting,
    kerrOrbitalDopplerFactor: kerrOrbitalDopplerFactor,
    kerrTotalRedshiftFactor: kerrTotalRedshiftFactor,
    kerrGravitationalRedshiftStatic: kerrGravitationalRedshiftStatic,
    observedTemperatureKelvin: observedTemperatureKelvin,
    /* spectrum */
    CIE_1931_2DEG_SOURCE: CIE_1931_2DEG_SOURCE,
    NANOMETRE_TO_METRE: NANOMETRE_TO_METRE,
    WIEN_FREQUENCY_COEFFICIENT: WIEN_FREQUENCY_COEFFICIENT,
    SRGB_GAMMA_THRESHOLD: SRGB_GAMMA_THRESHOLD,
    SRGB_GAMMA_SLOPE: SRGB_GAMMA_SLOPE,
    SRGB_GAMMA_OFFSET: SRGB_GAMMA_OFFSET,
    SRGB_GAMMA_EXPONENT: SRGB_GAMMA_EXPONENT,
    XYZ_TO_LINEAR_SRGB: XYZ_TO_LINEAR_SRGB,
    FAST_FIT_STEP_NM: FAST_FIT_STEP_NM,
    planckSpectralRadiance: planckSpectralRadiance,
    planckSpectralRadiancePerFrequency: planckSpectralRadiancePerFrequency,
    wienPeakWavelengthMeters: wienPeakWavelengthMeters,
    wienPeakFrequencyHz: wienPeakFrequencyHz,
    cieXyzBarAnalytic: cieXyzBarAnalytic,
    cieXyzBarTabulated: cieXyzBarTabulated,
    cieXyzFromSpectralRadiance: cieXyzFromSpectralRadiance,
    cieXyzFromSpectralRadianceFast: cieXyzFromSpectralRadianceFast,
    xyzToChromaticity: xyzToChromaticity,
    xyzToLinearSrgb: xyzToLinearSrgb,
    linearSrgbToSrgb: linearSrgbToSrgb,
    srgbToLinearSrgb: srgbToLinearSrgb,
    linearSrgbToHex: linearSrgbToHex,
    blackbodyToSrgb: blackbodyToSrgb,
    fastBlackbodyToSrgb: fastBlackbodyToSrgb,
    fastBlackbodyToSrgbMaxError: fastBlackbodyToSrgbMaxError
  };
}();

// Curvature-engine scenario presets — mirrors GR_CURVATURE_SCENARIOS in js/physics.mjs.
var GR_CURVATURE_SCENARIOS = {
  classic: {
    label: "Classic pair",
    mass: 5,
    rays: true,
    bodies: [{
      a: 2.2,
      e: 0.45,
      phase: 0,
      peri: 0
    }, {
      a: 3.5,
      e: 0.22,
      phase: Math.PI,
      peri: 0.6
    }]
  },
  mercury: {
    label: "Mercury-like",
    mass: 6,
    rays: true,
    bodies: [{
      a: 2.4,
      e: 0.206,
      phase: 0.4,
      peri: 0
    }, {
      a: 4.6,
      e: 0.05,
      phase: 2.4,
      peri: 1.2
    }]
  },
  comet: {
    label: "High-e comet",
    mass: 5,
    rays: true,
    bodies: [{
      a: 3.2,
      e: 0.82,
      phase: 0.3,
      peri: -0.4
    }, {
      a: 5.4,
      e: 0.1,
      phase: 2.0,
      peri: 1.1
    }]
  },
  resonance: {
    label: "2:1 resonance",
    mass: 5.5,
    rays: false,
    bodies: [{
      a: 2.1,
      e: 0.12,
      phase: 0,
      peri: 0.2
    }, {
      a: 2.1 * Math.pow(2, 2 / 3),
      e: 0.12,
      phase: Math.PI,
      peri: 1.4
    }]
  },
  cluster: {
    label: "Five-body cluster",
    mass: 6.5,
    rays: true,
    bodies: [{
      a: 1.8,
      e: 0.15,
      phase: 0.0,
      peri: 0.3
    }, {
      a: 2.5,
      e: 0.35,
      phase: 1.3,
      peri: 2.1
    }, {
      a: 3.2,
      e: 0.08,
      phase: 2.6,
      peri: 4.4
    }, {
      a: 4.1,
      e: 0.5,
      phase: 3.9,
      peri: 0.9
    }, {
      a: 5.2,
      e: 0.25,
      phase: 5.2,
      peri: 3.0
    }]
  },
  plunge: {
    label: "Capture plunge",
    mass: 7,
    rays: true,
    bodies: [{
      a: 4.2,
      e: 0.3,
      phase: 1.0,
      peri: 0.5
    }, {
      free: true,
      x0: -6.2,
      y0: 1.4,
      vx0: 1.61,
      vy0: -0.12
    }]
  },
  whirl: {
    label: "Zoom-whirl",
    mass: 9.5,
    rays: true,
    spin: 0.8,
    rr: true,
    bodies: [{
      a: 2.6,
      e: 0.62,
      phase: 0.4,
      peri: 0.2,
      incl: 0.1
    }, {
      a: 5.0,
      e: 0.1,
      phase: 2.8,
      peri: 1.9,
      incl: -0.07
    }]
  }
};
var QGA_PHYSICS = _objectSpread(_objectSpread({}, QGA_SCIENCE), {}, {
  qcdB0: qcdB0,
  rgBeta: rgBeta,
  rgBetaDerivative: rgBetaDerivative,
  rgStability: rgStability,
  rgFixedPoints: rgFixedPoints,
  findRGFixedPoints: findRGFixedPoints,
  rgOneLoopRunning: rgOneLoopRunning,
  integrateRGFlow: integrateRGFlow,
  schwarzschildRadius: function schwarzschildRadius(massSolar) {
    return 2.95 * Number(massSolar);
  },
  kerrGeometry: function kerrGeometry(spin) {
    var a = Math.min(0.998, Math.max(0, Number(spin) || 0));
    var root = Math.sqrt(Math.max(0, 1 - a * a));
    var rPlus = 1 + root;
    var rMinus = 1 - root;
    var z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
    var z2 = Math.sqrt(3 * a * a + z1 * z1);
    var rIsco = 3 + z2 - Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    var rIscoRetrograde = 3 + z2 + Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    var rPhoton = 2 * (1 + Math.cos(2 / 3 * Math.acos(-a)));
    var rPhotonRetrograde = 2 * (1 + Math.cos(2 / 3 * Math.acos(a)));
    var surfaceGravity = (rPlus - 1) / (rPlus * rPlus + a * a);
    return {
      a: a,
      rPlus: rPlus,
      rMinus: rMinus,
      rErgoEquator: 2,
      rIsco: rIsco,
      rIscoRetrograde: rIscoRetrograde,
      rPhoton: rPhoton,
      rPhotonRetrograde: rPhotonRetrograde,
      z1: z1,
      z2: z2,
      surfaceGravity: surfaceGravity,
      temperatureFactor: surfaceGravity / 0.25
    };
  },
  kerrErgosphere: function kerrErgosphere(spin) {
    var theta = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Math.PI / 2;
    var a = Math.min(0.998, Math.max(0, Number(spin) || 0));
    var c = Math.cos(Number(theta) || 0);
    return 1 + Math.sqrt(Math.max(0, 1 - a * a * c * c));
  },
  hawkingTemperature: function hawkingTemperature(massSolar) {
    var spin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    return 6.17e-8 / Number(massSolar) * this.kerrGeometry(spin).temperatureFactor;
  },
  blackHoleEntropyAreaUnits: function blackHoleEntropyAreaUnits(massSolar) {
    var spin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    return 1.05e77 * Math.pow(Number(massSolar), 2) * (this.kerrGeometry(spin).rPlus / 2);
  },
  grPerihelionPrecession: function grPerihelionPrecession(gm, c2, a, e) {
    return 6 * Math.PI * Number(gm) / (Number(c2) * Number(a) * (1 - Number(e) * Number(e)));
  },
  grLightDeflection: function grLightDeflection(gm, c2, impactParameter) {
    return 4 * Number(gm) / (Number(c2) * Number(impactParameter));
  },
  planckUnits: function planckUnits() {
    var HBAR = 1.054571817e-34,
      G = 6.67430e-11,
      C = 299792458;
    var lengthMeters = Math.sqrt(HBAR * G / Math.pow(C, 3));
    var timeSeconds = Math.sqrt(HBAR * G / Math.pow(C, 5));
    var massKg = Math.sqrt(HBAR * C / G);
    var energyJoules = massKg * C * C;
    var energyGeV = energyJoules / 1.602176634e-10;
    return {
      lengthMeters: lengthMeters,
      timeSeconds: timeSeconds,
      massKg: massKg,
      energyJoules: energyJoules,
      energyGeV: energyGeV
    };
  },
  probeEnergyGeV: function probeEnergyGeV(lengthMeters) {
    return 1.973e-16 / Number(lengthMeters);
  },
  blackHoleEvaporationTimeYears: function blackHoleEvaporationTimeYears(massSolar) {
    return 2.1e67 * Math.pow(Number(massSolar), 3);
  },
  pageCurveEntropy: function pageCurveEntropy(fractionEvaporated) {
    var f = Number(fractionEvaporated);
    if (!Number.isFinite(f)) return NaN;
    var clamped = Math.min(1, Math.max(0, f));
    return 2 * Math.min(clamped, 1 - clamped);
  },
  hawkingSpectralShape: function hawkingSpectralShape(x, temperature) {
    var t = Number(temperature);
    if (!Number.isFinite(t) || t <= 0) return NaN;
    var u = Number(x) / t;
    if (!Number.isFinite(u) || u < 0) return NaN;
    return u * u * u / (Math.exp(Math.min(40, u)) - 1 + 1e-9);
  },
  seededRng: function seededRng(seed) {
    var state = Number(seed) >>> 0 || 1;
    return function () {
      state = 1664525 * state + 1013904223 >>> 0;
      return state / 4294967296;
    };
  },
  safeBeta: function safeBeta(value) {
    var fallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.2;
    var _ref25 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref25$min = _ref25.min,
      min = _ref25$min === void 0 ? -0.999 : _ref25$min,
      _ref25$max = _ref25.max,
      max = _ref25$max === void 0 ? 0.999 : _ref25$max;
    var beta = Number(value);
    if (!Number.isFinite(beta) || Math.abs(beta) >= 1) {
      return Number.isFinite(fallback) ? Math.min(max, Math.max(min, Number(fallback))) : 0;
    }
    return Math.min(max, Math.max(min, beta));
  },
  clamp: function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  },
  sanitizeCausalState: function sanitizeCausalState() {
    var _input$a, _input$a2, _input$b, _input$b2;
    var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var defaults = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var fallback = _objectSpread({
      beta: 0.35,
      a: {
        ct: 0,
        x: -1.35
      },
      b: {
        ct: 2.6,
        x: 1.1
      }
    }, defaults);
    fallback.a = _objectSpread({
      ct: 0,
      x: -1.35
    }, defaults.a || {});
    fallback.b = _objectSpread({
      ct: 2.6,
      x: 1.1
    }, defaults.b || {});
    var inRange = function inRange(value, backup, min, max) {
      var numeric = Number(value);
      return Number.isFinite(numeric) && numeric >= min && numeric <= max ? numeric : backup;
    };
    return {
      beta: inRange(input.beta, fallback.beta, -0.95, 0.95),
      a: {
        ct: inRange((_input$a = input.a) === null || _input$a === void 0 ? void 0 : _input$a.ct, fallback.a.ct, -4, 4),
        x: inRange((_input$a2 = input.a) === null || _input$a2 === void 0 ? void 0 : _input$a2.x, fallback.a.x, -4, 4)
      },
      b: {
        ct: inRange((_input$b = input.b) === null || _input$b === void 0 ? void 0 : _input$b.ct, fallback.b.ct, -4, 4),
        x: inRange((_input$b2 = input.b) === null || _input$b2 === void 0 ? void 0 : _input$b2.x, fallback.b.x, -4, 4)
      }
    };
  },
  lorentzGamma: function lorentzGamma(beta) {
    var b = this.safeBeta(beta, 0);
    return 1 / Math.sqrt(Math.max(1e-12, 1 - b * b));
  },
  invariantInterval: function invariantInterval(deltaCt, deltaX) {
    var _ref26 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref26$c = _ref26.c,
      c = _ref26$c === void 0 ? 1 : _ref26$c;
    var dct = Number(deltaCt);
    var dx = Number(deltaX);
    if (!Number.isFinite(dct) || !Number.isFinite(dx) || !(Number(c) > 0)) return NaN;
    return -(dct * dct) + dx * dx;
  },
  classifySeparation: function classifySeparation(deltaCt, deltaX) {
    var _ref27 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref27$c = _ref27.c,
      c = _ref27$c === void 0 ? 1 : _ref27$c;
    var ds2 = this.invariantInterval(deltaCt, deltaX, {
      c: c
    });
    if (!Number.isFinite(ds2)) return {
      type: "invalid",
      ds2: NaN,
      deltaCt: Number(deltaCt),
      deltaX: Number(deltaX)
    };
    if (ds2 < 0) return {
      type: "timelike",
      ds2: ds2,
      deltaCt: Number(deltaCt),
      deltaX: Number(deltaX)
    };
    if (Math.abs(ds2) < 1e-12) return {
      type: "null",
      ds2: 0,
      deltaCt: Number(deltaCt),
      deltaX: Number(deltaX)
    };
    return {
      type: "spacelike",
      ds2: ds2,
      deltaCt: Number(deltaCt),
      deltaX: Number(deltaX)
    };
  },
  properTime: function properTime(deltaCt, deltaX) {
    var _ref28 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref28$c = _ref28.c,
      c = _ref28$c === void 0 ? 1 : _ref28$c;
    var ds2 = this.invariantInterval(deltaCt, deltaX, {
      c: c
    });
    var cs = Number(c);
    if (!Number.isFinite(ds2) || ds2 >= 0 || !(cs > 0)) return NaN;
    return Math.sqrt(-ds2) / cs;
  },
  lorentzTransform: function lorentzTransform() {
    var _ref29 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      deltaCt = _ref29.deltaCt,
      deltaX = _ref29.deltaX,
      beta = _ref29.beta,
      _ref29$c = _ref29.c,
      c = _ref29$c === void 0 ? 1 : _ref29$c;
    var b = this.safeBeta(beta, 0);
    var dct = Number(deltaCt);
    var dx = Number(deltaX);
    if (!Number.isFinite(dct) || !Number.isFinite(dx) || !(Number(c) > 0)) {
      return {
        deltaCtPrime: NaN,
        deltaXPrime: NaN,
        gamma: this.lorentzGamma(b),
        beta: b
      };
    }
    var gamma = this.lorentzGamma(b);
    var ctPrime = gamma * (dct - b * dx);
    var xPrime = gamma * (dx - b * dct);
    return {
      deltaCtPrime: ctPrime,
      deltaXPrime: xPrime,
      gamma: gamma,
      beta: b
    };
  },
  simultaneityFrameBeta: function simultaneityFrameBeta(deltaCt, deltaX) {
    var dt = Number(deltaCt);
    var dx = Number(deltaX);
    if (!Number.isFinite(dt) || !Number.isFinite(dx) || Math.abs(dx) < 1e-12) return NaN;
    var beta = dt / dx;
    return Math.abs(beta) < 1 ? beta : NaN;
  },
  transformPair: function transformPair() {
    var _ref30 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      a = _ref30.a,
      b = _ref30.b,
      beta = _ref30.beta,
      _ref30$c = _ref30.c,
      c = _ref30$c === void 0 ? 1 : _ref30$c;
    var left = {
      deltaCt: Number(b.ct) - Number(a.ct),
      deltaX: Number(b.x) - Number(a.x)
    };
    var transformed = this.lorentzTransform(_objectSpread(_objectSpread({}, left), {}, {
      beta: beta,
      c: c
    }));
    var interval = this.classifySeparation(left.deltaCt, left.deltaX, {
      c: c
    });
    return {
      a: a,
      b: b,
      left: left,
      transformed: transformed,
      interval: interval,
      gamma: transformed.gamma
    };
  },
  piecewiseProperTime: function piecewiseProperTime(points) {
    var _ref31 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref31$c = _ref31.c,
      c = _ref31$c === void 0 ? 1 : _ref31$c;
    if (!Array.isArray(points) || points.length < 2) return NaN;
    var total = 0;
    for (var index = 1; index < points.length; index++) {
      var previous = points[index - 1];
      var current = points[index];
      var segment = this.properTime(Number(current === null || current === void 0 ? void 0 : current.ct) - Number(previous === null || previous === void 0 ? void 0 : previous.ct), Number(current === null || current === void 0 ? void 0 : current.x) - Number(previous === null || previous === void 0 ? void 0 : previous.x), {
        c: c
      });
      if (!Number.isFinite(segment)) return NaN;
      total += segment;
    }
    return total;
  },
  /* Leading-order binary-inspiral teaching model — mirrors js/physics.mjs exactly. */chirpMass: function chirpMass(m1Solar, m2Solar) {
    var m1 = Number(m1Solar),
      m2 = Number(m2Solar);
    return Math.pow(m1 * m2, 3 / 5) / Math.pow(m1 + m2, 1 / 5);
  },
  timeToCoalescence: function timeToCoalescence(freqHz, chirpMassSolar) {
    var f = Number(freqHz),
      mc = Number(chirpMassSolar) * 4.92563989396e-6;
    return 5 / 256 * Math.pow(Math.PI * f, -8 / 3) * Math.pow(mc, -5 / 3);
  },
  inspiralFrequency: function inspiralFrequency(tauSeconds, chirpMassSolar) {
    var tau = Math.max(1e-6, Number(tauSeconds));
    var mc = Number(chirpMassSolar) * 4.92563989396e-6;
    return 1 / Math.PI * Math.pow(5 / (256 * tau), 3 / 8) * Math.pow(mc, -5 / 8);
  },
  generatedChirp: function generatedChirp() {
    var _ref32 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref32$seed = _ref32.seed,
      seed = _ref32$seed === void 0 ? 42 : _ref32$seed,
      _ref32$sampleRate = _ref32.sampleRate,
      sampleRate = _ref32$sampleRate === void 0 ? 512 : _ref32$sampleRate,
      _ref32$duration = _ref32.duration,
      duration = _ref32$duration === void 0 ? 4 : _ref32$duration,
      _ref32$m = _ref32.m1,
      m1 = _ref32$m === void 0 ? 36 : _ref32$m,
      _ref32$m2 = _ref32.m2,
      m2 = _ref32$m2 === void 0 ? 29 : _ref32$m2,
      _ref32$mergerAt = _ref32.mergerAt,
      mergerAt = _ref32$mergerAt === void 0 ? 3.4 : _ref32$mergerAt,
      _ref32$noiseRms = _ref32.noiseRms,
      noiseRms = _ref32$noiseRms === void 0 ? 0.35 : _ref32$noiseRms,
      _ref32$delaySeconds = _ref32.delaySeconds,
      delaySeconds = _ref32$delaySeconds === void 0 ? 0 : _ref32$delaySeconds,
      _ref32$ringdownFreq = _ref32.ringdownFreq,
      ringdownFreq = _ref32$ringdownFreq === void 0 ? 190 : _ref32$ringdownFreq,
      _ref32$ringdownTau = _ref32.ringdownTau,
      ringdownTau = _ref32$ringdownTau === void 0 ? 0.06 : _ref32$ringdownTau;
    var n = Math.max(8, Math.round(sampleRate * duration));
    var mc = this.chirpMass(m1, m2);
    var rng = this.seededRng(seed);
    var gauss = function gauss() {
      var u = Math.max(1e-12, rng()),
        v = rng();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    var delay = Math.round(delaySeconds * sampleRate);
    var samples = new Float64Array(n);
    var freqTrack = new Float32Array(n);
    var phase = 0,
      prevTau = Math.max(0.02, mergerAt);
    var mergerIndex = Math.min(n - 1, Math.round(mergerAt * sampleRate) + delay);
    for (var i = 0; i < n; i++) {
      var t = i / sampleRate - delaySeconds;
      var h = 0;
      if (t >= 0 && t < mergerAt) {
        var tau = mergerAt - t;
        var f = this.inspiralFrequency(tau, mc);
        phase += 2 * Math.PI * f * (prevTau - tau);
        prevTau = tau;
        h = Math.min(1, Math.pow(f / 220, 2 / 3)) * Math.cos(phase);
        freqTrack[i] = f;
      } else if (t >= mergerAt) {
        var tr = t - mergerAt;
        h = Math.exp(-tr / ringdownTau) * Math.cos(phase + 2 * Math.PI * ringdownFreq * tr);
        freqTrack[i] = ringdownFreq;
      }
      samples[i] = h + noiseRms * gauss();
    }
    return {
      samples: samples,
      freqTrack: freqTrack,
      sampleRate: sampleRate,
      duration: duration,
      mergerIndex: mergerIndex,
      chirpMass: mc,
      model: "leading-order-quadrupole+ringdown"
    };
  },
  stftSpectrogram: function stftSpectrogram(samples) {
    var _ref33 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref33$sampleRate = _ref33.sampleRate,
      sampleRate = _ref33$sampleRate === void 0 ? 512 : _ref33$sampleRate,
      _ref33$windowSize = _ref33.windowSize,
      windowSize = _ref33$windowSize === void 0 ? 128 : _ref33$windowSize,
      _ref33$hopSize = _ref33.hopSize,
      hopSize = _ref33$hopSize === void 0 ? 24 : _ref33$hopSize;
    var n = samples.length;
    var bins = windowSize / 2;
    var frames = Math.max(1, Math.floor((n - windowSize) / hopSize) + 1);
    var hann = new Float64Array(windowSize);
    for (var k = 0; k < windowSize; k++) hann[k] = 0.5 * (1 - Math.cos(2 * Math.PI * k / (windowSize - 1)));
    var magnitudes = new Float32Array(frames * bins);
    var maxDb = -Infinity;
    for (var f = 0; f < frames; f++) {
      var base = f * hopSize;
      for (var b = 0; b < bins; b++) {
        var re = 0,
          im = 0;
        var w = 2 * Math.PI * b / windowSize;
        for (var _k = 0; _k < windowSize; _k++) {
          var v = samples[base + _k] * hann[_k];
          re += v * Math.cos(w * _k);
          im -= v * Math.sin(w * _k);
        }
        var db = 20 * Math.log10(Math.hypot(re, im) / windowSize + 1e-12);
        magnitudes[f * bins + b] = db;
        if (db > maxDb) maxDb = db;
      }
    }
    var times = Array.from({
      length: frames
    }, function (_, f) {
      return (f * hopSize + windowSize / 2) / sampleRate;
    });
    var freqs = Array.from({
      length: bins
    }, function (_, b) {
      return b * sampleRate / windowSize;
    });
    return {
      magnitudes: magnitudes,
      frames: frames,
      bins: bins,
      times: times,
      freqs: freqs,
      maxDb: maxDb,
      nyquist: sampleRate / 2
    };
  },
  /* ---------- QFT 2→2 kinematics (mirrors js/physics.mjs) ---------- */
  QFT_CONSTANTS: {
    ALPHA_EM: 1 / 137.035999084,
    GEV2_TO_NB: 0.3893793721e6,
    M_ELECTRON: 0.51099895e-3,
    M_Z: 91.1876,
    GAMMA_Z: 2.4952
  },
  mandelstamKinematics: function mandelstamKinematics(_ref34) {
    var sqrtS = _ref34.sqrtS,
      _ref34$cosTheta = _ref34.cosTheta,
      cosTheta = _ref34$cosTheta === void 0 ? 0 : _ref34$cosTheta,
      _ref34$masses = _ref34.masses,
      masses = _ref34$masses === void 0 ? [0, 0, 0, 0] : _ref34$masses;
    var _masses = _slicedToArray(masses, 4),
      m1 = _masses[0],
      m2 = _masses[1],
      m3 = _masses[2],
      m4 = _masses[3];
    var s = sqrtS * sqrtS;
    var E1 = (s + m1 * m1 - m2 * m2) / (2 * sqrtS);
    var E3 = (s + m3 * m3 - m4 * m4) / (2 * sqrtS);
    var E4 = (s + m4 * m4 - m3 * m3) / (2 * sqrtS);
    var p1 = Math.sqrt(Math.max(0, E1 * E1 - m1 * m1));
    var p3 = Math.sqrt(Math.max(0, E3 * E3 - m3 * m3));
    var t = m1 * m1 + m3 * m3 - 2 * E1 * E3 + 2 * p1 * p3 * cosTheta;
    var u = m1 * m1 + m4 * m4 - 2 * E1 * E4 - 2 * p1 * p3 * cosTheta;
    var sum = m1 * m1 + m2 * m2 + m3 * m3 + m4 * m4;
    return {
      s: s,
      t: t,
      u: u,
      sum: sum,
      residual: s + t + u - sum,
      sqrtS: sqrtS,
      cosTheta: cosTheta,
      E1: E1,
      E3: E3,
      E4: E4,
      p1: p1,
      p3: p3
    };
  },
  kleinNishina: function kleinNishina(_ref35) {
    var _ref35$cosTheta = _ref35.cosTheta,
      cosTheta = _ref35$cosTheta === void 0 ? 0 : _ref35$cosTheta,
      _ref35$x = _ref35.x,
      x = _ref35$x === void 0 ? 0.1 : _ref35$x;
    var ratio = 1 / (1 + x * (1 - cosTheta));
    var sin2 = 1 - cosTheta * cosTheta;
    return ratio * ratio * (ratio + 1 / ratio - sin2);
  },
  angularDistribution: function angularDistribution(_ref36) {
    var _ref36$process = _ref36.process,
      process = _ref36$process === void 0 ? "s-channel" : _ref36$process,
      _ref36$cosTheta = _ref36.cosTheta,
      cosTheta = _ref36$cosTheta === void 0 ? 0 : _ref36$cosTheta,
      _ref36$photonX = _ref36.photonX,
      photonX = _ref36$photonX === void 0 ? 0.1 : _ref36$photonX;
    var c = Math.max(-1, Math.min(1, cosTheta));
    if (process === "s-channel") return 1 + c * c;
    if (process === "t-channel") {
      var half = Math.sin(Math.acos(c) / 2);
      var s2 = half * half;
      return 1 / Math.max(1e-8, s2 * s2);
    }
    if (process === "compton") return this.kleinNishina({
      cosTheta: c,
      x: photonX
    });
    return 0;
  },
  breitWignerResonance: function breitWignerResonance(_ref37) {
    var _ref37$sqrtS = _ref37.sqrtS,
      sqrtS = _ref37$sqrtS === void 0 ? 91.1876 : _ref37$sqrtS,
      _ref37$mass = _ref37.mass,
      mass = _ref37$mass === void 0 ? 91.1876 : _ref37$mass,
      _ref37$width = _ref37.width,
      width = _ref37$width === void 0 ? 2.4952 : _ref37$width;
    var s = sqrtS * sqrtS;
    var m2 = mass * mass;
    var denom = (s - m2) * (s - m2) + m2 * width * width;
    return m2 * width * width / denom;
  },
  qftTotalCrossSection: function qftTotalCrossSection(_ref38) {
    var _ref38$sqrtS = _ref38.sqrtS,
      sqrtS = _ref38$sqrtS === void 0 ? 10 : _ref38$sqrtS;
    var s = sqrtS * sqrtS;
    var a = 1 / 137.035999084;
    return 4 * Math.PI * a * a / (3 * s) * 0.3893793721e6;
  },
  /* Curvature-engine scenario core — mirrors js/physics.mjs. */
  GR_ENGINE_C2: 27.04,
  grEngineGM: function grEngineGM(mass) {
    return 0.55 * Number(mass);
  },
  grCaptureRadius: function grCaptureRadius(gm, c2) {
    return Math.max(0.45, 3 * Number(gm) / Number(c2));
  },
  grPlungeStep: function grPlungeStep(p, gm, c2, dt) {
    var r2 = p.x * p.x + p.y * p.y;
    if (r2 < 1e-12) return p;
    var r = Math.sqrt(r2);
    var L = p.x * p.vy - p.y * p.vx;
    var ar = -gm / r2 - 3 * gm * L * L / (c2 * r2 * r2);
    p.vx += ar * p.x / r * dt;
    p.vy += ar * p.y / r * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    return p;
  },
  GR_CURVATURE_SCENARIOS: GR_CURVATURE_SCENARIOS,
  grCurvatureScenario: function grCurvatureScenario(id) {
    return GR_CURVATURE_SCENARIOS[id] || GR_CURVATURE_SCENARIOS.classic;
  },
  grPhotonSphereRadius: function grPhotonSphereRadius(gm, c2) {
    return 3 * gm / c2;
  },
  grIscoRadius: function grIscoRadius(gm, c2) {
    return 6 * gm / c2;
  },
  grCriticalImpactParameter: function grCriticalImpactParameter(gm, c2) {
    return 3 * Math.sqrt(3) * gm / c2;
  },
  grNullStep: function grNullStep(p, rs, dt) {
    var r2 = p.x * p.x + p.y * p.y;
    if (r2 < 1e-12) return p;
    var L = p.x * p.vy - p.y * p.vx;
    var r5 = r2 * r2 * Math.sqrt(r2);
    var k = -1.5 * rs * L * L / r5;
    p.vx += k * p.x * dt;
    p.vy += k * p.y * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    return p;
  },
  grNullDeflection: function grNullDeflection(b, gm, c2) {
    var _opts$v, _opts$x, _opts$dt, _opts$maxSteps;
    var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var rs = 2 * gm / c2;
    var v0 = (_opts$v = opts.v0) !== null && _opts$v !== void 0 ? _opts$v : 4;
    var x0 = (_opts$x = opts.x0) !== null && _opts$x !== void 0 ? _opts$x : 7.6;
    var dt = (_opts$dt = opts.dt) !== null && _opts$dt !== void 0 ? _opts$dt : 0.002;
    var maxSteps = (_opts$maxSteps = opts.maxSteps) !== null && _opts$maxSteps !== void 0 ? _opts$maxSteps : 200000;
    var rCap = 1.5 * rs;
    var q = {
      x: -x0,
      y: b,
      vx: v0,
      vy: 0
    };
    var prevA = Math.atan2(q.vy, q.vx);
    var sweptA = 0;
    var steps = 0;
    while (steps < maxSteps) {
      QGA_PHYSICS.grNullStep(q, rs, dt);
      steps++;
      var r = Math.hypot(q.x, q.y);
      if (r < rCap) return {
        captured: true,
        deflection: 0,
        steps: steps
      };
      var a = Math.atan2(q.vy, q.vx);
      var da = a - prevA;
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      sweptA += da;
      prevA = a;
      if (q.x > x0 || r > 2 * x0) break;
    }
    return {
      captured: false,
      deflection: Math.abs(sweptA),
      steps: steps
    };
  },
  grNullTrajectory: function grNullTrajectory(b, gm, c2) {
    var _opts$v2, _opts$x2, _opts$dt2, _opts$maxSteps2, _opts$rCap;
    var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var rs = 2 * gm / c2;
    var v0 = (_opts$v2 = opts.v0) !== null && _opts$v2 !== void 0 ? _opts$v2 : 4;
    var x0 = (_opts$x2 = opts.x0) !== null && _opts$x2 !== void 0 ? _opts$x2 : 7.6;
    var dt = (_opts$dt2 = opts.dt) !== null && _opts$dt2 !== void 0 ? _opts$dt2 : 0.002;
    var maxSteps = (_opts$maxSteps2 = opts.maxSteps) !== null && _opts$maxSteps2 !== void 0 ? _opts$maxSteps2 : 200000;
    // Default stop is the photon sphere: that is where capture is decided. A
    // caller that wants the plunge drawn all the way in can lower it toward the
    // horizon, at the cost of a stiffer integration near r = rs.
    var rCap = (_opts$rCap = opts.rCap) !== null && _opts$rCap !== void 0 ? _opts$rCap : 1.5 * rs;
    var q = {
      x: -x0,
      y: b,
      vx: v0,
      vy: 0
    };
    var points = [[q.x, q.y]];
    var swept = 0;
    var prev = Math.atan2(q.y, q.x);
    var steps = 0;
    var captured = false;
    while (steps < maxSteps) {
      QGA_PHYSICS.grNullStep(q, rs, dt);
      steps++;
      var r = Math.hypot(q.x, q.y);
      points.push([q.x, q.y]);
      var ang = Math.atan2(q.y, q.x);
      var d = ang - prev;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      swept += d;
      prev = ang;
      if (r < rCap) {
        captured = true;
        break;
      }
      if (q.x > x0 || r > 2 * x0) break;
    }
    return {
      captured: captured,
      points: points,
      steps: steps,
      windings: Math.abs(swept) / (2 * Math.PI)
    };
  },
  grEffectivePotential: function grEffectivePotential(gm, c2, L, r) {
    var r2 = r * r;
    return -gm / r + L * L / (2 * r2) - gm * L * L / (c2 * r2 * r);
  },
  grPetersDerivatives: function grPetersDerivatives(a, e, k) {
    var e2 = e * e;
    var om = 1 - e2;
    var da = -k * (1 + 7 / 8 * e2) / (a * a * a * Math.pow(om, 3.5));
    var de = -k * (19 / 12) * e * (1 + 121 / 304 * e2) / (a * a * a * a * Math.pow(om, 2.5));
    return {
      da: da,
      de: de
    };
  },
  grLenseThirringDeg: function grLenseThirringDeg(J, c2, a, e) {
    var om = 1 - e * e;
    return 4 * Math.PI * J / (c2 * Math.pow(a, 3) * Math.pow(om, 1.5)) * (180 / Math.PI);
  }
});
window.QGA_PHYSICS = QGA_PHYSICS;
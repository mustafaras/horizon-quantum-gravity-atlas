/* Compiled from js/labs/derivation-stepper.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// derivation-stepper.jsx — the DOM half of js/formula/stepper.mjs.
//
// The state machine (index, clamping, reduced motion, keyboard mapping) is pure and lives in the ESM module, so it can be
// tested in Node without React. This file only draws it: the equation for the current step, the justification line, the
// heuristic label when the step has one, and ← / → buttons that are real buttons.
//
// Reduced motion is honoured from the controller's `transitionMs`, which is 0 when the media query matches. No transition
// is declared in CSS for the equation: the only motion is the step marker, so nothing animates that a reader has to wait
// for.

var _React = React,
  useState = _React.useState,
  useEffect = _React.useEffect,
  useMemo = _React.useMemo,
  useRef = _React.useRef,
  useCallback = _React.useCallback;

/**
 * The step index, carried across a rebuild of the controller.
 *
 * `reduced` comes from a media query that can change while the page is open, so the controller is rebuilt when it does.
 * The index lives here rather than in the controller so the rebuild does not lose the reader's place; `goTo` clamps it into
 * the new range, which is why a shorter derivation after a rebuild cannot leave the index dangling.
 */
function useDerivationStepper(steps) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
    _ref$start = _ref.start,
    start = _ref$start === void 0 ? 0 : _ref$start,
    _ref$reduced = _ref.reduced,
    reduced = _ref$reduced === void 0 ? false : _ref$reduced;
  var stepper = useMemo(function () {
    return window.QGA_FORMULA.stepper.createStepper({
      steps: steps,
      at: start,
      reduced: reduced
    });
  }, [steps, start, reduced]);
  var _useState = useState(function () {
      return stepper.index();
    }),
    _useState2 = _slicedToArray(_useState, 2),
    index = _useState2[0],
    setIndex = _useState2[1];
  useEffect(function () {
    setIndex(function (current) {
      return stepper.goTo(current);
    });
  }, [stepper]);
  return {
    stepper: stepper,
    index: index,
    setIndex: setIndex
  };
}
function DerivationStepper(_ref2) {
  var _window$QGA_FORMULA$d, _window$QGA_FORMULA, _window$QGA_FORMULA$d2, _derivation$steps$len, _view$tex;
  var derivationId = _ref2.derivationId,
    _ref2$start = _ref2.start,
    start = _ref2$start === void 0 ? 0 : _ref2$start,
    _ref2$compact = _ref2.compact,
    compact = _ref2$compact === void 0 ? false : _ref2$compact,
    _ref2$onStep = _ref2.onStep,
    onStep = _ref2$onStep === void 0 ? function () {} : _ref2$onStep;
  var derivation = (_window$QGA_FORMULA$d = (_window$QGA_FORMULA = window.QGA_FORMULA) === null || _window$QGA_FORMULA === void 0 || (_window$QGA_FORMULA$d2 = _window$QGA_FORMULA.derivation) === null || _window$QGA_FORMULA$d2 === void 0 ? void 0 : _window$QGA_FORMULA$d2.call(_window$QGA_FORMULA, derivationId)) !== null && _window$QGA_FORMULA$d !== void 0 ? _window$QGA_FORMULA$d : null;
  var reduced = usePRM();
  // Hooks run for every render, so the stepper needs a step count even when the id does not resolve. One step is the
  // smallest valid derivation, and the missing-derivation branch below never draws it.
  var _useDerivationStepper = useDerivationStepper(Math.max(1, (_derivation$steps$len = derivation === null || derivation === void 0 ? void 0 : derivation.steps.length) !== null && _derivation$steps$len !== void 0 ? _derivation$steps$len : 1), {
      start: start,
      reduced: reduced
    }),
    stepper = _useDerivationStepper.stepper,
    index = _useDerivationStepper.index,
    setIndex = _useDerivationStepper.setIndex;
  var rootRef = useRef(null);

  // The step is announced, not just repainted: a reader who cannot see the highlight learns the position from a live
  // region, and the heuristic label is part of that announcement rather than a caption someone might miss.
  var view = derivation ? window.QGA_FORMULA.stepper.stepView(derivation, index) : null;
  useEffect(function () {
    if (view) onStep(view);
  }, [view === null || view === void 0 ? void 0 : view.id]);
  var move = useCallback(function (act) {
    var next = act();
    setIndex(next);
  }, [stepper, setIndex]);
  var onKeyDown = useCallback(function (event) {
    var result = stepper.key(event.key);
    if (!result.handled) return;
    event.preventDefault();
    setIndex(result.index);
  }, [stepper, setIndex]);
  if (!derivation) {
    return /*#__PURE__*/React.createElement("div", {
      className: "derivation-stepper derivation-missing",
      role: "note"
    }, "No derivation is registered under ", /*#__PURE__*/React.createElement("code", null, derivationId), ".");
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "derivation-stepper" + (compact ? " is-compact" : ""),
    ref: rootRef,
    role: "group",
    "aria-roledescription": "derivation",
    "aria-label": derivation.title,
    onKeyDown: onKeyDown,
    tabIndex: 0,
    "data-qga-derivation": derivation.id
  }, /*#__PURE__*/React.createElement("div", {
    className: "ds-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-title"
  }, derivation.title), /*#__PURE__*/React.createElement("span", {
    className: "ds-position",
    "aria-hidden": "true"
  }, view === null || view === void 0 ? void 0 : view.position, " / ", view === null || view === void 0 ? void 0 : view.total)), /*#__PURE__*/React.createElement("div", {
    className: "ds-eq",
    role: "img",
    "aria-label": view === null || view === void 0 ? void 0 : view.label
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: (_view$tex = view === null || view === void 0 ? void 0 : view.tex) !== null && _view$tex !== void 0 ? _view$tex : "",
    display: true
  })), view !== null && view !== void 0 && view.heuristic ? /*#__PURE__*/React.createElement("p", {
    className: "ds-heuristic"
  }, /*#__PURE__*/React.createElement(Badge, {
    kind: "heuristic"
  }), " ", view.heuristic) : null, /*#__PURE__*/React.createElement("p", {
    className: "ds-justification"
  }, view === null || view === void 0 ? void 0 : view.justification), /*#__PURE__*/React.createElement("div", {
    className: "ds-controls"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ds-step",
    onClick: function onClick() {
      return move(function () {
        return stepper.previous();
      });
    },
    disabled: stepper.state().atStart,
    "aria-label": "Previous step"
  }, "\u2190"), /*#__PURE__*/React.createElement("div", {
    className: "ds-track",
    role: "presentation"
  }, derivation.steps.map(function (step, i) {
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: step.id,
      className: "ds-dot" + (i === index ? " is-current" : ""),
      "aria-label": "Step ".concat(i + 1, ": ").concat(step.justification.slice(0, 60)),
      "aria-current": i === index ? "step" : undefined,
      onClick: function onClick() {
        return move(function () {
          return stepper.goTo(i);
        });
      }
    });
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ds-step",
    onClick: function onClick() {
      return move(function () {
        return stepper.next();
      });
    },
    disabled: stepper.state().atEnd,
    "aria-label": "Next step"
  }, "\u2192")), /*#__PURE__*/React.createElement("p", {
    className: "ds-live",
    role: "status",
    "aria-live": "polite"
  }, "Step ", view === null || view === void 0 ? void 0 : view.position, " of ", view === null || view === void 0 ? void 0 : view.total, ". ", view === null || view === void 0 ? void 0 : view.justification));
}
Object.assign(window, {
  DerivationStepper: DerivationStepper
});
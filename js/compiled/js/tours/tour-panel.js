/* Compiled from js/tours/tour-panel.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// tour-panel.jsx — S31 guided tours and the teacher worksheet.
//
// The panel is a step reader, not a slide deck: it shows the step's text, its question, the expected readout a teacher
// can grade against, the formula card the step opens, and two real buttons. Every decision about *where* a step points
// lives in js/tours/tour-runner.mjs, so this file only draws.
//
// Print mode (`?tour=…&print=1`) swaps the reader for a worksheet: the same steps as numbered questions with their
// expected answers, their plain URLs and the tour's references. No QR code — a printed URL survives a photocopier, a
// QR square does not.

var _React = React,
  useState = _React.useState,
  useEffect = _React.useEffect,
  useMemo = _React.useMemo,
  useRef = _React.useRef,
  useCallback = _React.useCallback;
function tourStore() {
  var _window$QGA_TOURS$cre, _window$QGA_TOURS;
  return (_window$QGA_TOURS$cre = (_window$QGA_TOURS = window.QGA_TOURS) === null || _window$QGA_TOURS === void 0 ? void 0 : _window$QGA_TOURS.createTourResumeStore({
    storage: function () {
      try {
        return window.localStorage;
      } catch (e) {
        return null;
      }
    }()
  })) !== null && _window$QGA_TOURS$cre !== void 0 ? _window$QGA_TOURS$cre : null;
}

/** The launcher: pick a tour, or continue the one this browser stopped in. */
function TourLauncher(_ref) {
  var _window$QGA_TOURS$TOU, _window$QGA_TOURS2;
  var onStart = _ref.onStart,
    onClose = _ref.onClose;
  var tours = (_window$QGA_TOURS$TOU = (_window$QGA_TOURS2 = window.QGA_TOURS) === null || _window$QGA_TOURS2 === void 0 ? void 0 : _window$QGA_TOURS2.TOUR_LIBRARY) !== null && _window$QGA_TOURS$TOU !== void 0 ? _window$QGA_TOURS$TOU : [];
  var store = useMemo(tourStore, []);
  var remembered = useMemo(function () {
    return store ? store.ids() : [];
  }, [store]);
  return /*#__PURE__*/React.createElement("div", {
    className: "tour-launcher"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "tour-list"
  }, tours.map(function (tour) {
    var step = store ? store.read(tour.id) : null;
    return /*#__PURE__*/React.createElement("li", {
      key: tour.id,
      className: "tour-list-item"
    }, /*#__PURE__*/React.createElement("button", {
      className: "tour-start",
      onClick: function onClick() {
        return onStart(tour.id, step !== null && step !== void 0 ? step : 1);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "tour-list-title"
    }, tour.title), /*#__PURE__*/React.createElement("span", {
      className: "tour-list-meta"
    }, tour.steps.length, " steps", step ? " \xB7 continue at step ".concat(step) : remembered.includes(tour.id) ? " · resume" : "")), /*#__PURE__*/React.createElement("p", {
      className: "tour-list-summary"
    }, tour.summary));
  })), tours.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "dim small"
  }, "No tours are registered in this build.") : null, /*#__PURE__*/React.createElement("div", {
    className: "tour-launcher-foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onClose
  }, "Close")));
}

/** The reader for one step. */
function TourReader(_ref2) {
  var _window$QGA_TOURS$ste, _window$QGA_TOURS3, _window$QGA_TOURS$des, _window$QGA_TOURS4;
  var tour = _ref2.tour,
    step = _ref2.step,
    onStep = _ref2.onStep,
    onExit = _ref2.onExit,
    onPrint = _ref2.onPrint;
  var plan = (_window$QGA_TOURS$ste = (_window$QGA_TOURS3 = window.QGA_TOURS) === null || _window$QGA_TOURS3 === void 0 ? void 0 : _window$QGA_TOURS3.stepPlan(tour, step)) !== null && _window$QGA_TOURS$ste !== void 0 ? _window$QGA_TOURS$ste : null;
  var store = useMemo(tourStore, []);
  var focusRef = useRef(null);

  // Remember where the reader stopped. A browser with storage disabled still walks the tour; it just forgets.
  useEffect(function () {
    if (plan) store === null || store === void 0 || store.write(tour.id, plan.index);
  }, [plan && plan.index, store, tour.id]);
  // The step is announced rather than silently repainted: moving on is a navigation, and a screen reader should hear
  // it. Focus lands on the panel itself, not on a heading — a visible focus ring around a title in a step reader reads
  // as "the title is a control", which it is not.
  useEffect(function () {
    var _focusRef$current;
    if (!plan) return;
    (_focusRef$current = focusRef.current) === null || _focusRef$current === void 0 || _focusRef$current.focus({
      preventScroll: true
    });
  }, [plan && plan.index]);
  if (!plan) return null;
  var patchNote = (_window$QGA_TOURS$des = (_window$QGA_TOURS4 = window.QGA_TOURS) === null || _window$QGA_TOURS4 === void 0 ? void 0 : _window$QGA_TOURS4.describePatch(plan.patch)) !== null && _window$QGA_TOURS$des !== void 0 ? _window$QGA_TOURS$des : "";
  return /*#__PURE__*/React.createElement("div", {
    className: "tour-reader",
    role: "region",
    "aria-label": "Guided tour: ".concat(tour.title)
  }, /*#__PURE__*/React.createElement("div", {
    className: "tour-reader-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "tour-kicker"
  }, "Guided tour"), /*#__PURE__*/React.createElement("h2", {
    className: "tour-reader-title"
  }, tour.title)), /*#__PURE__*/React.createElement("span", {
    className: "tour-focus-sink",
    "aria-hidden": "true",
    ref: focusRef,
    tabIndex: -1
  }), /*#__PURE__*/React.createElement("span", {
    className: "tour-counter mono"
  }, window.QGA_TOURS.formatStepCounter(plan.index, plan.total))), /*#__PURE__*/React.createElement("div", {
    className: "tour-progress",
    role: "progressbar",
    "aria-valuemin": 1,
    "aria-valuemax": plan.total,
    "aria-valuenow": plan.index,
    "aria-label": "Tour progress"
  }, tour.steps.map(function (_, i) {
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "tour-tick" + (i + 1 === plan.index ? " is-current" : i + 1 < plan.index ? " is-done" : ""),
      "aria-label": "Go to step ".concat(i + 1),
      "aria-current": i + 1 === plan.index ? "step" : undefined,
      onClick: function onClick() {
        return onStep(i + 1);
      }
    });
  })), /*#__PURE__*/React.createElement("p", {
    className: "tour-text"
  }, /*#__PURE__*/React.createElement(RichText, {
    text: plan.text
  })), /*#__PURE__*/React.createElement("div", {
    className: "tour-question"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tour-label"
  }, "Question"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(RichText, {
    text: plan.question
  })), plan.expected ? /*#__PURE__*/React.createElement("details", {
    className: "tour-expected"
  }, /*#__PURE__*/React.createElement("summary", null, "Expected readout"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(RichText, {
    text: plan.expected
  }))) : null), /*#__PURE__*/React.createElement("div", {
    className: "tour-target"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tour-label"
  }, "Shows"), /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "view: ", plan.view), plan.shot ? /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "shot: ", plan.shot) : null, plan.formulaFocus ? /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "formula: ", plan.formulaFocus) : null, patchNote ? /*#__PURE__*/React.createElement("span", {
    className: "mono tour-patch"
  }, patchNote) : null), /*#__PURE__*/React.createElement("div", {
    className: "tour-controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      return onStep(plan.index - 1);
    },
    disabled: plan.atStart,
    "aria-label": "Previous step"
  }, "\u2190 Previous"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: function onClick() {
      return onStep(plan.index + 1);
    },
    disabled: plan.atEnd,
    "aria-label": "Next step"
  }, "Next \u2192"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onPrint
  }, "Worksheet"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onExit
  }, "Exit tour")));
}

/** The printable worksheet: questions, expected readouts, plain URLs, references. */
function TourWorksheet(_ref3) {
  var _window$QGA_TOURS$wor, _window$QGA_TOURS5, _window$QGA_TOURS$wor2, _window$QGA_TOURS6;
  var tour = _ref3.tour,
    onExit = _ref3.onExit;
  var header = (_window$QGA_TOURS$wor = (_window$QGA_TOURS5 = window.QGA_TOURS) === null || _window$QGA_TOURS5 === void 0 ? void 0 : _window$QGA_TOURS5.worksheetHeader(tour)) !== null && _window$QGA_TOURS$wor !== void 0 ? _window$QGA_TOURS$wor : null;
  var rows = (_window$QGA_TOURS$wor2 = (_window$QGA_TOURS6 = window.QGA_TOURS) === null || _window$QGA_TOURS6 === void 0 ? void 0 : _window$QGA_TOURS6.worksheetRows(tour)) !== null && _window$QGA_TOURS$wor2 !== void 0 ? _window$QGA_TOURS$wor2 : [];
  useEffect(function () {
    var previous = document.title;
    document.title = "Worksheet \u2014 ".concat(tour.title);
    return function () {
      document.title = previous;
    };
  }, [tour.title]);
  if (!header) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "tour-worksheet",
    role: "region",
    "aria-label": "Worksheet: ".concat(tour.title)
  }, /*#__PURE__*/React.createElement("header", {
    className: "tour-sheet-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tour-kicker"
  }, "Teacher worksheet \xB7 HORIZON"), /*#__PURE__*/React.createElement("h2", null, header.title), header.summary ? /*#__PURE__*/React.createElement("p", {
    className: "tour-sheet-summary"
  }, header.summary) : null, /*#__PURE__*/React.createElement("p", {
    className: "tour-sheet-meta mono"
  }, header.stepCount, " steps \xB7 worksheet link: ", header.url), /*#__PURE__*/React.createElement("div", {
    className: "tour-sheet-fields"
  }, /*#__PURE__*/React.createElement("span", null, "Name"), /*#__PURE__*/React.createElement("span", {
    className: "tour-sheet-rule"
  }), /*#__PURE__*/React.createElement("span", null, "Date"), /*#__PURE__*/React.createElement("span", {
    className: "tour-sheet-rule"
  }))), /*#__PURE__*/React.createElement("ol", {
    className: "tour-sheet-list"
  }, rows.map(function (row) {
    return /*#__PURE__*/React.createElement("li", {
      key: row.number,
      className: "tour-sheet-item"
    }, /*#__PURE__*/React.createElement("div", {
      className: "tour-sheet-line"
    }, /*#__PURE__*/React.createElement("span", {
      className: "tour-sheet-num mono"
    }, row.number, "."), /*#__PURE__*/React.createElement("p", {
      className: "tour-sheet-question"
    }, /*#__PURE__*/React.createElement(RichText, {
      text: row.question
    }))), /*#__PURE__*/React.createElement("p", {
      className: "tour-sheet-context"
    }, /*#__PURE__*/React.createElement(RichText, {
      text: row.text
    })), /*#__PURE__*/React.createElement("p", {
      className: "tour-sheet-url mono"
    }, row.url), /*#__PURE__*/React.createElement("div", {
      className: "tour-sheet-answer"
    }, /*#__PURE__*/React.createElement("span", {
      className: "tour-label"
    }, "Answer / expected readout"), /*#__PURE__*/React.createElement("p", null, row.expected ? /*#__PURE__*/React.createElement(RichText, {
      text: row.expected
    }) : "Open the step and read the value on screen.")), row.formulaFocus ? /*#__PURE__*/React.createElement("p", {
      className: "tour-sheet-focus mono"
    }, "Formula: ", row.formulaFocus) : null);
  })), header.references.length ? /*#__PURE__*/React.createElement("section", {
    className: "tour-sheet-refs"
  }, /*#__PURE__*/React.createElement("h3", null, "References"), /*#__PURE__*/React.createElement("ol", null, header.references.map(function (reference, i) {
    return /*#__PURE__*/React.createElement("li", {
      key: i
    }, reference.label, " \u2014 ", /*#__PURE__*/React.createElement("span", {
      className: "mono"
    }, reference.url));
  }))) : null, /*#__PURE__*/React.createElement("p", {
    className: "tour-sheet-foot mono"
  }, "Printed from the HORIZON Quantum Gravity Atlas. Every number on this sheet is computed by the atlas's own tested physics modules; nothing here is quoted from memory. No quantum gravity theory is experimentally confirmed, and the atlas marks every claim with its scientific status."), /*#__PURE__*/React.createElement("div", {
    className: "tour-controls tour-sheet-controls no-print"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: function onClick() {
      return window.print();
    }
  }, "Print"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onExit
  }, "Back to the atlas")));
}

/**
 * The tour surface. Rendered by the shell when the URL names a tour; it owns no state the URL does not.
 *
 * `onNavigate(view, patch, formulaFocus, shot)` is the shell's navigation, so the panel never writes the URL itself.
 */
function TourSurface(_ref4) {
  var _window$QGA_TOURS$TOU2, _window$QGA_TOURS7;
  var tourId = _ref4.tourId,
    step = _ref4.step,
    print = _ref4.print,
    onNavigate = _ref4.onNavigate,
    onClose = _ref4.onClose;
  var tours = (_window$QGA_TOURS$TOU2 = (_window$QGA_TOURS7 = window.QGA_TOURS) === null || _window$QGA_TOURS7 === void 0 ? void 0 : _window$QGA_TOURS7.TOUR_LIBRARY) !== null && _window$QGA_TOURS$TOU2 !== void 0 ? _window$QGA_TOURS$TOU2 : [];
  var tour = useMemo(function () {
    var _window$QGA_TOURS$fin, _window$QGA_TOURS8;
    return (_window$QGA_TOURS$fin = (_window$QGA_TOURS8 = window.QGA_TOURS) === null || _window$QGA_TOURS8 === void 0 ? void 0 : _window$QGA_TOURS8.findTour(tours, tourId)) !== null && _window$QGA_TOURS$fin !== void 0 ? _window$QGA_TOURS$fin : null;
  }, [tours, tourId]);
  var _useState = useState(!tour),
    _useState2 = _slicedToArray(_useState, 2),
    launcher = _useState2[0],
    setLauncher = _useState2[1];
  var goToStep = useCallback(function (next) {
    if (!tour) return;
    var plan = window.QGA_TOURS.stepPlan(tour, next);
    if (!plan) return;
    onNavigate({
      view: plan.view,
      patch: plan.patch,
      formulaFocus: plan.formulaFocus,
      shot: plan.shot,
      step: plan.index
    });
  }, [tour, onNavigate]);
  var start = useCallback(function (id, at) {
    var chosen = window.QGA_TOURS.findTour(tours, id);
    if (!chosen) return;
    setLauncher(false);
    var plan = window.QGA_TOURS.stepPlan(chosen, at);
    if (!plan) return;
    onNavigate({
      view: plan.view,
      patch: plan.patch,
      formulaFocus: plan.formulaFocus,
      shot: plan.shot,
      step: plan.index,
      tour: id
    });
  }, [tours, onNavigate]);
  useEffect(function () {
    setLauncher(!tour);
  }, [tour]);
  if (launcher) {
    return /*#__PURE__*/React.createElement("section", {
      className: "tour-surface",
      "aria-label": "Guided tours"
    }, /*#__PURE__*/React.createElement("div", {
      className: "tour-surface-inner"
    }, /*#__PURE__*/React.createElement("div", {
      className: "tour-surface-head"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "tour-kicker"
    }, "Learning paths"), /*#__PURE__*/React.createElement("h2", null, "Guided tours"), /*#__PURE__*/React.createElement("p", {
      className: "small dim"
    }, "Paths through the atlas for learners and teachers. Each step names the view it opens, the question it asks and the readout that answers it; the worksheet prints the same steps."))), /*#__PURE__*/React.createElement(TourLauncher, {
      onStart: start,
      onClose: onClose
    })));
  }
  return /*#__PURE__*/React.createElement("section", {
    className: "tour-surface" + (print ? " is-print" : ""),
    "aria-label": "Guided tour"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tour-surface-inner"
  }, print ? /*#__PURE__*/React.createElement(TourWorksheet, {
    tour: tour,
    onExit: onClose
  }) : /*#__PURE__*/React.createElement(TourReader, {
    tour: tour,
    step: step,
    onStep: goToStep,
    onExit: onClose,
    onPrint: function onPrint() {
      var _tour$steps$view, _tour$steps;
      return onNavigate({
        view: (_tour$steps$view = (_tour$steps = tour.steps[step - 1]) === null || _tour$steps === void 0 ? void 0 : _tour$steps.view) !== null && _tour$steps$view !== void 0 ? _tour$steps$view : "overview",
        patch: {},
        step: Math.max(1, step),
        print: true
      });
    }
  })));
}
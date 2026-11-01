/* Compiled from js/search/command-palette.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
// command-palette.jsx — Prompt 10 global command/search palette.
//
// Opens with Cmd/Ctrl+K (wired here), the desktop sidebar button and the
// mobile topbar button (both in app.jsx). Indexes modules, reference views,
// glossary, symbols, formula titles, references, open problems, camera shots
// (when a cinematic manifest is present) and atlas actions through the
// deterministic search-index module. While open: backdrop blur + vignette
// (CSS, ≤200ms), the active 3D scene keeps rendering but idle drift pauses,
// and hovering a formula/symbol result previews its scene highlight through
// the ConceptBus (no camera movement). Fully keyboard-driven; focus is
// restored to the previously focused element on close.

function useCommandPaletteOpen() {
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    open = _useState2[0],
    setOpen = _useState2[1];
  var restoreRef = useRef(null);
  var openPalette = useCallback(function () {
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }, []);
  var closePalette = useCallback(function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$restoreFocus = _ref.restoreFocus,
      restoreFocus = _ref$restoreFocus === void 0 ? true : _ref$restoreFocus;
    setOpen(false);
    if (restoreFocus && restoreRef.current && document.contains(restoreRef.current)) {
      try {
        restoreRef.current.focus();
      } catch (e) {/* detached node */}
    }
    restoreRef.current = null;
  }, []);
  return {
    open: open,
    openPalette: openPalette,
    closePalette: closePalette
  };
}
function CommandPalette(_ref2) {
  var go = _ref2.go;
  var _useCommandPaletteOpe = useCommandPaletteOpen(),
    open = _useCommandPaletteOpe.open,
    openPalette = _useCommandPaletteOpe.openPalette,
    closePalette = _useCommandPaletteOpe.closePalette;
  var _useState3 = useState(""),
    _useState4 = _slicedToArray(_useState3, 2),
    query = _useState4[0],
    setQuery = _useState4[1];
  var _useState5 = useState(0),
    _useState6 = _slicedToArray(_useState5, 2),
    activeIndex = _useState6[0],
    setActiveIndex = _useState6[1];
  var inputRef = useRef(null);
  var listRef = useRef(null);
  var resultsRef = useRef([]);
  var goRef = useRef(go);
  goRef.current = go;
  useEffect(function () {
    window.QGA_OPEN_PALETTE = openPalette;
    return function () {
      if (window.QGA_OPEN_PALETTE === openPalette) delete window.QGA_OPEN_PALETTE;
    };
  }, [openPalette]);

  // Cmd/Ctrl+K opens; Escape closes (also handled on the input).
  useEffect(function () {
    var onKey = function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return function () {
      return window.removeEventListener("keydown", onKey);
    };
  }, [openPalette]);

  // The palette announces itself so scenes pause idle drift while it is open.
  useEffect(function () {
    var _window$QGA_CONCEPT_B;
    if (!open) return undefined;
    (_window$QGA_CONCEPT_B = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B === void 0 || _window$QGA_CONCEPT_B.publish("palette-visibility", {
      open: true
    });
    return function () {
      var _window$QGA_CONCEPT_B2;
      return (_window$QGA_CONCEPT_B2 = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B2 === void 0 ? void 0 : _window$QGA_CONCEPT_B2.publish("palette-visibility", {
        open: false
      });
    };
  }, [open]);
  useEffect(function () {
    if (open) {
      var _inputRef$current;
      setQuery("");
      setActiveIndex(0);
      // Focus synchronously after the commit: a rAF-delayed focus loses the
      // first typed characters when keyboard input follows immediately.
      (_inputRef$current = inputRef.current) === null || _inputRef$current === void 0 || _inputRef$current.focus();
      return undefined;
    }
    return undefined;
  }, [open]);
  var index = useMemo(function () {
    var _window$QGA_MODULES, _window$QGA_FORMULA_I, _window$QGA_SYMBOLS, _window$QGA_GLOSSARY, _window$QGA_REFERENCE, _window$QGA_OPEN_PROB, _ref3, _window$QGA_CINEMATIC, _window$QGA_CINEMATIC2, _window$QGA_CINEMATIC3, _window$QGA_CINEMATIC4;
    var SEARCH = window.QGA_SEARCH;
    if (!SEARCH) return [];
    var modules = ((_window$QGA_MODULES = window.QGA_MODULES) !== null && _window$QGA_MODULES !== void 0 ? _window$QGA_MODULES : []).map(function (m) {
      return {
        id: m.id,
        title: m.title,
        subtitle: "Module ".concat(m.num),
        run: function run() {
          return goRef.current(m.id);
        }
      };
    });
    var views = [{
      id: "overview",
      title: "Atlas overview",
      run: function run() {
        return goRef.current("overview");
      }
    }, {
      id: "glossary",
      title: "Glossary",
      run: function run() {
        return goRef.current("glossary");
      }
    }, {
      id: "symbols",
      title: "Symbol Atlas",
      run: function run() {
        return goRef.current("symbols");
      }
    }, {
      id: "refs",
      title: "References",
      run: function run() {
        return goRef.current("refs");
      }
    }, {
      id: "open",
      title: "Open Problems",
      run: function run() {
        return goRef.current("open");
      }
    }, {
      id: "paper",
      title: "Whitepaper",
      run: function run() {
        return goRef.current("paper");
      }
    }];
    var formulas = ((_window$QGA_FORMULA_I = window.QGA_FORMULA_INDEX) !== null && _window$QGA_FORMULA_I !== void 0 ? _window$QGA_FORMULA_I : []).map(function (f) {
      return {
        view: f.view,
        viewLabel: f.viewLabel,
        title: f.title,
        run: function run() {
          // Deterministic focus hand-off: cross-view navigation consumes the
          // pending focus on mount; same-view jumps open the card directly.
          window.__qgaPendingFormulaFocus = f.title;
          goRef.current(f.view);
          window.dispatchEvent(new CustomEvent("qga-open-formula", {
            detail: {
              title: f.title
            }
          }));
        }
      };
    });
    var symbols = ((_window$QGA_SYMBOLS = window.QGA_SYMBOLS) !== null && _window$QGA_SYMBOLS !== void 0 ? _window$QGA_SYMBOLS : []).map(function (symbol) {
      var _symbol$contexts;
      return {
        sym: symbol.sym,
        cat: symbol.cat,
        contexts: (_symbol$contexts = symbol.contexts) !== null && _symbol$contexts !== void 0 ? _symbol$contexts : [],
        run: function run() {
          var _symbol$contexts2;
          var target = (_symbol$contexts2 = symbol.contexts) === null || _symbol$contexts2 === void 0 || (_symbol$contexts2 = _symbol$contexts2[0]) === null || _symbol$contexts2 === void 0 ? void 0 : _symbol$contexts2.module;
          if (target) goRef.current(target);
        }
      };
    });
    var glossary = ((_window$QGA_GLOSSARY = window.QGA_GLOSSARY) !== null && _window$QGA_GLOSSARY !== void 0 ? _window$QGA_GLOSSARY : []).map(function (term) {
      return {
        term: term.term,
        def: term.def,
        run: function run() {
          return goRef.current("glossary");
        }
      };
    });
    var references = ((_window$QGA_REFERENCE = window.QGA_REFERENCES) !== null && _window$QGA_REFERENCE !== void 0 ? _window$QGA_REFERENCE : []).map(function (reference) {
      return {
        tag: reference.tag,
        text: reference.text,
        run: function run() {
          return goRef.current("refs");
        }
      };
    });
    var problems = ((_window$QGA_OPEN_PROB = window.QGA_OPEN_PROBLEMS) !== null && _window$QGA_OPEN_PROB !== void 0 ? _window$QGA_OPEN_PROB : []).map(function (problem) {
      return {
        title: problem.title,
        kind: problem.kind,
        body: problem.body,
        run: function run() {
          return goRef.current("open");
        }
      };
    });
    // Camera shots: indexed from the cinematic manifests when present. On a
    // Prompt 08 base there are none — the code path stays ready for them.
    var shots = ((_ref3 = (_window$QGA_CINEMATIC = (_window$QGA_CINEMATIC2 = window.QGA_CINEMATIC) === null || _window$QGA_CINEMATIC2 === void 0 || (_window$QGA_CINEMATIC3 = _window$QGA_CINEMATIC2.shotManifests) === null || _window$QGA_CINEMATIC3 === void 0 ? void 0 : _window$QGA_CINEMATIC3.call(_window$QGA_CINEMATIC2)) !== null && _window$QGA_CINEMATIC !== void 0 ? _window$QGA_CINEMATIC : (_window$QGA_CINEMATIC4 = window.QGA_CINEMATIC) === null || _window$QGA_CINEMATIC4 === void 0 ? void 0 : _window$QGA_CINEMATIC4.SHOTS) !== null && _ref3 !== void 0 ? _ref3 : []).filter(function (shot) {
      return shot && shot.id && shot.title;
    }).map(function (shot) {
      var _shot$subtitle;
      return {
        id: shot.id,
        title: shot.title,
        subtitle: (_shot$subtitle = shot.subtitle) !== null && _shot$subtitle !== void 0 ? _shot$subtitle : "Camera shot",
        run: function run() {
          if (typeof shot.run === "function") shot.run();else goRef.current(shot.view);
        }
      };
    });
    var actions = [{
      id: "save-snapshot",
      title: "Save snapshot",
      subtitle: "Capture the current state",
      keywords: ["camera", "state", "store"],
      run: function run() {
        var _window$QGA_OPEN_SNAP, _window;
        return (_window$QGA_OPEN_SNAP = (_window = window).QGA_OPEN_SNAPSHOTS) === null || _window$QGA_OPEN_SNAP === void 0 ? void 0 : _window$QGA_OPEN_SNAP.call(_window);
      }
    }, {
      id: "guided-tours",
      title: "Guided tours",
      subtitle: "Learning paths and teacher worksheets",
      keywords: ["tour", "lesson", "worksheet", "teacher", "path"],
      run: function run() {
        var _window$QGA_OPEN_TOUR, _window2;
        return (_window$QGA_OPEN_TOUR = (_window2 = window).QGA_OPEN_TOURS) === null || _window$QGA_OPEN_TOUR === void 0 ? void 0 : _window$QGA_OPEN_TOUR.call(_window2);
      }
    }, {
      id: "publishing-studio",
      title: "Publishing studio",
      subtitle: "PNG, figure SVG, WebM and lab report",
      keywords: ["export", "png", "svg", "webm", "report", "pdf", "download", "figure"],
      run: function run() {
        var _window$QGA_OPEN_EXPO, _window3;
        return (_window$QGA_OPEN_EXPO = (_window3 = window).QGA_OPEN_EXPORT) === null || _window$QGA_OPEN_EXPO === void 0 ? void 0 : _window$QGA_OPEN_EXPO.call(_window3);
      }
    }, {
      id: "open-compare",
      title: "Open compare view",
      subtitle: "A/B comparison of two states",
      keywords: ["ab", "side", "swipe", "diff"],
      run: function run() {
        return goRef.current("compare");
      }
    }, {
      id: "add-annotation",
      title: "Add annotation",
      subtitle: "Place a pin on the current view",
      keywords: ["pin", "note", "mark"],
      run: function run() {
        var _window$QGA_ARM_ANNOT, _window4;
        return (_window$QGA_ARM_ANNOT = (_window4 = window).QGA_ARM_ANNOTATION) === null || _window$QGA_ARM_ANNOT === void 0 ? void 0 : _window$QGA_ARM_ANNOT.call(_window4);
      }
    }, {
      id: "copy-link",
      title: "Copy link",
      subtitle: "Shareable URL for this state",
      keywords: ["share", "url"],
      run: function run() {
        try {
          window.QGA_COPY_LINK(window.QGA_READ_STATE());
        } catch (e) {}
      }
    }, {
      id: "export-json",
      title: "Export JSON",
      subtitle: "Full state with provenance",
      keywords: ["download", "export"],
      run: function run() {
        return window.QGA_EXPORT_JSON(window.QGA_READ_STATE());
      }
    }, {
      id: "rendering-settings",
      title: "Rendering settings",
      subtitle: "Open the rendering panel",
      keywords: ["quality", "backend", "motion"],
      run: function run() {
        return window.postMessage({
          type: "__activate_edit_mode"
        }, location.origin);
      }
    }];
    return SEARCH.buildSearchIndex({
      actions: actions,
      views: views,
      modules: modules,
      shots: shots,
      formulas: formulas,
      symbols: symbols,
      glossary: glossary,
      references: references,
      problems: problems
    });
  }, []);
  var results = useMemo(function () {
    return window.QGA_SEARCH ? window.QGA_SEARCH.rankResults(index, query) : [];
  }, [index, query]);
  resultsRef.current = results;
  useEffect(function () {
    setActiveIndex(0);
  }, [query]);
  var runEntry = useCallback(function (entry) {
    if (!entry) return;
    closePalette();
    try {
      var _entry$run;
      (_entry$run = entry.run) === null || _entry$run === void 0 || _entry$run.call(entry);
    } catch (error) {
      console.error("[palette] action failed:", error);
    }
  }, [closePalette]);
  var onKeyDown = function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closePalette();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "n" && e.ctrlKey) {
      e.preventDefault();
      setActiveIndex(function (i) {
        return Math.min(resultsRef.current.length - 1, i + 1);
      });
    } else if (e.key === "ArrowUp" || e.key === "p" && e.ctrlKey) {
      e.preventDefault();
      setActiveIndex(function (i) {
        return Math.max(0, i - 1);
      });
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(function (i) {
        return Math.max(0, resultsRef.current.length - 1);
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      runEntry(resultsRef.current[activeIndex]);
    }
  };
  // Focus trap: Tab cycles input → esc → input; results are roving-focus
  // (arrow keys), the standard command-palette pattern.
  var dialogRef = useRef(null);
  var onDialogKeyDown = function onDialogKeyDown(e) {
    if (e.key !== "Tab") return;
    var focusables = dialogRef.current ? _toConsumableArray(dialogRef.current.querySelectorAll("input, button")) : [];
    if (!focusables.length) return;
    var current = document.activeElement;
    var first = focusables[0],
      last = focusables[focusables.length - 1];
    if (e.shiftKey && current === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && current === last) {
      e.preventDefault();
      first.focus();
    } else if (!focusables.includes(current)) {
      e.preventDefault();
      first.focus();
    }
  };

  // Keep the active item in view while arrowing through the list.
  useEffect(function () {
    var _listRef$current;
    if (!open) return;
    var node = (_listRef$current = listRef.current) === null || _listRef$current === void 0 ? void 0 : _listRef$current.querySelector("[data-index=\"".concat(activeIndex, "\"]"));
    node === null || node === void 0 || node.scrollIntoView({
      block: "nearest"
    });
  }, [activeIndex, open]);
  if (!open) return null;
  var SEARCH = window.QGA_SEARCH;
  var count = SEARCH ? SEARCH.formatResultCount(results.length, results.length, query) : "";
  return /*#__PURE__*/React.createElement("div", {
    className: "cmdk-backdrop",
    onClick: function onClick() {
      return closePalette();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "cmdk",
    ref: dialogRef,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Command palette and search",
    onClick: function onClick(e) {
      return e.stopPropagation();
    },
    onKeyDown: onDialogKeyDown
  }, /*#__PURE__*/React.createElement("div", {
    className: "cmdk-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cmdk-glyph",
    "aria-hidden": "true"
  }, "\u2318"), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    className: "cmdk-input",
    type: "text",
    placeholder: "Search modules, formulas, symbols, references, actions\u2026",
    "aria-label": "Search the atlas",
    value: query,
    onChange: function onChange(e) {
      return setQuery(e.target.value);
    },
    onKeyDown: onKeyDown,
    autoComplete: "off",
    spellCheck: "false"
  }), /*#__PURE__*/React.createElement("button", {
    className: "cmdk-esc",
    onClick: function onClick() {
      return closePalette();
    },
    "aria-label": "Close palette (Escape)"
  }, "esc")), /*#__PURE__*/React.createElement("div", {
    className: "cmdk-count",
    "aria-live": "polite"
  }, count), results.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "cmdk-empty"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cmdk-empty-title"
  }, "No results", query ? /*#__PURE__*/React.createElement(React.Fragment, null, " for \u201C", query, "\u201D") : null), /*#__PURE__*/React.createElement("div", {
    className: "cmdk-empty-hint"
  }, "Try a module name, a formula title, a symbol, or an action like \u201Csnapshot\u201D.")) : /*#__PURE__*/React.createElement("ul", {
    className: "cmdk-list",
    ref: listRef,
    role: "listbox",
    "aria-label": "Search results"
  }, results.map(function (entry, i) {
    return /*#__PURE__*/React.createElement("li", {
      key: entry.id,
      role: "option",
      "aria-selected": i === activeIndex,
      "data-index": i,
      className: "cmdk-item" + (i === activeIndex ? " active" : ""),
      onMouseEnter: function onMouseEnter() {
        setActiveIndex(i);
        if (entry.category === "formula" || entry.category === "symbol") {
          var _window$QGA_CONCEPT_B3;
          // Preview highlight: no camera movement, gentle pulse.
          var symbol = symbolOf(entry);
          if (symbol) (_window$QGA_CONCEPT_B3 = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B3 === void 0 || _window$QGA_CONCEPT_B3.publish("formula-highlight", {
            symbol: symbol,
            title: entry.title,
            view: window.__qgaCurrentView || "unknown",
            interaction: "preview"
          });
        }
      },
      onMouseLeave: function onMouseLeave() {
        if (entry.category === "formula" || entry.category === "symbol") {
          var _window$QGA_CONCEPT_B4;
          (_window$QGA_CONCEPT_B4 = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B4 === void 0 || _window$QGA_CONCEPT_B4.publish("formula-clear", {
            reason: "blur"
          });
        }
      },
      onClick: function onClick() {
        return runEntry(entry);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "cmdk-cat cmdk-cat-" + entry.category
    }, entry.categoryLabel), /*#__PURE__*/React.createElement("span", {
      className: "cmdk-title"
    }, SEARCH ? SEARCH.highlightSegments(entry.title, query).map(function (segment, j) {
      return segment.hit ? /*#__PURE__*/React.createElement("mark", {
        key: j,
        className: "cmdk-hit"
      }, segment.text) : /*#__PURE__*/React.createElement("span", {
        key: j
      }, segment.text);
    }) : entry.title), entry.subtitle ? /*#__PURE__*/React.createElement("span", {
      className: "cmdk-sub"
    }, entry.subtitle) : null);
  })), /*#__PURE__*/React.createElement("div", {
    className: "cmdk-foot"
  }, /*#__PURE__*/React.createElement("span", null, "\u2191\u2193 navigate"), /*#__PURE__*/React.createElement("span", null, "\u21B5 open"), /*#__PURE__*/React.createElement("span", null, "esc close"), /*#__PURE__*/React.createElement("span", {
    className: "cmdk-foot-right"
  }, results.length, " shown"))));
}

// Symbol entries carry "sym — context" titles; recover the raw tex id for
// preview highlights (the scene registry keys on the tex string).
function symbolOf(entry) {
  if (entry.category !== "symbol") return entry.id.startsWith("formula:") ? formulaSymbolFromTitle(entry.title) : null;
  var dash = entry.title.indexOf(" — ");
  return dash > 0 ? entry.title.slice(0, dash) : entry.title;
}
function formulaSymbolFromTitle() {
  return null;
} // formulas highlight via their own cards, not the palette

window.CommandPalette = CommandPalette;
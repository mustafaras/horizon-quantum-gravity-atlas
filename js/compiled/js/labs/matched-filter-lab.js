/* Compiled from js/labs/matched-filter-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// S27: the matched filter, the Q-transform, and the real CMS spectrum — three views of real measurement.
function MatchedFilterLab() {
  var M = window.QGA_MATCHED_FILTER;
  var Q = window.QGA_QTRANSFORM;
  var G = window.QGA_GW;
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    running = _useState2[0],
    setRunning = _useState2[1];
  var _useState3 = useState(null),
    _useState4 = _slicedToArray(_useState3, 2),
    result = _useState4[0],
    setResult = _useState4[1];
  var _useState5 = useState(null),
    _useState6 = _slicedToArray(_useState5, 2),
    transform = _useState6[0],
    setTransform = _useState6[1];

  // The fixture is synthetic and says so; the search demonstrates the method, not an observation. When no fixture is
  // loaded — the deployed app has none — the search runs on the app's own seeded teaching signal, and the readout
  // says which source it used rather than implying a detector file.
  var search = function search() {
    setRunning(true);
    setTimeout(function () {
      try {
        var _window$__qgaGwFixtur;
        var n = 1024,
          sampleRate = 128;
        var fixture = (_window$__qgaGwFixtur = window.__qgaGwFixtureStrain) !== null && _window$__qgaGwFixtur !== void 0 ? _window$__qgaGwFixtur : null;
        var generated = fixture ? null : window.QGA_PHYSICS.generatedChirp({
          seed: 42,
          sampleRate: sampleRate,
          duration: n / sampleRate,
          m1: 36,
          m2: 29
        });
        var strain = Float64Array.from(fixture ? fixture.slice(0, n) : generated.samples);
        var source = fixture ? "GWOSC fixture (synthetic)" : "seeded teaching signal";
        var psd = G.estimatePsd(strain, {
          sampleRate: sampleRate,
          segmentSize: 128
        });
        var bank = M.buildBank({
          count: 32,
          mcMin: 10,
          mcMax: 40,
          sampleRate: sampleRate,
          duration: n / sampleRate
        });
        var best = M.searchBank({
          strain: strain,
          sampleRate: sampleRate,
          bank: bank,
          psd: psd,
          bandLow: 20
        });
        setResult({
          peakSnr: best.peakSnr,
          bestMc: best.bestMc,
          tPeak: best.tPeak,
          spacing: bank.spacing,
          templates: bank.count,
          source: source
        });
        var tf = Q.qTransform(strain, {
          sampleRate: sampleRate,
          fMin: 20,
          bins: 40,
          hop: 6
        });
        setTransform({
          tf: tf,
          track: Q.dominantTrack(tf)
        });
      } finally {
        setRunning(false);
      }
    }, 0);
  };
  var qtSpec = useMemo(function () {
    return transform ? window.QGA_FIGURE.plots.expRealData.qTransformSpec({
      transform: transform.tf,
      track: transform.track,
      title: 'Q-transform of the loaded strain'
    }) : null;
  }, [transform]);
  var cmsSpec = useMemo(function () {
    return window.QGA_FIGURE.plots.expRealData.cmsDimuonSpec();
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame mf-lab",
    id: "exp-matched-filter"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: search,
    disabled: running
  }, running ? "Searching…" : "Run matched filter"), /*#__PURE__*/React.createElement("span", {
    className: "mf-status",
    "aria-live": "polite"
  }, result !== null && result !== void 0 && result.error ? result.error : result ? "peak SNR ".concat(result.peakSnr.toFixed(1), " at ").concat(result.tPeak.toFixed(2), " s") : "a 32-template bank, 10–40 solar masses")), result && !result.error ? /*#__PURE__*/React.createElement("div", {
    className: "readout-grid mf-readouts",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "peak SNR"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, result.peakSnr.toFixed(2)), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "from the ", result.source, "; single detector, no chi-squared veto")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "recovered chirp mass"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, result.bestMc.toFixed(1), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "M\u2609")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "bank spacing ", result.spacing.toFixed(2), " M\u2609 over ", result.templates, " templates")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "peak time"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, result.tPeak.toFixed(3), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "s")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "the template's coalescence lands on the loudest point of the data"))) : null, qtSpec ? /*#__PURE__*/React.createElement(Figure, {
    spec: qtSpec
  }) : null, /*#__PURE__*/React.createElement("div", {
    className: "readout-grid mf-readouts",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "signal-to-noise"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, (result === null || result === void 0 ? void 0 : result.peakSnr) != null ? result.peakSnr.toFixed(1) : "—"), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "not the LVK detection statistic: no false-alarm rate is computed"))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "gw-matched-filter",
    status: "effective"
  }, "The statistic is ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\rho(t)=4\\,\\mathrm{Re}\\int \\tilde s(f)\\tilde h^*(f)e^{2\\pi ift}/S_n(f)\\,df/\\sigma_h"
  }), ", the matched filter: the data correlated against a template, weighted by the inverse noise power. The bank is non-spinning TaylorT4, spaced in chirp mass. ", /*#__PURE__*/React.createElement("strong", null, "This is a simplified search"), " \u2014 no", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\chi^2"
  }), " veto, no coincidence between detectors and no background estimate \u2014 so the peak SNR is not a detection and must not be read as one. The bundled fixture is", /*#__PURE__*/React.createElement("strong", null, "synthetic"), "; the panel below is real data."), /*#__PURE__*/React.createElement("div", {
    className: "mf-cms"
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: cmsSpec
  })), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "exp-cms-dimuon",
    status: "established"
  }, "The dimuon invariant-mass spectrum from the CMS Run2010B public Mu dataset \u2014 real open data from the CERN Open Data Portal, CC0, not a simulation. The J/psi, psi(2S), Upsilon family and Z appear at their known masses because the events put them there. Error bars are ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\sqrt{N}"
  }), "; the logarithmic axis is what lets a 10\u2070-event Z peak and a 10\xB3-event J/psi peak sit in one picture."));
}
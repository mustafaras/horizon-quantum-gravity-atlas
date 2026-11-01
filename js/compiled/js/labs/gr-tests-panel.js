/* Compiled from js/labs/gr-tests-panel.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function grObservationNumber(value) {
  return value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) ? value.toExponential(3) : Number(value.toPrecision(5)).toString();
}
function GRTestsPanel() {
  var D = window.QGA_GR.tests;
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.grTides.grPullSpec();
  }, []);
  var gps = D.gpsClockOffset();
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame gr-tests-panel",
    id: "gr-tests-pull"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tidal-intro"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "tidal-kicker"
  }, "02 / THE TESTED UNIVERSE"), /*#__PURE__*/React.createElement("h3", null, "One theory, many independent questions"), /*#__PURE__*/React.createElement("p", null, "Each point compares a published measurement with its own prediction. Zero is perfect agreement; the bar shows the reported uncertainty."))), /*#__PURE__*/React.createElement("div", {
    className: "gr-pull-layout"
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }, /*#__PURE__*/React.createElement("span", {
    className: "tidal-note"
  }, "Bands show one and two standard errors. These tests use different observables and are not a combined fit.")), /*#__PURE__*/React.createElement("ol", {
    className: "gr-test-list"
  }, D.GR_TESTS.map(function (entry, i) {
    return /*#__PURE__*/React.createElement("li", {
      key: entry.id
    }, /*#__PURE__*/React.createElement("span", {
      className: "gr-test-number"
    }, D.GR_TESTS.length - i), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, entry.label), /*#__PURE__*/React.createElement("span", null, "Measured ", grObservationNumber(entry.measured), " \xB1 ", grObservationNumber(entry.sigma), " \xB7 predicted ", grObservationNumber(entry.predicted()), " \xB7 ", entry.unit), /*#__PURE__*/React.createElement("span", null, "pull ", D.pull(entry).toFixed(2), " \u03C3"), /*#__PURE__*/React.createElement("a", {
      href: entry.url,
      target: "_blank",
      rel: "noreferrer",
      title: entry.note || entry.citation
    }, entry.citation, " \u2197"), entry.note && /*#__PURE__*/React.createElement("small", null, entry.note)));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "gr-gps-note"
  }, /*#__PURE__*/React.createElement("strong", null, "GPS in practice"), /*#__PURE__*/React.createElement("span", null, "For a spherical, non-rotating Earth and a 26,560 km circular orbit: +", gps.gravitational.toFixed(2), " gravitational, ", gps.kinematic.toFixed(2), " kinematic, ", gps.net.toFixed(2), " \u03BCs/day net. This calculation is separate from the GPS measurement in the plot.")), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "gr-tests-pull",
    status: "established"
  }, "Published values and uncertainties are linked by row. The Mercury error bar is statistical; its source also estimates a larger systematic uncertainty. The GPS point is a redshift experiment, not the calculated operating offset."));
}
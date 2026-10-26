import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { setTokenSource, buildTokens, parseTokensCss } from "../js/design/tokens.mjs";
import * as plots from "../js/figure/plots/index.mjs";
import { buildScene } from "../js/figure/scene.mjs";
import { renderSvg } from "../js/figure/svg-renderer.mjs";
import { figureSummary, dataTable } from "../js/figure/summary.mjs";
import { registerFigureProvenance, FIGURE_PROVENANCE } from "../js/figure/provenance.mjs";
import { getVisualizationProvenance } from "../js/science/provenance.mjs";
import { hasReferenceIdentifier } from "../js/science/references.mjs";
import { parseXml } from "./support/xml.mjs";
import { flavourCurves } from "../js/science/neutrino.mjs";
import { defaultParams } from "../js/science/data/nufit.mjs";
import { PDG } from "../js/science/data/pdg.mjs";
import { runFromInputs, lambdaBand, instabilityScale, stabilityBoundaries } from "../js/science/higgs-running.mjs";
import { grNullTrajectory, grPhotonSphereRadius, grCriticalImpactParameter } from "../js/physics.mjs";
import { pressureCurve, dataBand, ratioBand, idealPressure } from "../js/science/casimir.mjs";

const T = buildTokens(parseTokensCss(fs.readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8")));
setTokenSource(T);
registerFigureProvenance();
const fonts = { tick: T.font.mono(-2), label: T.font.mono(-1), family: "monospace" };
const measure = (text) => text.length * 6.25;

const processes = [{ id: "s-channel", name: "e+e- to mu+mu-", sub: "s-channel annihilation" }, { id: "t-channel", name: "e-mu- scattering", sub: "t-channel exchange" }, { id: "compton", name: "Compton", sub: "Compton scattering" }];
const gwSamples = (n, f) => Float32Array.from({ length: n }, (_, i) => Math.sin((i / n) * f) * (0.2 + i / n));
const stft = { frames: 12, bins: 8, nyquist: 256, maxDb: -20, magnitudes: Float32Array.from({ length: 96 }, (_, i) => -20 - (i % 40)), times: [0, 3.8] };
const gm = 0.55 * 5, c2 = 1;
const rays = [0.55, 0.995, 1.005, 1.7].map((f) => {
  const t = grNullTrajectory(grCriticalImpactParameter(gm, c2) * f, gm, c2, { maxSteps: 20000, dt: 0.001, rCap: 1.02 * 2 * gm });
  return { f, captured: t.captured, windings: t.windings, points: t.points };
});

const nuNO = defaultParams("NO"), nuIO = defaultParams("IO");

const higgsInputs = { mt: PDG.mt.value, mH: PDG.mH.value, alphaS: PDG.alphaS.value };
const higgsCentralRun = runFromInputs(higgsInputs);
const higgsRunningInput = () => {
  const band = lambdaBand({ mt: PDG.mt, mH: PDG.mH.value, alphaS: PDG.alphaS });
  return {
    mu: higgsCentralRun.t.map(Math.exp), lambda: higgsCentralRun.states.map((s) => s[0]), lower: band.lower, upper: band.upper,
    instabilityGeV: instabilityScale(higgsCentralRun), treeLambda: higgsCentralRun.states[0][0], mtGeV: PDG.mt.value,
  };
};
const higgsStabilityInput = () => ({
  boundaries: stabilityBoundaries({ mHValues: [120, 122, 124, 126, 128, 130], mtRange: [150, 200] }),
  measured: { mt: PDG.mt, mH: PDG.mH }, mtDomain: [164, 182], mHDomain: [120, 130],
});

const cases = {
  neutrinoVacuum: () => plots.neutrino.flavourRibbonSpec({
    curves: flavourCurves({ initial: 1, mode: "energy", range: [0.1, 2], fixed: 295, params: nuNO }), mode: "energy", channel: 0, initial: 1,
    antineutrino: false, matter: false, marker: { x: 0.6, text: "T2K" } }),
  neutrinoMatter: () => plots.neutrino.flavourRibbonSpec({
    curves: flavourCurves({ initial: 1, mode: "baseline", range: [0, 1200], fixed: 2.5, params: nuIO, rhoGcm3: 2.85, antineutrino: true }),
    ghost: flavourCurves({ initial: 1, mode: "baseline", range: [0, 1200], fixed: 2.5, params: nuIO, rhoGcm3: 0, antineutrino: true }),
    mode: "baseline", channel: 2, initial: 1, antineutrino: true, matter: true }),
  higgsRunning: () => plots.higgs.couplingRunSpec(higgsRunningInput()),
  higgsStability: () => plots.higgs.stabilityDiagramSpec(higgsStabilityInput()),
  hawking: () => plots.bh.hawkingSpectrumSpec({ logM: 3, tempFactor: 1 }),
  hawkingHot: () => plots.bh.hawkingSpectrumSpec({ logM: 0, tempFactor: 1.4 }),
  page: () => plots.bh.pageCurveSpec(),
  kerr: () => plots.bh.kerrRadiiSpec({ rings: [{ radius: 1.7, color: "signal-danger", width: 2, focal: true, label: "Outer horizon" }, { radius: 2.4, color: "accent-2", width: 1.4, label: "Ergosurface" }], domain: 4, spin: 0.7 }),
  veff: () => {
    const r = Array.from({ length: 50 }, (_, i) => 0.8 + i * 0.1);
    return plots.gr.effectivePotentialSpec({ r, gr: r.map((v) => -1 / v + 1 / (v * v) - 1 / (v ** 3)), newton: r.map((v) => -1 / v + 1 / (v * v)), rDomain: [0.8, 5.7], vDomain: [-1, 0.5],
      marks: [{ r: 1.1, color: "pigment-red-76", tex: "r_s" }], energy: -0.3, turning: [{ r: 1.5, tex: "r_{\\mathrm{peri}}" }, { r: 4, tex: "r_{\\mathrm{apo}}" }] });
  },
  nullGeodesics: () => plots.gr.nullGeodesicSpec({ rays, bCrit: grCriticalImpactParameter(gm, c2), rPh: grPhotonSphereRadius(gm, c2), rs: 2 * gm }),
  lens: () => plots.gr.lensFrameSpec({ thetaShadow: 0.12, thetaE: 0.2, fov: 0.5, lensed: true }),
  lensFlat: () => plots.gr.lensFrameSpec({ thetaShadow: 0.12, thetaE: 0.2, fov: 0.5, lensed: false }),
  rgScale: () => plots.rg.scaleTrajectorySpec({ points: Array.from({ length: 40 }, (_, i) => ({ t: i * 0.5, g: 1.2 / (1 + 0.1 * i), boundary: i === 39 })), fixedPoints: [{ g: 0.5, stability: "UV-attractive" }],
    logMin: -1, logMax: 8, mu0: 2, ln10: Math.LN10, gLimit: Math.sqrt(4 * Math.PI), yMax: 4, markerLog: 3, markerG: 1, status: "effective" }),
  rgBeta: () => plots.rg.betaFunctionSpec({ samples: Array.from({ length: 30 }, (_, i) => ({ g: i * 0.1, beta: -0.2 * i * 0.1 * i * 0.1 })), fixedPoints: [{ g: 0, stability: "UV-attractive", derivative: 0 }], yMax: 3, betaMax: 2, currentPoint: { g: 1, beta: -0.2 }, status: "effective" }),
  qftDispersion: () => plots.qft.dispersionSpec({ mass: 1 }),
  qftWaterfall: () => plots.qft.waterfallSpec({ cosTheta: 0.3, tau: 0.6 }),
  ...Object.fromEntries(processes.map((p) => [`qftAngular-${p.id}`, () => plots.qft.angularSpec({ process: p, cosTheta: 0.2, photonX: 0.5 })])),
  qftPhoton: () => plots.qft.photonCrossSectionSpec({ sqrtS: 10 }),
  qftZ: () => plots.qft.zResonanceSpec({ sqrtS: 91.2 }),
  qftZOutside: () => plots.qft.zResonanceSpec({ sqrtS: 10 }),
  gwStrainGenerated: () => plots.gw.strainSpec({ mode: "generated", h1: { samples: gwSamples(256, 80), duration: 4, mergerIndex: 217, sampleRate: 64 }, l1: { samples: gwSamples(256, 79) }, playT: 2.1, amax: 1.1 }),
  gwStrainReal: () => plots.gw.strainSpec({ mode: "real", real: { samples: gwSamples(300, 60), duration: 4, start: 1126259462 }, playT: 0.5, amax: 1 }),
  gwSpectrogram: () => plots.gw.spectrogramSpec({ spec: stft, playT: 2, duration: 4, freqTrack: Float32Array.from({ length: 64 }, (_, i) => 30 + i * 3), label: "H1 seed 42" }),
  invariantMass: () => plots.gw.invariantMassSpec({ bins: Array.from({ length: 40 }, (_, i) => (i > 18 && i < 22 ? 30 : 2)), imMin: 60, imMax: 120, binWidth: 1.5, mZ: 91.1876 }),
  casimirPressure: () => plots.casimir.pressureSpec({
    curve: pressureCurve({ min: 1e-8, max: 1e-5, count: 61 }),
    bressi: dataBand("bressi2002", [0.5e-6, 1e-6, 2e-6, 3e-6]), lamoreaux: dataBand("lamoreaux1997", [0.6e-6, 1.5e-6, 6e-6]),
    probe: { gap: 1e-6, pressure: -idealPressure(1e-6) },
  }),
  casimirAgreement: () => plots.casimir.agreementSpec({
    bressi: ratioBand(dataBand("bressi2002", [0.5e-6, 1e-6, 2e-6, 3e-6])), lamoreaux: ratioBand(dataBand("lamoreaux1997", [0.6e-6, 1.5e-6, 6e-6])),
  }),
  invariantMassEmpty: () => plots.gw.invariantMassSpec({ bins: new Array(40).fill(0), imMin: 60, imMax: 120, binWidth: 1.5, mZ: 91.1876 }),
};

for (const [name, make] of Object.entries(cases)) {
  test(`plot ${name}: valid spec, registered provenance, finite scene, well-formed SVG`, () => {
    const spec = make();
    assert.ok(spec.marks.filter((m) => m.focal).length <= 1);
    assert.ok(spec.marks.every((m) => m.layer === "data" || m.layer === "model"));
    const provenance = getVisualizationProvenance(spec.provenanceId);
    assert.ok(provenance, `${spec.provenanceId} is registered`);
    assert.ok(provenance.references.length >= 1 && provenance.assumptions.length >= 1);
    assert.match(figureSummary(spec), new RegExp(`Status: ${spec.status}`));
    for (const width of [320, 640, 1200]) {
      const scene = buildScene(spec, { width, measure, fonts });
      assert.ok(scene.height > 0 && scene.plot.w > 0 && scene.plot.h > 0);
      assert.ok(scene.plot.x + scene.plot.w <= width && scene.plot.y + scene.plot.h <= scene.height, `plot inside the box at ${width}`);
      for (const p of scene.prims) for (const [x, y] of p.pts ?? []) assert.ok(Number.isFinite(x) && Number.isFinite(y), `${p.k} finite`);
      for (const t of scene.texts) assert.ok(t.x >= -1 && t.x <= width + 1 && t.y >= -1 && t.y <= scene.height + 1, `text "${t.text}" at ${t.x.toFixed(0)},${t.y.toFixed(0)} inside ${width}x${scene.height}`);
      const svg = renderSvg(scene, spec, { fonts });
      assert.ok(parseXml(svg));
      assert.ok(!/NaN|undefined|Infinity/.test(svg));
    }
    const table = dataTable(spec);
    assert.ok(table.rows.length <= 200);
  });
}

test("every provenance entry is complete and every figure status is a scientific status label", () => {
  for (const [id, entry] of Object.entries(FIGURE_PROVENANCE)) {
    assert.ok(entry.model && entry.numericalMethod && entry.validity.length && entry.references.length, id);
    assert.ok(entry.references.every((r) => hasReferenceIdentifier(r)), `${id}: references carry a DOI, arXiv id, bibcode or URL`);
  }
  const ids = new Set(Object.values(cases).map((make) => make().provenanceId));
  for (const id of Object.keys(FIGURE_PROVENANCE)) assert.ok(ids.has(id), `${id} has a plot case in this test`);
});

test("plots reproduce the physics: values are the functions' own outputs", () => {
  const f = cases.neutrinoVacuum();
  const bands = f.marks.filter((m) => m.type === "band");
  assert.equal(bands.length, 3);
  const i = 100;
  const exact = flavourCurves({ initial: 1, mode: "energy", range: [0.1, 2], fixed: 295, params: nuNO });
  assert.ok(Math.abs(bands[0].y1[i] - exact.P[0][i]) < 1e-15);
  assert.ok(Math.abs(bands[1].y1[i] - (exact.P[0][i] + exact.P[1][i])) < 1e-15);
  assert.ok(Math.abs(bands[2].y1[i] - 1) < 1e-12);
  assert.equal(f.status, "established");
  assert.equal(cases.neutrinoMatter().status, "effective");
  const page = plots.bh.pageCurveSpec().marks[1];
  assert.equal(Math.max(...page.y), 0.85);
  assert.equal(page.y[0], 0); assert.equal(page.y.at(-1), 0);
  const run = higgsCentralRun, running = cases.higgsRunning();
  const focal = running.marks.find((m) => m.focal);
  assert.equal(focal.y.length, run.t.length);
  assert.ok(focal.y.every((y, i) => y === run.states[i][0]), "the focal line is the integrated lambda(mu)");
  const instability = running.marks.find((m) => m.type === "rule" && m.axis === "x");
  assert.ok(Math.abs(instability.value - instabilityScale(run)) < 1e-6 * instability.value, "the rule sits at mu_inst");
  assert.equal(running.status, "effective");
  const stability = cases.higgsStability();
  const ellipse = stability.marks.find((m) => m.type === "line" && m.layer === "data");
  assert.ok(Math.max(...ellipse.x) - Math.min(...ellipse.x) > 0.5, "the 1-sigma ellipse spans +-0.27 GeV in m_t");
  assert.equal(stability.marks.filter((m) => m.type === "band").length, 3);
  assert.equal(stability.status, "effective");
});

/* URL/history state, reproducibility controls, sharing, and bounded GWOSC access. */
const QGA_DEFAULT_STATE = {
  view: "overview", pathway: "student", bhMass: 1, bhSpin: 0,
  gwMode: "generated", gwEvent: "GW150914", gwDetector: "H1",
  gwStart: 1126259446, gwDuration: 16, gwM1: 36, gwM2: 29, seed: 42,
  qftProcess: "s-channel", qftSqrtS: 10, qftAngle: 0, qftPhotonX: 0.5,
  grPreset: "timelike", grBeta: 0.35, grAt: 0, grAx: -1.35, grBt: 2.6, grBx: 1.1,
  rgPreset: "qcd", rgPresetOrigin: "qcd", rgModel: "qcd", rgG0: 1.218, rgMu0: 2, rgLogMin: -1, rgLogMax: 8,
  rgNf: 5, rgA: 1, rgB: 1, rgGStar: 1, rgCurrent: 2,
};
const QGA_STATE_KEYS = {
  view: "view", pathway: "pathway", bhMass: "bhm", bhSpin: "bhs",
  gwMode: "gwm", gwEvent: "gwe", gwDetector: "gwd", gwStart: "gws",
  gwDuration: "gwt", gwM1: "gwm1", gwM2: "gwm2", seed: "seed",
  qftProcess: "qfp", qftSqrtS: "qfs", qftAngle: "qfa", qftPhotonX: "qfx",
  grPreset: "grp", grBeta: "grb", grAt: "grat", grAx: "grax", grBt: "grbt", grBx: "grbx",
  rgPreset: "rgp", rgPresetOrigin: "rgpo", rgModel: "rgm", rgG0: "rgg", rgMu0: "rgmu", rgLogMin: "rglo",
  rgLogMax: "rghi", rgNf: "rgnf", rgA: "rga", rgB: "rgb", rgGStar: "rggs", rgCurrent: "rgc",
};
const qgaClamp = (value, min, max) => Math.min(max, Math.max(min, value));
const QGA_ENUMS = {
  view: ["overview", "sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp", "glossary", "refs", "open"],
  pathway: ["beginner", "student", "advanced"], gwMode: ["generated", "real"], gwDetector: ["H1", "L1", "V1"],
  qftProcess: ["s-channel", "t-channel", "compton"], grPreset: ["timelike", "spacelike", "null", "simultaneity", "twin", "custom"],
  rgPreset: ["qed", "qcd", "gaussian", "uv-toy", "ir-toy", "asymptotic-safety", "custom"],
  rgPresetOrigin: ["qed", "qcd", "gaussian", "uv-toy", "ir-toy", "asymptotic-safety"],
  rgModel: ["qed", "qcd", "gaussian", "linear", "asymptotic-safety"],
};
const QGA_NUMBERS = ["bhMass", "bhSpin", "gwStart", "gwDuration", "gwM1", "gwM2", "seed", "qftSqrtS", "qftAngle", "qftPhotonX", "grBeta", "grAt", "grAx", "grBt", "grBx", "rgG0", "rgMu0", "rgLogMin", "rgLogMax", "rgNf", "rgA", "rgB", "rgGStar", "rgCurrent"];
function qgaReadState(search = window.location.search) {
  const params = new URLSearchParams(search), state = { ...QGA_DEFAULT_STATE };
  for (const [key, param] of Object.entries(QGA_STATE_KEYS)) {
    const raw = params.get(param); if (raw == null) continue;
    if (QGA_ENUMS[key]?.includes(raw)) state[key] = raw;
    else if (key === "gwEvent") state[key] = raw;
    else if (QGA_NUMBERS.includes(key) && Number.isFinite(Number(raw))) state[key] = Number(raw);
  }
  if (!params.has(QGA_STATE_KEYS.view)) {
    try {
      const legacyView = localStorage.getItem("qga-view");
      if (QGA_ENUMS.view.includes(legacyView)) state.view = legacyView;
    } catch (e) {}
  }
  state.bhMass = qgaClamp(state.bhMass, 0, 9); state.bhSpin = qgaClamp(state.bhSpin, 0, 0.998);
  state.gwStart = qgaClamp(Math.round(state.gwStart), 1126259000, 1126260000);
  state.gwDuration = qgaClamp(Math.round(state.gwDuration), 1, 32); state.seed = Math.trunc(state.seed) || 42;
  state.gwM1 = qgaClamp(Math.round(state.gwM1), 5, 200); state.gwM2 = qgaClamp(Math.round(state.gwM2), 5, 200);
  state.gwEvent = /^[A-Za-z0-9_-]{3,40}$/.test(state.gwEvent) ? state.gwEvent : QGA_DEFAULT_STATE.gwEvent;
  state.qftSqrtS = qgaClamp(state.qftSqrtS, 1, 200);
  state.qftAngle = qgaClamp(state.qftAngle, -1, 1);
  state.qftPhotonX = qgaClamp(state.qftPhotonX, 0.05, 20);
  state.grPreset = QGA_ENUMS.grPreset.includes(state.grPreset) ? state.grPreset : QGA_DEFAULT_STATE.grPreset;
  const causal = window.QGA_PHYSICS.sanitizeCausalState({
    beta: state.grBeta,
    a: { ct: state.grAt, x: state.grAx },
    b: { ct: state.grBt, x: state.grBx },
  }, {
    beta: QGA_DEFAULT_STATE.grBeta,
    a: { ct: QGA_DEFAULT_STATE.grAt, x: QGA_DEFAULT_STATE.grAx },
    b: { ct: QGA_DEFAULT_STATE.grBt, x: QGA_DEFAULT_STATE.grBx },
  });
  state.grBeta = causal.beta;
  state.grAt = causal.a.ct; state.grAx = causal.a.x;
  state.grBt = causal.b.ct; state.grBx = causal.b.x;
  const rgPresetModels = {
    qed: "qed", qcd: "qcd", gaussian: "gaussian", "uv-toy": "linear",
    "ir-toy": "linear", "asymptotic-safety": "asymptotic-safety",
  };
  if (state.rgPreset !== "custom") {
    state.rgModel = rgPresetModels[state.rgPreset] || QGA_DEFAULT_STATE.rgModel;
    state.rgPresetOrigin = state.rgPreset;
  } else {
    const originMatchesModel = rgPresetModels[state.rgPresetOrigin] === state.rgModel;
    if (!params.has(QGA_STATE_KEYS.rgPresetOrigin) || !originMatchesModel) {
      state.rgPresetOrigin = state.rgModel === "linear"
        ? (state.rgA < 0 ? "uv-toy" : "ir-toy")
        : state.rgModel;
    }
  }
  state.rgG0 = qgaClamp(state.rgG0, 0, 3.4);
  state.rgNf = qgaClamp(Math.round(state.rgNf), state.rgModel === "qed" ? 1 : 0, 16);
  state.rgA = qgaClamp(state.rgA, -3, 3);
  state.rgB = qgaClamp(state.rgB, 0.05, 4);
  state.rgGStar = qgaClamp(state.rgGStar, 0, 3);
  state.rgLogMin = qgaClamp(state.rgLogMin, -12, 30);
  state.rgLogMax = qgaClamp(state.rgLogMax, -12, 30);
  if (state.rgLogMax - state.rgLogMin < 0.5) {
    state.rgLogMin = QGA_DEFAULT_STATE.rgLogMin; state.rgLogMax = QGA_DEFAULT_STATE.rgLogMax;
  }
  state.rgMu0 = qgaClamp(state.rgMu0, state.rgLogMin, state.rgLogMax);
  state.rgCurrent = qgaClamp(state.rgCurrent, state.rgLogMin, state.rgLogMax);
  return state;
}
function qgaStateSearch(state) {
  const params = new URLSearchParams();
  for (const [key, param] of Object.entries(QGA_STATE_KEYS)) {
    if (state[key] !== QGA_DEFAULT_STATE[key]) params.set(param, String(state[key]));
  }
  const query = params.toString();
  return query ? "?" + query : "";
}
function qgaWriteState(state, { replace = true } = {}) {
  window.history[replace ? "replaceState" : "pushState"](
    { qga: { ...state } }, "", window.location.pathname + qgaStateSearch(state) + window.location.hash
  );
  queueMicrotask(() => window.dispatchEvent(new CustomEvent("qga-statechange", { detail: { ...state } })));
}
function qgaShareUrl(state) { return new URL(qgaStateSearch(state), window.location.href).href; }
async function qgaCopyLink(state) {
  const url = qgaShareUrl(state);
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
  else {
    const input = document.createElement("textarea");
    input.value = url; input.style.position = "fixed"; document.body.appendChild(input); input.select();
    if (!document.execCommand("copy")) { input.remove(); throw new Error("Clipboard access is unavailable."); }
    input.remove();
  }
  return url;
}
function qgaExportJson(state, extra = {}) {
  const metadata = state.view === "gr" ? {
    model: {
      id: "flat-spacetime-causal-lab",
      status: "established-special-relativity",
      dimensionality: "1+1",
      convention: "Minkowski metric (-,+,+,+); diagram units c=1",
      scope: "inertial frames plus an explicitly schematic piecewise-inertial twin path",
    },
    provenance: {
      implementation: "js/physics.mjs mirrored by js/physics.jsx",
      references: ["Misner, Thorne & Wheeler (1973)", "Wald (1984)"],
    },
  } : state.view === "rg" ? (() => {
    const parameters = { nf: state.rgNf, a: state.rgA, b: state.rgB, gStar: state.rgGStar };
    const ln10 = Math.log(10);
    const integration = window.QGA_PHYSICS.integrateRGFlow({
      model: state.rgModel, g0: state.rgG0, t0: 0,
      tMin: (state.rgLogMin - state.rgMu0) * ln10,
      tMax: (state.rgLogMax - state.rgMu0) * ln10,
      step: 0.02, parameters,
    });
    return {
      model: {
        id: state.rgModel, preset: state.rgPreset, presetOrigin: state.rgPresetOrigin || state.rgPreset,
        status: state.rgModel === "asymptotic-safety" || state.rgPresetOrigin === "asymptotic-safety"
          ? "conjectural-illustrative-toy"
          : ["gaussian", "linear"].includes(state.rgModel) ? "pedagogical-toy" : "one-loop-perturbative",
        equation: "dg/dln(mu) = beta(g)", alphaConvention: "alpha = g^2/(4 pi)",
        qedConvention: "nf unit-charge Dirac fermions; beta(e)=nf e^3/(12 pi^2)",
        qcdConvention: "SU(3), b0=11-2 nf/3; beta(g)=-b0 g^3/(16 pi^2)",
        parameters,
      },
      numerics: {
        method: integration.method, stepInNaturalLogScale: integration.step,
        fixedPointTolerance: 1e-9, couplingBoundary: integration.gLimit,
        infrared: integration.infrared.status, ultraviolet: integration.ultraviolet.status,
      },
      validity: {
        boundary: "alpha = 1 is used as a perturbative/strong-coupling display boundary",
        qedLandauPole: "formal one-loop extrapolation, not an observation",
        qcdInfrared: "one-loop perturbation theory is not valid in the strong-coupling regime",
        asymptoticSafety: "illustrative toy flow; not evidence for quantum-gravity asymptotic safety",
      },
      fixedPoints: window.QGA_PHYSICS.rgFixedPoints(state.rgModel, parameters),
      provenance: {
        implementation: "js/physics.mjs mirrored by js/physics.jsx",
        references: ["Gross & Wilczek (1973)", "Politzer (1973)", "Peskin & Schroeder (1995)", "Weinberg (1979)"],
      },
    };
  })() : {};
  const payload = { schema: "horizon-qga-state/v1", exportedAt: new Date().toISOString(),
    source: qgaShareUrl(state), state: { ...state }, ...metadata, ...extra };
  const href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json" }));
  const a = document.createElement("a"); a.href = href; a.download = "horizon-qga-state.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(href), 0); return payload;
}

/* URL/history state, reproducibility controls, sharing, and bounded GWOSC access. */
const QGA_DEFAULT_STATE = {
  view: "overview", pathway: "student", bhMass: 1, bhSpin: 0,
  bhStateVersion: 2, bhInclination: 75, bhObserverDistance: 40, bhDiskModel: "page-thorne-turbulent",
  bhRenderQuality: "balanced", bhExposure: 0, bhAnnotations: false, bhCorona: true, bhJets: true,
  gwMode: "generated", gwEvent: "GW150914", gwDetector: "H1",
  gwStart: 1126259446, gwDuration: 16, gwM1: 36, gwM2: 29, seed: 42,
  gwAudioMode: "original", gwPitch: 1, gwVolume: 0.7, gwLoop: false,
  qftProcess: "s-channel", qftSqrtS: 10, qftAngle: 0, qftPhotonX: 0.5,
  grPreset: "timelike", grBeta: 0.35, grAt: 0, grAx: -1.35, grBt: 2.6, grBx: 1.1,
  rgPreset: "qcd", rgPresetOrigin: "qcd", rgModel: "qcd", rgG0: 1.218, rgMu0: 2, rgLogMin: -1, rgLogMax: 8,
  rgNf: 5, rgA: 1, rgB: 1, rgGStar: 1, rgCurrent: 2,
  qftLabMode: "field", qftLabMass: 1, hawkingLabAmplify: 12,
  adsLabLinks: 5, adsLabRegion: 0.5, colliderChannel: "h2gg", spinFoamJMax: 2, spinFoamMode: "network",
};
const QGA_STATE_KEYS = {
  view: "view", pathway: "pathway", bhMass: "bhm", bhSpin: "bhs",
  bhStateVersion: "bhv", bhInclination: "bhi", bhObserverDistance: "bhd", bhDiskModel: "bhdm",
  bhRenderQuality: "bhq", bhExposure: "bhe", bhAnnotations: "bha", bhCorona: "bhc", bhJets: "bhj",
  gwMode: "gwm", gwEvent: "gwe", gwDetector: "gwd", gwStart: "gws",
  gwDuration: "gwt", gwM1: "gwm1", gwM2: "gwm2", seed: "seed",
  gwAudioMode: "gwam", gwPitch: "gwp", gwVolume: "gwv", gwLoop: "gwl",
  qftProcess: "qfp", qftSqrtS: "qfs", qftAngle: "qfa", qftPhotonX: "qfx",
  grPreset: "grp", grBeta: "grb", grAt: "grat", grAx: "grax", grBt: "grbt", grBx: "grbx",
  rgPreset: "rgp", rgPresetOrigin: "rgpo", rgModel: "rgm", rgG0: "rgg", rgMu0: "rgmu", rgLogMin: "rglo",
  rgLogMax: "rghi", rgNf: "rgnf", rgA: "rga", rgB: "rgb", rgGStar: "rggs", rgCurrent: "rgc",
  qftLabMode: "qftm", qftLabMass: "qftms", hawkingLabAmplify: "hla",
  adsLabLinks: "aln", adsLabRegion: "alr", colliderChannel: "clc", spinFoamJMax: "sfj", spinFoamMode: "sfm",
};
const qgaClamp = (value, min, max) => Math.min(max, Math.max(min, value));
const QGA_ENUMS = {
  view: ["overview", "sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp", "glossary", "symbols", "refs", "open", "paper"],
  pathway: ["beginner", "student", "advanced"], gwMode: ["generated", "real"], gwDetector: ["H1", "L1", "V1"],
  gwAudioMode: ["original", "shifted"],
  qftProcess: ["s-channel", "t-channel", "compton"], grPreset: ["timelike", "spacelike", "null", "simultaneity", "twin", "custom"],
  rgPreset: ["qed", "qcd", "gaussian", "uv-toy", "ir-toy", "asymptotic-safety", "custom"],
  rgPresetOrigin: ["qed", "qcd", "gaussian", "uv-toy", "ir-toy", "asymptotic-safety"],
  rgModel: ["qed", "qcd", "gaussian", "linear", "asymptotic-safety"],
  bhDiskModel: ["page-thorne-turbulent", "page-thorne", "page-thorne-opaque", "newtonian"],
  bhRenderQuality: ["performance", "balanced", "ultra"],
  qftLabMode: ["field", "correlation", "flux"],
  colliderChannel: ["h2gg", "z2mm", "z2ee", "ttbar", "qcd"], spinFoamMode: ["network", "foam"],
};
const QGA_NUMBERS = ["bhMass", "bhSpin", "bhStateVersion", "bhInclination", "bhObserverDistance", "bhExposure", "gwStart", "gwDuration", "gwM1", "gwM2", "seed", "gwPitch", "gwVolume", "qftSqrtS", "qftAngle", "qftPhotonX", "grBeta", "grAt", "grAx", "grBt", "grBx", "rgG0", "rgMu0", "rgLogMin", "rgLogMax", "rgNf", "rgA", "rgB", "rgGStar", "rgCurrent", "qftLabMass", "hawkingLabAmplify", "adsLabLinks", "adsLabRegion", "spinFoamJMax"];
// Unversioned and v1 Kerr links retain the smooth disk/annotation defaults.
// New black-hole links carry bhv=2, making the turbulent default unambiguous.
// The Prompt 05 volume keys (bhCorona, bhJets) are additive with safe
// defaults: links without them render exactly as before they existed.
const QGA_KERR_KEYS = ["bhInclination", "bhObserverDistance", "bhDiskModel", "bhRenderQuality", "bhExposure", "bhAnnotations", "bhCorona", "bhJets"];
const QGA_KERR_V1_DEFAULTS = { bhDiskModel: "page-thorne", bhAnnotations: true };
function qgaReadState(search = window.location.search) {
  const params = new URLSearchParams(search), state = { ...QGA_DEFAULT_STATE };
  const version = params.has(QGA_STATE_KEYS.bhStateVersion)
    ? Number(params.get(QGA_STATE_KEYS.bhStateVersion))
    : params.get(QGA_STATE_KEYS.view) === "bh" ? 1 : QGA_DEFAULT_STATE.bhStateVersion;
  if (version === 1) Object.assign(state, QGA_KERR_V1_DEFAULTS);
  for (const [key, param] of Object.entries(QGA_STATE_KEYS)) {
    const raw = params.get(param); if (raw == null) continue;
    if (QGA_ENUMS[key]?.includes(raw)) state[key] = raw;
    else if (key === "gwEvent") state[key] = raw;
    else if (key === "bhAnnotations" || key === "bhCorona" || key === "bhJets" || key === "gwLoop") {
      if (raw === "true" || raw === "false") state[key] = raw === "true";
    }
    else if (QGA_NUMBERS.includes(key) && Number.isFinite(Number(raw))) state[key] = Number(raw);
  }
  if (version === 1) state.bhStateVersion = 1;
  else if (version !== QGA_DEFAULT_STATE.bhStateVersion) {
    for (const key of QGA_KERR_KEYS) state[key] = QGA_DEFAULT_STATE[key];
    state.bhStateVersion = QGA_DEFAULT_STATE.bhStateVersion;
  }
  if (!params.has(QGA_STATE_KEYS.view)) {
    try {
      const legacyView = localStorage.getItem("qga-view");
      if (QGA_ENUMS.view.includes(legacyView)) state.view = legacyView;
    } catch (e) {}
  }
  state.bhMass = qgaClamp(state.bhMass, 0, 9); state.bhSpin = qgaClamp(state.bhSpin, -0.998, 0.998);
  state.bhInclination = qgaClamp(state.bhInclination, 3, 89);
  state.bhObserverDistance = qgaClamp(state.bhObserverDistance, 12, 120);
  state.bhExposure = qgaClamp(state.bhExposure, -3, 3);
  state.gwStart = qgaClamp(Math.round(state.gwStart), 1126259000, 1126260000);
  state.gwDuration = qgaClamp(Math.round(state.gwDuration), 1, 32); state.seed = Math.trunc(state.seed) || 42;
  state.gwM1 = qgaClamp(Math.round(state.gwM1), 5, 200); state.gwM2 = qgaClamp(Math.round(state.gwM2), 5, 200);
  state.gwEvent = /^[A-Za-z0-9_-]{3,40}$/.test(state.gwEvent) ? state.gwEvent : QGA_DEFAULT_STATE.gwEvent;
  // GW instrument (Prompt 06): playback-shaping keys, additive with safe
  // defaults; audio is never enabled by a URL, only by an in-page gesture.
  state.gwPitch = qgaClamp(state.gwPitch, 0.25, 4);
  state.gwVolume = qgaClamp(state.gwVolume, 0, 1);
  state.qftSqrtS = qgaClamp(state.qftSqrtS, 1, 200);
  state.qftAngle = qgaClamp(state.qftAngle, -1, 1);
  state.qftPhotonX = qgaClamp(state.qftPhotonX, 0.05, 20);
  // Prompt 07 compute labs: additive keys with safe defaults.
  state.qftLabMass = qgaClamp(state.qftLabMass, 0, 3);
  state.hawkingLabAmplify = qgaClamp(state.hawkingLabAmplify, 1, 1000);
  // Prompt 08 labs: additive keys with safe defaults.
  state.adsLabLinks = qgaClamp(Math.round(state.adsLabLinks), 0, 12);
  state.adsLabRegion = qgaClamp(state.adsLabRegion, 0.1, 0.9);
  state.spinFoamJMax = qgaClamp(Math.round(state.spinFoamJMax), 1, 4);
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
  const defaults = state.bhStateVersion === 1
    ? { ...QGA_DEFAULT_STATE, ...QGA_KERR_V1_DEFAULTS }
    : QGA_DEFAULT_STATE;
  for (const [key, param] of Object.entries(QGA_STATE_KEYS)) {
    if (key === "bhStateVersion") continue;
    if (state[key] !== defaults[key]) params.set(param, String(state[key]));
  }
  if (state.view === "bh" || QGA_KERR_KEYS.some((key) => params.has(QGA_STATE_KEYS[key]))) {
    params.set(QGA_STATE_KEYS.bhStateVersion, String(state.bhStateVersion === 1 ? 1 : QGA_DEFAULT_STATE.bhStateVersion));
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
  })() : state.view === "bh" && window.QGA_KERR ? window.QGA_KERR.kerrExportMetadata(state, window.__qgaKerrRuntime || {})
    : state.view === "exp" && window.QGA_GW ? window.QGA_GW.INSTRUMENT.gwInstrumentExportMetadata(state, window.__qgaGwRuntime || {}) : {};
  // Prompt 07 compute labs: attach the active lab's provenance + runtime stats.
  // Prompt 08: the black-hole view hosts both the Hawking and AdS labs; the
  // AdS branch is additive and only fires when its scene is actually mounted.
  const labMetadata = !window.QGA_LABS ? {}
    : state.view === "qft" ? window.QGA_LABS.qftFieldExportMetadata(state, window.__qgaQftLab || {})
    : state.view === "bh" ? {
      ...window.QGA_LABS.hawkingExportMetadata(state, window.__qgaHawkingLab || {}),
      ...(window.__qgaAdsLab
        ? window.QGA_LABS.adsExportMetadata(state, window.__qgaAdsLab) : {}),
    }
    : state.view === "rg" ? window.QGA_LABS.rgFlow3dExportMetadata(state, window.__qgaRgFlow3d || {})
    : state.view === "approaches" ? window.QGA_LABS.adsExportMetadata(state, window.__qgaAdsLab || {})
    : state.view === "sm" || state.view === "exp" ? window.QGA_LABS.colliderExportMetadata(state, window.__qgaColliderLab || {})
    : state.view === "planck" ? window.QGA_LABS.spinFoamExportMetadata(state, window.__qgaSpinFoamLab || {})
    : {};
  const payload = { schema: "horizon-qga-state/v1", exportedAt: new Date().toISOString(),
    source: qgaShareUrl(state), state: { ...state }, ...metadata, ...labMetadata, ...extra };
  const href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json" }));
  const a = document.createElement("a"); a.href = href; a.download = "horizon-qga-state.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(href), 0); return payload;
}

/* URL/history state, reproducibility controls, sharing, and bounded GWOSC access. */
const QGA_DEFAULT_STATE = {
  view: "overview", pathway: "student", bhMass: 1, bhSpin: 0,
  gwMode: "generated", gwEvent: "GW150914", gwDetector: "H1",
  gwStart: 1126259446, gwDuration: 16, seed: 42,
};
const QGA_STATE_KEYS = {
  view: "view", pathway: "pathway", bhMass: "bhm", bhSpin: "bhs",
  gwMode: "gwm", gwEvent: "gwe", gwDetector: "gwd", gwStart: "gws",
  gwDuration: "gwt", seed: "seed",
};
const qgaClamp = (value, min, max) => Math.min(max, Math.max(min, value));
const QGA_ENUMS = {
  view: ["overview", "sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp", "glossary", "refs", "open"],
  pathway: ["beginner", "student", "advanced"], gwMode: ["generated", "real"], gwDetector: ["H1", "L1", "V1"],
};
const QGA_NUMBERS = ["bhMass", "bhSpin", "gwStart", "gwDuration", "seed"];
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
  state.gwEvent = /^[A-Za-z0-9_-]{3,40}$/.test(state.gwEvent) ? state.gwEvent : QGA_DEFAULT_STATE.gwEvent;
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
  const payload = { schema: "horizon-qga-state/v1", exportedAt: new Date().toISOString(),
    source: qgaShareUrl(state), state: { ...state }, ...extra };
  const href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json" }));
  const a = document.createElement("a"); a.href = href; a.download = "horizon-qga-state.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(href), 0); return payload;
}

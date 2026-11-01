/**
 * Lab report (S32).
 *
 * A report is what a reader keeps after the session: the state that produced the numbers, the formulas that were
 * open, the readouts, the assumptions and the references. It is built as data here and printed by the browser's own
 * print pipeline (`@media print` plus a preview route), because the alternative — bundling a PDF writer — would add a
 * multi-megabyte dependency to a site whose whole constraint is "no bundler, nothing but self-hosted files".
 *
 * The structure below is deliberately the same shape as a paper's methods section, so a reader can see what is
 * claimed, on what model, and with what validity limits.
 */

import { ExportError, utcTimestamp } from "./export-service.mjs";

/** Build the report document model. Pure: no DOM, so the same report is testable and printable. */
export function buildLabReport({
  title = "HORIZON lab report",
  view = "overview",
  viewTitle = "Atlas overview",
  state = {},
  settings = {},
  backend = "unknown",
  quality = "unknown",
  provenance = null,
  references = [],
  formulas = [],
  readouts = [],
  screenshots = [],
  seed = 42,
  commitHash = null,
  when = new Date(),
  notes = [],
} = {}) {
  if (!Array.isArray(readouts)) throw new ExportError("not-supported", "report readouts must be an array");
  const report = {
    schema: "horizon-qga-lab-report/v1",
    title,
    view,
    viewTitle,
    generatedAt: utcTimestamp(when),
    applicationVersion: "1.1.0",
    commitHash: commitHash || "not recorded (static deployment)",
    seed: Math.trunc(Number(seed)) || 0,
    backend,
    quality,
    state: JSON.parse(JSON.stringify(state)),
    settings: JSON.parse(JSON.stringify(settings)),
    provenance: provenance ? {
      id: provenance.id,
      status: provenance.status,
      model: provenance.model ?? null,
      assumptions: Array.isArray(provenance.assumptions) ? [...provenance.assumptions] : [],
      validity: Array.isArray(provenance.validity) ? [...provenance.validity] : [],
      numericalMethod: provenance.numericalMethod ?? null,
    } : null,
    references: references.map(String),
    formulas: formulas.map((formula) => ({
      id: formula.id ?? null,
      title: formula.title ?? null,
      tex: formula.tex ?? null,
      status: formula.status ?? null,
    })),
    readouts: readouts.map((readout) => ({
      label: String(readout.label ?? ""),
      value: readout.value ?? null,
      unit: readout.unit ?? null,
      note: readout.note ?? null,
      status: readout.status ?? null,
    })),
    screenshots: screenshots.map((shot) => ({
      src: String(shot.src ?? ""),
      caption: String(shot.caption ?? ""),
      provenanceId: shot.provenanceId ?? null,
      capturedAt: shot.capturedAt ?? null,
    })),
    notes: notes.map(String),
  };
  // A report with no readout and no screenshot is a blank page with a timestamp; refuse rather than print it.
  if (report.readouts.length === 0 && report.screenshots.length === 0 && report.formulas.length === 0) {
    throw new ExportError("not-supported", "A lab report needs at least one readout, formula or screenshot.");
  }
  return report;
}

/**
 * The state as a two-column table, sorted by key so two reports diff cleanly.
 *
 * The view's own parameters come first and the rest follow as a compact reference block: a report whose first page is
 * 60 rows of every unrelated module's parameters buries the numbers it exists to document. `primary` lists the keys
 * the caller considers this view's subject; everything else is still present, just after them.
 */
export function reportStateRows(state = {}, { primary = [] } = {}) {
  const keys = Object.keys(state);
  const ordered = [
    ...primary.filter((key) => Object.prototype.hasOwnProperty.call(state, key)),
    ...keys.filter((key) => !primary.includes(key)).sort(),
  ];
  return ordered.map((key) => {
    const value = state[key];
    return {
      key,
      primary: primary.includes(key),
      value: Array.isArray(value) ? `${value.length} item(s)` : value === null || value === undefined ? "—" : String(value),
    };
  });
}

/** The keys that belong to a view's own subject, so a report leads with what it is about. */
export const REPORT_PRIMARY_KEYS = Object.freeze({
  bh: ["bhMass", "bhSpin", "bhInclination", "bhObserverDistance", "bhDiskModel", "bhRenderQuality", "hawkingLabAmplify"],
  exp: ["gwEvent", "gwDetector", "gwMode", "gwStart", "gwDuration", "gwM1", "gwM2", "gwpitch"],
  rg: ["rgPreset", "rgModel", "rgG0", "rgMu0", "rgNf", "rgLogMin", "rgLogMax"],
  gr: ["grPreset", "grBeta", "grAt", "grAx", "grBt", "grBx"],
  qft: ["qftProcess", "qftSqrtS", "qftAngle", "qftLabMode", "qftLabMass"],
  planck: ["colliderChannel", "spinFoamJMax", "spinFoamMode"],
  overview: ["view", "pathway", "seed"],
});

/** A plain-text rendition of the report, for the clipboard and for a test that does not want to parse HTML. */
export function reportPlainText(report) {
  if (!report) throw new ExportError("not-supported", "No report was provided.");
  const lines = [
    report.title,
    `${report.viewTitle} (${report.view}) · ${report.generatedAt}`,
    `version ${report.applicationVersion} · commit ${report.commitHash} · seed ${report.seed}`,
    `backend ${report.backend} · quality ${report.quality}`,
    "",
    "State",
    ...reportStateRows(report.state).map((row) => `  ${row.key} = ${row.value}`),
  ];
  if (report.provenance) {
    lines.push("", `Provenance: ${report.provenance.id} (${report.provenance.status})`);
    if (report.provenance.model) lines.push(`  model: ${report.provenance.model}`);
    for (const assumption of report.provenance.assumptions) lines.push(`  assumption: ${assumption}`);
    for (const limit of report.provenance.validity) lines.push(`  validity: ${limit}`);
    if (report.provenance.numericalMethod) lines.push(`  method: ${report.provenance.numericalMethod}`);
  }
  if (report.formulas.length) {
    lines.push("", "Formulas");
    for (const formula of report.formulas) lines.push(`  ${formula.title ?? formula.id}: ${formula.tex ?? "(no TeX)"}`);
  }
  if (report.readouts.length) {
    lines.push("", "Readouts");
    for (const readout of report.readouts) {
      lines.push(`  ${readout.label}: ${readout.value ?? "—"}${readout.unit ? ` ${readout.unit}` : ""}${readout.status ? ` [${readout.status}]` : ""}`);
    }
  }
  if (report.screenshots.length) {
    lines.push("", "Figures");
    for (const shot of report.screenshots) lines.push(`  ${shot.caption} (${shot.src})${shot.provenanceId ? ` [${shot.provenanceId}]` : ""}`);
  }
  if (report.references.length) {
    lines.push("", "References");
    report.references.forEach((reference, index) => lines.push(`  [${index + 1}] ${reference}`));
  }
  if (report.notes.length) {
    lines.push("", "Notes");
    for (const note of report.notes) lines.push(`  ${note}`);
  }
  lines.push("", "No quantum gravity theory is experimentally confirmed; every figure carries its scientific status.");
  return lines.join("\n");
}

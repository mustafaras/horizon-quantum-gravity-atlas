/**
 * The shared export contract (S32).
 *
 * Every artefact this directory produces — a PNG, an SVG, a CSV, a share card, a lab report — carries the same
 * provenance envelope. That is the whole point of the studio: a file that leaves the atlas must be able to say what
 * it is, how it was made and what it is not, without the reader having to find the page again.
 *
 * Pure: no DOM, no React, no canvas, no three.js. The hashing helper uses WebCrypto in the browser and `node:crypto` in
 * Node, because both are already available in the environments this code runs in and neither is a new dependency.
 */

export const EXPORT_SCHEMA = "horizon-qga-export/v1";

export const EXPORT_VERSION = "1.1.0";

/** The display-scale factors the atlas applies that a reader cannot recover from the picture alone. */
export const DISPLAY_AMPLIFICATIONS = Object.freeze({
  hawkingLab: "The Hawking lab's flux is multiplied by hawkingLabAmplify (default 12). The factor is stated in the readout, not applied to the physics.",
  gwSonification: "The gravitational-wave audio is pitch-shifted by gwPitch into the audible band; the strain itself is untouched.",
  exposure: "The Kerr observatory's exposure is an EV display offset, not a change in the ray-traced radiance.",
  toneMapping: "The render pipeline applies AgX (or neutral) tone mapping; both are display transforms, and neither changes a plotted number.",
});

const isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/** ISO-8601 in UTC, the only timestamp format the exports carry. */
export function utcTimestamp(when = new Date()) {
  const date = when instanceof Date ? when : new Date(when);
  if (Number.isNaN(date.getTime())) throw new TypeError("utcTimestamp needs a valid Date");
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * `2026-10-31T16-15-02Z`: a filename-safe UTC timestamp that sorts lexically in UTC order.
 *
 * The `Z` and the `T` are kept because they are ISO-8601's own designators and every tool reads them; every other part
 * of a file name this module builds is lowercase, and `isPortableFileName` is what says so.
 */
export function fileTimestamp(when = new Date()) {
  return utcTimestamp(when).replace(/:/g, "-");
}

/**
 * A deterministic, portable file name: `horizon-<view>-<kind>-<stamp>.<ext>`.
 *
 * Portable means lowercase, no spaces, no characters a Windows, macOS or Linux filesystem disagrees about, and no
 * leading dot. The stamp makes two exports of the same view distinguishable without making the name random.
 */
export function exportFileName({ view = "atlas", kind = "export", ext = "png", when = new Date(), suffix = "" } = {}) {
  const slug = (value) => String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "atlas";
  const extension = String(ext).toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const tail = suffix ? `-${slug(suffix)}` : "";
  // The timestamp keeps its uppercase Z so the name still reads as UTC; the slug parts are lowercase, which is what
  // makes the name sortable and portable. The whole name is therefore matched case-insensitively by tools.
  return `horizon-${slug(view)}-${slug(kind)}${tail}-${fileTimestamp(when)}.${extension}`;
}

/**
 * Whether a string is a portable file name: a lowercase slug, an ISO UTC stamp, a short lowercase extension, and no
 * character a filesystem treats specially. The stamp's `T` and `Z` are the only uppercase letters allowed.
 */
export function isPortableFileName(name) {
  return typeof name === "string"
    && !/\s/.test(name)
    && /^[a-z0-9][a-z0-9-]*(-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)?(-[a-z0-9-]+)?\.[a-z0-9]{1,5}$/.test(name);
}

/**
 * Build the provenance envelope every export embeds.
 *
 * `state` is carried verbatim: the export contract says a reader can reproduce the file from its own metadata, and a
 * pruned state breaks that promise. Values are validated for JSON-safety rather than for physics — the physics was
 * validated where it was computed.
 */
export function buildExportEnvelope({
  view = "overview",
  kind = "export",
  state = {},
  settings = {},
  backend = "unknown",
  quality = "unknown",
  provenance = null,
  references = [],
  seed = 42,
  commitHash = null,
  applicationVersion = EXPORT_VERSION,
  deterministic = {},
  amplification = [],
  extras = {},
  when = new Date(),
} = {}) {
  if (!isPlainObject(state)) throw new TypeError("export state must be an object");
  if (!Array.isArray(references)) throw new TypeError("export references must be an array");
  if (!Array.isArray(amplification)) throw new TypeError("export amplification must be an array");
  const envelope = {
    schema: EXPORT_SCHEMA,
    applicationVersion,
    commitHash: typeof commitHash === "string" && commitHash ? commitHash : "not recorded (static deployment)",
    exportedAt: utcTimestamp(when),
    view,
    kind,
    state: JSON.parse(JSON.stringify(state)),
    settings: JSON.parse(JSON.stringify(settings)),
    backend,
    quality,
    seed: Math.trunc(Number(seed)) || 0,
    provenance: provenance ?? null,
    references: references.map(String),
    amplification: amplification.map(String),
    deterministic: { ...deterministic },
    ...extras,
  };
  // A caller that forgot a status would publish a file that cannot be judged. Fail here, not at the edge.
  if (envelope.provenance && typeof envelope.provenance === "object") {
    if (!envelope.provenance.id) throw new TypeError("export provenance needs an id");
    if (!envelope.provenance.status) throw new TypeError("export provenance needs a status");
  }
  return JSON.parse(JSON.stringify(envelope));
}

/**
 * SHA-256 of a byte string or text, as lowercase hex.
 *
 * Uses WebCrypto where it exists and `node:crypto` otherwise, so the same function hashes the CSV in a browser export
 * and in the test that proves the sidecar agrees with the file.
 */
export async function sha256Hex(input) {
  const bytes = typeof input === "string"
    ? new TextEncoder().encode(input)
    : input instanceof Uint8Array ? input
    : new Uint8Array(input);
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const digest = await subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(bytes).digest("hex");
}

/** Pretty-printed JSON with a trailing newline: a sidecar a human can read in a diff. */
export function sidecarJson(payload) {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

/**
 * The sidecar for a figure: the envelope plus the hash of the exact CSV that ships beside it.
 *
 * The hash is taken over the CSV bytes as written, not over the numbers, so a changed column order or a changed line
 * ending is visible too — that is what makes the pair verifiable rather than merely consistent-looking.
 */
export async function buildFigureSidecar({ envelope, csv, figureId, widthMm, style }) {
  if (typeof csv !== "string" || csv.length === 0) throw new TypeError("a figure sidecar needs the CSV it describes");
  const sha = await sha256Hex(csv);
  return {
    ...envelope,
    kind: "figure",
    figure: { id: figureId, widthMm, style },
    data: { format: "text/csv;charset=utf-8", bytes: new TextEncoder().encode(csv).length, sha256: sha },
  };
}

/* ---------- failure surface ---------- */

export const EXPORT_ERROR_CODES = Object.freeze([
  "unsupported-mime",
  "codec-unavailable",
  "memory-guard",
  "canvas-tainted",
  "cancelled",
  "not-supported",
]);

/**
 * One error type for every way an export can fail, so the studio can list the reason instead of guessing.
 *
 * The message is written for a reader of the page, not for a stack trace: "this browser cannot record WebM" is
 * actionable, "NotSupportedError" is not.
 */
export class ExportError extends Error {
  constructor(code, message, details = {}) {
    if (!EXPORT_ERROR_CODES.includes(code)) throw new TypeError(`unknown export error code "${code}"`);
    super(message);
    this.name = "ExportError";
    this.code = code;
    this.details = { ...details };
  }
}

/** Whether a MIME type is one the browser will actually record, asked of the browser rather than assumed. */
export function pickSupportedMime(candidates, isSupported = () => false) {
  for (const candidate of candidates) {
    try {
      if (isSupported(candidate)) return candidate;
    } catch (error) {
      // A browser that throws on a MIME probe has simply answered "no" more loudly.
    }
  }
  return null;
}

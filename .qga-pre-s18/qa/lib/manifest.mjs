// Shared capture-manifest loader: schema validation, default resolution,
// URL-state cross-checks against js/state.jsx, and structural invariants.
// Used by qa/verify-manifest.mjs, qa/capture.mjs, and the Playwright specs.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateAgainstSchema } from "./jsonschema.mjs";

export const MANIFEST_PATH = "qa/manifest.json";
export const SCHEMA_PATH = "qa/manifest.schema.json";

async function readJson(root, rel) {
  const raw = await readFile(path.join(root, rel), "utf8");
  return JSON.parse(raw);
}

/** Extract the canonical state-key table from js/state.jsx (source of truth). */
export async function readStateKeys(root) {
  const src = await readFile(path.join(root, "js/state.jsx"), "utf8");
  const match = src.match(/QGA_STATE_KEYS\s*=\s*\{([\s\S]*?)\};/);
  if (!match) throw new Error("QGA_STATE_KEYS not found in js/state.jsx");
  const keys = {};
  for (const m of match[1].matchAll(/(\w+):\s*"(\w+)"/g)) keys[m[1]] = m[2];
  return keys;
}

/** Extract the view registry from js/app.jsx (source of truth for the view enum). */
export async function readViewIds(root) {
  const src = await readFile(path.join(root, "js/app.jsx"), "utf8");
  const match = src.match(/QGA_VIEWS\s*=\s*\{([\s\S]*?)\};/);
  if (!match) throw new Error("QGA_VIEWS not found in js/app.jsx");
  return [...match[1].matchAll(/^\s{2}(\w+):\s*\{/gm)].map((m) => m[1]);
}

function checkUrlParams(capture, stateKeys, errors) {
  const query = capture.url.startsWith("?") ? capture.url.slice(1) : capture.url;
  if (!query) return;
  const known = new Set(Object.values(stateKeys));
  for (const pair of query.split("&")) {
    const key = pair.split("=")[0];
    if (!known.has(key)) {
      errors.push(`${capture.id}: unknown URL state key "${key}" (not in QGA_STATE_KEYS)`);
    }
  }
}

/**
 * Load and fully validate the manifest.
 * Returns { manifest, captures } where captures have defaults resolved.
 * Throws with the full error list when anything is invalid.
 */
export async function loadManifest(root) {
  const errors = [];
  const [manifest, schema] = await Promise.all([
    readJson(root, MANIFEST_PATH),
    readJson(root, SCHEMA_PATH),
  ]);

  errors.push(...validateAgainstSchema(manifest, schema));

  const stateKeys = await readStateKeys(root);
  const viewIds = await readViewIds(root);

  // Manifest's mirrored stateKeys table must match js/state.jsx exactly.
  const mirrored = manifest.app?.stateKeys ?? {};
  for (const [k, v] of Object.entries(stateKeys)) {
    if (mirrored[k] !== v) errors.push(`app.stateKeys.${k}: manifest has ${JSON.stringify(mirrored[k])}, js/state.jsx has ${JSON.stringify(v)}`);
  }
  for (const k of Object.keys(mirrored)) {
    if (!(k in stateKeys)) errors.push(`app.stateKeys.${k}: present in manifest but not in js/state.jsx`);
  }

  const seenIds = new Set();
  const seenFiles = new Set();
  const captures = (manifest.captures ?? []).map((c) => {
    if (seenIds.has(c.id)) errors.push(`duplicate capture id "${c.id}"`);
    if (seenFiles.has(c.file)) errors.push(`duplicate capture file "${c.file}"`);
    seenIds.add(c.id);
    seenFiles.add(c.file);

    if (!viewIds.includes(c.view)) {
      errors.push(`${c.id}: view "${c.view}" not in QGA_VIEWS registry`);
    }
    if (c.scope === "element" && !c.target) {
      errors.push(`${c.id}: scope "element" requires a target selector`);
    }
    checkUrlParams(c, stateKeys, errors);

    const d = manifest.defaults ?? {};
    return {
      ...c,
      viewport: c.viewport ?? d.viewport,
      motion: c.motion ?? d.motion,
      pathway: c.pathway ?? d.pathway,
      seed: c.seed ?? d.seed,
      readiness: c.readiness ?? d.readiness,
      timeoutMs: c.timeoutMs ?? d.timeoutMs ?? 45000,
      settleMs: c.settleMs ?? 4000,
    };
  });

  if (errors.length) {
    const err = new Error(`manifest validation failed with ${errors.length} error(s)`);
    err.errors = errors;
    throw err;
  }
  return { manifest, captures };
}

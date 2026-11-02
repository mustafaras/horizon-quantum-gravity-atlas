#!/usr/bin/env node
// qa/verify-manifest.mjs — validates the capture manifest end to end:
//   1. JSON Schema conformance (qa/manifest.schema.json)
//   2. state-key and view-registry parity with js/state.jsx and js/app.jsx
//   3. every capture file exists on disk
//   4. README.md and docs/guide/*.md cross-references in both directions
// Exit code 0 = valid, 1 = invalid (full error list printed).

import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadManifest } from "./lib/manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const errors = [];
  let captures = [];
  try {
    ({ captures } = await loadManifest(root));
  } catch (err) {
    errors.push(...(err.errors ?? [String(err.message ?? err)]));
  }

  if (captures.length) {
    // Since S35 the README shows the chapter covers and the screenshot gallery lives in docs/guide/, which refers to
    // the same files as ../screenshots/. `readme: true` means "shown in the README or the guide".
    const guideDir = path.join(root, "docs", "guide");
    const surface = ["README.md", ...(await readdir(guideDir)).filter((f) => f.endsWith(".md")).map((f) => `docs/guide/${f}`)];
    const texts = await Promise.all(surface.map((rel) => readFile(path.join(root, rel), "utf8")));
    const readmeRefs = new Set(
      texts.flatMap((text) => [...text.matchAll(/(?:docs\/|\.\.\/)screenshots\/([\w.-]+\.png)/g)].map((m) => m[1]))
    );

    for (const c of captures) {
      const rel = c.file;
      await access(path.join(root, rel)).catch(() => errors.push(`${c.id}: file missing on disk: ${rel}`));
      const name = path.basename(rel);
      const inReadme = readmeRefs.has(name);
      if (c.readme === true && !inReadme) {
        errors.push(`${c.id}: readme:true but ${rel} is not referenced in README.md or docs/guide`);
      }
      if (c.readme === false && inReadme) {
        errors.push(`${c.id}: readme:false but ${rel} is referenced in README.md or docs/guide`);
      }
    }

    // Reverse direction: every screenshot the README shows must be manifest-backed.
    const manifestFiles = new Set(captures.map((c) => path.basename(c.file)));
    for (const name of readmeRefs) {
      if (!manifestFiles.has(name)) {
        errors.push(`README.md or docs/guide references screenshots/${name} with no manifest capture`);
      }
    }
  }

  if (errors.length) {
    console.error(`✗ capture manifest invalid — ${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✓ capture manifest valid: ${captures.length} captures, schema-conformant, README-consistent`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

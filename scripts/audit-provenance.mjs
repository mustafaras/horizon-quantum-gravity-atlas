// Provenance audit: every captioned figure is registered with a matching status, every citation carries a DOI,
// arXiv id, ADS bibcode or URL, and no figure path calls Math.random.
//
//   node scripts/audit-provenance.mjs
//
// Exit code 1 lists each finding as `kind  file:line  message`. `npm run validate` runs this file. The scene-object
// layer check needs a browser and lives in qa/specs/provenance-layers.spec.mjs.

import { registerAllProvenance } from "../js/provenance-index.mjs";
import { listVisualizationProvenance } from "../js/science/provenance.mjs";
import { auditProvenance } from "./lib/provenance-scan.mjs";

registerAllProvenance();
const registry = new Map(listVisualizationProvenance().map(({ id, provenance }) => [id, provenance]));
const findings = await auditProvenance({ registry, root: process.cwd() });

if (findings.length === 0) {
  console.log(`Provenance audit passed: ${registry.size} registered entries, every caption registered, no stray Math.random.`);
} else {
  for (const finding of findings) console.error(`${finding.kind}  ${finding.file}:${finding.line}  ${finding.message}`);
  console.error(`Provenance audit failed: ${findings.length} finding(s).`);
  process.exitCode = 1;
}

// What a change needs from the browser job of .github/workflows/quality.yml.
//
//   code    something other than documents changed: run the critical browser QA
//   render  the renderer, three.js, the QA harness, the packages or the workflow changed: also run the native
//           WebGPU boundary test
//
// A documents-only change (the ledger, notes, screenshots) needs neither, and the job then reports success
// without them, so a required "Browser QA" check is still satisfied. Anything unreadable runs everything.

import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const DOCUMENT = [/^docs\//, /\.md$/, /^LICENSE$/, /^CITATION\.cff$/];
const RENDER = [/^js\/render\//, /^vendor\/three\//, /^qa\//, /^package(-lock)?\.json$/, /^\.github\//, /^scripts\/ci\//];
const SCHEDULED = new Set(["schedule", "workflow_dispatch"]);

export function classify(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return { code: true, render: true };
  const code = paths.filter((path) => !DOCUMENT.some((pattern) => pattern.test(path)));
  return { code: code.length > 0, render: code.some((path) => RENDER.some((pattern) => pattern.test(path))) };
}

/** Paths changed by this run: the merge commit against its first parent (a pull request's merge ref or a merge to main). */
function changedPaths(event) {
  if (SCHEDULED.has(event)) return null;
  try {
    return execFileSync("git", ["diff", "--name-only", "HEAD^1", "HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);
  } catch (error) {
    console.error(`browser-scope: cannot read the change list (${error.message}); running everything`);
    return null;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const paths = changedPaths(process.env.EVENT_NAME);
  const scope = classify(paths);
  console.log(`browser-scope: ${paths ? `${paths.length} changed file(s)` : "everything"} -> code=${scope.code} render=${scope.render}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `code=${scope.code}\nrender=${scope.render}\n`);
}

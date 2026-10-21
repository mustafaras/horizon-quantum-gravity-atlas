// Markdown tables for a perf report (the JSON written by collect.mjs).

const cell = (value, digits = 1) => {
  if (value === null || value === undefined) return "null";
  return typeof value === "number" && !Number.isInteger(value) ? value.toFixed(digits) : String(value);
};
const stat = (summary, key) => cell(summary?.[key]);
const kib = (bytes) => (bytes === null || bytes === undefined ? "null" : (bytes / 1024).toFixed(0));

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map((_, i) => (i === 0 ? "---" : "---:")).join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ];
}

export function formatReport(report) {
  const out = [];
  for (const viewport of report.config.viewports) {
    const rows = report.results.filter((r) => r.viewport === viewport.name);
    if (!rows.length) continue;
    out.push(`### ${viewport.name} (${viewport.width}×${viewport.height}, deviceScaleFactor ${viewport.deviceScaleFactor})`, "");
    out.push(...table(
      ["view", "renderers", "programs", "CPU p50 ms", "CPU p95 ms", "GPU p50 ms", "GPU p95 ms", "first frame ms", "JS KiB", "Babel ms", "backends"],
      rows.map((r) => [
        r.view, cell(r.renderers), cell(r.programs?.total),
        stat(r.cpuFrameMs, "p50"), stat(r.cpuFrameMs, "p95"),
        stat(r.gpuFrameMs, "p50"), stat(r.gpuFrameMs, "p95"),
        cell(r.firstFrameMs, 0), kib(r.jsBytes), cell(r.babelMs, 0),
        r.ok ? ([...new Set((r.scenes ?? []).map((s) => `${s.backend}/${s.rendererPath}`))].join(", ") || "no scenes") : `ERROR: ${r.error}`,
      ]),
    ), "");
  }
  return out.join("\n");
}

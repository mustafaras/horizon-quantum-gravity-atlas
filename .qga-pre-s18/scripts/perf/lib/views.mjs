// View ids come from the QGA_VIEWS table in js/app.jsx, so the harness cannot
// drift from the app. The table is a classic-script `const`, not a window
// property, which is why it is parsed from source instead of read in the page.

export function parseViewIds(appSource) {
  const start = appSource.indexOf("const QGA_VIEWS = {");
  if (start === -1) throw new Error("const QGA_VIEWS = { not found in js/app.jsx");
  const end = appSource.indexOf("\n};", start);
  if (end === -1) throw new Error("QGA_VIEWS table is not terminated by \\n};");
  const ids = [...appSource.slice(start, end).matchAll(/^ {2}([A-Za-z][\w-]*):/gm)].map((m) => m[1]);
  if (ids.length === 0) throw new Error("QGA_VIEWS table has no entries");
  return ids;
}

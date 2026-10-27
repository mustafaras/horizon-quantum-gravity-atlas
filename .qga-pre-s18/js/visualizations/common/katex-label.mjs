/** Typeset a scene label (a Scene3D `ctx.label` handle) with KaTeX, or leave its plain text when KaTeX is not loaded yet or the source does not compile. */
export function typesetLabel(handle, tex, plain) {
  const katex = globalThis.katex;
  if (!katex) { handle.el.textContent = plain; return; }
  try { katex.render(tex, handle.el, { throwOnError: true }); } catch { handle.el.textContent = plain; }
}

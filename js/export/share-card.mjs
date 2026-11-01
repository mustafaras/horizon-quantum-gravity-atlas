/**
 * Deterministic share cards (S32).
 *
 * 1200x630 is the size every link unfurler agrees on. The card is drawn from the state alone — same state, same
 * pixels — so it can be regenerated and diffed, and so a card in a conversation is evidence rather than decoration.
 *
 * One limitation is stated here rather than discovered later: this atlas is a static GitHub Pages site. A crawler
 * asking for the page receives `index.html` and the static `docs/social/og-image.png`; it cannot receive a card
 * generated on the fly, because generating one needs a server or an edge function. The downloadable card is what a
 * reader can attach to a message; it is not what a link preview shows. Prebuilding one route per view would be the way
 * to change that, and the prompt asks for the truth to be written down instead.
 */

import { buildExportEnvelope, ExportError } from "./export-service.mjs";

export const SHARE_CARD_SIZE = Object.freeze({ width: 1200, height: 630 });

/** The card's own layout constants, in card pixels. */
export const SHARE_CARD_LAYOUT = Object.freeze({
  padding: 64,
  titleTop: 150,
  titleSize: 62,
  subtitleTop: 246,
  subtitleSize: 26,
  ruleY: 300,
  statTop: 360,
  statSize: 34,
  statLabelSize: 15,
  footerTop: 540,
  footerSize: 17,
});

/** The facts a card states, chosen so that two cards for different states always differ visibly. */
export function shareCardFacts(state = {}, { viewTitle = "Quantum Gravity Atlas", viewId = "overview" } = {}) {
  const facts = [];
  const push = (label, value) => { if (value != null && value !== "" && Number.isFinite(Number(value)) === false) facts.push({ label, value: String(value) }); };
  const number = (label, value, unit = "", digits = 0) => {
    if (value == null || !Number.isFinite(Number(value))) return;
    facts.push({ label, value: `${Number(value).toFixed(digits)}${unit ? ` ${unit}` : ""}` });
  };
  if (viewId === "bh") {
    number("Mass", state.bhMass, "M☉", 1);
    number("Spin", state.bhSpin, "a★", 2);
    number("Inclination", state.bhInclination, "°", 0);
  } else if (viewId === "exp") {
    push("Event", state.gwEvent);
    push("Detector", state.gwDetector);
    number("Duration", state.gwDuration, "s", 0);
  } else if (viewId === "rg") {
    push("Model", state.rgModel);
    number("Coupling g₀", state.rgG0, "", 3);
    number("Scale μ₀", state.rgMu0, "GeV", 1);
  } else if (viewId === "gr") {
    push("Preset", state.grPreset);
    number("β", state.grBeta, "v/c", 2);
  } else if (viewId === "qft") {
    push("Process", state.qftProcess);
    number("√s", state.qftSqrtS, "GeV", 0);
  }
  push("Pathway", state.pathway);
  return facts.slice(0, 4);
}

/**
 * Compose the card as a scene description the caller paints (SVG in the studio, a canvas in a test).
 *
 * Kept as data rather than as drawing code so the deterministic test can assert the layout without a browser, and so
 * the same description can be rendered to SVG here and to a canvas elsewhere.
 */
export function shareCardScene({ state = {}, viewId = "overview", viewTitle = "Quantum Gravity Atlas", provenance = null, seed = 42, when = new Date(), commitHash = null } = {}) {
  const { width, height } = SHARE_CARD_SIZE;
  const L = SHARE_CARD_LAYOUT;
  const facts = shareCardFacts(state, { viewTitle, viewId });
  return {
    width, height,
    background: "surface-0",
    kicker: "HORIZON · QUANTUM GRAVITY ATLAS",
    title: viewTitle,
    subtitle: provenance?.model ? truncate(provenance.model, 120) : "An interactive scientific atlas of quantum gravity.",
    facts,
    footer: `seed ${Math.trunc(Number(seed)) || 0} · ${viewId} · ${provenance?.status ?? "no status"} · ${commitHash ? String(commitHash).slice(0, 7) : "static deployment"}`,
    status: provenance?.status ?? null,
    exportedAt: buildExportEnvelope({ view: viewId, kind: "share-card", state, provenance, seed, commitHash, when }).exportedAt,
    layout: { ...L },
  };
}

function truncate(text, max) {
  const value = String(text);
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

const esc = (value) => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Render the card to a standalone SVG string.
 *
 * Text only, no external font request beyond the vendored family name, and no raster: a 1200x630 card is small enough
 * that a vector card is both sharper and a few kilobytes smaller than a PNG of the same thing.
 */
export function shareCardSvg(card, { css = (token) => token } = {}) {
  if (!card || !card.layout) throw new ExportError("not-supported", "No share-card scene was provided.");
  const L = card.layout;
  const parts = [
    `<rect x="0" y="0" width="${card.width}" height="${card.height}" fill="${css("surface-0")}"/>`,
    `<text x="${L.padding}" y="${L.padding + 14}" font-size="15" letter-spacing="3" fill="${css("accent")}" font-family="monospace">${esc(card.kicker)}</text>`,
    `<text x="${L.padding}" y="${L.titleTop}" font-size="${L.titleSize}" font-weight="bold" fill="${css("ink-strong")}" font-family="serif">${esc(card.title)}</text>`,
    `<text x="${L.padding}" y="${L.subtitleTop}" font-size="${L.subtitleSize}" fill="${css("ink-dim")}" font-family="serif">${esc(card.subtitle)}</text>`,
    `<line x1="${L.padding}" y1="${L.ruleY}" x2="${card.width - L.padding}" y2="${L.ruleY}" stroke="${css("ink-faint")}" stroke-width="1"/>`,
  ];
  const columnWidth = (card.width - L.padding * 2) / Math.max(1, card.facts.length);
  card.facts.forEach((fact, index) => {
    const x = L.padding + index * columnWidth;
    parts.push(`<text x="${x}" y="${L.statTop}" font-size="${L.statSize}" font-weight="bold" fill="${css("ink-strong")}" font-family="serif">${esc(fact.value)}</text>`);
    parts.push(`<text x="${x}" y="${L.statTop + 24}" font-size="${L.statLabelSize}" letter-spacing="1.6" fill="${css("ink-dim")}" font-family="monospace">${esc(fact.label.toUpperCase())}</text>`);
  });
  parts.push(`<text x="${L.padding}" y="${L.footerTop}" font-size="${L.footerSize}" fill="${css("ink-dim")}" font-family="monospace">${esc(card.footer)}</text>`);
  if (card.status) {
    parts.push(`<rect x="${L.padding}" y="${card.height - L.padding - 26}" width="4" height="26" fill="${css(`status-${card.status}`)}"/>`);
    parts.push(`<text x="${L.padding + 12}" y="${card.height - L.padding - 8}" font-size="15" letter-spacing="1.4" fill="${css(`status-${card.status}`)}" font-family="monospace">${esc(String(card.status).toUpperCase())}</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${card.width}" height="${card.height}" viewBox="0 0 ${card.width} ${card.height}" role="img" aria-label="${esc(card.title)}">`
    + `<title>${esc(card.title)}</title>${parts.join("")}</svg>`;
}

/**
 * The card's sidecar: the same envelope every export carries, with the card's own geometry.
 *
 * Written beside the SVG so a card can be traced back to the state it advertises.
 */
export function shareCardSidecar(card, { references = [] } = {}) {
  return {
    schema: "horizon-qga-export/v1",
    kind: "share-card",
    width: card.width,
    height: card.height,
    title: card.title,
    facts: card.facts.map((fact) => ({ ...fact })),
    status: card.status,
    exportedAt: card.exportedAt,
    references: references.map(String),
  };
}

/** The documented limitation, in the place a reader of the code will look for it. */
export const SHARE_CARD_LIMITATION =
  "A static GitHub Pages deployment serves one fixed og:image to every crawler. "
  + "Downloadable share cards are generated in the page; link previews are not, and cannot be without prebuilt routes "
  + "or a server/edge function. docs/social/og-image.png remains the static preview for every view.";

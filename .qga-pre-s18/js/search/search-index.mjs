/**
 * Command-palette search index (Prompt 10).
 *
 * Deterministic local ranking over the atlas's static content plus live
 * registries (formula cards, camera shots when a cinematic manifest exists).
 * Pure data-in/data-out: no DOM, no fetch — the palette supplies sources,
 * Node tests supply fixtures.
 *
 * Ranking contract (strictly ordered, then stable tie-broken):
 *   400 exact title match          (case/diacritic-insensitive)
 *   300 title prefix match
 *   250 title token-prefix match   (any word starts with the query)
 *   200 title substring match
 *   150 metadata substring match   (description, keywords, category)
 *   100 body substring match       (glossary definitions, reference text)
 * Ties break by category order, then by stable id — never by input order,
 * so identical inputs always produce identical outputs.
 */

const CATEGORY_ORDER = Object.freeze({
  action: 0, view: 1, shot: 2, formula: 3, symbol: 4, module: 5,
  glossary: 6, reference: 7, problem: 8,
});

/** Casefold + strip combining marks so "Kerr–Hawking" ≈ "kerr hawking". */
export function normalizeSearchText(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .trim();
}

function requireSourceId(source, kind) {
  if (!source || typeof source.id !== "string" || !source.id) {
    throw new TypeError(`Search ${kind} source requires a non-empty string id`);
  }
}

function tokenize(text) {
  return normalizeSearchText(text).split(/[^a-z0-9*]+/).filter(Boolean);
}

/**
 * Build the index from source arrays. Every entry becomes:
 *   { id, category, title, subtitle?, keywords?, body?, tokens, run? }
 * `run` is an opaque consumer callback (actions/views carry navigation).
 */
export function buildSearchIndex(sources = {}) {
  const entries = [];
  const push = (entry) => {
    if (!entry || typeof entry.id !== "string" || !entry.id) throw new TypeError("Search entry requires a string id");
    if (typeof entry.title !== "string" || !entry.title) throw new TypeError(`Search entry ${entry.id} requires a title`);
    const category = entry.category ?? "module";
    if (!(category in CATEGORY_ORDER)) throw new TypeError(`Search entry ${entry.id} has unknown category "${category}"`);
    const searchable = normalizeSearchText([
      entry.title, entry.subtitle ?? "", (entry.keywords ?? []).join(" "), entry.categoryLabel ?? "",
    ].join(" "));
    entries.push(Object.freeze({
      category,
      categoryLabel: entry.categoryLabel ?? category,
      title: entry.title,
      subtitle: entry.subtitle ?? null,
      keywords: Object.freeze([...(entry.keywords ?? [])]),
      body: entry.body ?? null,
      run: entry.run ?? null,
      tokens: Object.freeze(tokenize(searchable)),
      normalizedTitle: normalizeSearchText(entry.title),
      id: entry.id,
    }));
  };

  for (const view of sources.views ?? []) {
    requireSourceId(view, "view");
    push({ id: `view:${view.id}`, category: "view", categoryLabel: "View", title: view.title, subtitle: view.subtitle ?? null, keywords: view.keywords ?? [], run: view.run ?? null });
  }
  for (const module of sources.modules ?? []) {
    requireSourceId(module, "module");
    push({ id: `module:${module.id}`, category: "module", categoryLabel: "Module", title: module.title, subtitle: module.subtitle ?? null, keywords: module.keywords ?? [], run: module.run ?? null });
  }
  for (const shot of sources.shots ?? []) {
    requireSourceId(shot, "shot");
    push({ id: `shot:${shot.id}`, category: "shot", categoryLabel: "Camera shot", title: shot.title, subtitle: shot.subtitle ?? null, keywords: shot.keywords ?? [], run: shot.run ?? null });
  }
  for (const formula of sources.formulas ?? []) {
    push({ id: `formula:${formula.view}:${formula.title}`, category: "formula", categoryLabel: "Formula", title: formula.title, subtitle: `in ${formula.viewLabel ?? formula.view}`, keywords: formula.keywords ?? [], run: formula.run ?? null });
  }
  for (const symbol of sources.symbols ?? []) {
    for (const context of symbol.contexts ?? [{}]) {
      push({
        id: `symbol:${symbol.sym}:${context.ctx ?? ""}`,
        category: "symbol", categoryLabel: "Symbol",
        title: `${symbol.sym} — ${context.ctx ?? symbol.cat ?? ""}`,
        subtitle: context.unit ? `unit: ${context.unit}` : null,
        keywords: [symbol.cat, context.module, ...(symbol.keywords ?? [])],
        body: context.meaning ?? null,
        run: symbol.run ?? null,
      });
    }
  }
  for (const term of sources.glossary ?? []) {
    push({ id: `glossary:${term.term}`, category: "glossary", categoryLabel: "Glossary", title: term.term, body: term.def ?? null, run: term.run ?? null });
  }
  for (const reference of sources.references ?? []) {
    push({ id: `reference:${reference.tag}:${entries.length}`, category: "reference", categoryLabel: "Reference", title: reference.tag, body: reference.text ?? null, run: reference.run ?? null });
  }
  for (const problem of sources.problems ?? []) {
    push({ id: `problem:${problem.title}`, category: "problem", categoryLabel: "Open problem", title: problem.title, subtitle: problem.kind ?? null, body: problem.body ?? null, run: problem.run ?? null });
  }
  for (const action of sources.actions ?? []) {
    push({ id: `action:${action.id}`, category: "action", categoryLabel: "Action", title: action.title, subtitle: action.subtitle ?? null, keywords: action.keywords ?? [], run: action.run ?? null });
  }
  return Object.freeze(entries);
}

/**
 * Deterministic ranking. Empty query returns the category-ordered default
 * list (actions first, then views/modules) capped at `limit`.
 */
export function rankResults(index, query, { limit = 24 } = {}) {
  if (!Array.isArray(index)) throw new TypeError("rankResults requires a built index");
  if (!Number.isInteger(limit) || limit <= 0) throw new RangeError("limit must be a positive integer");
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return index
      .filter((entry) => entry.category === "action" || entry.category === "view" || entry.category === "module")
      .sort(compareEntries)
      .slice(0, limit);
  }
  const queryTokens = tokenize(normalized);
  const scored = [];
  for (const entry of index) {
    let score = 0;
    if (entry.normalizedTitle === normalized) score = 400;
    else if (entry.normalizedTitle.startsWith(normalized)) score = 300;
    else if (entry.tokens.some((token) => token.startsWith(normalized))) score = 250;
    else if (entry.normalizedTitle.includes(normalized)) score = 200;
    else if (entry.tokens.some((token) => queryTokens.some((q) => token.startsWith(q))) && queryTokens.length > 1) score = 175;
    else if (matchesMetadata(entry, normalized)) score = 150;
    else if (entry.body && normalizeSearchText(entry.body).includes(normalized)) score = 100;
    if (score > 0) scored.push({ entry, score });
  }
  return scored
    .sort((a, b) => (b.score - a.score) || compareEntries(a.entry, b.entry))
    .slice(0, limit)
    .map((hit) => hit.entry);
}

function matchesMetadata(entry, normalized) {
  const metadata = normalizeSearchText([
    entry.subtitle ?? "", entry.keywords.join(" "), entry.categoryLabel,
  ].join(" "));
  return metadata.includes(normalized);
}

function compareEntries(a, b) {
  const ca = CATEGORY_ORDER[a.category] ?? 99, cb = CATEGORY_ORDER[b.category] ?? 99;
  return (ca - cb) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/**
 * Escaped highlighting: split `text` into hit/non-hit segments around every
 * case-insensitive occurrence of `query`. Returns plain segments — the
 * palette renders them as React text nodes, never innerHTML.
 */
export function highlightSegments(text, query) {
  const source = String(text ?? "");
  const needle = normalizeSearchText(query);
  if (!needle) return [{ text: source, hit: false }];
  const lower = source.toLowerCase();
  const needleLower = needle.toLowerCase();
  const segments = [];
  let index = 0;
  let found = lower.indexOf(needleLower, index);
  while (found !== -1) {
    if (found > index) segments.push({ text: source.slice(index, found), hit: false });
    segments.push({ text: source.slice(found, found + needle.length), hit: true });
    index = found + needle.length;
    found = lower.indexOf(needleLower, index);
  }
  if (index < source.length) segments.push({ text: source.slice(index), hit: false });
  return segments.length ? segments : [{ text: source, hit: false }];
}

/** Stable, localized result-count line ("3 of 41 results"). */
export function formatResultCount(shown, total, query) {
  const trimmed = normalizeSearchText(query);
  if (!trimmed) return `${shown} quick actions`;
  return total === 0 ? "No results" : `${shown} of ${total} result${total === 1 ? "" : "s"}`;
}

#!/usr/bin/env node
/*
 * The formula audit (S30): wired into `npm run validate`, it fails rather than warns.
 *
 * Three properties, each of which the atlas promises and none of which a screenshot can enforce:
 *
 *   1. every <FormulaCard> names a definition that exists, and no card still passes a tex prop beside it;
 *   2. every symbol of every definition declares a unit and dimensions — a formula whose `M` is a bare number is not a
 *      formula, it is a letter;
 *   3. every definition is dimensionally consistent, which `defineFormula` already throws on but which is checked here
 *      as well so the failure arrives with a file and a line rather than as a module-load stack trace.
 *
 * It also reports the derivation contract: every derivation's steps must land on its own closed form. That is the
 * property the stepper claims by existing, so it is audited alongside the cards.
 *
 *   node scripts/audit-formulas.mjs [--json]
 *
 * Exit code 0 when clean, 1 with one line per failure otherwise. No dates, no absolute paths, deterministic order.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { inferDimensions, dimension, dimensionsEqual, dimensionToString } from "../js/formula/dimensions.mjs";
import { topLevel } from "../js/formula/library/equations.mjs";

// The library and the card directory are overridable so the audit can be run against a throwaway tree by its own test.
// Without that, a green run could be the audit not looking (test/formula-audit.test.mjs asserts the negative case).
const ROOT = process.env.QGA_AUDIT_ROOT ? path.resolve(process.env.QGA_AUDIT_ROOT) : path.resolve(import.meta.dirname, "..");
const JS_DIR = path.join(ROOT, process.env.QGA_AUDIT_JS_DIR ?? "js");
const LIBRARY = process.env.QGA_AUDIT_LIBRARY ?? path.join(ROOT, "js/formula/library/index.mjs");
const DERIVATIONS = process.env.QGA_AUDIT_DERIVATIONS ?? path.join(ROOT, "js/formula/library/derivations.mjs");
const asJson = process.argv.includes("--json");

async function walk(dir, relative = "") {
  const entries = (await readdir(path.join(dir, relative), { withFileTypes: true }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const files = [];
  for (const entry of entries) {
    const next = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await walk(dir, next));
    else if (entry.name.endsWith(".jsx")) files.push(next);
  }
  return files;
}

/** Every FormulaCard in js/, with the attributes the card reads. Attribute strings are JSX literals: no escapes. */
async function readCards() {
  const cards = [];
  for (const file of await walk(JS_DIR)) {
    const source = await readFile(path.join(JS_DIR, file), "utf8");
    for (const match of source.matchAll(/<FormulaCard\b/g)) {
      const close = source.indexOf("</FormulaCard>", match.index);
      const self = source.indexOf("/>", match.index);
      const stop = close >= 0 && (self < 0 || close < self) ? close : self + 2;
      const block = source.slice(match.index, stop);
      const attr = (name) => {
        const braced = new RegExp(`\\b${name}=\\{("(?:[^"\\\\]|\\\\.)*")\\}`).exec(block);
        if (braced) return JSON.parse(braced[1]);
        const plain = new RegExp(`\\b${name}="([^"]*)"`).exec(block);
        return plain ? plain[1] : null;
      };
      cards.push({
        where: `js/${file}:${source.slice(0, match.index).split("\n").length}`,
        title: attr("title"),
        tex: attr("tex"),
        formulaId: attr("formulaId"),
        texAfter: attr("texAfter"),
      });
    }
  }
  return cards;
}

/** One line per symbol that cannot be checked: no unit, no dimensions, no TeX. */
function symbolFailures(library) {
  const failures = [];
  for (const formula of Object.values(library)) {
    for (const [name, decl] of Object.entries(formula.symbols)) {
      const where = `${formula.id}.${name}`;
      if (!decl || typeof decl !== "object") { failures.push(`${where}: not a declaration`); continue; }
      if (typeof decl.tex !== "string" || decl.tex === "") failures.push(`${where}: no TeX`);
      if (typeof decl.unit !== "string" || decl.unit === "") failures.push(`${where}: no unit (use "1" when dimensionless)`);
      if (!decl.dims || typeof decl.dims !== "object") failures.push(`${where}: no dimensions`);
      if (decl.description === undefined && decl.constant === undefined) failures.push(`${where}: no description`);
    }
  }
  return failures;
}

/** The output declaration must equal what the expression actually has. */
function dimensionFailures(library) {
  const failures = [];
  for (const formula of Object.values(library)) {
    let actual;
    try {
      actual = inferDimensions(formula.expr, formula.symbols);
    } catch (error) {
      failures.push(`${formula.id}: ${error.message}`);
      continue;
    }
    const declared = dimension(formula.output?.dims ?? {});
    if (!dimensionsEqual(actual, declared)) {
      failures.push(`${formula.id}: declares ${dimensionToString(declared)} but its expression has ${dimensionToString(actual)}`);
    }
    if (formula.dimString !== dimensionToString(actual)) failures.push(`${formula.id}: cached dimString is stale`);
  }
  return failures;
}

/** A derivation whose steps do not reach its closed form is a broken argument. */
function derivationFailures(derivations) {
  const failures = [];
  for (const derivation of Object.values(derivations)) {
    const report = derivation.check();
    if (report.ok === null) continue; // no closed form declared: nothing to contradict
    if (!report.ok) failures.push(`${derivation.id}: last step ${report.step} gives a relative error of ${report.maxRelError}`);
    for (const step of derivation.steps) {
      if (!step.justification || step.justification.trim().length < 20) failures.push(`${derivation.id}.${step.id}: justification says nothing`);
    }
  }
  return failures;
}

async function main() {
  const { library } = await import(LIBRARY);
  const { derivations } = await import(DERIVATIONS);
  const cards = await readCards();
  const ids = new Set(Object.values(library).map((f) => f.id));
  const failures = [];

  const unmigrated = cards.filter((c) => !c.formulaId);
  for (const card of unmigrated) failures.push(`${card.where} ${card.title}: no formulaId`);
  const both = cards.filter((c) => c.formulaId && c.tex !== null);
  for (const card of both) failures.push(`${card.where} ${card.title}: carries a tex prop beside its formulaId (the card would ignore it)`);
  const dangling = cards.filter((c) => c.formulaId && !ids.has(c.formulaId));
  for (const card of dangling) failures.push(`${card.where} ${card.title}: formulaId "${card.formulaId}" is not in the library`);

  // A definition's declared left-hand side must be the card's own, or the composed equation moved its equals sign.
  for (const card of both) {
    if (card.tex === null || !ids.has(card.formulaId)) continue;
    const formula = Object.values(library).find((f) => f.id === card.formulaId);
    const [equals] = topLevel(card.tex, " = ");
    if (formula.output.tex === "" && equals !== undefined) {
      failures.push(`${card.where} ${card.title}: the card has a top-level " = " the definition does not declare`);
    }
  }

  failures.push(...symbolFailures(library));
  failures.push(...dimensionFailures(library));
  failures.push(...derivationFailures(derivations));

  const stats = {
    cards: cards.length,
    definitions: ids.size,
    derivations: Object.values(derivations).length,
    failures: failures.length,
  };

  if (asJson) {
    process.stdout.write(`${JSON.stringify({ stats, failures }, null, 2)}\n`);
  } else if (failures.length) {
    console.error("Formula audit failed:");
    for (const failure of failures) console.error(`- ${failure}`);
  } else {
    console.log(
      `Formula audit passed: ${stats.cards} cards, ${stats.definitions} definitions with units and dimensions, ` +
      `${stats.derivations} derivations that reach their closed forms.`,
    );
  }
  process.exit(failures.length ? 1 : 0);
}

main().catch((error) => {
  console.error(`Formula audit could not run: ${error.message}`);
  process.exit(1);
});

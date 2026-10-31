/*
 * Structural equations: the cards that state a relation rather than compute a value.
 *
 * `defineFormula` already covers them. A formula whose expression has no free symbols validates cleanly, evaluates to
 * its own value, and typesets through the shared printer — so an identity is a `defineFormula`, not a second kind of
 * definition. A second kind would fork lens.mjs, to-tex.mjs and to-tsl.mjs for no gain. (Ledger D-177.)
 *
 * The problem an identity does have is fidelity. `to-tex.mjs` prints `\left[...\right]`, `\langle … \rangle` and
 * `\tfrac` only where its AST has operators for them, and a structural equation is TeX a physicist wrote, not a tree.
 * So `identityFormula` takes the equation **exactly as the card renders it** and splits it where the printer's own
 * separator occurs:
 *
 *   - at the first top-level ` = `, into the declared left-hand side and the rest;
 *   - in the rest, at each top-level ` + `, which is precisely the separator `add()` prints.
 *
 * Splitting only at the printer's own separator means the composed TeX is byte-identical to the string it replaced,
 * while every piece becomes a `\htmlData{term=…}` the Formula Lens can focus. test/formula-cards.test.mjs asserts that
 * identity for every card, so a mistyped equation fails a test instead of rendering a plausible-looking wrong one.
 */

import { defineFormula } from "../formula.mjs";
import { add, num, term } from "../expr.mjs";

/**
 * Delimiters that open and close a group the splitter must not cut through. Braces are TeX's own; `\left(` and
 * `\right)` are a matched pair a ` + ` may sit inside — `\left(\bar\psi_L Y \phi \psi_R + \mathrm{h.c.}\right)` is
 * one Yukawa term, not two — and so are the sized variants. Plain parentheses and brackets are tracked in the main loop.
 */
const OPENERS = /^(?:\{|\\left|\\bigl|\\Bigl|\\biggl|\\Biggl)/;
const CLOSERS = /^(?:\}|\\right|\\bigr|\\Bigr|\\biggr|\\Biggr)/;

/** Indexes of `needle` at group depth 0, where a group is braces or a matched `\left…\right`-style pair. */
export function topLevel(text, needle) {
  const hits = [];
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "\\") {
      // A control sequence runs from the backslash through its letters, if any; `\{` and `\}` are single characters.
      let j = i + 1;
      while (j < text.length && /[a-zA-Z]/.test(text[j])) j += 1;
      const command = text.slice(i, j).length > 2 ? text.slice(i, j) : text.slice(i, j + 1);
      if (OPENERS.test(command)) depth += 1;
      else if (CLOSERS.test(command)) depth -= 1;
      i = j - 1;
      continue;
    }
    // Plain parentheses and brackets group too: `(\Box + m^2)\phi = 0` is one expression, and splitting at its inner
    // ` + ` produced a piece that began mid-parenthesis.
    if (ch === "{" || ch === "(" || ch === "[") depth += 1;
    else if (ch === "}" || ch === ")" || ch === "]") depth -= 1;
    else if (depth === 0 && text.startsWith(needle, i)) hits.push(i);
  }
  return hits;
}

/**
 * Break one equation into the pieces `add()` can join without changing a character: the left-hand side, then the
 * right-hand side at each top-level ` + `. Only " + " is supported, because that is the only separator the printer
 * emits and any other literal would have to be reproduced by a printer change.
 */
export function equationPieces(tex) {
  const [eq] = topLevel(tex, " = ");
  const lhs = eq === undefined ? "" : tex.slice(0, eq);
  const rhs = eq === undefined ? tex : tex.slice(eq + 3);
  const parts = [];
  let from = 0;
  for (const at of topLevel(rhs, " + ")) {
    parts.push(rhs.slice(from, at));
    from = at + 3;
  }
  parts.push(rhs.slice(from));
  return Object.freeze({ lhs, pieces: Object.freeze(parts) });
}

/**
 * A definition that states an equation rather than computing a value.
 *
 * @param {object} spec
 * @param {string} spec.id
 * @param {string} spec.title
 * @param {string} spec.status   one of the six scientific status labels
 * @param {string} spec.tex      the equation exactly as the card renders it
 * @param {object} spec.symbols  `{ name: { tex, unit, dims, description } }`
 * @param {Array}  spec.references
 * @param {string} [spec.lhs]     a left-hand side for an equation the card writes without an `=` (a gauge group, a
 *                                proportionality); it becomes `lhs = tex`, which is a visible change to the card and
 *                                therefore only used where the card is already being edited for another reason
 */
export function identityFormula({ id, title, status, tex, symbols, references, lhs = "", terms }) {
  if (typeof tex !== "string" || tex.trim() === "") throw new TypeError(`${id}: tex must be the equation as the card renders it`);
  const split = equationPieces(lhs ? `${lhs} = ${tex}` : tex);
  // A term id is what the Formula Lens announces, so it has to say what the term is. `part1` is a machine name a
  // screen-reader user would hear instead of the physics; the caller names each piece, and a count mismatch is an error
  // rather than a silent fallback.
  //
  // One name means "do not split". The pieces `add()` can join are its own top-level ` + ` addends, so an equation whose
  // additions are part of the physics — `s + t + u = Σ m²` — would otherwise become three terms named "…and s", "t",
  // "u = …". Naming it once keeps it whole and addressable, which is what a reader wants to focus.
  const whole = terms !== undefined && terms.length === 1;
  const pieces = whole ? [split.pieces.join(" + ")] : split.pieces;
  const names = terms ?? pieces.map((_, i) => `part${i + 1}`);
  if (names.length !== pieces.length) {
    throw new RangeError(`${id}: the equation splits into ${pieces.length} pieces, but ${names.length} names were given`);
  }
  const nodes = pieces.map((piece, i) => term(names[i], num(1), { tex: piece }));
  const expr = nodes.length === 1 ? nodes[0] : add(...nodes);
  // The relation itself is dimensionless, and that is not a placeholder for something better: an equation is a
  // proposition, and a proposition has no unit. Forcing a `dims` here would make the atlas assert `T_H = …` measures a
  // temperature, which the AST cannot check and `defineFormula` would then reject as inconsistent. The physics lives on
  // the symbols — every one of which the audit requires to carry a unit and dimensions — which is what the S30 contract
  // asks for and what a reader can check.
  return defineFormula({
    id, title, status, symbols,
    output: { tex: split.lhs, unit: "1", dims: {} },
    expr,
    references,
  });
}

/**
 * The TeX a card renders for a definition, by the same rule js/core.jsx uses: the declared left-hand side with an
 * equals sign when there is one, then the expression's own TeX, then any `texAfter`. Both sides read this, so the test
 * comparing a migration against the string it replaced cannot drift from what the card does.
 */
export function cardTex(formula, texAfter = "") {
  return (formula.output.tex ? `${formula.output.tex} = ` : "") + formula.tex + texAfter;
}

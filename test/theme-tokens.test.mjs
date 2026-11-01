import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { contrastRatio, deltaE2000Linear, linearToOklab, relativeLuminance, cssColorToLinear } from "../js/design/color.mjs";
import { simulateCvd, CVD_TYPES } from "../js/design/cvd.mjs";
import { parseTokensCss, buildTokens, THEME_IDS, DEFAULT_THEME } from "../js/design/tokens.mjs";
import { themePigment } from "../js/design/theme-pigments.mjs";
import { categorical, diverging } from "../js/design/palettes.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const baseCss = read("styles", "tokens.css");
const themeCss = Object.fromEntries(THEME_IDS.map((id) => [id, read("styles", "themes", `${id}.css`)]));

const themed = (id) => buildTokens(parseTokensCss(baseCss, { theme: id, themeCss: themeCss[id] }), id);
const TOKENS = Object.fromEntries(THEME_IDS.map((id) => [id, themed(id)]));

const SURFACES = ["surface-0", "surface-1", "surface-2"];
// What the generated stylesheets turn the dark panel washes into: oklch(0.90 0.01 260) on Print, oklch(0.42 0.05 240) on Blueprint.
const PANEL_REFERENCE = { observatory: null, blueprint: "#335166", print: "#dadee5" };
const STATUS = ["established", "effective", "schematic", "conjectural", "open", "heuristic"].map((s) => `status-${s}`);
const VISIONS = ["normal", ...CVD_TYPES];
const see = (rgb, vision) => (vision === "normal" ? rgb : simulateCvd(rgb, vision));

test("three themes exist and each is a :root[data-theme] block of its own file", () => {
  assert.deepEqual([...THEME_IDS], ["observatory", "blueprint", "print"]);
  assert.equal(DEFAULT_THEME, "observatory");
  for (const id of THEME_IDS) {
    assert.ok(new RegExp(`:root\\[data-theme="${id}"\\]`).test(themeCss[id]), `${id}.css selects its theme`);
    assert.equal(TOKENS[id].theme, id);
  }
  assert.throws(() => parseTokensCss(baseCss, { theme: "sepia", themeCss: "" }), /unknown theme/);
  assert.throws(() => buildTokens({}, "sepia"), /unknown theme/);
});

test("the S02 compatibility aliases are gone from tokens.css", () => {
  const values = parseTokensCss(baseCss);
  const aliases = ["bg", "bg-2", "panel", "panel-solid", "glass", "glass-strong", "line", "line-strong", "text", "text-dim", "head", "acc", "acc-2", "cyan", "gold", "acc-soft", "danger"];
  for (const a of aliases) assert.ok(!(`--${a}` in values), `--${a} must not be defined any more`);
  assert.ok(!/Legacy names/.test(baseCss), "section 9 is removed");
});

for (const id of THEME_IDS) {
  const T = TOKENS[id];
  const lin = (name) => T.color[name].linear;

  test(`${id}: ink reaches 4.5:1 on every surface and the levels descend`, () => {
    for (const ink of ["ink-strong", "ink", "ink-dim"]) for (const surface of SURFACES) {
      const ratio = contrastRatio(lin(ink), lin(surface));
      assert.ok(ratio >= 4.5, `${id}: --${ink} on --${surface}: ${ratio.toFixed(2)}:1`);
    }
    assert.ok(contrastRatio(lin("ink-strong"), lin("surface-0")) >= contrastRatio(lin("ink"), lin("surface-0")));
    assert.ok(contrastRatio(lin("ink"), lin("surface-0")) > contrastRatio(lin("ink-dim"), lin("surface-0")));
  });

  test(`${id}: accent and signal colours are text-legible on every surface`, () => {
    for (const name of ["accent", "accent-2", "signal-warm", "signal-danger"]) for (const surface of SURFACES) {
      const ratio = contrastRatio(lin(name), lin(surface));
      assert.ok(ratio >= 4.5, `${id}: --${name} on --${surface}: ${ratio.toFixed(2)}:1`);
    }
  });

  test(`${id}: status colours are text-legible on every surface`, () => {
    for (const status of STATUS) for (const surface of SURFACES) {
      const ratio = contrastRatio(lin(status), lin(surface));
      assert.ok(ratio >= 4.5, `${id}: --${status} on --${surface}: ${ratio.toFixed(2)}:1`);
    }
  });

  test(`${id}: the six status colours are pairwise ΔE00 ≥ 12 for normal, protan, deutan and tritan vision`, () => {
    for (const vision of VISIONS) for (let i = 0; i < STATUS.length; i++) for (let j = i + 1; j < STATUS.length; j++) {
      const d = deltaE2000Linear(see(lin(STATUS[i]), vision), see(lin(STATUS[j]), vision));
      assert.ok(d >= 12, `${id}: ${STATUS[i]} vs ${STATUS[j]} under ${vision}: ΔE00 ${d.toFixed(2)}`);
    }
  });

  test(`${id}: categorical palette has 8 distinct entries, neighbours ΔE00 ≥ 10 in every vision, each ≥ 3:1 on the surfaces`, () => {
    const cat = categorical(T);
    assert.equal(cat.length, 8);
    assert.equal(new Set(cat.map((c) => c.css)).size, 8);
    for (const vision of VISIONS) for (let i = 0; i + 1 < cat.length; i++) {
      const d = deltaE2000Linear(see(cat[i].linear, vision), see(cat[i + 1].linear, vision));
      assert.ok(d >= 10, `${id}: cat-${i + 1} vs cat-${i + 2} under ${vision}: ΔE00 ${d.toFixed(2)}`);
    }
    for (const c of cat) for (const surface of SURFACES) {
      assert.ok(contrastRatio(c.linear, lin(surface)) >= 3, `${id}: ${c.name} non-text contrast on --${surface}`);
    }
  });

  test(`${id}: the diverging palette keeps blue for negative and orange for positive, with ends distinct in every vision`, () => {
    const div = diverging(T);
    const [neg, zero, pos] = [div.sample(-1), div.sample(0), div.sample(1)];
    assert.ok(neg[2] > neg[0], "negative end is blue");
    assert.ok(pos[0] > pos[2], "positive end is orange");
    const lightness = (v) => linearToOklab(div.sample(v))[0];
    if (id === "print") {
      assert.ok(relativeLuminance(zero) > relativeLuminance(neg) && relativeLuminance(zero) > relativeLuminance(pos), "on paper zero is the lightest");
      assert.ok(lightness(-1) < lightness(-0.5) && lightness(-0.5) < lightness(0) && lightness(1) < lightness(0.5) && lightness(0.5) < lightness(0), "darkness rises away from zero");
    } else {
      assert.ok(relativeLuminance(zero) < relativeLuminance(neg) && relativeLuminance(zero) < relativeLuminance(pos), "on a dark surface zero is the darkest");
      assert.ok(lightness(-1) > lightness(-0.5) && lightness(-0.5) > lightness(0) && lightness(1) > lightness(0.5) && lightness(0.5) > lightness(0), "lightness rises away from zero");
    }
    for (const vision of VISIONS) assert.ok(deltaE2000Linear(see(neg, vision), see(pos, vision)) >= 30, `${id}: ends under ${vision}`);
  });

  test(`${id}: the same text and signal colours hold on the panel the generated stylesheets produce`, () => {
    // Panels are the mapped dark washes of the module stylesheets: lighter than --surface-2 on Print's paper and the
    // lightest thing Blueprint draws text on. Measured on a real page (CI): status text fell to 4.3:1 on them.
    const panel = PANEL_REFERENCE[id];
    if (!panel) return;
    const ref = cssColorToLinear(panel);
    for (const name of ["ink-strong", "ink", "ink-dim", "accent", "accent-2", "signal-warm", "signal-danger", ...STATUS]) {
      const ratio = contrastRatio(lin(name), ref);
      assert.ok(ratio >= 4.5, `${id}: --${name} on the panel ${panel}: ${ratio.toFixed(2)}:1`);
    }
    for (const c of categorical(T)) assert.ok(contrastRatio(c.linear, ref) >= 3, `${id}: ${c.name} on the panel ${panel}`);
  });

  test(`${id}: gridlines are visible but never text (--ink-faint is not asked to reach 4.5:1)`, () => {
    const ratio = contrastRatio(lin("ink-faint"), lin("surface-0"));
    assert.ok(ratio >= 1.5, `${id}: --ink-faint on --surface-0 ${ratio.toFixed(2)}:1 would vanish`);
    assert.ok(ratio < 4.5, `${id}: --ink-faint at ${ratio.toFixed(2)}:1 would be mistaken for text`);
  });
}

test("every theme overrides only tokens that exist in tokens.css", () => {
  const base = parseTokensCss(baseCss);
  for (const id of THEME_IDS.filter((t) => t !== "observatory")) {
    const merged = parseTokensCss(baseCss, { theme: id, themeCss: themeCss[id] });
    for (const name of Object.keys(merged)) {
      if (name === "--decor" || name === "--glow") continue;
      assert.ok(name in base, `${id}.css defines ${name}, which tokens.css does not`);
    }
  }
});

test("blueprint and print switch decoration and glow off, observatory keeps both", () => {
  const values = (id) => parseTokensCss(baseCss + themeCss.observatory, { theme: id, themeCss: themeCss[id] });
  assert.equal(values("observatory")["--decor"], "1");
  assert.equal(values("observatory")["--glow"], "1");
  for (const id of ["blueprint", "print"]) {
    assert.equal(values(id)["--decor"], "0", `${id} decor`);
    assert.equal(values(id)["--glow"], "0", `${id} glow`);
  }
});

test("scene pigments follow the theme: print inverts onto paper, blueprint stays in the blue ramp, observatory is untouched", () => {
  assert.equal(themePigment("#ff9a4a", "observatory"), "#ff9a4a");
  const probe = (css) => buildTokens({ "--p": css, "--font-head": "h", "--font-body": "b", "--font-mono": "m" }).color.p.linear;
  const lightnessOf = (css) => linearToOklab(probe(css))[0];
  const backdrop = themePigment("#01030a", "print");
  const tint = themePigment("#eaf2ff", "print");
  assert.ok(lightnessOf(backdrop) > 0.92, `a near-black backdrop becomes paper (${backdrop})`);
  assert.ok(lightnessOf(tint) < 0.25, `a pale tint becomes ink (${tint})`);
  for (const mid of ["#7fb0ff", "#ff9a4a", "#6ee7a0"]) {
    const ratio = contrastRatio(probe(themePigment(mid, "print")), [1, 1, 1]);
    assert.ok(ratio >= 3, `${mid} on paper ${ratio.toFixed(2)}:1`);
  }
  const bp = themePigment("#ff9a4a", "blueprint");
  const chroma = Number(/oklch\([\d.]+ ([\d.]+)/.exec(bp)[1]);
  assert.ok(chroma < 0.075 && chroma > 0.03, `blueprint keeps a faint Prussian tint and little else (${bp})`);
  assert.equal(themePigment("not a colour", "print"), "not a colour");
  assert.throws(() => themePigment("#fff", "sepia"), /unknown theme/);
  // The mapping is monotone in lightness, so tonal order inside a scene survives the theme.
  const ramp = ["#01030a", "#182c49", "#5382c8", "#9fd0ff", "#eaf2ff"];
  for (const id of ["print", "blueprint"]) {
    const L = ramp.map((c) => lightnessOf(themePigment(c, id)));
    const sorted = id === "print" ? [...L].sort((a, b) => b - a) : [...L].sort((a, b) => a - b);
    assert.deepEqual(L, sorted, `${id} keeps the tonal order`);
  }
});

test("the same pigment token reads differently in each theme through buildTokens", () => {
  const raw = parseTokensCss(baseCss);
  const hexOf = (id) => buildTokens(raw, id).color["pigment-azure-82"].hex;
  assert.notEqual(hexOf("observatory"), hexOf("print"));
  assert.notEqual(hexOf("observatory"), hexOf("blueprint"));
  assert.notEqual(hexOf("print"), hexOf("blueprint"));
});

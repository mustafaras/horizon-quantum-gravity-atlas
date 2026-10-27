import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  srgbToLinear, linearToSrgb, linearToOklab, oklabToLinear, oklchToLinear, linearToOklch,
  linearToLab, deltaE2000, deltaE2000Linear, contrastRatio, relativeLuminance, cssColorToLinear,
  parseCssColor, linearToHex,
} from "../js/design/color.mjs";
import { simulateCvd, CVD_TYPES } from "../js/design/cvd.mjs";
import { CVD_TABLES } from "../js/design/cvd-data.mjs";
import {
  parseTokensCss, buildTokens, readTokens, onThemeChange, setTokenSource, current, css, alpha, hex, hexString,
  linearRef, rgb255, hueTint, tint, monoPx, TYPE_STEPS,
} from "../js/design/tokens.mjs";
import {
  SEQUENTIAL_NAMES, SEQUENTIAL_SIZE, sequentialEntry, sequentialTable, sampleSequential, categorical, diverging,
} from "../js/design/palettes.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokensCss = fs.readFileSync(path.join(root, "styles", "tokens.css"), "utf8");
const values = parseTokensCss(tokensCss);
const T = buildTokens(values);
const lin = (name) => T.color[name].linear;

const SURFACES = ["surface-0", "surface-1", "surface-2"];
const STATUS = ["established", "effective", "schematic", "conjectural", "open", "heuristic"].map((s) => `status-${s}`);
const VISIONS = ["normal", ...CVD_TYPES];
const see = (rgb, vision) => (vision === "normal" ? rgb : simulateCvd(rgb, vision));

// ---- colour mathematics -----------------------------------------------------------------------

test("CIEDE2000 reproduces the Sharma, Wu and Dalal (2005) reference pairs", () => {
  const pairs = [
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
    [[50, 2.8361, -74.02], [50, 0, -82.7485], 3.4412],
    [[50, 2.5, 0], [50, 0, -2.5], 4.3065],
    [[50, 2.5, 0], [73, 25, -18], 27.1492],
    [[50, 2.5, 0], [61, -5, 29], 22.8977],
    [[50, 2.5, 0], [56, -27, -3], 31.903],
    [[50, 2.5, 0], [58, 24, 15], 19.4535],
    [[50, 2.5, 0], [50, 3.1736, 0.5854], 1.0],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
  ];
  for (const [a, b, expected] of pairs) {
    assert.ok(Math.abs(deltaE2000(a, b) - expected) < 5e-5, `ΔE00 ${a} vs ${b}: ${deltaE2000(a, b)} ≠ ${expected}`);
    assert.ok(Math.abs(deltaE2000(b, a) - expected) < 5e-5, "ΔE00 is symmetric");
  }
  assert.equal(deltaE2000([50, 2.5, 0], [50, 2.5, 0]), 0);
});

test("sRGB white maps to CIELAB (100, 0, 0) and OKLab (1, 0, 0)", () => {
  const lab = linearToLab([1, 1, 1]);
  assert.ok(Math.abs(lab[0] - 100) < 1e-3 && Math.abs(lab[1]) < 1e-3 && Math.abs(lab[2]) < 1e-3, `lab ${lab}`);
  const ok = linearToOklab([1, 1, 1]);
  assert.ok(Math.abs(ok[0] - 1) < 1e-6 && Math.abs(ok[1]) < 1e-6 && Math.abs(ok[2]) < 1e-6, `oklab ${ok}`);
});

test("OKLab/OKLCH matches Ottosson's published sRGB primaries", () => {
  // https://bottosson.github.io/posts/oklab/ : red (0.628, 0.225, 0.126) in OKLab, i.e. OKLCH (0.628, 0.258, 29.2°).
  const red = linearToOklab([1, 0, 0]);
  assert.ok(Math.abs(red[0] - 0.628) < 1e-3 && Math.abs(red[1] - 0.2249) < 1e-3 && Math.abs(red[2] - 0.1258) < 1e-3, `red ${red}`);
  const lch = linearToOklch([1, 0, 0]);
  assert.ok(Math.abs(lch[1] - 0.2577) < 1e-3 && Math.abs(lch[2] - 29.23) < 0.05, `red lch ${lch}`);
  const back = oklchToLinear([0.62796, 0.25768, 29.234]);
  assert.ok(Math.abs(back[0] - 1) < 1e-3 && Math.abs(back[1]) < 1e-3 && Math.abs(back[2]) < 1e-3, `back ${back}`);
});

test("OKLCH round trip stays within 1e-6 over the sRGB cube and an OKLCH grid", () => {
  let worst = 0;
  for (let r = 0; r <= 1; r += 0.125) for (let g = 0; g <= 1; g += 0.125) for (let b = 0; b <= 1; b += 0.125) {
    const out = oklchToLinear(linearToOklch([r, g, b]));
    for (let k = 0; k < 3; k++) worst = Math.max(worst, Math.abs(out[k] - [r, g, b][k]));
  }
  for (let L = 0.1; L <= 1; L += 0.1) for (let C = 0; C <= 0.3; C += 0.05) for (let H = 0; H < 360; H += 15) {
    const [l2, c2, h2] = linearToOklch(oklchToLinear([L, C, H]));
    worst = Math.max(worst, Math.abs(l2 - L), Math.abs(c2 - C));
    if (C > 0.01) worst = Math.max(worst, Math.abs((((h2 - H + 540) % 360) - 180)) * C * Math.PI / 180);
  }
  assert.ok(worst < 1e-6, `worst round-trip error ${worst}`);
});

test("sRGB transfer function round trips and WCAG contrast has its known extremes", () => {
  for (let v = 0; v <= 1; v += 0.01) assert.ok(Math.abs(srgbToLinear(linearToSrgb(v)) - v) < 1e-12);
  assert.ok(Math.abs(contrastRatio([1, 1, 1], [0, 0, 0]) - 21) < 1e-9);
  assert.equal(contrastRatio([0.3, 0.3, 0.3], [0.3, 0.3, 0.3]), 1);
  assert.ok(Math.abs(relativeLuminance([1, 1, 1]) - 1) < 1e-12);
});

test("cssColorToLinear handles hex, rgb[a](), oklch() and color(srgb-linear)", () => {
  assert.deepEqual(cssColorToLinear("#ffffff"), [1, 1, 1]);
  assert.deepEqual(cssColorToLinear("#000"), [0, 0, 0]);
  assert.ok(Math.abs(cssColorToLinear("#808080")[0] - 0.2158605) < 1e-6);
  assert.deepEqual(cssColorToLinear("rgb(255, 0, 0)"), [1, 0, 0]);
  assert.deepEqual(cssColorToLinear("rgba(255,0,0,0.4)"), [1, 0, 0]);
  assert.deepEqual(cssColorToLinear("rgb(0 255 0 / 50%)"), [0, 1, 0]);
  assert.equal(parseCssColor("rgba(1,2,3,0.4)").alpha, 0.4);
  assert.equal(parseCssColor("#ff000080").alpha.toFixed(3), (128 / 255).toFixed(3));
  const white = cssColorToLinear("oklch(1 0 0)");
  for (const v of white) assert.ok(Math.abs(v - 1) < 1e-6);
  const red = cssColorToLinear("oklch(0.62796 0.25768 29.234)");
  assert.ok(Math.abs(red[0] - 1) < 2e-3 && red[1] < 2e-3 && red[2] < 2e-3);
  assert.equal(parseCssColor("oklch(0.7 0.1 150 / 0.25)").alpha, 0.25);
  assert.deepEqual(cssColorToLinear("color(srgb-linear 1 0.42 0.22)"), [1, 0.42, 0.22]);
  assert.throws(() => cssColorToLinear("notacolour"), TypeError);
  assert.equal(parseCssColor("var(--x)"), null);
  assert.equal(linearToHex(cssColorToLinear("#54aeff")), 0x54aeff);
});

test("every hex byte survives the linear round trip", () => {
  for (let v = 0; v < 256; v++) {
    const hexStr = `#${v.toString(16).padStart(2, "0")}${v.toString(16).padStart(2, "0")}${v.toString(16).padStart(2, "0")}`;
    assert.equal(linearToHex(cssColorToLinear(hexStr)), (v << 16) | (v << 8) | v);
  }
});

// ---- colour-vision-deficiency simulation ------------------------------------------------------

test("Machado 2009 tables: 11 severities per type, identity at 0, white preserved, severity 1 matches the paper", () => {
  for (const type of CVD_TYPES) {
    const tables = CVD_TABLES[type];
    assert.equal(tables.length, 11);
    assert.deepEqual(tables[0].map((r) => r.map((v) => v + 0)), [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    for (const m of tables) for (const row of m) assert.ok(Math.abs(row.reduce((a, b) => a + b, 0) - 1) < 2e-3, `${type} row sums to 1`);
  }
  assert.deepEqual(CVD_TABLES.protan[10], [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]);
  assert.deepEqual(CVD_TABLES.deutan[10], [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]]);
  assert.deepEqual(CVD_TABLES.tritan[10], [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]]);
});

test("simulateCvd: severity 0 is identity, 1 applies the matrix, intermediate severities interpolate, bad input throws", () => {
  const c = [0.2, 0.6, 0.4];
  assert.deepEqual(simulateCvd(c, "deutan", 0), c);
  const full = simulateCvd([1, 0, 0], "protan");
  assert.ok(Math.abs(full[0] - 0.152286) < 1e-9 && Math.abs(full[1] - 0.114503) < 1e-9 && full[2] === 0, `${full}`);
  const half = simulateCvd(c, "tritan", 0.5);
  const lo = simulateCvd(c, "tritan", 0.4);
  const hi = simulateCvd(c, "tritan", 0.6);
  for (let k = 0; k < 3; k++) assert.ok(half[k] >= Math.min(lo[k], hi[k]) - 1e-12 && half[k] <= Math.max(lo[k], hi[k]) + 1e-12);
  const quarter = simulateCvd(c, "protan", 0.25);
  const a = simulateCvd(c, "protan", 0.2);
  const b = simulateCvd(c, "protan", 0.3);
  for (let k = 0; k < 3; k++) assert.ok(Math.abs(quarter[k] - (a[k] + b[k]) / 2) < 1e-12);
  assert.deepEqual(simulateCvd([1, 1, 1], "tritan").map((v) => +v.toFixed(2)), [1, 1, 1]);
  assert.deepEqual(simulateCvd(c, "deuteranopia"), simulateCvd(c, "deutan"));
  assert.throws(() => simulateCvd(c, "nope"), RangeError);
  assert.throws(() => simulateCvd(c, "protan", 1.2), RangeError);
  assert.deepEqual(c, [0.2, 0.6, 0.4], "input is not mutated");
});

// ---- the stylesheet is the single source ---------------------------------------------------------

test("styles/tokens.css parses: one :root rule, aliases resolve, no dangling var()", () => {
  assert.equal([...tokensCss.matchAll(/:root\s*\{/g)].length, 1, "exactly one :root rule");
  for (const [name, value] of Object.entries(values)) assert.ok(!/var\(/.test(value), `${name} still has var(): ${value}`);
  assert.equal(values["--text"], values["--ink"]);
  assert.equal(values["--acc"], values["--accent"]);
  assert.throws(() => parseTokensCss(":root{--a:var(--b);--b:var(--a);}"), /circular/);
  assert.throws(() => parseTokensCss(":root{--a:var(--missing);}"), /undefined/);
  assert.equal(parseTokensCss(":root{--a:var(--missing, 3px);}")["--a"], "3px");
});

test("legacy names keep their pre-S02 values exactly", () => {
  const legacy = {
    "--bg": "#05080f", "--bg-2": "#080d1a", "--panel": "rgba(16, 22, 38, 0.72)", "--panel-solid": "#0c1322",
    "--line": "rgba(120, 160, 220, 0.14)", "--line-strong": "rgba(120, 160, 220, 0.28)", "--text": "#e8eef8",
    "--text-dim": "#93a1ba", "--head": "#f3f7fe", "--acc": "#54aeff", "--acc-2": "#46d4e0", "--cyan": "#46d4e0",
    "--gold": "#ffb454", "--acc-soft": "rgba(84, 174, 255, 0.16)", "--danger": "#ff7b72",
    "--font-head": '"Space Grotesk", system-ui, sans-serif', "--font-body": '"Sora", system-ui, sans-serif',
    "--font-mono": '"IBM Plex Mono", monospace', "--radius": "13px", "--sidebar-w": "276px",
    "--glass": "rgba(11, 16, 27, 0.55)", "--glass-strong": "rgba(9, 13, 22, 0.8)",
    "--edge": "rgba(150, 180, 230, 0.16)", "--edge-bright": "rgba(150, 180, 230, 0.34)",
  };
  for (const [name, value] of Object.entries(legacy)) assert.equal(values[name], value, name);
});

test("buildTokens exposes colours, fonts, durations and the type scale", () => {
  assert.ok(Object.isFrozen(T) && Object.isFrozen(T.color) && Object.isFrozen(T.color["ink"]) && Object.isFrozen(T.color["ink"].linear));
  assert.equal(T.color["surface-0"].css, "#05080f");
  assert.deepEqual(T.dur, { instant: 90, quick: 180, settle: 420, scene: 900 });
  assert.equal(T.ease["out-quart"], "cubic-bezier(0.25, 1, 0.5, 1)");
  assert.equal(T.ease["in-out-cubic"], "cubic-bezier(0.65, 0, 0.35, 1)");
  assert.equal(T.font.mono(0), '15px "IBM Plex Mono", monospace');
  assert.equal(T.font.head(1, 600), '600 18px "Space Grotesk", system-ui, sans-serif');
  assert.equal(T.font.monoPx(9.5), '9.5px "IBM Plex Mono", monospace');
  assert.equal(T.font.bodyPx(12), '12px "Sora", system-ui, sans-serif');
  assert.throws(() => T.font.mono(9), RangeError);
  assert.throws(() => T.font.monoPx(0), RangeError);
  assert.throws(() => buildTokens({ "--font-head": "x" }), /font-body|font-mono/);
});

test("type scale: base 15 px, ratio 1.2, steps -2 … 5, no step below the 10 px floor", () => {
  assert.deepEqual(TYPE_STEPS, [-2, -1, 0, 1, 2, 3, 4, 5]);
  assert.equal(T.step[0], 15);
  for (const n of TYPE_STEPS) {
    assert.ok(Math.abs(T.step[n] - 15 * 1.2 ** n) < 0.01 + 1e-9, `step ${n}: ${T.step[n]} vs ${15 * 1.2 ** n}`);
    assert.ok(T.step[n] >= 10, `step ${n} under the 10 px floor`);
  }
});

test("motion tokens: the four durations ascend and use the specified values", () => {
  assert.deepEqual(Object.keys(T.dur), ["instant", "quick", "settle", "scene"]);
  const ms = Object.values(T.dur);
  assert.deepEqual(ms, [90, 180, 420, 900]);
  assert.ok(ms.every((v, i) => i === 0 || v > ms[i - 1]));
});

// ---- contrast, distinguishability ----------------------------------------------------------------

test("ink tokens (except --ink-faint) reach 4.5:1 on every surface", () => {
  for (const ink of ["ink-strong", "ink", "ink-dim"]) {
    for (const surface of SURFACES) {
      const ratio = contrastRatio(lin(ink), lin(surface));
      assert.ok(ratio >= 4.5, `--${ink} on --${surface}: ${ratio.toFixed(2)}:1`);
    }
  }
  assert.ok(contrastRatio(lin("ink-strong"), lin("surface-0")) > contrastRatio(lin("ink-dim"), lin("surface-0")), "ink levels descend");
  assert.ok(contrastRatio(lin("ink"), lin("surface-0")) > contrastRatio(lin("ink-dim"), lin("surface-0")));
});

test("status colours are text-legible on every surface", () => {
  for (const status of STATUS) for (const surface of SURFACES) {
    const ratio = contrastRatio(lin(status), lin(surface));
    assert.ok(ratio >= 4.5, `--${status} on --${surface}: ${ratio.toFixed(2)}:1`);
  }
});

test("the six status colours are pairwise ΔE00 ≥ 12 for normal, protan, deutan and tritan vision", () => {
  for (const vision of VISIONS) {
    for (let i = 0; i < STATUS.length; i++) for (let j = i + 1; j < STATUS.length; j++) {
      const d = deltaE2000Linear(see(lin(STATUS[i]), vision), see(lin(STATUS[j]), vision));
      assert.ok(d >= 12, `${STATUS[i]} vs ${STATUS[j]} under ${vision}: ΔE00 ${d.toFixed(2)}`);
    }
  }
});

test("categorical palette: 8 entries, neighbours ΔE00 ≥ 10 in every vision, each ≥ 3:1 on the surfaces", () => {
  const cat = categorical(T);
  assert.equal(cat.length, 8);
  assert.deepEqual(cat.map((c) => c.name), Array.from({ length: 8 }, (_, i) => `cat-${i + 1}`));
  for (const vision of VISIONS) {
    for (let i = 0; i + 1 < cat.length; i++) {
      const d = deltaE2000Linear(see(cat[i].linear, vision), see(cat[i + 1].linear, vision));
      assert.ok(d >= 10, `cat-${i + 1} vs cat-${i + 2} under ${vision}: ΔE00 ${d.toFixed(2)}`);
    }
  }
  for (const c of cat) for (const surface of SURFACES) {
    assert.ok(contrastRatio(c.linear, lin(surface)) >= 3, `${c.name} non-text contrast on --${surface}`);
  }
  assert.equal(new Set(cat.map((c) => c.css)).size, 8);
});

test("diverging palette: blue for negative, orange for positive, dark neutral at zero, ends distinct in every vision", () => {
  const div = diverging(T);
  assert.equal(div.stops.length, 5);
  const [neg, zero, pos] = [div.sample(-1), div.sample(0), div.sample(1)];
  assert.ok(neg[2] > neg[0], "negative end is blue");
  assert.ok(pos[0] > pos[2], "positive end is orange");
  assert.ok(relativeLuminance(zero) < relativeLuminance(neg) && relativeLuminance(zero) < relativeLuminance(pos), "zero is the darkest");
  for (const vision of VISIONS) assert.ok(deltaE2000Linear(see(neg, vision), see(pos, vision)) >= 30, `ends under ${vision}`);
  assert.deepEqual(div.sample(-5), div.sample(-1));
  assert.deepEqual(div.sample(NaN), div.sample(0));
  const l = (v) => linearToOklab(div.sample(v))[0];
  assert.ok(l(-1) > l(-0.5) && l(-0.5) > l(0) && l(1) > l(0.5) && l(0.5) > l(0), "lightness rises away from zero");
});

// ---- sequential tables -----------------------------------------------------------------------------

test("sequential tables: 256 linear-sRGB entries each, ordered by lightness, no rainbow", () => {
  assert.deepEqual([...SEQUENTIAL_NAMES], ["viridis", "magma", "cividis"]);
  for (const name of SEQUENTIAL_NAMES) {
    const table = sequentialTable(name);
    assert.equal(table.length, SEQUENTIAL_SIZE);
    let previous = -1;
    for (const rgb of table) {
      assert.ok(rgb.every((v) => v >= 0 && v <= 1), `${name} in gamut`);
      const L = linearToOklab(rgb)[0];
      assert.ok(L > previous - 2e-3, `${name} lightness must rise monotonically (±2e-3)`);
      previous = L;
    }
    assert.ok(linearToOklab(table[255])[0] - linearToOklab(table[0])[0] > 0.4, `${name} spans most of the lightness range`);
  }
});

test("sequential tables match the matplotlib endpoints (sRGB) and sampling interpolates them", () => {
  const srgb = (rgb) => rgb.map(linearToSrgb);
  const expect = (name, i, want) => {
    const got = srgb(sequentialEntry(name, i));
    for (let k = 0; k < 3; k++) assert.ok(Math.abs(got[k] - want[k]) < 2e-6, `${name}[${i}] ${got} vs ${want}`);
  };
  expect("viridis", 0, [0.267004, 0.004874, 0.329415]);
  expect("viridis", 255, [0.993248, 0.906157, 0.143936]);
  expect("magma", 0, [0.001462, 0.000466, 0.013866]);
  expect("magma", 255, [0.987053, 0.991438, 0.749504]);
  expect("cividis", 0, [0.0, 0.135112, 0.304751]);
  expect("cividis", 255, [0.995737, 0.909344, 0.217772]);
  assert.deepEqual(sampleSequential("viridis", 0), sequentialEntry("viridis", 0));
  assert.deepEqual(sampleSequential("viridis", 1), sequentialEntry("viridis", 255));
  assert.deepEqual(sampleSequential("viridis", -3), sequentialEntry("viridis", 0));
  const mid = sampleSequential("magma", 0.5 / 255);
  const [e0, e1] = [sequentialEntry("magma", 0), sequentialEntry("magma", 1)];
  for (let k = 0; k < 3; k++) assert.ok(Math.abs(mid[k] - (e0[k] + e1[k]) / 2) < 1e-12);
  assert.throws(() => sequentialEntry("jet", 0), RangeError);
  assert.throws(() => sequentialEntry("viridis", 256), RangeError);
});

test("no rainbow or jet colormap is provided anywhere in the palette API", () => {
  const source = fs.readFileSync(path.join(root, "js", "design", "palettes.mjs"), "utf8") + fs.readFileSync(path.join(root, "js", "design", "palette-data.mjs"), "utf8");
  assert.ok(!/\b(jet|rainbow|hsv)\b/i.test(source.replace(/Rainbow \/ jet maps are not provided[^\n]*\n/, "")), "no rainbow table in the palette source");
});

// ---- runtime helpers over a token source ---------------------------------------------------------------

test("short forms read the installed token source and fail loudly on a typo", () => {
  setTokenSource(T);
  try {
    assert.equal(css("accent"), "#54aeff");
    assert.equal(hex("accent"), 0x54aeff);
    assert.equal(hexString("accent"), "#54aeff");
    assert.equal(alpha("accent", 0.5), "rgba(84,174,255,0.5)");
    assert.equal(alpha("accent", 0.5), alpha("accent", 0.5));
    assert.equal(alpha("status-open", 0.4), "oklch(0.668 0.13 23 / 0.4)");
    assert.equal(alpha("pigment-white", 0), "rgba(255,255,255,0)");
    assert.equal(monoPx(10), '10px "IBM Plex Mono", monospace');
    assert.equal(linearRef("emit-hawking-cold")[1], 0.42);
    assert.equal(linearRef("emit-hawking-cold"), linearRef("emit-hawking-cold"), "no copy");
    assert.equal(current(), T);
    assert.throws(() => css("accnt"), /unknown colour token/);
    assert.throws(() => hex("nope"), RangeError);
    assert.equal(rgb255(12.9, 255, 0), "rgb(12,255,0)");
    assert.equal(hueTint("grid", 210.4, 0.035), "hsla(210, 45%, 65%, 0.035)");
    assert.equal(hueTint("star", 90), "hsla(90, 38%, 80%, 1)");
    assert.deepEqual({ ...tint("primary") }, { s: 0.62, l: 0.62, sPct: 62, lPct: 62 });
    assert.throws(() => tint("nope"), /unknown tint/);
  } finally {
    setTokenSource(null);
  }
  assert.throws(() => current(), /no document and no source/);
});

test("alpha memoisation is bounded", () => {
  setTokenSource(T);
  try {
    for (let i = 0; i < 1000; i++) alpha("ink", i / 1000);
    assert.equal(alpha("ink", 0.999), "rgba(232,238,248,0.999)");
  } finally {
    setTokenSource(null);
  }
});

test("readTokens scans :root rules and reads computed values; onThemeChange invalidates and unsubscribes", () => {
  const props = { "--surface-0": "#05080f", "--ink": "#e8eef8", "--font-head": "H", "--font-body": "B", "--font-mono": "M", "--dur-quick": "180ms", "--step-0": "15px" };
  const rule = (selectorText, names) => ({ selectorText, style: names });
  const doc = {
    styleSheets: [
      { cssRules: [rule(":root", Object.keys(props)), rule("body", ["--ignored"]), { cssRules: [rule("html[data-theme=\"light\"]", [])] }] },
      { get cssRules() { throw new Error("cross-origin"); } },
    ],
    defaultView: { getComputedStyle: () => ({ getPropertyValue: (p) => ` ${props[p] ?? ""} ` }) },
  };
  const rootEl = { ownerDocument: doc };
  const t = readTokens(rootEl);
  assert.equal(t.color["surface-0"].css, "#05080f");
  assert.equal(t.dur.quick, 180);
  assert.equal(t.step[0], 15);
  assert.ok(!("ignored" in t.color));

  const listeners = new Map();
  const target = {
    documentElement: rootEl,
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type, fn) => { if (listeners.get(type) === fn) listeners.delete(type); },
  };
  const seen = [];
  const off = onThemeChange((tokens) => seen.push(tokens.color["ink"].css), target);
  assert.ok(listeners.has("qga:theme"));
  props["--ink"] = "#ffffff";
  listeners.get("qga:theme")({ type: "qga:theme" });
  assert.deepEqual(seen, ["#ffffff"]);
  off();
  assert.ok(!listeners.has("qga:theme"));
});

// ---- references in code -------------------------------------------------------------------------------

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(jsx|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test("every token name used in module code exists in styles/tokens.css", () => {
  const pattern = /\b(?:QGA_TOKENS|TK)\.(?:css|alpha|hex|hexString|linear|linearRef)\(\s*"([\w-]+)"/g;
  let checked = 0;
  for (const file of walk(path.join(root, "js"))) {
    const src = fs.readFileSync(file, "utf8");
    for (const m of src.matchAll(pattern)) {
      checked++;
      assert.ok(T.color[m[1]], `${path.relative(root, file)} uses unknown colour token "${m[1]}"`);
    }
  }
  assert.ok(checked > 300, `expected hundreds of token reads, found ${checked}`);
});

test("every pigment token is used by module code (no orphaned pigments)", () => {
  const sources = walk(path.join(root, "js")).map((f) => fs.readFileSync(f, "utf8")).join("\n");
  const pigments = Object.keys(T.color).filter((n) => n.startsWith("pigment-"));
  assert.ok(pigments.length > 100);
  const unused = pigments.filter((n) => !sources.includes(`"${n}"`));
  assert.deepEqual(unused, [], `unused pigments: ${unused.join(", ")}`);
});

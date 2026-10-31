// Guided tours (S31): the manifests, the step runner, the resume store and the worksheet.
//
// The interesting assertions are the ones a screenshot cannot make: every step names a view and a state key the app
// really owns, every `formulaFocus` names a card that exists, every shot the tours use is in the cinematic manifest,
// and every number printed on a worksheet is recomputed here from the module that owns it.

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  TOUR_LIMITS, TOUR_RESUME_SCHEMA, clampStep, createTourResumeStore, findTour, formatStepCounter,
  nextStep, parsePrintParam, parseStepParam, parseTourParam, previousStep,
  stepUrl, validateTour, validateTourLibrary, worksheetHeader, worksheetRows, worksheetUrl,
} from "../js/tours/tour-schema.mjs";
import { applyStepState, describePatch, moveStep, resumeStep, stepPlan, tourEntry } from "../js/tours/tour-runner.mjs";
import { TOUR_IDS, TOUR_LIBRARY } from "../js/tours/tour-manifests.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");

/** The app tables the manifests are validated against, read from source so the two can never drift. */
async function appTables() {
  const [app, state] = await Promise.all([read("js/app.jsx"), read("js/state.jsx")]);
  const views = [...app.match(/const QGA_VIEWS = \{([\s\S]*?)\n\};/)[1].matchAll(/^ {2}([A-Za-z][\w-]*):/gm)]
    .map((m) => m[1]);
  const stateKeys = [...state.match(/QGA_STATE_KEYS\s*=\s*\{([\s\S]*?)\};/)[1].matchAll(/(\w+):\s*"(\w+)"/g)]
    .map((m) => m[1]);
  return { views, stateKeys };
}

/** A memory-backed Storage, so the resume store is tested without a browser. */
function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
  };
}

/* ---------- the shipped library ---------- */

test("the three tours are well formed against the app's own view and state tables", async () => {
  const { views, stateKeys } = await appTables();
  const result = validateTourLibrary(TOUR_LIBRARY, { views, stateKeys });
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.deepEqual(TOUR_IDS, [
    "why-gravity-resists-quantisation",
    "what-a-black-hole-image-measures",
    "hearing-spacetime",
  ]);
  const lengths = TOUR_LIBRARY.map((tour) => tour.steps.length);
  assert.deepEqual(lengths, [13, 8, 7], "the prompt asks for ~12, ~8 and ~7 steps");
  for (const tour of TOUR_LIBRARY) {
    assert.ok(tour.summary.length > 40, `${tour.id} needs a summary a teacher can read`);
    assert.ok(tour.references.length >= 3, `${tour.id} needs its primary sources`);
    for (const reference of tour.references) {
      assert.match(reference.url, /^https:\/\//, `${tour.id}: a reference must be resolvable over https`);
    }
  }
});

test("every formulaFocus names a card the app actually renders, and every shot is in the cinematic manifest", async () => {
  const index = await read("js/data.jsx");
  const titles = new Set(
    [...index.match(/const QGA_FORMULA_INDEX = \[([\s\S]*?)\n\];/)[1].matchAll(/title: "([^"]+)"/g)].map((m) => m[1]),
  );
  const { QGA_SHOT_MANIFESTS } = await import("../js/cinematic/shot-manifests.mjs");
  const shots = new Set(Object.values(QGA_SHOT_MANIFESTS).flat().map((shot) => shot.id));

  for (const tour of TOUR_LIBRARY) {
    for (const [i, step] of tour.steps.entries()) {
      if (step.formulaFocus) {
        assert.ok(titles.has(step.formulaFocus), `${tour.id} step ${i + 1}: "${step.formulaFocus}" is not a formula card`);
      }
      if (step.shot) {
        assert.ok(shots.has(step.shot), `${tour.id} step ${i + 1}: "${step.shot}" is not a cinematic shot`);
      }
    }
  }
});

test("a tour's state patches survive the URL reader unchanged", async () => {
  // The patches a tour writes are the ones the reader must be able to read back. This runs the real reader in a VM,
  // exactly as test/kerr-render-state.test.mjs does, so a patch that the reader would clamp away fails here.
  const vm = await import("node:vm");
  const source = await read("js/state.jsx");
  const window = {
    location: { search: "", pathname: "/", hash: "", href: "http://x/" },
    QGA_PHYSICS: { sanitizeCausalState: (state) => state },
  };
  const context = vm.createContext({ window, localStorage: { getItem: () => null }, URLSearchParams, URL });
  vm.runInContext(`${source}\n;globalThis.__api = { qgaReadState, qgaStateSearch, QGA_STATE_KEYS };`, context);
  const api = context.__api;
  const longKeys = Object.fromEntries(Object.entries(api.QGA_STATE_KEYS).map(([long, short]) => [long, short]));
  const reverse = Object.fromEntries(Object.entries(longKeys).map(([long, short]) => [short, long]));

  for (const tour of TOUR_LIBRARY) {
    for (const [i, step] of tour.steps.entries()) {
      if (!step.state) continue;
      const url = `?view=${step.view}&tour=${tour.id}&step=${i + 1}`;
      const base = api.qgaReadState(url);
      const applied = { ...base, ...step.state };
      const search = api.qgaStateSearch(applied);
      const back = api.qgaReadState(search);
      for (const [key, value] of Object.entries(step.state)) {
        const param = longKeys[key];
        assert.ok(param, `${tour.id} step ${i + 1}: ${key} has no URL parameter`);
        assert.ok(reverse[param] === key, `${tour.id} step ${i + 1}: ${param} does not map back to ${key}`);
        assert.equal(back[key], value, `${tour.id} step ${i + 1}: ${key} = ${value} did not survive the URL round trip`);
      }
      assert.equal(back.tour, tour.id);
      assert.equal(back.tourStep, i + 1);
    }
  }
});

/* ---------- the claims ---------- */

test("every number a tour quotes is the number this repository computes", async () => {
  const physics = await import("../js/physics.mjs");
  const kerrShadow = await import("../js/science/kerr-shadow.mjs");
  const pn = await import("../js/science/pn-waveform.mjs");
  const evaporation = await import("../js/science/evaporation.mjs");
  const constants = await import("../js/science/constants.mjs");
  const { library } = await import("../js/formula/library/index.mjs");

  /** A number agrees with what a tour prints when it matches at the printed significant digits. */
  const agrees = (printed, computed, significantDigits) => {
    const expected = Number(printed);
    assert.ok(Number.isFinite(expected), `"${printed}" must be a number`);
    const tolerance = 0.5 * Math.pow(10, Math.floor(Math.log10(Math.abs(expected))) - significantDigits + 1);
    assert.ok(Math.abs(Math.abs(computed) - Math.abs(expected)) <= tolerance,
      `the tour prints ${printed} but the module computes ${computed}`);
  };

  agrees(5.1962, kerrShadow.SCHWARZSCHILD_CRITICAL_B, 5);
  // A 10 M☉ Schwarzschild hole: the temperature the black-hole tour and the hearing tour both quote.
  agrees(6.17e-9, physics.hawkingTemperature(10, 0), 3);
  agrees(0.5381, evaporation.pageTimeFraction(), 4);
  agrees(1.4847, evaporation.PAGE_BETA, 5);
  agrees(1.6163e-35, library.planckLength.evaluate({}), 5);
  assert.equal(evaporation.pageTimeFraction().toFixed(4), "0.5381", "the quoted Page time is the module's own number");

  // The M87* shadow: 39.7 μas, quoted in the black-hole tour.
  const microarcsec = kerrShadow.shadowDiameterMicroarcsec({ massSolar: 6.5e9, distanceMpc: 16.8 });
  assert.equal(microarcsec.toFixed(1), "39.7");

  // GW150914: chirp mass, ISCO frequency, remnant and ringdown, quoted in the black-hole and hearing tours.
  assert.equal(pn.chirpMassSolar(36, 29).toFixed(2), "28.10");
  const totalMassSeconds = pn.totalMassSeconds(36, 29);
  const iscoHz = pn.gwFrequencyFromX(pn.ISCO_X, totalMassSeconds);
  assert.equal(iscoHz.toFixed(1), "67.6");
  const remnant = pn.remnant({ m1: 36, m2: 29 });
  assert.equal(remnant.massRatio.toFixed(4), "0.9527");
  assert.equal(remnant.spin.toFixed(3), "0.680");
  assert.equal((remnant.radiatedEnergyFraction * 100).toFixed(2), "4.73");
  assert.equal(pn.ringdownHz(remnant.massRatio * 65, remnant.spin).toFixed(1), "274.8");
  assert.equal((pn.ringdownTauSeconds(remnant.massRatio * 65, remnant.spin) * 1000).toFixed(1), "3.7");

  // The QCD coefficient quoted in step 5 of the first tour.
  const { C, SOLAR_MASS, G } = constants;
  assert.equal(11 - (2 * 6) / 3, 7, "b₀ = 11 − 2n_f/3 with six flavours is 7");
  assert.ok(totalMassSeconds > 0 && SOLAR_MASS > 0 && G > 0 && C > 0);
});

test("the tours quote each other's numbers consistently", () => {
  const first = TOUR_LIBRARY[0].steps.map((step) => step.expected ?? "").join(" ");
  const second = TOUR_LIBRARY[1].steps.map((step) => step.expected ?? "").join(" ");
  const third = TOUR_LIBRARY[2].steps.map((step) => step.expected ?? "").join(" ");
  // √27 appears in both the first and the second tour; it must be the same value in both.
  for (const text of [first, second, third]) {
    for (const match of text.matchAll(/√27 = ([\d.]+)/g)) assert.equal(match[1], "5.1962");
  }
  assert.match(second, /39\.7 μas|5\.1962/);
  assert.match(third, /28\.10|1\.4847|0\.5381/);
});

/* ---------- schema ---------- */

test("the schema refuses every way a tour can point at something that does not exist", () => {
  const options = { views: ["overview", "bh"], stateKeys: ["bhSpin", "view"] };
  const good = {
    id: "ok-tour", title: "A tour", steps: [{ view: "bh", text: "Text.", question: "Q?", expected: "A." }],
  };
  assert.equal(validateTour(good, options).ok, true);

  const cases = [
    [{ ...good, id: "Not Kebab" }, /kebab-case/],
    [{ ...good, id: "" }, /non-empty/],
    [{ ...good, title: "" }, /title must be/],
    [{ ...good, steps: [] }, /non-empty array/],
    [{ ...good, steps: [{ view: "nope", text: "t", question: "q" }] }, /not a view the app declares/],
    [{ ...good, steps: [{ view: "bh", text: "", question: "q" }] }, /text must be/],
    [{ ...good, steps: [{ view: "bh", text: "t", question: "" }] }, /question must be/],
    [{ ...good, steps: [{ view: "bh", text: "t", question: "q", state: { nope: 1 } }] }, /not an app state key/],
    [{ ...good, steps: [{ view: "bh", text: "t", question: "q", shot: "Not A Shot" }] }, /kebab-case shot id/],
    [{ ...good, steps: [{ view: "bh", text: "t", question: "q", formulaFocus: "" }] }, /formulaFocus must be/],
    [{ ...good, references: [{ label: "x", url: "javascript:alert(1)" }] }, /must not be a script URL/],
    [{ ...good, references: [{ label: "x" }] }, /url must be a plain URL/],
    [{ ...good, steps: Array.from({ length: TOUR_LIMITS.maxSteps + 1 }, () => ({ view: "bh", text: "t", question: "q" })) }, /at most/],
    [{ ...good, steps: [{ view: "bh", text: "t".repeat(TOUR_LIMITS.maxStepTextLength + 1), question: "q" }] }, /text must be/],
  ];
  for (const [manifest, pattern] of cases) {
    const result = validateTour(manifest, options);
    assert.equal(result.ok, false, `expected a refusal for ${JSON.stringify(manifest).slice(0, 80)}`);
    assert.ok(result.errors.some((error) => pattern.test(error)), `no error matched ${pattern}: ${result.errors.join(" | ")}`);
  }
  assert.equal(validateTour(null, options).ok, false);
  assert.equal(validateTour("tour", options).ok, false);
});

test("the library validator catches duplicate ids and the tour cap", () => {
  const options = { views: ["overview"], stateKeys: [] };
  const tour = (id) => ({ id, title: "T", steps: [{ view: "overview", text: "t", question: "q" }] });
  assert.equal(validateTourLibrary([tour("a"), tour("b")], options).ok, true);
  const duplicate = validateTourLibrary([tour("a"), tour("a")], options);
  assert.equal(duplicate.ok, false);
  assert.ok(duplicate.errors.some((error) => error.includes("duplicate")));
  const many = Array.from({ length: TOUR_LIMITS.maxTours + 1 }, (_, i) => tour(`t-${i}`));
  assert.ok(validateTourLibrary(many, options).errors.some((error) => error.includes("at most")));
  assert.equal(validateTourLibrary("nope", options).ok, false);
});

/* ---------- URL parameters ---------- */

test("tour, step and print parameters accept only what they promise", () => {
  assert.equal(parseTourParam("hearing-spacetime"), "hearing-spacetime");
  assert.equal(parseTourParam("  hearing-spacetime  "), "hearing-spacetime");
  assert.equal(parseTourParam("Hearing-Spacetime"), null);
  assert.equal(parseTourParam("bad_id"), null);
  assert.equal(parseTourParam("x".repeat(TOUR_LIMITS.maxIdLength + 1)), null);
  assert.equal(parseTourParam(null), null);

  assert.equal(parseStepParam("1"), 1);
  assert.equal(parseStepParam(4), 4);
  assert.equal(parseStepParam("0"), null);
  assert.equal(parseStepParam("1.5"), null);
  assert.equal(parseStepParam("abc"), null);
  assert.equal(parseStepParam(String(TOUR_LIMITS.maxUrlSteps + 1)), null);

  assert.equal(parsePrintParam("1"), true);
  assert.equal(parsePrintParam("true"), true);
  assert.equal(parsePrintParam("0"), false);
  assert.equal(parsePrintParam(null), false);
});

test("step arithmetic clamps instead of wrapping, and the counter never says 0 of 0", () => {
  assert.equal(clampStep(5, 3), 3);
  assert.equal(clampStep(0, 3), 1);
  assert.equal(clampStep(-9, 3), 1);
  assert.equal(clampStep(2, 0), 0);
  assert.equal(nextStep(3, 3), 3, "the last step does not wrap to the first");
  assert.equal(previousStep(1, 3), 1, "the first step does not wrap to the last");
  assert.equal(nextStep(1, 3), 2);
  assert.equal(previousStep(2, 3), 1);
  assert.equal(formatStepCounter(2, 12), "Step 2 of 12");
  assert.equal(formatStepCounter(99, 12), "Step 12 of 12");
  assert.equal(formatStepCounter(1, 0), "No steps");
});

test("step and worksheet URLs are relative, encoded and clamped", () => {
  const tour = TOUR_LIBRARY[1];
  assert.equal(stepUrl(tour, 1), `?tour=${tour.id}&step=1`);
  assert.equal(stepUrl(tour, 999), `?tour=${tour.id}&step=${tour.steps.length}`);
  assert.equal(stepUrl(tour, -2), `?tour=${tour.id}&step=1`);
  assert.equal(worksheetUrl(tour), `?tour=${tour.id}&print=1`);
});

/* ---------- runner ---------- */

test("a step plan names the view, the patch, the card and the bounds", () => {
  const tour = TOUR_LIBRARY[1];
  const plan = stepPlan(tour, 3);
  assert.equal(plan.index, 3);
  assert.equal(plan.total, tour.steps.length);
  assert.equal(plan.view, tour.steps[2].view);
  assert.deepEqual(plan.patch, tour.steps[2].state);
  assert.equal(plan.formulaFocus, tour.steps[2].formulaFocus ?? null);
  assert.equal(plan.atStart, false);
  assert.equal(plan.atEnd, false);
  assert.equal(stepPlan(tour, 1).atStart, true);
  assert.equal(stepPlan(tour, tour.steps.length).atEnd, true);
  assert.equal(stepPlan(tour, 999).index, tour.steps.length, "an out-of-range step clamps");
  assert.equal(stepPlan(tour, 0).index, 1);
  assert.equal(stepPlan(null, 1), null);
  assert.equal(stepPlan({ id: "empty", steps: [] }, 1), null);
});

test("a step patch is filtered against the live state keys", () => {
  assert.deepEqual(applyStepState({ bhSpin: 0.9, nope: 1 }, ["bhSpin"]), { bhSpin: 0.9 });
  assert.deepEqual(applyStepState({ nope: 1 }, []), {});
  assert.deepEqual(applyStepState(null, ["bhSpin"]), {});
  assert.deepEqual(applyStepState({}, ["bhSpin"]), {});
});

test("moving a tour reports whether the move happened", () => {
  assert.deepEqual(moveStep(1, 3, 1), { step: 2, moved: true });
  assert.deepEqual(moveStep(3, 3, 1), { step: 3, moved: false });
  assert.deepEqual(moveStep(1, 3, -1), { step: 1, moved: false });
  assert.deepEqual(moveStep(1, 0, 1), { step: 0, moved: false });
});

test("resume prefers the deep link, then the remembered step, and clamps both", () => {
  assert.equal(resumeStep({ urlStep: 4, remembered: 2, length: 12 }), 4);
  assert.equal(resumeStep({ urlStep: null, remembered: 2, length: 12 }), 2);
  assert.equal(resumeStep({ urlStep: null, remembered: 40, length: 12 }), 12, "a shorter tour cannot resume past its end");
  assert.equal(resumeStep({ length: 12 }), 1);
  assert.equal(resumeStep({}), 0);
});

test("tourEntry carries the first step's view and patch", () => {
  const tour = TOUR_LIBRARY[1];
  const entry = tourEntry(tour);
  assert.equal(entry.view, tour.steps[0].view);
  assert.deepEqual(entry.patch, tour.steps[0].state ?? {});
  assert.equal(entry.url, `?tour=${tour.id}&step=1`);
  assert.equal(tourEntry({ id: "x", steps: [] }), null);
});

test("describePatch speaks in the manifest's own keys, and says nothing for an empty patch", () => {
  assert.equal(describePatch({}), "");
  assert.equal(describePatch(null), "");
  assert.equal(describePatch({ bhSpin: 0.94 }), "bhSpin = 0.94");
  assert.equal(describePatch({ bhSpin: 0.94, bhInclination: 17 }), "bhSpin = 0.94 · bhInclination = 17");
});

/* ---------- find ---------- */

test("findTour resolves a valid id and refuses everything else", () => {
  assert.equal(findTour(TOUR_LIBRARY, "hearing-spacetime").title, "Hearing spacetime");
  assert.equal(findTour(TOUR_LIBRARY, "no-such-tour"), null);
  assert.equal(findTour(TOUR_LIBRARY, "Bad_Id"), null);
  assert.equal(findTour(TOUR_LIBRARY, undefined), null);
  assert.equal(findTour(undefined, "hearing-spacetime"), null);
});

/* ---------- resume store ---------- */

test("the resume store round-trips and survives a hostile storage", () => {
  const storage = memoryStorage();
  const store = createTourResumeStore({ storage });
  assert.equal(store.read("hearing-spacetime"), null);
  assert.deepEqual(store.write("hearing-spacetime", 4), { ok: true });
  assert.equal(store.read("hearing-spacetime"), 4);
  assert.deepEqual(store.ids(), ["hearing-spacetime"]);
  assert.deepEqual(store.write("Bad_Id", 1), { ok: false, reason: "invalid tour id or step" });
  assert.deepEqual(store.write("hearing-spacetime", 0), { ok: false, reason: "invalid tour id or step" });
  assert.equal(store.read("Bad_Id"), null);
  store.clear("hearing-spacetime");
  assert.equal(store.read("hearing-spacetime"), null);

  // A corrupted row is ignored, not thrown out of the page.
  storage.setItem("horizon-qga-tour-resume/v1", "{ not json");
  assert.equal(store.read("hearing-spacetime"), null);
  storage.setItem("horizon-qga-tour-resume/v1", JSON.stringify({ schema: "wrong", steps: { x: 1 } }));
  assert.equal(store.read("hearing-spacetime"), null);
  assert.deepEqual(store.ids(), []);
  storage.setItem("horizon-qga-tour-resume/v1", JSON.stringify({ schema: TOUR_RESUME_SCHEMA, steps: { ok: 2, bad: "3" } }));
  assert.equal(store.read("ok"), 2);
  assert.deepEqual(store.ids(), ["ok"], "a non-integer step is dropped, the valid one survives");

  // No storage at all: every call still returns, nothing writes.
  const none = createTourResumeStore({});
  assert.equal(none.read("hearing-spacetime"), null);
  assert.equal(none.write("hearing-spacetime", 2).ok, false);

  // A storage whose write throws is reported, not propagated.
  const refusing = { getItem: () => null, setItem: () => { throw new Error("quota"); } };
  const refusingStore = createTourResumeStore({ storage: refusing });
  const result = refusingStore.write("hearing-spacetime", 2);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "quota");
});

/* ---------- worksheet ---------- */

test("a worksheet carries every question, its expected readout and a working plain URL", () => {
  const tour = TOUR_LIBRARY[2];
  const header = worksheetHeader(tour);
  assert.equal(header.id, tour.id);
  assert.equal(header.title, tour.title);
  assert.equal(header.stepCount, tour.steps.length);
  assert.equal(header.url, `?tour=${tour.id}&print=1`);
  assert.equal(header.references.length, tour.references.length);

  const rows = worksheetRows(tour);
  assert.equal(rows.length, tour.steps.length);
  rows.forEach((row, i) => {
    assert.equal(row.number, i + 1);
    assert.equal(row.question, tour.steps[i].question);
    assert.equal(row.url, `?tour=${tour.id}&step=${i + 1}`);
    assert.equal(row.expected, tour.steps[i].expected ?? null);
    assert.ok(row.expected, `${tour.id} step ${i + 1} must have an expected readout a teacher can grade`);
    assert.ok(!/^https?:/.test(row.url), "a worksheet prints a relative link so it works on any host");
  });
  assert.deepEqual(worksheetRows(null), []);
  assert.equal(worksheetHeader("nope"), null);
});

test("every step of every tour carries a question and an expected readout", () => {
  for (const tour of TOUR_LIBRARY) {
    for (const [i, step] of tour.steps.entries()) {
      assert.ok(step.question.trim().length > 10, `${tour.id} step ${i + 1}: the question must be answerable`);
      assert.ok(step.expected && step.expected.trim().length > 10, `${tour.id} step ${i + 1}: the expected readout is what a worksheet grades`);
    }
  }
});

test("the prose typesets through KaTeX: every math span is balanced, escapable and free of control characters", () => {
  // A tour string is a JS string literal, so a TeX backslash written once becomes an escape (\times → TAB). This test
  // is the guard against that: it reads the RUNTIME strings, which is what RichText actually receives.
  for (const tour of TOUR_LIBRARY) {
    const fields = tour.steps.flatMap((step) => [step.text, step.question, step.expected ?? ""]);
    for (const [i, field] of fields.entries()) {
      assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(field),
        `${tour.id} field ${i}: a control character means a TeX backslash was written once and became an escape`);
      const dollars = (field.match(/\$/g) ?? []).length;
      assert.equal(dollars % 2, 0, `${tour.id} field ${i}: unbalanced $ delimiters in "${field.slice(0, 60)}"`);
      for (const span of field.matchAll(/\$([^$]+)\$/g)) {
        assert.ok(span[1].trim().length > 0, `${tour.id} field ${i}: an empty math span does nothing`);
        assert.ok(!/\\$/.test(span[1]), `${tour.id} field ${i}: a trailing backslash would escape the closing $`);
      }
    }
  }
});

test("the prose uses $\u2026$ for mathematics rather than raw symbols a reader cannot scale", () => {
  // KaTeX is the atlas's one typesetting route; a Unicode superscript in a tour string is a formula that skipped it.
  const RAW = /[₀-₉⁰-⁹⁺⁻₊₋]/u;
  for (const tour of TOUR_LIBRARY) {
    for (const [i, step] of tour.steps.entries()) {
      const outside = step.text.replace(/\$[^$]*\$/g, "") + step.question.replace(/\$[^$]*\$/g, "");
      assert.ok(!RAW.test(outside), `${tour.id} step ${i + 1}: raw sub/superscripts outside a math span in "${outside.slice(0, 70)}"`);
    }
  }
});

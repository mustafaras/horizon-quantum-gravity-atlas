// The electroweak amplitude room and the redrawn Feynman diagrams of the QFT view (S16), in the page.
//
//   figures    the cross-section and the asymmetry share one energy range and one plot rectangle, carry status and registered provenance, and
//              keep the LEP pole values on the data layer
//   channels   each process draws its terms as thin lines and the total as the focal line
//   diagrams   the builder draws both tree diagrams of Bhabha scattering with 3 px vertex dots, an arrow on every fermion line and KaTeX labels
//   labels     the process buttons keep their Greek letters (no capital Gamma or M from a text transform)
//   mobile     the room and the diagrams fit 390 px with no sideways scroll
//
// The diagrams do not move, so the spec needs no motion handling beyond the reduced-motion default.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 2600 } });
test.setTimeout(240_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];
const ROOM = ".qft-room";
const SIGMA = '.fig[data-figure="qft-ew-cross-section"]';
const ASYMMETRY = '.fig[data-figure="qft-ew-asymmetry"]';
const CHANNELS = '.fig[data-figure="qft-angular-channels"]';
const PROCESS_BUTTONS = `${ROOM} .kerr-control-group[aria-label="Process"] .kerr-chip`;
const PROCESS_COUNT = 5;

async function open(page, context, url = "/?view=qft&seed=42&qfp=s-channel&qfs=91.2&qfa=0") {
  await context.addInitScript(() => {
    window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" };
    sessionStorage.setItem("horizon-intro", "1");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await gotoReady(page, url, READINESS);
  await page.locator(ROOM).scrollIntoViewIfNeeded();
  await expect(page.locator(ASYMMETRY)).toBeVisible();
  return errors;
}

const scene = (page, id) => page.evaluate((figureId) => {
  const s = window.QGA_FIGURE_SCENES?.get(figureId);
  return s ? { plot: s.plot } : null;
}, id);

test("the two energy figures share one plot rectangle and one range, with registered provenance", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect.poll(() => scene(page, "qft-ew-asymmetry")).not.toBeNull();
  const [top, bottom] = [await scene(page, "qft-ew-cross-section"), await scene(page, "qft-ew-asymmetry")];
  expect(top.plot.x).toBe(bottom.plot.x);
  expect(top.plot.w).toBe(bottom.plot.w);
  for (const selector of [SIGMA, ASYMMETRY, CHANNELS]) {
    await expect(page.locator(selector)).toHaveAttribute("data-status", "effective");
    const id = await page.locator(`${selector} .fig-id`).innerText();
    const known = await page.evaluate((provenanceId) => Boolean(window.QGA_PROVENANCE.get(provenanceId)), id);
    expect(known, `${id} is registered`).toBe(true);
  }
  const lep = await page.evaluate(() => ({ afb: window.QGA_ELECTROWEAK.data.afbMu0.value, pole: window.QGA_ELECTROWEAK.derivedPole().value }));
  expect(lep.afb).toBe(0.0169);
  expect(lep.pole).toBeCloseTo(41.541 / 20.785, 10);
  // the lead readout is the pure function of the slider
  const expected = await page.evaluate(() => window.QGA_ELECTROWEAK.science.totalCrossSection(91.2).toFixed(4));
  await expect(page.locator(`${ROOM} .kerr-readout.lead`).nth(1)).toContainText(expected);
  expect(errors).toEqual([]);
});

test("each process draws its channels as thin lines under the total", async ({ page, context }) => {
  const errors = await open(page, context);
  const buttons = page.locator(PROCESS_BUTTONS);
  expect(await buttons.count()).toBe(PROCESS_COUNT);
  const processIds = ["s-channel", "bhabha", "moller", "t-channel"];
  for (let i = 0; i < processIds.length; i++) {
    await buttons.nth(i).click();
    await expect(buttons.nth(i)).toHaveAttribute("aria-pressed", "true");
    // the legend of the figure lists one KaTeX entry per term the science module returns (the TeX source is in the annotation of each)
    const terms = await page.evaluate((id) => window.QGA_ELECTROWEAK.science.channelDecomposition(id, 10, 0.2).terms.map((t) => t.tex), processIds[i]);
    expect(terms.length).toBe(i === 3 ? 1 : 3);
    const legend = await page.locator(`${CHANNELS} .katex`).evaluateAll((nodes) => nodes.map((n) => n.textContent).join(" "));
    // a single term (e mu) is the total itself, so only the processes with several terms list thin lines
    if (terms.length > 1) for (const tex of terms) expect(legend, `${processIds[i]}: ${tex}`).toContain(tex);
    else expect(legend).not.toContain(terms[0]);
  }
  expect(errors).toEqual([]);
});

test("Moller scattering is symmetric about 90 degrees", async ({ page, context }) => {
  const errors = await open(page, context);
  const symmetric = await page.evaluate(() => {
    const ew = window.QGA_ELECTROWEAK.science;
    return [0.1, 0.5, 0.9].every((c) => Math.abs(ew.mollerTerms(10, c).total / ew.mollerTerms(10, -c).total - 1) < 1e-12);
  });
  expect(symmetric).toBe(true);
  expect(errors).toEqual([]);
});

test("the builder draws both tree diagrams of Bhabha scattering with 3 px dots, arrows and typeset labels", async ({ page, context }) => {
  const errors = await open(page, context);
  await page.locator(".fey-chip", { hasText: "Bhabha scattering" }).click();
  const set = page.locator(".fey-diagram-set");
  await expect(set.locator("figure")).toHaveCount(2);
  await set.scrollIntoViewIfNeeded();
  const dots = await set.locator("svg circle").evaluateAll((nodes) => nodes.map((n) => n.getAttribute("r")));
  expect(dots).toEqual(["3", "3", "3", "3"]);
  // four fermion lines per diagram, each with its arrow at the middle (the momentum arrows add more heads)
  expect(await set.locator("figure").first().locator("svg polygon").count()).toBeGreaterThanOrEqual(4);
  await expect(set.locator(".katex").first()).toBeVisible();
  const names = (await set.locator("figcaption").allInnerTexts()).join(" ");
  expect(names).toMatch(/s channel/);
  expect(names).toMatch(/t channel/);
  for (const label of await set.locator("[role=img]").evaluateAll((nodes) => nodes.map((n) => n.getAttribute("aria-label")))) {
    expect(label).toMatch(/^Feynman diagram/);
  }
  expect(errors).toEqual([]);
});

test("the photon of a drawn diagram has a whole number of half-periods", async ({ page, context }) => {
  await open(page, context);
  const halfPeriods = await page.evaluate(() => {
    const ends = [
      { tex: "e^-", anti: false, photon: false }, { tex: "e^+", anti: true, photon: false },
      { tex: "\\mu^-", anti: false, photon: false }, { tex: "\\mu^+", anti: true, photon: false }];
    const layout = window.QGA_FEYNMAN.layout(window.QGA_FEYNMAN.diagramFor({ topo: "s", channel: "s", boson: "\\gamma", ends }));
    const photon = layout.paths.find((p) => p.kind === "photon");
    const ys = photon.d.slice(1).split(" L").map((pair) => Number(pair.split(",")[1]));
    const axis = ys[0];
    let crossings = 0, last = 0;
    for (const y of ys) {
      const side = Math.abs(y - axis) < 1e-6 ? 0 : Math.sign(y - axis);
      if (side && last && side !== last) crossings++;
      if (side) last = side;
    }
    return crossings + 1;
  });
  expect(halfPeriods).toBeGreaterThanOrEqual(2);
});

test("the process buttons keep their Greek letters and the readout labels are not capitalised", async ({ page, context }) => {
  await open(page, context);
  const chips = await page.locator(`${PROCESS_BUTTONS} .katex`).evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).textTransform));
  expect(chips.length).toBe(PROCESS_COUNT);
  expect(new Set(chips)).toEqual(new Set(["none"]));
  const labels = await page.locator(`${ROOM} .kerr-readout-label .katex`).evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).textTransform));
  expect(labels.length).toBeGreaterThan(5);
  expect(new Set(labels)).toEqual(new Set(["none"]));
});

test("every control of the room and the builder is at least 44 px, and the legend lists every line kind", async ({ page, context }) => {
  const errors = await open(page, context);
  const small = await page.evaluate(() => {
    const scopes = [document.querySelector(".qft-room"), document.querySelector(".fey-templates")?.closest(".viz-frame")];
    return scopes.flatMap((scope) => [...scope.querySelectorAll("button, select, input, [role=slider], summary")]
      // the provenance badge is a shared component of the whole atlas, not a control of this room
      .filter((el) => !el.classList.contains("badge"))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.width < 44 || r.height < 44))
      .map(({ el, r }) => `${el.tagName}.${el.className} ${Math.round(r.width)}x${Math.round(r.height)}`));
  });
  expect(small).toEqual([]);
  const legend = page.locator(".fey-legend");
  await legend.locator("summary").click();
  await expect(legend.locator(".fey-tex")).toHaveCount(6);
  expect(await legend.locator("svg path").count()).toBe(6);
  expect(errors).toEqual([]);
});

test("the asymmetry figure is reachable by keyboard and reads out the model line", async ({ page, context }) => {
  await open(page, context);
  const plot = page.locator(`${ASYMMETRY} .fig-plot`);
  await plot.focus();
  await expect(plot).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.locator(`${ASYMMETRY} .fig-readout`)).toContainText("200");
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the room and the diagrams fit 390 px with no sideways scroll", async ({ page, context }) => {
    const errors = await open(page, context);
    await page.locator(".fey-chip", { hasText: "Bhabha scattering" }).click();
    const overflow = await page.evaluate(() => {
      // The room itself is included: its slider row used to be 2 px wider than the room (scrollWidth 310, clientWidth 308 at 390 px, also on the main of S15).
      const wide = [...document.querySelectorAll(".qft-room, .fey-diagram-set, .fey-diagram, .qft-stack, .qft-room .fig")].filter((el) => el.scrollWidth > el.clientWidth + 1);
      return { wide: wide.map((el) => el.className), page: document.documentElement.scrollWidth - window.innerWidth };
    });
    expect(overflow.wide).toEqual([]);
    expect(overflow.page).toBeLessThanOrEqual(0);
    const outside = await page.evaluate(() => [...document.querySelectorAll(".fey-diagram")].flatMap((box) => {
      const frame = box.getBoundingClientRect();
      return [...box.querySelectorAll(".fey-tex")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < frame.left - 2 || r.right > frame.right + 2 || r.top < frame.top - 2 || r.bottom > frame.bottom + 2;
      }).map((el) => el.textContent);
    }));
    expect(outside).toEqual([]);
    expect(errors).toEqual([]);
  });
});

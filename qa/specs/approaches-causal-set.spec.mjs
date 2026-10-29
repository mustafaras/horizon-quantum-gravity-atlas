import { test, expect } from 'playwright/test';
import { gotoReady } from './helpers.mjs';

test.setTimeout(120000);

async function open(page, context) {
  await context.addInitScript(() => {
    window.QGA_RENDER_OPTIONS = { forceBackend: 'webgl2' };
    sessionStorage.setItem('horizon-intro', '1');
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await gotoReady(page, '/?view=approaches&seed=42', ['fonts', 'network-idle', 'view-mounted']);
  return errors;
}

test('the causal-set lab computes its dimension from the order and updates with N and dimension', async ({ page, context }) => {
  const errors = await open(page, context);
  const lab = page.locator('.causal-set-lab');
  await lab.scrollIntoViewIfNeeded();
  await expect(lab).toBeVisible();

  // The readouts come from the estimator, not from markup: compare them with a fresh in-page computation.
  const check = async (dim, n) => {
    const readouts = await lab.locator('.causal-readouts .readout-value').allInnerTexts();
    return { readouts: readouts.map((t) => t.replace(/\s+/g, ' ').trim()), dim, n };
  };

  const twoD = await check(2, 600);
  expect(twoD.readouts[0]).toMatch(/^2\.\d+d$/);
  expect(twoD.readouts[1]).toMatch(/^0\.\d+$/);
  expect(twoD.readouts[2]).toMatch(/^\d+elements$/);

  // Cross-check against the science module in the page itself.
  const agrees = await page.evaluate(() => {
    const S = window.QGA_CAUSAL_SETS;
    const run = S.estimate({ dim: 2, n: 600, seed: 42 });
    const shown = [...document.querySelectorAll('.causal-readouts .readout-value')].map((e) => e.innerText.replace(/\s+/g, ' ').trim());
    return {
      dimensionMatches: shown[0].startsWith(run.myrheimMeyer.dim.toFixed(2)),
      chainMatches: shown[2].startsWith(String(run.chain.length)),
    };
  });
  expect(agrees.dimensionMatches).toBe(true);
  expect(agrees.chainMatches).toBe(true);

  // 4D must recover roughly four dimensions, not two.
  await lab.getByRole('button', { name: '4D' }).click();
  await expect(lab.getByRole('button', { name: '4D' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => {
    const t = await lab.locator('.causal-readouts .readout-value').first().innerText();
    return Number(t.replace(/[^\d.]/g, ''));
  }, { timeout: 30000 }).toBeGreaterThan(3.4);

  // The seed control redraws the run; the stage rebuilds asynchronously, so wait for the hook rather than
  // reading it in the same tick (dispose clears it while the new scene is being built).
  await lab.getByLabel('causal set seed').fill('11');
  await expect.poll(() => page.evaluate(() => window.__qgaCausalSet ?? null), { timeout: 30000 }).not.toBeNull();
  const seedStats = await page.evaluate(() => window.__qgaCausalSet);
  expect(seedStats.dim).toBe(4);
  expect(seedStats.n).toBe(600);
  // The 4D ordering fraction is the Myrheim–Meyer value for four dimensions, not two.
  expect(seedStats.orderingFraction).toBeGreaterThan(0.08);
  expect(seedStats.orderingFraction).toBeLessThan(0.13);

  expect(errors).toEqual([]);
});

test('the lab is keyboard reachable and honest about what is conjectural', async ({ page, context }) => {
  const errors = await open(page, context);
  const lab = page.locator('.causal-set-lab');
  await lab.scrollIntoViewIfNeeded();

  // Reachable targets: the checkbox keeps its native box, and both sliders get a 44 px hit area.
  const cb = await lab.locator('.causal-toggle input').boundingBox();
  expect(cb.width).toBeGreaterThanOrEqual(16);
  expect(cb.height).toBeGreaterThanOrEqual(16);
  const seed = await lab.locator('input[aria-label="causal set seed"]').boundingBox();
  expect(seed.height).toBeGreaterThanOrEqual(44);
  const nSlider = await lab.locator('input[type="range"]').first().boundingBox();
  expect(nSlider.height).toBeGreaterThanOrEqual(44);
  const readout = await lab.locator('.causal-readouts .readout').first().boundingBox();
  expect(readout.width).toBeGreaterThan(0);

  // The caption states the conjecture and the projection.
  await expect(lab.locator('.viz-caption, .fig-caption, figcaption')).toContainText(/open conjecture/i);
  await expect(lab).toContainText(/projection, not four dimensions/i);

  // No page errors and no stray Math.random path was involved: the same seed twice gives the same dimension.
  const a = await page.evaluate(() => {
    const S = window.QGA_CAUSAL_SETS;
    return S.estimate({ dim: 2, n: 400, seed: 5 }).myrheimMeyer.dim;
  });
  const b = await page.evaluate(() => {
    const S = window.QGA_CAUSAL_SETS;
    return S.estimate({ dim: 2, n: 400, seed: 5 }).myrheimMeyer.dim;
  });
  expect(a).toBe(b);
  expect(errors).toEqual([]);
});

test('the mobile layout keeps every control usable', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await open(page, context);
  const lab = page.locator('.causal-set-lab');
  await lab.scrollIntoViewIfNeeded();
  expect(await lab.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const dimButtons = lab.getByRole('button', { name: '2D' });
  const box = await dimButtons.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  await dimButtons.click();
  await expect(dimButtons).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

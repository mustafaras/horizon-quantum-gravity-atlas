import { test, expect } from 'playwright/test';
import { gotoReady } from './helpers.mjs';

test.setTimeout(120000);

async function open(page, context, motion = 'reduce') {
  await context.addInitScript(() => sessionStorage.setItem('horizon-intro', '1'));
  await page.emulateMedia({ reducedMotion: motion });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await gotoReady(page, '/?view=bh&seed=42', ['fonts', 'networkIdle', 'view-mounted'].map((p) => (p === 'networkIdle' ? 'network-idle' : p)));
  return errors;
}

test('the Page curve and its readouts agree with the derived values', async ({ page, context }) => {
  const errors = await open(page, context);
  const figure = page.locator('.bh-page-figure');
  await figure.scrollIntoViewIfNeeded();
  await expect(figure.locator('[data-figure="bh-page-curve"]')).toBeVisible();

  // The readout must state the crossing the plot draws, not a rounded placeholder.
  const values = await figure.locator('.readout-value').allInnerTexts();
  const text = values.map((v) => v.replace(/\s+/g, ' ').trim());
  expect(text[0]).toMatch(/^0\.5381/);
  expect(text[1]).toMatch(/^59\.75/);
  expect(text[2]).toMatch(/^0\.7730/);

  // And it must match the science module in the page, so the two cannot drift.
  const agrees = await page.evaluate(() => {
    const s = window.QGA_EVAPORATION.pageTimeSummary();
    return {
      t: s.timeFraction.toFixed(4),
      entropy: (100 * s.entropyFraction).toFixed(2),
      mass: s.massFraction.toFixed(4),
      beta: window.QGA_EVAPORATION.PAGE_BETA,
    };
  });
  expect(agrees.t).toBe('0.5381');
  expect(agrees.entropy).toBe('59.75');
  expect(agrees.mass).toBe('0.7730');
  expect(agrees.beta).toBe(1.4847);
  expect(errors).toEqual([]);
});

test('the greybody panel reports its partial waves and the two closed-form limits', async ({ page, context }) => {
  const errors = await open(page, context);
  const panel = page.locator('.bh-greybody-figure');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel.locator('[data-figure="bh-greybody-spectrum"]')).toBeVisible();
  // Three small multiples, one per partial wave.
  await expect(panel.locator('.bh-transmission-cell')).toHaveCount(3);
  const limits = await panel.locator('.bh-greybody-readouts .readout-value').allInnerTexts();
  expect(limits[0].replace(/\s+/g, ' ').trim()).toMatch(/^50\.27/);
  expect(limits[1].replace(/\s+/g, ' ').trim()).toMatch(/^84\.82/);
  expect(errors).toEqual([]);
});

test('the probe sweeps with motion and stays manual under reduced motion', async ({ page, context }) => {
  const errors = await open(page, context, 'no-preference');
  const panel = page.locator('.bh-greybody-figure');
  await panel.scrollIntoViewIfNeeded();
  const button = panel.locator('.bh-greybody-controls button');
  const probe = panel.locator('input[aria-label="probe energy"]');
  await expect(button).toBeEnabled();
  const start = Number(await probe.inputValue());
  await button.click();
  await expect.poll(async () => Number(await probe.inputValue()), { timeout: 15000 }).not.toBe(start);
  await button.click();
  // The transmission readouts follow the probe: at omega M = 0.6 the higher waves open up.
  await probe.fill('0.6');
  await expect.poll(async () => (await panel.locator('.bh-transmission-readout').nth(1).innerText()).replace(/\s+/g, ' ')).toMatch(/9[0-9]\.\d%/);
  expect(errors).toEqual([]);
});

test('reduced motion leaves the probe manual and the figures complete', async ({ page, context }) => {
  const errors = await open(page, context, 'reduce');
  const panel = page.locator('.bh-greybody-figure');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel.locator('.bh-greybody-controls button')).toBeDisabled();
  await panel.locator('input[aria-label="probe energy"]').fill('0.6');
  await expect.poll(async () => (await panel.locator('.bh-transmission-readout').nth(2).innerText()).replace(/\s+/g, ' ')).toMatch(/8[0-9]\.\d%/);
  expect(errors).toEqual([]);
});

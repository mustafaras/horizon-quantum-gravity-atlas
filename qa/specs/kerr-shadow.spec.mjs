import { test, expect } from 'playwright/test';
import { gotoReady } from './helpers.mjs';

test.setTimeout(120000);

async function open(page, context) {
  await context.addInitScript(() => sessionStorage.setItem('horizon-intro', '1'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await gotoReady(page, '/?view=bh&seed=42', ['fonts', 'network-idle', 'view-mounted']);
  return errors;
}

test('the critical curve is a circle at zero spin and flattens as the hole spins', async ({ page, context }) => {
  const errors = await open(page, context);
  const lab = page.locator('#bh-kerr-shadow');
  await lab.scrollIntoViewIfNeeded();
  expect(await lab.locator('.readout-value').first().innerText()).toMatch(/1\.000/);

  const setSpin = async (v) => {
    await lab.locator('input[aria-label="spin a*"]').fill(String(v));
    await expect.poll(async () => Number(await lab.locator('.readout-value').first().innerText()), { timeout: 10000 }).toBeGreaterThan(1);
  };
  await setSpin(0.998);
  const ratio = Number(await lab.locator('.readout-value').first().innerText());
  expect(ratio).toBeGreaterThan(1.1);
  await expect(lab.locator('.readout-note').first()).toContainText(/flattened/i);

  // And the figure it draws must be the same curve.
  const agrees = await page.evaluate(() => {
    const K = window.QGA_KERR_SHADOW;
    const c = K.criticalCurve({ a: 0.998, inclinationDeg: 90, samples: 240, M: 1 });
    return { min: Math.min(...c.alpha), max: Math.max(...c.alpha) };
  });
  expect(agrees.min).toBeLessThan(-2);
  expect(agrees.max).toBeGreaterThan(6);
  expect(errors).toEqual([]);
});

test('the EHT comparison reports both targets with their predicted sizes', async ({ page, context }) => {
  const errors = await open(page, context);
  const block = page.locator('.kerr-eht-block');
  await block.scrollIntoViewIfNeeded();
  const m87 = (await block.locator('.readout-value').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  expect(m87[0]).toMatch(/^42/);
  expect(m87[1]).toMatch(/^39\.69/);
  expect(m87[2]).toMatch(/\+5\.8/);

  await block.getByRole('button', { name: 'Sgr A*' }).click();
  await expect.poll(async () => (await block.locator('.readout-value').allInnerTexts())[1].replace(/\s+/g, ' ').trim(), { timeout: 10000 })
    .toMatch(/^51\.29/);
  const sgra = (await block.locator('.readout-value').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  expect(sgra[0]).toMatch(/^51\.8/);
  expect(sgra[2]).toMatch(/\+1\.0/);
  // The caveat about the calibration must be on screen, not only in the code.
  await expect(block).toContainText(/calibrat/i);
  expect(errors).toEqual([]);
});

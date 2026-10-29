import { test, expect } from 'playwright/test';
import { gotoReady } from './helpers.mjs';

test.setTimeout(180000);
async function open(page, context, motion = 'reduce') {
  await context.addInitScript(() => { window.QGA_RENDER_OPTIONS = { forceBackend: 'webgl2' }; sessionStorage.setItem('horizon-intro', '1'); });
  await page.emulateMedia({ reducedMotion: motion });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await gotoReady(page, '/?view=gr&seed=42', ['fonts', 'network-idle', 'view-mounted']);
  return errors;
}

test('tidal controls alter the calculated state and the rendered ring', async ({ page, context }) => {
  const errors = await open(page, context);
  const lab = page.locator('.tidal-lab');
  const stage = lab.locator('.s3d-stage');
  await stage.scrollIntoViewIfNeeded();
  await expect(stage.locator('.render-loading')).toBeHidden({ timeout: 90000 });
  await expect(lab.getByRole('button', { name: 'Play fall' })).toBeDisabled();
  await expect(lab.locator('.tidal-stats')).toContainText('outside');
  const before = await stage.locator('canvas').first().screenshot();
  await lab.getByLabel('Fall progress').fill('760');
  await stage.evaluate(el => el.scrollIntoView({ block: 'center' }));
  await expect.poll(async () => page.evaluate(() => QGA_RENDER.stageDiagnostics.snapshot().some(s => s.views.some(v => /ring of test particles/i.test(v.label) && v.visible))), { timeout: 30000 }).toBe(true);
  await expect(lab.locator('.tidal-transport')).toContainText('95%');
  await expect.poll(async () => page.evaluate(() => {
    const s = [...window.__qgaActiveScenes].find(scene => scene.element.closest('.tidal-lab'))?.state();
    return !!s && s.transverse < 0.1 && s.settleFrames === 0;
  }), { timeout: 30000 }).toBe(true);
  await expect.poll(async () => !(await stage.locator('canvas').first().screenshot()).equals(before), { timeout: 30000 }).toBe(true);
  await lab.getByRole('button', { name: '1 million solar masses' }).click();
  await expect(lab.locator('.tidal-stats')).toContainText('inside');
  await expect(lab.locator('.tidal-transport')).toContainText('0%');
  expect(errors).toEqual([]);
});

test('Flamm and schematic modes switch labels and rendering', async ({ page, context }) => {
  const errors = await open(page, context);
  const stage = page.locator('.gr-well-stage');
  await stage.scrollIntoViewIfNeeded();
  await expect(stage.locator('.render-loading')).toBeHidden({ timeout: 90000 });
  await expect(stage.locator('.gr-geometry-label')).toContainText('EXACT');
  const mode = () => stage.locator('.s3d-stage').evaluate(el => {
    let value = null;
    el.__qga?.scene.traverse(obj => { if (obj.userData.qgaGeometryMode) value = obj.userData.qgaGeometryMode.value; });
    return value;
  });
  await expect.poll(mode, { timeout: 30000 }).toBe(1);
  await page.getByRole('button', { name: 'Newtonian potential · schematic' }).click();
  await stage.scrollIntoViewIfNeeded();
  await expect(stage.locator('.gr-geometry-label')).toContainText('SCHEMATIC');
  await expect.poll(mode, { timeout: 30000 }).toBe(0);
  await page.getByRole('button', { name: 'Exact geometry · Flamm' }).click();
  await stage.scrollIntoViewIfNeeded();
  await expect(stage.locator('.gr-geometry-label')).toContainText('EXACT');
  await expect.poll(mode, { timeout: 30000 }).toBe(1);
  expect(errors).toEqual([]);
});

test('mobile readouts, observed values and citations remain reachable', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await open(page, context);
  const panel = page.locator('.gr-tests-panel');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel.locator('.gr-test-list li')).toHaveCount(7);
  await expect(panel.locator('.gr-test-list a')).toHaveCount(7);
  await expect(panel).toContainText('GPS in practice');
  const overflow = await panel.evaluate(el => el.scrollWidth > el.clientWidth + 1);
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});


test('normal-motion playback advances and can be paused', async ({ page, context }) => {
  const errors = await open(page, context, 'no-preference');
  const lab = page.locator('.tidal-lab');
  await lab.locator('.tidal-transport').scrollIntoViewIfNeeded();
  await lab.getByRole('button', { name: 'Play fall' }).click();
  const slider = lab.getByLabel('Fall progress');
  await expect.poll(async () => Number(await slider.inputValue()), { timeout: 30000 }).toBeGreaterThan(0);
  await lab.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(lab.getByRole('button', { name: 'Play fall' })).toBeVisible();
  expect(errors).toEqual([]);
});

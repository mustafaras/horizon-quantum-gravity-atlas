// Prompt 08 integration spec: AdS holography lab, collider event lab, spin-foam lab.
// Mirrors qa/specs/compute-labs.spec.mjs: published() stats contract + in-canvas status labels.
import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

const LABS = ["fonts", "network-idle", "view-mounted"];

async function published(page, name, timeout = 25_000) {
  await page.waitForFunction((n) => window[n], name, { timeout });
  return page.evaluate((n) => window[n], name);
}

test.setTimeout(120_000);

test("AdS holography lab publishes stats and conjectural label", async ({ page }) => {
  const errors = await gotoReady(page, "/?view=approaches&aln=5&alr=0.5", LABS);
  await page.locator('section:has-text("Holography, computed")').scrollIntoViewIfNeeded();
  const lab = await published(page, "__qgaAdsLab");
  expect(lab.kind).toBe("ads-lab");
  expect(lab.links).toBe(5);
  expect(typeof lab.regionSpan).toBe("number");
  expect(lab.regionSpan).toBeGreaterThan(0);
  expect(typeof lab.geodesicLength).toBe("number");
  expect(lab.geodesicLength).toBeGreaterThan(0);
  expect(typeof lab.entropy).toBe("number");
  expect(lab.entropy).toBeGreaterThan(0);
  expect(lab.wedgeFraction).toBeGreaterThan(0);
  expect(lab.wedgeFraction).toBeLessThanOrEqual(1);
  await expect(page.locator('section:has-text("Holography, computed") .s3d-labels').first()).toHaveText(/CONJECTURAL/i);
  expect(errors()).toEqual([]);
});

test("Collider lab publishes synthetic fixture stats and switches channels", async ({ page }) => {
  const errors = await gotoReady(page, "/?view=sm&clc=h2gg&seed=42", LABS);
  await page.locator('section:has-text("Collisions, computed")').scrollIntoViewIfNeeded();
  const lab = await published(page, "__qgaColliderLab");
  expect(lab.kind).toBe("collider-event");
  expect(lab.channel).toBe("h2gg");
  expect(lab.fixture).toBe(true);
  expect(lab.particles).toBeGreaterThan(0);
  expect(typeof lab.metGev).toBe("number");
  expect(lab.metGev).toBeGreaterThanOrEqual(0);
  expect(typeof lab.masses).toBe("object");
  await expect(page.locator('section:has-text("Collisions, computed") .s3d-labels').first()).toHaveText(/SYNTHETIC/i);

  await page.locator('button:has-text("Z → μμ")').click();
  await page.waitForFunction(() => window.__qgaColliderLab && window.__qgaColliderLab.channel === "z2mm", null, { timeout: 15_000 });
  const switched = await page.evaluate(() => window.__qgaColliderLab);
  expect(switched.channel).toBe("z2mm");
  expect(switched.fixture).toBe(true);
  expect(errors()).toEqual([]);
});

test("Collider tracks are engraved lines that can still be picked with a click", async ({ page }) => {
  const errors = await gotoReady(page, "/?view=sm&clc=ttbar&seed=42", LABS);
  const section = page.locator('section:has-text("Collisions, computed")');
  await section.scrollIntoViewIfNeeded();
  await published(page, "__qgaColliderLab");
  const mount = section.locator("[data-engraved-backend]").first();
  // Wait for the event to be fully reconstructed (every track grown), then aim at the middle of the hardest one.
  await expect.poll(() => mount.evaluate((element) => {
    const lines = element.__qga.scene.children[0]?.children?.filter((child) => child.userData?.kind && child.isLineSegments2) ?? [];
    return lines.length > 0 && lines.every((line) => line.geometry.instanceCount >= 20);
  }), { timeout: 60_000 }).toBe(true);
  const aim = await mount.evaluate((element) => {
    const { scene, camera } = element.__qga;
    const tracks = scene.children[0].children.filter((child) => child.userData?.kind && child.isLineSegments2);
    const widest = tracks.reduce((best, line) => (line.userData.engraved.widthPx > best.userData.engraved.widthPx ? line : best));
    const start = widest.geometry.attributes.instanceStart, mid = Math.floor(start.count / 2);
    const point = new window.THREE.Vector3(start.getX(mid), start.getY(mid), start.getZ(mid)).applyMatrix4(widest.matrixWorld).project(camera);
    const rect = element.querySelector(".s3d-canvas").getBoundingClientRect();
    return { x: rect.left + (point.x + 1) / 2 * rect.width, y: rect.top + (1 - point.y) / 2 * rect.height, kind: widest.userData.kind, width: widest.userData.engraved.widthPx, count: tracks.length };
  });
  expect(aim.width, "the hardest track is the focal 2.5 px curve").toBe(2.5);
  expect(aim.count).toBeGreaterThan(2);
  await page.mouse.click(aim.x, aim.y);
  await expect(section.locator(".s3d-detail")).toContainText(new RegExp(`${aim.kind} · pT`));
  expect(errors()).toEqual([]);
});

test("Spin-foam lab publishes stats and switches modes", async ({ page }) => {
  const errors = await gotoReady(page, "/?view=planck&sfj=2&sfm=network", LABS);
  await page.locator('section:has-text("Spin networks and spin foam, computed")').scrollIntoViewIfNeeded();
  const lab = await published(page, "__qgaSpinFoamLab");
  expect(lab.kind).toBe("spin-foam");
  expect(lab.mode).toBe("network");
  expect(lab.topology).toBe("four-simplex");
  expect(lab.steps).toBeGreaterThan(0);
  expect(typeof lab.totalArea).toBe("number");
  expect(lab.totalArea).toBeGreaterThan(0);
  expect(lab.nodes).toBeGreaterThan(0);
  expect(lab.edges).toBeGreaterThan(0);
  await expect(page.locator('section:has-text("Spin networks and spin foam, computed") .s3d-labels').first()).toHaveText(/CONJECTURAL/i);

  await page.locator('button:has-text("Foam")').click();
  await page.waitForFunction(() => window.__qgaSpinFoamLab && window.__qgaSpinFoamLab.mode === "foam", null, { timeout: 15_000 });
  const switched = await page.evaluate(() => window.__qgaSpinFoamLab);
  expect(switched.mode).toBe("foam");
  expect(errors()).toEqual([]);
});

test("Reduced motion: all three labs publish without animation", async ({ page }) => {
  await page.addInitScript(() => { sessionStorage.setItem("horizon-intro", "1"); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = await gotoReady(page, "/?view=approaches&aln=5&alr=0.5", LABS);
  await page.locator('section:has-text("Holography, computed")').scrollIntoViewIfNeeded();
  const ads = await published(page, "__qgaAdsLab");
  expect(ads.kind).toBe("ads-lab");

  const errors2 = await gotoReady(page, "/?view=sm&clc=h2gg&seed=42", LABS);
  await page.locator('section:has-text("Collisions, computed")').scrollIntoViewIfNeeded();
  const collider = await published(page, "__qgaColliderLab");
  expect(collider.kind).toBe("collider-event");
  expect(collider.fixture).toBe(true);

  const errors3 = await gotoReady(page, "/?view=planck&sfj=2&sfm=network", LABS);
  await page.locator('section:has-text("Spin networks and spin foam, computed")').scrollIntoViewIfNeeded();
  const foam = await published(page, "__qgaSpinFoamLab");
  expect(foam.kind).toBe("spin-foam");
  expect(errors()).toEqual([]);
});
// Engraved lines on the real GR scene (S06, closes F-24; S07 moves the scene to TSL): the gravity-well scene is built from node
// materials, so it runs on the node renderer (its WebGL2 backend where there is no WebGPU adapter) with the node engraved
// lines (D-034). This measures the line width through the page's own render pipeline at DPR 1 and DPR 2.
//
// The fan rays carry per-vertex fades, so their width cannot be read off the fan itself. The scene is therefore
// emptied and probe lines, made by the same engraved-line API the fan uses (the scene's ctx.engraved) and drawn by the
// same renderer and pipeline, are measured instead. The output chain (tone mapping, sRGB) is not linear, so each run
// first draws a ladder of wide lines of known opacity: the grey level each produces is the calibration that turns
// every probe pixel back into coverage. The sum of coverage across a line, perpendicular to it, is its width.

import { test, expect } from "playwright/test";
import { writeFileSync } from "node:fs";
import { gotoReady } from "./helpers.mjs";

const TOLERANCE_PX = 0.5;
const REQUESTED = [1.25, 2.5];
const ANGLES_DEG = [0, 30, 60];
const READINESS = ["fonts", "network-idle", "view-mounted"];

test.setTimeout(300_000);

async function pageReady(page) {
  await expect.poll(() => page.evaluate(() => {
    const entries = window.QGA_RENDER?.renderDiagnostics?.snapshot?.() ?? [];
    const mount = document.querySelector("[data-engraved-backend]");
    return entries.length > 0 && entries.every((entry) => entry.phase === "ready") && !!mount?.__qga;
  }), { timeout: 200_000 }).toBe(true);
}

/** Switch a Tweaks-panel select (the panel opens on the host protocol message); waits for the rebuilt scene. */
async function choose(page, label, value) {
  if ((await page.getByLabel(label, { exact: true }).inputValue()) === value) return;
  await page.evaluate(() => { window.__previousScene = document.querySelector("[data-engraved-backend]").__qga.scene; });
  await page.getByLabel(label, { exact: true }).selectOption(value);
  await expect.poll(() => page.evaluate(() => document.querySelector("[data-engraved-backend]")?.__qga?.scene !== window.__previousScene),
    { timeout: 200_000 }).toBe(true);
  await pageReady(page);
}

/**
 * Runs in the page: decode the screenshot, calibrate grey level against known radiance with the ladder, then integrate
 * coverage perpendicular to each probe line. `calibrated` is false until the ladder is on screen and monotonic.
 */
async function measureProbes({ png64, layout: lay, dprValue }) {
  const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${png64}`)).blob());
  const surface = document.createElement("canvas");
  surface.width = bitmap.width; surface.height = bitmap.height;
  const context = surface.getContext("2d", { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0);
  const { data, width, height } = context.getImageData(0, 0, surface.width, surface.height);
  const grey = (x, y) => data[(Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))) * 4 + 1] / 255;
  const ladder = [[grey(Math.round(500 * dprValue), Math.round(50 * dprValue)), 0]];
  for (const step of lay.ladder) ladder.push([grey(Math.round(90 * dprValue), Math.round(step.y * dprValue)), step.radiance]);
  const calibrated = ladder.every((entry, i) => i === 0 || entry[0] > ladder[i - 1][0]) && ladder[ladder.length - 1][0] - ladder[0][0] > 0.15;
  const table = [...ladder].sort((p, q) => p[0] - q[0]);
  const radiance = (g) => {
    if (g <= table[0][0]) return 0;
    for (let i = 1; i < table.length; i += 1) {
      if (g <= table[i][0]) {
        const [g0, r0] = table[i - 1], [g1, r1] = table[i];
        return g1 === g0 ? r1 : r0 + (r1 - r0) * (g - g0) / (g1 - g0);
      }
    }
    return table[table.length - 1][1];
  };
  // Pixel (i, j) holds the value at its centre (i + 0.5, j + 0.5): bilinear interpolation of the radiance around (x, y).
  const sample = (x, y) => {
    const px = x - 0.5, py = y - 0.5, x0 = Math.floor(px), y0 = Math.floor(py), fx = px - x0, fy = py - y0;
    const r = (xx, yy) => radiance(grey(xx, yy));
    return r(x0, y0) * (1 - fx) * (1 - fy) + r(x0 + 1, y0) * fx * (1 - fy) + r(x0, y0 + 1) * (1 - fx) * fy + r(x0 + 1, y0 + 1) * fx * fy;
  };
  const results = lay.lines.map((line) => {
    const dx = line.b[0] - line.a[0], dy = line.b[1] - line.a[1], len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len, widths = [], step = 0.25;
    for (const f of [0.4, 0.5, 0.6]) {
      const mx = (line.a[0] + dx * f) * dprValue, my = (line.a[1] + dy * f) * dprValue;
      let sum = 0;
      for (let t = -8 * dprValue; t <= 8 * dprValue; t += step) sum += sample(mx + nx * t, my + ny * t) * step;
      widths.push(sum / dprValue);
    }
    return { requested: line.widthPx, angle: line.angle, measured: widths.reduce((a, b) => a + b, 0) / widths.length };
  });
  return { results, table, calibrated };
}

for (const dpr of [1, 2]) {
  test.describe(`GR geodesic fan at DPR ${dpr}`, () => {
    test.use({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: dpr });

    test(`engraved line widths measure within ${TOLERANCE_PX} px of the request`, async ({ page, context }) => {
      await context.addInitScript(() => {
        window.QGA_RENDER_OPTIONS = { softwareClamp: false };
        sessionStorage.setItem("horizon-intro", "1");
      });
      await gotoReady(page, "/?view=gr", READINESS, { timeoutMs: 120_000 });
      await pageReady(page);
      await page.evaluate(() => window.postMessage({ type: "__activate_edit_mode" }, "*"));
      await choose(page, "Mode", "minimal");
      await choose(page, "3D detail", dpr === 2 ? "ultra" : "medium");
      await page.evaluate(() => window.postMessage({ type: "__deactivate_edit_mode" }, "*"));
      await page.addStyleTag({ content: ".s3d-labels { display: none !important; }" });
      await pageReady(page);

      // The real scene's own fan: every line is an engraved Line2, none is a hairline THREE.Line.
      const inventory = await page.evaluate(() => {
        const { scene } = document.querySelector("[data-engraved-backend]").__qga;
        const counts = { engraved: 0, hairline: 0 };
        scene.traverse((object) => {
          if (object.userData?.engraved && object.isLineSegments2) counts.engraved += 1;
          else if (object.isLine || object.isLineSegments) counts.hairline += 1;
        });
        return { ...counts, backend: document.querySelector("[data-engraved-backend]").dataset.engravedBackend };
      });
      expect(inventory.backend).toBe("node");
      expect(inventory.hairline, "no THREE.Line left in the GR scene").toBe(0);
      expect(inventory.engraved, "the lensing fan is engraved lines").toBeGreaterThan(3);

      // Probe lines: a calibration ladder and the measured lines, parented to the camera so they stay put.
      const layout = await page.evaluate(({ requested, angles }) => {
        const { scene, camera, engraved } = document.querySelector("[data-engraved-backend]").__qga;
        scene.children.forEach((child) => { child.visible = false; });
        scene.fog = null;
        scene.background = new window.THREE.Color(0, 0, 0);
        if (!camera.parent) scene.add(camera);
        const rig = new window.THREE.Group();
        camera.add(rig);
        const canvas = document.querySelector(".s3d-canvas");
        const { width: cssW, height: cssH } = canvas.getBoundingClientRect();
        const depth = 5, halfH = depth * Math.tan((camera.fov * Math.PI) / 360), halfW = halfH * (cssW / cssH);
        const toWorld = (px, py) => [(px / cssW - 0.5) * 2 * halfW, -(py / cssH - 0.5) * 2 * halfH, -depth];
        const probe = (a, b, widthPx, opacity) => {
          const [ax, ay, az] = toWorld(...a), [bx, by, bz] = toWorld(...b);
          const line = engraved.line([ax, ay, az, bx, by, bz], { color: 0xffffff, widthPx, opacity, layer: "decoration" });
          line.frustumCulled = false;
          rig.add(line);
        };
        const ladder = [], lines = [];
        for (let k = 1; k <= 8; k += 1) {
          const y = 60 + k * 30;
          probe([40, y], [140, y], 14, k / 8);
          ladder.push({ y, radiance: k / 8 });
        }
        // The measured lines sit in the empty lower right of the view: the scene keeps re-showing its own bodies, glows
        // and fan rays near the centre, and none of them may overlap a probe.
        for (const [wi, widthPx] of requested.entries()) {
          for (const [ai, angle] of angles.entries()) {
            const cx = 480 + ai * 110, cy = 345 + wi * 75, length = 80, rad = (angle * Math.PI) / 180;
            const a = [cx - Math.cos(rad) * length / 2, cy + Math.sin(rad) * length / 2];
            const b = [cx + Math.cos(rad) * length / 2, cy - Math.sin(rad) * length / 2];
            probe(a, b, widthPx, 1);
            lines.push({ widthPx, angle, a, b });
          }
        }
        return { ladder, lines, cssW, cssH };
      }, { requested: REQUESTED, angles: ANGLES_DEG });

      // Software rendering draws a frame every second or so: poll screenshots until the calibration ladder is on screen
      // (monotonic grey levels from black to a bright top step), then measure that same image.
      let measured = null;
      await expect.poll(async () => {
        const shot = await page.locator(".s3d-canvas").first().screenshot();
        if (process.env.QA_DEBUG_DIR) writeFileSync(`${process.env.QA_DEBUG_DIR}/probe-dpr${dpr}.png`, shot);
        measured = await page.evaluate(measureProbes, { png64: shot.toString("base64"), layout, dprValue: dpr });
        return measured.calibrated;
      }, { timeout: 120_000, intervals: [500, 1000, 2000] }).toBe(true);

      test.info().annotations.push({ type: "measured", description: JSON.stringify(measured.results) });
      if (process.env.QA_DEBUG_DIR) console.log(`DPR ${dpr}`, JSON.stringify(measured.results.map((r) => [r.requested, r.angle, +r.measured.toFixed(3)])));
      for (const row of measured.results) {
        expect(Math.abs(row.measured - row.requested), JSON.stringify({ row, table: measured.table })).toBeLessThanOrEqual(TOLERANCE_PX);
      }
    });
  });
}

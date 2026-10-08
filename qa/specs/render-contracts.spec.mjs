import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.describe("render contract modules", () => {
  test.use({ reducedMotion: "reduce" });

  test("ESM render contract modules are browser-loadable and deterministic", async ({ page }) => {
    const requestFailures = [];
    const onRequestFailed = (request) => requestFailures.push(`${request.method()} ${request.url()}`);
    page.on("requestfailed", onRequestFailed);
    const errors = await gotoReady(page, "/?view=overview");
    const result = await page.evaluate(async () => {
      const [{ normalizeRenderCapabilities }, { validateScientificProvenance }] = await Promise.all([
        import("../js/render/capabilities.mjs"),
        import("../js/render/contracts.mjs"),
      ]);
      const capabilities = normalizeRenderCapabilities({
        hasWebGPU: false,
        hasWebGL2: true,
        forceBackend: "webgl2",
        qualityPreset: "medium",
        devicePixelRatio: 3,
        reducedMotion: true,
      });
      const provenance = validateScientificProvenance({
        model: "Atlas overview architecture contract",
        status: "schematic",
        assumptions: ["contract verification only"],
        validity: ["no rendering side effects"],
        numericalMethod: "deterministic policy normalization",
        references: ["Prompt 00 render architecture contract"],
      });
      return {
        backend: capabilities.activeBackend,
        maxDpr: capabilities.quality.maxDpr,
        temporalSamples: capabilities.quality.temporalSamples,
        postEffects: capabilities.quality.postEffects,
        provenanceStatus: provenance.status,
      };
    });

    expect(result).toEqual({
      backend: "webgl2",
      maxDpr: 1.5,
      temporalSamples: 1,
      postEffects: false,
      provenanceStatus: "schematic",
    });
    expect(errors()).toEqual([]);
    expect(requestFailures).toEqual([]);
    page.off("requestfailed", onRequestFailed);
  });
});

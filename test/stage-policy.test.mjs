import test from "node:test";
import assert from "node:assert/strict";
import { resolveAnimated, isAnimatedDeclaration, ANIMATED_DECLARATIONS } from "../js/render/stage/animation-policy.mjs";
import { resolveStageMode, sharedStageRequested, acquireStage, resetStagesForTests, stageDiagnostics } from "../js/render/stage/shared-stage.mjs";

test("a scene that evolves while playing is animated only while playing, motion or not", () => {
  assert.equal(resolveAnimated({ declared: true, playing: true, motion: 0 }), true);
  assert.equal(resolveAnimated({ declared: true, playing: true, motion: 1 }), true);
  assert.equal(resolveAnimated({ declared: true, playing: false, motion: 1 }), false);
});

test("ambient motion settles under reduced motion and when paused", () => {
  assert.equal(resolveAnimated({ declared: "motion", playing: true, motion: 0.55 }), true);
  assert.equal(resolveAnimated({ declared: "motion", playing: true, motion: 0 }), false);
  assert.equal(resolveAnimated({ declared: "motion", playing: false, motion: 1 }), false);
});

test("an input-driven scene never animates by itself", () => {
  assert.equal(resolveAnimated({ declared: false, playing: true, motion: 1 }), false);
});

test("transient motion keeps any scene animated until it settles", () => {
  for (const declared of ANIMATED_DECLARATIONS) assert.equal(resolveAnimated({ declared, playing: false, motion: 0, transient: true }), true);
});

test("a scene that reports its own state overrides the declaration (Kerr: accumulating, then converged)", () => {
  assert.equal(resolveAnimated({ declared: true, playing: true, motion: 1, builtAnimated: false }), false);
  assert.equal(resolveAnimated({ declared: false, playing: false, motion: 0, builtAnimated: true }), true);
  assert.equal(resolveAnimated({ declared: "motion", playing: true, motion: 1, builtAnimated: false, transient: true }), true);
  assert.equal(resolveAnimated({ declared: true, builtAnimated: null }), true);
});

test("declarations are validated", () => {
  assert.equal(isAnimatedDeclaration("motion"), true);
  assert.equal(isAnimatedDeclaration("always"), false);
  assert.throws(() => resolveAnimated({ declared: "always" }), TypeError);
  assert.throws(() => resolveAnimated({ declared: 1 }), TypeError);
});

test("the shared stage is the default; legacy comes from the option or ?stage=legacy; the option wins", () => {
  assert.equal(resolveStageMode({}), "shared");
  assert.equal(resolveStageMode({ options: {}, search: "" }), "shared");
  assert.equal(resolveStageMode({ options: {}, search: "?view=qft&stage=legacy" }), "legacy");
  assert.equal(resolveStageMode({ options: { stage: "legacy" }, search: "" }), "legacy");
  assert.equal(resolveStageMode({ options: { stage: "shared" }, search: "?stage=legacy" }), "shared");
  assert.equal(resolveStageMode({ options: { stage: "bogus" }, search: "?stage=legacy" }), "legacy");
  assert.equal(resolveStageMode({ options: null, search: "?stage=other" }), "shared");
  assert.equal(sharedStageRequested({}, ""), true);
  assert.equal(sharedStageRequested({}, "?stage=legacy"), false);
});

test("a stage forgets itself when its last view detaches, so a later page state starts from nothing", async () => {
  resetStagesForTests();
  const pool = acquireStage({ backend: "webgl2" });
  assert.equal(acquireStage({ backend: "webgl2" }), pool, "one stage per backend");
  const a = pool.attachContext({ label: "a" }), b = pool.attachContext({ label: "b" });
  assert.equal(stageDiagnostics.snapshot().length, 1);
  await a.detach();
  assert.equal(stageDiagnostics.snapshot().length, 1, "still has a view");
  await b.detach();
  assert.equal(stageDiagnostics.snapshot().length, 0, "last view gone, stage forgotten");
  assert.notEqual(acquireStage({ backend: "webgl2" }), pool, "a fresh stage is created next time");
  resetStagesForTests();
});

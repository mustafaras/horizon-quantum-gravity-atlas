const ORDER = ["maxDpr", "temporalSamples", "ssgi", "raySteps", "particleBudget"];

export function createQualityGovernor({
  quality, windowSize = 60, slowMs = 26, fastMs = 14, slowWindows = 2,
  fastWindows = 3, cooldownMs = 3000, active = ORDER,
} = {}) {
  if (!quality || !Number.isFinite(quality.maxDpr) || quality.maxDpr < 1
      || !Number.isFinite(quality.particleBudget) || quality.particleBudget < 1
      || !Number.isFinite(quality.raySteps) || quality.raySteps < 1
      || !Number.isFinite(quality.temporalSamples) || quality.temporalSamples < 1) {
    throw new TypeError("quality requires positive rendering budgets");
  }
  if (!Number.isInteger(windowSize) || windowSize < 4 || !Number.isInteger(slowWindows)
      || slowWindows < 1 || !Number.isInteger(fastWindows) || fastWindows < 1
      || !(fastMs > 0 && slowMs > fastMs) || !(cooldownMs >= 3000)) {
    throw new RangeError("governor requires valid windows, hysteresis and cooldown >= 3000ms");
  }
  const ceiling = { ...quality, ssgi: !!quality.ssgi };
  let current = Object.freeze({ ...ceiling });
  const frames = [];
  let count = 0, slow = 0, fast = 0, lastChange = -Infinity, lastTime = -Infinity;
  const floor = {
    maxDpr: 1, temporalSamples: 1, ssgi: false,
    raySteps: Math.min(48, ceiling.raySteps),
    particleBudget: Math.min(1000, ceiling.particleBudget),
  };
  function adjust(direction) {
    for (const dimension of ORDER) {
      if (!active.includes(dimension)) continue;
      const value = current[dimension], limit = direction < 0 ? floor[dimension] : ceiling[dimension];
      if (value === limit) continue;
      let next;
      if (dimension === "ssgi") next = direction > 0;
      else {
        const step = dimension === "maxDpr" ? 0.25 : dimension === "temporalSamples" ? 1
          : dimension === "raySteps" ? 16 : Math.max(250, Math.ceil(ceiling.particleBudget / 4));
        next = direction < 0 ? Math.max(limit, value - step) : Math.min(limit, value + step);
      }
      current = Object.freeze({ ...current, [dimension]: next });
      return Object.freeze({ dimension, direction: direction < 0 ? "down" : "up", previous: value, value: next });
    }
    return null;
  }
  return {
    get quality() { return current; },
    resetWindow() { frames.length = 0; count = 0; slow = fast = 0; },
    sample(frameMs, now) {
      if (!Number.isFinite(frameMs) || frameMs < 0) throw new RangeError("frame time must be finite and nonnegative");
      if (!Number.isFinite(now) || now < 0 || now < lastTime) throw new RangeError("time must be monotonic");
      lastTime = now;
      if (frameMs === 0) return { quality: current, change: null, fps: null };
      frames.push(frameMs);
      if (frames.length > windowSize) frames.shift();
      const mean = frames.reduce((a, b) => a + b, 0) / frames.length;
      let change = null;
      if (++count >= windowSize && frames.length === windowSize) {
        count = 0;
        slow = mean > slowMs ? slow + 1 : 0;
        fast = mean < fastMs ? fast + 1 : 0;
        if (now - lastChange >= cooldownMs && (slow >= slowWindows || fast >= fastWindows)) {
          change = adjust(slow >= slowWindows ? -1 : 1);
          if (change) { lastChange = now; slow = fast = 0; frames.length = 0; }
        }
      }
      return { quality: current, change, fps: 1000 / mean };
    },
  };
}

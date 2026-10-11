/**
 * Pieces shared by the WebGL2 (kerr-material.mjs) and WebGPU
 * (kerr-material.tsl.js) Kerr runtimes: the science lookup-table textures,
 * the plasma display clock and the seed convention.
 */

import { DataTexture, FloatType, NearestFilter, NoColorSpace, RGBAFormat } from "three";
import { KERR_PLASMA } from "./kerr-plasma.mjs";

/** Largest wall-clock gap (s) the plasma clock advances in one tick (tab switches do not jump). */
const MAX_TICK_SECONDS = 0.1;

function floatTexture(data, size) {
  const texture = new DataTexture(data, size, 1, RGBAFormat, FloatType);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Disk and colour tables as 1-row float textures, rebuilt only when the
 * render state hands over a different (cached) table object.
 */
export function createKerrTables() {
  let diskData = null;
  let disk = null;
  let color = null;
  return {
    update(state) {
      if (diskData !== state.disk) {
        diskData = state.disk;
        disk?.dispose();
        disk = floatTexture(state.disk.data, state.disk.size);
      }
      if (!color) color = floatTexture(state.colorTable.data, state.colorTable.size);
      return { disk, color };
    },
    dispose() {
      disk?.dispose();
      color?.dispose();
    },
  };
}

/**
 * Coordinate time (GM/c^3) driving the plasma texture. It advances with the
 * wall clock at KERR_PLASMA.displayTimeScale and is frozen under reduced
 * motion, so reduced-motion and reference captures are deterministic.
 */
export function kerrPlasmaClock() {
  let coordinateTime = 0;
  let lastSeconds = null;
  return {
    tick(seconds, reducedMotion) {
      const now = Number.isFinite(seconds) ? seconds : 0;
      if (!reducedMotion && lastSeconds !== null) {
        coordinateTime += Math.min(Math.max(now - lastSeconds, 0), MAX_TICK_SECONDS) * KERR_PLASMA.displayTimeScale;
      }
      lastSeconds = now;
      return coordinateTime;
    },
  };
}

/** Unsigned 32-bit hash seed from the atlas seed (42 when missing or invalid). */
export function kerrSeed(seed) {
  const value = Math.trunc(Number(seed));
  return (Number.isFinite(value) && value !== 0 ? value : 42) >>> 0;
}

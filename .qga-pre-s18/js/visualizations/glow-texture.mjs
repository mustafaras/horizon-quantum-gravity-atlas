/**
 * Shared soft-glow sprite texture for the compute labs.
 *
 * Uses the same window.__qgaGlowTex cache key as the Scene3D builder helper,
 * so the texture is created once per page and never disposed by scene
 * teardown (s3dDispose explicitly skips it).
 */

import { CanvasTexture } from "three";
import * as TK from "../design/tokens.mjs";

export function sharedGlowTexture() {
  if (window.__qgaGlowTex) return window.__qgaGlowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, TK.css("pigment-white"));
  grad.addColorStop(0.25, TK.alpha("pigment-white", 0.55));
  grad.addColorStop(0.6, TK.alpha("pigment-white", 0.12));
  grad.addColorStop(1, TK.alpha("pigment-white", 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  window.__qgaGlowTex = new CanvasTexture(c);
  return window.__qgaGlowTex;
}

/** Radial ring texture (transparent core → bright ring → fade) for horizon glows. */
export function ringGlowTexture(inner = 0.26, peak = 0.36, outer = 1.0) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, TK.alpha("pigment-white", 0));
  grad.addColorStop(inner, TK.alpha("pigment-white", 0));
  grad.addColorStop(peak, TK.alpha("pigment-white", 0.9));
  grad.addColorStop((peak + outer) / 2, TK.alpha("pigment-white", 0.22));
  grad.addColorStop(outer, TK.alpha("pigment-white", 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new CanvasTexture(c);
}

/** Vertical gradient texture for validity walls: strong at the top edge, fading down. */
export function wallGradientTexture(rgbaTop = TK.alpha("pigment-red-69", 0.55), rgbaBottom = TK.alpha("pigment-red-69", 0)) {
  const c = document.createElement("canvas");
  c.width = 4; c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, rgbaTop);
  grad.addColorStop(0.25, rgbaTop.replace(/[\d.]+\)$/, "0.28)"));
  grad.addColorStop(1, rgbaBottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  return new CanvasTexture(c);
}

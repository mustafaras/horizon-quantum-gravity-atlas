import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "three";

// s3dDispose lives in a browser-only JSX module; evaluate its exact source.
async function loadS3dDispose() {
  const source = await readFile(new URL("../js/scene3d.jsx", import.meta.url), "utf8");
  const match = source.match(/function s3dDispose\(root\) \{[\s\S]*?\n\}\n/);
  assert.ok(match, "s3dDispose definition not found in js/scene3d.jsx");
  const window = {};
  return new Function("window", `${match[0]}; return s3dDispose;`)(window);
}

test("scene disposal never destroys THREE.Sprite's shared module-level geometry", async () => {
  const s3dDispose = await loadS3dDispose();
  const leaving = new THREE.Scene();
  const live = new THREE.Scene();
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial());
  const survivor = new THREE.Sprite(new THREE.SpriteMaterial());
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
  leaving.add(sprite, mesh);
  live.add(survivor);
  assert.equal(sprite.geometry, survivor.geometry, "precondition: sprites share one geometry");
  const disposed = new Set();
  sprite.geometry.addEventListener("dispose", () => disposed.add("sprite"));
  mesh.geometry.addEventListener("dispose", () => disposed.add("mesh"));
  s3dDispose(leaving);
  assert.ok(disposed.has("mesh"), "owned geometry is still released");
  assert.ok(!disposed.has("sprite"), "shared sprite geometry must stay alive for other renderers");
});

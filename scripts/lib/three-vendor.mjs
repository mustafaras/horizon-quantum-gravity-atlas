import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export function inspectThreeVendor(root) {
  const failures = [];
  const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
  const exists = (file) => fs.existsSync(path.join(root, file));
  if (!exists("vendor/three/VERSION")) return ["Missing vendor/three/VERSION"];
  const metadata = JSON.parse(read("vendor/three/VERSION"));
  const pkg = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  const version = metadata.version;
  if (!/^\d+\.\d+\.\d+$/.test(version) || metadata.name !== "three"
      || pkg.dependencies?.three !== version
      || lock.packages?.[""].dependencies?.three !== version
      || lock.packages?.["node_modules/three"]?.version !== version
      || !read("README.md").includes(`Three.js ${version}`)) {
    failures.push("Three.js version differs between VERSION, package.json, lockfile or README");
  }
  if (!/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(metadata.tarballIntegrity)
      || lock.packages?.["node_modules/three"]?.integrity !== metadata.tarballIntegrity
      || metadata.upstream !== "https://www.npmjs.com/package/three"
      || metadata.tarball !== `https://registry.npmjs.org/three/-/three-${version}.tgz`
      || !Number.isFinite(Date.parse(metadata.retrievedAt))) {
    failures.push("Invalid Three.js upstream/integrity/retrieval metadata");
  }
  const html = read("index.html");
  if (/vendor\/three\/(?:three\.min\.js|examples\/js\/)/.test(html)) failures.push("index.html contains a legacy Three.js runtime reference");
  for (const [, src] of html.matchAll(/<script[^>]+\bsrc="([^"]+)"/g)) {
    if (/^(?:https?:)?\/\//.test(src)) failures.push(`index.html loads an external runtime asset: ${src}`);
  }
  const mapText = html.match(/<script\s+type="importmap">([\s\S]*?)<\/script>/)?.[1];
  if (!mapText) return [...failures, "Missing Three.js import map"];
  const imports = JSON.parse(mapText).imports;
  const expected = {
    three: "./vendor/three/build/three.module.js",
    "three/webgpu": "./vendor/three/build/three.webgpu.js",
    "three/tsl": "./vendor/three/build/three.tsl.js",
    "three/addons/": "./vendor/three/examples/jsm/",
  };
  for (const [key, value] of Object.entries(expected)) {
    if (imports[key] !== value) failures.push(`Invalid import-map path for ${key}`);
    if (!exists(value)) failures.push(`Missing import-map asset: ${value}`);
  }
  const files = metadata.files ?? {};
  if (!files.LICENSE || !Object.keys(files).length) failures.push("Missing vendored file integrity/license manifest");
  const inspectAssets = (directory) => {
    for (const entry of fs.readdirSync(path.join(root, "vendor/three", directory), { withFileTypes: true })) {
      const file = path.posix.join(directory, entry.name);
      if (entry.isDirectory()) inspectAssets(file);
      else if (entry.isSymbolicLink()) failures.push(`Vendored asset must not be a symlink: ${file}`);
      else if (file !== "VERSION" && !Object.hasOwn(files, file)) failures.push(`Vendored asset lacks integrity metadata: ${file}`);
    }
  };
  inspectAssets("");
  for (const [file, digest] of Object.entries(files)) {
    if (file.startsWith("/") || file.split("/").includes("..") || !/^[a-f0-9]{64}$/.test(digest)) {
      failures.push(`Invalid vendored manifest entry: ${file}`);
      continue;
    }
    const asset = `vendor/three/${file}`;
    if (!exists(asset)) { failures.push(`Missing vendored asset: ${asset}`); continue; }
    const actual = createHash("sha256").update(fs.readFileSync(path.join(root, asset))).digest("hex");
    if (actual !== digest) failures.push(`Vendored integrity mismatch: ${asset}`);
  }
  const queue = ["js/bootstrap.mjs", "js/render/three-runtime.mjs",
    ...Object.values(imports).filter((value) => !value.endsWith("/")).map((value) => value.replace(/^\.\//, ""))];
  const visited = new Set();
  while (queue.length) {
    const file = queue.pop();
    if (visited.has(file)) continue;
    visited.add(file);
    if (!exists(file)) { failures.push(`Missing transitive ESM asset: ${file}`); continue; }
    if (file.startsWith("vendor/three/") && !files[file.slice("vendor/three/".length)]) {
      failures.push(`ESM asset lacks integrity metadata: ${file}`);
    }
    const source = read(file);
    const references = [
      ...source.matchAll(/^\s*(?:import|export)\s+(?:[^;]*?\bfrom\s*)?["']([^"']+)["']/gm),
      ...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
    ];
    for (const [, specifier] of references) {
      if (/^(?:https?:)?\/\//.test(specifier)) {
        failures.push(`${file} imports an external runtime asset: ${specifier}`);
        continue;
      }
      let resolved;
      if (specifier.startsWith(".")) resolved = path.join(path.dirname(file), specifier);
      else if (imports[specifier]) resolved = imports[specifier];
      else {
        const prefix = Object.keys(imports).find((key) => key.endsWith("/") && specifier.startsWith(key));
        if (prefix) resolved = imports[prefix] + specifier.slice(prefix.length);
      }
      if (!resolved) failures.push(`${file} has an unmapped ESM import: ${specifier}`);
      else queue.push(resolved.replace(/^\.\//, ""));
    }
  }
  for (const file of ["vendor/three/three.min.js", "vendor/three/examples/js"]) {
    if (exists(file)) failures.push(`Remove legacy Three.js asset: ${file}`);
  }
  return failures;
}

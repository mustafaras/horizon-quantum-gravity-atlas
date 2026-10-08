import fs from "node:fs";
import path from "node:path";
import { inspectThreeVendor } from "./lib/three-vendor.mjs";

const root = process.cwd();
const failures = [];

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

function fail(message) {
  failures.push(message);
}

function requireFile(file) {
  if (!exists(file)) fail(`Missing required file: ${file}`);
}

function pngSize(file) {
  const buffer = fs.readFileSync(path.join(root, file));
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    fail(`${file} is not a PNG file`);
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function requirePngSize(file, width, height) {
  requireFile(file);
  if (!exists(file)) return;
  const size = pngSize(file);
  if (!size) return;
  if (size.width !== width || size.height !== height) {
    fail(`${file} must be ${width}x${height}; found ${size.width}x${size.height}`);
  }
}

function normalizeLocalAsset(src) {
  return src.replace(/^\.\//, "").split("#")[0].split("?")[0];
}

for (const file of [
  "README.md",
  "index.html",
  "favicon.svg",
  "manifest.webmanifest",
  "docs/social/og-image.png",
  "docs/icons/favicon-16.png",
  "docs/icons/favicon-32.png",
  "docs/icons/apple-touch-icon.png",
  "docs/icons/icon-192.png",
  "docs/icons/icon-512.png"
]) {
  requireFile(file);
}

const readme = read("README.md");

if (readme.includes("```mermaid")) {
  fail("README.md must not contain Mermaid code fences; use committed SVG diagrams.");
}

if (readme.includes("Unable to render rich display")) {
  fail("README.md contains a GitHub rich-display error string.");
}

const localImageRefs = [...readme.matchAll(/<img[^>]+src="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((src) => !/^https?:\/\//.test(src));

for (const src of localImageRefs) {
  const asset = normalizeLocalAsset(src);
  if (!exists(asset)) fail(`README image path does not exist: ${src}`);
}

const screenshotRefs = localImageRefs.filter((src) => src.includes("docs/screenshots/"));
if (screenshotRefs.length < 9) {
  fail(`README should reference at least 9 cinematic screenshots; found ${screenshotRefs.length}`);
}

const diagramRefs = localImageRefs.filter((src) => src.includes("docs/diagrams/"));
if (diagramRefs.length < 11) {
  fail(`README should reference at least 11 static diagrams; found ${diagramRefs.length}`);
}

for (const file of fs.readdirSync(path.join(root, "docs", "diagrams")).filter((name) => name.endsWith(".svg"))) {
  const body = read(path.join("docs", "diagrams", file));
  if (!body.includes("<svg") || !body.includes("</svg>")) {
    fail(`Diagram is not a complete SVG: docs/diagrams/${file}`);
  }
}

const manifest = JSON.parse(read("manifest.webmanifest"));
if (manifest.name !== "HORIZON — Quantum Gravity Atlas") {
  fail("manifest.webmanifest has an unexpected application name.");
}

for (const icon of manifest.icons ?? []) {
  const iconPath = normalizeLocalAsset(icon.src);
  if (!exists(iconPath)) fail(`Manifest icon path does not exist: ${icon.src}`);
}

requirePngSize("docs/social/og-image.png", 1200, 630);
requirePngSize("docs/icons/favicon-16.png", 16, 16);
requirePngSize("docs/icons/favicon-32.png", 32, 32);
requirePngSize("docs/icons/apple-touch-icon.png", 180, 180);
requirePngSize("docs/icons/icon-192.png", 192, 192);
requirePngSize("docs/icons/icon-512.png", 512, 512);

for (const htmlFile of ["index.html"]) {
  const html = read(htmlFile);
  for (const required of [
    'name="description"',
    'rel="canonical"',
    'rel="manifest"',
    'rel="apple-touch-icon"',
    'property="og:title"',
    'property="og:description"',
    'property="og:image"',
    'name="twitter:card"',
    'name="twitter:image"'
  ]) {
    if (!html.includes(required)) fail(`${htmlFile} is missing ${required}`);
  }

  const assetRefs = [
    ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
    ...html.matchAll(/<link[^>]+href="([^"]+)"/g),
    ...html.matchAll(/<img[^>]+src="([^"]+)"/g)
  ].map((match) => match[1]);

  const metadataLinks = new Set(
    [...html.matchAll(/<link[^>]+href="([^"]+)"[^>]*>/g)]
      .filter((match) => /rel="(canonical|alternate|author|license|me)"/.test(match[0]))
      .map((match) => match[1])
  );

  for (const ref of assetRefs) {
    if (metadataLinks.has(ref)) continue;
    if (/^https?:\/\//.test(ref)) {
      fail(`${htmlFile} must self-host third-party assets; found external reference: ${ref}`);
      continue;
    }
    if (/^(data:|#|mailto:)/.test(ref)) continue;
    const asset = normalizeLocalAsset(ref);
    if (!exists(asset)) fail(`${htmlFile} asset path does not exist: ${ref}`);
  }
}

for (const file of [
  "vendor/fonts/fonts.css",
  "vendor/katex/katex.min.css",
  "vendor/katex/katex.min.js",
  "vendor/react/react.development.js",
  "vendor/react/react-dom.development.js",
  "vendor/babel/babel.min.js",
  "js/bootstrap.mjs",
  "js/render/three-runtime.mjs"
]) {
  requireFile(file);
}

failures.push(...inspectThreeVendor(root));

for (const cssFile of ["vendor/fonts/fonts.css", "vendor/katex/katex.min.css"]) {
  if (!exists(cssFile)) continue;
  const css = read(cssFile);
  for (const match of css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
    const ref = match[2];
    if (/^(data:|https?:)/.test(ref)) {
      fail(`${cssFile} must self-host its assets; found external reference: ${ref}`);
      continue;
    }
    const asset = path.join(path.dirname(cssFile), normalizeLocalAsset(ref));
    if (!exists(asset)) fail(`${cssFile} asset path does not exist: ${ref}`);
  }
}

if (failures.length) {
  console.error("Repository validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Repository validation passed.");

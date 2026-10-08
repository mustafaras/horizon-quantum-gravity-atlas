// Playwright configuration for the HORIZON QA suite.
// The server is started in globalSetup by qa/lib/serve.mjs (127.0.0.1 only,
// verified to serve this worktree) — Playwright's own webServer option is
// deliberately not used because it cannot prove which checkout it serves.

import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./specs",
  outputDir: "./test-results",
  testMatch: "*.spec.mjs",
  globalSetup: "./global-setup.mjs",
  globalTeardown: "./global-teardown.mjs",
  workers: 1,               // deterministic ordering; shared verified server
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  snapshotPathTemplate: "{testDir}/../baselines/{arg}{ext}",
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: process.env.QA_BASE_URL,
    colorScheme: "dark",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "chromium", use: {
      browserName: "chromium",
      launchOptions: process.env.CI ? { args: ["--disable-blink-features=WebGPU"] } : {},
    } },
  ],
});

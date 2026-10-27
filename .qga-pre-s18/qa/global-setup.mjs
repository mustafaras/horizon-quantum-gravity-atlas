// Starts the verified 127.0.0.1 static server for the whole test run and
// publishes its base URL as QA_BASE_URL. Fails fast if the served index.html
// is not byte-identical to this worktree's file.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./lib/serve.mjs";

export default async function globalSetup() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const server = await startServer(root);
  globalThis.__QGA_QA_SERVER__ = server;
  process.env.QA_BASE_URL = server.baseUrl;
  console.log(`[qa] serving this worktree at ${server.baseUrl} (verified)`);
}

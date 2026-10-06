// Local static server for QA captures and browser tests.
// Guarantees required by the Stage-4 spec:
//  - binds to 127.0.0.1 only (never exposed to the network)
//  - serves exactly this worktree (verified by byte-equality of index.html)
//  - random free port by default, path-traversal safe, no directory listing

import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".gz": "application/gzip",
};

function resolveSafe(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const rel = decoded === "/" ? "/index.html" : decoded;
  const abs = path.normalize(path.join(root, rel));
  if (!abs.startsWith(path.normalize(root) + path.sep) && abs !== path.normalize(root)) {
    return null; // traversal attempt
  }
  return abs;
}

/**
 * Start the server. Returns { server, port, baseUrl, close }.
 * Throws if the served index.html is not byte-identical to the worktree's —
 * this proves the QA run is exercising THIS checkout and not a stale server.
 */
export async function startServer(root, { port = 0 } = {}) {
  const absRoot = path.resolve(root);
  const server = http.createServer(async (req, res) => {
    try {
      const abs = resolveSafe(absRoot, req.url ?? "/");
      if (!abs) {
        res.writeHead(403).end("forbidden");
        return;
      }
      const info = await stat(abs).catch(() => null);
      if (!info || !info.isFile()) {
        res.writeHead(404).end("not found");
        return;
      }
      const body = await readFile(abs);
      res.writeHead(200, {
        "content-type": MIME[path.extname(abs).toLowerCase()] ?? "application/octet-stream",
        "content-length": body.length,
        "cache-control": "no-store",
      });
      res.end(body);
    } catch (err) {
      res.writeHead(500).end(String(err));
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const bound = server.address().port;
  const baseUrl = `http://127.0.0.1:${bound}`;

  // Worktree-serving proof: served bytes must equal disk bytes.
  const [disk, served] = await Promise.all([
    readFile(path.join(absRoot, "index.html")),
    fetch(`${baseUrl}/index.html`).then((r) => {
      if (!r.ok) throw new Error(`index.html probe failed: HTTP ${r.status}`);
      return r.arrayBuffer();
    }),
  ]);
  const servedBuf = Buffer.from(served);
  if (!servedBuf.equals(disk)) {
    server.close();
    throw new Error(
      "server verification failed: served index.html differs from this worktree's file — refusing to run QA against an ambiguous source"
    );
  }

  return {
    server,
    port: bound,
    baseUrl,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

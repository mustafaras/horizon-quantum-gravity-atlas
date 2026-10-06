export default async function globalTeardown() {
  await globalThis.__QGA_QA_SERVER__?.close();
}

const entries = new Map();
const listeners = new Set();
let serial = 0;
function notify() { for (const listener of listeners) listener(); }

export const renderDiagnostics = Object.freeze({
  allocate(label) {
    const id = `${label}-${++serial}`;
    entries.set(id, { id, label, phase: "initializing", backend: "pending", effects: [], messages: [] });
    notify();
    return id;
  },
  update(id, patch) {
    if (!entries.has(id)) return;
    entries.set(id, { ...entries.get(id), ...patch });
    notify();
  },
  message(id, message) {
    const entry = entries.get(id);
    if (entry) this.update(id, { messages: [...entry.messages.slice(-15), String(message)] });
  },
  remove(id) { entries.delete(id); notify(); },
  snapshot() { return [...entries.values()]; },
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
});

export function describeRenderError(error) {
  return `${error.message || error}. Try WebGL2 in Rendering settings or reload after enabling hardware acceleration. The analytical view remains available.`;
}

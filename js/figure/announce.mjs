// Live announcements for figures (S34). When a reader drags a slider the figure underneath changes many times a second;
// a screen reader must hear where it ended up, once, not every frame. `createDebouncedAnnouncer` waits for the stream of
// changes to go quiet for `delayMs` (500 ms) and then speaks the last one. `announcementFor` is the sentence: the
// title, the status and the focal series' range, taken from the same spec the plot is drawn from, so it can never
// disagree with the picture. Pure, so node:test drives it with a fake clock.

export const ANNOUNCE_DELAY_MS = 500;

const fmt = (v) => (Number.isFinite(v) ? Number(v.toPrecision(4)).toString() : "n/a");
const SERIES = ["line", "step", "points"];

function extent(values) {
  let lo = Infinity, hi = -Infinity;
  for (const v of values) { if (Number.isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } }
  return lo <= hi ? [lo, hi] : [NaN, NaN];
}

/** `Updated: <title>, <status>. <series>: y from A to B over x from C to D.` */
export function announcementFor(spec) {
  const mark = spec.marks.find((m) => m.focal && SERIES.includes(m.type)) ?? spec.marks.find((m) => SERIES.includes(m.type));
  const head = `Updated: ${spec.title}, status ${spec.status}.`;
  if (!mark) return head;
  const [xLo, xHi] = extent(mark.x);
  const [yLo, yHi] = extent(mark.y);
  const name = mark.label?.plain ?? mark.id ?? "series";
  const xLabel = spec.x.label?.plain ?? "x";
  const yLabel = spec.y.label?.plain ?? "y";
  return `${head} ${name}: ${yLabel} from ${fmt(yLo)} to ${fmt(yHi)} over ${xLabel} from ${fmt(xLo)} to ${fmt(xHi)}.`;
}

/**
 * `announcer.push(text)` schedules `announce(text)` after `delayMs` of quiet; a newer push replaces a pending one.
 * `flush()` speaks the pending text now, `cancel()` drops it, `dispose()` cancels for good. Timers are injectable.
 */
export function createDebouncedAnnouncer({ announce, delayMs = ANNOUNCE_DELAY_MS, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  if (typeof announce !== "function") throw new TypeError("createDebouncedAnnouncer needs an announce function");
  let handle = null, pending = null, disposed = false;
  const clear = () => { if (handle !== null) { clearTimer(handle); handle = null; } };
  const fire = () => {
    handle = null;
    const text = pending;
    pending = null;
    if (text !== null && !disposed) announce(text);
  };
  return Object.freeze({
    push(text) {
      if (disposed) return;
      pending = text;
      clear();
      handle = setTimer(fire, delayMs);
    },
    flush() { clear(); fire(); },
    cancel() { clear(); pending = null; },
    dispose() { disposed = true; clear(); pending = null; },
  });
}

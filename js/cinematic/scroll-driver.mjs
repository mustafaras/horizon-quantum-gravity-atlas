// js/cinematic/scroll-driver.mjs — IntersectionObserver-driven narrative
// progress (Prompt 09).
//
// Maps normalized section intersection progress onto the cinematic timeline.
// Design constraints:
//  - No window scroll handlers. IntersectionObserver (with a threshold ramp)
//    marks which shot sections are visible; layout is only sampled inside a
//    single rAF loop that runs while any tracked section is on screen.
//  - Progress for a section is its traversal of the viewport:
//      p = (rootBottom - top) / (height + rootHeight), clamped to [0,1].
//  - The most-visible visible section wins; its shot index + progress are
//    reported through onProgress(index, p).

export function sectionProgress(rect, rootHeight) {
  const span = rect.height + rootHeight;
  if (!(span > 0)) return 0;
  const p = (rootHeight - rect.top) / span;
  return Math.min(1, Math.max(0, p));
}

/**
 * options:
 *   getSections() → [{ el, index }]   current tracked section elements
 *   root            scroll container element (null = viewport)
 *   onProgress(index, p)              called at most once per frame, and
 *                                     only when the value actually changes
 *   requestFrame/cancelFrame          injectable for tests
 */
export function createScrollDriver(options = {}) {
  const {
    getSections = () => [], root = null,
    onProgress = () => {},
    requestFrame = (typeof requestAnimationFrame === "function" ? requestAnimationFrame : null),
    cancelFrame = (typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : null),
  } = options;

  const THRESHOLDS = [];
  for (let i = 0; i <= 20; i++) THRESHOLDS.push(i / 20);

  let visible = new Map();   // el → intersectionRatio
  let initial = new Map();   // el → progress at first sight (baseline)
  let loopId = null;
  let lastKey = "";
  let disposed = false;
  let observer = null;
  let observed = new Set();

  const rootHeight = () => (root ? root.clientHeight : (typeof window !== "undefined" ? window.innerHeight : 0));

  const sample = () => {
    loopId = null;
    if (disposed) return;
    const rh = rootHeight();
    let best = null;
    for (const [el, ratio] of visible) {
      if (!el.isConnected) { visible.delete(el); initial.delete(el); continue; }
      const rect = el.getBoundingClientRect();
      const p = sectionProgress(rect, rh);
      if (!best || ratio > best.ratio) best = { el, ratio, p };
    }
    if (best) {
      // Baseline suppression: the first observed position of a section is
      // the page's resting state (fresh load or deep link), not a user
      // scroll. Only genuine movement away from it drives the timeline, so
      // a deep-linked shot is never overwritten by the initial sample.
      if (!initial.has(best.el)) initial.set(best.el, best.p);
      const moved = Math.abs(best.p - initial.get(best.el)) >= 0.02;
      const entry = getSections().find((s) => s.el === best.el);
      if (moved && entry) {
        const key = entry.index + ":" + best.p.toFixed(3);
        if (key !== lastKey) {
          lastKey = key;
          onProgress(entry.index, best.p);
        }
      }
    }
    if (visible.size && requestFrame) loopId = requestFrame(sample);
  };

  const schedule = () => {
    if (disposed || loopId != null || !requestFrame) return;
    loopId = requestFrame(sample);
  };

  const attach = () => {
    const sections = getSections();
    const els = new Set(sections.map((s) => s.el).filter(Boolean));
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0) visible.set(e.target, e.intersectionRatio);
          else visible.delete(e.target);
        }
        schedule();
      }, { root, threshold: THRESHOLDS });
    }
    for (const el of observed) if (!els.has(el)) { observer.unobserve(el); observed.delete(el); }
    for (const el of els) if (!observed.has(el)) { observer.observe(el); observed.add(el); }
    schedule();
  };

  return {
    attach,
    dispose() {
      disposed = true;
      if (loopId != null && cancelFrame) cancelFrame(loopId);
      loopId = null;
      if (observer) observer.disconnect();
      observer = null;
      visible.clear();
      initial.clear();
      observed.clear();
    },
  };
}

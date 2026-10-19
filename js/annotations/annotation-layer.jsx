// annotation-layer.jsx — Prompt 10 shareable annotation pins.
//
// Pin anchor types (explicit on every pin):
//   - semantic: stable [data-qga-anchor] id — tracks the anchored element;
//   - world:    normalized scene coordinates — projected every frame through
//     the active Scene3D handle with depth-aware occlusion fading (behind
//     geometry → opacity ≤ 0.25) and a ≤300ms spring pop-in;
//   - screen:   normalized content-column coordinates — follows scroll and
//     resize by construction (percentage positioning).
// Pins serialize into the shared URL state only after schema, text and size
// limits pass (the store validates every mutation). All text renders as
// text. Pin hover highlights its linked scene object through the ConceptBus
// (bidirectional with formula linking). Annotations never touch scientific
// simulation parameters.

function AnnotationLayer({ view }) {
  const [atlasState, update] = useQGAState();
  const [placing, setPlacing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState(null);
  const [rejection, setRejection] = useState(null);
  const [positions, setPositions] = useState({}); // id -> {x, y, occluded}
  // A brand-new pin is a DRAFT: it renders and edits locally, but enters
  // shared state only when its first Save passes schema/text/size limits.
  const [draft, setDraft] = useState(null);
  const rootRef = useRef(null);
  const allPins = atlasState.annotations ?? [];
  // Pins render on the view they were placed on (screen/world/semantic
  // coordinates are meaningless on a different module's scene).
  const visiblePins = allPins.filter((pin) => !pin.view || pin.view === view);
  const pinsRef = useRef(visiblePins); pinsRef.current = visiblePins;
  const allPinsRef = useRef(allPins); allPinsRef.current = allPins;
  const viewRef = useRef(view); viewRef.current = view;

  // Stateless mutations: validate the RESULT, then write shared state —
  // annotations enter the URL only after schema, text and size limits pass.
  const mutatePins = (nextList, { success } = {}) => {
    const validation = window.QGA_ANNOTATIONS?.validateAnnotationList(nextList);
    if (!validation?.ok) {
      setError(validation?.errors?.join("; ") ?? "Annotation could not be saved.");
      return false;
    }
    update({ annotations: nextList });
    if (success) success();
    return true;
  };

  // Visible rejection of invalid/oversized annotation URL state.
  useEffect(() => {
    const last = window.QGA_LAST_ANNOTATION_REJECTION?.();
    if (last) setRejection(last.reason);
  }, []);
  useEffect(() => { if (rejection == null) return; const t = setTimeout(() => setRejection(null), 12000); return () => clearTimeout(t); }, [rejection]);

  // Arm/disarm placement (palette action + Annotate button + Escape).
  useEffect(() => {
    window.QGA_ARM_ANNOTATION = () => setPlacing(true);
    return () => { if (window.QGA_ARM_ANNOTATION) delete window.QGA_ARM_ANNOTATION; };
  }, []);
  useEffect(() => {
    if (!placing) return undefined;
    window.__qgaAnnotationPlacing = true;
    const onKey = (e) => { if (e.key === "Escape") setPlacing(false); };
    window.addEventListener("keydown", onKey);
    return () => { window.__qgaAnnotationPlacing = false; window.removeEventListener("keydown", onKey); };
  }, [placing]);

  // Placement: Scene3D offers world anchors via "qga-annotation-place";
  // every other click resolves to a semantic anchor or a screen pin.
  useEffect(() => {
    if (!placing) return undefined;
    const commitAdd = (pin) => {
      setPlacing(false);
      // New pins start as drafts: the editor opens immediately; the pin
      // enters shared state only when its first Save validates.
      setDraft(pin);
      setEditingId(pin.id);
      setEditText("");
      setConfirmRemove(false);
    };
    const onPlace = (event) => {
      const detail = event.detail;
      if (!detail || detail.kind !== "world" || !detail.point) return;
      const pin = {
        id: window.QGA_ANNOTATIONS.newAnnotationId(),
        anchor: "world",
        position: [detail.point.x, detail.point.y, detail.point.z],
        text: "",
        view: viewRef.current,
      };
      if (detail.concept) pin.concept = detail.concept;
      commitAdd(pin);
    };
    const onClick = (event) => {
      if (!window.__qgaAnnotationPlacing) return; // consumed by a scene
      // Ignore the layer's own controls (the arming click itself, the
      // banner, existing pins): React 18 flushes discrete events
      // synchronously, so the arming click would otherwise land here.
      if (event.target?.closest?.(".annot-layer")) return;
      const anchor = event.target?.closest?.("[data-qga-anchor]");
      const pin = {
        id: window.QGA_ANNOTATIONS.newAnnotationId(),
        anchor: anchor ? "semantic" : "screen",
        text: "",
        view: viewRef.current,
      };
      if (anchor) pin.target = anchor.getAttribute("data-qga-anchor");
      else {
        const normalized = normalizedFromEvent(event);
        if (!normalized) return;
        pin.position = normalized;
      }
      commitAdd(pin);
    };
    document.addEventListener("qga-annotation-place", onPlace);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("qga-annotation-place", onPlace);
      document.removeEventListener("click", onClick);
    };
  }, [placing]);

  // Normalized screen coordinates within the scrollable content column
  // (the layer root spans the content-inner box, so the rect already
  // accounts for the current scroll position).
  function normalizedFromEvent(event) {
    const root = rootRef.current;
    if (!root || !event.target || typeof event.clientX !== "number") return null;
    const rect = root.getBoundingClientRect();
    if (!rect.height) return null;
    return [
      Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width))),
      Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(1, rect.height))),
    ];
  }

  // Per-frame pin positioning: world pins project through the active scene
  // (occlusion fading), semantic pins track their anchor element. Runs only
  // while such pins exist — the shared motion clock, no idle loop. Drafts
  // are projected too so a freshly placed world pin is immediately visible.
  const framePinsRef = useRef([]);
  framePinsRef.current = [...visiblePins, ...(draft ? [draft] : [])]
    .filter((pin) => pin.anchor === "world" || pin.anchor === "semantic");
  useEffect(() => {
    const pins = framePinsRef.current;
    if (!pins.length) { setPositions({}); return undefined; }
    const MOTION = window.QGA_MOTION;
    if (!MOTION) return undefined;
    const removeListener = MOTION.runtime.addFrameListener({
      onFrame: () => {
        const root = rootRef.current;
        if (!root) return;
        const rootRect = root.getBoundingClientRect();
        const next = {};
        for (const pin of pins) {
          if (pin.anchor === "semantic") {
            const element = root.querySelector(`[data-qga-anchor="${CSS.escape(pin.target)}"]`);
            if (!element) { next[pin.id] = { missing: true }; continue; }
            const rect = element.getBoundingClientRect();
            next[pin.id] = {
              x: rect.left - rootRect.left + Math.min(rect.width, 120),
              y: rect.top - rootRect.top + 8,
            };
          } else {
            const scenes = window.__qgaActiveScenes;
            const handle = scenes ? [...scenes][scenes.size - 1] : null;
            if (!handle) { next[pin.id] = { missing: true }; continue; }
            const projected = handle.projectPoint?.({ x: pin.position[0], y: pin.position[1], z: pin.position[2] });
            if (!projected || !projected.inFront) { next[pin.id] = { missing: true }; continue; }
            const canvasRect = handle.element.getBoundingClientRect();
            next[pin.id] = {
              x: canvasRect.left - rootRect.left + projected.x,
              y: canvasRect.top - rootRect.top + projected.y,
              occluded: projected.occluded,
            };
          }
        }
        setPositions((current) => shallowEqual(current, next) ? current : next);
      },
    });
    return removeListener;
  }, [atlasState.annotations, draft]);

  const saveEdit = () => {
    // Saving a draft commits it to shared state (validated); saving an
    // existing pin updates its text in place.
    const base = draft && draft.id === editingId ? [...allPins, draft] : allPins;
    const next = base.map((pin) => pin.id === editingId ? { ...pin, text: editText } : pin);
    mutatePins(next, {
      success: () => { setEditingId(null); setError(null); setDraft(null); },
    });
  };
  const removePin = (id) => {
    mutatePins(
      allPins.filter((pin) => pin.id !== id),
      { success: () => { setConfirmRemove(false); setEditingId(null); setDraft(null); } },
    );
  };
  const closeEditor = () => {
    // Closing without saving discards a draft (it never entered state).
    setEditingId(null);
    setDraft(null);
  };

  const pinCount = pinsRef.current.length;
  const renderPins = draft ? [...pinsRef.current, draft] : pinsRef.current;
  return (
    <div className={"annot-layer" + (placing ? " placing" : "")} ref={rootRef} aria-live="polite">
      {rejection ? (
        <div className="annot-rejection" role="alert">
          <strong>Annotation state was rejected.</strong> {rejection} Everything else loaded normally.
          <button className="btn" onClick={() => setRejection(null)} aria-label="Dismiss annotation rejection">Dismiss</button>
        </div>
      ) : null}
      {error ? (
        <div className="annot-rejection error" role="alert">
          <strong>Annotation not saved.</strong> {error}
          <button className="btn" onClick={() => setError(null)} aria-label="Dismiss annotation error">Dismiss</button>
        </div>
      ) : null}
      {placing ? (
        <div className="annot-placing-banner" role="status">
          Click anywhere to place a pin — on the 3D scene it anchors in world space, on labelled sections it anchors semantically.
          <button className="btn" onClick={() => setPlacing(false)}>Cancel (esc)</button>
        </div>
      ) : null}
      {renderPins.map((pin) => {
        const position = positions[pin.id];
        const style = pin.anchor === "screen"
          ? { left: (pin.position[0] * 100) + "%", top: (pin.position[1] * 100) + "%" }
          : position && !position.missing
            ? { left: position.x + "px", top: position.y + "px", opacity: position.occluded ? 0.25 : undefined }
            : { display: "none" };
        return (
          <div key={pin.id} className={"annot-pin" + (position?.occluded ? " occluded" : "") + (editingId === pin.id ? " editing" : "")}
            style={style} data-anchor={pin.anchor}
            onMouseEnter={() => { if (pin.concept) window.QGA_CONCEPT_BUS?.publish("annotation-hover", { id: pin.id, concept: pin.concept }); }}
            onMouseLeave={() => { if (pin.concept) window.QGA_CONCEPT_BUS?.publish("formula-clear", { reason: "end" }); }}>
            <button className="annot-marker" aria-label={"Annotation: " + (pin.text || "empty pin") + ". Edit."}
              onClick={() => { setEditingId(pin.id); setEditText(pin.text); setConfirmRemove(null); }}>◆</button>
            {editingId === pin.id ? (
              <div className="annot-popover" role="dialog" aria-label="Edit annotation" onClick={(e) => e.stopPropagation()}>
                <label className="small dim" htmlFor={"annot-text-" + pin.id}>Annotation text</label>
                <textarea id={"annot-text-" + pin.id} className="annot-text" value={editText} rows={3}
                  maxLength={window.QGA_ANNOTATIONS?.ANNOTATION_LIMITS.maxTextLength ?? 280}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}></textarea>
                <div className="annot-popover-actions">
                  <button className="btn" onClick={saveEdit}>Save</button>
                  {confirmRemove ? (
                    <span className="snap-confirm" role="group" aria-label="Confirm removal">
                      <button className="btn snap-confirm-yes" onClick={() => removePin(pin.id)}>✓ Remove</button>
                      <button className="btn" onClick={() => setConfirmRemove(false)}>✕ Keep</button>
                    </span>
                  ) : (
                    <button className="btn" onClick={() => setConfirmRemove(true)}>Remove</button>
                  )}
                  <button className="btn" onClick={closeEditor}>Close</button>
                </div>
                <div className="small dim">{editText.length}/{window.QGA_ANNOTATIONS?.ANNOTATION_LIMITS.maxTextLength ?? 280} · {pin.anchor} anchor</div>
              </div>
            ) : pin.text ? <div className="annot-text-view">{pin.text}</div> : null}
          </div>
        );
      })}
      <button className={"annot-add-btn" + (pinCount ? " has-pins" : "")} onClick={() => setPlacing((v) => !v)}
        aria-pressed={placing} title="Add annotation pin">
        {placing ? "✕ Cancel pin" : "◆ Annotate" + (pinCount ? ` (${pinCount})` : "")}
      </button>
    </div>
  );
}

function shallowEqual(a, b) {
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const key of ka) {
    const x = a[key], y = b[key];
    if (x?.x !== y?.x || x?.y !== y?.y || x?.occluded !== y?.occluded || x?.missing !== y?.missing) return false;
  }
  return true;
}

window.AnnotationLayer = AnnotationLayer;

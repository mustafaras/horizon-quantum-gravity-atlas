// snapshot-panel.jsx — Prompt 10 named parameter snapshots.
//
// localStorage-backed store (schema "horizon-qga-snapshot/v1": version,
// timestamp, validated state, provenance, optional ≤320px thumbnail).
// Restore = camera fly-to (easeInOutQuint, ≤900ms) + a 700ms parameter tween
// applied through silent state patches so every physics quantity recomputes
// live; the final state lands in the URL/history. Import validates the full
// payload and resolves id conflicts explicitly (imported as a copy — never a
// silent overwrite). Save/delete micro-motion is a ≤250ms transform-only
// spring pop; thumbnails capture asynchronously and never block the UI.

function captureSnapshotThumbnail(maxEdge = 320) {
  return new Promise((resolve) => {
    try {
      const scenes = window.__qgaActiveScenes;
      const handle = scenes ? [...scenes][scenes.size - 1] : null;
      // The WebGL drawing buffer is no longer preserved (F-22): ask the scene to draw now, in this task, and
      // read the canvas before returning to the event loop. A scene without capture() keeps the old lookup.
      const canvas = handle?.capture?.() ?? handle?.element?.querySelector("canvas");
      if (!canvas || !canvas.width) { resolve(null); return; }
      const scale = Math.min(1, maxEdge / Math.max(canvas.width, canvas.height));
      const width = Math.max(1, Math.round(canvas.width * scale));
      const height = Math.max(1, Math.round(canvas.height * scale));
      const offscreen = document.createElement("canvas");
      offscreen.width = width; offscreen.height = height;
      const context = offscreen.getContext("2d");
      context.drawImage(canvas, 0, 0, width, height);
      const finish = (url) => resolve(url && url.length <= 131072 ? url : null);
      if (offscreen.toBlob) {
        offscreen.toBlob((blob) => {
          if (!blob) { finish(offscreen.toDataURL("image/png")); return; }
          const reader = new FileReader();
          reader.onload = () => finish(String(reader.result));
          reader.onerror = () => finish(null);
          reader.readAsDataURL(blob);
        }, "image/webp", 0.82);
      } else {
        finish(offscreen.toDataURL("image/png"));
      }
    } catch (error) {
      resolve(null);
    }
  });
}

function SnapshotPanel({ open, onClose }) {
  const [snapshots, setSnapshots] = useState([]);
  const [storageError, setStorageError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [popId, setPopId] = useState(null);
  const fileInputRef = useRef(null);
  const storeRef = useRef(null);
  if (!storeRef.current) {
    storeRef.current = window.QGA_SNAPSHOTS?.createSnapshotStore({ storage: window.localStorage });
  }

  const refresh = useCallback(() => {
    if (!storeRef.current) return;
    const result = storeRef.current.list();
    setSnapshots(result.snapshots ?? []);
    setStorageError(result.ok ? (result.dropped ? `${result.dropped} stored snapshot(s) were invalid and skipped.` : null) : result.error);
  }, []);

  useEffect(() => { if (open) { refresh(); setNotice(null); setConfirmRemove(null); } }, [open, refresh]);

  // Spring scale pop (transform-only, ≤250ms) on save/delete.
  const pop = (id) => {
    setPopId(id);
    setTimeout(() => setPopId((current) => (current === id ? null : current)), 260);
  };

  const saveSnapshot = async () => {
    if (!storeRef.current || busy) return;
    setBusy(true);
    try {
      const state = window.QGA_READ_STATE();
      const scenes = window.__qgaActiveScenes;
      const sceneHandle = scenes ? [...scenes][scenes.size - 1] : null;
      const pose = sceneHandle?.getPose?.() ?? null;
      // Thumbnail capture is async and best-effort; the UI never blocks.
      const thumbnail = await Promise.race([
        captureSnapshotThumbnail(),
        new Promise((resolve) => setTimeout(() => resolve(null), 600)),
      ]);
      const id = "snap-" + Date.now().toString(36);
      const record = window.QGA_SNAPSHOTS.createSnapshotRecord({
        id,
        name: name.trim() || (state.view ? `${state.view} · ${new Date().toLocaleString()}` : "Snapshot"),
        state,
        view: state.view,
        url: location.pathname + qgaStateSearch(state),
        thumbnail,
      });
      // The camera pose rides beside the record (never inside the scientific
      // state) so restoring can fly the camera back.
      const cameraPose = pose;
      const result = storeRef.current.save(cameraPose ? { ...record, cameraPose } : record);
      if (!result.ok) setNotice({ kind: "error", text: result.errors?.join("; ") ?? result.error ?? "Snapshot could not be saved." });
      else {
        setNotice({ kind: "ok", text: result.evicted ? `Snapshot saved (oldest evicted — the store keeps ${window.QGA_SNAPSHOTS.SNAPSHOT_LIMITS.maxSnapshots}).` : "Snapshot saved." });
        setName("");
        pop(id);
      }
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const restoreSnapshot = (snapshot) => {
    const target = snapshot.state;
    const current = window.QGA_READ_STATE();
    const MOTION = window.QGA_MOTION;
    const prm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Camera fly-to: easeInOutQuint, ≤900ms (Scene3D snaps it under PRM).
    const scenes = window.__qgaActiveScenes;
    const sceneHandle = scenes ? [...scenes][scenes.size - 1] : null;
    if (snapshot.cameraPose && sceneHandle?.flyTo) {
      sceneHandle.flyTo(snapshot.cameraPose, { easing: "quint", duration: 0.9 });
    }
    const apply = (patch, { final = false } = {}) => {
      if (final) qgaWriteState(patch, { replace: false });
      else window.QGA_APPLY_SILENT?.(patch);
    };
    const diff = window.QGA_COMPARE?.diffStates(current, target);
    if (!diff || prm || !MOTION || (!diff.tweenable.length && !diff.switches.length)) {
      apply(target, { final: true }); // reduced motion or no diff: instant
    } else {
      // 700ms parameter tween — physics recomputes every frame, then the
      // final state lands in the URL and history.
      MOTION.runtime.tween({
        from: 0, to: 1, duration: 700, easing: "easeInOutCubic",
        onUpdate: (t) => apply(window.QGA_COMPARE.sampleTweenState(current, diff, t)),
        onComplete: () => apply(target, { final: true }),
      });
    }
    setNotice({ kind: "ok", text: `Restored “${snapshot.name}”.` });
  };

  const removeSnapshot = (id) => {
    const result = storeRef.current?.remove(id);
    if (result?.ok) { pop(id); setConfirmRemove(null); }
    else setNotice({ kind: "error", text: result?.errors?.[0] ?? "Snapshot could not be removed." });
    refresh();
  };

  const exportSnapshot = (id) => {
    const result = storeRef.current?.export(id);
    if (!result?.ok) { setNotice({ kind: "error", text: result?.errors?.[0] ?? "Export failed." }); return; }
    const href = URL.createObjectURL(new Blob([JSON.stringify(result.payload, null, 2) + "\n"], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `horizon-snapshot-${id}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(href), 0);
  };

  const importSnapshot = async (file) => {
    try {
      const payload = JSON.parse(await file.text());
      const result = storeRef.current?.import(payload);
      if (!result?.ok) setNotice({ kind: "error", text: result?.errors?.join("; ") ?? "Import failed." });
      else setNotice({
        kind: "ok",
        text: result.conflict
          ? `A snapshot with that id already exists — imported as a copy (“${result.importedAs}”).`
          : `Imported “${result.snapshot.name}”.`,
      });
      refresh();
    } catch (error) {
      setNotice({ kind: "error", text: `Import failed: ${error.message}` });
    }
  };

  if (!open) return null;
  return (
    <div className="snap-backdrop" onClick={onClose}>
      <aside className="snap-panel" role="dialog" aria-modal="true" aria-label="Parameter snapshots"
        onClick={(e) => e.stopPropagation()}>
        <header className="snap-head">
          <div>
            <div className="module-kicker">Prompt 10 · Snapshots</div>
            <h2>Parameter snapshots</h2>
          </div>
          <button className="menu-btn" onClick={onClose} aria-label="Close snapshots panel">CLOSE ✕</button>
        </header>
        <p className="small dim">Named atlas states stored locally with schema version, timestamp, provenance and an optional thumbnail. Restoring flies the camera back and tweens parameters — every physical quantity recomputes live.</p>
        <div className="snap-save-row">
          <input className="snap-name" type="text" placeholder="Snapshot name (e.g. Kerr a★ 0.9 edge view)"
            aria-label="Snapshot name" value={name} onChange={(e) => setName(e.target.value)}
            maxLength={window.QGA_SNAPSHOTS?.SNAPSHOT_LIMITS.maxNameLength ?? 60}></input>
          <button className="btn" onClick={saveSnapshot} disabled={busy}>{busy ? "Capturing…" : "Save snapshot"}</button>
        </div>
        {storageError ? <p className="snap-error" role="alert">{storageError}</p> : null}
        {notice ? <p className={"snap-notice " + (notice.kind === "ok" ? "ok" : "error")} role="status">{notice.text}</p> : null}
        <ul className="snap-list">
          {snapshots.length === 0 ? (
            <li className="snap-empty">No snapshots yet — save the current state to compare or return to it later.</li>
          ) : snapshots.map((snapshot) => (
            <li key={snapshot.id} className={"snap-item" + (popId === snapshot.id ? " pop" : "")}>
              {snapshot.thumbnail ? <img className="snap-thumb" src={snapshot.thumbnail} alt="" width={64} height={40}></img> : <div className="snap-thumb snap-thumb-empty" aria-hidden="true"></div>}
              <div className="snap-meta">
                <div className="snap-name-text">{snapshot.name}</div>
                <div className="small dim">{snapshot.provenance?.view} · {new Date(snapshot.createdAt).toLocaleString()}</div>
              </div>
              <div className="snap-actions">
                <button className="btn" onClick={() => restoreSnapshot(snapshot)}>Restore</button>
                <button className="btn" onClick={() => exportSnapshot(snapshot.id)} aria-label={"Export snapshot " + snapshot.name}>Export</button>
                {confirmRemove === snapshot.id ? (
                  <span className="snap-confirm" role="group" aria-label="Confirm removal">
                    <span className="small">Remove?</span>
                    <button className="btn snap-confirm-yes" onClick={() => removeSnapshot(snapshot.id)}>✓ Remove</button>
                    <button className="btn" onClick={() => setConfirmRemove(null)}>✕ Keep</button>
                  </span>
                ) : (
                  <button className="btn" onClick={() => setConfirmRemove(snapshot.id)} aria-label={"Remove snapshot " + snapshot.name}>Remove</button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <footer className="snap-foot">
          <button className="btn" onClick={() => fileInputRef.current?.click()}>Import snapshot…</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" className="snap-file" aria-label="Import snapshot file"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) importSnapshot(file); e.target.value = ""; }}></input>
          <span className="small dim">Schema {window.QGA_SNAPSHOTS?.SNAPSHOT_SCHEMA ?? "horizon-qga-snapshot/v1"} · max {window.QGA_SNAPSHOTS?.SNAPSHOT_LIMITS.maxSnapshots ?? 8}</span>
        </footer>
      </aside>
    </div>
  );
}

window.SnapshotPanel = SnapshotPanel;

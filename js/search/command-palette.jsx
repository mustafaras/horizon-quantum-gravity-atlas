// command-palette.jsx — Prompt 10 global command/search palette.
//
// Opens with Cmd/Ctrl+K (wired here), the desktop sidebar button and the
// mobile topbar button (both in app.jsx). Indexes modules, reference views,
// glossary, symbols, formula titles, references, open problems, camera shots
// (when a cinematic manifest is present) and atlas actions through the
// deterministic search-index module. While open: backdrop blur + vignette
// (CSS, ≤200ms), the active 3D scene keeps rendering but idle drift pauses,
// and hovering a formula/symbol result previews its scene highlight through
// the ConceptBus (no camera movement). Fully keyboard-driven; focus is
// restored to the previously focused element on close.

function useCommandPaletteOpen() {
  const [open, setOpen] = useState(false);
  const restoreRef = useRef(null);
  const openPalette = useCallback(() => {
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }, []);
  const closePalette = useCallback(({ restoreFocus = true } = {}) => {
    setOpen(false);
    if (restoreFocus && restoreRef.current && document.contains(restoreRef.current)) {
      try { restoreRef.current.focus(); } catch (e) { /* detached node */ }
    }
    restoreRef.current = null;
  }, []);
  return { open, openPalette, closePalette };
}

function CommandPalette({ go }) {
  const { open, openPalette, closePalette } = useCommandPaletteOpen();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const resultsRef = useRef([]);
  const goRef = useRef(go); goRef.current = go;

  useEffect(() => {
    window.QGA_OPEN_PALETTE = openPalette;
    return () => { if (window.QGA_OPEN_PALETTE === openPalette) delete window.QGA_OPEN_PALETTE; };
  }, [openPalette]);

  // Cmd/Ctrl+K opens; Escape closes (also handled on the input).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette]);

  // The palette announces itself so scenes pause idle drift while it is open.
  useEffect(() => {
    if (!open) return undefined;
    window.QGA_CONCEPT_BUS?.publish("palette-visibility", { open: true });
    return () => window.QGA_CONCEPT_BUS?.publish("palette-visibility", { open: false });
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery(""); setActiveIndex(0);
      // Focus synchronously after the commit: a rAF-delayed focus loses the
      // first typed characters when keyboard input follows immediately.
      inputRef.current?.focus();
      return undefined;
    }
    return undefined;
  }, [open]);

  const index = useMemo(() => {
    const SEARCH = window.QGA_SEARCH;
    if (!SEARCH) return [];
    const modules = (window.QGA_MODULES ?? []).map((m) => ({
      id: m.id, title: m.title, subtitle: `Module ${m.num}`, run: () => goRef.current(m.id),
    }));
    const views = [
      { id: "overview", title: "Atlas overview", run: () => goRef.current("overview") },
      { id: "glossary", title: "Glossary", run: () => goRef.current("glossary") },
      { id: "symbols", title: "Symbol Atlas", run: () => goRef.current("symbols") },
      { id: "refs", title: "References", run: () => goRef.current("refs") },
      { id: "open", title: "Open Problems", run: () => goRef.current("open") },
      { id: "paper", title: "Whitepaper", run: () => goRef.current("paper") },
    ];
    const formulas = (window.QGA_FORMULA_INDEX ?? []).map((f) => ({
      view: f.view, viewLabel: f.viewLabel, title: f.title,
      run: () => {
        // Deterministic focus hand-off: cross-view navigation consumes the
        // pending focus on mount; same-view jumps open the card directly.
        window.__qgaPendingFormulaFocus = f.title;
        goRef.current(f.view);
        window.dispatchEvent(new CustomEvent("qga-open-formula", { detail: { title: f.title } }));
      },
    }));
    const symbols = (window.QGA_SYMBOLS ?? []).map((symbol) => ({
      sym: symbol.sym, cat: symbol.cat, contexts: symbol.contexts ?? [],
      run: () => { const target = symbol.contexts?.[0]?.module; if (target) goRef.current(target); },
    }));
    const glossary = (window.QGA_GLOSSARY ?? []).map((term) => ({
      term: term.term, def: term.def, run: () => goRef.current("glossary"),
    }));
    const references = (window.QGA_REFERENCES ?? []).map((reference) => ({
      tag: reference.tag, text: reference.text, run: () => goRef.current("refs"),
    }));
    const problems = (window.QGA_OPEN_PROBLEMS ?? []).map((problem) => ({
      title: problem.title, kind: problem.kind, body: problem.body, run: () => goRef.current("open"),
    }));
    // Camera shots: indexed from the cinematic manifests when present. On a
    // Prompt 08 base there are none — the code path stays ready for them.
    const shots = (window.QGA_CINEMATIC?.shotManifests?.() ?? window.QGA_CINEMATIC?.SHOTS ?? [])
      .filter((shot) => shot && shot.id && shot.title)
      .map((shot) => ({
        id: shot.id, title: shot.title, subtitle: shot.subtitle ?? "Camera shot",
        run: () => { if (typeof shot.run === "function") shot.run(); else goRef.current(shot.view); },
      }));
    const actions = [
      { id: "save-snapshot", title: "Save snapshot", subtitle: "Capture the current state", keywords: ["camera", "state", "store"], run: () => window.QGA_OPEN_SNAPSHOTS?.() },
      { id: "open-compare", title: "Open compare view", subtitle: "A/B comparison of two states", keywords: ["ab", "side", "swipe", "diff"], run: () => goRef.current("compare") },
      { id: "add-annotation", title: "Add annotation", subtitle: "Place a pin on the current view", keywords: ["pin", "note", "mark"], run: () => window.QGA_ARM_ANNOTATION?.() },
      { id: "copy-link", title: "Copy link", subtitle: "Shareable URL for this state", keywords: ["share", "url"], run: () => { try { window.QGA_COPY_LINK(window.QGA_READ_STATE()); } catch (e) {} } },
      { id: "export-json", title: "Export JSON", subtitle: "Full state with provenance", keywords: ["download", "export"], run: () => window.QGA_EXPORT_JSON(window.QGA_READ_STATE()) },
      { id: "rendering-settings", title: "Rendering settings", subtitle: "Open the rendering panel", keywords: ["quality", "backend", "motion"], run: () => window.postMessage({ type: "__activate_edit_mode" }, location.origin) },
    ];
    return SEARCH.buildSearchIndex({ actions, views, modules, shots, formulas, symbols, glossary, references, problems });
  }, []);

  const results = useMemo(() => (window.QGA_SEARCH ? window.QGA_SEARCH.rankResults(index, query) : []), [index, query]);
  resultsRef.current = results;

  useEffect(() => { setActiveIndex(0); }, [query]);

  const runEntry = useCallback((entry) => {
    if (!entry) return;
    closePalette();
    try { entry.run?.(); } catch (error) { console.error("[palette] action failed:", error); }
  }, [closePalette]);

  const onKeyDown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); closePalette(); return; }
    if (e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey)) {
      e.preventDefault();
      setActiveIndex((i) => Math.min(resultsRef.current.length - 1, i + 1));
    } else if (e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey)) {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") { e.preventDefault(); setActiveIndex(0); }
    else if (e.key === "End") { e.preventDefault(); setActiveIndex((i) => Math.max(0, resultsRef.current.length - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); runEntry(resultsRef.current[activeIndex]); }
  };
  // Focus trap: Tab cycles input → esc → input; results are roving-focus
  // (arrow keys), the standard command-palette pattern.
  const dialogRef = useRef(null);
  const onDialogKeyDown = (e) => {
    if (e.key !== "Tab") return;
    const focusables = dialogRef.current
      ? [...dialogRef.current.querySelectorAll("input, button")]
      : [];
    if (!focusables.length) return;
    const current = document.activeElement;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && current === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && current === last) { e.preventDefault(); first.focus(); }
    else if (!focusables.includes(current)) { e.preventDefault(); first.focus(); }
  };

  // Keep the active item in view while arrowing through the list.
  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!open) return null;
  const SEARCH = window.QGA_SEARCH;
  const count = SEARCH ? SEARCH.formatResultCount(results.length, results.length, query) : "";
  return (
    <div className="cmdk-backdrop" onClick={() => closePalette()}>
      <div className="cmdk" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Command palette and search"
        onClick={(e) => e.stopPropagation()} onKeyDown={onDialogKeyDown}>
        <div className="cmdk-head">
          <span className="cmdk-glyph" aria-hidden="true">⌘</span>
          <input ref={inputRef} className="cmdk-input" type="text" placeholder="Search modules, formulas, symbols, references, actions…"
            aria-label="Search the atlas" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown}
            autoComplete="off" spellCheck="false"></input>
          <button className="cmdk-esc" onClick={() => closePalette()} aria-label="Close palette (Escape)">esc</button>
        </div>
        <div className="cmdk-count" aria-live="polite">{count}</div>
        {results.length === 0 ? (
          <div className="cmdk-empty">
            <div className="cmdk-empty-title">No results{query ? <> for “{query}”</> : null}</div>
            <div className="cmdk-empty-hint">Try a module name, a formula title, a symbol, or an action like “snapshot”.</div>
          </div>
        ) : (
          <ul className="cmdk-list" ref={listRef} role="listbox" aria-label="Search results">
            {results.map((entry, i) => (
              <li key={entry.id} role="option" aria-selected={i === activeIndex} data-index={i}
                className={"cmdk-item" + (i === activeIndex ? " active" : "")}
                onMouseEnter={() => {
                  setActiveIndex(i);
                  if (entry.category === "formula" || entry.category === "symbol") {
                    // Preview highlight: no camera movement, gentle pulse.
                    const symbol = symbolOf(entry);
                    if (symbol) window.QGA_CONCEPT_BUS?.publish("formula-highlight", {
                      symbol, title: entry.title, view: window.__qgaCurrentView || "unknown", interaction: "preview",
                    });
                  }
                }}
                onMouseLeave={() => {
                  if (entry.category === "formula" || entry.category === "symbol") {
                    window.QGA_CONCEPT_BUS?.publish("formula-clear", { reason: "blur" });
                  }
                }}
                onClick={() => runEntry(entry)}>
                <span className={"cmdk-cat cmdk-cat-" + entry.category}>{entry.categoryLabel}</span>
                <span className="cmdk-title">
                  {SEARCH ? SEARCH.highlightSegments(entry.title, query).map((segment, j) => (
                    segment.hit ? <mark key={j} className="cmdk-hit">{segment.text}</mark> : <span key={j}>{segment.text}</span>
                  )) : entry.title}
                </span>
                {entry.subtitle ? <span className="cmdk-sub">{entry.subtitle}</span> : null}
              </li>
            ))}
          </ul>
        )}
        <div className="cmdk-foot">
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
          <span className="cmdk-foot-right">{results.length} shown</span>
        </div>
      </div>
    </div>
  );
}

// Symbol entries carry "sym — context" titles; recover the raw tex id for
// preview highlights (the scene registry keys on the tex string).
function symbolOf(entry) {
  if (entry.category !== "symbol") return entry.id.startsWith("formula:") ? formulaSymbolFromTitle(entry.title) : null;
  const dash = entry.title.indexOf(" — ");
  return dash > 0 ? entry.title.slice(0, dash) : entry.title;
}
function formulaSymbolFromTitle() { return null; } // formulas highlight via their own cards, not the palette

window.CommandPalette = CommandPalette;

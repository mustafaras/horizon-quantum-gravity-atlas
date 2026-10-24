// provenance-drawer.jsx — the drawer behind the status chip of every figure caption (S11).
// It shows the registry entry the caption names: model, status, assumptions, validity, numerical method,
// references (DOI / arXiv / bibcode / URL links), the layer table and the seed. VizCaption (core.jsx) opens it.

const PROVENANCE_LAYER_NOTE = {
  data: "measured or tabulated",
  model: "computed from the stated equations",
  decoration: "carries no quantity; hidden in the scientific mode",
};

function ProvenanceList({ title, items }) {
  return (
    <section className="prov-section">
      <h4>{title}</h4>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

function ProvenanceReference({ text }) {
  const links = window.QGA_PROVENANCE.referenceLinks(text);
  return (
    <li>
      {text}
      {links.map((link) => (
        <a key={link.href} className="prov-link" href={link.href} target="_blank" rel="noopener noreferrer">
          {link.kind === "url" ? "link" : link.kind}
        </a>
      ))}
    </li>
  );
}

function ProvenanceDrawer({ id, onClose }) {
  const entry = window.QGA_PROVENANCE.get(id);
  const drawerRef = useRef(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    drawerRef.current?.focus();
    const onKey = (event) => { if (event.key === "Escape") { event.stopPropagation(); closeRef.current(); } };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);
  if (!entry) return null;
  const titleId = "prov-title-" + id;
  return ReactDOM.createPortal(
    <aside ref={drawerRef} className="prov-drawer" role="dialog" aria-modal="false" aria-labelledby={titleId}
      tabIndex={-1} data-provenance-id={id}>
      <header className="prov-head">
        <div className="prov-head-id"><Badge kind={entry.status}></Badge><span className="prov-id">{id}</span></div>
        <button type="button" className="prov-close" onClick={onClose} aria-label="Close provenance">×</button>
      </header>
      <h3 id={titleId} className="prov-model">{entry.model}</h3>
      <ProvenanceList title="Assumptions" items={entry.assumptions}></ProvenanceList>
      <ProvenanceList title="Validity" items={entry.validity}></ProvenanceList>
      <section className="prov-section"><h4>Numerical method</h4><p>{entry.numericalMethod}</p></section>
      <section className="prov-section">
        <h4>References</h4>
        <ul>{entry.references.map((text) => <ProvenanceReference key={text} text={text}></ProvenanceReference>)}</ul>
      </section>
      <section className="prov-section">
        <h4>Layers</h4>
        <table className="prov-layers">
          <thead><tr><th scope="col">Layer</th><th scope="col">Class</th></tr></thead>
          <tbody>
            {entry.layers.map((layer) => (
              <tr key={layer.name} data-layer-class={layer.class}>
                <td>{layer.name}</td>
                <td><span className={"prov-class prov-class-" + layer.class}>{layer.class}</span> {PROVENANCE_LAYER_NOTE[layer.class]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="prov-section"><h4>Seed</h4><p className="prov-seed">{entry.seed}</p></section>
    </aside>,
    document.body,
  );
}

// S21 — sourced observations and constraints, with keyboard-accessible details.
function ConstraintPlane({ go }) {
  const D=window.QGA_CONSTRAINTS, P=window.QGA_FIGURE.plots.planckConstraints;
  const [logLength,setLogLength]=useState(-10);
  const [selected,setSelected]=useState('lhc');
  useEffect(()=>window.QGA_CONCEPT_BUS.on('planck-scale',({logLength:next})=>setLogLength(next)),[]);
  const current=D.CONSTRAINTS.find(entry=>entry.id===selected) || D.CONSTRAINTS[0];
  const position=P.constraintPosition(current);
  const spec=useMemo(()=>P.constraintSpec({logLength,selected}),[logLength,selected]);
  const moduleMarkers = (scene) => [["lhc","sm","SM"],["eotwash","gr","GR"],["eht","bh","BH"],["fermi","approaches","QG"]].map(([entryId,view,label]) => {
    const pos=P.constraintPosition(D.CONSTRAINTS.find(e=>e.id===entryId));
    const x=Math.max(scene.plot.x+22,Math.min(scene.plot.x+scene.plot.w-22,scene.sx.map(pos.x)));
    const y=Math.max(scene.plot.y+22,Math.min(scene.plot.y+scene.plot.h-22,scene.sy.map(pos.y)));
    return <button type="button" key={view} className="constraint-map-link" style={{left:x,top:y}} aria-label={"Open "+view+" module"} title={"Open "+view+" module"} onClick={(event)=>{event.stopPropagation();go(view);}}><span>{label}</span></button>;
  });
  const chooseAt=(x)=>{
    if(!Number.isFinite(x)||x<=0) return;
    let nearest=D.CONSTRAINTS[0], distance=Infinity;
    for(const item of D.CONSTRAINTS){
      const delta=Math.abs(Math.log10(P.constraintPosition(item).x)-Math.log10(x));
      if(delta<distance){nearest=item;distance=delta;}
    }
    setSelected(nearest.id);
  };
  const number=(n)=>Number(n.toPrecision(4)).toExponential(3);
  return <div className="constraint-plane viz-frame" id="planck-constraint-plane">
    <header className="constraint-heading"><div><span className="constraint-kicker">01 / THE OBSERVATIONAL FRONTIER</span><h3>A map of what we can test</h3><p>From tabletop gravity to the early universe: each mark is a different question, with its own assumptions.</p></div>
      <div className="constraint-void"><span>THE PLANCK CORNER</span><strong>No direct data</strong><small>Indirect limits still reach this scale.</small></div></header>
    <div className="constraint-layout"><div className="constraint-chart">
      <Figure spec={spec} onHover={chooseAt} onSelect={chooseAt} extra={moduleMarkers}>
        The diagonal converts length to energy using <Eq tex="E=\hbar c/L"></Eq>. A triangle at the lower edge means the true energy falls below this plot. Marks are guides, not a joint exclusion region.
      </Figure>
      <div className="constraint-crosshair">Ladder crosshair <strong>10^{Math.round(logLength)} m</strong> · move the length slider above to explore</div>
      <nav className="constraint-links" aria-label="Explore related atlas modules"><span>EXPLORE</span>{[['sm','Particles'],['gr','Gravity'],['bh','Black holes'],['exp','Experiments'],['approaches','Quantum approaches']].map(([id,label])=><button className="btn" key={id} onClick={()=>go(id)}>{label} ↗</button>)}</nav>
    </div><aside className="constraint-detail" aria-live="polite">
      <span className="constraint-kicker">SELECTED / {current.experiment}</span><h4>{current.label}</h4>
      <p className="constraint-value">{current.bound==='upper'?'≤ ':current.bound==='lower'?'> ':''}{number(current.lo)} {current.scaleKind==='length'?'m':'eV'}{current.bound==='range'?' – '+number(current.hi)+' '+(current.scaleKind==='length'?'m':'eV'):''}</p>
      <p>{current.note}</p><p className="constraint-uncertainty">{current.uncertainty}</p>
      {position.clipped && <p className="constraint-uncertainty">On plot boundary: the actual energy or length lies outside the displayed axes.</p>}
      <a href={current.reference.url} target="_blank" rel="noreferrer">{current.reference.citation} ↗</a>
      {(current.additionalReferences||[]).map(ref=><a key={ref.url} href={ref.url} target="_blank" rel="noreferrer">{ref.citation} ↗</a>)}
    </aside></div>
    <div className="constraint-selector" aria-label="Select an observation">{D.CONSTRAINTS.map((entry,i)=><button key={entry.id} onClick={()=>setSelected(entry.id)} onMouseEnter={()=>setSelected(entry.id)} onFocus={()=>setSelected(entry.id)} aria-pressed={selected===entry.id} className={'constraint-chip'+(selected===entry.id?' selected':'')}><span style={{background:`var(--cat-${i%8+1})`}} aria-hidden="true"></span>{entry.label}</button>)}</div>
    <VizCaption provenanceId="planck-constraint-plane" status="effective">The markers collect published scales with different meanings. Their equivalent lengths are visualization aids; the Fermi bound, the graviton mass and inflation scale depend on stated models. The hatched corner denotes the absence of a direct Planck-energy experiment.</VizCaption>
  </div>;
}
function PlanckSpectra({ jMaxHalf }) {
  const P=window.QGA_FIGURE.plots.planckConstraints;
  const area=useMemo(()=>P.areaSpectrumSpec(jMaxHalf),[jMaxHalf]);
  const volume=useMemo(()=>P.volumeSpectrumSpec(jMaxHalf),[jMaxHalf]);
  return <div className="planck-spectra"><div className="planck-spectra-heading"><span className="constraint-kicker">02 / QUANTUM GEOMETRY · CONJECTURAL</span><h3>Discrete geometry, inside a model</h3><p>Area belongs to a link; volume belongs to an intertwiner. Here all four links have equal spin. Repeated volume eigenvalues share a mark.</p></div>
    <div className="planck-spectra-grid"><Figure spec={area}></Figure><Figure spec={volume}></Figure></div>
    <VizCaption provenanceId="planck-spin-spectra" status="conjectural">We choose γ = 1 following Bianchi and Haggard’s convention; it is not a measurement. The volume is the Barbieri quantum-tetrahedron operator, while the nearby 3D node sizes are an independent schematic proxy. <a href="https://arxiv.org/abs/1208.2228" target="_blank" rel="noreferrer">Bianchi &amp; Haggard (2012) ↗</a></VizCaption>
  </div>;
}

// rg-flow-field-lab.jsx — the three-dimensional RG flow field (Prompt 07), moved out of js/mod-rg-stage3.jsx (S18) so the module file can
// shrink and so the gravity model can be offered beside the one-coupling models. The science is js/science/rg-flow-3d.mjs, the scene is
// js/visualizations/rg/flow-field.mjs; this file holds the model selector and the caption.

const RGF_MODELS = [
  { id: "qcd", label: "QCD one loop" },
  { id: "qed", label: "QED one loop" },
  { id: "asymptotic-safety", label: "pedagogical toy" },
  { id: "gravity", label: "Einstein–Hilbert (S18)" },
];

function RgFlowFieldLab() {
  const [state] = useQGAState();
  const [model, setModel] = useState(state.rgModel);
  const gravity = model === "gravity";
  const params = { nf: state.rgNf, a: state.rgA, b: state.rgB, gStar: state.rgGStar };
  // the field follows the landscape's preset while the local selector has not overridden it, so changing the model above re-integrates this
  const landscapeModel = useRef(state.rgModel);
  useEffect(() => {
    if (state.rgModel === landscapeModel.current) return;
    landscapeModel.current = state.rgModel;
    if (RGF_MODELS.some((entry) => entry.id === state.rgModel)) setModel(state.rgModel);
  }, [state.rgModel]);

  const build = async (ctx) => {
    const LABS = window.QGA_LABS;
    if (!LABS) throw new Error("Compute-lab module unavailable");
    const { createRgFlowFieldRuntime } = await LABS.loadRgFlowField();
    ctx.scene.fog = new ctx.THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.014);
    const runtime = createRgFlowFieldRuntime({ model, params, seed: 42, engraved: ctx.engraved });
    ctx.scene.add(runtime.mesh);
    const gravityNote = LABS.GRAVITY_FLOW_3D_NOTE;
    if (gravity) {
      // this mode's box is wider than the one-coupling box, so the labels sit inside the frame rather than above it
      ctx.label(gravityNote.status, () => ({ x: -3.1, y: 4.0, z: 2.2 }), "s3d-strong");
      ctx.label("UV ↑  t = ln k  ↓ IR", () => ({ x: -3.1, y: 3.4, z: 2.2 }), "s3d-strong");
      ctx.label(gravityNote.limit, () => ({ x: 1.2, y: -2.7, z: 1.2 }), "s3d-quiet");
    } else {
      ctx.label("EFFECTIVE · g-runs via the shared beta function; r-direction γ(g)=g²/(1+g²) is a disclosed teaching model",
        () => ({ x: -4.6, y: 5.2, z: 0 }), "s3d-strong");
      ctx.label("UV ↑  t = ln μ  ↓ IR", () => ({ x: 0, y: 5.6, z: 0 }), "s3d-strong");
      ctx.label("streamlines stop at the validity wall g = √(4π)", () => ({ x: 5.6, y: -1.8, z: 0 }), "s3d-quiet");
    }
    return {
      update: (t) => {
        runtime.sync({ time: t, motion: ctx.motion() === 0 ? 0 : 1 });
        window.__qgaRgFlow3d = { kind: runtime.kind, ...runtime.stats() };
      },
      prepare: (renderer) => runtime.prepare(renderer),
      compute: (renderer, dt) => runtime.compute(renderer, dt),
      dispose: () => {
        runtime.dispose();
        delete window.__qgaRgFlow3d;
      },
      recoverable: () => false,
    };
  };

  return (
    <div className="viz-frame rgf-lab">
      <div className="viz-toolbar ug-bar" role="group" aria-label="Model of the three-dimensional flow field">
        {RGF_MODELS.map((entry) => (
          <button key={entry.id} type="button" className={"btn ug-btn" + (model === entry.id ? " on" : "")}
            aria-pressed={model === entry.id} onClick={() => setModel(entry.id)}>{entry.label}</button>
        ))}
      </div>
      <Scene3D animated="motion" nodeKit height={460} aria={gravity
        ? "Three-dimensional flow of the Einstein–Hilbert truncation: the Newton coupling and the cosmological constant in the horizontal plane, log energy scale vertically, with streamlines into the non-Gaussian fixed point and a plane where the truncation is singular"
        : "Three-dimensional renormalization-group flow field: streamlines in the coupling-mass plane running vertically in log energy scale, with fixed points, gold separatrices and validity walls"}
      initial={{ radius: gravity ? 17 : 13.5, theta: 0.7, phi: 1.15, minR: 5, maxR: 34, bloom: { strength: 0.55, radius: 0.45, threshold: 0.22 } }}
      build={build} deps={[model, state.rgNf, state.rgA, state.rgB, state.rgGStar]}
      fallback={<div className="lab-fallback">The 3-D flow field needs WebGL; the 2-D landscape above carries the same trajectories.</div>}></Scene3D>
      {gravity ? (
        <VizCaption provenanceId="rg-flow-field-3d-gravity" status="conjectural">
          The same Einstein–Hilbert flow as the silk above, now in three dimensions: the horizontal axes are the dimensionless Newton
          coupling <Eq tex="g"></Eq> and the cosmological constant <Eq tex="\lambda"></Eq> (so the mass-like coupling r of the teaching model is
          replaced, not added), and vertical position is the shared log scale <Eq tex="t=\ln k"></Eq>. Streamlines integrate the same beta
          functions as the silk and the figure below; the blue plane is <Eq tex="\lambda=\tfrac12"></Eq>, where the optimised-cutoff truncation is
          singular, and every streamline that reaches it stops there instead of being drawn past it. This is a truncation of an infinite
          tower: its fixed point and exponents move with the cutoff and the gauge, so the picture is conjectural, not a result about nature.
        </VizCaption>
      ) : (
        <VizCaption provenanceId="rg-flow-field-3d" status="effective">
          The same beta function that drives the 2-D landscape now flows in a third dimension: vertical position
          is the shared log scale t = ln μ (UV up, IR down), horizontal axes are the gauge coupling g and a
          mass-like coupling r with β_r = (2 − γ(g))·r. Cyan runs integrate toward the UV, amber toward the IR,
          gold curves are the separatrices through the fixed points (same analytic fixed points as the landscape),
          and the red walls mark g = √(4π) (α = 1), where the perturbative model stops and every streamline
          visibly terminates — no segment past the wall is drawn as if it were trustworthy. The anomalous
          dimension γ(g) = g²/(1+g²) is a transparent teaching model, not a computed exponent; the g-direction
          running is exactly the shared model selected above.
        </VizCaption>
      )}
    </div>
  );
}

window.RgFlowFieldLab = RgFlowFieldLab;

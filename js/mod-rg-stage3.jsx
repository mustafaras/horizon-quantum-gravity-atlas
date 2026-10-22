// Stage 3 composition for the RG flow landscape.
/* ---------- Prompt 07: three-dimensional RG flow field ---------- */
function RgFlowFieldLab() {
  const [state] = useQGAState();
  const params = {
    nf: state.rgNf, a: state.rgA, b: state.rgB, gStar: state.rgGStar,
  };

  const build = async (ctx) => {
    const LABS = window.QGA_LABS;
    if (!LABS) throw new Error("Compute-lab module unavailable");
    const { createRgFlowFieldRuntime } = await LABS.loadRgFlowField();
    ctx.scene.fog = new ctx.THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.014);
    const runtime = createRgFlowFieldRuntime({ model: state.rgModel, params, seed: 42 });
    ctx.scene.add(runtime.mesh);
    ctx.label("EFFECTIVE · g-runs via the shared beta function; r-direction γ(g)=g²/(1+g²) is a disclosed teaching model",
    () => ({ x: -4.6, y: 5.2, z: 0 }), "s3d-strong");
    ctx.label("UV ↑  t = ln μ  ↓ IR", () => ({ x: 0, y: 5.6, z: 0 }), "s3d-strong");
    ctx.label("streamlines stop at the validity wall g = √(4π)",
    () => ({ x: 5.6, y: -1.8, z: 0 }), "s3d-quiet");
    return {
      update: (t) => {
        runtime.sync({ time: t, motion: ctx.motion() === 0 ? 0 : 1 });
        window.__qgaRgFlow3d = { kind: runtime.kind, ...runtime.stats() };
      },
      dispose: () => {
        runtime.dispose();
        delete window.__qgaRgFlow3d;
      },
      recoverable: () => false,
    };
  };

  return (
    <div className="viz-frame">
      <Scene3D animated="motion" height={460} aria="Three-dimensional renormalization-group flow field: streamlines in the coupling-mass plane running vertically in log energy scale, with fixed points, gold separatrices and validity walls"
      initial={{ radius: 13.5, theta: 0.7, phi: 1.15, minR: 5, maxR: 34, bloom: { strength: 0.55, radius: 0.45, threshold: 0.22 } }}
      build={build} deps={[state.rgModel, state.rgNf, state.rgA, state.rgB, state.rgGStar]}
      fallback={<div className="lab-fallback">The 3-D flow field needs WebGL; the 2-D landscape above carries the same trajectories.</div>}></Scene3D>
      <VizCaption status="effective">
        The same beta function that drives the 2-D landscape now flows in a third dimension: vertical position
        is the shared log scale t = ln μ (UV up, IR down), horizontal axes are the gauge coupling g and a
        mass-like coupling r with β_r = (2 − γ(g))·r. Cyan runs integrate toward the UV, amber toward the IR,
        gold curves are the separatrices through the fixed points (same analytic fixed points as the landscape),
        and the red walls mark g = √(4π) (α = 1), where the perturbative model stops and every streamline
        visibly terminates — no segment past the wall is drawn as if it were trustworthy. The anomalous
        dimension γ(g) = g²/(1+g²) is a transparent teaching model, not a computed exponent; the g-direction
        running is exactly the shared model selected above.
      </VizCaption>
    </div>);

}

function ModuleRGStage3({ go }) {
  return (
    <article>
      <ModuleHeader num="03" kicker="Scale & symmetry" title="Gauge Theory and Renormalization"
        lede="Local symmetry organizes interactions; renormalization-group flow makes their scale dependence quantitative. This module separates perturbative QED and QCD results from numerical presentation, pedagogical fixed-point toys, and conjectural quantum-gravity ideas."></ModuleHeader>

      <Section title="Local gauge invariance">
        <p>
          A global symmetry rotates a field by the same amount everywhere. Promoting it to a <em>local</em> symmetry —
          an independent rotation at every spacetime point — breaks derivative terms unless a compensating gauge field
          is introduced. Electromagnetism, the weak force, and the strong force all arise from this principle.
        </p>
        <p>
          In non-Abelian theories, gauge bosons carry the charge they mediate. Gluon self-interaction contributes
          anti-screening in QCD, enabling asymptotic freedom when the one-loop coefficient b<sub>0</sub> is positive.
        </p>
      </Section>

      <Section title="Renormalisation-group flow landscape">
        <p>
          Select a documented flow, vary its inputs, and compare the running coupling with the beta function that
          generates it. The scale graph and phase line share one coupling axis, so ultraviolet and infrared stability
          can be read directly rather than inferred from visual motion.
        </p>
        <RGFlowLandscape></RGFlowLandscape>
      </Section>

      <Section title="The flow field in three dimensions">
        <p>
          A beta function is a vector field, so the landscape's curves are really projections of a flow in
          <em>theory space</em>. This lab renders that flow in three dimensions: the coupling g and a mass-like
          coupling r span the horizontal plane, and the vertical axis is the log energy scale t = ln μ that the
          shared numerics already use. Streamlines are integrated with the same RK4 stepper as every other RG
          computation on the site, seeded deterministically, and they stop — visibly — at the perturbative
          validity wall. Change the model or its parameters above and the whole field re-integrates.
        </p>
        <RgFlowFieldLab></RgFlowFieldLab>
      </Section>

      <Section title="Mathematical formulation">
        <div className="formula-grid">
          <FormulaCard title="Covariant derivative" status="established"
            tex="D_\mu = \partial_\mu - i g\, A_\mu^a T^a"
            symbols={[
              { s: "A_\\mu^a", d: "Gauge field components, one per group generator." },
              { s: "T^a", d: "Generators acting in the matter field representation." },
              { s: "g", d: "Gauge coupling for the selected group factor." },
            ]}
            meaning="Replacing the ordinary derivative by a covariant derivative restores local gauge covariance and fixes the form of matter–gauge interactions."
            limits="Shown for one group factor; quantization also requires gauge fixing and ghost structure."></FormulaCard>
          <FormulaCard title="QCD beta function · one loop" status="effective"
            tex="\beta(g_s)=-\frac{b_0}{16\pi^2}g_s^3+\mathcal{O}(g_s^5),\qquad b_0=11-\frac{2}{3}n_f"
            symbols={[
              { s: "\\mu", d: "Renormalization scale; t = ln μ increases toward the ultraviolet." },
              { s: "n_f", d: "Number of active quark flavours in the one-loop SU(3) coefficient." },
            ]}
            meaning="For n_f < 16.5, b₀ is positive and the QCD coupling decreases toward high scales."
            limits="Thresholds and higher loops are omitted. The one-loop curve is not valid in the infrared strong-coupling regime."></FormulaCard>
          <FormulaCard title="QED convention · one loop" status="effective"
            tex="\beta(e)=\frac{n_f e^3}{12\pi^2},\qquad \alpha=\frac{e^2}{4\pi}"
            symbols={[
              { s: "n_f", d: "Active unit-charge Dirac fermions in the simplified displayed convention." },
              { s: "\\alpha", d: "Dimensionless coupling associated with the displayed gauge coupling e." },
            ]}
            meaning="Vacuum polarization screens electric charge, so the one-loop QED coupling grows toward the ultraviolet."
            limits="Unequal charges and thresholds are omitted. The formal Landau pole is an extrapolation, not an observation."></FormulaCard>
          <FormulaCard title="Fixed-point linearization" status="effective"
            tex="\beta(g_*)=0,\qquad \beta(g)\simeq\beta'(g_*)(g-g_*)"
            symbols={[
              { s: "\\beta'(g_*)<0", d: "UV-attractive for t = ln μ increasing toward the ultraviolet." },
              { s: "\\beta'(g_*)>0", d: "IR-attractive because trajectories approach the point as t decreases." },
            ]}
            meaning="The local slope classifies attraction in a one-coupling flow. A vanishing slope is marginal at linear order."
            limits="Multi-coupling theories require the eigenvalues of a stability matrix, not a single derivative."></FormulaCard>
        </div>
      </Section>

      <Section title="Why this matters for gravity">
        <p>
          Standard Model gauge couplings are dimensionless. Newton's constant instead has mass dimension −2 in four
          dimensions, so the associated dimensionless strength grows approximately as <Eq tex="G E^2"></Eq>. A
          non-Gaussian ultraviolet fixed point is the central conjecture of asymptotic safety, but the polynomial
          preset above only illustrates the required phase-line geometry; it supplies no evidence that gravity
          realizes that flow.
        </p>
      </Section>

      <Misconception title="Couplings do not change with ordinary time.">
        A running coupling varies with the energy scale of a measurement. Probing the same vacuum at shorter distances
        resolves quantum fluctuations differently; the horizontal axis is resolution scale μ, not cosmic evolution.
      </Misconception>
      <ConceptBridge id="rg-gr" go={go}></ConceptBridge>
    </article>
  );
}

window.ModuleRG = ModuleRGStage3;

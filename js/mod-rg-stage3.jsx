// Stage 3 composition for the RG flow landscape.
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

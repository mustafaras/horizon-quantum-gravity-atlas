// mod-planck.jsx — Module 05: Why Quantum Gravity Is Difficult
function ModulePlanck({ go }) {
  return (
    <article>
      <ModuleHeader num="05" kicker="The obstruction" title="Why Quantum Gravity Is Difficult"
        lede="Quantum field theory assumes a fixed spacetime stage; general relativity makes the stage itself dynamical. Reconciling the two is not a matter of missing cleverness alone — concrete technical obstructions appear the moment one tries, and they point to the Planck scale."
        target="#planck-constraint-plane"></ModuleHeader>

      <Section title="The structural conflict">
        <p>
          Every quantum field theory in Modules 01–03 is formulated <em>on</em> a spacetime: fields are functions of
          spacetime points, causality is defined by its light cones, and time evolution is generated relative to its
          clock. General relativity removes that scaffolding — the metric is a dynamical field like any other. A
          quantum theory of gravity must therefore quantize the very structure that quantum theory normally
          presupposes. Two famous symptoms of this circularity: <strong>background independence</strong> (what do we
          expand around, if geometry itself fluctuates?) and the <strong>problem of time</strong> (the canonical
          Hamiltonian becomes a constraint, ĤΨ = 0, with no external time parameter left to evolve in).
        </p>
      </Section>

      <Section title="Non-renormalizability">
        <p>
          The technical obstruction is sharper. Newton's constant has mass dimension −2, so the dimensionless strength
          of gravity at energy E grows as <Eq tex="G E^2 / (\hbar c^5)"></Eq>. Loop corrections in perturbative quantum
          gravity therefore produce divergences of ever-increasing severity: 't Hooft and Veltman exhibited the
          one-loop divergences of gravity with matter (1974), and Goroff and Sagnotti proved pure gravity diverges at
          two loops (1986). Absorbing them requires infinitely many independent counterterms — infinitely many
          measurements to fix the theory. Predictivity collapses precisely at the Planck scale, where the expansion
          parameter reaches unity.
        </p>
        <div className="formula-grid">
          <FormulaCard title="Planck units" status="established" formulaId="planck-length"
            texAfter="\approx 1.6\times10^{-35}\,\mathrm{m}, \quad E_P = \sqrt{\frac{\hbar c^5}{G}} \approx 1.22\times10^{19}\,\mathrm{GeV}"
            symbols={[
              { s: "l_P", d: "Planck length — the unique length built from ħ, G, c. Also: the Schwarzschild radius of a Planck-mass black hole, up to O(1) factors." },
              { s: "E_P", d: "Planck energy ($\\approx 2$ GJ — a lightning bolt's energy in a single quantum). Planck mass $m_P\\approx2.18\\times10^{-8}$ kg." },
            ]}
            meaning="Dimensional analysis alone locates the quantum gravity regime: where the Compton wavelength of an object equals its Schwarzschild radius."
            limits="These are scales, not measured thresholds. What actually happens there is unknown."></FormulaCard>
          <FormulaCard title="Perturbative expansion of the metric" status="effective"
            tex="g_{\mu\nu} = \eta_{\mu\nu} + \kappa\, h_{\mu\nu}, \qquad \kappa^2 = 32\pi G"
            symbols={[
              { s: "\\eta_{\\mu\\nu}", d: "Fixed flat background metric — the move that surrenders background independence." },
              { s: "h_{\\mu\\nu}", d: "Graviton field: quantized weak-field ripples, spin 2." },
              { s: "\\kappa", d: "Gravitational coupling; dimensionful, with $[\\kappa]=\\mathrm{energy}^{-1}$ — the origin of non-renormalizability." },
            ]}
            meaning="The standard route to 'quantum gravity as a QFT'. It works beautifully — but only as an effective theory at energies far below $E_P$."
            limits="The expansion is in $\kappa E\sim E/E_P$; at Planckian energies every order contributes equally and the series tells you nothing."></FormulaCard>
          <FormulaCard title="Growth of the effective coupling" status="established"
            tex="\alpha_{\mathrm{grav}}(E) \sim \frac{G E^2}{\hbar c^5} = \left(\frac{E}{E_P}\right)^{2}"
            symbols={[
              { s: "\\alpha_{\\mathrm{grav}}", d: "Dimensionless measure of gravity's strength at energy E (compare $\\alpha\\approx1/137$ for electromagnetism)." },
              { s: "E/E_P", d: "At LHC energies this is $\\sim10^{-15}$, making quantum gravity effects experimentally invisible — and the theory's UV behavior untestable directly." },
            ]}
            meaning="Contrast with the gauge couplings of Module 03, which run logarithmically. Gravity's strength grows as a power law — the renormalization group flow leaves the perturbative domain."
            limits="Schematic scaling argument; the asymptotic safety program (Module 06) conjectures the full nonperturbative flow may nonetheless reach a fixed point."></FormulaCard>
        </div>
      </Section>

      <Section title="Descent to the Planck scale">
        <p>
          Drag the slider to descend from human scale to the Planck length. The grid represents the operational
          notion of smooth classical geometry; near the Planck scale, combining the uncertainty principle with
          gravity suggests metric fluctuations of order unity — the regime where every approach in Module 06 must
          say something new.
        </p>
        <ScaleLadder></ScaleLadder>
      </Section>

      <Section title="The map of the unseen">
        <ConstraintPlane go={go}></ConstraintPlane>
      </Section>

      <Section title="Spin networks and spin foam, computed">
        <p>
          Loop quantum gravity proposes that area and volume come in discrete quanta carried by a graph: edges
          labelled by spins, nodes by intertwiners. This lab builds a real one — a Schlegel-projected four-simplex
          with admissible spin labels drawn from the shared seed — and renders it in three dimensions: edge tubes
          colored by the area they carry, node spheres sized by a schematic volume proxy, and a foam mode that ghosts the
          deterministic step history along an evolution axis. Every number on screen (area spectrum, total area,
          node volumes) is computed by <code>js/science/spin-networks.mjs</code>; the foam dynamics are a disclosed
          pedagogical sketch, not a computed path integral.
        </p>
        <SpinFoamLab></SpinFoamLab>
      </Section>

      <Misconception title="Spacetime discreteness is not established.">
        The fluctuating grid above is a visualization aid, not an observation. Whether spacetime at the Planck
        scale is discrete, foamy, stringy, emergent, or smooth-but-quantum is precisely what the competing
        research programs disagree about. No experiment currently distinguishes them.
      </Misconception>
      <Misconception title="Gravity has been quantized — at low energies.">
        The statement 'quantum gravity does not exist' is too strong. As an effective field theory, graviton
        loops give finite, unambiguous corrections at accessible energies (Module 06). What is missing is the
        ultraviolet completion: the theory valid at and beyond the Planck scale.
      </Misconception>
      <ConceptBridge id="planck-approaches" go={go}></ConceptBridge>
    </article>
  );
}

window.ModulePlanck = ModulePlanck;

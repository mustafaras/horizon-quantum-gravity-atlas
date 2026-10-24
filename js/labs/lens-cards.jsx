// lens-cards.jsx — formula cards whose terms drive a scene (Formula Lens, S10).
// The cards stay beside the scene they link to; their equation comes from Formula Core (js/formula/library).

function NewtonianLimitCard() {
  return (
    <FormulaCard title="Newtonian limit · weak-field potential" status="established" formulaId="newtonian-potential"
      symbols={[
        { s: "\\Phi/c^{2}", d: "Dimensionless Newtonian potential of the source. In weak gravity clocks run slow by the factor 1 + Φ/c², and the metric component is g₀₀ ≈ −(1 + 2Φ/c²)." },
        { s: "M", d: "Mass of the source." },
        { s: "r", d: "Distance from the source." },
      ]}
      meaning="Far from a compact mass, and for speeds well below c, general relativity reduces to Newtonian gravity. Focus the term (or tap it to pin) to paint the potential over the well above: the colour is the potential itself, evaluated on the GPU from this very formula."
      limits="Valid for r ≫ GM/c² and slow motion; near a compact mass the full Schwarzschild geometry replaces it. The well's scale here is schematic: G = c = 1, lengths in scene units, and the height of the surface is a softened picture of the same potential."></FormulaCard>
  );
}

window.NewtonianLimitCard = NewtonianLimitCard;

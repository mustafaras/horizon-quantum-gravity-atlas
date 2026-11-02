# Mathematical Formulations

> Moved from the README in S35. The equations the app renders live in Formula Core (`js/formula/`); this page is the
> prose around them. Back to the [README](../../README.md) · [guide index](../guide/README.md).

This section summarizes the key scientific equations carried by the app.

The goal is not to derive a full textbook.

The goal is to show the mathematical spine that connects the modules.

## 1. Standard Model Gauge Structure

The Standard Model is organized by a gauge group:

```math
SU(3)_C \times SU(2)_L \times U(1)_Y
```

The three factors correspond to color, weak isospin, and hypercharge.

Electric charge emerges after electroweak symmetry breaking:

```math
Q = T_3 + \frac{Y}{2}
```

The covariant derivative packages the gauge interactions:

```math
D_\mu = \partial_\mu
       + i g_s G_\mu^a T^a
       + i g W_\mu^i \tau^i
       + i g' Y B_\mu
```

The Higgs potential is:

```math
V(\Phi) = \mu^2 \Phi^\dagger \Phi + \lambda(\Phi^\dagger \Phi)^2
```

For $\mu^2 < 0$, the field acquires a nonzero vacuum expectation value:

```math
v = \sqrt{-\mu^2/\lambda} \approx 246\,\mathrm{GeV}
```

This gives masses to the $W^\pm$ and $Z^0$ bosons and to fermions through Yukawa couplings.

**Limit:** the minimal Standard Model does not include gravity.

**Limit:** neutrino masses require additional structure.

**Limit:** the hierarchy problem remains unresolved.

## 2. Quantum Field Theory and the Path Integral

Quantum field theory treats particles as excitations of fields.

A transition amplitude can be formally expressed as:

```math
\mathcal{A}_{i\to f}
= \int \mathcal{D}\phi \,
e^{iS[\phi]/\hbar}
```

The action for a real scalar field is:

```math
S = \int d^4x \,
\left[
\frac{1}{2}\partial_\mu\phi\,\partial^\mu\phi
- \frac{1}{2}m^2\phi^2
- V(\phi)
\right]
```

The Klein-Gordon equation is:

```math
(\Box + m^2)\phi = 0
```

Its dispersion relation is:

```math
\omega^2 = c^2 k^2 + \frac{m^2 c^4}{\hbar^2}
```

The mass gap appears as a nonzero frequency at zero spatial wavenumber.

The Feynman propagator for a scalar field is:

```math
\Delta_F(p) = \frac{i}{p^2 - m^2 + i\epsilon}
```

For $2\to2$ scattering, the Mandelstam invariants are:

```math
s = (p_1+p_2)^2
```

```math
t = (p_1-p_3)^2
```

```math
u = (p_1-p_4)^2
```

For the example process $e^+e^- \to \mu^+\mu^-$, the leading high-energy scaling is:

```math
\sigma(e^+e^- \to \mu^+\mu^-)
\sim
\frac{4\pi\alpha^2}{3s}
```

Near the $Z^0$ pole, a Breit-Wigner resonance modifies the cross-section:

```math
\sigma(s) \propto
\frac{\Gamma_{\mathrm{in}}\Gamma_{\mathrm{out}}}
{(s-M_Z^2)^2 + M_Z^2\Gamma_Z^2}
```

The Mandelstam identity is exact for any $2\to2$ process:

```math
s + t + u = \sum_i m_i^2
```

Compton scattering follows the Klein-Nishina differential cross-section:

```math
\frac{d\sigma}{d\Omega}
= \frac{\alpha^2}{2m_e^2}
\left(\frac{E'}{E}\right)^{2}
\left[
\frac{E'}{E} + \frac{E}{E'} - \sin^2\theta
\right]
```

The **Amplitude Room** in the app evaluates these relations live. It reports $s$, $t$, $u$, the residual of the Mandelstam identity, $\sigma = 4\pi\alpha^2/3s$, the Breit-Wigner value, and the normalised angular shape for the selected process. The residual is displayed as floating-point noise rather than being hidden, so the identity can be checked on screen.

**Limit:** Feynman diagrams are terms in a perturbative expansion.

**Limit:** virtual particles are calculational structures, not directly observed objects.

**Limit:** the path integral measure is formal except in special rigorously defined cases.

**Limit:** the electroweak scan of $e^+e^-\to\mu^+\mu^-$ is tree level with a fixed $\alpha$ and a constant $Z$ width: no initial-state radiation (which lowers and broadens the peak at LEP) and no loop corrections. The LEP points are $Z$-pole pseudo-observables and are compared with the line only at the pole.

**Limit:** the scattering-plane and spacetime canvases are schematic animations, not solutions of the QED amplitude.

## 3. Gauge Symmetry and Renormalization

Gauge invariance promotes global symmetry to local symmetry.

The Yang-Mills field strength is:

```math
F_{\mu\nu}^a =
\partial_\mu A_\nu^a
- \partial_\nu A_\mu^a
+ g f^{abc} A_\mu^b A_\nu^c
```

The non-Abelian term produces gauge-boson self-interactions.

At one loop, a generic coupling runs as:

```math
\mu\frac{dg}{d\mu}
= \beta(g)
= -\frac{b_0}{16\pi^2}g^3 + \mathcal{O}(g^5)
```

For QCD with sufficiently few flavors, $b_0>0$, and the coupling weakens at high energy.

This is asymptotic freedom.

For SU(3) with $n_f$ active quark flavours, the implemented one-loop coefficient and solution are:

```math
b_0 = 11-\frac{2}{3}n_f,
\qquad
\frac{1}{g_s^2(\mu)}
=
\frac{1}{g_s^2(\mu_0)}
+\frac{b_0}{8\pi^2}\ln\frac{\mu}{\mu_0}
```

The QED preset uses a deliberately documented unit-charge Dirac-fermion convention:

```math
\beta(e)=\frac{n_f e^3}{12\pi^2},
\qquad
\alpha=\frac{e^2}{4\pi},
\qquad
\frac{1}{e^2(\mu)}
=
\frac{1}{e^2(\mu_0)}
-\frac{n_f}{6\pi^2}\ln\frac{\mu}{\mu_0}
```

The resulting one-loop QED Landau pole is displayed only as a formal extrapolation. It is not an observation, and the instrument stops its numerical trajectory at the conservative display boundary $\alpha=1$ before the pole.

A fixed point satisfies:

```math
\beta(g_*)=0
```

and the one-coupling linearization is:

```math
\beta(g)\simeq \beta'(g_*)(g-g_*)
```

With $t=\ln\mu$ increasing toward the ultraviolet, $\beta'(g_*)<0$ is UV-attractive and $\beta'(g_*)>0$ is IR-attractive. A zero derivative is marginal at linear order.

The live trajectory is integrated in both directions from $\mu_0$ by deterministic fixed-step fourth-order Runge-Kutta with $\Delta\ln\mu=0.02$. Non-finite stages, iteration limits, and the coupling boundary terminate explicitly. Analytic roots are cross-checked by a bounded bisection scan at tolerance $10^{-9}$.

The Gaussian, UV-attractive, and IR-attractive presets are pedagogical one-coupling systems, and the polynomial preset

```math
\beta(g)=a g-b g^3
```

is labelled a pedagogical toy whose interacting UV fixed point is built into the chosen coefficients. The asymptotic-safety lab below the landscape does not take a fixed point on trust: it integrates the Einstein–Hilbert beta functions of the dimensionless Newton coupling and cosmological constant with two published cutoffs, finds the Gaussian and the non-Gaussian fixed point by Newton iteration, and prints the critical exponents the equations give.

Gravity differs because Newton's constant has mass dimension $-2$ in four dimensions:

```math
[G_N] = -2
```

The dimensionless strength grows with energy:

```math
\alpha_{\mathrm{grav}}(E)
\sim
\frac{G_N E^2}{\hbar c^5}
=
\left(\frac{E}{E_P}\right)^2
```

This scaling is one of the simplest ways to see why the Planck scale is special.

## 4. General Relativity

The causal laboratory uses flat 1+1D Minkowski spacetime as the local foundation for GR, with signature $(−,+,+,+)$:

```math
\Delta s^2 = -c^2\Delta t^2 + \Delta x^2
```

In diagram units, $c = 1$ light-second per second, so the vertical coordinate is $\Delta ct$ and the Lorentz boost is:

```math
\gamma = \frac{1}{\sqrt{1-\beta^2}},
\qquad
\Delta ct' = \gamma(\Delta ct-\beta\Delta x),
\qquad
\Delta x' = \gamma(\Delta x-\beta\Delta ct)
```

For a timelike pair:

```math
\Delta\tau = \frac{\sqrt{-\Delta s^2}}{c}
```

These relations do not simulate curvature or gravity; they expose the invariant local causal structure inherited by general relativity.

Einstein's field equations are:

```math
G_{\mu\nu} + \Lambda g_{\mu\nu}
=
\frac{8\pi G}{c^4}T_{\mu\nu}
```

where:

```math
G_{\mu\nu}
=
R_{\mu\nu}
- \frac{1}{2}R g_{\mu\nu}
```

The geodesic equation is:

```math
\frac{d^2x^\mu}{d\tau^2}
+ \Gamma^\mu_{\alpha\beta}
\frac{dx^\alpha}{d\tau}
\frac{dx^\beta}{d\tau}
= 0
```

The Einstein-Hilbert action is:

```math
S_{\mathrm{EH}}
=
\frac{c^3}{16\pi G}
\int d^4x \sqrt{-g}\,(R - 2\Lambda)
+ S_{\mathrm{matter}}
```

General relativity has passed precision tests for more than a century.

Examples include perihelion precession, light bending, gravitational redshift, binary pulsars, gravitational waves, and black-hole shadow observations.

**Limit:** the theory is classical.

**Limit:** singularity theorems indicate its own domain of failure.

**Limit:** quantization of the metric is not achieved by simply applying the ordinary perturbative recipe at arbitrarily high energy.

## 5. Planck Units

The Planck length is:

```math
\ell_P =
\sqrt{\frac{\hbar G}{c^3}}
\approx
1.616\times10^{-35}\,\mathrm{m}
```

The Planck time is:

```math
t_P =
\sqrt{\frac{\hbar G}{c^5}}
\approx
5.39\times10^{-44}\,\mathrm{s}
```

The Planck mass is:

```math
m_P =
\sqrt{\frac{\hbar c}{G}}
\approx
2.18\times10^{-8}\,\mathrm{kg}
```

The Planck energy is:

```math
E_P =
\sqrt{\frac{\hbar c^5}{G}}
\approx
1.22\times10^{19}\,\mathrm{GeV}
```

The heuristic obstruction is:

```math
\lambda_C \sim r_s
```

where the Compton wavelength is:

```math
\lambda_C = \frac{\hbar}{mc}
```

and the Schwarzschild radius is:

```math
r_s = \frac{2Gm}{c^2}
```

Equating them gives a scale of order the Planck length.

**Important:** the Planck scale is not an experimentally measured threshold.

It is the natural scale built from $\hbar$, $G$, and $c$.

## 6. Perturbative Quantum Gravity

The metric can be expanded around a background:

```math
g_{\mu\nu} =
\eta_{\mu\nu}
+ \kappa h_{\mu\nu}
```

with:

```math
\kappa^2 = 32\pi G
```

This gives a graviton field $h_{\mu\nu}$ at low energy.

The effective action contains an infinite tower of higher-curvature terms:

```math
S_{\mathrm{EFT}}
=
\int d^4x \sqrt{-g}
\left[
\frac{R}{16\pi G}
+ c_1 R^2
+ c_2 R_{\mu\nu}R^{\mu\nu}
+ c_3 R_{\mu\nu\rho\sigma}R^{\mu\nu\rho\sigma}
+ \cdots
\right]
```

At energies $E \ll E_P$, only the first few terms matter.

At Planckian energies, infinitely many terms become relevant.

**Interpretation:** quantum gravity as an EFT is reliable below the cutoff.

**Problem:** the EFT does not tell us the ultraviolet completion.

## 7. Black-Hole Thermodynamics

The Schwarzschild radius is:

```math
r_s = \frac{2GM}{c^2}
```

The horizon area is:

```math
A = 4\pi r_s^2
```

The Bekenstein-Hawking entropy is:

```math
S_{BH}
=
\frac{k_B c^3 A}{4G\hbar}
=
k_B \frac{A}{4\ell_P^2}
```

This is the most famous area law in gravitational physics.

Entropy scales with area rather than volume.

The Hawking temperature of a Schwarzschild black hole is:

```math
T_H =
\frac{\hbar c^3}{8\pi G M k_B}
```

The evaporation time scales as:

```math
t_{\mathrm{evap}}
\propto
M^3
```

For Kerr black holes, the outer horizon radius is:

```math
r_+ =
\frac{GM}{c^2}
\left[
1 + \sqrt{1-a_\star^2}
\right]
```

in units where the dimensionless spin parameter is $a_\star$.

The surface gravity decreases as the extremal spin limit is approached.

The Hawking temperature tends toward zero in the extremal limit.

**Limit:** astrophysical Hawking radiation has not been directly observed.

**Limit:** the microscopic origin of entropy is not fully known for generic black holes.

**Limit:** the information paradox remains open in operational detail.

**Limit:** the Kerr Observatory image is a numerical ray trace — Carter's null-geodesic equations integrated per pixel in the full Kerr metric, so frame dragging, the spin-dependent shadow and higher-order images are computed, not painted. It remains a *model*: the disk is razor-thin and equatorial, its peak temperature is display-scaled (5000 K), the turbulent disk texture is a heuristic unit-mean emissivity pattern rather than an MHD solution, and the transmittance and synthetic star catalogue are display parameters. The volumetric corona and the bipolar jets are likewise **heuristic**: the flaring-slab geometry, the collimation law, the spine/sheath Lorentz factors, the knot spectrum and the synchrotron display colour are parameterised, while the Blandford–Znajek spin factor, the relativistic Doppler factor and the `g⁴` beaming are exact given those parameters (no jet is drawn at zero spin). Rays that exhaust the step budget are drawn as shadow (never as an enhanced ring), and the exterior-only tracer never crosses the horizon. The map and live formulation panel print exact Kerr coordinate radii from the validated science core. The ultra-quality capture panel renders 2K/4K/8K stills with the ultra ray budget and embeds a `horizon-qga-capture/v1` metadata sidecar (state, provenance, backend, sample count, seed, commit) in the PNG.

## 8. Page Curve and Information

If evaporation is unitary, the entanglement entropy of Hawking radiation should rise and then fall.

That qualitative behavior is called the Page curve.

The Page time is the time at which the radiation entropy reaches its maximum.

Naive semiclassical Hawking radiation gives an ever-rising thermal entropy.

Modern replica-wormhole calculations reproduce a unitary Page curve in model settings.

But the mechanism by which information is encoded in outgoing radiation remains a deep question.

## 9. Holographic Entanglement

In AdS/CFT, the Ryu-Takayanagi formula relates boundary entanglement entropy to bulk geometry:

```math
S(A)
=
\frac{\mathrm{Area}(\gamma_A)}{4G_N\hbar}
```

where $\gamma_A$ is an extremal surface in the bulk anchored to the boundary region $A$.

This formula links quantum information to spacetime geometry.

**Limit:** AdS/CFT is precise in special settings.

**Limit:** our universe is not known to be asymptotically anti-de Sitter.

**Limit:** holography is not a claim that reality is an optical projection.

## 10. Gravitational Waves

The leading quadrupole power radiated by a source is:

```math
P =
\frac{G}{5c^5}
\left\langle
\dddot{Q}_{ij}\dddot{Q}_{ij}
\right\rangle
```

For compact binary inspirals, orbital energy is carried away by gravitational waves.

The orbital frequency increases.

The separation decreases.

The waveform chirps upward.

LIGO's detection of GW150914 confirmed gravitational waves from binary black-hole merger.

This is a triumph of general relativity.

It is not a direct detection of quantum gravity.

**Limit:** the Signal Analysis Theatre's generated waveform is a leading-order quadrupole teaching model (no spins, no higher post-Newtonian orders, not numerical relativity) with seeded Gaussian noise that is not a measured detector PSD; its spectrogram is a Hann STFT, not a Q-transform, and the GWOSC preview is a downsampled excerpt whose effective rate — not the full 4 kHz product — bounds the displayed frequency range. Its sonification is a frequency-translating rendering (frequencies and perceived duration scale together) with the band centroid mapped to A4 = 440 Hz, rendered from those same preview samples: a pedagogical audio rendering, not a detector-band recording.

## 11. Collider Constraints

The LHC probes energies around the TeV scale.

The Planck scale is about:

```math
E_P \sim 10^{19}\,\mathrm{GeV}
```

The gap is roughly fifteen orders of magnitude in energy.

Collider null results constrain many beyond-Standard-Model scenarios.

They do not directly access the Planck regime.

The atlas therefore presents collider events as indirect constraints, not as quantum-gravity observations.

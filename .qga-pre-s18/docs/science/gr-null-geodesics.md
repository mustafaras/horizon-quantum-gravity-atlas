# Schwarzschild null-geodesic physics core

## Purpose

This document specifies the pure, deterministic science core that backs the
strong-field half of the General Relativity view: null geodesics in the
Schwarzschild exterior, the characteristic radii, the effective potential, the
orbit-averaged radiation-reaction and Lense–Thirring rates, and the per-pixel
lensed-sky render built on top of them.

The core lives in `js/physics.mjs` and is importable in Node with no DOM, React,
Three.js, WebGL, or WebGPU dependency. `js/physics.jsx` mirrors it onto
`window.QGA_PHYSICS` for the zero-bundler browser runtime.
`test/physics-bridge.test.mjs` evaluates the browser mirror in a `node:vm`
context and asserts value-for-value agreement with the ESM module, so the mirror
cannot silently drift.

The Kerr core is specified separately in
[`kerr-rendering.md`](kerr-rendering.md) and
[`kerr-observatory.md`](kerr-observatory.md). This document covers the
**non-rotating** core only.

## Module map

| Symbol | Owns |
| --- | --- |
| `grPhotonSphereRadius(gm, c2)` | $r_{\text{ph}} = 3GM/c^2$ |
| `grIscoRadius(gm, c2)` | $r_{\text{ISCO}} = 6GM/c^2$ |
| `grCriticalImpactParameter(gm, c2)` | $b_{\text{crit}} = 3\sqrt{3}\,GM/c^2$ |
| `grNullStep(p, rs, dt)` | one semi-implicit Euler step of the equatorial null geodesic |
| `grNullDeflection(b, gm, c2, opts)` | total deflection to convergence, unwrapped |
| `grNullTrajectory(b, gm, c2, opts)` | the full path plus the swept polar angle |
| `grEffectivePotential(gm, c2, L, r)` | $V_{\text{eff}}(r)$ including the $r^{-3}$ term |
| `grPetersDerivatives(a, e, k)` | Peters (1964) orbit-averaged $\langle \dot a \rangle$, $\langle \dot e \rangle$ |
| `grLenseThirringDeg(J, c2, a, e)` | orbit-averaged nodal precession, degrees per orbit |
| `GR_CURVATURE_SCENARIOS` | the seven reproducible presets |

Consumers, all in `js/mod-gr.jsx`:

| Component | Uses |
| --- | --- |
| `VEffPanel` | `grEffectivePotential`, `grPhotonSphereRadius`, `grIscoRadius` |
| `NullGeodesicPanel` | `grNullTrajectory`, `grPhotonSphereRadius`, `grCriticalImpactParameter` |
| `LensedSkyPanel` | `grNullDeflection`, `grCriticalImpactParameter` |
| `CurvatureEngine3D` | `grNullStep`, `grPetersDerivatives`, `grLenseThirringDeg` |

## Epistemic separation

Every quantity below is tagged with one of four levels. The tag is a claim about
*what kind of statement it is*, not about how confident the implementation is.

- **Exact** — a closed-form result of general relativity, reproduced to floating-point accuracy.
- **Numerical approximation** — a controlled discretisation of an exact integral or ODE, with a stated error behaviour.
- **Display approximation** — a deliberately simplified formula used only for on-screen readouts, never for physics claims.
- **Conjectural interpretation** — a reading of the output that is not itself a result of the equations.

## Units

The GR view works in **scene units**, not geometric units. Two constants define
the mapping:

| Constant | Value | Meaning |
| --- | --- | --- |
| `GR_C2` | $27.04$ | the scene's $c^2$ |
| `GM` | $0.55 \cdot M$ | gravitational parameter for a body of scene mass $M$ |

> **This is a display choice, not a physical claim.** $c^2 = 27.04$ is picked so
> that a horizon of a few scene units is visible next to orbits of a few scene
> units. It is not $c^2$ in any unit system. Every length below is therefore a
> *scene* length; the ratios between them are exact, the absolute scale is not.

The ratios are what carry the physics, and they are exact:

$$r_s = \frac{2GM}{c^2}, \qquad r_{\text{ph}} = \frac{3GM}{c^2} = \tfrac{3}{2} r_s, \qquad r_{\text{ISCO}} = \frac{6GM}{c^2} = 3 r_s$$

At the default mass $M = 5$: $GM = 2.75$, $r_s = 0.2034$, $r_{\text{ph}} = 0.3051$,
$r_{\text{ISCO}} = 0.6102$, $b_{\text{crit}} = 0.5285$.

## Schwarzschild geometry

### Characteristic radii (exact)

The photon sphere is the radius at which a circular null orbit exists. It is the
maximum of the effective potential for light, and it is unstable — which is why
the capture cross-section is a sharp cone rather than a gradual fade.

The ISCO is the innermost radius at which a *massive* test particle can orbit
stably. It is where the effective potential's inflection point sits, and it is
the boundary below which the $r^{-3}$ term has removed the stable minimum.

### Critical impact parameter (exact)

$$b_{\text{crit}} = 3\sqrt{3}\,\frac{GM}{c^2} = \sqrt{3}\, r_{\text{ph}}$$

A ray with $b < b_{\text{crit}}$ reaches the photon sphere with no radial turning
point and falls through. A ray with $b > b_{\text{crit}}$ turns at
$r_t > r_{\text{ph}}$ and escapes. The split is exact, and
`test/physics.test.mjs` asserts that the closed form and the integrator's own
escape/capture boundary agree at every tested mass.

### Null geodesic equation (exact, solved numerically)

In the equatorial plane, with $\vec{x} = (x, y)$ and affine parameter $\lambda$,
the null geodesic obeys

$$\frac{d^2\vec{x}}{d\lambda^2} = -\frac{3}{2}\, r_s\, L^2\, \frac{\vec{x}}{r^5}, \qquad L = x\,v_y - y\,v_x$$

where $L$ is the conserved angular momentum per unit energy and
$r = |\vec{x}|$. This is the Cartesian form of the Binet equation for light,

$$\frac{d^2u}{d\varphi^2} + u = 3\,\frac{GM}{c^2}\,u^2, \qquad u = \frac{1}{r},$$

rewritten so that a ray tracer can advance $\vec{x}$ and $\vec{v}$ directly
without tracking $\varphi$. It reproduces the full $4GM/c^2b$ weak-field
deflection, the $b_{\text{crit}}$ capture cone, and the multi-turn winding just
outside the critical curve.

`grNullStep` mutates `p = {x, y, vx, vy}` in place and returns it.

## Ray integration

### Stepper (numerical approximation)

`grNullStep` is **semi-implicit (symplectic) Euler**: the velocity is advanced
first, then the position is advanced using the *new* velocity.

```
L  = x·vy − y·vx
k  = −1.5 · rs · L² / r⁵
vx += k·x·dt ;  vy += k·y·dt
x  += vx·dt  ;  y  += vy·dt
```

This is first-order accurate in general, but it is symplectic, so the conserved
$L$ does not drift secularly the way it would under explicit Euler. The
near-horizon regime is stiff — $r^{-5}$ grows fast — which is why the panels
that draw the plunge lower the step to `dt = 0.0005` and raise `maxSteps` to
60000.

### Termination

| Helper | Captured when | Escaped when |
| --- | --- | --- |
| `grNullDeflection` | $r < 1.5\,r_s$ (the photon sphere) | $x > x_0$ or $r > 2x_0$ |
| `grNullTrajectory` | $r < r_{\text{cap}}$ (default $1.5\,r_s$, overridable) | $x > x_0$ or $r > 2x_0$ |

The default stop is the photon sphere because that is where capture is *decided*.
A caller that wants the plunge drawn all the way in lowers `rCap` toward the
horizon — `NullGeodesicPanel` uses `rCap = 1.02 r_s` so a captured ray is drawn
plunging rather than stopping in mid-air at the photon sphere.

### Unwrapped angle accumulation (numerical approximation)

The total deflection is accumulated **step by step**, not taken as the
difference of the first and last velocity angles:

```
da = atan2(vy, vx) − prevA        // wrapped to (−π, π]
sweptA += da
```

The single difference wraps to $[-\pi, \pi]$, which silently truncates the
multi-turn winding a ray just outside $b_{\text{crit}}$ performs — exactly the
regime the photon ring lives in. The accumulated value is identical for
$|\alpha| < \pi$ and correct beyond it. `grNullDeflection` returns
`Math.abs(sweptA)`; `grNullTrajectory` returns `windings = |swept| / 2π`, which
is $\approx 0.5$ for a straight weak-field ray and $> 1$ for a near-critical ray
that loops the photon sphere.

This matters downstream: the lensed-sky renderer maps
$\beta = \theta - \alpha(\theta)$ back onto the sphere, so a deflection folded
into $[-\pi, \pi]$ would fold the sky the wrong way.

### Defaults

| Option | Default | Used by |
| --- | --- | --- |
| `v0` | $4$ | launch speed, $|v|$ |
| `x0` | $7.6$ | launch distance; the ray starts at $(-x_0, b)$ moving along $+x$ |
| `dt` | $0.002$ | step |
| `maxSteps` | $200000$ | step cap |
| `rCap` | $1.5\,r_s$ | capture radius (`grNullTrajectory` only) |

### Measured convergence

`test/physics.test.mjs` pins the shipped step against a ten-times finer one:

| Check | Bound | Test |
| --- | --- | --- |
| Deflection at `dt = 0.002` vs `dt = 0.0001` | $< 0.1°$ | "grNullDeflection is step-converged at the shipped dt" |
| Weak-field deflection vs $4GM/c^2b$ | $< 5\%$ | "grNullDeflection reproduces the weak-field 4GM/c²b limit" |
| Escape/capture split at $0.9\,b_{\text{crit}}$ / $1.1\,b_{\text{crit}}$ | exact | "grNullDeflection splits escape from capture exactly at b_crit" |
| Deflection monotone decreasing in $b$ | strict | "grNullDeflection decreases monotonically with impact parameter" |
| Near-critical sweep exceeds $\pi$ and stays below $4\pi$ | strict | "grNullDeflection reports unwrapped angles past a full half-turn" |
| Path continuity: no sample step exceeds $0.05$ | strict | "grNullTrajectory returns the full path and winds near the critical curve" |

## Effective potential

### Formula (exact)

$$V_{\text{eff}}(r) = -\frac{GM}{r} + \frac{L^2}{2r^2} - \frac{GM\,L^2}{c^2\,r^3}$$

The first two terms are the Newtonian centrifugal barrier. The third is the GR
correction: it is attractive, it grows as $r^{-3}$, and it is what removes the
stable-orbit barrier below the ISCO and creates the photon sphere.

`grEffectivePotential(gm, c2, L, r)` evaluates it directly.

### The Newtonian comparison branch

`VEffPanel` draws a second, dashed curve with the $r^{-3}$ term dropped:

$$V_N(r) = -\frac{GM}{r} + \frac{L^2}{2r^2}$$

This branch has no $r^{-3}$ term, so near the star it sits far above the GR well
and diverges as $r \to 0$. The panel **lets it leave the frame at the top edge**
rather than reserving headroom for it — its divergence is the point of the
comparison — while its minimum stays inside the frame so the two wells can still
be compared. Reserving room for the divergence was a real defect: it pushed the
GR well into the bottom half of the plot.

### Turning points (numerical approximation)

The panel's perihelion and aphelion markers are found by **root-finding**
$V_{\text{eff}}(r) = E$, not from the orbital elements.

> **Trap.** $r_{\text{peri}} = a(1-e)$ and $r_{\text{apo}} = a(1+e)$ are
> *Newtonian* relations. They do **not** satisfy $V_{\text{eff}}(r) = E$ in GR,
> and using them would put the markers off the curve they are supposed to sit
> on. The panel root-finds for exactly this reason.

## Lensed sky

### Lens equation (exact geometry, numerical deflection)

For an observer at distance $D$ from the lens, a ray at angular offset $\theta$
from the mass axis has impact parameter

$$b = D \sin\theta .$$

The source is seen at the deflected angle

$$\beta = \theta - \alpha(\theta), \qquad \alpha(\theta) = \alpha_{\text{deflect}}\!\big(b(\theta)\big).$$

`ngLensModel` builds $\alpha(b)$ once per mass:

| Step | Detail |
| --- | --- |
| Table | 200 points, log-spaced over $[1.00002\,b_{\text{crit}},\ 9\,b_{\text{crit}}]$ |
| Interpolation | linear in $\log b$ |
| Beyond the table | the weak-field $4GM/(c^2 b)$ |
| Shadow edge | $\theta_{\text{shadow}} = \arcsin(b_{\text{crit}}/D)$ |
| Einstein ring | 80-step bisection on $\theta - \alpha(D\sin\theta) = 0$ |
| Field of view | $\text{FOV} = \operatorname{clamp}(2.5\,\theta_E,\ 0.22,\ 1.05)$ |
| Observer distance | $D = 12$ scene units |

The log spacing is not cosmetic: $\alpha$ diverges logarithmically as
$b \to b_{\text{crit}}^+$, so a linear table would either miss the photon ring
entirely or need orders of magnitude more samples.

### Per-pixel render (numerical approximation)

`renderLensedSky` writes a 720×720 `ImageData` buffer:

1. Map the pixel to $(\theta, \phi)$ inside the FOV disc.
2. $b = D\sin\theta$.
3. If $b \le b_{\text{crit}}$: black, plus a narrow Gaussian rim at the critical
   curve for the photon ring.
4. Otherwise $\beta = \theta - \alpha(b)$, then fold $|\beta| \bmod 2\pi$ with a
   hemisphere flip so the sky wraps correctly past the antipode.
5. Bilinearly sample the azimuthal-equidistant sky texture at $(\beta, \phi)$.
6. Add three analytic point sources evaluated in $(\beta, \phi)$.

> **Why the sources are analytic.** A texture cannot resolve a source small
> enough to produce a ring thinner than the panel. The two background sources
> are therefore evaluated as Gaussians on the sphere rather than baked into the
> 1024² map, so the Einstein ring stays sharp at any panel size.

The secondary image is not a separate code path. It falls out of the **fold** of
the single-valued map $\beta(\theta)$: because $\alpha$ diverges at
$b_{\text{crit}}$, $\beta$ turns over and the same source is sampled twice.

### Sky texture (display approximation)

The background is a procedural azimuthal-equidistant map with the lens axis at
its centre, so the pole is a point rather than a seam and the Einstein ring is a
clean circle. It is seeded with a fixed xorshift (`0x9e3779b9`), so the sky is
byte-identical on every load. The `Grid` mode swaps it for concentric rings and
radial spokes, which makes the deflection field itself visible; `Unlensed` skips
the deflection entirely and is the control image.

## Radiation reaction and frame dragging

### Peters derivatives (exact formula, orbit-averaged)

$$\left\langle \frac{da}{dt} \right\rangle \propto -\frac{1 + \tfrac{7}{8}e^2}{a^3(1-e^2)^{7/2}}, \qquad \left\langle \frac{de}{dt} \right\rangle \propto -\frac{19}{12}\,\frac{e\left(1 + \tfrac{121}{304}e^2\right)}{a^4(1-e^2)^{5/2}}$$

`grPetersDerivatives(a, e, k)` returns both with the sign folded into the
caller's rate constant $k > 0$. This is the test-particle limit: it ignores the
mass ratio and the final plunge, and it is orbit-averaged, so it says nothing
about the phase of the inspiral.

### Lense–Thirring precession (exact, leading order)

$$\Delta\Omega = \frac{4\pi J}{c^2\,a^3(1-e^2)^{3/2}}$$

`grLenseThirringDeg` returns degrees per orbit. This is the orbit-averaged
leading-order nodal precession; it is a weak-field expansion in $J$, so it is
not valid near the horizon.

## Validation contract

The GR block of `test/physics.test.mjs` asserts, at minimum:

- the photon sphere and ISCO sit at $3GM/c^2$ and $6GM/c^2$, and the ISCO is
  exactly twice the photon sphere;
- $b_{\text{crit}} / r_{\text{ph}} = \sqrt{3}$ to $10^{-12}$ at every tested mass;
- the closed-form $b_{\text{crit}}$ agrees with the integrator's own
  escape/capture boundary at $M \in \{1, 5, 7, 10\}$;
- the $1.1\,r_s$ capture test used by the 3D ray fan never disagrees with the
  $b_{\text{crit}}$ colouring, at $M \in \{1,2,3,5,8,12,20\}$ — an escaping ray
  turns at $r_t > r_{\text{ph}} = 1.5 r_s$, so it can never reach $1.1 r_s$;
- the GR well is strictly deeper than the Newtonian one at small $r$ and
  converges to it at large $r$;
- the Peters $a^{-3}$ scaling and the Lense–Thirring $J$ and $a^{-3}$ scalings
  hold, and the node precession vanishes at $J = 0$;
- the 2:1 resonance preset really has a period ratio of 2 by Kepler's third law.

## Determinism

Nothing in this core draws a random number. The only stochastic-looking element
is the sky texture, which is a fixed-seed xorshift and therefore reproducible
byte for byte. `grNullDeflection` and `grNullTrajectory` are pure functions of
their arguments; the same $b$, $GM$, $c^2$ and options always produce the same
path.

## Limits

- **Schwarzschild only.** The null-geodesic core has no spin. The `Zoom-whirl`
  preset's `spin` drives the 3D scene's frame dragging and the Lense–Thirring
  readout; it does **not** enter the photon paths, the effective potential, or
  the lensed sky. A spinning-hole photon ring is a different calculation and is
  not claimed here.
- **Scene units.** $c^2 = 27.04$ is a display constant. Ratios are exact;
  absolute lengths are not physical.
- **First-order stepper.** Semi-implicit Euler, not RK4. The measured
  step-convergence bound above is the contract; it is not a claim of
  high-order accuracy.
- **The 3D fan cannot show the winding.** The star's drawn radius in the 3D
  scene exceeds the photon sphere, so a near-critical ray's loop hides inside
  the star. That is precisely why the orbital-plane panel exists.
- **Single-valued deflection.** The lens model uses one $\alpha(b)$ branch. The
  secondary image comes from the fold of $\beta(\theta)$, not from a separate
  higher-order branch, so images beyond the secondary are not modelled.
- **Orbit-averaged rates.** Peters and Lense–Thirring are averaged over an
  orbit; neither resolves the per-orbit phase.

## References

1. K. Schwarzschild, "Über das Gravitationsfeld eines Massenpunktes nach der Einsteinschen Theorie," *Sitzungsberichte der Königlich Preußischen Akademie der Wissenschaften* (1916), 189–196.
2. A. Einstein, "Erklärung der Perihelbewegung des Merkur aus der allgemeinen Relativitätstheorie," *Sitzungsberichte* (1915), 831–839.
3. C. W. Misner, K. S. Thorne, and J. A. Wheeler, *Gravitation* (W. H. Freeman, 1973), §25.3 (effective potential) and §25.6 (null geodesics and the deflection integral).
4. S. Chandrasekhar, *The Mathematical Theory of Black Holes* (Oxford University Press, 1983), Ch. 3.
5. P. C. Peters, "Gravitational Radiation and the Motion of Two Point Masses," *Physical Review* **136**, B1224–B1236 (1964).
6. J. Lense and H. Thirring, "Über den Einfluß der Eigenrotation der Zentralkörper auf die Bewegung der Planeten und Monde nach der Einsteinschen Gravitationstheorie," *Physikalische Zeitschrift* **19**, 156–163 (1918).
7. V. Bozza, "Gravitational lensing in the strong field limit," *Physical Review D* **66**, 103001 (2002).
8. K. S. Virbhadra and G. F. R. Ellis, "Schwarzschild black hole lensing," *Physical Review D* **62**, 084003 (2000).

## Conjectural interpretation

The atlas draws the photon ring as a bright rim at $b_{\text{crit}}$ and the
shadow as black inside it. That reading — "the ring is the photon sphere seen
edge-on" — is a *conjectural interpretation* of the geometry, not a result of
the equations. What the equations give is a divergence of the deflection at
$b_{\text{crit}}$ and a capture cone below it. How that divergence is rendered,
and how bright the rim is drawn, are presentation choices.

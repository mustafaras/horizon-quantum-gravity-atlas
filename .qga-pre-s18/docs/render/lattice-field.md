# QFT lattice laboratory (S14)

The field laboratory of the QFT module is a real simulation: a classical scalar `phi^4` field on a periodic lattice, evolved on the GPU by a symplectic integrator, with a float64 CPU reference it is compared with and a conserved-energy test. It is drawn as an engraved height field coloured by the local energy density, and the four terms of the Hamiltonian density can be painted over it from the formula card. Replaces the CPU membrane of `FieldLab3D` (three `needsUpdate` uploads per frame, tuned constants, damping).

```text
js/science/lattice-field.mjs              the CPU reference: lattice, leapfrog (and its staggered forms), energy, mode power, seeded initial conditions
js/formula/library/qft.mjs                qft-phi4-hamiltonian: kinetic, gradient, mass and interaction terms
js/visualizations/qft/lattice-gpu.mjs     the compute kernels over storage buffers (kick, drift, analyse)
js/visualizations/qft/lattice-material.mjs the surface material: height, energy heat map, engraved grid, phi = 0 contour
js/visualizations/qft/lattice-scene.mjs   the Scene3D builder: clock, click kick, readouts, Formula Lens
js/visualizations/qft/lattice-plan.mjs    the fixed simulated time of a frame and the governor's cut of it
js/visualizations/qft/lattice-presets.mjs the presets, display scales, seeds
js/visualizations/common/lens-scenes.mjs  attachLens("qft-lattice")
js/labs/lattice-lab.jsx                   controls, readouts, caption, the Hamiltonian-density card
js/labs/field-lab.jsx                     the 1+1D fallback: the same physics on the CPU, drawn as a waterfall
js/labs/amplitude-room.jsx                the amplitude room, moved out of js/mod-qft.jsx unchanged (js/mod-qft.jsx 1476 -> 695 lines)
```

## The physics

`H = sum_x a^d [ pi^2/2 + (grad phi)^2/2 + m^2 phi^2/2 + (lambda/4!) phi^4 ]` on `n^d` periodic sites (`d = 1, 2`, `n` a power of two), forward-difference gradients, so `phi'' = lap phi - m^2 phi - (lambda/6) phi^3` and `omega_k^2 = m^2 + sum_i (4/a^2) sin^2(k_i a / 2)`.

* **Integrator**: kick-drift-kick leapfrog, second order, symplectic. Stability needs `dt omega_max < 2` with `omega_max^2 = max(m^2, 0) + 4d/a^2` (for `m = 0`, `dt < a / sqrt d`); `createLattice` also caps `dt <= 0.5 a`, the bound the lab runs under, and throws when either is broken. The lab's slider ranges keep the nonlinear stiffening of an amplitude of 1.5 inside the margin (`test/lattice-plan.test.mjs`).
* **Energy.** The synchronised state's energy oscillates at order `(omega_max dt)^2` and has no secular drift. For the free field the integrator has an exact invariant, `sum_k [ |pi_k|^2/2 + omega_k^2 (1 - omega_k^2 dt^2/4) |phi_k|^2/2 ]` (`shadowEnergy`), conserved to 3.6e-15 over 10^4 steps at `dt = 0.1 a`. With `lambda = 1` the mean energy over windows of 50 time units differs between the start and the end of a run by 1.9e-5 (mean over eight seeds at `dt = 0.1 a`) and 4.7e-6 at `dt = 0.05 a`: second order, and the plan's 1e-5 is met at half its step (D-078).
* **Initial conditions** (seeded): `vacuumLike` draws `phi` with `<|phi_k|^2> = 1/(2 omega_k)` and `pi` with `omega_k/2` by an inverse FFT of Hermitian-symmetric Gaussian modes (the Wigner sample of the free ground state; the test averages 1500 seeds to within 5 standard errors per mode); `wavepacket` is two packets head on (with `lambda = 0` their evolution is the sum of the two to 1e-10); `kink` is the pair of domain walls of `m^2 < 0`, `phi = v [tanh(mu (x - x1)/sqrt2) - tanh(mu (x - x2)/sqrt2) - 1]` with `v = sqrt(6 |m^2| / lambda)`, relaxed by gradient flow to the lattice's own static solution (static to 1e-6 over 100 time units; the pair energy is `2 (2 sqrt2 / 3) mu v^2` to 2e-3, Dashen, Hasslacher & Neveu 1974).

## The GPU lattice

State is two storage buffers, `phi` and `pi` (the momentum at half steps). One step is two kernels, each writing exactly one buffer:

| Kernel | Reads | Writes |
|---|---|---|
| kick | `phi` at the site and its four neighbours, `pi` | `pi += dt F(phi)` plus the clicked kick |
| drift | `phi`, `pi` at the site | `phi += dt pi` |
| analyse (once per frame) | `phi`, `pi`, neighbours | synchronised momentum, squared gradient, energy density (the Formula Core expression compiled by `compileTSL`) |

* No invocation reads what another writes in the same dispatch: race free on WebGPU. On the node renderer's WebGL2 backend a kernel is a transform-feedback pass, and a storage buffer is read through `setPBO(true)` (r186 copies the buffer to a texture after each dispatch and reads it with `texelFetch`, in a kernel and in the scene's vertex stage). The flag is set when the buffers are created, before any shader that reads them compiles; on WebGPU it does nothing. S08's one-kernel rule applies to kernels that write the same buffers; here none does (D-076).
* **Variable step.** When the governor changes `dt`, the first kick uses the mean of the old and new length (`stepStaggeredVariable` on the CPU, the same rule in the `kickDt` uniform), so the momentum's half-step offset is kept and the energy does not jump.
* **Parameters are uniforms** (`m^2`, `lambda`, `dt`, the kick); only the lattice size is a compile-time constant. A reset or preset change rebuilds the scene; nothing is uploaded after creation (`qa/specs/lattice-gpu.spec.mjs` checks the buffers' versions).
* **Readbacks.** `getArrayBufferAsync` waits for the GPU to finish what it has queued. Asking the WebGL2 backend for a buffer that no kernel has written yet leaves an empty record that breaks the first kernel to write it, so `readback` answers `phi` and `pi` from the start state before the first step and demands `analyse()` for the display buffers (found when the first real scene fell back with "dualAttributeData.switchBuffers is not a function").

## Clock, governor, software

* The simulated time of a frame is **fixed**, 0.4 in lattice units. The governor's `raySteps` budget (`applyRenderQuality`) only decides how finely it is cut: 4 steps of 0.1 at the floor, 8 of 0.05 at full headroom (`lattice-plan.mjs`). Physics never depends on the frame rate.
* A click kicks the momentum with a Gaussian whose amplitude and width are seeded by the URL seed and the click count (`kickParameters`); a kick advances one frame even when the lab rests. The kick is a uniform pair, applied in the first kick pass and cleared.
* **Reduced motion** and **CPU rasterizers** (SwiftShader, llvmpipe: `softwareRendererClamp()`) start the lattice at rest until Play, Step or a click. A software rasterizer needs about 2.4 s per frame of this lattice (measured), so a running lattice raised the QFT view's frame p95 from about 130 ms to about 2200 ms in the same harness; at rest it is 117 to 133 ms against 133 to 1068 ms before (three runs each, a noisy machine) (D-077). The lattice is 256 x 256, 128 x 128 at low detail and on software.
* The energy readout is taken at an interval of 40 times its own measured cost on hardware and only while the lattice rests on software; the first value comes from the CPU start state.

## The Formula Lens

`qft-phi4-hamiltonian` has the terms `kinetic`, `gradient`, `mass` and `interaction`; `attachLens("qft-lattice")` binds each to the simulation's nodes (`pi`, `g2`, `phi`, `m2`, `lambda`) and to a colour range of 1.5 times the 99th percentile of the term in the preset's initial state (the mass term diverging and symmetric). Focusing a term of the typeset card paints it over the lattice; the value on the card is the term at the lattice's rms values.

## Tests

* `test/lattice-field.test.mjs`: the dispersion of a single mode (leapfrog frequency to 1e-9, lattice `omega_k` to 1e-4), the invariant and the energy statistics above, the static kink, pass-through, the vacuum spectrum, Parseval, the staggered and variable-step forms, the kick, and the Formula Core terms equal to the lattice's terms site by site.
* `test/lattice-plan.test.mjs`, `test/lattice-presets.test.mjs`, `test/formula-lens-scenes.test.mjs` (the wiring), `test/formula-card-katex.test.mjs`.
* `qa/specs/lattice-gpu.spec.mjs`: after 200 steps on a 64 x 64 lattice phi differs from the CPU integrator by 2.9e-7 and pi by 1.5e-6 (tolerance 1e-3), the display buffers and a kick match, a step-length change matches the variable-step reference, nothing is uploaded, two lattices are bitwise identical; on the WebGL2 backend and on a software WebGPU adapter (reported as an annotation when the browser has none).
* `qa/specs/lattice-lab.spec.mjs`: motion, Pause and Step, the static kink in the running scene, a click reproducible across two loads, rest, the Formula Lens, typeset text, the 1+1D fallback.

## Limits

Classical field theory: the vacuum sample is a Wigner sample and nothing here is a quantum computation. The energy readout is the lattice energy above the vacuum, not a measurement. Float32 on the GPU: errors grow with time in a chaotic run; the agreement above is for 200 steps.

# Null geodesics with travelling photons

The orbital-plane light paths of the GR view (`gr-null-geodesics`) with photons that travel them. The paths are the exact Schwarzschild null geodesics of `js/physics.mjs` drawn by the Figure Kit; the photons are a 2-D canvas laid over the figure. Ledger D-075.

```text
js/visualizations/gr/null-photons.mjs   shared clock, interpolated positions, wake, absorption ring, the canvas drawer, the clock stepper
js/labs/null-geodesic-panel.jsx         the panel: Play / Pause, the time slider, the overlay canvas, the caption
js/figure/plots/gr.mjs                  nullGeodesicSpec (the static paths, unchanged)
qa/specs/null-geodesic-panel.spec.mjs   motion, scrub, reduced motion, a 2x display, the KaTeX readout
test/null-photons.test.mjs              the clock, the lag, capture order, interpolation, the drawer's context balance
```

## The clock

`grNullTrajectory` integrates every ray with the same fixed step from the same starting `x`, so the step index is a common time: the rays are a plane wavefront released at once. The playback runs on that index (no wall-clock speed per ray), so what the eye sees is what the integrator computed:

- rays with `b < b_crit` are absorbed early, each with a ring where it reaches the horizon;
- the escaping rays leave the frame in order of how much they were bent;
- the near-critical ray winds around the photon sphere and is among the last to leave.

`t_0` is the time an undeflected ray needs to cross the frame, `2 half / (v_0 dt)` steps; the readout and the slider are `t / t_0`. At the reference mass (`b_crit = 0.528`) the captured rays end by 0.83 `t_0`, the ray at `b = 1.005 b_crit` winds 1.26 turns and leaves at 1.35 `t_0`, the farthest ray at 0.96 `t_0`; the ray at `1.05 b_crit` leaves at 1.39 `t_0`, so the caption says a bent path is a longer one and does not credit the winding alone.

## Behaviour

- Playing, the longest path takes 9 s, then the last frame holds for 1.6 s and the clock wraps. Scrubbing the slider pauses and places the photons at that time.
- Reduced motion starts paused with the clock at 0.7 `t_0`; Play still works.
- Drawing stops while the canvas is off screen or the tab is hidden; there is no per-frame React render, the readout is refreshed ten times a second.
- Positions are interpolated between integrator samples, because the number of samples inside the frame scales with the mass (about 370 at mass 1).
- The overlay copies the figure canvas's CSS box and sizes its backing store at the device pixel ratio.

A wavefront line joining the photons was tried and removed: a chord between a few rays does not represent a wavefront.

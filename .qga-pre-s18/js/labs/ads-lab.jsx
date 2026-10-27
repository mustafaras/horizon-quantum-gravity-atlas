/* ---------- Prompt 08: AdS holography lab (shared by approaches + black holes) ---------- */
function AdsLabSection({ compact = false } = {}) {
  const [state, setState] = useQGAState();
  const links = state.adsLabLinks;
  const region = state.adsLabRegion;
  const lab = window.QGA_LABS && window.QGA_LABS.adsLabState
    ? window.QGA_LABS.adsLabState({ links, region }) : null;

  const build = async (ctx) => {
    const LABS = window.QGA_LABS;
    if (!LABS) throw new Error("Compute-lab module unavailable");
    const { createAdsLabRuntime } = await LABS.loadAdsLab();
    ctx.scene.fog = new ctx.THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-11-c02"), 0.012);
    const runtime = createAdsLabRuntime({ links, region, seed: 42, camera: ctx.camera, engraved: ctx.engraved });
    ctx.scene.add(runtime.mesh);
    ctx.label("CONJECTURAL · AdS/CFT reading — the geometry is exact Poincaré math, the duality is not proven for our universe",
      () => ({ x: -4.4, y: 3.4, z: -3.2 }), "s3d-strong");
    ctx.label("boundary ring: quantum theory without gravity · interior: emergent AdS bulk",
      () => ({ x: -4.4, y: -3.1, z: 3.2 }), "s3d-quiet");
    return {
      update: (t) => {
        runtime.sync({ time: t, motion: ctx.motion() === 0 ? 0 : 1 });
        window.__qgaAdsLab = { kind: runtime.kind, ...runtime.stats() };
      },
      dispose: () => {
        runtime.dispose();
        delete window.__qgaAdsLab;
      },
      recoverable: () => false,
    };
  };

  return (
    <div className="viz-frame">
      <div className="viz-toolbar lab-toolbar">
        <SliderRow label="boundary links" min={0} max={12} step={1} value={links}
          onChange={(v) => setState({ adsLabLinks: v })} format={(v) => String(v)}></SliderRow>
        <SliderRow label="featured region (fraction of ∂)" min={0.1} max={0.9} step={0.05} value={region}
          onChange={(v) => setState({ adsLabRegion: v })} format={(v) => v.toFixed(2)}></SliderRow>
        <div className="kerr-state-line lab-readout">
          {lab ? <>S(Δφ) = {lab.featured.entropy.toFixed(3)} · L<sub>reg</sub> = {lab.featured.length.toFixed(3)} ·
            wedge = {(lab.featured.span / (2 * Math.PI) * 100).toFixed(0)}% of the boundary</> : "—"}
        </div>
      </div>
      <Scene3D animated="motion" height={compact ? 380 : 440}
        aria="Three-dimensional Poincaré disk: a glowing conformal boundary ring, hyperbolic geodesic grid, violet entanglement arcs, and a gold Ryu–Takayanagi minimal surface anchoring a magenta entanglement wedge"
        initial={{ radius: 10.5, theta: 0.62, phi: 1.35, minR: 4, maxR: 30, bloom: { strength: 0.8, radius: 0.55, threshold: 0.16 } }}
        build={build} deps={[links, region]}
        fallback={<div className="lab-fallback">The 3-D AdS lab needs WebGL; the entropy readouts above are computed without it.</div>}></Scene3D>
      <VizCaption provenanceId="ads-holography-lab" status="conjectural">
        The disk is the <strong>Poincaré disk</strong> model of a constant-curvature AdS slice: boundary rings crowd
        together exactly as hyperbolic distance demands, and every arc is a true geodesic computed by
        <code> js/science/ads-geometry.mjs</code>. The gold tube is the <strong>Ryu–Takayanagi surface</strong>:
        the minimal geodesic anchoring the featured boundary region, with
        <Eq tex="S = \frac{c}{6}\,L_{\mathrm{reg}} = \frac{c}{3}\ln\frac{2\sin(\Delta\varphi/2)}{\varepsilon}"></Eq>
        — the tested formula, not a fitted curve. Widen the region and the surface reaches deeper into the bulk;
        add links and the partition weaves more of the interior. What is <em>conjectural</em> is the duality itself:
        AdS/CFT is precise in specific theoretical settings and has never been tested in our (not anti-de Sitter)
        universe.
      </VizCaption>
    </div>);
}
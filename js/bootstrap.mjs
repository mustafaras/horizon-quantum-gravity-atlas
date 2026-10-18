async function bootstrap() {
  try {
    const { threeCompatibility, renderRuntime } = await import("./render/three-runtime.mjs");
    Object.defineProperty(window, "THREE", { value: threeCompatibility, configurable: true });
    Object.defineProperty(window, "QGA_RENDER", { value: renderRuntime, configurable: true });

    // Kerr observatory (science-backed, Node-testable) exposed to the classic-script runtime.
    const kerr = await import("./visualizations/kerr/kerr-observatory.mjs");
    kerr.registerKerrObservatoryProvenance();
    Object.defineProperty(window, "QGA_KERR", {
      value: Object.freeze({ ...kerr, loadRuntime: () => import("./visualizations/kerr/kerr-material.mjs") }),
      configurable: true,
    });

    // Gravitational-wave instrument (Prompt 06): DSP/polarization science,
    // sonification, and the visualization contract. The 3-D runtimes (WebGPU
    // compute / WebGL2) load lazily with the scene.
    const gw = await import("./science/gravitational-waves.mjs");
    const gwAudio = await import("./audio/gw-sonification.mjs");
    const gwInstrument = await import("./visualizations/gw/spacetime-instrument.mjs");
    gwInstrument.registerGwInstrumentProvenance();
    Object.defineProperty(window, "QGA_GW", {
      value: Object.freeze({
        ...gw, ...gwAudio, INSTRUMENT: Object.freeze({ ...gwInstrument }),
        loadRuntime: () => import("./visualizations/gw/gw-runtime.mjs"),
      }),
      configurable: true,
    });

    // Prompt 07 compute labs: quantum-field vacuum, Hawking horizon, and the
    // 3-D RG flow field. Science is eager (provenance + export metadata must
    // exist before any scene mounts); the three.js runtimes load lazily.
    const qftFields = await import("./science/qft-fields.mjs");
    const hawking = await import("./science/hawking.mjs");
    const rgFlow3d = await import("./science/rg-flow-3d.mjs");
    qftFields.registerQftLabProvenance();
    hawking.registerHawkingLabProvenance();
    rgFlow3d.registerRgFlow3dProvenance();

    // Prompt 08 labs: AdS holography, collider kinematics, spin networks.
    const adsGeometry = await import("./science/ads-geometry.mjs");
    const collider = await import("./science/collider-kinematics.mjs");
    const spinNetworks = await import("./science/spin-networks.mjs");
    adsGeometry.registerAdsLabProvenance();
    collider.registerColliderLabProvenance();
    spinNetworks.registerSpinFoamLabProvenance();

    Object.defineProperty(window, "QGA_LABS", {
      value: Object.freeze({
        ...qftFields, ...hawking, ...rgFlow3d,
        ...adsGeometry, ...collider, ...spinNetworks,
        loadQftLab: () => import("./visualizations/qft/field-lab.mjs"),
        loadHawkingLab: () => import("./visualizations/blackhole/hawking-lab.mjs"),
        loadRgFlowField: () => import("./visualizations/rg/flow-field.mjs"),
        loadAdsLab: () => import("./visualizations/holography/ads-lab.mjs"),
        loadColliderDisplay: () => import("./visualizations/collider/event-display.mjs"),
        loadSpinFoam: () => import("./visualizations/planck/spin-foam.mjs"),
      }),
      configurable: true,
    });

    const scripts = [...document.querySelectorAll('script[type="application/x-qga-jsx"]')];
    const sources = await Promise.all(scripts.map(async (script) => {
      const response = await fetch(script.src);
      if (!response.ok) throw new Error(`Cannot load ${script.getAttribute("src")}: HTTP ${response.status}`);
      return response.text();
    }));
    const compiled = sources.map((source, i) => Babel.transform(source, {
      presets: ["react", "env"],
      filename: scripts[i].getAttribute("src"),
      sourceMaps: "inline",
    }).code);

    // Classic scripts share lexical/global bindings, exactly as the Babel tag loader did.
    // Evaluate as one script so a synchronous error aborts before app.jsx can mount.
    const entry = document.createElement("script");
    entry.textContent = compiled.join("\n;\n");
    let evaluationError;
    const onError = (event) => { evaluationError = event.error ?? new Error(event.message); };
    window.addEventListener("error", onError);
    try {
      document.head.appendChild(entry);
    } finally {
      window.removeEventListener("error", onError);
      entry.remove();
    }
    if (evaluationError) throw evaluationError;
  } catch (error) {
    console.error("HORIZON initialization failed:", error);
    const message = document.createElement("p");
    message.setAttribute("role", "alert");
    message.textContent = `HORIZON could not initialize: ${error.message}. Reload the page; if this persists, check that all self-hosted assets are available.`;
    document.getElementById("root").replaceChildren(message);
  }
}

await bootstrap();

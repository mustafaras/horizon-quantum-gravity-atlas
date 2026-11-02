/**
 * The development transpiler: fetch each JSX entry point and run the vendored Babel over it, exactly as the old
 * production path did. Only reachable under `?dev=1`.
 *
 * The entry list comes from the compiler's own manifest rather than from the document, because index.html now carries
 * one tag per source in the PRODUCTION form. Reading the manifest keeps the two paths pointed at the same files with no
 * list to forget; a manifest that disagrees with index.html is what `compile-jsx --check` catches.
 */
async function transpileInBrowser() {
  if (typeof Babel !== "object" || typeof Babel?.transform !== "function") {
    throw new Error("?dev=1 needs the vendored Babel, which index.html does not load in this mode.");
  }
  const manifestResponse = await fetch("js/compiled/.manifest.json");
  if (!manifestResponse.ok) throw new Error("?dev=1 needs js/compiled/.manifest.json; run `npm run compile:jsx`.");
  const manifest = await manifestResponse.json();
  const entries = Object.keys(manifest.sources ?? {});
  if (entries.length === 0) throw new Error("js/compiled/.manifest.json lists no sources; run `npm run compile:jsx`.");
  const sources = await Promise.all(entries.map(async (src) => {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Cannot load ${src}: HTTP ${response.status}`);
    return response.text();
  }));
  return sources.map((source, i) => Babel.transform(source, {
    presets: ["react", "env"],
    filename: entries[i],
    sourceMaps: "inline",
  }).code);
}

async function bootstrap() {
  try {
    const { threeCompatibility, renderRuntime } = await import("./render/three-runtime.mjs");
    Object.defineProperty(window, "THREE", { value: threeCompatibility, configurable: true });
    Object.defineProperty(window, "QGA_RENDER", { value: renderRuntime, configurable: true });

    // Design tokens (S02): styles/tokens.css is the single source of colours, fonts, sizes and
    // durations; this is its read side for the classic-script runtime. Exposed first so every
    // module below can read tokens while it is being built.
    const tokens = await import("./design/tokens.mjs");
    const palettes = await import("./design/palettes.mjs");
    Object.defineProperty(window, "QGA_TOKENS", {
      value: Object.freeze({
        readTokens: tokens.readTokens, onThemeChange: tokens.onThemeChange, cssColorToLinear: tokens.cssColorToLinear,
        current: tokens.current, css: tokens.css, alpha: tokens.alpha, hex: tokens.hex, hexString: tokens.hexString,
        linear: tokens.linear, linearRef: tokens.linearRef, rgb255: tokens.rgb255, tint: tokens.tint, hueTint: tokens.hueTint,
        monoPx: tokens.monoPx, bodyPx: tokens.bodyPx, headPx: tokens.headPx, readableText: tokens.readableText,
        palettes: Object.freeze({ ...palettes }),
      }),
      configurable: true,
    });

    // Themes (S34): Observatory, Blueprint, Print. The controller flips <html data-theme> and dispatches `qga:theme`
    // on document, which clears the token cache and repaints canvas figures and three.js scenes.
    const themes = await import("./design/theme.mjs");
    let storage = null;
    try { storage = window.localStorage; } catch { /* blocked storage: the choice lasts for this page only */ }
    Object.defineProperty(window, "QGA_THEME", {
      value: themes.createThemeController({ document, storage, search: window.location.search, target: window }),
      configurable: true,
    });

    // Kerr observatory (science-backed, Node-testable) exposed to the classic-script runtime.
    const kerr = await import("./visualizations/kerr/kerr-observatory.mjs");
    kerr.registerKerrObservatoryProvenance();
    Object.defineProperty(window, "QGA_KERR", {
      value: Object.freeze({ ...kerr, loadRuntime: () => import("./visualizations/kerr/kerr-material.mjs") }),
      configurable: true,
    });

    // Atlas backdrop starfield (S08): a static seeded sprite buffer with a vertex-stage twinkle; loads with the backdrop.
    Object.defineProperty(window, "QGA_BACKDROP", {
      value: Object.freeze({ loadStars: () => import("./visualizations/atlas/backdrop-stars.mjs") }),
      configurable: true,
    });

    // Curvature engine scene (S07): TSL materials on the material kit; the builder loads with the scene.
    const tidal = await import("./science/tidal.mjs");
    const grTests = await import("./science/data/gr-tests.mjs");
    const lensedSky = await import("./visualizations/gr/lensed-sky.mjs");
    const nullPhotons = await import("./visualizations/gr/null-photons.mjs");
    Object.defineProperty(window, "QGA_GR", {
      value: Object.freeze({
        tidal: Object.freeze({ ...tidal }),
        tests: Object.freeze({ ...grTests }),
        loadTidalRing: () => import("./visualizations/gr/tidal-ring.mjs"),
        lensedSky: Object.freeze({ ...lensedSky }),
        nullPhotons: Object.freeze({ ...nullPhotons }),
        loadCurvatureEngine: () => import("./visualizations/gr/curvature-engine.mjs"),
      }),
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
    const constraints = await import("./science/data/constraints.mjs");
    Object.defineProperty(window, "QGA_CONSTRAINTS", { value: Object.freeze({ ...constraints }), configurable: true });
    const causalSets = await import("./science/causal-sets.mjs");
    Object.defineProperty(window, "QGA_CAUSAL_SETS", { value: Object.freeze({ ...causalSets }), configurable: true });
    const cdt = await import("./science/cdt-2d.mjs");
    Object.defineProperty(window, "QGA_CDT", { value: Object.freeze({ ...cdt }), configurable: true });
    const stringSpectrum = await import("./science/string-spectrum.mjs");
    Object.defineProperty(window, "QGA_STRING", { value: Object.freeze({ ...stringSpectrum }), configurable: true });
    const spectralData = await import("./science/data/spectral-dimension.mjs");
    Object.defineProperty(window, "QGA_SPECTRAL_DIMENSION", { value: Object.freeze({ ...spectralData }), configurable: true });
    const evaporation = await import("./science/evaporation.mjs");
    Object.defineProperty(window, "QGA_EVAPORATION", { value: Object.freeze({ ...evaporation }), configurable: true });
    const greybody = await import("./science/greybody.mjs");
    Object.defineProperty(window, "QGA_GREYBODY", { value: Object.freeze({ ...greybody }), configurable: true });
    const kerrShadow = await import("./science/kerr-shadow.mjs");
    Object.defineProperty(window, "QGA_KERR_SHADOW", { value: Object.freeze({ ...kerrShadow }), configurable: true });
    const eht = await import("./science/data/eht.mjs");
    Object.defineProperty(window, "QGA_EHT", { value: Object.freeze({ ...eht }), configurable: true });
    const pnWaveform = await import("./science/pn-waveform.mjs");
    Object.defineProperty(window, "QGA_PN_WAVEFORM", { value: Object.freeze({ ...pnWaveform }), configurable: true });
    const matchedFilter = await import("./science/matched-filter.mjs");
    Object.defineProperty(window, "QGA_MATCHED_FILTER", { value: Object.freeze({ ...matchedFilter }), configurable: true });
    const qtransform = await import("./science/qtransform.mjs");
    Object.defineProperty(window, "QGA_QTRANSFORM", { value: Object.freeze({ ...qtransform }), configurable: true });
    const cmsDimuon = await import("./science/data/cms-dimuon.mjs");
    Object.defineProperty(window, "QGA_CMS_DIMUON", { value: Object.freeze({ ...cmsDimuon }), configurable: true });
    const observationalNet = await import("./science/observational-net.mjs");
    Object.defineProperty(window, "QGA_OBSERVATIONAL_NET", { value: Object.freeze({ ...observationalNet }), configurable: true });
    // S29: the atlas map. Its positions are committed data, so the overview draws a static graph and never simulates.
    const atlasMap = await import("./science/atlas-map.mjs");
    const atlasMapLayout = await import("./science/data/atlas-map-layout.mjs");
    Object.defineProperty(window, "QGA_ATLAS_MAP", { value: Object.freeze({ ...atlasMap }), configurable: true });
    Object.defineProperty(window, "QGA_ATLAS_MAP_LAYOUT", { value: Object.freeze({ ...atlasMapLayout }), configurable: true });
    // The measured pixel size of each chapter cover. js/core.jsx is a classic script and cannot read the JSON
    // sidecars, and without them it claimed 1200w/2400w for 794 and 950 px files.
    const covers = await import("./science/data/cover-index.mjs");
    Object.defineProperty(window, "QGA_COVERS", { value: covers.COVER_INDEX, configurable: true });
    // S35: the whitepaper's version-2 section, generated from the ledger by scripts/build-whitepaper.mjs, so the paper
    // view and docs/whitepaper.md print the same record.
    const whitepaper = await import("./whitepaper/whitepaper-v2-data.mjs");
    Object.defineProperty(window, "QGA_WHITEPAPER", { value: whitepaper.WHITEPAPER_V2, configurable: true });
    adsGeometry.registerAdsLabProvenance();
    collider.registerColliderLabProvenance();
    spinNetworks.registerSpinFoamLabProvenance();

    // Prompt 10 premium interaction layer: shared motion clock, deterministic
    // search, the typed ConceptBus, annotation/snapshot stores and compare
    // state. Pure ESM; exposed as frozen globals for the classic-script
    // runtime (freeze the api object itself — never a spread copy, which
    // would evaluate getters).
    const motion = await import("./motion/atlas-motion.mjs");
    const search = await import("./search/search-index.mjs");
    const linking = await import("./linking/concept-bus.mjs");
    const annotationStore = await import("./annotations/annotation-store.mjs");
    const snapshotStore = await import("./snapshots/snapshot-store.mjs");
    const compareState = await import("./compare/compare-state.mjs");
    const dividerShader = await import("./compare/divider-shader.mjs");
    const conceptBus = linking.createConceptBus();
    const motionRuntime = motion.createMotionRuntime();
    Object.defineProperty(window, "QGA_MOTION", {
      value: Object.freeze({
        EASINGS: motion.EASINGS, resolveEasing: motion.resolveEasing,
        createTweenRunner: motion.createTweenRunner,
        createCriticallyDampedSpring: motion.createCriticallyDampedSpring,
        createMotionRuntime: motion.createMotionRuntime,
        systemReducedMotion: motion.systemReducedMotion,
        runtime: motionRuntime,
      }),
      configurable: true,
    });
    Object.defineProperty(window, "QGA_SEARCH", {
      value: Object.freeze({
        buildSearchIndex: search.buildSearchIndex, rankResults: search.rankResults,
        highlightSegments: search.highlightSegments, formatResultCount: search.formatResultCount,
        normalizeSearchText: search.normalizeSearchText,
      }),
      configurable: true,
    });
    Object.defineProperty(window, "QGA_CONCEPT_BUS", { value: conceptBus, configurable: true });
    const formulaTerms = await import("./linking/formula-terms.mjs");
    Object.defineProperty(window, "QGA_LINKING", {
      value: Object.freeze({
        createConceptBus: linking.createConceptBus, CONCEPT_EVENT_TYPES: linking.CONCEPT_EVENT_TYPES,
        attachFormulaTerms: formulaTerms.attachFormulaTerms,
      }),
      configurable: true,
    });
    Object.defineProperty(window, "QGA_ANNOTATIONS", {
      value: Object.freeze({
        ANNOTATION_SCHEMA: annotationStore.ANNOTATION_SCHEMA, ANNOTATION_LIMITS: annotationStore.ANNOTATION_LIMITS,
        validateAnnotation: annotationStore.validateAnnotation, validateAnnotationList: annotationStore.validateAnnotationList,
        serializeAnnotationsParam: annotationStore.serializeAnnotationsParam, parseAnnotationsParam: annotationStore.parseAnnotationsParam,
        createAnnotationStore: annotationStore.createAnnotationStore, newAnnotationId: annotationStore.newAnnotationId,
      }),
      configurable: true,
    });
    Object.defineProperty(window, "QGA_SNAPSHOTS", {
      value: Object.freeze({
        SNAPSHOT_SCHEMA: snapshotStore.SNAPSHOT_SCHEMA, SNAPSHOT_LIMITS: snapshotStore.SNAPSHOT_LIMITS,
        validateSnapshotPayload: snapshotStore.validateSnapshotPayload, createSnapshotRecord: snapshotStore.createSnapshotRecord,
        createSnapshotStore: snapshotStore.createSnapshotStore,
      }),
      configurable: true,
    });

    // Workers (S33): the protocol and client the main thread uses, plus the offline registration state machine. The
    // worker file itself is loaded by the browser as a module worker, not imported here.
    const workerProtocol = await import("./workers/worker-protocol.mjs");
    const workerClient = await import("./workers/worker-client.mjs");
    const swRegistration = await import("./pwa/register-service-worker.mjs");
    Object.defineProperty(window, "QGA_WORKERS", {
      value: Object.freeze({
        WORKER_SCHEMA: workerProtocol.WORKER_SCHEMA, JOB_KINDS: workerProtocol.JOB_KINDS,
        JOB_LIMITS: workerProtocol.JOB_LIMITS, shouldOffloadCausalSet: workerProtocol.shouldOffloadCausalSet,
        validateJob: workerProtocol.validateJob, causalSetWork: workerProtocol.causalSetWork,
        createChannelTracker: workerProtocol.createChannelTracker,
        createWorkerClient: () => workerClient.createWorkerClient({
          url: new URL("./workers/simulation-worker.mjs", import.meta.url).href,
        }),
        prefersWorker: workerClient.prefersWorker,
      }),
      configurable: true,
    });
    Object.defineProperty(window, "QGA_PWA", {
      value: Object.freeze({
        SW_STATE: swRegistration.SW_STATE,
        createController: () => swRegistration.createServiceWorkerController({
          url: new URL("../service-worker.js", import.meta.url).href,
          listen: !swRegistration.workerDisabledByUrl(location.search),
        }),
        workerDisabledByUrl: swRegistration.workerDisabledByUrl,
        updateNoticeText: swRegistration.updateNoticeText,
      }),
      configurable: true,
    });

    // Publishing studio (S32): the export contract, the four artefact builders and the pure helpers behind them.
    // Every module here is DOM-free; the studio's own JSX calls them, and the print view reads a report object.
    const exportService = await import("./export/export-service.mjs");
    const imageExport = await import("./export/image-export.mjs");
    const videoExport = await import("./export/video-export.mjs");
    const figureExport = await import("./export/figure-export.mjs");
    const shareCard = await import("./export/share-card.mjs");
    const labReport = await import("./export/lab-report.mjs");
    Object.defineProperty(window, "QGA_EXPORT", {
      value: Object.freeze({
        EXPORT_SCHEMA: exportService.EXPORT_SCHEMA, EXPORT_VERSION: exportService.EXPORT_VERSION,
        DISPLAY_AMPLIFICATIONS: exportService.DISPLAY_AMPLIFICATIONS, EXPORT_ERROR_CODES: exportService.EXPORT_ERROR_CODES,
        ExportError: exportService.ExportError,
        buildExportEnvelope: exportService.buildExportEnvelope, exportFileName: exportService.exportFileName,
        utcTimestamp: exportService.utcTimestamp, sha256Hex: exportService.sha256Hex,
        sidecarJson: exportService.sidecarJson, buildFigureSidecar: exportService.buildFigureSidecar,
        STILL_PRESETS: imageExport.STILL_PRESETS, planStillCapture: imageExport.planStillCapture,
        captureStill: imageExport.captureStill, canvasToPngBytes: imageExport.canvasToPngBytes,
        RECORDING_PRESETS: videoExport.RECORDING_PRESETS, recordingSupport: videoExport.recordingSupport,
        recordCanvas: videoExport.recordCanvas, recordingPlan: videoExport.recordingPlan,
        FIGURE_WIDTHS_MM: figureExport.FIGURE_WIDTHS_MM, FIGURE_STYLES: figureExport.FIGURE_STYLES,
        buildFigureExport: figureExport.buildFigureExport, dataTableCsv: figureExport.dataTableCsv,
        SHARE_CARD_SIZE: shareCard.SHARE_CARD_SIZE, SHARE_CARD_LIMITATION: shareCard.SHARE_CARD_LIMITATION,
        shareCardScene: shareCard.shareCardScene, shareCardSvg: shareCard.shareCardSvg,
        shareCardSidecar: shareCard.shareCardSidecar,
        buildLabReport: labReport.buildLabReport, reportPlainText: labReport.reportPlainText,
        reportStateRows: labReport.reportStateRows, REPORT_PRIMARY_KEYS: labReport.REPORT_PRIMARY_KEYS,
      }),
      configurable: true,
    });

    // Guided tours (S31): the manifests, their validator, the step runner and the worksheet builder. Exposed before
    // the classic scripts are evaluated, because js/state.jsx validates `?tour=` and `?step=` on first read.
    const tours = await import("./tours/tour-schema.mjs");
    const toursRunner = await import("./tours/tour-runner.mjs");
    const tourManifests = await import("./tours/tour-manifests.mjs");
    Object.defineProperty(window, "QGA_TOURS", {
      value: Object.freeze({
        TOUR_SCHEMA: tours.TOUR_SCHEMA, TOUR_LIMITS: tours.TOUR_LIMITS,
        TOUR_LIBRARY: tourManifests.TOUR_LIBRARY, TOUR_IDS: tourManifests.TOUR_IDS,
        parseTourParam: tours.parseTourParam, parseStepParam: tours.parseStepParam,
        parsePrintParam: tours.parsePrintParam, clampStep: tours.clampStep,
        nextStep: tours.nextStep, previousStep: tours.previousStep, formatStepCounter: tours.formatStepCounter,
        validateTour: tours.validateTour, validateTourLibrary: tours.validateTourLibrary, findTour: tours.findTour,
        stepUrl: tours.stepUrl, worksheetUrl: tours.worksheetUrl, worksheetRows: tours.worksheetRows,
        worksheetHeader: tours.worksheetHeader, createTourResumeStore: tours.createTourResumeStore,
        stepPlan: toursRunner.stepPlan, applyStepState: toursRunner.applyStepState,
        resumeStep: toursRunner.resumeStep, moveStep: toursRunner.moveStep,
        tourEntry: toursRunner.tourEntry, describePatch: toursRunner.describePatch,
      }),
      configurable: true,
    });
    Object.defineProperty(window, "QGA_COMPARE", {
      value: Object.freeze({
        COMPARE_PRESETS: compareState.COMPARE_PRESETS, COMPARE_RENDER_MODES: compareState.COMPARE_RENDER_MODES,
        validateCompareSide: compareState.validateCompareSide, cameraSpacesCompatible: compareState.cameraSpacesCompatible,
        diffStates: compareState.diffStates, sampleTweenState: compareState.sampleTweenState,
        createDividerOverlay: dividerShader.createDividerOverlay,
      }),
      configurable: true,
    });

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
        ...causalSets,
        loadCausalSet: () => import("./visualizations/approaches/causal-set.mjs"),
        ...cdt, ...stringSpectrum, ...evaporation, ...greybody, ...kerrShadow, ...eht, ...pnWaveform, ...matchedFilter, ...qtransform, ...cmsDimuon, ...observationalNet,
        loadCdt: () => import("./visualizations/approaches/cdt.mjs"),
      }),
      configurable: true,
    });

    // Engraved lines (S06): constant-pixel-width lines; the backend is chosen per scene build (D-028).
    const engravedBackend = await import("./visualizations/common/engraved-backend.mjs");
    const engraved = await import("./visualizations/common/engraved-lines.mjs");
    Object.defineProperty(window, "QGA_ENGRAVED", {
      value: Object.freeze({
        // Resolves to the API bound to the backend chosen for this scene build (see engravedFor).
        prepare: async (settings, options) => engraved.engravedFor(await engravedBackend.prepareEngravedLinesFor(settings, options)),
      }),
      configurable: true,
    });

    // Formula Core (S03): one definition per equation, compiled to JS, KaTeX and TSL.
    // Pass the "three/tsl" namespace to compileTSL; the formula modules never import three.
    const { library: formulaLibrary } = await import("./formula/library/index.mjs");
    const { compileTSL } = await import("./formula/to-tsl.mjs");
    const { toTeX, KATEX_OPTIONS } = await import("./formula/to-tex.mjs");
    const { lens: formulaLens, termLabel: formulaTermLabel } = await import("./formula/lens.mjs");
    // Derivations (S30): the six arguments the stepper walks, and the pure state machine it draws.
    const { derivations } = await import("./formula/library/derivations.mjs");
    const stepper = await import("./formula/stepper.mjs");
    const derivationById = Object.freeze(Object.fromEntries(Object.values(derivations).map((d) => [d.id, d])));
    Object.defineProperty(window, "QGA_FORMULA", {
      value: Object.freeze({
        library: formulaLibrary, compileTSL, toTeX, KATEX_OPTIONS, lens: formulaLens, termLabel: formulaTermLabel,
        derivations, stepper, derivation: (id) => derivationById[id] ?? null,
      }),
      configurable: true,
    });

    // Formula Lens (S10): the scene half loads with the first scene that links a formula. Its provenance is
    // registered now so a figure never appears without one.
    const lensProvenance = await import("./visualizations/common/term-lens-provenance.mjs");
    lensProvenance.registerFormulaLensProvenance();
    Object.defineProperty(window, "QGA_TERM_LENS", {
      value: Object.freeze({ attach: async (key, ctx, params) => (await import("./visualizations/common/lens-scenes.mjs")).attachLens(key, ctx, params) }),
      configurable: true,
    });

    // Neutrino lab (S12): the three-flavour calculation and the NuFIT 6.0 data behind js/labs/neutrino-lab.jsx.
    const neutrino = await import("./science/neutrino.mjs");
    const nufit = await import("./science/data/nufit.mjs");
    Object.defineProperty(window, "QGA_NEUTRINO", {
      value: Object.freeze({
        flavourCurves: neutrino.flavourCurves, oscillationProbabilities: neutrino.oscillationProbabilities,
        matterPotentialEv: neutrino.matterPotentialEv, resonanceEnergyGeV: neutrino.resonanceEnergyGeV,
        defaultParams: nufit.defaultParams, NUFIT: nufit.NUFIT, NUFIT_SOURCE: nufit.NUFIT_SOURCE,
        EXPERIMENTS: nufit.EXPERIMENTS, DEFAULT_VARIANT: nufit.DEFAULT_VARIANT,
      }),
      configurable: true,
    });

    // Higgs lab (S13): the potential, the running of the couplings and the PDG inputs behind js/labs/higgs-lab.jsx; the TSL
    // Mexican hat loads on demand with the first scene that builds it.
    const higgs = await import("./science/higgs.mjs");
    const higgsRunning = await import("./science/higgs-running.mjs");
    const pdg = await import("./science/data/pdg.mjs");
    Object.defineProperty(window, "QGA_HIGGS", {
      value: Object.freeze({ ...higgs, ...higgsRunning, PDG: pdg.PDG, PDG_SOURCE: pdg.PDG_SOURCE, PDG_OMITTED: pdg.PDG_OMITTED }),
      configurable: true,
    });
    Object.defineProperty(window, "QGA_SM_VIZ", {
      value: Object.freeze({ loadMexicanHat: () => import("./visualizations/sm/mexican-hat.mjs") }),
      configurable: true,
    });

    // QFT lattice lab (S14): the CPU reference of the phi^4 lattice (it also runs the 1+1D fallback), the lab's presets, clock and slider
    // ranges; the GPU scene loads on demand with the first scene that builds it.
    const latticeScience = await import("./science/lattice-field.mjs");
    const latticePlan = await import("./visualizations/qft/lattice-plan.mjs");
    const latticePresets = await import("./visualizations/qft/lattice-presets.mjs");
    Object.defineProperty(window, "QGA_QFT_LATTICE", {
      value: Object.freeze({
        science: Object.freeze({ ...latticeScience }), view: latticePlan.LATTICE_VIEW, presets: latticePresets.LATTICE_PRESETS,
        safeCouplings: latticePresets.safeCouplings, kickSeed: latticePresets.kickSeed, loadScene: () => import("./visualizations/qft/lattice-scene.mjs"),
      }),
      configurable: true,
    });

    // Casimir lab (S15): the ideal-plate pressure, the regularised mode sum and the reported bands behind js/labs/casimir-lab.jsx; the
    // scene loads on demand with the first scene that builds it.
    const casimirScience = await import("./science/casimir.mjs");
    const casimirData = await import("./science/data/casimir.mjs");
    const casimirGeometry = await import("./visualizations/qft/casimir-geometry.mjs");
    Object.defineProperty(window, "QGA_CASIMIR", {
      value: Object.freeze({
        science: Object.freeze({ ...casimirScience }), data: casimirData.CASIMIR_DATA, sources: casimirData.CASIMIR_SOURCES,
        view: Object.freeze({
          gapRange: casimirGeometry.GAP_RANGE, gapFromLog: casimirGeometry.gapFromLog, logFromGap: casimirGeometry.logFromGap,
          gapTex: casimirGeometry.gapTex, pressureTex: casimirGeometry.pressureTex,
        }),
        loadScene: () => import("./visualizations/qft/casimir-cavity.mjs"),
      }),
      configurable: true,
    });

    // Electroweak scattering and Feynman diagrams (S16): the tree-level gamma + Z, Bhabha and Moller functions and the LEP Z-pole numbers behind
    // the amplitude room, and the diagram geometry behind the Feynman builder (js/labs/feynman-diagram.jsx).
    const electroweakScience = await import("./science/electroweak.mjs");
    const electroweakData = await import("./science/data/electroweak.mjs");
    const feynmanSvg = await import("./visualizations/qft/feynman-svg.mjs");
    const feynmanDiagrams = await import("./visualizations/qft/feynman-diagrams.mjs");
    Object.defineProperty(window, "QGA_ELECTROWEAK", {
      value: Object.freeze({ science: Object.freeze({ ...electroweakScience }), data: electroweakData.LEP_POLE, source: electroweakData.LEP_SOURCE, derivedPole: electroweakData.derivedMuonPoleCrossSection }),
      configurable: true,
    });
    Object.defineProperty(window, "QGA_FEYNMAN", {
      value: Object.freeze({ layout: feynmanSvg.layoutDiagram, ...feynmanDiagrams }),
      configurable: true,
    });

    // Gauge-coupling running and unification (S17): the three couplings run from M_Z and the triangle they enclose (js/labs/unification-lab.jsx).
    const gaugeRunning = await import("./science/gauge-running.mjs");
    const gaugeData = await import("./science/data/gauge-couplings.mjs");
    const gaugePdg = await import("./science/data/pdg.mjs");
    Object.defineProperty(window, "QGA_GAUGE", {
      value: Object.freeze({ ...gaugeRunning, ...gaugeData, PDG: gaugePdg.PDG }),
      configurable: true,
    });

    // Asymptotic safety (S18): the Einstein-Hilbert flow, the separatrix and the trajectory classes; the GPU silk loads with the first scene that builds it.
    const asymptoticSafety = await import("./science/asymptotic-safety.mjs");
    const silkGeometry = await import("./visualizations/rg/silk-geometry.mjs");
    Object.defineProperty(window, "QGA_GRAVITY", {
      value: Object.freeze({ ...asymptoticSafety, silk: silkGeometry, loadSilk: () => import("./visualizations/rg/lic-field.mjs") }),
      configurable: true,
    });

    // Conformal diagrams (S19): the exact maps, the RN schematic and the scene geometry behind the Penrose atlas. The
    // three.js scene loads with the lab that builds it.
    const conformal = await import("./science/conformal.mjs");
    const penroseGeometry = await import("./visualizations/gr/penrose-geometry.mjs");
    Object.defineProperty(window, "QGA_CONFORMAL", {
      value: Object.freeze({
        ...conformal,
        geometry: Object.freeze({ ...penroseGeometry }),
        loadAtlas: () => import("./visualizations/gr/penrose.mjs"),
      }),
      configurable: true,
    });

    // Provenance (S11): every entry is registered before the JSX modules mount, so a caption always finds its entry.
    const { registerAllProvenance } = await import("./provenance-index.mjs");
    const provenanceRegistry = await import("./science/provenance.mjs");
    const { referenceLinks } = await import("./science/references.mjs");
    registerAllProvenance();
    Object.defineProperty(window, "QGA_PROVENANCE", {
      value: Object.freeze({
        get: provenanceRegistry.getVisualizationProvenance,
        list: provenanceRegistry.listVisualizationProvenance,
        assertCaption: provenanceRegistry.assertCaptionProvenance,
        referenceLinks,
      }),
      configurable: true,
    });

    // Text alternatives for 3D scenes (S34): model, status and Formula Core values appended to the author's sentence.
    const sceneAltText = await import("./render/scene-alt-text.mjs");
    Object.defineProperty(window, "QGA_SCENE_ALT", { value: Object.freeze({ ...sceneAltText }), configurable: true });

    const sceneLayers = await import("./render/scene-layers.mjs");
    Object.defineProperty(window, "QGA_LAYERS", {
      value: Object.freeze({ tag: sceneLayers.tagLayer, layerOf: sceneLayers.layerOf, applyMode: sceneLayers.applyLayerMode, untagged: sceneLayers.untaggedObjects }),
      configurable: true,
    });

    // Figure Kit (S09): scene description, renderers and plot specs for every 2D figure.
    const figureKit = await import("./figure/index.mjs");
    figureKit.registerFigureProvenance();
    Object.defineProperty(window, "QGA_FIGURE", { value: Object.freeze({ ...figureKit }), configurable: true });

    // Prompt 09: cinematic direction system. The runtime assembles the
    // camera director, scroll driver, shot-space registry, and the
    // capability-gated scene transition; the transition shader is prewarmed
    // in the background so the first view change never blocks.
    const cinematic = await import("./cinematic/runtime.mjs");
    const cinematicRuntime = cinematic.createCinematicRuntime();
    Object.defineProperty(window, "QGA_CINEMATIC", {
      value: Object.freeze(cinematicRuntime),
      configurable: true,
    });
    void cinematicRuntime.prewarmTransition();

    // Production has already transpiled the 58 JSX entry points (scripts/compile-jsx.mjs) and index.html loads the
    // results as deferred classic scripts, so this block only has to run in development. `?dev=1` keeps the
    // in-browser path, where editing a .jsx file and reloading is the whole workflow.
    const dev = window.__QGA_DEV__ === true;
    document.documentElement.dataset.qgaRuntime = dev ? "dev" : "production";
    performance.mark("qga:babel:start");
    const compiled = dev ? await transpileInBrowser() : null;
    performance.mark("qga:babel:end");
    if (!dev) {
      // The compiled files are listed in index.html with a private type so the browser keeps them inert and in order;
      // they must run after this module has exposed QGA_TOKENS, QGA_PHYSICS and the rest, exactly as the JSX used to.
      const tags = [...document.querySelectorAll('script[type="application/x-qga-compiled"]')];
      const texts = await Promise.all(tags.map(async (tag) => {
        const response = await fetch(tag.getAttribute("src"));
        if (!response.ok) throw new Error(`Cannot load ${tag.getAttribute("src")}: HTTP ${response.status}`);
        return response.text();
      }));
      const entry = document.createElement("script");
      entry.textContent = texts.join("\n;\n");
      let evaluationError;
      const onError = (event) => { evaluationError = event.error ?? new Error(event.message); };
      window.addEventListener("error", onError);
      try { document.head.appendChild(entry); } finally {
        window.removeEventListener("error", onError);
        entry.remove();
      }
      if (evaluationError) throw evaluationError;
      window.__QGA_COMPILE__ = { runtime: "production", babelMs: 0, sources: texts.length };
    }

    if (dev) {
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
      const end = performance.getEntriesByName("qga:babel:end")[0];
      const start = performance.getEntriesByName("qga:babel:start")[0];
      window.__QGA_COMPILE__ = { runtime: "dev", babelMs: end && start ? end.startTime - start.startTime : 0, sources: compiled.length };
    }
  } catch (error) {
    console.error("HORIZON initialization failed:", error);
    const message = document.createElement("p");
    message.setAttribute("role", "alert");
    message.textContent = `HORIZON could not initialize: ${error.message}. Reload the page; if this persists, check that all self-hosted assets are available.`;
    document.getElementById("root").replaceChildren(message);
  }
}

await bootstrap();

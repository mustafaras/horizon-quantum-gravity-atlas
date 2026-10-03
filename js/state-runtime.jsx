function qgaSeeded(seed) {
  return window.QGA_PHYSICS?.seededRng?.(seed) || (() => {
    let x = (Number(seed) >>> 0) || 1;
    return () => { x = (1664525 * x + 1013904223) >>> 0; return x / 4294967296; };
  })();
}
function useQGAState() {
  const [state, setState] = useState(() => qgaReadState());
  useEffect(() => {
    const onPop = () => setState(qgaReadState());
    const onStateChange = (event) => setState(event.detail);
    window.addEventListener("popstate", onPop);
    window.addEventListener("qga-statechange", onStateChange);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("qga-statechange", onStateChange);
    };
  }, []);
  const update = useCallback((patch, options = {}) => setState(() => {
    const current = qgaReadState();
    const next = { ...current, ...(typeof patch === "function" ? patch(current) : patch) };
    qgaWriteState(next, options); return next;
  }), []);
  return [state, update];
}
window.QGA_DEFAULT_STATE = QGA_DEFAULT_STATE;
window.QGA_READ_STATE = qgaReadState; window.QGA_WRITE_STATE = qgaWriteState;
window.QGA_SEEDED = qgaSeeded; window.useQGAState = useQGAState;
function qgaShareUrl(state) { return new URL(qgaStateSearch(state), window.location.href).href; }
async function qgaCopyLink(state) {
  const url = qgaShareUrl(state);
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
  else {
    const input = document.createElement("textarea");
    input.value = url; input.style.position = "fixed"; document.body.appendChild(input); input.select();
    if (!document.execCommand("copy")) { input.remove(); throw new Error("Clipboard access is unavailable."); }
    input.remove();
  }
  return url;
}
function qgaExportJson(state, extra = {}) {
  const payload = { schema: "horizon-qga-state/v1", exportedAt: new Date().toISOString(),
    source: qgaShareUrl(state), state: { ...state }, ...extra };
  const href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json" }));
  const a = document.createElement("a"); a.href = href; a.download = "horizon-qga-state.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(href), 0); return payload;
}
window.QGA_COPY_LINK = qgaCopyLink; window.QGA_EXPORT_JSON = qgaExportJson;
// Official API v2 documentation: https://gwosc.org/api/v2/docs (schema: /api/v2/schema).
// The response cap keeps this static client from turning a shareable page into an
// unbounded archive downloader.
async function qgaReadBounded(response, maxBytes) {
  if (!response.body?.getReader) throw new Error("Streaming response reads are unavailable.");
  const reader = response.body.getReader();
  const chunks = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("GWOSC response exceeded the browser safety limit.");
        throw new Error("GWOSC response exceeded the browser safety limit.");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

async function qgaFetchGWOSC(event, { detector = "H1", start = 1126259446, duration = 16, signal, timeoutMs = 12000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    const eventName = encodeURIComponent(event);
    const detailUrl = "https://gwosc.org/api/v2/event-versions/" + eventName;
    const detailResponse = await fetch(detailUrl, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!detailResponse.ok) throw new Error("GWOSC event lookup returned HTTP " + detailResponse.status);
    const detail = await detailResponse.json();
    const explicitVersion = /-v\d+$/i.test(event);
    const candidates = explicitVersion
      ? [event]
      : Array.from({ length: Math.min(4, detail.version) }, (_, index) => detail.name + "-v" + (detail.version - index));
    let file = null, filesUrl = "";
    for (const candidate of candidates) {
      filesUrl = "https://gwosc.org/api/v2/event-versions/" + encodeURIComponent(candidate)
        + "/strain-files?detector=" + encodeURIComponent(detector)
        + "&sample-rate=4&duration=32&file-format=txt&page=1&pagesize=1";
      const response = await fetch(filesUrl, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("GWOSC strain lookup returned HTTP " + response.status);
      const listing = await response.json();
      file = listing.results?.[0] || null;
      if (file) break;
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    if (!file?.download_url) throw new Error("GWOSC has no text strain file for this selection.");
    const strainResponse = await fetch(file.download_url, {
      signal: controller.signal, headers: { Accept: "text/plain, application/gzip" },
    });
    if (!strainResponse.ok) throw new Error("GWOSC strain download returned HTTP " + strainResponse.status);
    const compressed = await qgaReadBounded(strainResponse, 4 * 1024 * 1024);
    let bytes = compressed;
    if (file.download_url.endsWith(".gz")) {
      if (!window.DecompressionStream) throw new Error("This browser cannot decompress GWOSC text data.");
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
      bytes = await qgaReadBounded(new Response(stream), 12 * 1024 * 1024);
    }
    const text = new TextDecoder().decode(bytes);
    const values = text.split(/\r?\n/)
      .map((line) => Number(line.trim())).filter(Number.isFinite);
    if (!values.length) throw new Error("GWOSC strain file contained no numeric samples.");
    const sampleRate = file.sample_rate_kHz * 1000;
    const sourceStart = Number(file.gps_start);
    const sourceStop = sourceStart + Number(file.duration);
    const selectedStart = Math.max(Number(start), sourceStart);
    const selectedStop = Math.min(Number(start) + Number(duration), sourceStop);
    if (!(selectedStop > selectedStart)) throw new Error("Selected GPS range is outside the GWOSC strain file.");
    const from = Math.max(0, Math.floor((selectedStart - sourceStart) * sampleRate));
    const to = Math.min(values.length, Math.ceil((selectedStop - sourceStart) * sampleRate));
    const selectedValues = values.slice(from, to);
    const maxSamples = 1200;
    const stride = Math.max(1, Math.ceil(selectedValues.length / maxSamples));
    const samples = selectedValues.filter((_, index) => index % stride === 0).slice(0, maxSamples);
    return {
      ok: true, event, detector, start: selectedStart, duration: selectedStop - selectedStart, sampleRate,
      samples, provenance: {
        source: "GWOSC API v2 strain-files", url: filesUrl, downloadUrl: file.download_url,
        retrievedAt: new Date().toISOString(), mode: "real-strain",
        processing: "4 kHz calibrated TXT, gzip decoded, uniformly downsampled for preview",
      },
    };
  } finally { clearTimeout(timer); }
}

window.QGA_FETCH_GWOSC = qgaFetchGWOSC;

async function bootstrap() {
  try {
    const { threeCompatibility } = await import("./render/three-runtime.mjs");
    Object.defineProperty(window, "THREE", { value: threeCompatibility, configurable: true });

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

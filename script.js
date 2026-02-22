(() => {
  function loadScript(sourcePath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = sourcePath;
      script.defer = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${sourcePath}`));
      document.head.appendChild(script);
    });
  }

  function getRuntimeConfig() {
    return (typeof config !== "undefined" && config && config.runtime) || {};
  }

  function getModuleScripts(runtimeConfig) {
    if (Array.isArray(runtimeConfig.scripts) && runtimeConfig.scripts.length > 0) {
      return runtimeConfig.scripts;
    }
    return [runtimeConfig.entryScript || "./src/app.js"];
  }

  async function loadScriptsSequentially(scripts) {
    for (const scriptPath of scripts) {
      await loadScript(scriptPath);
    }
  }

  async function bootstrap() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const runtimeModeOverride = (urlParams.get("runtime") || "").toLowerCase();
      const host = (window.location.hostname || "").toLowerCase();
      const isLocalhost =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "::1" ||
        host.endsWith(".localhost");
      const runtimeConfig = getRuntimeConfig();
      const runtimeBundle =
        typeof runtimeConfig.bundle === "string" ? runtimeConfig.bundle.trim() : "";
      const moduleScripts = getModuleScripts(runtimeConfig);
      const allowBundleFallback = runtimeConfig.bundleFallbackToModules !== false;

      const defaultRuntimeMode = isLocalhost ? "modules" : "bundle";
      const selectedRuntimeMode =
        runtimeModeOverride === "bundle" || runtimeModeOverride === "modules"
          ? runtimeModeOverride
          : defaultRuntimeMode;

      const shouldUseBundle = selectedRuntimeMode === "bundle" && runtimeBundle;

      if (!shouldUseBundle) {
        await loadScriptsSequentially(moduleScripts);
        return;
      }

      try {
        await loadScriptsSequentially([runtimeBundle]);
      } catch (bundleError) {
        const canFallback =
          runtimeModeOverride !== "bundle" &&
          allowBundleFallback &&
          moduleScripts.length > 0;
        if (!canFallback) {
          throw bundleError;
        }

        console.warn(
          "Bundle load failed, falling back to module runtime:",
          bundleError,
        );
        await loadScriptsSequentially(moduleScripts);
      }
    } catch (error) {
      console.error("Failed to bootstrap app", error);
    }
  }

  bootstrap();
})();

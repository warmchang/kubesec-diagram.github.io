window.createSvgLoaderService = function createSvgLoaderService(deps) {
  async function loadDiagram(diagramSourcePath) {
    try {
      const response = await fetch(diagramSourcePath, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} while loading ${diagramSourcePath}`);
      }

      const svgMarkup = await response.text();
      deps.image.innerHTML = svgMarkup;

      const svgEl = deps.image.querySelector("svg");
      if (!svgEl) {
        throw new Error("Loaded diagram is not a valid SVG");
      }

      svgEl.setAttribute("preserveAspectRatio", "xMinYMin meet");
      svgEl.style.display = "block";
      svgEl.style.width = "100%";
      svgEl.style.height = "100%";
      svgEl.style.pointerEvents = "auto";

      let nextAspectRatio = null;
      const viewBox = svgEl.getAttribute("viewBox");
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(Number);
        if (
          parts.length === 4 &&
          Number.isFinite(parts[2]) &&
          Number.isFinite(parts[3]) &&
          parts[2] > 0 &&
          parts[3] > 0
        ) {
          nextAspectRatio = parts[2] / parts[3];
        }
      }

      deps.setDiagramAspectRatio(nextAspectRatio);
      deps.syncDiagramSize();
      deps.initializeSvgPropertyAnnotations();
      deps.initializeTagControls();
      deps.updateFilterPanelLayout();
      requestAnimationFrame(() => deps.handleImageLoad());
    } catch (error) {
      deps.handleImageError(error);
    }
  }

  return {
    loadDiagram,
  };
};

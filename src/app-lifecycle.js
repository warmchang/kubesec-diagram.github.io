window.createAppLifecycleService = function createAppLifecycleService(deps) {
  function showLoadingState() {
    return deps.showLoadingOverlay();
  }

  function hideLoadingState() {
    deps.hideLoadingOverlay();
  }

  function showError(message, isRetryable = false) {
    deps.showErrorOverlay(message, isRetryable);
  }

  function handleImageLoad() {
    try {
      hideLoadingState();
      deps.syncDiagramSize();

      deps.setCurrentZoom(1);
      deps.centerImageAtCurrentZoom();
      deps.image.style.transform = `matrix(${deps.getCurrentZoom()}, 0, 0, ${deps.getCurrentZoom()}, ${deps.getImageTranslateX()}, ${deps.getImageTranslateY()})`;
      deps.image.style.cursor = "default";

      deps.renderAllMarkers();
      deps.setFilterPanelOpen(deps.getFilterPanelOpen());
    } catch (error) {
      hideLoadingState();
      console.error("Error during image load handling:", error);
      showError("Failed to initialize annotations");
    }
  }

  function handleImageError(error) {
    hideLoadingState();
    deps.clearUserAnnotationVisuals();
    console.error("Failed to load image:", deps.getDiagramSourcePath(), error || "Unknown error");
    showError(
      "Failed to load diagram image. Please check your connection and try refreshing the page.",
    );
  }

  async function start() {
    showLoadingState();
    await deps.loadDiagram();
  }

  return {
    showLoadingState,
    hideLoadingState,
    showError,
    handleImageLoad,
    handleImageError,
    start,
  };
};

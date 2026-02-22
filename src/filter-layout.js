window.createFilterLayoutService = function createFilterLayoutService(deps) {
  function getPanelWidthPx() {
    if (window.innerWidth <= 768) {
      return window.innerWidth;
    }

    const panelRect = deps.filterPanel.getBoundingClientRect();
    if (panelRect.width > 0) return panelRect.width;

    return Math.min(420, window.innerWidth * 0.92);
  }

  function updateLayout(filterPanelOpen) {
    const panelWidth = getPanelWidthPx();
    const canDockPanel =
      window.innerWidth > 768 &&
      (window.innerWidth - panelWidth) >= deps.getFilterDockMinImageWidth();

    const filterPanelOverlayMode = !(filterPanelOpen && canDockPanel);

    document.body.classList.toggle(
      "filter-overlay-open",
      filterPanelOpen && filterPanelOverlayMode,
    );
    document.body.classList.toggle(
      "filter-docked-open",
      filterPanelOpen && !filterPanelOverlayMode,
    );
    deps.filterPanelBackdrop.classList.toggle(
      "open",
      filterPanelOpen && filterPanelOverlayMode,
    );

    const panelSpace =
      filterPanelOpen && !filterPanelOverlayMode
        ? `${Math.ceil(panelWidth)}px`
        : "0px";
    document.documentElement.style.setProperty("--filter-panel-space", panelSpace);

    if (deps.getDiagramAspectRatio()) {
      deps.syncDiagramSize();
      deps.updateImageTransform();
    }

    return filterPanelOverlayMode;
  }

  return {
    getPanelWidthPx,
    updateLayout,
  };
};

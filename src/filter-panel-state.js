window.createFilterPanelStateService = function createFilterPanelStateService(deps) {
  function setFilterPanelOpen(open) {
    const isOpen = Boolean(open);
    deps.setFilterPanelOpenState(isOpen);

    document.body.classList.toggle("filter-panel-open", isOpen);
    deps.filterPanel.classList.toggle("open", isOpen);
    deps.filterPanel.setAttribute("aria-hidden", isOpen ? "false" : "true");
    deps.openFilterPanelBtn.classList.toggle("active", isOpen);

    updateFilterPanelLayout();

    if (isOpen) {
      setTimeout(() => deps.filterSearchInput.focus(), 80);
    } else {
      deps.clearFilterHighlight();
    }

    deps.updateURLState();
  }

  function getFilterPanelWidthPx() {
    return deps.getPanelWidthPx();
  }

  function updateFilterPanelLayout() {
    const overlayMode = deps.updateLayout(deps.getFilterPanelOpenState());
    deps.setFilterPanelOverlayMode(overlayMode);
  }

  return {
    setFilterPanelOpen,
    getFilterPanelWidthPx,
    updateFilterPanelLayout,
  };
};

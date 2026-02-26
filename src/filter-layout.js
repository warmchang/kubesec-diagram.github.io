window.createFilterLayoutService = function createFilterLayoutService(deps) {
  let panelSpaceAnimationFrame = null;

  function captureViewportAnchor() {
    if (!deps.wrapper || !deps.image) return null;
    const wrapperRect = deps.wrapper.getBoundingClientRect();
    const imageRect = deps.image.getBoundingClientRect();
    if (!wrapperRect || !imageRect || imageRect.width <= 0 || imageRect.height <= 0) {
      return null;
    }

    const centerX = wrapperRect.left + wrapperRect.width / 2;
    const centerY = wrapperRect.top + wrapperRect.height / 2;
    return {
      nx: (centerX - imageRect.left) / imageRect.width,
      ny: (centerY - imageRect.top) / imageRect.height,
    };
  }

  function restoreViewportAnchor(anchor) {
    if (!anchor || !deps.wrapper || !deps.image) return;
    const wrapperRect = deps.wrapper.getBoundingClientRect();
    const imageRect = deps.image.getBoundingClientRect();
    if (!wrapperRect || !imageRect || imageRect.width <= 0 || imageRect.height <= 0) {
      return;
    }

    const centerX = wrapperRect.left + wrapperRect.width / 2;
    const centerY = wrapperRect.top + wrapperRect.height / 2;
    const targetX = imageRect.left + imageRect.width * anchor.nx;
    const targetY = imageRect.top + imageRect.height * anchor.ny;
    const deltaX = centerX - targetX;
    const deltaY = centerY - targetY;

    deps.setImageTranslateX(deps.getImageTranslateX() + deltaX);
    deps.setImageTranslateY(deps.getImageTranslateY() + deltaY);
  }

  function readCurrentPanelSpacePx() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--filter-panel-space");
    const numeric = Number.parseFloat(raw);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function writePanelSpacePx(value) {
    const px = Math.max(0, Number(value) || 0);
    document.documentElement.style.setProperty("--filter-panel-space", `${Math.round(px)}px`);
  }

  function applyPanelSpaceWithLayout(panelSpacePx, options = {}) {
    writePanelSpacePx(panelSpacePx);

    if (deps.getDiagramAspectRatio()) {
      const anchor = options.anchor || null;
      deps.syncDiagramSize();
      if (anchor) {
        restoreViewportAnchor(anchor);
      }
      if (!options.skipImageTransform) {
        deps.updateImageTransform();
      }
    }
  }

  function animatePanelSpaceTo(targetPanelSpacePx, options = {}) {
    const duration = 400;
    const startPanelSpacePx = readCurrentPanelSpacePx();
    const delta = targetPanelSpacePx - startPanelSpacePx;

    if (panelSpaceAnimationFrame) {
      cancelAnimationFrame(panelSpaceAnimationFrame);
      panelSpaceAnimationFrame = null;
    }

    if (Math.abs(delta) < 0.5 || options.disableAnimation) {
      applyPanelSpaceWithLayout(targetPanelSpacePx, options);
      return;
    }

    const anchor = options.preserveView ? captureViewportAnchor() : null;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const panelSpacePx = startPanelSpacePx + delta * eased;

      applyPanelSpaceWithLayout(panelSpacePx, {
        ...options,
        anchor,
      });

      if (t < 1) {
        panelSpaceAnimationFrame = requestAnimationFrame(step);
      } else {
        panelSpaceAnimationFrame = null;
        applyPanelSpaceWithLayout(targetPanelSpacePx, {
          ...options,
          anchor,
        });
      }
    };

    panelSpaceAnimationFrame = requestAnimationFrame(step);
  }

  function getPanelWidthPx() {
    if (window.innerWidth <= 768) {
      return window.innerWidth;
    }

    const panelRect = deps.filterPanel.getBoundingClientRect();
    if (panelRect.width > 0) return panelRect.width;

    return Math.min(420, window.innerWidth * 0.92);
  }

  function updateLayout(filterPanelOpen, options = {}) {
    const skipImageTransform = Boolean(options.skipImageTransform);
    const fitAllMode = typeof deps.getFitAllMode === "function" ? deps.getFitAllMode() : false;
    const preserveView =
      typeof options.preserveView === "boolean" ? options.preserveView : !fitAllMode;
    const disablePanelAnimation = Boolean(options.disablePanelAnimation);
    const panelWidth = getPanelWidthPx();
    const canDockPanel = window.innerWidth > 768;

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
    const targetPanelSpacePx = Number.parseFloat(panelSpace) || 0;

    animatePanelSpaceTo(targetPanelSpacePx, {
      preserveView,
      disableAnimation: disablePanelAnimation,
      skipImageTransform,
    });

    return filterPanelOverlayMode;
  }

  return {
    getPanelWidthPx,
    updateLayout,
  };
};

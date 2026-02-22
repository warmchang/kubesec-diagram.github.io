window.createUserAnnotationRenderService = function createUserAnnotationRenderService(
  deps,
) {
  function clearUserAnnotationVisuals() {
    document.querySelectorAll(".marker").forEach((el) => {
      if (el.parentElement) el.parentElement.remove();
    });
    document
      .querySelectorAll(".user-annotation-wrapper")
      .forEach((el) => el.remove());
    document
      .querySelectorAll(".tooltip-box:not(.svg-property-tooltip)")
      .forEach((el) => el.remove());

    document.querySelectorAll(".area-annotation").forEach((el) => {
      if (el.parentElement) el.parentElement.remove();
    });

    deps.getUserAnnotations().forEach((ann) => {
      delete ann._el;
      delete ann._tooltip;
      delete ann._index;
    });
  }

  function createAnnotationTooltip(ann) {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip-box user-annotation-tooltip";

    const description = ann.description && ann.description.trim();
    if (description) {
      tooltip.innerHTML = `<b>${deps.escapeHTML(ann.title)}</b><br><br>${deps.processUserDescription(ann.description)}`;
    } else {
      tooltip.innerHTML = `<b>${deps.escapeHTML(ann.title)}</b>`;
    }

    tooltip.style.display = "none";
    tooltip.style.whiteSpace = "pre-wrap";
    deps.tooltipLayer.appendChild(tooltip);
    return tooltip;
  }

  function renderPointAnnotation(ann, index, style) {
    const wrapperEl = document.createElement("div");
    wrapperEl.className = "user-annotation-wrapper";
    wrapperEl.style.position = "absolute";
    wrapperEl.style.transform = "translate(-50%, -50%)";
    wrapperEl.style.zIndex = "15";

    const marker = document.createElement("div");
    marker.className = "marker user-annotation-marker";
    marker.style.background = style.bg;
    marker.style.color = style.color;

    const shape = ann.shape || "rectangle";
    marker.style.borderRadius = shape === "circle" ? "50%" : "8px";
    marker.style.borderColor = style.border;
    marker.style.borderWidth = style.borderWidth || "3px";
    marker.style.borderStyle = style.borderStyle || "solid";
    marker.style.cursor = deps.getEditModeEnabled() ? "move" : "pointer";
    marker.setAttribute("data-user-index", index);

    const tooltip = createAnnotationTooltip(ann);

    wrapperEl.offsetHeight;
    deps.addPointAnnotationHoverEvents(wrapperEl, tooltip, ann);
    deps.addUserAnnotationDragListeners(wrapperEl, marker, index);

    wrapperEl.appendChild(marker);
    deps.wrapper.appendChild(wrapperEl);

    ann._el = wrapperEl;
    ann._tooltip = tooltip;
    ann._index = index;
  }

  function renderAreaAnnotation(ann, index, style) {
    const wrapperEl = document.createElement("div");
    wrapperEl.className = "user-annotation-wrapper area-annotation-wrapper";
    wrapperEl.style.position = "absolute";
    wrapperEl.style.zIndex = "5";

    const areaElement = document.createElement("div");
    const shape = ann.shape || "rectangle";
    areaElement.className = `area-annotation ${shape}`;
    areaElement.style.background = style.bg;
    areaElement.style.borderColor = style.border;
    areaElement.style.borderWidth = style.borderWidth || "3px";
    areaElement.style.borderStyle = style.borderStyle || "solid";

    const bounds = deps.getImageBounds(true);
    const widthRel = ann.widthRel;
    const heightRel = ann.heightRel;
    areaElement.style.width = `${widthRel * bounds.width}px`;
    areaElement.style.height = `${heightRel * bounds.height}px`;
    areaElement.style.cursor = deps.getEditModeEnabled() ? "move" : "pointer";
    areaElement.style.pointerEvents = deps.getEditModeEnabled() ? "auto" : "none";
    areaElement.setAttribute("data-user-index", index);

    if (deps.getEditModeEnabled()) {
      areaElement.classList.add("edit-mode");
      deps.addAreaResizeHandles(areaElement, ann, index);
    }

    const tooltip = createAnnotationTooltip(ann);
    areaElement.offsetHeight;
    deps.addAreaAnnotationHoverEvents(areaElement, tooltip, ann);
    deps.addAreaAnnotationDragListeners(wrapperEl, areaElement, index);

    wrapperEl.appendChild(areaElement);
    deps.wrapper.appendChild(wrapperEl);

    ann._el = wrapperEl;
    ann._tooltip = tooltip;
    ann._index = index;
  }

  function renderUserAnnotationMarkers() {
    deps.getUserAnnotations().forEach((ann, index) => {
      const style = deps.getUserAnnotationStyle(ann.type);
      if (!style) return;

      if (style.annotationType === "area") {
        renderAreaAnnotation(ann, index, style);
      } else {
        renderPointAnnotation(ann, index, style);
      }
    });
  }

  function renderAllMarkers() {
    clearUserAnnotationVisuals();

    if (!deps.image.querySelector("svg")) {
      return;
    }

    deps.applyAnnotationFilter();
    renderUserAnnotationMarkers();
    requestAnimationFrame(() => {
      deps.scheduleMarkerPositioning();
    });
  }

  return {
    clearUserAnnotationVisuals,
    renderAllMarkers,
    renderUserAnnotationMarkers,
    renderPointAnnotation,
    renderAreaAnnotation,
    createAnnotationTooltip,
  };
};

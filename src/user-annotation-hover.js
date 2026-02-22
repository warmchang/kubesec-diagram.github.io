window.createUserAnnotationHoverService = function createUserAnnotationHoverService(
  deps,
) {
  function addPointAnnotationHoverEvents(wrapperEl, tooltip, ann) {
    let hideTimeout;

    wrapperEl.addEventListener("mouseenter", () => {
      if (deps.getEditModeEnabled()) return;

      clearTimeout(hideTimeout);
      deps.tooltipService.showForUserAnnotation(tooltip, ann);
    });

    wrapperEl.addEventListener("mouseleave", () => {
      hideTimeout = setTimeout(
        () => (tooltip.style.display = "none"),
        deps.getTooltipHideDelay(),
      );
    });

    wrapperEl.addEventListener("touchstart", (e) => {
      if (deps.getEditModeEnabled()) return;

      if (e.cancelable) e.preventDefault();
      clearTimeout(hideTimeout);
      deps.tooltipService.showForUserAnnotation(tooltip, ann);
    });

    document.addEventListener("touchstart", (e) => {
      if (!wrapperEl.contains(e.target) && !tooltip.contains(e.target)) {
        tooltip.style.display = "none";
        clearTimeout(hideTimeout);
      }
    });

    tooltip.addEventListener("mouseenter", () => clearTimeout(hideTimeout));
    tooltip.addEventListener("mouseleave", () => {
      hideTimeout = setTimeout(
        () => (tooltip.style.display = "none"),
        deps.getTooltipHideDelay(),
      );
    });
  }

  function addAreaAnnotationHoverEvents(areaElement, tooltip, ann) {
    let hideTimeout;
    const borderWidth =
      Number.parseInt(getComputedStyle(areaElement).borderWidth, 10) || 3;
    const tolerance = deps.getAreaHoverTolerance();
    const hitboxSize = Math.max(4, borderWidth + tolerance);

    const createBorderHitbox = (edge) => {
      const hitbox = document.createElement("div");
      hitbox.className = `area-border-hitbox area-border-hitbox-${edge}`;
      hitbox.style.position = "absolute";
      hitbox.style.zIndex = "1";
      hitbox.style.background = "transparent";
      hitbox.style.pointerEvents = "auto";

      if (edge === "top") {
        hitbox.style.left = "0";
        hitbox.style.top = "0";
        hitbox.style.width = "100%";
        hitbox.style.height = `${hitboxSize}px`;
      } else if (edge === "right") {
        hitbox.style.right = "0";
        hitbox.style.top = "0";
        hitbox.style.width = `${hitboxSize}px`;
        hitbox.style.height = "100%";
      } else if (edge === "bottom") {
        hitbox.style.left = "0";
        hitbox.style.bottom = "0";
        hitbox.style.width = "100%";
        hitbox.style.height = `${hitboxSize}px`;
      } else {
        hitbox.style.left = "0";
        hitbox.style.top = "0";
        hitbox.style.width = `${hitboxSize}px`;
        hitbox.style.height = "100%";
      }

      hitbox.addEventListener("mouseenter", (e) => {
        if (deps.getEditModeEnabled()) return;
        clearTimeout(hideTimeout);
        deps.tooltipService.showAtPointer(tooltip, ann, e);
      });

      hitbox.addEventListener("mousemove", (e) => {
        if (deps.getEditModeEnabled()) return;
        clearTimeout(hideTimeout);
        deps.tooltipService.showAtPointer(tooltip, ann, e);
      });

      hitbox.addEventListener("mouseleave", () => {
        hideTimeout = setTimeout(
          () => (tooltip.style.display = "none"),
          deps.getTooltipHideDelay(),
        );
      });

      hitbox.addEventListener("touchstart", (e) => {
        if (deps.getEditModeEnabled()) return;
        if (e.cancelable) e.preventDefault();
        clearTimeout(hideTimeout);
        deps.tooltipService.showAtPointer(
          tooltip,
          ann,
          e.touches && e.touches[0] ? e.touches[0] : e,
        );
      });

      return hitbox;
    };

    ["top", "right", "bottom", "left"].forEach((edge) => {
      areaElement.appendChild(createBorderHitbox(edge));
    });

    tooltip.addEventListener("mouseenter", () => clearTimeout(hideTimeout));
    tooltip.addEventListener("mouseleave", () => {
      hideTimeout = setTimeout(
        () => (tooltip.style.display = "none"),
        deps.getTooltipHideDelay(),
      );
    });
  }

  return {
    addPointAnnotationHoverEvents,
    addAreaAnnotationHoverEvents,
  };
};

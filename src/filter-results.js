window.createFilterResultsService = function createFilterResultsService(deps) {
  let pinnedSectionCollapsed = false;

  function getRecordSlug(record) {
    return `${record && record.slug ? record.slug : ""}`.trim();
  }

  function isRecordPinned(record) {
    const slug = getRecordSlug(record);
    if (!slug) return false;
    return deps.getPinnedHelpSlugs().has(slug);
  }

  function togglePinnedRecord(record) {
    const slug = getRecordSlug(record);
    if (!slug) return;

    const nextPinned = new Set(deps.getPinnedHelpSlugs());
    if (nextPinned.has(slug)) {
      nextPinned.delete(slug);
    } else {
      nextPinned.add(slug);
    }

    deps.setPinnedHelpSlugs(nextPinned);
    deps.onPinnedStateChanged();
    applyAnnotationFilter();
  }

  function formatHiddenReason(hiddenTags) {
    const tags = Array.isArray(hiddenTags) ? hiddenTags.filter(Boolean) : [];
    if (tags.length === 0) {
      return "Hidden because one or more required tags are filtered out.";
    }
    if (tags.length === 1) {
      return `Hidden because tag \"${tags[0]}\" is filtered out.`;
    }
    const quoted = tags.map((tag) => `\"${tag}\"`).join(", ");
    return `Hidden because tags ${quoted} are filtered out.`;
  }

  function createResultItem(record, options = {}) {
    const inactive = Boolean(options.inactive);
    const hiddenReason = inactive ? formatHiddenReason(options.hiddenTags) : "";
    const item = document.createElement("div");
    item.className = "filter-result-item";
    item.tabIndex = inactive ? -1 : 0;
    item.setAttribute("aria-disabled", inactive ? "true" : "false");
    if (inactive) {
      item.classList.add("is-inactive");
    }

    const tagsHtml = deps.buildTagBadgesHtml(record.tags || []);
    item.classList.add(deps.getSeverityClassForTags(record.tags || []));
    deps.applySeverityStyleToElement(item, record.tags || []);

    const slug = getRecordSlug(record);
    const pinned = isRecordPinned(record);
    const pinTitle = pinned ? "Unpin" : "Pin";
    const pinStateClass = pinned ? "is-pinned" : "";
    const pinButtonHtml =
      slug.length > 0
        ? `<button type="button" class="result-pin-btn ${pinStateClass}" data-role="pin" title="${pinTitle}" aria-label="${pinTitle}">📌 ${pinTitle}</button>`
        : "";

    const hiddenStateHtml = inactive
      ? `<div class="filter-result-state" role="note" aria-live="polite">${deps.escapeHTML(hiddenReason)}</div>`
      : "";
    const actionsHtml =
      hiddenStateHtml || pinButtonHtml
        ? `<div class="filter-result-actions">${hiddenStateHtml}${pinButtonHtml}</div>`
        : "";
    item.innerHTML = `<div class="filter-result-head">${tagsHtml}<strong>${deps.escapeHTML(record.title || "Help")}</strong></div><div class="filter-result-content">${record.bodyHtml || "Help annotation"}</div>${actionsHtml}`;
    if (!inactive) {
      deps.bindResultHighlight(item, record);
    }

    if (slug.length > 0) {
      const pinBtn = item.querySelector('[data-role="pin"]');
      if (pinBtn) {
        pinBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          togglePinnedRecord(record);
        });
      }
    }

    return item;
  }

  function renderPinnedSection(parentFragment, pinnedEntries) {
    const section = document.createElement("section");
    section.className = "pinned-results-section";

    const header = document.createElement("div");
    header.className = "pinned-results-header";

    const title = document.createElement("strong");
    title.textContent = `Pinned (${pinnedEntries.length})`;

    const controls = document.createElement("div");
    controls.className = "pinned-results-controls";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "pinned-toggle-btn";
    toggle.textContent = pinnedSectionCollapsed ? "Show" : "Hide";
    toggle.addEventListener("click", () => {
      pinnedSectionCollapsed = !pinnedSectionCollapsed;
      applyAnnotationFilter();
    });

    const onlyPinnedToggle = document.createElement("button");
    onlyPinnedToggle.type = "button";
    onlyPinnedToggle.className = "pinned-toggle-btn";
    onlyPinnedToggle.textContent = deps.getOnlyShowPinned()
      ? "Show all"
      : "Only show pinned";
    onlyPinnedToggle.addEventListener("click", () => {
      deps.setOnlyShowPinned(!deps.getOnlyShowPinned());
      deps.onConstraintStateChanged();
      applyAnnotationFilter();
    });

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "pinned-toggle-btn";
    clearBtn.textContent = "Clear";
    clearBtn.disabled = pinnedEntries.length === 0;
    clearBtn.addEventListener("click", () => {
      deps.setPinnedHelpSlugs(new Set());
      deps.setOnlyShowPinned(false);
      deps.onPinnedStateChanged();
      applyAnnotationFilter();
    });

    header.appendChild(title);
    controls.appendChild(onlyPinnedToggle);
    controls.appendChild(clearBtn);
    controls.appendChild(toggle);
    header.appendChild(controls);
    section.appendChild(header);

    if (!pinnedSectionCollapsed) {
      const pinnedList = document.createElement("div");
      pinnedList.className = "pinned-results-list";
      pinnedEntries.forEach((entry) => {
        pinnedList.appendChild(
          createResultItem(entry.record, { inactive: entry.inactive, hiddenTags: entry.hiddenTags }),
        );
      });
      section.appendChild(pinnedList);
    }

    parentFragment.appendChild(section);
  }

  function renderFilterResults(query) {
    const fragment = document.createDocumentFragment();
    const onlyShowPinned = deps.getOnlyShowPinned();

    const allHelp = deps.getSvgHelpRecords();
    const matchingHelp = allHelp.filter(
      (record) =>
        onlyShowPinned
          ? isRecordPinned(record)
          : deps.helpMatchesSearch(record, query) && deps.isTagSetVisible(record.tags),
    );

    function getEntryTags(entry) {
      return entry.record.tags || [];
    }

    function getPrimarySortTag(entry) {
      const sortedTags = deps.getSortedVisibleTags(getEntryTags(entry));
      return sortedTags[0] || "";
    }

    const sortedEntries = [
      ...matchingHelp.map((record) => ({ kind: "help", title: record.title || "", record })),
    ].sort((a, b) => {
      const primaryTagA = getPrimarySortTag(a);
      const primaryTagB = getPrimarySortTag(b);

      if (primaryTagA && primaryTagB) {
        const tagComparison = deps.compareTagsByFilterOrder(primaryTagA, primaryTagB);
        if (tagComparison !== 0) return tagComparison;
      } else if (primaryTagA || primaryTagB) {
        return primaryTagA ? -1 : 1;
      }

      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    });

    const allEntriesBySlug = new Map();
    allHelp.forEach((record) => {
      const slug = getRecordSlug(record);
      if (!slug || allEntriesBySlug.has(slug)) return;
      allEntriesBySlug.set(slug, { kind: "help", title: record.title || "", record });
    });

    const pinnedEntries = Array.from(deps.getPinnedHelpSlugs())
      .map((slug) => allEntriesBySlug.get(`${slug || ""}`.trim()))
      .filter(Boolean)
      .map((entry) => {
        const hiddenTags = deps.getHiddenDisableTags(entry.record.tags || []);
        return {
          ...entry,
          inactive: hiddenTags.length > 0,
          hiddenTags,
        };
      })
      .sort((a, b) => {
        const primaryTagA = getPrimarySortTag(a);
        const primaryTagB = getPrimarySortTag(b);

        if (primaryTagA && primaryTagB) {
          const tagComparison = deps.compareTagsByFilterOrder(primaryTagA, primaryTagB);
          if (tagComparison !== 0) return tagComparison;
        } else if (primaryTagA || primaryTagB) {
          return primaryTagA ? -1 : 1;
        }

        return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      });
    const regularEntries = onlyShowPinned
      ? []
      : sortedEntries.filter((entry) => !isRecordPinned(entry.record));

    deps.clearFilterHighlight();

    if (pinnedEntries.length > 0) {
      renderPinnedSection(fragment, pinnedEntries);

      if (regularEntries.length > 0) {
        const divider = document.createElement("div");
        divider.className = "pinned-results-divider";
        divider.textContent = "Matches";
        fragment.appendChild(divider);
      }
    }

    regularEntries.forEach((entry) => {
      fragment.appendChild(createResultItem(entry.record));
    });

    if (onlyShowPinned && pinnedEntries.length === 0) {
      const noPinned = document.createElement("div");
      noPinned.className = "filter-result-item";
      noPinned.innerHTML = "<strong>No pinned items</strong><small>Pin annotations to focus them here.</small>";
      fragment.appendChild(noPinned);
    } else if (matchingHelp.length === 0) {
      const noMatches = document.createElement("div");
      noMatches.className = "filter-result-item";
      noMatches.innerHTML = "<strong>No matches</strong><small>Try another search term.</small>";
      fragment.appendChild(noMatches);
    }

    deps.filterResults.innerHTML = "";
    deps.filterResults.appendChild(fragment);

    return {
      helpVisible: matchingHelp.length,
      helpTotal: deps.getSvgHelpRecords().length,
    };
  }

  function applyAnnotationFilter() {
    const query = deps.normalizeQuery(deps.getAnnotationSearchQuery());
    if (deps.getOnlyShowPinned() && deps.getPinnedHelpSlugs().size === 0) {
      deps.setOnlyShowPinned(false);
      deps.onConstraintStateChanged();
    }
    const onlyShowPinned = deps.getOnlyShowPinned();
    deps.setFilterControlsDisabled(onlyShowPinned);

    deps.getSvgHelpRecords().forEach((record) => {
      if (onlyShowPinned) {
        record.searchMatch = isRecordPinned(record);
      } else {
        const matchesQuery = deps.helpMatchesSearch(record, query);
        record.searchMatch = matchesQuery;
      }
      deps.updateSvgElementVisibility(record.element);
    });

    const summary = renderFilterResults(query);
    deps.updateFilterResultSummary(
      summary.helpVisible,
      summary.helpTotal,
      onlyShowPinned ? "" : query,
    );
  }

  return {
    renderFilterResults,
    applyAnnotationFilter,
  };
};

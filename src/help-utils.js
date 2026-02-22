window.createHelpUtilsService = function createHelpUtilsService(deps) {
  function normalizeQuery(query) {
    return (query || "").trim().toLowerCase();
  }

  function helpMatchesSearch(record, query) {
    if (!query) return true;
    return record.searchText.includes(query);
  }

  function parseHelpContent(rawText) {
    if (!rawText || typeof rawText !== "string") return null;

    const normalized = rawText.replace(/\r\n?/g, "\n").trim();
    if (!normalized) return null;

    const lines = normalized.split("\n");
    const firstContentIndex = lines.findIndex((line) => line.trim().length > 0);
    if (firstContentIndex === -1) return null;

    const title = lines[firstContentIndex].trim();
    const bodyRaw = lines.slice(firstContentIndex + 1).join("\n");
    const bodyHtml = deps.cleanMultiline(bodyRaw).trim();

    return {
      title,
      bodyHtml,
      searchText: `${title}\n${bodyRaw}`.toLowerCase(),
    };
  }

  function getFilterResultSummary(helpVisible, helpTotal, query) {
    const total = helpTotal;
    const totalMatches = helpVisible;

    if (query) {
      return `${totalMatches} match${totalMatches === 1 ? "" : "es"} for \"${query}\"`;
    }

    if (totalMatches === total) {
      return `Showing all annotations (${total})`;
    }

    return `Showing ${totalMatches} of ${total} annotations`;
  }

  return {
    normalizeQuery,
    helpMatchesSearch,
    parseHelpContent,
    getFilterResultSummary,
  };
};

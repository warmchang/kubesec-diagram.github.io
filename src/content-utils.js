window.createContentUtilsService = function createContentUtilsService(deps) {
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
  }

  function cleanMultiline(str) {
    if (!str) return "";

    const raw = str.replace(/^\s*\n/, "").trimEnd();
    const lines = raw.split("\n");

    const indent = lines
      .filter((line) => line.trim())
      .map((line) => line.match(/^(\s*)/)?.[1].length || 0)
      .reduce((a, b) => Math.min(a, b), Infinity);

    return lines.map((line) => line.slice(indent)).join("<br>");
  }

  function sanitizeUserHtml(html) {
    if (!html) return "";

    const allowedTags = deps.getAllowedHtmlTags();
    const whitelist = deps.getHtmlWhitelist();

    const div = document.createElement("div");
    div.innerHTML = html;

    function cleanNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        if (allowedTags.includes(tagName)) {
          const allowedAttrs = whitelist[tagName] || [];
          let result = `<${tagName}`;

          for (const attr of allowedAttrs) {
            if (node.hasAttribute(attr)) {
              result += ` ${attr}="${escapeHTML(node.getAttribute(attr))}"`;
            }
          }

          result += ">";

          for (const child of node.childNodes) {
            result += cleanNode(child);
          }

          if (!["br", "hr"].includes(tagName)) {
            result += `</${tagName}>`;
          }

          return result;
        }

        let result = "";
        for (const child of node.childNodes) {
          result += cleanNode(child);
        }
        return result;
      }

      return "";
    }

    let result = "";
    for (const child of div.childNodes) {
      result += cleanNode(child);
    }

    return result;
  }

  function processUserDescription(text) {
    if (!text) return "";
    const withBreaks = text.replace(/\n/g, "<br>");
    return sanitizeUserHtml(withBreaks);
  }

  return {
    escapeHTML,
    cleanMultiline,
    sanitizeUserHtml,
    processUserDescription,
  };
};

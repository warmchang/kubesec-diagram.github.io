window.createLoadFeedbackService = function createLoadFeedbackService(deps) {
  function showLoadingState() {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = deps.getLoadingIndicatorId();
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 12000;
        font-family: sans-serif;
        text-align: center;
    `;
    const loadingMessage = deps.getLoadingMessage();
    loadingDiv.innerHTML = `
        <div style="margin-bottom: 12px;">${loadingMessage}</div>
        <div style="width: 40px; height: 40px; border: 3px solid #333; border-top: 3px solid #4fc3f7; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loadingDiv);
    return loadingDiv;
  }

  function hideLoadingState() {
    const loadingDiv = document.getElementById(deps.getLoadingIndicatorId());
    if (loadingDiv) {
      loadingDiv.parentNode.removeChild(loadingDiv);
    }
  }

  function showError(message, isRetryable = false) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(3, 7, 18, 0.45);
        z-index: 30000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
    `;

    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
        background: #ff4444;
        color: white;
        padding: 20px;
        border-radius: 8px;
        font-family: sans-serif;
        font-size: 14px;
        max-width: 400px;
        width: min(400px, 92vw);
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    const retryButton = isRetryable
      ? '<br><br><button onclick="location.reload()" style="background: #fff; color: #ff4444; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">Retry</button>'
      : "";

    errorDiv.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold;">⚠️ Error</div>
        <div>${message}</div>
        ${retryButton}
        <div style="margin-top: 12px; font-size: 12px; opacity: 0.8;"><button class="error-close-btn" style="background: #fff; color: #ff4444; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Close</button></div>
    `;

    const closeBtn = errorDiv.querySelector(".error-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        overlay.remove();
      });
    }

    overlay.appendChild(errorDiv);
    document.body.appendChild(overlay);
  }

  return {
    showLoadingState,
    hideLoadingState,
    showError,
  };
};

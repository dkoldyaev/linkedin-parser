// Job Tracker Extension Content Script
// Marks the page as having the extension installed and responds to status checks.

(function () {
  function markExtensionInstalled() {
    try {
      if (document.documentElement) {
        document.documentElement.dataset.jobTrackerExtension = "installed";
      }
      window.__JOB_TRACKER_EXTENSION_INSTALLED__ = true;

      // Broadcast custom event
      window.dispatchEvent(
        new CustomEvent("JOB_TRACKER_EXTENSION_PONG", {
          detail: { installed: true, version: "1.0.0" },
        })
      );

      // Post message for web app
      window.postMessage(
        { type: "JOB_TRACKER_EXTENSION_PONG", installed: true, version: "1.0.0" },
        "*"
      );
    } catch (err) {
      console.debug("Job Tracker content script mark error:", err);
    }
  }

  // Mark immediately
  markExtensionInstalled();

  // Re-mark on DOMContentLoaded if documentElement wasn't ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markExtensionInstalled);
  }

  // Listen to ping custom event
  window.addEventListener("JOB_TRACKER_EXTENSION_PING", markExtensionInstalled);

  // Listen to postMessage ping
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "JOB_TRACKER_EXTENSION_PING") {
      markExtensionInstalled();
    }
  });
})();

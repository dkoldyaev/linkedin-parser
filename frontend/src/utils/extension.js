// Utility for detecting whether the Job Tracker Chrome extension is installed and active.

const DISMISS_KEY = 'job_tracker_dismiss_extension_prompt';

/**
 * Pings the extension via chrome.runtime.sendMessage (manifest "externally_connectable").
 * `chrome.runtime` is only exposed to pages listed in some extension's externally_connectable.
 */
function pingExtension(extensionId, timeoutMs = 500) {
  return new Promise((resolve) => {
    const runtime = globalThis.chrome?.runtime;
    if (!extensionId || !runtime?.sendMessage) {
      resolve(false);
      return;
    }

    const timer = setTimeout(() => resolve(false), timeoutMs);
    try {
      runtime.sendMessage(extensionId, { type: 'JOB_TRACKER_PING' }, (response) => {
        clearTimeout(timer);
        // Reading lastError suppresses the "Could not establish connection" console error
        // when the extension with this ID is not installed.
        void runtime.lastError;
        resolve(response?.installed === true);
      });
    } catch {
      clearTimeout(timer);
      resolve(false);
    }
  });
}

/**
 * Checks whether the Job Tracker extension is installed.
 * 1. Backend /api/extension/status: recent heartbeat + configured extension ID
 * 2. Direct ping to the extension by ID (works even before the first heartbeat)
 */
export async function isExtensionInstalled() {
  let extensionId = null;

  try {
    const res = await fetch('/api/extension/status');
    if (res.ok) {
      const data = await res.json();
      if (data.active) return true;
      extensionId = data.extension_id;
    }
  } catch (err) {
    console.debug('Error checking extension status from API:', err);
  }

  return pingExtension(extensionId);
}

/**
 * Checks if the extension prompt should be shown.
 * Returns true if the extension is NOT installed AND the user has not permanently dismissed the prompt.
 */
export async function shouldShowExtensionPrompt() {
  if (typeof localStorage !== 'undefined') {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed === 'true') {
      return false;
    }
  }

  const installed = await isExtensionInstalled();
  return !installed;
}

/**
 * Dismisses the extension prompt.
 * If permanent is true, persists to localStorage.
 */
export function dismissExtensionPrompt(permanent = false) {
  if (permanent && typeof localStorage !== 'undefined') {
    localStorage.setItem(DISMISS_KEY, 'true');
  }
}

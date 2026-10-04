// Utility for detecting whether the Job Tracker Chrome extension is installed and active.

const DISMISS_KEY = 'job_tracker_dismiss_extension_prompt';

/**
 * Checks whether the Job Tracker extension is installed.
 * Uses 3 layers of detection:
 * 1. Immediate DOM dataset attribute set by content.js
 * 2. Ping/Pong CustomEvent / postMessage via content.js
 * 3. Backend /api/extension/status endpoint (recent heartbeat)
 */
export async function isExtensionInstalled() {
  // 1. Direct DOM check (instant, no delay)
  if (
    typeof document !== 'undefined' &&
    (document.documentElement?.dataset?.jobTrackerExtension === 'installed' ||
     window.__JOB_TRACKER_EXTENSION_INSTALLED__)
  ) {
    return true;
  }

  // 2. Event-based ping to content script
  if (typeof window !== 'undefined') {
    const eventPong = await new Promise((resolve) => {
      let settled = false;

      const onPong = () => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve(true);
        }
      };

      const onMessage = (e) => {
        if (e.data?.type === 'JOB_TRACKER_EXTENSION_PONG') {
          onPong();
        }
      };

      const cleanup = () => {
        window.removeEventListener('JOB_TRACKER_EXTENSION_PONG', onPong);
        window.removeEventListener('message', onMessage);
      };

      window.addEventListener('JOB_TRACKER_EXTENSION_PONG', onPong);
      window.addEventListener('message', onMessage);

      // Dispatch both CustomEvent and postMessage
      window.dispatchEvent(new CustomEvent('JOB_TRACKER_EXTENSION_PING'));
      window.postMessage({ type: 'JOB_TRACKER_EXTENSION_PING' }, '*');

      // Short wait for local content script
      setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve(false);
        }
      }, 100);
    });

    if (eventPong) return true;
  }

  // 3. Check with backend if the extension has pinged recently for this user
  try {
    const res = await fetch('/api/extension/status');
    if (res.ok) {
      const data = await res.json();
      if (data.active) return true;
    }
  } catch (err) {
    console.debug('Error checking extension status from API:', err);
  }

  return false;
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

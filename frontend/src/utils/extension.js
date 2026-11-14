// Utility for detecting whether the Job Tracker Chrome extension is installed, active, and up-to-date.

const DISMISS_KEY = 'job_tracker_dismiss_extension_prompt';
const DISMISSED_UPDATE_VERSION_KEY = 'job_tracker_dismiss_extension_update_version';

/**
 * Compares two semantic version strings (e.g. "1.0.7" vs "1.0.8").
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;
  const p1 = String(v1).split('.').map((x) => parseInt(x, 10) || 0);
  const p2 = String(v2).split('.').map((x) => parseInt(x, 10) || 0);
  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Pings the extension via chrome.runtime.sendMessage (manifest "externally_connectable").
 * `chrome.runtime` is only exposed to pages listed in some extension's externally_connectable.
 * Returns { installed: boolean, version: string | null }
 */
function pingExtension(extensionId, timeoutMs = 500) {
  return new Promise((resolve) => {
    const runtime = globalThis.chrome?.runtime;
    if (!extensionId || !runtime?.sendMessage) {
      resolve({ installed: false, version: null });
      return;
    }

    const timer = setTimeout(() => resolve({ installed: false, version: null }), timeoutMs);
    try {
      runtime.sendMessage(extensionId, { type: 'JOB_TRACKER_PING' }, (response) => {
        clearTimeout(timer);
        // Reading lastError suppresses the "Could not establish connection" console error
        // when the extension with this ID is not installed.
        void runtime.lastError;
        resolve({
          installed: response?.installed === true,
          version: response?.version || null,
        });
      });
    } catch {
      clearTimeout(timer);
      resolve({ installed: false, version: null });
    }
  });
}

/**
 * Fetches the changelog and latest version info from the backend.
 */
export async function getExtensionChangelog() {
  try {
    const res = await fetch('/api/v2/extension/changelog');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.debug('Error fetching extension changelog:', err);
  }
  return { latest_version: '1.0.7', releases: {} };
}

/**
 * Filters changelog items newer than currentVersion.
 */
export function getUpdatesBetween(changelogData, currentVersion, lang = 'ru') {
  if (!changelogData || !changelogData.releases) return [];
  const releases = changelogData.releases;
  const versions = Object.keys(releases).sort((a, b) => compareVersions(b, a));

  const updates = [];
  for (const ver of versions) {
    if (!currentVersion || compareVersions(ver, currentVersion) > 0) {
      const rel = releases[ver];
      const items = rel?.changes?.[lang] || rel?.changes?.['ru'] || rel?.changes?.['en'] || [];
      if (items.length > 0) {
        updates.push({
          version: ver,
          date: rel?.date,
          changes: items,
        });
      }
    }
  }
  return updates;
}

/**
 * Inspects extension status, checking if it is installed, active, and if an update is available.
 */
export async function checkExtensionStatus() {
  let extensionId = null;
  let lastKnownVersion = null;
  let activeFromBackend = false;

  try {
    const res = await fetch('/api/v2/extension/status');
    if (res.ok) {
      const data = await res.json();
      activeFromBackend = !!data.active;
      extensionId = data.extension_id;
      lastKnownVersion = data.last_known_version;
    }
  } catch (err) {
    console.debug('Error checking extension status from API:', err);
  }

  const pingResult = await pingExtension(extensionId);
  const installed = pingResult.installed || activeFromBackend;
  const currentVersion = pingResult.version || lastKnownVersion || null;

  const changelog = await getExtensionChangelog();
  const latestVersion = changelog?.latest_version || null;

  const isOutdated = !!(
    installed &&
    currentVersion &&
    latestVersion &&
    compareVersions(latestVersion, currentVersion) > 0
  );

  return {
    installed,
    currentVersion,
    latestVersion,
    isOutdated,
    changelog,
  };
}

/**
 * Checks whether the Job Tracker extension is installed.
 */
export async function isExtensionInstalled() {
  const status = await checkExtensionStatus();
  return status.installed;
}

/**
 * Checks if the extension prompt should be shown.
 * Returns an object with details:
 * {
 *   show: boolean,
 *   reason: 'not_installed' | 'outdated' | null,
 *   currentVersion: string | null,
 *   latestVersion: string | null,
 *   changelog: object | null
 * }
 */
export async function checkExtensionPromptRequirement() {
  const status = await checkExtensionStatus();

  // If not installed at all
  if (!status.installed) {
    if (typeof localStorage !== 'undefined') {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed === 'true') {
        return { show: false, reason: null, ...status };
      }
    }
    return { show: true, reason: 'not_installed', ...status };
  }

  // If installed but outdated
  if (status.isOutdated) {
    if (typeof localStorage !== 'undefined') {
      const dismissedUpdateVer = localStorage.getItem(DISMISSED_UPDATE_VERSION_KEY);
      if (dismissedUpdateVer === status.latestVersion) {
        return { show: false, reason: null, ...status };
      }
    }
    return { show: true, reason: 'outdated', ...status };
  }

  return { show: false, reason: null, ...status };
}

/**
 * Backward-compatible helper for code that just checks boolean.
 */
export async function shouldShowExtensionPrompt() {
  const res = await checkExtensionPromptRequirement();
  return res.show;
}

/**
 * Checks whether a given URL requires the browser extension to scrape.
 * Kept in sync with backend parsers where `needs_extension = True` (Upwork, Indeed).
 */
export function urlRequiresExtension(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return lower.includes('upwork.com') || lower.includes('indeed.');
}

/**
 * Checks whether any URL in a list requires the browser extension to scrape.
 */
export function anyUrlRequiresExtension(urls) {
  if (!Array.isArray(urls)) return false;
  return urls.some(urlRequiresExtension);
}

/**
 * Dismisses the extension prompt.
 * If reason is 'outdated', dismisses for this specific version.
 * If permanent is true, persists to localStorage.
 */
export function dismissExtensionPrompt(permanent = false, reason = 'not_installed', targetVersion = null) {
  if (typeof localStorage === 'undefined') return;
  if (reason === 'outdated' && targetVersion) {
    localStorage.setItem(DISMISSED_UPDATE_VERSION_KEY, targetVersion);
  } else if (permanent) {
    localStorage.setItem(DISMISS_KEY, 'true');
  }
}

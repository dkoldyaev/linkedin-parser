import { extensionApiService } from '../services/extensionApiService';

const DISMISS_KEY = 'job_tracker_dismiss_extension_prompt';
const DISMISSED_UPDATE_VERSION_KEY = 'job_tracker_dismiss_extension_update_version';

export interface ExtensionRelease {
  date?: string;
  changes?: Record<string, string[]>;
}

export interface ExtensionChangelog {
  latest_version?: string;
  releases?: Record<string, ExtensionRelease>;
}

export interface ExtensionUpdateItem {
  version: string;
  date?: string;
  changes: string[];
}

export interface ExtensionStatusInfo {
  installed: boolean;
  currentVersion: string | null;
  latestVersion: string | null;
  isOutdated: boolean;
  changelog: ExtensionChangelog | null;
}

export interface ExtensionPromptRequirement extends ExtensionStatusInfo {
  show: boolean;
  reason: 'not_installed' | 'outdated' | null;
}

interface ChromeRuntime {
  sendMessage?: (
    extensionId: string,
    message: { type: string },
    callback: (response?: { installed?: boolean; version?: string }) => void
  ) => void;
  lastError?: unknown;
}

function parseVersionParts(version: string): number[] {
  return String(version)
    .split('.')
    .map((x) => parseInt(x, 10) || 0);
}

export function compareVersions(v1?: string | null, v2?: string | null): number {
  if (!v1 || !v2) return 0;
  const p1 = parseVersionParts(v1);
  const p2 = parseVersionParts(v2);
  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const diff = (p1[i] ?? 0) - (p2[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

function getChromeRuntime(): ChromeRuntime | undefined {
  const g = globalThis as unknown as { chrome?: { runtime?: ChromeRuntime } };
  return g.chrome?.runtime;
}

function pingExtension(
  extensionId?: string | null,
  timeoutMs?: number
): Promise<{ installed: boolean; version: string | null }> {
  const waitMs = timeoutMs ?? 500;
  return new Promise((resolve) => {
    const runtime = getChromeRuntime();
    if (!extensionId || !runtime?.sendMessage) {
      resolve({ installed: false, version: null });
      return;
    }

    const timer = setTimeout(() => resolve({ installed: false, version: null }), waitMs);
    try {
      runtime.sendMessage(extensionId, { type: 'JOB_TRACKER_PING' }, (response) => {
        clearTimeout(timer);
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

export async function getExtensionChangelog(): Promise<ExtensionChangelog> {
  try {
    return await extensionApiService.getChangelog();
  } catch (err) {
    console.debug('Error fetching extension changelog:', err);
  }
  return { latest_version: '1.0.7', releases: {} };
}

function resolveReleaseChanges(rel?: ExtensionRelease, lang?: string): string[] {
  const changes = rel?.changes;
  if (!changes) return [];
  const targetLang = lang || 'ru';
  return changes[targetLang] || changes.ru || changes.en || [];
}

function isNewerThanCurrent(ver: string, currentVersion?: string | null): boolean {
  if (!currentVersion) return true;
  return compareVersions(ver, currentVersion) > 0;
}

export function getUpdatesBetween(
  changelogData?: ExtensionChangelog | null,
  currentVersion?: string | null,
  lang?: string
): ExtensionUpdateItem[] {
  const releases = changelogData?.releases;
  if (!releases) return [];

  const versions = Object.keys(releases)
    .filter((ver) => isNewerThanCurrent(ver, currentVersion))
    .sort((a, b) => compareVersions(b, a));

  const updates: ExtensionUpdateItem[] = [];
  for (const ver of versions) {
    const rel = releases[ver];
    const items = resolveReleaseChanges(rel, lang);
    if (items.length > 0) {
      updates.push({ version: ver, date: rel?.date, changes: items });
    }
  }
  return updates;
}

async function fetchBackendExtensionStatus(): Promise<{
  activeFromBackend: boolean;
  extensionId: string | null;
  lastKnownVersion: string | null;
}> {
  try {
    const data = await extensionApiService.getStatus();
    return {
      activeFromBackend: Boolean(data.active),
      extensionId: data.extension_id || null,
      lastKnownVersion: data.last_known_version || null,
    };
  } catch (err) {
    console.debug('Error checking extension status from API:', err);
  }
  return { activeFromBackend: false, extensionId: null, lastKnownVersion: null };
}

function isVersionOutdated(
  installed: boolean,
  currentVersion: string | null,
  latestVersion: string | null
): boolean {
  if (!installed || !currentVersion || !latestVersion) return false;
  return compareVersions(latestVersion, currentVersion) > 0;
}

export async function checkExtensionStatus(): Promise<ExtensionStatusInfo> {
  const backend = await fetchBackendExtensionStatus();
  const pingResult = await pingExtension(backend.extensionId);
  const installed = pingResult.installed || backend.activeFromBackend;
  const currentVersion = pingResult.version || backend.lastKnownVersion;

  const changelog = await getExtensionChangelog();
  const latestVersion = changelog?.latest_version || null;
  const isOutdated = isVersionOutdated(installed, currentVersion, latestVersion);

  return {
    installed,
    currentVersion,
    latestVersion,
    isOutdated,
    changelog,
  };
}

export async function isExtensionInstalled(): Promise<boolean> {
  const status = await checkExtensionStatus();
  return status.installed;
}

function isDismissedInStorage(key: string, expectedValue: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(key) === expectedValue;
}

export async function checkExtensionPromptRequirement(): Promise<ExtensionPromptRequirement> {
  const status = await checkExtensionStatus();

  if (!status.installed) {
    if (isDismissedInStorage(DISMISS_KEY, 'true')) {
      return { show: false, reason: null, ...status };
    }
    return { show: true, reason: 'not_installed', ...status };
  }

  if (status.isOutdated && status.latestVersion) {
    if (isDismissedInStorage(DISMISSED_UPDATE_VERSION_KEY, status.latestVersion)) {
      return { show: false, reason: null, ...status };
    }
    return { show: true, reason: 'outdated', ...status };
  }

  return { show: false, reason: null, ...status };
}

export async function shouldShowExtensionPrompt(): Promise<boolean> {
  const res = await checkExtensionPromptRequirement();
  return res.show;
}

export function urlRequiresExtension(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return lower.includes('upwork.com') || lower.includes('indeed.');
}

export function anyUrlRequiresExtension(urls?: string[] | null): boolean {
  if (!Array.isArray(urls)) return false;
  return urls.some(urlRequiresExtension);
}

export function dismissExtensionPrompt(
  permanent?: boolean,
  reason?: string | null,
  targetVersion?: string | null
): void {
  if (typeof localStorage === 'undefined') return;
  const mode = reason || 'not_installed';
  if (mode === 'outdated' && targetVersion) {
    localStorage.setItem(DISMISSED_UPDATE_VERSION_KEY, targetVersion);
  } else if (permanent) {
    localStorage.setItem(DISMISS_KEY, 'true');
  }
}

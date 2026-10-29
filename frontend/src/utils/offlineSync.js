/**
 * Offline Storage & Synchronization Engine for LinkedIn Jobs Tracker PWA
 */

export const STORAGE_KEYS = {
  VACANCIES: 'lp_vacancies',
  COLUMNS: 'lp_columns',
  TAGS: 'lp_tags',
  COUNTRIES: 'lp_countries',
  CITIES: 'lp_cities',
  SOURCES: 'lp_sources',
  USER: 'lp_user',
  STATS: 'lp_stats',
  SYNC_QUEUE: 'lp_offline_sync_queue'
};

// Safe JSON parse from localStorage
function safeGetJSON(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

// Safe JSON write to localStorage
function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

/* Local Data Accessors */
export function loadLocalVacancies() {
  return safeGetJSON(STORAGE_KEYS.VACANCIES, []);
}

export function saveLocalVacancies(vacancies) {
  safeSetJSON(STORAGE_KEYS.VACANCIES, vacancies);
}

export function loadLocalColumns() {
  return safeGetJSON(STORAGE_KEYS.COLUMNS, []);
}

export function saveLocalColumns(columns) {
  safeSetJSON(STORAGE_KEYS.COLUMNS, columns);
}

export function loadLocalUser() {
  return safeGetJSON(STORAGE_KEYS.USER, null);
}

export function saveLocalUser(user) {
  safeSetJSON(STORAGE_KEYS.USER, user);
}

export function clearLocalUser() {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch (e) {
    console.error('Error clearing local user', e);
  }
}

/* Offline Sync Queue */
export function getSyncQueue() {
  return safeGetJSON(STORAGE_KEYS.SYNC_QUEUE, []);
}

export function saveSyncQueue(queue) {
  safeSetJSON(STORAGE_KEYS.SYNC_QUEUE, queue);
  window.dispatchEvent(new CustomEvent('lp_sync_queue_changed', { detail: { count: queue.length } }));
}

export function addToSyncQueue(action) {
  const currentQueue = getSyncQueue();
  const queueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: Date.now(),
    ...action
  };

  // Optimization & deduplication
  if (action.type === 'DELETE_VACANCY') {
    // If a vacancy was created offline and never synced, remove both create and delete
    const isOfflineId = typeof action.payload.vacancyId === 'string' && action.payload.vacancyId.startsWith('offline_');
    if (isOfflineId) {
      const filtered = currentQueue.filter(item => {
        if (item.type === 'CREATE_VACANCY' && item.payload.tempId === action.payload.vacancyId) return false;
        if (item.payload && item.payload.vacancyId === action.payload.vacancyId) return false;
        return true;
      });
      saveSyncQueue(filtered);
      return;
    }
    // Remove any pending updates for this deleted vacancy
    const cleaned = currentQueue.filter(item => {
      return !(item.payload && item.payload.vacancyId === action.payload.vacancyId);
    });
    cleaned.push(queueItem);
    saveSyncQueue(cleaned);
    return;
  }

  if (action.type === 'PATCH_VACANCY') {
    // If there is already a pending PATCH for the same vacancy, merge patches
    const existingIdx = currentQueue.findIndex(
      item => item.type === 'PATCH_VACANCY' && item.payload.vacancyId === action.payload.vacancyId
    );
    if (existingIdx !== -1) {
      currentQueue[existingIdx].payload.patch = {
        ...currentQueue[existingIdx].payload.patch,
        ...action.payload.patch
      };
      currentQueue[existingIdx].timestamp = Date.now();
      saveSyncQueue(currentQueue);
      return;
    }
  }

  currentQueue.push(queueItem);
  saveSyncQueue(currentQueue);
}

export function clearSyncQueue() {
  saveSyncQueue([]);
}

/* Offline Vacancy Factory */
export function createOfflineVacancy(url, defaultTags = [], status = "Еще не написан") {
  const cleanUrl = url.trim();
  const tempId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  let domainTitle = cleanUrl;
  try {
    const parsed = new URL(cleanUrl);
    domainTitle = parsed.hostname.replace(/^www\./, '') + (parsed.pathname !== '/' ? parsed.pathname.slice(0, 35) : '');
  } catch {
    domainTitle = cleanUrl.slice(0, 50);
  }

  return {
    id: tempId,
    url: cleanUrl,
    job_id: null,
    title: domainTitle || cleanUrl,
    company: "Ожидает загрузки...",
    location: "",
    status: status,
    lane: 0,
    sort_order: null,
    salary_min: null,
    salary_max: null,
    salary_currency: "$",
    salary_period: "month",
    workplace_type: null,
    is_closed: false,
    tags: Array.isArray(defaultTags) ? defaultTags : [],
    notes: "",
    ai_summary: null,
    tech_stack: [],
    history: [
      {
        id: `off_hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        from_status: null,
        to_status: status,
        comment: "Добавлено оффлайн (ожидает подключения к сети)",
        created_at: new Date().toISOString()
      }
    ],
    created_at: new Date().toISOString(),
    _offline: true,
    _pending_sync: true
  };
}

let isSyncInProgress = false;

/* Check server health */
export async function checkServerOnline() {
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('/api/health', {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

/* Synchronization Engine */
export async function syncPendingQueue(options = {}) {
  const { onSyncStart, onSyncSuccess, onSyncError, onRefreshNeeded } = options;

  if (isSyncInProgress) {
    return false;
  }

  const queue = getSyncQueue();
  if (!queue || queue.length === 0) {
    return true;
  }

  if (!navigator.onLine) {
    return false;
  }

  const isServerReachable = await checkServerOnline();
  if (!isServerReachable) {
    return false;
  }

  isSyncInProgress = true;
  if (onSyncStart) onSyncStart();
  window.dispatchEvent(new CustomEvent('lp_sync_status_changed', { detail: { syncing: true } }));

  const idMap = new Map(); // tempId -> realServerId
  const remainingQueue = [];

  try {
    let localVacancies = loadLocalVacancies();

    for (const item of queue) {
      try {
        if (item.type === 'CREATE_VACANCY') {
          const { tempId, url, defaultTags } = item.payload;
          
          // Submit to batch import
          const batchRes = await fetch('/api/vacancies/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              urls: [url],
              default_tags: defaultTags || []
            })
          });

          if (!batchRes.ok) {
            throw new Error(`Failed to import vacancy: HTTP ${batchRes.status}`);
          }

          // Fetch fresh list to find the newly assigned server ID
          const listRes = await fetch('/api/vacancies');
          if (listRes.ok) {
            const serverVacancies = await listRes.json();
            const matching = serverVacancies.find(v => v.url === url || (v.url && v.url.includes(url)));
            if (matching) {
              idMap.set(tempId, matching.id);

              // Check if local vacancy had any modifications while offline
              const localMatch = localVacancies.find(v => v.id === tempId);
              if (localMatch) {
                // If status, title, notes, etc. were modified offline:
                const patch = {};
                if (localMatch.status && localMatch.status !== matching.status) {
                  patch.status = localMatch.status;
                }
                if (localMatch.title && localMatch.title !== matching.title && localMatch.title !== url) {
                  patch.title = localMatch.title;
                }
                if (localMatch.notes) {
                  patch.notes = localMatch.notes;
                }
                if (localMatch.salary_min != null) patch.salary_min = localMatch.salary_min;
                if (localMatch.salary_max != null) patch.salary_max = localMatch.salary_max;
                if (localMatch.salary_currency) patch.salary_currency = localMatch.salary_currency;
                if (localMatch.salary_period) patch.salary_period = localMatch.salary_period;
                if (localMatch.workplace_type) patch.workplace_type = localMatch.workplace_type;
                if (localMatch.is_closed !== undefined) patch.is_closed = localMatch.is_closed;

                if (Object.keys(patch).length > 0) {
                  await fetch(`/api/vacancies/${matching.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(patch)
                  });
                }

                // If offline comments were added:
                if (Array.isArray(localMatch.history)) {
                  for (const h of localMatch.history) {
                    if (h.comment && typeof h.id === 'string' && h.id.startsWith('off_hist_')) {
                      await fetch(`/api/vacancies/${matching.id}/history`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          to_status: h.to_status || matching.status,
                          comment: h.comment
                        })
                      });
                    }
                  }
                }
              }

              // Update local vacancy ID in storage
              localVacancies = localVacancies.map(v => {
                if (v.id === tempId) {
                  return {
                    ...v,
                    id: matching.id,
                    _offline: false,
                    _pending_sync: false
                  };
                }
                return v;
              });
              saveLocalVacancies(localVacancies);
            }
          }
        } else if (item.type === 'UPDATE_STATUS') {
          const rawId = item.payload.vacancyId;
          const vid = idMap.get(rawId) || rawId;
          if (typeof vid === 'string' && vid.startsWith('offline_')) {
            // Still waiting for vacancy creation, keep in queue
            remainingQueue.push(item);
            continue;
          }
          await fetch(`/api/vacancies/${vid}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: item.payload.status })
          });
        } else if (item.type === 'PATCH_VACANCY') {
          const rawId = item.payload.vacancyId;
          const vid = idMap.get(rawId) || rawId;
          if (typeof vid === 'string' && vid.startsWith('offline_')) {
            remainingQueue.push(item);
            continue;
          }
          await fetch(`/api/vacancies/${vid}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload.patch)
          });
        } else if (item.type === 'REORDER') {
          const mappedIds = item.payload.ids
            .map(id => idMap.get(id) || id)
            .filter(id => typeof id === 'number');

          if (mappedIds.length > 0) {
            await fetch('/api/vacancies/reorder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: item.payload.status,
                ids: mappedIds,
                lane: item.payload.lane || 0
              })
            });
          }
        } else if (item.type === 'ADD_HISTORY') {
          const rawId = item.payload.vacancyId;
          const vid = idMap.get(rawId) || rawId;
          if (typeof vid === 'string' && vid.startsWith('offline_')) {
            remainingQueue.push(item);
            continue;
          }
          await fetch(`/api/vacancies/${vid}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to_status: item.payload.to_status,
              comment: item.payload.comment
            })
          });
        } else if (item.type === 'UPDATE_HISTORY') {
          const rawId = item.payload.vacancyId;
          const vid = idMap.get(rawId) || rawId;
          if (typeof vid === 'string' && vid.startsWith('offline_')) {
            remainingQueue.push(item);
            continue;
          }
          await fetch(`/api/vacancies/${vid}/history/${item.payload.historyId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: item.payload.comment })
          });
        } else if (item.type === 'DELETE_HISTORY') {
          const rawId = item.payload.vacancyId;
          const vid = idMap.get(rawId) || rawId;
          if (typeof vid === 'string' && vid.startsWith('offline_')) {
            continue;
          }
          await fetch(`/api/vacancies/${vid}/history/${item.payload.historyId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: null })
          });
        } else if (item.type === 'DELETE_VACANCY') {
          const rawId = item.payload.vacancyId;
          const vid = idMap.get(rawId) || rawId;
          if (typeof vid === 'number') {
            await fetch(`/api/vacancies/${vid}`, { method: 'DELETE' });
          }
        }
      } catch (err) {
        console.warn('Sync failed for queue action', item, err);
        remainingQueue.push(item);
      }
    }

    saveSyncQueue(remainingQueue);

    if (remainingQueue.length === 0) {
      if (onSyncSuccess) onSyncSuccess();
      if (onRefreshNeeded) onRefreshNeeded();
      window.dispatchEvent(new CustomEvent('lp_sync_complete', { detail: { success: true } }));
    }
    return remainingQueue.length === 0;
  } catch (err) {
    console.error('Offline queue sync error', err);
    if (onSyncError) onSyncError(err);
    return false;
  } finally {
    isSyncInProgress = false;
    window.dispatchEvent(new CustomEvent('lp_sync_status_changed', { detail: { syncing: false } }));
  }
}

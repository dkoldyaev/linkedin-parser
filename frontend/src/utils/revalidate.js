// Client-side debouncer and batcher for Next.js cache revalidation

let revalidateTimer = null;
const pendingTags = new Set();
const pendingPaths = new Set();

/**
 * Schedules a debounced revalidation request.
 * Multiple calls within the debounce window are collapsed into a single HTTP POST request.
 *
 * @param {Object} options
 * @param {string} [options.tag] - Cache tag to invalidate (e.g. 'vacancies')
 * @param {string} [options.path] - Path to invalidate (e.g. '/' or '/vacancies/123')
 * @param {number} [options.delay=400] - Debounce window in milliseconds
 */
export function scheduleRevalidate({ tag, path, delay = 400 } = {}) {
  if (typeof window === 'undefined') return;

  if (tag) pendingTags.add(tag);
  if (path) pendingPaths.add(path);

  if (revalidateTimer) {
    clearTimeout(revalidateTimer);
  }

  revalidateTimer = setTimeout(async () => {
    const tags = Array.from(pendingTags);
    const paths = Array.from(pendingPaths);
    pendingTags.clear();
    pendingPaths.clear();

    if (tags.length === 0 && paths.length === 0) {
      tags.push('vacancies');
      paths.push('/');
    }

    try {
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags, paths }),
      });
    } catch (err) {
      console.debug('Background revalidate fetch error (ignored):', err);
    }
  }, delay);
}

/**
 * Plausible Analytics integration helper.
 * Supports custom properties and automatic user attribution.
 */

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props: Record<string, string | number | boolean> },
    ) => void;
  }
}

// Identity must never be attached to third-party telemetry.
export function setAnalyticsUser(_user?: unknown): void {}

const ALLOWED_ANALYTICS_KEYS = new Set([
  'count',
  'query_length',
  'collapsed',
  'locale',
  'method',
  'theme',
]);

function isAllowedAnalyticsValue(value: unknown): value is string | number | boolean {
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  return typeof value === 'string' && /^[a-z_-]{1,32}$/i.test(value);
}

function filterAllowedProps(
  props?: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const mergedProps: Record<string, string | number | boolean> = {};
  if (!props) return mergedProps;
  for (const [key, value] of Object.entries(props)) {
    if (ALLOWED_ANALYTICS_KEYS.has(key) && isAllowedAnalyticsValue(value)) {
      mergedProps[key] = value;
    }
  }
  return mergedProps;
}

/**
 * Track a custom event in Plausible.
 */
export function trackEvent(eventName: string, props?: Record<string, unknown>): void {
  try {
    if (typeof window === 'undefined' || typeof window.plausible !== 'function') {
      return;
    }

    const mergedProps = filterAllowedProps(props);

    if (Object.keys(mergedProps).length > 0) {
      window.plausible(eventName, { props: mergedProps });
    } else {
      window.plausible(eventName);
    }
  } catch (err) {
    console.debug('[Analytics] Failed to send event:', eventName, err);
  }
}

/**
 * Common event name constants for structured tracking.
 */
export const EVENTS = {
  // Auth
  LOGIN_GOOGLE_CLICK: 'Login Google Click',
  LOGIN_DEV_SUCCESS: 'Login Dev Success',
  LOGIN_DEV_ERROR: 'Login Dev Error',
  LOGOUT: 'Logout',

  // Vacancy Lifecycle & Funnel
  VACANCY_CARD_CLICK: 'Vacancy Card Click',
  VACANCY_STATUS_CHANGE: 'Vacancy Status Change',
  VACANCY_MOVE_REJECTED: 'Vacancy Move to Rejected',
  VACANCY_RESTORE_REJECTED: 'Vacancy Restore from Rejected',
  VACANCY_DELETE: 'Vacancy Delete',
  VACANCY_TOGGLE_CLOSED: 'Vacancy Toggle Closed',
  VACANCY_LINK_CLICK: 'Vacancy Link Click',
  COMPANY_LINK_CLICK: 'Company Link Click',

  // Reparse & AI
  VACANCY_REPARSE_CLICK: 'Vacancy Reparse Click',
  VACANCY_REPARSE_SUCCESS: 'Vacancy Reparse Success',
  VACANCY_REPARSE_ERROR: 'Vacancy Reparse Error',
  AI_RESUMMARIZE_CLICK: 'AI Resummarize Click',
  AI_RESUMMARIZE_SUCCESS: 'AI Resummarize Success',

  // Vacancy Attributes Editing
  SALARY_SAVE: 'Salary Save',
  SALARY_FORMAT_CHANGE: 'Salary Format Change',
  SALARY_CURRENCY_CHANGE: 'Salary Currency Change',
  WORKPLACE_CHANGE: 'Workplace Change',
  NOTES_SAVE: 'Notes Save',
  TAG_ADD: 'Tag Add',
  TAG_REMOVE: 'Tag Remove',
  TECH_ADD: 'Tech Add',
  TECH_REMOVE: 'Tech Remove',
  HISTORY_COMMENT_ADD: 'History Comment Add',
  HISTORY_COMMENT_EDIT: 'History Comment Edit',
  HISTORY_COMMENT_DELETE: 'History Comment Delete',
  DESCRIPTION_EXPAND: 'Description Expand',
  DESCRIPTION_COPY: 'Description Copy',

  // Batch Import
  BATCH_IMPORT_OPEN: 'Batch Import Open',
  BATCH_IMPORT_SUBMIT: 'Batch Import Submit',
  BATCH_IMPORT_SUCCESS: 'Batch Import Success',
  BATCH_IMPORT_ERROR: 'Batch Import Error',

  // Filters & Navigation
  SEARCH_APPLIED: 'Search Applied',
  FILTER_COUNTRY: 'Filter Country Change',
  FILTER_CITY: 'Filter City Change',
  FILTER_WORKPLACE: 'Filter Workplace Change',
  FILTER_SOURCE: 'Filter Source Change',
  FILTER_CLOSED: 'Filter Closed Change',
  MOVE_ALL_CLOSED_REJECTED: 'Move All Closed To Rejected',
  FILTER_TAG: 'Filter Tag Change',
  FILTERS_RESET: 'Filters Reset All',
  REFRESH_CLICK: 'Refresh Click',
  REJECTED_TOGGLE: 'Rejected Funnel Toggle',
  SETTINGS_OPEN: 'Settings Open',
  LANGUAGE_CHANGE: 'Language Change',
} as const;

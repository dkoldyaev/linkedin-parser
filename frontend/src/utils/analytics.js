/**
 * Plausible Analytics integration helper.
 * Supports custom properties and automatic user attribution.
 */

let currentAnalyticsUser = null;

/**
 * Set current logged in user to automatically attach user identity to all subsequent events.
 * @param {Object|null} user - { id, email, name }
 */
export function setAnalyticsUser(user) {
  if (user) {
    currentAnalyticsUser = {
      userId: String(user.id || ''),
      userEmail: user.email || '',
      userName: user.name || ''
    };
  } else {
    currentAnalyticsUser = null;
  }
}

/**
 * Track a custom event in Plausible.
 * @param {string} eventName - Target event name
 * @param {Object} [props] - Additional metadata for the event
 */
export function trackEvent(eventName, props = {}) {
  try {
    if (typeof window === 'undefined' || typeof window.plausible !== 'function') {
      return;
    }

    // Merge user identity with event props if user is known
    const mergedProps = {};

    if (currentAnalyticsUser) {
      if (currentAnalyticsUser.userId) mergedProps.userId = currentAnalyticsUser.userId;
      if (currentAnalyticsUser.userEmail) mergedProps.userEmail = currentAnalyticsUser.userEmail;
    }

    // Add caller's custom props, stripping undefined/null
    if (props && typeof props === 'object') {
      Object.entries(props).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          mergedProps[key] = typeof value === 'object' ? JSON.stringify(value) : value;
        }
      });
    }

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
  FILTER_TAG: 'Filter Tag Change',
  FILTERS_RESET: 'Filters Reset All',
  REFRESH_CLICK: 'Refresh Click',
  REJECTED_TOGGLE: 'Rejected Funnel Toggle',
  SETTINGS_OPEN: 'Settings Open',
  LANGUAGE_CHANGE: 'Language Change'
};

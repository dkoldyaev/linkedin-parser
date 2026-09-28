/**
 * Salary calculation and formatting utilities.
 */

export const PERIOD_LABELS = {
  year: 'в год',
  month: 'в месяц',
  hour: 'в час',
  week: 'в неделю',
  day: 'в день'
};

export const PERIOD_SUFFIXES = {
  year: '/ год',
  month: '/ мес',
  hour: '/ час',
  week: '/ нед',
  day: '/ день'
};

/**
 * Format a number cleanly with space grouping.
 */
export function formatNumber(val) {
  if (val === null || val === undefined || isNaN(val)) return '';
  return Math.round(val).toLocaleString('ru-RU');
}

/**
 * Get salary display information for cards and modals.
 */
export function getSalaryDisplay(vacancy, t, displayFormat = 'month') {
  if (!vacancy) {
    return { hasSalary: false, formatted: '', original: '', targetMin: null, targetMax: null };
  }

  const { salary_min, salary_max, salary_currency, salary_period } = vacancy;
  const min = salary_min !== null && salary_min !== undefined && salary_min !== '' ? Number(salary_min) : null;
  const max = salary_max !== null && salary_max !== undefined && salary_max !== '' ? Number(salary_max) : null;

  if ((min === null || isNaN(min)) && (max === null || isNaN(max))) {
    return { hasSalary: false, formatted: '', original: '', targetMin: null, targetMax: null };
  }

  const curr = (salary_currency || '$').trim();
  const period = (salary_period || 'month').toLowerCase().trim();
  
  let targetFormat = displayFormat;
  if (targetFormat === 'original') {
    targetFormat = period;
  }

  // First convert to month
  let factorToMonth = 1;
  if (period === 'year' || period === 'annual' || period === 'yearly') factorToMonth = 1 / 12;
  else if (period === 'hour' || period === 'hourly') factorToMonth = 160;
  else if (period === 'week' || period === 'weekly') factorToMonth = 52 / 12;
  else if (period === 'day' || period === 'daily') factorToMonth = 260 / 12;

  // Then convert to target
  let factorFromMonth = 1;
  if (targetFormat === 'year') factorFromMonth = 12;
  else if (targetFormat === 'hour') factorFromMonth = 1 / 160;
  else if (targetFormat === 'week') factorFromMonth = 12 / 52;
  else if (targetFormat === 'day') factorFromMonth = 12 / 260;

  const totalFactor = factorToMonth * factorFromMonth;

  const targetMin = min !== null && !isNaN(min) ? Math.round(min * totalFactor) : null;
  const targetMax = max !== null && !isNaN(max) ? Math.round(max * totalFactor) : null;

  const perLabel = t ? t(`salary.per_${targetFormat}`) : (PERIOD_SUFFIXES[targetFormat] || `/${targetFormat}`);
  const fromLabel = t ? t('salary.from') : 'от';
  const toLabel = t ? t('salary.to') : 'до';

  // Format primary text
  let formatted = '';
  if (targetMin !== null && targetMax !== null) {
    if (targetMin === targetMax) {
      formatted = `${curr}${formatNumber(targetMin)} ${perLabel}`;
    } else {
      formatted = `${curr}${formatNumber(targetMin)} – ${curr}${formatNumber(targetMax)} ${perLabel}`;
    }
  } else if (targetMin !== null) {
    formatted = `${fromLabel} ${curr}${formatNumber(targetMin)} ${perLabel}`;
  } else if (targetMax !== null) {
    formatted = `${toLabel} ${curr}${formatNumber(targetMax)} ${perLabel}`;
  }

  // Original text (if period is not targetFormat)
  let original = '';
  const origSuffix = t ? t(`salary.per_${period}`) : (PERIOD_SUFFIXES[period] || `/${period}`);
  if (period !== targetFormat) {
    let origRange = '';
    if (min !== null && max !== null) {
      origRange = min === max ? `${curr}${formatNumber(min)}` : `${curr}${formatNumber(min)} – ${curr}${formatNumber(max)}`;
    } else if (min !== null) {
      origRange = `${fromLabel} ${curr}${formatNumber(min)}`;
    } else if (max !== null) {
      origRange = `${toLabel} ${curr}${formatNumber(max)}`;
    }
    
    // Simplistic original text
    original = t ? t('salary.original_prefix', { range: origRange, suffix: origSuffix }) : `Оригинал: ${origRange} ${origSuffix}`;
  }

  return {
    hasSalary: true,
    formatted,
    original,
    targetMin,
    targetMax,
    currency: curr,
    period,
  };
}

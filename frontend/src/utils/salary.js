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
 * Calculate monthly salary min & max based on rate and period.
 */
export function calcMonthlySalary({ salary_min, salary_max, salary_period }) {
  const min = salary_min !== null && salary_min !== undefined && salary_min !== '' ? Number(salary_min) : null;
  const max = salary_max !== null && salary_max !== undefined && salary_max !== '' ? Number(salary_max) : null;

  if ((min === null || isNaN(min)) && (max === null || isNaN(max))) {
    return { monthlyMin: null, monthlyMax: null };
  }

  const period = (salary_period || 'month').toLowerCase().trim();
  let factor = 1;

  if (period === 'year' || period === 'annual' || period === 'yearly') {
    // Divided by 12 for annual salary
    factor = 1 / 12;
  } else if (period === 'hour' || period === 'hourly') {
    // 40 hours/week * 4 weeks = 160 hours/month
    factor = 160;
  } else if (period === 'week' || period === 'weekly') {
    // 52 weeks / 12 months = 4.333
    factor = 52 / 12;
  } else if (period === 'day' || period === 'daily') {
    // Average 21.67 working days/month
    factor = 260 / 12;
  } else {
    // Default: month
    factor = 1;
  }

  const monthlyMin = min !== null && !isNaN(min) ? Math.round(min * factor) : null;
  const monthlyMax = max !== null && !isNaN(max) ? Math.round(max * factor) : null;

  return { monthlyMin, monthlyMax };
}

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
export function getSalaryDisplay(vacancy) {
  if (!vacancy) {
    return { hasSalary: false, formatted: '', original: '', monthlyMin: null, monthlyMax: null };
  }

  const { salary_min, salary_max, salary_currency, salary_period } = vacancy;
  const min = salary_min !== null && salary_min !== undefined && salary_min !== '' ? Number(salary_min) : null;
  const max = salary_max !== null && salary_max !== undefined && salary_max !== '' ? Number(salary_max) : null;

  if ((min === null || isNaN(min)) && (max === null || isNaN(max))) {
    return { hasSalary: false, formatted: '', original: '', monthlyMin: null, monthlyMax: null };
  }

  const curr = (salary_currency || '$').trim();
  const period = (salary_period || 'month').toLowerCase().trim();
  const { monthlyMin, monthlyMax } = calcMonthlySalary({ salary_min: min, salary_max: max, salary_period: period });

  // Format monthly text
  let formatted = '';
  if (monthlyMin !== null && monthlyMax !== null) {
    if (monthlyMin === monthlyMax) {
      formatted = `${curr}${formatNumber(monthlyMin)} / мес`;
    } else {
      formatted = `${curr}${formatNumber(monthlyMin)} – ${curr}${formatNumber(monthlyMax)} / мес`;
    }
  } else if (monthlyMin !== null) {
    formatted = `от ${curr}${formatNumber(monthlyMin)} / мес`;
  } else if (monthlyMax !== null) {
    formatted = `до ${curr}${formatNumber(monthlyMax)} / мес`;
  }

  // Original text (if period is not already month)
  let original = '';
  const suffix = PERIOD_SUFFIXES[period] || `/${period}`;
  if (period !== 'month') {
    let origRange = '';
    if (min !== null && max !== null) {
      origRange = min === max ? `${curr}${formatNumber(min)}` : `${curr}${formatNumber(min)} – ${curr}${formatNumber(max)}`;
    } else if (min !== null) {
      origRange = `от ${curr}${formatNumber(min)}`;
    } else if (max !== null) {
      origRange = `до ${curr}${formatNumber(max)}`;
    }

    if (period === 'year') {
      original = `Оригинал: ${origRange} ${suffix} (деление на 12)`;
    } else if (period === 'hour') {
      original = `Оригинал: ${origRange} ${suffix} (расчет из 160 ч/мес)`;
    } else {
      original = `Оригинал: ${origRange} ${suffix}`;
    }
  }

  return {
    hasSalary: true,
    formatted,
    original,
    monthlyMin,
    monthlyMax,
    currency: curr,
    period,
  };
}

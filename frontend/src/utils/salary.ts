export interface SalaryInput {
  salary_min?: number | string | null;
  salary_max?: number | string | null;
  salary_currency?: string | null;
  salary_period?: string | null;
}

export interface SalaryDisplayInfo {
  hasSalary: boolean;
  formatted: string;
  original: string;
  targetMin: number | null;
  targetMax: number | null;
  currency?: string;
  period?: string;
}

export type SalaryDisplay = SalaryDisplayInfo;

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export const PERIOD_LABELS: Record<string, string> = {
  year: 'в год',
  month: 'в месяц',
  hour: 'в час',
  week: 'в неделю',
  day: 'в день',
};

export const PERIOD_SUFFIXES: Record<string, string> = {
  year: '/ год',
  month: '/ мес',
  hour: '/ час',
  week: '/ нед',
  day: '/ день',
};

const RUB_CODES = new Set(['RUB', 'RUR', '₽', 'РУБ', 'РУБ.']);
const USD_CODES = new Set(['USD', '$']);
const EUR_CODES = new Set(['EUR', '€']);
const GBP_CODES = new Set(['GBP', '£']);

export function normalizeCurrencyCode(curr?: string | null): string | null {
  if (!curr) return null;
  const c = curr.trim().toUpperCase();
  if (RUB_CODES.has(c)) return 'RUB';
  if (USD_CODES.has(c)) return 'USD';
  if (EUR_CODES.has(c)) return 'EUR';
  if (GBP_CODES.has(c)) return 'GBP';
  return c;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  RUB: '₽',
  GBP: '£',
};

export function formatNumber(val?: number | null): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '';
  return Math.round(val).toLocaleString('ru-RU');
}

function parseNumericBound(raw?: number | string | null): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const num = Number(raw);
  return Number.isNaN(num) ? null : num;
}

const TO_MONTH_FACTORS: Record<string, number> = {
  year: 1 / 12,
  annual: 1 / 12,
  yearly: 1 / 12,
  hour: 160,
  hourly: 160,
  week: 52 / 12,
  weekly: 52 / 12,
  day: 260 / 12,
  daily: 260 / 12,
};

const FROM_MONTH_FACTORS: Record<string, number> = {
  year: 12,
  hour: 1 / 160,
  week: 12 / 52,
  day: 12 / 260,
};

function getPeriodConversionFactor(sourcePeriod: string, targetFormat: string): number {
  const toMonth = TO_MONTH_FACTORS[sourcePeriod] ?? 1;
  const fromMonth = FROM_MONTH_FACTORS[targetFormat] ?? 1;
  return toMonth * fromMonth;
}

function findExchangeRate(
  normOrigCurr: string | null,
  normTargetCurr: string | null,
  exchangeRates?: Record<string, number> | null
): number | null {
  if (!normOrigCurr || !normTargetCurr || normTargetCurr === normOrigCurr) return null;
  const rateVal = exchangeRates?.[`${normOrigCurr}_${normTargetCurr}`];
  return rateVal !== undefined ? Number(rateVal) : null;
}

function resolveCurrencyConversion(
  origCurr: string,
  targetCurrency?: string | null,
  exchangeRates?: Record<string, number> | null
): { displayCurr: string; currRate: number } {
  const normOrigCurr = normalizeCurrencyCode(origCurr);
  const normTargetCurr = normalizeCurrencyCode(targetCurrency);
  const rate = findExchangeRate(normOrigCurr, normTargetCurr, exchangeRates);

  if (rate === null || !normTargetCurr) {
    return { displayCurr: origCurr, currRate: 1 };
  }
  return {
    displayCurr: CURRENCY_SYMBOLS[normTargetCurr] || normTargetCurr,
    currRate: rate,
  };
}

function formatRangeString(
  minVal: number | null,
  maxVal: number | null,
  curr: string,
  labels: { fromLabel: string; toLabel: string; perLabel?: string }
): string {
  const suffix = labels.perLabel ? ` ${labels.perLabel}` : '';
  if (minVal !== null && maxVal !== null) {
    const base = minVal === maxVal
      ? `${curr}${formatNumber(minVal)}`
      : `${curr}${formatNumber(minVal)} – ${curr}${formatNumber(maxVal)}`;
    return `${base}${suffix}`;
  }
  if (minVal !== null) return `${labels.fromLabel} ${curr}${formatNumber(minVal)}${suffix}`;
  if (maxVal !== null) return `${labels.toLabel} ${curr}${formatNumber(maxVal)}${suffix}`;
  return '';
}

function resolvePerLabel(formatKey: string, t?: TranslateFn): string {
  if (t) return t(`salary.per_${formatKey}`);
  return PERIOD_SUFFIXES[formatKey] || `/${formatKey}`;
}

function resolveSalaryLabels(targetFormat: string, t?: TranslateFn): {
  perLabel: string;
  fromLabel: string;
  toLabel: string;
} {
  return {
    perLabel: resolvePerLabel(targetFormat, t),
    fromLabel: t ? t('salary.from') : 'от',
    toLabel: t ? t('salary.to') : 'до',
  };
}

function formatOriginalComparison(
  min: number | null,
  max: number | null,
  meta: {
    curr: string;
    period: string;
    targetFormat: string;
    fromLabel: string;
    toLabel: string;
    t?: TranslateFn;
  }
): string {
  if (meta.period === meta.targetFormat) return '';
  const origSuffix = resolvePerLabel(meta.period, meta.t);
  const origRange = formatRangeString(min, max, meta.curr, {
    fromLabel: meta.fromLabel,
    toLabel: meta.toLabel,
  });
  if (meta.t) {
    return meta.t('salary.original_prefix', { range: origRange, suffix: origSuffix });
  }
  return `Оригинал: ${origRange} ${origSuffix}`;
}

const EMPTY_SALARY_DISPLAY: SalaryDisplayInfo = {
  hasSalary: false,
  formatted: '',
  original: '',
  targetMin: null,
  targetMax: null,
};

function normalizeInputParams(
  vacancy: SalaryInput,
  displayFormat?: string | null
): {
  origCurr: string;
  period: string;
  targetFormat: string;
} {
  const origCurr = (vacancy.salary_currency || '$').trim();
  const period = (vacancy.salary_period || 'month').toLowerCase().trim();
  const rawDisplayFormat = displayFormat || 'month';
  const targetFormat = rawDisplayFormat === 'original' ? period : rawDisplayFormat;
  return { origCurr, period, targetFormat };
}

function scaleBound(val: number | null, factor: number, roundResult: boolean): number | null {
  if (val === null) return null;
  const scaled = val * factor;
  return roundResult ? Math.round(scaled) : scaled;
}

function computeFormattedSalary(
  rawMin: number | null,
  rawMax: number | null,
  vacancy: SalaryInput,
  options: {
    t?: TranslateFn;
    displayFormat?: string | null;
    targetCurrency?: string | null;
    exchangeRates?: Record<string, number> | null;
  }
): SalaryDisplayInfo {
  const { origCurr, period, targetFormat } = normalizeInputParams(vacancy, options.displayFormat);
  const { displayCurr, currRate } = resolveCurrencyConversion(
    origCurr,
    options.targetCurrency,
    options.exchangeRates
  );

  const min = scaleBound(rawMin, currRate, false);
  const max = scaleBound(rawMax, currRate, false);
  const totalFactor = getPeriodConversionFactor(period, targetFormat);
  const targetMin = scaleBound(min, totalFactor, true);
  const targetMax = scaleBound(max, totalFactor, true);
  const labels = resolveSalaryLabels(targetFormat, options.t);

  return {
    hasSalary: true,
    formatted: formatRangeString(targetMin, targetMax, displayCurr, labels),
    original: formatOriginalComparison(min, max, {
      curr: displayCurr,
      period,
      targetFormat,
      fromLabel: labels.fromLabel,
      toLabel: labels.toLabel,
      t: options.t,
    }),
    targetMin,
    targetMax,
    currency: displayCurr,
    period,
  };
}

export function getSalaryDisplay(
  ...args: [
    vacancy?: SalaryInput | null,
    t?: TranslateFn,
    displayFormat?: string | null,
    targetCurrency?: string | null,
    exchangeRates?: Record<string, number> | null,
  ]
): SalaryDisplayInfo {
  const [vacancy, t, displayFormat, targetCurrency, exchangeRates] = args;
  if (!vacancy) return EMPTY_SALARY_DISPLAY;

  const rawMin = parseNumericBound(vacancy.salary_min);
  const rawMax = parseNumericBound(vacancy.salary_max);
  if (rawMin === null && rawMax === null) return EMPTY_SALARY_DISPLAY;

  return computeFormattedSalary(rawMin, rawMax, vacancy, {
    t,
    displayFormat,
    targetCurrency,
    exchangeRates,
  });
}

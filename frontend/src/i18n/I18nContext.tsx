'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, type TranslationNode } from './translations';
import { settingsService } from '../services/settingsService';
import type { RemoteSettingsData } from '../services/settings.types';

export type LocaleCode = 'ru' | 'en';
export type Locale = LocaleCode;
export type SalaryFormat = 'month' | 'year' | 'hour';
export type TranslateFn = (path: string, params?: Record<string, string | number>) => string;
export type FormatDateFn = (dateValue?: string | number | Date | null, options?: Intl.DateTimeFormatOptions) => string;

export interface I18nContextValue {
  locale: LocaleCode;
  setLocale: (newLocale: string) => void;
  t: TranslateFn;
  formatDate: FormatDateFn;
  salaryDisplayFormat: string;
  setSalaryDisplayFormat: (format: string) => void;
  salaryTargetCurrency: string;
  setSalaryTargetCurrency: (currency: string) => void;
  exchangeRates: Record<string, number>;
}

export interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: string;
  initialSalaryFormat?: string;
  initialSalaryCurrency?: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isSupportedLocale(val?: string | null): val is LocaleCode {
  return val === 'en' || val === 'ru';
}

function safeGetStorageItem(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSetStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

function resolveInitialLocale(initialLocale?: string): LocaleCode {
  if (isSupportedLocale(initialLocale)) return initialLocale;
  const saved = safeGetStorageItem('app_locale');
  return isSupportedLocale(saved) ? saved : 'ru';
}

function resolveInitialFormat(initialSalaryFormat?: string): string {
  if (initialSalaryFormat) return initialSalaryFormat;
  return safeGetStorageItem('app_salary_format') || 'month';
}

function resolveInitialCurrency(initialSalaryCurrency?: string): string {
  if (initialSalaryCurrency !== undefined && initialSalaryCurrency !== null) {
    return initialSalaryCurrency;
  }
  return safeGetStorageItem('app_salary_currency') || '';
}

function resolveInitialRates(): Record<string, number> {
  const saved = safeGetStorageItem('app_exchange_rates');
  if (!saved) return {};
  try {
    return JSON.parse(saved) as Record<string, number>;
  } catch {
    return {};
  }
}

function lookupTranslationNode(root: Record<string, TranslationNode>, keys: string[]): string | null {
  let current: TranslationNode | undefined = root;
  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return null;
    }
    current = current[key];
  }
  return typeof current === 'string' ? current : null;
}

function interpolateTemplate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  let result = template;
  for (const [k, v] of Object.entries(params)) {
    const valStr = v !== undefined && v !== null ? String(v) : '';
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), valStr);
  }
  return result;
}

function translatePath(
  locale: LocaleCode,
  path: string,
  params?: Record<string, string | number>
): string {
  if (!path) return '';
  const keys = path.split('.');
  const raw =
    lookupTranslationNode(translations[locale], keys) ??
    lookupTranslationNode(translations.ru, keys);

  if (raw === null) {
    return path.startsWith('kanban.columns.') ? path.replace('kanban.columns.', '') : path;
  }
  return interpolateTemplate(raw, params);
}

interface SettingsPayload {
  locale?: string;
  salary_display_format?: string;
  salary_target_currency?: string | null;
}

function applyFetchedSettings(
  data: SettingsPayload | null,
  setLocaleState: (loc: LocaleCode) => void,
  setSalaryDisplayFormatState: (fmt: string) => void,
  setSalaryTargetCurrencyState: (curr: string) => void
): void {
  if (!data) return;
  if (isSupportedRemoteLocale(data.locale)) {
    setLocaleState(data.locale);
    safeSetStorageItem('app_locale', data.locale);
  }
  if (data.salary_display_format) {
    setSalaryDisplayFormatState(data.salary_display_format);
    safeSetStorageItem('app_salary_format', data.salary_display_format);
  }
  if (data.salary_target_currency !== undefined) {
    const curr = data.salary_target_currency || '';
    setSalaryTargetCurrencyState(curr);
    safeSetStorageItem('app_salary_currency', curr);
  }
}

function isSupportedRemoteLocale(val?: string | null): val is LocaleCode {
  return val === 'en' || val === 'ru';
}

function useI18nEffects(
  initialLocale: string | undefined,
  setLocaleState: (loc: LocaleCode) => void,
  setSalaryDisplayFormatState: (fmt: string) => void,
  setSalaryTargetCurrencyState: (curr: string) => void
): Record<string, number> {
  const [exchangeRates, setExchangeRatesState] = useState<Record<string, number>>(resolveInitialRates);

  useEffect(() => {
    if (isSupportedLocale(initialLocale)) {
      safeSetStorageItem('app_locale', initialLocale);
    }
  }, [initialLocale]);

  useEffect(() => {
    settingsService
      .getExchangeRates()
      .then((data) => {
        if (data && data.rates) {
          setExchangeRatesState(data.rates);
          safeSetStorageItem('app_exchange_rates', JSON.stringify(data.rates));
        }
      })
      .catch((err) => console.debug('Could not fetch exchange rates', err));
  }, []);

  useEffect(() => {
    settingsService
      .getSettings()
      .then((data: RemoteSettingsData | null) =>
        applyFetchedSettings(
          data,
          setLocaleState,
          setSalaryDisplayFormatState,
          setSalaryTargetCurrencyState
        )
      )
      .catch((err) => console.debug('Could not fetch settings', err));
  }, [setLocaleState, setSalaryDisplayFormatState, setSalaryTargetCurrencyState]);

  return exchangeRates;
}

function useI18nController(
  initialLocale?: string,
  initialSalaryFormat?: string,
  initialSalaryCurrency?: string
): I18nContextValue {
  const [locale, setLocaleState] = useState<LocaleCode>(() => resolveInitialLocale(initialLocale));
  const [salaryDisplayFormat, setSalaryDisplayFormatState] = useState<string>(() =>
    resolveInitialFormat(initialSalaryFormat)
  );
  const [salaryTargetCurrency, setSalaryTargetCurrencyState] = useState<string>(() =>
    resolveInitialCurrency(initialSalaryCurrency)
  );

  const exchangeRates = useI18nEffects(
    initialLocale,
    setLocaleState,
    setSalaryDisplayFormatState,
    setSalaryTargetCurrencyState
  );

  const setLocale = useCallback((newLocale: string) => {
    const loc: LocaleCode = newLocale === 'en' ? 'en' : 'ru';
    setLocaleState(loc);
    safeSetStorageItem('app_locale', loc);
  }, []);

  const setSalaryDisplayFormat = useCallback((format: string) => {
    setSalaryDisplayFormatState(format);
    safeSetStorageItem('app_salary_format', format);
  }, []);

  const setSalaryTargetCurrency = useCallback((currency: string) => {
    const val = (currency || '').trim();
    setSalaryTargetCurrencyState(val);
    safeSetStorageItem('app_salary_currency', val);
  }, []);

  const t = useCallback<TranslateFn>(
    (path, params) => translatePath(locale, path, params),
    [locale]
  );

  const formatDate = useCallback<FormatDateFn>(
    (dateValue, options) => {
      if (!dateValue) return '';
      const fmtOptions = options || { day: 'numeric', month: 'short' };
      try {
        const d = new Date(dateValue);
        return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', fmtOptions);
      } catch {
        return String(dateValue);
      }
    },
    [locale]
  );

  return {
    locale,
    setLocale,
    t,
    formatDate,
    salaryDisplayFormat,
    setSalaryDisplayFormat,
    salaryTargetCurrency,
    setSalaryTargetCurrency,
    exchangeRates,
  };
}

export function I18nProvider({
  children,
  initialLocale,
  initialSalaryFormat,
  initialSalaryCurrency,
}: I18nProviderProps): React.ReactElement {
  const value = useI18nController(initialLocale, initialSalaryFormat, initialSalaryCurrency);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from './translations';

const I18nContext = createContext(null);

export function I18nProvider({
  children,
  initialLocale,
  initialSalaryFormat,
  initialSalaryCurrency,
}) {
  const [locale, setLocaleState] = useState(() => {
    if (initialLocale === 'en' || initialLocale === 'ru') {
      return initialLocale;
    }
    try {
      const saved = localStorage.getItem('app_locale');
      if (saved && (saved === 'ru' || saved === 'en')) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'ru';
  });

  const [salaryDisplayFormat, setSalaryDisplayFormatState] = useState(() => {
    if (initialSalaryFormat) {
      return initialSalaryFormat;
    }
    try {
      const saved = localStorage.getItem('app_salary_format');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'month';
  });

  const [salaryTargetCurrency, setSalaryTargetCurrencyState] = useState(() => {
    if (initialSalaryCurrency !== undefined && initialSalaryCurrency !== null) {
      return initialSalaryCurrency;
    }
    try {
      const saved = localStorage.getItem('app_salary_currency');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return '';
  });

  const [exchangeRates, setExchangeRatesState] = useState(() => {
    try {
      const saved = localStorage.getItem('app_exchange_rates');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  useEffect(() => {
    if (initialLocale === 'en' || initialLocale === 'ru') {
      setLocaleState(initialLocale);
      try {
        localStorage.setItem('app_locale', initialLocale);
      } catch {
        // ignore
      }
    }
  }, [initialLocale]);

  // Fetch exchange rates once and cache in localStorage
  useEffect(() => {
    fetch('/api/v2/exchange-rates')
      .then((res) => (res && res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.rates) {
          setExchangeRatesState(data.rates);
          try {
            localStorage.setItem('app_exchange_rates', JSON.stringify(data.rates));
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => console.debug('Could not fetch exchange rates', err));
  }, []);

  // Sync with /api/v2/settings on initial mount if not already provided
  useEffect(() => {
    fetch('/api/v2/settings')
      .then((res) => {
        if (!res || !res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.locale && (data.locale === 'ru' || data.locale === 'en')) {
          setLocaleState(data.locale);
          try {
            localStorage.setItem('app_locale', data.locale);
          } catch {
            // ignore
          }
        }
        if (data && data.salary_display_format) {
          setSalaryDisplayFormatState(data.salary_display_format);
          try {
            localStorage.setItem('app_salary_format', data.salary_display_format);
          } catch {
            // ignore
          }
        }
        if (data && data.salary_target_currency !== undefined) {
          const curr = data.salary_target_currency || '';
          setSalaryTargetCurrencyState(curr);
          try {
            localStorage.setItem('app_salary_currency', curr);
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => console.debug('Could not fetch settings', err));
  }, []);

  const setLocale = useCallback((newLocale) => {
    const loc = newLocale === 'en' ? 'en' : 'ru';
    setLocaleState(loc);
    try {
      localStorage.setItem('app_locale', loc);
    } catch {
      // ignore
    }
  }, []);

  const setSalaryDisplayFormat = useCallback((format) => {
    setSalaryDisplayFormatState(format);
    try {
      localStorage.setItem('app_salary_format', format);
    } catch {
      // ignore
    }
  }, []);

  const setSalaryTargetCurrency = useCallback((currency) => {
    const val = (currency || '').trim();
    setSalaryTargetCurrencyState(val);
    try {
      localStorage.setItem('app_salary_currency', val);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (path, params) => {
      if (!path) return '';
      const templateParams = params || {};
      const keys = path.split('.');

      // 1. Try current locale
      let current = translations[locale];
      let found = true;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          found = false;
          break;
        }
      }

      // 2. Fallback to 'ru' if not found in current locale
      if (!found) {
        current = translations.ru;
        found = true;
        for (const key of keys) {
          if (current && typeof current === 'object' && key in current) {
            current = current[key];
          } else {
            found = false;
            break;
          }
        }
      }

      if (!found || typeof current !== 'string') {
        if (path.startsWith('kanban.columns.')) {
          return path.replace('kanban.columns.', '');
        }
        return path;
      }

      // Replace template variables {var}
      let result = current;
      for (const [k, v] of Object.entries(templateParams)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v !== undefined && v !== null ? v : '');
      }
      return result;
    },
    [locale]
  );

  const formatDate = useCallback(
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

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        formatDate,
        salaryDisplayFormat,
        setSalaryDisplayFormat,
        salaryTargetCurrency,
        setSalaryTargetCurrency,
        exchangeRates,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

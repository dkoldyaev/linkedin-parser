import React from 'react';
import Script from 'next/script';
import '@blueprint/ui-kit/styles.css';
import '../index.css';
import '../design-system.css';
import '../App.css';
import { I18nProvider } from '../i18n/I18nContext';
import type { Locale, SalaryFormat } from '../i18n/I18nContext';
import { AppShell } from '../components/AppShell';
import { fetchServerApi } from '../utils/serverApi';
import type { User } from '../types/models';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'LinkedIn Jobs Tracker — Канбан & AI Саммари',
  description:
    'Парсер вакансий LinkedIn, автоматический сбор информации о компании и технологиях, AI саммари на Mistral/Gemini и Канбан-воронка.',
  icons: {
    icon: '/favicon.svg',
  },
};

interface SsrLayoutResolution {
  initialUser: User | null;
  initialLocale: Locale;
  initialSalaryFormat: SalaryFormat;
  initialSalaryCurrency: string;
  initialExchangeRates: Record<string, number>;
}

function isSupportedLocale(val: unknown): val is Locale {
  return val === 'ru' || val === 'en';
}

function applySettingsOverrides(
  settings: Record<string, unknown>,
  state: SsrLayoutResolution
) {
  if (isSupportedLocale(settings.locale)) {
    state.initialLocale = settings.locale;
  }
  if (
    settings.salary_display_format === 'month' ||
    settings.salary_display_format === 'year' ||
    settings.salary_display_format === 'hour'
  ) {
    state.initialSalaryFormat = settings.salary_display_format;
  }
  if (typeof settings.salary_target_currency === 'string') {
    state.initialSalaryCurrency = settings.salary_target_currency;
  }
}

async function loadSsrSettings(state: SsrLayoutResolution): Promise<void> {
  const [settingsRes, ratesRes] = await Promise.all([
    fetchServerApi('/api/v2/settings', {}),
    fetchServerApi('/api/v2/exchange-rates', {}),
  ]);

  if (settingsRes && settingsRes.ok) {
    const settings = await settingsRes.json();
    applySettingsOverrides(settings, state);
  }

  if (ratesRes && ratesRes.ok) {
    const data = await ratesRes.json();
    if (data && typeof data === 'object' && data.rates) {
      state.initialExchangeRates = data.rates;
    }
  }
}

async function resolveSsrLayoutState(): Promise<SsrLayoutResolution> {
  const state: SsrLayoutResolution = {
    initialUser: null,
    initialLocale: 'en',
    initialSalaryFormat: 'month',
    initialSalaryCurrency: '',
    initialExchangeRates: {},
  };

  try {
    const meRes = await fetchServerApi('/api/v2/auth/me', {});
    if (!meRes || !meRes.ok) return state;

    const user: User = await meRes.json();
    state.initialUser = user;
    if (isSupportedLocale(user?.locale)) {
      state.initialLocale = user.locale;
    }

    await loadSsrSettings(state);
  } catch (err) {
    console.error('RootLayout SSR user/settings resolution error:', err);
  }

  return state;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    initialUser,
    initialLocale,
    initialSalaryFormat,
    initialSalaryCurrency,
    initialExchangeRates,
  } = await resolveSsrLayoutState();

  return (
    <html lang={initialLocale} data-theme="dark" suppressHydrationWarning>
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('workspace-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';}catch(e){document.documentElement.dataset.theme='dark';}`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Silkscreen:wght@400;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider
          initialLocale={initialLocale}
          initialSalaryFormat={initialSalaryFormat}
          initialSalaryCurrency={initialSalaryCurrency}
          initialExchangeRates={initialExchangeRates}
        >
          <AppShell initialUser={initialUser}>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}

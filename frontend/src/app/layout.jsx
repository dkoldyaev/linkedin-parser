import React from 'react';
import '../index.css';
import '../design-system.css';
import '../App.css';
import { I18nProvider } from '../i18n/I18nContext';
import { AppShell } from '../components/AppShell';
import { fetchServerApi } from '../utils/serverApi';
import { Header } from '@blueprint/ui-kit';
import PageHeader from '../components/PageHeader';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'LinkedIn Jobs Tracker — Канбан & AI Саммари',
  description: 'Парсер вакансий LinkedIn, автоматический сбор информации о компании и технологиях, AI саммари на Mistral/Gemini и Канбан-воронка.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default async function RootLayout({ children }) {
  let initialUser = null;
  let initialLocale = 'en';
  let initialSalaryFormat = 'month';
  let initialSalaryCurrency = '';

  try {
    const meRes = await fetchServerApi('/api/v2/auth/me', {});
    if (meRes && meRes.ok) {
      initialUser = await meRes.json();
      if (initialUser && (initialUser.locale === 'ru' || initialUser.locale === 'en')) {
        initialLocale = initialUser.locale;
      }
      const settingsRes = await fetchServerApi('/api/v2/settings', {});
      if (settingsRes && settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings.locale === 'ru' || settings.locale === 'en') {
          initialLocale = settings.locale;
        }
        if (settings.salary_display_format) {
          initialSalaryFormat = settings.salary_display_format;
        }
        if (settings.salary_target_currency !== undefined && settings.salary_target_currency !== null) {
          initialSalaryCurrency = settings.salary_target_currency;
        }
      }
    }
  } catch (err) {
    console.error('RootLayout SSR user/settings resolution error:', err);
  }

  return (
    <html lang={initialLocale} data-theme="dark" suppressHydrationWarning>
      <head>
        <script
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
        >
          <AppShell initialUser={initialUser}>
            {children}
          </AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}

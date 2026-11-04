import '../index.css';
import '../design-system.css';
import { I18nProvider } from '../i18n/I18nContext';
import { AppShell } from '../components/AppShell';

export const metadata = {
  title: 'LinkedIn Jobs Tracker — Канбан & AI Саммари',
  description: 'Парсер вакансий LinkedIn, автоматический сбор информации о компании и технологиях, AI саммари на Mistral/Gemini и Канбан-воронка.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children, modal }) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
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
        <I18nProvider>
          <AppShell>
            {children}
            {modal}
          </AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}

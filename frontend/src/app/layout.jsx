import '../index.css';
import { I18nProvider } from '../i18n/I18nContext';
import { AppShell } from '../components/AppShell';

export const metadata = {
  title: 'Job Vacancies Tracker & Parser',
  description: 'Track and parse LinkedIn & Upwork vacancies with AI analysis and custom kanban board.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children, modal }) {
  return (
    <html lang="ru">
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

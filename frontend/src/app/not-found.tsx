'use client';

import { useRouter } from 'next/navigation';
import { AlertBanner } from '@blueprint/ui-kit';
import LoginModal from '../components/LoginModal';
import { useTranslation } from '../i18n/I18nContext';
import { useAuth } from '../components/AppShell';
import { setAnalyticsUser } from '../utils/analytics';

export default function NotFoundPage() {
  const { locale } = useTranslation();
  const router = useRouter();
  const { setUser } = useAuth();

  const title =
    locale === 'en'
      ? '404 — Vacancy not found or belongs to another account'
      : '404 — Вакансия не найдена или принадлежит другому аккаунту';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ui-bg-canvas)', padding: 'var(--ui-space-4)' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto var(--ui-space-4)' }}>
        <AlertBanner tone="danger" title={title} />
      </div>
      <LoginModal
        onLoginSuccess={(userData) => {
          setAnalyticsUser(userData);
          setUser(userData);
          if (typeof window !== 'undefined') {
            window.location.reload();
          } else {
            router.refresh();
          }
        }}
      />
    </div>
  );
}

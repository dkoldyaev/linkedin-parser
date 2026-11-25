import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, LogIn } from 'lucide-react';
import { PageLayout, EmptyState, Button, Icon } from '@blueprint/ui-kit';
import PageHeader from '../components/PageHeader';
import LoginModal from '../components/LoginModal';
import { useAuth } from '../components/AppShell';
import { useTranslation } from '../i18n/I18nContext';
import { setAnalyticsUser } from '../utils/analytics';
import type { User } from '../types/models';

export interface NotFoundPageProps {
  showHeader?: boolean;
}

const NOT_FOUND_ICON = <Icon icon={FileQuestion} size="lg" />;
const BACK_ICON = <Icon icon={ArrowLeft} size="xs" />;
const LOGIN_ICON = <Icon icon={LogIn} size="xs" />;

const CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(12 * var(--ui-grid-cell))',
  padding: 'var(--ui-space-6)',
};

const ACTIONS_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--ui-space-2)',
  justifyContent: 'center',
};

export default function NotFoundPage({ showHeader = false }: NotFoundPageProps): React.ReactElement {
  const { locale, t } = useTranslation();
  const { user, handleLogout, setUser } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleLoginSuccess = (userData: User) => {
    setIsLoginOpen(false);
    setAnalyticsUser(userData);
    setUser(userData);
  };

  const actionsNode = (
    <div style={ACTIONS_STYLE}>
      <Button asChild variant="primary" size="md" startIcon={BACK_ICON}>
        <Link to="/">{t('pages.notFound.back_btn')}</Link>
      </Button>
      <Button
        variant="secondary"
        size="md"
        startIcon={LOGIN_ICON}
        onClick={() => setIsLoginOpen(true)}
      >
        {t('pages.notFound.switch_account_btn')}
      </Button>
    </div>
  );

  return (
    <>
      {showHeader && (
        <PageHeader user={user} onLogout={handleLogout} onUserUpdated={setUser} />
      )}
      <PageLayout gridDeps={[locale]} className="not-found-page">
        <div style={CONTAINER_STYLE}>
          <EmptyState
            icon={NOT_FOUND_ICON}
            title={t('pages.notFound.title')}
            description={t('pages.notFound.description')}
            action={actionsNode}
          />
        </div>
      </PageLayout>

      {isLoginOpen && (
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}

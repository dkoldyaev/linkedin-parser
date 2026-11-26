import { Button, Header, Icon } from '@blueprint/ui-kit';
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoginModal from './LoginModal';
import SettingsModal from './SettingsModal';
import { useMenu } from './menuContext';
import type { User } from '../types/models';
import { useTranslation } from '../i18n/I18nContext';

export interface PageHeaderProps {
  user?: User | null;
  onLogout?: () => void;
  onUserUpdated?: (user: User) => void;
}

function getInitialTheme(): 'dark' | 'light' {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light') {
    return 'light';
  }
  return 'dark';
}

function formatHeaderUser(user?: User | null) {
  if (!user) return undefined;
  return {
    name: user.name,
    email: user.email,
    picture: user.picture,
    isAnonymous: user.is_anonymous,
  };
}

/** Header for pages other than the board (the board renders its own header with search). */
export default function PageHeader({
  user,
  onLogout,
  onUserUpdated,
}: PageHeaderProps): React.ReactElement {
  const { t } = useTranslation();
  const { open: menuOpen, toggle: toggleMenu } = useMenu();
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleThemeToggle = () => {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('workspace-theme', next);
    } catch {
      /* Session fallback */
    }
    setTheme(next);
  };

  const handleLoginSuccess = (updatedUser: User) => {
    setIsLoginModalOpen(false);
    onUserUpdated?.(updatedUser);
  };

  const downloadAction = user ? (
    <Button asChild variant="ghost" size="icon" title={t('nav.download_extension')}>
      <a
        href="/extension.zip"
        download
        aria-label={t('nav.download_extension')}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon icon={Download} size="sm" aria-hidden />
      </a>
    </Button>
  ) : null;

  return (
    <>
      <Header
        title={t('nav.title')}
        subtitle={t('nav.subtitle')}
        brand={
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Header.Brand title={t('nav.title')} subtitle={t('nav.subtitle')} />
          </Link>
        }
        showThemeToggle
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onSettingsClick={user ? () => setIsSettingsOpen(true) : undefined}
        settingsLabel={t('nav.settings_btn')}
        user={formatHeaderUser(user)}
        loginLabel={t('auth.login_btn')}
        logoutLabel={t('auth.logout')}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={onLogout}
        menuOpen={menuOpen}
        onMenuToggle={toggleMenu}
        actions={downloadAction}
      />
      {user && (
        <>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onUserUpdated={onUserUpdated}
          />
          {isLoginModalOpen && (
            <LoginModal
              isOpen={isLoginModalOpen}
              onClose={() => setIsLoginModalOpen(false)}
              onLoginSuccess={handleLoginSuccess}
              isGuestPromotion
            />
          )}
        </>
      )}
    </>
  );
}

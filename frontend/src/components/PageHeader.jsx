import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Header, Button, Icon } from '@blueprint/ui-kit';
import SettingsModal from './SettingsModal';
import LoginModal from './LoginModal';
import { useMenu } from './menuContext';
import { useTranslation } from '../i18n/I18nContext';

/** Header for pages other than the board (the board renders its own header with search). */
export default function PageHeader({ user, onLogout, onUserUpdated }) {
  const { t } = useTranslation();
  const { open: menuOpen, toggle: toggleMenu } = useMenu();
  const [theme, setTheme] = useState(() => (typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'dark' : 'dark'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('workspace-theme', next);
    } catch {
      /* Session fallback */
    }
    setTheme(next);
  };

  return (
    <>
      <Header
        title={t('nav.title')}
        subtitle={t('nav.subtitle')}
        brand={
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Header.Brand
              title={t('nav.title')}
              subtitle={t('nav.subtitle')}
            />
          </Link>
        }
        showThemeToggle
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onSettingsClick={user ? () => setIsSettingsOpen(true) : undefined}
        settingsLabel={t('nav.settings_btn')}
        user={user ? {
          name: user.name,
          email: user.email,
          picture: user.picture,
          isAnonymous: user.is_anonymous,
        } : undefined}
        loginLabel={t('auth.login_btn')}
        logoutLabel={t('auth.logout')}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={onLogout}
        menuOpen={menuOpen}
        onMenuToggle={toggleMenu}
        actions={
          user ? (
            <Button
              as="a"
              href="/extension.zip"
              download
              variant="ghost"
              size="icon"
              title={t('nav.download_extension')}
              aria-label={t('nav.download_extension')}
            >
              <Icon icon={Download} size="sm" aria-hidden="true" />
            </Button>
          ) : null
        }
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
              onLoginSuccess={(updatedUser) => {
                setIsLoginModalOpen(false);
                if (onUserUpdated) onUserUpdated(updatedUser);
              }}
              isGuestPromotion={true}
            />
          )}
        </>
      )}
    </>
  );
}

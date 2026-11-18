import React, { useState } from 'react';
import { Download, Settings, LogOut, LogIn, Menu, X } from 'lucide-react';
import { Button, Icon } from '@blueprint/ui-kit';
import SettingsModal from './SettingsModal';
import ThemeToggle from './ThemeToggle';
import LoginModal from './LoginModal';
import { useMenu } from './menuContext';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';

/**
 * Right side of the app header: page-specific actions (children), download, settings,
 * user badge and the burger button that toggles the navigation drawer.
 */
export default function HeaderControls({ user, onLogout, vacancies, onColumnsUpdated, onUserUpdated, children }) {
  const { t } = useTranslation();
  const { open, toggle } = useMenu();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
      {children}
      <ThemeToggle />

      {user && (
        <>
          <Button
            as="a"
            href="/extension.zip"
            download
            variant="secondary"
            size="icon-md"
            title="Скачать расширение (ZIP)"
          >
            <Icon icon={Download} size="sm" aria-hidden="true" />
          </Button>

          <Button
            variant="secondary"
            size="icon-md"
            onClick={() => {
              trackEvent(EVENTS.SETTINGS_OPEN);
              setIsSettingsOpen(true);
            }}
            title={t('nav.settings_btn')}
          >
            <Icon icon={Settings} size="sm" aria-hidden="true" />
          </Button>

          {user.is_anonymous ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsLoginModalOpen(true)}
              title={t('auth.guest_login_tooltip') || 'Войти в аккаунт'}
              startIcon={<Icon icon={LogIn} size="xs" />}
            >
              {t('auth.login_btn') || 'Войти'}
            </Button>
          ) : (
            <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)', padding: '0 var(--ui-space-2)', height: 'var(--ui-control-height-md)', background: 'var(--ui-bg-subtle)', border: '1px solid var(--ui-border-subtle)' }}>
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="user-avatar" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--ui-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="user-profile-name" title={user.email} style={{ fontSize: 'var(--ui-font-size-xs)' }}>
                {user.name || user.email}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onLogout}
                title={t('auth.logout')}
              >
                <Icon icon={LogOut} size="xs" aria-hidden="true" />
              </Button>
            </div>
          )}

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            vacancies={vacancies}
            onColumnsUpdated={onColumnsUpdated}
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

      <Button
        id="menu-toggle"
        variant="secondary"
        size="icon-md"
        className={`burger ${open ? 'open' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-label="Menu"
      >
        <Icon icon={open ? X : Menu} size="sm" aria-hidden="true" />
      </Button>
    </div>
  );
}

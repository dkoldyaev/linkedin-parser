import React, { useState } from 'react';
import { Download, Settings, LogOut, LogIn, Menu, X } from 'lucide-react';
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
    <div className="header-actions">
      {children}
      <ThemeToggle />

      {user && (
        <>
          <a
            href="/extension.zip"
            download
            className="btn btn-secondary btn-icon plausible-event-name=Download+Extension"
            title="Скачать расширение (ZIP)"
          >
            <Download size={18} aria-hidden="true" />
          </a>

          <button
            className="btn btn-secondary btn-icon plausible-event-name=Settings+Open"
            onClick={() => {
              trackEvent(EVENTS.SETTINGS_OPEN);
              setIsSettingsOpen(true);
            }}
            title={t('nav.settings_btn')}
          >
            <Settings size={18} aria-hidden="true" />
          </button>

          {user.is_anonymous ? (
            <button
              className="btn btn-primary btn-guest-login"
              onClick={() => setIsLoginModalOpen(true)}
              title={t('auth.guest_login_tooltip') || 'Войти в аккаунт'}
            >
              <LogIn size={16} aria-hidden="true" />
              <span className="guest-login-text">{t('auth.login_btn') || 'Войти'}</span>
            </button>
          ) : (
            <div className="user-profile-badge">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="user-profile-name" title={user.email}>{user.name || user.email}</span>
              <button className="btn-logout" onClick={onLogout} title={t('auth.logout')}>
                <LogOut size={16} aria-hidden="true" />
              </button>
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

      <button
        id="menu-toggle"
        className={`btn btn-secondary btn-icon burger ${open ? 'open' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-label="Menu"
      >
        {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
      </button>
    </div>
  );
}

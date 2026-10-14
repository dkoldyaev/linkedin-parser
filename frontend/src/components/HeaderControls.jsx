import React, { useState } from 'react';
import { Download, Settings, LogOut, Menu, X } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { useMenu } from './menuContext';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';

/**
 * Right side of the app header: page-specific actions (children), download, settings,
 * user badge and the burger button that toggles the navigation drawer.
 */
export default function HeaderControls({ user, onLogout, vacancies, onColumnsUpdated, children }) {
  const { t } = useTranslation();
  const { open, toggle } = useMenu();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="header-actions">
      {children}

      {user && (
        <>
          <a
            href="/extension.zip"
            download
            className="btn btn-secondary btn-icon plausible-event-name=Download+Extension"
            title="Скачать расширение (ZIP)"
          >
            <Download size={16} />
          </a>

          <button
            className="btn btn-secondary btn-icon plausible-event-name=Settings+Open"
            onClick={() => {
              trackEvent(EVENTS.SETTINGS_OPEN);
              setIsSettingsOpen(true);
            }}
            title={t('nav.settings_btn')}
          >
            <Settings size={16} />
          </button>

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
              <LogOut size={15} />
            </button>
          </div>

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            vacancies={vacancies}
            onColumnsUpdated={onColumnsUpdated}
          />
        </>
      )}

      <button
        id="menu-toggle"
        className={`btn btn-secondary btn-icon burger ${open ? 'open' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-label="Menu"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
    </div>
  );
}

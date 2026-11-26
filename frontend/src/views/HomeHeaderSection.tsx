import type { BoardColumn, User, Vacancy } from '../types/models';
import React, { useState } from 'react';
import { Header } from '@blueprint/ui-kit';
import HomeExtensionDownloadButton from './HomeExtensionDownloadButton';
import HomeGuestPromotionButton from './HomeGuestPromotionButton';
import HomePrimaryActions from './HomePrimaryActions';
import HomeSearchBar from './HomeSearchBar';
import { Link } from 'react-router-dom';
import SettingsModal from '../components/SettingsModal';
import { useMenu } from '../components/menuContext';
import { useTranslation } from '../i18n/I18nContext';

export interface HomeHeaderSectionProps {
  user?: User | null;
  search: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit?: (val: string) => void;
  queueRemaining?: number;
  onOpenQueue: () => void;
  onAddVacanciesClick: () => void;
  onRefresh: () => void;
  hasSelectedIds: boolean;
  onOpenGuestAuth: () => void;
  onLogout?: () => void;
  vacancies: Vacancy[];
  onColumnsUpdated: (columns: BoardColumn[]) => void;
  onUserUpdated?: (user: User) => void;
}

function resolveInitialTheme(): 'light' | 'dark' {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light') {
    return 'light';
  }
  return 'dark';
}

function mapUserProps(user?: User | null) {
  if (!user) return undefined;
  return {
    name: user.name,
    email: user.email,
    picture: user.picture,
    isAnonymous: user.is_anonymous,
  };
}

export default function HomeHeaderSection(props: HomeHeaderSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const { open: menuOpen, toggle: toggleMenu } = useMenu();
  const [theme, setTheme] = useState<'light' | 'dark'>(resolveInitialTheme);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        menuOpen={menuOpen}
        onMenuToggle={toggleMenu}
        search={
          <HomeSearchBar
            search={props.search}
            onSearchChange={props.onSearchChange}
            onSearchSubmit={props.onSearchSubmit}
          />
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
            <HomeGuestPromotionButton
              isAnonymous={props.user?.is_anonymous}
              onOpenGuestAuth={props.onOpenGuestAuth}
            />
            <HomeExtensionDownloadButton />
            <HomePrimaryActions
              onRefresh={props.onRefresh}
              queueRemaining={props.queueRemaining}
              onOpenQueue={props.onOpenQueue}
              onAddVacanciesClick={props.onAddVacanciesClick}
            />
          </div>
        }
        showThemeToggle
        theme={theme}
        onThemeToggle={() => {
          const next: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
          document.documentElement.dataset.theme = next;
          try {
            localStorage.setItem('workspace-theme', next);
          } catch {
            /* ignore */
          }
          setTheme(next);
        }}
        user={mapUserProps(props.user)}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onLogout={props.onLogout}
        settingsLabel={t('nav.settings')}
        logoutLabel={t('auth.logout')}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        vacancies={props.vacancies}
        onColumnsUpdated={props.onColumnsUpdated}
        onUserUpdated={props.onUserUpdated}
      />
    </>
  );
}

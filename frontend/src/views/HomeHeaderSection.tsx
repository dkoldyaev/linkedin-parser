'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { useMenu } from '../components/menuContext';
import SettingsModal from '../components/SettingsModal';
import HomeSearchBar from './HomeSearchBar';
import HomeExtensionDownloadButton from './HomeExtensionDownloadButton';
import HomePrimaryActions from './HomePrimaryActions';
import HomeGuestPromotionButton from './HomeGuestPromotionButton';
import type { User, BoardColumn, Vacancy } from '../types/models';

export interface HomeHeaderSectionProps {
  user?: User | null;
  search: string;
  onSearchChange: (val: string) => void;
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
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Header.Brand title={t('nav.title')} subtitle={t('nav.subtitle')} />
          </Link>
        }
        menuOpen={menuOpen}
        onMenuToggle={toggleMenu}
        search={<HomeSearchBar search={props.search} onSearchChange={props.onSearchChange} />}
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
        onThemeToggle={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
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

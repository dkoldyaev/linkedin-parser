import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@blueprint/ui-kit';
import HeaderControls from './HeaderControls';
import { useTranslation } from '../i18n/I18nContext';

/** Header for pages other than the board (the board renders its own header with search). */
export default function PageHeader({ user, onLogout, onUserUpdated }) {
  const { t } = useTranslation();
  return (
    <Header
      title={t('nav.title')}
      subtitle={t('nav.subtitle')}
      brand={
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
          <Header.Brand
            title={t('nav.title')}
            subtitle={t('nav.subtitle')}
          />
        </Link>
      }
      actions={
        <HeaderControls user={user} onLogout={onLogout} onUserUpdated={onUserUpdated} />
      }
    />
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import HeaderControls from './HeaderControls';
import { useTranslation } from '../i18n/I18nContext';

/** Header for pages other than the board (the board renders its own header with search). */
export default function PageHeader({ user, onLogout, onUserUpdated }) {
  const { t } = useTranslation();
  return (
    <header className="app-header">
      <Link href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="brand-icon"><span className="blueprint-mark" aria-hidden="true" /></div>
        <div>
          <div className="brand-title">{t('nav.title')}</div>
          <p className="brand-subtitle">{t('nav.subtitle')}</p>
        </div>
      </Link>
      <HeaderControls user={user} onLogout={onLogout} onUserUpdated={onUserUpdated} />
    </header>
  );
}

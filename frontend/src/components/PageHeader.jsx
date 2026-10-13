import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import HeaderControls from './HeaderControls';
import { useTranslation } from '../i18n/I18nContext';

/** Header for pages other than the board (the board renders its own header with search). */
export default function PageHeader({ user, onLogout }) {
  const { t } = useTranslation();
  return (
    <header className="app-header">
      <Link to="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="brand-icon"><Briefcase size={20} /></div>
        <div>
          <div className="brand-title">{t('nav.title')}</div>
          <p className="brand-subtitle">{t('nav.subtitle')}</p>
        </div>
      </Link>
      <HeaderControls user={user} onLogout={onLogout} />
    </header>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Columns3, Flame, Puzzle } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

const FEATURES = [
  { key: 'ai', icon: Sparkles },
  { key: 'kanban', icon: Columns3 },
  { key: 'streak', icon: Flame },
  { key: 'extension', icon: Puzzle },
];

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="info-page">
      <div className="info-container">
        <header className="info-hero">
          <h1 className="info-title">{t('pages.about.title')}</h1>
          <p className="info-subtitle">{t('pages.about.subtitle')}</p>
        </header>

        <section className="info-card">
          <p className="info-text">{t('pages.about.p1')}</p>
          <p className="info-text">{t('pages.about.p2')}</p>
        </section>

        <section className="feature-grid">
          {FEATURES.map(({ key, icon: Icon }) => (
            <div className="info-card feature-card" key={key}>
              <div className="stat-icon"><Icon size={20} /></div>
              <h3 className="info-card-subtitle" style={{ marginTop: 0 }}>{t(`pages.about.f_${key}_title`)}</h3>
              <p className="info-text">{t(`pages.about.f_${key}_desc`)}</p>
            </div>
          ))}
        </section>

        <p className="info-text" style={{ textAlign: 'center' }}>
          <Link to="/howtouse" className="info-link">{t('pages.about.cta')}</Link>
        </p>
      </div>
    </div>
  );
}

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
        <header className="info-hero" style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#60a5fa', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            MANUAL_01 // ARCHITECTURE & OVERVIEW
          </div>
          <h1 className="info-title">{t('pages.about.title')}</h1>
          <p className="info-subtitle">{t('pages.about.subtitle')}</p>
        </header>

        <section className="info-card" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '10px', right: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            [ FIG_001 ]
          </div>
          <p className="info-text">{t('pages.about.p1')}</p>
          <p className="info-text">{t('pages.about.p2')}</p>
        </section>

        <section className="feature-grid">
          {FEATURES.map(({ key, icon: Icon }, idx) => (
            <div className="info-card feature-card" key={key} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', right: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                0{idx + 1}
              </div>
              <div className="stat-icon"><Icon size={20} /></div>
              <h3 className="info-card-subtitle" style={{ marginTop: 0 }}>{t(`pages.about.f_${key}_title`)}</h3>
              <p className="info-text">{t(`pages.about.f_${key}_desc`)}</p>
            </div>
          ))}
        </section>

        <p className="info-text" style={{ textAlign: 'center', marginTop: '12px' }}>
          <Link to="/howtouse" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.06em' }}>
            <span>{t('pages.about.cta')}</span>
            <span>→</span>
          </Link>
        </p>
      </div>
    </div>
  );
}

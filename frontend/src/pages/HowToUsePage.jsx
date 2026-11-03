import React from 'react';
import { Download, Puzzle, PlusCircle, LifeBuoy } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

const INSTALL_STEPS = [1, 2, 3, 4, 5];
const USE_STEPS = [1, 2, 3, 4];
const TROUBLE = [1, 2, 3, 4, 5];

export default function HowToUsePage() {
  const { t } = useTranslation();

  return (
    <div className="info-page">
      <div className="info-container">
        <header className="info-hero">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#60a5fa', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            РУКОВОДСТВО
          </div>
          <h1 className="info-title">{t('pages.howto.title')}</h1>
          <p className="info-subtitle">{t('pages.howto.subtitle')}</p>
        </header>

        <section className="info-card" id="howto-install" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '12px', right: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            01 / INSTALL
          </div>
          <h2 className="info-card-title"><Puzzle size={18} color="#60a5fa" />{t('pages.howto.install_title')}</h2>
          <p className="info-text">{t('pages.howto.install_intro')}</p>
          <ol className="steps">
            {INSTALL_STEPS.map((n) => <li key={n}>{t(`pages.howto.install_${n}`)}</li>)}
          </ol>
          <a href="/extension.zip" download className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '6px' }}>
            <Download size={16} />
            <span>{t('pages.howto.download')}</span>
          </a>
        </section>

        <section className="info-card" id="howto-use" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '12px', right: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            02 / WORKFLOW
          </div>
          <h2 className="info-card-title"><PlusCircle size={18} color="#10b981" />{t('pages.howto.use_title')}</h2>
          <ol className="steps">
            {USE_STEPS.map((n) => <li key={n}>{t(`pages.howto.use_${n}`)}</li>)}
          </ol>
        </section>

        <section className="info-card" id="howto-trouble" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '12px', right: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            03 / SUPPORT
          </div>
          <h2 className="info-card-title"><LifeBuoy size={18} color="#f59e0b" />{t('pages.howto.trouble_title')}</h2>
          <p className="info-text">{t('pages.howto.trouble_intro')}</p>
          <ul className="steps bullets">
            {TROUBLE.map((n) => <li key={n}>{t(`pages.howto.trouble_${n}`)}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}

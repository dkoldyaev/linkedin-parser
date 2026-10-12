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
          <h1 className="info-title">{t('pages.howto.title')}</h1>
          <p className="info-subtitle">{t('pages.howto.subtitle')}</p>
        </header>

        <section className="info-card" id="howto-install">
          <h2 className="info-card-title"><Puzzle size={18} />{t('pages.howto.install_title')}</h2>
          <p className="info-text">{t('pages.howto.install_intro')}</p>
          <ol className="steps">
            {INSTALL_STEPS.map((n) => <li key={n}>{t(`pages.howto.install_${n}`)}</li>)}
          </ol>
          <a href="/extension.zip" download className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            <Download size={16} />
            <span>{t('pages.howto.download')}</span>
          </a>
        </section>

        <section className="info-card" id="howto-use">
          <h2 className="info-card-title"><PlusCircle size={18} />{t('pages.howto.use_title')}</h2>
          <ol className="steps">
            {USE_STEPS.map((n) => <li key={n}>{t(`pages.howto.use_${n}`)}</li>)}
          </ol>
        </section>

        <section className="info-card" id="howto-trouble">
          <h2 className="info-card-title"><LifeBuoy size={18} />{t('pages.howto.trouble_title')}</h2>
          <p className="info-text">{t('pages.howto.trouble_intro')}</p>
          <ul className="steps bullets">
            {TROUBLE.map((n) => <li key={n}>{t(`pages.howto.trouble_${n}`)}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}

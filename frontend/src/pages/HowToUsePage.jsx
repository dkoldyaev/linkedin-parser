import React from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { useBlueprintGrid } from '../utils/useBlueprintGrid';

const INSTALL_STEPS = [1, 2, 3, 4, 5];
const USE_STEPS = [1, 2, 3, 4];
const TROUBLE = [1, 2, 3, 4, 5];

export default function HowToUsePage() {
  const { t, locale } = useTranslation();
  const pageRef = useBlueprintGrid([locale]);

  return (
    <div ref={pageRef} className="info-page bp-page howto-page">
      <div className="info-container bp-container">
        {/* Top Blueprint Rail */}
        <header className="info-hero bp-subbar bp-snap" data-min-grids="1">
          <div className="bp-subbar-left">
            <span className="column-dot" style={{ background: 'var(--primary)' }} />
            <h1 className="info-title bp-subbar-title">{t('pages.howto.title')}</h1>
            <span className="bp-subbar-sep">/</span>
            <p className="info-subtitle bp-subbar-subtitle">{t('pages.howto.subtitle')}</p>
          </div>
          <div className="bp-subbar-right">
            <a href="/extension.zip" download className="btn btn-primary bp-subbar-btn">
              <Download size={14} />
              <span>{t('pages.howto.download')}</span>
            </a>
          </div>
        </header>

        {/* 3-Column Board Layout: [01 Install] | [02 Workflow] | [03 Support] */}
        <div className="bp-grid-row" data-cols="3">
          {/* Column 1: Extension Installation */}
          <section className="info-card bp-col" id="howto-install">
            <div className="column-header">
              <div className="column-title-group">
                <span className="column-index">01</span>
                <span className="column-dot" style={{ background: 'var(--primary)' }} />
                <h2 className="column-name info-card-title">{t('pages.howto.install_title')}</h2>
                <span className="column-badge">[{INSTALL_STEPS.length}]</span>
              </div>
              <span className="bp-col-tag">INSTALL</span>
            </div>

            <div className="bp-cell-intro bp-snap" data-min-grids="2">
              <p className="info-text">{t('pages.howto.install_intro')}</p>
            </div>

            <ol className="steps bp-steps">
              {INSTALL_STEPS.map((n) => (
                <li key={n} className="bp-step-item bp-snap" data-min-grids="2">
                  <span className="bp-step-num">{String(n).padStart(2, '0')}</span>
                  <span className="bp-step-text">{t(`pages.howto.install_${n}`)}</span>
                </li>
              ))}
            </ol>

            <div className="bp-col-footer bp-snap" data-min-grids="2">
              <a href="/extension.zip" download className="btn btn-primary">
                <Download size={14} />
                <span>{t('pages.howto.download')}</span>
              </a>
            </div>
          </section>

          {/* Column 2: Workflow */}
          <section className="info-card bp-col" id="howto-use">
            <div className="column-header">
              <div className="column-title-group">
                <span className="column-index">02</span>
                <span className="column-dot" style={{ background: 'var(--aspen-mint)' }} />
                <h2 className="column-name info-card-title">{t('pages.howto.use_title')}</h2>
                <span className="column-badge">[{USE_STEPS.length}]</span>
              </div>
              <span className="bp-col-tag">WORKFLOW</span>
            </div>

            <ol className="steps bp-steps">
              {USE_STEPS.map((n) => (
                <li key={n} className="bp-step-item bp-snap" data-min-grids="2">
                  <span className="bp-step-num">{String(n).padStart(2, '0')}</span>
                  <span className="bp-step-text">{t(`pages.howto.use_${n}`)}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Column 3: Troubleshooting */}
          <section className="info-card bp-col" id="howto-trouble">
            <div className="column-header">
              <div className="column-title-group">
                <span className="column-index">03</span>
                <span className="column-dot" style={{ background: '#d97706' }} />
                <h2 className="column-name info-card-title">{t('pages.howto.trouble_title')}</h2>
                <span className="column-badge">[{TROUBLE.length}]</span>
              </div>
              <span className="bp-col-tag">SUPPORT</span>
            </div>

            <div className="bp-cell-intro bp-snap" data-min-grids="1">
              <p className="info-text">{t('pages.howto.trouble_intro')}</p>
            </div>

            <ol className="steps bp-steps">
              {TROUBLE.map((n) => (
                <li key={n} className="bp-step-item bp-snap" data-min-grids="2">
                  <span className="bp-step-num">{String(n).padStart(2, '0')}</span>
                  <span className="bp-step-text">{t(`pages.howto.trouble_${n}`)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

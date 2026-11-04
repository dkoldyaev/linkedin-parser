'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Columns3, Flame, Puzzle } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { useBlueprintGrid } from '../utils/useBlueprintGrid';

const FEATURES = [
  { key: 'ai', icon: Sparkles, color: '#2563eb' },
  { key: 'kanban', icon: Columns3, color: '#0284c7' },
  { key: 'streak', icon: Flame, color: '#d97706' },
  { key: 'extension', icon: Puzzle, color: '#059669' },
];

export default function AboutPage() {
  const { t, locale } = useTranslation();
  const pageRef = useBlueprintGrid([locale]);

  return (
    <div ref={pageRef} className="info-page bp-page about-page">
      <div className="info-container bp-container">
        {/* Top Blueprint Rail */}
        <header className="info-hero bp-subbar bp-snap" data-min-grids="1">
          <div className="bp-subbar-left">
            <span className="column-dot" style={{ background: 'var(--primary)' }} />
            <h1 className="info-title bp-subbar-title">{t('pages.about.title')}</h1>
            <span className="bp-subbar-sep">/</span>
            <p className="info-subtitle bp-subbar-subtitle">{t('pages.about.subtitle')}</p>
          </div>
          <div className="bp-subbar-right">
            <Link to="/howtouse" className="btn btn-primary bp-subbar-btn">
              <span>{t('pages.about.cta')}</span>
            </Link>
          </div>
        </header>

        {/* Overview Split Block */}
        <section className="info-card bp-col">
          <div className="column-header">
            <div className="column-title-group">
              <span className="column-index">01</span>
              <span className="column-dot" style={{ background: 'var(--primary)' }} />
              <span className="column-name">OVERVIEW</span>
            </div>
          </div>

          <div className="about-overview-grid bp-grid-row" data-cols="2">
            <div className="about-overview-cell bp-snap" data-min-grids="3">
              <span className="bp-step-num">01.1</span>
              <p className="info-text">{t('pages.about.p1')}</p>
            </div>
            <div className="about-overview-cell bp-snap" data-min-grids="3">
              <span className="bp-step-num">01.2</span>
              <p className="info-text">{t('pages.about.p2')}</p>
            </div>
          </div>
        </section>

        {/* 4-Column Feature Grid */}
        <section className="feature-grid bp-grid-row" data-cols="4">
          {FEATURES.map(({ key, icon: Icon, color }, idx) => (
            <div className="info-card feature-card bp-col" key={key}>
              <div className="column-header">
                <div className="column-title-group">
                  <span className="column-index">{String(idx + 2).padStart(2, '0')}</span>
                  <span className="column-dot" style={{ background: color }} />
                  <h3 className="column-name info-card-subtitle">{t(`pages.about.f_${key}_title`)}</h3>
                </div>
              </div>
              <div className="feature-card-body bp-snap" data-min-grids="3">
                <div className="stat-icon">
                  <Icon size={18} />
                </div>
                <p className="info-text">{t(`pages.about.f_${key}_desc`)}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Footer CTA Bar */}
        <div className="about-cta-bar bp-snap" data-min-grids="2">
          <Link href="/howtouse" className="btn btn-secondary">
            <span>{t('pages.about.cta')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

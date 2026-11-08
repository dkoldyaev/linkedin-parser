import React, { useState } from 'react';
import { 
  Puzzle, X, ShieldAlert, Layers, ExternalLink, 
  HelpCircle, ArrowRight, CheckCircle2, Download,
  Sparkles, RefreshCw
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { dismissExtensionPrompt, getUpdatesBetween } from '../utils/extension';

export default function ExtensionPromptModal({ 
  isOpen, 
  onClose, 
  onProceed, 
  mode = 'not_installed', // 'not_installed' | 'outdated'
  currentVersion = null,
  latestVersion = null,
  changelog = null
}) {
  const { t, locale } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const isUpdate = mode === 'outdated';

  const handleClose = () => {
    if (dontShowAgain) {
      dismissExtensionPrompt(true, mode, latestVersion);
    }
    onClose();
  };

  const handleProceed = () => {
    if (dontShowAgain) {
      dismissExtensionPrompt(true, mode, latestVersion);
    }
    onClose();
    if (onProceed) {
      onProceed();
    }
  };

  const updates = isUpdate ? getUpdatesBetween(changelog, currentVersion, locale) : [];

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '600px' }}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: isUpdate
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.2))'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: `1px solid ${isUpdate ? 'rgba(245, 158, 11, 0.4)' : 'rgba(99, 102, 241, 0.3)'}`,
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isUpdate ? '#f59e0b' : '#60a5fa'
            }}>
              {isUpdate ? <Sparkles size={22} /> : <Puzzle size={22} />}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {isUpdate ? t('extensionModal.title_update') : t('extensionModal.title')}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                {isUpdate 
                  ? t('extensionModal.subtitle_update', { current: currentVersion || '?', latest: latestVersion || '?' })
                  : t('extensionModal.subtitle')}
              </div>
            </div>
          </div>
          <button className="btn-icon modal-close-btn" onClick={handleClose} title={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
            {isUpdate ? t('extensionModal.desc_intro_update') : t('extensionModal.desc_intro')}
          </p>

          {/* If Update mode: show What's New changelog list */}
          {isUpdate && updates.length > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '0.85rem'
            }}>
              <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} />
                <span>
                  {updates.length === 1 
                    ? t('extensionModal.whats_new', { version: updates[0].version }) 
                    : t('extensionModal.whats_new_general')}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {updates.map((up) => (
                  <div key={up.version}>
                    {updates.length > 1 && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        v{up.version} {up.date ? `(${up.date})` : ''}
                      </div>
                    )}
                    <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {up.changes.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If NOT update: show feature cards */}
          {!isUpdate && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#60a5fa',
                  borderRadius: '6px',
                  padding: '6px',
                  display: 'flex',
                  marginTop: '2px'
                }}>
                  <Layers size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('extensionModal.feature_tabs_title')}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                    {t('extensionModal.feature_tabs_desc')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  background: 'rgba(234, 179, 8, 0.12)',
                  color: '#eab308',
                  borderRadius: '6px',
                  padding: '6px',
                  display: 'flex',
                  marginTop: '2px'
                }}>
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('extensionModal.feature_captcha_title')}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                    {t('extensionModal.feature_captcha_desc')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Installation or Update Instructions */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '0.8125rem'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={15} color={isUpdate ? '#f59e0b' : '#60a5fa'} />
                <span>{isUpdate ? t('extensionModal.update_title') : t('extensionModal.install_title')}</span>
              </div>
              <a 
                href="/extension.zip" 
                download 
                className="btn btn-secondary btn-icon" 
                style={{ padding: '4px 10px', height: '24px', fontSize: '0.75rem', borderRadius: '4px' }} 
                title="Скачать ZIP"
              >
                <Download size={12} style={{ marginRight: '4px' }}/> {isUpdate ? 'ZIP (v' + (latestVersion || '') + ')' : 'ZIP'}
              </a>
            </div>
            <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: 1.4 }}>
              {isUpdate ? (
                <>
                  <li>{t('extensionModal.update_step1')}</li>
                  <li>{t('extensionModal.update_step2')}</li>
                  <li>{t('extensionModal.update_step3')}</li>
                </>
              ) : (
                <>
                  <li>{t('extensionModal.install_step1')}</li>
                  <li>{t('extensionModal.install_step2')}</li>
                  <li>{t('extensionModal.install_step3')}</li>
                </>
              )}
            </ol>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <input
              type="checkbox"
              id="dontShowExtensionModal"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="dontShowExtensionModal" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              {isUpdate ? t('extensionModal.dont_show_again_version') : t('extensionModal.dont_show_again')}
            </label>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={handleClose}>
            {t('extensionModal.close')}
          </button>
          {onProceed && (
            <button className="btn btn-primary" onClick={handleProceed} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{isUpdate ? t('extensionModal.proceed_outdated') : t('extensionModal.proceed_anyway')}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
